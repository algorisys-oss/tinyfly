function Vo(e) {
  return typeof e == "object" && e !== null && e.type === "cubic-bezier";
}
function Ye(e) {
  return typeof e == "object" && e !== null && e.type !== "cubic-bezier";
}
const Ls = 2;
function ar(e) {
  return e.some((t) => t.interpolation !== void 0) ? 2 : 1;
}
function hs(e) {
  return e.property === "text" && "textConfig" in e;
}
function Pt(e) {
  return e.kind === "inertia" && "inertia" in e;
}
function _t(e) {
  return e.kind === "spring" && "spring" in e;
}
function lr(e) {
  return e.property === "motionPath" && "motionPathConfig" in e;
}
function Qd(e) {
  return typeof e == "object" && e !== null && "x" in e && "y" in e && "angle" in e;
}
function Uo(e) {
  return "keyframes" in e;
}
class t0 {
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
class e0 {
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
function n0(e, t) {
  if (!(t > 0)) return e;
  const n = 1e3 / t;
  return Math.floor(e / n + 1e-9) * n;
}
function cr(e, t, n = "start") {
  if (t <= 1) return 0;
  if (typeof n == "number") {
    const s = Math.max(0, Math.min(t - 1, n));
    return Math.abs(e - s);
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
function hr(e, t = "start") {
  if (e <= 1) return 0;
  let n = 0;
  for (let s = 0; s < e; s++)
    n = Math.max(n, cr(s, e, t));
  return n;
}
function us(e, t, n) {
  if (n.offsets) return n.offsets[e] ?? 0;
  const s = n.from ?? "start", i = cr(e, t, s);
  if (n.amount !== void 0) {
    const r = hr(t, s);
    return r === 0 ? 0 : n.amount * i / r;
  }
  return n.each !== void 0 ? n.each * i : 0;
}
function Dn(e, t) {
  return Array.from({ length: e }, (n, s) => us(s, e, t));
}
function on(e, t) {
  return e <= 1 ? 0 : Math.max(...Dn(e, t));
}
const ne = 1, ur = 6e4, xe = ur / ne, st = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, pn = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class an {
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
    this.from = t.from, this.to = t.to, this.stiffness = t.stiffness ?? st.stiffness, this.damping = t.damping ?? st.damping, this.mass = t.mass ?? st.mass, this.restDelta = t.restDelta ?? st.restDelta, this.restSpeed = t.restSpeed ?? st.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = t.velocity ?? st.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = Math.floor(t / ne);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const s = this.samples[Math.min(n, this.samples.length - 1)], i = this.samples[Math.min(n + 1, this.samples.length - 1)], r = t / ne - n;
    return s + (i - s) * r;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(xe + 1), this.settledStep !== null ? this.settledStep * ne : ur;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(t) {
    if (this.settledStep !== null) return;
    const n = Math.min(t, xe + 1), s = ne / 1e3;
    for (; this.samples.length < n; ) {
      const i = this.samples[this.samples.length - 1], r = i - this.to, o = -this.stiffness * r, a = -this.damping * this.velocity, l = (o + a) / this.mass;
      this.velocity += l * s;
      const c = i + this.velocity * s;
      if (this.samples.push(c), this.isAtRest(c)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > xe && (this.settledStep = xe);
  }
}
function s0(e, t) {
  return new an(e).valueAt(t);
}
function zo(e) {
  return new an(e).settleTime();
}
function i0(e) {
  const t = e.stiffness ?? st.stiffness, n = e.damping ?? st.damping, s = e.mass ?? st.mass;
  return n < 2 * Math.sqrt(t * s);
}
function r0(e) {
  const t = e.stiffness ?? st.stiffness, n = e.mass ?? st.mass;
  return 2 * Math.sqrt(t * n);
}
const Fs = 4, jo = 2e-3, Go = 1e-4, Jo = 6e4;
function ln(e) {
  const t = e.friction ?? Fs;
  return t > 0 ? t : Fs;
}
function Xe(e) {
  return e.from + e.velocity / ln(e);
}
function Zo(e, t) {
  if (t === void 0) return e;
  if (typeof t == "number")
    return t > 0 ? Math.round(e / t) * t : e;
  if (t.length === 0) return e;
  let n = t[0];
  for (const s of t)
    Math.abs(s - e) < Math.abs(n - e) && (n = s);
  return n;
}
function we(e) {
  let t = Zo(Xe(e), e.end);
  return e.min !== void 0 && (t = Math.max(e.min, t)), e.max !== void 0 && (t = Math.min(e.max, t)), t;
}
function ve(e) {
  const t = Math.abs(we(e) - e.from);
  if (t === 0) return 0;
  const n = e.restDelta ?? Math.max(Go, t * jo);
  if (n >= t) return 0;
  const s = Math.log(t / n) / ln(e);
  return Math.min(Jo, s * 1e3);
}
function Wn(e, t) {
  if (t <= 0) return e.from;
  const n = we(e);
  if (t >= ve(e)) return n;
  const s = ln(e);
  return e.from + (n - e.from) * (1 - Math.exp(-s * t / 1e3));
}
function o0(e, t) {
  const n = ln(e), s = we(e);
  return t >= ve(e) ? 0 : (s - e.from) * n * Math.exp(-n * Math.max(0, t) / 1e3);
}
const Nn = (e) => e, Qo = (e) => e * e, ta = (e) => 1 - (1 - e) * (1 - e), ea = (e) => e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2, fr = (e) => e * e * e, dr = (e) => 1 - Math.pow(1 - e, 3), cn = (e) => e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2, na = fr, sa = dr, ia = cn, ra = {
  linear: Nn,
  "ease-in": na,
  "ease-out": sa,
  "ease-in-out": ia,
  "ease-in-quad": Qo,
  "ease-out-quad": ta,
  "ease-in-out-quad": ea,
  "ease-in-cubic": fr,
  "ease-out-cubic": dr,
  "ease-in-out-cubic": cn
};
function oa(e) {
  const [t, n, s, i] = e, r = 3 * t, o = 3 * (s - t) - r, a = 1 - r - o, l = 3 * n, c = 3 * (i - n) - l, h = 1 - l - c, u = (p) => ((a * p + o) * p + r) * p, f = (p) => ((h * p + c) * p + l) * p, d = (p) => (3 * a * p + 2 * o) * p + r, m = (p) => {
    let g = p;
    for (let w = 0; w < 8; w++) {
      const S = u(g) - p;
      if (Math.abs(S) < 1e-7)
        return g;
      const k = d(g);
      if (Math.abs(k) < 1e-7)
        break;
      g -= S / k;
    }
    let y = 0, b = 1;
    for (g = p; y < b; ) {
      const w = u(g);
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
    return f(g);
  };
}
function mn(e, t = "out") {
  if (t === "out") return e;
  const n = (s) => 1 - e(1 - s);
  return t === "in" ? n : (s) => s < 0.5 ? n(s * 2) / 2 : e(s * 2 - 1) / 2 + 0.5;
}
function aa(e = 1, t = 0.3) {
  const n = Math.max(1, e), s = t / (2 * Math.PI) * Math.asin(1 / n);
  return (i) => i <= 0 ? 0 : i >= 1 ? 1 : n * Math.pow(2, -10 * i) * Math.sin((i - s) * (2 * Math.PI) / t) + 1;
}
const la = (e) => {
  if (e <= 0) return 0;
  if (e >= 1) return 1;
  if (e < 1 / 2.75) return 7.5625 * e * e;
  if (e < 2 / 2.75) {
    const i = e - 0.5454545454545454;
    return 7.5625 * i * i + 0.75;
  }
  if (e < 2.5 / 2.75) {
    const i = e - 0.8181818181818182;
    return 7.5625 * i * i + 0.9375;
  }
  const s = e - 2.625 / 2.75;
  return 7.5625 * s * s + 0.984375;
};
function ca(e = 1.70158) {
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const n = t - 1;
    return n * n * ((e + 1) * n + e) + 1;
  };
}
function ha(e, t = "end") {
  const n = Math.max(1, Math.floor(e));
  return (s) => {
    if (s >= 1) return 1;
    if (s <= 0) return t === "start" || t === "both" ? t === "start" ? 1 / n : 1 / (n + 1) : 0;
    const i = Math.floor(s * n);
    switch (t) {
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
function ua(e) {
  switch (e.type) {
    case "steps":
      return ha(e.count, e.position);
    case "elastic":
      return mn(aa(e.amplitude, e.period), e.mode);
    case "bounce":
      return mn(la, e.mode);
    case "back":
      return mn(ca(e.overshoot), e.mode);
  }
}
function Z(e) {
  return e === void 0 ? Nn : Vo(e) ? oa(e.points) : Ye(e) ? ua(e) : ra[e] ?? Nn;
}
const Bs = 32, fa = 256, Ot = /* @__PURE__ */ new Map(), da = /[MmLlHhVvCcSsQqTtAaZz]/, pa = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, ma = {
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
function ga(e) {
  const t = [];
  let n = 0, s = null;
  const i = () => {
    for (; n < e.length && /[\s,]/.test(e[n]); ) n++;
  };
  for (; n < e.length && (i(), !(n >= e.length)); ) {
    const r = e[n];
    if (da.test(r)) {
      s = { type: r, args: [] }, t.push(s), n++;
      continue;
    }
    if (!s) break;
    const o = s.type === "A" || s.type === "a", a = s.args.length % 7;
    if (o && (a === 3 || a === 4)) {
      if (r !== "0" && r !== "1") break;
      s.args.push(r === "1" ? 1 : 0), n++;
      continue;
    }
    const l = pa.exec(e.slice(n));
    if (!l) break;
    s.args.push(parseFloat(l[0])), n += l[0].length;
  }
  return t;
}
function ya(e, t, n, s, i, r, o, a, l) {
  if (e === a && t === l) return [];
  let c = Math.abs(n), h = Math.abs(s);
  if (c === 0 || h === 0) return [[e, t, a, l, a, l]];
  const u = i * Math.PI / 180, f = Math.cos(u), d = Math.sin(u), m = (e - a) / 2, p = (t - l) / 2, g = f * m + d * p, y = -d * m + f * p, b = g * g / (c * c) + y * y / (h * h);
  if (b > 1) {
    const H = Math.sqrt(b);
    c *= H, h *= H;
  }
  const w = r === o ? -1 : 1, S = c * c * h * h - c * c * y * y - h * h * g * g, k = c * c * y * y + h * h * g * g, x = w * Math.sqrt(Math.max(0, S / k)), v = x * c * y / h, E = -x * h * g / c, M = f * v - d * E + (e + a) / 2, A = d * v + f * E + (t + l) / 2, T = (H, L, F, D) => {
    const z = H * F + L * D, ft = Math.sqrt((H * H + L * L) * (F * F + D * D)), vt = Math.acos(Math.max(-1, Math.min(1, z / ft)));
    return H * D - L * F < 0 ? -vt : vt;
  }, P = T(1, 0, (g - v) / c, (y - E) / h);
  let _ = T((g - v) / c, (y - E) / h, (-g - v) / c, (-y - E) / h);
  !o && _ > 0 && (_ -= 2 * Math.PI), o && _ < 0 && (_ += 2 * Math.PI);
  const I = Math.max(1, Math.ceil(Math.abs(_) / (Math.PI / 2))), C = _ / I, R = 4 / 3 * Math.tan(C / 4), B = (H) => {
    const L = c * Math.cos(H), F = h * Math.sin(H);
    return [f * L - d * F + M, d * L + f * F + A];
  }, $ = (H) => {
    const L = -c * Math.sin(H), F = h * Math.cos(H);
    return [f * L - d * F, d * L + f * F];
  }, O = [];
  for (let H = 0; H < I; H++) {
    const L = P + H * C, F = L + C, [D, z] = B(L), [ft, vt] = H === I - 1 ? [a, l] : B(F), [Ko, Yo] = $(L), [Xo, qo] = $(F);
    O.push([D + R * Ko, z + R * Yo, ft - R * Xo, vt - R * qo, ft, vt]);
  }
  return O;
}
function gt(e, t, n, s, i) {
  const r = 1 - i;
  return r * r * r * e + 3 * r * r * i * t + 3 * r * i * i * n + i * i * i * s;
}
function Ds(e, t, n, s, i) {
  const r = 1 - i;
  return 3 * r * r * (t - e) + 6 * r * i * (n - t) + 3 * i * i * (s - n);
}
function zt(e, t, n, s) {
  return {
    subpath: 0,
    type: "L",
    points: [n, s],
    startX: e,
    startY: t,
    endX: n,
    endY: s,
    length: Math.hypot(n - e, s - t)
  };
}
function Te(e, t, n) {
  const [s, i, r, o, a, l] = n, c = [0];
  let h = e, u = t, f = 0;
  for (let d = 1; d <= Bs; d++) {
    const m = d / Bs, p = gt(e, s, r, a, m), g = gt(t, i, o, l, m);
    f += Math.hypot(p - h, g - u), c.push(f), h = p, u = g;
  }
  return {
    subpath: 0,
    type: "C",
    points: [s, i, r, o, a, l],
    startX: e,
    startY: t,
    endX: a,
    endY: l,
    length: f,
    lengths: c
  };
}
function Yt(e) {
  const t = Ot.get(e);
  if (t) return t;
  const n = [];
  let s = 0, i = 0, r = 0, o = 0, a = null, l = null, c = -1;
  const h = /* @__PURE__ */ new Set(), u = (p) => {
    c < 0 && (c = 0), p.subpath = c, n.push(p);
  };
  for (const { type: p, args: g } of ga(e)) {
    const y = p.toUpperCase(), b = p !== y, w = ma[y];
    if (y === "Z") {
      (s !== r || i !== o) && u(zt(s, i, r, o)), c >= 0 && h.add(c), s = r, i = o, a = l = null;
      continue;
    }
    for (let S = 0; S + w <= g.length; S += w) {
      const k = g.slice(S, S + w), x = b ? s : 0, v = b ? i : 0;
      let E = null, M = null;
      switch (y) {
        case "M":
          S === 0 ? (s = k[0] + x, i = k[1] + v, r = s, o = i, (c < 0 || n[n.length - 1]?.subpath === c) && c++) : (u(zt(s, i, k[0] + x, k[1] + v)), s = k[0] + x, i = k[1] + v);
          break;
        case "L":
          u(zt(s, i, k[0] + x, k[1] + v)), s = k[0] + x, i = k[1] + v;
          break;
        case "H":
          u(zt(s, i, k[0] + x, i)), s = k[0] + x;
          break;
        case "V":
          u(zt(s, i, s, k[0] + v)), i = k[0] + v;
          break;
        case "C": {
          const A = [k[0] + x, k[1] + v, k[2] + x, k[3] + v, k[4] + x, k[5] + v];
          u(Te(s, i, A)), E = [A[2], A[3]], s = A[4], i = A[5];
          break;
        }
        case "S": {
          const [A, T] = a ? [2 * s - a[0], 2 * i - a[1]] : [s, i], P = [A, T, k[0] + x, k[1] + v, k[2] + x, k[3] + v];
          u(Te(s, i, P)), E = [P[2], P[3]], s = P[4], i = P[5];
          break;
        }
        case "Q":
        case "T": {
          let A = s, T = i;
          y === "Q" ? (A = k[0] + x, T = k[1] + v) : l && (A = 2 * s - l[0], T = 2 * i - l[1]);
          const P = y === "Q" ? k[2] + x : k[0] + x, _ = y === "Q" ? k[3] + v : k[1] + v;
          u(
            Te(s, i, [
              s + 2 / 3 * (A - s),
              i + 2 / 3 * (T - i),
              P + 2 / 3 * (A - P),
              _ + 2 / 3 * (T - _),
              P,
              _
            ])
          ), M = [A, T], s = P, i = _;
          break;
        }
        case "A": {
          const A = k[5] + x, T = k[6] + v;
          let P = s, _ = i;
          for (const I of ya(s, i, k[0], k[1], k[2], k[3], k[4], A, T))
            u(Te(P, _, I)), P = I[4], _ = I[5];
          s = A, i = T;
          break;
        }
      }
      a = E, l = M;
    }
  }
  const f = n.reduce((p, g) => p + g.length, 0), d = [];
  for (let p = 0; p < n.length; ) {
    const g = n[p].subpath;
    let y = p, b = 0;
    for (; y < n.length && n[y].subpath === g; ) b += n[y++].length;
    const w = n[p], S = n[y - 1], k = h.has(g) || Math.abs(S.endX - w.startX) < 1e-9 && Math.abs(S.endY - w.startY) < 1e-9;
    d.push({ start: p, end: y, length: b, closed: k }), p = y;
  }
  const m = { segments: n, totalLength: f, subpaths: d };
  return Ot.size >= fa && Ot.delete(Ot.keys().next().value), Ot.set(e, m), m;
}
function ba(e, t) {
  const n = e.lengths;
  if (t <= 0) return 0;
  if (t >= e.length) return 1;
  let s = 0, i = n.length - 1;
  for (; s < i - 1; ) {
    const a = s + i >> 1;
    n[a] < t ? s = a : i = a;
  }
  const r = n[i] - n[s], o = r > 0 ? (t - n[s]) / r : 0;
  return (s + o) / (n.length - 1);
}
function wa(e, t) {
  if (e.type === "L") {
    const u = e.length > 0 ? Math.max(0, Math.min(1, t / e.length)) : 0;
    return {
      x: e.startX + (e.endX - e.startX) * u,
      y: e.startY + (e.endY - e.startY) * u,
      angle: Math.atan2(e.endY - e.startY, e.endX - e.startX) * 180 / Math.PI
    };
  }
  const [n, s, i, r, o, a] = e.points, l = ba(e, t);
  let c = Ds(e.startX, n, i, o, l), h = Ds(e.startY, s, r, a, l);
  if (Math.hypot(c, h) < 1e-9) {
    const u = l < 0.5 ? Math.min(1, l + 1e-3) : Math.max(0, l - 1e-3), f = gt(e.startX, n, i, o, u), d = gt(e.startY, s, r, a, u), m = gt(e.startX, n, i, o, l), p = gt(e.startY, s, r, a, l);
    c = l < 0.5 ? f - m : m - f, h = l < 0.5 ? d - p : p - d;
  }
  return {
    x: gt(e.startX, n, i, o, l),
    y: gt(e.startY, s, r, a, l),
    angle: Math.atan2(h, c) * 180 / Math.PI
  };
}
function pr(e, t, n = 0, s = e.length) {
  if (s <= n) return { x: 0, y: 0, angle: 0 };
  let i = 0;
  for (let r = n; r < s; r++) {
    const o = e[r];
    if (i + o.length >= t || r === s - 1)
      return wa(o, t - i);
    i += o.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function va(e, t) {
  const { segments: n, totalLength: s } = Yt(e);
  return pr(n, Math.max(0, Math.min(1, t)) * s);
}
function a0() {
  Ot.clear();
}
function l0(e) {
  return Yt(e).totalLength;
}
const ka = 24, Sa = 320, Ma = 2.5, jt = 72, c0 = 64, xa = 0.2, Ta = 128, se = /* @__PURE__ */ new Map();
let Le = 0, mt;
const Ws = (e) => Math.round(e * 100) / 100;
function Ns(e, t) {
  const { segments: n, subpaths: s, totalLength: i } = Yt(e);
  if (n.length === 0) return [];
  if (t) {
    const r = s.every((o) => o.closed);
    return [{ segments: n, start: 0, end: n.length, length: i, closed: r }];
  }
  return s.filter((r) => r.length > 0).map((r) => ({ segments: n, start: r.start, end: r.end, length: r.length, closed: r.closed }));
}
function Kn(e, t) {
  const n = e.closed ? (t % 1 + 1) % 1 : Math.max(0, Math.min(1, t)), s = pr(e.segments, n * e.length, e.start, e.end);
  return [s.x, s.y];
}
function Ks(e) {
  const t = [];
  let n = 0;
  for (let s = e.start; s < e.end; s++)
    n += e.segments[s].length, e.length > 0 && t.push(n / e.length);
  return t;
}
function Ys(e, t) {
  const n = [];
  for (let s = 0; s < t; s++)
    n.push(Kn(e, e.closed ? s / t : s / (t - 1)));
  return n;
}
function Xs(e) {
  let t = 0, n = 0;
  for (const [s, i] of e)
    t += s, n += i;
  return t /= e.length, n /= e.length, e.map(([s, i]) => [s - t, i - n]);
}
function Ea(e, t, n) {
  const s = e.closed && t.closed;
  if (n !== void 0)
    return { offset: s ? Math.abs(n) % jt / jt : 0, reversed: n < 0 };
  const i = Xs(Ys(e, jt)), r = Xs(Ys(t, jt)), o = jt;
  let a = { offset: 0, reversed: !1 }, l = 1 / 0;
  for (const c of [!1, !0]) {
    const h = s ? o : 1;
    for (let u = 0; u < h; u++) {
      let f = 0;
      for (let d = 0; d < o && f < l; d++) {
        const m = s ? c ? (u - d + o) % o : (d + u) % o : c ? o - 1 - d : d, p = i[d][0] - r[m][0], g = i[d][1] - r[m][1];
        f += p * p + g * g;
      }
      f < l && (l = f, a = { offset: s ? u / o : 0, reversed: c });
    }
  }
  return a;
}
function Aa(e, t, n) {
  return n ? ((t.reversed ? t.offset - e : e + t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function Pa(e, t, n) {
  return n ? ((t.reversed ? t.offset - e : e - t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function _a(e, t, n) {
  const s = e.closed && t.closed, i = Ea(e, t, n.shapeIndex), r = Math.max(
    ka,
    Math.min(Sa, Math.ceil(Math.max(e.length, t.length) / Ma))
  ), o = /* @__PURE__ */ new Set(), a = (u) => o.add(Math.round(u * 1e7) / 1e7);
  for (let u = 0; u <= r; u++) a(u / r);
  for (const u of Ks(e)) a(u);
  for (const u of Ks(t)) a(Pa(u, i, s));
  let l = [...o].sort((u, f) => u - f);
  s && (l = l.filter((u) => u < 1));
  const c = [], h = [];
  for (const u of l)
    c.push(...Kn(e, u)), h.push(...Kn(t, Aa(u, i, s)));
  return Ia({ from: c, to: h, closed: s });
}
function Ia(e) {
  const t = e.from.length / 2;
  if (t <= 3) return e;
  const n = new Uint8Array(t);
  n[0] = 1, n[t - 1] = 1;
  const s = [[0, t - 1]];
  for (; s.length > 0; ) {
    const [o, a] = s.pop();
    let l = -1, c = xa;
    for (let h = o + 1; h < a; h++) {
      const u = Math.max(qs(e.from, o, a, h), qs(e.to, o, a, h));
      u > c && (c = u, l = h);
    }
    l !== -1 && (n[l] = 1, s.push([o, l], [l, a]));
  }
  const i = [], r = [];
  for (let o = 0; o < t; o++)
    n[o] && (i.push(e.from[o * 2], e.from[o * 2 + 1]), r.push(e.to[o * 2], e.to[o * 2 + 1]));
  return { from: i, to: r, closed: e.closed };
}
function qs(e, t, n, s) {
  const i = e[t * 2], r = e[t * 2 + 1], o = e[n * 2] - i, a = e[n * 2 + 1] - r, l = e[s * 2] - i, c = e[s * 2 + 1] - r, h = o * o + a * a, u = h === 0 ? 0 : Math.max(0, Math.min(1, (l * o + c * a) / h));
  return Math.hypot(l - u * o, c - u * a);
}
function Ca(e, t, n) {
  const s = n.shapeIndex;
  if (mt && mt.from === e && mt.to === t && mt.shapeIndex === s) return mt.plan;
  const r = se.get(String(s ?? "auto"))?.get(e)?.get(t);
  if (r)
    return mt = { from: e, to: t, shapeIndex: s, plan: r }, r;
  const o = Yt(e).subpaths.filter((d) => d.length > 0).length === Yt(t).subpaths.filter((d) => d.length > 0).length, a = Ns(e, !o), l = Ns(t, !o), c = {
    pairs: a.map((d, m) => _a(d, l[m], n))
  };
  Le >= Ta && (se.clear(), Le = 0);
  const h = String(s ?? "auto"), u = se.get(h) ?? /* @__PURE__ */ new Map();
  se.set(h, u);
  const f = u.get(e) ?? /* @__PURE__ */ new Map();
  return u.set(e, f), f.set(t, c), Le++, mt = { from: e, to: t, shapeIndex: s, plan: c }, c;
}
function Ha(e, t, n, s = {}) {
  if (!e) return t;
  if (!t) return e;
  const i = Math.max(0, Math.min(1, n));
  if (i === 0) return e;
  if (i === 1) return t;
  const r = Ca(e, t, s);
  if (r.pairs.length === 0) return i < 0.5 ? e : t;
  let o = "";
  for (const a of r.pairs) {
    for (let l = 0; l < a.from.length; l += 2) {
      const c = Ws(a.from[l] + (a.to[l] - a.from[l]) * i), h = Ws(a.from[l + 1] + (a.to[l + 1] - a.from[l + 1]) * i);
      o += `${l === 0 ? o ? " M" : "M" : " L"}${c} ${h}`;
    }
    a.closed && (o += " Z");
  }
  return o;
}
function h0() {
  se.clear(), Le = 0, mt = void 0;
}
function ke(e) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(e);
}
const Lt = Math.PI / 180, $a = 0.9995;
function fs() {
  return [0, 0, 0, 1];
}
function Wt(e, t) {
  const n = Math.hypot(e[0], e[1], e[2]);
  if (n === 0) return fs();
  const s = t * Lt / 2, i = Math.sin(s) / n;
  return [e[0] * i, e[1] * i, e[2] * i, Math.cos(s)];
}
function Ra(e, t, n) {
  return Yn(Yn(Wt([0, 1, 0], t), Wt([1, 0, 0], e)), Wt([0, 0, 1], n));
}
function Oa(e) {
  const [t, n, s, i] = bt(e), r = 2 * (t * s + n * i), o = 2 * (t * n + s * i), a = 1 - 2 * (t * t + s * s), l = 2 * (n * s - t * i), c = 1 - 2 * (n * n + s * s), h = 2 * (t * s - n * i), u = 1 - 2 * (t * t + n * n), f = Math.asin(Math.max(-1, Math.min(1, -l)));
  return Math.abs(l) < 0.9999999 ? [f / Lt, Math.atan2(r, u) / Lt, Math.atan2(o, a) / Lt] : [f / Lt, Math.atan2(-h, c) / Lt, 0];
}
function Yn(e, t) {
  const [n, s, i, r] = e, [o, a, l, c] = t;
  return [
    r * o + n * c + s * l - i * a,
    r * a - n * l + s * c + i * o,
    r * l + n * a - s * o + i * c,
    r * c - n * o - s * a - i * l
  ];
}
function mr(e, t) {
  return e[0] * t[0] + e[1] * t[1] + e[2] * t[2] + e[3] * t[3];
}
function gr(e) {
  return Math.hypot(e[0], e[1], e[2], e[3]);
}
function bt(e) {
  const t = gr(e);
  return t === 0 ? fs() : [e[0] / t, e[1] / t, e[2] / t, e[3] / t];
}
function La(e) {
  return [-e[0], -e[1], -e[2], e[3]];
}
function yr(e, t, n) {
  const s = bt(e);
  let i = bt(t), r = mr(s, i);
  if (r < 0 && (i = [-i[0], -i[1], -i[2], -i[3]], r = -r), r > $a)
    return bt([
      s[0] + (i[0] - s[0]) * n,
      s[1] + (i[1] - s[1]) * n,
      s[2] + (i[2] - s[2]) * n,
      s[3] + (i[3] - s[3]) * n
    ]);
  const o = Math.acos(r), a = Math.sin(o), l = Math.sin((1 - n) * o) / a, c = Math.sin(n * o) / a;
  return bt([
    s[0] * l + i[0] * c,
    s[1] * l + i[1] * c,
    s[2] * l + i[2] * c,
    s[3] * l + i[3] * c
  ]);
}
function Fa(e, t) {
  const [n, s, i, r] = bt(e), o = 2 * (s * t[2] - i * t[1]), a = 2 * (i * t[0] - n * t[2]), l = 2 * (n * t[1] - s * t[0]);
  return [t[0] + r * o + (s * l - i * a), t[1] + r * a + (i * o - n * l), t[2] + r * l + (n * a - s * o)];
}
const u0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  conjugate: La,
  dot: mr,
  fromAxisAngle: Wt,
  fromEuler: Ra,
  identity: fs,
  length: gr,
  multiply: Yn,
  normalize: bt,
  rotateVec3: Fa,
  slerp: yr,
  toEuler: Oa
}, Symbol.toStringTag, { value: "Module" })), ht = (e, t, n) => e + (t - e) * n, br = 512, gn = /* @__PURE__ */ new Map(), yn = /* @__PURE__ */ new Map();
function Vs(e) {
  const t = gn.get(e);
  if (t) return t;
  const n = e.replace("#", ""), s = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return gn.size < br && gn.set(e, s), s;
}
const Us = (e) => e.charCodeAt(0) === 35, zs = (e) => e.startsWith("rgb"), js = (e) => e.startsWith("rgba"), Ba = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, bn = (e) => Math.round(e).toString(16).padStart(2, "0");
function Da(e, t, n) {
  return `#${bn(e)}${bn(t)}${bn(n)}`;
}
function Gs(e) {
  const t = yn.get(e);
  if (t) return t;
  const n = e.match(Ba);
  if (!n)
    throw new Error(`Invalid rgb color: ${e}`);
  const s = parseInt(n[1], 10), i = parseInt(n[2], 10), r = parseInt(n[3], 10), o = n[4] !== void 0 ? [s, i, r, parseFloat(n[4])] : [s, i, r];
  return yn.size < br && yn.set(e, o), o;
}
const Wa = (e, t, n) => {
  if (Us(e) && Us(t)) {
    const [s, i, r] = Vs(e), [o, a, l] = Vs(t), c = ht(s, o, n), h = ht(i, a, n), u = ht(r, l, n);
    return Da(c, h, u);
  }
  if ((zs(e) || js(e)) && (zs(t) || js(t))) {
    const s = Gs(e), i = Gs(t), r = Math.round(ht(s[0], i[0], n)), o = Math.round(ht(s[1], i[1], n)), a = Math.round(ht(s[2], i[2], n));
    if (s.length === 4 || i.length === 4) {
      const l = s[3] ?? 1, c = i[3] ?? 1, h = ht(l, c, n);
      return `rgba(${r}, ${o}, ${a}, ${h})`;
    }
    return `rgb(${r}, ${o}, ${a})`;
  }
  return n < 1 ? e : t;
}, Na = (e, t, n) => {
  const s = Math.min(e.length, t.length), i = [];
  for (let r = 0; r < s; r++)
    i.push(ht(e[r], t[r], n));
  return i;
}, Ka = (e, t, n) => yr(e, t, n), Js = (e, t, n) => n < 1 ? e : t, Ya = (e, t, n) => Ha(e, t, n);
function qe(e, t) {
  return t === "slerp" ? Ka : typeof e == "number" ? ht : Array.isArray(e) ? Na : typeof e == "string" ? e.startsWith("#") || e.startsWith("rgb") ? Wa : ke(e) ? Ya : Js : Js;
}
const wr = 1e3 / 60;
function vr(e, t = {}) {
  if (!_t(e))
    throw new Error(`bakeSpringTrack: track "${e.id}" is not a spring track`);
  const n = new an(e.spring);
  return Sr(e, (s) => n.valueAt(s), n.settleTime(), e.spring.from, e.spring.to, t);
}
function kr(e, t = {}) {
  if (!Pt(e))
    throw new Error(`bakeInertiaTrack: track "${e.id}" is not an inertia track`);
  const n = e.inertia;
  return Sr(
    e,
    (s) => Wn(n, s),
    ve(n),
    n.from,
    we(n),
    t
  );
}
function Sr(e, t, n, s, i, r) {
  const o = r.intervalMs ?? wr, a = r.tolerance ?? 0.01, l = e.delay ?? 0, c = [];
  for (let u = 0; u <= n; u += o)
    c.push({ time: u + l, value: t(u), easing: "linear" });
  const h = c[c.length - 1];
  return !h || h.time < n + l ? c.push({ time: n + l, value: i, easing: "linear" }) : h.value = i, l > 0 && c.unshift({ time: 0, value: s, easing: "linear" }), {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: a > 0 ? qa(c, a) : c,
    ...e.targets && { targets: [...e.targets] },
    ...e.stagger && { stagger: { ...e.stagger } }
  };
}
function Mr(e, t, n, s = {}) {
  const i = s.intervalMs ?? wr, r = typeof n == "function" ? n : Z(n), o = qe(e.value, s.interpolation), a = t.time - e.time;
  if (a <= 0) return [t];
  const l = [];
  for (let h = i; h < a; h += i) {
    const u = h / a;
    l.push({
      time: e.time + h,
      value: o(e.value, t.value, r(u)),
      easing: "linear"
    });
  }
  const c = r(1);
  return l.push({ ...t, ...c !== 1 && { value: o(e.value, t.value, c) }, easing: "linear" }), l;
}
function f0(e, t) {
  return _t(e) ? vr(e, t) : Pt(e) ? kr(e, t) : e;
}
function Xa(e, t = {}) {
  const n = e.keyframes;
  if (!n.some((r) => Ye(r.easing))) return e;
  const s = n.length > 0 ? [n[0]] : [], i = { ...t, interpolation: e.interpolation ?? t.interpolation };
  for (let r = 1; r < n.length; r++) {
    const o = n[r];
    Ye(o.easing) ? s.push(...Mr(n[r - 1], o, o.easing, i)) : s.push(o);
  }
  return { ...e, keyframes: s };
}
function d0(e, t) {
  return e.filter(Uo).map((n) => Xa(n, t)).concat(
    e.filter(_t).map((n) => vr(n, t)),
    e.filter(Pt).map((n) => kr(n, t))
  );
}
function qa(e, t) {
  if (e.length <= 2) return e;
  const n = [e[0]];
  for (let s = 1; s < e.length - 1; s++) {
    const i = n[n.length - 1], r = e[s], o = e[s + 1], a = o.time - i.time;
    if (a <= 0) continue;
    const l = (r.time - i.time) / a, c = i.value + (o.value - i.value) * l;
    Math.abs(r.value - c) > t && n.push(r);
  }
  return n.push(e[e.length - 1]), n;
}
function Xn(e) {
  const t = [...e.keyframes].sort((n, s) => n.time - s.time);
  return {
    ...e,
    keyframes: t
  };
}
function Mt(e) {
  return e.targets && e.targets.length > 0 ? e.targets : [e.target];
}
function Xt(e, t, n, s) {
  const i = n ?? 0;
  return !s || t <= 1 ? i : i + us(e, t, s);
}
class wn {
  track;
  targets;
  constructor(t) {
    this.track = t, this.targets = Mt(t);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(t) {
    return this.valueForOffset(t - Xt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  /**
   * Every target's value at a specific time, in target order.
   *
   * Single-target tracks yield one entry; staggered tracks yield one per target,
   * each sampled at its own offset time.
   */
  getTargetValues(t) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const r = Xt(i, n, this.track.delay, this.track.stagger), o = this.valueForOffset(t - r);
      o !== void 0 && s.push({ target: this.targets[i], value: o, start: r + this.track.keyframes[0].time });
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
    const n = t[t.length - 1].time, s = this.track.stagger ? on(this.targets.length, this.track.stagger) : 0;
    return n + (this.track.delay ?? 0) + s + (this.track.endDelay ?? 0);
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
    const { from: s, to: i } = this.findSurroundingKeyframes(t);
    if (!s || !i)
      return;
    if (s.time === t)
      return s.value;
    const r = i.time - s.time, o = (t - s.time) / r, l = Z(i.easing)(o);
    return qe(s.value, this.track.interpolation)(s.value, i.value, l);
  }
  /**
   * Find the keyframes surrounding a given time.
   */
  findSurroundingKeyframes(t) {
    const { keyframes: n } = this.track;
    for (let s = 0; s < n.length - 1; s++)
      if (t >= n[s].time && t <= n[s + 1].time)
        return { from: n[s], to: n[s + 1] };
    return { from: null, to: null };
  }
}
class Va {
  track;
  targets;
  sampler;
  constructor(t) {
    this.track = t, this.targets = Mt(t), this.sampler = new an(t.spring);
  }
  getValueAtTime(t) {
    return this.sampler.valueAt(t - Xt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const r = Xt(i, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[i], value: this.sampler.valueAt(t - r), start: r });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? on(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
class Ua {
  track;
  targets;
  duration;
  constructor(t) {
    this.track = t, this.targets = Mt(t), this.duration = ve(t.inertia);
  }
  getValueAtTime(t) {
    return Wn(this.track.inertia, t - Xt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const r = Xt(i, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[i], value: Wn(this.track.inertia, t - r), start: r });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? on(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
function xr(e, t) {
  const n = { ...va(e.pathData, t) };
  if (e.matrix) {
    const [s, i, r, o, a, l] = e.matrix, { x: c, y: h } = n;
    n.x = s * c + r * h + a, n.y = i * c + o * h + l;
    const u = n.angle * Math.PI / 180, f = Math.cos(u), d = Math.sin(u);
    n.angle = Math.atan2(i * f + o * d, s * f + r * d) * 180 / Math.PI;
  }
  return e.autoRotate && e.rotateOffset && (n.angle += e.rotateOffset), n;
}
function p0(e, t, n, s) {
  const i = t + (n - t) * s;
  return xr(e, i);
}
const vn = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, za = 20;
function ja(e) {
  const t = vn[e ?? "upperCase"] ?? e ?? vn.upperCase, n = Array.from(t);
  return n.length > 0 ? n : Array.from(vn.upperCase);
}
function Ga(e, t, n) {
  let s = (e | 0) ^ Math.imul(t + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return s = Math.imul(s ^ s >>> 16, 2146121005), s = Math.imul(s ^ s >>> 15, 2221713035), (s ^ s >>> 16) >>> 0;
}
function Ja(e, t, n = 0) {
  const s = e.from ?? "", i = e.to, r = Math.max(0, Math.min(1, t));
  if (r <= 0) return s;
  if (r >= 1) return i;
  const o = Array.from(s), a = Array.from(i), l = e.rightToLeft ?? !1;
  if (e.mode === "type") {
    const b = Math.round(r * Math.max(o.length, a.length));
    return l ? o.slice(0, Math.max(0, o.length - b)).join("") + a.slice(Math.max(0, a.length - b)).join("") : a.slice(0, b).join("") + o.slice(b).join("");
  }
  const c = Math.max(0, Math.min(0.999, e.revealDelay ?? 0)), h = Math.max(0, (r - c) / (1 - c)), u = Math.floor(h * a.length), f = e.tweenLength === !1 ? a.length : Math.round(o.length + (a.length - o.length) * r), d = ja(e.chars), m = e.refreshRate ?? za, p = m > 0 ? Math.floor(n * m / 1e3) : 0, g = e.seed ?? 1;
  let y = "";
  for (let b = 0; b < f; b++) {
    const w = l ? b >= f - u : b < u, S = l ? a[a.length - (f - b)] : a[b];
    w && S !== void 0 || S === " " || S === `
` ? y += S : y += d[Ga(g, b, p) % d.length];
  }
  return y;
}
class hn {
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
    let i = t * this.speed;
    if (this._repeatDelayRemaining > 0) {
      const a = Math.min(this._repeatDelayRemaining, i);
      if (this._repeatDelayRemaining -= a, i -= a, this._repeatDelayRemaining > 0) {
        this.onUpdate?.(this.getStateAtTime(this._currentTime));
        return;
      }
      this._wrapAfterDelay && (this._wrapAfterDelay = !1, this._currentTime = 0);
    }
    const r = 1e3;
    for (let a = 0; a < r && i > 0 && this._playbackState === "playing"; a++)
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
      for (const [s, i] of this._trackPlayers) {
        const r = i.getTrack().property;
        for (const { target: o, value: a, start: l } of i.getTargetValues(t))
          this._write(n, s, o, r, a, t - l);
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
    const s = /* @__PURE__ */ new Map();
    for (const [i, r] of this._trackPlayers) {
      const o = r.getTrack().property;
      for (const { target: a, value: l, start: c } of r.getTargetValues(t)) {
        const h = `${a}\0${o}`, u = c <= t, f = s.get(h);
        (!f || (u !== f.started ? u : u ? c >= f.start : c <= f.start)) && s.set(h, { trackId: i, target: a, property: o, value: l, start: c, started: u });
      }
    }
    for (const { trackId: i, target: r, property: o, value: a, start: l } of s.values())
      this._write(n, i, r, o, a, t - l);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(t, n, s, i, r, o) {
    if (r === void 0) return;
    let a = t.get(s);
    a || (a = /* @__PURE__ */ new Map(), t.set(s, a));
    const l = this._textTracks.get(n);
    if (l && typeof r == "number") {
      a.set("text", Ja(l.textConfig, r, Math.max(0, o)));
      return;
    }
    const c = this._motionPathTracks.get(n);
    if (c && typeof r == "number") {
      const h = xr(c.motionPathConfig, r);
      a.set("motionPathX", h.x), a.set("motionPathY", h.y), c.motionPathConfig.autoRotate && a.set("motionPathRotate", h.angle);
    } else
      a.set(i, r);
  }
  /** Cached: does any target+property have more than one track? */
  _sharedWrites = null;
  _hasSharedWrites() {
    if (this._sharedWrites === null) {
      const t = /* @__PURE__ */ new Set();
      this._sharedWrites = !1;
      t: for (const n of this._tracks)
        for (const s of Mt(n)) {
          const i = `${s}\0${n.property}`;
          if (t.has(i)) {
            this._sharedWrites = !0;
            break t;
          }
          t.add(i);
        }
    }
    return this._sharedWrites;
  }
  /**
   * Add a track to the timeline.
   */
  addTrack(t) {
    if (this._tracks.push(t), this._sharedWrites = null, Pt(t)) {
      this._trackPlayers.set(t.id, new Ua(t));
      return;
    }
    if (_t(t)) {
      this._trackPlayers.set(t.id, new Va(t)), this._springTracks.set(t.id, t);
      return;
    }
    if (hs(t))
      this._trackPlayers.set(t.id, new wn(t)), this._textTracks.set(t.id, t);
    else if (lr(t)) {
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
      this._trackPlayers.set(t.id, new wn(n)), this._motionPathTracks.set(t.id, t);
    } else
      this._trackPlayers.set(t.id, new wn(t));
  }
  /**
   * Replace a track with a new version, keeping its place in the track order
   * (which decides ties when tracks overlap). The new track may have a
   * different id. Does nothing if no track has `trackId`.
   */
  replaceTrack(t, n) {
    const s = this._tracks.findIndex((r) => r.id === t);
    if (s < 0) return;
    const i = this._tracks.slice(s + 1);
    this.removeTrack(t);
    for (const r of i) this.removeTrack(r.id);
    this.addTrack(n);
    for (const r of i) this.addTrack(r);
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
    const n = this.getTracks(t).map((s) => s.id);
    for (const s of n)
      this.removeTrack(s);
    return n;
  }
  /**
   * The time span a track is active over: [start, end] in milliseconds.
   */
  getTrackSpan(t) {
    const n = this._trackPlayers.get(t);
    if (!n) return;
    const s = n.getTrack(), i = s.delay ?? 0;
    if (_t(s) || Pt(s))
      return { from: i, to: n.getDuration() };
    const r = s.keyframes;
    if (!(!r || r.length === 0))
      return { from: r[0].time + i, to: n.getDuration() };
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
      const s = this._tracks[n], i = this.getTrackSpan(s.id);
      if (i)
        for (let r = 0; r < n; r++) {
          const o = this._tracks[r];
          if (o.property !== s.property) continue;
          const a = Mt(o).filter((u) => Mt(s).includes(u));
          if (a.length === 0) continue;
          const l = this.getTrackSpan(o.id);
          if (!l || !(l.from <= i.to && i.from <= l.to)) continue;
          const h = i.from >= l.from;
          for (const u of a)
            t.push({
              target: u,
              property: s.property,
              losingTrackId: h ? o.id : s.id,
              winningTrackId: h ? s.id : o.id
            });
        }
    }
    return t;
  }
  _matches(t, n) {
    if (n.id !== void 0 && t.id !== n.id || n.property !== void 0 && t.property !== n.property || n.target !== void 0 && !Mt(t).includes(n.target)) return !1;
    if (n.timeRange) {
      const s = this.getTrackSpan(t.id);
      if (!s || s.to < n.timeRange.from || s.from > n.timeRange.to) return !1;
    }
    return !0;
  }
  /**
   * Export timeline as a serializable definition.
   */
  toDefinition() {
    return {
      formatVersion: ar(this._tracks),
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
    const n = t && t.length > 0 ? [...t].sort((i, r) => i.time - r.time).map((i) => ({ ...i })) : void 0, s = { ...this._config };
    n ? s.markers = n : delete s.markers, this._config = s;
  }
  /** Caption text per language, per marker id */
  get captions() {
    return this._captions;
  }
  /** Replace the captions; languages with no captions are dropped. */
  setCaptions(t) {
    const n = {};
    for (const [s, i] of Object.entries(t ?? {})) n[s] = { ...i };
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
const Za = 100;
function Tr(e, t, n, s) {
  const i = [], r = [], { duration: o, alternate: a } = s, l = (d, m, p, g) => {
    r.push([d, m]);
    const y = [];
    e.forEach((b, w) => {
      (p === "forward" ? (g ? b >= d : b > d) && b <= m : (g ? b <= d : b < d) && b >= m) && y.push(w);
    }), y.sort((b, w) => (p === "forward" ? e[b] - e[w] : e[w] - e[b]) || b - w);
    for (const b of y) i.push({ kind: "event", index: b, direction: p });
  };
  let c = t.time, h = t.direction, u = t.fresh === !0;
  const f = Math.min(Za, Math.max(0, n.iteration - t.iteration));
  for (let d = 0; d < f; d++) {
    const m = h === "forward" ? o : 0;
    l(c, m, h, u), i.push({ kind: "repeat" }), a ? (h = h === "forward" ? "reverse" : "forward", c = m, u = !1) : (c = h === "forward" ? 0 : o, u = !0);
  }
  return f > 0 && s.holding && !a ? { crossings: i, passes: r } : (l(c, n.time, h, u), { crossings: i, passes: r });
}
function Qa(e) {
  return Pt(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "inertia",
    inertia: Er(e.inertia),
    ...at(e)
  } : _t(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "spring",
    spring: { ...e.spring },
    ...at(e)
  } : hs(e) ? {
    id: e.id,
    target: e.target,
    property: "text",
    textConfig: { ...e.textConfig },
    keyframes: e.keyframes.map(kn),
    ...at(e)
  } : lr(e) ? {
    id: e.id,
    target: e.target,
    property: "motionPath",
    motionPathConfig: { ...e.motionPathConfig },
    keyframes: e.keyframes.map(kn),
    ...at(e)
  } : {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes.map(kn),
    ...e.interpolation !== void 0 && { interpolation: e.interpolation },
    ...at(e)
  };
}
function Er(e) {
  return { ...e, ...Array.isArray(e.end) && { end: [...e.end] } };
}
function kn(e) {
  return {
    time: e.time,
    value: e.value,
    ...e.easing && { easing: e.easing }
  };
}
function at(e) {
  const t = e.endDelay;
  return {
    ...e.delay !== void 0 && { delay: e.delay },
    ...t !== void 0 && { endDelay: t },
    ...e.targets !== void 0 && { targets: [...e.targets] },
    ...e.stagger !== void 0 && { stagger: { ...e.stagger } }
  };
}
function tl(e) {
  if (Pt(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "inertia",
      inertia: Er(t.inertia),
      ...at(t)
    };
  }
  if (_t(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "spring",
      spring: { ...t.spring },
      ...at(t)
    };
  }
  if (hs(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: "text",
      textConfig: { ...t.textConfig },
      keyframes: [...t.keyframes].sort((n, s) => n.time - s.time),
      ...at(t)
    };
  }
  if (e.property === "motionPath" && "motionPathConfig" in e) {
    const t = e, n = [...t.keyframes].sort((s, i) => s.time - i.time);
    return {
      id: t.id,
      target: t.target,
      property: "motionPath",
      motionPathConfig: { ...t.motionPathConfig },
      keyframes: n,
      ...at(t)
    };
  }
  return Xn({
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes,
    ...e.interpolation !== void 0 && { interpolation: e.interpolation },
    ...at(e)
  });
}
function el(e) {
  const t = e._config.markers;
  return {
    formatVersion: ar(e.tracks),
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
    tracks: e.tracks.map(Qa),
    ...e.captions && { captions: JSON.parse(JSON.stringify(e.captions)) }
  };
}
function ue(e) {
  const t = e.formatVersion ?? 1;
  if (t > Ls)
    throw new Error(
      `tinyfly: this animation uses format version ${t}, but this tinyfly reads up to version ${Ls}. Update tinyfly to play it.`
    );
  return new hn({
    id: e.id,
    name: e.name,
    config: e.config,
    tracks: e.tracks.map(tl),
    captions: e.captions
  });
}
function m0(e) {
  return JSON.stringify(el(e));
}
function g0(e) {
  const t = JSON.parse(e);
  return ue(t);
}
function Se(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++)
    t ^= e.charCodeAt(n), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function un(e) {
  let t = e >>> 0 || 2654435769;
  return {
    seed: e >>> 0,
    next() {
      return t ^= t << 13, t >>>= 0, t ^= t >> 17, t ^= t << 5, t >>>= 0, t / 4294967296;
    }
  };
}
function Ar(e, t, n) {
  return t + e.next() * (n - t);
}
function nl(e, t, n, s) {
  if (s <= 0) return Ar(e, t, n);
  const i = Math.floor((n - t) / s), r = Math.round(e.next() * i);
  return t + r * s;
}
function y0(e, t) {
  if (t.length !== 0)
    return t[Math.floor(e.next() * t.length)];
}
const Pr = /^([+\-*/])=\s*(-?[\d.]+)$/, _r = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function b0(e) {
  return typeof e != "string" ? !1 : Pr.test(e.trim()) || _r.test(e.trim());
}
function Ir(e, t = {}) {
  if (typeof e != "string") return e;
  const n = e.trim(), s = Pr.exec(n);
  if (s) {
    const [, r, o] = s, a = t.base ?? 0, l = Number.parseFloat(o);
    switch (r) {
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
  const i = _r.exec(n);
  if (i) {
    if (!t.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const r = Number.parseFloat(i[1]), o = Number.parseFloat(i[2]), a = i[3] !== void 0 ? Number.parseFloat(i[3]) : void 0;
    return a !== void 0 ? nl(t.random, r, o, a) : Ar(t.random, r, o);
  }
  return e;
}
function sl(e, t = 0, n) {
  const s = [];
  let i = t;
  for (const r of e) {
    const o = Ir(r, { base: i, random: n });
    s.push(o), typeof o == "number" && (i = o);
  }
  return s;
}
class w0 {
  random;
  constructor(t) {
    this.random = un(t);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(t, n = 0) {
    return Ir(t, { base: n, random: this.random });
  }
  resolveSequence(t, n = 0) {
    return sl(t, n, this.random);
  }
}
const il = 600;
function rl(e) {
  if (Array.isArray(e)) {
    const [f, d, m, p] = e;
    return { fn: Zs(f, d, m, p), bezier: [f, d, m, p] };
  }
  const { segments: t } = Yt(e);
  if (t.length === 0) throw new Error(`customEase: no curve in "${e}"`);
  const n = t[0].startX, s = t[0].startY, i = t[t.length - 1], r = i.endX - n, o = i.endY - s;
  if (r === 0 || o === 0) throw new Error(`customEase: "${e}" must move along both axes`);
  const a = (f) => (f - n) / r, l = (f) => (f - s) / o;
  if (t.length === 1 && i.type === "C") {
    const [f, d, m, p] = i.points, g = [a(f), l(d), a(m), l(p)];
    return { fn: Zs(...g), bezier: g };
  }
  const c = [], h = [], u = Math.max(8, Math.ceil(il / t.length));
  for (const f of t)
    for (let d = c.length === 0 ? 0 : 1; d <= u; d++) {
      const [m, p] = ll(f, d / u);
      c.push(a(m)), h.push(l(p));
    }
  return { fn: cl(c, h) };
}
function ol(e = {}) {
  const n = 0.1 + Math.max(0, Math.min(1, e.strength ?? 0.7)) * 0.7, s = [1];
  for (let r = n; r > 2e-3; r *= n) s.push(2 * Math.sqrt(r));
  const i = s.reduce((r, o) => r + o, 0);
  return (r) => {
    if (r <= 0) return 0;
    if (r >= 1) return 1;
    let o = r * i;
    for (let a = 0; a < s.length; a++) {
      if (o <= s[a]) {
        if (a === 0) return (o / s[0]) ** 2;
        const l = s[a] / 2, c = l * l, h = o - l;
        return 1 - (c - h * h);
      }
      o -= s[a];
    }
    return 1;
  };
}
function al(e = {}) {
  const t = Math.max(1, e.wiggles ?? 10), n = e.type ?? "easeOut", s = (i) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * i) : (1 - i) ** 2;
  return (i) => i <= 0 || i >= 1 ? 0 : Math.sin(i * t * Math.PI * 2) * s(i);
}
function ll(e, t) {
  if (e.type === "L") {
    const [c, h] = e.points;
    return [e.startX + (c - e.startX) * t, e.startY + (h - e.startY) * t];
  }
  const [n, s, i, r, o, a] = e.points, l = 1 - t;
  return [
    l * l * l * e.startX + 3 * l * l * t * n + 3 * l * t * t * i + t * t * t * o,
    l * l * l * e.startY + 3 * l * l * t * s + 3 * l * t * t * r + t * t * t * a
  ];
}
function cl(e, t) {
  return (n) => {
    if (n <= e[0]) return t[0];
    if (n >= e[e.length - 1]) return t[t.length - 1];
    let s = 0, i = e.length - 1;
    for (; i - s > 1; ) {
      const o = s + i >> 1;
      e[o] <= n ? s = o : i = o;
    }
    const r = e[i] - e[s];
    return r === 0 ? t[i] : t[s] + (n - e[s]) / r * (t[i] - t[s]);
  };
}
function Zs(e, t, n, s) {
  const i = (o, a, l) => 3 * (1 - o) * (1 - o) * o * a + 3 * (1 - o) * o * o * l + o * o * o, r = (o, a, l) => 3 * (1 - o) * (1 - o) * a + 6 * (1 - o) * o * (l - a) + 3 * o * o * (1 - l);
  return (o) => {
    if (o <= 0) return 0;
    if (o >= 1) return 1;
    let a = o;
    for (let h = 0; h < 8; h++) {
      const u = i(a, e, n) - o, f = r(a, e, n);
      if (Math.abs(u) < 1e-6) return i(a, t, s);
      if (Math.abs(f) < 1e-6) break;
      a -= u / f;
    }
    let l = 0, c = 1;
    a = o;
    for (let h = 0; h < 40; h++)
      i(a, e, n) < o ? l = a : c = a, a = (l + c) / 2;
    return i(a, t, s);
  };
}
const hl = 350, ul = 300, fl = 550;
function v0(e, t = {}) {
  const n = t.lead ?? hl, s = t.gap ?? ul, i = t.tail ?? fl, r = [];
  let o = 0;
  return e.forEach((a, l) => {
    const c = [];
    let h = o + n;
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
    const u = h + i + (a.tail ?? 0);
    r.push({ id: a.id ?? `s${l}`, start: o, duration: u - o, cues: c }), o = u;
  }), { duration: o, scenes: r, cues: r.flatMap((a) => a.cues) };
}
function k0(e) {
  return e.cues.map((t) => ({ id: t.id, time: t.start, label: t.text }));
}
function S0(e, t) {
  let n = e.scenes[0];
  for (const s of e.scenes)
    if (t >= s.start) n = s;
    else break;
  return n;
}
const Cr = (e) => 6e4 / e.bpm;
function ds(e, t) {
  return e.offset + t * Cr(e);
}
function ps(e, t) {
  return (t - e.offset) / Cr(e);
}
function M0(e, t) {
  return ds(e, Math.round(ps(e, t)));
}
function x0(e, t) {
  return ds(e, Math.ceil(ps(e, t) - 1e-9));
}
function T0(e, t, n) {
  const s = Math.max(1, Math.round(e.beatsPerBar ?? 4)), i = [];
  if (!(e.bpm > 0) || n < t) return i;
  for (let r = Math.ceil(ps(e, t) - 1e-9); ; r++) {
    const o = ds(e, r);
    if (o > n + 1e-9) break;
    i.push({ time: o, bar: (r % s + s) % s === 0, n: r });
  }
  return i;
}
const Ct = 100;
function E0(e, t, n = {}) {
  const s = n.minBpm ?? 70, i = n.maxBpm ?? 180, r = Math.max(1, Math.round(t / Ct)), o = Math.min(e.length, Math.round((n.maxSeconds ?? 60) * t)), a = Math.floor(o / r);
  if (a < 4) return { bpm: 120, offset: 0, confidence: 0 };
  const l = new Float64Array(a);
  for (let M = 0; M < a; M++) {
    let A = 0;
    for (let T = M * r; T < (M + 1) * r; T++) A += e[T] * e[T];
    l[M] = Math.log(1e-6 + A / r);
  }
  const c = new Float64Array(a);
  for (let M = 1; M < a; M++) c[M] = Math.max(0, l[M] - l[M - 1]);
  const h = c.reduce((M, A) => M + A, 0) / a;
  for (let M = 0; M < a; M++) c[M] = Math.max(0, c[M] - h);
  const u = Math.max(1, Math.floor(60 * Ct / i)), f = Math.min(a - 1, Math.ceil(60 * Ct / s)), d = (M) => {
    let A = 0;
    for (let T = M; T < a; T++) A += c[T] * c[T - M];
    return A / (a - M);
  };
  let m = 0;
  for (let M = 0; M < a; M++) m += c[M] * c[M];
  m /= a;
  let p = u, g = -1 / 0;
  for (let M = u; M <= f; M++) {
    const A = 60 * Ct / M, T = Math.exp(-0.5 * (Math.log2(A / 120) / 0.9) ** 2), P = d(M) * T;
    P > g && (g = P, p = M);
  }
  const y = (M) => {
    const A = Math.floor(M);
    return A < 0 || A + 1 >= a ? 0 : c[A] + (c[A + 1] - c[A]) * (M - A);
  }, b = (M, A) => {
    let T = 0;
    for (let P = A; P < a; P += M) T += y(P);
    return T;
  };
  let w = p, S = 0, k = -1 / 0;
  for (let M = p - 0.6; M <= p + 0.6 + 1e-9; M += 0.02) {
    if (M < 1) continue;
    const A = Math.max(1, Math.round(M * 4));
    for (let T = 0; T < A; T++) {
      const P = T / A * M, _ = b(M, P);
      _ > k && (k = _, S = P, w = M);
    }
  }
  const x = 60 * Ct / w, v = m > 0 ? Math.max(0, Math.min(1, d(p) / m)) : 0, E = (S + 0.5) * 1e3 / Ct;
  return { bpm: Math.round(x * 100) / 100, offset: Math.round(E % (6e4 / x)), confidence: v };
}
const dl = 600, pl = 250, Qs = 1;
function A0(e, t) {
  const n = t.target ?? "Camera", s = { x: t.stage.width / 2, y: t.stage.height / 2 }, i = {}, r = (u, f, d, m) => {
    const p = i[u] ??= [];
    for (; p.length > 0 && p[p.length - 1].time >= f; ) p.pop();
    p.push({ time: f, value: d, ...m ? { easing: m } : {} });
  }, o = (u) => {
    const f = u.rotate * Math.PI / 180, d = (u.focusX - s.x) * u.scale, m = (u.focusY - s.y) * u.scale;
    return {
      x: -(d * Math.cos(f) - m * Math.sin(f)),
      y: -(d * Math.sin(f) + m * Math.cos(f)),
      scale: u.scale,
      rotate: u.rotate
    };
  }, a = (u, f, d) => {
    const m = o(f);
    for (const p of ["x", "y", "scale", "rotate"]) r(p, u, m[p], d);
  };
  let l = { focusX: s.x, focusY: s.y, scale: 1, rotate: 0 };
  const c = [...e].sort((u, f) => u.at - f.at), h = c.filter((u) => !("shake" in u));
  h.length > 0 && a(0, l);
  for (const u of h)
    if ("frame" in u) {
      const f = Math.max(Qs, u.duration ?? dl);
      a(u.at, l), l = {
        focusX: u.frame.focus?.x ?? s.x,
        focusY: u.frame.focus?.y ?? s.y,
        scale: u.frame.scale ?? 1,
        rotate: u.frame.rotate ?? 0
      }, a(u.at + f, l, u.easing ?? (f > Qs ? "ease-in-out" : void 0));
    } else {
      const { follow: f } = u, d = f.lag ?? pl, m = new hn({ id: "follow", tracks: [{ id: "x", target: "s", property: "x", keyframes: f.x }] }), p = (b) => m.getStateAtTime(b).values.get("s")?.get("x") ?? l.focusX, g = [u.at, ...f.x.map((b) => b.time).filter((b) => b > u.at && b < u.until), u.until];
      a(u.at, l);
      const y = (b) => ({
        focusX: p(b) + (f.lead ?? 0),
        focusY: f.y ?? l.focusY,
        scale: f.scale ?? l.scale,
        rotate: l.rotate
      });
      for (const b of g) {
        const w = f.x.find((S) => S.time === b)?.easing;
        a(b + d, y(b), b === u.at ? "ease-in-out" : w);
      }
      l = y(u.until);
    }
  for (const u of c.filter((f) => "shake" in f)) {
    const f = u.shake.strength ?? 12, d = u.shake.roll ?? 1.5, m = 1e3 / (u.shake.frequency ?? 24), p = un(u.shake.seed ?? Math.round(u.at) + 1), g = () => p.next() * 2 - 1;
    for (const y of ["shakeX", "shakeY", "shakeRotate"]) r(y, u.at, 0);
    for (let y = u.at + m; y < u.at + u.duration; y += m) {
      const b = 1 - (y - u.at) / u.duration;
      r("shakeX", y, g() * f * b), r("shakeY", y, g() * f * b), r("shakeRotate", y, g() * d * b);
    }
    for (const y of ["shakeX", "shakeY", "shakeRotate"]) r(y, u.at + u.duration, 0, "ease-out");
  }
  return Object.entries(i).map(([u, f]) => ({ id: `${n}-${u}`, target: n, property: u, keyframes: f }));
}
const rt = (e) => Math.round(e * 1e3) / 1e3;
function ml(e, t = {}) {
  if (e.length === 0) return "";
  const n = t.curviness ?? 1, s = t.closed ?? !1, i = e.length;
  let r = `M${rt(e[0].x)} ${rt(e[0].y)}`;
  if (i === 1) return r;
  const o = (l) => s ? e[(l % i + i) % i] : e[Math.max(0, Math.min(i - 1, l))], a = s ? i : i - 1;
  for (let l = 0; l < a; l++) {
    const c = o(l - 1), h = o(l), u = o(l + 1), f = o(l + 2);
    if (n === 0) {
      r += ` L${rt(u.x)} ${rt(u.y)}`;
      continue;
    }
    const d = n / 6, m = h.x + (u.x - c.x) * d, p = h.y + (u.y - c.y) * d, g = u.x - (f.x - h.x) * d, y = u.y - (f.y - h.y) * d;
    r += ` C${rt(m)} ${rt(p)} ${rt(g)} ${rt(y)} ${rt(u.x)} ${rt(u.y)}`;
  }
  return s ? `${r} Z` : r;
}
const Y = (e, t = 0) => {
  const n = parseFloat(e ?? "");
  return Number.isFinite(n) ? n : t;
};
function gl(e) {
  const t = (e ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let s = 0; s + 1 < t.length; s += 2) n.push({ x: t[s], y: t[s + 1] });
  return n;
}
function ms(e) {
  const t = e.attributes;
  switch (e.tag.toLowerCase()) {
    case "path":
      return t.d ?? null;
    case "circle":
    case "ellipse": {
      const n = Y(t.cx), s = Y(t.cy), i = e.tag.toLowerCase() === "circle" ? Y(t.r) : Y(t.rx), r = e.tag.toLowerCase() === "circle" ? Y(t.r) : Y(t.ry);
      return `M${n + i} ${s} A${i} ${r} 0 1 1 ${n - i} ${s} A${i} ${r} 0 1 1 ${n + i} ${s} Z`;
    }
    case "rect": {
      const n = Y(t.x), s = Y(t.y), i = Y(t.width), r = Y(t.height);
      let o = t.rx != null ? Y(t.rx) : t.ry != null ? Y(t.ry) : 0, a = t.ry != null ? Y(t.ry) : o;
      return o = Math.min(o, i / 2), a = Math.min(a, r / 2), o === 0 || a === 0 ? `M${n} ${s} H${n + i} V${s + r} H${n} Z` : `M${n + o} ${s} H${n + i - o} A${o} ${a} 0 0 1 ${n + i} ${s + a} V${s + r - a} A${o} ${a} 0 0 1 ${n + i - o} ${s + r} H${n + o} A${o} ${a} 0 0 1 ${n} ${s + r - a} V${s + a} A${o} ${a} 0 0 1 ${n + o} ${s} Z`;
    }
    case "line":
      return `M${Y(t.x1)} ${Y(t.y1)} L${Y(t.x2)} ${Y(t.y2)}`;
    case "polyline":
    case "polygon": {
      const n = gl(t.points);
      if (n.length === 0) return null;
      const s = n.map((i, r) => `${r === 0 ? "M" : "L"}${i.x} ${i.y}`).join(" ");
      return e.tag.toLowerCase() === "polygon" ? `${s} Z` : s;
    }
    default:
      return null;
  }
}
function P0(e, t, n) {
  const s = Math.max(2, Math.round(n.samples ?? 32)), i = Math.max(0, n.length), r = n.since !== void 0 ? Math.max(t - i, n.since) : t - i;
  if (r >= t) return [];
  const o = n.period, a = [];
  for (let l = 0; l < s; l++) {
    const c = r + (t - r) * l / (s - 1), h = o && o > 0 && l < s - 1 ? (c % o + o) % o : c;
    a.push({ at: e(h), time: c, age: i > 0 ? (t - c) / i : 0 });
  }
  return a;
}
const yl = 2.5;
function bl(e) {
  const t = [], n = [], s = e.length, i = (r, o) => {
    for (let a = r + o; a >= 0 && a < s; a += o) {
      const l = (e[a].x - e[r].x) * o, c = (e[a].y - e[r].y) * o, h = Math.hypot(l, c);
      if (h > 1e-9) return [l / h, c / h];
    }
    return null;
  };
  for (let r = 0; r < s; r++) {
    const o = e[r], a = i(r, -1), l = i(r, 1), c = a ?? l ?? [1, 0], h = l ?? a ?? [1, 0];
    let u = c[0] + h[0], f = c[1] + h[1];
    const d = Math.hypot(u, f);
    d < 1e-9 ? (u = c[0], f = c[1]) : (u /= d, f /= d);
    const m = u * c[0] + f * c[1], p = Math.min(yl, 1 / Math.max(m, 1e-6)), g = o.width / 2 * p;
    t.push({ x: o.x - f * g, y: o.y + u * g }), n.push({ x: o.x + f * g, y: o.y - u * g });
  }
  return { left: t, right: n };
}
function wl(e) {
  const t = e.length;
  if (t < 2) return null;
  const n = e[t - 1];
  for (let s = t - 2; s >= 0; s--) {
    const i = n.x - e[s].x, r = n.y - e[s].y, o = Math.hypot(i, r);
    if (o > 1e-9)
      return { x: n.x, y: n.y, radius: n.width / 2, start: Math.atan2(i / o, -r / o) };
  }
  return null;
}
function Fe(e, t) {
  return [e[0] + t[0], e[1] + t[1], e[2] + t[2]];
}
function fn(e, t) {
  return [e[0] - t[0], e[1] - t[1], e[2] - t[2]];
}
function ae(e, t) {
  return [e[0] * t, e[1] * t, e[2] * t];
}
function le(e, t) {
  return e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
}
function Ve(e, t) {
  return [e[1] * t[2] - e[2] * t[1], e[2] * t[0] - e[0] * t[2], e[0] * t[1] - e[1] * t[0]];
}
function gs(e) {
  return Math.hypot(e[0], e[1], e[2]);
}
function Hr(e, t) {
  return gs(fn(e, t));
}
function fe(e) {
  const t = gs(e);
  return t === 0 ? [0, 0, 0] : ae(e, 1 / t);
}
function $r(e, t, n) {
  return [e[0] + (t[0] - e[0]) * n, e[1] + (t[1] - e[1]) * n, e[2] + (t[2] - e[2]) * n];
}
const _0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Fe,
  cross: Ve,
  distance: Hr,
  dot: le,
  length: gs,
  lerp: $r,
  normalize: fe,
  scale: ae,
  subtract: fn
}, Symbol.toStringTag, { value: "Module" })), vl = Math.PI / 180;
function Rr() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function kt(e, t) {
  const n = new Array(16);
  for (let s = 0; s < 4; s++)
    for (let i = 0; i < 4; i++) {
      let r = 0;
      for (let o = 0; o < 4; o++) r += e[o * 4 + i] * t[s * 4 + o];
      n[s * 4 + i] = r;
    }
  return n;
}
function Or(e) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, e[0], e[1], e[2], 1];
}
function Be(e) {
  return [e[0], 0, 0, 0, 0, e[1], 0, 0, 0, 0, e[2], 0, 0, 0, 0, 1];
}
function de(e) {
  const [t, n, s, i] = e;
  return [
    1 - 2 * (n * n + s * s),
    2 * (t * n + s * i),
    2 * (t * s - n * i),
    0,
    2 * (t * n - s * i),
    1 - 2 * (t * t + s * s),
    2 * (n * s + t * i),
    0,
    2 * (t * s + n * i),
    2 * (n * s - t * i),
    1 - 2 * (t * t + n * n),
    0,
    0,
    0,
    0,
    1
  ];
}
function Lr(e, t, n) {
  const s = de(t);
  for (let i = 0; i < 3; i++)
    s[i] *= n[0], s[4 + i] *= n[1], s[8 + i] *= n[2];
  return s[12] = e[0], s[13] = e[1], s[14] = e[2], s;
}
function kl(e) {
  const t = new Array(16);
  for (let n = 0; n < 4; n++) for (let s = 0; s < 4; s++) t[s * 4 + n] = e[n * 4 + s];
  return t;
}
function Sl(e) {
  const [t, n, s, i, r, o, a, l, c, h, u, f, d, m, p, g] = e, y = t * o - n * r, b = t * a - s * r, w = t * l - i * r, S = n * a - s * o, k = n * l - i * o, x = s * l - i * a, v = c * m - h * d, E = c * p - u * d, M = c * g - f * d, A = h * p - u * m, T = h * g - f * m, P = u * g - f * p, _ = y * P - b * T + w * A + S * M - k * E + x * v;
  if (Math.abs(_) < 1e-12) return null;
  const I = 1 / _;
  return [
    (o * P - a * T + l * A) * I,
    (s * T - n * P - i * A) * I,
    (m * x - p * k + g * S) * I,
    (u * k - h * x - f * S) * I,
    (a * M - r * P - l * E) * I,
    (t * P - s * M + i * E) * I,
    (p * w - d * x - g * b) * I,
    (c * x - u * w + f * b) * I,
    (r * T - o * M + l * v) * I,
    (n * M - t * T - i * v) * I,
    (d * k - m * w + g * y) * I,
    (h * w - c * k - f * y) * I,
    (o * E - r * A - a * v) * I,
    (t * A - n * E + s * v) * I,
    (m * b - d * S - p * y) * I,
    (c * S - h * b + u * y) * I
  ];
}
function Ml(e, t, n, s) {
  const i = 1 / Math.tan(e * vl / 2), r = 1 / (n - s);
  return [i / t, 0, 0, 0, 0, i, 0, 0, 0, 0, (s + n) * r, -1, 0, 0, 2 * s * n * r, 0];
}
function xl(e, t, n, s, i, r) {
  const o = 1 / (t - e), a = 1 / (s - n), l = 1 / (r - i);
  return [2 * o, 0, 0, 0, 0, 2 * a, 0, 0, 0, 0, -2 * l, 0, -(t + e) * o, -(s + n) * a, -(r + i) * l, 1];
}
function Tl(e, t, n = [0, 1, 0]) {
  const s = fe(fn(e, t)), i = fe(Ve(n, s)), r = Ve(s, i);
  return [
    i[0],
    r[0],
    s[0],
    0,
    i[1],
    r[1],
    s[1],
    0,
    i[2],
    r[2],
    s[2],
    0,
    -le(i, e),
    -le(r, e),
    -le(s, e),
    1
  ];
}
function Fr(e, t) {
  const n = e[0] * t[0] + e[4] * t[1] + e[8] * t[2] + e[12], s = e[1] * t[0] + e[5] * t[1] + e[9] * t[2] + e[13], i = e[2] * t[0] + e[6] * t[1] + e[10] * t[2] + e[14], r = e[3] * t[0] + e[7] * t[1] + e[11] * t[2] + e[15];
  return r === 1 || r === 0 ? [n, s, i] : [n / r, s / r, i / r];
}
const I0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  compose: Lr,
  fromQuat: de,
  identity: Rr,
  invert: Sl,
  lookAt: Tl,
  multiply: kt,
  orthographic: xl,
  perspective: Ml,
  scaling: Be,
  transformPoint: Fr,
  translation: Or,
  transpose: kl
}, Symbol.toStringTag, { value: "Module" })), Ee = {
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
}, ti = {
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
function El(e) {
  let t = e.trim().toLowerCase();
  t = t.replace(/\.ease(in|out|inout)$/, ".$1");
  const n = /^([a-z]+\d?)(\(.*\))?$/.exec(t);
  return n && n[1] !== "steps" && t !== "none" && t !== "linear" && (t = `${n[1]}.out${n[2] ?? ""}`), t;
}
Z({ type: "bounce", mode: "in" });
Z({ type: "bounce", mode: "in-out" });
function Ue(e) {
  const t = Br.get(e.trim().toLowerCase());
  if (t) return t;
  const n = El(e), s = /^steps\(\s*(\d+)\s*\)$/.exec(n);
  if (s) {
    const o = { type: "steps", count: Math.max(1, Number.parseInt(s[1], 10)) + 1, position: "none" };
    return { easing: o, fn: Z(o) };
  }
  const i = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(n);
  if (i) {
    const [, r, o, a] = i, l = (a ?? "").split(",").map((u) => Number.parseFloat(u)).filter((u) => Number.isFinite(u)), c = o === "inout" ? "in-out" : o;
    if (r === "back" && l.length === 0 && n in Ee)
      return { easing: { type: "cubic-bezier", points: Ee[n] } };
    const h = r === "elastic" ? { type: "elastic", mode: c, ...l[0] !== void 0 && { amplitude: l[0] }, ...l[1] !== void 0 && { period: l[1] } } : r === "bounce" ? { type: "bounce", mode: c } : { type: "back", mode: c, ...l[0] !== void 0 && { overshoot: l[0] } };
    return { easing: h, fn: Z(h) };
  }
  return n in ti ? { easing: ti[n] } : n in Ee ? { easing: { type: "cubic-bezier", points: Ee[n] } } : { easing: "ease-out" };
}
const Br = /* @__PURE__ */ new Map();
function ys(e, t) {
  return Br.set(
    e.trim().toLowerCase(),
    t.bezier ? { easing: { type: "cubic-bezier", points: t.bezier }, fn: t.fn } : { fn: t.fn, requiresBaking: "custom" }
  ), e;
}
function qn(e) {
  let t = e >>> 0;
  return () => {
    t = t + 1831565813 >>> 0;
    let n = t;
    return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const Dr = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function Wr(e) {
  return typeof e == "string" && Dr.test(e);
}
function Al(e = 1) {
  let t = qn(e);
  const n = (l, c) => ((...h) => h.length >= l ? c(...h) : (u) => c(...h, u)), s = (l, c, h) => Math.min(Math.max(h, Math.min(l, c)), Math.max(l, c)), i = (l, c, h, u, f) => c === l ? h : h + (f - l) / (c - l) * (u - h), r = (l, c) => {
    if (typeof l == "number") return l === 0 ? c : Math.round(c / l) * l;
    if (Array.isArray(l)) return ei(l, c, 1 / 0);
    if ("values" in l) return ei(l.values, c, l.radius ?? 1 / 0);
    const h = Math.round(c / l.increment) * l.increment;
    return Math.abs(h - c) <= (l.radius ?? 1 / 0) ? h : c;
  }, o = (l, c, h) => {
    const u = l + t() * (c - l);
    return h ? Math.round(u / h) * h : u;
  };
  return {
    clamp: n(3, s),
    mapRange: n(5, i),
    normalize: n(3, (l, c, h) => i(l, c, 0, 1, h)),
    interpolate: n(3, (l, c, h) => {
      if (typeof l == "object" && !Array.isArray(l)) {
        const u = {};
        for (const f of Object.keys(l))
          u[f] = qe(l[f])(l[f], c[f], h);
        return u;
      }
      return qe(l)(l, c, h);
    }),
    wrap: ((l, c, h) => {
      if (Array.isArray(l)) {
        const p = l, g = (y) => p[(Math.round(y) % p.length + p.length) % p.length];
        return c === void 0 ? g : g(c);
      }
      const u = l, d = c - u, m = (p) => d === 0 ? u : ((p - u) % d + d) % d + u;
      return h === void 0 ? m : m(h);
    }),
    wrapYoyo: n(3, (l, c, h) => {
      const u = c - l;
      if (u === 0) return l;
      const f = ((h - l) % (u * 2) + u * 2) % (u * 2);
      return l + (f > u ? u * 2 - f : f);
    }),
    snap: n(2, r),
    random: ((l, c, h, u) => {
      if (Array.isArray(l)) {
        const d = () => l[Math.floor(t() * l.length)];
        return c === !0 ? d : d();
      }
      const f = () => o(l, c, h);
      return u ? f : f();
    }),
    shuffle: (l) => {
      for (let c = l.length - 1; c > 0; c--) {
        const h = Math.floor(t() * (c + 1));
        [l[c], l[h]] = [l[h], l[c]];
      }
      return l;
    },
    distribute: ({ base: l = 0, amount: c, each: h, from: u = "start", ease: f }) => (d, m, p) => {
      const g = p.length, b = us(d, g, { ...c !== void 0 ? { amount: c } : { each: h ?? 1 }, from: u }), w = c !== void 0 ? c : (h ?? 1) * hr(g, u), S = f && w > 0 ? f(b / w) * w : b;
      return l + S;
    },
    pipe: (...l) => (c) => l.reduce((h, u) => u(h), c),
    splitColor: (l) => Pl(l),
    getUnit: (l) => typeof l == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(l.trim())?.[1] ?? "",
    seed: (l) => {
      t = qn(l);
    },
    resolveRandomString: (l) => {
      const c = Dr.exec(l)?.[1] ?? "";
      if (c.startsWith("[")) {
        const m = c.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean).map((p) => Number.isFinite(Number(p)) ? Number(p) : p.replace(/^['"]|['"]$/g, ""));
        return m[Math.floor(t() * m.length)];
      }
      const [h, u, f] = c.split(",").map((d) => Number.parseFloat(d));
      return o(h, u, Number.isFinite(f) ? f : void 0);
    }
  };
}
function ei(e, t, n) {
  let s = t, i = 1 / 0;
  for (const r of e) {
    const o = Math.abs(r - t);
    o < i && (i = o, s = r);
  }
  return i <= n ? s : t;
}
function Pl(e) {
  const t = e.trim(), n = /^#([0-9a-f]{3,8})$/i.exec(t)?.[1];
  if (n) {
    const r = (n.length <= 4 ? [...n].map((o) => o + o).join("") : n).match(/../g).map((o) => Number.parseInt(o, 16));
    return r.length >= 4 ? [r[0], r[1], r[2], Math.round(r[3] / 255 * 1e3) / 1e3] : [r[0], r[1], r[2]];
  }
  const s = (/rgba?\(([^)]+)\)/i.exec(t)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((i) => Number.parseFloat(i));
  return s.length >= 4 ? [s[0], s[1], s[2], s[3]] : [s[0] ?? 0, s[1] ?? 0, s[2] ?? 0];
}
const _l = /^([+-])=\s*(-?[\d.]+)$/, Il = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function Gt(e, t) {
  const n = t.scale ?? 1, s = (c) => Number.parseFloat(c) * n;
  if (e === void 0) return t.cursor;
  if (typeof e == "number") return e * n;
  const i = e.trim();
  if (i === "") return t.cursor;
  const r = _l.exec(i);
  if (r) {
    const c = s(r[2]);
    return t.cursor + (r[1] === "-" ? -c : c);
  }
  const o = Il.exec(i);
  if (o) {
    const c = o[1] === "<" ? t.previousStart : t.previousEnd;
    if (o[3] === void 0) return c;
    const h = s(o[3]);
    return c + (o[2] === "-" ? -h : h);
  }
  const a = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(i);
  if (a) {
    const c = t.labels.get(a[1].trim());
    if (c !== void 0) {
      const h = s(a[3]);
      return c + (a[2] === "-" ? -h : h);
    }
  }
  const l = t.labels.get(i);
  return l !== void 0 ? l : /^-?[\d.]+$/.test(i) ? s(i) : t.cursor;
}
function Cl(e) {
  if (typeof e != "object" || e === null) return !1;
  const t = e;
  return t.grid !== void 0 || t.from === "random" || Array.isArray(t.from) || t.ease !== void 0 || t.axis !== void 0;
}
function Hl(e, t, n = {}) {
  if (e === 0) return [];
  const s = t.grid === "auto" ? Math.max(1, Math.min(e, n.columnsFromLayout?.() ?? e)) : Array.isArray(t.grid) ? Math.max(1, t.grid[1]) : e, i = Array.isArray(t.grid) ? Math.max(1, t.grid[0]) : Math.ceil(e / s), r = (m) => ({ x: m % s, y: Math.floor(m / s) }), o = t.from ?? "start", a = Array.isArray(o) ? { x: o[0] * (s - 1), y: o[1] * (i - 1) } : typeof o == "number" ? r(Math.max(0, Math.min(e - 1, o))) : o === "end" ? r(e - 1) : o === "center" || o === "edges" ? { x: (s - 1) / 2, y: (i - 1) / 2 } : { x: 0, y: 0 }, l = (m) => {
    const { x: p, y: g } = r(m), y = Math.abs(p - a.x), b = Math.abs(g - a.y);
    return t.axis === "x" ? y : t.axis === "y" ? b : Math.hypot(y, b);
  };
  let c = Array.from({ length: e }, (m, p) => l(p));
  const h = Math.max(...c);
  if (o === "edges" && (c = c.map((m) => h - m)), o === "random") {
    const m = n.random ?? Math.random;
    c = c.map(() => m() * h);
  }
  const u = t.amount !== void 0 ? t.amount : (t.each ?? 0) * h, f = t.ease ? Ue(t.ease) : void 0, d = f ? f.fn ?? Z(f.easing) : void 0;
  return c.map((m) => {
    const p = h === 0 ? 0 : m / h;
    return (d ? d(p) : p) * u;
  });
}
const bs = /* @__PURE__ */ new Set([
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
]), $l = {
  rotation: "rotate",
  rotationZ: "rotate",
  rotationX: "rotateX",
  rotationY: "rotateY",
  transformPerspective: "perspective",
  perspective: "childPerspective"
};
function De(e) {
  const t = {}, n = {};
  for (const [s, i] of Object.entries(e))
    bs.has(s) ? t[s] = i : n[$l[s] ?? s] = i;
  return { config: t, properties: n };
}
function ze(e, t) {
  return e === void 0 ? t : e * 1e3;
}
function Vn(e, t) {
  if (e !== void 0)
    return typeof e == "number" ? { each: e * 1e3 } : Cl(e) ? { offsets: Hl(t?.count ?? 0, e, t ?? {}).map((s) => s * 1e3) } : {
      ...e.each !== void 0 && { each: e.each * 1e3 },
      ...e.amount !== void 0 && { amount: e.amount * 1e3 },
      ...e.from !== void 0 && { from: e.from }
    };
}
const Rl = {
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
function Nr(e) {
  return Rl[e];
}
function Ol(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : e;
  if (!t || typeof t.path != "string" && !Array.isArray(t.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(t.path))
    n = ml(t.path, { curviness: t.curviness });
  else if (ke(t.path))
    n = t.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${t.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const s = { pathData: n };
  return t.autoRotate !== void 0 && t.autoRotate !== !1 && (s.autoRotate = !0, typeof t.autoRotate == "number" && (s.rotateOffset = t.autoRotate)), t.matrix && (s.matrix = t.matrix), { config: s, start: t.start ?? 0, end: t.end ?? 1 };
}
function Ll(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : { ...e };
  return { ...t, start: t.end ?? 1, end: t.start ?? 0 };
}
function Kr(e) {
  return typeof e == "object" && e !== null && "shape" in e ? e.shape : e;
}
function Fl(e) {
  if (e.morphSVG === void 0) return e;
  const { morphSVG: t, ...n } = e, s = Kr(t);
  if (typeof s != "string" || !ke(s))
    throw new Error(
      `gsap-compat: morphSVG "${String(s)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: s };
}
function Bl(e, t) {
  if (e === !0) return [0, t];
  if (e === !1) return [0, 0];
  if (typeof e == "number") return [0, ni(e, t)];
  const n = e.trim().split(/[\s,]+/).filter(Boolean), s = (o) => {
    const a = Number.parseFloat(o);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${e}" is not a length or percentage`);
    return ni(o.endsWith("%") ? t * a / 100 : a, t);
  };
  if (n.length === 0) return [0, t];
  if (n.length === 1) return [0, s(n[0])];
  const i = s(n[0]), r = s(n[1]);
  return i <= r ? [i, r] : [r, i];
}
function Dl(e, t) {
  const [n, s] = Bl(e, t);
  return { strokeDasharray: [s - n, t], strokeDashoffset: -n };
}
function Wl(e, t) {
  if (e.drawSVG === void 0) return e;
  const { drawSVG: n, ...s } = e;
  return { ...s, ...Dl(n, t) };
}
function Nl(e) {
  if (e.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return e;
}
function ni(e, t) {
  return Math.max(0, Math.min(t, e));
}
function Kl(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++) t = Math.imul(t ^ e.charCodeAt(n), 16777619);
  return t >>> 0;
}
function Yl(e, t, n) {
  if (e.scrambleText !== void 0) {
    const s = e.scrambleText, i = typeof s == "string" ? { text: s } : s;
    if (typeof i?.text != "string")
      throw new Error("gsap-compat: scrambleText needs the text to end on — a string, or { text }.");
    const r = i.revealDelay && n > 0 ? i.revealDelay * 1e3 / n : void 0;
    return {
      to: i.text,
      mode: "scramble",
      ...i.chars !== void 0 && { chars: i.chars },
      ...i.speed !== void 0 && { refreshRate: 20 * i.speed },
      ...r !== void 0 && { revealDelay: Math.min(r, 0.999) },
      ...i.tweenLength !== void 0 && { tweenLength: i.tweenLength },
      ...i.rightToLeft !== void 0 && { rightToLeft: i.rightToLeft },
      seed: i.seed ?? Kl(`${t}|${i.text}`)
    };
  }
  if (e.text !== void 0) {
    const s = e.text, i = typeof s == "string" ? { value: s } : s;
    if (typeof i?.value != "string")
      throw new Error("gsap-compat: text needs the text to end on — a string, or { value }.");
    return {
      to: i.value,
      mode: "type",
      ...i.rightToLeft !== void 0 && { rightToLeft: i.rightToLeft }
    };
  }
}
function ws(e) {
  return Math.max(0.1, e / 25);
}
function Xl(e, t) {
  const n = typeof t == "number" ? { velocity: t } : t;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const s = n.friction ?? (n.resistance !== void 0 ? ws(n.resistance) : void 0), i = {
    from: e,
    velocity: n.velocity,
    ...s !== void 0 && { friction: s },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? i.end = [n.end(Xe(i))] : n.end !== void 0 && (i.end = Array.isArray(n.end) ? [...n.end] : n.end), i;
}
function ql(e) {
  const t = e === !0 ? {} : typeof e == "string" ? { preset: e } : e;
  if (t.preset !== void 0 && !(t.preset in pn))
    throw new Error(
      `gsap-compat: unknown spring preset "${t.preset}" — use one of ${Object.keys(pn).join(", ")}`
    );
  return {
    ...t.preset ? pn[t.preset] : {},
    ...t.stiffness !== void 0 && { stiffness: t.stiffness },
    ...t.damping !== void 0 && { damping: t.damping },
    ...t.mass !== void 0 && { mass: t.mass },
    ...t.restDelta !== void 0 && { restDelta: t.restDelta }
  };
}
function Vl(e, t) {
  if (e === !0 || typeof e == "string") return;
  const n = e.velocity;
  return typeof n == "number" ? n : n?.[t];
}
class Dt {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = qn(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(t = {}) {
    this.options = t, this.timeline = new hn({
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
  to(t, n, s) {
    return this.build(t, void 0, Jt(n), s);
  }
  /** Animate from the given values to where the property already is. */
  from(t, n, s) {
    const { config: i, properties: r } = De(Jt(n)), { motionPath: o, text: a, scrambleText: l, ...c } = r, h = this.targetsOf(t)[0], u = { ...i };
    for (const m of Object.keys(c))
      u[m] = this.resolveStart(h, m);
    o !== void 0 && (u.motionPath = Ll(o));
    const f = {}, d = String(this.resolveStart(h, "text"));
    return a !== void 0 && (f.text = Sn(a), u.text = typeof a == "object" ? { ...a, value: d } : d), l !== void 0 && (f.text = Sn(l), u.scrambleText = typeof l == "object" ? { ...l, text: d } : d), this.build(t, { ...c, ...f }, u, s);
  }
  /** Animate between two explicit sets of values. */
  fromTo(t, n, s, i) {
    const { properties: r } = De(Jt(n));
    return this.build(t, r, Jt(s), i);
  }
  /** Set values instantly — a single held keyframe. */
  set(t, n, s) {
    return this.build(t, void 0, { ...Jt(n), duration: 0 }, s);
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
    const n = Math.max(0, Gt(t, this.context()));
    return this.previousStart = n, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), n;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(t) {
    return Gt(t, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(t, n) {
    return this.labels.set(t, Gt(n, this.context())), this;
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
    const s = Gt(n, this.context());
    for (const r of t.timeline.tracks) {
      if (!("keyframes" in r)) continue;
      const o = Xn({
        ...r,
        id: this.nextTrackId(`nested-${r.id}`),
        keyframes: r.keyframes.map((a) => ({ ...a, time: a.time + s }))
      });
      this.timeline.addTrack(o);
    }
    const i = s + t.timeline.duration;
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
  build(t, n, s, i) {
    const { config: r, properties: o } = De(s), { motionPath: a, text: l, scrambleText: c, inertia: h, ...u } = o, f = this.targetsOf(t), d = Gt(i, this.context()), m = ze(r.delay, 0), p = ze(r.duration, 500), g = Vn(r.stagger, {
      count: f.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(f) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), y = this.easingFor(r.ease), b = [], w = r.spring;
    let S = 0, k = !1;
    for (const [T, P] of Object.entries(u)) {
      const _ = P;
      let I = n?.[T] !== void 0 ? n[T] : this.resolveStart(f[0], T);
      if (typeof I != typeof _ && (this.warn(
        `no usable start value for "${T}" on "${f[0]}" — it will snap to ${String(_)}. Use fromTo() to animate it.`
      ), I = _), w !== void 0 && (typeof I != "number" || typeof _ != "number") && this.warn(`spring works on numbers, so "${T}" on "${f[0]}" eases instead`), w !== void 0 && typeof I == "number" && typeof _ == "number") {
        const B = {
          ...ql(w),
          from: I,
          to: _,
          velocity: Vl(w, T) ?? this.options.startVelocity?.(f[0], T) ?? 0
        }, $ = this.nextTrackId(`${f[0]}-${T}-spring`), O = {
          id: $,
          target: f[0],
          ...f.length > 1 && { targets: f },
          ...g && f.length > 1 && { stagger: g },
          property: T,
          kind: "spring",
          spring: B,
          delay: d + m
        };
        this.timeline.addTrack(O), b.push($), S = Math.max(S, zo(B));
        for (const H of f) this.lastValues.set(`${H}|${T}`, _);
        continue;
      }
      k = !0;
      const C = this.keyframesFor(I, _, p, y, r.ease), R = this.nextTrackId(`${f[0]}-${T}`);
      this.timeline.addTrack(
        Xn({
          id: R,
          target: f[0],
          ...f.length > 1 && { targets: f },
          ...g && f.length > 1 && { stagger: g },
          property: T,
          delay: d + m,
          keyframes: C,
          // A quaternion is a rotation: it turns the short way round (see Track.interpolation).
          ...T === "quaternion" && { interpolation: "slerp" }
        })
      ), b.push(R);
      for (const B of f) this.lastValues.set(`${B}|${T}`, _);
    }
    const x = Yl({ text: l, scrambleText: c }, f[0], p);
    if (x) {
      const T = n?.text ?? n?.scrambleText, P = T !== void 0 ? Sn(T) : this.resolveStart(f[0], "text"), _ = this.nextTrackId(`${f[0]}-text`), I = {
        id: _,
        target: f[0],
        ...f.length > 1 && { targets: f },
        ...g && f.length > 1 && { stagger: g },
        property: "text",
        textConfig: { from: typeof P == "string" ? P : String(P ?? ""), ...x },
        delay: d + m,
        keyframes: this.keyframesFor(0, 1, p, y, r.ease)
      };
      this.timeline.addTrack(I), b.push(_);
      for (const C of f) this.lastValues.set(`${C}|text`, x.to);
    }
    if (a !== void 0) {
      const { config: T, start: P, end: _ } = Ol(a), I = this.nextTrackId(`${f[0]}-motionPath`), C = {
        id: I,
        target: f[0],
        ...f.length > 1 && { targets: f },
        ...g && f.length > 1 && { stagger: g },
        property: "motionPath",
        motionPathConfig: T,
        delay: d + m,
        keyframes: this.keyframesFor(P, _, p, y, r.ease)
      };
      this.timeline.addTrack(C), b.push(I);
    }
    if (h !== void 0)
      for (const [T, P] of Object.entries(h)) {
        const _ = this.resolveStart(f[0], T);
        if (typeof _ != "number") {
          this.warn(`inertia on "${T}" needs a numeric start value; skipped`);
          continue;
        }
        const I = Xl(_, P), C = this.nextTrackId(`${f[0]}-${T}-inertia`), R = {
          id: C,
          target: f[0],
          ...f.length > 1 && { targets: f },
          ...g && f.length > 1 && { stagger: g },
          property: T,
          kind: "inertia",
          inertia: I,
          delay: d + m
        };
        this.timeline.addTrack(R), b.push(C), S = Math.max(S, ve(I));
        for (const B of f) this.lastValues.set(`${B}|${T}`, we(I));
      }
    const M = ((h !== void 0 || w !== void 0) && !k && !x && a === void 0 ? S : Math.max(p, S)) + (g && f.length > 1 ? on(f.length, g) : 0), A = d + m + M;
    return this.previousStart = d + m, this.previousEnd = A, this.cursor = Math.max(this.cursor, A), {
      trackIds: b,
      start: d + m,
      end: A,
      kill: () => {
        for (const T of b) this.timeline.removeTrack(T);
      }
    };
  }
  /**
   * Two keyframes, or a baked sequence when the ease has no closed form.
   */
  keyframesFor(t, n, s, i, r) {
    const o = { time: 0, value: t };
    if (s <= 0)
      return [{ time: 0, value: n }];
    const a = typeof r == "string" ? Ue(r) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && Ye(i)) {
      const c = a?.fn ?? Z(i);
      return [o, ...Mr(o, { time: s, value: n }, c, { intervalMs: this.options.bakeIntervalMs })];
    }
    return [o, { time: s, value: n, ...i && { easing: i } }];
  }
  /** Resolve a start value through the documented chain. */
  resolveStart(t, n) {
    const s = this.lastValues.get(`${t}|${n}`);
    if (s !== void 0) return s;
    const i = this.options.startValue?.(t, n);
    if (i !== void 0) return i;
    const r = this.options.defaults?.[n];
    if (r !== void 0) return r;
    if (n === "text") return "";
    if (n === "quaternion") return [0, 0, 0, 1];
    if (n === "d")
      throw new Error(
        `gsap-compat: no starting shape for "${t}". Use fromTo({ d: … }, { morphSVG: … }), or live.to(), which reads the element's current shape.`
      );
    const o = Nr(n);
    return o !== void 0 ? (this.warn(
      `no start value for "${n}" on "${t}" — using the static default ${o}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), o) : (this.warn(`no start value or default for "${n}" on "${t}" — using 0`), 0);
  }
  easingFor(t) {
    if (t !== void 0) {
      if (typeof t == "string") return Ue(t).easing;
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
function Sn(e) {
  if (typeof e == "string") return e;
  if (e && typeof e == "object") {
    const t = e;
    return String(t.value ?? t.text ?? "");
  }
  return String(e ?? "");
}
function Ul(e) {
  return new Dt(e);
}
function Jt(e) {
  return Nl(Fl(e));
}
function zl(e) {
  return !Array.isArray(e) || e.length !== 4 ? null : `matrix3d(${de(bt(e)).map((n) => Math.round(n * 1e6) / 1e6 + 0).join(", ")})`;
}
const jl = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), Gl = "#ffffff", Jl = "rgba(0, 0, 0, 0.5)";
function Zl(e) {
  const t = [];
  if (e.blur !== void 0 && t.push(`blur(${Math.max(0, e.blur)}px)`), e.brightness !== void 0 && t.push(`brightness(${Math.max(0, e.brightness)})`), e.glow !== void 0 && t.push(`drop-shadow(0 0 ${Math.max(0, e.glow)}px ${e.glowColor ?? Gl})`), e.shadowX !== void 0 || e.shadowY !== void 0 || e.shadowBlur !== void 0) {
    const n = e.shadowX ?? 0, s = e.shadowY ?? 0, i = Math.max(0, e.shadowBlur ?? 0);
    t.push(`drop-shadow(${n}px ${s}px ${i}px ${e.shadowColor ?? Jl})`);
  }
  return t.length > 0 ? t.join(" ") : null;
}
function Ql(e, t) {
  const n = e.childNodes.length === 1 ? e.firstChild : null;
  if (n && n.nodeType === 3) {
    const s = n;
    s.data !== t && (s.data = t);
    return;
  }
  e.textContent !== t && (e.textContent = t);
}
function tc(e) {
  if (!("ownerSVGElement" in e)) return;
  const t = e.style;
  !t || t.transformBox || (t.transformBox = "fill-box", t.transformOrigin || (t.transformOrigin = "50% 50%"));
}
const si = /* @__PURE__ */ new Set([
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
]), ec = /* @__PURE__ */ new Set([
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
]), nc = [
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
], sc = /* @__PURE__ */ new Set(["childPerspective", "perspectiveOriginX", "perspectiveOriginY"]), ic = /* @__PURE__ */ new Set(["originX", "originY"]), rc = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), oc = /* @__PURE__ */ new Set(["drawOn"]), ac = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, ii = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, lc = "http://www.w3.org/2000/svg";
class Et {
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
    for (const [n, s] of t.values) {
      const i = this.targets.get(n);
      i && this.applyProperties(i, s);
    }
  }
  /**
   * Apply properties to a single element.
   */
  applyProperties(t, n) {
    let s = null, i = null, r = null, o = null, a = null;
    const l = n.has("motionPathX"), c = n.has("motionPathY"), h = n.has("motionPathRotate");
    for (const [m, p] of n)
      if (!(m === "x" && l) && !(m === "y" && c) && !((m === "rotate" || m === "rotateZ") && h) && !oc.has(m)) {
        if (ec.has(m))
          (s ??= {})[m] = p;
        else if (sc.has(m))
          typeof p == "number" && ((i ??= {})[m] = p);
        else if (ic.has(m))
          typeof p == "number" && ((r ??= {})[m] = p);
        else if (rc.has(m))
          typeof p == "number" && ((o ??= {})[m] = p);
        else if (jl.has(m))
          (a ??= {})[m] = p;
        else if (m !== "perspective") {
          if (m !== "shine") if (m === "text" && typeof p == "string")
            Ql(t, p);
          else if (m === "d" && typeof p == "string") {
            const g = t;
            (g.tagName?.toLowerCase() === "path" ? g : g.querySelector?.("path"))?.setAttribute?.("d", p);
          } else
            this.applyStyleProperty(t, m, p);
        }
      }
    const u = n.get("shine");
    typeof u == "number" && this.applyShine(t, u);
    const f = [], d = n.get("perspective");
    if (typeof d == "number" && d > 0 && f.push(`perspective(${d}px)`), s)
      for (const m of nc) {
        const p = s[m];
        if (p === void 0) continue;
        const g = this.buildTransformPart(m, p);
        g && f.push(g);
      }
    if (f.length > 0 && (t.style.transform = f.join(" "), tc(t)), i && (i.childPerspective !== void 0 && (t.style.perspective = `${i.childPerspective}px`), (i.perspectiveOriginX !== void 0 || i.perspectiveOriginY !== void 0) && (t.style.perspectiveOrigin = `${i.perspectiveOriginX ?? 50}% ${i.perspectiveOriginY ?? 50}%`)), r) {
      const m = r.originX ?? 50, p = r.originY ?? 50;
      t.style.transformOrigin = `${m}% ${p}%`;
    }
    if (o) {
      const m = o.clipTop ?? 0, p = o.clipRight ?? 0, g = o.clipBottom ?? 0, y = o.clipLeft ?? 0;
      t.style.clipPath = `inset(${m}% ${p}% ${g}% ${y}%)`;
    }
    if (a) {
      const m = Zl(a);
      m && (t.style.filter = m);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(t, n) {
    if (t === "quaternion") return zl(n);
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
    const s = t.dataset.shineBase, i = -20 + n * 140, r = t.style;
    r.color = "transparent", r.backgroundImage = `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.9) 50%, transparent 60%), linear-gradient(${s}, ${s})`, r.backgroundSize = "250% 100%, 100% 100%", r.backgroundPosition = `${i}% 0, 0 0`, r.backgroundRepeat = "no-repeat", r.webkitBackgroundClip = "text", r.backgroundClip = "text";
  }
  /**
   * Apply a single style property to an element.
   */
  applyStyleProperty(t, n, s) {
    let i;
    if (t.namespaceURI === lc && n in ii) {
      const a = Array.isArray(s) ? s.join(", ") : String(s);
      t.style[ii[n]] = a;
      return;
    } else n === "fill" && t.dataset?.elementType === "text" ? i = "color" : i = ac[n] ?? n;
    let o;
    typeof s == "number" ? si.has(n) || si.has(i) ? o = `${s}px` : o = String(s) : Array.isArray(s) ? o = s.join(", ") : o = s, t.style[i] = o;
  }
}
const cc = {
  request: (e) => requestAnimationFrame(e),
  cancel: (e) => cancelAnimationFrame(e)
};
class hc {
  adapter = new Et();
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
  utils = Al();
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
    this.scheduler = t.scheduler ?? cc, this.rootOption = t.root, this.onWarning = t.onWarning;
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
    for (const s of this.targetsOf(t)) {
      const i = this.nameFor(s);
      Mn(s) && this.currentCollector?.touch(s, i), n.push(i);
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
    for (const i of [...this.active.keys()].reverse()) {
      if (i.getTracks({ target: t, property: n }).length === 0) continue;
      const r = i.currentTime;
      if (r < 4) return 0;
      const o = i.getStateAtTime(r).values.get(t)?.get(n), a = i.getStateAtTime(r - 4).values.get(t)?.get(n);
      if (typeof o != "number" || typeof a != "number") return;
      const l = (o - a) / 4;
      return (i.direction === "reverse" ? -l : l) * 1e3;
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
    this.destroyed || (t.onUpdate = (s) => this.write(s), this.active.delete(t), this.active.set(t, n), this.startLoop());
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
    const s = new Map(Object.entries(n));
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
    const n = [...this.active];
    for (const [s] of n)
      s.duration <= 0 ? (this.write(s.getStateAtTime(0)), s.stop()) : s.tick(t);
    this.flush();
    for (const [s, i] of n)
      i.onUpdate?.(), s.playbackState !== "playing" && this.active.get(s) === i && this.active.delete(s);
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
    for (const [n, s] of t.values) {
      let i = this.applied.get(n);
      i || (i = /* @__PURE__ */ new Map(), this.applied.set(n, i));
      for (const [r, o] of s) i.set(r, o);
      this.dirty.add(n);
    }
  }
  flush() {
    if (this.dirty.size === 0) return;
    const t = /* @__PURE__ */ new Map();
    for (const n of this.dirty) {
      const s = this.applied.get(n), i = this.objects.get(n);
      if (i)
        for (const [r, o] of s) i[r] = o;
      else
        t.set(n, s);
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
    if (Mn(t)) return [t];
    if (!uc(t)) return [t];
    const n = [];
    for (const s of Array.from(t))
      n.push(...this.targetsOf(s));
    return n;
  }
  nameFor(t) {
    return Mn(t) ? this.elementName(t) : this.objectName(t);
  }
  objectName(t) {
    const n = this.objectNames.get(t);
    if (n) return n;
    let s;
    do
      this.nameCounter += 1, s = `obj-${this.nameCounter}`;
    while (this.objects.has(s) || this.elements.has(s));
    return this.objectNames.set(t, s), this.objects.set(s, t), s;
  }
  elementName(t) {
    const n = this.names.get(t);
    if (n) return n;
    let s = t.id ? `#${t.id}` : "";
    if (!s || this.elements.has(s))
      do
        this.nameCounter += 1, s = `el-${this.nameCounter}`;
      while (this.elements.has(s));
    return this.names.set(t, s), this.elements.set(s, t), this.adapter.registerTarget(s, t), s;
  }
}
function Mn(e) {
  return typeof e == "object" && e !== null && e.nodeType === 1;
}
function uc(e) {
  if (Array.isArray(e)) return !0;
  const t = e;
  return typeof t.length == "number" && typeof t.item == "function";
}
function je(e) {
  const t = e.style;
  if (!t) return e.getBoundingClientRect();
  const n = t.transform;
  t.transform = "none";
  const s = e.getBoundingClientRect();
  return t.transform = n, s;
}
const ri = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function fc(e) {
  const t = {};
  for (const n of Array.from(e.attributes)) t[n.name] = n.value;
  return t;
}
function dc(e) {
  const t = e.getScreenCTM?.();
  if (t) return [t.a, t.b, t.c, t.d, t.e, t.f];
  const n = e.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function pc(e, t) {
  const n = typeof e == "string" || Array.isArray(e) || ri(e) ? { path: e } : e, { align: s, alignOrigin: i, path: r, ...o } = n, a = (x) => {
    const v = ri(x) ? x : t.query(x);
    return v || t.warn(`gsap-compat: motionPath could not find "${String(x)}"`), v;
  };
  let l = null, c = "";
  if (Array.isArray(r) || typeof r == "string" && ke(r))
    c = r;
  else {
    l = a(r);
    const x = l && ms({ tag: l.localName, attributes: fc(l) });
    l && !x && t.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), c = x ?? "";
  }
  const h = { ...o, path: c };
  if (s === void 0 || s === !1) return h;
  const u = s === !0 ? l : a(s);
  if (!u)
    return s === !0 && t.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const f = t.targets[0];
  if (!f) return h;
  const [d, m, p, g, y, b] = dc(u), w = je(f), [S, k] = i ?? [0.5, 0.5];
  for (const x of t.targets.slice(1)) {
    const v = je(x);
    if (Math.abs(v.left - w.left) > 0.5 || Math.abs(v.top - w.top) > 0.5) {
      t.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [d, m, p, g, y - w.left - S * w.width, b - w.top - k * w.height], h;
}
const Yr = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function Xr(e) {
  const t = {};
  for (const n of Array.from(e.attributes)) t[n.name] = n.value;
  return t;
}
function qr(e) {
  if (!e) return null;
  const t = ms({ tag: e.localName, attributes: Xr(e) });
  return t || (e.querySelector("path")?.getAttribute("d") ?? null);
}
function mc(e, t, n) {
  const s = Kr(e);
  if (typeof s == "string" && ke(s)) return s;
  const i = Yr(s) ? s : typeof s == "string" ? t(s) : null, r = qr(i);
  return r || (n(`gsap-compat: morphSVG could not find a shape for "${String(s)}"`), "");
}
const gc = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function yc(e, t = document) {
  return (typeof e == "string" ? Array.from(t.querySelectorAll(e)) : Yr(e) ? [e] : Array.from(e)).map((s) => {
    if (s.localName === "path") return s;
    const i = ms({ tag: s.localName, attributes: Xr(s) });
    if (!i || !s.parentNode) return s;
    const r = s.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const o of Array.from(s.attributes))
      gc.has(o.name) || r.setAttribute(o.name, o.value);
    return r.setAttribute("d", i), s.parentNode.replaceChild(r, s), r;
  });
}
const oi = 0.3;
class bc {
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
  begin(t, n, s) {
    this.dragging = !0, this.passedTolerance = !1, this.startX = t, this.startY = n, this.lastX = t, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = ai(), this.options.onPress?.(this.stateFrom(0, 0, s));
  }
  move(t, n, s) {
    if (!this.dragging) return;
    const i = t - this.lastX, r = n - this.lastY;
    this.lastX = t, this.lastY = n;
    const o = t - this.startX, a = n - this.startY, l = this.options.tolerance ?? 3;
    if (!this.passedTolerance) {
      if (Math.hypot(o, a) < l) return;
      this.passedTolerance = !0;
    }
    this.updateVelocity(i, r), this.options.preventDefault !== !1 && s.cancelable && s.preventDefault(), this.options.onMove?.(this.stateFrom(i, r, s));
  }
  end(t) {
    this.dragging && (this.dragging = !1, this.options.onRelease?.(this.stateFrom(0, 0, t)));
  }
  updateVelocity(t, n) {
    const s = ai(), i = Math.max(1, s - this.lastTime);
    this.lastTime = s;
    const r = t / i * 1e3, o = n / i * 1e3;
    this.velocityX += (r - this.velocityX) * oi, this.velocityY += (o - this.velocityY) * oi;
  }
  stateFrom(t, n, s) {
    return {
      deltaX: t,
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
  onPointerDown = (t) => {
    const n = t, s = this.target;
    if (typeof n.pointerId == "number" && typeof s.setPointerCapture == "function")
      try {
        s.setPointerCapture(n.pointerId);
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
function ai() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function wc(e, t, n) {
  let s = { delta: 0, line: null }, i = n;
  for (const r of e)
    for (const o of t) {
      const a = Math.abs(o - r);
      a <= i && (i = a, s = { delta: o - r, line: o });
    }
  return s;
}
function vc(e, t) {
  return t <= 0 ? [] : e.map((n) => Math.round(n / t) * t);
}
class Vr {
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
    this.options = t, this.x = t.initialX ?? 0, this.y = t.initialY ?? 0, this.observer = new bc({
      target: t.target,
      onPress: (n) => {
        const s = t.getPosition?.();
        s && (this.x = s.x, this.y = s.y), this.originX = this.x, this.originY = this.y, t.onPress?.(n);
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
    const s = this.options.axis ?? "both";
    this.x = s === "y" ? this.x : this.applyConstraints(t, "x"), this.y = s === "x" ? this.y : this.applyConstraints(n, "y");
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
    const s = this.options.scrubDistance ?? 500;
    if (s === 0) return;
    const i = (this.options.axis ?? "both") === "y" ? this.y : this.x, r = kc(i / s);
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
    let s = t;
    const i = [
      ...vc([s], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], r = wc([s], i, this.snapThreshold());
    s += r.delta, n === "x" ? this.snappedX = r.line : this.snappedY = r.line;
    const o = this.options.bounds;
    if (o) {
      const a = n === "x" ? o.minX : o.minY, l = n === "x" ? o.maxX : o.maxY;
      a !== void 0 && (s = Math.max(a, s)), l !== void 0 && (s = Math.min(l, s));
    }
    return s;
  }
}
function kc(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e;
}
function C0(e) {
  const t = new Vr(e);
  return t.start(), t;
}
const Sc = { x: "x", y: "y", "x,y": "both" }, Un = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function li(e, t) {
  const n = je(e), s = t.getBoundingClientRect();
  return {
    minX: s.left - n.left,
    maxX: s.right - n.right,
    minY: s.top - n.top,
    maxY: s.bottom - n.bottom
  };
}
function ci(e) {
  return Array.isArray(e) ? [...e] : e;
}
function Mc(e, t, n, s = {}) {
  const [i] = t.resolveTargets(n), r = i ? t.elementFor(i) : void 0;
  if (!i || !r)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  if (s.type === "rotation") return xc(e, t, i, r, s);
  const o = Sc[s.type ?? "x,y"], a = () => {
    const p = t.appliedValue(i, "x"), g = t.appliedValue(i, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof g == "number" ? g : 0 };
  }, l = typeof s.bounds == "string" ? t.query(s.bounds) : Un(s.bounds) ? s.bounds : null, h = { bounds: (!l && s.bounds && !Un(s.bounds) ? s.bounds : void 0) ?? (l ? li(r, l) : void 0) };
  let u = null;
  const f = () => {
    u?.kill(), u = null;
  }, d = (p) => {
    const g = s.inertia === !0 ? {} : s.inertia, y = g.friction ?? (g.resistance !== void 0 ? ws(g.resistance) : 4), b = a(), w = h.bounds ?? {};
    let S, k;
    const x = g.end;
    if (Array.isArray(x)) {
      const E = Xe({ from: b.x, velocity: o === "y" ? 0 : p.x, friction: y }), M = Xe({ from: b.y, velocity: o === "x" ? 0 : p.y, friction: y });
      let A = x[0];
      for (const T of x)
        Math.hypot(T.x - E, T.y - M) < Math.hypot(A.x - E, A.y - M) && (A = T);
      A && (S = [A.x], k = [A.y]);
    } else typeof x == "number" ? (S = x, k = x) : x && (S = ci(x.x), k = ci(x.y));
    const v = {};
    o !== "y" && (v.x = { velocity: p.x, friction: y, min: w.minX, max: w.maxX, end: S }), o !== "x" && (v.y = { velocity: p.y, friction: y, min: w.minY, max: w.maxY, end: k }), u = e.to(r, { inertia: v, onComplete: () => s.onThrowComplete?.() });
  }, m = new Vr({
    target: r,
    axis: o,
    snap: s.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: a,
    onPress: () => {
      f(), l && (h.bounds = li(r, l)), s.onPress?.();
    },
    onDrag: (p) => {
      t.apply(i, o === "x" ? { x: p.x } : o === "y" ? { y: p.y } : { x: p.x, y: p.y }), s.onDrag?.(p);
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
      const p = t.appliedValue(i, "rotate");
      return typeof p == "number" ? p : 0;
    },
    destroy() {
      f(), m.destroy();
    }
  };
}
function xc(e, t, n, s, i) {
  const r = typeof i.bounds == "object" && i.bounds !== null && !Un(i.bounds) ? i.bounds : {}, o = () => {
    const w = t.appliedValue(n, "rotate");
    return typeof w == "number" ? w : 0;
  }, a = (w) => Math.min(r.maxRotation ?? 1 / 0, Math.max(r.minRotation ?? -1 / 0, w));
  let l = null, c = !1, h, u = { x: 0, y: 0 }, f = 0, d = 0, m = [];
  const p = (w) => Math.atan2(w.clientY - u.y, w.clientX - u.x) * 180 / Math.PI, g = (w) => {
    if (c) return;
    l?.kill(), l = null, c = !0, h = w.pointerId, s.setPointerCapture?.(w.pointerId);
    const S = s.getBoundingClientRect();
    u = { x: S.left + S.width / 2, y: S.top + S.height / 2 }, f = p(w), d = o(), m = [{ time: performance.now(), rotation: d }], i.onPress?.();
  }, y = (w) => {
    if (!c || w.pointerId !== h) return;
    const S = p(w);
    let k = S - f;
    k > 180 && (k -= 360), k < -180 && (k += 360), f = S, d += k;
    let x = a(d);
    i.snap && (x = a(Math.round(x / i.snap) * i.snap)), t.apply(n, { rotate: x });
    const v = performance.now();
    for (m.push({ time: v, rotation: x }); m.length > 2 && v - m[0].time > 100; ) m.shift();
    const E = { x: 0, y: 0 };
    i.onDrag?.(E);
  }, b = (w) => {
    if (!c || w.pointerId !== h) return;
    c = !1;
    const S = m[0], k = m[m.length - 1], x = S && k ? (k.time - S.time) / 1e3 : 0, v = x > 0 ? (k.rotation - S.rotation) / x : 0;
    if (i.onRelease?.({ x: v, y: 0 }), !i.inertia) return;
    const E = i.inertia === !0 ? {} : i.inertia, M = E.friction ?? (E.resistance !== void 0 ? ws(E.resistance) : 4), A = typeof E.end == "number" || Array.isArray(E.end) ? E.end : void 0;
    l = e.to(s, {
      inertia: {
        rotate: {
          velocity: v,
          friction: M,
          min: r.minRotation,
          max: r.maxRotation,
          end: Array.isArray(A) ? A.filter((T) => typeof T == "number") : A
        }
      },
      onComplete: () => i.onThrowComplete?.()
    });
  };
  return s.addEventListener("pointerdown", g), s.addEventListener("pointermove", y), s.addEventListener("pointerup", b), s.addEventListener("pointercancel", b), s.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return o();
    },
    destroy() {
      l?.kill(), s.removeEventListener("pointerdown", g), s.removeEventListener("pointermove", y), s.removeEventListener("pointerup", b), s.removeEventListener("pointercancel", b);
    }
  };
}
const Tc = { opacity: 0, scale: 0.6 };
function Ec(e) {
  const t = e.getBoundingClientRect();
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function hi(e) {
  const t = je(e);
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function zn(e, t) {
  const s = e.resolveTargets(t).map((o) => e.elementFor(o)).filter((o) => !!o), i = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of s) {
    const a = Ec(o);
    i.set(o, a);
    const l = Ur(o);
    a && l !== void 0 && !r.has(l) && r.set(l, { element: o, box: a });
  }
  return { elements: s, boxes: i, ids: r };
}
const xn = /* @__PURE__ */ new WeakMap();
function jn(e, t, n, s = {}) {
  const i = s.duration ?? 0.6, r = s.ease ?? "power2.inOut", o = s.stagger ?? 0, a = s.scale !== !1, l = s.enter === void 0 ? Tc : s.enter, c = new Set(n.elements);
  if (s.targets !== void 0)
    for (const d of e.resolveTargets(s.targets)) {
      const m = e.elementFor(d);
      m && c.add(m);
    }
  const h = [...c].sort(
    (d, m) => d === m ? 0 : d.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), u = t({ onComplete: s.onComplete });
  let f = 0;
  for (const d of h) {
    const m = hi(d);
    if (!m) continue;
    let p = n.boxes.get(d) ?? null, g;
    const y = Ur(d), b = !p && y !== void 0 ? n.ids.get(y) : void 0;
    b && b.element !== d && (p = b.box, g = b.element);
    const [w] = e.resolveTargets(d);
    xn.get(d)?.timeline.removeTracks({ target: w });
    const S = f * o;
    if (!p) {
      if (l === !1) continue;
      u.fromTo(d, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...zr(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: i, ease: r, delay: S }, 0), xn.set(d, u), f++;
      continue;
    }
    const k = p.cx - m.cx, x = p.cy - m.cy, v = a ? p.width / m.width : 1, E = a ? p.height / m.height : 1;
    if (!(Math.abs(k) > 0.5 || Math.abs(x) > 0.5 || Math.abs(v - 1) > 1e-3 || Math.abs(E - 1) > 1e-3)) {
      const T = (P, _) => {
        const I = e.appliedValue(w, P);
        return typeof I == "number" && Math.abs(I - _) > 1e-6;
      };
      (T("x", 0) || T("y", 0) || T("scaleX", 1) || T("scaleY", 1)) && u.set(d, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const A = s.fade === !0 && g !== void 0;
    u.fromTo(
      d,
      { x: k, y: x, scaleX: v, scaleY: E, ...A && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...A && { opacity: 1 }, duration: i, ease: r, delay: S },
      0
    ), A && g && hi(g) && u.fromTo(g, { opacity: 1 }, { opacity: 0, duration: i, ease: r, delay: S }, 0), xn.set(d, u), f++;
  }
  return u;
}
function Ur(e) {
  return e.dataset?.flipId;
}
function zr(e) {
  const t = {};
  for (const n of Object.keys(e))
    t[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return t;
}
function Ac(e, t = {}) {
  const n = new Set((t.type ?? "chars,words,lines").split(",").map((p) => p.trim())), s = {
    chars: t.charsClass ?? "char",
    words: t.wordsClass ?? "word",
    lines: t.linesClass ?? "line"
  }, i = t.aria !== !1, r = e.map((p) => ({
    element: p,
    html: p.innerHTML,
    ariaLabel: p.getAttribute("aria-label")
  }));
  let o = { chars: [], words: [], lines: [], masks: [] }, a, l, c = !1;
  const h = () => {
    for (const { element: p, html: g, ariaLabel: y } of r)
      p.innerHTML = g, y === null ? p.removeAttribute("aria-label") : p.setAttribute("aria-label", y);
  }, u = () => {
    a && (a.revert ? a.revert() : a.kill?.(), a = void 0);
  }, f = () => {
    const p = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: g } of r) {
      const y = (g.textContent ?? "").replace(/\s+/g, " ").trim(), b = Pc(g, s.words), w = n.has("chars") ? b.flatMap((x) => _c(x, s.chars)) : [], S = n.has("lines") ? Cc(g, b, s.lines) : [];
      if (i) {
        !g.hasAttribute("aria-label") && y && g.setAttribute("aria-label", y);
        for (const x of b) x.setAttribute("aria-hidden", "true");
      }
      if (n.has("words")) p.words.push(...b);
      else for (const x of b) x.removeAttribute("class");
      p.chars.push(...w), p.lines.push(...S);
      const k = t.mask === "lines" ? S : t.mask === "words" ? b : t.mask === "chars" ? w : [];
      for (const x of k) p.masks.push(Hc(x, `${s[t.mask]}-mask`));
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
      c || (u(), h(), f(), a = t.onSplit?.(d));
    },
    revert() {
      c = !0, l?.disconnect(), u(), h();
    }
  };
  f(), a = t.onSplit?.(d), t.autoSplit && m();
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
      l = new ResizeObserver((w) => {
        let S = !1;
        for (const k of w) {
          const x = Math.round(k.contentRect.width), v = p.get(k.target);
          p.set(k.target, x), v !== void 0 && v !== x && (S = !0);
        }
        S && y();
      });
      for (const w of e) l.observe(w);
    }
    const b = e[0]?.ownerDocument?.fonts;
    b && b.status !== "loaded" && b.ready.then(() => y());
  }
  return d;
}
function Pc(e, t) {
  const n = e.ownerDocument, s = [], i = n.createTreeWalker(
    e,
    4
    /* NodeFilter.SHOW_TEXT */
  ), r = [];
  for (let o = i.nextNode(); o; o = i.nextNode()) r.push(o);
  for (const o of r) {
    const a = o.data.match(/\s+|\S+/g) ?? [];
    if (a.length === 0) continue;
    const l = n.createDocumentFragment();
    for (const c of a) {
      if (/^\s/.test(c)) {
        l.appendChild(n.createTextNode(c));
        continue;
      }
      const h = n.createElement("span");
      h.className = t, h.style.display = "inline-block", h.textContent = c, l.appendChild(h), s.push(h);
    }
    o.replaceWith(l);
  }
  return s;
}
function _c(e, t) {
  const n = e.ownerDocument, s = Ic(e.textContent ?? "").map((i) => {
    const r = n.createElement("span");
    return r.className = t, r.style.display = "inline-block", r.textContent = i, r;
  });
  return e.replaceChildren(...s), s;
}
function Ic(e) {
  const t = Intl.Segmenter;
  return t ? Array.from(new t(void 0, { granularity: "grapheme" }).segment(e), (n) => n.segment) : Array.from(e);
}
function Cc(e, t, n) {
  const s = e.ownerDocument, i = new Map(t.map((m) => [m, m.getBoundingClientRect()])), r = [], o = (m) => {
    for (const p of Array.from(m.childNodes))
      p.nodeType === 3 || i.has(p) || p.tagName === "BR" ? r.push(p) : o(p);
  };
  o(e);
  const a = [];
  let l = null, c = 0, h = 0, u = !1, f = [];
  const d = () => {
    l = s.createElement("span"), l.className = n, l.style.display = "block", a.push(l), f = [];
  };
  for (const m of r) {
    if (m.tagName === "BR") {
      u = !0;
      continue;
    }
    const p = i.get(m);
    if (p && (!l || u || p.top > c + h) && (d(), c = p.top, h = p.height / 2, u = !1), !l) continue;
    const g = [];
    for (let w = m.parentNode; w && w !== e; w = w.parentNode) g.unshift(w);
    let y = 0;
    for (; y < f.length && y < g.length && f[y].original === g[y]; ) y++;
    f.length = y;
    let b = y === 0 ? l : f[y - 1].clone;
    for (const w of g.slice(y)) {
      const S = w.cloneNode(!1);
      b.appendChild(S), f.push({ original: w, clone: S }), b = S;
    }
    b.appendChild(m);
  }
  return e.replaceChildren(...a), a;
}
function Hc(e, t) {
  const n = e.ownerDocument.createElement("span");
  return n.className = t, n.style.display = e.style.display === "block" ? "block" : "inline-block", n.style.overflow = "clip", n.style.paddingBottom = "0.12em", n.style.marginBottom = "-0.12em", e.replaceWith(n), n.appendChild(e), n;
}
const ui = {
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
function fi(e) {
  const t = e.trim().toLowerCase();
  if (t in ui) return ui[t];
  if (t.endsWith("%")) {
    const n = Number.parseFloat(t.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function jr(e) {
  if (typeof e == "number")
    return { elementFraction: 0, viewportFraction: 0, offsetPx: 0, absolutePx: e };
  let t = 0;
  const s = e.replace(/([+-])=\s*(-?[\d.]+)/g, (o, a, l) => (t += (a === "-" ? -1 : 1) * Number.parseFloat(l), "")).trim().split(/\s+/).filter(Boolean);
  if (s.length === 1 && /^-?[\d.]+$/.test(s[0]))
    return {
      elementFraction: 0,
      viewportFraction: 0,
      offsetPx: 0,
      absolutePx: Number.parseFloat(s[0]) + t
    };
  const i = s[0] !== void 0 ? fi(s[0]) : void 0, r = s[1] !== void 0 ? fi(s[1]) : void 0;
  return {
    elementFraction: i ?? 0,
    viewportFraction: r ?? 0,
    offsetPx: t
  };
}
function pe(e, t, n) {
  const s = jr(n), i = s.absolutePx !== void 0 ? e.top + s.absolutePx : e.top + e.height * s.elementFraction, r = t * s.viewportFraction;
  return i - r + s.offsetPx;
}
function H0(e, t, n, s) {
  const i = pe(e, t, n), o = pe(e, t, s) - i;
  return o <= 0 ? i <= 0 ? 1 : 0 : Gr(-i / o);
}
function Gr(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e === 0 ? 0 : e;
}
function $c(e, t, n, s) {
  if (n <= 0) return t;
  const i = 1 - Math.exp(-(s / 1e3) / n);
  return e + (t - e) * i;
}
function di(e, t, n, s, i) {
  const r = (h) => pe({ top: e + i(h), bottom: e + i(h) + t, height: t }, n, s), o = r(0), a = r(1);
  if (Math.sign(o) === Math.sign(a) || o === 0 || a === 0)
    return o === 0 ? 0 : a === 0 ? 1 : Math.abs(o) < Math.abs(a) ? 0 : 1;
  let l = 0, c = 1;
  for (let h = 0; h < 40; h++) {
    const u = (l + c) / 2;
    Math.sign(r(u)) === Math.sign(o) ? l = u : c = u;
  }
  return (l + c) / 2;
}
class Rc {
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
function $0(e) {
  const t = new Rc(e);
  return t.start(), t;
}
class Oc {
  element;
  spacer;
  saved;
  axis;
  spacing;
  constructor(t, n = {}) {
    this.element = t, this.axis = n.axis ?? "y", this.spacing = n.spacing ?? !0;
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
  apply(t, n) {
    const s = Math.max(0, n);
    this.element.style.position = "sticky", this.axis === "x" ? (this.spacer.style.width = `${this.element.offsetWidth + s}px`, this.spacer.style.marginRight = this.spacing ? "" : `-${s}px`, this.element.style.left = `${t}px`) : (this.spacer.style.height = `${this.element.offsetHeight + s}px`, this.spacer.style.marginBottom = this.spacing ? "" : `-${s}px`, this.element.style.top = `${t}px`);
  }
  /** Remove the spacer and restore the element's own styles. */
  destroy() {
    this.element.style.position = this.saved.position, this.element.style.top = this.saved.top, this.element.style.left = this.saved.left, this.spacer.parentNode && this.spacer.replaceWith(this.element);
  }
}
const Lc = 0.15;
function Fc(e) {
  return typeof e == "object" && !Array.isArray(e) ? e : { snapTo: e };
}
function Bc(e, t, n) {
  const s = Ae(e + t * Lc);
  if (typeof n == "function") return Ae(n(s));
  if (typeof n == "number")
    return n <= 0 ? e : Ae(Math.round(s / n) * n);
  if (n.length === 0) return e;
  let i = n[0];
  for (const r of n)
    Math.abs(r - s) < Math.abs(i - s) && (i = r);
  return Ae(i);
}
function Dc(e, t, n) {
  const s = e.duration ?? { min: 0.2, max: 0.8 };
  if (typeof s == "number") return s;
  const i = Math.min(1, Math.abs(t) / Math.max(1, n));
  return s.min + (s.max - s.min) * i;
}
class Wc {
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
  animate(t, n, s, i = cn, r) {
    if (this.cancel(), typeof requestAnimationFrame > "u" || s <= 0) {
      this.write(n), r?.();
      return;
    }
    for (const l of this.cancelEvents) this.eventTarget?.addEventListener(l, this.onInterrupt, { passive: !0 });
    let o = null;
    const a = (l) => {
      o ??= l;
      const c = Math.min(1, (l - o) / (s * 1e3));
      this.write(t + (n - t) * i(c)), c < 1 ? this.rafId = requestAnimationFrame(a) : (this.rafId = null, this.detach(), r?.());
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
function Ae(e) {
  return Math.max(0, Math.min(1, e));
}
class Nc {
  options;
  scroller;
  nodes = [];
  scrollerStart;
  scrollerEnd;
  start;
  end;
  constructor(t, n, s) {
    this.options = s === !0 ? {} : s, this.scroller = n;
    const { startColor: i = "#3ecf7a", endColor: r = "#ff5a5a", id: o } = this.options, a = o ? `${o} ` : "", l = (c, h, u) => {
      const f = t.createElement("div");
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
      }), (n ?? t.body).appendChild(f), this.nodes.push(f), f;
    };
    this.scrollerStart = l("scroller-start", i, !n), this.scrollerEnd = l("scroller-end", r, !n), this.start = l("start", i, !1), this.end = l("end", r, !1), n && getComputedStyle(n).position === "static" && (n.style.position = "relative");
  }
  /** Place the markers for the latest measurement. */
  place(t, n) {
    this.start.style.top = `${t.startPage}px`, this.end.style.top = `${t.endPage}px`;
    const s = this.scroller ? n : 0;
    this.scrollerStart.style.top = `${s + t.startViewport}px`, this.scrollerEnd.style.top = `${s + t.endViewport}px`;
  }
  /** Keep the viewport lines in place inside a scrolling element. */
  follow(t, n) {
    this.scroller && this.place(t, n);
  }
  destroy() {
    for (const t of this.nodes.splice(0)) t.remove();
  }
}
const Kc = 120, Ft = [], qt = /* @__PURE__ */ new Set();
let Tn = !1;
const Yc = () => {
  Tn || qt.size === 0 || (Tn = !0, queueMicrotask(() => {
    Tn = !1;
    for (const e of qt) e.afterRefresh();
  }));
}, Jr = () => {
  for (const e of qt) e.beforeRefresh();
  for (const e of Ft) e.refresh();
  for (const e of qt) e.afterRefresh();
};
let Bt = { width: 0, height: 0 };
const pi = () => {
  const e = window.innerWidth, t = window.innerHeight, n = e === Bt.width && t !== Bt.height, s = Math.abs(t - Bt.height) < Bt.height * 0.25, i = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  n && s && i || (Bt = { width: e, height: t }, Jr());
};
class dn {
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
    this.timeline = t.timeline, this.options = t, this.snapper = new Wc((n) => this.scrollTo(n), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const t = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    t && !this.options.container && (this.pin = new Oc(t, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new Nc(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), Ft.length === 0 && typeof window < "u" && (Bt = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", pi, { passive: !0 })), Ft.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), Ft.splice(Ft.indexOf(this), 1), Ft.length === 0 && typeof window < "u" && window.removeEventListener("resize", pi), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    Jr();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(t) {
    return qt.add(t), () => qt.delete(t);
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
      const s = this.viewportHeight();
      if (this.startPx = t + pe(n, s, Zt(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(n, s, t), this.pin) {
        const i = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(i.top - (this.startPx - t), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(s) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, t), this.lastScroll = null, this.updateFrom(t, !this.measured), this.measured = !0, Yc();
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
    const s = this.endPx - this.startPx, i = this.zone;
    this.targetProgress = s > 0 ? Gr((t - this.startPx) / s) : t >= this.startPx ? 1 : 0, this.zone = s > 0 ? t <= this.startPx ? "before" : t >= this.endPx ? "after" : "active" : t >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(i, this.zone), n || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const t = this.options.scrub;
    return typeof t == "number" ? Math.max(0, t) : 0;
  }
  resolveEnd(t, n, s) {
    const i = Zt(this.options.end) ?? "bottom top", r = typeof i == "string" ? i.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (r) {
      const o = Number.parseFloat(r[1]);
      return this.startPx + (r[2] === "%" ? n * o / 100 : o);
    }
    return s + pe(t, n, i);
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
    }, Kc));
  }
  /**
   * Emit enter/leave callbacks as the scroll position moves between zones. A jump
   * straight across the range (a fast flick, or loading the page scrolled past
   * it) fires both edges in order.
   */
  fireBoundaryCallbacks(t, n) {
    if (t === n) return;
    const { onEnter: s, onLeave: i, onEnterBack: r, onLeaveBack: o } = this.options;
    t === "before" ? (s?.(), n === "after" && i?.()) : t === "after" ? (r?.(), n === "before" && o?.()) : n === "after" ? i?.() : o?.();
  }
  /** Scrolling has stopped: settle on the nearest snap point, if there is one. */
  scheduleSnap() {
    const t = this.options.snap;
    if (t === void 0 || this.snapper.active) return;
    const n = Fc(t), s = () => {
      this.snapTimer = null;
      const i = this.endPx - this.startPx, r = this.scrollPosition();
      if (!this.running || i <= 0 || r <= this.startPx || r >= this.endPx) return;
      const o = (r - this.startPx) / i, a = this.startPx + Bc(o, this.releaseVelocity / i, n.snapTo) * i;
      Math.abs(a - r) < 1 || this.snapper.animate(r, a, Dc(n, a - r, this.viewportHeight()), n.ease);
    };
    n.delay ? this.snapTimer = setTimeout(s, n.delay * 1e3) : s();
  }
  scrollTo(t) {
    const n = this.options.scroller, s = this.options.horizontal ? { left: t } : { top: t };
    n ? typeof n.scrollTo == "function" ? n.scrollTo({ ...s, behavior: "instant" }) : this.options.horizontal ? n.scrollLeft = t : n.scrollTop = t : typeof window < "u" && window.scrollTo({ ...s, behavior: "instant" });
  }
  /**
   * Resolve start and end for a trigger inside a horizontally moving container:
   * find the container progress where each horizontal position fires, and turn
   * it into the container's scroll offsets.
   */
  measureInContainer(t) {
    const n = this.options.trigger;
    if (typeof n?.getBoundingClientRect != "function") return;
    const s = n.getBoundingClientRect(), i = this.options.scroller?.getBoundingClientRect?.().left ?? 0, r = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, o = s.left - i - t.shiftAt(t.progress()), { start: a, end: l } = t.range(), c = (d) => a + d * (l - a), h = di(o, s.width, r, Zt(this.options.start) ?? "left right", t.shiftAt);
    this.startPx = c(h);
    const u = Zt(this.options.end) ?? "right left", f = typeof u == "string" ? u.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = f ? this.startPx + Number.parseFloat(f[1]) : c(di(o, s.width, r, u, t.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(t) {
    const n = (r, o) => {
      const a = Zt(r) ?? o;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const l = jr(a);
      return t * l.viewportFraction - l.offsetPx;
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
    const t = (n) => {
      if (this.rafId = null, !this.running) return;
      const s = this.lastFrameTime === null ? 16.67 : n - this.lastFrameTime;
      this.lastFrameTime = n, this.displayProgress = $c(this.displayProgress, this.targetProgress, this.smoothing(), s);
      const i = Math.abs(this.targetProgress - this.displayProgress) < 1e-4;
      i && (this.displayProgress = this.targetProgress), this.applyProgress(), i ? this.lastFrameTime = null : this.rafId = requestAnimationFrame(t);
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
    const n = this.options.horizontal, s = n ? t.left ?? 0 : t.top, i = n ? t.right ?? 0 : t.bottom, r = n ? t.width ?? 0 : t.height, o = this.options.scroller;
    if (o && typeof o.getBoundingClientRect == "function") {
      const a = o.getBoundingClientRect(), l = n ? a.left : a.top;
      return { top: s - l, bottom: i - l, height: r };
    }
    return { top: s, bottom: i, height: r };
  }
  /** The viewport's size along the scroll axis. */
  viewportHeight() {
    const t = this.options.scroller, n = this.options.horizontal;
    return t ? n ? t.clientWidth : t.clientHeight : typeof window < "u" ? n ? window.innerWidth : window.innerHeight : 0;
  }
}
function Zt(e) {
  return typeof e == "function" ? e() : e;
}
function R0(e) {
  const t = new dn(e);
  return t.start(), t;
}
const En = /* @__PURE__ */ new Set(), Xc = 16, mi = 0.5, qc = 2;
class gi {
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
    return t.addEventListener("wheel", this.onWheel, { passive: !1 }), t.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), En.add(this), this.stopListening = dn.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const t of En) t.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const t = this.options.scroller ?? window;
    return t.removeEventListener("wheel", this.onWheel), t.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), En.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const t of this.effects) An(t.element, t.saved);
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
    const s = this.clamp(this.resolve(t) + (n.offset ?? 0)), i = Math.abs(s - this.current), r = this.reduced ? 0 : n.duration ?? Math.min(1.2, Math.max(0.4, i / 2500));
    if (r <= 0) {
      this.journey = null, this.current = this.target = s, this.write(s), this.applyEffects(0);
      return;
    }
    this.target = s, this.journey = { from: this.current, to: s, ms: r * 1e3, ease: n.ease ?? cn, elapsed: 0 }, this.requestFrame();
  }
  /** Re-measure the scrollable length and every effect element (resizes do this). */
  refresh() {
    if (!this.running) return;
    this.rest(), this.effects = [];
    const t = this.options.effects === !0 ? "[data-speed], [data-lag]" : this.options.effects || "";
    if (t && !this.reduced) {
      const n = this.options.scroller ?? document, s = this.position(), i = this.viewportHeight(), r = this.options.scroller?.getBoundingClientRect().top ?? 0;
      for (const o of n.querySelectorAll(t)) {
        const a = Number.parseFloat(o.dataset.speed ?? ""), l = Number.parseFloat(o.dataset.lag ?? ""), c = o.getBoundingClientRect(), h = c.top - r + s;
        this.effects.push({
          element: o,
          speed: Number.isFinite(a) ? a : void 0,
          lag: Number.isFinite(l) && l > 0 ? l : void 0,
          centre: h + c.height / 2 - i / 2,
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
    for (const t of this.effects) An(t.element, t.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(t) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || t.ctrlKey || Math.abs(t.deltaX) > Math.abs(t.deltaY) || this.nestedScrollerTakes(t)) return;
    const n = t.deltaMode === 1 ? Xc : t.deltaMode === 2 ? this.viewportHeight() : 1, s = t.deltaY * n * (this.options.wheelMultiplier ?? 1), i = this.clamp(this.target + s);
    i === this.target && i === this.current || (t.preventDefault(), this.journey = null, this.target = i, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const t = this.position();
    this.written !== null && Math.abs(t - this.written) <= qc || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = t, this.requestFrame());
  }
  nestedScrollerTakes(t) {
    const n = this.options.scroller ?? document.documentElement;
    for (let s = t.target; s && s !== n && s !== document.body; s = s.parentElement) {
      if (s.hasAttribute?.("data-smooth-ignore")) return !0;
      const i = getComputedStyle(s);
      if (!/(auto|scroll)/.test(i.overflowY) || s.scrollHeight <= s.clientHeight) continue;
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
    const n = this.lastTime === null ? 1e3 / 60 : Math.min(100, t - this.lastTime);
    this.lastTime = t;
    const s = this.current;
    if (this.journey) {
      const r = this.journey;
      r.elapsed += n;
      const o = Math.min(1, r.elapsed / r.ms);
      this.current = r.from + (r.to - r.from) * r.ease(o), o >= 1 && (this.journey = null);
    } else if (this.current !== this.target) {
      const r = (this.options.smooth ?? 0.8) * 1e3 / 3;
      this.current += (this.target - this.current) * (1 - Math.exp(-n / r)), Math.abs(this.target - this.current) < mi && (this.current = this.target);
    }
    this.current !== s && this.write(this.current), this.velocityPxPerSecond = n > 0 ? (this.current - s) * 1e3 / n : 0;
    const i = this.applyEffects(n);
    this.current !== s && this.options.onUpdate?.(this.state), this.journey || this.current !== this.target || i ? this.requestFrame() : (this.lastTime = null, this.velocityPxPerSecond = 0);
  }
  /** Position every effect for the current scroll; true while a lag is still catching up. */
  applyEffects(t) {
    let n = !1;
    const s = this.current;
    for (const i of this.effects) {
      let r = 0;
      if (i.speed !== void 0 && (r += (s - i.centre) * (1 - i.speed)), i.lag !== void 0) {
        const o = i.lag * 1e3 / 3;
        i.lagged = t === 0 ? s : i.lagged + (s - i.lagged) * (1 - Math.exp(-t / o)), Math.abs(s - i.lagged) < mi ? i.lagged = s : n = !0, r += s - i.lagged;
      }
      An(i.element, r === 0 ? i.saved : `0 ${Vc(r)}px`), i.shift = r;
    }
    return n;
  }
  // --- geometry -------------------------------------------------------------
  write(t) {
    const n = Math.round(t);
    this.written = n;
    const s = this.options.scroller;
    s ? s.scrollTop = n : window.scrollTo({ top: n, behavior: "instant" });
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
    const n = this.options.scroller ?? document, s = typeof t == "string" ? n.querySelector(t) : t;
    if (!s) return this.current;
    const i = this.options.scroller?.getBoundingClientRect().top ?? 0, r = this.effects.find((o) => o.element === s)?.shift ?? 0;
    return s.getBoundingClientRect().top - i + this.position() - r;
  }
}
function An(e, t) {
  t ? e.style.setProperty("translate", t) : e.style.removeProperty("translate");
}
function Vc(e) {
  return Math.round(e * 100) / 100;
}
function Uc(e, t) {
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
function vs(e, t, n, s, i = () => {
}) {
  const r = (d) => typeof d == "string" ? e.query(d) ?? void 0 : d, o = r(t.trigger) ?? s;
  if (!o) {
    i(`gsap-compat: scrollTrigger has no trigger element${typeof t.trigger == "string" ? ` for "${t.trigger}"` : ""}`);
    return;
  }
  const a = t.scrub === void 0 || t.scrub === !1 ? !1 : t.scrub, l = (t.toggleActions ?? "play none none none").trim().split(/\s+/);
  let c = 0, h;
  const u = (d, m) => () => {
    m?.(), n && !a && Uc(n, l[d] ?? "none"), t.once && d === 0 && queueMicrotask(() => h.destroy());
  }, f = t.containerAnimation ? Gc(e, t.containerAnimation, o, i) : void 0;
  return h = new dn({
    trigger: o,
    start: t.start,
    end: t.end,
    scrub: a === !1 ? void 0 : a,
    pin: t.pin === !0 ? !0 : r(t.pin),
    scroller: r(t.scroller),
    horizontal: t.horizontal,
    pinSpacing: t.pinSpacing,
    onRefresh: t.invalidateOnRefresh && n?.invalidate ? () => n.invalidate() : void 0,
    snap: t.snap === void 0 ? void 0 : zc(t.snap, n),
    markers: t.markers,
    container: f,
    onUpdate: (d, m) => {
      if (n && a !== !1 && n.progress(d), t.onUpdate) {
        const p = d < c || m < 0 ? -1 : 1;
        t.onUpdate({ progress: d, velocity: m, direction: p });
      }
      c = d;
    },
    onEnter: u(0, t.onEnter),
    onLeave: u(1, t.onLeave),
    onEnterBack: u(2, t.onEnterBack),
    onLeaveBack: u(3, t.onLeaveBack)
  }), n && a === !1 && n.progress(0), h.start(), e.own(h);
}
function zc(e, t) {
  const n = (i) => i === "labels" ? (r) => jc(r, t?.labelProgresses?.() ?? []) : i;
  if (typeof e != "object" || Array.isArray(e)) return n(e);
  const s = e.ease ? Ue(e.ease) : void 0;
  return {
    snapTo: n(e.snapTo),
    duration: e.duration,
    delay: e.delay,
    ease: s ? s.fn ?? Z(s.easing) : void 0
  };
}
function jc(e, t) {
  return t.reduce((n, s) => Math.abs(s - e) < Math.abs(n - e) ? s : n, t[0] ?? e);
}
function Gc(e, t, n, s) {
  const i = () => t.timeline.getTracks({ property: "x" }).map((r) => r.target).filter((r) => {
    const o = e.elementFor(r);
    return !!o && o !== n && o.contains(n);
  });
  return i().length === 0 && s("gsap-compat: containerAnimation does not move an ancestor of the trigger along x"), {
    range: () => {
      const r = t.scrollTrigger;
      return r || s("gsap-compat: containerAnimation needs its own scrollTrigger (created before this one)"), { start: r?.startOffset ?? 0, end: r?.endOffset ?? 0 };
    },
    progress: () => t.progress(),
    shiftAt: (r) => {
      const o = t.timeline.getStateAtTime(r * t.timeline.duration);
      let a = 0;
      for (const l of i()) {
        const c = o.values.get(l)?.get("x");
        typeof c == "number" && (a += c);
      }
      return a;
    }
  };
}
class Zr {
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
      const s = t();
      return typeof s == "function" && this.items.push({ revert: s }), s;
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
    for (const [t, { name: n, style: s, d: i }] of this.snapshots)
      s === null ? t.removeAttribute("style") : t.setAttribute("style", s), i !== null && t.setAttribute("d", i), this.host.forget(n);
    this.snapshots.clear();
  }
  /** Same as `revert()`: GSAP's name for dropping a context. */
  kill() {
    this.revert();
  }
}
class Jc {
  host;
  scope;
  entries = [];
  listeners = [];
  scheduled = !1;
  constructor(t, n) {
    this.host = t, this.scope = n;
  }
  add(t, n) {
    const s = { conditions: t, setup: n, queries: /* @__PURE__ */ new Map() }, i = typeof t == "string" ? { matches: t } : t;
    if (typeof window < "u" && typeof window.matchMedia == "function")
      for (const [r, o] of Object.entries(i)) {
        const a = window.matchMedia(o);
        s.queries.set(r, a);
        const l = () => this.scheduleUpdate();
        a.addEventListener("change", l), this.listeners.push(() => a.removeEventListener("change", l));
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
    const n = {};
    for (const [o, a] of t.queries) n[o] = a.matches;
    const s = Object.values(n).some(Boolean), i = s ? JSON.stringify(n) : void 0;
    if (i === t.key || (t.context?.revert(), t.context = void 0, t.key = i, !s)) return;
    const r = new Zr(this.host, this.scope);
    r.conditions = n, r.add(() => t.setup(r)), t.context = r;
  }
}
class Zc {
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
    const t = typeof window < "u" ? Math.min(window.devicePixelRatio || 1, 2) : 1, n = Math.round(this.canvas.clientWidth * t), s = Math.round(this.canvas.clientHeight * t);
    n > 0 && s > 0 && (this.canvas.width !== n || this.canvas.height !== s) && (this.canvas.width = n, this.canvas.height = s), this.drawn = -1, this.draw();
  }
  draw() {
    const t = Math.round(this.current), n = this.nearestReady(t);
    if (n === -1 || n === this.drawn || !this.context) return;
    const s = this.images[n], { width: i, height: r } = this.canvas, o = (this.options.fit ?? "cover") === "cover" ? Math.max(i / s.naturalWidth, r / s.naturalHeight) : Math.min(i / s.naturalWidth, r / s.naturalHeight), a = s.naturalWidth * o, l = s.naturalHeight * o;
    this.context.clearRect(0, 0, i, r), this.context.drawImage(s, (i - a) / 2, (r - l) / 2, a, l), this.drawn = n, this.pump();
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
    for (let s = 0; s < this.frames && this.inFlight < t; s++)
      for (const i of s === 0 ? [n] : [n + s, n - s])
        i < 0 || i >= this.frames || this.images[i] || this.inFlight >= t || this.load(i);
  }
  load(t) {
    const n = new Image();
    n.decoding = "async", this.images[t] = n, this.inFlight++;
    const s = (i) => {
      if (!this.destroyed) {
        if (this.inFlight--, i) {
          this.ready[t] = !0, this.loadedCount++, this.options.onProgress?.(this.loadedCount, this.frames);
          const r = Math.round(this.current);
          (Math.abs(t - r) < Math.abs(this.drawn - r) || this.drawn === -1) && (this.drawn = -1, this.draw());
        }
        this.pump();
      }
    };
    n.onload = () => s(!0), n.onerror = () => s(!1), n.src = this.options.url(t);
  }
}
const Qc = { opacity: 0, y: -16 }, th = { opacity: 0, y: 16 };
async function eh(e, t, n, s) {
  const i = t.collector?.scope ?? t.root, r = i.ownerDocument ?? i, o = () => s.shared ? [...i.querySelectorAll(s.shared)] : [];
  if (s.native && typeof r.startViewTransition == "function")
    return nh(r, s, o);
  const a = s.duration ?? 0.35, l = s.ease ?? "power2.inOut", c = (g) => new Promise((y) => {
    g(y) || y();
  }), h = o(), u = h.length ? zn(t, h) : void 0, f = s.from !== void 0 ? yi(t, s.from, s.shared) : [];
  if (f.length && s.leave !== !1) {
    const g = s.leave ?? Qc;
    await c((y) => e.to(f, { ...g, duration: a, ease: l, onComplete: y }));
  }
  await s.update();
  const d = [], m = typeof s.to == "function" ? s.to() : s.to, p = m !== void 0 ? yi(t, m, s.shared) : [];
  if (p.length && s.enter !== !1) {
    const g = s.enter ?? th;
    d.push(c((y) => e.fromTo(p, g, { ...zr(g), duration: a, ease: l, onComplete: y })));
  }
  if (u) {
    const g = o().filter((y) => !h.includes(y));
    g.length && d.push(
      c(
        (y) => jn(t, n, u, {
          targets: g,
          duration: a * 1.4,
          ease: l,
          enter: !1,
          onComplete: y
        })
      )
    );
  }
  await Promise.all(d);
}
function yi(e, t, n) {
  const s = e.resolveTargets(t).map((i) => e.elementFor(i)).filter((i) => !!i);
  return n ? s.flatMap((i) => !i.querySelector(n) && !i.matches(n) ? [i] : [...i.children].filter((r) => !r.matches(n) && !r.querySelector(n))) : s;
}
async function nh(e, t, n) {
  const s = (a, l) => {
    const c = a.dataset?.flipId;
    c && a.style.setProperty("view-transition-name", l ? `tf-${c.replace(/[^\w-]/g, "-")}` : "");
  }, i = n();
  i.forEach((a) => s(a, !0));
  let r = [];
  await e.startViewTransition(async () => {
    i.forEach((a) => s(a, !1)), await t.update(), r = n(), r.forEach((a) => s(a, !0));
  }).finished, r.forEach((a) => s(a, !1));
}
const sh = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (e, t) => ys(e, rl(t))
}, ih = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (e, t) => ys(e, { fn: ol(t) })
}, rh = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (e, t) => ys(e, { fn: al(t) })
}, oh = /* @__PURE__ */ new Set([
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
]), bi = 0.5, ah = "power1.inOut";
function lh(e) {
  return e.keyframes !== void 0 && e.keyframes !== null;
}
function ch(e) {
  const t = e.keyframes, n = {};
  for (const [c, h] of Object.entries(e)) oh.has(c) || (n[c] = h);
  if (Array.isArray(t))
    return t.map((c) => ({
      ...n,
      ...c,
      duration: c.duration ?? e.duration ?? bi
    }));
  const s = Object.entries(t), i = e.duration ?? bi, r = t.easeEach ?? e.easeEach ?? ah;
  if (s.length > 0 && s.every(([c]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(c) || c === "easeEach")) {
    const c = s.filter(([f]) => f !== "easeEach").map(([f, d]) => ({ at: Number.parseFloat(f) / 100, step: d })).sort((f, d) => f.at - d.at), h = [];
    let u = 0;
    for (const { at: f, step: d } of c) {
      const m = Math.max(0, f - u);
      h.push({ ...n, ease: r, ...d, duration: m * i }), u = f;
    }
    return h;
  }
  const o = s.filter(([c, h]) => c !== "easeEach" && Array.isArray(h)), a = Math.max(0, ...o.map(([, c]) => c.length)), l = [];
  for (let c = 0; c < a; c++) {
    const h = { ...n, ease: r, duration: i / a };
    for (const [u, f] of o)
      c < f.length && (h[u] = f[c]);
    l.push(h);
  }
  return l;
}
function wi(e, t, n, s = {}) {
  const i = t.collector?.scope ?? t.root, r = typeof s.scroller == "string" ? i.querySelector(s.scroller) : s.scroller ?? null, o = {
    x: r ? r.scrollLeft : window.scrollX,
    y: r ? r.scrollTop : window.scrollY
  }, a = {
    x: r ? r.scrollWidth - r.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: r ? r.scrollHeight - r.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, l = (b, w) => {
    if (w === void 0) return o[b];
    if (typeof w == "number") return w;
    if (w === "max") return a[b];
    const S = typeof w == "string" ? i.querySelector(w) : w;
    if (!S) return o[b];
    const k = S.getBoundingClientRect(), x = r?.getBoundingClientRect(), v = (b === "x" ? s.offsetX : s.offsetY) ?? s.offset ?? 0;
    return b === "x" ? k.left - (x?.left ?? 0) + o.x - v : k.top - (x?.top ?? 0) + o.y - v;
  }, c = typeof n == "object" && n !== null && !("nodeType" in n) ? { x: l("x", n.x), y: l("y", n.y) } : { x: o.x, y: l("y", n) }, h = { x: Math.max(0, Math.min(a.x, c.x)), y: Math.max(0, Math.min(a.y, c.y)) }, u = { ...o }, f = () => {
    r ? (r.scrollLeft = u.x, r.scrollTop = u.y) : window.scrollTo({ left: u.x, top: u.y, behavior: "instant" });
  }, d = ["wheel", "touchstart", "keydown"], m = r ?? window, p = () => {
    y.kill(), g();
  }, g = () => {
    for (const b of d) m.removeEventListener(b, p);
  }, y = e.to(u, {
    x: h.x,
    y: h.y,
    duration: s.duration ?? 1,
    ease: s.ease ?? "power2.inOut",
    onStart: s.onStart,
    onUpdate: () => {
      f(), s.onUpdate?.();
    },
    onComplete: () => {
      g(), s.onComplete?.();
    }
  });
  if (s.autoKill !== !1) for (const b of d) m.addEventListener(b, p, { passive: !0 });
  return y;
}
function hh(e, t, n) {
  const s = e.collector?.scope ?? e.root, i = typeof t == "string" ? [...s.querySelectorAll(t)] : "nodeType" in t ? [t] : Array.from(t), { interval: r = 0.1, batchMax: o, onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h, ...u } = n, f = { onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h }, d = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, m = {}, p = (y) => {
    m[y] !== void 0 && clearTimeout(m[y]), m[y] = void 0;
    const b = d[y].splice(0);
    b.length > 0 && f[y]?.(b);
  }, g = (y, b) => {
    if (f[y]) {
      if (d[y].push(b), o !== void 0 && d[y].length >= o) return p(y);
      m[y] === void 0 && (m[y] = setTimeout(() => p(y), r * 1e3));
    }
  };
  return i.map(
    (y) => vs(e, {
      ...u,
      trigger: y,
      onEnter: () => g("onEnter", y),
      onLeave: () => g("onLeave", y),
      onEnterBack: () => g("onEnterBack", y),
      onLeaveBack: () => g("onLeaveBack", y)
    })
  ).filter((y) => y !== void 0);
}
class ut {
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
    const s = { ...n, onWarning: n.onWarning ?? t.onWarning };
    if (this.options = s, this.compat = new Dt({
      ...s,
      startValue: (i, r) => {
        const o = t.objectFor(i);
        if (o) return ph(o[r]);
        const a = t.appliedValue(i, r);
        if (a !== void 0) return a;
        if (r === "d") return qr(t.elementFor(i)) ?? void 0;
        if (r === "text") return t.elementFor(i)?.textContent ?? void 0;
        if (r === "strokeDasharray" || r === "strokeDashoffset") {
          const l = Si(t.elementFor(i));
          if (l !== void 0) return r === "strokeDasharray" ? [l, l] : 0;
        }
      },
      startVelocity: (i, r) => t.velocityOf(i, r),
      layoutColumns: (i) => ki(i.map((r) => t.elementFor(r))),
      random: () => t.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, t.collector?.track(this), t.liveTimelines.add(this), this.autoplayPending = !s.paused && !s.scrollTrigger, s.scrollTrigger) {
      const i = s.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = vs(t, i, this, this.firstElement, (r) => s.onWarning?.(r)));
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
  to(t, n, s) {
    return lh(n) ? this.record(() => this.keyframed(t, n, s)) : this.record(() => this.tween(t, [n], s, ([i], r, o) => this.compat.to(r, i, o)));
  }
  from(t, n, s) {
    return this.record(() => this.tween(t, [n], s, ([i], r, o) => this.compat.from(r, i, o)));
  }
  fromTo(t, n, s, i) {
    return this.record(
      () => this.tween(t, [n, s], i, ([r, o], a, l) => this.compat.fromTo(a, r, o, l))
    );
  }
  set(t, n, s) {
    return this.record(() => this.tween(t, [n], s, ([i], r, o) => this.compat.set(r, i, o)));
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
  call(t, n = [], s) {
    return this.record(() => {
      const i = this.compat.addEvent(s);
      this.events.push({ time: i, run: () => t(...n) });
    });
  }
  /** Pause exactly at `position` when the playhead reaches it, then run `callback`. `play()` continues. */
  addPause(t, n, s = []) {
    return this.record(() => {
      const i = this.compat.addEvent(t);
      this.events.push({ time: i, pause: !0, run: () => n?.(...s) });
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
  tweenFromTo(t, n, s = {}) {
    this.pause(), this.seek(t);
    const i = this.timeline.currentTime, r = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(n))), o = { time: i }, a = s.duration ?? Math.abs(r - i) / 1e3 / (this.timeScale() || 1), l = new ut(this.stage, { onStart: s.onStart, onComplete: s.onComplete });
    return l.to(o, {
      time: r,
      duration: a,
      ease: s.ease ?? "none",
      onUpdate: () => {
        this.moveTo(o.time), s.onUpdate?.();
      }
    }), l;
  }
  // --- playback -----------------------------------------------------------
  play() {
    this.autoplayPending = !1, this.started || (this.started = !0, this.options.onStart?.());
    const t = this.timeline.playbackState === "playing", n = this.timeline.playbackState === "paused";
    if (this.timeline.play(), !t) {
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
    for (const s of t)
      for (const i of n ?? [void 0])
        this.timeline.removeTracks({ target: s, ...i !== void 0 && { property: i } });
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
    const s = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: t >= n.time ? "forward" : "reverse" }, i = { ...n, iteration: s.iteration, direction: s.direction };
    this.playhead = { ...this.readPlayhead() }, this.waitingToWrap = !1, this.runCrossings(i, s, !1), this.options.onUpdate?.();
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
    const s = this.playhead, i = this.readPlayhead();
    this.playhead = i;
    const r = this.options.yoyo === !0;
    n && !r && i.iteration > s.iteration && (this.playhead = { time: 0, iteration: i.iteration, direction: "forward", fresh: !0 }, this.waitingToWrap = !0);
    const o = this.runCrossings(s, i, n);
    if (this.options.onUpdate?.(), this.finishedThisFrame && !o) {
      this.finishedThisFrame = !1;
      const a = t.currentTime === 0 && t.direction === "reverse";
      !this.scrollDriver && !r && this.stage.liveTimelines.delete(this), a && this.backwards ? this.options.onReverseComplete?.() : this.options.onComplete?.();
    }
    this.finishedThisFrame = !1;
  }
  /** Fire events and repeats between two playheads. Returns true if a pause stopped it. */
  runCrossings(t, n, s) {
    if (this.events.length === 0 && this.ranges.length === 0 && !this.options.onRepeat && !this.options.repeatRefresh) return !1;
    const i = this.events, { crossings: r, passes: o } = Tr(
      i.map((a) => a.time),
      t,
      n,
      { duration: this.timeline.duration, alternate: this.options.yoyo === !0, holding: s }
    );
    for (const a of r) {
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
      o.some(([c, h]) => c !== h && Math.max(c, h) >= a.start && Math.min(c, h) <= a.end) && a.run();
    return !1;
  }
  /**
   * Compile one tween call. A track has one start value and one set of values,
   * but some tweens differ per element — each element's own shape, text or stroke
   * length, each plain object's own current values, or function values called per
   * element — so those build one tween per element at the same position, with any
   * stagger turned into delays. `varsList` is `[vars]`, or `[fromVars, toVars]`.
   */
  tween(t, n, s, i) {
    const r = this.resolve(t);
    if (!r) return;
    const { onStart: o, onUpdate: a, onComplete: l } = n[n.length - 1];
    if (o || a || l) {
      let c = 1 / 0, h = -1 / 0;
      const u = (f, d, m) => {
        i(f, d, m), c = Math.min(c, this.compat.lastStart), h = Math.max(h, this.compat.lastEnd);
      };
      if (this.buildTween(r, n, s, u), c === 1 / 0) return;
      o && this.events.push({ time: c, direction: "forward", run: o }), a && this.ranges.push({ start: c, end: h, run: a }), l && this.events.push({ time: h, direction: "forward", run: l });
      return;
    }
    this.buildTween(r, n, s, i);
  }
  /**
   * A tween with `keyframes`: its segments one after another, from the tween's
   * position and delay. With `stagger`, each target plays the whole sequence,
   * offset like any stagger. Callbacks belong to the sequence as a whole.
   */
  keyframed(t, n, s) {
    const i = this.resolve(t);
    if (!i) return;
    const r = ch(n);
    if (r.length === 0) return;
    const o = i.length > 1 ? Vn(n.stagger, this.staggerContext(i)) : void 0, a = i.map((g) => this.targetFor(g)).filter((g) => g !== void 0), l = o ? a.map((g) => [g]) : [a], c = o ? Dn(i.length, o).map((g) => g / 1e3) : [0], h = this.compat.timeOf(s) / 1e3 + ze(n.delay, 0) / 1e3;
    let u = 1 / 0, f = -1 / 0;
    if (l.forEach((g, y) => {
      r.forEach((b, w) => {
        const S = w === 0 ? h + c[y] : ">";
        this.tween(g, [b], S, ([k], x, v) => this.compat.to(x, k, v)), u = Math.min(u, this.compat.lastStart), f = Math.max(f, this.compat.lastEnd);
      });
    }), u === 1 / 0) return;
    const { onStart: d, onUpdate: m, onComplete: p } = n;
    d && this.events.push({ time: u, direction: "forward", run: d }), m && this.ranges.push({ start: u, end: f, run: m }), p && this.events.push({ time: f, direction: "forward", run: p });
  }
  staggerContext(t) {
    return {
      count: t.length,
      columnsFromLayout: () => ki(t.map((n) => this.stage.elementFor(n))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(t, n, s, i) {
    const r = t.map((f) => this.targetFor(f));
    if (!(t.length > 1 && (n.some(dh) || t.some((f) => this.stage.objectFor(f) !== void 0)))) {
      const f = this.targetFor(t[0]);
      i(n.map((d) => this.prepare(vi(d, 0, f, this.stage.utils, r), t)), t, s);
      return;
    }
    const a = n.length - 1, { stagger: l, ...c } = n[a], h = Vn(l, this.staggerContext(t)), u = h ? Dn(t.length, h).map((f) => f / 1e3) : t.map(() => 0);
    t.forEach((f, d) => {
      const m = d === 0 ? ze(c.delay, 0) / 1e3 + u[0] : 0, p = d === 0 ? 0 : u[d] - u[d - 1], g = d === 0 ? s : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, b = n.map((w, S) => S === a ? { ...c, delay: m } : w).map((w) => this.prepare(vi(w, d, this.targetFor(f), this.stage.utils, r), [f]));
      i(b, [f], g);
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
    const s = (o) => this.options.onWarning?.(o), i = (o) => this.stage.query(o);
    let r = t;
    if (t.motionPath !== void 0) {
      const o = pc(t.motionPath, {
        query: i,
        targets: n.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: s
      });
      r = { ...r, motionPath: o };
    }
    if (t.morphSVG !== void 0) {
      const o = mc(t.morphSVG, i, s), { morphSVG: a, ...l } = r;
      r = o ? { ...r, morphSVG: o } : l;
    }
    if (t.drawSVG !== void 0) {
      const o = Si(this.stage.elementFor(n[0]));
      if (o === void 0) {
        s("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...l } = r;
        r = l;
      } else
        r = Wl(r, o);
    }
    return r;
  }
  resolve(t) {
    const n = this.stage.resolveTargets(t);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${mh(t)}`);
      return;
    }
    return this.firstElement ??= n.map((s) => this.stage.elementFor(s)).find((s) => s !== void 0), n;
  }
}
function uh(e = new hc()) {
  const t = (r) => {
    const { config: o } = De(r);
    return new ut(e, {
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
    const { onStart: o, onUpdate: a, onComplete: l, onRepeat: c, onReverseComplete: h, repeatRefresh: u, ...f } = r;
    return f;
  }, s = (r) => (r && e.collector?.track(r), r), i = {
    stage: e,
    ticker: e.ticker,
    utils: e.utils,
    getProperty: (r, o) => {
      const [a] = e.resolveTargets(r);
      if (a === void 0) return;
      const l = e.objectFor(a);
      return l ? l[o] : e.appliedValue(a, o) ?? Nr(o);
    },
    scrollTrigger: (r) => s(vs(e, r)),
    scrollBatch: (r, o) => hh(e, r, o).map((a) => s(a)),
    scrollTo: (r, o) => wi(i, e, r, o),
    refreshScroll: () => {
      dn.refreshAll(), gi.refreshAll();
    },
    smoothScroll: (r = {}) => {
      const o = typeof r.scroller == "string" ? (e.collector?.scope ?? e.root).querySelector(r.scroller) : r.scroller;
      return s(new gi({ ...r, scroller: o }).start());
    },
    context: (r, o) => {
      const a = new Zr(e, o);
      return r && a.add(() => r(a)), a;
    },
    matchMedia: (r) => new Jc(e, r),
    customEase: sh.create,
    customBounce: ih.create,
    customWiggle: rh.create,
    pageTransition: (r) => eh(i, e, (o) => new ut(e, o), r),
    imageSequence: (r, o) => {
      const a = typeof r == "string" ? (e.collector?.scope ?? e.root).querySelector(r) : r;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(r)}`);
      return s(new Zc(a, o));
    },
    quickTo: (r, o, a = {}) => {
      const l = new ut(e, { paused: !0 }), [c] = e.resolveTargets(r);
      return Object.assign((u) => {
        if (!c) return;
        const f = a.spring !== void 0 ? e.velocityOf(c, o) ?? 0 : 0;
        l.compat.reset(), l.compat.to(c, {
          [o]: u,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: fh(a.spring, o, f) }
        }), l.timeline.stop(), l.timeline.play(), e.activate(l.timeline);
      }, { tween: l, kill: () => l.kill() });
    },
    timeline: (r) => new ut(e, r),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (r, o) => {
      if (o.scrollTo !== void 0) {
        const { scrollTo: a, ...l } = o, c = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, h = typeof r != "string" && r !== window && r.nodeType === 1;
        return wi(i, e, a, {
          ...l,
          offsetX: c.offsetX,
          offsetY: c.offsetY,
          scroller: h ? r : void 0
        });
      }
      return t(o).to(r, n(o));
    },
    from: (r, o) => t(o).from(r, n(o)),
    fromTo: (r, o, a) => t(a).fromTo(r, o, n(a)),
    set: (r, o) => t(o).set(r, n(o)),
    delayedCall: (r, o, a) => new ut(e).call(o, a, r),
    killTweensOf: (r, o) => {
      const a = e.resolveTargets(r), l = typeof o == "string" ? o.split(",").map((c) => c.trim()).filter(Boolean) : o;
      for (const c of [...e.liveTimelines]) c.killTweensOf(a, l);
    },
    convertToPath: (r) => yc(r, e.root),
    splitText: (r, o) => {
      const a = e.collector?.scope ?? e.root, l = typeof r == "string" ? Array.from(a.querySelectorAll(r)) : "nodeType" in r ? [r] : Array.from(r);
      return s(Ac(l, o));
    },
    draggable: (r, o) => s(Mc(i, e, r, o)),
    getFlipState: (r) => zn(e, r),
    flipFrom: (r, o) => jn(e, (a) => new ut(e, a), r, o),
    flip: (r, o, a) => {
      const l = zn(e, r);
      return o(), jn(e, (c) => new ut(e, c), l, { targets: r, ...a });
    }
  };
  return i;
}
const et = /* @__PURE__ */ uh();
function fh(e, t, n) {
  return e === !0 ? { velocity: { [t]: n } } : typeof e == "string" ? { preset: e, velocity: { [t]: n } } : { ...e, velocity: { [t]: n } };
}
function dh(e) {
  return e.morphSVG !== void 0 || e.drawSVG !== void 0 || e.text !== void 0 || e.scrambleText !== void 0 || Qr(e);
}
function Qr(e) {
  return Object.entries(e).some(([t, n]) => (typeof n == "function" || Wr(n)) && !bs.has(t));
}
function vi(e, t, n, s, i) {
  if (!Qr(e)) return e;
  const r = {};
  for (const [o, a] of Object.entries(e))
    bs.has(o) ? r[o] = a : typeof a == "function" ? r[o] = a(t, n, i) : Wr(a) ? r[o] = s.resolveRandomString(a) : r[o] = a;
  return r;
}
function ki(e) {
  const t = e.map((s) => s?.getBoundingClientRect().top);
  if (t[0] === void 0) return e.length;
  let n = 0;
  for (const s of t) {
    if (s === void 0 || Math.abs(s - t[0]) > 1) break;
    n++;
  }
  return Math.max(1, n);
}
function Si(e) {
  const t = e;
  if (typeof t?.getTotalLength == "function")
    return t.getTotalLength();
}
function ph(e) {
  if (typeof e == "number" || typeof e == "string" || Array.isArray(e) && e.every((t) => typeof t == "number")) return e;
}
function mh(e) {
  return typeof e == "string" ? `"${e}"` : String(e);
}
class Mi {
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
    const s = this.targetTime(t);
    n ? (this.media.paused && this.safePlay(), Math.abs(this.media.currentTime - s) > this.driftTolerance && (this.media.currentTime = s)) : (this.media.paused || this.media.pause(), this.media.currentTime !== s && (this.media.currentTime = s));
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
function gh(e, t, n, s, i) {
  const r = n - i;
  if (r < 0) {
    t.paused || t.pause(), t.currentTime = 0;
    return;
  }
  e.update(r, s);
}
class ks {
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
      const s = document.querySelector(t);
      if (!s)
        throw new Error(`Container not found: ${t}`);
      this.container = s;
    } else
      this.container = t;
    this.options = n, this.adapter = new Et();
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
      const s = await fetch(t);
      if (!s.ok)
        throw new Error(`Failed to load animation: ${s.statusText}`);
      n = await s.json();
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
    this.options.speed !== void 0 && (n.speed = this.options.speed), this.options.loop !== void 0 && (n.loop = this.options.loop), this.options.alternate !== void 0 && (n.alternate = this.options.alternate), this.timeline = ue({ ...t, config: n }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
  }
  // --- scenarios: the reader chooses which timeline plays --------------------
  /**
   * Load several timelines for the same markup, and show one. The reader switches
   * with `setScenario`; the embed's controls and `data-tinyfly-choose` hotspots
   * call it.
   */
  async loadScenarios(t, n = {}) {
    if (t.length === 0) throw new Error("tinyfly: loadScenarios needs at least one scenario");
    const s = /* @__PURE__ */ new Set();
    for (const r of t) {
      if (s.has(r.id)) throw new Error(`tinyfly: scenario id "${r.id}" is used more than once`);
      s.add(r.id);
    }
    const i = n.initial === void 0 ? t[0] : t.find((r) => r.id === n.initial);
    if (!i) throw new Error(`tinyfly: there is no scenario "${n.initial}"`);
    this.scenarioList = [...t], this.scenarioId = i.id, await this.loadSource(i.timeline);
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
    const n = this.scenarioList.find((a) => a.id === t);
    if (!n || !this.timeline) return !1;
    if (t === this.scenarioId) return !0;
    const s = this.isPlaying, i = this.currentTime >= this.duration - 0.5, r = this.currentMarker?.id;
    this.stopAnimationLoop(), this.stepping = !1, this.pausedByVisibility = !1, this.restoreAuthored(), this.scenarioId = t, this.useDefinition(n.timeline), this.lastMarkerId = null;
    let o = 0;
    return this.reducedMotion || i ? o = this.duration : r !== void 0 && (o = this.markers.find((a) => a.id === r)?.time ?? 0), this.seek(o), s && !this.reducedMotion ? (this.stepping = this.options.stepMode === !0, this.startPlaying()) : this.notify(), !0;
  }
  /** Remember how an element was authored, the first time it becomes a target. */
  rememberAuthored(t) {
    if (this.authored.has(t)) return;
    const n = { style: t.getAttribute("style") };
    t.children.length === 0 && (n.text = t.textContent ?? "");
    const s = t.tagName.toLowerCase() === "path" ? t : t.querySelector("path");
    s && (n.path = { element: s, d: s.getAttribute("d") }), this.authored.set(t, n);
  }
  /** Put every target back the way it was authored. */
  restoreAuthored() {
    for (const [t, n] of this.authored) {
      n.style === null ? t.removeAttribute("style") : t.setAttribute("style", n.style), n.text !== void 0 && t.textContent !== n.text && (t.textContent = n.text), n.path && (n.path.d === null ? n.path.element.removeAttribute("d") : n.path.element.setAttribute("d", n.path.d));
      const s = t.dataset;
      s && delete s.shineBase;
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
    for (const s of this.markers)
      if (s.time <= t + 0.5) n = s;
      else break;
    return n;
  }
  /**
   * Caption for a marker (default: the current one) in a language (default: the
   * container's closest `lang`, then the document's), falling back to the
   * marker's own label.
   */
  caption(t, n) {
    const s = t ? this.markers.find((o) => o.id === t) : this.currentMarker;
    if (!s) return;
    const i = n ?? this.language(), r = (o) => o?.[i]?.[s.id] ?? o?.[i.split("-")[0]]?.[s.id];
    return r(this.options.captions) ?? r(this.timeline?.captions) ?? s.label;
  }
  /** Move to the next marker: animated, or a jump under reduced motion. At the last marker, to the end. */
  next() {
    if (!this.timeline) return;
    const t = this.currentTime, n = this.markers.find((s) => s.time > t + 0.5);
    if (this.reducedMotion) {
      this.seek(n ? n.time : this.duration);
      return;
    }
    t >= this.duration - 0.5 || (this.stepping = n !== void 0, this.startPlaying());
  }
  /** Jump back to the previous marker (or the start). */
  prev() {
    if (!this.timeline) return;
    const t = this.currentTime, n = [...this.markers].reverse().find((s) => s.time < t - 0.5);
    this.pause(), this.seek(n ? n.time : 0);
  }
  /** Jump to a marker by id, paused there. */
  goToMarker(t) {
    const n = this.markers.find((s) => s.id === t);
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
          for (const s of n) this.onScreen = s.isIntersecting;
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
      const s = n, i = Number(s.getAttribute("data-tinyfly-start") ?? "0") || 0, r = s.getAttribute("data-volume");
      r !== null && (s.volume = Math.max(0, Math.min(1, Number(r) || 0))), this.mediaTargets.push({ el: s, startTime: i, sync: new Mi(s) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(t, n) {
    for (const s of this.mediaTargets)
      gh(s.sync, s.el, t, n, s.startTime);
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
      const s = this.container.querySelector(n);
      s && (this.rememberAuthored(s), this.targets[t] = s, this.adapter.registerTarget(t, s));
    } else
      this.rememberAuthored(n), this.targets[t] = n, this.adapter.registerTarget(t, n);
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
    const t = this.options.symbols;
    if (!t || t.length === 0) return;
    const n = new Map(t.map((s) => [s.id, s]));
    this.container.querySelectorAll("[data-tinyfly-symbol]").forEach((s) => {
      const i = s.getAttribute("data-tinyfly-symbol");
      if (!i) return;
      const r = n.get(i);
      if (!r || !r.timeline.tracks?.length) return;
      const o = new Et();
      s.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const l = a.getAttribute("data-tinyfly");
        l && o.registerTarget(l, a);
      }), this.symbolInstances.push({ adapter: o, timeline: ue(r.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(t, n) {
    this.mediaSync = new Mi(t, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
      const s = n - (this.lastTime ?? n);
      this.lastTime = n;
      const i = this.playhead;
      this.timeline.tick(s), this.stopAtMarker(i), this.applyState();
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
    const n = this.timeline, s = { time: n.currentTime, iteration: n.loopIteration, direction: n.direction };
    this.playhead = s;
    const i = this.markers;
    if (i.length === 0) return;
    const { crossings: r } = Tr(
      i.map((o) => o.time),
      t,
      s,
      { duration: n.duration, alternate: n.config.alternate === !0, holding: n.repeatDelayRemaining > 0 }
    );
    for (const o of r) {
      if (o.kind !== "event") continue;
      const a = i[o.index];
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
    const t = this.timeline.currentTime;
    this.adapter.applyState(this.timeline.getStateAtTime(t)), this.announceMarker(), this.notify();
    for (const n of this.symbolInstances) {
      const s = n.timeline.duration;
      n.adapter.applyState(n.timeline.getStateAtTime(s > 0 ? t % s : t));
    }
  }
}
async function O0(e, t, n = {}) {
  const s = new ks(e, { ...n, autoplay: !0 });
  return await s.load(t), s;
}
function L0(e, t = {}) {
  return new ks(e, t);
}
const yh = {
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
}, xi = "tinyfly-controls-style", bh = `
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
let wh = 0;
function vh(e) {
  if (e.getElementById(xi)) return;
  const t = e.createElement("style");
  t.id = xi, t.textContent = bh, e.head.appendChild(t);
}
function kh(e, t, n = {}) {
  const s = t.ownerDocument;
  vh(s);
  const i = { ...yh, ...n.labels }, r = n.speeds ?? [0.5, 1, 2], o = () => e.markers.length > 0, a = () => e.markers.some((C) => C.label !== void 0 || e.caption(C.id) !== void 0), l = s.createElement("div");
  l.className = "tf-ctl";
  const c = s.createElement("div");
  c.className = "tf-ctl-bar", c.setAttribute("role", "group");
  const h = (C, R, B, $ = "") => {
    const O = s.createElement("button");
    return O.type = "button", O.className = `tf-ctl-btn ${$}`.trim(), O.setAttribute("aria-label", C), O.title = C, O.textContent = R, O.addEventListener("click", B), O;
  }, u = h(i.restart, "⟲", () => {
    e.pause(), e.seek(0);
  }), f = h(i.prev, "|◀", () => e.prev()), d = h(i.play, "▶", () => e.isPlaying ? e.pause() : p(), "tf-ctl-primary"), m = h(i.next, "▶|", () => e.next()), p = () => {
    e.currentTime >= e.duration - 0.5 && e.seek(0), e.play();
  }, g = s.createElement("input");
  g.type = "range", g.className = "tf-ctl-scrub", g.min = "0", g.max = "1000", g.step = "1", g.setAttribute("aria-label", i.scrub), g.addEventListener("input", () => {
    e.pause(), e.seek(Number(g.value) / 1e3 * e.duration);
  });
  const y = s.createElement("span");
  y.className = "tf-ctl-step";
  const b = s.createElement("select");
  b.className = "tf-ctl-speed", b.setAttribute("aria-label", i.speed);
  for (const C of r) {
    const R = s.createElement("option");
    R.value = String(C), R.textContent = `${C}×`, C === 1 && (R.selected = !0), b.appendChild(R);
  }
  b.addEventListener("change", () => e.setSpeed(Number(b.value))), c.append(u, f, d, m, g, y), r.length > 0 && c.append(b), l.append(c);
  const w = n.fullscreen ? Th(t, s, i) : void 0;
  w && c.append(w.button);
  const S = s.createElement("p");
  S.className = "tf-ctl-caption", S.setAttribute("aria-live", "polite"), n.captions !== !1 && l.append(S);
  const k = s.createElement("div");
  k.className = "tf-ctl-question", k.hidden = !0;
  const x = s.createElement("span"), v = h(i.reveal, i.reveal, () => e.play(), "tf-ctl-primary");
  k.append(x, v), l.append(k);
  const E = Sh(e, s, i.scenario, n.scenarioControl ?? "buttons");
  E && l.append(E.element);
  const M = n.mount;
  M ? M.appendChild(l) : t.insertAdjacentElement("afterend", l);
  const A = () => {
    const C = e.isPlaying;
    d.textContent = C ? "❚❚" : "▶", d.setAttribute("aria-label", C ? i.pause : i.play), d.title = C ? i.pause : i.play;
    const R = e.duration;
    s.activeElement !== g && (g.value = String(R > 0 ? Math.round(e.currentTime / R * 1e3) : 0));
    const B = e.markers;
    if (f.hidden = m.hidden = y.hidden = B.length === 0, B.length > 0) {
      const $ = e.currentMarker, O = $ ? B.indexOf($) + 1 : 0;
      y.textContent = i.stepFormat.replace("{index}", String(O)).replace("{total}", String(B.length)), y.setAttribute("aria-label", `${i.step} ${O} ${i.of} ${B.length}`), f.disabled = e.currentTime <= 0.5, m.disabled = e.currentTime >= R - 0.5;
      const H = e.caption() ?? "";
      S.textContent !== H && (S.textContent = H), S.hidden = !a();
      const L = !C && $?.question !== void 0 && Math.abs(e.currentTime - $.time) < 1;
      k.hidden = !L, L && x.textContent !== $.question && (x.textContent = $.question);
    } else
      k.hidden = !0, S.hidden = !0;
    E?.update();
  }, T = e.subscribe(A);
  A();
  const P = n.keyboardScope ?? t;
  !P.hasAttribute("tabindex") && P.tabIndex < 0 && (P.tabIndex = 0);
  const _ = /* @__PURE__ */ new WeakSet(), I = (C) => {
    if (_.has(C) || (_.add(C), C.defaultPrevented || C.altKey || C.ctrlKey || C.metaKey)) return;
    const R = C.target;
    if (!(R.tagName === "INPUT" || R.tagName === "SELECT") && !(C.key === " " && R.tagName === "BUTTON"))
      switch (C.key) {
        case " ":
          C.preventDefault(), e.isPlaying ? e.pause() : p();
          break;
        case "ArrowRight":
          if (!o()) return;
          C.preventDefault(), e.next();
          break;
        case "ArrowLeft":
          if (!o()) return;
          C.preventDefault(), e.prev();
          break;
        case "Home":
          C.preventDefault(), e.pause(), e.seek(0);
          break;
        case "f":
        case "F":
          if (!w) return;
          C.preventDefault(), w.active ? w.exit() : w.enter();
          break;
      }
  };
  return P.addEventListener("keydown", I), l.addEventListener("keydown", I), {
    element: l,
    fullscreen: w && {
      get active() {
        return w.active;
      },
      enter: w.enter,
      exit: w.exit
    },
    destroy() {
      w?.destroy(), T(), P.removeEventListener("keydown", I), l.removeEventListener("keydown", I), l.remove();
    }
  };
}
function Sh(e, t, n, s) {
  const i = e.scenarios;
  if (i.length < 2) return;
  if (s === "slider") {
    const h = t.createElement("div");
    h.className = "tf-ctl-choice-slider";
    const u = t.createElement("span");
    u.textContent = n, u.setAttribute("aria-hidden", "true");
    const f = t.createElement("input");
    f.type = "range", f.min = "0", f.max = String(i.length - 1), f.step = "1", f.setAttribute("aria-label", n);
    const d = t.createElement("output");
    return d.setAttribute("aria-hidden", "true"), f.addEventListener("input", () => {
      const p = i[Number(f.value)];
      p && e.setScenario(p.id);
    }), h.append(u, f, d), { element: h, update: () => {
      const p = Math.max(0, i.findIndex((y) => y.id === e.scenario));
      t.activeElement !== f && (f.value = String(p));
      const g = i[p].label;
      d.textContent !== g && (d.textContent = g), f.setAttribute("aria-valuetext", g);
    } };
  }
  const r = t.createElement("fieldset");
  r.className = "tf-ctl-choices";
  const o = t.createElement("legend");
  o.textContent = n, r.append(o);
  const a = `tf-ctl-scenario-${++wh}`, l = i.map((h) => {
    const u = t.createElement("label");
    u.className = "tf-ctl-choice";
    const f = t.createElement("input");
    f.type = "radio", f.name = a, f.value = h.id, f.addEventListener("change", () => {
      f.checked && e.setScenario(h.id);
    });
    const d = t.createElement("span");
    return d.textContent = h.label, u.append(f, d), r.append(u), f;
  });
  return { element: r, update: () => {
    for (const h of l) {
      const u = h.value === e.scenario;
      h.checked !== u && (h.checked = u);
    }
  } };
}
const Mh = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', xh = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function Th(e, t, n) {
  const s = t, i = e, r = t.createElement("button");
  r.type = "button", r.className = "tf-ctl-btn tf-ctl-fullscreen";
  let o, a = "";
  const l = () => {
    const p = o !== void 0;
    r.innerHTML = p ? xh : Mh;
    const g = p ? n.exitFullscreen : n.fullscreen;
    r.setAttribute("aria-label", g), r.title = g, r.setAttribute("aria-pressed", String(p)), e.classList.toggle("tf-fullscreen", p), e.classList.toggle("tf-fullscreen-overlay", o === "overlay");
  }, c = () => s.fullscreenElement ?? s.webkitFullscreenElement ?? null, h = () => {
    c() === e ? o = "native" : o === "native" && (o = void 0), l();
  }, u = (p) => {
    p.key === "Escape" && m();
  }, f = () => {
    o = "overlay", a = t.documentElement.style.overflow, t.documentElement.style.overflow = "hidden", t.addEventListener("keydown", u), l();
  };
  async function d() {
    if (o) return;
    const p = i.requestFullscreen?.bind(i) ?? i.webkitRequestFullscreen?.bind(i), g = s.fullscreenEnabled ?? s.webkitFullscreenEnabled ?? !1;
    if (p && g)
      try {
        if (await p(), c() === e) {
          o = "native", l();
          return;
        }
      } catch {
      }
    f();
  }
  async function m() {
    if (o === "overlay")
      t.removeEventListener("keydown", u), t.documentElement.style.overflow = a, o = void 0, l();
    else if (o === "native") {
      o = void 0, l();
      const p = s.exitFullscreen?.bind(s) ?? s.webkitExitFullscreen?.bind(s);
      c() === e && p && await p();
    }
  }
  return r.addEventListener("click", () => {
    o ? m() : d();
  }), t.addEventListener("fullscreenchange", h), t.addEventListener("webkitfullscreenchange", h), l(), {
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
const Ti = "tinyfly-choices-style", Eh = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function Ah(e) {
  if (e.getElementById(Ti)) return;
  const t = e.createElement("style");
  t.id = Ti, t.textContent = Eh, e.head.appendChild(t);
}
function Ph(e, t) {
  const n = Array.from(t.querySelectorAll("[data-tinyfly-choose]"));
  if (n.length === 0) return () => {
  };
  Ah(t.ownerDocument);
  const s = [], i = [];
  for (const a of n) {
    const l = a.getAttribute("data-tinyfly-choose") ?? "", c = [], h = (m, p) => {
      a.hasAttribute(m) || (a.setAttribute(m, p), c.push(m));
    };
    h("role", "button"), h("tabindex", "0");
    const u = e.scenarios.find((m) => m.id === l)?.label;
    u !== void 0 && h("aria-label", u), a.setAttribute("aria-pressed", "false"), c.push("aria-pressed"), s.push({ element: a, attributes: c });
    const f = () => e.setScenario(l), d = (m) => {
      const p = m.key;
      p !== "Enter" && p !== " " || (m.preventDefault(), f());
    };
    a.addEventListener("click", f), a.addEventListener("keydown", d), i.push(() => {
      a.removeEventListener("click", f), a.removeEventListener("keydown", d);
    });
  }
  const r = () => {
    for (const { element: a } of s)
      a.setAttribute("aria-pressed", String(a.getAttribute("data-tinyfly-choose") === e.scenario));
  }, o = e.subscribe(r);
  return r(), () => {
    o();
    for (const a of i) a();
    for (const { element: a, attributes: l } of s) for (const c of l) a.removeAttribute(c);
  };
}
const Ge = /* @__PURE__ */ new WeakMap(), Gn = /* @__PURE__ */ new WeakMap();
let _h = 0;
function ie(e, t, n) {
  if (e)
    try {
      return JSON.parse(e);
    } catch (s) {
      console.warn(`tinyfly: invalid ${t} JSON on`, n, s);
      return;
    }
}
async function Ih(e, t = {}) {
  const n = Ge.get(e);
  if (n) return n;
  const s = Array.from(e.querySelectorAll("script[data-tinyfly-timeline]")), i = s[0], r = e.getAttribute("data-src"), o = Hh(e.getAttribute("data-markers")), a = s.length > 1 || i?.hasAttribute("data-scenario") ? Ch(s, o, e) : void 0;
  if (a && a.length === 0) return;
  let l = i && !a ? ie(i.textContent, "timeline", e) : void 0;
  if (!l && r && o) {
    const d = await fetch(r);
    d.ok && (l = await d.json());
  }
  if (l && o && (l = to(l, o)), !l && !r && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', e);
    return;
  }
  const c = ie(e.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", e), h = {
    playWhenVisible: !0,
    ...t.player,
    ...c && { captions: c },
    ...ie(e.getAttribute("data-options"), "data-options", e)
  };
  Rh(e);
  const u = new ks(e, h), f = { element: e, player: u };
  if (Ge.set(e, f), e.setAttribute("data-tinyfly-mounted", ""), a) {
    const d = e.getAttribute("data-scenario") ?? void 0;
    await u.loadScenarios(a, { initial: a.some((m) => m.id === d) ? d : void 0 }), Gn.set(e, Ph(u, e));
  } else
    await u.load(l ?? r);
  if (e.getAttribute("data-controls") !== "false") {
    const d = ie(e.getAttribute("data-labels"), "data-labels", e), m = e.querySelector("figcaption"), p = e.getAttribute("data-scenario-legend"), g = e.getAttribute("data-scenario-control");
    f.controls = kh(u, e, {
      ...t.controls,
      ...e.getAttribute("data-fullscreen") === "true" ? { fullscreen: !0 } : {},
      ...g === "slider" || g === "buttons" ? { scenarioControl: g } : {},
      labels: { ...t.controls?.labels, ...d, ...p ? { scenario: p } : {} },
      // Inside the figure, before its figcaption, so the caption stays last.
      mount: void 0
    }), m ? e.insertBefore(f.controls.element, m) : e.appendChild(f.controls.element);
  }
  return f;
}
function Ch(e, t, n) {
  const s = [];
  return e.forEach((i, r) => {
    const o = ie(i.textContent, "timeline", n);
    if (!o) return;
    const a = i.getAttribute("data-scenario") || `scenario-${r + 1}`;
    if (s.some((c) => c.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, n);
      return;
    }
    const l = i.getAttribute("data-scenario-label") ?? void 0;
    s.push({ id: a, label: l, timeline: t ? to(o, t) : o });
  }), s;
}
function to(e, t) {
  return e.config.markers?.length ? e : { ...e, config: { ...e.config, markers: t.map((n, s) => ({ id: `step-${s + 1}`, time: n })) } };
}
function Hh(e) {
  if (!e) return;
  const t = e.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((n, s) => n - s);
  return t.length > 0 ? t : void 0;
}
async function $h(e = document, t = {}) {
  const n = Array.from(e.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(n.map((i) => Ih(i, t)))).filter((i) => i !== void 0);
}
function F0(e) {
  const t = Ge.get(e);
  t && (Gn.get(e)?.(), Gn.delete(e), t.controls?.destroy(), t.player.destroy(), Ge.delete(e), e.removeAttribute("data-tinyfly-mounted"));
}
function Rh(e) {
  const t = e.querySelector("svg");
  if (!t || t.hasAttribute("role") || t.hasAttribute("aria-hidden")) return;
  const n = e.getAttribute("data-alt"), s = e.querySelector("figcaption");
  t.setAttribute("role", "img"), n ? t.setAttribute("aria-label", n) : s && (s.id ||= `tinyfly-caption-${++_h}`, t.setAttribute("aria-labelledby", s.id));
}
function Oh() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const t = () => {
    $h();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", t, { once: !0 }) : t();
}
class Lh {
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
      const s = document.querySelector(t);
      if (!s) throw new Error(`Container not found: ${t}`);
      this.container = s;
    } else
      this.container = t;
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new Et(), this.adapterB = new Et();
  }
  /**
   * Load a sequence from a URL or inline definition.
   */
  async load(t) {
    let n;
    if (typeof t == "string") {
      const s = await fetch(t);
      if (!s.ok)
        throw new Error(`Failed to load sequence: ${s.statusText}`);
      n = await s.json();
    } else
      n = t;
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
    const s = this.sequence.scenes[t];
    if (this.renderScene(s, this.containerA, this.adapterA), this.timelineA = this.createTimeline(s), this.options.onSceneChange?.(t), n)
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
  renderScene(t, n, s) {
    n.innerHTML = "", s.clearTargets();
    const i = document.createElement("div");
    i.style.cssText = "position:absolute;inset:0;transform-origin:center center", i.setAttribute("data-tinyfly", "Camera"), n.appendChild(i), s.registerTarget("Camera", i);
    for (const r of t.elements) {
      if (!r.html) continue;
      const o = document.createElement("div");
      o.innerHTML = r.html.trim();
      const a = o.firstElementChild;
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
  setupNested(t, n) {
    const s = [];
    t.querySelectorAll("[data-tinyfly-symbol]").forEach((i) => {
      const r = i.getAttribute("data-tinyfly-symbol");
      if (!r) return;
      const o = this.symbolDefs.get(r);
      if (!o) return;
      const a = new Et();
      i.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const c = l.getAttribute("data-tinyfly");
        c && a.registerTarget(c, l);
      }), s.push({ adapter: a, timeline: ue(o) });
    }), s.length ? this.nestedByAdapter.set(n, s) : this.nestedByAdapter.delete(n);
  }
  /** Apply the nested symbol states for a slot at a given scene time. */
  applyNested(t, n) {
    const s = this.nestedByAdapter.get(t);
    if (s)
      for (const i of s) {
        const r = i.timeline.duration;
        i.adapter.applyState(i.timeline.getStateAtTime(r > 0 ? n % r : n));
      }
  }
  clearContainer(t) {
    t.innerHTML = "";
  }
  createTimeline(t) {
    return t.timeline ? ue(t.timeline) : null;
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
    const n = this.sequence.scenes[t], s = n.transition;
    if (s.type === "none" || s.duration <= 0) {
      this.switchToScene(t);
      return;
    }
    this._state = "transitioning", this.containerB.style.visibility = "visible", this.renderScene(n, this.containerB, this.adapterB), this.timelineB = this.createTimeline(n), this.timelineB && this.timelineB.play(), this.applyTransition(s.type, s.duration), this.transitionTimer = window.setTimeout(() => {
      this.finishTransition(t);
    }, s.duration);
  }
  applyTransition(t, n) {
    const s = `${n}ms`, i = "ease-in-out";
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
    switch (this.containerB.offsetHeight, this.containerA.style.transition = `opacity ${s} ${i}, transform ${s} ${i}`, this.containerB.style.transition = `opacity ${s} ${i}, transform ${s} ${i}`, t) {
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
    const s = this.adapterA;
    this.adapterA = this.adapterB, this.adapterB = s, this.timelineA = this.timelineB, this.timelineB = null, this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB), this._currentSceneIndex = t, this._state = "playing-scene", this.options.onSceneChange?.(t), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.playbackState !== "playing" && this.timelineA.play()) : this.onSceneComplete();
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
      this._isPlaying ? this.animationFrameId = requestAnimationFrame(t) : this.animationFrameId = void 0;
    };
    this.animationFrameId = requestAnimationFrame(t);
  }
  stopAnimationLoop() {
    this.animationFrameId !== void 0 && (cancelAnimationFrame(this.animationFrameId), this.animationFrameId = void 0);
  }
}
async function B0(e, t, n = {}) {
  const s = new Lh(e, { ...n, autoplay: !0 });
  return await s.load(t), s;
}
const D0 = { type: "none", duration: 0 };
function Fh(e) {
  let t = 0;
  for (let n = 1; n < e.length; n++) t += Math.hypot(e[n].x - e[n - 1].x, e[n].y - e[n - 1].y);
  return t;
}
function me(e, t) {
  const n = Math.min(1, Math.max(0, t));
  if (e.length < 2 || n === 1) return e.slice();
  if (n === 0) return e.slice(0, 1);
  let s = Fh(e) * n;
  const i = [e[0]];
  for (let r = 1; r < e.length; r++) {
    const o = e[r - 1], a = e[r], l = Math.hypot(a.x - o.x, a.y - o.y);
    if (l >= s) {
      const c = l === 0 ? 0 : s / l;
      return i.push({ x: o.x + (a.x - o.x) * c, y: o.y + (a.y - o.y) * c }), i;
    }
    i.push(a), s -= l;
  }
  return i;
}
function Ss(e, t) {
  const n = me(e, t);
  return n[n.length - 1];
}
function eo(e, t) {
  return t > 0 ? Math.floor(Math.max(0, e) * t / 1e3) : 0;
}
function Jn(e, t, n) {
  const s = t.roughness ?? 2, i = Math.max(1, Math.round(t.passes ?? 2)), r = eo(n, t.boil ?? 8);
  let o = 0;
  const a = () => {
    const f = o++;
    return (d) => un(Se(`${t.seed ?? 1}:${r}:${f}:${d}`));
  }, l = (f, d) => (f.next() * 2 - 1) * d, c = (f) => {
    const d = a(), m = e.lineWidth, p = e.globalAlpha;
    for (let g = 0; g < i; g++)
      e.lineWidth = g === 0 ? m : m * 0.55, e.globalAlpha = g === 0 ? p : p * 0.6, f(d(g));
    e.lineWidth = m, e.globalAlpha = p;
  }, h = (f, d = 1) => {
    if (f.length < 2) return;
    const m = f.slice(1).map((g, y) => Math.hypot(g.x - f[y].x, g.y - f[y].y)), p = m.reduce((g, y) => g + y, 0) * Math.min(1, Math.max(0, d));
    c((g) => {
      const y = [], b = [];
      if (f.forEach((S, k) => {
        y.push({ x: S.x + l(g, s * 0.5), y: S.y + l(g, s * 0.5) }), k > 0 && b.push([g.next() * 2 - 1, g.next() * 2 - 1]);
      }), p <= 0) return;
      e.beginPath(), e.moveTo(y[0].x, y[0].y);
      let w = 0;
      for (let S = 1; S < y.length; S++) {
        const k = Bh(y[S - 1], y[S], s, b[S - 1]), x = m[S - 1];
        if (w + x <= p) {
          e.bezierCurveTo(k[1].x, k[1].y, k[2].x, k[2].y, k[3].x, k[3].y), w += x;
          continue;
        }
        const v = Dh(k, x === 0 ? 1 : (p - w) / x);
        e.bezierCurveTo(v[1].x, v[1].y, v[2].x, v[2].y, v[3].x, v[3].y);
        break;
      }
      e.stroke();
    });
  }, u = (f, d, m, p, g = 1) => {
    c((y) => {
      const w = y.next() * Math.PI * 2, S = Math.PI * 2 + 0.15 + y.next() * 0.3, k = [];
      for (let v = 0; v <= 14; v++) {
        const E = w + S * v / 14, M = l(y, s * 0.6);
        k.push({ x: f + Math.cos(E) * (m + M), y: d + Math.sin(E) * (p + M) });
      }
      const x = me(k, g);
      x.length < 2 || (Ei(e, x), e.stroke());
    });
  };
  return {
    line: h,
    curve(f, d = 1) {
      if (f.length < 2) return;
      const m = f[0], p = f[f.length - 1], g = Math.hypot(p.x - m.x, p.y - m.y) || 1, y = -(p.y - m.y) / g, b = (p.x - m.x) / g;
      c((w) => {
        const S = { x: l(w, s * 0.5), y: l(w, s * 0.5) }, k = { x: l(w, s * 0.5), y: l(w, s * 0.5) }, x = l(w, s * Math.min(1.5, Math.max(0.3, g / 80))), v = f.map((M, A) => {
          const T = A / (f.length - 1), P = Math.sin(Math.PI * T) * x;
          return {
            x: M.x + S.x + (k.x - S.x) * T + y * P,
            y: M.y + S.y + (k.y - S.y) * T + b * P
          };
        }), E = me(v, d);
        E.length < 2 || (Ei(e, E), e.stroke());
      });
    },
    circle(f, d, m, p = 1) {
      u(f, d, m, m, p);
    },
    ellipse: u,
    nudge(f = 0.5) {
      const d = a()(0);
      return { x: l(d, s * f), y: l(d, s * f) };
    }
  };
}
function Bh(e, t, n, s) {
  const i = t.x - e.x, r = t.y - e.y, o = Math.hypot(i, r) || 1, a = n * Math.min(1.5, Math.max(0.3, o / 80)), l = -r / o, c = i / o;
  return [
    e,
    { x: e.x + i / 3 + l * s[0] * a, y: e.y + r / 3 + c * s[0] * a },
    { x: e.x + 2 * i / 3 + l * s[1] * a, y: e.y + 2 * r / 3 + c * s[1] * a },
    t
  ];
}
function Dh([e, t, n, s], i) {
  const r = (u, f) => ({ x: u.x + (f.x - u.x) * i, y: u.y + (f.y - u.y) * i }), o = r(e, t), a = r(t, n), l = r(n, s), c = r(o, a), h = r(a, l);
  return [e, o, c, r(c, h)];
}
function Ei(e, t) {
  e.beginPath(), e.moveTo(t[0].x, t[0].y);
  for (let s = 1; s < t.length - 1; s++) {
    const i = { x: (t[s].x + t[s + 1].x) / 2, y: (t[s].y + t[s + 1].y) / 2 };
    e.quadraticCurveTo(t[s].x, t[s].y, i.x, i.y);
  }
  const n = t[t.length - 1];
  e.lineTo(n.x, n.y);
}
function We(e, t, n) {
  const s = e.length;
  if (s < 2) return [];
  const i = [], r = [], o = (a) => t + (n - t) * a / (s - 1);
  return e.forEach((a, l) => {
    const c = e[Math.max(0, l - 1)], h = e[Math.min(s - 1, l + 1)], u = Math.hypot(h.x - c.x, h.y - c.y) || 1, f = o(l) / 2, d = -(h.y - c.y) / u * f, m = (h.x - c.x) / u * f;
    i.push({ x: a.x + d, y: a.y + m }), r.push({ x: a.x - d, y: a.y - m });
  }), [...i, ...r.reverse()];
}
function Ms(e, t, n, s) {
  const i = t.length;
  if (i < 2) return;
  const r = We(t, n, s), o = (a) => n + (s - n) * a / (i - 1);
  e.beginPath(), e.moveTo(r[0].x, r[0].y);
  for (const a of r.slice(1)) e.lineTo(a.x, a.y);
  e.closePath(), e.fill(), t.forEach((a, l) => {
    l !== 0 && l !== i - 1 && i > 3 || (e.beginPath(), e.arc(a.x, a.y, o(l) / 2, 0, Math.PI * 2), e.fill());
  });
}
function Vt(e, t, n, s, i = 16) {
  const r = { x: 2 * t.x - (e.x + n.x) / 2, y: 2 * t.y - (e.y + n.y) / 2 }, o = [];
  for (let a = 0; a <= i; a++) {
    const l = a / i, c = l < 0.5 ? { x: e.x + (t.x - e.x) * 2 * l, y: e.y + (t.y - e.y) * 2 * l } : { x: t.x + (n.x - t.x) * (2 * l - 1), y: t.y + (n.y - t.y) * (2 * l - 1) }, h = 1 - l, u = {
      x: h * h * e.x + 2 * h * l * r.x + l * l * n.x,
      y: h * h * e.y + 2 * h * l * r.y + l * l * n.y
    };
    o.push({ x: c.x + (u.x - c.x) * s, y: c.y + (u.y - c.y) * s });
  }
  return o;
}
function Ai(e, t, n, s, i, r = 0, o = 1, a = 40) {
  const l = Math.cos(i), c = Math.sin(i);
  return Array.from({ length: a + 1 }, (h, u) => {
    const f = r + Math.PI * 2 * o * u / a, d = Math.cos(f) * n, m = Math.sin(f) * s;
    return { x: e + d * l - m * c, y: t + d * c + m * l };
  });
}
function no(e, t) {
  return t.look === "pencil" ? Yh(e, t) : Wh(e, t.ink, t.look);
}
function Je(e, t, n = !1) {
  e.beginPath(), e.moveTo(t[0].x, t[0].y);
  for (const s of t.slice(1)) e.lineTo(s.x, s.y);
  n && e.closePath();
}
function Wh(e, t, n) {
  const s = n === "silhouette", i = s ? 1.25 : 1;
  return {
    look: n,
    ink: t,
    limb(r, o, a) {
      e.fillStyle = t, Ms(e, r, o * i, a * i);
    },
    line(r, o) {
      r.length < 2 || (e.strokeStyle = t, e.lineWidth = o * i, e.lineCap = "round", e.lineJoin = "round", Je(e, r), e.stroke());
    },
    shape(r, o, a) {
      Je(e, r, !0), (o !== null || s) && (e.fillStyle = s ? t : o, e.fill()), !(a <= 0) && (e.strokeStyle = t, e.lineWidth = a * i, e.lineJoin = "round", e.stroke());
    },
    ellipse(r, o, a, l, c, h, u) {
      e.beginPath(), e.ellipse(r, o, a, l, c, 0, Math.PI * 2), (h !== null || s) && (e.fillStyle = s ? t : h, e.fill()), !(u <= 0) && (e.strokeStyle = t, e.lineWidth = u * i, e.stroke());
    },
    dot(r, o, a) {
      e.fillStyle = t, e.beginPath(), e.arc(r, o, a * i, 0, Math.PI * 2), e.fill();
    },
    guide() {
    },
    guideEllipse() {
    }
  };
}
function Nh(e, t) {
  const n = [e[0]];
  let s = 0;
  for (let o = 1; o < e.length; o++) {
    const a = e[o - 1], l = e[o], c = Math.hypot(l.x - a.x, l.y - a.y);
    let h = t - s;
    for (; h < c; ) {
      const u = h / c;
      n.push({ x: a.x + (l.x - a.x) * u, y: a.y + (l.y - a.y) * u }), h += t;
    }
    s = c - (h - t);
  }
  const i = e[e.length - 1], r = n[n.length - 1];
  return Math.hypot(i.x - r.x, i.y - r.y) > t * 0.25 ? n.push(i) : n[n.length - 1] = i, n;
}
function Kh(e, t) {
  const n = e.length;
  return e.map((s, i) => {
    const r = e[Math.max(0, i - 1)], o = e[Math.min(n - 1, i + 1)], a = Math.hypot(o.x - r.x, o.y - r.y) || 1, l = t(n === 1 ? 0 : i / (n - 1));
    return { x: s.x - (o.y - r.y) / a * l, y: s.y + (o.x - r.x) / a * l };
  });
}
function Pi(e) {
  const t = [0.6, 1.4, 2.9].map((s) => ({
    frequency: s * (0.8 + e.next() * 0.4),
    phase: e.next() * Math.PI * 2,
    amount: 0.5 + e.next() * 0.5
  })), n = t.reduce((s, i) => s + i.amount, 0);
  return (s) => t.reduce((i, r) => i + r.amount * Math.sin(Math.PI * 2 * r.frequency * s + r.phase), 0) / n;
}
function Yh(e, t) {
  const n = t.pencil ?? {}, s = t.ink, i = n.roughness ?? Math.max(1, t.lineWidth * 0.12), r = Math.max(1, Math.round(n.passes ?? 2)), o = Math.min(1, Math.max(0, n.pressure ?? 0.25)), a = Math.min(1, Math.max(0, n.rubbedOut ?? 0.15)), l = eo(t.time, n.boil ?? 8);
  let c = 0;
  const h = (m, p, g = !1) => un(Se(`${t.seed}:${g ? "paper" : l}:${m}:${p}`)), u = (m, p, g, y, b, w = 0) => {
    if (m.length < 2) return;
    const S = m.slice(1).reduce((T, P, _) => T + Math.hypot(P.x - m[_].x, P.y - m[_].y), 0);
    let k = Nh(m, Math.max(1.5, Math.min(t.lineWidth * 0.8, S / 24)));
    if (w > 0 && k.length >= 2) {
      const [T, P] = [k[k.length - 2], k[k.length - 1]], _ = Math.hypot(P.x - T.x, P.y - T.y) || 1;
      k = [...k, { x: P.x + (P.x - T.x) / _ * w, y: P.y + (P.y - T.y) / _ * w }];
    }
    const x = Pi(g), v = Pi(g), E = k.length, M = [], A = [];
    k.forEach((T, P) => {
      const _ = E === 1 ? 0 : P / (E - 1), I = k[Math.max(0, P - 1)], C = k[Math.min(E - 1, P + 1)], R = Math.hypot(C.x - I.x, C.y - I.y) || 1, B = -(C.y - I.y) / R, $ = (C.x - I.x) / R, O = x(_) * b, H = Math.min(1, _ / 0.08, (1 - _) / 0.08), L = (0.55 + 0.45 * Math.sqrt(Math.max(0, H))) * (1 + o * v(_)), F = Math.max(0.3, p(_) * L / 2), D = T.x + B * O, z = T.y + $ * O;
      M.push({ x: D + B * F, y: z + $ * F }), A.push({ x: D - B * F, y: z - $ * F });
    }), e.save(), e.globalAlpha *= y, e.fillStyle = s, Je(e, [...M, ...A.reverse()], !0), e.fill(), e.restore();
  }, f = (m, p) => {
    const g = c++, y = h(g, 99, !0);
    if (y.next() < a) {
      const k = (y.next() * 2 - 1) * t.lineWidth * 1.4, x = (y.next() * 2 - 1) * t.lineWidth * 1.4, v = m.map((E) => ({ x: E.x + k, y: E.y + x }));
      u(v, (E) => p(E) * 1.8, h(g, 98, !0), 0.035, i), u(v, (E) => p(E) * 0.45, h(g, 97, !0), 0.12, i * 1.5);
    }
    const b = m.slice(1).reduce((k, x, v) => k + Math.hypot(x.x - m[v].x, x.y - m[v].y), 0), w = p(0.5) > 4 && b > p(0.5) * 6, S = w ? [-0.3, 0.3, 0] : [0];
    for (let k = 0; k < r; k++) {
      const x = k === 0;
      S.forEach((v, E) => {
        const M = h(g, k * 10 + E), A = v === 0 ? m : Kh(m, (P) => p(P) * v * Math.sqrt(Math.sin(Math.PI * P))), T = !x && v === 0 ? t.lineWidth * (0.3 + M.next() * 0.8) : 0;
        u(A, (P) => p(P) * (w ? 0.5 : 1) * (x ? 1 : 0.6), M, x ? 0.85 : 0.45, i * (x ? 0.6 : 1), T);
      });
    }
  }, d = (m, p, g, y, b, w) => {
    const k = h(c, 50).next() * Math.PI * 2;
    f(Ai(m, p, g, y, b, k, 1.08, 48), () => w);
  };
  return {
    look: "pencil",
    ink: s,
    limb(m, p, g) {
      f(m, (y) => p + (g - p) * y);
    },
    line(m, p) {
      f(m, () => p);
    },
    shape(m, p, g) {
      p !== null && (e.save(), e.globalAlpha *= 0.88, e.fillStyle = p, Je(e, m, !0), e.fill(), e.restore()), g > 0 && f([...m, m[0]], () => g);
    },
    ellipse(m, p, g, y, b, w, S) {
      w !== null && (e.save(), e.globalAlpha *= 0.9, e.fillStyle = w, e.beginPath(), e.ellipse(m, p, g, y, b, 0, Math.PI * 2), e.fill(), e.restore()), d(m, p, g, y, b, S);
    },
    dot(m, p, g) {
      e.save(), e.globalAlpha *= 0.9, e.fillStyle = s, e.beginPath(), e.arc(m, p, g, 0, Math.PI * 2), e.fill(), e.restore();
    },
    guide(m) {
      if (n.construction === !1 || m.length < 2) return;
      const p = c++;
      u(m, () => Math.max(0.6, t.lineWidth * 0.18), h(p, 0), 0.28, i * 1.2, t.lineWidth);
    },
    guideEllipse(m, p, g, y, b) {
      if (n.construction === !1) return;
      const w = c++, S = h(w, 0), k = Ai(m, p, g, y, b, S.next() * Math.PI * 2, 1.12, 48);
      u(k, () => Math.max(0.6, t.lineWidth * 0.18), S, 0.28, i * 1.5);
    }
  };
}
const Xh = ["thumb", "index", "middle", "ring", "pinky"], K = {
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
function N(e = {}) {
  return { ...K, ...e };
}
const J = (e, t, n, s, i) => ({
  "thumb.curl": e,
  "index.curl": t,
  "middle.curl": n,
  "ring.curl": s,
  "pinky.curl": i
}), V = {
  relaxed: K,
  open: N({ ...J(0, 0, 0, 0, 0), "thumb.across": 0, spread: 0.55 }),
  spread: N({ ...J(0, 0, 0, 0, 0), "thumb.across": 0, spread: 1 }),
  flat: N({ ...J(0, 0, 0, 0, 0), "thumb.across": 0.35, spread: 0 }),
  fist: N({ ...J(0.7, 1, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  point: N({ ...J(0.75, 0, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  /** The fist on its side, knuckles toward the viewer, the thumb up */
  thumbsUp: N({ ...J(0, 1, 1, 1, 1), "thumb.across": 0, spread: 0, roll: 70 }),
  peace: N({ ...J(0.75, 0, 0, 1, 1), "thumb.across": 0.9, spread: 1 }),
  ok: N({ ...J(0.12, 0.6, 0.1, 0.15, 0.2), "thumb.across": 0.55, spread: 0.6 }),
  pinch: N({ ...J(0.1, 0.65, 0.75, 0.85, 0.9), "thumb.across": 0.55, spread: 0 }),
  cupped: N({ ...J(0.25, 0.4, 0.4, 0.4, 0.4), "thumb.across": 0.4, spread: 0.05, turn: 2 }),
  wave: N({ ...J(0, 0.05, 0.05, 0.1, 0.12), "thumb.across": 0, spread: 0.7, turn: 2 }),
  /** Holding a pencil to write: thumb and middle finger pinch it, the index finger rests on top */
  pencilGrip: N({ ...J(0.1, 0.6, 0.72, 0.88, 0.95), "thumb.across": 0.5, spread: 0, turn: 0.8, bend: 10 }),
  /** Holding a handle, a cup or a bar: every finger wrapped round it */
  hold: N({ ...J(0.5, 0.7, 0.72, 0.74, 0.76), "thumb.across": 0.75, spread: 0, turn: 1 })
};
function ge(e, t, n) {
  const s = { ...e };
  for (const [i, r] of Object.entries(t)) {
    const o = e[i] ?? r;
    s[i] = o + (r - o) * n;
  }
  return s;
}
const qh = {
  index: { knuckle: [-0.16, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.125, fan: -1 },
  middle: { knuckle: [-0.055, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.13, fan: -0.2 },
  ring: { knuckle: [0.05, 0.475, -0.02], bones: [0.2, 0.125, 0.1], width: 0.122, fan: 0.55 },
  pinky: { knuckle: [0.15, 0.43, -0.02], bones: [0.16, 0.1, 0.085], width: 0.108, fan: 1.25 }
}, Vh = {
  index: { knuckle: [-0.14, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.15, fan: -1 },
  middle: { knuckle: [0, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.155, fan: 0 },
  pinky: { knuckle: [0.14, 0.45, -0.02], bones: [0.19, 0.115, 0.095], width: 0.145, fan: 1 }
}, lt = {
  base: [-0.11, 0.1, -0.05],
  bones: [0.2, 0.15, 0.12],
  widths: [0.2, 0.145, 0.135],
  /** Where the thumb points with `across` 0 and 1 */
  out: [-0.7, 0.68, -0.22],
  across: [0.35, 0.5, -0.8]
}, Uh = [82, 100, 62], zh = [48, 72], jh = 3, Gh = 13, Jh = 0.035, Zh = -0.075, Qh = [
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
], yt = (e) => e * Math.PI / 180, Zn = (e, t) => [e[0] + t[0], e[1] + t[1], e[2] + t[2]], Ne = (e, t) => [e[0] * t, e[1] * t, e[2] * t], Qn = (e, t) => [e[1] * t[2] - e[2] * t[1], e[2] * t[0] - e[0] * t[2], e[0] * t[1] - e[1] * t[0]], Qt = (e) => {
  const t = Math.hypot(e[0], e[1], e[2]) || 1;
  return [e[0] / t, e[1] / t, e[2] / t];
};
function At(e, t, n) {
  const s = Math.cos(n), i = Math.sin(n), r = Qn(t, e), o = t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
  return [
    e[0] * s + r[0] * i + t[0] * o * (1 - s),
    e[1] * s + r[1] * i + t[1] * o * (1 - s),
    e[2] * s + r[2] * i + t[2] * o * (1 - s)
  ];
}
const _i = [1, 0, 0], Ii = [0, 1, 0], ce = [0, 0, 1];
function tu(e, t, n) {
  const s = yt(e.fan * (jh + Gh * n)), i = [Math.sin(s), Math.cos(s), 0], r = [Math.cos(s), -Math.sin(s), 0], o = [e.knuckle];
  let a = 0;
  e.bones.forEach((h, u) => {
    a += yt(Uh[u] * t), o.push(Zn(o[u], Ne(At(i, r, -a), h)));
  });
  const l = At(ce, r, -a), c = o.map((h, u) => e.width * (1 - 0.14 * (u / (o.length - 1))));
  return { joints: o, back: l, widths: c };
}
function eu(e, t, n = 1, s = 1) {
  const i = Math.min(1, Math.max(0, t)), r = Qt(Zn(Ne(Qt(lt.out), 1 - i), Ne(Qt(lt.across), i))), o = Qt(Qn(ce, r)), a = Qt(Qn(r, o)), l = [[lt.base[0] * s, lt.base[1], lt.base[2]]];
  let c = 0;
  lt.bones.forEach((f, d) => {
    d > 0 && (c += yt(zh[d - 1] * e)), l.push(Zn(l[d], Ne(At(r, o, c), f)));
  });
  const h = At(a, o, c), u = [...lt.widths, lt.widths[lt.widths.length - 1] * 0.92].map((f) => f * n);
  return { joints: l, back: h, widths: u };
}
function ts(e, t = {}) {
  const n = { ...K, ...e }, s = t.size ?? 100, i = t.side ?? "right", r = i === "left" ? -1 : 1, o = yt(t.angle ?? 0), a = t.fingers === 4, l = Math.max(0.5, t.plump ?? 1), c = 1 + (l - 1) * 0.7, h = (P) => ({
    ...P,
    knuckle: [P.knuckle[0] * c, P.knuckle[1], P.knuckle[2]],
    width: P.width * l
  }), u = yt(n.bend ?? 0), f = yt(n.tilt ?? 0), d = yt(90 * (n.turn ?? 0)), m = (P) => At(At(At(P, _i, -u), ce, -f), Ii, d), p = Math.cos(o), g = Math.sin(o), y = yt(n.roll ?? 0), b = Math.cos(y), w = Math.sin(y), S = (P) => {
    const _ = P[0] * s, I = -P[1] * s, C = (_ * b - I * w) * r, R = _ * w + I * b;
    return { x: C * p - R * g, y: C * g + R * p };
  }, k = (P) => {
    const _ = S(P), I = Math.hypot(_.x, _.y);
    return I > 1e-6 * s ? { x: _.x / I, y: _.y / I } : { x: 0, y: 0 };
  }, x = {
    thumb: eu(n["thumb.curl"] ?? 0, n["thumb.across"] ?? 0, l, c)
  }, v = a ? Vh : qh;
  for (const P of Xh) {
    const _ = v[P];
    _ && (x[P] = tu(h(_), n[`${P}.curl`] ?? 0, n.spread ?? 0));
  }
  const E = {};
  for (const [P, _] of Object.entries(x)) {
    const I = _.joints.map(m), C = m(_.back);
    E[P] = {
      points: I.map(S),
      depths: I.map((R) => R[2] * s),
      widths: _.widths.map((R) => R * s),
      nail: C[2],
      back: k(C)
    };
  }
  const M = Qh.flatMap(([P, _]) => [m([P * c, _, Jh]), m([P * c, _, Zh])]), A = su(M.map(S)), T = M.reduce((P, _) => P + _[2], 0) / M.length * s;
  return {
    size: s,
    side: i,
    wrist: { x: 0, y: 0 },
    palm: A,
    palmDepth: T,
    palmFacing: -m(ce)[2],
    fingers: E,
    axes: { up: k(m(Ii)), across: k(m(_i)), out: k(m(ce)) },
    curls: Object.fromEntries(Object.keys(E).map((P) => [P, n[`${P}.curl`] ?? 0]))
  };
}
function nu(e, t) {
  const n = (i) => ({ x: i.x + t.x - e.wrist.x, y: i.y + t.y - e.wrist.y }), s = {};
  for (const [i, r] of Object.entries(e.fingers))
    s[i] = { ...r, points: r.points.map(n) };
  return { ...e, wrist: n(e.wrist), palm: e.palm.map(n), fingers: s };
}
function su(e) {
  const t = [...e].sort((r, o) => r.x - o.x || r.y - o.y);
  if (t.length < 3) return t;
  const n = (r, o, a) => (o.x - r.x) * (a.y - r.y) - (o.y - r.y) * (a.x - r.x), s = [];
  for (const r of t) {
    for (; s.length >= 2 && n(s[s.length - 2], s[s.length - 1], r) <= 0; ) s.pop();
    s.push(r);
  }
  const i = [];
  for (const r of [...t].reverse()) {
    for (; i.length >= 2 && n(i[i.length - 2], i[i.length - 1], r) <= 0; ) i.pop();
    i.push(r);
  }
  return [...s.slice(0, -1), ...i.slice(0, -1)];
}
const iu = "#f1c9a5", ru = "#2f2f33";
function xs(e, t, n, s = {}, i = 0) {
  const r = nu(ts(n, s), t), o = s.ink ?? ru, a = s.lineWidth ?? r.size * 0.035, l = s.pen ?? no(e, {
    look: s.look ?? "clean",
    ink: o,
    lineWidth: a,
    seed: s.seed ?? 1,
    time: i,
    pencil: { construction: !1, ...s.pencil }
  }), c = s.skin ?? iu, h = s.nails ?? !0, u = [
    {
      depth: r.palmDepth,
      draw: () => ou(l, r, c, a)
    }
  ];
  for (const f of Object.values(r.fingers)) {
    const d = f.depths.reduce((m, p) => m + p, 0) / f.depths.length;
    u.push({
      depth: d,
      draw: () => au(e, l, f, c, a, h)
    });
  }
  if (s.prop) {
    const f = s.prop;
    u.push({ depth: f.depth, draw: () => f.draw(l) });
  }
  e.save(), e.lineCap = "round", e.lineJoin = "round";
  for (const f of [...u].sort((d, m) => d.depth - m.depth)) f.draw();
  return e.restore(), r;
}
function ou(e, t, n, s) {
  if (e.shape(t.palm, n, s), t.palmFacing < -0.3 && e.look !== "silhouette") {
    const { up: i } = t.axes;
    for (const [r, o] of Object.entries(t.fingers)) {
      const a = t.curls[r] ?? 0;
      if (r === "thumb" || a < 0.5) continue;
      const l = o.points[0], c = o.widths[0] * 0.42, h = { x: l.x - i.x * c * 0.2, y: l.y - i.y * c * 0.2 }, u = Math.atan2(i.y, i.x), f = Array.from({ length: 7 }, (d, m) => {
        const p = u - Math.PI / 2 + Math.PI * m / 6;
        return { x: h.x + Math.cos(p) * c, y: h.y + Math.sin(p) * c };
      });
      e.line(f, s * 0.6);
    }
  }
  if (t.palmFacing > 0.45 && e.look !== "silhouette") {
    const { up: i, across: r } = t.axes, o = t.size, a = t.wrist, l = (h, u) => ({
      x: a.x + (r.x * h + i.x * u) * o,
      y: a.y + (r.y * h + i.y * u) * o
    }), c = t.side === "left" ? -1 : 1;
    e.line([l(-0.15 * c, 0.36), l(-0.04 * c, 0.3), l(0.1 * c, 0.33)], s * 0.5);
  }
}
function au(e, t, n, s, i, r) {
  const { widths: o } = n, a = lu(n.points, 2), l = n.points[0], c = a[a.length - 1], h = o[0], u = o[o.length - 1];
  if (e.save(), t.look !== "silhouette") {
    e.beginPath(), e.rect(l.x - 1e5, l.y - 1e5, 2e5, 2e5);
    const p = h / 2 + i * 1.6;
    e.moveTo(l.x + p, l.y), e.arc(l.x, l.y, p, 0, Math.PI * 2), e.clip("evenodd");
  }
  if (t.limb(a, h + 2 * i, u + 2 * i), e.restore(), t.look !== "silhouette" && (e.fillStyle = s, Ms(e, a, h, u)), t.look === "silhouette" || !r || n.nail < 0.25) return;
  const f = a[a.length - 2], d = cu({ x: c.x - f.x, y: c.y - f.y }) ?? {
    x: 0,
    y: -1
  }, m = {
    x: c.x - d.x * u * 0.22 + n.back.x * u * 0.1,
    y: c.y - d.y * u * 0.22 + n.back.y * u * 0.1
  };
  t.ellipse(m.x, m.y, u * 0.24 * Math.max(0.35, n.nail), u * 0.19, Math.atan2(d.y, d.x), "#f8e3d3", i * 0.45);
}
function lu(e, t) {
  let n = e;
  for (let s = 0; s < t; s++) {
    if (n.length < 3) return n;
    const i = [n[0]];
    for (let r = 0; r < n.length - 1; r++) {
      const o = n[r], a = n[r + 1];
      r > 0 && i.push({ x: o.x * 0.75 + a.x * 0.25, y: o.y * 0.75 + a.y * 0.25 }), r < n.length - 2 && i.push({ x: o.x * 0.25 + a.x * 0.75, y: o.y * 0.25 + a.y * 0.75 });
    }
    i.push(n[n.length - 1]), n = i;
  }
  return n;
}
const cu = (e) => {
  const t = Math.hypot(e.x, e.y);
  return t > 1e-6 ? { x: e.x / t, y: e.y / t } : null;
}, Nt = {
  walk: { swing: 24, knee: 30, arm: 22, elbow: 28, lean: 4 },
  bouncy: { swing: 26, knee: 45, arm: 34, elbow: 30, lean: 2, bend: -4, bounce: 0.035, squash: 0.06 },
  doubleBounce: { swing: 22, knee: 40, arm: 26, elbow: 24, lean: 3, bounce: 0.02, bounces: 2, squash: 0.04 },
  sneak: { swing: 28, knee: 70, arm: 6, elbow: 0, forearm: 110, shoulder: 55, lean: 16, bend: 14, headTilt: -8, crouch: 50, tiptoe: 25 },
  strut: { swing: 26, knee: 30, arm: 30, elbow: 20, lean: -4, bend: -10, headTilt: -6, sway: 4, bounce: 0.01 },
  tired: { swing: 14, knee: 14, arm: 6, elbow: 6, lean: 10, bend: 16, headTilt: 12 },
  run: { swing: 40, knee: 95, arm: 45, elbow: 0, forearm: 90, lean: 16, bend: 6, bounce: 0.05, squash: 0.06 }
}, hu = 40;
function so(e) {
  return e === void 0 ? Nt.walk : typeof e == "string" ? Nt[e] ?? Nt.walk : e;
}
function uu(e, t, n = W, s = 1) {
  const i = so(e);
  if (i === Nt.walk) return pu(t, n, s);
  const r = t * Math.PI * 2, o = Math.sin(r) * s, a = Math.cos(r) * s, l = (y) => y <= hu, c = i.shoulder ?? 0, h = (y, b) => l(y) ? b * c + i.arm * o : y, u = i.forearm ?? 0, f = l(n.leftShoulder) ? n.leftElbow - u - i.elbow * Math.max(0, -o) : n.leftElbow, d = l(n.rightShoulder) ? n.rightElbow + u + i.elbow * Math.max(0, o) : n.rightElbow, m = i.bounces ?? 1, p = (1 + Math.cos(r * 2 * m)) / 2, g = i.crouch ?? 0;
  return {
    ...n,
    lean: n.lean + i.lean * s + (i.sway ?? 0) * Math.sin(r) * (1 - (n.turn ?? 0)),
    bend: (n.bend ?? 0) + (i.bend ?? 0),
    headTilt: n.headTilt - i.lean * 0.5 * s + (i.headTilt ?? 0),
    leftElbow: f,
    rightElbow: d,
    // A crouch brings both thighs forward and folds both shins back.
    leftHip: -i.swing * o - g * 0.5,
    rightHip: -i.swing * o + g * 0.5,
    // The leg swinging forward lifts its knee; a crouch keeps both bent. A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -i.knee * Math.max(0, a) - g,
    rightKnee: i.knee * Math.max(0, -a) + g,
    leftAnkle: (n.leftAnkle ?? 0) + (i.tiptoe ?? 0),
    rightAnkle: (n.rightAnkle ?? 0) + (i.tiptoe ?? 0),
    leftShoulder: h(n.leftShoulder, -1),
    rightShoulder: h(n.rightShoulder, 1),
    rise: (n.rise ?? 0) + (i.bounce ?? 0) * s * p,
    stretch: n.stretch * (1 + (i.squash ?? 0) * (p - 0.5))
  };
}
function fu(e, t, n = 1) {
  const s = so(e), i = Nt.walk.swing, r = (o) => Math.sin(o * Math.PI / 180);
  return mu(t, n) * r(s.swing * n) / r(i * n);
}
const W = {
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
function j(e) {
  return { ...W, ...e };
}
const io = {
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
}, X = (e) => ({ ...io, ...e }), q = {
  neutral: io,
  happy: X({ smile: 0.9, leftBrow: 0.2, rightBrow: 0.2 }),
  joyful: X({ mouth: 0.6, smile: 1, mouthWidth: 1.2, leftEye: 0, rightEye: 0, leftBrow: 0.4, rightBrow: 0.4 }),
  sad: X({ smile: -0.8, leftEye: 0.8, rightEye: 0.8, browTilt: 0.9, leftBrow: -0.1, rightBrow: -0.1, lookY: 0.6 }),
  crying: X({ mouth: 0.45, smile: -1, leftEye: 0, rightEye: 0, browTilt: 1, lookY: 0.4 }),
  surprised: X({ mouth: 0.7, mouthWidth: 0.7, leftEye: 1.5, rightEye: 1.5, leftBrow: 1, rightBrow: 1 }),
  shocked: X({ mouth: 1, mouthWidth: 0.8, leftEye: 1.6, rightEye: 1.6, leftBrow: 1, rightBrow: 1, browTilt: 0.4 }),
  angry: X({ smile: -0.6, mouthWidth: 0.9, leftEye: 0.8, rightEye: 0.8, leftBrow: -0.6, rightBrow: -0.6, browTilt: -1 }),
  furious: X({ mouth: 0.5, smile: -1, mouthWidth: 1.3, leftEye: 0.9, rightEye: 0.9, leftBrow: -0.9, rightBrow: -0.9, browTilt: -1 }),
  worried: X({ smile: -0.3, mouthWidth: 0.8, leftEye: 1.1, rightEye: 1.1, leftBrow: 0.3, rightBrow: 0.3, browTilt: 0.8, lookX: -0.5 }),
  scared: X({ mouth: 0.35, smile: -0.5, mouthWidth: 0.8, leftEye: 1.45, rightEye: 1.45, leftBrow: 0.8, rightBrow: 0.8, browTilt: 0.9 }),
  confused: X({ smile: -0.2, mouthWidth: 0.8, leftEye: 0.9, rightEye: 1.15, leftBrow: -0.3, rightBrow: 0.8, lookX: 0.5, lookY: -0.4 }),
  skeptical: X({ smile: -0.1, leftEye: 0.6, rightEye: 1, leftBrow: -0.4, rightBrow: 0.7, lookX: 0.4 }),
  thinking: X({ smile: 0, mouthWidth: 0.7, leftBrow: 0.3, rightBrow: 0.5, lookX: 0.6, lookY: -0.8 }),
  sleepy: X({ smile: 0.1, leftEye: 0.25, rightEye: 0.25, leftBrow: -0.3, rightBrow: -0.3, lookY: 0.5 }),
  disgusted: X({ smile: -0.7, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.75, leftBrow: -0.5, rightBrow: -0.2, browTilt: -0.4, lookX: -0.6 }),
  smug: X({ smile: 0.6, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.6, leftBrow: 0.1, rightBrow: 0.5, lookX: 0.5 }),
  wink: X({ smile: 0.9, leftEye: 0, rightEye: 1, leftBrow: -0.2, rightBrow: 0.3 })
};
function Ze(e, t) {
  return { ...e, ...typeof t == "string" ? q[t] : t };
}
const Me = {
  rest: W,
  wave: j({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...q.happy }),
  cheer: j({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...q.joyful }),
  shrug: j({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...q.confused, lookX: 0, lookY: 0 }),
  point: j({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: j({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...q.thinking }),
  handsOnHips: j({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: j({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...q.sad }),
  surprised: j({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...q.surprised }),
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: j({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  // Seated, hands resting on the knees. Arm angles spread outward per side, so
  // reaching forward (+x, the way the figure faces) is negative for the left arm.
  sit: j({ sit: 1, turn: 0.5, leftShoulder: -25, rightShoulder: 25, leftElbow: -55, rightElbow: 55 }),
  jump: j({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...q.joyful }),
  // Full splits: legs flat along the floor, so the planted feet bring the hips right down to it.
  // Side (straddle) split, seen front-on: each leg straight out to its side, toes pointed.
  sideSplit: j({ leftHip: 90, rightHip: 90, leftAnkle: -45, rightAnkle: -45, leftShoulder: 120, rightShoulder: 120, leftElbow: 10, rightElbow: 10, ...q.happy }),
  // Front split, in profile: the left leg forward (+x), the right leg back.
  frontSplit: j({ turn: 1, leftHip: -90, rightHip: -90, leftAnkle: -45, rightAnkle: -45, leftShoulder: -150, rightShoulder: 150, leftElbow: 10, rightElbow: -10, ...q.happy })
}, ro = Object.keys(W);
function ye(e, t, n) {
  const s = { ...e };
  for (const i of ro) s[i] = e[i] + (t[i] - e[i]) * n;
  return s;
}
const es = 24, Ci = 4, Hi = 28, du = 40;
function pu(e, t = W, n = 1) {
  const s = Math.sin(e * Math.PI * 2) * n, i = Math.cos(e * Math.PI * 2) * n, r = (c) => c <= du, o = (c) => r(c) ? 22 * s : c, a = r(t.leftShoulder) ? t.leftElbow - Hi * Math.max(0, -s) : t.leftElbow, l = r(t.rightShoulder) ? t.rightElbow + Hi * Math.max(0, s) : t.rightElbow;
  return {
    ...t,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: t.lean + Ci * n,
    headTilt: t.headTilt - Ci * 0.5 * n,
    leftElbow: a,
    rightElbow: l,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -es * s,
    rightHip: -es * s,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, i),
    rightKnee: 30 * Math.max(0, -i),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: o(t.leftShoulder),
    rightShoulder: o(t.rightShoulder)
  };
}
function mu(e, t = 1) {
  return 4 * ((ns + Qe) * e) * Math.sin(es * t * Math.PI / 180);
}
function gu(e) {
  const t = Math.abs(Math.sin(e / 65)), n = 0.55 + 0.45 * Math.sin(e / 310);
  return t * n;
}
const oo = 0.12, $i = 0.46, yu = 1 - 2 * oo, bu = 0.1, wu = 0.21, vu = 0.19, ns = 0.24, Qe = 0.22, ao = 0.12, ku = 0.14, lo = 0.33, Ri = 0.7, Oi = 0.3, Su = 0.35, Mu = [1.7, 1.05], xu = [1.3, 0.75], Li = [1.45, 0.85], Tu = [1.15, 0.75], Fi = 0.06, Eu = 0.7, Au = 0.65, co = 0.075, Pu = 0.3, _u = 0.02, Iu = 0.012, Cu = 12, Hu = 0.25, Pe = 90, $u = 0.25, Ru = 0.04, ho = 0.01, xt = (e) => Math.min(1, Math.max(0, e ?? 0));
function W0(e, t = 1) {
  return Qe * e * t;
}
const ss = -0.12, uo = 0.4, tt = (e) => e * Math.PI / 180, Ou = (e, t) => ({ x: t * Math.sin(tt(e)), y: Math.cos(tt(e)) }), fo = (e, t) => Math.max(0, e) * (1 - Math.min(1, Math.max(0, t))), po = (e, t, n, s) => e - 0.3 * t - n * 0.14 * t - Math.max(0, s - 1) * 0.12 * t;
function Lu(e, t, n, s, i, r) {
  const o = Math.max(1, Math.min(r * 0.6, ku * n)), a = xt(t.turn), l = (ao + lo * a) * n, c = s + ss * n, h = l + t.lookX * 0.08 * n, u = t.lookY * 0.07 * n, f = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * n * (1 - Ri * a), squeeze: 1 - Ri * a, open: t.leftEye, brow: t.leftBrow, side: -1 },
    { x: 0.34 * n * (1 - Oi * a), squeeze: 1 - Oi * a, open: t.rightEye, brow: t.rightBrow, side: 1 }
  ];
  e.fillStyle = i, e.strokeStyle = i, e.lineWidth = o;
  for (const y of f) {
    const b = fo(y.open, t.blink);
    if (b < 0.2) {
      const x = t.smile > 0.5 ? -0.12 * n : 0.06 * n;
      e.beginPath(), e.moveTo(y.x + l - 0.12 * n, c), e.quadraticCurveTo(y.x + l, c + x, y.x + l + 0.12 * n, c), e.stroke();
    } else {
      if (b > 1.2) {
        const v = 0.13 * n * b;
        e.beginPath(), e.ellipse(y.x + l, c, v * 0.85, v, 0, 0, Math.PI * 2), e.fillStyle = "#ffffff", e.fill(), e.stroke(), e.fillStyle = i;
      }
      const x = b > 1.2 ? 0.075 * n : 0.1 * n;
      e.beginPath(), e.ellipse(y.x + h, c + u, x, x * 1.1 * Math.min(b, 1), 0, 0, Math.PI * 2), e.fill();
    }
    const w = po(c, n, y.brow, b), S = y.x + l - y.side * 0.13 * n * y.squeeze, k = y.x + l + y.side * 0.13 * n * y.squeeze;
    e.beginPath(), e.moveTo(k, w), e.lineTo(S, w - t.browTilt * 0.1 * n), e.stroke();
  }
  const d = s + uo * n, m = 0.25 * n * Math.max(0.3, t.mouthWidth) * (1 - Su * a), p = Math.min(1, Math.max(0, t.mouth));
  if (e.beginPath(), p <= 0.05) {
    e.moveTo(l - m, d), e.quadraticCurveTo(l, d + t.smile * 0.25 * n, l + m, d), e.stroke();
    return;
  }
  const g = 0.3 * n * p;
  t.smile > 0.3 ? (e.moveTo(l - m, d - 0.05 * n), e.lineTo(l + m, d - 0.05 * n), e.quadraticCurveTo(l, d + g * 2, l - m, d - 0.05 * n)) : t.smile < -0.3 ? (e.moveTo(l - m, d + g * 0.6), e.lineTo(l + m, d + g * 0.6), e.quadraticCurveTo(l, d - g * 1.4, l - m, d + g * 0.6)) : e.ellipse(l, d, m * 0.8, g, 0, 0, Math.PI * 2), e.fill();
}
function mo(e, t) {
  const n = t.height ?? 300, s = Math.min(3, Math.max(0.3, e.stretch ?? 1)), i = Math.sqrt(s), r = (t.headSize ?? 2 * oo) / 2, o = t.headSize === void 0 ? yu : 1 - 2 * r, a = r * n, l = xt(e.sit), c = e.leftHip + (-Pe - e.leftHip) * l, h = e.leftKnee + (-Pe - e.leftKnee) * l, u = e.rightHip + (Pe - e.rightHip) * l, f = e.rightKnee + (Pe - e.rightKnee) * l, d = t.classic === !0, m = xt(e.turn), p = ($, O, H, L, F) => {
    const D = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.abs(tt(O - H) / 2) + tt(L))), z = Math.max(-1, Math.min(1, Eu + F)), ft = m + (1 - m) * $ * z;
    return d ? { x: 0, y: 0 } : { x: Math.cos(D) * Fi * ft, y: Math.sin(D) * Fi };
  }, g = { left: e.leftAnkle ?? 0, right: e.rightAnkle ?? 0 }, y = { left: e.leftFootOut ?? 0, right: e.rightFootOut ?? 0 };
  let b = 0;
  if (l > 0 || !d) {
    const $ = (F, D, z, ft, vt) => ns * Math.cos(tt(D)) + Qe * Math.cos(tt(D - z)) + Math.max(0, p(F, D, z, ft, vt).y), O = Math.max(
      $(-1, c, h, g.left, y.left),
      $(1, u, f, g.right, y.right)
    ), H = 1 - xt((e.rise ?? 0) / Ru), L = (d ? Math.min(1, l / $u) : 1) * H;
    b = ($i - O) * L * n * s;
  }
  const w = -$i * n * s + b, S = -o * n * s + b, k = d ? 0 : (_u * xt(e.turn) + Iu * l) * n * s, x = tt(e.bend ?? 0), v = { end: Di(w, S, x, 1), bend: x };
  let E;
  if (x !== 0) {
    E = [];
    for (let $ = 0; $ <= Bi; $++) {
      const O = $ / Bi, H = Di(w, S, x, O);
      E.push({ x: H.x - k * Math.sin(Math.PI * O), y: H.y });
    }
  } else
    E = k === 0 ? [{ x: 0, y: w }, { x: 0, y: S }] : Vt({ x: 0, y: w }, { x: -k, y: (w + S) / 2 }, { x: 0, y: S }, 1, 8);
  const M = S + bu * n * s, A = (t.shoulderWidth ?? 0) * n * Math.cos(m * Math.PI / 2), T = ($, O, H, L, F) => {
    const D = Ou(H, L);
    return { x: $ + D.x * F * n, y: O + D.y * F * n };
  }, P = ($, O, H) => {
    const L = T(0, w, O, $, ns * s);
    return { root: { x: 0, y: w }, joint: L, end: T(L.x, L.y, O - H, $, Qe * s) };
  }, _ = ($, O, H) => {
    const L = { x: $ * A, y: M }, F = T(L.x, L.y, O, $, wu * i);
    return { root: L, joint: F, end: T(F.x, F.y, O + H, $, vu * i) };
  }, I = { left: P(-1, c, h), right: P(1, u, f) }, C = ($, O, H, L, F, D) => {
    const z = p($, H, L, F, D);
    return { x: O.end.x + z.x * n * s, y: O.end.y + z.y * n * s };
  }, R = ($, O, H, L, F) => T(O.end.x, O.end.y, H + L + F, $, co * i), B = {
    left: _(-1, e.leftShoulder, e.leftElbow),
    right: _(1, e.rightShoulder, e.rightElbow)
  };
  return {
    height: n,
    facing: (t.facing ?? 1) < 0 ? -1 : 1,
    stretch: s,
    lineWidth: t.lineWidth ?? n * 0.025,
    rubber: Math.min(1, Math.max(d ? 0 : Pu, t.rubber ?? 0)),
    r: a,
    // The head keeps its area: taller and narrower when stretched.
    headRx: a / Math.sqrt(s),
    headRy: a * Math.sqrt(s),
    hipY: w,
    neckY: S,
    drop: b,
    lean: d ? e.lean : e.lean + Cu * Math.sin(Math.PI * l),
    classic: d,
    legs: I,
    toes: {
      left: C(-1, I.left, c, h, g.left, y.left),
      right: C(1, I.right, u, f, g.right, y.right)
    },
    spine: E,
    chest: v,
    arms: B,
    handTips: {
      left: R(-1, B.left, e.leftShoulder, e.leftElbow, e.leftWrist ?? 0),
      right: R(1, B.right, e.rightShoulder, e.rightElbow, e.rightWrist ?? 0)
    }
  };
}
const Bi = 10;
function Di(e, t, n, s) {
  const i = e - t, r = n * s;
  if (Math.abs(n) < 1e-9) return { x: 0, y: e - i * s };
  const o = i / n;
  return { x: o * (1 - Math.cos(r)), y: e - o * Math.sin(r) };
}
function Fu(e, t) {
  if (e.chest.bend === 0) return t;
  const n = be(t, { x: 0, y: e.neckY }, e.chest.bend);
  return { x: n.x + e.chest.end.x, y: n.y + e.chest.end.y - e.neckY };
}
const re = (e, t) => t === 0 ? [e.root, e.joint, e.end] : Vt(e.root, e.joint, e.end, t);
function be(e, t, n) {
  const s = Math.cos(n), i = Math.sin(n), r = e.x - t.x, o = e.y - t.y;
  return { x: t.x + r * s - o * i, y: t.y + r * i + o * s };
}
function go(e, t, n = !0) {
  const s = Du(e, t), i = t.spin ?? 0, r = t.rise ?? 0;
  return n && (i !== 0 || r !== 0) ? Bu(s, e, i, r) : s;
}
function yo(e, t, n) {
  return { pivot: { x: 0, y: e.hipY }, angle: e.facing * tt(t), lift: n * e.height };
}
function Bu(e, t, n, s) {
  const { pivot: i, angle: r, lift: o } = yo(t, n, s), a = (f) => {
    const d = be(f, i, r);
    return { x: d.x, y: d.y - o };
  }, l = (f) => ({ left: a(f.left), right: a(f.right) }), c = { left: Math.max(a(e.feet.left).y, a(e.toes.left).y), right: Math.max(a(e.feet.right).y, a(e.toes.right).y) }, h = Math.max(c.left, c.right), u = ho * t.height;
  return {
    ...e,
    hip: a(e.hip),
    neck: a(e.neck),
    shoulders: l(e.shoulders),
    elbows: l(e.elbows),
    hands: l(e.hands),
    fingertips: l(e.fingertips),
    knees: l(e.knees),
    feet: l(e.feet),
    toes: l(e.toes),
    feetY: h,
    grounded: { left: c.left >= h - u, right: c.right >= h - u },
    handAngle: { left: e.handAngle.left + r, right: e.handAngle.right + r },
    limbs: {
      leftArm: e.limbs.leftArm.map(a),
      rightArm: e.limbs.rightArm.map(a),
      leftLeg: e.limbs.leftLeg.map(a),
      rightLeg: e.limbs.rightLeg.map(a),
      spine: e.limbs.spine.map(a)
    },
    head: { ...e.head, center: a(e.head.center), angle: e.head.angle + r }
  };
}
function Du(e, t) {
  const n = tt(e.lean), s = tt(t.headTilt), i = { x: 0, y: e.hipY }, r = (S) => ({ x: e.facing * S.x, y: S.y }), o = (S) => r(be(S, i, n)), a = (S) => o(Fu(e, S)), l = (S) => a(be({ x: S.x, y: S.y + e.neckY }, { x: 0, y: e.neckY }, s)), c = re(e.arms.left, e.rubber).map(a), h = re(e.arms.right, e.rubber).map(a), u = (S, k) => Math.atan2(k.y - S.y, k.x - S.x), f = { left: a(e.handTips.left), right: a(e.handTips.right) }, d = (S, k) => {
    const [x, v] = S.slice(-2), E = e.arms[k], M = u(a(E.end), f[k]) - u(a(E.joint), a(E.end));
    return u(x, v) + M;
  };
  let m = 1 / 0;
  for (const [S, k] of [
    [t.leftBrow, t.leftEye],
    [t.rightBrow, t.rightEye]
  ]) {
    const x = po(ss, 1, S, fo(k, t.blink));
    m = Math.min(m, x, x - t.browTilt * 0.1);
  }
  const p = { left: r(e.legs.left.end), right: r(e.legs.right.end) }, g = { left: r(e.toes.left), right: r(e.toes.right) }, y = { left: Math.max(p.left.y, g.left.y), right: Math.max(p.right.y, g.right.y) }, b = Math.max(y.left, y.right), w = ho * e.height;
  return {
    facing: e.facing,
    height: e.height,
    stretch: e.stretch,
    lineWidth: e.lineWidth,
    hip: i,
    neck: a({ x: 0, y: e.neckY }),
    shoulders: { left: a(e.arms.left.root), right: a(e.arms.right.root) },
    elbows: { left: a(e.arms.left.joint), right: a(e.arms.right.joint) },
    hands: { left: a(e.arms.left.end), right: a(e.arms.right.end) },
    knees: { left: r(e.legs.left.joint), right: r(e.legs.right.joint) },
    feet: p,
    toes: g,
    feetY: b,
    grounded: { left: y.left >= b - w, right: y.right >= b - w },
    fingertips: f,
    handAngle: { left: d(c, "left"), right: d(h, "right") },
    limbs: {
      leftArm: c,
      rightArm: h,
      leftLeg: re(e.legs.left, e.rubber).map(r),
      rightLeg: re(e.legs.right, e.rubber).map(r),
      spine: e.spine.map(o)
    },
    head: {
      center: l({ x: 0, y: -e.headRy }),
      rx: e.headRx,
      ry: e.headRy,
      // Mirroring a turn reverses it.
      angle: e.facing * (n + e.chest.bend + s),
      eyeY: ss,
      browTopY: m,
      mouthY: uo,
      faceX: e.facing * (ao + lo * xt(t.turn))
    }
  };
}
function Wu(e, t = {}) {
  return go(mo(e, t), e);
}
function N0(e, t, n) {
  return be({ x: e.center.x + t * e.rx, y: e.center.y + n * e.ry }, e.center, e.angle);
}
function Nu(e, t, n) {
  const s = (r) => ({ x: r.x + t, y: r.y + n }), i = (r) => ({ left: s(r.left), right: s(r.right) });
  return {
    ...e,
    hip: s(e.hip),
    neck: s(e.neck),
    shoulders: i(e.shoulders),
    elbows: i(e.elbows),
    hands: i(e.hands),
    knees: i(e.knees),
    feet: i(e.feet),
    toes: i(e.toes),
    feetY: e.feetY + n,
    grounded: { ...e.grounded },
    handAngle: { ...e.handAngle },
    limbs: {
      leftArm: e.limbs.leftArm.map(s),
      rightArm: e.limbs.rightArm.map(s),
      leftLeg: e.limbs.leftLeg.map(s),
      rightLeg: e.limbs.rightLeg.map(s),
      spine: e.limbs.spine.map(s)
    },
    head: { ...e.head, center: s(e.head.center) }
  };
}
function Ku(e, t, n = {}, s = 0) {
  const i = mo(t, n), r = n.color ?? "#1e293b", o = n.layers ?? {}, a = n.layers ? go(i, t, !1) : void 0, l = n.sketch ? Jn(e, n.sketch, s) : void 0, c = n.sketch && n.layers ? Jn(e, n.sketch, s) : void 0, h = (v) => {
    e.save(), v(), e.restore();
  }, u = (v) => {
    v && a && h(() => v(e, a, s, c));
  }, f = () => e.scale(i.facing, 1), d = () => {
    f(), e.translate(0, i.hipY), e.rotate(tt(i.lean)), e.translate(0, -i.hipY);
  }, m = () => {
    d(), i.chest.bend !== 0 && (e.translate(i.chest.end.x, i.chest.end.y), e.rotate(i.chest.bend), e.translate(0, -i.neckY));
  }, p = (v, E, M) => {
    if (l) return E ? l.curve(v) : l.line(v);
    if (i.classic) {
      e.beginPath(), e.moveTo(v[0].x, v[0].y);
      for (const A of v.slice(1)) e.lineTo(A.x, A.y);
      e.stroke();
      return;
    }
    Ms(e, v, M[0] * i.lineWidth, M[1] * i.lineWidth);
  }, g = (v, E) => p(re(v, i.rubber), i.rubber > 0, E), y = (v) => {
    i.classic || p([i.legs[v].end, i.toes[v]], !1, Tu);
  }, b = (v) => {
    if (n.hands && !i.classic) return S(v);
    if (i.classic || l) return;
    const E = i.arms[v].end;
    e.beginPath(), e.arc(E.x, E.y, Au * i.lineWidth, 0, Math.PI * 2), e.fill();
  };
  e.save(), e.strokeStyle = r, e.fillStyle = r, e.lineWidth = i.lineWidth, e.lineCap = "round", e.lineJoin = "round";
  const w = yo(i, t.spin ?? 0, t.rise ?? 0);
  (w.angle !== 0 || w.lift !== 0) && (e.translate(0, -w.lift), e.translate(w.pivot.x, w.pivot.y), e.rotate(w.angle), e.translate(-w.pivot.x, -w.pivot.y));
  function S(v) {
    const E = n.hands ?? {}, M = i.arms[v].end, A = i.handTips[v], T = n.headFill ?? "#ffffff";
    xs(e, M, E[v] ?? K, {
      side: v,
      // Degrees clockwise from straight up, in the frame the hand is drawn in.
      angle: Math.atan2(A.x - M.x, M.y - A.y) * 180 / Math.PI,
      size: (E.size ?? co) * i.height * Math.sqrt(i.stretch),
      skin: E.skin ?? (T === "none" ? void 0 : T),
      ink: r,
      lineWidth: i.lineWidth * 0.45,
      fingers: E.fingers,
      plump: E.plump,
      look: n.sketch ? "pencil" : "clean",
      seed: n.sketch?.seed
    }, s);
  }
  const k = (v) => {
    h(() => {
      m(), g(i.arms[v], xu), b(v);
    });
    const E = o.sleeve;
    E && a && h(() => E(e, a, v, s, c));
  }, x = xt(t.turn) > Hu;
  u(o.behind), h(() => {
    f(), g(i.legs.left, Li), y("left"), g(i.legs.right, Li), y("right");
  }), x && k("left"), h(() => {
    d(), p(i.spine, i.spine.length > 2, Mu);
  }), h(() => {
    m();
    const { left: v, right: E } = { left: i.arms.left.root, right: i.arms.right.root };
    if (v.x !== E.x)
      if (i.classic) p([v, E], !1, [1, 1]);
      else {
        const M = { x: (v.x + E.x) / 2, y: v.y - 0.3 * Math.abs(E.x - v.x) };
        p(Vt(v, M, E, 1, 8), !0, [1.1, 1.1]);
      }
  }), u(o.body), x || k("left"), k("right"), u(o.behindHead), h(() => {
    m(), e.translate(0, i.neckY), e.rotate(tt(t.headTilt));
    const v = -i.headRy;
    e.beginPath(), e.ellipse(0, v, i.headRx, i.headRy, 0, 0, Math.PI * 2);
    const E = n.headFill ?? "#ffffff";
    if (E !== "none" && (e.fillStyle = E, e.fill()), l) {
      l.ellipse(0, v, i.headRx, i.headRy);
      const M = l.nudge();
      e.translate(M.x, M.y);
    } else
      e.stroke();
    e.translate(0, v), e.scale(i.headRx / i.r, i.headRy / i.r), Lu(e, t, i.r, 0, r, i.lineWidth);
  }), u(o.overHead), u(o.front), e.restore(), n.label && (e.save(), e.fillStyle = r, e.font = n.labelFont ?? `700 ${Math.round(i.height * 0.11)}px sans-serif`, e.textAlign = "center", e.textBaseline = "bottom", e.fillText(n.label, 0, -i.height * i.stretch - 0.04 * i.height + i.drop), e.restore());
}
function bo(e, t, n) {
  const s = { ...e };
  let i = e.walking > 0 ? ye(s, uu(e.gait, e.walk, s), e.walking) : s, r = Xu(e);
  const o = e.dancing ?? 0;
  if (n && o > 0) {
    const a = n(e.beat ?? 0);
    if (i = ye(i, a.pose, o), a.hands) {
      const l = (c, h) => h ? ge(c ?? K, h, o) : c;
      r = { left: l(r?.left, a.hands.left), right: l(r?.right, a.hands.right) };
    }
  }
  return e.talk > 0 && (i = { ...i, mouth: Math.max(i.mouth, e.talk * gu(t)) }), { pose: i, hands: r };
}
function Yu(e, t, n) {
  return bo(e, t, n).pose;
}
const wo = (e, t) => (e.facing ?? t.facing ?? 1) < 0 ? -1 : 1, tn = (e, t) => `hand.${e}.${t}`;
function Xu(e) {
  const t = (i) => {
    if (typeof e[tn(i, "spread")] == "number")
      return Object.fromEntries(Object.keys(K).map((r) => [r, e[tn(i, r)]]));
  }, n = t("left"), s = t("right");
  return n || s ? { left: n, right: s } : void 0;
}
function qu(e, t) {
  return !t || !e.hands ? e : { ...e, hands: { ...e.hands, left: t.left ?? e.hands.left, right: t.right ?? e.hands.right } };
}
function K0(e) {
  const t = e.style ?? {}, n = t.height ?? 300, s = n * 0.8, i = { ...j(e.pose ?? {}), walk: 0, walking: 0, gait: "walk", facing: (t.facing ?? 1) < 0 ? -1 : 1, talk: 0, rubber: t.rubber ?? 0, beat: 0, dancing: 0 }, r = {};
  if (t.hands)
    for (const o of ["left", "right"]) {
      const a = t.hands[o] ?? K;
      for (const l of Object.keys(K)) r[tn(o, l)] = a[l] ?? K[l];
    }
  return {
    type: "custom",
    x: e.x - s / 2,
    y: e.y - n,
    width: s,
    height: n,
    props: { ...i, ...r },
    figureStyle: t,
    figureDance: e.dance,
    draw(o, a, l) {
      const c = a.props, h = bo(c, l, e.dance);
      o.translate(s / 2, n), Ku(o, h.pose, qu({ ...t, rubber: c.rubber, facing: wo(c, t) }, h.hands), l);
    }
  };
}
function Vu(e, t, n) {
  const s = e.figureStyle;
  if (!s) throw new Error("stickFigureAt: the target was not made by stickFigureTarget");
  const i = { ...e.props };
  let r = 0, o = 0;
  for (const [c, h] of t.state?.values.get(n) ?? [])
    c === "gait" && typeof h == "string" && (i.gait = h), typeof h == "number" && (c === "x" || c === "motionPathX" ? r = h : c === "y" || c === "motionPathY" ? o = h : c in i && (i[c] = h));
  const a = Yu(i, t.time, e.figureDance), l = Wu(a, { ...s, rubber: i.rubber, facing: wo(i, s) });
  return { pose: a, joints: Nu(l, e.x + r + e.width / 2, e.y + o + e.height) };
}
function vo(e) {
  const t = [];
  return e.forEach((n, s) => {
    const i = s === 0 ? W : t[s - 1], r = typeof n.pose == "string" ? Me[n.pose] : { ...i, ...n.pose };
    t.push(n.expression ? Ze(r, n.expression) : r);
  }), t;
}
function Y0(e, t) {
  const n = vo(t);
  return ro.filter((s) => n.some((i) => i[s] !== W[s])).map((s) => ({
    id: `${e}-${s}`,
    target: e,
    property: s,
    keyframes: t.map((i, r) => ({
      time: i.time,
      value: n[r][s],
      ...i.easing ? { easing: i.easing } : {}
    }))
  }));
}
const Pn = 0.5, Wi = {
  /** Flag: fingers together and straight, thumb bent in */
  pataka: N({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Pataka with the ring finger bent */
  tripataka: N({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 1, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Lotus in bloom: fingers fanned, each a little more curled than the last */
  alapadma: N({ "thumb.curl": 0.1, "thumb.across": 0, "index.curl": 0.05, "middle.curl": 0.15, "ring.curl": 0.25, "pinky.curl": 0.35, spread: 1, turn: 2 }),
  /** Fist */
  mushti: V.fist,
  /** Fist, thumb up */
  shikhara: V.thumbsUp,
  /** Swan's beak: thumb and index touch, the others fanned */
  hamsasya: N({ "thumb.curl": 0.15, "thumb.across": 0.6, "index.curl": 0.6, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0.7, turn: 2 }),
  /** Bracelet: thumb, index and middle meet, ring and little finger out */
  katakamukha: N({ "thumb.curl": 0.2, "thumb.across": 0.6, "index.curl": 0.65, "middle.curl": 0.7, "ring.curl": 0, "pinky.curl": 0, spread: 0.4, turn: 2 })
};
function en(e) {
  return typeof e != "string" ? e : e in Wi ? Wi[e] : V[e];
}
function ko(e, t, n) {
  const s = [];
  for (const i of e.keys) {
    const r = s[s.length - 1], o = !r || i.reset ? { pose: t, ...n } : r;
    s.push({
      beat: i.beat,
      pose: { ...o.pose, ...i.pose },
      left: i.hands?.left ? en(i.hands.left) : o.left,
      right: i.hands?.right ? en(i.hands.right) : o.right,
      easing: i.easing ?? e.easing
    });
  }
  return s;
}
const Ts = (e, t) => (e % t + t) % t;
function Uu(e, t, n, s) {
  const i = ko(e, n, s);
  if (i.length === 0) return { pose: n, hands: s };
  const r = Ts(t, e.beats);
  let o = i.length - 1;
  for (let d = 0; d < i.length; d++) i[d].beat <= r && (o = d);
  const a = i[o], l = i[(o + 1) % i.length], c = a.beat <= r ? a.beat : a.beat - e.beats, h = l.beat > c ? l.beat : l.beat + e.beats, u = h > c ? (r - c) / (h - c) : 0, f = Z(l.easing ?? "ease-in-out")(Math.min(1, Math.max(0, u)));
  return {
    pose: ye(a.pose, l.pose, f),
    hands: { left: ge(a.left, l.left, f), right: ge(a.right, l.right, f) }
  };
}
const zu = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftWrist", "rightWrist"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
  ["leftAnkle", "rightAnkle"],
  ["leftFootOut", "rightFootOut"],
  ["leftEye", "rightEye"],
  ["leftBrow", "rightBrow"]
], ju = ["lean", "headTilt", "lookX", "spin"], Gu = /* @__PURE__ */ new Set(["leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee"]);
function Ju(e) {
  const t = { ...e }, n = (e.turn ?? 0) >= 0.5;
  for (const [s, i] of zu) {
    const r = n && Gu.has(s) ? -1 : 1;
    t[s] = r * e[i], t[i] = r * e[s];
  }
  if (!n) for (const s of ju) t[s] = -e[s];
  return t;
}
const Zu = (e) => Math.min(1, Math.max(-1, (0.5 - e) * 4));
function Qu(e, t, n) {
  const s = Ts(n, 1), i = (1 + Math.cos(2 * Math.PI * s)) / 2, r = t.bounce * (t.accent === "up" ? 1 - i : i), o = Math.min(1, Math.max(0, e.turn ?? 0)), a = Zu(o);
  return {
    ...e,
    leftHip: e.leftHip + a * r / 2,
    rightHip: e.rightHip + r / 2,
    leftKnee: e.leftKnee + a * r,
    rightKnee: e.rightKnee + r,
    lean: e.lean + (t.sway ?? 0) * (1 - o) * Math.sin(Math.PI * n)
  };
}
function is(e) {
  const t = { ...W, ...e.stance };
  return e.expression ? Ze(t, e.expression) : t;
}
function So(e) {
  return {
    left: e.hands?.left ? en(e.hands.left) : K,
    right: e.hands?.right ? en(e.hands.right) : K
  };
}
function _n(e, t, n) {
  const s = e.moves[t.move];
  if (!s) throw new Error(`dance: "${e.label}" has no move "${t.move}"`);
  const i = Uu(s, n, is(e), So(e));
  return t.mirror ? { pose: Ju(i.pose), hands: { left: i.hands?.right, right: i.hands?.left } } : i;
}
function Es(e, t, n = {}) {
  const s = typeof e == "string" ? Ut[e] : e;
  let i;
  if (n.move)
    i = _n(s, { move: n.move, mirror: n.mirror }, t);
  else {
    const r = s.routine, o = r.reduce((u, f) => u + f.beats, 0), a = Ts(t, o);
    let l = 0, c = 0;
    for (; c < r.length - 1 && a >= l + r[c].beats; ) l += r[c++].beats;
    const h = a - l;
    if (i = _n(s, r[c], h), h < Pn && r.length > 1 && t >= Pn) {
      const u = r[(c - 1 + r.length) % r.length], f = _n(s, u, u.beats + h), d = Z("ease-in-out")(h / Pn);
      i = {
        pose: ye(f.pose, i.pose, d),
        hands: { left: ge(f.hands.left, i.hands.left, d), right: ge(f.hands.right, i.hands.right, d) }
      };
    }
  }
  return { ...i, pose: Qu(i.pose, s.groove, t) };
}
function X0(e, t, n = {}) {
  return Es(e, t, n).pose;
}
function As(e) {
  return (typeof e == "string" ? Ut[e] : e).routine.reduce((n, s) => n + s.beats, 0);
}
const tf = { leftToe: "rightToe", rightToe: "leftToe", leftHeel: "rightHeel", rightHeel: "leftHeel" };
function Ni(e, t, n, s, i, r, o) {
  for (let a = 0; a * e.beats < n; a++)
    for (const l of e.keys) {
      const c = a * e.beats + l.beat, h = t + c;
      if (!(c >= n || h < r || h >= o))
        for (const u of l.taps ?? []) i.push({ beat: h, tap: s ? tf[u] : u });
    }
}
function q0(e, t, n, s = {}) {
  const i = typeof e == "string" ? Ut[e] : e, r = [];
  if (n <= t) return r;
  if (s.move) {
    const o = i.moves[s.move], a = Math.floor(t / o.beats) * o.beats;
    Ni(o, a, Math.ceil((n - a) / o.beats) * o.beats, s.mirror, r, t, n);
  } else {
    const o = As(i);
    for (let a = Math.floor(t / o) * o; a < n; a += o) {
      let l = a;
      for (const c of i.routine)
        Ni(i.moves[c.move], l, c.beats, c.mirror, r, t, n), l += c.beats;
    }
  }
  return r.sort((o, a) => o.beat - a.beat);
}
function Ki(e, t) {
  const n = e.moves[t.move];
  if (!n?.travel) return 0;
  const s = n.travel / n.beats;
  return t.mirror ? (ko(n, is(e), So(e))[0]?.pose.turn ?? is(e).turn ?? 0) >= 0.5 ? s : -s : s;
}
function Mo(e, t) {
  return t.move ? [{ move: t.move, beats: e.moves[t.move].beats, mirror: t.mirror }] : e.routine;
}
function In(e, t, n = {}) {
  const s = typeof e == "string" ? Ut[e] : e, i = Mo(s, n), r = i.reduce((h, u) => h + u.beats, 0), o = i.reduce((h, u) => h + Ki(s, u) * u.beats, 0), a = Math.floor(t / r);
  let l = a * o, c = t - a * r;
  for (const h of i) {
    const u = Math.min(h.beats, c);
    if (l += Ki(s, h) * u, c -= u, c <= 0) break;
  }
  return l;
}
function ef(e, t, n) {
  const s = Mo(e, n), i = [0];
  let r = 0;
  for (let o = 0; r < t; o = (o + 1) % s.length)
    r += s[o].beats, i.push(Math.min(r, t));
  return i;
}
const nf = 8;
function sf(e, t, n) {
  const s = typeof t == "string" ? Ut[t] : t, i = n.bpm ?? s.bpm, r = n.beats ?? (n.move ? s.moves[n.move].beats : As(s)), o = ef(s, r, n);
  if (o.every((y) => In(s, y, n) === 0)) return;
  const a = Math.min(n.fade ?? 1, r / 2), l = Z("ease-in-out"), c = (y) => a <= 0 ? 1 : Math.min(l(Math.min(1, y / a)), l(Math.min(1, (r - y) / a))), h = Math.ceil(a * nf), u = a <= 0 ? [] : Array.from({ length: h + 1 }, (y, b) => [b / h * a, r - b / h * a]).flat(), f = [.../* @__PURE__ */ new Set([...o, ...u])].sort((y, b) => y - b);
  let d = 0;
  const m = f.map((y, b) => {
    if (b > 0) {
      const w = f[b - 1], S = Math.max(1, Math.ceil((y - w) * 16));
      for (let k = 0; k < S; k++) {
        const x = w + (y - w) * k / S, v = w + (y - w) * (k + 1) / S;
        d += (In(s, v, n) - In(s, x, n)) * c((x + v) / 2);
      }
    }
    return { beat: y, travel: d };
  }), p = n.start ?? 0, g = n.x ?? 0;
  return {
    id: `${e}-x`,
    target: e,
    property: "x",
    keyframes: m.map((y) => ({ time: p + y.beat * 6e4 / i, value: g + n.height * y.travel, easing: "linear" }))
  };
}
function V0(e, t, n = 0) {
  return (e - n) * t / 6e4;
}
function U0(e, t = {}) {
  return (n) => Es(e, n, t);
}
function z0(e, t) {
  const n = t.start ?? 0, s = 6e4 / t.bpm, i = n + t.beats * s, r = Math.min((t.fade ?? 1) * s, (i - n) / 2);
  return [
    {
      id: `${e}-beat`,
      target: e,
      property: "beat",
      keyframes: [
        { time: n, value: 0 },
        { time: i, value: t.beats, easing: "linear" }
      ]
    },
    {
      id: `${e}-dancing`,
      target: e,
      property: "dancing",
      keyframes: [
        { time: n, value: 0 },
        { time: n + r, value: 1, easing: "ease-in-out" },
        { time: i - r, value: 1 },
        { time: i, value: 0, easing: "ease-in-out" }
      ]
    }
  ];
}
function j0(e, t, n = {}) {
  const s = typeof t == "string" ? Ut[t] : t, i = n.bpm ?? s.bpm, r = n.beats ?? (n.move ? s.moves[n.move].beats : As(s)), o = n.samplesPerBeat ?? 4, a = n.start ?? 0, l = Math.round(r * o), c = Array.from({ length: l + 1 }, (p, g) => {
    const y = g / o;
    return { time: a + y * 6e4 / i, frame: Es(s, y, n) };
  }), h = (p, g) => ({
    id: `${e}-${p}`,
    target: e,
    property: p,
    keyframes: c.map((y) => ({ time: y.time, value: g(y.frame) }))
  }), f = Object.keys(W).filter((p) => c.some((g) => g.frame.pose[p] !== c[0].frame.pose[p]) || c[0].frame.pose[p] !== W[p]).map((p) => h(p, (g) => g.pose[p])), d = n.height === void 0 ? void 0 : sf(e, s, { ...n, bpm: i, beats: r, start: a, height: n.height, fade: 0 });
  if (d && f.push(d), n.hands === !1) return f;
  const m = [];
  for (const p of ["left", "right"])
    for (const g of Object.keys(K)) {
      const y = (b) => b.hands?.[p]?.[g] ?? K[g];
      c.some((b) => y(b.frame) !== K[g]) && m.push(h(tn(p, g), y));
    }
  return [...f, ...m];
}
const he = { type: "back", mode: "out", overshoot: 1.1 }, G = "ease-out-cubic", rf = {
  label: "Disco",
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 6, rightKnee: 6 },
  expression: { smile: 0.9, mouth: 0.15, leftBrow: 0.3, rightBrow: 0.3 },
  groove: { bounce: 10, accent: "down", sway: 2 },
  moves: {
    point: {
      label: "The point",
      beats: 2,
      easing: G,
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
        { beat: 0, pose: { lean: -10, rightHip: 22, leftHip: 4, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: G },
        { beat: 1, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: "flat", right: "flat" } },
        { beat: 2, pose: { lean: 10, rightHip: 4, leftHip: 22, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: G },
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
}, of = {
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
}, af = {
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
        { beat: 0, pose: { rightHip: -24, rightKnee: 10, leftHip: 10, leftShoulder: 80, leftElbow: 40, rightShoulder: 55, rightElbow: -50, lean: 6, headTilt: -6 }, easing: G },
        { beat: 1, reset: !0, pose: { leftHip: 18, rightHip: 18 } },
        { beat: 2, pose: { leftHip: -24, leftKnee: 10, rightHip: 10, rightShoulder: 80, rightElbow: 40, leftShoulder: 55, leftElbow: -50, lean: -6, headTilt: 6 }, easing: G },
        { beat: 3, reset: !0, pose: { leftHip: 18, rightHip: 18 } }
      ]
    },
    kick: {
      label: "Kick out",
      beats: 2,
      keys: [
        { beat: 0, pose: { rightHip: 72, rightKnee: 4, rightAnkle: -20, leftHip: 4, lean: -12, leftShoulder: 100, leftElbow: 20 }, easing: G },
        { beat: 1, reset: !0 }
      ]
    },
    freeze: {
      label: "B-boy stance",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 26, leftElbow: -122, rightShoulder: 22, rightElbow: -118, leftHip: 18, rightHip: 18, leftKnee: 6, rightKnee: 6, lean: -4, headTilt: 10, smile: 0.6, leftEye: 0.6, rightEye: 0.6 }, easing: he },
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
}, lf = {
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
      keys: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75].map((e, t) => ({
        beat: e,
        // The hands shimmer: the wrists flick a little each quarter beat.
        pose: { leftShoulder: 128, rightShoulder: 128, leftElbow: 8, rightElbow: 8, leftWrist: t % 2 ? 4 : 26, rightWrist: t % 2 ? 26 : 4, leftHip: 16, rightHip: 16, leftKnee: e < 1 ? 26 : 8, rightKnee: e < 1 ? 26 : 8 },
        hands: t === 0 ? { left: { ...V.spread, turn: 2 }, right: { ...V.spread, turn: 2 } } : void 0
      }))
    },
    kickBallChange: {
      label: "Kick ball change",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 88, rightKnee: 0, rightAnkle: 55, leftHip: 4, lean: -12, leftShoulder: 112, rightShoulder: 112, leftWrist: 15, rightWrist: 15 }, hands: { left: "flat", right: "flat" }, easing: G },
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
}, cf = {
  label: "K-pop",
  bpm: 125,
  stance: { leftHip: 9, rightHip: 9, leftKnee: 4, rightKnee: 4 },
  expression: "happy",
  groove: { bounce: 5, accent: "down" },
  moves: {
    pointCombo: {
      label: "Point combo",
      beats: 4,
      easing: he,
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
        { beat: 0, reset: !0, pose: { leftShoulder: 165, rightShoulder: 165, leftElbow: 46, rightElbow: 46, headTilt: -8, lean: -4 }, hands: { left: "cupped", right: "cupped" }, easing: he },
        { beat: 1, pose: { headTilt: 8, lean: 4 } },
        { beat: 2, reset: !0, pose: { rightShoulder: 32, rightElbow: 112, rightWrist: 10, leftShoulder: 20, leftElbow: -30, headTilt: 10, leftEye: 0, smile: 1 }, hands: { right: "pinch", left: "relaxed" }, easing: he },
        { beat: 3, pose: { headTilt: 4 } }
      ]
    },
    isolations: {
      label: "Isolations",
      beats: 2,
      easing: G,
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
}, hf = {
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
        { beat: 0, reset: !0, pose: { rightShoulder: 160, rightElbow: 12, rightWrist: -15, leftShoulder: 40, leftElbow: -12, leftWrist: -45, lean: -4, rightHip: 16, lookX: 0.5, lookY: -0.6 }, hands: { right: { ...V.cupped, roll: -30 }, left: { ...V.flat, turn: 0 } } },
        { beat: 0.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...V.cupped, roll: 30 } } },
        { beat: 1, pose: { rightWrist: -15, rightElbow: 12, leftWrist: -45, lean: -4, rightHip: 16, leftHip: 6 }, hands: { right: { ...V.cupped, roll: -30 } } },
        { beat: 1.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...V.cupped, roll: 30 } } }
      ]
    },
    thumka: {
      label: "Thumka",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { lean: -11, rightHip: 22, leftHip: 2, leftKnee: 14, rightShoulder: 45, rightElbow: -105, leftShoulder: 128, leftElbow: 18, leftWrist: 35, headTilt: 10, lookX: -0.5 }, hands: { right: "fist", left: { ...V.open, turn: 2 } }, easing: G },
        { beat: 0.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } },
        { beat: 1, pose: { lean: -11, rightHip: 22, headTilt: 10 }, easing: G },
        { beat: 1.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } }
      ]
    },
    flick: {
      label: "Cross and flick",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26 }, hands: { left: "fist", right: "fist" } },
        { beat: 1, pose: { leftShoulder: 132, rightShoulder: 132, leftElbow: 0, rightElbow: 0, leftWrist: 30, rightWrist: 30, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10, stretch: 1.03 }, hands: { left: "spread", right: "spread" }, easing: G },
        { beat: 2, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftWrist: 0, rightWrist: 0, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26, stretch: 1 }, hands: { left: "fist", right: "fist" } },
        { beat: 3, pose: { leftShoulder: 62, rightShoulder: 62, leftElbow: 0, rightElbow: 0, leftWrist: 35, rightWrist: 35, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10 }, hands: { left: "spread", right: "spread" }, easing: G }
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
}, uf = {
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
}, ff = { leftHip: 42, rightHip: 42, leftKnee: 82, rightKnee: 82, leftFootOut: 0.3, rightFootOut: 0.3 }, df = {
  label: "Bharatanatyam",
  bpm: 80,
  // Natyarambhe: arms out at shoulder height, hands raised in pataka.
  stance: { ...ff, leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0, leftWrist: 75, rightWrist: 75 },
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
}, pf = {
  label: "Charleston",
  bpm: 150,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 10, rightKnee: 10, leftShoulder: 30, rightShoulder: 30, leftElbow: 20, rightElbow: 20 },
  expression: { mouth: 0.4, smile: 1, leftBrow: 0.5, rightBrow: 0.5 },
  hands: { left: { ...V.spread, turn: 2 }, right: { ...V.spread, turn: 2 } },
  groove: { bounce: 8, accent: "down" },
  moves: {
    basic: {
      label: "Kick forward, kick back",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 48, rightKnee: 8, rightAnkle: 45, leftShoulder: 75, rightShoulder: 15, leftElbow: 30, rightElbow: -10, lean: -7, headTilt: -5 }, easing: G },
        { beat: 1, reset: !0 },
        { beat: 2, reset: !0, pose: { leftHip: 18, leftKnee: 85, leftAnkle: 35, rightShoulder: 75, leftShoulder: 15, rightElbow: 30, leftElbow: -10, lean: 7, headTilt: 5 }, easing: G },
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
}, mf = {
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
        { beat: 1, pose: { rightShoulder: 135, leftShoulder: 125, leftElbow: 0, rightElbow: 0, leftWrist: 0, rightWrist: 30, rightKnee: 8, leftKnee: -8, rightHip: 4, leftHip: -4 }, hands: { left: { ...V.spread, turn: 2 }, right: { ...V.spread, turn: 2 } } },
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
}, gf = {
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
          easing: he
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
}, Ut = {
  disco: rf,
  hipHop: of,
  breaking: af,
  jazz: lf,
  kpop: cf,
  bollywood: hf,
  bhangra: uf,
  bharatanatyam: df,
  charleston: pf,
  tap: mf,
  popping: gf
}, nn = (e) => Math.min(1, Math.max(0, e));
function yf(e) {
  const t = { ...W, turn: e.view }, n = [];
  for (const s of e.keys) {
    const i = n[n.length - 1], r = !i || s.reset ? t : i.pose;
    n.push({ at: s.at, pose: { ...r, ...s.pose }, easing: s.easing });
  }
  return n;
}
function bf(e) {
  return e - wf * Math.sin(2 * Math.PI * e) / (2 * Math.PI);
}
const wf = 0.5;
function vf(e, t) {
  if (!(t <= e.takeoff || t >= e.landing))
    return (t - e.takeoff) / (e.landing - e.takeoff);
}
function kf(e, t) {
  const n = typeof e == "string" ? Ps[e] : e, s = yf(n), i = nn(t);
  let r = 0;
  for (let u = 0; u < s.length; u++) s[u].at <= i && (r = u);
  const o = s[r], a = s[Math.min(r + 1, s.length - 1)], l = a.at > o.at ? (i - o.at) / (a.at - o.at) : 0, c = ye(o.pose, a.pose, Z(a.easing ?? "ease-in-out")(nn(l))), h = vf(n, i);
  return h === void 0 ? { ...c, spin: 0, rise: 0 } : {
    ...c,
    spin: n.spin * bf(h),
    rise: 4 * n.height * h * (1 - h)
  };
}
function Sf(e, t, n) {
  const s = typeof e == "string" ? Ps[e] : e, i = nn(t), r = nn((i - s.takeoff) / (s.landing - s.takeoff));
  return s.travel * n * r;
}
function G0(e, t, n = {}) {
  const s = typeof t == "string" ? Ps[t] : t, i = n.start ?? 0, r = n.duration ?? s.duration, o = n.samples ?? 48, a = Array.from({ length: o + 1 }, (h, u) => {
    const f = u / o;
    return { time: i + f * r, progress: f, pose: kf(s, f) };
  }), c = Object.keys(W).filter((h) => a.some((u) => u.pose[h] !== W[h])).map((h) => ({
    id: `${e}-${h}`,
    target: e,
    property: h,
    keyframes: a.map((u) => ({ time: u.time, value: u.pose[h] }))
  }));
  if (n.height !== void 0 && s.travel !== 0) {
    const h = (n.facing ?? 1) < 0 ? -1 : 1;
    c.push({
      id: `${e}-x`,
      target: e,
      property: "x",
      keyframes: a.map((u) => ({ time: u.time, value: (n.x ?? 0) + h * Sf(s, u.progress, n.height) }))
    });
  }
  return c;
}
const Mf = {
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
}, xf = {
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
}, _e = {
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
}, Tf = {
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
}, Ef = {
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
function Ht(e, t, n, s, i, r = 1300) {
  return {
    label: e,
    view: 1,
    spin: t,
    height: n,
    travel: s,
    takeoff: 0.27,
    landing: 0.8,
    duration: r,
    keys: [
      { at: 0, reset: !0 },
      { at: 0.16, pose: Mf },
      { at: 0.27, pose: xf, easing: "ease-out-quad" },
      ...i,
      { at: 0.76, pose: Tf },
      { at: 0.86, pose: Ef, easing: "ease-out-quad" },
      { at: 1, reset: !0 }
    ]
  };
}
const Ps = {
  frontFlip: Ht("Front flip (tuck)", 360, 0.56, 0.35, [
    { at: 0.38, pose: _e, easing: "ease-out-cubic" },
    { at: 0.64, pose: _e }
  ]),
  backFlip: Ht("Back flip (tuck)", -360, 0.58, -0.15, [
    { at: 0.36, pose: { ..._e, lean: 18 }, easing: "ease-out-cubic" },
    { at: 0.64, pose: { ..._e, lean: 18 } }
  ]),
  layout: Ht("Back layout (straight body)", -360, 0.66, -0.2, [
    // Arched, arms overhead, legs together and long.
    { at: 0.4, pose: { leftHip: 8, rightHip: -8, leftKnee: 0, rightKnee: 0, leftAnkle: 60, rightAnkle: 60, leftShoulder: -178, rightShoulder: 178, lean: -18, headTilt: -14 } },
    { at: 0.64, pose: { leftHip: -4, rightHip: 4, lean: -6, headTilt: -4, leftShoulder: -150, rightShoulder: 150 } }
  ], 1400),
  scissorFlip: Ht("Scissor flip", 360, 0.6, 0.45, [
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
  splitLeap: Ht("Split leap (grand jeté)", 0, 0.36, 0.9, [
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
  backHandspring: Ht("Back handspring", -360, 0.16, -0.7, [
    // Arms reach back overhead to the ground, legs snap over.
    { at: 0.38, pose: { leftHip: 10, rightHip: -10, leftKnee: 0, rightKnee: 0, leftShoulder: -178, rightShoulder: 178, lean: -26, headTilt: -20 } },
    { at: 0.6, pose: { leftHip: -40, rightHip: 40, leftKnee: -20, rightKnee: 20, lean: 6, headTilt: 0 } }
  ], 1200)
}, Cn = 0.215, Hn = 0.205, Af = 0.065, Yi = 0.035, Pf = 0.165, _f = 0.155, If = 12, Cf = (e) => e * Math.PI / 180, U = {
  turn: 0,
  lean: 0,
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
function nt(e = {}) {
  return { ...U, ...e };
}
const Hf = /* @__PURE__ */ new Set(["turn", "side", "head.turn", "head.tilt", "roll", "lookX"]);
function J0(e) {
  const t = {};
  for (const [n, s] of Object.entries(e)) {
    const i = n.replace(/(^|\.)(left|right)(\.|$)/, (r, o, a, l) => `${o}${a === "left" ? "right" : "left"}${l}`);
    t[i] = Hf.has(n) ? -s : s;
  }
  return t;
}
function Q(e, t) {
  const n = {};
  for (const s of ["left", "right"]) for (const [i, r] of Object.entries(t)) n[`${e}.${s}.${i}`] = r;
  return n;
}
const $f = {
  rest: U,
  wave: nt({ "arm.right.spread": 115, "arm.right.bend": 55, "arm.right.elbow": 0, "head.tilt": -6, smile: 0.9 }),
  cheer: nt({ ...Q("arm", { spread: 140, bend: 20, elbow: 0 }), mouth: 0.6, smile: 1, "eye.left": 0, "eye.right": 0 }),
  point: nt({ "arm.right.spread": 88, "arm.right.elbow": 0, "arm.right.bend": 0, "head.turn": -20, smile: 0.4 }),
  handsOnHips: nt({ ...Q("arm", { spread: 50, bend: -105, elbow: 0 }), ...Q("leg", { spread: 9 }), smile: 0.8 }),
  think: nt({ "arm.right.spread": 22, "arm.right.bend": -150, "arm.right.elbow": 0, "head.tilt": 10, lookX: -0.5, lookY: -0.8, smile: 0 }),
  shrug: nt({ ...Q("arm", { spread: 35, bend: 75, elbow: 0 }), "head.tilt": -10, smile: -0.2 }),
  sit: nt({ ...Q("leg", { swing: 90, knee: 90, spread: 4 }), ...Q("arm", { swing: 25, elbow: 45, spread: 8 }) }),
  kneel: nt({
    "leg.left.swing": 90,
    "leg.left.knee": 90,
    // The back thigh leans back a little so its knee meets the ground beside the
    // front foot; the shin slopes up from it and the foot points down to tucked toes.
    "leg.right.swing": -18,
    "leg.right.knee": 108,
    "leg.right.ankle": 16,
    ...Q("arm", { swing: 20, elbow: 30 })
  }),
  crouch: nt({ ...Q("leg", { swing: 75, knee: 140, spread: 6 }), lean: 25, ...Q("arm", { swing: 50, elbow: 40 }), "head.nod": -15 }),
  // On hands and knees: the back nearly level, arms straight down, the toes
  // pointed back along the ground.
  crawl: nt({ lean: 82, "head.nod": -35, ...Q("arm", { swing: 80, elbow: 0, spread: 4 }), ...Q("leg", { knee: 92, ankle: -88 }) }),
  lieDown: nt({ roll: 90, ...Q("arm", { spread: 8 }), "head.nod": 0 })
};
function Rf(e = {}) {
  const t = e.headSize ?? 0.3, n = e.shoulderWidth ?? 0.06, s = e.hipWidth ?? 0.022, i = Math.max(0.12, 1 - t - Yi - (Cn + Hn)), r = (l) => ({
    id: `arm.${l}`,
    parent: "spine",
    offset: [(l === "left" ? 1 : -1) * n, -0.035, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: Pf, width: [1.25, 0.9] },
      { length: _f, width: [0.9, 0.75] }
    ]
  }), o = (l) => ({
    id: `leg.${l}`,
    parent: null,
    offset: [(l === "left" ? 1 : -1) * s, 0, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: Cn, width: [1.45, 1.05] },
      { length: Hn, width: [1.05, 0.85] },
      { length: Af, width: [0.95, 0.7] }
    ]
  }), a = (l, c) => l[c] ?? U[c] ?? 0;
  return {
    id: "human",
    hipHeight: Cn + Hn,
    // Tie order: legs, then the body, then the arms (in front of the chest unless turned away), then the head.
    chains: [
      o("left"),
      o("right"),
      {
        id: "spine",
        parent: null,
        rest: [0, 1, 0],
        bones: [
          { length: i / 2, width: [1.7, 1.4] },
          { length: i / 2, width: [1.4, 1.1] }
        ]
      },
      { id: "neck", parent: "spine", rest: [0, 1, 0], bones: [{ length: Yi, width: [1, 0.9] }] },
      r("left"),
      r("right")
    ],
    head: { on: "neck", size: t },
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
        const p = -a(l, "lean") / 2, g = a(l, "side") / 2;
        return [
          { swing: p, spread: g },
          { swing: p, spread: g }
        ];
      }
      if (c.id === "neck") return [{ swing: 0, spread: 0 }];
      const [h, u] = c.id.split("."), f = (p) => a(l, `${h}.${u}.${p}`);
      if (h === "arm")
        return [
          { swing: f("swing"), spread: f("spread") },
          { swing: f("elbow"), spread: f("bend") }
        ];
      const d = (c.side ?? 1) * f("rotate"), m = 1 - Math.cos(Cf(f("rotate")));
      return [
        { swing: f("swing"), spread: f("spread"), yaw: d },
        { swing: -f("knee"), spread: 0, yaw: d },
        // The foot points forward, square to the shin, turned out a little (more with `toeOut`).
        { swing: 90 + f("ankle") - m * (f("swing") - f("knee")), spread: 0, yaw: (If + f("toeOut")) * (c.side ?? 1) }
      ];
    },
    withAngles(l, c, h) {
      const [u, f] = c.id.split("."), d = (m) => `${u}.${f}.${m}`;
      return u === "arm" ? {
        ...l,
        [d("swing")]: h[0].swing,
        [d("spread")]: h[0].spread,
        [d("elbow")]: h[1].swing,
        [d("bend")]: h[1].spread
      } : u === "leg" ? { ...l, [d("swing")]: h[0].swing, [d("spread")]: h[0].spread, [d("knee")]: -h[1].swing } : l;
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
function Z0(e) {
  const t = e.split(".");
  if (t[0] === "hand" && t.length >= 3) {
    const s = `${t[1] === "left" ? "Left" : "Right"} hand`, i = { spread: "finger spread", turn: "wrist turn", bend: "wrist bend", tilt: "wrist tilt", roll: "roll" }, r = t.slice(2).join(".");
    return `${s} · ${i[r] ?? r.replace(".curl", " curl").replace(".across", " across")}`;
  }
  if (t.length === 3) {
    const [s, i, r] = t;
    return `${`${i === "left" ? "Left" : "Right"} ${s}`} · ${{
      swing: "forward / back",
      spread: "out / in",
      elbow: "elbow bend",
      bend: "forearm out / in",
      knee: "knee bend",
      ankle: "foot tilt",
      toeOut: "toes out / in",
      rotate: "turn out at the hip"
    }[r] ?? r}`;
  }
  return {
    turn: "View (front → side → back)",
    lean: "Lean forward / back",
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
  }[e] ?? e;
}
const Of = {
  leftEye: "eye.left",
  rightEye: "eye.right",
  leftBrow: "brow.left",
  rightBrow: "brow.right"
}, Q0 = Object.fromEntries(
  Object.entries(q).map(([e, t]) => [
    e,
    Object.fromEntries(Object.entries(t).map(([n, s]) => [Of[n] ?? n, s]))
  ])
);
function tp(e, t) {
  const n = Math.min(1, Math.max(0, e.turn ?? 0)), s = 1 - n, i = { ...U, turn: n }, r = [
    { stick: "right", human: "left", s: 1 },
    { stick: "left", human: "right", s: -1 }
  ];
  for (const { stick: a, human: l, s: c } of r) {
    const h = e[`${a}Shoulder`], u = e[`${a}Elbow`];
    i[`arm.${l}.spread`] = h * s, i[`arm.${l}.swing`] = c * h * n, i[`arm.${l}.bend`] = u * s, i[`arm.${l}.elbow`] = c * u * n;
    const f = e[`${a}Hip`], d = e[`${a}Knee`], m = s + c * n;
    i[`leg.${l}.rotate`] = 90 * s, i[`leg.${l}.spread`] = 0, i[`leg.${l}.swing`] = f * m, i[`leg.${l}.knee`] = d * m, i[`leg.${l}.ankle`] = -(e[`${a}Ankle`] ?? 0), i[`leg.${l}.toeOut`] = (e[`${a}FootOut`] ?? 0) * Lf, i[`eye.${l}`] = e[`${a}Eye`], i[`brow.${l}`] = e[`${a}Brow`], t && Object.assign(i, Ff(l, t[a] ?? K, e[`${a}Wrist`] ?? 0, n));
  }
  const o = e.bend ?? 0;
  i.lean = (e.lean + o * 0.5) * n, i.side = (e.lean + o * 0.5) * s, i["head.tilt"] = (e.headTilt + o * 0.5) * s, i["head.nod"] = (e.headTilt + o * 0.5) * n;
  for (const a of ["mouth", "smile", "mouthWidth", "blink", "browTilt", "lookX", "lookY", "stretch"]) i[a] = e[a];
  return i.lift = e.rise ?? 0, i.roll = e.spin ?? 0, i;
}
const Lf = 70;
function Ff(e, t, n, s) {
  const i = e === "right" ? 1 - s : 1 + s, r = {};
  for (const o of Object.keys(K)) r[`hand.${e}.${o}`] = t[o] ?? K[o];
  return r[`hand.${e}.turn`] = (t.turn ?? 0) - i, r[`hand.${e}.roll`] = (t.roll ?? 0) + n, r;
}
const it = (e) => e * Math.PI / 180;
function xo([e, t, n], s) {
  const i = Math.cos(s), r = Math.sin(s);
  return [e, t * i + n * r, -t * r + n * i];
}
function _s([e, t, n], s) {
  const i = Math.cos(s), r = Math.sin(s);
  return [e * i - t * r, e * r + t * i, n];
}
function It([e, t, n], s) {
  const i = Math.cos(s), r = Math.sin(s);
  return [e * i + n * r, t, -e * r + n * i];
}
const wt = (e, t) => [e[0] + t[0], e[1] + t[1], e[2] + t[2]], sn = (e, t) => [e[0] * t, e[1] * t, e[2] * t], Ke = (e, t) => _s(xo(e, t.swing), t.spread);
function $n(e, t) {
  const n = It(e, t);
  return { point: { x: n[0], y: -n[1] }, depth: n[2] };
}
function Is(e, t, n) {
  const s = n, r = [0, e.hipHeight * s * (e.boneScale?.(t, null) ?? 1), 0], o = {};
  for (const p of e.chains) {
    const g = p.parent ? o[p.parent] : void 0;
    if (p.parent && !g) throw new Error(`body plan ${e.id}: chain ${p.id} comes before its parent ${p.parent}`);
    const y = p.at ?? (g ? g.joints3.length - 1 : 0), b = g ? g.joints3[y] : r, w = g ? g.frames[Math.max(0, y - 1)] : { swing: 0, spread: 0 }, S = p.offset ? wt(b, Ke(sn(p.offset, s), w)) : b, k = p.side ?? 1, x = e.boneScale?.(t, p) ?? 1, v = e.angles(t, p), E = [S], M = [];
    let A = w.swing, T = w.spread;
    p.bones.forEach((P, _) => {
      const I = v[_] ?? { swing: 0, spread: 0 };
      A += it(I.swing), T += it(I.spread) * k, M.push({ swing: A, spread: T });
      const C = It(Ke(p.rest, { swing: A, spread: T }), it(I.yaw ?? 0));
      E.push(wt(E[_], sn(C, P.length * s * x)));
    }), o[p.id] = { joints3: E, frames: M };
  }
  const a = o[e.head.on], l = e.headPose?.(t) ?? { yaw: 0, nod: 0, tilt: 0, sx: 1, sy: 1 }, c = a.frames[a.frames.length - 1], h = e.head.size / 2 * s, u = h * l.sx, f = h * l.sy, d = (p) => Ke(It(xo(_s(p, -it(l.tilt)), -it(l.nod)), it(l.yaw)), c), m = wt(a.joints3[a.joints3.length - 1], d([0, f, 0]));
  return { height: s, root: r, chains: o, head: { center: m, rx: u, ry: f, toBody: d } };
}
function Cs(e, t, n) {
  const s = n.height, i = it(90 * (t.turn ?? 0)), r = Is(e, t, s), { root: o } = r, a = r.chains, { rx: l, ry: c } = r.head, h = r.head.toBody, u = r.head.center, f = {};
  for (const M of e.chains) {
    const { joints3: A, frames: T } = a[M.id], P = A.map((_) => $n(_, i));
    f[M.id] = {
      id: M.id,
      joints3: A,
      frames: T,
      points: P.map((_) => _.point),
      depths: P.map((_) => _.depth)
    };
  }
  const d = $n(u, i), m = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((M) => It(h(M), i)), p = $n(o, i).point, g = it(t.roll ?? 0), y = (M) => {
    const A = M.x - p.x, T = M.y - p.y;
    return { x: p.x + A * Math.cos(g) - T * Math.sin(g), y: p.y + A * Math.sin(g) + T * Math.cos(g) };
  }, b = ([M, A, T]) => [M * Math.cos(g) + A * Math.sin(g), -M * Math.sin(g) + A * Math.cos(g), T];
  for (const M of Object.values(f)) M.points = M.points.map(y);
  const w = {
    center: y(d.point),
    depth: d.depth,
    rx: l,
    ry: c,
    angle: 0,
    axes: m.map(b)
  }, S = w.axes[1];
  w.angle = Math.atan2(S[0], S[1]);
  const k = (M) => {
    if ("head" in M) return { x: w.center.x + S[0] * c, y: w.center.y - S[1] * c };
    const A = f[M.chain];
    return A.points[Math.min(M.joint, A.points.length - 1)];
  };
  let x = 0;
  (n.contact ?? "ground") === "ground" && (x = -Math.max(...e.contacts.map((M) => k(M).y))), x -= (t.lift ?? 0) * s;
  const v = (M) => ({ x: M.x, y: M.y + x });
  for (const M of Object.values(f)) M.points = M.points.map(v);
  w.center = v(w.center);
  const E = e.contacts.map((M) => ({ spec: M, point: k(M) }));
  return {
    height: s,
    view: i,
    chains: f,
    head: w,
    hip: v(y(p)),
    contacts: E,
    groundY: Math.max(...E.map((M) => M.point.y))
  };
}
const rs = (e, t) => [e[0] - t[0], e[1] - t[1], e[2] - t[2]], To = (e) => {
  const t = Math.hypot(e[0], e[1], e[2]) || 1;
  return [e[0] / t, e[1] / t, e[2] / t];
};
function Eo(e, t, n) {
  const s = n.height, i = it(90 * (t.turn ?? 0)), r = it(t.roll ?? 0), o = Is(e, t, s), a = It(o.root, i), l = (g) => wt(_s(rs(It(g, i), a), -r), a), c = {};
  for (const g of e.chains) c[g.id] = o.chains[g.id].joints3.map(l);
  const h = l(o.head.center), u = (g) => To(rs(l(wt(o.head.center, o.head.toBody(g))), h)), f = [u([1, 0, 0]), u([0, 1, 0]), u([0, 0, 1])], d = (g) => {
    if ("head" in g) return wt(h, sn(f[1], o.head.ry));
    const y = c[g.chain];
    return y[Math.min(g.joint, y.length - 1)];
  };
  let m = 0;
  (n.contact ?? "ground") === "ground" && (m = -Math.min(...e.contacts.map((g) => d(g)[1]))), m += (t.lift ?? 0) * s;
  const p = (g) => [g[0], g[1] + m, g[2]];
  return {
    height: s,
    hip: p(a),
    chains: Object.fromEntries(Object.entries(c).map(([g, y]) => [g, y.map(p)])),
    head: { center: p(h), rx: o.head.rx, ry: o.head.ry, axes: f }
  };
}
function Ao(e, t, n, s) {
  const i = n.height, r = it(90 * (t.turn ?? 0)), o = Is(e, t, i), a = Eo(e, t, n), l = a.hip, c = a.chains, h = a.head.center, u = (M) => {
    if ("head" in M) return wt(h, sn(a.head.axes[1], a.head.ry));
    const A = c[M.chain];
    return A[Math.min(M.joint, A.length - 1)];
  }, f = s.toView(l), d = s.toScreen(f), m = s.toScreen([f[0] + 1, f[1], f[2]]), p = Math.hypot(m.x - d.x, m.y - d.y), g = (M) => {
    const A = s.toView(M);
    return { point: s.toScreen(A), depth: A[2] * p };
  }, y = {};
  for (const M of e.chains) {
    const A = c[M.id].map(g);
    y[M.id] = {
      id: M.id,
      joints3: o.chains[M.id].joints3,
      frames: o.chains[M.id].frames,
      points: A.map((T) => T.point),
      depths: A.map((T) => T.depth)
    };
  }
  const b = s.toView(h), w = s.toScreen(b), S = s.toScreen([b[0] + 1, b[1], b[2]]), k = Math.hypot(S.x - w.x, S.y - w.y), x = a.head.axes.map((M) => To(rs(s.toView(wt(h, M)), b))), v = {
    center: w,
    depth: b[2] * p,
    rx: o.head.rx * k,
    ry: o.head.ry * k,
    angle: Math.atan2(x[1][0], x[1][1]),
    axes: x
  }, E = e.contacts.map((M) => ({ spec: M, point: g(u(M)).point }));
  return {
    height: i * p,
    view: r,
    chains: y,
    head: v,
    hip: d,
    contacts: E,
    groundY: Math.max(...E.map((M) => M.point.y))
  };
}
function Po(e, [t, n, s]) {
  const [i, r, o] = e.axes, a = [
    i[0] * t * e.rx + r[0] * n * e.ry + o[0] * s * e.rx,
    i[1] * t * e.rx + r[1] * n * e.ry + o[1] * s * e.rx,
    i[2] * t * e.rx + r[2] * n * e.ry + o[2] * s * e.rx
  ], l = Math.hypot(t, n, s) || 1, c = (i[2] * t + r[2] * n + o[2] * s) / l;
  return { point: { x: e.center.x + a[0], y: e.center.y - a[1] }, depth: e.depth + a[2], facing: c };
}
class _o {
  positions = [];
  normals = [];
  indices = [];
  /** Add a vertex; returns its index. */
  vertex(t, n, s, i, r, o) {
    const a = Math.hypot(i, r, o) || 1;
    return this.positions.push(t, n, s), this.normals.push(i / a, r / a, o / a), this.positions.length / 3 - 1;
  }
  /** Add a triangle, counter-clockwise seen from its front. */
  triangle(t, n, s) {
    this.indices.push(t, n, s);
  }
  /** Add a quad a-b-c-d (counter-clockwise) as two triangles. */
  quad(t, n, s, i) {
    this.indices.push(t, n, s, t, s, i);
  }
  build() {
    return { positions: this.positions, normals: this.normals, indices: this.indices };
  }
}
function Bf(e) {
  const t = /* @__PURE__ */ new Map(), n = [];
  for (let i = 0; i < e.positions.length / 3; i++) {
    const r = [0, 1, 2].map((o) => Math.round(e.positions[i * 3 + o] * 1e6)).join(",");
    t.has(r) || t.set(r, i), n.push(t.get(r));
  }
  const s = /* @__PURE__ */ new Map();
  for (let i = 0; i < e.indices.length / 3; i++)
    for (let r = 0; r < 3; r++) {
      const o = n[e.indices[i * 3 + r]], a = n[e.indices[i * 3 + (r + 1) % 3]];
      if (o === a) continue;
      const l = o < a ? `${o}-${a}` : `${a}-${o}`, c = s.get(l);
      c ? c.faces.push(i) : s.set(l, { a: Math.min(o, a), b: Math.max(o, a), faces: [i] });
    }
  return [...s.values()];
}
const Hs = Math.PI * 2;
function Df(e, t = 16) {
  const n = new _o(), s = Math.max(6, Math.round(t)), i = Math.max(3, Math.round(s / 2)), r = [];
  for (let o = 0; o <= i; o++) {
    const a = o / i * Math.PI, l = [];
    for (let c = 0; c <= s; c++) {
      const h = c / s * Hs, u = Math.sin(a) * Math.sin(h), f = Math.cos(a), d = Math.sin(a) * Math.cos(h);
      l.push(n.vertex(u * e, f * e, d * e, u, f, d));
    }
    r.push(l);
  }
  for (let o = 0; o < i; o++)
    for (let a = 0; a < s; a++) {
      const l = r[o][a], c = r[o + 1][a], h = r[o + 1][a + 1], u = r[o][a + 1];
      o > 0 && n.triangle(l, c, u), o < i - 1 && n.triangle(c, h, u);
    }
  return n.build();
}
function Xi(e, t, n, s, i) {
  const r = e.vertex(0, n, 0, 0, s, 0), o = Array.from({ length: i }, (a, l) => {
    const c = l / i * Hs;
    return e.vertex(Math.sin(c) * t, n, Math.cos(c) * t, 0, s, 0);
  });
  for (let a = 0; a < i; a++) {
    const l = o[a], c = o[(a + 1) % i];
    s === 1 ? e.triangle(r, l, c) : e.triangle(r, c, l);
  }
}
function Wf(e, t, n = 24) {
  const s = new _o(), i = Math.max(6, Math.round(n)), r = t / 2, o = -t / 2, a = (h) => Array.from({ length: i + 1 }, (u, f) => {
    const d = f / i * Hs;
    return s.vertex(Math.sin(d) * e, h, Math.cos(d) * e, Math.sin(d), 0, Math.cos(d));
  }), l = a(o), c = a(r);
  for (let h = 0; h < i; h++) s.quad(l[h], l[h + 1], c[h + 1], c[h]);
  return Xi(s, e, r, 1, i), Xi(s, e, o, -1, i), s.build();
}
function qi(e) {
  const t = Array.from({ length: e.indices.length / 3 }, () => []);
  for (const n of Bf(e))
    for (const s of n.faces) {
      const i = n.faces.find((r) => r !== s) ?? -1;
      t[s].push({ a: n.a, b: n.b, across: i });
    }
  return { ...e, faceEdges: t };
}
const Ie = (e) => e * 180 / Math.PI, $t = (e, t) => [e[0] - t[0], e[1] - t[1], e[2] - t[2]], Rn = (e, t) => e[0] * t[0] + e[1] * t[1] + e[2] * t[2], oe = (e) => Math.hypot(e[0], e[1], e[2]), os = (e) => {
  const t = oe(e) || 1;
  return [e[0] / t, e[1] / t, e[2] / t];
}, Ce = (e) => Math.atan2(Math.sin(e), Math.cos(e));
function Vi(e) {
  const [t, n, s] = os(e);
  return { swing: Math.asin(Math.max(-1, Math.min(1, s))), spread: Math.atan2(t, -n) };
}
function Nf(e, t, n, s, i) {
  const r = e.chains.find((A) => A.id === n);
  if (!r) throw new Error(`reach: no chain ${n} in ${e.id}`);
  if (r.bones.length < 2 || r.rest[1] > -0.99) throw new Error(`reach: ${n} is not a hanging limb of two bones or more`);
  if (!e.withAngles) throw new Error(`reach: the ${e.id} plan cannot set angles`);
  const o = Cs(e, { ...t, turn: 0, roll: 0, lift: 0 }, { height: i.height, contact: "none" }), a = o.chains[n], l = a.joints3[0], c = oe($t(a.joints3[1], a.joints3[0])), h = oe($t(a.joints3[2], a.joints3[1])), u = r.parent ? o.chains[r.parent].frames[Math.max(0, (r.at ?? o.chains[r.parent].joints3.length - 1) - 1)] : { swing: 0, spread: 0 }, f = $t(s, l), d = Math.min(c + h - 1e-6, Math.max(Math.abs(c - h) + 1e-6, oe(f))), m = os(f), p = r.parent !== null, g = Ke(r.pole ?? (p ? [0, -0.35, -1] : [0, 0, 1]), u);
  let y = $t(g, [m[0] * Rn(g, m), m[1] * Rn(g, m), m[2] * Rn(g, m)]);
  oe(y) < 1e-6 && (y = It([1, 0, 0], 0)), y = os(y);
  const b = (c * c + d * d - h * h) / (2 * c * d), w = Math.sqrt(Math.max(0, 1 - b * b)), S = [
    l[0] + c * (b * m[0] + w * y[0]),
    l[1] + c * (b * m[1] + w * y[1]),
    l[2] + c * (b * m[2] + w * y[2])
  ], k = [l[0] + m[0] * d, l[1] + m[1] * d, l[2] + m[2] * d], x = r.side ?? 1, v = Vi($t(S, l)), E = Vi($t(k, S)), M = [
    { swing: Ie(Ce(v.swing - u.swing)), spread: Ie(Ce(v.spread - u.spread)) * x },
    { swing: Ie(Ce(E.swing - v.swing)), spread: Ie(Ce(E.spread - v.spread)) * x }
  ];
  return e.withAngles(t, r, M);
}
const Kf = 0.34, dt = 0.12, ot = -0.4, ct = (e, t, n) => e[t] ?? n, Yf = (e, t) => Math.max(0, e) * (1 - Math.min(1, Math.max(0, t))), Xf = 0.45, qf = 0.35, Vf = 0.7;
function rn(e, t, n) {
  const s = (d) => Math.sqrt(Math.max(0, 1 - d.x * d.x - d.y * d.y)), i = Po(e, [n.x, n.y, s(n)]).facing, r = e.axes[2], o = Math.atan2(r[0], r[2]), a = Math.cos(o), l = a >= 0 ? 1 : -1, c = l * Math.max(qf, Math.abs(a)), h = l * Math.max(Vf, Math.abs(a)), u = Math.cos(e.angle), f = Math.sin(e.angle);
  return {
    facing: i,
    points: t.map((d) => {
      const m = Xf * Math.sin(o) + n.x * c + (d.x - n.x) * h, p = d.y + r[1] * s(d), g = m * e.rx, y = p * e.ry;
      return { x: e.center.x + g * u + y * f, y: e.center.y + g * f - y * u };
    })
  };
}
const He = (e, t, n, s = 12) => Array.from({ length: s + 1 }, (i, r) => {
  const o = r / s, a = 1 - o;
  return { x: a * a * e.x + 2 * a * o * t.x + o * o * n.x, y: a * a * e.y + 2 * a * o * t.y + o * o * n.y };
}), On = (e, t, n, s, i = 16) => Array.from({ length: i }, (r, o) => {
  const a = Math.PI * 2 * o / i;
  return { x: e + Math.cos(a) * n, y: t + Math.sin(a) * s };
}), Ui = 0.05;
function Uf(e, t, n, s) {
  const i = Math.max(1, Math.min(s * 0.6, 0.14 * t.rx)), r = (y, b) => rn(t, y, b).points, o = (y, b) => rn(t, [], { x: y, y: b }).facing, a = ct(n, "smile", 0), l = ct(n, "blink", 0), c = ct(n, "lookX", 0), h = ct(n, "lookY", 0), u = ct(n, "browTilt", 0);
  for (const y of [1, -1]) {
    const b = y === 1 ? "left" : "right", w = Kf * y;
    if (o(w, dt) < Ui) continue;
    const S = { x: w, y: dt }, k = Yf(ct(n, `eye.${b}`, 1), l);
    if (k < 0.2) {
      const M = a > 0.5 ? 0.12 : -0.06;
      e.line(r(He({ x: w - 0.12, y: dt }, { x: w, y: dt + M }, { x: w + 0.12, y: dt }), S), i);
    } else {
      if (k > 1.2) {
        const P = 0.13 * k;
        e.shape(r(On(w, dt, P * 0.85, P), S), "#ffffff", i);
      }
      const M = k > 1.2 ? 0.075 : 0.1, A = w + c * 0.08, T = dt - h * 0.07;
      e.shape(r(On(A, T, M, M * 1.1 * Math.min(k, 1)), S), e.ink, 0);
    }
    const x = dt + 0.3 + ct(n, `brow.${b}`, 0) * 0.14 + Math.max(0, k - 1) * 0.12, v = { x: w + y * 0.13, y: x }, E = { x: w - y * 0.13, y: x + u * 0.1 };
    e.line(r([v, { x: (v.x + E.x) / 2, y: (v.y + E.y) / 2 }, E], { x: w, y: x }), i);
  }
  const f = { x: 0, y: ot };
  if (o(0, ot) < -Ui) return;
  const d = 0.25 * Math.max(0.3, ct(n, "mouthWidth", 1)), m = Math.min(1, Math.max(0, ct(n, "mouth", 0)));
  if (m <= 0.05) {
    e.line(r(He({ x: -d, y: ot }, { x: 0, y: ot - a * 0.25 }, { x: d, y: ot }), f), i);
    return;
  }
  const p = 0.3 * m;
  let g;
  if (a > 0.3) {
    const y = ot + 0.05;
    g = [...He({ x: d, y }, { x: 0, y: ot - p * 2 }, { x: -d, y })];
  } else if (a < -0.3) {
    const y = ot - p * 0.6;
    g = [...He({ x: d, y }, { x: 0, y: ot + p * 1.4 }, { x: -d, y })];
  } else
    g = On(0, ot, d * 0.8, p);
  e.shape(r(g, f), e.ink, 0);
}
function zf(e = {}) {
  const t = (e.proportions ?? "bold") === "bold", n = e.figure ?? "fluid", s = e.look ?? "clean", i = e.height ?? 300, r = n === "stick";
  return {
    plan: e.plan ?? Rf({
      headSize: e.headSize ?? (t ? 0.3 : 0.24),
      shoulderWidth: r ? 0 : e.shoulderWidth ?? 0.06,
      hipWidth: r ? 0 : e.hipWidth ?? 0.022
    }),
    figure: n,
    look: s,
    height: i,
    lineWidth: e.lineWidth ?? i * (t ? 0.045 : 0.022),
    ink: e.ink ?? (s === "pencil" ? "#2f2f33" : "#1e293b"),
    skin: e.skin ?? (s === "pencil" ? "none" : "#ffffff"),
    seed: e.seed ?? 1,
    pencil: e.pencil ?? {},
    layers: e.layers ?? {},
    contact: e.contact ?? "ground",
    hands: e.hands ?? "dot",
    handStyle: e.handStyle ?? "glove",
    handSize: e.handSize ?? (e.handStyle === "natural" ? 0.14 : 0.17)
  };
}
function ep(e, t, n, s) {
  const { point: i, facing: r } = Po(e, [t, n, s]);
  return { point: i, facing: r };
}
const as = (e) => e.rest[1] < -0.5, jf = 0.3;
function Gf(e, t, n) {
  return e.figure === "stick" ? as(t) ? n.slice(0, 3) : n : as(t) && n.length >= 3 ? Vt(n[0], n[1], n[2], jf) : n.length === 3 ? Vt(n[0], n[1], n[2], 1) : n;
}
function $s(e, t) {
  const n = e.plan.id === "human" ? { ...U, ...t } : t;
  return Rs(e, n, Cs(e.plan, n, { height: e.height, contact: e.contact }));
}
function Rs(e, t, n) {
  const s = {}, i = {}, r = {}, o = 0.01 * e.height;
  e.plan.chains.forEach((f) => {
    const d = n.chains[f.id];
    s[f.id] = d.points;
    const m = d.depths.reduce((b, w) => b + w, 0) / d.depths.length, p = f.parent ? n.chains[f.parent] : void 0, g = p ? p.depths[f.at ?? p.depths.length - 1] : 0, y = m - g;
    r[f.id] = Math.abs(y) < o ? 0 : y, i[f.id] = { points: Gf(e, f, d.points), depth: m };
  }), i.head = { points: [n.head.center], depth: n.head.depth }, r.head = 0;
  const a = [...e.plan.chains.map((f) => f.id), "head"], l = [...a].sort((f, d) => r[f] - r[d] || a.indexOf(f) - a.indexOf(d)), c = { hip: n.hip };
  for (const [f, [d, m]] of Object.entries(e.plan.landmarks ?? {})) {
    const p = n.chains[d]?.points;
    p && (c[f] = p[Math.min(m, p.length - 1)]);
  }
  const h = {};
  for (const [f, d] of Object.entries(c)) h[f] = d.y >= n.groundY - 0.01 * e.height;
  const u = {
    height: e.height,
    lineWidth: e.lineWidth,
    turn: t.turn ?? 0,
    points: c,
    chains: s,
    parts: i,
    head: n.head,
    groundY: n.groundY,
    grounded: h
  };
  return { skeleton: n, joints: u, order: l };
}
function Jf(e, t) {
  return $s(e, t).joints;
}
function Zf(e, t, n) {
  const { head: s } = n;
  e.guideEllipse(s.center.x, s.center.y, s.rx * 1.03, s.ry * 1.03, s.angle);
  const i = Array.from({ length: 13 }, (l, c) => ({ x: 0, y: -0.95 + 1.9 * c / 12 })), r = Array.from({ length: 13 }, (l, c) => ({ x: -0.95 + 1.9 * c / 12, y: 0.12 })), o = rn(s, i, { x: 0, y: 0 });
  o.facing > 0 && e.guide(o.points), e.guide(rn(s, r, { x: 0, y: 0.12 }).points), e.guide(n.chains.spine ?? []);
  const a = t.lineWidth * 0.9;
  for (const l of ["shoulder.left", "shoulder.right", "elbow.left", "elbow.right", "hip.left", "hip.right", "knee.left", "knee.right"]) {
    const c = n.points[l];
    c && e.guideEllipse(c.x, c.y, a, a, 0);
  }
}
function Qf(e, t, n, s, i, r) {
  const o = n.lineWidth;
  if (i === "head") {
    const { head: d } = s, m = n.skin === "none" ? null : n.skin;
    t.ellipse(d.center.x, d.center.y, d.rx, d.ry, d.angle, m, o), t.look !== "silhouette" && Uf(t, d, r, o);
    return;
  }
  const a = n.plan.chains.find((d) => d.id === i), l = s.chains[i], c = s.parts[i].points;
  if (n.figure === "stick") {
    if (i === "neck") return;
    const d = i === "spine" ? [...l, ...s.chains.neck?.slice(1) ?? []] : c;
    t.line(d, o);
    return;
  }
  const h = (d, m) => [a.bones[d].width[0] * o, a.bones[m].width[1] * o];
  if (as(a)) {
    const [d, m] = h(0, 1);
    if (t.limb(c, d, m), a.bones.length >= 3)
      t.limb([l[2], l[3]], a.bones[2].width[0] * o, a.bones[2].width[1] * o);
    else if (n.hands === "cartoon" && i.startsWith("arm."))
      ed(e, t, n, l, i.endsWith(".left") ? "left" : "right", r);
    else {
      const p = l[l.length - 1];
      t.dot(p.x, p.y, o * 0.62);
    }
    return;
  }
  if (i === "spine") {
    const d = s.points["hip.left"], m = s.points["hip.right"];
    d && m && Math.hypot(d.x - m.x, d.y - m.y) > 0.5 && t.limb([d, m], o * 1.3, o * 1.3);
    const [p, g] = h(0, a.bones.length - 1);
    t.limb(c, p, g);
    const y = s.points["shoulder.left"], b = s.points["shoulder.right"];
    y && b && Math.hypot(y.x - b.x, y.y - b.y) > 0.5 && t.limb(Vt(y, l[l.length - 1], b, 1, 10), o * 1.15, o * 1.15);
    return;
  }
  const [u, f] = h(0, a.bones.length - 1);
  t.limb(c, u, f);
}
function td(e, t) {
  const n = `hand.${t}.`, s = {};
  for (const [o, a] of Object.entries(e)) o.startsWith(n) && (s[o.slice(n.length)] = a);
  const i = e.turn ?? 0, r = t === "right" ? 1 - i : 1 + i;
  return { ...K, ...s, turn: r + (s.turn ?? 0) };
}
function ed(e, t, n, s, i, r) {
  const o = s[s.length - 1], a = s[s.length - 2], l = Math.atan2(o.x - a.x, -(o.y - a.y)) * 180 / Math.PI;
  xs(e, o, td(r, i), {
    size: n.handSize * n.height,
    side: i,
    angle: l,
    pen: t,
    skin: n.skin === "none" ? "#ffffff" : n.skin,
    // A cartoon glove: three fingers and a thumb, plump enough to match the limbs.
    // Natural: five fingers, a little fuller than a real hand so they hold up against the limbs.
    fingers: n.handStyle === "natural" ? 5 : 4,
    plump: n.handStyle === "natural" ? 1.15 : 1.6,
    lineWidth: n.lineWidth * 0.3
  });
}
function nd(e, t, n, s = 0) {
  const i = t.plan.id === "human" ? { ...U, ...n } : n;
  Co(e, t, i, $s(t, i), s);
}
function Io(e, t) {
  const n = t / e.height;
  return { ...e, height: t, lineWidth: e.lineWidth * n };
}
function np(e, t, n, s) {
  const i = e.plan.id === "human" ? { ...U, ...t } : t, r = Ao(e.plan, i, { height: s.height, contact: e.contact }, n);
  return Rs(Io(e, r.height), i, r).joints;
}
function sd(e, t, n, s, i) {
  const r = t.plan.id === "human" ? { ...U, ...n } : n, o = Ao(t.plan, r, { height: i.height, contact: t.contact }, s), a = Io(t, o.height);
  Co(e, a, r, Rs(a, r, o), i.time ?? 0);
}
function Co(e, t, n, s, i) {
  const { joints: r, order: o } = s, a = no(e, {
    look: t.look,
    ink: t.ink,
    lineWidth: t.lineWidth,
    seed: t.seed,
    time: i,
    pencil: t.pencil
  }), l = (c) => {
    c && (e.save(), c(e, r, a, i), e.restore());
  };
  e.save(), e.lineCap = "round", e.lineJoin = "round", t.look === "pencil" && t.pencil.construction !== !1 && Zf(a, t, r), l(t.layers.behind);
  for (const c of o) {
    const h = t.layers.parts?.[c];
    l(h?.under), Qf(e, a, t, r, c, n), l(h?.over);
  }
  l(t.layers.front), e.restore();
}
function sp(e, t, n) {
  const s = { ...e };
  for (const [i, r] of Object.entries(t)) {
    const o = e[i] ?? r;
    s[i] = o + (r - o) * n;
  }
  return s;
}
function ip(e, t, n, s) {
  const i = e.plan.id === "human" ? { ...U, ...t } : t;
  let r;
  if (Array.isArray(s))
    r = s;
  else {
    const { skeleton: o } = $s(e, i), a = Cs(e.plan, { ...i, roll: 0 }, { height: e.height, contact: "none" }), l = (i.roll ?? 0) * Math.PI / 180, c = s.x - o.hip.x, h = s.y - o.hip.y, u = a.hip.x + c * Math.cos(-l) - h * Math.sin(-l), f = a.hip.y + c * Math.sin(-l) + h * Math.cos(-l), d = Math.PI / 2 * (i.turn ?? 0), m = s.depth ?? o.chains[n].depths[o.chains[n].depths.length - 1], p = Math.cos(d), g = Math.sin(d);
    r = [u * p - m * g, -f, u * g + m * p];
  }
  return Nf(e.plan, i, n, r, { height: e.height });
}
function rp(e) {
  const { character: t } = e, n = t.height * 0.8, s = t.height, i = t.plan.id === "human" ? U : {};
  return {
    type: "custom",
    x: e.x - n / 2,
    y: e.y - s,
    width: n,
    height: s,
    props: { ...i, ...e.pose },
    character: t,
    draw(r, o, a) {
      r.translate(n / 2, s), nd(r, t, o.props, a);
    }
  };
}
function id(e, t, n) {
  const s = (r) => ({ x: r.x + t, y: r.y + n }), i = (r) => Object.fromEntries(Object.entries(r).map(([o, a]) => [o, a.map(s)]));
  return {
    ...e,
    points: Object.fromEntries(Object.entries(e.points).map(([r, o]) => [r, s(o)])),
    chains: i(e.chains),
    parts: Object.fromEntries(Object.entries(e.parts).map(([r, o]) => [r, { ...o, points: o.points.map(s) }])),
    head: { ...e.head, center: s(e.head.center) },
    groundY: e.groundY + n
  };
}
function op(e, t, n) {
  const s = e.character;
  if (!s) throw new Error("characterAt: the target was not made by characterTarget");
  const i = { ...e.props };
  let r = 0, o = 0;
  for (const [l, c] of t.state?.values.get(n) ?? [])
    typeof c == "number" && (l === "x" || l === "motionPathX" ? r = c : l === "y" || l === "motionPathY" ? o = c : l in i && (i[l] = c));
  const a = Jf(s, i);
  return { pose: i, joints: id(a, e.x + r + e.width / 2, e.y + o + e.height) };
}
function Ho(e, t = U) {
  const n = [];
  return e.forEach((s, i) => {
    const r = i === 0 ? t : n[i - 1], o = typeof s.pose == "string" ? $f[s.pose] : void 0;
    n.push(o ? { ...o, turn: r.turn ?? 0 } : { ...r, ...s.pose });
  }), n;
}
function ap(e, t, n = U) {
  const s = Ho(t, n);
  return Object.keys(n).filter((r) => s.some((o) => (o[r] ?? n[r]) !== n[r])).map((r) => ({
    id: `${e}-${r}`,
    target: e,
    property: r,
    keyframes: t.map((o, a) => ({
      time: o.time,
      value: s[a][r] ?? n[r],
      ...o.easing ? { easing: o.easing } : {}
    }))
  }));
}
const rd = /* @__PURE__ */ new Set([
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
]), od = 1.7;
function ad(e, t, n) {
  const s = Array.from({ length: 24 }, (i, r) => {
    const o = r / 24 * Math.PI * 2, a = t.toView([Math.cos(o) * n, 0, Math.sin(o) * n * 0.8]);
    return a[2] < -1e-3 ? t.toScreen(a) : null;
  });
  s.some((i) => i === null) || (e.beginPath(), s.forEach((i, r) => r === 0 ? e.moveTo(i.x, i.y) : e.lineTo(i.x, i.y)), e.closePath(), e.fillStyle = "rgba(0, 0, 0, 0.22)", e.fill());
}
function ld(e) {
  const t = le([0, 1, 0], e);
  if (t > 0.999999) return Rr();
  if (t < -0.999999) return de(Wt([1, 0, 0], 180));
  const n = Ve([0, 1, 0], e);
  return de(Wt(n, Math.acos(t) * 180 / Math.PI));
}
function cd(e, t, n, s, i) {
  const r = e.solid ?? {}, o = r.outline === !1 ? void 0 : r.outline ?? { width: 2, color: "#0f172a" }, a = { color: r.color ?? "#475569", shading: r.shading ?? "toon", outline: o }, l = { color: r.skin ?? "#f2c49b", shading: r.shading ?? "toon", outline: o }, c = { color: "#0f172a", shading: "unlit" }, h = s.height * 0.034, u = [], f = (w, S, k) => u.push({ mesh: w, world: kt(i, S), material: k }), d = (w, S, k) => f(t.sphere, Lr(w, [0, 0, 0, 1], [S, S, S]), k);
  for (const w of n.chains) {
    const S = s.chains[w.id], k = w.id === "spine" ? 1.9 : 1;
    w.bones.forEach((x, v) => {
      const E = S[v], M = S[v + 1], A = Hr(E, M), [T, P] = x.width ?? [1, 1], _ = h * k * (T + P) / 2;
      if (A > 1e-6) {
        const I = $r(E, M, 0.5), C = ld(fe(fn(M, E)));
        f(t.cylinder, kt(Or(I), kt(C, Be([_, A, _]))), a);
      }
      d(E, h * k * T, a), d(M, h * k * P, a);
    }), w.id.startsWith("arm.") && d(S[S.length - 1], h * 1.5, l);
  }
  const { center: m, rx: p, ry: g, axes: y } = s.head, b = [...y[0], 0, ...y[1], 0, ...y[2], 0, ...m, 1];
  f(t.sphere, kt(b, Be([p, g, p])), l);
  for (const w of [-1, 1]) {
    const S = fe([w * 0.36, 0.15, 0.92]), k = Fe(m, Fe(Fe(ae(y[0], S[0] * p * 1.04), ae(y[1], S[1] * g * 1.04)), ae(y[2], S[2] * p * 1.04))), x = [...y[0], 0, ...y[1], 0, ...y[2], 0, ...k, 1];
    f(t.sphere, kt(x, Be([p * 0.11, g * 0.14, p * 0.03])), c);
  }
  return u;
}
const lp = {
  kind: "character",
  validate(e) {
    const t = e;
    return t.height !== void 0 && !(t.height > 0) ? ["a character's height must be positive"] : [];
  },
  prepare(e) {
    return {
      who: zf({ ...e.character, height: 1 }),
      cylinder: qi(Wf(1, 1, 16)),
      sphere: qi(Df(1, 20))
    };
  },
  resolve({ object: e, prepared: t, values: n, world: s, camera: i, toScreen: r }) {
    const o = e, a = t, l = a.who, c = { ...U, ...o.pose };
    for (const [g, y] of n)
      typeof y == "number" && !rd.has(g) && (c[g] = y);
    const h = o.height ?? od, u = kt(i.view, s), f = {
      toView: (g) => Fr(u, g),
      toScreen: (g) => r(g)
    }, m = -f.toView([0, h / 2, 0])[2];
    if (m <= i.near) return null;
    const p = o.shadow === !1 ? [] : [{ depth: m + h, draw: (g) => ad(g, f, h * 0.18) }];
    if (o.look === "solid") {
      const g = Eo(l.plan, c, { height: h, contact: l.contact });
      return { meshes: cd(o, a, l.plan, g, s), drawables: p };
    }
    return {
      drawables: [
        ...p,
        {
          depth: m,
          draw(g, y) {
            g.lineCap = "round", g.lineJoin = "round", sd(g, l, c, f, { height: h, time: y.time });
          }
        }
      ]
    };
  }
};
function hd(e, t, n = {}, s) {
  const i = n.length ?? 240, r = 9, o = 28, a = i - 22;
  e.save(), e.translate(t.x, t.y), e.rotate((n.angle ?? -30) * Math.PI / 180), e.fillStyle = n.color ?? "#f4c542", e.fillRect(o, -r, a - o, 2 * r), e.fillStyle = "#e8b4a0", e.fillRect(a, -r, i - a, 2 * r), e.fillStyle = "#f1dcbf", e.beginPath(), e.moveTo(0, 0), e.lineTo(o, -r), e.lineTo(o, r), e.closePath(), e.fill(), e.fillStyle = n.outline ?? "#2f2f33", e.beginPath(), e.moveTo(0, 0), e.lineTo(o * 0.35, -r * 0.35), e.lineTo(o * 0.35, r * 0.35), e.closePath(), e.fill(), e.strokeStyle = n.outline ?? "#2f2f33", e.lineWidth = 3, e.lineJoin = "round", e.lineCap = "round";
  const l = [
    [{ x: 0, y: 0 }, { x: o, y: -r }, { x: i, y: -r }, { x: i, y: r }, { x: o, y: r }, { x: 0, y: 0 }],
    [{ x: o, y: -r }, { x: o, y: r }],
    [{ x: a, y: -r }, { x: a, y: r }]
  ];
  for (const c of l) Lo(e, c, s);
  e.restore();
}
function $o(e, t, n = {}, s) {
  const i = n.length ?? 90, r = n.thickness ?? 34;
  e.save(), e.translate(t.x, t.y), e.rotate((n.angle ?? -35) * Math.PI / 180);
  const o = -r / 2;
  e.fillStyle = n.color ?? "#f4a7b9", e.fillRect(0, o, i, r), e.fillStyle = "#e9edf2", e.fillRect(i * 0.45, o, i * 0.55, r), e.strokeStyle = n.outline ?? "#2f2f33", e.lineWidth = 3, e.lineJoin = "round";
  const a = [
    { x: 0, y: o },
    { x: i, y: o },
    { x: i, y: -o },
    { x: 0, y: -o },
    { x: 0, y: o }
  ], l = [{ x: i * 0.45, y: o }, { x: i * 0.45, y: -o }];
  if (s)
    s.line(a), s.line(l);
  else
    for (const c of [a, l]) {
      e.beginPath(), e.moveTo(c[0].x, c[0].y);
      for (const h of c.slice(1)) e.lineTo(h.x, h.y);
      e.stroke();
    }
  e.restore();
}
const Ro = 150, ud = { pencil: 44, eraser: 30 };
function Oo(e, t, n = {}, s) {
  const i = n.tool ?? "pencil", r = n.skin ?? "#f1c9a5", o = n.outline ?? "#2f2f33", a = n.scale ?? 1, l = Math.min(1, Math.max(0, n.lift ?? 0)), c = (n.angle ?? -30) * Math.PI / 180, h = s ? s.nudge(0.6) : { x: 0, y: 0 }, u = Ro * a * (1 + 0.05 * l);
  l > 0 && (e.save(), e.fillStyle = o, e.globalAlpha = 0.15 * l, e.beginPath(), e.ellipse(t.x, t.y, 9 * a, 4 * a, 0, 0, Math.PI * 2), e.fill(), e.restore());
  const f = { x: t.x + h.x + 6 * l * a, y: t.y + h.y - 18 * l * a }, d = V.pencilGrip, m = (v) => {
    const E = v.fingers.thumb, M = v.fingers.index, A = v.fingers.middle, T = zi([E.points[3], M.points[3], A.points[3]]), P = zi([E.points[1], M.points[0]]), _ = (E.depths[3] + M.depths[3] + A.depths[3]) / 3;
    return { pinch: T, direction: Math.atan2(P.y - T.y, P.x - T.x), depth: _ };
  }, p = ts(d, { size: u }), g = c - m(p).direction, y = ts(d, { size: u, angle: g * 180 / Math.PI }), b = m(y), w = ud[i] * a, S = { x: b.pinch.x - Math.cos(c) * w, y: b.pinch.y - Math.sin(c) * w }, k = { x: f.x - S.x, y: f.y - S.y }, x = y.axes.up;
  fd(e, k, { x: -x.x, y: -x.y }, u, n.arm ?? 300 * a, r, n.sleeve ?? "#5b7db1", o), xs(e, k, d, {
    size: u,
    angle: g * 180 / Math.PI,
    skin: r,
    ink: o,
    lineWidth: 3 * a,
    prop: {
      depth: b.depth,
      draw: () => {
        e.save(), e.translate(f.x, f.y), e.scale(a, a), i === "eraser" ? $o(e, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, outline: o }, s) : hd(e, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, length: 190, outline: o }, s), e.restore();
      }
    }
  });
}
const zi = (e) => ({
  x: e.reduce((t, n) => t + n.x, 0) / e.length,
  y: e.reduce((t, n) => t + n.y, 0) / e.length
});
function fd(e, t, n, s, i, r, o, a) {
  const l = { x: -n.y, y: n.x }, c = s * 0.15, h = (p, g, y) => ({
    x: t.x + n.x * p + l.x * g * y,
    y: t.y + n.y * p + l.y * g * y
  }), u = h(i, 0, 0), f = (p) => {
    const g = e.createLinearGradient(t.x, t.y, u.x, u.y);
    return g.addColorStop(0, p), g.addColorStop(0.6, p), g.addColorStop(1, dd(p)), g;
  }, d = Math.min(s * 0.55, i * 0.35);
  e.save(), e.lineJoin = "round", e.lineCap = "round", e.lineWidth = 3 * (s / Ro), e.beginPath(), e.moveTo(h(-s * 0.1, -1, c).x, h(-s * 0.1, -1, c).y), e.lineTo(h(d + 4, -1, c * 1.1).x, h(d + 4, -1, c * 1.1).y), e.lineTo(h(d + 4, 1, c * 1.1).x, h(d + 4, 1, c * 1.1).y), e.lineTo(h(-s * 0.1, 1, c).x, h(-s * 0.1, 1, c).y), e.closePath(), e.fillStyle = r, e.fill(), e.strokeStyle = a, e.beginPath(), e.moveTo(h(0, -1, c).x, h(0, -1, c).y), e.lineTo(h(d, -1, c * 1.1).x, h(d, -1, c * 1.1).y), e.moveTo(h(0, 1, c).x, h(0, 1, c).y), e.lineTo(h(d, 1, c * 1.1).x, h(d, 1, c * 1.1).y), e.stroke();
  const m = [h(d, -1, c * 1.3), h(i, -1, c * 1.5), h(i, 1, c * 1.5), h(d, 1, c * 1.3)];
  e.beginPath(), m.forEach((p, g) => g ? e.lineTo(p.x, p.y) : e.moveTo(p.x, p.y)), e.closePath(), e.fillStyle = f(o), e.fill(), e.strokeStyle = f(a), e.beginPath(), e.moveTo(m[1].x, m[1].y), e.lineTo(m[0].x, m[0].y), e.lineTo(m[3].x, m[3].y), e.lineTo(m[2].x, m[2].y), e.stroke(), e.restore();
}
function cp(e, t, n = {}) {
  const s = n.offstage ?? { x: 2e3, y: 1400 }, i = n.enter ?? 450, r = n.exit ?? 450, o = n.linger ?? 1500, a = [...e].filter((p) => p.path.length > 0).sort((p, g) => p.start - g.start), l = (p) => p.tool ?? "pencil", c = (p) => {
    const g = Math.min(1, Math.max(0, p));
    return g * g * (3 - 2 * g);
  }, h = (p, g, y) => ({ x: p.x + (g.x - p.x) * y, y: p.y + (g.y - p.y) * y }), u = a.find((p) => t >= p.start && t <= p.end);
  if (u) {
    const p = u.end - u.start, g = p > 0 ? (t - u.start) / p : 1;
    return { at: Ss(u.path, g), tool: l(u), lift: 0, drawing: !0 };
  }
  const f = [...a].reverse().find((p) => p.end < t), d = a.find((p) => p.start > t), m = (p) => p.path[p.path.length - 1];
  if (f && d && d.start - f.end <= o) {
    const p = (t - f.end) / (d.start - f.end), g = p < 0.5 ? l(f) : l(d);
    return { at: h(m(f), d.path[0], c(p)), tool: g, lift: Math.sin(Math.PI * p), drawing: !1 };
  }
  if (d && d.start - t <= i) {
    const p = 1 - (d.start - t) / i;
    return { at: h(s, d.path[0], c(p)), tool: l(d), lift: 1 - c(p), drawing: !1 };
  }
  if (f && t - f.end <= r) {
    const p = (t - f.end) / r;
    return { at: h(m(f), s, c(p)), tool: l(f), lift: c(p), drawing: !1 };
  }
  return null;
}
function hp(e, t, n, s = 0.08, i = 32) {
  const r = Math.PI * 2 * (1 + s), o = [];
  for (let a = 0; a <= i; a++) {
    const l = -Math.PI / 2 + r * a / i;
    o.push({ x: e + Math.cos(l) * n, y: t + Math.sin(l) * n });
  }
  return o;
}
function up(e) {
  const { path: t } = e, n = t.map((a) => a.x), s = t.map((a) => a.y), i = Math.min(...n), r = Math.min(...s), o = e.hand === !1 ? void 0 : e.hand === !0 || e.hand === void 0 ? {} : e.hand;
  return {
    type: "custom",
    x: i,
    y: r,
    width: Math.max(1, Math.max(...n) - i),
    height: Math.max(1, Math.max(...s) - r),
    props: { draw: 0 },
    draw(a, l, c) {
      const h = Math.min(1, Math.max(0, Number(l.props?.draw ?? 0)));
      a.translate(-i, -r), a.strokeStyle = e.color ?? "#2f2f33", a.lineWidth = e.lineWidth ?? 5, a.lineCap = "round", a.lineJoin = "round";
      const u = e.sketch ? Jn(a, e.sketch, c) : void 0;
      h > 0 && (u ? e.smooth ? u.curve(t, h) : u.line(t, h) : Lo(a, me(t, h))), o && h > 0 && h < 1 && Oo(a, Ss(t, h), o, u);
    }
  };
}
function dd(e) {
  const t = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(e.trim());
  if (!t) return "rgba(0, 0, 0, 0)";
  const n = t[1].length === 3 ? [...t[1]].map((o) => o + o).join("") : t[1], [s, i, r] = [0, 2, 4].map((o) => parseInt(n.slice(o, o + 2), 16));
  return `rgba(${s}, ${i}, ${r}, 0)`;
}
function Lo(e, t, n) {
  if (!(t.length < 2)) {
    if (n) return n.line(t);
    e.beginPath(), e.moveTo(t[0].x, t[0].y);
    for (const s of t.slice(1)) e.lineTo(s.x, s.y);
    e.stroke();
  }
}
const $e = 1e5;
function fp(e, t, n, s, i = 6) {
  const r = [], o = Math.max(1, Math.round(i));
  for (let a = 0; a <= o; a++)
    r.push({ x: a % 2 === 0 ? e : e + n, y: t + s * a / o });
  return r;
}
function Fo(e, t, n, s) {
  if (s <= 0 || t.length === 0) return;
  const i = me(t, s), r = n / 2, o = (a) => {
    e.beginPath(), e.rect(-$e, -$e, 2 * $e, 2 * $e), a(), e.clip("evenodd");
  };
  for (const a of i)
    o(() => {
      e.moveTo(a.x + r, a.y), e.arc(a.x, a.y, r, 0, Math.PI * 2);
    });
  for (let a = 1; a < i.length; a++) {
    const l = i[a - 1], c = i[a], h = Math.hypot(c.x - l.x, c.y - l.y);
    if (h === 0) continue;
    const u = -(c.y - l.y) / h * r, f = (c.x - l.x) / h * r;
    o(() => {
      e.moveTo(l.x + u, l.y + f), e.lineTo(c.x + u, c.y + f), e.lineTo(c.x - u, c.y - f), e.lineTo(l.x - u, l.y - f), e.closePath();
    });
  }
}
function dp(e, t, n, s, i) {
  e.save(), Fo(e, t, n, s), i(), e.restore();
}
function pp(e, t) {
  const n = t.width ?? 40, s = t.hand === !0 ? {} : t.hand || void 0, i = t.eraser === !1 ? void 0 : t.eraser === !0 || t.eraser === void 0 ? {} : t.eraser;
  return {
    ...e,
    props: { ...e.props, erase: 0 },
    draw(r, o, a) {
      const l = Number(o.props?.erase ?? 0);
      if (r.save(), Fo(r, t.path, n, l), e.draw(r, o, a), r.restore(), !i || l <= 0 || l >= 1) return;
      const c = Ss(t.path, l);
      s ? Oo(r, c, { ...s, tool: "eraser" }) : $o(r, c, i);
    }
  };
}
const pd = (e, t, n) => e.slice(Math.floor((e.length - 1) * t), Math.ceil((e.length - 1) * n) + 1);
function mp(e = {}) {
  const t = e.shirt ?? "#e2493b", n = e.trousers ?? "#24476b", s = (a) => a.lineWidth * 0.45, i = (a, l, c) => {
    const h = a.parts[`leg.${c}`].points;
    l.shape(We(h, a.height * 0.08, a.height * 0.05), n, s(a));
  }, r = (a, l) => {
    const c = a.chains.spine, h = c[0], u = c[c.length - 1], f = { x: h.x - (u.x - h.x) * 0.25, y: h.y - (u.y - h.y) * 0.25 };
    l.shape(We([f, ...a.parts.spine.points], a.height * 0.15, a.height * 0.14), t, s(a));
  }, o = (a, l, c) => {
    const h = a.parts[`arm.${c}`].points, u = h[0], f = a.chains.spine[a.chains.spine.length - 1], m = [{ x: u.x + (f.x - u.x) * 0.45, y: u.y + (f.y - u.y) * 0.45 }, ...pd(h, 0, 0.45)], p = We(m, a.height * 0.085, a.height * 0.06), g = m.length, y = p.slice(0, g), b = p.slice(g).reverse();
    l.shape(p, t, 0);
    const w = (x) => Math.hypot(x[1].x - f.x, x[1].y - f.y), [S, k] = w(y) > w(b) ? [y, b] : [b, y];
    l.line(S.slice(1), s(a)), l.line(k.slice(Math.ceil(g * 0.45)), s(a)), l.line([y[g - 1], b[g - 1]], s(a));
  };
  return {
    parts: {
      "leg.left": { over: (a, l, c) => i(l, c, "left") },
      "leg.right": { over: (a, l, c) => i(l, c, "right") },
      spine: { over: (a, l, c) => r(l, c) },
      "arm.left": { over: (a, l, c) => o(l, c, "left") },
      "arm.right": { over: (a, l, c) => o(l, c, "right") }
    }
  };
}
const Ln = {
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
function md(e) {
  if (e === void 0) return Ln.full;
  if (typeof e == "string") return Ln[e];
  const { base: t, ...n } = e;
  return { ...Ln[t ?? "full"], ...n };
}
const ls = 160, gd = 120, yd = 700, Fn = 60, bd = 90, Re = 3200, Kt = 1, Tt = 1e-6;
function Bo(e, t, n = {}) {
  const s = md(n.style), i = n.seed ?? 1, r = {};
  if (e.length === 0) return r;
  const o = Object.keys(e[0].pose).filter((u) => e.some((f) => Math.abs(f.pose[u] - e[0].pose[u]) > Tt));
  for (const u of o) r[u] = wd(u, e, t, s, i);
  const a = t.blink, l = a !== void 0 && o.includes(a);
  if (s.blinks && a !== void 0 && !l && a in e[0].pose) {
    const u = vd(e, t, s, i, e[0].pose[a]);
    u.length > 0 && (r[a] = u);
  }
  const { lift: c, stretch: h } = t;
  if (s.jumpSquash > 0 && c && h && o.includes(c) && !o.includes(h) && h in e[0].pose) {
    const u = kd(e, c, e[0].pose[h], s.jumpSquash);
    u.length > 0 && (r[h] = u);
  }
  return r;
}
function wd(e, t, n, s, i) {
  const r = n.eyes.includes(e), o = n.limits[e], a = o !== void 0, l = r ? -s.eyeLead : (n.depth[e] ?? 1) * s.overlap, c = (d) => {
    const m = (t[d].time - t[d - 1].time) / 2;
    return Math.max(-m, Math.min(m, l));
  }, h = [{ time: t[0].time, value: t[0].pose[e] }], u = (d, m, p) => {
    const g = h[h.length - 1];
    if (d <= g.time + Kt) {
      h[h.length - 1] = { ...g, value: m, ...p ? { easing: p } : {} };
      return;
    }
    h.push({ time: d, value: m, ...p ? { easing: p } : {} });
  };
  let f = t[0].pose[e];
  for (let d = 1; d < t.length; d++) {
    const m = t[d], p = t[d - 1].pose[e], g = m.pose[e], y = g - p, b = h[h.length - 1].time, w = m.act !== !1;
    if (Math.abs(y) <= Tt) {
      const T = m.time + (w ? c(d) : 0);
      if (d === t.length - 1)
        Math.abs(f - g) > Tt && u(Math.max(T, b + ls), g, "ease-in-out"), f = g;
      else if (w && a && s.drift > 0 && n.drift.includes(e) && T - b >= yd) {
        const P = Se(`${i}:${e}:${d}`) % 2 === 0 ? 1 : -1;
        f = g + P * s.drift * o, u(T, f, "ease-in-out");
      }
      continue;
    }
    if (!w) {
      u(t[d - 1].time, f), u(m.time, g, m.easing), f = g;
      continue;
    }
    const S = c(d), k = Math.max(t[d - 1].time + S, b);
    let x = m.time + S;
    r && s.eyeDart > 0 && (x = Math.min(x, k + s.eyeDart));
    const v = x - k;
    if (v <= Kt) {
      u(m.time, g, m.easing), f = g;
      continue;
    }
    u(k, f);
    const E = Math.sign(y);
    if (a && s.anticipation > 0 && o > 0 && v >= ls) {
      const T = f - E * Math.min(Math.abs(y) * s.anticipation, o), P = k + v * s.anticipationTime;
      u(P, T, "ease-in-out"), s.hold > 0 && u(P + v * s.hold, T);
    }
    const M = d + 1 < t.length ? t[d + 1].time - m.time : 1 / 0, A = Math.min(s.settle, M / 2);
    if (a && s.overshoot > 0 && o > 0 && v >= gd && A > Kt) {
      const T = Math.min(Math.abs(y) * s.overshoot, o);
      u(x, g + E * T, m.easing ?? s.actionEase), u(x + A, g, s.settleEase);
    } else
      u(x, g, m.easing ?? s.actionEase);
    f = g;
  }
  return h;
}
function vd(e, t, n, s, i) {
  const r = [], o = Fn + bd;
  for (let d = 1; d < e.length; d++) {
    const m = e[d - 1].pose, p = e[d].pose;
    Object.entries(t.headTurns).some(([y, b]) => Math.abs((p[y] ?? 0) - (m[y] ?? 0)) > b) && e[d].act !== !1 && r.push(Math.max(e[0].time, e[d - 1].time - n.eyeLead));
  }
  const a = e[0].time, l = e[e.length - 1].time, c = [...r];
  let h = a + Re * 0.6, u = 0;
  for (; h < l; ) {
    c.some((p) => Math.abs(p - h) < Re / 2) || r.push(h);
    const m = (Se(`${s}:blink:${u++}`) % 1e3 / 1e3 - 0.5) * (Re * 0.66);
    h += Re + m;
  }
  r.sort((d, m) => d - m);
  const f = [{ time: a, value: i }];
  for (const d of r) {
    const m = f[f.length - 1].time;
    d + Fn <= m + Kt || (d > m + Kt && f.push({ time: d, value: i }), f.push({ time: d + Fn, value: 1, easing: "ease-in" }), f.push({ time: d + o, value: i, easing: "ease-out" }));
  }
  return f.length > 1 ? f : [];
}
function kd(e, t, n, s) {
  const i = n * (1 - 0.18 * s), r = n * (1 + 0.14 * s), o = [{ time: e[0].time, value: n }], a = (l, c, h) => {
    const u = o[o.length - 1];
    l <= u.time + Kt || o.push({ time: l, value: c, ...h ? { easing: h } : {} });
  };
  for (let l = 1; l < e.length; l++) {
    const c = e[l - 1].pose[t], h = e[l].pose[t], u = e[l - 1].time, f = e[l].time, d = f - u;
    if (!(d < ls || e[l].act === !1)) {
      if (c <= Tt && h > Tt)
        a(u, n), a(u + d * 0.2, i, "ease-out"), a(u + d * 0.45, r, "ease-out"), a(f, n, "ease-in-out");
      else if (c > Tt && h <= Tt) {
        const m = l + 1 < e.length ? e[l + 1].time - f : 400;
        a(u + d * 0.5, n), a(f - Math.min(60, d * 0.15), r, "ease-in"), a(f, i, "ease-out"), a(f + Math.min(260, m / 2), n, { type: "back", mode: "out", overshoot: 1.4 });
      }
    }
  }
  return o.length > 1 ? o : [];
}
const Sd = {
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
function Md(e) {
  return /^(turn|lean|side|lift|roll|stretch)$/.test(e) ? { depth: 0, limit: { turn: 0.06, lean: 10, side: 8, lift: 0, roll: 25, stretch: 0.08 }[e] } : /^leg\.\w+\.(swing|spread|rotate)$/.test(e) ? { depth: 0, limit: 12 } : /^head\./.test(e) ? { depth: 1, limit: 12 } : /^arm\.\w+\.(swing|spread)$/.test(e) ? { depth: 1, limit: 20 } : /^leg\.\w+\.knee$/.test(e) ? { depth: 1, limit: 15 } : /^(brow\.|browTilt$)/.test(e) ? { depth: 1, limit: e === "browTilt" ? void 0 : 0.25 } : /^eye\./.test(e) ? { depth: 1, limit: 0.15 } : /^arm\.\w+\.(elbow|bend)$/.test(e) ? { depth: 2, limit: 18 } : /^leg\.\w+\.(ankle|toeOut)$/.test(e) ? { depth: 2, limit: 10 } : /^(mouth|smile|mouthWidth)$/.test(e) ? { depth: 2 } : /^hand\./.test(e) ? { depth: 3 } : { depth: 1 };
}
function xd() {
  const e = {}, t = {};
  for (const n of Object.keys(U)) {
    const s = Md(n);
    e[n] = s.depth, s.limit !== void 0 && (t[n] = s.limit);
  }
  return {
    depth: e,
    limits: t,
    eyes: ["lookX", "lookY"],
    blink: "blink",
    headTurns: { turn: 0.15, "head.turn": 15, "head.nod": 12, lookX: 0.5, roll: 45 },
    drift: ["lean", "head.tilt", "head.nod", "arm.left.spread", "arm.right.spread", "arm.left.elbow", "arm.right.elbow"],
    lift: "lift",
    stretch: "stretch"
  };
}
const Td = xd();
function Do(e, t) {
  return Object.entries(t).map(([n, s]) => ({ id: `${e}-${n}`, target: e, property: n, keyframes: s }));
}
function Ed(e, t, n = {}) {
  const s = vo(t), i = t.map((r, o) => ({ time: r.time, pose: { ...s[o] }, easing: r.easing, act: r.act }));
  return Do(e, Bo(i, n.rig ?? Sd, n));
}
function gp(e, t, n = {}) {
  const s = n.rest ?? U, i = Ho(t, s), r = t.map((o, a) => ({ time: o.time, pose: { ...s, ...i[a] }, easing: o.easing, act: o.act }));
  return Do(e, Bo(r, n.rig ?? Td, n));
}
const ji = q.shocked, Ad = q.scared, Os = {
  /** The classic take: squash down in a squint, then shoot up stretched with eyes popping, hang, and land squashed. */
  take: (e) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: e.lean - 4, leftShoulder: 8, rightShoulder: 8, leftEye: 0.35, rightEye: 0.35, leftBrow: -0.6, rightBrow: -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { rise: 0.22, stretch: 1.35, bend: -14, leftShoulder: 150, rightShoulder: 150, leftElbow: 35, rightElbow: 35, leftHip: 22, rightHip: 22, leftKnee: 45, rightKnee: 45, ...ji, headTilt: 0 }, easing: "ease-out-cubic" },
    { after: 720, pose: { rise: 0.25, stretch: 1.25, bend: -10, leftShoulder: 140, rightShoulder: 140 }, easing: "ease-in-out" },
    { after: 900, pose: { rise: 0, stretch: 0.74, bend: 12, leftShoulder: 70, rightShoulder: 70, leftHip: 18, rightHip: 18, leftKnee: 30, rightKnee: 30 }, easing: "ease-in-quad" },
    { after: 1060, pose: { stretch: 1.06, bend: -3, leftShoulder: 60, rightShoulder: 60, leftHip: e.leftHip, rightHip: e.rightHip, leftKnee: e.leftKnee, rightKnee: e.rightKnee }, easing: "ease-out" },
    { after: 1260, pose: { stretch: e.stretch, bend: e.bend, ...q.surprised, leftShoulder: 70, rightShoulder: 70, leftElbow: 60, rightElbow: 60 }, easing: "ease-in-out" }
  ],
  /** Glance at something, look away unbothered, then snap back to it in shock. */
  doubleTake: (e) => [
    { after: 160, pose: { lookX: 1, lookY: 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, headTilt: e.headTilt - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { bend: e.bend - 10, headTilt: e.headTilt + 10, rise: 0.05, stretch: 1.18, ...ji, lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { rise: 0, stretch: 0.88, bend: e.bend + 4, headTilt: e.headTilt + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: e.stretch, bend: e.bend, headTilt: e.headTilt }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
  ],
  /** Rear back for a zip-off: lean back, one knee up, arms cocked, hold, then pitch forward ready to run. */
  windUp: () => [
    { after: 220, pose: { lean: -18, bend: -16, headTilt: -6, leftShoulder: 70, leftElbow: -100, rightShoulder: 40, rightElbow: 100, leftHip: -45, leftKnee: -80, stretch: 0.92, ...q.angry, lookX: 1 }, easing: "ease-out" },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, headTilt: 6, leftShoulder: 30, rightShoulder: 60, leftHip: 30, leftKnee: -30, rightHip: -20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down to the ground: stretched in the fall, squashed on contact, a spring back up. */
  land: (e) => [
    { after: 120, pose: { rise: 0, stretch: 0.7, bend: 14, leftShoulder: 75, rightShoulder: 75, leftHip: 20, rightHip: 20, leftKnee: 35, rightKnee: 35 }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, leftShoulder: e.leftShoulder, rightShoulder: e.rightShoulder }, easing: "ease-out" },
    { after: 460, pose: { rise: 0, stretch: e.stretch, bend: e.bend, leftHip: W.leftHip, rightHip: W.rightHip, leftKnee: 0, rightKnee: 0 }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: small, fast shakes with wide eyes, then still. */
  tremble: (e) => {
    const t = [{ after: 80, pose: { ...Ad, bend: e.bend + 8, leftShoulder: 40, rightShoulder: 40, leftElbow: 110, rightElbow: 110, stretch: 0.94 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) t.push({ after: 80 + n * 45, pose: { lean: e.lean + (n % 2 === 0 ? 2.5 : -2.5), headTilt: e.headTilt + (n % 2 === 0 ? -2 : 2) } });
    return t.push({ after: 755, pose: { lean: e.lean, headTilt: e.headTilt, bend: e.bend } }), t;
  },
  /** A sigh: the body sags, shoulders drop, head and eyes go down. */
  deflate: (e) => [
    { after: 260, pose: { stretch: 1.04, headTilt: e.headTilt + 4, leftBrow: 0.3, rightBrow: 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...Me.sad, bend: 18, stretch: 0.92, lean: e.lean + 5, turn: e.turn, sit: e.sit }, easing: "ease-in-out" }
  ]
};
function Pd(e, t) {
  const n = typeof t.from == "string" ? Me[t.from] : t.from ?? W, s = t.speed ?? 1;
  let i = n;
  return [
    // The move onto the starting pose is acted like any other; the gag itself is not.
    { time: t.at, pose: n },
    ...Os[e](n).map((r) => (i = { ...i, ...r.pose }, { time: t.at + r.after * s, pose: i, act: !1, ...r.easing ? { easing: r.easing } : {} }))
  ];
}
function _d(e, t = 1) {
  const n = Os[e](W);
  return n[n.length - 1].after * t;
}
function Id(e, t, n = {}) {
  if (t.length < 2) return;
  const s = Math.max(1, Math.round(n.lines ?? 3)), i = n.spacing ?? 5, r = n.lineWidth ?? 2, o = n.opacity ?? 0.7;
  e.save(), e.strokeStyle = n.color ?? "#222", e.lineCap = "round";
  for (let a = 0; a < s; a++) {
    const l = (a - (s - 1) / 2) * i, c = Math.floor(Math.abs(l) / Math.max(i, 1) * (t.length / 6));
    for (let h = c + 1; h < t.length; h++) {
      const u = t[h - 1], f = t[h], d = f.x - u.x, m = f.y - u.y, p = Math.hypot(d, m) || 1, g = -m / p, y = d / p, b = 1 - h / (t.length - 1);
      e.globalAlpha = o * (1 - b), e.lineWidth = r * (1 - b * 0.7), e.beginPath(), e.moveTo(u.x + g * l, u.y + y * l), e.lineTo(f.x + g * l, f.y + y * l), e.stroke();
    }
  }
  e.restore();
}
const Cd = {
  hands: [
    { name: "left hand", at: (e) => e.hands.left },
    { name: "right hand", at: (e) => e.hands.right }
  ],
  toes: [
    { name: "left toe", at: (e) => e.toes.left },
    { name: "right toe", at: (e) => e.toes.right }
  ],
  head: [{ name: "head", at: (e) => e.head.center }],
  body: [
    { name: "hip", at: (e) => e.hip },
    { name: "neck", at: (e) => e.neck }
  ]
};
function yp(e, t, n, s, i = {}) {
  const r = n.stateAt;
  if (!r) return;
  const o = i.length ?? 120, a = Math.max(2, Math.round(i.samples ?? 8)), l = Math.max(0, n.time - o);
  if (n.time - l < 1) return;
  const c = [];
  for (let d = 0; d < a; d++) {
    const m = l + (n.time - l) * d / (a - 1);
    c.push(Vu(t, { time: m, state: r(m) }, s).joints);
  }
  const h = c[c.length - 1].height, u = (i.threshold ?? 1.2) * h, f = (i.parts ?? ["hands", "toes", "head"]).flatMap((d) => Cd[d]);
  for (const d of f) {
    const m = c.map(d.at);
    let p = 0;
    for (let b = 1; b < m.length; b++) p += Math.hypot(m[b].x - m[b - 1].x, m[b].y - m[b - 1].y);
    const g = p / ((n.time - l) / 1e3);
    if (g <= u) continue;
    const y = Math.min(1, (g - u) / (u * 0.5));
    Id(e, m, { ...i, opacity: (i.opacity ?? 0.7) * y, spacing: i.spacing ?? h * 0.02 });
  }
}
function bp(e, t, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const i = s.size ?? 40, r = s.seed ?? 1, o = 0.45 + 0.55 * (1 - (1 - n) ** 3);
  e.save(), e.strokeStyle = s.color ?? "#555", e.lineWidth = Math.max(1, i * 0.03), e.globalAlpha = Math.min(1, n / 0.08) * (1 - n);
  for (let a = 0; a < 5; a++) {
    const l = Se(`${r}:puff:${a}`) % 1e3 / 1e3, c = a - 2, h = t.x + c * i * 0.3 * o, u = t.y - i * (0.06 + 0.12 * l) * o + Math.abs(c) * i * 0.03, f = i * (0.11 + 0.07 * l) * o;
    e.beginPath(), e.arc(h, u, f, Math.PI * 0.95, Math.PI * 2.05), e.stroke();
  }
  e.restore();
}
function wp(e, t, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const i = s.size ?? 40, r = 5, o = 1 - (1 - n) ** 2;
  e.save(), e.strokeStyle = s.color ?? "#222", e.lineWidth = Math.max(1, i * 0.035), e.lineJoin = "round", e.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  for (let a = 0; a < r; a++) {
    const l = -Math.PI / 2 + (a - (r - 1) / 2) * Math.PI / (r + 1), c = i * (0.3 + 0.7 * o), h = t.x + Math.cos(l) * c, u = t.y + Math.sin(l) * c;
    Hd(e, h, u, i * 0.14, n * Math.PI + a), e.stroke();
  }
  e.restore();
}
function Hd(e, t, n, s, i) {
  e.beginPath();
  for (let r = 0; r < 10; r++) {
    const o = r % 2 === 0 ? s : s * 0.45, a = i + r * Math.PI / 5 - Math.PI / 2, l = t + Math.cos(a) * o, c = n + Math.sin(a) * o;
    r === 0 ? e.moveTo(l, c) : e.lineTo(l, c);
  }
  e.closePath();
}
const St = {
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
}, te = 1, Oe = 0.55, Gi = 0.35, $d = 1.6, Ji = { a: "a", e: "e", i: "i", y: "i", o: "o", u: "u" }, Zi = { m: "m", b: "m", p: "m", f: "f", v: "f", w: "u", q: "u", l: "l", n: "l", d: "l", t: "l" }, Qi = {
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
}, tr = {
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
}, Rd = { प: "m", फ: "m", ब: "m", भ: "m", म: "m", व: "u" }, Od = "्", er = "़", Ld = (e) => e >= "क" && e <= "ह", nr = /* @__PURE__ */ new Set([".", ",", "!", "?", ";", ":", "…", "।", "॥", "—", "-"]);
function Fd(e) {
  const t = [], n = Array.from(e.toLowerCase()), s = (i, r) => {
    const o = t[t.length - 1];
    o && o.viseme === i ? o.weight += r * 0.5 : t.push({ viseme: i, weight: r });
  };
  for (let i = 0; i < n.length; i++) {
    const r = n[i], o = n[i + 1];
    if (nr.has(r)) s("rest", $d);
    else if (/\s/.test(r)) {
      const a = t[t.length - 1];
      a && a.viseme !== "rest" && t.push({ viseme: "c", weight: Gi });
    } else if ((r === "o" || r === "e") && o === r)
      s(r === "o" ? "u" : "i", te), i++;
    else if (r in Ji) s(Ji[r], te);
    else if (r in Zi) s(Zi[r], Oe);
    else {
      if (r === "h") continue;
      if (/[a-z]/.test(r)) s("c", Oe);
      else if (r in Qi) s(Qi[r], te);
      else if (Ld(r)) {
        const a = o === er ? r === "फ" ? "f" : void 0 : Rd[r];
        s(a ?? "c", Oe);
        let l = i + 1;
        n[l] === er && l++;
        const c = n[l];
        c === Od ? i = l : c && c in tr ? (s(tr[c], te), i = l) : (!c || /\s/.test(c) || nr.has(c) || s("a", te * 0.6), i = l - 1);
      } else (r === "ं" || r === "ँ") && s("l", Oe * 0.6);
    }
  }
  for (; t.length > 0 && (t[t.length - 1].viseme === "rest" || t[t.length - 1].weight === Gi); ) t.pop();
  return t;
}
function Wo(e, t = {}) {
  const n = t.fields?.mouth ?? "mouth", s = t.fields?.mouthWidth ?? "mouthWidth", i = t.energy ?? 1, r = Fd(e.text), o = [{ time: e.start, value: St.rest.mouth }], a = [{ time: e.start, value: St.rest.mouthWidth }], l = r.reduce((h, u) => h + u.weight, 0), c = e.end - e.start;
  if (l > 0 && c > 0) {
    let h = e.start;
    for (const u of r) {
      const f = c * u.weight / l, d = h + Math.min(f * 0.4, 60);
      if (d > o[o.length - 1].time) {
        const m = St[u.viseme];
        o.push({ time: d, value: m.mouth * i, easing: "ease-out" }), a.push({ time: d, value: 1 + (m.mouthWidth - 1) * Math.min(1.3, i), easing: "ease-out" });
      }
      h += f;
    }
  }
  return e.end > o[o.length - 1].time && (o.push({ time: e.end, value: St.rest.mouth, easing: "ease-in-out" }), a.push({ time: e.end, value: St.rest.mouthWidth, easing: "ease-in-out" })), { [n]: o, [s]: a };
}
function vp(e, t, n = {}) {
  const s = {};
  for (const i of [...t].sort((r, o) => r.start - o.start))
    for (const [r, o] of Object.entries(Wo(i, n))) {
      const a = s[r] ??= [], l = a.length > 0 ? a[a.length - 1].time : -1 / 0;
      a.push(...o.filter((c) => c.time > l));
    }
  return Object.entries(s).map(([i, r]) => ({ id: `${e}-${i}`, target: e, property: i, keyframes: r }));
}
function Bd(e, t, n, s = {}) {
  if (n.length === 0) return t;
  const i = s.fields?.mouth ?? "mouth", r = s.fields?.mouthWidth ?? "mouthWidth", o = { [i]: St.rest.mouth, [r]: St.rest.mouthWidth, ...s.rest }, a = new hn({ id: "before-speech", tracks: t }), l = (u, f) => a.getStateAtTime(f).values.get(e)?.get(u) ?? o[u], c = [i, r], h = t.filter((u) => u.target !== e || !c.includes(u.property));
  for (const u of c) {
    const f = t.find((m) => m.target === e && m.property === u);
    let d = f ? [...f.keyframes] : [{ time: 0, value: l(u, 0) }];
    for (const m of n) {
      const p = Wo(m, s)[u];
      p[0] = { ...p[0], value: l(u, m.start) }, p[p.length - 1] = { ...p[p.length - 1], value: l(u, m.end) }, d = [...d.filter((g) => g.time < m.start || g.time > m.end), ...p], d.sort((g, y) => g.time - y.time);
    }
    h.push({ id: f?.id ?? `${e}-${u}`, target: e, property: u, keyframes: d });
  }
  return h;
}
const Dd = {
  walk: 1e3,
  bouncy: 900,
  doubleBounce: 1100,
  sneak: 1600,
  strut: 1100,
  tired: 1500,
  run: 560
}, pt = 450, sr = 1200, Wd = 700, Rt = 320, ee = 220, Nd = 65, Kd = 700, Bn = (e) => e in Nt, ir = (e) => e in Os, Yd = (e) => e in Me;
function Xd(e) {
  return Math.max(Kd, Array.from(e).length * Nd);
}
function kp(e, t, n = {}) {
  const s = n.from ?? 0, i = n.height ?? 300;
  let r = s, o = n.facing ?? 1, a = n.start ?? W, l = 0, c = 0;
  const h = [{ time: 0, pose: a }], u = [{ time: 0, value: 0 }], f = [{ time: 0, value: 0 }], d = [{ time: 0, value: 0 }], m = [{ time: 0, value: "walk" }], p = [{ time: 0, value: o }], g = [], y = [], b = (v, E, M, A) => {
    a = { ...a, ...E }, M && (a = Ze(a, M)), h.push({ time: v, pose: a });
  }, w = (v, E, M) => (b(v + Rt / 2, { turn: 0 }, M), p.push({ time: v + Rt / 2, value: o }, { time: v + Rt / 2 + 1, value: E }), o = E, b(v + Rt, { turn: 1 }), v + Rt), S = (v) => v < r ? -1 : 1;
  for (const v of t) {
    const E = Math.max(v.at ?? c, c === 0 ? 0 : h[h.length - 1].time);
    let M = E;
    const A = v.pose ?? {};
    if (Bn(v.do)) {
      const T = v.to ?? r, P = T === r ? o : S(T);
      let _ = E;
      P !== o ? _ = w(E, P, v.mood) : a.turn < 1 ? (_ = E + ee, b(_, { turn: 1, ...A }, v.mood)) : (v.mood || v.pose) && b(E + ee, A, v.mood);
      const C = Math.abs(T - r) / fu(v.do, i), R = v.for ?? Math.max(ee * 2, C * Dd[v.do]), B = _ + R;
      m.push({ time: _, value: v.do }), d.push({ time: _, value: 0 }, { time: _ + ee, value: 1, easing: "ease-out" }), d.push({ time: B - ee, value: 1 }, { time: B, value: 0, easing: "ease-in" }), f.push({ time: _, value: l }, { time: B, value: l + C }), u.push({ time: _, value: r - s }, { time: B, value: T - s }), l += C, r = T, b(B, {}), M = B;
    } else if (ir(v.do)) {
      const T = Pd(v.do, { at: E, from: v.mood ? Ze(a, v.mood) : a });
      h.push(...T), a = T[T.length - 1].pose, M = E + _d(v.do);
    } else if (v.do === "look" || v.do === "face") {
      const T = v.toward ?? "viewer", P = v.for ?? Wd;
      if (T === "viewer") b(E + pt, { turn: 0, lookX: 0, lookY: 0, ...A }, v.mood);
      else if (T === "ahead") b(E + pt, { turn: v.do === "face" ? 1 : 0.6, lookX: 1, ...A }, v.mood);
      else if (T === "back") b(E + pt, { turn: 0.2, lookX: -1, ...A }, v.mood);
      else {
        const _ = S(T);
        _ !== o && v.do === "face" ? (w(E, _, v.mood), b(E + Rt + 1, { lookX: 1, ...A })) : _ !== o ? b(E + pt, { turn: 0.25, lookX: -1, ...A }, v.mood) : b(E + pt, { turn: v.do === "face" ? 1 : 0.6, lookX: 1, ...A }, v.mood);
      }
      M = E + Math.max(P, pt);
    } else if (Yd(v.do) || v.do === "stand") {
      const T = v.do === "stand" ? W : Me[v.do], P = T.turn !== W.turn ? T.turn : a.turn, _ = v.mood ? q[v.mood] : { lookX: a.lookX, lookY: a.lookY };
      b(E + pt, { ...T, turn: P, ..._, ...A }), M = E + (v.for ?? sr);
    } else {
      const T = v.for ?? (v.say ? Xd(v.say) : sr);
      (v.mood || v.pose) && b(E + Math.min(pt, T / 2), A, v.mood), M = E + T;
    }
    if (v.say) {
      const T = Bn(v.do) || ir(v.do) ? E : E + Math.min(150, (M - E) / 4), P = Bn(v.do) ? M : Math.max(T + 200, M - 100);
      g.push({ text: v.say, start: T, end: P }), v.do === "say" && Ud(h, a, T, P);
    }
    M > h[h.length - 1].time && h.push({ time: M, pose: a }), y.push({ start: E, end: M }), c = M;
  }
  const k = Ed(e, Vd(h), n), x = [
    { id: `${e}-x`, target: e, property: "x", keyframes: u },
    { id: `${e}-walk`, target: e, property: "walk", keyframes: f },
    { id: `${e}-walking`, target: e, property: "walking", keyframes: d },
    { id: `${e}-gait`, target: e, property: "gait", keyframes: m },
    { id: `${e}-facing`, target: e, property: "facing", keyframes: p }
  ].filter((v) => v.keyframes.length > 1 || v.property === "x");
  return {
    tracks: [...Bd(e, k, g, { energy: n.energy }), ...x],
    duration: c,
    lines: g,
    keys: h,
    beats: y
  };
}
const qd = 30;
function Vd(e) {
  const t = [];
  for (const n of e) {
    const s = t[t.length - 1];
    s && n.time - s.time < qd ? t[t.length - 1] = { ...n, time: s.time } : t.push(n);
  }
  return t;
}
function Ud(e, t, n, s) {
  const r = e.filter((l) => l.time > n), o = e.filter((l) => l.time <= n), a = [];
  for (let l = n + 520, c = 0; l < s - 520 / 2; l += 520, c++) {
    const h = c % 2 === 0 ? 3 : -2;
    a.push({ time: l, pose: { ...t, headTilt: t.headTilt + h, leftBrow: t.leftBrow + (c % 2 === 0 ? 0.25 : 0), rightBrow: t.rightBrow + (c % 2 === 0 ? 0.25 : 0) } });
  }
  a.length > 0 && a.push({ time: s, pose: t }), e.length = 0, e.push(...o, ...a.filter((l) => !r.some((c) => Math.abs(c.time - l.time) < 60)), ...r), e.sort((l, c) => l.time - c.time);
}
function Sp(e) {
  const { timeline: t } = e, n = new Et();
  for (const [c, h] of Object.entries(e.targets)) {
    const u = typeof h == "string" ? document.querySelector(h) : h;
    if (!u)
      throw new Error(`quickPlay: no element found for target "${c}" (${String(h)})`);
    n.registerTarget(c, u);
  }
  t.onUpdate = (c) => {
    n.applyState(c), e.onUpdate?.(c);
  }, e.onComplete && (t.onComplete = e.onComplete);
  let s = null, i = null, r = !1;
  const o = (c) => {
    if (r) return;
    const h = i === null ? 0 : c - i;
    i = c, h > 0 && t.tick(h), s = requestAnimationFrame(o);
  }, a = () => {
    s !== null || r || (i = null, s = requestAnimationFrame(o));
  }, l = () => {
    s !== null && cancelAnimationFrame(s), s = null, i = null;
  };
  return n.applyState(t.getStateAtTime(t.currentTime)), e.autoplay !== !1 && (t.play(), a()), {
    timeline: t,
    adapter: n,
    play() {
      t.play(), a();
    },
    pause() {
      t.pause(), l();
    },
    restart() {
      t.stop(), t.play(), a();
    },
    seek(c) {
      t.seek(c * 1e3), n.applyState(t.getStateAtTime(t.currentTime));
    },
    destroy() {
      r = !0, l(), t.stop(), n.clearTargets();
    }
  };
}
const Mp = {
  timeline: Ul,
  to(e, t, n) {
    const s = new Dt(n);
    return s.to(e, t), s;
  },
  from(e, t, n) {
    const s = new Dt(n);
    return s.from(e, t), s;
  },
  fromTo(e, t, n, s) {
    const i = new Dt(s);
    return i.fromTo(e, t, n), i;
  },
  set(e, t, n) {
    const s = new Dt(n);
    return s.set(e, t), s;
  }
};
function No(e, t, n) {
  if (typeof OffscreenCanvas < "u") return new OffscreenCanvas(t, n);
  const s = e.canvas;
  if (s?.ownerDocument) {
    const i = s.ownerDocument.createElement("canvas");
    return i.width = t, i.height = n, i;
  }
  try {
    return s?.constructor ? new s.constructor(t, n) : null;
  } catch {
    return null;
  }
}
function zd(e, t) {
  const n = e.length / 4, s = new Float32Array(n * 3), i = Math.min(0.999, Math.max(0, t));
  for (let r = 0; r < n; r++) {
    const o = e[r * 4] / 255, a = e[r * 4 + 1] / 255, l = e[r * 4 + 2] / 255, c = e[r * 4 + 3] / 255, h = Math.max(o, a, l);
    if (h <= i) continue;
    const u = (h - i) / (1 - i) * c / h;
    s[r * 3] = o * u, s[r * 3 + 1] = a * u, s[r * 3 + 2] = l * u;
  }
  return s;
}
function rr(e, t, n, s, i) {
  const r = new Float32Array(e.length), o = i ? n : t, a = i ? t : n, l = (h, u) => (i ? h * t + u : u * t + h) * 3, c = s * 2 + 1;
  for (let h = 0; h < o; h++)
    for (let u = 0; u < 3; u++) {
      let f = 0;
      for (let d = -s; d <= s; d++) f += e[l(h, Math.min(a - 1, Math.max(0, d))) + u];
      for (let d = 0; d < a; d++) {
        r[l(h, d) + u] = f / c;
        const m = e[l(h, Math.max(0, d - s)) + u], p = e[l(h, Math.min(a - 1, d + s + 1)) + u];
        f += p - m;
      }
    }
  return r;
}
function or(e, t, n, s) {
  const i = Math.max(1, Math.round(s / Math.sqrt(3)));
  let r = e;
  for (let o = 0; o < 3; o++)
    r = rr(r, t, n, i, !0), r = rr(r, t, n, i, !1);
  return r;
}
function xp(e, t = {}) {
  const n = e.canvas, s = n.width, i = n.height;
  if (!(s > 0 && i > 0)) return;
  const r = Math.max(1, Math.round(t.downsample ?? 4)), o = Math.max(1, Math.ceil(s / r)), a = Math.max(1, Math.ceil(i / r)), l = No(e, o, a), c = l?.getContext("2d");
  if (!l || !c) return;
  c.imageSmoothingEnabled = !0, c.drawImage(e.canvas, 0, 0, o, a);
  const h = zd(c.getImageData(0, 0, o, a).data, t.threshold ?? 0.55), u = (t.radius ?? Math.max(s, i) * 0.02) / r, f = or(h, o, a, u), d = or(h, o, a, u * 3), m = t.halo ?? 0.6, p = c.createImageData(o, a);
  for (let g = 0; g < o * a; g++) {
    for (let y = 0; y < 3; y++) p.data[g * 4 + y] = Math.round(Math.min(1, f[g * 3 + y] + d[g * 3 + y] * m) * 255);
    p.data[g * 4 + 3] = 255;
  }
  c.putImageData(p, 0, 0), e.save(), e.setTransform(1, 0, 0, 1, 0, 0), e.globalCompositeOperation = "lighter", e.globalAlpha = Math.max(0, t.strength ?? 0.9), e.imageSmoothingEnabled = !0, e.drawImage(l, 0, 0, s, i), e.restore();
}
function Tp(e, t, n) {
  const s = n.width ?? 6, i = n.taper ?? 1, r = n.fade ?? 1, o = n.opacity ?? 1, a = n.blend === "add";
  if (e.save(), t.length >= 2) {
    const c = Gd(t, s, i, r, o);
    a ? (e.globalCompositeOperation = "lighter", cs(e, c, n.color)) : Jd(e, c, n.color);
  }
  const l = t[t.length - 1];
  if (n.head && l && n.head.radius > 0) {
    a && (e.globalCompositeOperation = "lighter");
    const c = n.head.color ?? n.color, h = e.createRadialGradient(l.at.x, l.at.y, 0, l.at.x, l.at.y, n.head.radius);
    h.addColorStop(0, c), h.addColorStop(0.35, c), h.addColorStop(1, jd(e, c)), e.globalAlpha = o, e.fillStyle = h, e.beginPath(), e.arc(l.at.x, l.at.y, n.head.radius, 0, Math.PI * 2), e.fill();
  }
  e.restore();
}
function jd(e, t) {
  e.fillStyle = t;
  const n = String(e.fillStyle), s = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(n);
  if (s) return `rgba(${parseInt(s[1], 16)}, ${parseInt(s[2], 16)}, ${parseInt(s[3], 16)}, 0)`;
  const i = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(n);
  return i ? `rgba(${i[1]}, ${i[2]}, ${i[3]}, 0)` : "rgba(0, 0, 0, 0)";
}
function Gd(e, t, n, s, i) {
  const r = e.map((c) => ({ x: c.at.x, y: c.at.y, width: t * (1 - n * c.age) })), o = bl(r), a = wl(r) ?? void 0, l = [];
  for (let c = 0; c + 1 < e.length; c++) {
    const h = (e[c].age + e[c + 1].age) / 2, u = i * (1 - s * h);
    if (u <= 0) continue;
    const f = c + 2 === e.length;
    l.push({ corners: [o.left[c], o.left[c + 1], o.right[c + 1], o.right[c]], alpha: u, ...f && a && { cap: a } });
  }
  return l;
}
function cs(e, t, n) {
  e.fillStyle = n;
  for (const s of t) {
    const [i, r, o, a] = s.corners;
    e.globalAlpha = Math.min(1, s.alpha), e.beginPath(), e.moveTo(i.x, i.y), e.lineTo(r.x, r.y), s.cap && e.arc(s.cap.x, s.cap.y, s.cap.radius, s.cap.start, s.cap.start - Math.PI, !0), e.lineTo(o.x, o.y), e.lineTo(a.x, a.y), e.closePath(), e.fill();
  }
}
function Jd(e, t, n) {
  const s = typeof e.getTransform == "function" ? e.getTransform() : null, i = (p) => s ? { x: s.a * p.x + s.c * p.y + s.e, y: s.b * p.x + s.d * p.y + s.f } : p, r = s ? Math.sqrt(Math.abs(s.a * s.d - s.b * s.c)) : 1, o = t.map((p) => ({
    ...p,
    corners: p.corners.map(i),
    ...p.cap && { cap: { ...p.cap, ...i(p.cap), radius: p.cap.radius * r, start: p.cap.start + (s ? Math.atan2(s.b, s.a) : 0) } }
  }));
  let a = 1 / 0, l = 1 / 0, c = -1 / 0, h = -1 / 0;
  for (const p of o) {
    const g = p.cap ? [{ x: p.cap.x - p.cap.radius, y: p.cap.y - p.cap.radius }, { x: p.cap.x + p.cap.radius, y: p.cap.y + p.cap.radius }] : [];
    for (const y of [...p.corners, ...g])
      a = Math.min(a, y.x), l = Math.min(l, y.y), c = Math.max(c, y.x), h = Math.max(h, y.y);
  }
  if (!(c > a && h > l)) return;
  const u = Math.floor(a) - 1, f = Math.floor(l) - 1, d = s ? No(e, Math.ceil(c) + 1 - u, Math.ceil(h) + 1 - f) : null, m = d?.getContext("2d");
  if (!d || !m) {
    cs(e, t, n);
    return;
  }
  m.translate(-u, -f), m.globalCompositeOperation = "lighter", cs(m, o, n), e.save(), e.setTransform(1, 0, 0, 1, 0, 0), e.globalAlpha = 1, e.drawImage(d, u, f), e.restore();
}
const Zd = { x: 0, y: 0, scale: 1, rotate: 0, shakeX: 0, shakeY: 0, shakeRotate: 0 };
function Ep(e) {
  const t = (n) => {
    const s = e?.get(n);
    return typeof s == "number" ? s : Zd[n];
  };
  return {
    x: t("x"),
    y: t("y"),
    scale: t("scale"),
    rotate: t("rotate"),
    shakeX: t("shakeX"),
    shakeY: t("shakeY"),
    shakeRotate: t("shakeRotate")
  };
}
function Ap(e, t, n) {
  const s = n.width / 2, i = n.height / 2, o = 1 + 2 * Math.max(Math.abs(t.shakeX), Math.abs(t.shakeY)) / Math.max(1, Math.min(n.width, n.height));
  e.translate(s + t.x + t.shakeX, i + t.y + t.shakeY), e.rotate((t.rotate + t.shakeRotate) * Math.PI / 180), e.scale(t.scale * o, t.scale * o), e.translate(-s, -i);
}
function Pp(e, t, n) {
  const s = t.width / 2, i = t.height / 2, r = (e.rotate + e.shakeRotate) * Math.PI / 180, o = (n.x - s) * e.scale, a = (n.y - i) * e.scale;
  return {
    x: s + e.x + e.shakeX + o * Math.cos(r) - a * Math.sin(r),
    y: i + e.y + e.shakeY + o * Math.sin(r) + a * Math.cos(r)
  };
}
const _p = et.to, Ip = et.from, Cp = et.fromTo, Hp = et.set, $p = et.timeline, Rp = et.ticker, Op = et.splitText, Lp = et.context, Fp = et.matchMedia, Bp = et.quickTo, Dp = et.imageSequence, Wp = et.pageTransition;
Oh();
export {
  Ln as ACTING_STYLES,
  e0 as Clock,
  Dt as CompatTimeline,
  ih as CustomBounce,
  sh as CustomEase,
  rh as CustomWiggle,
  Ut as DANCE_STYLES,
  wr as DEFAULT_BAKE_INTERVAL_MS,
  Fs as DEFAULT_INERTIA_FRICTION,
  yh as DEFAULT_LABELS,
  st as DEFAULT_SPRING,
  D0 as DEFAULT_TRANSITION,
  Vr as Draggable,
  q as EXPRESSIONS,
  Xh as FINGERS,
  Ps as FLIPS,
  Ls as FORMAT_VERSION,
  Os as GAGS,
  Nt as GAITS,
  Dd as GAIT_CYCLE_MS,
  K as HAND_REST,
  V as HAND_SHAPES,
  Td as HUMAN_ACTING_RIG,
  Q0 as HUMAN_EXPRESSIONS,
  $f as HUMAN_POSES,
  U as HUMAN_REST,
  Zd as IDENTITY_CAMERA,
  Jo as INERTIA_MAX_DURATION_MS,
  Ua as InertiaTrackPlayer,
  ut as LiveTimeline,
  c0 as MORPH_SAMPLES,
  Wi as MUDRAS,
  t0 as ManualClock,
  Mi as MediaSync,
  bc as Observer,
  Me as POSES,
  W as REST_POSE,
  ur as SPRING_MAX_DURATION_MS,
  pn as SPRING_PRESETS,
  ne as SPRING_STEP_MS,
  Sd as STICK_ACTING_RIG,
  Wc as ScrollAnimator,
  dn as ScrollDriver,
  Nc as ScrollMarkers,
  Oc as ScrollPin,
  gi as SmoothScroll,
  an as SpringSampler,
  Va as SpringTrackPlayer,
  hc as Stage,
  hn as Timeline,
  ks as TinyflyPlayer,
  Lh as TinyflySequencer,
  wn as TrackPlayer,
  St as VISEMES,
  w0 as ValueResolver,
  Rc as VisibilityDriver,
  gp as actCharacterTracks,
  Bo as actKeyframes,
  Ed as actTracks,
  xp as applyBloom,
  Ap as applyCamera,
  Qu as applyGroove,
  ca as backOut,
  j0 as bakeDanceTracks,
  Mr as bakeEasing,
  kr as bakeInertiaTrack,
  vr as bakeSpringTrack,
  mp as basicOutfit,
  V0 as beatAt,
  ps as beatAtTime,
  Cr as beatLength,
  ds as beatTime,
  T0 as beatsBetween,
  Ph as bindChoiceHotspots,
  ye as blendPose,
  eo as boilFrame,
  la as bounceOut,
  Ep as cameraFromValues,
  Pp as cameraPoint,
  A0 as cameraTracks,
  zf as character,
  op as characterAt,
  td as characterHandPose,
  Jf as characterJoints,
  np as characterJointsInView,
  lp as characterObjects,
  ap as characterPoseTracks,
  rp as characterTarget,
  ja as charactersFor,
  hp as circlePath,
  Gr as clamp01,
  h0 as clearMorphCache,
  a0 as clearPathCache,
  Fo as clipErased,
  di as containerProgressAt,
  Lp as context,
  L0 as create,
  kh as createControls,
  oa as createCubicBezier,
  uh as createLive,
  no as createPen,
  un as createRandom,
  Xn as createTrack,
  r0 as criticalDamping,
  ol as customBounce,
  rl as customEase,
  al as customWiggle,
  Es as danceFrame,
  X0 as dancePose,
  is as danceStance,
  q0 as danceTaps,
  z0 as danceTracks,
  In as danceTravel,
  sf as danceTravelTrack,
  U0 as dancer,
  ue as deserializeTimeline,
  tl as deserializeTrack,
  E0 as detectTempo,
  C0 as draggable,
  xs as drawCartoonHand,
  nd as drawCharacter,
  sd as drawCharacterInView,
  bp as drawDustPuff,
  $o as drawEraser,
  Oo as drawHand,
  wp as drawImpactStars,
  hd as drawPencil,
  Id as drawSpeedLines,
  Ku as drawStickFigure,
  yp as drawStickSmear,
  Tp as drawTrail,
  up as drawnPathTarget,
  na as easeIn,
  fr as easeInCubic,
  ia as easeInOut,
  cn as easeInOutCubic,
  ea as easeInOutQuad,
  Qo as easeInQuad,
  sa as easeOut,
  dr as easeOutCubic,
  ta as easeOutQuad,
  aa as elasticOut,
  Ai as ellipsePoints,
  pp as erasable,
  Xa as expandParametricEasings,
  kf as flipPose,
  G0 as flipTracks,
  Sf as flipTravel,
  ar as formatVersionFor,
  Ip as from,
  g0 as fromJSON,
  Cp as fromTo,
  Pd as gag,
  _d as gagDuration,
  uu as gaitPose,
  fu as gaitStrideLength,
  Z as getEasingFunction,
  qe as getInterpolator,
  xr as getMotionPathPoint,
  l0 as getPathLength,
  va as getPointAtProgress,
  vc as gridLinesFor,
  cp as handAt,
  ts as handJoints,
  nu as handJointsAt,
  N as handPose,
  tn as handProp,
  Uo as hasKeyframes,
  Se as hashSeed,
  N0 as headPoint,
  n0 as heldTime,
  Z0 as humanFieldLabel,
  Rf as humanPlan,
  nt as humanPose,
  Dp as imageSequence,
  ve as inertiaDuration,
  we as inertiaRest,
  Wn as inertiaValueAt,
  o0 as inertiaVelocityAt,
  Na as interpolateArray,
  Wa as interpolateColor,
  p0 as interpolateMotionPath,
  ht as interpolateNumber,
  Ya as interpolatePathString,
  Ka as interpolateQuaternion,
  Js as interpolateString,
  Vo as isCubicBezierEasing,
  Pt as isInertiaTrack,
  Qd as isMotionPathPoint,
  lr as isMotionPathTrack,
  Ye as isParametricEasing,
  ke as isPathData,
  _t as isSpringTrack,
  hs as isTextTrack,
  i0 as isUnderdamped,
  b0 as isUnresolved,
  id as jointsInScene,
  Nu as jointsToScene,
  Nn as linear,
  Wo as lipSyncKeyframes,
  Bd as lipSyncOver,
  vp as lipSyncTracks,
  et as live,
  Ue as mapEase,
  I0 as mat4,
  Fp as matchMedia,
  hr as maxStaggerDistance,
  J0 as mirrorHumanPose,
  Ju as mirrorPose,
  ge as mixHandPoses,
  sp as mixPoses,
  Ha as morphPath,
  Ih as mount,
  $h as mountAll,
  k0 as narrationMarkers,
  S0 as narrationSceneAt,
  Xe as naturalRest,
  M0 as nearestBeat,
  x0 as nextBeat,
  Wp as pageTransition,
  ua as parametricEasing,
  fi as parseEdge,
  Yt as parsePath,
  jr as parseTrigger,
  me as partialPath,
  Fh as pathLength,
  v0 as planNarration,
  O0 as play,
  B0 as playSequence,
  $0 as playWhenVisible,
  Tr as playheadCrossings,
  Ss as pointAlong,
  pr as pointAtDistance,
  ep as pointOnHead,
  ml as pointsToPath,
  j as pose,
  Y0 as poseTracks,
  u0 as quat,
  Sp as quickPlay,
  Bp as quickTo,
  Ar as randomBetween,
  y0 as randomChoice,
  nl as randomSnapped,
  ip as reachCharacter,
  md as resolveActingStyle,
  Ho as resolveCharacterPoseKeys,
  so as resolveGait,
  vo as resolvePoseKeys,
  sl as resolveSequence,
  bo as resolveStickFrame,
  Yu as resolveStickPose,
  Ir as resolveValue,
  bl as ribbon,
  wl as ribbonHeadCap,
  At as rotateAbout,
  As as routineBeats,
  Vt as rubberLimb,
  kp as scriptTracks,
  H0 as scrollProgress,
  R0 as scrubOnScroll,
  fp as scrubPath,
  W0 as seatHeight,
  el as serializeTimeline,
  Qa as serializeTrack,
  Hp as set,
  ms as shapeToPathData,
  qa as simplifyKeyframes,
  Ao as skeletonInView,
  Jn as sketchPen,
  $c as smoothToward,
  wc as snapAxis,
  Fc as snapConfig,
  Dc as snapDuration,
  Bc as snapProgress,
  Is as solvePlanSpace,
  Fd as soundsOf,
  Xd as speechDuration,
  Op as splitText,
  zo as springDuration,
  s0 as springValueAt,
  Eo as stagePlanSpace,
  cr as staggerDistance,
  us as staggerOffset,
  Dn as staggerOffsets,
  on as staggerSpan,
  ha as stepsEasing,
  Vu as stickFigureAt,
  Wu as stickFigureJoints,
  K0 as stickFigureTarget,
  tp as stickToHuman,
  mu as strideLength,
  gh as syncMediaElement,
  gu as talkingMouth,
  Ms as taperedLine,
  We as taperedOutline,
  Ja as textAt,
  Mp as tf,
  Rp as ticker,
  $p as timeline,
  _p as to,
  m0 as toJSON,
  f0 as toKeyframedTrack,
  d0 as toKeyframedTracks,
  Mt as trackTargets,
  P0 as trailSamples,
  pe as triggerDistance,
  F0 as unmount,
  _0 as vec3,
  pu as walkPose,
  dp as withErased,
  Ze as withExpression
};
