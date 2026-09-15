function Zi(i) {
  return typeof i == "object" && i !== null && i.type === "cubic-bezier";
}
function Pt(i) {
  return typeof i == "object" && i !== null && i.type !== "cubic-bezier";
}
const Ct = 1;
function de(i) {
  return i.property === "text" && "textConfig" in i;
}
function Z(i) {
  return i.kind === "inertia" && "inertia" in i;
}
function Q(i) {
  return i.kind === "spring" && "spring" in i;
}
function li(i) {
  return i.property === "motionPath" && "motionPathConfig" in i;
}
function wo(i) {
  return typeof i == "object" && i !== null && "x" in i && "y" in i && "angle" in i;
}
function Qi(i) {
  return "keyframes" in i;
}
class To {
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
class xo {
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
        const n = (t - this._lastFrameTime) * this._speed;
        this._currentTime += n, this.onTick?.(n, this._currentTime);
      }
      this._lastFrameTime = t, this._scheduleFrame();
    }
  }
}
function hi(i, t, e = "start") {
  if (t <= 1) return 0;
  if (typeof e == "number") {
    const n = Math.max(0, Math.min(t - 1, e));
    return Math.abs(i - n);
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
function ui(i, t = "start") {
  if (i <= 1) return 0;
  let e = 0;
  for (let n = 0; n < i; n++)
    e = Math.max(e, hi(n, i, t));
  return e;
}
function pe(i, t, e) {
  if (e.offsets) return e.offsets[i] ?? 0;
  const n = e.from ?? "start", s = hi(i, t, n);
  if (e.amount !== void 0) {
    const r = ui(t, n);
    return r === 0 ? 0 : e.amount * s / r;
  }
  return e.each !== void 0 ? e.each * s : 0;
}
function ie(i, t) {
  return Array.from({ length: i }, (e, n) => pe(n, i, t));
}
function Dt(i, t) {
  return i <= 1 ? 0 : Math.max(...ie(i, t));
}
const dt = 1, fi = 6e4, xt = fi / dt, X = {
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
    this.from = t.from, this.to = t.to, this.stiffness = t.stiffness ?? X.stiffness, this.damping = t.damping ?? X.damping, this.mass = t.mass ?? X.mass, this.restDelta = t.restDelta ?? X.restDelta, this.restSpeed = t.restSpeed ?? X.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = t.velocity ?? X.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = this.samples[Math.min(e, this.samples.length - 1)], s = this.samples[Math.min(e + 1, this.samples.length - 1)], r = t / dt - e;
    return n + (s - n) * r;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(xt + 1), this.settledStep !== null ? this.settledStep * dt : fi;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(t) {
    if (this.settledStep !== null) return;
    const e = Math.min(t, xt + 1), n = dt / 1e3;
    for (; this.samples.length < e; ) {
      const s = this.samples[this.samples.length - 1], r = s - this.to, o = -this.stiffness * r, a = -this.damping * this.velocity, c = (o + a) / this.mass;
      this.velocity += c * n;
      const l = s + this.velocity * n;
      if (this.samples.push(l), this.isAtRest(l)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > xt && (this.settledStep = xt);
  }
}
function ko(i, t) {
  return new Ot(i).valueAt(t);
}
function Ji(i) {
  return new Ot(i).settleTime();
}
function So(i) {
  const t = i.stiffness ?? X.stiffness, e = i.damping ?? X.damping, n = i.mass ?? X.mass;
  return e < 2 * Math.sqrt(t * n);
}
function Mo(i) {
  const t = i.stiffness ?? X.stiffness, e = i.mass ?? X.mass;
  return 2 * Math.sqrt(t * e);
}
const Te = 4, tn = 2e-3, en = 1e-4, nn = 6e4;
function Nt(i) {
  const t = i.friction ?? Te;
  return t > 0 ? t : Te;
}
function _t(i) {
  return i.from + i.velocity / Nt(i);
}
function sn(i, t) {
  if (t === void 0) return i;
  if (typeof t == "number")
    return t > 0 ? Math.round(i / t) * t : i;
  if (t.length === 0) return i;
  let e = t[0];
  for (const n of t)
    Math.abs(n - i) < Math.abs(e - i) && (e = n);
  return e;
}
function bt(i) {
  let t = sn(_t(i), i.end);
  return i.min !== void 0 && (t = Math.max(i.min, t)), i.max !== void 0 && (t = Math.min(i.max, t)), t;
}
function vt(i) {
  const t = Math.abs(bt(i) - i.from);
  if (t === 0) return 0;
  const e = i.restDelta ?? Math.max(en, t * tn);
  if (e >= t) return 0;
  const n = Math.log(t / e) / Nt(i);
  return Math.min(nn, n * 1e3);
}
function ne(i, t) {
  if (t <= 0) return i.from;
  const e = bt(i);
  if (t >= vt(i)) return e;
  const n = Nt(i);
  return i.from + (e - i.from) * (1 - Math.exp(-n * t / 1e3));
}
function Ao(i, t) {
  const e = Nt(i), n = bt(i);
  return t >= vt(i) ? 0 : (n - i.from) * e * Math.exp(-e * Math.max(0, t) / 1e3);
}
const se = (i) => i, rn = (i) => i * i, on = (i) => 1 - (1 - i) * (1 - i), an = (i) => i < 0.5 ? 2 * i * i : 1 - Math.pow(-2 * i + 2, 2) / 2, di = (i) => i * i * i, pi = (i) => 1 - Math.pow(1 - i, 3), Bt = (i) => i < 0.5 ? 4 * i * i * i : 1 - Math.pow(-2 * i + 2, 3) / 2, cn = di, ln = pi, hn = Bt, un = {
  linear: se,
  "ease-in": cn,
  "ease-out": ln,
  "ease-in-out": hn,
  "ease-in-quad": rn,
  "ease-out-quad": on,
  "ease-in-out-quad": an,
  "ease-in-cubic": di,
  "ease-out-cubic": pi,
  "ease-in-out-cubic": Bt
};
function fn(i) {
  const [t, e, n, s] = i, r = 3 * t, o = 3 * (n - t) - r, a = 1 - r - o, c = 3 * e, l = 3 * (s - e) - c, h = 1 - c - l, f = (p) => ((a * p + o) * p + r) * p, u = (p) => ((h * p + l) * p + c) * p, d = (p) => (3 * a * p + 2 * o) * p + r, m = (p) => {
    let g = p;
    for (let b = 0; b < 8; b++) {
      const T = f(g) - p;
      if (Math.abs(T) < 1e-7)
        return g;
      const w = d(g);
      if (Math.abs(w) < 1e-7)
        break;
      g -= T / w;
    }
    let y = 0, v = 1;
    for (g = p; y < v; ) {
      const b = f(g);
      if (Math.abs(b - p) < 1e-7)
        return g;
      p > b ? y = g : v = g, g = (y + v) / 2;
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
  const e = (n) => 1 - i(1 - n);
  return t === "in" ? e : (n) => n < 0.5 ? e(n * 2) / 2 : i(n * 2 - 1) / 2 + 0.5;
}
function dn(i = 1, t = 0.3) {
  const e = Math.max(1, i), n = t / (2 * Math.PI) * Math.asin(1 / e);
  return (s) => s <= 0 ? 0 : s >= 1 ? 1 : e * Math.pow(2, -10 * s) * Math.sin((s - n) * (2 * Math.PI) / t) + 1;
}
const pn = (i) => {
  if (i <= 0) return 0;
  if (i >= 1) return 1;
  if (i < 1 / 2.75) return 7.5625 * i * i;
  if (i < 2 / 2.75) {
    const s = i - 0.5454545454545454;
    return 7.5625 * s * s + 0.75;
  }
  if (i < 2.5 / 2.75) {
    const s = i - 0.8181818181818182;
    return 7.5625 * s * s + 0.9375;
  }
  const n = i - 2.625 / 2.75;
  return 7.5625 * n * n + 0.984375;
};
function mn(i = 1.70158) {
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const e = t - 1;
    return e * e * ((i + 1) * e + i) + 1;
  };
}
function gn(i, t = "end") {
  const e = Math.max(1, Math.floor(i));
  return (n) => {
    if (n >= 1) return 1;
    if (n <= 0) return t === "start" || t === "both" ? t === "start" ? 1 / e : 1 / (e + 1) : 0;
    const s = Math.floor(n * e);
    switch (t) {
      case "start":
        return Math.min(1, (s + 1) / e);
      case "both":
        return (s + 1) / (e + 1);
      case "none":
        return e === 1 ? 0 : Math.min(1, s / (e - 1));
      default:
        return s / e;
    }
  };
}
function yn(i) {
  switch (i.type) {
    case "steps":
      return gn(i.count, i.position);
    case "elastic":
      return Vt(dn(i.amplitude, i.period), i.mode);
    case "bounce":
      return Vt(pn, i.mode);
    case "back":
      return Vt(mn(i.overshoot), i.mode);
  }
}
function U(i) {
  return i === void 0 ? se : Zi(i) ? fn(i.points) : Pt(i) ? yn(i) : un[i] ?? se;
}
const xe = 32, bn = 256, tt = /* @__PURE__ */ new Map(), vn = /[MmLlHhVvCcSsQqTtAaZz]/, wn = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, Tn = {
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
function xn(i) {
  const t = [];
  let e = 0, n = null;
  const s = () => {
    for (; e < i.length && /[\s,]/.test(i[e]); ) e++;
  };
  for (; e < i.length && (s(), !(e >= i.length)); ) {
    const r = i[e];
    if (vn.test(r)) {
      n = { type: r, args: [] }, t.push(n), e++;
      continue;
    }
    if (!n) break;
    const o = n.type === "A" || n.type === "a", a = n.args.length % 7;
    if (o && (a === 3 || a === 4)) {
      if (r !== "0" && r !== "1") break;
      n.args.push(r === "1" ? 1 : 0), e++;
      continue;
    }
    const c = wn.exec(i.slice(e));
    if (!c) break;
    n.args.push(parseFloat(c[0])), e += c[0].length;
  }
  return t;
}
function kn(i, t, e, n, s, r, o, a, c) {
  if (i === a && t === c) return [];
  let l = Math.abs(e), h = Math.abs(n);
  if (l === 0 || h === 0) return [[i, t, a, c, a, c]];
  const f = s * Math.PI / 180, u = Math.cos(f), d = Math.sin(f), m = (i - a) / 2, p = (t - c) / 2, g = u * m + d * p, y = -d * m + u * p, v = g * g / (l * l) + y * y / (h * h);
  if (v > 1) {
    const R = Math.sqrt(v);
    l *= R, h *= R;
  }
  const b = r === o ? -1 : 1, T = l * l * h * h - l * l * y * y - h * h * g * g, w = l * l * y * y + h * h * g * g, x = b * Math.sqrt(Math.max(0, T / w)), S = x * l * y / h, _ = -x * h * g / l, D = u * S - d * _ + (i + a) / 2, A = d * S + u * _ + (t + c) / 2, k = (R, $, B, J) => {
    const Xt = R * B + $ * J, Tt = Math.sqrt((R * R + $ * $) * (B * B + J * J)), at = Math.acos(Math.max(-1, Math.min(1, Xt / Tt)));
    return R * J - $ * B < 0 ? -at : at;
  }, P = k(1, 0, (g - S) / l, (y - _) / h);
  let E = k((g - S) / l, (y - _) / h, (-g - S) / l, (-y - _) / h);
  !o && E > 0 && (E -= 2 * Math.PI), o && E < 0 && (E += 2 * Math.PI);
  const C = Math.max(1, Math.ceil(Math.abs(E) / (Math.PI / 2))), M = E / C, I = 4 / 3 * Math.tan(M / 4), L = (R) => {
    const $ = l * Math.cos(R), B = h * Math.sin(R);
    return [u * $ - d * B + D, d * $ + u * B + A];
  }, N = (R) => {
    const $ = -l * Math.sin(R), B = h * Math.cos(R);
    return [u * $ - d * B, d * $ + u * B];
  }, O = [];
  for (let R = 0; R < C; R++) {
    const $ = P + R * M, B = $ + M, [J, Xt] = L($), [Tt, at] = R === C - 1 ? [a, c] : L(B), [zi, Hi] = N($), [Gi, Ki] = N(B);
    O.push([J + I * zi, Xt + I * Hi, Tt - I * Gi, at - I * Ki, Tt, at]);
  }
  return O;
}
function H(i, t, e, n, s) {
  const r = 1 - s;
  return r * r * r * i + 3 * r * r * s * t + 3 * r * s * s * e + s * s * s * n;
}
function ke(i, t, e, n, s) {
  const r = 1 - s;
  return 3 * r * r * (t - i) + 6 * r * s * (e - t) + 3 * s * s * (n - e);
}
function ct(i, t, e, n) {
  return {
    subpath: 0,
    type: "L",
    points: [e, n],
    startX: i,
    startY: t,
    endX: e,
    endY: n,
    length: Math.hypot(e - i, n - t)
  };
}
function kt(i, t, e) {
  const [n, s, r, o, a, c] = e, l = [0];
  let h = i, f = t, u = 0;
  for (let d = 1; d <= xe; d++) {
    const m = d / xe, p = H(i, n, r, a, m), g = H(t, s, o, c, m);
    u += Math.hypot(p - h, g - f), l.push(u), h = p, f = g;
  }
  return {
    subpath: 0,
    type: "C",
    points: [n, s, r, o, a, c],
    startX: i,
    startY: t,
    endX: a,
    endY: c,
    length: u,
    lengths: l
  };
}
function st(i) {
  const t = tt.get(i);
  if (t) return t;
  const e = [];
  let n = 0, s = 0, r = 0, o = 0, a = null, c = null, l = -1;
  const h = /* @__PURE__ */ new Set(), f = (p) => {
    l < 0 && (l = 0), p.subpath = l, e.push(p);
  };
  for (const { type: p, args: g } of xn(i)) {
    const y = p.toUpperCase(), v = p !== y, b = Tn[y];
    if (y === "Z") {
      (n !== r || s !== o) && f(ct(n, s, r, o)), l >= 0 && h.add(l), n = r, s = o, a = c = null;
      continue;
    }
    for (let T = 0; T + b <= g.length; T += b) {
      const w = g.slice(T, T + b), x = v ? n : 0, S = v ? s : 0;
      let _ = null, D = null;
      switch (y) {
        case "M":
          T === 0 ? (n = w[0] + x, s = w[1] + S, r = n, o = s, (l < 0 || e[e.length - 1]?.subpath === l) && l++) : (f(ct(n, s, w[0] + x, w[1] + S)), n = w[0] + x, s = w[1] + S);
          break;
        case "L":
          f(ct(n, s, w[0] + x, w[1] + S)), n = w[0] + x, s = w[1] + S;
          break;
        case "H":
          f(ct(n, s, w[0] + x, s)), n = w[0] + x;
          break;
        case "V":
          f(ct(n, s, n, w[0] + S)), s = w[0] + S;
          break;
        case "C": {
          const A = [w[0] + x, w[1] + S, w[2] + x, w[3] + S, w[4] + x, w[5] + S];
          f(kt(n, s, A)), _ = [A[2], A[3]], n = A[4], s = A[5];
          break;
        }
        case "S": {
          const [A, k] = a ? [2 * n - a[0], 2 * s - a[1]] : [n, s], P = [A, k, w[0] + x, w[1] + S, w[2] + x, w[3] + S];
          f(kt(n, s, P)), _ = [P[2], P[3]], n = P[4], s = P[5];
          break;
        }
        case "Q":
        case "T": {
          let A = n, k = s;
          y === "Q" ? (A = w[0] + x, k = w[1] + S) : c && (A = 2 * n - c[0], k = 2 * s - c[1]);
          const P = y === "Q" ? w[2] + x : w[0] + x, E = y === "Q" ? w[3] + S : w[1] + S;
          f(
            kt(n, s, [
              n + 2 / 3 * (A - n),
              s + 2 / 3 * (k - s),
              P + 2 / 3 * (A - P),
              E + 2 / 3 * (k - E),
              P,
              E
            ])
          ), D = [A, k], n = P, s = E;
          break;
        }
        case "A": {
          const A = w[5] + x, k = w[6] + S;
          let P = n, E = s;
          for (const C of kn(n, s, w[0], w[1], w[2], w[3], w[4], A, k))
            f(kt(P, E, C)), P = C[4], E = C[5];
          n = A, s = k;
          break;
        }
      }
      a = _, c = D;
    }
  }
  const u = e.reduce((p, g) => p + g.length, 0), d = [];
  for (let p = 0; p < e.length; ) {
    const g = e[p].subpath;
    let y = p, v = 0;
    for (; y < e.length && e[y].subpath === g; ) v += e[y++].length;
    const b = e[p], T = e[y - 1], w = h.has(g) || Math.abs(T.endX - b.startX) < 1e-9 && Math.abs(T.endY - b.startY) < 1e-9;
    d.push({ start: p, end: y, length: v, closed: w }), p = y;
  }
  const m = { segments: e, totalLength: u, subpaths: d };
  return tt.size >= bn && tt.delete(tt.keys().next().value), tt.set(i, m), m;
}
function Sn(i, t) {
  const e = i.lengths;
  if (t <= 0) return 0;
  if (t >= i.length) return 1;
  let n = 0, s = e.length - 1;
  for (; n < s - 1; ) {
    const a = n + s >> 1;
    e[a] < t ? n = a : s = a;
  }
  const r = e[s] - e[n], o = r > 0 ? (t - e[n]) / r : 0;
  return (n + o) / (e.length - 1);
}
function Mn(i, t) {
  if (i.type === "L") {
    const f = i.length > 0 ? Math.max(0, Math.min(1, t / i.length)) : 0;
    return {
      x: i.startX + (i.endX - i.startX) * f,
      y: i.startY + (i.endY - i.startY) * f,
      angle: Math.atan2(i.endY - i.startY, i.endX - i.startX) * 180 / Math.PI
    };
  }
  const [e, n, s, r, o, a] = i.points, c = Sn(i, t);
  let l = ke(i.startX, e, s, o, c), h = ke(i.startY, n, r, a, c);
  if (Math.hypot(l, h) < 1e-9) {
    const f = c < 0.5 ? Math.min(1, c + 1e-3) : Math.max(0, c - 1e-3), u = H(i.startX, e, s, o, f), d = H(i.startY, n, r, a, f), m = H(i.startX, e, s, o, c), p = H(i.startY, n, r, a, c);
    l = c < 0.5 ? u - m : m - u, h = c < 0.5 ? d - p : p - d;
  }
  return {
    x: H(i.startX, e, s, o, c),
    y: H(i.startY, n, r, a, c),
    angle: Math.atan2(h, l) * 180 / Math.PI
  };
}
function mi(i, t, e = 0, n = i.length) {
  if (n <= e) return { x: 0, y: 0, angle: 0 };
  let s = 0;
  for (let r = e; r < n; r++) {
    const o = i[r];
    if (s + o.length >= t || r === n - 1)
      return Mn(o, t - s);
    s += o.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function An(i, t) {
  const { segments: e, totalLength: n } = st(i);
  return mi(e, Math.max(0, Math.min(1, t)) * n);
}
function Eo() {
  tt.clear();
}
function Po(i) {
  return st(i).totalLength;
}
const En = 24, Pn = 320, Cn = 2.5, lt = 72, Co = 64, _n = 0.2, In = 128, pt = /* @__PURE__ */ new Map();
let At = 0, z;
const Se = (i) => Math.round(i * 100) / 100;
function Me(i, t) {
  const { segments: e, subpaths: n, totalLength: s } = st(i);
  if (e.length === 0) return [];
  if (t) {
    const r = n.every((o) => o.closed);
    return [{ segments: e, start: 0, end: e.length, length: s, closed: r }];
  }
  return n.filter((r) => r.length > 0).map((r) => ({ segments: e, start: r.start, end: r.end, length: r.length, closed: r.closed }));
}
function re(i, t) {
  const e = i.closed ? (t % 1 + 1) % 1 : Math.max(0, Math.min(1, t)), n = mi(i.segments, e * i.length, i.start, i.end);
  return [n.x, n.y];
}
function Ae(i) {
  const t = [];
  let e = 0;
  for (let n = i.start; n < i.end; n++)
    e += i.segments[n].length, i.length > 0 && t.push(e / i.length);
  return t;
}
function Ee(i, t) {
  const e = [];
  for (let n = 0; n < t; n++)
    e.push(re(i, i.closed ? n / t : n / (t - 1)));
  return e;
}
function Pe(i) {
  let t = 0, e = 0;
  for (const [n, s] of i)
    t += n, e += s;
  return t /= i.length, e /= i.length, i.map(([n, s]) => [n - t, s - e]);
}
function Rn(i, t, e) {
  const n = i.closed && t.closed;
  if (e !== void 0)
    return { offset: n ? Math.abs(e) % lt / lt : 0, reversed: e < 0 };
  const s = Pe(Ee(i, lt)), r = Pe(Ee(t, lt)), o = lt;
  let a = { offset: 0, reversed: !1 }, c = 1 / 0;
  for (const l of [!1, !0]) {
    const h = n ? o : 1;
    for (let f = 0; f < h; f++) {
      let u = 0;
      for (let d = 0; d < o && u < c; d++) {
        const m = n ? l ? (f - d + o) % o : (d + f) % o : l ? o - 1 - d : d, p = s[d][0] - r[m][0], g = s[d][1] - r[m][1];
        u += p * p + g * g;
      }
      u < c && (c = u, a = { offset: n ? f / o : 0, reversed: l });
    }
  }
  return a;
}
function Ln(i, t, e) {
  return e ? ((t.reversed ? t.offset - i : i + t.offset) % 1 + 1) % 1 : t.reversed ? 1 - i : i;
}
function $n(i, t, e) {
  return e ? ((t.reversed ? t.offset - i : i - t.offset) % 1 + 1) % 1 : t.reversed ? 1 - i : i;
}
function Fn(i, t, e) {
  const n = i.closed && t.closed, s = Rn(i, t, e.shapeIndex), r = Math.max(
    En,
    Math.min(Pn, Math.ceil(Math.max(i.length, t.length) / Cn))
  ), o = /* @__PURE__ */ new Set(), a = (f) => o.add(Math.round(f * 1e7) / 1e7);
  for (let f = 0; f <= r; f++) a(f / r);
  for (const f of Ae(i)) a(f);
  for (const f of Ae(t)) a($n(f, s, n));
  let c = [...o].sort((f, u) => f - u);
  n && (c = c.filter((f) => f < 1));
  const l = [], h = [];
  for (const f of c)
    l.push(...re(i, f)), h.push(...re(t, Ln(f, s, n)));
  return Dn({ from: l, to: h, closed: n });
}
function Dn(i) {
  const t = i.from.length / 2;
  if (t <= 3) return i;
  const e = new Uint8Array(t);
  e[0] = 1, e[t - 1] = 1;
  const n = [[0, t - 1]];
  for (; n.length > 0; ) {
    const [o, a] = n.pop();
    let c = -1, l = _n;
    for (let h = o + 1; h < a; h++) {
      const f = Math.max(Ce(i.from, o, a, h), Ce(i.to, o, a, h));
      f > l && (l = f, c = h);
    }
    c !== -1 && (e[c] = 1, n.push([o, c], [c, a]));
  }
  const s = [], r = [];
  for (let o = 0; o < t; o++)
    e[o] && (s.push(i.from[o * 2], i.from[o * 2 + 1]), r.push(i.to[o * 2], i.to[o * 2 + 1]));
  return { from: s, to: r, closed: i.closed };
}
function Ce(i, t, e, n) {
  const s = i[t * 2], r = i[t * 2 + 1], o = i[e * 2] - s, a = i[e * 2 + 1] - r, c = i[n * 2] - s, l = i[n * 2 + 1] - r, h = o * o + a * a, f = h === 0 ? 0 : Math.max(0, Math.min(1, (c * o + l * a) / h));
  return Math.hypot(c - f * o, l - f * a);
}
function On(i, t, e) {
  const n = e.shapeIndex;
  if (z && z.from === i && z.to === t && z.shapeIndex === n) return z.plan;
  const r = pt.get(String(n ?? "auto"))?.get(i)?.get(t);
  if (r)
    return z = { from: i, to: t, shapeIndex: n, plan: r }, r;
  const o = st(i).subpaths.filter((d) => d.length > 0).length === st(t).subpaths.filter((d) => d.length > 0).length, a = Me(i, !o), c = Me(t, !o), l = {
    pairs: a.map((d, m) => Fn(d, c[m], e))
  };
  At >= In && (pt.clear(), At = 0);
  const h = String(n ?? "auto"), f = pt.get(h) ?? /* @__PURE__ */ new Map();
  pt.set(h, f);
  const u = f.get(i) ?? /* @__PURE__ */ new Map();
  return f.set(i, u), u.set(t, l), At++, z = { from: i, to: t, shapeIndex: n, plan: l }, l;
}
function Nn(i, t, e, n = {}) {
  if (!i) return t;
  if (!t) return i;
  const s = Math.max(0, Math.min(1, e));
  if (s === 0) return i;
  if (s === 1) return t;
  const r = On(i, t, n);
  if (r.pairs.length === 0) return s < 0.5 ? i : t;
  let o = "";
  for (const a of r.pairs) {
    for (let c = 0; c < a.from.length; c += 2) {
      const l = Se(a.from[c] + (a.to[c] - a.from[c]) * s), h = Se(a.from[c + 1] + (a.to[c + 1] - a.from[c + 1]) * s);
      o += `${c === 0 ? o ? " M" : "M" : " L"}${l} ${h}`;
    }
    a.closed && (o += " Z");
  }
  return o;
}
function _o() {
  pt.clear(), At = 0, z = void 0;
}
function wt(i) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(i);
}
const W = (i, t, e) => i + (t - i) * e, gi = 512, Wt = /* @__PURE__ */ new Map(), jt = /* @__PURE__ */ new Map();
function _e(i) {
  const t = Wt.get(i);
  if (t) return t;
  const e = i.replace("#", ""), n = [
    parseInt(e.slice(0, 2), 16),
    parseInt(e.slice(2, 4), 16),
    parseInt(e.slice(4, 6), 16)
  ];
  return Wt.size < gi && Wt.set(i, n), n;
}
const Ie = (i) => i.charCodeAt(0) === 35, Re = (i) => i.startsWith("rgb"), Le = (i) => i.startsWith("rgba"), Bn = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, Ut = (i) => Math.round(i).toString(16).padStart(2, "0");
function qn(i, t, e) {
  return `#${Ut(i)}${Ut(t)}${Ut(e)}`;
}
function $e(i) {
  const t = jt.get(i);
  if (t) return t;
  const e = i.match(Bn);
  if (!e)
    throw new Error(`Invalid rgb color: ${i}`);
  const n = parseInt(e[1], 10), s = parseInt(e[2], 10), r = parseInt(e[3], 10), o = e[4] !== void 0 ? [n, s, r, parseFloat(e[4])] : [n, s, r];
  return jt.size < gi && jt.set(i, o), o;
}
const Xn = (i, t, e) => {
  if (Ie(i) && Ie(t)) {
    const [n, s, r] = _e(i), [o, a, c] = _e(t), l = W(n, o, e), h = W(s, a, e), f = W(r, c, e);
    return qn(l, h, f);
  }
  if ((Re(i) || Le(i)) && (Re(t) || Le(t))) {
    const n = $e(i), s = $e(t), r = Math.round(W(n[0], s[0], e)), o = Math.round(W(n[1], s[1], e)), a = Math.round(W(n[2], s[2], e));
    if (n.length === 4 || s.length === 4) {
      const c = n[3] ?? 1, l = s[3] ?? 1, h = W(c, l, e);
      return `rgba(${r}, ${o}, ${a}, ${h})`;
    }
    return `rgb(${r}, ${o}, ${a})`;
  }
  return e < 1 ? i : t;
}, Yn = (i, t, e) => {
  const n = Math.min(i.length, t.length), s = [];
  for (let r = 0; r < n; r++)
    s.push(W(i[r], t[r], e));
  return s;
}, Fe = (i, t, e) => e < 1 ? i : t, Vn = (i, t, e) => Nn(i, t, e);
function It(i) {
  return typeof i == "number" ? W : Array.isArray(i) ? Yn : typeof i == "string" ? i.startsWith("#") || i.startsWith("rgb") ? Xn : wt(i) ? Vn : Fe : Fe;
}
const yi = 1e3 / 60;
function bi(i, t = {}) {
  if (!Q(i))
    throw new Error(`bakeSpringTrack: track "${i.id}" is not a spring track`);
  const e = new Ot(i.spring);
  return wi(i, (n) => e.valueAt(n), e.settleTime(), i.spring.from, i.spring.to, t);
}
function vi(i, t = {}) {
  if (!Z(i))
    throw new Error(`bakeInertiaTrack: track "${i.id}" is not an inertia track`);
  const e = i.inertia;
  return wi(
    i,
    (n) => ne(e, n),
    vt(e),
    e.from,
    bt(e),
    t
  );
}
function wi(i, t, e, n, s, r) {
  const o = r.intervalMs ?? yi, a = r.tolerance ?? 0.01, c = i.delay ?? 0, l = [];
  for (let f = 0; f <= e; f += o)
    l.push({ time: f + c, value: t(f), easing: "linear" });
  const h = l[l.length - 1];
  return !h || h.time < e + c ? l.push({ time: e + c, value: s, easing: "linear" }) : h.value = s, c > 0 && l.unshift({ time: 0, value: n, easing: "linear" }), {
    id: i.id,
    target: i.target,
    property: i.property,
    keyframes: a > 0 ? jn(l, a) : l,
    ...i.targets && { targets: [...i.targets] },
    ...i.stagger && { stagger: { ...i.stagger } }
  };
}
function Ti(i, t, e, n = {}) {
  const s = n.intervalMs ?? yi, r = typeof e == "function" ? e : U(e), o = It(i.value), a = t.time - i.time;
  if (a <= 0) return [t];
  const c = [];
  for (let h = s; h < a; h += s) {
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
function Io(i, t) {
  return Q(i) ? bi(i, t) : Z(i) ? vi(i, t) : i;
}
function Wn(i, t = {}) {
  const e = i.keyframes;
  if (!e.some((s) => Pt(s.easing))) return i;
  const n = e.length > 0 ? [e[0]] : [];
  for (let s = 1; s < e.length; s++) {
    const r = e[s];
    Pt(r.easing) ? n.push(...Ti(e[s - 1], r, r.easing, t)) : n.push(r);
  }
  return { ...i, keyframes: n };
}
function Ro(i, t) {
  return i.filter(Qi).map((e) => Wn(e, t)).concat(
    i.filter(Q).map((e) => bi(e, t)),
    i.filter(Z).map((e) => vi(e, t))
  );
}
function jn(i, t) {
  if (i.length <= 2) return i;
  const e = [i[0]];
  for (let n = 1; n < i.length - 1; n++) {
    const s = e[e.length - 1], r = i[n], o = i[n + 1], a = o.time - s.time;
    if (a <= 0) continue;
    const c = (r.time - s.time) / a, l = s.value + (o.value - s.value) * c;
    Math.abs(r.value - l) > t && e.push(r);
  }
  return e.push(i[i.length - 1]), e;
}
function oe(i) {
  const t = [...i.keyframes].sort((e, n) => e.time - n.time);
  return {
    ...i,
    keyframes: t
  };
}
function G(i) {
  return i.targets && i.targets.length > 0 ? i.targets : [i.target];
}
function rt(i, t, e, n) {
  const s = e ?? 0;
  return !n || t <= 1 ? s : s + pe(i, t, n);
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
    const e = this.targets.length, n = [];
    for (let s = 0; s < e; s++) {
      const r = rt(s, e, this.track.delay, this.track.stagger), o = this.valueForOffset(t - r);
      o !== void 0 && n.push({ target: this.targets[s], value: o, start: r + this.track.keyframes[0].time });
    }
    return n;
  }
  /**
   * Get the duration of this track — the last keyframe, plus any delay, the
   * widest stagger offset, and any trailing hold.
   */
  getDuration() {
    const { keyframes: t } = this.track;
    if (t.length === 0)
      return 0;
    const e = t[t.length - 1].time, n = this.track.stagger ? Dt(this.targets.length, this.track.stagger) : 0;
    return e + (this.track.delay ?? 0) + n + (this.track.endDelay ?? 0);
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
    const { from: n, to: s } = this.findSurroundingKeyframes(t);
    if (!n || !s)
      return;
    if (n.time === t)
      return n.value;
    const r = s.time - n.time, o = (t - n.time) / r, c = U(s.easing)(o);
    return It(n.value)(n.value, s.value, c);
  }
  /**
   * Find the keyframes surrounding a given time.
   */
  findSurroundingKeyframes(t) {
    const { keyframes: e } = this.track;
    for (let n = 0; n < e.length - 1; n++)
      if (t >= e[n].time && t <= e[n + 1].time)
        return { from: e[n], to: e[n + 1] };
    return { from: null, to: null };
  }
}
class Un {
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
    const e = this.targets.length, n = [];
    for (let s = 0; s < e; s++) {
      const r = rt(s, e, this.track.delay, this.track.stagger);
      n.push({ target: this.targets[s], value: this.sampler.valueAt(t - r), start: r });
    }
    return n;
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
class zn {
  track;
  targets;
  duration;
  constructor(t) {
    this.track = t, this.targets = G(t), this.duration = vt(t.inertia);
  }
  getValueAtTime(t) {
    return ne(this.track.inertia, t - rt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const e = this.targets.length, n = [];
    for (let s = 0; s < e; s++) {
      const r = rt(s, e, this.track.delay, this.track.stagger);
      n.push({ target: this.targets[s], value: ne(this.track.inertia, t - r), start: r });
    }
    return n;
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
function xi(i, t) {
  const e = { ...An(i.pathData, t) };
  if (i.matrix) {
    const [n, s, r, o, a, c] = i.matrix, { x: l, y: h } = e;
    e.x = n * l + r * h + a, e.y = s * l + o * h + c;
    const f = e.angle * Math.PI / 180, u = Math.cos(f), d = Math.sin(f);
    e.angle = Math.atan2(s * u + o * d, n * u + r * d) * 180 / Math.PI;
  }
  return i.autoRotate && i.rotateOffset && (e.angle += i.rotateOffset), e;
}
function Lo(i, t, e, n) {
  const s = t + (e - t) * n;
  return xi(i, s);
}
const Ht = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, Hn = 20;
function Gn(i) {
  const t = Ht[i ?? "upperCase"] ?? i ?? Ht.upperCase, e = Array.from(t);
  return e.length > 0 ? e : Array.from(Ht.upperCase);
}
function Kn(i, t, e) {
  let n = (i | 0) ^ Math.imul(t + 1, 2654435761) ^ Math.imul(e + 1, 2246822507);
  return n = Math.imul(n ^ n >>> 16, 2146121005), n = Math.imul(n ^ n >>> 15, 2221713035), (n ^ n >>> 16) >>> 0;
}
function Zn(i, t, e = 0) {
  const n = i.from ?? "", s = i.to, r = Math.max(0, Math.min(1, t));
  if (r <= 0) return n;
  if (r >= 1) return s;
  const o = Array.from(n), a = Array.from(s), c = i.rightToLeft ?? !1;
  if (i.mode === "type") {
    const v = Math.round(r * Math.max(o.length, a.length));
    return c ? o.slice(0, Math.max(0, o.length - v)).join("") + a.slice(Math.max(0, a.length - v)).join("") : a.slice(0, v).join("") + o.slice(v).join("");
  }
  const l = Math.max(0, Math.min(0.999, i.revealDelay ?? 0)), h = Math.max(0, (r - l) / (1 - l)), f = Math.floor(h * a.length), u = i.tweenLength === !1 ? a.length : Math.round(o.length + (a.length - o.length) * r), d = Gn(i.chars), m = i.refreshRate ?? Hn, p = m > 0 ? Math.floor(e * m / 1e3) : 0, g = i.seed ?? 1;
  let y = "";
  for (let v = 0; v < u; v++) {
    const b = c ? v >= u - f : v < f, T = c ? a[a.length - (u - v)] : a[v];
    b && T !== void 0 || T === " " || T === `
` ? y += T : y += d[Kn(g, v, p) % d.length];
  }
  return y;
}
class ki {
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
    let s = t * this.speed;
    if (this._repeatDelayRemaining > 0) {
      const a = Math.min(this._repeatDelayRemaining, s);
      if (this._repeatDelayRemaining -= a, s -= a, this._repeatDelayRemaining > 0) {
        this.onUpdate?.(this.getStateAtTime(this._currentTime));
        return;
      }
      this._wrapAfterDelay && (this._wrapAfterDelay = !1, this._currentTime = 0);
    }
    const r = 1e3;
    for (let a = 0; a < r && s > 0 && this._playbackState === "playing"; a++)
      if (this._direction === "forward") {
        const c = e - this._currentTime;
        if (s >= c) {
          if (s -= c, this._currentTime = e, !this._handleEndReached())
            break;
        } else
          this._currentTime += s, s = 0;
      } else {
        const c = this._currentTime;
        if (s >= c) {
          if (s -= c, this._currentTime = 0, !this._handleStartReached())
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
    const e = /* @__PURE__ */ new Map();
    if (this._hasSharedWrites())
      this._resolveShared(t, e);
    else
      for (const [n, s] of this._trackPlayers) {
        const r = s.getTrack().property;
        for (const { target: o, value: a, start: c } of s.getTargetValues(t))
          this._write(e, n, o, r, a, t - c);
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
    const n = /* @__PURE__ */ new Map();
    for (const [s, r] of this._trackPlayers) {
      const o = r.getTrack().property;
      for (const { target: a, value: c, start: l } of r.getTargetValues(t)) {
        const h = `${a}\0${o}`, f = l <= t, u = n.get(h);
        (!u || (f !== u.started ? f : f ? l >= u.start : l <= u.start)) && n.set(h, { trackId: s, target: a, property: o, value: c, start: l, started: f });
      }
    }
    for (const { trackId: s, target: r, property: o, value: a, start: c } of n.values())
      this._write(e, s, r, o, a, t - c);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(t, e, n, s, r, o) {
    if (r === void 0) return;
    let a = t.get(n);
    a || (a = /* @__PURE__ */ new Map(), t.set(n, a));
    const c = this._textTracks.get(e);
    if (c && typeof r == "number") {
      a.set("text", Zn(c.textConfig, r, Math.max(0, o)));
      return;
    }
    const l = this._motionPathTracks.get(e);
    if (l && typeof r == "number") {
      const h = xi(l.motionPathConfig, r);
      a.set("motionPathX", h.x), a.set("motionPathY", h.y), l.motionPathConfig.autoRotate && a.set("motionPathRotate", h.angle);
    } else
      a.set(s, r);
  }
  /** Cached: does any target+property have more than one track? */
  _sharedWrites = null;
  _hasSharedWrites() {
    if (this._sharedWrites === null) {
      const t = /* @__PURE__ */ new Set();
      this._sharedWrites = !1;
      t: for (const e of this._tracks)
        for (const n of G(e)) {
          const s = `${n}\0${e.property}`;
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
    if (this._tracks.push(t), this._sharedWrites = null, Z(t)) {
      this._trackPlayers.set(t.id, new zn(t));
      return;
    }
    if (Q(t)) {
      this._trackPlayers.set(t.id, new Un(t)), this._springTracks.set(t.id, t);
      return;
    }
    if (de(t))
      this._trackPlayers.set(t.id, new zt(t)), this._textTracks.set(t.id, t);
    else if (li(t)) {
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
    const n = this._tracks.findIndex((r) => r.id === t);
    if (n < 0) return;
    const s = this._tracks.slice(n + 1);
    this.removeTrack(t);
    for (const r of s) this.removeTrack(r.id);
    this.addTrack(e);
    for (const r of s) this.addTrack(r);
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
    const e = this.getTracks(t).map((n) => n.id);
    for (const n of e)
      this.removeTrack(n);
    return e;
  }
  /**
   * The time span a track is active over: [start, end] in milliseconds.
   */
  getTrackSpan(t) {
    const e = this._trackPlayers.get(t);
    if (!e) return;
    const n = e.getTrack(), s = n.delay ?? 0;
    if (Q(n) || Z(n))
      return { from: s, to: e.getDuration() };
    const r = n.keyframes;
    if (!(!r || r.length === 0))
      return { from: r[0].time + s, to: e.getDuration() };
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
      const n = this._tracks[e], s = this.getTrackSpan(n.id);
      if (s)
        for (let r = 0; r < e; r++) {
          const o = this._tracks[r];
          if (o.property !== n.property) continue;
          const a = G(o).filter((f) => G(n).includes(f));
          if (a.length === 0) continue;
          const c = this.getTrackSpan(o.id);
          if (!c || !(c.from <= s.to && s.from <= c.to)) continue;
          const h = s.from >= c.from;
          for (const f of a)
            t.push({
              target: f,
              property: n.property,
              losingTrackId: h ? o.id : n.id,
              winningTrackId: h ? n.id : o.id
            });
        }
    }
    return t;
  }
  _matches(t, e) {
    if (e.id !== void 0 && t.id !== e.id || e.property !== void 0 && t.property !== e.property || e.target !== void 0 && !G(t).includes(e.target)) return !1;
    if (e.timeRange) {
      const n = this.getTrackSpan(t.id);
      if (!n || n.to < e.timeRange.from || n.from > e.timeRange.to) return !1;
    }
    return !0;
  }
  /**
   * Export timeline as a serializable definition.
   */
  toDefinition() {
    return {
      formatVersion: Ct,
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
    const e = t && t.length > 0 ? [...t].sort((s, r) => s.time - r.time).map((s) => ({ ...s })) : void 0, n = { ...this._config };
    e ? n.markers = e : delete n.markers, this._config = n;
  }
  /** Caption text per language, per marker id */
  get captions() {
    return this._captions;
  }
  /** Replace the captions; languages with no captions are dropped. */
  setCaptions(t) {
    const e = {};
    for (const [n, s] of Object.entries(t ?? {})) e[n] = { ...s };
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
const Qn = 100;
function Si(i, t, e, n) {
  const s = [], r = [], { duration: o, alternate: a } = n, c = (d, m, p, g) => {
    r.push([d, m]);
    const y = [];
    i.forEach((v, b) => {
      (p === "forward" ? (g ? v >= d : v > d) && v <= m : (g ? v <= d : v < d) && v >= m) && y.push(b);
    }), y.sort((v, b) => (p === "forward" ? i[v] - i[b] : i[b] - i[v]) || v - b);
    for (const v of y) s.push({ kind: "event", index: v, direction: p });
  };
  let l = t.time, h = t.direction, f = t.fresh === !0;
  const u = Math.min(Qn, Math.max(0, e.iteration - t.iteration));
  for (let d = 0; d < u; d++) {
    const m = h === "forward" ? o : 0;
    c(l, m, h, f), s.push({ kind: "repeat" }), a ? (h = h === "forward" ? "reverse" : "forward", l = m, f = !1) : (l = h === "forward" ? 0 : o, f = !0);
  }
  return u > 0 && n.holding && !a ? { crossings: s, passes: r } : (c(l, e.time, h, f), { crossings: s, passes: r });
}
function Jn(i) {
  return Z(i) ? {
    id: i.id,
    target: i.target,
    property: i.property,
    kind: "inertia",
    inertia: Mi(i.inertia),
    ...V(i)
  } : Q(i) ? {
    id: i.id,
    target: i.target,
    property: i.property,
    kind: "spring",
    spring: { ...i.spring },
    ...V(i)
  } : de(i) ? {
    id: i.id,
    target: i.target,
    property: "text",
    textConfig: { ...i.textConfig },
    keyframes: i.keyframes.map(Gt),
    ...V(i)
  } : li(i) ? {
    id: i.id,
    target: i.target,
    property: "motionPath",
    motionPathConfig: { ...i.motionPathConfig },
    keyframes: i.keyframes.map(Gt),
    ...V(i)
  } : {
    id: i.id,
    target: i.target,
    property: i.property,
    keyframes: i.keyframes.map(Gt),
    ...V(i)
  };
}
function Mi(i) {
  return { ...i, ...Array.isArray(i.end) && { end: [...i.end] } };
}
function Gt(i) {
  return {
    time: i.time,
    value: i.value,
    ...i.easing && { easing: i.easing }
  };
}
function V(i) {
  const t = i.endDelay;
  return {
    ...i.delay !== void 0 && { delay: i.delay },
    ...t !== void 0 && { endDelay: t },
    ...i.targets !== void 0 && { targets: [...i.targets] },
    ...i.stagger !== void 0 && { stagger: { ...i.stagger } }
  };
}
function ts(i) {
  if (Z(i)) {
    const t = i;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "inertia",
      inertia: Mi(t.inertia),
      ...V(t)
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
      ...V(t)
    };
  }
  if (de(i)) {
    const t = i;
    return {
      id: t.id,
      target: t.target,
      property: "text",
      textConfig: { ...t.textConfig },
      keyframes: [...t.keyframes].sort((e, n) => e.time - n.time),
      ...V(t)
    };
  }
  if (i.property === "motionPath" && "motionPathConfig" in i) {
    const t = i, e = [...t.keyframes].sort((n, s) => n.time - s.time);
    return {
      id: t.id,
      target: t.target,
      property: "motionPath",
      motionPathConfig: { ...t.motionPathConfig },
      keyframes: e,
      ...V(t)
    };
  }
  return oe({
    id: i.id,
    target: i.target,
    property: i.property,
    keyframes: i.keyframes,
    ...V(i)
  });
}
function es(i) {
  const t = i._config.markers;
  return {
    formatVersion: Ct,
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
    tracks: i.tracks.map(Jn),
    ...i.captions && { captions: JSON.parse(JSON.stringify(i.captions)) }
  };
}
function gt(i) {
  const t = i.formatVersion ?? 1;
  if (t > Ct)
    throw new Error(
      `tinyfly: this animation uses format version ${t}, but this tinyfly reads up to version ${Ct}. Update tinyfly to play it.`
    );
  return new ki({
    id: i.id,
    name: i.name,
    config: i.config,
    tracks: i.tracks.map(ts),
    captions: i.captions
  });
}
function $o(i) {
  return JSON.stringify(es(i));
}
function Fo(i) {
  const t = JSON.parse(i);
  return gt(t);
}
function Do(i) {
  let t = 2166136261;
  for (let e = 0; e < i.length; e++)
    t ^= i.charCodeAt(e), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function is(i) {
  let t = i >>> 0 || 2654435769;
  return {
    seed: i >>> 0,
    next() {
      return t ^= t << 13, t >>>= 0, t ^= t >> 17, t ^= t << 5, t >>>= 0, t / 4294967296;
    }
  };
}
function Ai(i, t, e) {
  return t + i.next() * (e - t);
}
function ns(i, t, e, n) {
  if (n <= 0) return Ai(i, t, e);
  const s = Math.floor((e - t) / n), r = Math.round(i.next() * s);
  return t + r * n;
}
function Oo(i, t) {
  if (t.length !== 0)
    return t[Math.floor(i.next() * t.length)];
}
const Ei = /^([+\-*/])=\s*(-?[\d.]+)$/, Pi = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function No(i) {
  return typeof i != "string" ? !1 : Ei.test(i.trim()) || Pi.test(i.trim());
}
function Ci(i, t = {}) {
  if (typeof i != "string") return i;
  const e = i.trim(), n = Ei.exec(e);
  if (n) {
    const [, r, o] = n, a = t.base ?? 0, c = Number.parseFloat(o);
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
  const s = Pi.exec(e);
  if (s) {
    if (!t.random)
      throw new Error(
        `resolveValue: "${e}" needs a random source — pass one via context.random`
      );
    const r = Number.parseFloat(s[1]), o = Number.parseFloat(s[2]), a = s[3] !== void 0 ? Number.parseFloat(s[3]) : void 0;
    return a !== void 0 ? ns(t.random, r, o, a) : Ai(t.random, r, o);
  }
  return i;
}
function ss(i, t = 0, e) {
  const n = [];
  let s = t;
  for (const r of i) {
    const o = Ci(r, { base: s, random: e });
    n.push(o), typeof o == "number" && (s = o);
  }
  return n;
}
class Bo {
  random;
  constructor(t) {
    this.random = is(t);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(t, e = 0) {
    return Ci(t, { base: e, random: this.random });
  }
  resolveSequence(t, e = 0) {
    return ss(t, e, this.random);
  }
}
const rs = 600;
function os(i) {
  if (Array.isArray(i)) {
    const [u, d, m, p] = i;
    return { fn: De(u, d, m, p), bezier: [u, d, m, p] };
  }
  const { segments: t } = st(i);
  if (t.length === 0) throw new Error(`customEase: no curve in "${i}"`);
  const e = t[0].startX, n = t[0].startY, s = t[t.length - 1], r = s.endX - e, o = s.endY - n;
  if (r === 0 || o === 0) throw new Error(`customEase: "${i}" must move along both axes`);
  const a = (u) => (u - e) / r, c = (u) => (u - n) / o;
  if (t.length === 1 && s.type === "C") {
    const [u, d, m, p] = s.points, g = [a(u), c(d), a(m), c(p)];
    return { fn: De(...g), bezier: g };
  }
  const l = [], h = [], f = Math.max(8, Math.ceil(rs / t.length));
  for (const u of t)
    for (let d = l.length === 0 ? 0 : 1; d <= f; d++) {
      const [m, p] = ls(u, d / f);
      l.push(a(m)), h.push(c(p));
    }
  return { fn: hs(l, h) };
}
function as(i = {}) {
  const e = 0.1 + Math.max(0, Math.min(1, i.strength ?? 0.7)) * 0.7, n = [1];
  for (let r = e; r > 2e-3; r *= e) n.push(2 * Math.sqrt(r));
  const s = n.reduce((r, o) => r + o, 0);
  return (r) => {
    if (r <= 0) return 0;
    if (r >= 1) return 1;
    let o = r * s;
    for (let a = 0; a < n.length; a++) {
      if (o <= n[a]) {
        if (a === 0) return (o / n[0]) ** 2;
        const c = n[a] / 2, l = c * c, h = o - c;
        return 1 - (l - h * h);
      }
      o -= n[a];
    }
    return 1;
  };
}
function cs(i = {}) {
  const t = Math.max(1, i.wiggles ?? 10), e = i.type ?? "easeOut", n = (s) => e === "uniform" ? 1 : e === "easeInOut" ? Math.sin(Math.PI * s) : (1 - s) ** 2;
  return (s) => s <= 0 || s >= 1 ? 0 : Math.sin(s * t * Math.PI * 2) * n(s);
}
function ls(i, t) {
  if (i.type === "L") {
    const [l, h] = i.points;
    return [i.startX + (l - i.startX) * t, i.startY + (h - i.startY) * t];
  }
  const [e, n, s, r, o, a] = i.points, c = 1 - t;
  return [
    c * c * c * i.startX + 3 * c * c * t * e + 3 * c * t * t * s + t * t * t * o,
    c * c * c * i.startY + 3 * c * c * t * n + 3 * c * t * t * r + t * t * t * a
  ];
}
function hs(i, t) {
  return (e) => {
    if (e <= i[0]) return t[0];
    if (e >= i[i.length - 1]) return t[t.length - 1];
    let n = 0, s = i.length - 1;
    for (; s - n > 1; ) {
      const o = n + s >> 1;
      i[o] <= e ? n = o : s = o;
    }
    const r = i[s] - i[n];
    return r === 0 ? t[s] : t[n] + (e - i[n]) / r * (t[s] - t[n]);
  };
}
function De(i, t, e, n) {
  const s = (o, a, c) => 3 * (1 - o) * (1 - o) * o * a + 3 * (1 - o) * o * o * c + o * o * o, r = (o, a, c) => 3 * (1 - o) * (1 - o) * a + 6 * (1 - o) * o * (c - a) + 3 * o * o * (1 - c);
  return (o) => {
    if (o <= 0) return 0;
    if (o >= 1) return 1;
    let a = o;
    for (let h = 0; h < 8; h++) {
      const f = s(a, i, e) - o, u = r(a, i, e);
      if (Math.abs(f) < 1e-6) return s(a, t, n);
      if (Math.abs(u) < 1e-6) break;
      a -= f / u;
    }
    let c = 0, l = 1;
    a = o;
    for (let h = 0; h < 40; h++)
      s(a, i, e) < o ? c = a : l = a, a = (c + l) / 2;
    return s(a, t, n);
  };
}
const Y = (i) => Math.round(i * 1e3) / 1e3;
function us(i, t = {}) {
  if (i.length === 0) return "";
  const e = t.curviness ?? 1, n = t.closed ?? !1, s = i.length;
  let r = `M${Y(i[0].x)} ${Y(i[0].y)}`;
  if (s === 1) return r;
  const o = (c) => n ? i[(c % s + s) % s] : i[Math.max(0, Math.min(s - 1, c))], a = n ? s : s - 1;
  for (let c = 0; c < a; c++) {
    const l = o(c - 1), h = o(c), f = o(c + 1), u = o(c + 2);
    if (e === 0) {
      r += ` L${Y(f.x)} ${Y(f.y)}`;
      continue;
    }
    const d = e / 6, m = h.x + (f.x - l.x) * d, p = h.y + (f.y - l.y) * d, g = f.x - (u.x - h.x) * d, y = f.y - (u.y - h.y) * d;
    r += ` C${Y(m)} ${Y(p)} ${Y(g)} ${Y(y)} ${Y(f.x)} ${Y(f.y)}`;
  }
  return n ? `${r} Z` : r;
}
const F = (i, t = 0) => {
  const e = parseFloat(i ?? "");
  return Number.isFinite(e) ? e : t;
};
function fs(i) {
  const t = (i ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), e = [];
  for (let n = 0; n + 1 < t.length; n += 2) e.push({ x: t[n], y: t[n + 1] });
  return e;
}
function me(i) {
  const t = i.attributes;
  switch (i.tag.toLowerCase()) {
    case "path":
      return t.d ?? null;
    case "circle":
    case "ellipse": {
      const e = F(t.cx), n = F(t.cy), s = i.tag.toLowerCase() === "circle" ? F(t.r) : F(t.rx), r = i.tag.toLowerCase() === "circle" ? F(t.r) : F(t.ry);
      return `M${e + s} ${n} A${s} ${r} 0 1 1 ${e - s} ${n} A${s} ${r} 0 1 1 ${e + s} ${n} Z`;
    }
    case "rect": {
      const e = F(t.x), n = F(t.y), s = F(t.width), r = F(t.height);
      let o = t.rx != null ? F(t.rx) : t.ry != null ? F(t.ry) : 0, a = t.ry != null ? F(t.ry) : o;
      return o = Math.min(o, s / 2), a = Math.min(a, r / 2), o === 0 || a === 0 ? `M${e} ${n} H${e + s} V${n + r} H${e} Z` : `M${e + o} ${n} H${e + s - o} A${o} ${a} 0 0 1 ${e + s} ${n + a} V${n + r - a} A${o} ${a} 0 0 1 ${e + s - o} ${n + r} H${e + o} A${o} ${a} 0 0 1 ${e} ${n + r - a} V${n + a} A${o} ${a} 0 0 1 ${e + o} ${n} Z`;
    }
    case "line":
      return `M${F(t.x1)} ${F(t.y1)} L${F(t.x2)} ${F(t.y2)}`;
    case "polyline":
    case "polygon": {
      const e = fs(t.points);
      if (e.length === 0) return null;
      const n = e.map((s, r) => `${r === 0 ? "M" : "L"}${s.x} ${s.y}`).join(" ");
      return i.tag.toLowerCase() === "polygon" ? `${n} Z` : n;
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
}, Oe = {
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
function ds(i) {
  let t = i.trim().toLowerCase();
  t = t.replace(/\.ease(in|out|inout)$/, ".$1");
  const e = /^([a-z]+\d?)(\(.*\))?$/.exec(t);
  return e && e[1] !== "steps" && t !== "none" && t !== "linear" && (t = `${e[1]}.out${e[2] ?? ""}`), t;
}
U({ type: "bounce", mode: "in" });
U({ type: "bounce", mode: "in-out" });
function Rt(i) {
  const t = _i.get(i.trim().toLowerCase());
  if (t) return t;
  const e = ds(i), n = /^steps\(\s*(\d+)\s*\)$/.exec(e);
  if (n) {
    const o = { type: "steps", count: Math.max(1, Number.parseInt(n[1], 10)) + 1, position: "none" };
    return { easing: o, fn: U(o) };
  }
  const s = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(e);
  if (s) {
    const [, r, o, a] = s, c = (a ?? "").split(",").map((f) => Number.parseFloat(f)).filter((f) => Number.isFinite(f)), l = o === "inout" ? "in-out" : o;
    if (r === "back" && c.length === 0 && e in St)
      return { easing: { type: "cubic-bezier", points: St[e] } };
    const h = r === "elastic" ? { type: "elastic", mode: l, ...c[0] !== void 0 && { amplitude: c[0] }, ...c[1] !== void 0 && { period: c[1] } } : r === "bounce" ? { type: "bounce", mode: l } : { type: "back", mode: l, ...c[0] !== void 0 && { overshoot: c[0] } };
    return { easing: h, fn: U(h) };
  }
  return e in Oe ? { easing: Oe[e] } : e in St ? { easing: { type: "cubic-bezier", points: St[e] } } : { easing: "ease-out" };
}
const _i = /* @__PURE__ */ new Map();
function ge(i, t) {
  return _i.set(
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
const Ii = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function Ri(i) {
  return typeof i == "string" && Ii.test(i);
}
function ps(i = 1) {
  let t = ae(i);
  const e = (c, l) => ((...h) => h.length >= c ? l(...h) : (f) => l(...h, f)), n = (c, l, h) => Math.min(Math.max(h, Math.min(c, l)), Math.max(c, l)), s = (c, l, h, f, u) => l === c ? h : h + (u - c) / (l - c) * (f - h), r = (c, l) => {
    if (typeof c == "number") return c === 0 ? l : Math.round(l / c) * c;
    if (Array.isArray(c)) return Ne(c, l, 1 / 0);
    if ("values" in c) return Ne(c.values, l, c.radius ?? 1 / 0);
    const h = Math.round(l / c.increment) * c.increment;
    return Math.abs(h - l) <= (c.radius ?? 1 / 0) ? h : l;
  }, o = (c, l, h) => {
    const f = c + t() * (l - c);
    return h ? Math.round(f / h) * h : f;
  };
  return {
    clamp: e(3, n),
    mapRange: e(5, s),
    normalize: e(3, (c, l, h) => s(c, l, 0, 1, h)),
    interpolate: e(3, (c, l, h) => {
      if (typeof c == "object" && !Array.isArray(c)) {
        const f = {};
        for (const u of Object.keys(c))
          f[u] = It(c[u])(c[u], l[u], h);
        return f;
      }
      return It(c)(c, l, h);
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
      const g = p.length, v = pe(d, g, { ...l !== void 0 ? { amount: l } : { each: h ?? 1 }, from: f }), b = l !== void 0 ? l : (h ?? 1) * ui(g, f), T = u && b > 0 ? u(v / b) * b : v;
      return c + T;
    },
    pipe: (...c) => (l) => c.reduce((h, f) => f(h), l),
    splitColor: (c) => ms(c),
    getUnit: (c) => typeof c == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(c.trim())?.[1] ?? "",
    seed: (c) => {
      t = ae(c);
    },
    resolveRandomString: (c) => {
      const l = Ii.exec(c)?.[1] ?? "";
      if (l.startsWith("[")) {
        const m = l.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean).map((p) => Number.isFinite(Number(p)) ? Number(p) : p.replace(/^['"]|['"]$/g, ""));
        return m[Math.floor(t() * m.length)];
      }
      const [h, f, u] = l.split(",").map((d) => Number.parseFloat(d));
      return o(h, f, Number.isFinite(u) ? u : void 0);
    }
  };
}
function Ne(i, t, e) {
  let n = t, s = 1 / 0;
  for (const r of i) {
    const o = Math.abs(r - t);
    o < s && (s = o, n = r);
  }
  return s <= e ? n : t;
}
function ms(i) {
  const t = i.trim(), e = /^#([0-9a-f]{3,8})$/i.exec(t)?.[1];
  if (e) {
    const r = (e.length <= 4 ? [...e].map((o) => o + o).join("") : e).match(/../g).map((o) => Number.parseInt(o, 16));
    return r.length >= 4 ? [r[0], r[1], r[2], Math.round(r[3] / 255 * 1e3) / 1e3] : [r[0], r[1], r[2]];
  }
  const n = (/rgba?\(([^)]+)\)/i.exec(t)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((s) => Number.parseFloat(s));
  return n.length >= 4 ? [n[0], n[1], n[2], n[3]] : [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0];
}
const gs = /^([+-])=\s*(-?[\d.]+)$/, ys = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function ht(i, t) {
  const e = t.scale ?? 1, n = (l) => Number.parseFloat(l) * e;
  if (i === void 0) return t.cursor;
  if (typeof i == "number") return i * e;
  const s = i.trim();
  if (s === "") return t.cursor;
  const r = gs.exec(s);
  if (r) {
    const l = n(r[2]);
    return t.cursor + (r[1] === "-" ? -l : l);
  }
  const o = ys.exec(s);
  if (o) {
    const l = o[1] === "<" ? t.previousStart : t.previousEnd;
    if (o[3] === void 0) return l;
    const h = n(o[3]);
    return l + (o[2] === "-" ? -h : h);
  }
  const a = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(s);
  if (a) {
    const l = t.labels.get(a[1].trim());
    if (l !== void 0) {
      const h = n(a[3]);
      return l + (a[2] === "-" ? -h : h);
    }
  }
  const c = t.labels.get(s);
  return c !== void 0 ? c : /^-?[\d.]+$/.test(s) ? n(s) : t.cursor;
}
function bs(i) {
  if (typeof i != "object" || i === null) return !1;
  const t = i;
  return t.grid !== void 0 || t.from === "random" || Array.isArray(t.from) || t.ease !== void 0 || t.axis !== void 0;
}
function vs(i, t, e = {}) {
  if (i === 0) return [];
  const n = t.grid === "auto" ? Math.max(1, Math.min(i, e.columnsFromLayout?.() ?? i)) : Array.isArray(t.grid) ? Math.max(1, t.grid[1]) : i, s = Array.isArray(t.grid) ? Math.max(1, t.grid[0]) : Math.ceil(i / n), r = (m) => ({ x: m % n, y: Math.floor(m / n) }), o = t.from ?? "start", a = Array.isArray(o) ? { x: o[0] * (n - 1), y: o[1] * (s - 1) } : typeof o == "number" ? r(Math.max(0, Math.min(i - 1, o))) : o === "end" ? r(i - 1) : o === "center" || o === "edges" ? { x: (n - 1) / 2, y: (s - 1) / 2 } : { x: 0, y: 0 }, c = (m) => {
    const { x: p, y: g } = r(m), y = Math.abs(p - a.x), v = Math.abs(g - a.y);
    return t.axis === "x" ? y : t.axis === "y" ? v : Math.hypot(y, v);
  };
  let l = Array.from({ length: i }, (m, p) => c(p));
  const h = Math.max(...l);
  if (o === "edges" && (l = l.map((m) => h - m)), o === "random") {
    const m = e.random ?? Math.random;
    l = l.map(() => m() * h);
  }
  const f = t.amount !== void 0 ? t.amount : (t.each ?? 0) * h, u = t.ease ? Rt(t.ease) : void 0, d = u ? u.fn ?? U(u.easing) : void 0;
  return l.map((m) => {
    const p = h === 0 ? 0 : m / h;
    return (d ? d(p) : p) * f;
  });
}
const ye = /* @__PURE__ */ new Set([
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
function Et(i) {
  const t = {}, e = {};
  for (const [n, s] of Object.entries(i))
    ye.has(n) ? t[n] = s : e[n] = s;
  return { config: t, properties: e };
}
function Lt(i, t) {
  return i === void 0 ? t : i * 1e3;
}
function ce(i, t) {
  if (i !== void 0)
    return typeof i == "number" ? { each: i * 1e3 } : bs(i) ? { offsets: vs(t?.count ?? 0, i, t ?? {}).map((n) => n * 1e3) } : {
      ...i.each !== void 0 && { each: i.each * 1e3 },
      ...i.amount !== void 0 && { amount: i.amount * 1e3 },
      ...i.from !== void 0 && { from: i.from }
    };
}
const ws = {
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
function Li(i) {
  return ws[i];
}
function Ts(i) {
  const t = typeof i == "string" || Array.isArray(i) ? { path: i } : i;
  if (!t || typeof t.path != "string" && !Array.isArray(t.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let e;
  if (Array.isArray(t.path))
    e = us(t.path, { curviness: t.curviness });
  else if (wt(t.path))
    e = t.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${t.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const n = { pathData: e };
  return t.autoRotate !== void 0 && t.autoRotate !== !1 && (n.autoRotate = !0, typeof t.autoRotate == "number" && (n.rotateOffset = t.autoRotate)), t.matrix && (n.matrix = t.matrix), { config: n, start: t.start ?? 0, end: t.end ?? 1 };
}
function xs(i) {
  const t = typeof i == "string" || Array.isArray(i) ? { path: i } : { ...i };
  return { ...t, start: t.end ?? 1, end: t.start ?? 0 };
}
function $i(i) {
  return typeof i == "object" && i !== null && "shape" in i ? i.shape : i;
}
function ks(i) {
  if (i.morphSVG === void 0) return i;
  const { morphSVG: t, ...e } = i, n = $i(t);
  if (typeof n != "string" || !wt(n))
    throw new Error(
      `gsap-compat: morphSVG "${String(n)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...e, d: n };
}
function Ss(i, t) {
  if (i === !0) return [0, t];
  if (i === !1) return [0, 0];
  if (typeof i == "number") return [0, Be(i, t)];
  const e = i.trim().split(/[\s,]+/).filter(Boolean), n = (o) => {
    const a = Number.parseFloat(o);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${i}" is not a length or percentage`);
    return Be(o.endsWith("%") ? t * a / 100 : a, t);
  };
  if (e.length === 0) return [0, t];
  if (e.length === 1) return [0, n(e[0])];
  const s = n(e[0]), r = n(e[1]);
  return s <= r ? [s, r] : [r, s];
}
function Ms(i, t) {
  const [e, n] = Ss(i, t);
  return { strokeDasharray: [n - e, t], strokeDashoffset: -e };
}
function As(i, t) {
  if (i.drawSVG === void 0) return i;
  const { drawSVG: e, ...n } = i;
  return { ...n, ...Ms(e, t) };
}
function Es(i) {
  if (i.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return i;
}
function Be(i, t) {
  return Math.max(0, Math.min(t, i));
}
function Ps(i) {
  let t = 2166136261;
  for (let e = 0; e < i.length; e++) t = Math.imul(t ^ i.charCodeAt(e), 16777619);
  return t >>> 0;
}
function Cs(i, t, e) {
  if (i.scrambleText !== void 0) {
    const n = i.scrambleText, s = typeof n == "string" ? { text: n } : n;
    if (typeof s?.text != "string")
      throw new Error("gsap-compat: scrambleText needs the text to end on — a string, or { text }.");
    const r = s.revealDelay && e > 0 ? s.revealDelay * 1e3 / e : void 0;
    return {
      to: s.text,
      mode: "scramble",
      ...s.chars !== void 0 && { chars: s.chars },
      ...s.speed !== void 0 && { refreshRate: 20 * s.speed },
      ...r !== void 0 && { revealDelay: Math.min(r, 0.999) },
      ...s.tweenLength !== void 0 && { tweenLength: s.tweenLength },
      ...s.rightToLeft !== void 0 && { rightToLeft: s.rightToLeft },
      seed: s.seed ?? Ps(`${t}|${s.text}`)
    };
  }
  if (i.text !== void 0) {
    const n = i.text, s = typeof n == "string" ? { value: n } : n;
    if (typeof s?.value != "string")
      throw new Error("gsap-compat: text needs the text to end on — a string, or { value }.");
    return {
      to: s.value,
      mode: "type",
      ...s.rightToLeft !== void 0 && { rightToLeft: s.rightToLeft }
    };
  }
}
function be(i) {
  return Math.max(0.1, i / 25);
}
function _s(i, t) {
  const e = typeof t == "number" ? { velocity: t } : t;
  if (typeof e?.velocity != "number" || !Number.isFinite(e.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const n = e.friction ?? (e.resistance !== void 0 ? be(e.resistance) : void 0), s = {
    from: i,
    velocity: e.velocity,
    ...n !== void 0 && { friction: n },
    ...e.min !== void 0 && { min: e.min },
    ...e.max !== void 0 && { max: e.max }
  };
  return typeof e.end == "function" ? s.end = [e.end(_t(s))] : e.end !== void 0 && (s.end = Array.isArray(e.end) ? [...e.end] : e.end), s;
}
function Is(i) {
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
function Rs(i, t) {
  if (i === !0 || typeof i == "string") return;
  const e = i.velocity;
  return typeof e == "number" ? e : e?.[t];
}
class nt {
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
    this.options = t, this.timeline = new ki({
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
  to(t, e, n) {
    return this.build(t, void 0, ut(e), n);
  }
  /** Animate from the given values to where the property already is. */
  from(t, e, n) {
    const { config: s, properties: r } = Et(ut(e)), { motionPath: o, text: a, scrambleText: c, ...l } = r, h = this.targetsOf(t)[0], f = { ...s };
    for (const m of Object.keys(l))
      f[m] = this.resolveStart(h, m);
    o !== void 0 && (f.motionPath = xs(o));
    const u = {}, d = String(this.resolveStart(h, "text"));
    return a !== void 0 && (u.text = Kt(a), f.text = typeof a == "object" ? { ...a, value: d } : d), c !== void 0 && (u.text = Kt(c), f.scrambleText = typeof c == "object" ? { ...c, text: d } : d), this.build(t, { ...l, ...u }, f, n);
  }
  /** Animate between two explicit sets of values. */
  fromTo(t, e, n, s) {
    const { properties: r } = Et(ut(e));
    return this.build(t, r, ut(n), s);
  }
  /** Set values instantly — a single held keyframe. */
  set(t, e, n) {
    return this.build(t, void 0, { ...ut(e), duration: 0 }, n);
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
    const n = ht(e, this.context());
    for (const r of t.timeline.tracks) {
      if (!("keyframes" in r)) continue;
      const o = oe({
        ...r,
        id: this.nextTrackId(`nested-${r.id}`),
        keyframes: r.keyframes.map((a) => ({ ...a, time: a.time + n }))
      });
      this.timeline.addTrack(o);
    }
    const s = n + t.timeline.duration;
    return this.previousStart = n, this.previousEnd = s, this.cursor = Math.max(this.cursor, s), this;
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
  build(t, e, n, s) {
    const { config: r, properties: o } = Et(n), { motionPath: a, text: c, scrambleText: l, inertia: h, ...f } = o, u = this.targetsOf(t), d = ht(s, this.context()), m = Lt(r.delay, 0), p = Lt(r.duration, 500), g = ce(r.stagger, {
      count: u.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(u) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), y = this.easingFor(r.ease), v = [], b = r.spring;
    let T = 0, w = !1;
    for (const [k, P] of Object.entries(f)) {
      const E = P;
      let C = e?.[k] !== void 0 ? e[k] : this.resolveStart(u[0], k);
      if (typeof C != typeof E && (this.warn(
        `no usable start value for "${k}" on "${u[0]}" — it will snap to ${String(E)}. Use fromTo() to animate it.`
      ), C = E), b !== void 0 && (typeof C != "number" || typeof E != "number") && this.warn(`spring works on numbers, so "${k}" on "${u[0]}" eases instead`), b !== void 0 && typeof C == "number" && typeof E == "number") {
        const L = {
          ...Is(b),
          from: C,
          to: E,
          velocity: Rs(b, k) ?? this.options.startVelocity?.(u[0], k) ?? 0
        }, N = this.nextTrackId(`${u[0]}-${k}-spring`), O = {
          id: N,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: k,
          kind: "spring",
          spring: L,
          delay: d + m
        };
        this.timeline.addTrack(O), v.push(N), T = Math.max(T, Ji(L));
        for (const R of u) this.lastValues.set(`${R}|${k}`, E);
        continue;
      }
      w = !0;
      const M = this.keyframesFor(C, E, p, y, r.ease), I = this.nextTrackId(`${u[0]}-${k}`);
      this.timeline.addTrack(
        oe({
          id: I,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: k,
          delay: d + m,
          keyframes: M
        })
      ), v.push(I);
      for (const L of u) this.lastValues.set(`${L}|${k}`, E);
    }
    const x = Cs({ text: c, scrambleText: l }, u[0], p);
    if (x) {
      const k = e?.text ?? e?.scrambleText, P = k !== void 0 ? Kt(k) : this.resolveStart(u[0], "text"), E = this.nextTrackId(`${u[0]}-text`), C = {
        id: E,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...g && u.length > 1 && { stagger: g },
        property: "text",
        textConfig: { from: typeof P == "string" ? P : String(P ?? ""), ...x },
        delay: d + m,
        keyframes: this.keyframesFor(0, 1, p, y, r.ease)
      };
      this.timeline.addTrack(C), v.push(E);
      for (const M of u) this.lastValues.set(`${M}|text`, x.to);
    }
    if (a !== void 0) {
      const { config: k, start: P, end: E } = Ts(a), C = this.nextTrackId(`${u[0]}-motionPath`), M = {
        id: C,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...g && u.length > 1 && { stagger: g },
        property: "motionPath",
        motionPathConfig: k,
        delay: d + m,
        keyframes: this.keyframesFor(P, E, p, y, r.ease)
      };
      this.timeline.addTrack(M), v.push(C);
    }
    if (h !== void 0)
      for (const [k, P] of Object.entries(h)) {
        const E = this.resolveStart(u[0], k);
        if (typeof E != "number") {
          this.warn(`inertia on "${k}" needs a numeric start value; skipped`);
          continue;
        }
        const C = _s(E, P), M = this.nextTrackId(`${u[0]}-${k}-inertia`), I = {
          id: M,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: k,
          kind: "inertia",
          inertia: C,
          delay: d + m
        };
        this.timeline.addTrack(I), v.push(M), T = Math.max(T, vt(C));
        for (const L of u) this.lastValues.set(`${L}|${k}`, bt(C));
      }
    const D = ((h !== void 0 || b !== void 0) && !w && !x && a === void 0 ? T : Math.max(p, T)) + (g && u.length > 1 ? Dt(u.length, g) : 0), A = d + m + D;
    return this.previousStart = d + m, this.previousEnd = A, this.cursor = Math.max(this.cursor, A), {
      trackIds: v,
      start: d + m,
      end: A,
      kill: () => {
        for (const k of v) this.timeline.removeTrack(k);
      }
    };
  }
  /**
   * Two keyframes, or a baked sequence when the ease has no closed form.
   */
  keyframesFor(t, e, n, s, r) {
    const o = { time: 0, value: t };
    if (n <= 0)
      return [{ time: 0, value: e }];
    const a = typeof r == "string" ? Rt(r) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && Pt(s)) {
      const l = a?.fn ?? U(s);
      return [o, ...Ti(o, { time: n, value: e }, l, { intervalMs: this.options.bakeIntervalMs })];
    }
    return [o, { time: n, value: e, ...s && { easing: s } }];
  }
  /** Resolve a start value through the documented chain. */
  resolveStart(t, e) {
    const n = this.lastValues.get(`${t}|${e}`);
    if (n !== void 0) return n;
    const s = this.options.startValue?.(t, e);
    if (s !== void 0) return s;
    const r = this.options.defaults?.[e];
    if (r !== void 0) return r;
    if (e === "text") return "";
    if (e === "d")
      throw new Error(
        `gsap-compat: no starting shape for "${t}". Use fromTo({ d: … }, { morphSVG: … }), or live.to(), which reads the element's current shape.`
      );
    const o = Li(e);
    return o !== void 0 ? (this.warn(
      `no start value for "${e}" on "${t}" — using the static default ${o}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), o) : (this.warn(`no start value or default for "${e}" on "${t}" — using 0`), 0);
  }
  easingFor(t) {
    if (t !== void 0) {
      if (typeof t == "string") return Rt(t).easing;
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
function Ls(i) {
  return new nt(i);
}
function ut(i) {
  return Es(ks(i));
}
const $s = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), Fs = "#ffffff", Ds = "rgba(0, 0, 0, 0.5)";
function Os(i) {
  const t = [];
  if (i.blur !== void 0 && t.push(`blur(${Math.max(0, i.blur)}px)`), i.brightness !== void 0 && t.push(`brightness(${Math.max(0, i.brightness)})`), i.glow !== void 0 && t.push(`drop-shadow(0 0 ${Math.max(0, i.glow)}px ${i.glowColor ?? Fs})`), i.shadowX !== void 0 || i.shadowY !== void 0 || i.shadowBlur !== void 0) {
    const e = i.shadowX ?? 0, n = i.shadowY ?? 0, s = Math.max(0, i.shadowBlur ?? 0);
    t.push(`drop-shadow(${e}px ${n}px ${s}px ${i.shadowColor ?? Ds})`);
  }
  return t.length > 0 ? t.join(" ") : null;
}
function Ns(i, t) {
  const e = i.childNodes.length === 1 ? i.firstChild : null;
  if (e && e.nodeType === 3) {
    const n = e;
    n.data !== t && (n.data = t);
    return;
  }
  i.textContent !== t && (i.textContent = t);
}
function Bs(i) {
  if (!("ownerSVGElement" in i)) return;
  const t = i.style;
  !t || t.transformBox || (t.transformBox = "fill-box", t.transformOrigin || (t.transformOrigin = "50% 50%"));
}
const qe = /* @__PURE__ */ new Set([
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
]), qs = /* @__PURE__ */ new Set([
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
]), Xs = /* @__PURE__ */ new Set(["originX", "originY"]), Ys = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), Vs = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, Xe = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, Ws = "http://www.w3.org/2000/svg";
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
    for (const [e, n] of t.values) {
      const s = this.targets.get(e);
      s && this.applyProperties(s, n);
    }
  }
  /**
   * Apply properties to a single element.
   */
  applyProperties(t, e) {
    const n = [];
    let s = null, r = null, o = null;
    const a = e.has("motionPathX"), c = e.has("motionPathY"), l = e.has("motionPathRotate");
    for (const [u, d] of e)
      if (!(u === "x" && a) && !(u === "y" && c) && !((u === "rotate" || u === "rotateZ") && l)) {
        if (qs.has(u)) {
          const m = this.buildTransformPart(u, d);
          m && n.push(m);
        } else if (Xs.has(u))
          typeof d == "number" && ((s ??= {})[u] = d);
        else if (Ys.has(u))
          typeof d == "number" && ((r ??= {})[u] = d);
        else if ($s.has(u))
          (o ??= {})[u] = d;
        else if (u !== "perspective") {
          if (u !== "shine") if (u === "text" && typeof d == "string")
            Ns(t, d);
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
    if (typeof f == "number" && n.unshift(`perspective(${f}px)`), n.length > 0 && (t.style.transform = n.join(" "), Bs(t)), s) {
      const u = s.originX ?? 50, d = s.originY ?? 50;
      t.style.transformOrigin = `${u}% ${d}%`;
    }
    if (r) {
      const u = r.clipTop ?? 0, d = r.clipRight ?? 0, m = r.clipBottom ?? 0, p = r.clipLeft ?? 0;
      t.style.clipPath = `inset(${u}% ${d}% ${m}% ${p}%)`;
    }
    if (o) {
      const u = Os(o);
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
    const n = t.dataset.shineBase, s = -20 + e * 140, r = t.style;
    r.color = "transparent", r.backgroundImage = `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.9) 50%, transparent 60%), linear-gradient(${n}, ${n})`, r.backgroundSize = "250% 100%, 100% 100%", r.backgroundPosition = `${s}% 0, 0 0`, r.backgroundRepeat = "no-repeat", r.webkitBackgroundClip = "text", r.backgroundClip = "text";
  }
  /**
   * Apply a single style property to an element.
   */
  applyStyleProperty(t, e, n) {
    let s;
    if (t.namespaceURI === Ws && e in Xe) {
      const a = Array.isArray(n) ? n.join(", ") : String(n);
      t.style[Xe[e]] = a;
      return;
    } else e === "fill" && t.dataset?.elementType === "text" ? s = "color" : s = Vs[e] ?? e;
    let o;
    typeof n == "number" ? qe.has(e) || qe.has(s) ? o = `${n}px` : o = String(n) : Array.isArray(n) ? o = n.join(", ") : o = n, t.style[s] = o;
  }
}
const js = {
  request: (i) => requestAnimationFrame(i),
  cancel: (i) => cancelAnimationFrame(i)
};
class Us {
  adapter = new K();
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
  utils = ps();
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
    this.scheduler = t.scheduler ?? js, this.rootOption = t.root, this.onWarning = t.onWarning;
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
    for (const n of this.targetsOf(t)) {
      const s = this.nameFor(n);
      Zt(n) && this.currentCollector?.touch(n, s), e.push(s);
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
    for (const s of [...this.active.keys()].reverse()) {
      if (s.getTracks({ target: t, property: e }).length === 0) continue;
      const r = s.currentTime;
      if (r < 4) return 0;
      const o = s.getStateAtTime(r).values.get(t)?.get(e), a = s.getStateAtTime(r - 4).values.get(t)?.get(e);
      if (typeof o != "number" || typeof a != "number") return;
      const c = (o - a) / 4;
      return (s.direction === "reverse" ? -c : c) * 1e3;
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
    this.destroyed || (t.onUpdate = (n) => this.write(n), this.active.delete(t), this.active.set(t, e), this.startLoop());
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
    const n = new Map(Object.entries(e));
    this.write({ values: /* @__PURE__ */ new Map([[t, n]]), currentTime: 0, playbackState: "idle", direction: "forward", loopIteration: 0 }), this.flush();
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
    for (const [n] of e)
      n.duration <= 0 ? (this.write(n.getStateAtTime(0)), n.stop()) : n.tick(t);
    this.flush();
    for (const [n, s] of e)
      s.onUpdate?.(), n.playbackState !== "playing" && this.active.get(n) === s && this.active.delete(n);
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
    for (const [e, n] of t.values) {
      let s = this.applied.get(e);
      s || (s = /* @__PURE__ */ new Map(), this.applied.set(e, s));
      for (const [r, o] of n) s.set(r, o);
      this.dirty.add(e);
    }
  }
  flush() {
    if (this.dirty.size === 0) return;
    const t = /* @__PURE__ */ new Map();
    for (const e of this.dirty) {
      const n = this.applied.get(e), s = this.objects.get(e);
      if (s)
        for (const [r, o] of n) s[r] = o;
      else
        t.set(e, n);
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
    if (!zs(t)) return [t];
    const e = [];
    for (const n of Array.from(t))
      e.push(...this.targetsOf(n));
    return e;
  }
  nameFor(t) {
    return Zt(t) ? this.elementName(t) : this.objectName(t);
  }
  objectName(t) {
    const e = this.objectNames.get(t);
    if (e) return e;
    let n;
    do
      this.nameCounter += 1, n = `obj-${this.nameCounter}`;
    while (this.objects.has(n) || this.elements.has(n));
    return this.objectNames.set(t, n), this.objects.set(n, t), n;
  }
  elementName(t) {
    const e = this.names.get(t);
    if (e) return e;
    let n = t.id ? `#${t.id}` : "";
    if (!n || this.elements.has(n))
      do
        this.nameCounter += 1, n = `el-${this.nameCounter}`;
      while (this.elements.has(n));
    return this.names.set(t, n), this.elements.set(n, t), this.adapter.registerTarget(n, t), n;
  }
}
function Zt(i) {
  return typeof i == "object" && i !== null && i.nodeType === 1;
}
function zs(i) {
  if (Array.isArray(i)) return !0;
  const t = i;
  return typeof t.length == "number" && typeof t.item == "function";
}
function $t(i) {
  const t = i.style;
  if (!t) return i.getBoundingClientRect();
  const e = t.transform;
  t.transform = "none";
  const n = i.getBoundingClientRect();
  return t.transform = e, n;
}
const Ye = (i) => typeof i == "object" && i !== null && i.nodeType === 1;
function Hs(i) {
  const t = {};
  for (const e of Array.from(i.attributes)) t[e.name] = e.value;
  return t;
}
function Gs(i) {
  const t = i.getScreenCTM?.();
  if (t) return [t.a, t.b, t.c, t.d, t.e, t.f];
  const e = i.getBoundingClientRect();
  return [1, 0, 0, 1, e.left, e.top];
}
function Ks(i, t) {
  const e = typeof i == "string" || Array.isArray(i) || Ye(i) ? { path: i } : i, { align: n, alignOrigin: s, path: r, ...o } = e, a = (x) => {
    const S = Ye(x) ? x : t.query(x);
    return S || t.warn(`gsap-compat: motionPath could not find "${String(x)}"`), S;
  };
  let c = null, l = "";
  if (Array.isArray(r) || typeof r == "string" && wt(r))
    l = r;
  else {
    c = a(r);
    const x = c && me({ tag: c.localName, attributes: Hs(c) });
    c && !x && t.warn(`gsap-compat: motionPath element <${c.localName}> has no path geometry`), l = x ?? "";
  }
  const h = { ...o, path: l };
  if (n === void 0 || n === !1) return h;
  const f = n === !0 ? c : a(n);
  if (!f)
    return n === !0 && t.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const u = t.targets[0];
  if (!u) return h;
  const [d, m, p, g, y, v] = Gs(f), b = $t(u), [T, w] = s ?? [0.5, 0.5];
  for (const x of t.targets.slice(1)) {
    const S = $t(x);
    if (Math.abs(S.left - b.left) > 0.5 || Math.abs(S.top - b.top) > 0.5) {
      t.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [d, m, p, g, y - b.left - T * b.width, v - b.top - w * b.height], h;
}
const Fi = (i) => typeof i == "object" && i !== null && i.nodeType === 1;
function Di(i) {
  const t = {};
  for (const e of Array.from(i.attributes)) t[e.name] = e.value;
  return t;
}
function Oi(i) {
  if (!i) return null;
  const t = me({ tag: i.localName, attributes: Di(i) });
  return t || (i.querySelector("path")?.getAttribute("d") ?? null);
}
function Zs(i, t, e) {
  const n = $i(i);
  if (typeof n == "string" && wt(n)) return n;
  const s = Fi(n) ? n : typeof n == "string" ? t(n) : null, r = Oi(s);
  return r || (e(`gsap-compat: morphSVG could not find a shape for "${String(n)}"`), "");
}
const Qs = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function Js(i, t = document) {
  return (typeof i == "string" ? Array.from(t.querySelectorAll(i)) : Fi(i) ? [i] : Array.from(i)).map((n) => {
    if (n.localName === "path") return n;
    const s = me({ tag: n.localName, attributes: Di(n) });
    if (!s || !n.parentNode) return n;
    const r = n.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const o of Array.from(n.attributes))
      Qs.has(o.name) || r.setAttribute(o.name, o.value);
    return r.setAttribute("d", s), n.parentNode.replaceChild(r, n), r;
  });
}
const Ve = 0.3;
class tr {
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
  begin(t, e, n) {
    this.dragging = !0, this.passedTolerance = !1, this.startX = t, this.startY = e, this.lastX = t, this.lastY = e, this.velocityX = 0, this.velocityY = 0, this.lastTime = We(), this.options.onPress?.(this.stateFrom(0, 0, n));
  }
  move(t, e, n) {
    if (!this.dragging) return;
    const s = t - this.lastX, r = e - this.lastY;
    this.lastX = t, this.lastY = e;
    const o = t - this.startX, a = e - this.startY, c = this.options.tolerance ?? 3;
    if (!this.passedTolerance) {
      if (Math.hypot(o, a) < c) return;
      this.passedTolerance = !0;
    }
    this.updateVelocity(s, r), this.options.preventDefault !== !1 && n.cancelable && n.preventDefault(), this.options.onMove?.(this.stateFrom(s, r, n));
  }
  end(t) {
    this.dragging && (this.dragging = !1, this.options.onRelease?.(this.stateFrom(0, 0, t)));
  }
  updateVelocity(t, e) {
    const n = We(), s = Math.max(1, n - this.lastTime);
    this.lastTime = n;
    const r = t / s * 1e3, o = e / s * 1e3;
    this.velocityX += (r - this.velocityX) * Ve, this.velocityY += (o - this.velocityY) * Ve;
  }
  stateFrom(t, e, n) {
    return {
      deltaX: t,
      deltaY: e,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      totalX: this.lastX - this.startX,
      totalY: this.lastY - this.startY,
      isDragging: this.dragging,
      event: n
    };
  }
  // --- listeners ----------------------------------------------------------
  onPointerDown = (t) => {
    const e = t, n = this.target;
    if (typeof e.pointerId == "number" && typeof n.setPointerCapture == "function")
      try {
        n.setPointerCapture(e.pointerId);
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
function We() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function er(i, t, e) {
  let n = { delta: 0, line: null }, s = e;
  for (const r of i)
    for (const o of t) {
      const a = Math.abs(o - r);
      a <= s && (s = a, n = { delta: o - r, line: o });
    }
  return n;
}
function ir(i, t) {
  return t <= 0 ? [] : i.map((e) => Math.round(e / t) * t);
}
class Ni {
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
    this.options = t, this.x = t.initialX ?? 0, this.y = t.initialY ?? 0, this.observer = new tr({
      target: t.target,
      onPress: (e) => {
        const n = t.getPosition?.();
        n && (this.x = n.x, this.y = n.y), this.originX = this.x, this.originY = this.y, t.onPress?.(e);
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
    const n = this.options.axis ?? "both";
    this.x = n === "y" ? this.x : this.applyConstraints(t, "x"), this.y = n === "x" ? this.y : this.applyConstraints(e, "y");
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
    const n = this.options.scrubDistance ?? 500;
    if (n === 0) return;
    const s = (this.options.axis ?? "both") === "y" ? this.y : this.x, r = nr(s / n);
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
    let n = t;
    const s = [
      ...ir([n], this.options.snap ?? 0),
      ...(e === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], r = er([n], s, this.snapThreshold());
    n += r.delta, e === "x" ? this.snappedX = r.line : this.snappedY = r.line;
    const o = this.options.bounds;
    if (o) {
      const a = e === "x" ? o.minX : o.minY, c = e === "x" ? o.maxX : o.maxY;
      a !== void 0 && (n = Math.max(a, n)), c !== void 0 && (n = Math.min(c, n));
    }
    return n;
  }
}
function nr(i) {
  return i < 0 ? 0 : i > 1 ? 1 : i;
}
function qo(i) {
  const t = new Ni(i);
  return t.start(), t;
}
const sr = { x: "x", y: "y", "x,y": "both" }, le = (i) => typeof i == "object" && i !== null && i.nodeType === 1;
function je(i, t) {
  const e = $t(i), n = t.getBoundingClientRect();
  return {
    minX: n.left - e.left,
    maxX: n.right - e.right,
    minY: n.top - e.top,
    maxY: n.bottom - e.bottom
  };
}
function Ue(i) {
  return Array.isArray(i) ? [...i] : i;
}
function rr(i, t, e, n = {}) {
  const [s] = t.resolveTargets(e), r = s ? t.elementFor(s) : void 0;
  if (!s || !r)
    throw new Error(`gsap-compat: live.draggable could not find ${String(e)}`);
  if (n.type === "rotation") return or(i, t, s, r, n);
  const o = sr[n.type ?? "x,y"], a = () => {
    const p = t.appliedValue(s, "x"), g = t.appliedValue(s, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof g == "number" ? g : 0 };
  }, c = typeof n.bounds == "string" ? t.query(n.bounds) : le(n.bounds) ? n.bounds : null, h = { bounds: (!c && n.bounds && !le(n.bounds) ? n.bounds : void 0) ?? (c ? je(r, c) : void 0) };
  let f = null;
  const u = () => {
    f?.kill(), f = null;
  }, d = (p) => {
    const g = n.inertia === !0 ? {} : n.inertia, y = g.friction ?? (g.resistance !== void 0 ? be(g.resistance) : 4), v = a(), b = h.bounds ?? {};
    let T, w;
    const x = g.end;
    if (Array.isArray(x)) {
      const _ = _t({ from: v.x, velocity: o === "y" ? 0 : p.x, friction: y }), D = _t({ from: v.y, velocity: o === "x" ? 0 : p.y, friction: y });
      let A = x[0];
      for (const k of x)
        Math.hypot(k.x - _, k.y - D) < Math.hypot(A.x - _, A.y - D) && (A = k);
      A && (T = [A.x], w = [A.y]);
    } else typeof x == "number" ? (T = x, w = x) : x && (T = Ue(x.x), w = Ue(x.y));
    const S = {};
    o !== "y" && (S.x = { velocity: p.x, friction: y, min: b.minX, max: b.maxX, end: T }), o !== "x" && (S.y = { velocity: p.y, friction: y, min: b.minY, max: b.maxY, end: w }), f = i.to(r, { inertia: S, onComplete: () => n.onThrowComplete?.() });
  }, m = new Ni({
    target: r,
    axis: o,
    snap: n.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: a,
    onPress: () => {
      u(), c && (h.bounds = je(r, c)), n.onPress?.();
    },
    onDrag: (p) => {
      t.apply(s, o === "x" ? { x: p.x } : o === "y" ? { y: p.y } : { x: p.x, y: p.y }), n.onDrag?.(p);
    },
    onRelease: () => {
      const p = m.velocity;
      n.onRelease?.(p), n.inertia && d(p);
    }
  });
  return m.start(), {
    draggable: m,
    get position() {
      return a();
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
function or(i, t, e, n, s) {
  const r = typeof s.bounds == "object" && s.bounds !== null && !le(s.bounds) ? s.bounds : {}, o = () => {
    const b = t.appliedValue(e, "rotate");
    return typeof b == "number" ? b : 0;
  }, a = (b) => Math.min(r.maxRotation ?? 1 / 0, Math.max(r.minRotation ?? -1 / 0, b));
  let c = null, l = !1, h, f = { x: 0, y: 0 }, u = 0, d = 0, m = [];
  const p = (b) => Math.atan2(b.clientY - f.y, b.clientX - f.x) * 180 / Math.PI, g = (b) => {
    if (l) return;
    c?.kill(), c = null, l = !0, h = b.pointerId, n.setPointerCapture?.(b.pointerId);
    const T = n.getBoundingClientRect();
    f = { x: T.left + T.width / 2, y: T.top + T.height / 2 }, u = p(b), d = o(), m = [{ time: performance.now(), rotation: d }], s.onPress?.();
  }, y = (b) => {
    if (!l || b.pointerId !== h) return;
    const T = p(b);
    let w = T - u;
    w > 180 && (w -= 360), w < -180 && (w += 360), u = T, d += w;
    let x = a(d);
    s.snap && (x = a(Math.round(x / s.snap) * s.snap)), t.apply(e, { rotate: x });
    const S = performance.now();
    for (m.push({ time: S, rotation: x }); m.length > 2 && S - m[0].time > 100; ) m.shift();
    const _ = { x: 0, y: 0 };
    s.onDrag?.(_);
  }, v = (b) => {
    if (!l || b.pointerId !== h) return;
    l = !1;
    const T = m[0], w = m[m.length - 1], x = T && w ? (w.time - T.time) / 1e3 : 0, S = x > 0 ? (w.rotation - T.rotation) / x : 0;
    if (s.onRelease?.({ x: S, y: 0 }), !s.inertia) return;
    const _ = s.inertia === !0 ? {} : s.inertia, D = _.friction ?? (_.resistance !== void 0 ? be(_.resistance) : 4), A = typeof _.end == "number" || Array.isArray(_.end) ? _.end : void 0;
    c = i.to(n, {
      inertia: {
        rotate: {
          velocity: S,
          friction: D,
          min: r.minRotation,
          max: r.maxRotation,
          end: Array.isArray(A) ? A.filter((k) => typeof k == "number") : A
        }
      },
      onComplete: () => s.onThrowComplete?.()
    });
  };
  return n.addEventListener("pointerdown", g), n.addEventListener("pointermove", y), n.addEventListener("pointerup", v), n.addEventListener("pointercancel", v), n.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return o();
    },
    destroy() {
      c?.kill(), n.removeEventListener("pointerdown", g), n.removeEventListener("pointermove", y), n.removeEventListener("pointerup", v), n.removeEventListener("pointercancel", v);
    }
  };
}
const ar = { opacity: 0, scale: 0.6 };
function cr(i) {
  const t = i.getBoundingClientRect();
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function ze(i) {
  const t = $t(i);
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function he(i, t) {
  const n = i.resolveTargets(t).map((o) => i.elementFor(o)).filter((o) => !!o), s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of n) {
    const a = cr(o);
    s.set(o, a);
    const c = Bi(o);
    a && c !== void 0 && !r.has(c) && r.set(c, { element: o, box: a });
  }
  return { elements: n, boxes: s, ids: r };
}
const Qt = /* @__PURE__ */ new WeakMap();
function ue(i, t, e, n = {}) {
  const s = n.duration ?? 0.6, r = n.ease ?? "power2.inOut", o = n.stagger ?? 0, a = n.scale !== !1, c = n.enter === void 0 ? ar : n.enter, l = new Set(e.elements);
  if (n.targets !== void 0)
    for (const d of i.resolveTargets(n.targets)) {
      const m = i.elementFor(d);
      m && l.add(m);
    }
  const h = [...l].sort(
    (d, m) => d === m ? 0 : d.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), f = t({ onComplete: n.onComplete });
  let u = 0;
  for (const d of h) {
    const m = ze(d);
    if (!m) continue;
    let p = e.boxes.get(d) ?? null, g;
    const y = Bi(d), v = !p && y !== void 0 ? e.ids.get(y) : void 0;
    v && v.element !== d && (p = v.box, g = v.element);
    const [b] = i.resolveTargets(d);
    Qt.get(d)?.timeline.removeTracks({ target: b });
    const T = u * o;
    if (!p) {
      if (c === !1) continue;
      f.fromTo(d, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...c }, { ...qi(c), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: s, ease: r, delay: T }, 0), Qt.set(d, f), u++;
      continue;
    }
    const w = p.cx - m.cx, x = p.cy - m.cy, S = a ? p.width / m.width : 1, _ = a ? p.height / m.height : 1;
    if (!(Math.abs(w) > 0.5 || Math.abs(x) > 0.5 || Math.abs(S - 1) > 1e-3 || Math.abs(_ - 1) > 1e-3)) {
      const k = (P, E) => {
        const C = i.appliedValue(b, P);
        return typeof C == "number" && Math.abs(C - E) > 1e-6;
      };
      (k("x", 0) || k("y", 0) || k("scaleX", 1) || k("scaleY", 1)) && f.set(d, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const A = n.fade === !0 && g !== void 0;
    f.fromTo(
      d,
      { x: w, y: x, scaleX: S, scaleY: _, ...A && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...A && { opacity: 1 }, duration: s, ease: r, delay: T },
      0
    ), A && g && ze(g) && f.fromTo(g, { opacity: 1 }, { opacity: 0, duration: s, ease: r, delay: T }, 0), Qt.set(d, f), u++;
  }
  return f;
}
function Bi(i) {
  return i.dataset?.flipId;
}
function qi(i) {
  const t = {};
  for (const e of Object.keys(i))
    t[e] = e === "opacity" || e.startsWith("scale") ? 1 : 0;
  return t;
}
function lr(i, t = {}) {
  const e = new Set((t.type ?? "chars,words,lines").split(",").map((p) => p.trim())), n = {
    chars: t.charsClass ?? "char",
    words: t.wordsClass ?? "word",
    lines: t.linesClass ?? "line"
  }, s = t.aria !== !1, r = i.map((p) => ({
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
      const y = (g.textContent ?? "").replace(/\s+/g, " ").trim(), v = hr(g, n.words), b = e.has("chars") ? v.flatMap((x) => ur(x, n.chars)) : [], T = e.has("lines") ? dr(g, v, n.lines) : [];
      if (s) {
        !g.hasAttribute("aria-label") && y && g.setAttribute("aria-label", y);
        for (const x of v) x.setAttribute("aria-hidden", "true");
      }
      if (e.has("words")) p.words.push(...v);
      else for (const x of v) x.removeAttribute("class");
      p.chars.push(...b), p.lines.push(...T);
      const w = t.mask === "lines" ? T : t.mask === "words" ? v : t.mask === "chars" ? b : [];
      for (const x of w) p.masks.push(pr(x, `${n[t.mask]}-mask`));
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
      const b = () => {
        g = !1, d.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(b) : setTimeout(b, 0);
    };
    if (typeof ResizeObserver == "function") {
      c = new ResizeObserver((b) => {
        let T = !1;
        for (const w of b) {
          const x = Math.round(w.contentRect.width), S = p.get(w.target);
          p.set(w.target, x), S !== void 0 && S !== x && (T = !0);
        }
        T && y();
      });
      for (const b of i) c.observe(b);
    }
    const v = i[0]?.ownerDocument?.fonts;
    v && v.status !== "loaded" && v.ready.then(() => y());
  }
  return d;
}
function hr(i, t) {
  const e = i.ownerDocument, n = [], s = e.createTreeWalker(
    i,
    4
    /* NodeFilter.SHOW_TEXT */
  ), r = [];
  for (let o = s.nextNode(); o; o = s.nextNode()) r.push(o);
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
      h.className = t, h.style.display = "inline-block", h.textContent = l, c.appendChild(h), n.push(h);
    }
    o.replaceWith(c);
  }
  return n;
}
function ur(i, t) {
  const e = i.ownerDocument, n = fr(i.textContent ?? "").map((s) => {
    const r = e.createElement("span");
    return r.className = t, r.style.display = "inline-block", r.textContent = s, r;
  });
  return i.replaceChildren(...n), n;
}
function fr(i) {
  const t = Intl.Segmenter;
  return t ? Array.from(new t(void 0, { granularity: "grapheme" }).segment(i), (e) => e.segment) : Array.from(i);
}
function dr(i, t, e) {
  const n = i.ownerDocument, s = new Map(t.map((m) => [m, m.getBoundingClientRect()])), r = [], o = (m) => {
    for (const p of Array.from(m.childNodes))
      p.nodeType === 3 || s.has(p) || p.tagName === "BR" ? r.push(p) : o(p);
  };
  o(i);
  const a = [];
  let c = null, l = 0, h = 0, f = !1, u = [];
  const d = () => {
    c = n.createElement("span"), c.className = e, c.style.display = "block", a.push(c), u = [];
  };
  for (const m of r) {
    if (m.tagName === "BR") {
      f = !0;
      continue;
    }
    const p = s.get(m);
    if (p && (!c || f || p.top > l + h) && (d(), l = p.top, h = p.height / 2, f = !1), !c) continue;
    const g = [];
    for (let b = m.parentNode; b && b !== i; b = b.parentNode) g.unshift(b);
    let y = 0;
    for (; y < u.length && y < g.length && u[y].original === g[y]; ) y++;
    u.length = y;
    let v = y === 0 ? c : u[y - 1].clone;
    for (const b of g.slice(y)) {
      const T = b.cloneNode(!1);
      v.appendChild(T), u.push({ original: b, clone: T }), v = T;
    }
    v.appendChild(m);
  }
  return i.replaceChildren(...a), a;
}
function pr(i, t) {
  const e = i.ownerDocument.createElement("span");
  return e.className = t, e.style.display = i.style.display === "block" ? "block" : "inline-block", e.style.overflow = "clip", e.style.paddingBottom = "0.12em", e.style.marginBottom = "-0.12em", i.replaceWith(e), e.appendChild(i), e;
}
const He = {
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
function Ge(i) {
  const t = i.trim().toLowerCase();
  if (t in He) return He[t];
  if (t.endsWith("%")) {
    const e = Number.parseFloat(t.slice(0, -1));
    return Number.isNaN(e) ? void 0 : e / 100;
  }
}
function Xi(i) {
  if (typeof i == "number")
    return { elementFraction: 0, viewportFraction: 0, offsetPx: 0, absolutePx: i };
  let t = 0;
  const n = i.replace(/([+-])=\s*(-?[\d.]+)/g, (o, a, c) => (t += (a === "-" ? -1 : 1) * Number.parseFloat(c), "")).trim().split(/\s+/).filter(Boolean);
  if (n.length === 1 && /^-?[\d.]+$/.test(n[0]))
    return {
      elementFraction: 0,
      viewportFraction: 0,
      offsetPx: 0,
      absolutePx: Number.parseFloat(n[0]) + t
    };
  const s = n[0] !== void 0 ? Ge(n[0]) : void 0, r = n[1] !== void 0 ? Ge(n[1]) : void 0;
  return {
    elementFraction: s ?? 0,
    viewportFraction: r ?? 0,
    offsetPx: t
  };
}
function yt(i, t, e) {
  const n = Xi(e), s = n.absolutePx !== void 0 ? i.top + n.absolutePx : i.top + i.height * n.elementFraction, r = t * n.viewportFraction;
  return s - r + n.offsetPx;
}
function Xo(i, t, e, n) {
  const s = yt(i, t, e), o = yt(i, t, n) - s;
  return o <= 0 ? s <= 0 ? 1 : 0 : Yi(-s / o);
}
function Yi(i) {
  return i < 0 ? 0 : i > 1 ? 1 : i === 0 ? 0 : i;
}
function mr(i, t, e, n) {
  if (e <= 0) return t;
  const s = 1 - Math.exp(-(n / 1e3) / e);
  return i + (t - i) * s;
}
function Ke(i, t, e, n, s) {
  const r = (h) => yt({ top: i + s(h), bottom: i + s(h) + t, height: t }, e, n), o = r(0), a = r(1);
  if (Math.sign(o) === Math.sign(a) || o === 0 || a === 0)
    return o === 0 ? 0 : a === 0 ? 1 : Math.abs(o) < Math.abs(a) ? 0 : 1;
  let c = 0, l = 1;
  for (let h = 0; h < 40; h++) {
    const f = (c + l) / 2;
    Math.sign(r(f)) === Math.sign(o) ? c = f : l = f;
  }
  return (c + l) / 2;
}
class gr {
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
function Yo(i) {
  const t = new gr(i);
  return t.start(), t;
}
class yr {
  element;
  spacer;
  saved;
  axis;
  spacing;
  constructor(t, e = {}) {
    this.element = t, this.axis = e.axis ?? "y", this.spacing = e.spacing ?? !0;
    const n = t.ownerDocument;
    this.spacer = n.createElement("div"), this.spacer.className = "pin-spacer", this.saved = { position: t.style.position, top: t.style.top, left: t.style.left }, this.axis === "x" && (this.spacer.style.flexShrink = "0"), t.replaceWith(this.spacer), this.spacer.appendChild(t);
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
    const n = Math.max(0, e);
    this.element.style.position = "sticky", this.axis === "x" ? (this.spacer.style.width = `${this.element.offsetWidth + n}px`, this.spacer.style.marginRight = this.spacing ? "" : `-${n}px`, this.element.style.left = `${t}px`) : (this.spacer.style.height = `${this.element.offsetHeight + n}px`, this.spacer.style.marginBottom = this.spacing ? "" : `-${n}px`, this.element.style.top = `${t}px`);
  }
  /** Remove the spacer and restore the element's own styles. */
  destroy() {
    this.element.style.position = this.saved.position, this.element.style.top = this.saved.top, this.element.style.left = this.saved.left, this.spacer.parentNode && this.spacer.replaceWith(this.element);
  }
}
const br = 0.15;
function vr(i) {
  return typeof i == "object" && !Array.isArray(i) ? i : { snapTo: i };
}
function wr(i, t, e) {
  const n = Mt(i + t * br);
  if (typeof e == "function") return Mt(e(n));
  if (typeof e == "number")
    return e <= 0 ? i : Mt(Math.round(n / e) * e);
  if (e.length === 0) return i;
  let s = e[0];
  for (const r of e)
    Math.abs(r - n) < Math.abs(s - n) && (s = r);
  return Mt(s);
}
function Tr(i, t, e) {
  const n = i.duration ?? { min: 0.2, max: 0.8 };
  if (typeof n == "number") return n;
  const s = Math.min(1, Math.abs(t) / Math.max(1, e));
  return n.min + (n.max - n.min) * s;
}
class xr {
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
  animate(t, e, n, s = Bt, r) {
    if (this.cancel(), typeof requestAnimationFrame > "u" || n <= 0) {
      this.write(e), r?.();
      return;
    }
    for (const c of this.cancelEvents) this.eventTarget?.addEventListener(c, this.onInterrupt, { passive: !0 });
    let o = null;
    const a = (c) => {
      o ??= c;
      const l = Math.min(1, (c - o) / (n * 1e3));
      this.write(t + (e - t) * s(l)), l < 1 ? this.rafId = requestAnimationFrame(a) : (this.rafId = null, this.detach(), r?.());
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
function Mt(i) {
  return Math.max(0, Math.min(1, i));
}
class kr {
  options;
  scroller;
  nodes = [];
  scrollerStart;
  scrollerEnd;
  start;
  end;
  constructor(t, e, n) {
    this.options = n === !0 ? {} : n, this.scroller = e;
    const { startColor: s = "#3ecf7a", endColor: r = "#ff5a5a", id: o } = this.options, a = o ? `${o} ` : "", c = (l, h, f) => {
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
    this.scrollerStart = c("scroller-start", s, !e), this.scrollerEnd = c("scroller-end", r, !e), this.start = c("start", s, !1), this.end = c("end", r, !1), e && getComputedStyle(e).position === "static" && (e.style.position = "relative");
  }
  /** Place the markers for the latest measurement. */
  place(t, e) {
    this.start.style.top = `${t.startPage}px`, this.end.style.top = `${t.endPage}px`;
    const n = this.scroller ? e : 0;
    this.scrollerStart.style.top = `${n + t.startViewport}px`, this.scrollerEnd.style.top = `${n + t.endViewport}px`;
  }
  /** Keep the viewport lines in place inside a scrolling element. */
  follow(t, e) {
    this.scroller && this.place(t, e);
  }
  destroy() {
    for (const t of this.nodes.splice(0)) t.remove();
  }
}
const Sr = 120, et = [], ot = /* @__PURE__ */ new Set();
let Jt = !1;
const Mr = () => {
  Jt || ot.size === 0 || (Jt = !0, queueMicrotask(() => {
    Jt = !1;
    for (const i of ot) i.afterRefresh();
  }));
}, Vi = () => {
  for (const i of ot) i.beforeRefresh();
  for (const i of et) i.refresh();
  for (const i of ot) i.afterRefresh();
};
let it = { width: 0, height: 0 };
const Ze = () => {
  const i = window.innerWidth, t = window.innerHeight, e = i === it.width && t !== it.height, n = Math.abs(t - it.height) < it.height * 0.25, s = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  e && n && s || (it = { width: i, height: t }, Vi());
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
    this.timeline = t.timeline, this.options = t, this.snapper = new xr((e) => this.scrollTo(e), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const t = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    t && !this.options.container && (this.pin = new yr(t, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new kr(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), et.length === 0 && typeof window < "u" && (it = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", Ze, { passive: !0 })), et.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), et.splice(et.indexOf(this), 1), et.length === 0 && typeof window < "u" && window.removeEventListener("resize", Ze), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    Vi();
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
      const n = this.viewportHeight();
      if (this.startPx = t + yt(e, n, ft(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(e, n, t), this.pin) {
        const s = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(s.top - (this.startPx - t), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(n) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, t), this.lastScroll = null, this.updateFrom(t, !this.measured), this.measured = !0, Mr();
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
    const n = this.endPx - this.startPx, s = this.zone;
    this.targetProgress = n > 0 ? Yi((t - this.startPx) / n) : t >= this.startPx ? 1 : 0, this.zone = n > 0 ? t <= this.startPx ? "before" : t >= this.endPx ? "after" : "active" : t >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(s, this.zone), e || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const t = this.options.scrub;
    return typeof t == "number" ? Math.max(0, t) : 0;
  }
  resolveEnd(t, e, n) {
    const s = ft(this.options.end) ?? "bottom top", r = typeof s == "string" ? s.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (r) {
      const o = Number.parseFloat(r[1]);
      return this.startPx + (r[2] === "%" ? e * o / 100 : o);
    }
    return n + yt(t, e, s);
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
    }, Sr));
  }
  /**
   * Emit enter/leave callbacks as the scroll position moves between zones. A jump
   * straight across the range (a fast flick, or loading the page scrolled past
   * it) fires both edges in order.
   */
  fireBoundaryCallbacks(t, e) {
    if (t === e) return;
    const { onEnter: n, onLeave: s, onEnterBack: r, onLeaveBack: o } = this.options;
    t === "before" ? (n?.(), e === "after" && s?.()) : t === "after" ? (r?.(), e === "before" && o?.()) : e === "after" ? s?.() : o?.();
  }
  /** Scrolling has stopped: settle on the nearest snap point, if there is one. */
  scheduleSnap() {
    const t = this.options.snap;
    if (t === void 0 || this.snapper.active) return;
    const e = vr(t), n = () => {
      this.snapTimer = null;
      const s = this.endPx - this.startPx, r = this.scrollPosition();
      if (!this.running || s <= 0 || r <= this.startPx || r >= this.endPx) return;
      const o = (r - this.startPx) / s, a = this.startPx + wr(o, this.releaseVelocity / s, e.snapTo) * s;
      Math.abs(a - r) < 1 || this.snapper.animate(r, a, Tr(e, a - r, this.viewportHeight()), e.ease);
    };
    e.delay ? this.snapTimer = setTimeout(n, e.delay * 1e3) : n();
  }
  scrollTo(t) {
    const e = this.options.scroller, n = this.options.horizontal ? { left: t } : { top: t };
    e ? typeof e.scrollTo == "function" ? e.scrollTo({ ...n, behavior: "instant" }) : this.options.horizontal ? e.scrollLeft = t : e.scrollTop = t : typeof window < "u" && window.scrollTo({ ...n, behavior: "instant" });
  }
  /**
   * Resolve start and end for a trigger inside a horizontally moving container:
   * find the container progress where each horizontal position fires, and turn
   * it into the container's scroll offsets.
   */
  measureInContainer(t) {
    const e = this.options.trigger;
    if (typeof e?.getBoundingClientRect != "function") return;
    const n = e.getBoundingClientRect(), s = this.options.scroller?.getBoundingClientRect?.().left ?? 0, r = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, o = n.left - s - t.shiftAt(t.progress()), { start: a, end: c } = t.range(), l = (d) => a + d * (c - a), h = Ke(o, n.width, r, ft(this.options.start) ?? "left right", t.shiftAt);
    this.startPx = l(h);
    const f = ft(this.options.end) ?? "right left", u = typeof f == "string" ? f.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = u ? this.startPx + Number.parseFloat(u[1]) : l(Ke(o, n.width, r, f, t.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(t) {
    const e = (r, o) => {
      const a = ft(r) ?? o;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const c = Xi(a);
      return t * c.viewportFraction - c.offsetPx;
    }, n = e(this.options.start, "top bottom") ?? 0, s = e(this.options.end, "bottom top") ?? n;
    return {
      startViewport: n,
      endViewport: s,
      startPage: this.startPx + n,
      endPage: this.endPx + s
    };
  }
  startSmoothing() {
    if (this.rafId !== null || typeof requestAnimationFrame > "u") return;
    const t = (e) => {
      if (this.rafId = null, !this.running) return;
      const n = this.lastFrameTime === null ? 16.67 : e - this.lastFrameTime;
      this.lastFrameTime = e, this.displayProgress = mr(this.displayProgress, this.targetProgress, this.smoothing(), n);
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
    const e = this.options.horizontal, n = e ? t.left ?? 0 : t.top, s = e ? t.right ?? 0 : t.bottom, r = e ? t.width ?? 0 : t.height, o = this.options.scroller;
    if (o && typeof o.getBoundingClientRect == "function") {
      const a = o.getBoundingClientRect(), c = e ? a.left : a.top;
      return { top: n - c, bottom: s - c, height: r };
    }
    return { top: n, bottom: s, height: r };
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
function Vo(i) {
  const t = new qt(i);
  return t.start(), t;
}
const te = /* @__PURE__ */ new Set(), Ar = 16, Qe = 0.5, Er = 2;
class Je {
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
    const n = this.clamp(this.resolve(t) + (e.offset ?? 0)), s = Math.abs(n - this.current), r = this.reduced ? 0 : e.duration ?? Math.min(1.2, Math.max(0.4, s / 2500));
    if (r <= 0) {
      this.journey = null, this.current = this.target = n, this.write(n), this.applyEffects(0);
      return;
    }
    this.target = n, this.journey = { from: this.current, to: n, ms: r * 1e3, ease: e.ease ?? Bt, elapsed: 0 }, this.requestFrame();
  }
  /** Re-measure the scrollable length and every effect element (resizes do this). */
  refresh() {
    if (!this.running) return;
    this.rest(), this.effects = [];
    const t = this.options.effects === !0 ? "[data-speed], [data-lag]" : this.options.effects || "";
    if (t && !this.reduced) {
      const e = this.options.scroller ?? document, n = this.position(), s = this.viewportHeight(), r = this.options.scroller?.getBoundingClientRect().top ?? 0;
      for (const o of e.querySelectorAll(t)) {
        const a = Number.parseFloat(o.dataset.speed ?? ""), c = Number.parseFloat(o.dataset.lag ?? ""), l = o.getBoundingClientRect(), h = l.top - r + n;
        this.effects.push({
          element: o,
          speed: Number.isFinite(a) ? a : void 0,
          lag: Number.isFinite(c) && c > 0 ? c : void 0,
          centre: h + l.height / 2 - s / 2,
          lagged: n,
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
    const e = t.deltaMode === 1 ? Ar : t.deltaMode === 2 ? this.viewportHeight() : 1, n = t.deltaY * e * (this.options.wheelMultiplier ?? 1), s = this.clamp(this.target + n);
    s === this.target && s === this.current || (t.preventDefault(), this.journey = null, this.target = s, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const t = this.position();
    this.written !== null && Math.abs(t - this.written) <= Er || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = t, this.requestFrame());
  }
  nestedScrollerTakes(t) {
    const e = this.options.scroller ?? document.documentElement;
    for (let n = t.target; n && n !== e && n !== document.body; n = n.parentElement) {
      if (n.hasAttribute?.("data-smooth-ignore")) return !0;
      const s = getComputedStyle(n);
      if (!/(auto|scroll)/.test(s.overflowY) || n.scrollHeight <= n.clientHeight) continue;
      if (t.deltaY < 0 ? n.scrollTop > 0 : n.scrollTop + n.clientHeight < n.scrollHeight - 1) return !0;
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
    const n = this.current;
    if (this.journey) {
      const r = this.journey;
      r.elapsed += e;
      const o = Math.min(1, r.elapsed / r.ms);
      this.current = r.from + (r.to - r.from) * r.ease(o), o >= 1 && (this.journey = null);
    } else if (this.current !== this.target) {
      const r = (this.options.smooth ?? 0.8) * 1e3 / 3;
      this.current += (this.target - this.current) * (1 - Math.exp(-e / r)), Math.abs(this.target - this.current) < Qe && (this.current = this.target);
    }
    this.current !== n && this.write(this.current), this.velocityPxPerSecond = e > 0 ? (this.current - n) * 1e3 / e : 0;
    const s = this.applyEffects(e);
    this.current !== n && this.options.onUpdate?.(this.state), this.journey || this.current !== this.target || s ? this.requestFrame() : (this.lastTime = null, this.velocityPxPerSecond = 0);
  }
  /** Position every effect for the current scroll; true while a lag is still catching up. */
  applyEffects(t) {
    let e = !1;
    const n = this.current;
    for (const s of this.effects) {
      let r = 0;
      if (s.speed !== void 0 && (r += (n - s.centre) * (1 - s.speed)), s.lag !== void 0) {
        const o = s.lag * 1e3 / 3;
        s.lagged = t === 0 ? n : s.lagged + (n - s.lagged) * (1 - Math.exp(-t / o)), Math.abs(n - s.lagged) < Qe ? s.lagged = n : e = !0, r += n - s.lagged;
      }
      ee(s.element, r === 0 ? s.saved : `0 ${Pr(r)}px`), s.shift = r;
    }
    return e;
  }
  // --- geometry -------------------------------------------------------------
  write(t) {
    const e = Math.round(t);
    this.written = e;
    const n = this.options.scroller;
    n ? n.scrollTop = e : window.scrollTo({ top: e, behavior: "instant" });
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
    const e = this.options.scroller ?? document, n = typeof t == "string" ? e.querySelector(t) : t;
    if (!n) return this.current;
    const s = this.options.scroller?.getBoundingClientRect().top ?? 0, r = this.effects.find((o) => o.element === n)?.shift ?? 0;
    return n.getBoundingClientRect().top - s + this.position() - r;
  }
}
function ee(i, t) {
  t ? i.style.setProperty("translate", t) : i.style.removeProperty("translate");
}
function Pr(i) {
  return Math.round(i * 100) / 100;
}
function Cr(i, t) {
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
function ve(i, t, e, n, s = () => {
}) {
  const r = (d) => typeof d == "string" ? i.query(d) ?? void 0 : d, o = r(t.trigger) ?? n;
  if (!o) {
    s(`gsap-compat: scrollTrigger has no trigger element${typeof t.trigger == "string" ? ` for "${t.trigger}"` : ""}`);
    return;
  }
  const a = t.scrub === void 0 || t.scrub === !1 ? !1 : t.scrub, c = (t.toggleActions ?? "play none none none").trim().split(/\s+/);
  let l = 0, h;
  const f = (d, m) => () => {
    m?.(), e && !a && Cr(e, c[d] ?? "none"), t.once && d === 0 && queueMicrotask(() => h.destroy());
  }, u = t.containerAnimation ? Rr(i, t.containerAnimation, o, s) : void 0;
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
    snap: t.snap === void 0 ? void 0 : _r(t.snap, e),
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
function _r(i, t) {
  const e = (s) => s === "labels" ? (r) => Ir(r, t?.labelProgresses?.() ?? []) : s;
  if (typeof i != "object" || Array.isArray(i)) return e(i);
  const n = i.ease ? Rt(i.ease) : void 0;
  return {
    snapTo: e(i.snapTo),
    duration: i.duration,
    delay: i.delay,
    ease: n ? n.fn ?? U(n.easing) : void 0
  };
}
function Ir(i, t) {
  return t.reduce((e, n) => Math.abs(n - i) < Math.abs(e - i) ? n : e, t[0] ?? i);
}
function Rr(i, t, e, n) {
  const s = () => t.timeline.getTracks({ property: "x" }).map((r) => r.target).filter((r) => {
    const o = i.elementFor(r);
    return !!o && o !== e && o.contains(e);
  });
  return s().length === 0 && n("gsap-compat: containerAnimation does not move an ancestor of the trigger along x"), {
    range: () => {
      const r = t.scrollTrigger;
      return r || n("gsap-compat: containerAnimation needs its own scrollTrigger (created before this one)"), { start: r?.startOffset ?? 0, end: r?.endOffset ?? 0 };
    },
    progress: () => t.progress(),
    shiftAt: (r) => {
      const o = t.timeline.getStateAtTime(r * t.timeline.duration);
      let a = 0;
      for (const c of s()) {
        const l = o.values.get(c)?.get("x");
        typeof l == "number" && (a += l);
      }
      return a;
    }
  };
}
class Wi {
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
      const n = t();
      return typeof n == "function" && this.items.push({ revert: n }), n;
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
    for (const [t, { name: e, style: n, d: s }] of this.snapshots)
      n === null ? t.removeAttribute("style") : t.setAttribute("style", n), s !== null && t.setAttribute("d", s), this.host.forget(e);
    this.snapshots.clear();
  }
  /** Same as `revert()`: GSAP's name for dropping a context. */
  kill() {
    this.revert();
  }
}
class Lr {
  host;
  scope;
  entries = [];
  listeners = [];
  scheduled = !1;
  constructor(t, e) {
    this.host = t, this.scope = e;
  }
  add(t, e) {
    const n = { conditions: t, setup: e, queries: /* @__PURE__ */ new Map() }, s = typeof t == "string" ? { matches: t } : t;
    if (typeof window < "u" && typeof window.matchMedia == "function")
      for (const [r, o] of Object.entries(s)) {
        const a = window.matchMedia(o);
        n.queries.set(r, a);
        const c = () => this.scheduleUpdate();
        a.addEventListener("change", c), this.listeners.push(() => a.removeEventListener("change", c));
      }
    return this.entries.push(n), this.update(n), this;
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
    const n = Object.values(e).some(Boolean), s = n ? JSON.stringify(e) : void 0;
    if (s === t.key || (t.context?.revert(), t.context = void 0, t.key = s, !n)) return;
    const r = new Wi(this.host, this.scope);
    r.conditions = e, r.add(() => t.setup(r)), t.context = r;
  }
}
class $r {
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
    const t = typeof window < "u" ? Math.min(window.devicePixelRatio || 1, 2) : 1, e = Math.round(this.canvas.clientWidth * t), n = Math.round(this.canvas.clientHeight * t);
    e > 0 && n > 0 && (this.canvas.width !== e || this.canvas.height !== n) && (this.canvas.width = e, this.canvas.height = n), this.drawn = -1, this.draw();
  }
  draw() {
    const t = Math.round(this.current), e = this.nearestReady(t);
    if (e === -1 || e === this.drawn || !this.context) return;
    const n = this.images[e], { width: s, height: r } = this.canvas, o = (this.options.fit ?? "cover") === "cover" ? Math.max(s / n.naturalWidth, r / n.naturalHeight) : Math.min(s / n.naturalWidth, r / n.naturalHeight), a = n.naturalWidth * o, c = n.naturalHeight * o;
    this.context.clearRect(0, 0, s, r), this.context.drawImage(n, (s - a) / 2, (r - c) / 2, a, c), this.drawn = e, this.pump();
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
    for (let n = 0; n < this.frames && this.inFlight < t; n++)
      for (const s of n === 0 ? [e] : [e + n, e - n])
        s < 0 || s >= this.frames || this.images[s] || this.inFlight >= t || this.load(s);
  }
  load(t) {
    const e = new Image();
    e.decoding = "async", this.images[t] = e, this.inFlight++;
    const n = (s) => {
      if (!this.destroyed) {
        if (this.inFlight--, s) {
          this.ready[t] = !0, this.loadedCount++, this.options.onProgress?.(this.loadedCount, this.frames);
          const r = Math.round(this.current);
          (Math.abs(t - r) < Math.abs(this.drawn - r) || this.drawn === -1) && (this.drawn = -1, this.draw());
        }
        this.pump();
      }
    };
    e.onload = () => n(!0), e.onerror = () => n(!1), e.src = this.options.url(t);
  }
}
const Fr = { opacity: 0, y: -16 }, Dr = { opacity: 0, y: 16 };
async function Or(i, t, e, n) {
  const s = t.collector?.scope ?? t.root, r = s.ownerDocument ?? s, o = () => n.shared ? [...s.querySelectorAll(n.shared)] : [];
  if (n.native && typeof r.startViewTransition == "function")
    return Nr(r, n, o);
  const a = n.duration ?? 0.35, c = n.ease ?? "power2.inOut", l = (g) => new Promise((y) => {
    g(y) || y();
  }), h = o(), f = h.length ? he(t, h) : void 0, u = n.from !== void 0 ? ti(t, n.from, n.shared) : [];
  if (u.length && n.leave !== !1) {
    const g = n.leave ?? Fr;
    await l((y) => i.to(u, { ...g, duration: a, ease: c, onComplete: y }));
  }
  await n.update();
  const d = [], m = typeof n.to == "function" ? n.to() : n.to, p = m !== void 0 ? ti(t, m, n.shared) : [];
  if (p.length && n.enter !== !1) {
    const g = n.enter ?? Dr;
    d.push(l((y) => i.fromTo(p, g, { ...qi(g), duration: a, ease: c, onComplete: y })));
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
function ti(i, t, e) {
  const n = i.resolveTargets(t).map((s) => i.elementFor(s)).filter((s) => !!s);
  return e ? n.flatMap((s) => !s.querySelector(e) && !s.matches(e) ? [s] : [...s.children].filter((r) => !r.matches(e) && !r.querySelector(e))) : n;
}
async function Nr(i, t, e) {
  const n = (a, c) => {
    const l = a.dataset?.flipId;
    l && a.style.setProperty("view-transition-name", c ? `tf-${l.replace(/[^\w-]/g, "-")}` : "");
  }, s = e();
  s.forEach((a) => n(a, !0));
  let r = [];
  await i.startViewTransition(async () => {
    s.forEach((a) => n(a, !1)), await t.update(), r = e(), r.forEach((a) => n(a, !0));
  }).finished, r.forEach((a) => n(a, !1));
}
const Br = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (i, t) => ge(i, os(t))
}, qr = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (i, t) => ge(i, { fn: as(t) })
}, Xr = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (i, t) => ge(i, { fn: cs(t) })
}, Yr = /* @__PURE__ */ new Set([
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
]), ei = 0.5, Vr = "power1.inOut";
function Wr(i) {
  return i.keyframes !== void 0 && i.keyframes !== null;
}
function jr(i) {
  const t = i.keyframes, e = {};
  for (const [l, h] of Object.entries(i)) Yr.has(l) || (e[l] = h);
  if (Array.isArray(t))
    return t.map((l) => ({
      ...e,
      ...l,
      duration: l.duration ?? i.duration ?? ei
    }));
  const n = Object.entries(t), s = i.duration ?? ei, r = t.easeEach ?? i.easeEach ?? Vr;
  if (n.length > 0 && n.every(([l]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(l) || l === "easeEach")) {
    const l = n.filter(([u]) => u !== "easeEach").map(([u, d]) => ({ at: Number.parseFloat(u) / 100, step: d })).sort((u, d) => u.at - d.at), h = [];
    let f = 0;
    for (const { at: u, step: d } of l) {
      const m = Math.max(0, u - f);
      h.push({ ...e, ease: r, ...d, duration: m * s }), f = u;
    }
    return h;
  }
  const o = n.filter(([l, h]) => l !== "easeEach" && Array.isArray(h)), a = Math.max(0, ...o.map(([, l]) => l.length)), c = [];
  for (let l = 0; l < a; l++) {
    const h = { ...e, ease: r, duration: s / a };
    for (const [f, u] of o)
      l < u.length && (h[f] = u[l]);
    c.push(h);
  }
  return c;
}
function ii(i, t, e, n = {}) {
  const s = t.collector?.scope ?? t.root, r = typeof n.scroller == "string" ? s.querySelector(n.scroller) : n.scroller ?? null, o = {
    x: r ? r.scrollLeft : window.scrollX,
    y: r ? r.scrollTop : window.scrollY
  }, a = {
    x: r ? r.scrollWidth - r.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: r ? r.scrollHeight - r.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, c = (v, b) => {
    if (b === void 0) return o[v];
    if (typeof b == "number") return b;
    if (b === "max") return a[v];
    const T = typeof b == "string" ? s.querySelector(b) : b;
    if (!T) return o[v];
    const w = T.getBoundingClientRect(), x = r?.getBoundingClientRect(), S = (v === "x" ? n.offsetX : n.offsetY) ?? n.offset ?? 0;
    return v === "x" ? w.left - (x?.left ?? 0) + o.x - S : w.top - (x?.top ?? 0) + o.y - S;
  }, l = typeof e == "object" && e !== null && !("nodeType" in e) ? { x: c("x", e.x), y: c("y", e.y) } : { x: o.x, y: c("y", e) }, h = { x: Math.max(0, Math.min(a.x, l.x)), y: Math.max(0, Math.min(a.y, l.y)) }, f = { ...o }, u = () => {
    r ? (r.scrollLeft = f.x, r.scrollTop = f.y) : window.scrollTo({ left: f.x, top: f.y, behavior: "instant" });
  }, d = ["wheel", "touchstart", "keydown"], m = r ?? window, p = () => {
    y.kill(), g();
  }, g = () => {
    for (const v of d) m.removeEventListener(v, p);
  }, y = i.to(f, {
    x: h.x,
    y: h.y,
    duration: n.duration ?? 1,
    ease: n.ease ?? "power2.inOut",
    onStart: n.onStart,
    onUpdate: () => {
      u(), n.onUpdate?.();
    },
    onComplete: () => {
      g(), n.onComplete?.();
    }
  });
  if (n.autoKill !== !1) for (const v of d) m.addEventListener(v, p, { passive: !0 });
  return y;
}
function Ur(i, t, e) {
  const n = i.collector?.scope ?? i.root, s = typeof t == "string" ? [...n.querySelectorAll(t)] : "nodeType" in t ? [t] : Array.from(t), { interval: r = 0.1, batchMax: o, onEnter: a, onLeave: c, onEnterBack: l, onLeaveBack: h, ...f } = e, u = { onEnter: a, onLeave: c, onEnterBack: l, onLeaveBack: h }, d = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, m = {}, p = (y) => {
    m[y] !== void 0 && clearTimeout(m[y]), m[y] = void 0;
    const v = d[y].splice(0);
    v.length > 0 && u[y]?.(v);
  }, g = (y, v) => {
    if (u[y]) {
      if (d[y].push(v), o !== void 0 && d[y].length >= o) return p(y);
      m[y] === void 0 && (m[y] = setTimeout(() => p(y), r * 1e3));
    }
  };
  return s.map(
    (y) => ve(i, {
      ...f,
      trigger: y,
      onEnter: () => g("onEnter", y),
      onLeave: () => g("onLeave", y),
      onEnterBack: () => g("onEnterBack", y),
      onLeaveBack: () => g("onLeaveBack", y)
    })
  ).filter((y) => y !== void 0);
}
class j {
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
    this.stage = t;
    const n = { ...e, onWarning: e.onWarning ?? t.onWarning };
    if (this.options = n, this.compat = new nt({
      ...n,
      startValue: (s, r) => {
        const o = t.objectFor(s);
        if (o) return Kr(o[r]);
        const a = t.appliedValue(s, r);
        if (a !== void 0) return a;
        if (r === "d") return Oi(t.elementFor(s)) ?? void 0;
        if (r === "text") return t.elementFor(s)?.textContent ?? void 0;
        if (r === "strokeDasharray" || r === "strokeDashoffset") {
          const c = ri(t.elementFor(s));
          if (c !== void 0) return r === "strokeDasharray" ? [c, c] : 0;
        }
      },
      startVelocity: (s, r) => t.velocityOf(s, r),
      layoutColumns: (s) => si(s.map((r) => t.elementFor(r))),
      random: () => t.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, t.collector?.track(this), t.liveTimelines.add(this), this.autoplayPending = !n.paused && !n.scrollTrigger, n.scrollTrigger) {
      const s = n.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = ve(t, s, this, this.firstElement, (r) => n.onWarning?.(r)));
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
  to(t, e, n) {
    return Wr(e) ? this.record(() => this.keyframed(t, e, n)) : this.record(() => this.tween(t, [e], n, ([s], r, o) => this.compat.to(r, s, o)));
  }
  from(t, e, n) {
    return this.record(() => this.tween(t, [e], n, ([s], r, o) => this.compat.from(r, s, o)));
  }
  fromTo(t, e, n, s) {
    return this.record(
      () => this.tween(t, [e, n], s, ([r, o], a, c) => this.compat.fromTo(a, r, o, c))
    );
  }
  set(t, e, n) {
    return this.record(() => this.tween(t, [e], n, ([s], r, o) => this.compat.set(r, s, o)));
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
  call(t, e = [], n) {
    return this.record(() => {
      const s = this.compat.addEvent(n);
      this.events.push({ time: s, run: () => t(...e) });
    });
  }
  /** Pause exactly at `position` when the playhead reaches it, then run `callback`. `play()` continues. */
  addPause(t, e, n = []) {
    return this.record(() => {
      const s = this.compat.addEvent(t);
      this.events.push({ time: s, pause: !0, run: () => e?.(...n) });
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
  tweenFromTo(t, e, n = {}) {
    this.pause(), this.seek(t);
    const s = this.timeline.currentTime, r = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(e))), o = { time: s }, a = n.duration ?? Math.abs(r - s) / 1e3 / (this.timeScale() || 1), c = new j(this.stage, { onStart: n.onStart, onComplete: n.onComplete });
    return c.to(o, {
      time: r,
      duration: a,
      ease: n.ease ?? "none",
      onUpdate: () => {
        this.moveTo(o.time), n.onUpdate?.();
      }
    }), c;
  }
  // --- playback -----------------------------------------------------------
  play() {
    this.autoplayPending = !1, this.started || (this.started = !0, this.options.onStart?.());
    const t = this.timeline.playbackState === "playing", e = this.timeline.playbackState === "paused";
    if (this.timeline.play(), !t) {
      const n = this.timeline, s = n.direction === "forward" ? n.currentTime === 0 : n.currentTime === n.duration;
      this.playhead = { ...this.readPlayhead(), fresh: s && !e }, this.waitingToWrap = !1;
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
    for (const n of t)
      for (const s of e ?? [void 0])
        this.timeline.removeTracks({ target: n, ...s !== void 0 && { property: s } });
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
    const n = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: t >= e.time ? "forward" : "reverse" }, s = { ...e, iteration: n.iteration, direction: n.direction };
    this.playhead = { ...this.readPlayhead() }, this.waitingToWrap = !1, this.runCrossings(s, n, !1), this.options.onUpdate?.();
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
    const n = this.playhead, s = this.readPlayhead();
    this.playhead = s;
    const r = this.options.yoyo === !0;
    e && !r && s.iteration > n.iteration && (this.playhead = { time: 0, iteration: s.iteration, direction: "forward", fresh: !0 }, this.waitingToWrap = !0);
    const o = this.runCrossings(n, s, e);
    if (this.options.onUpdate?.(), this.finishedThisFrame && !o) {
      this.finishedThisFrame = !1;
      const a = t.currentTime === 0 && t.direction === "reverse";
      !this.scrollDriver && !r && this.stage.liveTimelines.delete(this), a && this.backwards ? this.options.onReverseComplete?.() : this.options.onComplete?.();
    }
    this.finishedThisFrame = !1;
  }
  /** Fire events and repeats between two playheads. Returns true if a pause stopped it. */
  runCrossings(t, e, n) {
    if (this.events.length === 0 && this.ranges.length === 0 && !this.options.onRepeat && !this.options.repeatRefresh) return !1;
    const s = this.events, { crossings: r, passes: o } = Si(
      s.map((a) => a.time),
      t,
      e,
      { duration: this.timeline.duration, alternate: this.options.yoyo === !0, holding: n }
    );
    for (const a of r) {
      if (this.killed) return !0;
      if (a.kind === "repeat") {
        this.options.repeatRefresh && this.refreshForRepeat(), this.options.onRepeat?.();
        continue;
      }
      const c = s[a.index];
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
  tween(t, e, n, s) {
    const r = this.resolve(t);
    if (!r) return;
    const { onStart: o, onUpdate: a, onComplete: c } = e[e.length - 1];
    if (o || a || c) {
      let l = 1 / 0, h = -1 / 0;
      const f = (u, d, m) => {
        s(u, d, m), l = Math.min(l, this.compat.lastStart), h = Math.max(h, this.compat.lastEnd);
      };
      if (this.buildTween(r, e, n, f), l === 1 / 0) return;
      o && this.events.push({ time: l, direction: "forward", run: o }), a && this.ranges.push({ start: l, end: h, run: a }), c && this.events.push({ time: h, direction: "forward", run: c });
      return;
    }
    this.buildTween(r, e, n, s);
  }
  /**
   * A tween with `keyframes`: its segments one after another, from the tween's
   * position and delay. With `stagger`, each target plays the whole sequence,
   * offset like any stagger. Callbacks belong to the sequence as a whole.
   */
  keyframed(t, e, n) {
    const s = this.resolve(t);
    if (!s) return;
    const r = jr(e);
    if (r.length === 0) return;
    const o = s.length > 1 ? ce(e.stagger, this.staggerContext(s)) : void 0, a = s.map((g) => this.targetFor(g)).filter((g) => g !== void 0), c = o ? a.map((g) => [g]) : [a], l = o ? ie(s.length, o).map((g) => g / 1e3) : [0], h = this.compat.timeOf(n) / 1e3 + Lt(e.delay, 0) / 1e3;
    let f = 1 / 0, u = -1 / 0;
    if (c.forEach((g, y) => {
      r.forEach((v, b) => {
        const T = b === 0 ? h + l[y] : ">";
        this.tween(g, [v], T, ([w], x, S) => this.compat.to(x, w, S)), f = Math.min(f, this.compat.lastStart), u = Math.max(u, this.compat.lastEnd);
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
  buildTween(t, e, n, s) {
    const r = t.map((u) => this.targetFor(u));
    if (!(t.length > 1 && (e.some(Gr) || t.some((u) => this.stage.objectFor(u) !== void 0)))) {
      const u = this.targetFor(t[0]);
      s(e.map((d) => this.prepare(ni(d, 0, u, this.stage.utils, r), t)), t, n);
      return;
    }
    const a = e.length - 1, { stagger: c, ...l } = e[a], h = ce(c, this.staggerContext(t)), f = h ? ie(t.length, h).map((u) => u / 1e3) : t.map(() => 0);
    t.forEach((u, d) => {
      const m = d === 0 ? Lt(l.delay, 0) / 1e3 + f[0] : 0, p = d === 0 ? 0 : f[d] - f[d - 1], g = d === 0 ? n : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, v = e.map((b, T) => T === a ? { ...l, delay: m } : b).map((b) => this.prepare(ni(b, d, this.targetFor(u), this.stage.utils, r), [u]));
      s(v, [u], g);
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
    const n = (o) => this.options.onWarning?.(o), s = (o) => this.stage.query(o);
    let r = t;
    if (t.motionPath !== void 0) {
      const o = Ks(t.motionPath, {
        query: s,
        targets: e.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: n
      });
      r = { ...r, motionPath: o };
    }
    if (t.morphSVG !== void 0) {
      const o = Zs(t.morphSVG, s, n), { morphSVG: a, ...c } = r;
      r = o ? { ...r, morphSVG: o } : c;
    }
    if (t.drawSVG !== void 0) {
      const o = ri(this.stage.elementFor(e[0]));
      if (o === void 0) {
        n("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...c } = r;
        r = c;
      } else
        r = As(r, o);
    }
    return r;
  }
  resolve(t) {
    const e = this.stage.resolveTargets(t);
    if (e.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${Zr(t)}`);
      return;
    }
    return this.firstElement ??= e.map((n) => this.stage.elementFor(n)).find((n) => n !== void 0), e;
  }
}
function zr(i = new Us()) {
  const t = (r) => {
    const { config: o } = Et(r);
    return new j(i, {
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
  }, n = (r) => (r && i.collector?.track(r), r), s = {
    stage: i,
    ticker: i.ticker,
    utils: i.utils,
    getProperty: (r, o) => {
      const [a] = i.resolveTargets(r);
      if (a === void 0) return;
      const c = i.objectFor(a);
      return c ? c[o] : i.appliedValue(a, o) ?? Li(o);
    },
    scrollTrigger: (r) => n(ve(i, r)),
    scrollBatch: (r, o) => Ur(i, r, o).map((a) => n(a)),
    scrollTo: (r, o) => ii(s, i, r, o),
    refreshScroll: () => {
      qt.refreshAll(), Je.refreshAll();
    },
    smoothScroll: (r = {}) => {
      const o = typeof r.scroller == "string" ? (i.collector?.scope ?? i.root).querySelector(r.scroller) : r.scroller;
      return n(new Je({ ...r, scroller: o }).start());
    },
    context: (r, o) => {
      const a = new Wi(i, o);
      return r && a.add(() => r(a)), a;
    },
    matchMedia: (r) => new Lr(i, r),
    customEase: Br.create,
    customBounce: qr.create,
    customWiggle: Xr.create,
    pageTransition: (r) => Or(s, i, (o) => new j(i, o), r),
    imageSequence: (r, o) => {
      const a = typeof r == "string" ? (i.collector?.scope ?? i.root).querySelector(r) : r;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(r)}`);
      return n(new $r(a, o));
    },
    quickTo: (r, o, a = {}) => {
      const c = new j(i, { paused: !0 }), [l] = i.resolveTargets(r);
      return Object.assign((f) => {
        if (!l) return;
        const u = a.spring !== void 0 ? i.velocityOf(l, o) ?? 0 : 0;
        c.compat.reset(), c.compat.to(l, {
          [o]: f,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: Hr(a.spring, o, u) }
        }), c.timeline.stop(), c.timeline.play(), i.activate(c.timeline);
      }, { tween: c, kill: () => c.kill() });
    },
    timeline: (r) => new j(i, r),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (r, o) => {
      if (o.scrollTo !== void 0) {
        const { scrollTo: a, ...c } = o, l = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, h = typeof r != "string" && r !== window && r.nodeType === 1;
        return ii(s, i, a, {
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
    delayedCall: (r, o, a) => new j(i).call(o, a, r),
    killTweensOf: (r, o) => {
      const a = i.resolveTargets(r), c = typeof o == "string" ? o.split(",").map((l) => l.trim()).filter(Boolean) : o;
      for (const l of [...i.liveTimelines]) l.killTweensOf(a, c);
    },
    convertToPath: (r) => Js(r, i.root),
    splitText: (r, o) => {
      const a = i.collector?.scope ?? i.root, c = typeof r == "string" ? Array.from(a.querySelectorAll(r)) : "nodeType" in r ? [r] : Array.from(r);
      return n(lr(c, o));
    },
    draggable: (r, o) => n(rr(s, i, r, o)),
    getFlipState: (r) => he(i, r),
    flipFrom: (r, o) => ue(i, (a) => new j(i, a), r, o),
    flip: (r, o, a) => {
      const c = he(i, r);
      return o(), ue(i, (l) => new j(i, l), c, { targets: r, ...a });
    }
  };
  return s;
}
const q = /* @__PURE__ */ zr();
function Hr(i, t, e) {
  return i === !0 ? { velocity: { [t]: e } } : typeof i == "string" ? { preset: i, velocity: { [t]: e } } : { ...i, velocity: { [t]: e } };
}
function Gr(i) {
  return i.morphSVG !== void 0 || i.drawSVG !== void 0 || i.text !== void 0 || i.scrambleText !== void 0 || ji(i);
}
function ji(i) {
  return Object.entries(i).some(([t, e]) => (typeof e == "function" || Ri(e)) && !ye.has(t));
}
function ni(i, t, e, n, s) {
  if (!ji(i)) return i;
  const r = {};
  for (const [o, a] of Object.entries(i))
    ye.has(o) ? r[o] = a : typeof a == "function" ? r[o] = a(t, e, s) : Ri(a) ? r[o] = n.resolveRandomString(a) : r[o] = a;
  return r;
}
function si(i) {
  const t = i.map((n) => n?.getBoundingClientRect().top);
  if (t[0] === void 0) return i.length;
  let e = 0;
  for (const n of t) {
    if (n === void 0 || Math.abs(n - t[0]) > 1) break;
    e++;
  }
  return Math.max(1, e);
}
function ri(i) {
  const t = i;
  if (typeof t?.getTotalLength == "function")
    return t.getTotalLength();
}
function Kr(i) {
  if (typeof i == "number" || typeof i == "string" || Array.isArray(i) && i.every((t) => typeof t == "number")) return i;
}
function Zr(i) {
  return typeof i == "string" ? `"${i}"` : String(i);
}
class oi {
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
    const n = this.targetTime(t);
    e ? (this.media.paused && this.safePlay(), Math.abs(this.media.currentTime - n) > this.driftTolerance && (this.media.currentTime = n)) : (this.media.paused || this.media.pause(), this.media.currentTime !== n && (this.media.currentTime = n));
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
function Qr(i, t, e, n, s) {
  const r = e - s;
  if (r < 0) {
    t.paused || t.pause(), t.currentTime = 0;
    return;
  }
  i.update(r, n);
}
class we {
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
  constructor(t, e = {}) {
    if (typeof t == "string") {
      const n = document.querySelector(t);
      if (!n)
        throw new Error(`Container not found: ${t}`);
      this.container = n;
    } else
      this.container = t;
    this.options = e, this.adapter = new K();
  }
  /**
   * Load animation from a URL or JSON object.
   */
  async load(t) {
    this.scenarioList = [], this.scenarioId = void 0, await this.loadSource(t);
  }
  async loadSource(t) {
    let e;
    if (typeof t == "string") {
      const n = await fetch(t);
      if (!n.ok)
        throw new Error(`Failed to load animation: ${n.statusText}`);
      e = await n.json();
    } else
      e = t;
    this.useDefinition(e), this.showInitialFrame(), this.watchReducedMotion(), this.watchVisibility(), this.options.autoplay && !this.reducedMotion && (this.options.playWhenVisible && !this.onScreen ? this.autoplayWhenSeen = !0 : this.play());
  }
  /**
   * Make a definition the current timeline: targets, symbols and media bound, no
   * frame drawn and nothing played. The definition itself is not modified, so a
   * scenario's timeline can be used again.
   */
  useDefinition(t) {
    const e = { ...t.config };
    this.options.speed !== void 0 && (e.speed = this.options.speed), this.options.loop !== void 0 && (e.loop = this.options.loop), this.options.alternate !== void 0 && (e.alternate = this.options.alternate), this.timeline = gt({ ...t, config: e }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
  }
  // --- scenarios: the reader chooses which timeline plays --------------------
  /**
   * Load several timelines for the same markup, and show one. The reader switches
   * with `setScenario`; the embed's controls and `data-tinyfly-choose` hotspots
   * call it.
   */
  async loadScenarios(t, e = {}) {
    if (t.length === 0) throw new Error("tinyfly: loadScenarios needs at least one scenario");
    const n = /* @__PURE__ */ new Set();
    for (const r of t) {
      if (n.has(r.id)) throw new Error(`tinyfly: scenario id "${r.id}" is used more than once`);
      n.add(r.id);
    }
    const s = e.initial === void 0 ? t[0] : t.find((r) => r.id === e.initial);
    if (!s) throw new Error(`tinyfly: there is no scenario "${e.initial}"`);
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
    const e = this.scenarioList.find((a) => a.id === t);
    if (!e || !this.timeline) return !1;
    if (t === this.scenarioId) return !0;
    const n = this.isPlaying, s = this.currentTime >= this.duration - 0.5, r = this.currentMarker?.id;
    this.stopAnimationLoop(), this.stepping = !1, this.pausedByVisibility = !1, this.restoreAuthored(), this.scenarioId = t, this.useDefinition(e.timeline), this.lastMarkerId = null;
    let o = 0;
    return this.reducedMotion || s ? o = this.duration : r !== void 0 && (o = this.markers.find((a) => a.id === r)?.time ?? 0), this.seek(o), n && !this.reducedMotion ? (this.stepping = this.options.stepMode === !0, this.startPlaying()) : this.notify(), !0;
  }
  /** Remember how an element was authored, the first time it becomes a target. */
  rememberAuthored(t) {
    if (this.authored.has(t)) return;
    const e = { style: t.getAttribute("style") };
    t.children.length === 0 && (e.text = t.textContent ?? "");
    const n = t.tagName.toLowerCase() === "path" ? t : t.querySelector("path");
    n && (e.path = { element: n, d: n.getAttribute("d") }), this.authored.set(t, e);
  }
  /** Put every target back the way it was authored. */
  restoreAuthored() {
    for (const [t, e] of this.authored) {
      e.style === null ? t.removeAttribute("style") : t.setAttribute("style", e.style), e.text !== void 0 && t.textContent !== e.text && (t.textContent = e.text), e.path && (e.path.d === null ? e.path.element.removeAttribute("d") : e.path.element.setAttribute("d", e.path.d));
      const n = t.dataset;
      n && delete n.shineBase;
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
    let e;
    for (const n of this.markers)
      if (n.time <= t + 0.5) e = n;
      else break;
    return e;
  }
  /**
   * Caption for a marker (default: the current one) in a language (default: the
   * container's closest `lang`, then the document's), falling back to the
   * marker's own label.
   */
  caption(t, e) {
    const n = t ? this.markers.find((o) => o.id === t) : this.currentMarker;
    if (!n) return;
    const s = e ?? this.language(), r = (o) => o?.[s]?.[n.id] ?? o?.[s.split("-")[0]]?.[n.id];
    return r(this.options.captions) ?? r(this.timeline?.captions) ?? n.label;
  }
  /** Move to the next marker: animated, or a jump under reduced motion. At the last marker, to the end. */
  next() {
    if (!this.timeline) return;
    const t = this.currentTime, e = this.markers.find((n) => n.time > t + 0.5);
    if (this.reducedMotion) {
      this.seek(e ? e.time : this.duration);
      return;
    }
    t >= this.duration - 0.5 || (this.stepping = e !== void 0, this.startPlaying());
  }
  /** Jump back to the previous marker (or the start). */
  prev() {
    if (!this.timeline) return;
    const t = this.currentTime, e = [...this.markers].reverse().find((n) => n.time < t - 0.5);
    this.pause(), this.seek(e ? e.time : 0);
  }
  /** Jump to a marker by id, paused there. */
  goToMarker(t) {
    const e = this.markers.find((n) => n.id === t);
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
        this.visibilityObserver?.disconnect(), this.visibilityObserver = new IntersectionObserver((e) => {
          for (const n of e) this.onScreen = n.isIntersecting;
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
      const n = e, s = Number(n.getAttribute("data-tinyfly-start") ?? "0") || 0, r = n.getAttribute("data-volume");
      r !== null && (n.volume = Math.max(0, Math.min(1, Number(r) || 0))), this.mediaTargets.push({ el: n, startTime: s, sync: new oi(n) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(t, e) {
    for (const n of this.mediaTargets)
      Qr(n.sync, n.el, t, e, n.startTime);
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
      const n = this.container.querySelector(e);
      n && (this.rememberAuthored(n), this.targets[t] = n, this.adapter.registerTarget(t, n));
    } else
      this.rememberAuthored(e), this.targets[t] = e, this.adapter.registerTarget(t, e);
  }
  /**
   * Auto-register targets using data-tinyfly attribute.
   */
  autoRegisterTargets() {
    this.container.querySelectorAll("[data-tinyfly]").forEach((e) => {
      const n = e.closest("[data-tinyfly-symbol]");
      if (n && n !== e) return;
      const s = e.getAttribute("data-tinyfly");
      s && this.registerTarget(s, e);
    }), this.timeline && new Set(this.timeline.tracks.map((n) => n.target)).forEach((n) => {
      if (!this.targets[n]) {
        const s = this.container.querySelector(`[data-tinyfly="${n}"]`) || this.container.querySelector(`.${n}`) || this.container.querySelector(`#${n}`);
        s && this.registerTarget(n, s);
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
    const e = new Map(t.map((n) => [n.id, n]));
    this.container.querySelectorAll("[data-tinyfly-symbol]").forEach((n) => {
      const s = n.getAttribute("data-tinyfly-symbol");
      if (!s) return;
      const r = e.get(s);
      if (!r || !r.timeline.tracks?.length) return;
      const o = new K();
      n.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const c = a.getAttribute("data-tinyfly");
        c && o.registerTarget(c, a);
      }), this.symbolInstances.push({ adapter: o, timeline: gt(r.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(t, e) {
    this.mediaSync = new oi(t, e), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const t = (e) => {
      if (this.isDestroyed || !this.timeline) return;
      const n = e - (this.lastTime ?? e);
      this.lastTime = e;
      const s = this.playhead;
      this.timeline.tick(n), this.stopAtMarker(s), this.applyState();
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
    const e = this.timeline, n = { time: e.currentTime, iteration: e.loopIteration, direction: e.direction };
    this.playhead = n;
    const s = this.markers;
    if (s.length === 0) return;
    const { crossings: r } = Si(
      s.map((o) => o.time),
      t,
      n,
      { duration: e.duration, alternate: e.config.alternate === !0, holding: e.repeatDelayRemaining > 0 }
    );
    for (const o of r) {
      if (o.kind !== "event") continue;
      const a = s[o.index];
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
      const n = e.timeline.duration;
      e.adapter.applyState(e.timeline.getStateAtTime(n > 0 ? t % n : t));
    }
  }
}
async function Wo(i, t, e = {}) {
  const n = new we(i, { ...e, autoplay: !0 });
  return await n.load(t), n;
}
function jo(i, t = {}) {
  return new we(i, t);
}
const Jr = {
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
}, ai = "tinyfly-controls-style", to = `
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
let eo = 0;
function io(i) {
  if (i.getElementById(ai)) return;
  const t = i.createElement("style");
  t.id = ai, t.textContent = to, i.head.appendChild(t);
}
function no(i, t, e = {}) {
  const n = t.ownerDocument;
  io(n);
  const s = { ...Jr, ...e.labels }, r = e.speeds ?? [0.5, 1, 2], o = () => i.markers.length > 0, a = () => i.markers.some((M) => M.label !== void 0 || i.caption(M.id) !== void 0), c = n.createElement("div");
  c.className = "tf-ctl";
  const l = n.createElement("div");
  l.className = "tf-ctl-bar", l.setAttribute("role", "group");
  const h = (M, I, L, N = "") => {
    const O = n.createElement("button");
    return O.type = "button", O.className = `tf-ctl-btn ${N}`.trim(), O.setAttribute("aria-label", M), O.title = M, O.textContent = I, O.addEventListener("click", L), O;
  }, f = h(s.restart, "⟲", () => {
    i.pause(), i.seek(0);
  }), u = h(s.prev, "◀", () => i.prev()), d = h(s.play, "▶", () => i.isPlaying ? i.pause() : p(), "tf-ctl-primary"), m = h(s.next, "▶|", () => i.next()), p = () => {
    i.currentTime >= i.duration - 0.5 && i.seek(0), i.play();
  }, g = n.createElement("input");
  g.type = "range", g.className = "tf-ctl-scrub", g.min = "0", g.max = "1000", g.step = "1", g.setAttribute("aria-label", s.scrub), g.addEventListener("input", () => {
    i.pause(), i.seek(Number(g.value) / 1e3 * i.duration);
  });
  const y = n.createElement("span");
  y.className = "tf-ctl-step";
  const v = n.createElement("select");
  v.className = "tf-ctl-speed", v.setAttribute("aria-label", s.speed);
  for (const M of r) {
    const I = n.createElement("option");
    I.value = String(M), I.textContent = `${M}×`, M === 1 && (I.selected = !0), v.appendChild(I);
  }
  v.addEventListener("change", () => i.setSpeed(Number(v.value))), l.append(f, u, d, m, g, y), r.length > 0 && l.append(v), c.append(l);
  const b = e.fullscreen ? ao(t, n, s) : void 0;
  b && l.append(b.button);
  const T = n.createElement("p");
  T.className = "tf-ctl-caption", T.setAttribute("aria-live", "polite"), e.captions !== !1 && c.append(T);
  const w = n.createElement("div");
  w.className = "tf-ctl-question", w.hidden = !0;
  const x = n.createElement("span"), S = h(s.reveal, s.reveal, () => i.play(), "tf-ctl-primary");
  w.append(x, S), c.append(w);
  const _ = so(i, n, s.scenario, e.scenarioControl ?? "buttons");
  _ && c.append(_.element);
  const D = e.mount;
  D ? D.appendChild(c) : t.insertAdjacentElement("afterend", c);
  const A = () => {
    const M = i.isPlaying;
    d.textContent = M ? "❚❚" : "▶", d.setAttribute("aria-label", M ? s.pause : s.play), d.title = M ? s.pause : s.play;
    const I = i.duration;
    n.activeElement !== g && (g.value = String(I > 0 ? Math.round(i.currentTime / I * 1e3) : 0));
    const L = i.markers;
    if (u.hidden = m.hidden = y.hidden = L.length === 0, L.length > 0) {
      const N = i.currentMarker, O = N ? L.indexOf(N) + 1 : 0;
      y.textContent = s.stepFormat.replace("{index}", String(O)).replace("{total}", String(L.length)), y.setAttribute("aria-label", `${s.step} ${O} ${s.of} ${L.length}`), u.disabled = i.currentTime <= 0.5, m.disabled = i.currentTime >= I - 0.5;
      const R = i.caption() ?? "";
      T.textContent !== R && (T.textContent = R), T.hidden = !a();
      const $ = !M && N?.question !== void 0 && Math.abs(i.currentTime - N.time) < 1;
      w.hidden = !$, $ && x.textContent !== N.question && (x.textContent = N.question);
    } else
      w.hidden = !0, T.hidden = !0;
    _?.update();
  }, k = i.subscribe(A);
  A();
  const P = e.keyboardScope ?? t;
  !P.hasAttribute("tabindex") && P.tabIndex < 0 && (P.tabIndex = 0);
  const E = /* @__PURE__ */ new WeakSet(), C = (M) => {
    if (E.has(M) || (E.add(M), M.defaultPrevented || M.altKey || M.ctrlKey || M.metaKey)) return;
    const I = M.target;
    if (!(I.tagName === "INPUT" || I.tagName === "SELECT") && !(M.key === " " && I.tagName === "BUTTON"))
      switch (M.key) {
        case " ":
          M.preventDefault(), i.isPlaying ? i.pause() : p();
          break;
        case "ArrowRight":
          if (!o()) return;
          M.preventDefault(), i.next();
          break;
        case "ArrowLeft":
          if (!o()) return;
          M.preventDefault(), i.prev();
          break;
        case "Home":
          M.preventDefault(), i.pause(), i.seek(0);
          break;
        case "f":
        case "F":
          if (!b) return;
          M.preventDefault(), b.active ? b.exit() : b.enter();
          break;
      }
  };
  return P.addEventListener("keydown", C), c.addEventListener("keydown", C), {
    element: c,
    fullscreen: b && {
      get active() {
        return b.active;
      },
      enter: b.enter,
      exit: b.exit
    },
    destroy() {
      b?.destroy(), k(), P.removeEventListener("keydown", C), c.removeEventListener("keydown", C), c.remove();
    }
  };
}
function so(i, t, e, n) {
  const s = i.scenarios;
  if (s.length < 2) return;
  if (n === "slider") {
    const h = t.createElement("div");
    h.className = "tf-ctl-choice-slider";
    const f = t.createElement("span");
    f.textContent = e, f.setAttribute("aria-hidden", "true");
    const u = t.createElement("input");
    u.type = "range", u.min = "0", u.max = String(s.length - 1), u.step = "1", u.setAttribute("aria-label", e);
    const d = t.createElement("output");
    return d.setAttribute("aria-hidden", "true"), u.addEventListener("input", () => {
      const p = s[Number(u.value)];
      p && i.setScenario(p.id);
    }), h.append(f, u, d), { element: h, update: () => {
      const p = Math.max(0, s.findIndex((y) => y.id === i.scenario));
      t.activeElement !== u && (u.value = String(p));
      const g = s[p].label;
      d.textContent !== g && (d.textContent = g), u.setAttribute("aria-valuetext", g);
    } };
  }
  const r = t.createElement("fieldset");
  r.className = "tf-ctl-choices";
  const o = t.createElement("legend");
  o.textContent = e, r.append(o);
  const a = `tf-ctl-scenario-${++eo}`, c = s.map((h) => {
    const f = t.createElement("label");
    f.className = "tf-ctl-choice";
    const u = t.createElement("input");
    u.type = "radio", u.name = a, u.value = h.id, u.addEventListener("change", () => {
      u.checked && i.setScenario(h.id);
    });
    const d = t.createElement("span");
    return d.textContent = h.label, f.append(u, d), r.append(f), u;
  });
  return { element: r, update: () => {
    for (const h of c) {
      const f = h.value === i.scenario;
      h.checked !== f && (h.checked = f);
    }
  } };
}
const ro = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', oo = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function ao(i, t, e) {
  const n = t, s = i, r = t.createElement("button");
  r.type = "button", r.className = "tf-ctl-btn tf-ctl-fullscreen";
  let o, a = "";
  const c = () => {
    const p = o !== void 0;
    r.innerHTML = p ? oo : ro;
    const g = p ? e.exitFullscreen : e.fullscreen;
    r.setAttribute("aria-label", g), r.title = g, r.setAttribute("aria-pressed", String(p)), i.classList.toggle("tf-fullscreen", p), i.classList.toggle("tf-fullscreen-overlay", o === "overlay");
  }, l = () => n.fullscreenElement ?? n.webkitFullscreenElement ?? null, h = () => {
    l() === i ? o = "native" : o === "native" && (o = void 0), c();
  }, f = (p) => {
    p.key === "Escape" && m();
  }, u = () => {
    o = "overlay", a = t.documentElement.style.overflow, t.documentElement.style.overflow = "hidden", t.addEventListener("keydown", f), c();
  };
  async function d() {
    if (o) return;
    const p = s.requestFullscreen?.bind(s) ?? s.webkitRequestFullscreen?.bind(s), g = n.fullscreenEnabled ?? n.webkitFullscreenEnabled ?? !1;
    if (p && g)
      try {
        if (await p(), l() === i) {
          o = "native", c();
          return;
        }
      } catch {
      }
    u();
  }
  async function m() {
    if (o === "overlay")
      t.removeEventListener("keydown", f), t.documentElement.style.overflow = a, o = void 0, c();
    else if (o === "native") {
      o = void 0, c();
      const p = n.exitFullscreen?.bind(n) ?? n.webkitExitFullscreen?.bind(n);
      l() === i && p && await p();
    }
  }
  return r.addEventListener("click", () => {
    o ? m() : d();
  }), t.addEventListener("fullscreenchange", h), t.addEventListener("webkitfullscreenchange", h), c(), {
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
const ci = "tinyfly-choices-style", co = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function lo(i) {
  if (i.getElementById(ci)) return;
  const t = i.createElement("style");
  t.id = ci, t.textContent = co, i.head.appendChild(t);
}
function ho(i, t) {
  const e = Array.from(t.querySelectorAll("[data-tinyfly-choose]"));
  if (e.length === 0) return () => {
  };
  lo(t.ownerDocument);
  const n = [], s = [];
  for (const a of e) {
    const c = a.getAttribute("data-tinyfly-choose") ?? "", l = [], h = (m, p) => {
      a.hasAttribute(m) || (a.setAttribute(m, p), l.push(m));
    };
    h("role", "button"), h("tabindex", "0");
    const f = i.scenarios.find((m) => m.id === c)?.label;
    f !== void 0 && h("aria-label", f), a.setAttribute("aria-pressed", "false"), l.push("aria-pressed"), n.push({ element: a, attributes: l });
    const u = () => i.setScenario(c), d = (m) => {
      const p = m.key;
      p !== "Enter" && p !== " " || (m.preventDefault(), u());
    };
    a.addEventListener("click", u), a.addEventListener("keydown", d), s.push(() => {
      a.removeEventListener("click", u), a.removeEventListener("keydown", d);
    });
  }
  const r = () => {
    for (const { element: a } of n)
      a.setAttribute("aria-pressed", String(a.getAttribute("data-tinyfly-choose") === i.scenario));
  }, o = i.subscribe(r);
  return r(), () => {
    o();
    for (const a of s) a();
    for (const { element: a, attributes: c } of n) for (const l of c) a.removeAttribute(l);
  };
}
const Ft = /* @__PURE__ */ new WeakMap(), fe = /* @__PURE__ */ new WeakMap();
let uo = 0;
function mt(i, t, e) {
  if (i)
    try {
      return JSON.parse(i);
    } catch (n) {
      console.warn(`tinyfly: invalid ${t} JSON on`, e, n);
      return;
    }
}
async function fo(i, t = {}) {
  const e = Ft.get(i);
  if (e) return e;
  const n = Array.from(i.querySelectorAll("script[data-tinyfly-timeline]")), s = n[0], r = i.getAttribute("data-src"), o = mo(i.getAttribute("data-markers")), a = n.length > 1 || s?.hasAttribute("data-scenario") ? po(n, o, i) : void 0;
  if (a && a.length === 0) return;
  let c = s && !a ? mt(s.textContent, "timeline", i) : void 0;
  if (!c && r && o) {
    const d = await fetch(r);
    d.ok && (c = await d.json());
  }
  if (c && o && (c = Ui(c, o)), !c && !r && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', i);
    return;
  }
  const l = mt(i.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", i), h = {
    playWhenVisible: !0,
    ...t.player,
    ...l && { captions: l },
    ...mt(i.getAttribute("data-options"), "data-options", i)
  };
  yo(i);
  const f = new we(i, h), u = { element: i, player: f };
  if (Ft.set(i, u), i.setAttribute("data-tinyfly-mounted", ""), a) {
    const d = i.getAttribute("data-scenario") ?? void 0;
    await f.loadScenarios(a, { initial: a.some((m) => m.id === d) ? d : void 0 }), fe.set(i, ho(f, i));
  } else
    await f.load(c ?? r);
  if (i.getAttribute("data-controls") !== "false") {
    const d = mt(i.getAttribute("data-labels"), "data-labels", i), m = i.querySelector("figcaption"), p = i.getAttribute("data-scenario-legend"), g = i.getAttribute("data-scenario-control");
    u.controls = no(f, i, {
      ...t.controls,
      ...i.getAttribute("data-fullscreen") === "true" ? { fullscreen: !0 } : {},
      ...g === "slider" || g === "buttons" ? { scenarioControl: g } : {},
      labels: { ...t.controls?.labels, ...d, ...p ? { scenario: p } : {} },
      // Inside the figure, before its figcaption, so the caption stays last.
      mount: void 0
    }), m ? i.insertBefore(u.controls.element, m) : i.appendChild(u.controls.element);
  }
  return u;
}
function po(i, t, e) {
  const n = [];
  return i.forEach((s, r) => {
    const o = mt(s.textContent, "timeline", e);
    if (!o) return;
    const a = s.getAttribute("data-scenario") || `scenario-${r + 1}`;
    if (n.some((l) => l.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, e);
      return;
    }
    const c = s.getAttribute("data-scenario-label") ?? void 0;
    n.push({ id: a, label: c, timeline: t ? Ui(o, t) : o });
  }), n;
}
function Ui(i, t) {
  return i.config.markers?.length ? i : { ...i, config: { ...i.config, markers: t.map((e, n) => ({ id: `step-${n + 1}`, time: e })) } };
}
function mo(i) {
  if (!i) return;
  const t = i.split(/[\s,]+/).filter(Boolean).map(Number).filter((e) => Number.isFinite(e) && e >= 0).sort((e, n) => e - n);
  return t.length > 0 ? t : void 0;
}
async function go(i = document, t = {}) {
  const e = Array.from(i.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(e.map((s) => fo(s, t)))).filter((s) => s !== void 0);
}
function Uo(i) {
  const t = Ft.get(i);
  t && (fe.get(i)?.(), fe.delete(i), t.controls?.destroy(), t.player.destroy(), Ft.delete(i), i.removeAttribute("data-tinyfly-mounted"));
}
function yo(i) {
  const t = i.querySelector("svg");
  if (!t || t.hasAttribute("role") || t.hasAttribute("aria-hidden")) return;
  const e = i.getAttribute("data-alt"), n = i.querySelector("figcaption");
  t.setAttribute("role", "img"), e ? t.setAttribute("aria-label", e) : n && (n.id ||= `tinyfly-caption-${++uo}`, t.setAttribute("aria-labelledby", n.id));
}
function bo() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const t = () => {
    go();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", t, { once: !0 }) : t();
}
class vo {
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
      const n = document.querySelector(t);
      if (!n) throw new Error(`Container not found: ${t}`);
      this.container = n;
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
      const n = await fetch(t);
      if (!n.ok)
        throw new Error(`Failed to load sequence: ${n.statusText}`);
      e = await n.json();
    } else
      e = t;
    this.sequence = e, this.symbolDefs.clear();
    for (const n of e.symbols ?? [])
      n.timeline?.tracks?.length && this.symbolDefs.set(n.id, n.timeline);
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
    const n = this.sequence.scenes[t];
    if (this.renderScene(n, this.containerA, this.adapterA), this.timelineA = this.createTimeline(n), this.options.onSceneChange?.(t), e)
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
  renderScene(t, e, n) {
    e.innerHTML = "", n.clearTargets();
    const s = document.createElement("div");
    s.style.cssText = "position:absolute;inset:0;transform-origin:center center", s.setAttribute("data-tinyfly", "Camera"), e.appendChild(s), n.registerTarget("Camera", s);
    for (const r of t.elements) {
      if (!r.html) continue;
      const o = document.createElement("div");
      o.innerHTML = r.html.trim();
      const a = o.firstElementChild;
      if (a) {
        s.appendChild(a);
        const c = a.getAttribute("data-tinyfly");
        c && n.registerTarget(c, a);
      }
    }
    this.setupNested(s, n);
  }
  /**
   * For each symbol instance container (`[data-tinyfly-symbol]`) in a scene slot,
   * bind its inner elements to a private adapter driven by the symbol's timeline.
   */
  setupNested(t, e) {
    const n = [];
    t.querySelectorAll("[data-tinyfly-symbol]").forEach((s) => {
      const r = s.getAttribute("data-tinyfly-symbol");
      if (!r) return;
      const o = this.symbolDefs.get(r);
      if (!o) return;
      const a = new K();
      s.querySelectorAll("[data-tinyfly]").forEach((c) => {
        const l = c.getAttribute("data-tinyfly");
        l && a.registerTarget(l, c);
      }), n.push({ adapter: a, timeline: gt(o) });
    }), n.length ? this.nestedByAdapter.set(e, n) : this.nestedByAdapter.delete(e);
  }
  /** Apply the nested symbol states for a slot at a given scene time. */
  applyNested(t, e) {
    const n = this.nestedByAdapter.get(t);
    if (n)
      for (const s of n) {
        const r = s.timeline.duration;
        s.adapter.applyState(s.timeline.getStateAtTime(r > 0 ? e % r : e));
      }
  }
  clearContainer(t) {
    t.innerHTML = "";
  }
  createTimeline(t) {
    return t.timeline ? gt(t.timeline) : null;
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
    const e = this.sequence.scenes[t], n = e.transition;
    if (n.type === "none" || n.duration <= 0) {
      this.switchToScene(t);
      return;
    }
    this._state = "transitioning", this.containerB.style.visibility = "visible", this.renderScene(e, this.containerB, this.adapterB), this.timelineB = this.createTimeline(e), this.timelineB && this.timelineB.play(), this.applyTransition(n.type, n.duration), this.transitionTimer = window.setTimeout(() => {
      this.finishTransition(t);
    }, n.duration);
  }
  applyTransition(t, e) {
    const n = `${e}ms`, s = "ease-in-out";
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
    switch (this.containerB.offsetHeight, this.containerA.style.transition = `opacity ${n} ${s}, transform ${n} ${s}`, this.containerB.style.transition = `opacity ${n} ${s}, transform ${n} ${s}`, t) {
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
    const n = this.adapterA;
    this.adapterA = this.adapterB, this.adapterB = n, this.timelineA = this.timelineB, this.timelineB = null, this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB), this._currentSceneIndex = t, this._state = "playing-scene", this.options.onSceneChange?.(t), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.playbackState !== "playing" && this.timelineA.play()) : this.onSceneComplete();
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
      const n = e - (this.lastTime ?? e);
      if (this.lastTime = e, this.timelineA && this.timelineA.playbackState === "playing") {
        this.timelineA.tick(n);
        const s = this.timelineA.getStateAtTime(this.timelineA.currentTime);
        this.adapterA.applyState(s), this.applyNested(this.adapterA, this.timelineA.currentTime);
      }
      if (this._state === "transitioning" && this.timelineB && this.timelineB.playbackState === "playing") {
        this.timelineB.tick(n);
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
async function zo(i, t, e = {}) {
  const n = new vo(i, { ...e, autoplay: !0 });
  return await n.load(t), n;
}
const Ho = { type: "none", duration: 0 };
function Go(i) {
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
  let n = null, s = null, r = !1;
  const o = (l) => {
    if (r) return;
    const h = s === null ? 0 : l - s;
    s = l, h > 0 && t.tick(h), n = requestAnimationFrame(o);
  }, a = () => {
    n !== null || r || (s = null, n = requestAnimationFrame(o));
  }, c = () => {
    n !== null && cancelAnimationFrame(n), n = null, s = null;
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
const Ko = {
  timeline: Ls,
  to(i, t, e) {
    const n = new nt(e);
    return n.to(i, t), n;
  },
  from(i, t, e) {
    const n = new nt(e);
    return n.from(i, t), n;
  },
  fromTo(i, t, e, n) {
    const s = new nt(n);
    return s.fromTo(i, t, e), s;
  },
  set(i, t, e) {
    const n = new nt(e);
    return n.set(i, t), n;
  }
}, Zo = q.to, Qo = q.from, Jo = q.fromTo, ta = q.set, ea = q.timeline, ia = q.ticker, na = q.splitText, sa = q.context, ra = q.matchMedia, oa = q.quickTo, aa = q.imageSequence, ca = q.pageTransition;
bo();
export {
  xo as Clock,
  nt as CompatTimeline,
  qr as CustomBounce,
  Br as CustomEase,
  Xr as CustomWiggle,
  yi as DEFAULT_BAKE_INTERVAL_MS,
  Te as DEFAULT_INERTIA_FRICTION,
  Jr as DEFAULT_LABELS,
  X as DEFAULT_SPRING,
  Ho as DEFAULT_TRANSITION,
  Ni as Draggable,
  Ct as FORMAT_VERSION,
  nn as INERTIA_MAX_DURATION_MS,
  zn as InertiaTrackPlayer,
  j as LiveTimeline,
  Co as MORPH_SAMPLES,
  To as ManualClock,
  oi as MediaSync,
  tr as Observer,
  fi as SPRING_MAX_DURATION_MS,
  Yt as SPRING_PRESETS,
  dt as SPRING_STEP_MS,
  xr as ScrollAnimator,
  qt as ScrollDriver,
  kr as ScrollMarkers,
  yr as ScrollPin,
  Je as SmoothScroll,
  Ot as SpringSampler,
  Un as SpringTrackPlayer,
  Us as Stage,
  ki as Timeline,
  we as TinyflyPlayer,
  vo as TinyflySequencer,
  zt as TrackPlayer,
  Bo as ValueResolver,
  gr as VisibilityDriver,
  mn as backOut,
  Ti as bakeEasing,
  vi as bakeInertiaTrack,
  bi as bakeSpringTrack,
  ho as bindChoiceHotspots,
  pn as bounceOut,
  Gn as charactersFor,
  Yi as clamp01,
  _o as clearMorphCache,
  Eo as clearPathCache,
  Ke as containerProgressAt,
  sa as context,
  jo as create,
  no as createControls,
  fn as createCubicBezier,
  zr as createLive,
  is as createRandom,
  oe as createTrack,
  Mo as criticalDamping,
  as as customBounce,
  os as customEase,
  cs as customWiggle,
  gt as deserializeTimeline,
  ts as deserializeTrack,
  qo as draggable,
  cn as easeIn,
  di as easeInCubic,
  hn as easeInOut,
  Bt as easeInOutCubic,
  an as easeInOutQuad,
  rn as easeInQuad,
  ln as easeOut,
  pi as easeOutCubic,
  on as easeOutQuad,
  dn as elasticOut,
  Wn as expandParametricEasings,
  Qo as from,
  Fo as fromJSON,
  Jo as fromTo,
  U as getEasingFunction,
  It as getInterpolator,
  xi as getMotionPathPoint,
  Po as getPathLength,
  An as getPointAtProgress,
  ir as gridLinesFor,
  Qi as hasKeyframes,
  Do as hashSeed,
  aa as imageSequence,
  vt as inertiaDuration,
  bt as inertiaRest,
  ne as inertiaValueAt,
  Ao as inertiaVelocityAt,
  Yn as interpolateArray,
  Xn as interpolateColor,
  Lo as interpolateMotionPath,
  W as interpolateNumber,
  Vn as interpolatePathString,
  Fe as interpolateString,
  Zi as isCubicBezierEasing,
  Z as isInertiaTrack,
  wo as isMotionPathPoint,
  li as isMotionPathTrack,
  Pt as isParametricEasing,
  wt as isPathData,
  Q as isSpringTrack,
  de as isTextTrack,
  So as isUnderdamped,
  No as isUnresolved,
  se as linear,
  q as live,
  Rt as mapEase,
  ra as matchMedia,
  ui as maxStaggerDistance,
  Nn as morphPath,
  fo as mount,
  go as mountAll,
  _t as naturalRest,
  ca as pageTransition,
  yn as parametricEasing,
  Ge as parseEdge,
  st as parsePath,
  Xi as parseTrigger,
  Wo as play,
  zo as playSequence,
  Yo as playWhenVisible,
  Si as playheadCrossings,
  mi as pointAtDistance,
  us as pointsToPath,
  Go as quickPlay,
  oa as quickTo,
  Ai as randomBetween,
  Oo as randomChoice,
  ns as randomSnapped,
  ss as resolveSequence,
  Ci as resolveValue,
  Xo as scrollProgress,
  Vo as scrubOnScroll,
  es as serializeTimeline,
  Jn as serializeTrack,
  ta as set,
  me as shapeToPathData,
  jn as simplifyKeyframes,
  mr as smoothToward,
  er as snapAxis,
  vr as snapConfig,
  Tr as snapDuration,
  wr as snapProgress,
  na as splitText,
  Ji as springDuration,
  ko as springValueAt,
  hi as staggerDistance,
  pe as staggerOffset,
  ie as staggerOffsets,
  Dt as staggerSpan,
  gn as stepsEasing,
  Qr as syncMediaElement,
  Zn as textAt,
  Ko as tf,
  ia as ticker,
  ea as timeline,
  Zo as to,
  $o as toJSON,
  Io as toKeyframedTrack,
  Ro as toKeyframedTracks,
  G as trackTargets,
  yt as triggerDistance,
  Uo as unmount
};
