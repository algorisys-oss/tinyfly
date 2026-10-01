function bn(e) {
  return typeof e == "object" && e !== null && e.type === "cubic-bezier";
}
function $t(e) {
  return typeof e == "object" && e !== null && e.type !== "cubic-bezier";
}
const Ft = 1;
function Te(e) {
  return e.property === "text" && "textConfig" in e;
}
function tt(e) {
  return e.kind === "inertia" && "inertia" in e;
}
function et(e) {
  return e.kind === "spring" && "spring" in e;
}
function bi(e) {
  return e.property === "motionPath" && "motionPathConfig" in e;
}
function ca(e) {
  return typeof e == "object" && e !== null && "x" in e && "y" in e && "angle" in e;
}
function vn(e) {
  return "keyframes" in e;
}
class ha {
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
class ua {
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
function vi(e, t, i = "start") {
  if (t <= 1) return 0;
  if (typeof i == "number") {
    const n = Math.max(0, Math.min(t - 1, i));
    return Math.abs(e - n);
  }
  switch (i) {
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
function wi(e, t = "start") {
  if (e <= 1) return 0;
  let i = 0;
  for (let n = 0; n < e; n++)
    i = Math.max(i, vi(n, e, t));
  return i;
}
function ke(e, t, i) {
  if (i.offsets) return i.offsets[e] ?? 0;
  const n = i.from ?? "start", s = vi(e, t, n);
  if (i.amount !== void 0) {
    const r = wi(t, n);
    return r === 0 ? 0 : i.amount * s / r;
  }
  return i.each !== void 0 ? i.each * s : 0;
}
function ce(e, t) {
  return Array.from({ length: e }, (i, n) => ke(n, e, t));
}
function Wt(e, t) {
  return e <= 1 ? 0 : Math.max(...ce(e, t));
}
const yt = 1, Ti = 6e4, Et = Ti / yt, W = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, Gt = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class Vt {
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
    const i = Math.floor(t / yt);
    if (this.simulateTo(i + 1), this.settledStep !== null && i >= this.settledStep)
      return this.to;
    const n = this.samples[Math.min(i, this.samples.length - 1)], s = this.samples[Math.min(i + 1, this.samples.length - 1)], r = t / yt - i;
    return n + (s - n) * r;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(Et + 1), this.settledStep !== null ? this.settledStep * yt : Ti;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(t) {
    if (this.settledStep !== null) return;
    const i = Math.min(t, Et + 1), n = yt / 1e3;
    for (; this.samples.length < i; ) {
      const s = this.samples[this.samples.length - 1], r = s - this.to, o = -this.stiffness * r, a = -this.damping * this.velocity, l = (o + a) / this.mass;
      this.velocity += l * n;
      const c = s + this.velocity * n;
      if (this.samples.push(c), this.isAtRest(c)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > Et && (this.settledStep = Et);
  }
}
function fa(e, t) {
  return new Vt(e).valueAt(t);
}
function wn(e) {
  return new Vt(e).settleTime();
}
function da(e) {
  const t = e.stiffness ?? W.stiffness, i = e.damping ?? W.damping, n = e.mass ?? W.mass;
  return i < 2 * Math.sqrt(t * n);
}
function pa(e) {
  const t = e.stiffness ?? W.stiffness, i = e.mass ?? W.mass;
  return 2 * Math.sqrt(t * i);
}
const Ce = 4, Tn = 2e-3, kn = 1e-4, xn = 6e4;
function Ut(e) {
  const t = e.friction ?? Ce;
  return t > 0 ? t : Ce;
}
function Dt(e) {
  return e.from + e.velocity / Ut(e);
}
function Sn(e, t) {
  if (t === void 0) return e;
  if (typeof t == "number")
    return t > 0 ? Math.round(e / t) * t : e;
  if (t.length === 0) return e;
  let i = t[0];
  for (const n of t)
    Math.abs(n - e) < Math.abs(i - e) && (i = n);
  return i;
}
function xt(e) {
  let t = Sn(Dt(e), e.end);
  return e.min !== void 0 && (t = Math.max(e.min, t)), e.max !== void 0 && (t = Math.min(e.max, t)), t;
}
function St(e) {
  const t = Math.abs(xt(e) - e.from);
  if (t === 0) return 0;
  const i = e.restDelta ?? Math.max(kn, t * Tn);
  if (i >= t) return 0;
  const n = Math.log(t / i) / Ut(e);
  return Math.min(xn, n * 1e3);
}
function he(e, t) {
  if (t <= 0) return e.from;
  const i = xt(e);
  if (t >= St(e)) return i;
  const n = Ut(e);
  return e.from + (i - e.from) * (1 - Math.exp(-n * t / 1e3));
}
function ma(e, t) {
  const i = Ut(e), n = xt(e);
  return t >= St(e) ? 0 : (n - e.from) * i * Math.exp(-i * Math.max(0, t) / 1e3);
}
const ue = (e) => e, Mn = (e) => e * e, An = (e) => 1 - (1 - e) * (1 - e), En = (e) => e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2, ki = (e) => e * e * e, xi = (e) => 1 - Math.pow(1 - e, 3), jt = (e) => e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2, Pn = ki, Cn = xi, _n = jt, In = {
  linear: ue,
  "ease-in": Pn,
  "ease-out": Cn,
  "ease-in-out": _n,
  "ease-in-quad": Mn,
  "ease-out-quad": An,
  "ease-in-out-quad": En,
  "ease-in-cubic": ki,
  "ease-out-cubic": xi,
  "ease-in-out-cubic": jt
};
function Rn(e) {
  const [t, i, n, s] = e, r = 3 * t, o = 3 * (n - t) - r, a = 1 - r - o, l = 3 * i, c = 3 * (s - i) - l, u = 1 - l - c, f = (p) => ((a * p + o) * p + r) * p, h = (p) => ((u * p + c) * p + l) * p, d = (p) => (3 * a * p + 2 * o) * p + r, g = (p) => {
    let m = p;
    for (let b = 0; b < 8; b++) {
      const k = f(m) - p;
      if (Math.abs(k) < 1e-7)
        return m;
      const v = d(m);
      if (Math.abs(v) < 1e-7)
        break;
      m -= k / v;
    }
    let y = 0, w = 1;
    for (m = p; y < w; ) {
      const b = f(m);
      if (Math.abs(b - p) < 1e-7)
        return m;
      p > b ? y = m : w = m, m = (y + w) / 2;
    }
    return m;
  };
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    const m = g(p);
    return h(m);
  };
}
function Kt(e, t = "out") {
  if (t === "out") return e;
  const i = (n) => 1 - e(1 - n);
  return t === "in" ? i : (n) => n < 0.5 ? i(n * 2) / 2 : e(n * 2 - 1) / 2 + 0.5;
}
function Ln(e = 1, t = 0.3) {
  const i = Math.max(1, e), n = t / (2 * Math.PI) * Math.asin(1 / i);
  return (s) => s <= 0 ? 0 : s >= 1 ? 1 : i * Math.pow(2, -10 * s) * Math.sin((s - n) * (2 * Math.PI) / t) + 1;
}
const $n = (e) => {
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
  const n = e - 2.625 / 2.75;
  return 7.5625 * n * n + 0.984375;
};
function Fn(e = 1.70158) {
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const i = t - 1;
    return i * i * ((e + 1) * i + e) + 1;
  };
}
function Dn(e, t = "end") {
  const i = Math.max(1, Math.floor(e));
  return (n) => {
    if (n >= 1) return 1;
    if (n <= 0) return t === "start" || t === "both" ? t === "start" ? 1 / i : 1 / (i + 1) : 0;
    const s = Math.floor(n * i);
    switch (t) {
      case "start":
        return Math.min(1, (s + 1) / i);
      case "both":
        return (s + 1) / (i + 1);
      case "none":
        return i === 1 ? 0 : Math.min(1, s / (i - 1));
      default:
        return s / i;
    }
  };
}
function Bn(e) {
  switch (e.type) {
    case "steps":
      return Dn(e.count, e.position);
    case "elastic":
      return Kt(Ln(e.amplitude, e.period), e.mode);
    case "bounce":
      return Kt($n, e.mode);
    case "back":
      return Kt(Fn(e.overshoot), e.mode);
  }
}
function z(e) {
  return e === void 0 ? ue : bn(e) ? Rn(e.points) : $t(e) ? Bn(e) : In[e] ?? ue;
}
const _e = 32, On = 256, nt = /* @__PURE__ */ new Map(), Nn = /[MmLlHhVvCcSsQqTtAaZz]/, qn = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, Yn = {
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
function Xn(e) {
  const t = [];
  let i = 0, n = null;
  const s = () => {
    for (; i < e.length && /[\s,]/.test(e[i]); ) i++;
  };
  for (; i < e.length && (s(), !(i >= e.length)); ) {
    const r = e[i];
    if (Nn.test(r)) {
      n = { type: r, args: [] }, t.push(n), i++;
      continue;
    }
    if (!n) break;
    const o = n.type === "A" || n.type === "a", a = n.args.length % 7;
    if (o && (a === 3 || a === 4)) {
      if (r !== "0" && r !== "1") break;
      n.args.push(r === "1" ? 1 : 0), i++;
      continue;
    }
    const l = qn.exec(e.slice(i));
    if (!l) break;
    n.args.push(parseFloat(l[0])), i += l[0].length;
  }
  return t;
}
function Wn(e, t, i, n, s, r, o, a, l) {
  if (e === a && t === l) return [];
  let c = Math.abs(i), u = Math.abs(n);
  if (c === 0 || u === 0) return [[e, t, a, l, a, l]];
  const f = s * Math.PI / 180, h = Math.cos(f), d = Math.sin(f), g = (e - a) / 2, p = (t - l) / 2, m = h * g + d * p, y = -d * g + h * p, w = m * m / (c * c) + y * y / (u * u);
  if (w > 1) {
    const L = Math.sqrt(w);
    c *= L, u *= L;
  }
  const b = r === o ? -1 : 1, k = c * c * u * u - c * c * y * y - u * u * m * m, v = c * c * y * y + u * u * m * m, T = b * Math.sqrt(Math.max(0, k / v)), x = T * c * y / u, M = -T * u * m / c, I = h * x - d * M + (e + a) / 2, A = d * x + h * M + (t + l) / 2, S = (L, F, q, it) => {
    const zt = L * q + F * it, At = Math.sqrt((L * L + F * F) * (q * q + it * it)), ut = Math.acos(Math.max(-1, Math.min(1, zt / At)));
    return L * it - F * q < 0 ? -ut : ut;
  }, C = S(1, 0, (m - x) / c, (y - M) / u);
  let P = S((m - x) / c, (y - M) / u, (-m - x) / c, (-y - M) / u);
  !o && P > 0 && (P -= 2 * Math.PI), o && P < 0 && (P += 2 * Math.PI);
  const _ = Math.max(1, Math.ceil(Math.abs(P) / (Math.PI / 2))), E = P / _, R = 4 / 3 * Math.tan(E / 4), $ = (L) => {
    const F = c * Math.cos(L), q = u * Math.sin(L);
    return [h * F - d * q + I, d * F + h * q + A];
  }, N = (L) => {
    const F = -c * Math.sin(L), q = u * Math.cos(L);
    return [h * F - d * q, d * F + h * q];
  }, O = [];
  for (let L = 0; L < _; L++) {
    const F = C + L * E, q = F + E, [it, zt] = $(F), [At, ut] = L === _ - 1 ? [a, l] : $(q), [pn, mn] = N(F), [gn, yn] = N(q);
    O.push([it + R * pn, zt + R * mn, At - R * gn, ut - R * yn, At, ut]);
  }
  return O;
}
function Z(e, t, i, n, s) {
  const r = 1 - s;
  return r * r * r * e + 3 * r * r * s * t + 3 * r * s * s * i + s * s * s * n;
}
function Ie(e, t, i, n, s) {
  const r = 1 - s;
  return 3 * r * r * (t - e) + 6 * r * s * (i - t) + 3 * s * s * (n - i);
}
function ft(e, t, i, n) {
  return {
    subpath: 0,
    type: "L",
    points: [i, n],
    startX: e,
    startY: t,
    endX: i,
    endY: n,
    length: Math.hypot(i - e, n - t)
  };
}
function Pt(e, t, i) {
  const [n, s, r, o, a, l] = i, c = [0];
  let u = e, f = t, h = 0;
  for (let d = 1; d <= _e; d++) {
    const g = d / _e, p = Z(e, n, r, a, g), m = Z(t, s, o, l, g);
    h += Math.hypot(p - u, m - f), c.push(h), u = p, f = m;
  }
  return {
    subpath: 0,
    type: "C",
    points: [n, s, r, o, a, l],
    startX: e,
    startY: t,
    endX: a,
    endY: l,
    length: h,
    lengths: c
  };
}
function at(e) {
  const t = nt.get(e);
  if (t) return t;
  const i = [];
  let n = 0, s = 0, r = 0, o = 0, a = null, l = null, c = -1;
  const u = /* @__PURE__ */ new Set(), f = (p) => {
    c < 0 && (c = 0), p.subpath = c, i.push(p);
  };
  for (const { type: p, args: m } of Xn(e)) {
    const y = p.toUpperCase(), w = p !== y, b = Yn[y];
    if (y === "Z") {
      (n !== r || s !== o) && f(ft(n, s, r, o)), c >= 0 && u.add(c), n = r, s = o, a = l = null;
      continue;
    }
    for (let k = 0; k + b <= m.length; k += b) {
      const v = m.slice(k, k + b), T = w ? n : 0, x = w ? s : 0;
      let M = null, I = null;
      switch (y) {
        case "M":
          k === 0 ? (n = v[0] + T, s = v[1] + x, r = n, o = s, (c < 0 || i[i.length - 1]?.subpath === c) && c++) : (f(ft(n, s, v[0] + T, v[1] + x)), n = v[0] + T, s = v[1] + x);
          break;
        case "L":
          f(ft(n, s, v[0] + T, v[1] + x)), n = v[0] + T, s = v[1] + x;
          break;
        case "H":
          f(ft(n, s, v[0] + T, s)), n = v[0] + T;
          break;
        case "V":
          f(ft(n, s, n, v[0] + x)), s = v[0] + x;
          break;
        case "C": {
          const A = [v[0] + T, v[1] + x, v[2] + T, v[3] + x, v[4] + T, v[5] + x];
          f(Pt(n, s, A)), M = [A[2], A[3]], n = A[4], s = A[5];
          break;
        }
        case "S": {
          const [A, S] = a ? [2 * n - a[0], 2 * s - a[1]] : [n, s], C = [A, S, v[0] + T, v[1] + x, v[2] + T, v[3] + x];
          f(Pt(n, s, C)), M = [C[2], C[3]], n = C[4], s = C[5];
          break;
        }
        case "Q":
        case "T": {
          let A = n, S = s;
          y === "Q" ? (A = v[0] + T, S = v[1] + x) : l && (A = 2 * n - l[0], S = 2 * s - l[1]);
          const C = y === "Q" ? v[2] + T : v[0] + T, P = y === "Q" ? v[3] + x : v[1] + x;
          f(
            Pt(n, s, [
              n + 2 / 3 * (A - n),
              s + 2 / 3 * (S - s),
              C + 2 / 3 * (A - C),
              P + 2 / 3 * (S - P),
              C,
              P
            ])
          ), I = [A, S], n = C, s = P;
          break;
        }
        case "A": {
          const A = v[5] + T, S = v[6] + x;
          let C = n, P = s;
          for (const _ of Wn(n, s, v[0], v[1], v[2], v[3], v[4], A, S))
            f(Pt(C, P, _)), C = _[4], P = _[5];
          n = A, s = S;
          break;
        }
      }
      a = M, l = I;
    }
  }
  const h = i.reduce((p, m) => p + m.length, 0), d = [];
  for (let p = 0; p < i.length; ) {
    const m = i[p].subpath;
    let y = p, w = 0;
    for (; y < i.length && i[y].subpath === m; ) w += i[y++].length;
    const b = i[p], k = i[y - 1], v = u.has(m) || Math.abs(k.endX - b.startX) < 1e-9 && Math.abs(k.endY - b.startY) < 1e-9;
    d.push({ start: p, end: y, length: w, closed: v }), p = y;
  }
  const g = { segments: i, totalLength: h, subpaths: d };
  return nt.size >= On && nt.delete(nt.keys().next().value), nt.set(e, g), g;
}
function Vn(e, t) {
  const i = e.lengths;
  if (t <= 0) return 0;
  if (t >= e.length) return 1;
  let n = 0, s = i.length - 1;
  for (; n < s - 1; ) {
    const a = n + s >> 1;
    i[a] < t ? n = a : s = a;
  }
  const r = i[s] - i[n], o = r > 0 ? (t - i[n]) / r : 0;
  return (n + o) / (i.length - 1);
}
function Un(e, t) {
  if (e.type === "L") {
    const f = e.length > 0 ? Math.max(0, Math.min(1, t / e.length)) : 0;
    return {
      x: e.startX + (e.endX - e.startX) * f,
      y: e.startY + (e.endY - e.startY) * f,
      angle: Math.atan2(e.endY - e.startY, e.endX - e.startX) * 180 / Math.PI
    };
  }
  const [i, n, s, r, o, a] = e.points, l = Vn(e, t);
  let c = Ie(e.startX, i, s, o, l), u = Ie(e.startY, n, r, a, l);
  if (Math.hypot(c, u) < 1e-9) {
    const f = l < 0.5 ? Math.min(1, l + 1e-3) : Math.max(0, l - 1e-3), h = Z(e.startX, i, s, o, f), d = Z(e.startY, n, r, a, f), g = Z(e.startX, i, s, o, l), p = Z(e.startY, n, r, a, l);
    c = l < 0.5 ? h - g : g - h, u = l < 0.5 ? d - p : p - d;
  }
  return {
    x: Z(e.startX, i, s, o, l),
    y: Z(e.startY, n, r, a, l),
    angle: Math.atan2(u, c) * 180 / Math.PI
  };
}
function Si(e, t, i = 0, n = e.length) {
  if (n <= i) return { x: 0, y: 0, angle: 0 };
  let s = 0;
  for (let r = i; r < n; r++) {
    const o = e[r];
    if (s + o.length >= t || r === n - 1)
      return Un(o, t - s);
    s += o.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function jn(e, t) {
  const { segments: i, totalLength: n } = at(e);
  return Si(i, Math.max(0, Math.min(1, t)) * n);
}
function ga() {
  nt.clear();
}
function ya(e) {
  return at(e).totalLength;
}
const Hn = 24, zn = 320, Gn = 2.5, dt = 72, ba = 64, Kn = 0.2, Zn = 128, bt = /* @__PURE__ */ new Map();
let Rt = 0, G;
const Re = (e) => Math.round(e * 100) / 100;
function Le(e, t) {
  const { segments: i, subpaths: n, totalLength: s } = at(e);
  if (i.length === 0) return [];
  if (t) {
    const r = n.every((o) => o.closed);
    return [{ segments: i, start: 0, end: i.length, length: s, closed: r }];
  }
  return n.filter((r) => r.length > 0).map((r) => ({ segments: i, start: r.start, end: r.end, length: r.length, closed: r.closed }));
}
function fe(e, t) {
  const i = e.closed ? (t % 1 + 1) % 1 : Math.max(0, Math.min(1, t)), n = Si(e.segments, i * e.length, e.start, e.end);
  return [n.x, n.y];
}
function $e(e) {
  const t = [];
  let i = 0;
  for (let n = e.start; n < e.end; n++)
    i += e.segments[n].length, e.length > 0 && t.push(i / e.length);
  return t;
}
function Fe(e, t) {
  const i = [];
  for (let n = 0; n < t; n++)
    i.push(fe(e, e.closed ? n / t : n / (t - 1)));
  return i;
}
function De(e) {
  let t = 0, i = 0;
  for (const [n, s] of e)
    t += n, i += s;
  return t /= e.length, i /= e.length, e.map(([n, s]) => [n - t, s - i]);
}
function Qn(e, t, i) {
  const n = e.closed && t.closed;
  if (i !== void 0)
    return { offset: n ? Math.abs(i) % dt / dt : 0, reversed: i < 0 };
  const s = De(Fe(e, dt)), r = De(Fe(t, dt)), o = dt;
  let a = { offset: 0, reversed: !1 }, l = 1 / 0;
  for (const c of [!1, !0]) {
    const u = n ? o : 1;
    for (let f = 0; f < u; f++) {
      let h = 0;
      for (let d = 0; d < o && h < l; d++) {
        const g = n ? c ? (f - d + o) % o : (d + f) % o : c ? o - 1 - d : d, p = s[d][0] - r[g][0], m = s[d][1] - r[g][1];
        h += p * p + m * m;
      }
      h < l && (l = h, a = { offset: n ? f / o : 0, reversed: c });
    }
  }
  return a;
}
function Jn(e, t, i) {
  return i ? ((t.reversed ? t.offset - e : e + t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function ts(e, t, i) {
  return i ? ((t.reversed ? t.offset - e : e - t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function es(e, t, i) {
  const n = e.closed && t.closed, s = Qn(e, t, i.shapeIndex), r = Math.max(
    Hn,
    Math.min(zn, Math.ceil(Math.max(e.length, t.length) / Gn))
  ), o = /* @__PURE__ */ new Set(), a = (f) => o.add(Math.round(f * 1e7) / 1e7);
  for (let f = 0; f <= r; f++) a(f / r);
  for (const f of $e(e)) a(f);
  for (const f of $e(t)) a(ts(f, s, n));
  let l = [...o].sort((f, h) => f - h);
  n && (l = l.filter((f) => f < 1));
  const c = [], u = [];
  for (const f of l)
    c.push(...fe(e, f)), u.push(...fe(t, Jn(f, s, n)));
  return is({ from: c, to: u, closed: n });
}
function is(e) {
  const t = e.from.length / 2;
  if (t <= 3) return e;
  const i = new Uint8Array(t);
  i[0] = 1, i[t - 1] = 1;
  const n = [[0, t - 1]];
  for (; n.length > 0; ) {
    const [o, a] = n.pop();
    let l = -1, c = Kn;
    for (let u = o + 1; u < a; u++) {
      const f = Math.max(Be(e.from, o, a, u), Be(e.to, o, a, u));
      f > c && (c = f, l = u);
    }
    l !== -1 && (i[l] = 1, n.push([o, l], [l, a]));
  }
  const s = [], r = [];
  for (let o = 0; o < t; o++)
    i[o] && (s.push(e.from[o * 2], e.from[o * 2 + 1]), r.push(e.to[o * 2], e.to[o * 2 + 1]));
  return { from: s, to: r, closed: e.closed };
}
function Be(e, t, i, n) {
  const s = e[t * 2], r = e[t * 2 + 1], o = e[i * 2] - s, a = e[i * 2 + 1] - r, l = e[n * 2] - s, c = e[n * 2 + 1] - r, u = o * o + a * a, f = u === 0 ? 0 : Math.max(0, Math.min(1, (l * o + c * a) / u));
  return Math.hypot(l - f * o, c - f * a);
}
function ns(e, t, i) {
  const n = i.shapeIndex;
  if (G && G.from === e && G.to === t && G.shapeIndex === n) return G.plan;
  const r = bt.get(String(n ?? "auto"))?.get(e)?.get(t);
  if (r)
    return G = { from: e, to: t, shapeIndex: n, plan: r }, r;
  const o = at(e).subpaths.filter((d) => d.length > 0).length === at(t).subpaths.filter((d) => d.length > 0).length, a = Le(e, !o), l = Le(t, !o), c = {
    pairs: a.map((d, g) => es(d, l[g], i))
  };
  Rt >= Zn && (bt.clear(), Rt = 0);
  const u = String(n ?? "auto"), f = bt.get(u) ?? /* @__PURE__ */ new Map();
  bt.set(u, f);
  const h = f.get(e) ?? /* @__PURE__ */ new Map();
  return f.set(e, h), h.set(t, c), Rt++, G = { from: e, to: t, shapeIndex: n, plan: c }, c;
}
function ss(e, t, i, n = {}) {
  if (!e) return t;
  if (!t) return e;
  const s = Math.max(0, Math.min(1, i));
  if (s === 0) return e;
  if (s === 1) return t;
  const r = ns(e, t, n);
  if (r.pairs.length === 0) return s < 0.5 ? e : t;
  let o = "";
  for (const a of r.pairs) {
    for (let l = 0; l < a.from.length; l += 2) {
      const c = Re(a.from[l] + (a.to[l] - a.from[l]) * s), u = Re(a.from[l + 1] + (a.to[l + 1] - a.from[l + 1]) * s);
      o += `${l === 0 ? o ? " M" : "M" : " L"}${c} ${u}`;
    }
    a.closed && (o += " Z");
  }
  return o;
}
function va() {
  bt.clear(), Rt = 0, G = void 0;
}
function Mt(e) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(e);
}
const j = (e, t, i) => e + (t - e) * i, Mi = 512, Zt = /* @__PURE__ */ new Map(), Qt = /* @__PURE__ */ new Map();
function Oe(e) {
  const t = Zt.get(e);
  if (t) return t;
  const i = e.replace("#", ""), n = [
    parseInt(i.slice(0, 2), 16),
    parseInt(i.slice(2, 4), 16),
    parseInt(i.slice(4, 6), 16)
  ];
  return Zt.size < Mi && Zt.set(e, n), n;
}
const Ne = (e) => e.charCodeAt(0) === 35, qe = (e) => e.startsWith("rgb"), Ye = (e) => e.startsWith("rgba"), rs = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, Jt = (e) => Math.round(e).toString(16).padStart(2, "0");
function os(e, t, i) {
  return `#${Jt(e)}${Jt(t)}${Jt(i)}`;
}
function Xe(e) {
  const t = Qt.get(e);
  if (t) return t;
  const i = e.match(rs);
  if (!i)
    throw new Error(`Invalid rgb color: ${e}`);
  const n = parseInt(i[1], 10), s = parseInt(i[2], 10), r = parseInt(i[3], 10), o = i[4] !== void 0 ? [n, s, r, parseFloat(i[4])] : [n, s, r];
  return Qt.size < Mi && Qt.set(e, o), o;
}
const as = (e, t, i) => {
  if (Ne(e) && Ne(t)) {
    const [n, s, r] = Oe(e), [o, a, l] = Oe(t), c = j(n, o, i), u = j(s, a, i), f = j(r, l, i);
    return os(c, u, f);
  }
  if ((qe(e) || Ye(e)) && (qe(t) || Ye(t))) {
    const n = Xe(e), s = Xe(t), r = Math.round(j(n[0], s[0], i)), o = Math.round(j(n[1], s[1], i)), a = Math.round(j(n[2], s[2], i));
    if (n.length === 4 || s.length === 4) {
      const l = n[3] ?? 1, c = s[3] ?? 1, u = j(l, c, i);
      return `rgba(${r}, ${o}, ${a}, ${u})`;
    }
    return `rgb(${r}, ${o}, ${a})`;
  }
  return i < 1 ? e : t;
}, ls = (e, t, i) => {
  const n = Math.min(e.length, t.length), s = [];
  for (let r = 0; r < n; r++)
    s.push(j(e[r], t[r], i));
  return s;
}, We = (e, t, i) => i < 1 ? e : t, cs = (e, t, i) => ss(e, t, i);
function Bt(e) {
  return typeof e == "number" ? j : Array.isArray(e) ? ls : typeof e == "string" ? e.startsWith("#") || e.startsWith("rgb") ? as : Mt(e) ? cs : We : We;
}
const Ai = 1e3 / 60;
function Ei(e, t = {}) {
  if (!et(e))
    throw new Error(`bakeSpringTrack: track "${e.id}" is not a spring track`);
  const i = new Vt(e.spring);
  return Ci(e, (n) => i.valueAt(n), i.settleTime(), e.spring.from, e.spring.to, t);
}
function Pi(e, t = {}) {
  if (!tt(e))
    throw new Error(`bakeInertiaTrack: track "${e.id}" is not an inertia track`);
  const i = e.inertia;
  return Ci(
    e,
    (n) => he(i, n),
    St(i),
    i.from,
    xt(i),
    t
  );
}
function Ci(e, t, i, n, s, r) {
  const o = r.intervalMs ?? Ai, a = r.tolerance ?? 0.01, l = e.delay ?? 0, c = [];
  for (let f = 0; f <= i; f += o)
    c.push({ time: f + l, value: t(f), easing: "linear" });
  const u = c[c.length - 1];
  return !u || u.time < i + l ? c.push({ time: i + l, value: s, easing: "linear" }) : u.value = s, l > 0 && c.unshift({ time: 0, value: n, easing: "linear" }), {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: a > 0 ? us(c, a) : c,
    ...e.targets && { targets: [...e.targets] },
    ...e.stagger && { stagger: { ...e.stagger } }
  };
}
function _i(e, t, i, n = {}) {
  const s = n.intervalMs ?? Ai, r = typeof i == "function" ? i : z(i), o = Bt(e.value), a = t.time - e.time;
  if (a <= 0) return [t];
  const l = [];
  for (let u = s; u < a; u += s) {
    const f = u / a;
    l.push({
      time: e.time + u,
      value: o(e.value, t.value, r(f)),
      easing: "linear"
    });
  }
  const c = r(1);
  return l.push({ ...t, ...c !== 1 && { value: o(e.value, t.value, c) }, easing: "linear" }), l;
}
function wa(e, t) {
  return et(e) ? Ei(e, t) : tt(e) ? Pi(e, t) : e;
}
function hs(e, t = {}) {
  const i = e.keyframes;
  if (!i.some((s) => $t(s.easing))) return e;
  const n = i.length > 0 ? [i[0]] : [];
  for (let s = 1; s < i.length; s++) {
    const r = i[s];
    $t(r.easing) ? n.push(..._i(i[s - 1], r, r.easing, t)) : n.push(r);
  }
  return { ...e, keyframes: n };
}
function Ta(e, t) {
  return e.filter(vn).map((i) => hs(i, t)).concat(
    e.filter(et).map((i) => Ei(i, t)),
    e.filter(tt).map((i) => Pi(i, t))
  );
}
function us(e, t) {
  if (e.length <= 2) return e;
  const i = [e[0]];
  for (let n = 1; n < e.length - 1; n++) {
    const s = i[i.length - 1], r = e[n], o = e[n + 1], a = o.time - s.time;
    if (a <= 0) continue;
    const l = (r.time - s.time) / a, c = s.value + (o.value - s.value) * l;
    Math.abs(r.value - c) > t && i.push(r);
  }
  return i.push(e[e.length - 1]), i;
}
function de(e) {
  const t = [...e.keyframes].sort((i, n) => i.time - n.time);
  return {
    ...e,
    keyframes: t
  };
}
function Q(e) {
  return e.targets && e.targets.length > 0 ? e.targets : [e.target];
}
function lt(e, t, i, n) {
  const s = i ?? 0;
  return !n || t <= 1 ? s : s + ke(e, t, n);
}
class te {
  track;
  targets;
  constructor(t) {
    this.track = t, this.targets = Q(t);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(t) {
    return this.valueForOffset(t - lt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  /**
   * Every target's value at a specific time, in target order.
   *
   * Single-target tracks yield one entry; staggered tracks yield one per target,
   * each sampled at its own offset time.
   */
  getTargetValues(t) {
    const i = this.targets.length, n = [];
    for (let s = 0; s < i; s++) {
      const r = lt(s, i, this.track.delay, this.track.stagger), o = this.valueForOffset(t - r);
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
    const i = t[t.length - 1].time, n = this.track.stagger ? Wt(this.targets.length, this.track.stagger) : 0;
    return i + (this.track.delay ?? 0) + n + (this.track.endDelay ?? 0);
  }
  /**
   * Get the track metadata.
   */
  getTrack() {
    return this.track;
  }
  /** Interpolated value at a time already shifted into the track's own frame. */
  valueForOffset(t) {
    const { keyframes: i } = this.track;
    if (i.length === 0)
      return;
    if (i.length === 1 || t <= i[0].time)
      return i[0].value;
    if (t >= i[i.length - 1].time)
      return i[i.length - 1].value;
    const { from: n, to: s } = this.findSurroundingKeyframes(t);
    if (!n || !s)
      return;
    if (n.time === t)
      return n.value;
    const r = s.time - n.time, o = (t - n.time) / r, l = z(s.easing)(o);
    return Bt(n.value)(n.value, s.value, l);
  }
  /**
   * Find the keyframes surrounding a given time.
   */
  findSurroundingKeyframes(t) {
    const { keyframes: i } = this.track;
    for (let n = 0; n < i.length - 1; n++)
      if (t >= i[n].time && t <= i[n + 1].time)
        return { from: i[n], to: i[n + 1] };
    return { from: null, to: null };
  }
}
class fs {
  track;
  targets;
  sampler;
  constructor(t) {
    this.track = t, this.targets = Q(t), this.sampler = new Vt(t.spring);
  }
  getValueAtTime(t) {
    return this.sampler.valueAt(t - lt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const i = this.targets.length, n = [];
    for (let s = 0; s < i; s++) {
      const r = lt(s, i, this.track.delay, this.track.stagger);
      n.push({ target: this.targets[s], value: this.sampler.valueAt(t - r), start: r });
    }
    return n;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? Wt(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
class ds {
  track;
  targets;
  duration;
  constructor(t) {
    this.track = t, this.targets = Q(t), this.duration = St(t.inertia);
  }
  getValueAtTime(t) {
    return he(this.track.inertia, t - lt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const i = this.targets.length, n = [];
    for (let s = 0; s < i; s++) {
      const r = lt(s, i, this.track.delay, this.track.stagger);
      n.push({ target: this.targets[s], value: he(this.track.inertia, t - r), start: r });
    }
    return n;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? Wt(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
function Ii(e, t) {
  const i = { ...jn(e.pathData, t) };
  if (e.matrix) {
    const [n, s, r, o, a, l] = e.matrix, { x: c, y: u } = i;
    i.x = n * c + r * u + a, i.y = s * c + o * u + l;
    const f = i.angle * Math.PI / 180, h = Math.cos(f), d = Math.sin(f);
    i.angle = Math.atan2(s * h + o * d, n * h + r * d) * 180 / Math.PI;
  }
  return e.autoRotate && e.rotateOffset && (i.angle += e.rotateOffset), i;
}
function ka(e, t, i, n) {
  const s = t + (i - t) * n;
  return Ii(e, s);
}
const ee = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, ps = 20;
function ms(e) {
  const t = ee[e ?? "upperCase"] ?? e ?? ee.upperCase, i = Array.from(t);
  return i.length > 0 ? i : Array.from(ee.upperCase);
}
function gs(e, t, i) {
  let n = (e | 0) ^ Math.imul(t + 1, 2654435761) ^ Math.imul(i + 1, 2246822507);
  return n = Math.imul(n ^ n >>> 16, 2146121005), n = Math.imul(n ^ n >>> 15, 2221713035), (n ^ n >>> 16) >>> 0;
}
function ys(e, t, i = 0) {
  const n = e.from ?? "", s = e.to, r = Math.max(0, Math.min(1, t));
  if (r <= 0) return n;
  if (r >= 1) return s;
  const o = Array.from(n), a = Array.from(s), l = e.rightToLeft ?? !1;
  if (e.mode === "type") {
    const w = Math.round(r * Math.max(o.length, a.length));
    return l ? o.slice(0, Math.max(0, o.length - w)).join("") + a.slice(Math.max(0, a.length - w)).join("") : a.slice(0, w).join("") + o.slice(w).join("");
  }
  const c = Math.max(0, Math.min(0.999, e.revealDelay ?? 0)), u = Math.max(0, (r - c) / (1 - c)), f = Math.floor(u * a.length), h = e.tweenLength === !1 ? a.length : Math.round(o.length + (a.length - o.length) * r), d = ms(e.chars), g = e.refreshRate ?? ps, p = g > 0 ? Math.floor(i * g / 1e3) : 0, m = e.seed ?? 1;
  let y = "";
  for (let w = 0; w < h; w++) {
    const b = l ? w >= h - f : w < f, k = l ? a[a.length - (h - w)] : a[w];
    b && k !== void 0 || k === " " || k === `
` ? y += k : y += d[gs(m, w, p) % d.length];
  }
  return y;
}
class Ri {
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
      for (const i of t.tracks)
        this.addTrack(i);
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
      const i = { ...this._config };
      delete i.duration, this._config = i;
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
    const i = this.duration > 0 ? this.duration : 1 / 0;
    this._currentTime = Math.max(0, Math.min(t, i)), this._repeatDelayRemaining = 0, this._wrapAfterDelay = !1;
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
    const i = this.duration;
    if (i <= 0)
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
        const l = i - this._currentTime;
        if (s >= l) {
          if (s -= l, this._currentTime = i, !this._handleEndReached())
            break;
        } else
          this._currentTime += s, s = 0;
      } else {
        const l = this._currentTime;
        if (s >= l) {
          if (s -= l, this._currentTime = 0, !this._handleStartReached())
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
    const i = /* @__PURE__ */ new Map();
    if (this._hasSharedWrites())
      this._resolveShared(t, i);
    else
      for (const [n, s] of this._trackPlayers) {
        const r = s.getTrack().property;
        for (const { target: o, value: a, start: l } of s.getTargetValues(t))
          this._write(i, n, o, r, a, t - l);
      }
    return {
      values: i,
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
  _resolveShared(t, i) {
    const n = /* @__PURE__ */ new Map();
    for (const [s, r] of this._trackPlayers) {
      const o = r.getTrack().property;
      for (const { target: a, value: l, start: c } of r.getTargetValues(t)) {
        const u = `${a}\0${o}`, f = c <= t, h = n.get(u);
        (!h || (f !== h.started ? f : f ? c >= h.start : c <= h.start)) && n.set(u, { trackId: s, target: a, property: o, value: l, start: c, started: f });
      }
    }
    for (const { trackId: s, target: r, property: o, value: a, start: l } of n.values())
      this._write(i, s, r, o, a, t - l);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(t, i, n, s, r, o) {
    if (r === void 0) return;
    let a = t.get(n);
    a || (a = /* @__PURE__ */ new Map(), t.set(n, a));
    const l = this._textTracks.get(i);
    if (l && typeof r == "number") {
      a.set("text", ys(l.textConfig, r, Math.max(0, o)));
      return;
    }
    const c = this._motionPathTracks.get(i);
    if (c && typeof r == "number") {
      const u = Ii(c.motionPathConfig, r);
      a.set("motionPathX", u.x), a.set("motionPathY", u.y), c.motionPathConfig.autoRotate && a.set("motionPathRotate", u.angle);
    } else
      a.set(s, r);
  }
  /** Cached: does any target+property have more than one track? */
  _sharedWrites = null;
  _hasSharedWrites() {
    if (this._sharedWrites === null) {
      const t = /* @__PURE__ */ new Set();
      this._sharedWrites = !1;
      t: for (const i of this._tracks)
        for (const n of Q(i)) {
          const s = `${n}\0${i.property}`;
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
    if (this._tracks.push(t), this._sharedWrites = null, tt(t)) {
      this._trackPlayers.set(t.id, new ds(t));
      return;
    }
    if (et(t)) {
      this._trackPlayers.set(t.id, new fs(t)), this._springTracks.set(t.id, t);
      return;
    }
    if (Te(t))
      this._trackPlayers.set(t.id, new te(t)), this._textTracks.set(t.id, t);
    else if (bi(t)) {
      const i = {
        id: t.id,
        target: t.target,
        property: t.property,
        keyframes: t.keyframes,
        delay: t.delay,
        endDelay: t.endDelay,
        targets: t.targets,
        stagger: t.stagger
      };
      this._trackPlayers.set(t.id, new te(i)), this._motionPathTracks.set(t.id, t);
    } else
      this._trackPlayers.set(t.id, new te(t));
  }
  /**
   * Replace a track with a new version, keeping its place in the track order
   * (which decides ties when tracks overlap). The new track may have a
   * different id. Does nothing if no track has `trackId`.
   */
  replaceTrack(t, i) {
    const n = this._tracks.findIndex((r) => r.id === t);
    if (n < 0) return;
    const s = this._tracks.slice(n + 1);
    this.removeTrack(t);
    for (const r of s) this.removeTrack(r.id);
    this.addTrack(i);
    for (const r of s) this.addTrack(r);
  }
  /**
   * Remove a track by its ID.
   */
  removeTrack(t) {
    this._tracks = this._tracks.filter((i) => i.id !== t), this._sharedWrites = null, this._trackPlayers.delete(t), this._motionPathTracks.delete(t), this._springTracks.delete(t), this._textTracks.delete(t);
  }
  /**
   * Tracks matching a filter. All provided fields must match (AND).
   *
   * This is the closest principled equivalent to GSAP's per-tween handle: we
   * have no live tween objects to hold, so a "tween" is addressed by describing
   * the tracks it produced.
   */
  getTracks(t = {}) {
    return this._tracks.filter((i) => this._matches(i, t));
  }
  /**
   * Remove every track matching a filter. Returns the ids removed.
   *
   * `timeline.removeTracks({ target: 'box' })` is the equivalent of killing all
   * tweens on an element.
   */
  removeTracks(t = {}) {
    const i = this.getTracks(t).map((n) => n.id);
    for (const n of i)
      this.removeTrack(n);
    return i;
  }
  /**
   * The time span a track is active over: [start, end] in milliseconds.
   */
  getTrackSpan(t) {
    const i = this._trackPlayers.get(t);
    if (!i) return;
    const n = i.getTrack(), s = n.delay ?? 0;
    if (et(n) || tt(n))
      return { from: s, to: i.getDuration() };
    const r = n.keyframes;
    if (!(!r || r.length === 0))
      return { from: r[0].time + s, to: i.getDuration() };
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
    for (let i = 0; i < this._tracks.length; i++) {
      const n = this._tracks[i], s = this.getTrackSpan(n.id);
      if (s)
        for (let r = 0; r < i; r++) {
          const o = this._tracks[r];
          if (o.property !== n.property) continue;
          const a = Q(o).filter((f) => Q(n).includes(f));
          if (a.length === 0) continue;
          const l = this.getTrackSpan(o.id);
          if (!l || !(l.from <= s.to && s.from <= l.to)) continue;
          const u = s.from >= l.from;
          for (const f of a)
            t.push({
              target: f,
              property: n.property,
              losingTrackId: u ? o.id : n.id,
              winningTrackId: u ? n.id : o.id
            });
        }
    }
    return t;
  }
  _matches(t, i) {
    if (i.id !== void 0 && t.id !== i.id || i.property !== void 0 && t.property !== i.property || i.target !== void 0 && !Q(t).includes(i.target)) return !1;
    if (i.timeRange) {
      const n = this.getTrackSpan(t.id);
      if (!n || n.to < i.timeRange.from || n.from > i.timeRange.to) return !1;
    }
    return !0;
  }
  /**
   * Export timeline as a serializable definition.
   */
  toDefinition() {
    return {
      formatVersion: Ft,
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
    return [...this._config.markers ?? []].sort((t, i) => t.time - i.time);
  }
  /** Replace the markers (kept in time order); an empty list removes them. */
  setMarkers(t) {
    const i = t && t.length > 0 ? [...t].sort((s, r) => s.time - r.time).map((s) => ({ ...s })) : void 0, n = { ...this._config };
    i ? n.markers = i : delete n.markers, this._config = n;
  }
  /** Caption text per language, per marker id */
  get captions() {
    return this._captions;
  }
  /** Replace the captions; languages with no captions are dropped. */
  setCaptions(t) {
    const i = {};
    for (const [n, s] of Object.entries(t ?? {})) i[n] = { ...s };
    this._captions = Object.keys(i).length > 0 ? i : void 0;
  }
  /** Start the between-iterations pause, if the timeline configures one. */
  _armRepeatDelay() {
    this._repeatDelayRemaining = this._config.repeatDelay ?? 0;
  }
  _calculateDuration() {
    let t = 0;
    for (const [, i] of this._trackPlayers)
      t = Math.max(t, i.getDuration());
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
const bs = 100;
function Li(e, t, i, n) {
  const s = [], r = [], { duration: o, alternate: a } = n, l = (d, g, p, m) => {
    r.push([d, g]);
    const y = [];
    e.forEach((w, b) => {
      (p === "forward" ? (m ? w >= d : w > d) && w <= g : (m ? w <= d : w < d) && w >= g) && y.push(b);
    }), y.sort((w, b) => (p === "forward" ? e[w] - e[b] : e[b] - e[w]) || w - b);
    for (const w of y) s.push({ kind: "event", index: w, direction: p });
  };
  let c = t.time, u = t.direction, f = t.fresh === !0;
  const h = Math.min(bs, Math.max(0, i.iteration - t.iteration));
  for (let d = 0; d < h; d++) {
    const g = u === "forward" ? o : 0;
    l(c, g, u, f), s.push({ kind: "repeat" }), a ? (u = u === "forward" ? "reverse" : "forward", c = g, f = !1) : (c = u === "forward" ? 0 : o, f = !0);
  }
  return h > 0 && n.holding && !a ? { crossings: s, passes: r } : (l(c, i.time, u, f), { crossings: s, passes: r });
}
function vs(e) {
  return tt(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "inertia",
    inertia: $i(e.inertia),
    ...U(e)
  } : et(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "spring",
    spring: { ...e.spring },
    ...U(e)
  } : Te(e) ? {
    id: e.id,
    target: e.target,
    property: "text",
    textConfig: { ...e.textConfig },
    keyframes: e.keyframes.map(ie),
    ...U(e)
  } : bi(e) ? {
    id: e.id,
    target: e.target,
    property: "motionPath",
    motionPathConfig: { ...e.motionPathConfig },
    keyframes: e.keyframes.map(ie),
    ...U(e)
  } : {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes.map(ie),
    ...U(e)
  };
}
function $i(e) {
  return { ...e, ...Array.isArray(e.end) && { end: [...e.end] } };
}
function ie(e) {
  return {
    time: e.time,
    value: e.value,
    ...e.easing && { easing: e.easing }
  };
}
function U(e) {
  const t = e.endDelay;
  return {
    ...e.delay !== void 0 && { delay: e.delay },
    ...t !== void 0 && { endDelay: t },
    ...e.targets !== void 0 && { targets: [...e.targets] },
    ...e.stagger !== void 0 && { stagger: { ...e.stagger } }
  };
}
function ws(e) {
  if (tt(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "inertia",
      inertia: $i(t.inertia),
      ...U(t)
    };
  }
  if (et(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "spring",
      spring: { ...t.spring },
      ...U(t)
    };
  }
  if (Te(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: "text",
      textConfig: { ...t.textConfig },
      keyframes: [...t.keyframes].sort((i, n) => i.time - n.time),
      ...U(t)
    };
  }
  if (e.property === "motionPath" && "motionPathConfig" in e) {
    const t = e, i = [...t.keyframes].sort((n, s) => n.time - s.time);
    return {
      id: t.id,
      target: t.target,
      property: "motionPath",
      motionPathConfig: { ...t.motionPathConfig },
      keyframes: i,
      ...U(t)
    };
  }
  return de({
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes,
    ...U(e)
  });
}
function Ts(e) {
  const t = e._config.markers;
  return {
    formatVersion: Ft,
    id: e.id,
    name: e.name,
    config: {
      duration: e.duration > 0 ? e.duration : void 0,
      loop: e._config.loop,
      speed: e._config.speed,
      alternate: e._config.alternate,
      repeatDelay: e._config.repeatDelay,
      ...t && { markers: t.map((i) => ({ ...i })) }
    },
    tracks: e.tracks.map(vs),
    ...e.captions && { captions: JSON.parse(JSON.stringify(e.captions)) }
  };
}
function wt(e) {
  const t = e.formatVersion ?? 1;
  if (t > Ft)
    throw new Error(
      `tinyfly: this animation uses format version ${t}, but this tinyfly reads up to version ${Ft}. Update tinyfly to play it.`
    );
  return new Ri({
    id: e.id,
    name: e.name,
    config: e.config,
    tracks: e.tracks.map(ws),
    captions: e.captions
  });
}
function xa(e) {
  return JSON.stringify(Ts(e));
}
function Sa(e) {
  const t = JSON.parse(e);
  return wt(t);
}
function ks(e) {
  let t = 2166136261;
  for (let i = 0; i < e.length; i++)
    t ^= e.charCodeAt(i), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function Fi(e) {
  let t = e >>> 0 || 2654435769;
  return {
    seed: e >>> 0,
    next() {
      return t ^= t << 13, t >>>= 0, t ^= t >> 17, t ^= t << 5, t >>>= 0, t / 4294967296;
    }
  };
}
function Di(e, t, i) {
  return t + e.next() * (i - t);
}
function xs(e, t, i, n) {
  if (n <= 0) return Di(e, t, i);
  const s = Math.floor((i - t) / n), r = Math.round(e.next() * s);
  return t + r * n;
}
function Ma(e, t) {
  if (t.length !== 0)
    return t[Math.floor(e.next() * t.length)];
}
const Bi = /^([+\-*/])=\s*(-?[\d.]+)$/, Oi = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function Aa(e) {
  return typeof e != "string" ? !1 : Bi.test(e.trim()) || Oi.test(e.trim());
}
function Ni(e, t = {}) {
  if (typeof e != "string") return e;
  const i = e.trim(), n = Bi.exec(i);
  if (n) {
    const [, r, o] = n, a = t.base ?? 0, l = Number.parseFloat(o);
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
  const s = Oi.exec(i);
  if (s) {
    if (!t.random)
      throw new Error(
        `resolveValue: "${i}" needs a random source — pass one via context.random`
      );
    const r = Number.parseFloat(s[1]), o = Number.parseFloat(s[2]), a = s[3] !== void 0 ? Number.parseFloat(s[3]) : void 0;
    return a !== void 0 ? xs(t.random, r, o, a) : Di(t.random, r, o);
  }
  return e;
}
function Ss(e, t = 0, i) {
  const n = [];
  let s = t;
  for (const r of e) {
    const o = Ni(r, { base: s, random: i });
    n.push(o), typeof o == "number" && (s = o);
  }
  return n;
}
class Ea {
  random;
  constructor(t) {
    this.random = Fi(t);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(t, i = 0) {
    return Ni(t, { base: i, random: this.random });
  }
  resolveSequence(t, i = 0) {
    return Ss(t, i, this.random);
  }
}
const Ms = 600;
function As(e) {
  if (Array.isArray(e)) {
    const [h, d, g, p] = e;
    return { fn: Ve(h, d, g, p), bezier: [h, d, g, p] };
  }
  const { segments: t } = at(e);
  if (t.length === 0) throw new Error(`customEase: no curve in "${e}"`);
  const i = t[0].startX, n = t[0].startY, s = t[t.length - 1], r = s.endX - i, o = s.endY - n;
  if (r === 0 || o === 0) throw new Error(`customEase: "${e}" must move along both axes`);
  const a = (h) => (h - i) / r, l = (h) => (h - n) / o;
  if (t.length === 1 && s.type === "C") {
    const [h, d, g, p] = s.points, m = [a(h), l(d), a(g), l(p)];
    return { fn: Ve(...m), bezier: m };
  }
  const c = [], u = [], f = Math.max(8, Math.ceil(Ms / t.length));
  for (const h of t)
    for (let d = c.length === 0 ? 0 : 1; d <= f; d++) {
      const [g, p] = Cs(h, d / f);
      c.push(a(g)), u.push(l(p));
    }
  return { fn: _s(c, u) };
}
function Es(e = {}) {
  const i = 0.1 + Math.max(0, Math.min(1, e.strength ?? 0.7)) * 0.7, n = [1];
  for (let r = i; r > 2e-3; r *= i) n.push(2 * Math.sqrt(r));
  const s = n.reduce((r, o) => r + o, 0);
  return (r) => {
    if (r <= 0) return 0;
    if (r >= 1) return 1;
    let o = r * s;
    for (let a = 0; a < n.length; a++) {
      if (o <= n[a]) {
        if (a === 0) return (o / n[0]) ** 2;
        const l = n[a] / 2, c = l * l, u = o - l;
        return 1 - (c - u * u);
      }
      o -= n[a];
    }
    return 1;
  };
}
function Ps(e = {}) {
  const t = Math.max(1, e.wiggles ?? 10), i = e.type ?? "easeOut", n = (s) => i === "uniform" ? 1 : i === "easeInOut" ? Math.sin(Math.PI * s) : (1 - s) ** 2;
  return (s) => s <= 0 || s >= 1 ? 0 : Math.sin(s * t * Math.PI * 2) * n(s);
}
function Cs(e, t) {
  if (e.type === "L") {
    const [c, u] = e.points;
    return [e.startX + (c - e.startX) * t, e.startY + (u - e.startY) * t];
  }
  const [i, n, s, r, o, a] = e.points, l = 1 - t;
  return [
    l * l * l * e.startX + 3 * l * l * t * i + 3 * l * t * t * s + t * t * t * o,
    l * l * l * e.startY + 3 * l * l * t * n + 3 * l * t * t * r + t * t * t * a
  ];
}
function _s(e, t) {
  return (i) => {
    if (i <= e[0]) return t[0];
    if (i >= e[e.length - 1]) return t[t.length - 1];
    let n = 0, s = e.length - 1;
    for (; s - n > 1; ) {
      const o = n + s >> 1;
      e[o] <= i ? n = o : s = o;
    }
    const r = e[s] - e[n];
    return r === 0 ? t[s] : t[n] + (i - e[n]) / r * (t[s] - t[n]);
  };
}
function Ve(e, t, i, n) {
  const s = (o, a, l) => 3 * (1 - o) * (1 - o) * o * a + 3 * (1 - o) * o * o * l + o * o * o, r = (o, a, l) => 3 * (1 - o) * (1 - o) * a + 6 * (1 - o) * o * (l - a) + 3 * o * o * (1 - l);
  return (o) => {
    if (o <= 0) return 0;
    if (o >= 1) return 1;
    let a = o;
    for (let u = 0; u < 8; u++) {
      const f = s(a, e, i) - o, h = r(a, e, i);
      if (Math.abs(f) < 1e-6) return s(a, t, n);
      if (Math.abs(h) < 1e-6) break;
      a -= f / h;
    }
    let l = 0, c = 1;
    a = o;
    for (let u = 0; u < 40; u++)
      s(a, e, i) < o ? l = a : c = a, a = (l + c) / 2;
    return s(a, t, n);
  };
}
const Is = 350, Rs = 300, Ls = 550;
function Pa(e, t = {}) {
  const i = t.lead ?? Is, n = t.gap ?? Rs, s = t.tail ?? Ls, r = [];
  let o = 0;
  return e.forEach((a, l) => {
    const c = [];
    let u = o + i;
    a.lines.forEach((h, d) => {
      if (!(h.duration >= 0))
        throw new Error(`narration: scene ${l} line ${d} has an invalid duration (${h.duration})`);
      d > 0 && (u += n), c.push({
        id: h.id ?? `s${l}-l${d}`,
        scene: l,
        line: d,
        start: u,
        end: u + h.duration,
        text: h.text
      }), u += h.duration;
    });
    const f = u + s + (a.tail ?? 0);
    r.push({ id: a.id ?? `s${l}`, start: o, duration: f - o, cues: c }), o = f;
  }), { duration: o, scenes: r, cues: r.flatMap((a) => a.cues) };
}
function Ca(e) {
  return e.cues.map((t) => ({ id: t.id, time: t.start, label: t.text }));
}
function _a(e, t) {
  let i = e.scenes[0];
  for (const n of e.scenes)
    if (t >= n.start) i = n;
    else break;
  return i;
}
const V = (e) => Math.round(e * 1e3) / 1e3;
function $s(e, t = {}) {
  if (e.length === 0) return "";
  const i = t.curviness ?? 1, n = t.closed ?? !1, s = e.length;
  let r = `M${V(e[0].x)} ${V(e[0].y)}`;
  if (s === 1) return r;
  const o = (l) => n ? e[(l % s + s) % s] : e[Math.max(0, Math.min(s - 1, l))], a = n ? s : s - 1;
  for (let l = 0; l < a; l++) {
    const c = o(l - 1), u = o(l), f = o(l + 1), h = o(l + 2);
    if (i === 0) {
      r += ` L${V(f.x)} ${V(f.y)}`;
      continue;
    }
    const d = i / 6, g = u.x + (f.x - c.x) * d, p = u.y + (f.y - c.y) * d, m = f.x - (h.x - u.x) * d, y = f.y - (h.y - u.y) * d;
    r += ` C${V(g)} ${V(p)} ${V(m)} ${V(y)} ${V(f.x)} ${V(f.y)}`;
  }
  return n ? `${r} Z` : r;
}
const D = (e, t = 0) => {
  const i = parseFloat(e ?? "");
  return Number.isFinite(i) ? i : t;
};
function Fs(e) {
  const t = (e ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), i = [];
  for (let n = 0; n + 1 < t.length; n += 2) i.push({ x: t[n], y: t[n + 1] });
  return i;
}
function xe(e) {
  const t = e.attributes;
  switch (e.tag.toLowerCase()) {
    case "path":
      return t.d ?? null;
    case "circle":
    case "ellipse": {
      const i = D(t.cx), n = D(t.cy), s = e.tag.toLowerCase() === "circle" ? D(t.r) : D(t.rx), r = e.tag.toLowerCase() === "circle" ? D(t.r) : D(t.ry);
      return `M${i + s} ${n} A${s} ${r} 0 1 1 ${i - s} ${n} A${s} ${r} 0 1 1 ${i + s} ${n} Z`;
    }
    case "rect": {
      const i = D(t.x), n = D(t.y), s = D(t.width), r = D(t.height);
      let o = t.rx != null ? D(t.rx) : t.ry != null ? D(t.ry) : 0, a = t.ry != null ? D(t.ry) : o;
      return o = Math.min(o, s / 2), a = Math.min(a, r / 2), o === 0 || a === 0 ? `M${i} ${n} H${i + s} V${n + r} H${i} Z` : `M${i + o} ${n} H${i + s - o} A${o} ${a} 0 0 1 ${i + s} ${n + a} V${n + r - a} A${o} ${a} 0 0 1 ${i + s - o} ${n + r} H${i + o} A${o} ${a} 0 0 1 ${i} ${n + r - a} V${n + a} A${o} ${a} 0 0 1 ${i + o} ${n} Z`;
    }
    case "line":
      return `M${D(t.x1)} ${D(t.y1)} L${D(t.x2)} ${D(t.y2)}`;
    case "polyline":
    case "polygon": {
      const i = Fs(t.points);
      if (i.length === 0) return null;
      const n = i.map((s, r) => `${r === 0 ? "M" : "L"}${s.x} ${s.y}`).join(" ");
      return e.tag.toLowerCase() === "polygon" ? `${n} Z` : n;
    }
    default:
      return null;
  }
}
const Ct = {
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
}, Ue = {
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
function Ds(e) {
  let t = e.trim().toLowerCase();
  t = t.replace(/\.ease(in|out|inout)$/, ".$1");
  const i = /^([a-z]+\d?)(\(.*\))?$/.exec(t);
  return i && i[1] !== "steps" && t !== "none" && t !== "linear" && (t = `${i[1]}.out${i[2] ?? ""}`), t;
}
z({ type: "bounce", mode: "in" });
z({ type: "bounce", mode: "in-out" });
function Ot(e) {
  const t = qi.get(e.trim().toLowerCase());
  if (t) return t;
  const i = Ds(e), n = /^steps\(\s*(\d+)\s*\)$/.exec(i);
  if (n) {
    const o = { type: "steps", count: Math.max(1, Number.parseInt(n[1], 10)) + 1, position: "none" };
    return { easing: o, fn: z(o) };
  }
  const s = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(i);
  if (s) {
    const [, r, o, a] = s, l = (a ?? "").split(",").map((f) => Number.parseFloat(f)).filter((f) => Number.isFinite(f)), c = o === "inout" ? "in-out" : o;
    if (r === "back" && l.length === 0 && i in Ct)
      return { easing: { type: "cubic-bezier", points: Ct[i] } };
    const u = r === "elastic" ? { type: "elastic", mode: c, ...l[0] !== void 0 && { amplitude: l[0] }, ...l[1] !== void 0 && { period: l[1] } } : r === "bounce" ? { type: "bounce", mode: c } : { type: "back", mode: c, ...l[0] !== void 0 && { overshoot: l[0] } };
    return { easing: u, fn: z(u) };
  }
  return i in Ue ? { easing: Ue[i] } : i in Ct ? { easing: { type: "cubic-bezier", points: Ct[i] } } : { easing: "ease-out" };
}
const qi = /* @__PURE__ */ new Map();
function Se(e, t) {
  return qi.set(
    e.trim().toLowerCase(),
    t.bezier ? { easing: { type: "cubic-bezier", points: t.bezier }, fn: t.fn } : { fn: t.fn, requiresBaking: "custom" }
  ), e;
}
function pe(e) {
  let t = e >>> 0;
  return () => {
    t = t + 1831565813 >>> 0;
    let i = t;
    return i = Math.imul(i ^ i >>> 15, i | 1), i ^= i + Math.imul(i ^ i >>> 7, i | 61), ((i ^ i >>> 14) >>> 0) / 4294967296;
  };
}
const Yi = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function Xi(e) {
  return typeof e == "string" && Yi.test(e);
}
function Bs(e = 1) {
  let t = pe(e);
  const i = (l, c) => ((...u) => u.length >= l ? c(...u) : (f) => c(...u, f)), n = (l, c, u) => Math.min(Math.max(u, Math.min(l, c)), Math.max(l, c)), s = (l, c, u, f, h) => c === l ? u : u + (h - l) / (c - l) * (f - u), r = (l, c) => {
    if (typeof l == "number") return l === 0 ? c : Math.round(c / l) * l;
    if (Array.isArray(l)) return je(l, c, 1 / 0);
    if ("values" in l) return je(l.values, c, l.radius ?? 1 / 0);
    const u = Math.round(c / l.increment) * l.increment;
    return Math.abs(u - c) <= (l.radius ?? 1 / 0) ? u : c;
  }, o = (l, c, u) => {
    const f = l + t() * (c - l);
    return u ? Math.round(f / u) * u : f;
  };
  return {
    clamp: i(3, n),
    mapRange: i(5, s),
    normalize: i(3, (l, c, u) => s(l, c, 0, 1, u)),
    interpolate: i(3, (l, c, u) => {
      if (typeof l == "object" && !Array.isArray(l)) {
        const f = {};
        for (const h of Object.keys(l))
          f[h] = Bt(l[h])(l[h], c[h], u);
        return f;
      }
      return Bt(l)(l, c, u);
    }),
    wrap: ((l, c, u) => {
      if (Array.isArray(l)) {
        const p = l, m = (y) => p[(Math.round(y) % p.length + p.length) % p.length];
        return c === void 0 ? m : m(c);
      }
      const f = l, d = c - f, g = (p) => d === 0 ? f : ((p - f) % d + d) % d + f;
      return u === void 0 ? g : g(u);
    }),
    wrapYoyo: i(3, (l, c, u) => {
      const f = c - l;
      if (f === 0) return l;
      const h = ((u - l) % (f * 2) + f * 2) % (f * 2);
      return l + (h > f ? f * 2 - h : h);
    }),
    snap: i(2, r),
    random: ((l, c, u, f) => {
      if (Array.isArray(l)) {
        const d = () => l[Math.floor(t() * l.length)];
        return c === !0 ? d : d();
      }
      const h = () => o(l, c, u);
      return f ? h : h();
    }),
    shuffle: (l) => {
      for (let c = l.length - 1; c > 0; c--) {
        const u = Math.floor(t() * (c + 1));
        [l[c], l[u]] = [l[u], l[c]];
      }
      return l;
    },
    distribute: ({ base: l = 0, amount: c, each: u, from: f = "start", ease: h }) => (d, g, p) => {
      const m = p.length, w = ke(d, m, { ...c !== void 0 ? { amount: c } : { each: u ?? 1 }, from: f }), b = c !== void 0 ? c : (u ?? 1) * wi(m, f), k = h && b > 0 ? h(w / b) * b : w;
      return l + k;
    },
    pipe: (...l) => (c) => l.reduce((u, f) => f(u), c),
    splitColor: (l) => Os(l),
    getUnit: (l) => typeof l == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(l.trim())?.[1] ?? "",
    seed: (l) => {
      t = pe(l);
    },
    resolveRandomString: (l) => {
      const c = Yi.exec(l)?.[1] ?? "";
      if (c.startsWith("[")) {
        const g = c.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean).map((p) => Number.isFinite(Number(p)) ? Number(p) : p.replace(/^['"]|['"]$/g, ""));
        return g[Math.floor(t() * g.length)];
      }
      const [u, f, h] = c.split(",").map((d) => Number.parseFloat(d));
      return o(u, f, Number.isFinite(h) ? h : void 0);
    }
  };
}
function je(e, t, i) {
  let n = t, s = 1 / 0;
  for (const r of e) {
    const o = Math.abs(r - t);
    o < s && (s = o, n = r);
  }
  return s <= i ? n : t;
}
function Os(e) {
  const t = e.trim(), i = /^#([0-9a-f]{3,8})$/i.exec(t)?.[1];
  if (i) {
    const r = (i.length <= 4 ? [...i].map((o) => o + o).join("") : i).match(/../g).map((o) => Number.parseInt(o, 16));
    return r.length >= 4 ? [r[0], r[1], r[2], Math.round(r[3] / 255 * 1e3) / 1e3] : [r[0], r[1], r[2]];
  }
  const n = (/rgba?\(([^)]+)\)/i.exec(t)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((s) => Number.parseFloat(s));
  return n.length >= 4 ? [n[0], n[1], n[2], n[3]] : [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0];
}
const Ns = /^([+-])=\s*(-?[\d.]+)$/, qs = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function pt(e, t) {
  const i = t.scale ?? 1, n = (c) => Number.parseFloat(c) * i;
  if (e === void 0) return t.cursor;
  if (typeof e == "number") return e * i;
  const s = e.trim();
  if (s === "") return t.cursor;
  const r = Ns.exec(s);
  if (r) {
    const c = n(r[2]);
    return t.cursor + (r[1] === "-" ? -c : c);
  }
  const o = qs.exec(s);
  if (o) {
    const c = o[1] === "<" ? t.previousStart : t.previousEnd;
    if (o[3] === void 0) return c;
    const u = n(o[3]);
    return c + (o[2] === "-" ? -u : u);
  }
  const a = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(s);
  if (a) {
    const c = t.labels.get(a[1].trim());
    if (c !== void 0) {
      const u = n(a[3]);
      return c + (a[2] === "-" ? -u : u);
    }
  }
  const l = t.labels.get(s);
  return l !== void 0 ? l : /^-?[\d.]+$/.test(s) ? n(s) : t.cursor;
}
function Ys(e) {
  if (typeof e != "object" || e === null) return !1;
  const t = e;
  return t.grid !== void 0 || t.from === "random" || Array.isArray(t.from) || t.ease !== void 0 || t.axis !== void 0;
}
function Xs(e, t, i = {}) {
  if (e === 0) return [];
  const n = t.grid === "auto" ? Math.max(1, Math.min(e, i.columnsFromLayout?.() ?? e)) : Array.isArray(t.grid) ? Math.max(1, t.grid[1]) : e, s = Array.isArray(t.grid) ? Math.max(1, t.grid[0]) : Math.ceil(e / n), r = (g) => ({ x: g % n, y: Math.floor(g / n) }), o = t.from ?? "start", a = Array.isArray(o) ? { x: o[0] * (n - 1), y: o[1] * (s - 1) } : typeof o == "number" ? r(Math.max(0, Math.min(e - 1, o))) : o === "end" ? r(e - 1) : o === "center" || o === "edges" ? { x: (n - 1) / 2, y: (s - 1) / 2 } : { x: 0, y: 0 }, l = (g) => {
    const { x: p, y: m } = r(g), y = Math.abs(p - a.x), w = Math.abs(m - a.y);
    return t.axis === "x" ? y : t.axis === "y" ? w : Math.hypot(y, w);
  };
  let c = Array.from({ length: e }, (g, p) => l(p));
  const u = Math.max(...c);
  if (o === "edges" && (c = c.map((g) => u - g)), o === "random") {
    const g = i.random ?? Math.random;
    c = c.map(() => g() * u);
  }
  const f = t.amount !== void 0 ? t.amount : (t.each ?? 0) * u, h = t.ease ? Ot(t.ease) : void 0, d = h ? h.fn ?? z(h.easing) : void 0;
  return c.map((g) => {
    const p = u === 0 ? 0 : g / u;
    return (d ? d(p) : p) * f;
  });
}
const Me = /* @__PURE__ */ new Set([
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
function Lt(e) {
  const t = {}, i = {};
  for (const [n, s] of Object.entries(e))
    Me.has(n) ? t[n] = s : i[n] = s;
  return { config: t, properties: i };
}
function Nt(e, t) {
  return e === void 0 ? t : e * 1e3;
}
function me(e, t) {
  if (e !== void 0)
    return typeof e == "number" ? { each: e * 1e3 } : Ys(e) ? { offsets: Xs(t?.count ?? 0, e, t ?? {}).map((n) => n * 1e3) } : {
      ...e.each !== void 0 && { each: e.each * 1e3 },
      ...e.amount !== void 0 && { amount: e.amount * 1e3 },
      ...e.from !== void 0 && { from: e.from }
    };
}
const Ws = {
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
function Wi(e) {
  return Ws[e];
}
function Vs(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : e;
  if (!t || typeof t.path != "string" && !Array.isArray(t.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let i;
  if (Array.isArray(t.path))
    i = $s(t.path, { curviness: t.curviness });
  else if (Mt(t.path))
    i = t.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${t.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const n = { pathData: i };
  return t.autoRotate !== void 0 && t.autoRotate !== !1 && (n.autoRotate = !0, typeof t.autoRotate == "number" && (n.rotateOffset = t.autoRotate)), t.matrix && (n.matrix = t.matrix), { config: n, start: t.start ?? 0, end: t.end ?? 1 };
}
function Us(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : { ...e };
  return { ...t, start: t.end ?? 1, end: t.start ?? 0 };
}
function Vi(e) {
  return typeof e == "object" && e !== null && "shape" in e ? e.shape : e;
}
function js(e) {
  if (e.morphSVG === void 0) return e;
  const { morphSVG: t, ...i } = e, n = Vi(t);
  if (typeof n != "string" || !Mt(n))
    throw new Error(
      `gsap-compat: morphSVG "${String(n)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...i, d: n };
}
function Hs(e, t) {
  if (e === !0) return [0, t];
  if (e === !1) return [0, 0];
  if (typeof e == "number") return [0, He(e, t)];
  const i = e.trim().split(/[\s,]+/).filter(Boolean), n = (o) => {
    const a = Number.parseFloat(o);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${e}" is not a length or percentage`);
    return He(o.endsWith("%") ? t * a / 100 : a, t);
  };
  if (i.length === 0) return [0, t];
  if (i.length === 1) return [0, n(i[0])];
  const s = n(i[0]), r = n(i[1]);
  return s <= r ? [s, r] : [r, s];
}
function zs(e, t) {
  const [i, n] = Hs(e, t);
  return { strokeDasharray: [n - i, t], strokeDashoffset: -i };
}
function Gs(e, t) {
  if (e.drawSVG === void 0) return e;
  const { drawSVG: i, ...n } = e;
  return { ...n, ...zs(i, t) };
}
function Ks(e) {
  if (e.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return e;
}
function He(e, t) {
  return Math.max(0, Math.min(t, e));
}
function Zs(e) {
  let t = 2166136261;
  for (let i = 0; i < e.length; i++) t = Math.imul(t ^ e.charCodeAt(i), 16777619);
  return t >>> 0;
}
function Qs(e, t, i) {
  if (e.scrambleText !== void 0) {
    const n = e.scrambleText, s = typeof n == "string" ? { text: n } : n;
    if (typeof s?.text != "string")
      throw new Error("gsap-compat: scrambleText needs the text to end on — a string, or { text }.");
    const r = s.revealDelay && i > 0 ? s.revealDelay * 1e3 / i : void 0;
    return {
      to: s.text,
      mode: "scramble",
      ...s.chars !== void 0 && { chars: s.chars },
      ...s.speed !== void 0 && { refreshRate: 20 * s.speed },
      ...r !== void 0 && { revealDelay: Math.min(r, 0.999) },
      ...s.tweenLength !== void 0 && { tweenLength: s.tweenLength },
      ...s.rightToLeft !== void 0 && { rightToLeft: s.rightToLeft },
      seed: s.seed ?? Zs(`${t}|${s.text}`)
    };
  }
  if (e.text !== void 0) {
    const n = e.text, s = typeof n == "string" ? { value: n } : n;
    if (typeof s?.value != "string")
      throw new Error("gsap-compat: text needs the text to end on — a string, or { value }.");
    return {
      to: s.value,
      mode: "type",
      ...s.rightToLeft !== void 0 && { rightToLeft: s.rightToLeft }
    };
  }
}
function Ae(e) {
  return Math.max(0.1, e / 25);
}
function Js(e, t) {
  const i = typeof t == "number" ? { velocity: t } : t;
  if (typeof i?.velocity != "number" || !Number.isFinite(i.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const n = i.friction ?? (i.resistance !== void 0 ? Ae(i.resistance) : void 0), s = {
    from: e,
    velocity: i.velocity,
    ...n !== void 0 && { friction: n },
    ...i.min !== void 0 && { min: i.min },
    ...i.max !== void 0 && { max: i.max }
  };
  return typeof i.end == "function" ? s.end = [i.end(Dt(s))] : i.end !== void 0 && (s.end = Array.isArray(i.end) ? [...i.end] : i.end), s;
}
function tr(e) {
  const t = e === !0 ? {} : typeof e == "string" ? { preset: e } : e;
  if (t.preset !== void 0 && !(t.preset in Gt))
    throw new Error(
      `gsap-compat: unknown spring preset "${t.preset}" — use one of ${Object.keys(Gt).join(", ")}`
    );
  return {
    ...t.preset ? Gt[t.preset] : {},
    ...t.stiffness !== void 0 && { stiffness: t.stiffness },
    ...t.damping !== void 0 && { damping: t.damping },
    ...t.mass !== void 0 && { mass: t.mass },
    ...t.restDelta !== void 0 && { restDelta: t.restDelta }
  };
}
function er(e, t) {
  if (e === !0 || typeof e == "string") return;
  const i = e.velocity;
  return typeof i == "number" ? i : i?.[t];
}
class ot {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = pe(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(t = {}) {
    this.options = t, this.timeline = new Ri({
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
  to(t, i, n) {
    return this.build(t, void 0, mt(i), n);
  }
  /** Animate from the given values to where the property already is. */
  from(t, i, n) {
    const { config: s, properties: r } = Lt(mt(i)), { motionPath: o, text: a, scrambleText: l, ...c } = r, u = this.targetsOf(t)[0], f = { ...s };
    for (const g of Object.keys(c))
      f[g] = this.resolveStart(u, g);
    o !== void 0 && (f.motionPath = Us(o));
    const h = {}, d = String(this.resolveStart(u, "text"));
    return a !== void 0 && (h.text = ne(a), f.text = typeof a == "object" ? { ...a, value: d } : d), l !== void 0 && (h.text = ne(l), f.scrambleText = typeof l == "object" ? { ...l, text: d } : d), this.build(t, { ...c, ...h }, f, n);
  }
  /** Animate between two explicit sets of values. */
  fromTo(t, i, n, s) {
    const { properties: r } = Lt(mt(i));
    return this.build(t, r, mt(n), s);
  }
  /** Set values instantly — a single held keyframe. */
  set(t, i, n) {
    return this.build(t, void 0, { ...mt(i), duration: 0 }, n);
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
    const i = Math.max(0, pt(t, this.context()));
    return this.previousStart = i, this.previousEnd = i, this.cursor = Math.max(this.cursor, i), i;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(t) {
    return pt(t, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(t, i) {
    return this.labels.set(t, pt(i, this.context())), this;
  }
  /** Time of a label, in milliseconds. */
  /** Every label's time in milliseconds, in time order. */
  labelTimes() {
    return [...this.labels.values()].sort((t, i) => t - i);
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
  add(t, i) {
    const n = pt(i, this.context());
    for (const r of t.timeline.tracks) {
      if (!("keyframes" in r)) continue;
      const o = de({
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
      const i = this.labels.get(t);
      return i !== void 0 && this.timeline.seek(i), this;
    }
    return this.timeline.seek(t * 1e3), this;
  }
  /** Progress through the timeline, 0..1. */
  progress(t) {
    const i = this.timeline.duration;
    return t !== void 0 && i > 0 && this.timeline.seek(t * i), i > 0 ? this.timeline.currentTime / i : 0;
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
  build(t, i, n, s) {
    const { config: r, properties: o } = Lt(n), { motionPath: a, text: l, scrambleText: c, inertia: u, ...f } = o, h = this.targetsOf(t), d = pt(s, this.context()), g = Nt(r.delay, 0), p = Nt(r.duration, 500), m = me(r.stagger, {
      count: h.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(h) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), y = this.easingFor(r.ease), w = [], b = r.spring;
    let k = 0, v = !1;
    for (const [S, C] of Object.entries(f)) {
      const P = C;
      let _ = i?.[S] !== void 0 ? i[S] : this.resolveStart(h[0], S);
      if (typeof _ != typeof P && (this.warn(
        `no usable start value for "${S}" on "${h[0]}" — it will snap to ${String(P)}. Use fromTo() to animate it.`
      ), _ = P), b !== void 0 && (typeof _ != "number" || typeof P != "number") && this.warn(`spring works on numbers, so "${S}" on "${h[0]}" eases instead`), b !== void 0 && typeof _ == "number" && typeof P == "number") {
        const $ = {
          ...tr(b),
          from: _,
          to: P,
          velocity: er(b, S) ?? this.options.startVelocity?.(h[0], S) ?? 0
        }, N = this.nextTrackId(`${h[0]}-${S}-spring`), O = {
          id: N,
          target: h[0],
          ...h.length > 1 && { targets: h },
          ...m && h.length > 1 && { stagger: m },
          property: S,
          kind: "spring",
          spring: $,
          delay: d + g
        };
        this.timeline.addTrack(O), w.push(N), k = Math.max(k, wn($));
        for (const L of h) this.lastValues.set(`${L}|${S}`, P);
        continue;
      }
      v = !0;
      const E = this.keyframesFor(_, P, p, y, r.ease), R = this.nextTrackId(`${h[0]}-${S}`);
      this.timeline.addTrack(
        de({
          id: R,
          target: h[0],
          ...h.length > 1 && { targets: h },
          ...m && h.length > 1 && { stagger: m },
          property: S,
          delay: d + g,
          keyframes: E
        })
      ), w.push(R);
      for (const $ of h) this.lastValues.set(`${$}|${S}`, P);
    }
    const T = Qs({ text: l, scrambleText: c }, h[0], p);
    if (T) {
      const S = i?.text ?? i?.scrambleText, C = S !== void 0 ? ne(S) : this.resolveStart(h[0], "text"), P = this.nextTrackId(`${h[0]}-text`), _ = {
        id: P,
        target: h[0],
        ...h.length > 1 && { targets: h },
        ...m && h.length > 1 && { stagger: m },
        property: "text",
        textConfig: { from: typeof C == "string" ? C : String(C ?? ""), ...T },
        delay: d + g,
        keyframes: this.keyframesFor(0, 1, p, y, r.ease)
      };
      this.timeline.addTrack(_), w.push(P);
      for (const E of h) this.lastValues.set(`${E}|text`, T.to);
    }
    if (a !== void 0) {
      const { config: S, start: C, end: P } = Vs(a), _ = this.nextTrackId(`${h[0]}-motionPath`), E = {
        id: _,
        target: h[0],
        ...h.length > 1 && { targets: h },
        ...m && h.length > 1 && { stagger: m },
        property: "motionPath",
        motionPathConfig: S,
        delay: d + g,
        keyframes: this.keyframesFor(C, P, p, y, r.ease)
      };
      this.timeline.addTrack(E), w.push(_);
    }
    if (u !== void 0)
      for (const [S, C] of Object.entries(u)) {
        const P = this.resolveStart(h[0], S);
        if (typeof P != "number") {
          this.warn(`inertia on "${S}" needs a numeric start value; skipped`);
          continue;
        }
        const _ = Js(P, C), E = this.nextTrackId(`${h[0]}-${S}-inertia`), R = {
          id: E,
          target: h[0],
          ...h.length > 1 && { targets: h },
          ...m && h.length > 1 && { stagger: m },
          property: S,
          kind: "inertia",
          inertia: _,
          delay: d + g
        };
        this.timeline.addTrack(R), w.push(E), k = Math.max(k, St(_));
        for (const $ of h) this.lastValues.set(`${$}|${S}`, xt(_));
      }
    const I = ((u !== void 0 || b !== void 0) && !v && !T && a === void 0 ? k : Math.max(p, k)) + (m && h.length > 1 ? Wt(h.length, m) : 0), A = d + g + I;
    return this.previousStart = d + g, this.previousEnd = A, this.cursor = Math.max(this.cursor, A), {
      trackIds: w,
      start: d + g,
      end: A,
      kill: () => {
        for (const S of w) this.timeline.removeTrack(S);
      }
    };
  }
  /**
   * Two keyframes, or a baked sequence when the ease has no closed form.
   */
  keyframesFor(t, i, n, s, r) {
    const o = { time: 0, value: t };
    if (n <= 0)
      return [{ time: 0, value: i }];
    const a = typeof r == "string" ? Ot(r) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && $t(s)) {
      const c = a?.fn ?? z(s);
      return [o, ..._i(o, { time: n, value: i }, c, { intervalMs: this.options.bakeIntervalMs })];
    }
    return [o, { time: n, value: i, ...s && { easing: s } }];
  }
  /** Resolve a start value through the documented chain. */
  resolveStart(t, i) {
    const n = this.lastValues.get(`${t}|${i}`);
    if (n !== void 0) return n;
    const s = this.options.startValue?.(t, i);
    if (s !== void 0) return s;
    const r = this.options.defaults?.[i];
    if (r !== void 0) return r;
    if (i === "text") return "";
    if (i === "d")
      throw new Error(
        `gsap-compat: no starting shape for "${t}". Use fromTo({ d: … }, { morphSVG: … }), or live.to(), which reads the element's current shape.`
      );
    const o = Wi(i);
    return o !== void 0 ? (this.warn(
      `no start value for "${i}" on "${t}" — using the static default ${o}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), o) : (this.warn(`no start value or default for "${i}" on "${t}" — using 0`), 0);
  }
  easingFor(t) {
    if (t !== void 0) {
      if (typeof t == "string") return Ot(t).easing;
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
function ne(e) {
  if (typeof e == "string") return e;
  if (e && typeof e == "object") {
    const t = e;
    return String(t.value ?? t.text ?? "");
  }
  return String(e ?? "");
}
function ir(e) {
  return new ot(e);
}
function mt(e) {
  return Ks(js(e));
}
const nr = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), sr = "#ffffff", rr = "rgba(0, 0, 0, 0.5)";
function or(e) {
  const t = [];
  if (e.blur !== void 0 && t.push(`blur(${Math.max(0, e.blur)}px)`), e.brightness !== void 0 && t.push(`brightness(${Math.max(0, e.brightness)})`), e.glow !== void 0 && t.push(`drop-shadow(0 0 ${Math.max(0, e.glow)}px ${e.glowColor ?? sr})`), e.shadowX !== void 0 || e.shadowY !== void 0 || e.shadowBlur !== void 0) {
    const i = e.shadowX ?? 0, n = e.shadowY ?? 0, s = Math.max(0, e.shadowBlur ?? 0);
    t.push(`drop-shadow(${i}px ${n}px ${s}px ${e.shadowColor ?? rr})`);
  }
  return t.length > 0 ? t.join(" ") : null;
}
function ar(e, t) {
  const i = e.childNodes.length === 1 ? e.firstChild : null;
  if (i && i.nodeType === 3) {
    const n = i;
    n.data !== t && (n.data = t);
    return;
  }
  e.textContent !== t && (e.textContent = t);
}
function lr(e) {
  if (!("ownerSVGElement" in e)) return;
  const t = e.style;
  !t || t.transformBox || (t.transformBox = "fill-box", t.transformOrigin || (t.transformOrigin = "50% 50%"));
}
const ze = /* @__PURE__ */ new Set([
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
]), cr = /* @__PURE__ */ new Set([
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
]), hr = /* @__PURE__ */ new Set(["originX", "originY"]), ur = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), fr = /* @__PURE__ */ new Set(["drawOn"]), dr = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, Ge = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, pr = "http://www.w3.org/2000/svg";
class J {
  targets = /* @__PURE__ */ new Map();
  /**
   * Register an HTML element as an animation target.
   */
  registerTarget(t, i) {
    this.targets.set(t, i);
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
    for (const [i, n] of t.values) {
      const s = this.targets.get(i);
      s && this.applyProperties(s, n);
    }
  }
  /**
   * Apply properties to a single element.
   */
  applyProperties(t, i) {
    const n = [];
    let s = null, r = null, o = null;
    const a = i.has("motionPathX"), l = i.has("motionPathY"), c = i.has("motionPathRotate");
    for (const [h, d] of i)
      if (!(h === "x" && a) && !(h === "y" && l) && !((h === "rotate" || h === "rotateZ") && c) && !fr.has(h)) {
        if (cr.has(h)) {
          const g = this.buildTransformPart(h, d);
          g && n.push(g);
        } else if (hr.has(h))
          typeof d == "number" && ((s ??= {})[h] = d);
        else if (ur.has(h))
          typeof d == "number" && ((r ??= {})[h] = d);
        else if (nr.has(h))
          (o ??= {})[h] = d;
        else if (h !== "perspective") {
          if (h !== "shine") if (h === "text" && typeof d == "string")
            ar(t, d);
          else if (h === "d" && typeof d == "string") {
            const g = t;
            (g.tagName?.toLowerCase() === "path" ? g : g.querySelector?.("path"))?.setAttribute?.("d", d);
          } else
            this.applyStyleProperty(t, h, d);
        }
      }
    const u = i.get("shine");
    typeof u == "number" && this.applyShine(t, u);
    const f = i.get("perspective");
    if (typeof f == "number" && n.unshift(`perspective(${f}px)`), n.length > 0 && (t.style.transform = n.join(" "), lr(t)), s) {
      const h = s.originX ?? 50, d = s.originY ?? 50;
      t.style.transformOrigin = `${h}% ${d}%`;
    }
    if (r) {
      const h = r.clipTop ?? 0, d = r.clipRight ?? 0, g = r.clipBottom ?? 0, p = r.clipLeft ?? 0;
      t.style.clipPath = `inset(${h}% ${d}% ${g}% ${p}%)`;
    }
    if (o) {
      const h = or(o);
      h && (t.style.filter = h);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(t, i) {
    if (typeof i != "number") return null;
    switch (t) {
      case "x":
      case "motionPathX":
        return `translateX(${i}px)`;
      case "y":
      case "motionPathY":
        return `translateY(${i}px)`;
      case "z":
        return `translateZ(${i}px)`;
      case "rotate":
      case "rotateZ":
      case "motionPathRotate":
        return `rotate(${i}deg)`;
      case "rotateX":
        return `rotateX(${i}deg)`;
      case "rotateY":
        return `rotateY(${i}deg)`;
      case "scale":
        return `scale(${i})`;
      case "scaleX":
        return `scaleX(${i})`;
      case "scaleY":
        return `scaleY(${i})`;
      case "scaleZ":
        return `scaleZ(${i})`;
      case "skewX":
        return `skewX(${i}deg)`;
      case "skewY":
        return `skewY(${i}deg)`;
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
  applyShine(t, i) {
    t.dataset.shineBase || (t.dataset.shineBase = t.style.color || "currentColor");
    const n = t.dataset.shineBase, s = -20 + i * 140, r = t.style;
    r.color = "transparent", r.backgroundImage = `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.9) 50%, transparent 60%), linear-gradient(${n}, ${n})`, r.backgroundSize = "250% 100%, 100% 100%", r.backgroundPosition = `${s}% 0, 0 0`, r.backgroundRepeat = "no-repeat", r.webkitBackgroundClip = "text", r.backgroundClip = "text";
  }
  /**
   * Apply a single style property to an element.
   */
  applyStyleProperty(t, i, n) {
    let s;
    if (t.namespaceURI === pr && i in Ge) {
      const a = Array.isArray(n) ? n.join(", ") : String(n);
      t.style[Ge[i]] = a;
      return;
    } else i === "fill" && t.dataset?.elementType === "text" ? s = "color" : s = dr[i] ?? i;
    let o;
    typeof n == "number" ? ze.has(i) || ze.has(s) ? o = `${n}px` : o = String(n) : Array.isArray(n) ? o = n.join(", ") : o = n, t.style[s] = o;
  }
}
const mr = {
  request: (e) => requestAnimationFrame(e),
  cancel: (e) => cancelAnimationFrame(e)
};
class gr {
  adapter = new J();
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
  utils = Bs();
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
    this.scheduler = t.scheduler ?? mr, this.rootOption = t.root, this.onWarning = t.onWarning;
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
    const i = [];
    for (const n of this.targetsOf(t)) {
      const s = this.nameFor(n);
      se(n) && this.currentCollector?.touch(n, s), i.push(s);
    }
    return i;
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
  appliedValue(t, i) {
    return this.applied.get(t)?.get(i);
  }
  /**
   * How fast a property is changing right now, in units per second, taken from
   * the most recently played timeline that animates it — so a spring started
   * mid-motion carries the momentum. A finite difference over a few milliseconds
   * of that timeline's own (deterministic) state; undefined when nothing playing
   * animates the property.
   */
  velocityOf(t, i) {
    for (const s of [...this.active.keys()].reverse()) {
      if (s.getTracks({ target: t, property: i }).length === 0) continue;
      const r = s.currentTime;
      if (r < 4) return 0;
      const o = s.getStateAtTime(r).values.get(t)?.get(i), a = s.getStateAtTime(r - 4).values.get(t)?.get(i);
      if (typeof o != "number" || typeof a != "number") return;
      const l = (o - a) / 4;
      return (s.direction === "reverse" ? -l : l) * 1e3;
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
  activate(t, i = {}) {
    this.destroyed || (t.onUpdate = (n) => this.write(n), this.active.delete(t), this.active.set(t, i), this.startLoop());
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
  apply(t, i) {
    if (this.destroyed) return;
    const n = new Map(Object.entries(i));
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
    const i = [...this.active];
    for (const [n] of i)
      n.duration <= 0 ? (this.write(n.getStateAtTime(0)), n.stop()) : n.tick(t);
    this.flush();
    for (const [n, s] of i)
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
      for (const i of [...this.tickerCallbacks])
        i(this.tickerTime / 1e3, t, this.tickerFrame);
    }
  }
  write(t) {
    for (const [i, n] of t.values) {
      let s = this.applied.get(i);
      s || (s = /* @__PURE__ */ new Map(), this.applied.set(i, s));
      for (const [r, o] of n) s.set(r, o);
      this.dirty.add(i);
    }
  }
  flush() {
    if (this.dirty.size === 0) return;
    const t = /* @__PURE__ */ new Map();
    for (const i of this.dirty) {
      const n = this.applied.get(i), s = this.objects.get(i);
      if (s)
        for (const [r, o] of n) s[r] = o;
      else
        t.set(i, n);
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
    const i = this.lastTimestamp === null ? 0 : t - this.lastTimestamp;
    this.lastTimestamp = t, i > 0 && this.tick(i), this.running && this.frameId === null && (this.frameId = this.scheduler.request(this.frame));
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
    if (se(t)) return [t];
    if (!yr(t)) return [t];
    const i = [];
    for (const n of Array.from(t))
      i.push(...this.targetsOf(n));
    return i;
  }
  nameFor(t) {
    return se(t) ? this.elementName(t) : this.objectName(t);
  }
  objectName(t) {
    const i = this.objectNames.get(t);
    if (i) return i;
    let n;
    do
      this.nameCounter += 1, n = `obj-${this.nameCounter}`;
    while (this.objects.has(n) || this.elements.has(n));
    return this.objectNames.set(t, n), this.objects.set(n, t), n;
  }
  elementName(t) {
    const i = this.names.get(t);
    if (i) return i;
    let n = t.id ? `#${t.id}` : "";
    if (!n || this.elements.has(n))
      do
        this.nameCounter += 1, n = `el-${this.nameCounter}`;
      while (this.elements.has(n));
    return this.names.set(t, n), this.elements.set(n, t), this.adapter.registerTarget(n, t), n;
  }
}
function se(e) {
  return typeof e == "object" && e !== null && e.nodeType === 1;
}
function yr(e) {
  if (Array.isArray(e)) return !0;
  const t = e;
  return typeof t.length == "number" && typeof t.item == "function";
}
function qt(e) {
  const t = e.style;
  if (!t) return e.getBoundingClientRect();
  const i = t.transform;
  t.transform = "none";
  const n = e.getBoundingClientRect();
  return t.transform = i, n;
}
const Ke = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function br(e) {
  const t = {};
  for (const i of Array.from(e.attributes)) t[i.name] = i.value;
  return t;
}
function vr(e) {
  const t = e.getScreenCTM?.();
  if (t) return [t.a, t.b, t.c, t.d, t.e, t.f];
  const i = e.getBoundingClientRect();
  return [1, 0, 0, 1, i.left, i.top];
}
function wr(e, t) {
  const i = typeof e == "string" || Array.isArray(e) || Ke(e) ? { path: e } : e, { align: n, alignOrigin: s, path: r, ...o } = i, a = (T) => {
    const x = Ke(T) ? T : t.query(T);
    return x || t.warn(`gsap-compat: motionPath could not find "${String(T)}"`), x;
  };
  let l = null, c = "";
  if (Array.isArray(r) || typeof r == "string" && Mt(r))
    c = r;
  else {
    l = a(r);
    const T = l && xe({ tag: l.localName, attributes: br(l) });
    l && !T && t.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), c = T ?? "";
  }
  const u = { ...o, path: c };
  if (n === void 0 || n === !1) return u;
  const f = n === !0 ? l : a(n);
  if (!f)
    return n === !0 && t.warn("gsap-compat: motionPath align: true needs the path to be an element"), u;
  const h = t.targets[0];
  if (!h) return u;
  const [d, g, p, m, y, w] = vr(f), b = qt(h), [k, v] = s ?? [0.5, 0.5];
  for (const T of t.targets.slice(1)) {
    const x = qt(T);
    if (Math.abs(x.left - b.left) > 0.5 || Math.abs(x.top - b.top) > 0.5) {
      t.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return u.matrix = [d, g, p, m, y - b.left - k * b.width, w - b.top - v * b.height], u;
}
const Ui = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function ji(e) {
  const t = {};
  for (const i of Array.from(e.attributes)) t[i.name] = i.value;
  return t;
}
function Hi(e) {
  if (!e) return null;
  const t = xe({ tag: e.localName, attributes: ji(e) });
  return t || (e.querySelector("path")?.getAttribute("d") ?? null);
}
function Tr(e, t, i) {
  const n = Vi(e);
  if (typeof n == "string" && Mt(n)) return n;
  const s = Ui(n) ? n : typeof n == "string" ? t(n) : null, r = Hi(s);
  return r || (i(`gsap-compat: morphSVG could not find a shape for "${String(n)}"`), "");
}
const kr = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function xr(e, t = document) {
  return (typeof e == "string" ? Array.from(t.querySelectorAll(e)) : Ui(e) ? [e] : Array.from(e)).map((n) => {
    if (n.localName === "path") return n;
    const s = xe({ tag: n.localName, attributes: ji(n) });
    if (!s || !n.parentNode) return n;
    const r = n.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const o of Array.from(n.attributes))
      kr.has(o.name) || r.setAttribute(o.name, o.value);
    return r.setAttribute("d", s), n.parentNode.replaceChild(r, n), r;
  });
}
const Ze = 0.3;
class Sr {
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
  begin(t, i, n) {
    this.dragging = !0, this.passedTolerance = !1, this.startX = t, this.startY = i, this.lastX = t, this.lastY = i, this.velocityX = 0, this.velocityY = 0, this.lastTime = Qe(), this.options.onPress?.(this.stateFrom(0, 0, n));
  }
  move(t, i, n) {
    if (!this.dragging) return;
    const s = t - this.lastX, r = i - this.lastY;
    this.lastX = t, this.lastY = i;
    const o = t - this.startX, a = i - this.startY, l = this.options.tolerance ?? 3;
    if (!this.passedTolerance) {
      if (Math.hypot(o, a) < l) return;
      this.passedTolerance = !0;
    }
    this.updateVelocity(s, r), this.options.preventDefault !== !1 && n.cancelable && n.preventDefault(), this.options.onMove?.(this.stateFrom(s, r, n));
  }
  end(t) {
    this.dragging && (this.dragging = !1, this.options.onRelease?.(this.stateFrom(0, 0, t)));
  }
  updateVelocity(t, i) {
    const n = Qe(), s = Math.max(1, n - this.lastTime);
    this.lastTime = n;
    const r = t / s * 1e3, o = i / s * 1e3;
    this.velocityX += (r - this.velocityX) * Ze, this.velocityY += (o - this.velocityY) * Ze;
  }
  stateFrom(t, i, n) {
    return {
      deltaX: t,
      deltaY: i,
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
    const i = t, n = this.target;
    if (typeof i.pointerId == "number" && typeof n.setPointerCapture == "function")
      try {
        n.setPointerCapture(i.pointerId);
      } catch {
      }
    this.begin(i.clientX, i.clientY, t);
  };
  onPointerMove = (t) => {
    const i = t;
    this.move(i.clientX, i.clientY, t);
  };
  onPointerUp = (t) => this.end(t);
  onTouchStart = (t) => {
    const i = t.touches[0];
    i && this.begin(i.clientX, i.clientY, t);
  };
  onTouchMove = (t) => {
    const i = t.touches[0];
    i && this.move(i.clientX, i.clientY, t);
  };
  onTouchEnd = (t) => this.end(t);
  onWheel = (t) => {
    const i = t;
    this.options.preventDefault !== !1 && i.cancelable && i.preventDefault(), this.updateVelocity(i.deltaX, i.deltaY), this.options.onMove?.({
      deltaX: i.deltaX,
      deltaY: i.deltaY,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      totalX: 0,
      totalY: 0,
      isDragging: !1,
      event: t
    });
  };
}
function Qe() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function Mr(e, t, i) {
  let n = { delta: 0, line: null }, s = i;
  for (const r of e)
    for (const o of t) {
      const a = Math.abs(o - r);
      a <= s && (s = a, n = { delta: o - r, line: o });
    }
  return n;
}
function Ar(e, t) {
  return t <= 0 ? [] : e.map((i) => Math.round(i / t) * t);
}
class zi {
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
    this.options = t, this.x = t.initialX ?? 0, this.y = t.initialY ?? 0, this.observer = new Sr({
      target: t.target,
      onPress: (i) => {
        const n = t.getPosition?.();
        n && (this.x = n.x, this.y = n.y), this.originX = this.x, this.originY = this.y, t.onPress?.(i);
      },
      onMove: (i) => this.handleMove(i),
      onRelease: (i) => t.onRelease?.(i)
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
  setPosition(t, i) {
    const n = this.options.axis ?? "both";
    this.x = n === "y" ? this.x : this.applyConstraints(t, "x"), this.y = n === "x" ? this.y : this.applyConstraints(i, "y");
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
    const i = t.duration;
    if (i <= 0) return;
    const n = this.options.scrubDistance ?? 500;
    if (n === 0) return;
    const s = (this.options.axis ?? "both") === "y" ? this.y : this.x, r = Er(s / n);
    t.pause(), t.seek(r * i);
  }
  /**
   * Apply snapping, then bounds. Snapping uses the shared `snapAxis` helper —
   * the same one the editor stage snaps with — rather than a private rounding
   * rule, so grid and edge snapping behave identically in both places.
   *
   * Bounds are applied last so a snap can never push the target out of range.
   */
  applyConstraints(t, i) {
    let n = t;
    const s = [
      ...Ar([n], this.options.snap ?? 0),
      ...(i === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], r = Mr([n], s, this.snapThreshold());
    n += r.delta, i === "x" ? this.snappedX = r.line : this.snappedY = r.line;
    const o = this.options.bounds;
    if (o) {
      const a = i === "x" ? o.minX : o.minY, l = i === "x" ? o.maxX : o.maxY;
      a !== void 0 && (n = Math.max(a, n)), l !== void 0 && (n = Math.min(l, n));
    }
    return n;
  }
}
function Er(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e;
}
function Ia(e) {
  const t = new zi(e);
  return t.start(), t;
}
const Pr = { x: "x", y: "y", "x,y": "both" }, ge = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function Je(e, t) {
  const i = qt(e), n = t.getBoundingClientRect();
  return {
    minX: n.left - i.left,
    maxX: n.right - i.right,
    minY: n.top - i.top,
    maxY: n.bottom - i.bottom
  };
}
function ti(e) {
  return Array.isArray(e) ? [...e] : e;
}
function Cr(e, t, i, n = {}) {
  const [s] = t.resolveTargets(i), r = s ? t.elementFor(s) : void 0;
  if (!s || !r)
    throw new Error(`gsap-compat: live.draggable could not find ${String(i)}`);
  if (n.type === "rotation") return _r(e, t, s, r, n);
  const o = Pr[n.type ?? "x,y"], a = () => {
    const p = t.appliedValue(s, "x"), m = t.appliedValue(s, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof m == "number" ? m : 0 };
  }, l = typeof n.bounds == "string" ? t.query(n.bounds) : ge(n.bounds) ? n.bounds : null, u = { bounds: (!l && n.bounds && !ge(n.bounds) ? n.bounds : void 0) ?? (l ? Je(r, l) : void 0) };
  let f = null;
  const h = () => {
    f?.kill(), f = null;
  }, d = (p) => {
    const m = n.inertia === !0 ? {} : n.inertia, y = m.friction ?? (m.resistance !== void 0 ? Ae(m.resistance) : 4), w = a(), b = u.bounds ?? {};
    let k, v;
    const T = m.end;
    if (Array.isArray(T)) {
      const M = Dt({ from: w.x, velocity: o === "y" ? 0 : p.x, friction: y }), I = Dt({ from: w.y, velocity: o === "x" ? 0 : p.y, friction: y });
      let A = T[0];
      for (const S of T)
        Math.hypot(S.x - M, S.y - I) < Math.hypot(A.x - M, A.y - I) && (A = S);
      A && (k = [A.x], v = [A.y]);
    } else typeof T == "number" ? (k = T, v = T) : T && (k = ti(T.x), v = ti(T.y));
    const x = {};
    o !== "y" && (x.x = { velocity: p.x, friction: y, min: b.minX, max: b.maxX, end: k }), o !== "x" && (x.y = { velocity: p.y, friction: y, min: b.minY, max: b.maxY, end: v }), f = e.to(r, { inertia: x, onComplete: () => n.onThrowComplete?.() });
  }, g = new zi({
    target: r,
    axis: o,
    snap: n.snap,
    get bounds() {
      return u.bounds;
    },
    getPosition: a,
    onPress: () => {
      h(), l && (u.bounds = Je(r, l)), n.onPress?.();
    },
    onDrag: (p) => {
      t.apply(s, o === "x" ? { x: p.x } : o === "y" ? { y: p.y } : { x: p.x, y: p.y }), n.onDrag?.(p);
    },
    onRelease: () => {
      const p = g.velocity;
      n.onRelease?.(p), n.inertia && d(p);
    }
  });
  return g.start(), {
    draggable: g,
    get position() {
      return a();
    },
    get rotation() {
      const p = t.appliedValue(s, "rotate");
      return typeof p == "number" ? p : 0;
    },
    destroy() {
      h(), g.destroy();
    }
  };
}
function _r(e, t, i, n, s) {
  const r = typeof s.bounds == "object" && s.bounds !== null && !ge(s.bounds) ? s.bounds : {}, o = () => {
    const b = t.appliedValue(i, "rotate");
    return typeof b == "number" ? b : 0;
  }, a = (b) => Math.min(r.maxRotation ?? 1 / 0, Math.max(r.minRotation ?? -1 / 0, b));
  let l = null, c = !1, u, f = { x: 0, y: 0 }, h = 0, d = 0, g = [];
  const p = (b) => Math.atan2(b.clientY - f.y, b.clientX - f.x) * 180 / Math.PI, m = (b) => {
    if (c) return;
    l?.kill(), l = null, c = !0, u = b.pointerId, n.setPointerCapture?.(b.pointerId);
    const k = n.getBoundingClientRect();
    f = { x: k.left + k.width / 2, y: k.top + k.height / 2 }, h = p(b), d = o(), g = [{ time: performance.now(), rotation: d }], s.onPress?.();
  }, y = (b) => {
    if (!c || b.pointerId !== u) return;
    const k = p(b);
    let v = k - h;
    v > 180 && (v -= 360), v < -180 && (v += 360), h = k, d += v;
    let T = a(d);
    s.snap && (T = a(Math.round(T / s.snap) * s.snap)), t.apply(i, { rotate: T });
    const x = performance.now();
    for (g.push({ time: x, rotation: T }); g.length > 2 && x - g[0].time > 100; ) g.shift();
    const M = { x: 0, y: 0 };
    s.onDrag?.(M);
  }, w = (b) => {
    if (!c || b.pointerId !== u) return;
    c = !1;
    const k = g[0], v = g[g.length - 1], T = k && v ? (v.time - k.time) / 1e3 : 0, x = T > 0 ? (v.rotation - k.rotation) / T : 0;
    if (s.onRelease?.({ x, y: 0 }), !s.inertia) return;
    const M = s.inertia === !0 ? {} : s.inertia, I = M.friction ?? (M.resistance !== void 0 ? Ae(M.resistance) : 4), A = typeof M.end == "number" || Array.isArray(M.end) ? M.end : void 0;
    l = e.to(n, {
      inertia: {
        rotate: {
          velocity: x,
          friction: I,
          min: r.minRotation,
          max: r.maxRotation,
          end: Array.isArray(A) ? A.filter((S) => typeof S == "number") : A
        }
      },
      onComplete: () => s.onThrowComplete?.()
    });
  };
  return n.addEventListener("pointerdown", m), n.addEventListener("pointermove", y), n.addEventListener("pointerup", w), n.addEventListener("pointercancel", w), n.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return o();
    },
    destroy() {
      l?.kill(), n.removeEventListener("pointerdown", m), n.removeEventListener("pointermove", y), n.removeEventListener("pointerup", w), n.removeEventListener("pointercancel", w);
    }
  };
}
const Ir = { opacity: 0, scale: 0.6 };
function Rr(e) {
  const t = e.getBoundingClientRect();
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function ei(e) {
  const t = qt(e);
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function ye(e, t) {
  const n = e.resolveTargets(t).map((o) => e.elementFor(o)).filter((o) => !!o), s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of n) {
    const a = Rr(o);
    s.set(o, a);
    const l = Gi(o);
    a && l !== void 0 && !r.has(l) && r.set(l, { element: o, box: a });
  }
  return { elements: n, boxes: s, ids: r };
}
const re = /* @__PURE__ */ new WeakMap();
function be(e, t, i, n = {}) {
  const s = n.duration ?? 0.6, r = n.ease ?? "power2.inOut", o = n.stagger ?? 0, a = n.scale !== !1, l = n.enter === void 0 ? Ir : n.enter, c = new Set(i.elements);
  if (n.targets !== void 0)
    for (const d of e.resolveTargets(n.targets)) {
      const g = e.elementFor(d);
      g && c.add(g);
    }
  const u = [...c].sort(
    (d, g) => d === g ? 0 : d.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), f = t({ onComplete: n.onComplete });
  let h = 0;
  for (const d of u) {
    const g = ei(d);
    if (!g) continue;
    let p = i.boxes.get(d) ?? null, m;
    const y = Gi(d), w = !p && y !== void 0 ? i.ids.get(y) : void 0;
    w && w.element !== d && (p = w.box, m = w.element);
    const [b] = e.resolveTargets(d);
    re.get(d)?.timeline.removeTracks({ target: b });
    const k = h * o;
    if (!p) {
      if (l === !1) continue;
      f.fromTo(d, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...Ki(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: s, ease: r, delay: k }, 0), re.set(d, f), h++;
      continue;
    }
    const v = p.cx - g.cx, T = p.cy - g.cy, x = a ? p.width / g.width : 1, M = a ? p.height / g.height : 1;
    if (!(Math.abs(v) > 0.5 || Math.abs(T) > 0.5 || Math.abs(x - 1) > 1e-3 || Math.abs(M - 1) > 1e-3)) {
      const S = (C, P) => {
        const _ = e.appliedValue(b, C);
        return typeof _ == "number" && Math.abs(_ - P) > 1e-6;
      };
      (S("x", 0) || S("y", 0) || S("scaleX", 1) || S("scaleY", 1)) && f.set(d, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const A = n.fade === !0 && m !== void 0;
    f.fromTo(
      d,
      { x: v, y: T, scaleX: x, scaleY: M, ...A && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...A && { opacity: 1 }, duration: s, ease: r, delay: k },
      0
    ), A && m && ei(m) && f.fromTo(m, { opacity: 1 }, { opacity: 0, duration: s, ease: r, delay: k }, 0), re.set(d, f), h++;
  }
  return f;
}
function Gi(e) {
  return e.dataset?.flipId;
}
function Ki(e) {
  const t = {};
  for (const i of Object.keys(e))
    t[i] = i === "opacity" || i.startsWith("scale") ? 1 : 0;
  return t;
}
function Lr(e, t = {}) {
  const i = new Set((t.type ?? "chars,words,lines").split(",").map((p) => p.trim())), n = {
    chars: t.charsClass ?? "char",
    words: t.wordsClass ?? "word",
    lines: t.linesClass ?? "line"
  }, s = t.aria !== !1, r = e.map((p) => ({
    element: p,
    html: p.innerHTML,
    ariaLabel: p.getAttribute("aria-label")
  }));
  let o = { chars: [], words: [], lines: [], masks: [] }, a, l, c = !1;
  const u = () => {
    for (const { element: p, html: m, ariaLabel: y } of r)
      p.innerHTML = m, y === null ? p.removeAttribute("aria-label") : p.setAttribute("aria-label", y);
  }, f = () => {
    a && (a.revert ? a.revert() : a.kill?.(), a = void 0);
  }, h = () => {
    const p = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: m } of r) {
      const y = (m.textContent ?? "").replace(/\s+/g, " ").trim(), w = $r(m, n.words), b = i.has("chars") ? w.flatMap((T) => Fr(T, n.chars)) : [], k = i.has("lines") ? Br(m, w, n.lines) : [];
      if (s) {
        !m.hasAttribute("aria-label") && y && m.setAttribute("aria-label", y);
        for (const T of w) T.setAttribute("aria-hidden", "true");
      }
      if (i.has("words")) p.words.push(...w);
      else for (const T of w) T.removeAttribute("class");
      p.chars.push(...b), p.lines.push(...k);
      const v = t.mask === "lines" ? k : t.mask === "words" ? w : t.mask === "chars" ? b : [];
      for (const T of v) p.masks.push(Or(T, `${n[t.mask]}-mask`));
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
      c || (f(), u(), h(), a = t.onSplit?.(d));
    },
    revert() {
      c = !0, l?.disconnect(), f(), u();
    }
  };
  h(), a = t.onSplit?.(d), t.autoSplit && g();
  function g() {
    const p = /* @__PURE__ */ new Map();
    let m = !1;
    const y = () => {
      if (m) return;
      m = !0;
      const b = () => {
        m = !1, d.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(b) : setTimeout(b, 0);
    };
    if (typeof ResizeObserver == "function") {
      l = new ResizeObserver((b) => {
        let k = !1;
        for (const v of b) {
          const T = Math.round(v.contentRect.width), x = p.get(v.target);
          p.set(v.target, T), x !== void 0 && x !== T && (k = !0);
        }
        k && y();
      });
      for (const b of e) l.observe(b);
    }
    const w = e[0]?.ownerDocument?.fonts;
    w && w.status !== "loaded" && w.ready.then(() => y());
  }
  return d;
}
function $r(e, t) {
  const i = e.ownerDocument, n = [], s = i.createTreeWalker(
    e,
    4
    /* NodeFilter.SHOW_TEXT */
  ), r = [];
  for (let o = s.nextNode(); o; o = s.nextNode()) r.push(o);
  for (const o of r) {
    const a = o.data.match(/\s+|\S+/g) ?? [];
    if (a.length === 0) continue;
    const l = i.createDocumentFragment();
    for (const c of a) {
      if (/^\s/.test(c)) {
        l.appendChild(i.createTextNode(c));
        continue;
      }
      const u = i.createElement("span");
      u.className = t, u.style.display = "inline-block", u.textContent = c, l.appendChild(u), n.push(u);
    }
    o.replaceWith(l);
  }
  return n;
}
function Fr(e, t) {
  const i = e.ownerDocument, n = Dr(e.textContent ?? "").map((s) => {
    const r = i.createElement("span");
    return r.className = t, r.style.display = "inline-block", r.textContent = s, r;
  });
  return e.replaceChildren(...n), n;
}
function Dr(e) {
  const t = Intl.Segmenter;
  return t ? Array.from(new t(void 0, { granularity: "grapheme" }).segment(e), (i) => i.segment) : Array.from(e);
}
function Br(e, t, i) {
  const n = e.ownerDocument, s = new Map(t.map((g) => [g, g.getBoundingClientRect()])), r = [], o = (g) => {
    for (const p of Array.from(g.childNodes))
      p.nodeType === 3 || s.has(p) || p.tagName === "BR" ? r.push(p) : o(p);
  };
  o(e);
  const a = [];
  let l = null, c = 0, u = 0, f = !1, h = [];
  const d = () => {
    l = n.createElement("span"), l.className = i, l.style.display = "block", a.push(l), h = [];
  };
  for (const g of r) {
    if (g.tagName === "BR") {
      f = !0;
      continue;
    }
    const p = s.get(g);
    if (p && (!l || f || p.top > c + u) && (d(), c = p.top, u = p.height / 2, f = !1), !l) continue;
    const m = [];
    for (let b = g.parentNode; b && b !== e; b = b.parentNode) m.unshift(b);
    let y = 0;
    for (; y < h.length && y < m.length && h[y].original === m[y]; ) y++;
    h.length = y;
    let w = y === 0 ? l : h[y - 1].clone;
    for (const b of m.slice(y)) {
      const k = b.cloneNode(!1);
      w.appendChild(k), h.push({ original: b, clone: k }), w = k;
    }
    w.appendChild(g);
  }
  return e.replaceChildren(...a), a;
}
function Or(e, t) {
  const i = e.ownerDocument.createElement("span");
  return i.className = t, i.style.display = e.style.display === "block" ? "block" : "inline-block", i.style.overflow = "clip", i.style.paddingBottom = "0.12em", i.style.marginBottom = "-0.12em", e.replaceWith(i), i.appendChild(e), i;
}
const ii = {
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
function ni(e) {
  const t = e.trim().toLowerCase();
  if (t in ii) return ii[t];
  if (t.endsWith("%")) {
    const i = Number.parseFloat(t.slice(0, -1));
    return Number.isNaN(i) ? void 0 : i / 100;
  }
}
function Zi(e) {
  if (typeof e == "number")
    return { elementFraction: 0, viewportFraction: 0, offsetPx: 0, absolutePx: e };
  let t = 0;
  const n = e.replace(/([+-])=\s*(-?[\d.]+)/g, (o, a, l) => (t += (a === "-" ? -1 : 1) * Number.parseFloat(l), "")).trim().split(/\s+/).filter(Boolean);
  if (n.length === 1 && /^-?[\d.]+$/.test(n[0]))
    return {
      elementFraction: 0,
      viewportFraction: 0,
      offsetPx: 0,
      absolutePx: Number.parseFloat(n[0]) + t
    };
  const s = n[0] !== void 0 ? ni(n[0]) : void 0, r = n[1] !== void 0 ? ni(n[1]) : void 0;
  return {
    elementFraction: s ?? 0,
    viewportFraction: r ?? 0,
    offsetPx: t
  };
}
function Tt(e, t, i) {
  const n = Zi(i), s = n.absolutePx !== void 0 ? e.top + n.absolutePx : e.top + e.height * n.elementFraction, r = t * n.viewportFraction;
  return s - r + n.offsetPx;
}
function Ra(e, t, i, n) {
  const s = Tt(e, t, i), o = Tt(e, t, n) - s;
  return o <= 0 ? s <= 0 ? 1 : 0 : Qi(-s / o);
}
function Qi(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e === 0 ? 0 : e;
}
function Nr(e, t, i, n) {
  if (i <= 0) return t;
  const s = 1 - Math.exp(-(n / 1e3) / i);
  return e + (t - e) * s;
}
function si(e, t, i, n, s) {
  const r = (u) => Tt({ top: e + s(u), bottom: e + s(u) + t, height: t }, i, n), o = r(0), a = r(1);
  if (Math.sign(o) === Math.sign(a) || o === 0 || a === 0)
    return o === 0 ? 0 : a === 0 ? 1 : Math.abs(o) < Math.abs(a) ? 0 : 1;
  let l = 0, c = 1;
  for (let u = 0; u < 40; u++) {
    const f = (l + c) / 2;
    Math.sign(r(f)) === Math.sign(o) ? l = f : c = f;
  }
  return (l + c) / 2;
}
class qr {
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
          for (const i of t)
            i.isIntersecting ? this.enter() : this.leave();
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
function La(e) {
  const t = new qr(e);
  return t.start(), t;
}
class Yr {
  element;
  spacer;
  saved;
  axis;
  spacing;
  constructor(t, i = {}) {
    this.element = t, this.axis = i.axis ?? "y", this.spacing = i.spacing ?? !0;
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
  apply(t, i) {
    const n = Math.max(0, i);
    this.element.style.position = "sticky", this.axis === "x" ? (this.spacer.style.width = `${this.element.offsetWidth + n}px`, this.spacer.style.marginRight = this.spacing ? "" : `-${n}px`, this.element.style.left = `${t}px`) : (this.spacer.style.height = `${this.element.offsetHeight + n}px`, this.spacer.style.marginBottom = this.spacing ? "" : `-${n}px`, this.element.style.top = `${t}px`);
  }
  /** Remove the spacer and restore the element's own styles. */
  destroy() {
    this.element.style.position = this.saved.position, this.element.style.top = this.saved.top, this.element.style.left = this.saved.left, this.spacer.parentNode && this.spacer.replaceWith(this.element);
  }
}
const Xr = 0.15;
function Wr(e) {
  return typeof e == "object" && !Array.isArray(e) ? e : { snapTo: e };
}
function Vr(e, t, i) {
  const n = _t(e + t * Xr);
  if (typeof i == "function") return _t(i(n));
  if (typeof i == "number")
    return i <= 0 ? e : _t(Math.round(n / i) * i);
  if (i.length === 0) return e;
  let s = i[0];
  for (const r of i)
    Math.abs(r - n) < Math.abs(s - n) && (s = r);
  return _t(s);
}
function Ur(e, t, i) {
  const n = e.duration ?? { min: 0.2, max: 0.8 };
  if (typeof n == "number") return n;
  const s = Math.min(1, Math.abs(t) / Math.max(1, i));
  return n.min + (n.max - n.min) * s;
}
class jr {
  rafId = null;
  cancelEvents = ["wheel", "touchstart", "pointerdown", "keydown"];
  onInterrupt = () => this.cancel();
  write;
  eventTarget;
  constructor(t, i) {
    this.write = t, this.eventTarget = i;
  }
  get active() {
    return this.rafId !== null;
  }
  animate(t, i, n, s = jt, r) {
    if (this.cancel(), typeof requestAnimationFrame > "u" || n <= 0) {
      this.write(i), r?.();
      return;
    }
    for (const l of this.cancelEvents) this.eventTarget?.addEventListener(l, this.onInterrupt, { passive: !0 });
    let o = null;
    const a = (l) => {
      o ??= l;
      const c = Math.min(1, (l - o) / (n * 1e3));
      this.write(t + (i - t) * s(c)), c < 1 ? this.rafId = requestAnimationFrame(a) : (this.rafId = null, this.detach(), r?.());
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
function _t(e) {
  return Math.max(0, Math.min(1, e));
}
class Hr {
  options;
  scroller;
  nodes = [];
  scrollerStart;
  scrollerEnd;
  start;
  end;
  constructor(t, i, n) {
    this.options = n === !0 ? {} : n, this.scroller = i;
    const { startColor: s = "#3ecf7a", endColor: r = "#ff5a5a", id: o } = this.options, a = o ? `${o} ` : "", l = (c, u, f) => {
      const h = t.createElement("div");
      return h.textContent = `${a}${c}`, h.setAttribute("aria-hidden", "true"), h.className = "scroll-marker", Object.assign(h.style, {
        position: f ? "fixed" : "absolute",
        right: `${this.options.indent ?? 0}px`,
        zIndex: "2147483646",
        pointerEvents: "none",
        borderTop: `1px solid ${u}`,
        color: u,
        font: `${this.options.fontSize ?? "11px"} ui-monospace, monospace`,
        padding: "2px 6px",
        whiteSpace: "nowrap",
        background: "rgba(0, 0, 0, 0.35)"
      }), (i ?? t.body).appendChild(h), this.nodes.push(h), h;
    };
    this.scrollerStart = l("scroller-start", s, !i), this.scrollerEnd = l("scroller-end", r, !i), this.start = l("start", s, !1), this.end = l("end", r, !1), i && getComputedStyle(i).position === "static" && (i.style.position = "relative");
  }
  /** Place the markers for the latest measurement. */
  place(t, i) {
    this.start.style.top = `${t.startPage}px`, this.end.style.top = `${t.endPage}px`;
    const n = this.scroller ? i : 0;
    this.scrollerStart.style.top = `${n + t.startViewport}px`, this.scrollerEnd.style.top = `${n + t.endViewport}px`;
  }
  /** Keep the viewport lines in place inside a scrolling element. */
  follow(t, i) {
    this.scroller && this.place(t, i);
  }
  destroy() {
    for (const t of this.nodes.splice(0)) t.remove();
  }
}
const zr = 120, st = [], ct = /* @__PURE__ */ new Set();
let oe = !1;
const Gr = () => {
  oe || ct.size === 0 || (oe = !0, queueMicrotask(() => {
    oe = !1;
    for (const e of ct) e.afterRefresh();
  }));
}, Ji = () => {
  for (const e of ct) e.beforeRefresh();
  for (const e of st) e.refresh();
  for (const e of ct) e.afterRefresh();
};
let rt = { width: 0, height: 0 };
const ri = () => {
  const e = window.innerWidth, t = window.innerHeight, i = e === rt.width && t !== rt.height, n = Math.abs(t - rt.height) < rt.height * 0.25, s = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  i && n && s || (rt = { width: e, height: t }, Ji());
};
class Ht {
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
    this.timeline = t.timeline, this.options = t, this.snapper = new jr((i) => this.scrollTo(i), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const t = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    t && !this.options.container && (this.pin = new Yr(t, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new Hr(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), st.length === 0 && typeof window < "u" && (rt = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", ri, { passive: !0 })), st.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), st.splice(st.indexOf(this), 1), st.length === 0 && typeof window < "u" && window.removeEventListener("resize", ri), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    Ji();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(t) {
    return ct.add(t), () => ct.delete(t);
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
    const i = this.triggerRect();
    if (i && this.options.container)
      this.measureInContainer(this.options.container);
    else if (i) {
      const n = this.viewportHeight();
      if (this.startPx = t + Tt(i, n, gt(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(i, n, t), this.pin) {
        const s = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(s.top - (this.startPx - t), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(n) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, t), this.lastScroll = null, this.updateFrom(t, !this.measured), this.measured = !0, Gr();
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
  updateFrom(t, i) {
    this.trackVelocity(t), this.markers && this.markerGeometry && this.markers.follow(this.markerGeometry, t);
    const n = this.endPx - this.startPx, s = this.zone;
    this.targetProgress = n > 0 ? Qi((t - this.startPx) / n) : t >= this.startPx ? 1 : 0, this.zone = n > 0 ? t <= this.startPx ? "before" : t >= this.endPx ? "after" : "active" : t >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(s, this.zone), i || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const t = this.options.scrub;
    return typeof t == "number" ? Math.max(0, t) : 0;
  }
  resolveEnd(t, i, n) {
    const s = gt(this.options.end) ?? "bottom top", r = typeof s == "string" ? s.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (r) {
      const o = Number.parseFloat(r[1]);
      return this.startPx + (r[2] === "%" ? i * o / 100 : o);
    }
    return n + Tt(t, i, s);
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
    const i = typeof performance < "u" ? performance.now() : Date.now();
    this.lastScroll !== null && i > this.lastScrollTime && t !== this.lastScroll && (this.velocityPxPerSecond = (t - this.lastScroll) / (i - this.lastScrollTime) * 1e3), (this.lastScroll === null || t !== this.lastScroll) && (this.lastScroll = t, this.lastScrollTime = i), !(this.velocityPxPerSecond === 0 || typeof setTimeout > "u") && (this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = setTimeout(() => {
      this.idleTimer = null, this.releaseVelocity = this.velocityPxPerSecond, this.velocityPxPerSecond = 0, this.emitUpdate(), this.scheduleSnap();
    }, zr));
  }
  /**
   * Emit enter/leave callbacks as the scroll position moves between zones. A jump
   * straight across the range (a fast flick, or loading the page scrolled past
   * it) fires both edges in order.
   */
  fireBoundaryCallbacks(t, i) {
    if (t === i) return;
    const { onEnter: n, onLeave: s, onEnterBack: r, onLeaveBack: o } = this.options;
    t === "before" ? (n?.(), i === "after" && s?.()) : t === "after" ? (r?.(), i === "before" && o?.()) : i === "after" ? s?.() : o?.();
  }
  /** Scrolling has stopped: settle on the nearest snap point, if there is one. */
  scheduleSnap() {
    const t = this.options.snap;
    if (t === void 0 || this.snapper.active) return;
    const i = Wr(t), n = () => {
      this.snapTimer = null;
      const s = this.endPx - this.startPx, r = this.scrollPosition();
      if (!this.running || s <= 0 || r <= this.startPx || r >= this.endPx) return;
      const o = (r - this.startPx) / s, a = this.startPx + Vr(o, this.releaseVelocity / s, i.snapTo) * s;
      Math.abs(a - r) < 1 || this.snapper.animate(r, a, Ur(i, a - r, this.viewportHeight()), i.ease);
    };
    i.delay ? this.snapTimer = setTimeout(n, i.delay * 1e3) : n();
  }
  scrollTo(t) {
    const i = this.options.scroller, n = this.options.horizontal ? { left: t } : { top: t };
    i ? typeof i.scrollTo == "function" ? i.scrollTo({ ...n, behavior: "instant" }) : this.options.horizontal ? i.scrollLeft = t : i.scrollTop = t : typeof window < "u" && window.scrollTo({ ...n, behavior: "instant" });
  }
  /**
   * Resolve start and end for a trigger inside a horizontally moving container:
   * find the container progress where each horizontal position fires, and turn
   * it into the container's scroll offsets.
   */
  measureInContainer(t) {
    const i = this.options.trigger;
    if (typeof i?.getBoundingClientRect != "function") return;
    const n = i.getBoundingClientRect(), s = this.options.scroller?.getBoundingClientRect?.().left ?? 0, r = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, o = n.left - s - t.shiftAt(t.progress()), { start: a, end: l } = t.range(), c = (d) => a + d * (l - a), u = si(o, n.width, r, gt(this.options.start) ?? "left right", t.shiftAt);
    this.startPx = c(u);
    const f = gt(this.options.end) ?? "right left", h = typeof f == "string" ? f.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = h ? this.startPx + Number.parseFloat(h[1]) : c(si(o, n.width, r, f, t.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(t) {
    const i = (r, o) => {
      const a = gt(r) ?? o;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const l = Zi(a);
      return t * l.viewportFraction - l.offsetPx;
    }, n = i(this.options.start, "top bottom") ?? 0, s = i(this.options.end, "bottom top") ?? n;
    return {
      startViewport: n,
      endViewport: s,
      startPage: this.startPx + n,
      endPage: this.endPx + s
    };
  }
  startSmoothing() {
    if (this.rafId !== null || typeof requestAnimationFrame > "u") return;
    const t = (i) => {
      if (this.rafId = null, !this.running) return;
      const n = this.lastFrameTime === null ? 16.67 : i - this.lastFrameTime;
      this.lastFrameTime = i, this.displayProgress = Nr(this.displayProgress, this.targetProgress, this.smoothing(), n);
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
    const t = this.options.scroller, i = this.options.horizontal;
    return t ? (i ? t.scrollLeft : t.scrollTop) ?? 0 : typeof window < "u" ? (i ? window.scrollX : window.scrollY) ?? 0 : 0;
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
    const i = this.options.horizontal, n = i ? t.left ?? 0 : t.top, s = i ? t.right ?? 0 : t.bottom, r = i ? t.width ?? 0 : t.height, o = this.options.scroller;
    if (o && typeof o.getBoundingClientRect == "function") {
      const a = o.getBoundingClientRect(), l = i ? a.left : a.top;
      return { top: n - l, bottom: s - l, height: r };
    }
    return { top: n, bottom: s, height: r };
  }
  /** The viewport's size along the scroll axis. */
  viewportHeight() {
    const t = this.options.scroller, i = this.options.horizontal;
    return t ? i ? t.clientWidth : t.clientHeight : typeof window < "u" ? i ? window.innerWidth : window.innerHeight : 0;
  }
}
function gt(e) {
  return typeof e == "function" ? e() : e;
}
function $a(e) {
  const t = new Ht(e);
  return t.start(), t;
}
const ae = /* @__PURE__ */ new Set(), Kr = 16, oi = 0.5, Zr = 2;
class ai {
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
      request: (i) => requestAnimationFrame(i),
      cancel: (i) => cancelAnimationFrame(i)
    };
  }
  start() {
    if (this.running || typeof window > "u") return this;
    this.running = !0, this.reduced = this.options.reducedMotion ?? (typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches), this.current = this.target = this.position();
    const t = this.options.scroller ?? window;
    return t.addEventListener("wheel", this.onWheel, { passive: !1 }), t.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), ae.add(this), this.stopListening = Ht.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const t of ae) t.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const t = this.options.scroller ?? window;
    return t.removeEventListener("wheel", this.onWheel), t.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), ae.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const t of this.effects) le(t.element, t.saved);
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
  scrollTo(t, i = {}) {
    if (!this.running) return;
    const n = this.clamp(this.resolve(t) + (i.offset ?? 0)), s = Math.abs(n - this.current), r = this.reduced ? 0 : i.duration ?? Math.min(1.2, Math.max(0.4, s / 2500));
    if (r <= 0) {
      this.journey = null, this.current = this.target = n, this.write(n), this.applyEffects(0);
      return;
    }
    this.target = n, this.journey = { from: this.current, to: n, ms: r * 1e3, ease: i.ease ?? jt, elapsed: 0 }, this.requestFrame();
  }
  /** Re-measure the scrollable length and every effect element (resizes do this). */
  refresh() {
    if (!this.running) return;
    this.rest(), this.effects = [];
    const t = this.options.effects === !0 ? "[data-speed], [data-lag]" : this.options.effects || "";
    if (t && !this.reduced) {
      const i = this.options.scroller ?? document, n = this.position(), s = this.viewportHeight(), r = this.options.scroller?.getBoundingClientRect().top ?? 0;
      for (const o of i.querySelectorAll(t)) {
        const a = Number.parseFloat(o.dataset.speed ?? ""), l = Number.parseFloat(o.dataset.lag ?? ""), c = o.getBoundingClientRect(), u = c.top - r + n;
        this.effects.push({
          element: o,
          speed: Number.isFinite(a) ? a : void 0,
          lag: Number.isFinite(l) && l > 0 ? l : void 0,
          centre: u + c.height / 2 - s / 2,
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
    for (const t of this.effects) le(t.element, t.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(t) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || t.ctrlKey || Math.abs(t.deltaX) > Math.abs(t.deltaY) || this.nestedScrollerTakes(t)) return;
    const i = t.deltaMode === 1 ? Kr : t.deltaMode === 2 ? this.viewportHeight() : 1, n = t.deltaY * i * (this.options.wheelMultiplier ?? 1), s = this.clamp(this.target + n);
    s === this.target && s === this.current || (t.preventDefault(), this.journey = null, this.target = s, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const t = this.position();
    this.written !== null && Math.abs(t - this.written) <= Zr || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = t, this.requestFrame());
  }
  nestedScrollerTakes(t) {
    const i = this.options.scroller ?? document.documentElement;
    for (let n = t.target; n && n !== i && n !== document.body; n = n.parentElement) {
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
    const i = this.lastTime === null ? 1e3 / 60 : Math.min(100, t - this.lastTime);
    this.lastTime = t;
    const n = this.current;
    if (this.journey) {
      const r = this.journey;
      r.elapsed += i;
      const o = Math.min(1, r.elapsed / r.ms);
      this.current = r.from + (r.to - r.from) * r.ease(o), o >= 1 && (this.journey = null);
    } else if (this.current !== this.target) {
      const r = (this.options.smooth ?? 0.8) * 1e3 / 3;
      this.current += (this.target - this.current) * (1 - Math.exp(-i / r)), Math.abs(this.target - this.current) < oi && (this.current = this.target);
    }
    this.current !== n && this.write(this.current), this.velocityPxPerSecond = i > 0 ? (this.current - n) * 1e3 / i : 0;
    const s = this.applyEffects(i);
    this.current !== n && this.options.onUpdate?.(this.state), this.journey || this.current !== this.target || s ? this.requestFrame() : (this.lastTime = null, this.velocityPxPerSecond = 0);
  }
  /** Position every effect for the current scroll; true while a lag is still catching up. */
  applyEffects(t) {
    let i = !1;
    const n = this.current;
    for (const s of this.effects) {
      let r = 0;
      if (s.speed !== void 0 && (r += (n - s.centre) * (1 - s.speed)), s.lag !== void 0) {
        const o = s.lag * 1e3 / 3;
        s.lagged = t === 0 ? n : s.lagged + (n - s.lagged) * (1 - Math.exp(-t / o)), Math.abs(n - s.lagged) < oi ? s.lagged = n : i = !0, r += n - s.lagged;
      }
      le(s.element, r === 0 ? s.saved : `0 ${Qr(r)}px`), s.shift = r;
    }
    return i;
  }
  // --- geometry -------------------------------------------------------------
  write(t) {
    const i = Math.round(t);
    this.written = i;
    const n = this.options.scroller;
    n ? n.scrollTop = i : window.scrollTo({ top: i, behavior: "instant" });
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
    const i = this.options.scroller ?? document, n = typeof t == "string" ? i.querySelector(t) : t;
    if (!n) return this.current;
    const s = this.options.scroller?.getBoundingClientRect().top ?? 0, r = this.effects.find((o) => o.element === n)?.shift ?? 0;
    return n.getBoundingClientRect().top - s + this.position() - r;
  }
}
function le(e, t) {
  t ? e.style.setProperty("translate", t) : e.style.removeProperty("translate");
}
function Qr(e) {
  return Math.round(e * 100) / 100;
}
function Jr(e, t) {
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
function Ee(e, t, i, n, s = () => {
}) {
  const r = (d) => typeof d == "string" ? e.query(d) ?? void 0 : d, o = r(t.trigger) ?? n;
  if (!o) {
    s(`gsap-compat: scrollTrigger has no trigger element${typeof t.trigger == "string" ? ` for "${t.trigger}"` : ""}`);
    return;
  }
  const a = t.scrub === void 0 || t.scrub === !1 ? !1 : t.scrub, l = (t.toggleActions ?? "play none none none").trim().split(/\s+/);
  let c = 0, u;
  const f = (d, g) => () => {
    g?.(), i && !a && Jr(i, l[d] ?? "none"), t.once && d === 0 && queueMicrotask(() => u.destroy());
  }, h = t.containerAnimation ? io(e, t.containerAnimation, o, s) : void 0;
  return u = new Ht({
    trigger: o,
    start: t.start,
    end: t.end,
    scrub: a === !1 ? void 0 : a,
    pin: t.pin === !0 ? !0 : r(t.pin),
    scroller: r(t.scroller),
    horizontal: t.horizontal,
    pinSpacing: t.pinSpacing,
    onRefresh: t.invalidateOnRefresh && i?.invalidate ? () => i.invalidate() : void 0,
    snap: t.snap === void 0 ? void 0 : to(t.snap, i),
    markers: t.markers,
    container: h,
    onUpdate: (d, g) => {
      if (i && a !== !1 && i.progress(d), t.onUpdate) {
        const p = d < c || g < 0 ? -1 : 1;
        t.onUpdate({ progress: d, velocity: g, direction: p });
      }
      c = d;
    },
    onEnter: f(0, t.onEnter),
    onLeave: f(1, t.onLeave),
    onEnterBack: f(2, t.onEnterBack),
    onLeaveBack: f(3, t.onLeaveBack)
  }), i && a === !1 && i.progress(0), u.start(), e.own(u);
}
function to(e, t) {
  const i = (s) => s === "labels" ? (r) => eo(r, t?.labelProgresses?.() ?? []) : s;
  if (typeof e != "object" || Array.isArray(e)) return i(e);
  const n = e.ease ? Ot(e.ease) : void 0;
  return {
    snapTo: i(e.snapTo),
    duration: e.duration,
    delay: e.delay,
    ease: n ? n.fn ?? z(n.easing) : void 0
  };
}
function eo(e, t) {
  return t.reduce((i, n) => Math.abs(n - e) < Math.abs(i - e) ? n : i, t[0] ?? e);
}
function io(e, t, i, n) {
  const s = () => t.timeline.getTracks({ property: "x" }).map((r) => r.target).filter((r) => {
    const o = e.elementFor(r);
    return !!o && o !== i && o.contains(i);
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
      for (const l of s()) {
        const c = o.values.get(l)?.get("x");
        typeof c == "number" && (a += c);
      }
      return a;
    }
  };
}
class tn {
  /** For contexts made by matchMedia: which named queries match */
  conditions = {};
  scope;
  host;
  items = [];
  snapshots = /* @__PURE__ */ new Map();
  constructor(t, i) {
    this.host = t, this.scope = i;
  }
  /**
   * Run `fn` with this context collecting, and return what it returns. A function
   * it returns is kept as cleanup and called on `revert()`.
   */
  add(t) {
    const i = this.host.collector;
    this.host.setCollector(this);
    try {
      const n = t();
      return typeof n == "function" && this.items.push({ revert: n }), n;
    } finally {
      this.host.setCollector(i);
    }
  }
  track(t) {
    this.items.push(t);
  }
  touch(t, i) {
    this.snapshots.has(t) || this.snapshots.set(t, { name: i, style: t.getAttribute("style"), d: t.getAttribute("d") });
  }
  /** Undo everything, newest first, and restore the elements this context animated. */
  revert() {
    for (const t of this.items.splice(0).reverse())
      t.revert ? t.revert() : t.kill ? t.kill() : t.destroy?.();
    for (const [t, { name: i, style: n, d: s }] of this.snapshots)
      n === null ? t.removeAttribute("style") : t.setAttribute("style", n), s !== null && t.setAttribute("d", s), this.host.forget(i);
    this.snapshots.clear();
  }
  /** Same as `revert()`: GSAP's name for dropping a context. */
  kill() {
    this.revert();
  }
}
class no {
  host;
  scope;
  entries = [];
  listeners = [];
  scheduled = !1;
  constructor(t, i) {
    this.host = t, this.scope = i;
  }
  add(t, i) {
    const n = { conditions: t, setup: i, queries: /* @__PURE__ */ new Map() }, s = typeof t == "string" ? { matches: t } : t;
    if (typeof window < "u" && typeof window.matchMedia == "function")
      for (const [r, o] of Object.entries(s)) {
        const a = window.matchMedia(o);
        n.queries.set(r, a);
        const l = () => this.scheduleUpdate();
        a.addEventListener("change", l), this.listeners.push(() => a.removeEventListener("change", l));
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
    const i = {};
    for (const [o, a] of t.queries) i[o] = a.matches;
    const n = Object.values(i).some(Boolean), s = n ? JSON.stringify(i) : void 0;
    if (s === t.key || (t.context?.revert(), t.context = void 0, t.key = s, !n)) return;
    const r = new tn(this.host, this.scope);
    r.conditions = i, r.add(() => t.setup(r)), t.context = r;
  }
}
class so {
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
  constructor(t, i) {
    this.canvas = t, this.context = t.getContext("2d"), this.options = i, this.frames = Math.max(1, Math.floor(i.frames)), this.images = new Array(this.frames), this.ready = new Array(this.frames).fill(!1), typeof window < "u" && window.addEventListener("resize", this.onResize, { passive: !0 }), this.resize(), this.pump();
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
    const t = typeof window < "u" ? Math.min(window.devicePixelRatio || 1, 2) : 1, i = Math.round(this.canvas.clientWidth * t), n = Math.round(this.canvas.clientHeight * t);
    i > 0 && n > 0 && (this.canvas.width !== i || this.canvas.height !== n) && (this.canvas.width = i, this.canvas.height = n), this.drawn = -1, this.draw();
  }
  draw() {
    const t = Math.round(this.current), i = this.nearestReady(t);
    if (i === -1 || i === this.drawn || !this.context) return;
    const n = this.images[i], { width: s, height: r } = this.canvas, o = (this.options.fit ?? "cover") === "cover" ? Math.max(s / n.naturalWidth, r / n.naturalHeight) : Math.min(s / n.naturalWidth, r / n.naturalHeight), a = n.naturalWidth * o, l = n.naturalHeight * o;
    this.context.clearRect(0, 0, s, r), this.context.drawImage(n, (s - a) / 2, (r - l) / 2, a, l), this.drawn = i, this.pump();
  }
  /** The loaded frame closest to `index`, or -1. */
  nearestReady(t) {
    for (let i = 0; i < this.frames; i++) {
      if (t - i >= 0 && this.ready[t - i]) return t - i;
      if (t + i < this.frames && this.ready[t + i]) return t + i;
    }
    return -1;
  }
  /** Start loads, nearest to the current frame first, up to the concurrency. */
  pump() {
    const t = this.options.concurrency ?? 6, i = Math.round(this.current);
    for (let n = 0; n < this.frames && this.inFlight < t; n++)
      for (const s of n === 0 ? [i] : [i + n, i - n])
        s < 0 || s >= this.frames || this.images[s] || this.inFlight >= t || this.load(s);
  }
  load(t) {
    const i = new Image();
    i.decoding = "async", this.images[t] = i, this.inFlight++;
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
    i.onload = () => n(!0), i.onerror = () => n(!1), i.src = this.options.url(t);
  }
}
const ro = { opacity: 0, y: -16 }, oo = { opacity: 0, y: 16 };
async function ao(e, t, i, n) {
  const s = t.collector?.scope ?? t.root, r = s.ownerDocument ?? s, o = () => n.shared ? [...s.querySelectorAll(n.shared)] : [];
  if (n.native && typeof r.startViewTransition == "function")
    return lo(r, n, o);
  const a = n.duration ?? 0.35, l = n.ease ?? "power2.inOut", c = (m) => new Promise((y) => {
    m(y) || y();
  }), u = o(), f = u.length ? ye(t, u) : void 0, h = n.from !== void 0 ? li(t, n.from, n.shared) : [];
  if (h.length && n.leave !== !1) {
    const m = n.leave ?? ro;
    await c((y) => e.to(h, { ...m, duration: a, ease: l, onComplete: y }));
  }
  await n.update();
  const d = [], g = typeof n.to == "function" ? n.to() : n.to, p = g !== void 0 ? li(t, g, n.shared) : [];
  if (p.length && n.enter !== !1) {
    const m = n.enter ?? oo;
    d.push(c((y) => e.fromTo(p, m, { ...Ki(m), duration: a, ease: l, onComplete: y })));
  }
  if (f) {
    const m = o().filter((y) => !u.includes(y));
    m.length && d.push(
      c(
        (y) => be(t, i, f, {
          targets: m,
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
function li(e, t, i) {
  const n = e.resolveTargets(t).map((s) => e.elementFor(s)).filter((s) => !!s);
  return i ? n.flatMap((s) => !s.querySelector(i) && !s.matches(i) ? [s] : [...s.children].filter((r) => !r.matches(i) && !r.querySelector(i))) : n;
}
async function lo(e, t, i) {
  const n = (a, l) => {
    const c = a.dataset?.flipId;
    c && a.style.setProperty("view-transition-name", l ? `tf-${c.replace(/[^\w-]/g, "-")}` : "");
  }, s = i();
  s.forEach((a) => n(a, !0));
  let r = [];
  await e.startViewTransition(async () => {
    s.forEach((a) => n(a, !1)), await t.update(), r = i(), r.forEach((a) => n(a, !0));
  }).finished, r.forEach((a) => n(a, !1));
}
const co = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (e, t) => Se(e, As(t))
}, ho = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (e, t) => Se(e, { fn: Es(t) })
}, uo = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (e, t) => Se(e, { fn: Ps(t) })
}, fo = /* @__PURE__ */ new Set([
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
]), ci = 0.5, po = "power1.inOut";
function mo(e) {
  return e.keyframes !== void 0 && e.keyframes !== null;
}
function go(e) {
  const t = e.keyframes, i = {};
  for (const [c, u] of Object.entries(e)) fo.has(c) || (i[c] = u);
  if (Array.isArray(t))
    return t.map((c) => ({
      ...i,
      ...c,
      duration: c.duration ?? e.duration ?? ci
    }));
  const n = Object.entries(t), s = e.duration ?? ci, r = t.easeEach ?? e.easeEach ?? po;
  if (n.length > 0 && n.every(([c]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(c) || c === "easeEach")) {
    const c = n.filter(([h]) => h !== "easeEach").map(([h, d]) => ({ at: Number.parseFloat(h) / 100, step: d })).sort((h, d) => h.at - d.at), u = [];
    let f = 0;
    for (const { at: h, step: d } of c) {
      const g = Math.max(0, h - f);
      u.push({ ...i, ease: r, ...d, duration: g * s }), f = h;
    }
    return u;
  }
  const o = n.filter(([c, u]) => c !== "easeEach" && Array.isArray(u)), a = Math.max(0, ...o.map(([, c]) => c.length)), l = [];
  for (let c = 0; c < a; c++) {
    const u = { ...i, ease: r, duration: s / a };
    for (const [f, h] of o)
      c < h.length && (u[f] = h[c]);
    l.push(u);
  }
  return l;
}
function hi(e, t, i, n = {}) {
  const s = t.collector?.scope ?? t.root, r = typeof n.scroller == "string" ? s.querySelector(n.scroller) : n.scroller ?? null, o = {
    x: r ? r.scrollLeft : window.scrollX,
    y: r ? r.scrollTop : window.scrollY
  }, a = {
    x: r ? r.scrollWidth - r.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: r ? r.scrollHeight - r.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, l = (w, b) => {
    if (b === void 0) return o[w];
    if (typeof b == "number") return b;
    if (b === "max") return a[w];
    const k = typeof b == "string" ? s.querySelector(b) : b;
    if (!k) return o[w];
    const v = k.getBoundingClientRect(), T = r?.getBoundingClientRect(), x = (w === "x" ? n.offsetX : n.offsetY) ?? n.offset ?? 0;
    return w === "x" ? v.left - (T?.left ?? 0) + o.x - x : v.top - (T?.top ?? 0) + o.y - x;
  }, c = typeof i == "object" && i !== null && !("nodeType" in i) ? { x: l("x", i.x), y: l("y", i.y) } : { x: o.x, y: l("y", i) }, u = { x: Math.max(0, Math.min(a.x, c.x)), y: Math.max(0, Math.min(a.y, c.y)) }, f = { ...o }, h = () => {
    r ? (r.scrollLeft = f.x, r.scrollTop = f.y) : window.scrollTo({ left: f.x, top: f.y, behavior: "instant" });
  }, d = ["wheel", "touchstart", "keydown"], g = r ?? window, p = () => {
    y.kill(), m();
  }, m = () => {
    for (const w of d) g.removeEventListener(w, p);
  }, y = e.to(f, {
    x: u.x,
    y: u.y,
    duration: n.duration ?? 1,
    ease: n.ease ?? "power2.inOut",
    onStart: n.onStart,
    onUpdate: () => {
      h(), n.onUpdate?.();
    },
    onComplete: () => {
      m(), n.onComplete?.();
    }
  });
  if (n.autoKill !== !1) for (const w of d) g.addEventListener(w, p, { passive: !0 });
  return y;
}
function yo(e, t, i) {
  const n = e.collector?.scope ?? e.root, s = typeof t == "string" ? [...n.querySelectorAll(t)] : "nodeType" in t ? [t] : Array.from(t), { interval: r = 0.1, batchMax: o, onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: u, ...f } = i, h = { onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: u }, d = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, g = {}, p = (y) => {
    g[y] !== void 0 && clearTimeout(g[y]), g[y] = void 0;
    const w = d[y].splice(0);
    w.length > 0 && h[y]?.(w);
  }, m = (y, w) => {
    if (h[y]) {
      if (d[y].push(w), o !== void 0 && d[y].length >= o) return p(y);
      g[y] === void 0 && (g[y] = setTimeout(() => p(y), r * 1e3));
    }
  };
  return s.map(
    (y) => Ee(e, {
      ...f,
      trigger: y,
      onEnter: () => m("onEnter", y),
      onLeave: () => m("onLeave", y),
      onEnterBack: () => m("onEnterBack", y),
      onLeaveBack: () => m("onLeaveBack", y)
    })
  ).filter((y) => y !== void 0);
}
class H {
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
  constructor(t, i = {}) {
    this.stage = t;
    const n = { ...i, onWarning: i.onWarning ?? t.onWarning };
    if (this.options = n, this.compat = new ot({
      ...n,
      startValue: (s, r) => {
        const o = t.objectFor(s);
        if (o) return To(o[r]);
        const a = t.appliedValue(s, r);
        if (a !== void 0) return a;
        if (r === "d") return Hi(t.elementFor(s)) ?? void 0;
        if (r === "text") return t.elementFor(s)?.textContent ?? void 0;
        if (r === "strokeDasharray" || r === "strokeDashoffset") {
          const l = di(t.elementFor(s));
          if (l !== void 0) return r === "strokeDasharray" ? [l, l] : 0;
        }
      },
      startVelocity: (s, r) => t.velocityOf(s, r),
      layoutColumns: (s) => fi(s.map((r) => t.elementFor(r))),
      random: () => t.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, t.collector?.track(this), t.liveTimelines.add(this), this.autoplayPending = !n.paused && !n.scrollTrigger, n.scrollTrigger) {
      const s = n.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = Ee(t, s, this, this.firstElement, (r) => n.onWarning?.(r)));
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
  to(t, i, n) {
    return mo(i) ? this.record(() => this.keyframed(t, i, n)) : this.record(() => this.tween(t, [i], n, ([s], r, o) => this.compat.to(r, s, o)));
  }
  from(t, i, n) {
    return this.record(() => this.tween(t, [i], n, ([s], r, o) => this.compat.from(r, s, o)));
  }
  fromTo(t, i, n, s) {
    return this.record(
      () => this.tween(t, [i, n], s, ([r, o], a, l) => this.compat.fromTo(a, r, o, l))
    );
  }
  set(t, i, n) {
    return this.record(() => this.tween(t, [i], n, ([s], r, o) => this.compat.set(r, s, o)));
  }
  addLabel(t, i) {
    return this.record(() => this.compat.addLabel(t, i));
  }
  /** Merge another timeline in at a position (flattened, as in `tf`). */
  add(t, i) {
    return this.record(() => {
      t.autoplayPending = !1, t.timeline.stop(), t.stage.deactivate(t.timeline), this.compat.add(t.compat, i);
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
    for (const i of this.recipe) i();
    return this.syncDuration(), this.compat.progress(t), this.stage.render(this.timeline), this;
  }
  /**
   * Run `callback` when the playhead crosses `position` (default: the end so far),
   * in either direction (GSAP's `call`). It takes no time, but a call after the
   * last tween makes the timeline that long.
   */
  call(t, i = [], n) {
    return this.record(() => {
      const s = this.compat.addEvent(n);
      this.events.push({ time: s, run: () => t(...i) });
    });
  }
  /** Pause exactly at `position` when the playhead reaches it, then run `callback`. `play()` continues. */
  addPause(t, i, n = []) {
    return this.record(() => {
      const s = this.compat.addEvent(t);
      this.events.push({ time: s, pause: !0, run: () => i?.(...n) });
    });
  }
  /**
   * Pause, and animate the playhead from where it is to `position` (seconds or a
   * label), firing callbacks on the way. Returns the tween that moves it.
   */
  tweenTo(t, i = {}) {
    return this.tweenFromTo(this.timeline.currentTime / 1e3, t, i);
  }
  /** Jump to `from`, then animate the playhead to `to` (seconds or labels). */
  tweenFromTo(t, i, n = {}) {
    this.pause(), this.seek(t);
    const s = this.timeline.currentTime, r = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(i))), o = { time: s }, a = n.duration ?? Math.abs(r - s) / 1e3 / (this.timeScale() || 1), l = new H(this.stage, { onStart: n.onStart, onComplete: n.onComplete });
    return l.to(o, {
      time: r,
      duration: a,
      ease: n.ease ?? "none",
      onUpdate: () => {
        this.moveTo(o.time), n.onUpdate?.();
      }
    }), l;
  }
  // --- playback -----------------------------------------------------------
  play() {
    this.autoplayPending = !1, this.started || (this.started = !0, this.options.onStart?.());
    const t = this.timeline.playbackState === "playing", i = this.timeline.playbackState === "paused";
    if (this.timeline.play(), !t) {
      const n = this.timeline, s = n.direction === "forward" ? n.currentTime === 0 : n.currentTime === n.duration;
      this.playhead = { ...this.readPlayhead(), fresh: s && !i }, this.waitingToWrap = !1;
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
    return t > 0 ? this.compat.labelTimes().map((i) => i / t) : [];
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
  killTweensOf(t, i) {
    for (const n of t)
      for (const s of i ?? [void 0])
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
    const t = Math.max(...this.events.map((i) => i.time));
    t > this.timeline.duration && this.timeline.setDuration(t);
  }
  readPlayhead() {
    const t = this.timeline;
    return { time: t.currentTime, iteration: t.loopIteration, direction: t.direction };
  }
  /** Set the playhead to a time (ms) within the current loop, firing what it crosses. */
  moveTo(t) {
    const i = this.playhead;
    this.timeline.seek(t), this.stage.render(this.timeline);
    const n = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: t >= i.time ? "forward" : "reverse" }, s = { ...i, iteration: n.iteration, direction: n.direction };
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
    for (const i of this.recipe) i();
    this.syncDuration(), this.timeline.seek(Math.min(t, this.timeline.duration));
  }
  /** After each frame this timeline played: callbacks crossed, repeats, completion. */
  afterFrame() {
    const t = this.timeline, i = t.repeatDelayRemaining > 0;
    if (this.waitingToWrap && i) {
      this.options.onUpdate?.();
      return;
    }
    this.waitingToWrap = !1;
    const n = this.playhead, s = this.readPlayhead();
    this.playhead = s;
    const r = this.options.yoyo === !0;
    i && !r && s.iteration > n.iteration && (this.playhead = { time: 0, iteration: s.iteration, direction: "forward", fresh: !0 }, this.waitingToWrap = !0);
    const o = this.runCrossings(n, s, i);
    if (this.options.onUpdate?.(), this.finishedThisFrame && !o) {
      this.finishedThisFrame = !1;
      const a = t.currentTime === 0 && t.direction === "reverse";
      !this.scrollDriver && !r && this.stage.liveTimelines.delete(this), a && this.backwards ? this.options.onReverseComplete?.() : this.options.onComplete?.();
    }
    this.finishedThisFrame = !1;
  }
  /** Fire events and repeats between two playheads. Returns true if a pause stopped it. */
  runCrossings(t, i, n) {
    if (this.events.length === 0 && this.ranges.length === 0 && !this.options.onRepeat && !this.options.repeatRefresh) return !1;
    const s = this.events, { crossings: r, passes: o } = Li(
      s.map((a) => a.time),
      t,
      i,
      { duration: this.timeline.duration, alternate: this.options.yoyo === !0, holding: n }
    );
    for (const a of r) {
      if (this.killed) return !0;
      if (a.kind === "repeat") {
        this.options.repeatRefresh && this.refreshForRepeat(), this.options.onRepeat?.();
        continue;
      }
      const l = s[a.index];
      if (!(l.direction && l.direction !== a.direction)) {
        if (l.pause)
          return this.timeline.seek(l.time), this.stage.render(this.timeline), this.pause(), this.playhead = this.readPlayhead(), this.waitingToWrap = !1, l.run(), !0;
        l.run();
      }
    }
    for (const a of this.ranges)
      o.some(([c, u]) => c !== u && Math.max(c, u) >= a.start && Math.min(c, u) <= a.end) && a.run();
    return !1;
  }
  /**
   * Compile one tween call. A track has one start value and one set of values,
   * but some tweens differ per element — each element's own shape, text or stroke
   * length, each plain object's own current values, or function values called per
   * element — so those build one tween per element at the same position, with any
   * stagger turned into delays. `varsList` is `[vars]`, or `[fromVars, toVars]`.
   */
  tween(t, i, n, s) {
    const r = this.resolve(t);
    if (!r) return;
    const { onStart: o, onUpdate: a, onComplete: l } = i[i.length - 1];
    if (o || a || l) {
      let c = 1 / 0, u = -1 / 0;
      const f = (h, d, g) => {
        s(h, d, g), c = Math.min(c, this.compat.lastStart), u = Math.max(u, this.compat.lastEnd);
      };
      if (this.buildTween(r, i, n, f), c === 1 / 0) return;
      o && this.events.push({ time: c, direction: "forward", run: o }), a && this.ranges.push({ start: c, end: u, run: a }), l && this.events.push({ time: u, direction: "forward", run: l });
      return;
    }
    this.buildTween(r, i, n, s);
  }
  /**
   * A tween with `keyframes`: its segments one after another, from the tween's
   * position and delay. With `stagger`, each target plays the whole sequence,
   * offset like any stagger. Callbacks belong to the sequence as a whole.
   */
  keyframed(t, i, n) {
    const s = this.resolve(t);
    if (!s) return;
    const r = go(i);
    if (r.length === 0) return;
    const o = s.length > 1 ? me(i.stagger, this.staggerContext(s)) : void 0, a = s.map((m) => this.targetFor(m)).filter((m) => m !== void 0), l = o ? a.map((m) => [m]) : [a], c = o ? ce(s.length, o).map((m) => m / 1e3) : [0], u = this.compat.timeOf(n) / 1e3 + Nt(i.delay, 0) / 1e3;
    let f = 1 / 0, h = -1 / 0;
    if (l.forEach((m, y) => {
      r.forEach((w, b) => {
        const k = b === 0 ? u + c[y] : ">";
        this.tween(m, [w], k, ([v], T, x) => this.compat.to(T, v, x)), f = Math.min(f, this.compat.lastStart), h = Math.max(h, this.compat.lastEnd);
      });
    }), f === 1 / 0) return;
    const { onStart: d, onUpdate: g, onComplete: p } = i;
    d && this.events.push({ time: f, direction: "forward", run: d }), g && this.ranges.push({ start: f, end: h, run: g }), p && this.events.push({ time: h, direction: "forward", run: p });
  }
  staggerContext(t) {
    return {
      count: t.length,
      columnsFromLayout: () => fi(t.map((i) => this.stage.elementFor(i))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(t, i, n, s) {
    const r = t.map((h) => this.targetFor(h));
    if (!(t.length > 1 && (i.some(wo) || t.some((h) => this.stage.objectFor(h) !== void 0)))) {
      const h = this.targetFor(t[0]);
      s(i.map((d) => this.prepare(ui(d, 0, h, this.stage.utils, r), t)), t, n);
      return;
    }
    const a = i.length - 1, { stagger: l, ...c } = i[a], u = me(l, this.staggerContext(t)), f = u ? ce(t.length, u).map((h) => h / 1e3) : t.map(() => 0);
    t.forEach((h, d) => {
      const g = d === 0 ? Nt(c.delay, 0) / 1e3 + f[0] : 0, p = d === 0 ? 0 : f[d] - f[d - 1], m = d === 0 ? n : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, w = i.map((b, k) => k === a ? { ...c, delay: g } : b).map((b) => this.prepare(ui(b, d, this.targetFor(h), this.stage.utils, r), [h]));
      s(w, [h], m);
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
  prepare(t, i) {
    const n = (o) => this.options.onWarning?.(o), s = (o) => this.stage.query(o);
    let r = t;
    if (t.motionPath !== void 0) {
      const o = wr(t.motionPath, {
        query: s,
        targets: i.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: n
      });
      r = { ...r, motionPath: o };
    }
    if (t.morphSVG !== void 0) {
      const o = Tr(t.morphSVG, s, n), { morphSVG: a, ...l } = r;
      r = o ? { ...r, morphSVG: o } : l;
    }
    if (t.drawSVG !== void 0) {
      const o = di(this.stage.elementFor(i[0]));
      if (o === void 0) {
        n("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...l } = r;
        r = l;
      } else
        r = Gs(r, o);
    }
    return r;
  }
  resolve(t) {
    const i = this.stage.resolveTargets(t);
    if (i.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${ko(t)}`);
      return;
    }
    return this.firstElement ??= i.map((n) => this.stage.elementFor(n)).find((n) => n !== void 0), i;
  }
}
function bo(e = new gr()) {
  const t = (r) => {
    const { config: o } = Lt(r);
    return new H(e, {
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
  }, i = (r) => {
    const { onStart: o, onUpdate: a, onComplete: l, onRepeat: c, onReverseComplete: u, repeatRefresh: f, ...h } = r;
    return h;
  }, n = (r) => (r && e.collector?.track(r), r), s = {
    stage: e,
    ticker: e.ticker,
    utils: e.utils,
    getProperty: (r, o) => {
      const [a] = e.resolveTargets(r);
      if (a === void 0) return;
      const l = e.objectFor(a);
      return l ? l[o] : e.appliedValue(a, o) ?? Wi(o);
    },
    scrollTrigger: (r) => n(Ee(e, r)),
    scrollBatch: (r, o) => yo(e, r, o).map((a) => n(a)),
    scrollTo: (r, o) => hi(s, e, r, o),
    refreshScroll: () => {
      Ht.refreshAll(), ai.refreshAll();
    },
    smoothScroll: (r = {}) => {
      const o = typeof r.scroller == "string" ? (e.collector?.scope ?? e.root).querySelector(r.scroller) : r.scroller;
      return n(new ai({ ...r, scroller: o }).start());
    },
    context: (r, o) => {
      const a = new tn(e, o);
      return r && a.add(() => r(a)), a;
    },
    matchMedia: (r) => new no(e, r),
    customEase: co.create,
    customBounce: ho.create,
    customWiggle: uo.create,
    pageTransition: (r) => ao(s, e, (o) => new H(e, o), r),
    imageSequence: (r, o) => {
      const a = typeof r == "string" ? (e.collector?.scope ?? e.root).querySelector(r) : r;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(r)}`);
      return n(new so(a, o));
    },
    quickTo: (r, o, a = {}) => {
      const l = new H(e, { paused: !0 }), [c] = e.resolveTargets(r);
      return Object.assign((f) => {
        if (!c) return;
        const h = a.spring !== void 0 ? e.velocityOf(c, o) ?? 0 : 0;
        l.compat.reset(), l.compat.to(c, {
          [o]: f,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: vo(a.spring, o, h) }
        }), l.timeline.stop(), l.timeline.play(), e.activate(l.timeline);
      }, { tween: l, kill: () => l.kill() });
    },
    timeline: (r) => new H(e, r),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (r, o) => {
      if (o.scrollTo !== void 0) {
        const { scrollTo: a, ...l } = o, c = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, u = typeof r != "string" && r !== window && r.nodeType === 1;
        return hi(s, e, a, {
          ...l,
          offsetX: c.offsetX,
          offsetY: c.offsetY,
          scroller: u ? r : void 0
        });
      }
      return t(o).to(r, i(o));
    },
    from: (r, o) => t(o).from(r, i(o)),
    fromTo: (r, o, a) => t(a).fromTo(r, o, i(a)),
    set: (r, o) => t(o).set(r, i(o)),
    delayedCall: (r, o, a) => new H(e).call(o, a, r),
    killTweensOf: (r, o) => {
      const a = e.resolveTargets(r), l = typeof o == "string" ? o.split(",").map((c) => c.trim()).filter(Boolean) : o;
      for (const c of [...e.liveTimelines]) c.killTweensOf(a, l);
    },
    convertToPath: (r) => xr(r, e.root),
    splitText: (r, o) => {
      const a = e.collector?.scope ?? e.root, l = typeof r == "string" ? Array.from(a.querySelectorAll(r)) : "nodeType" in r ? [r] : Array.from(r);
      return n(Lr(l, o));
    },
    draggable: (r, o) => n(Cr(s, e, r, o)),
    getFlipState: (r) => ye(e, r),
    flipFrom: (r, o) => be(e, (a) => new H(e, a), r, o),
    flip: (r, o, a) => {
      const l = ye(e, r);
      return o(), be(e, (c) => new H(e, c), l, { targets: r, ...a });
    }
  };
  return s;
}
const Y = /* @__PURE__ */ bo();
function vo(e, t, i) {
  return e === !0 ? { velocity: { [t]: i } } : typeof e == "string" ? { preset: e, velocity: { [t]: i } } : { ...e, velocity: { [t]: i } };
}
function wo(e) {
  return e.morphSVG !== void 0 || e.drawSVG !== void 0 || e.text !== void 0 || e.scrambleText !== void 0 || en(e);
}
function en(e) {
  return Object.entries(e).some(([t, i]) => (typeof i == "function" || Xi(i)) && !Me.has(t));
}
function ui(e, t, i, n, s) {
  if (!en(e)) return e;
  const r = {};
  for (const [o, a] of Object.entries(e))
    Me.has(o) ? r[o] = a : typeof a == "function" ? r[o] = a(t, i, s) : Xi(a) ? r[o] = n.resolveRandomString(a) : r[o] = a;
  return r;
}
function fi(e) {
  const t = e.map((n) => n?.getBoundingClientRect().top);
  if (t[0] === void 0) return e.length;
  let i = 0;
  for (const n of t) {
    if (n === void 0 || Math.abs(n - t[0]) > 1) break;
    i++;
  }
  return Math.max(1, i);
}
function di(e) {
  const t = e;
  if (typeof t?.getTotalLength == "function")
    return t.getTotalLength();
}
function To(e) {
  if (typeof e == "number" || typeof e == "string" || Array.isArray(e) && e.every((t) => typeof t == "number")) return e;
}
function ko(e) {
  return typeof e == "string" ? `"${e}"` : String(e);
}
class pi {
  media;
  offset;
  driftTolerance;
  constructor(t, i = {}) {
    this.media = t, this.offset = i.offset ?? 0, this.driftTolerance = Math.max(0, i.driftTolerance ?? 0.15);
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
  update(t, i) {
    const n = this.targetTime(t);
    i ? (this.media.paused && this.safePlay(), Math.abs(this.media.currentTime - n) > this.driftTolerance && (this.media.currentTime = n)) : (this.media.paused || this.media.pause(), this.media.currentTime !== n && (this.media.currentTime = n));
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
function xo(e, t, i, n, s) {
  const r = i - s;
  if (r < 0) {
    t.paused || t.pause(), t.currentTime = 0;
    return;
  }
  e.update(r, n);
}
class Pe {
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
  constructor(t, i = {}) {
    if (typeof t == "string") {
      const n = document.querySelector(t);
      if (!n)
        throw new Error(`Container not found: ${t}`);
      this.container = n;
    } else
      this.container = t;
    this.options = i, this.adapter = new J();
  }
  /**
   * Load animation from a URL or JSON object.
   */
  async load(t) {
    this.scenarioList = [], this.scenarioId = void 0, await this.loadSource(t);
  }
  async loadSource(t) {
    let i;
    if (typeof t == "string") {
      const n = await fetch(t);
      if (!n.ok)
        throw new Error(`Failed to load animation: ${n.statusText}`);
      i = await n.json();
    } else
      i = t;
    this.useDefinition(i), this.showInitialFrame(), this.watchReducedMotion(), this.watchVisibility(), this.options.autoplay && !this.reducedMotion && (this.options.playWhenVisible && !this.onScreen ? this.autoplayWhenSeen = !0 : this.play());
  }
  /**
   * Make a definition the current timeline: targets, symbols and media bound, no
   * frame drawn and nothing played. The definition itself is not modified, so a
   * scenario's timeline can be used again.
   */
  useDefinition(t) {
    const i = { ...t.config };
    this.options.speed !== void 0 && (i.speed = this.options.speed), this.options.loop !== void 0 && (i.loop = this.options.loop), this.options.alternate !== void 0 && (i.alternate = this.options.alternate), this.timeline = wt({ ...t, config: i }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
  }
  // --- scenarios: the reader chooses which timeline plays --------------------
  /**
   * Load several timelines for the same markup, and show one. The reader switches
   * with `setScenario`; the embed's controls and `data-tinyfly-choose` hotspots
   * call it.
   */
  async loadScenarios(t, i = {}) {
    if (t.length === 0) throw new Error("tinyfly: loadScenarios needs at least one scenario");
    const n = /* @__PURE__ */ new Set();
    for (const r of t) {
      if (n.has(r.id)) throw new Error(`tinyfly: scenario id "${r.id}" is used more than once`);
      n.add(r.id);
    }
    const s = i.initial === void 0 ? t[0] : t.find((r) => r.id === i.initial);
    if (!s) throw new Error(`tinyfly: there is no scenario "${i.initial}"`);
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
    const i = this.scenarioList.find((a) => a.id === t);
    if (!i || !this.timeline) return !1;
    if (t === this.scenarioId) return !0;
    const n = this.isPlaying, s = this.currentTime >= this.duration - 0.5, r = this.currentMarker?.id;
    this.stopAnimationLoop(), this.stepping = !1, this.pausedByVisibility = !1, this.restoreAuthored(), this.scenarioId = t, this.useDefinition(i.timeline), this.lastMarkerId = null;
    let o = 0;
    return this.reducedMotion || s ? o = this.duration : r !== void 0 && (o = this.markers.find((a) => a.id === r)?.time ?? 0), this.seek(o), n && !this.reducedMotion ? (this.stepping = this.options.stepMode === !0, this.startPlaying()) : this.notify(), !0;
  }
  /** Remember how an element was authored, the first time it becomes a target. */
  rememberAuthored(t) {
    if (this.authored.has(t)) return;
    const i = { style: t.getAttribute("style") };
    t.children.length === 0 && (i.text = t.textContent ?? "");
    const n = t.tagName.toLowerCase() === "path" ? t : t.querySelector("path");
    n && (i.path = { element: n, d: n.getAttribute("d") }), this.authored.set(t, i);
  }
  /** Put every target back the way it was authored. */
  restoreAuthored() {
    for (const [t, i] of this.authored) {
      i.style === null ? t.removeAttribute("style") : t.setAttribute("style", i.style), i.text !== void 0 && t.textContent !== i.text && (t.textContent = i.text), i.path && (i.path.d === null ? i.path.element.removeAttribute("d") : i.path.element.setAttribute("d", i.path.d));
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
    let i;
    for (const n of this.markers)
      if (n.time <= t + 0.5) i = n;
      else break;
    return i;
  }
  /**
   * Caption for a marker (default: the current one) in a language (default: the
   * container's closest `lang`, then the document's), falling back to the
   * marker's own label.
   */
  caption(t, i) {
    const n = t ? this.markers.find((o) => o.id === t) : this.currentMarker;
    if (!n) return;
    const s = i ?? this.language(), r = (o) => o?.[s]?.[n.id] ?? o?.[s.split("-")[0]]?.[n.id];
    return r(this.options.captions) ?? r(this.timeline?.captions) ?? n.label;
  }
  /** Move to the next marker: animated, or a jump under reduced motion. At the last marker, to the end. */
  next() {
    if (!this.timeline) return;
    const t = this.currentTime, i = this.markers.find((n) => n.time > t + 0.5);
    if (this.reducedMotion) {
      this.seek(i ? i.time : this.duration);
      return;
    }
    t >= this.duration - 0.5 || (this.stepping = i !== void 0, this.startPlaying());
  }
  /** Jump back to the previous marker (or the start). */
  prev() {
    if (!this.timeline) return;
    const t = this.currentTime, i = [...this.markers].reverse().find((n) => n.time < t - 0.5);
    this.pause(), this.seek(i ? i.time : 0);
  }
  /** Jump to a marker by id, paused there. */
  goToMarker(t) {
    const i = this.markers.find((n) => n.id === t);
    i && (this.pause(), this.seek(i.time));
  }
  language() {
    return this.container.closest("[lang]")?.getAttribute("lang") || (typeof document < "u" ? document.documentElement.lang : "") || "en";
  }
  showInitialFrame() {
    if (!this.timeline) return;
    const t = this.options.initialFrame ?? "start";
    if (t === "none") return;
    const i = t === "end" ? this.timeline.duration : t === "start" ? 0 : t;
    this.timeline.seek(Math.max(0, Math.min(this.timeline.duration, i))), this.applyState();
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
        this.visibilityObserver?.disconnect(), this.visibilityObserver = new IntersectionObserver((i) => {
          for (const n of i) this.onScreen = n.isIntersecting;
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
    const t = this.currentMarker, i = t?.id;
    i !== this.lastMarkerId && (this.lastMarkerId = i, this.options.onMarker(t));
  }
  /**
   * Find embedded media elements (`[data-tinyfly-media]`) in the container and
   * bind each to the timeline. Emitted by the editor's export for audio/video
   * scene elements; the `data-tinyfly-start` attribute sets when each begins.
   */
  scanMedia() {
    this.mediaTargets = [], this.container.querySelectorAll("[data-tinyfly-media]").forEach((i) => {
      const n = i, s = Number(n.getAttribute("data-tinyfly-start") ?? "0") || 0, r = n.getAttribute("data-volume");
      r !== null && (n.volume = Math.max(0, Math.min(1, Number(r) || 0))), this.mediaTargets.push({ el: n, startTime: s, sync: new pi(n) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(t, i) {
    for (const n of this.mediaTargets)
      xo(n.sync, n.el, t, i, n.startTime);
  }
  /**
   * Load animation from inline JSON string.
   */
  loadFromString(t) {
    const i = JSON.parse(t);
    this.load(i);
  }
  /**
   * Register a target element by name.
   */
  registerTarget(t, i) {
    if (typeof i == "string") {
      const n = this.container.querySelector(i);
      n && (this.rememberAuthored(n), this.targets[t] = n, this.adapter.registerTarget(t, n));
    } else
      this.rememberAuthored(i), this.targets[t] = i, this.adapter.registerTarget(t, i);
  }
  /**
   * Auto-register targets using data-tinyfly attribute.
   */
  autoRegisterTargets() {
    this.container.querySelectorAll("[data-tinyfly]").forEach((i) => {
      const n = i.closest("[data-tinyfly-symbol]");
      if (n && n !== i) return;
      const s = i.getAttribute("data-tinyfly");
      s && this.registerTarget(s, i);
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
    const i = new Map(t.map((n) => [n.id, n]));
    this.container.querySelectorAll("[data-tinyfly-symbol]").forEach((n) => {
      const s = n.getAttribute("data-tinyfly-symbol");
      if (!s) return;
      const r = i.get(s);
      if (!r || !r.timeline.tracks?.length) return;
      const o = new J();
      n.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const l = a.getAttribute("data-tinyfly");
        l && o.registerTarget(l, a);
      }), this.symbolInstances.push({ adapter: o, timeline: wt(r.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(t, i) {
    this.mediaSync = new pi(t, i), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const t = (i) => {
      if (this.isDestroyed || !this.timeline) return;
      const n = i - (this.lastTime ?? i);
      this.lastTime = i;
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
    const i = this.timeline, n = { time: i.currentTime, iteration: i.loopIteration, direction: i.direction };
    this.playhead = n;
    const s = this.markers;
    if (s.length === 0) return;
    const { crossings: r } = Li(
      s.map((o) => o.time),
      t,
      n,
      { duration: i.duration, alternate: i.config.alternate === !0, holding: i.repeatDelayRemaining > 0 }
    );
    for (const o of r) {
      if (o.kind !== "event") continue;
      const a = s[o.index];
      if (this.stepping || a.pause) {
        this.stepping = !1, i.pause(), i.seek(a.time), this.playhead = { time: a.time, iteration: i.loopIteration, direction: i.direction };
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
    for (const i of this.symbolInstances) {
      const n = i.timeline.duration;
      i.adapter.applyState(i.timeline.getStateAtTime(n > 0 ? t % n : t));
    }
  }
}
async function Fa(e, t, i = {}) {
  const n = new Pe(e, { ...i, autoplay: !0 });
  return await n.load(t), n;
}
function Da(e, t = {}) {
  return new Pe(e, t);
}
const So = {
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
}, mi = "tinyfly-controls-style", Mo = `
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
let Ao = 0;
function Eo(e) {
  if (e.getElementById(mi)) return;
  const t = e.createElement("style");
  t.id = mi, t.textContent = Mo, e.head.appendChild(t);
}
function Po(e, t, i = {}) {
  const n = t.ownerDocument;
  Eo(n);
  const s = { ...So, ...i.labels }, r = i.speeds ?? [0.5, 1, 2], o = () => e.markers.length > 0, a = () => e.markers.some((E) => E.label !== void 0 || e.caption(E.id) !== void 0), l = n.createElement("div");
  l.className = "tf-ctl";
  const c = n.createElement("div");
  c.className = "tf-ctl-bar", c.setAttribute("role", "group");
  const u = (E, R, $, N = "") => {
    const O = n.createElement("button");
    return O.type = "button", O.className = `tf-ctl-btn ${N}`.trim(), O.setAttribute("aria-label", E), O.title = E, O.textContent = R, O.addEventListener("click", $), O;
  }, f = u(s.restart, "⟲", () => {
    e.pause(), e.seek(0);
  }), h = u(s.prev, "|◀", () => e.prev()), d = u(s.play, "▶", () => e.isPlaying ? e.pause() : p(), "tf-ctl-primary"), g = u(s.next, "▶|", () => e.next()), p = () => {
    e.currentTime >= e.duration - 0.5 && e.seek(0), e.play();
  }, m = n.createElement("input");
  m.type = "range", m.className = "tf-ctl-scrub", m.min = "0", m.max = "1000", m.step = "1", m.setAttribute("aria-label", s.scrub), m.addEventListener("input", () => {
    e.pause(), e.seek(Number(m.value) / 1e3 * e.duration);
  });
  const y = n.createElement("span");
  y.className = "tf-ctl-step";
  const w = n.createElement("select");
  w.className = "tf-ctl-speed", w.setAttribute("aria-label", s.speed);
  for (const E of r) {
    const R = n.createElement("option");
    R.value = String(E), R.textContent = `${E}×`, E === 1 && (R.selected = !0), w.appendChild(R);
  }
  w.addEventListener("change", () => e.setSpeed(Number(w.value))), c.append(f, h, d, g, m, y), r.length > 0 && c.append(w), l.append(c);
  const b = i.fullscreen ? Ro(t, n, s) : void 0;
  b && c.append(b.button);
  const k = n.createElement("p");
  k.className = "tf-ctl-caption", k.setAttribute("aria-live", "polite"), i.captions !== !1 && l.append(k);
  const v = n.createElement("div");
  v.className = "tf-ctl-question", v.hidden = !0;
  const T = n.createElement("span"), x = u(s.reveal, s.reveal, () => e.play(), "tf-ctl-primary");
  v.append(T, x), l.append(v);
  const M = Co(e, n, s.scenario, i.scenarioControl ?? "buttons");
  M && l.append(M.element);
  const I = i.mount;
  I ? I.appendChild(l) : t.insertAdjacentElement("afterend", l);
  const A = () => {
    const E = e.isPlaying;
    d.textContent = E ? "❚❚" : "▶", d.setAttribute("aria-label", E ? s.pause : s.play), d.title = E ? s.pause : s.play;
    const R = e.duration;
    n.activeElement !== m && (m.value = String(R > 0 ? Math.round(e.currentTime / R * 1e3) : 0));
    const $ = e.markers;
    if (h.hidden = g.hidden = y.hidden = $.length === 0, $.length > 0) {
      const N = e.currentMarker, O = N ? $.indexOf(N) + 1 : 0;
      y.textContent = s.stepFormat.replace("{index}", String(O)).replace("{total}", String($.length)), y.setAttribute("aria-label", `${s.step} ${O} ${s.of} ${$.length}`), h.disabled = e.currentTime <= 0.5, g.disabled = e.currentTime >= R - 0.5;
      const L = e.caption() ?? "";
      k.textContent !== L && (k.textContent = L), k.hidden = !a();
      const F = !E && N?.question !== void 0 && Math.abs(e.currentTime - N.time) < 1;
      v.hidden = !F, F && T.textContent !== N.question && (T.textContent = N.question);
    } else
      v.hidden = !0, k.hidden = !0;
    M?.update();
  }, S = e.subscribe(A);
  A();
  const C = i.keyboardScope ?? t;
  !C.hasAttribute("tabindex") && C.tabIndex < 0 && (C.tabIndex = 0);
  const P = /* @__PURE__ */ new WeakSet(), _ = (E) => {
    if (P.has(E) || (P.add(E), E.defaultPrevented || E.altKey || E.ctrlKey || E.metaKey)) return;
    const R = E.target;
    if (!(R.tagName === "INPUT" || R.tagName === "SELECT") && !(E.key === " " && R.tagName === "BUTTON"))
      switch (E.key) {
        case " ":
          E.preventDefault(), e.isPlaying ? e.pause() : p();
          break;
        case "ArrowRight":
          if (!o()) return;
          E.preventDefault(), e.next();
          break;
        case "ArrowLeft":
          if (!o()) return;
          E.preventDefault(), e.prev();
          break;
        case "Home":
          E.preventDefault(), e.pause(), e.seek(0);
          break;
        case "f":
        case "F":
          if (!b) return;
          E.preventDefault(), b.active ? b.exit() : b.enter();
          break;
      }
  };
  return C.addEventListener("keydown", _), l.addEventListener("keydown", _), {
    element: l,
    fullscreen: b && {
      get active() {
        return b.active;
      },
      enter: b.enter,
      exit: b.exit
    },
    destroy() {
      b?.destroy(), S(), C.removeEventListener("keydown", _), l.removeEventListener("keydown", _), l.remove();
    }
  };
}
function Co(e, t, i, n) {
  const s = e.scenarios;
  if (s.length < 2) return;
  if (n === "slider") {
    const u = t.createElement("div");
    u.className = "tf-ctl-choice-slider";
    const f = t.createElement("span");
    f.textContent = i, f.setAttribute("aria-hidden", "true");
    const h = t.createElement("input");
    h.type = "range", h.min = "0", h.max = String(s.length - 1), h.step = "1", h.setAttribute("aria-label", i);
    const d = t.createElement("output");
    return d.setAttribute("aria-hidden", "true"), h.addEventListener("input", () => {
      const p = s[Number(h.value)];
      p && e.setScenario(p.id);
    }), u.append(f, h, d), { element: u, update: () => {
      const p = Math.max(0, s.findIndex((y) => y.id === e.scenario));
      t.activeElement !== h && (h.value = String(p));
      const m = s[p].label;
      d.textContent !== m && (d.textContent = m), h.setAttribute("aria-valuetext", m);
    } };
  }
  const r = t.createElement("fieldset");
  r.className = "tf-ctl-choices";
  const o = t.createElement("legend");
  o.textContent = i, r.append(o);
  const a = `tf-ctl-scenario-${++Ao}`, l = s.map((u) => {
    const f = t.createElement("label");
    f.className = "tf-ctl-choice";
    const h = t.createElement("input");
    h.type = "radio", h.name = a, h.value = u.id, h.addEventListener("change", () => {
      h.checked && e.setScenario(u.id);
    });
    const d = t.createElement("span");
    return d.textContent = u.label, f.append(h, d), r.append(f), h;
  });
  return { element: r, update: () => {
    for (const u of l) {
      const f = u.value === e.scenario;
      u.checked !== f && (u.checked = f);
    }
  } };
}
const _o = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', Io = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function Ro(e, t, i) {
  const n = t, s = e, r = t.createElement("button");
  r.type = "button", r.className = "tf-ctl-btn tf-ctl-fullscreen";
  let o, a = "";
  const l = () => {
    const p = o !== void 0;
    r.innerHTML = p ? Io : _o;
    const m = p ? i.exitFullscreen : i.fullscreen;
    r.setAttribute("aria-label", m), r.title = m, r.setAttribute("aria-pressed", String(p)), e.classList.toggle("tf-fullscreen", p), e.classList.toggle("tf-fullscreen-overlay", o === "overlay");
  }, c = () => n.fullscreenElement ?? n.webkitFullscreenElement ?? null, u = () => {
    c() === e ? o = "native" : o === "native" && (o = void 0), l();
  }, f = (p) => {
    p.key === "Escape" && g();
  }, h = () => {
    o = "overlay", a = t.documentElement.style.overflow, t.documentElement.style.overflow = "hidden", t.addEventListener("keydown", f), l();
  };
  async function d() {
    if (o) return;
    const p = s.requestFullscreen?.bind(s) ?? s.webkitRequestFullscreen?.bind(s), m = n.fullscreenEnabled ?? n.webkitFullscreenEnabled ?? !1;
    if (p && m)
      try {
        if (await p(), c() === e) {
          o = "native", l();
          return;
        }
      } catch {
      }
    h();
  }
  async function g() {
    if (o === "overlay")
      t.removeEventListener("keydown", f), t.documentElement.style.overflow = a, o = void 0, l();
    else if (o === "native") {
      o = void 0, l();
      const p = n.exitFullscreen?.bind(n) ?? n.webkitExitFullscreen?.bind(n);
      c() === e && p && await p();
    }
  }
  return r.addEventListener("click", () => {
    o ? g() : d();
  }), t.addEventListener("fullscreenchange", u), t.addEventListener("webkitfullscreenchange", u), l(), {
    button: r,
    get active() {
      return o !== void 0;
    },
    enter: d,
    exit: g,
    destroy() {
      g(), t.removeEventListener("fullscreenchange", u), t.removeEventListener("webkitfullscreenchange", u), r.remove();
    }
  };
}
const gi = "tinyfly-choices-style", Lo = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function $o(e) {
  if (e.getElementById(gi)) return;
  const t = e.createElement("style");
  t.id = gi, t.textContent = Lo, e.head.appendChild(t);
}
function Fo(e, t) {
  const i = Array.from(t.querySelectorAll("[data-tinyfly-choose]"));
  if (i.length === 0) return () => {
  };
  $o(t.ownerDocument);
  const n = [], s = [];
  for (const a of i) {
    const l = a.getAttribute("data-tinyfly-choose") ?? "", c = [], u = (g, p) => {
      a.hasAttribute(g) || (a.setAttribute(g, p), c.push(g));
    };
    u("role", "button"), u("tabindex", "0");
    const f = e.scenarios.find((g) => g.id === l)?.label;
    f !== void 0 && u("aria-label", f), a.setAttribute("aria-pressed", "false"), c.push("aria-pressed"), n.push({ element: a, attributes: c });
    const h = () => e.setScenario(l), d = (g) => {
      const p = g.key;
      p !== "Enter" && p !== " " || (g.preventDefault(), h());
    };
    a.addEventListener("click", h), a.addEventListener("keydown", d), s.push(() => {
      a.removeEventListener("click", h), a.removeEventListener("keydown", d);
    });
  }
  const r = () => {
    for (const { element: a } of n)
      a.setAttribute("aria-pressed", String(a.getAttribute("data-tinyfly-choose") === e.scenario));
  }, o = e.subscribe(r);
  return r(), () => {
    o();
    for (const a of s) a();
    for (const { element: a, attributes: l } of n) for (const c of l) a.removeAttribute(c);
  };
}
const Yt = /* @__PURE__ */ new WeakMap(), ve = /* @__PURE__ */ new WeakMap();
let Do = 0;
function vt(e, t, i) {
  if (e)
    try {
      return JSON.parse(e);
    } catch (n) {
      console.warn(`tinyfly: invalid ${t} JSON on`, i, n);
      return;
    }
}
async function Bo(e, t = {}) {
  const i = Yt.get(e);
  if (i) return i;
  const n = Array.from(e.querySelectorAll("script[data-tinyfly-timeline]")), s = n[0], r = e.getAttribute("data-src"), o = No(e.getAttribute("data-markers")), a = n.length > 1 || s?.hasAttribute("data-scenario") ? Oo(n, o, e) : void 0;
  if (a && a.length === 0) return;
  let l = s && !a ? vt(s.textContent, "timeline", e) : void 0;
  if (!l && r && o) {
    const d = await fetch(r);
    d.ok && (l = await d.json());
  }
  if (l && o && (l = nn(l, o)), !l && !r && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', e);
    return;
  }
  const c = vt(e.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", e), u = {
    playWhenVisible: !0,
    ...t.player,
    ...c && { captions: c },
    ...vt(e.getAttribute("data-options"), "data-options", e)
  };
  Yo(e);
  const f = new Pe(e, u), h = { element: e, player: f };
  if (Yt.set(e, h), e.setAttribute("data-tinyfly-mounted", ""), a) {
    const d = e.getAttribute("data-scenario") ?? void 0;
    await f.loadScenarios(a, { initial: a.some((g) => g.id === d) ? d : void 0 }), ve.set(e, Fo(f, e));
  } else
    await f.load(l ?? r);
  if (e.getAttribute("data-controls") !== "false") {
    const d = vt(e.getAttribute("data-labels"), "data-labels", e), g = e.querySelector("figcaption"), p = e.getAttribute("data-scenario-legend"), m = e.getAttribute("data-scenario-control");
    h.controls = Po(f, e, {
      ...t.controls,
      ...e.getAttribute("data-fullscreen") === "true" ? { fullscreen: !0 } : {},
      ...m === "slider" || m === "buttons" ? { scenarioControl: m } : {},
      labels: { ...t.controls?.labels, ...d, ...p ? { scenario: p } : {} },
      // Inside the figure, before its figcaption, so the caption stays last.
      mount: void 0
    }), g ? e.insertBefore(h.controls.element, g) : e.appendChild(h.controls.element);
  }
  return h;
}
function Oo(e, t, i) {
  const n = [];
  return e.forEach((s, r) => {
    const o = vt(s.textContent, "timeline", i);
    if (!o) return;
    const a = s.getAttribute("data-scenario") || `scenario-${r + 1}`;
    if (n.some((c) => c.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, i);
      return;
    }
    const l = s.getAttribute("data-scenario-label") ?? void 0;
    n.push({ id: a, label: l, timeline: t ? nn(o, t) : o });
  }), n;
}
function nn(e, t) {
  return e.config.markers?.length ? e : { ...e, config: { ...e.config, markers: t.map((i, n) => ({ id: `step-${n + 1}`, time: i })) } };
}
function No(e) {
  if (!e) return;
  const t = e.split(/[\s,]+/).filter(Boolean).map(Number).filter((i) => Number.isFinite(i) && i >= 0).sort((i, n) => i - n);
  return t.length > 0 ? t : void 0;
}
async function qo(e = document, t = {}) {
  const i = Array.from(e.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(i.map((s) => Bo(s, t)))).filter((s) => s !== void 0);
}
function Ba(e) {
  const t = Yt.get(e);
  t && (ve.get(e)?.(), ve.delete(e), t.controls?.destroy(), t.player.destroy(), Yt.delete(e), e.removeAttribute("data-tinyfly-mounted"));
}
function Yo(e) {
  const t = e.querySelector("svg");
  if (!t || t.hasAttribute("role") || t.hasAttribute("aria-hidden")) return;
  const i = e.getAttribute("data-alt"), n = e.querySelector("figcaption");
  t.setAttribute("role", "img"), i ? t.setAttribute("aria-label", i) : n && (n.id ||= `tinyfly-caption-${++Do}`, t.setAttribute("aria-labelledby", n.id));
}
function Xo() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const t = () => {
    qo();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", t, { once: !0 }) : t();
}
class Wo {
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
  constructor(t, i = {}) {
    if (typeof t == "string") {
      const n = document.querySelector(t);
      if (!n) throw new Error(`Container not found: ${t}`);
      this.container = n;
    } else
      this.container = t;
    this.options = i, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new J(), this.adapterB = new J();
  }
  /**
   * Load a sequence from a URL or inline definition.
   */
  async load(t) {
    let i;
    if (typeof t == "string") {
      const n = await fetch(t);
      if (!n.ok)
        throw new Error(`Failed to load sequence: ${n.statusText}`);
      i = await n.json();
    } else
      i = t;
    this.sequence = i, this.symbolDefs.clear();
    for (const n of i.symbols ?? [])
      n.timeline?.tracks?.length && this.symbolDefs.set(n.id, n.timeline);
    this.container.style.width = `${i.canvas.width}px`, this.container.style.height = `${i.canvas.height}px`, i.scenes.length > 0 && (this.renderScene(i.scenes[0], this.containerA, this.adapterA), this.timelineA = this.createTimeline(i.scenes[0])), this.options.autoplay && this.play();
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
    const i = this._isPlaying;
    this.transitionTimer !== void 0 && (clearTimeout(this.transitionTimer), this.transitionTimer = void 0), this.stopAnimationLoop(), this.timelineA && this.timelineA.stop(), this.timelineB && this.timelineB.stop(), this._currentSceneIndex = t, this._state = i ? "playing-scene" : "idle", this.clearContainer(this.containerA), this.clearContainer(this.containerB), this.adapterA.clearTargets(), this.adapterB.clearTargets(), this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB);
    const n = this.sequence.scenes[t];
    if (this.renderScene(n, this.containerA, this.adapterA), this.timelineA = this.createTimeline(n), this.options.onSceneChange?.(t), i)
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
      for (const i of t) i.adapter.clearTargets();
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
  renderScene(t, i, n) {
    i.innerHTML = "", n.clearTargets();
    const s = document.createElement("div");
    s.style.cssText = "position:absolute;inset:0;transform-origin:center center", s.setAttribute("data-tinyfly", "Camera"), i.appendChild(s), n.registerTarget("Camera", s);
    for (const r of t.elements) {
      if (!r.html) continue;
      const o = document.createElement("div");
      o.innerHTML = r.html.trim();
      const a = o.firstElementChild;
      if (a) {
        s.appendChild(a);
        const l = a.getAttribute("data-tinyfly");
        l && n.registerTarget(l, a);
      }
    }
    this.setupNested(s, n);
  }
  /**
   * For each symbol instance container (`[data-tinyfly-symbol]`) in a scene slot,
   * bind its inner elements to a private adapter driven by the symbol's timeline.
   */
  setupNested(t, i) {
    const n = [];
    t.querySelectorAll("[data-tinyfly-symbol]").forEach((s) => {
      const r = s.getAttribute("data-tinyfly-symbol");
      if (!r) return;
      const o = this.symbolDefs.get(r);
      if (!o) return;
      const a = new J();
      s.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const c = l.getAttribute("data-tinyfly");
        c && a.registerTarget(c, l);
      }), n.push({ adapter: a, timeline: wt(o) });
    }), n.length ? this.nestedByAdapter.set(i, n) : this.nestedByAdapter.delete(i);
  }
  /** Apply the nested symbol states for a slot at a given scene time. */
  applyNested(t, i) {
    const n = this.nestedByAdapter.get(t);
    if (n)
      for (const s of n) {
        const r = s.timeline.duration;
        s.adapter.applyState(s.timeline.getStateAtTime(r > 0 ? i % r : i));
      }
  }
  clearContainer(t) {
    t.innerHTML = "";
  }
  createTimeline(t) {
    return t.timeline ? wt(t.timeline) : null;
  }
  onSceneComplete() {
    if (this._isDestroyed || !this.sequence) return;
    const t = this._currentSceneIndex + 1;
    if (t >= this.sequence.scenes.length) {
      const i = this.options.loop ?? this.sequence.loop ?? 0;
      i === -1 || i > 0 && this.loopIteration < i - 1 ? (this.loopIteration++, this.beginTransitionTo(0)) : (this._isPlaying = !1, this._state = "idle", this.stopAnimationLoop(), this.options.onComplete?.());
    } else
      this.beginTransitionTo(t);
  }
  beginTransitionTo(t) {
    if (!this.sequence || this._isDestroyed) return;
    const i = this.sequence.scenes[t], n = i.transition;
    if (n.type === "none" || n.duration <= 0) {
      this.switchToScene(t);
      return;
    }
    this._state = "transitioning", this.containerB.style.visibility = "visible", this.renderScene(i, this.containerB, this.adapterB), this.timelineB = this.createTimeline(i), this.timelineB && this.timelineB.play(), this.applyTransition(n.type, n.duration), this.transitionTimer = window.setTimeout(() => {
      this.finishTransition(t);
    }, n.duration);
  }
  applyTransition(t, i) {
    const n = `${i}ms`, s = "ease-in-out";
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
    const i = this.containerA;
    this.containerA = this.containerB, this.containerB = i;
    const n = this.adapterA;
    this.adapterA = this.adapterB, this.adapterB = n, this.timelineA = this.timelineB, this.timelineB = null, this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB), this._currentSceneIndex = t, this._state = "playing-scene", this.options.onSceneChange?.(t), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.playbackState !== "playing" && this.timelineA.play()) : this.onSceneComplete();
  }
  switchToScene(t) {
    if (!this.sequence || this._isDestroyed) return;
    this.timelineA && this.timelineA.stop(), this.adapterA.clearTargets(), this.clearContainer(this.containerA);
    const i = this.sequence.scenes[t];
    this.renderScene(i, this.containerA, this.adapterA), this.timelineA = this.createTimeline(i), this._currentSceneIndex = t, this._state = "playing-scene", this.options.onSceneChange?.(t), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.play()) : this.onSceneComplete();
  }
  startAnimationLoop() {
    if (this.animationFrameId !== void 0) return;
    this.lastTime = performance.now();
    const t = (i) => {
      if (this._isDestroyed || !this._isPlaying) return;
      const n = i - (this.lastTime ?? i);
      if (this.lastTime = i, this.timelineA && this.timelineA.playbackState === "playing") {
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
async function Oa(e, t, i = {}) {
  const n = new Wo(e, { ...i, autoplay: !0 });
  return await n.load(t), n;
}
const Na = { type: "none", duration: 0 };
function Vo(e) {
  let t = 0;
  for (let i = 1; i < e.length; i++) t += Math.hypot(e[i].x - e[i - 1].x, e[i].y - e[i - 1].y);
  return t;
}
function kt(e, t) {
  const i = Math.min(1, Math.max(0, t));
  if (e.length < 2 || i === 1) return e.slice();
  if (i === 0) return e.slice(0, 1);
  let n = Vo(e) * i;
  const s = [e[0]];
  for (let r = 1; r < e.length; r++) {
    const o = e[r - 1], a = e[r], l = Math.hypot(a.x - o.x, a.y - o.y);
    if (l >= n) {
      const c = l === 0 ? 0 : n / l;
      return s.push({ x: o.x + (a.x - o.x) * c, y: o.y + (a.y - o.y) * c }), s;
    }
    s.push(a), n -= l;
  }
  return s;
}
function sn(e, t) {
  const i = kt(e, t);
  return i[i.length - 1];
}
function Uo(e, t) {
  return t > 0 ? Math.floor(Math.max(0, e) * t / 1e3) : 0;
}
function rn(e, t, i) {
  const n = t.roughness ?? 2, s = Math.max(1, Math.round(t.passes ?? 2)), r = Uo(i, t.boil ?? 8);
  let o = 0;
  const a = () => {
    const h = o++;
    return (d) => Fi(ks(`${t.seed ?? 1}:${r}:${h}:${d}`));
  }, l = (h, d) => (h.next() * 2 - 1) * d, c = (h) => {
    const d = a(), g = e.lineWidth, p = e.globalAlpha;
    for (let m = 0; m < s; m++)
      e.lineWidth = m === 0 ? g : g * 0.55, e.globalAlpha = m === 0 ? p : p * 0.6, h(d(m));
    e.lineWidth = g, e.globalAlpha = p;
  }, u = (h, d = 1) => {
    if (h.length < 2) return;
    const g = h.slice(1).map((m, y) => Math.hypot(m.x - h[y].x, m.y - h[y].y)), p = g.reduce((m, y) => m + y, 0) * Math.min(1, Math.max(0, d));
    c((m) => {
      const y = [], w = [];
      if (h.forEach((k, v) => {
        y.push({ x: k.x + l(m, n * 0.5), y: k.y + l(m, n * 0.5) }), v > 0 && w.push([m.next() * 2 - 1, m.next() * 2 - 1]);
      }), p <= 0) return;
      e.beginPath(), e.moveTo(y[0].x, y[0].y);
      let b = 0;
      for (let k = 1; k < y.length; k++) {
        const v = jo(y[k - 1], y[k], n, w[k - 1]), T = g[k - 1];
        if (b + T <= p) {
          e.bezierCurveTo(v[1].x, v[1].y, v[2].x, v[2].y, v[3].x, v[3].y), b += T;
          continue;
        }
        const x = Ho(v, T === 0 ? 1 : (p - b) / T);
        e.bezierCurveTo(x[1].x, x[1].y, x[2].x, x[2].y, x[3].x, x[3].y);
        break;
      }
      e.stroke();
    });
  }, f = (h, d, g, p, m = 1) => {
    c((y) => {
      const b = y.next() * Math.PI * 2, k = Math.PI * 2 + 0.15 + y.next() * 0.3, v = [];
      for (let x = 0; x <= 14; x++) {
        const M = b + k * x / 14, I = l(y, n * 0.6);
        v.push({ x: h + Math.cos(M) * (g + I), y: d + Math.sin(M) * (p + I) });
      }
      const T = kt(v, m);
      T.length < 2 || (yi(e, T), e.stroke());
    });
  };
  return {
    line: u,
    curve(h, d = 1) {
      if (h.length < 2) return;
      const g = h[0], p = h[h.length - 1], m = Math.hypot(p.x - g.x, p.y - g.y) || 1, y = -(p.y - g.y) / m, w = (p.x - g.x) / m;
      c((b) => {
        const k = { x: l(b, n * 0.5), y: l(b, n * 0.5) }, v = { x: l(b, n * 0.5), y: l(b, n * 0.5) }, T = l(b, n * Math.min(1.5, Math.max(0.3, m / 80))), x = h.map((I, A) => {
          const S = A / (h.length - 1), C = Math.sin(Math.PI * S) * T;
          return {
            x: I.x + k.x + (v.x - k.x) * S + y * C,
            y: I.y + k.y + (v.y - k.y) * S + w * C
          };
        }), M = kt(x, d);
        M.length < 2 || (yi(e, M), e.stroke());
      });
    },
    circle(h, d, g, p = 1) {
      f(h, d, g, g, p);
    },
    ellipse: f,
    nudge(h = 0.5) {
      const d = a()(0);
      return { x: l(d, n * h), y: l(d, n * h) };
    }
  };
}
function jo(e, t, i, n) {
  const s = t.x - e.x, r = t.y - e.y, o = Math.hypot(s, r) || 1, a = i * Math.min(1.5, Math.max(0.3, o / 80)), l = -r / o, c = s / o;
  return [
    e,
    { x: e.x + s / 3 + l * n[0] * a, y: e.y + r / 3 + c * n[0] * a },
    { x: e.x + 2 * s / 3 + l * n[1] * a, y: e.y + 2 * r / 3 + c * n[1] * a },
    t
  ];
}
function Ho([e, t, i, n], s) {
  const r = (f, h) => ({ x: f.x + (h.x - f.x) * s, y: f.y + (h.y - f.y) * s }), o = r(e, t), a = r(t, i), l = r(i, n), c = r(o, a), u = r(a, l);
  return [e, o, c, r(c, u)];
}
function yi(e, t) {
  e.beginPath(), e.moveTo(t[0].x, t[0].y);
  for (let n = 1; n < t.length - 1; n++) {
    const s = { x: (t[n].x + t[n + 1].x) / 2, y: (t[n].y + t[n + 1].y) / 2 };
    e.quadraticCurveTo(t[n].x, t[n].y, s.x, s.y);
  }
  const i = t[t.length - 1];
  e.lineTo(i.x, i.y);
}
const ht = {
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
  stretch: 1
};
function X(e) {
  return { ...ht, ...e };
}
const on = {
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
}, B = (e) => ({ ...on, ...e }), K = {
  neutral: on,
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
function zo(e, t) {
  return { ...e, ...typeof t == "string" ? K[t] : t };
}
const Go = {
  rest: ht,
  wave: X({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...K.happy }),
  cheer: X({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...K.joyful }),
  shrug: X({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...K.confused, lookX: 0, lookY: 0 }),
  point: X({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: X({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...K.thinking }),
  handsOnHips: X({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: X({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...K.sad }),
  surprised: X({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...K.surprised }),
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: X({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  jump: X({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...K.joyful })
}, an = Object.keys(ht);
function Ko(e, t, i) {
  const n = { ...e };
  for (const s of an) n[s] = e[s] + (t[s] - e[s]) * i;
  return n;
}
const we = 24, Zo = 40;
function Qo(e, t = ht, i = 1) {
  const n = Math.sin(e * Math.PI * 2) * i, s = Math.cos(e * Math.PI * 2) * i, r = (o) => o <= Zo ? 22 * n : o;
  return {
    ...t,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -we * n,
    rightHip: -we * n,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, s),
    rightKnee: 30 * Math.max(0, -s),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: r(t.leftShoulder),
    rightShoulder: r(t.rightShoulder)
  };
}
function qa(e, t = 1) {
  return 4 * ((ln + cn) * e) * Math.sin(we * t * Math.PI / 180);
}
function Jo(e) {
  const t = Math.abs(Math.sin(e / 65)), i = 0.55 + 0.45 * Math.sin(e / 310);
  return t * i;
}
const ta = 0.12, ea = 0.1, ia = 0.21, na = 0.19, ln = 0.24, cn = 0.22, Xt = (e) => e * Math.PI / 180, sa = (e, t) => ({ x: t * Math.sin(Xt(e)), y: Math.cos(Xt(e)) });
function ra(e, t, i, n, s, r) {
  const o = Math.max(1, r * 0.6), a = 0.12 * i, l = n - 0.12 * i, c = a + t.lookX * 0.08 * i, u = t.lookY * 0.07 * i, f = [
    { x: -0.34 * i, open: t.leftEye, brow: t.leftBrow, side: -1 },
    { x: 0.34 * i, open: t.rightEye, brow: t.rightBrow, side: 1 }
  ];
  e.fillStyle = s, e.strokeStyle = s, e.lineWidth = o;
  for (const m of f) {
    const y = Math.max(0, m.open) * (1 - Math.min(1, Math.max(0, t.blink)));
    if (y < 0.2) {
      const v = t.smile > 0.5 ? -0.12 * i : 0.06 * i;
      e.beginPath(), e.moveTo(m.x + a - 0.12 * i, l), e.quadraticCurveTo(m.x + a, l + v, m.x + a + 0.12 * i, l), e.stroke();
    } else {
      if (y > 1.2) {
        const T = 0.13 * i * y;
        e.beginPath(), e.ellipse(m.x + a, l, T * 0.85, T, 0, 0, Math.PI * 2), e.fillStyle = "#ffffff", e.fill(), e.stroke(), e.fillStyle = s;
      }
      const v = y > 1.2 ? 0.075 * i : 0.1 * i;
      e.beginPath(), e.ellipse(m.x + c, l + u, v, v * 1.1 * Math.min(y, 1), 0, 0, Math.PI * 2), e.fill();
    }
    const w = l - 0.3 * i - m.brow * 0.14 * i - Math.max(0, y - 1) * 0.12 * i, b = m.x + a - m.side * 0.13 * i, k = m.x + a + m.side * 0.13 * i;
    e.beginPath(), e.moveTo(k, w), e.lineTo(b, w - t.browTilt * 0.1 * i), e.stroke();
  }
  const h = n + 0.4 * i, d = 0.25 * i * Math.max(0.3, t.mouthWidth), g = Math.min(1, Math.max(0, t.mouth));
  if (e.beginPath(), g <= 0.05) {
    e.moveTo(a - d, h), e.quadraticCurveTo(a, h + t.smile * 0.25 * i, a + d, h), e.stroke();
    return;
  }
  const p = 0.3 * i * g;
  t.smile > 0.3 ? (e.moveTo(a - d, h - 0.05 * i), e.lineTo(a + d, h - 0.05 * i), e.quadraticCurveTo(a, h + p * 2, a - d, h - 0.05 * i)) : t.smile < -0.3 ? (e.moveTo(a - d, h + p * 0.6), e.lineTo(a + d, h + p * 0.6), e.quadraticCurveTo(a, h - p * 1.4, a - d, h + p * 0.6)) : e.ellipse(a, h, d * 0.8, p, 0, 0, Math.PI * 2), e.fill();
}
function oa(e, t, i, n, s = 16) {
  const r = { x: 2 * t.x - (e.x + i.x) / 2, y: 2 * t.y - (e.y + i.y) / 2 }, o = [];
  for (let a = 0; a <= s; a++) {
    const l = a / s, c = l < 0.5 ? { x: e.x + (t.x - e.x) * 2 * l, y: e.y + (t.y - e.y) * 2 * l } : { x: t.x + (i.x - t.x) * (2 * l - 1), y: t.y + (i.y - t.y) * (2 * l - 1) }, u = 1 - l, f = {
      x: u * u * e.x + 2 * u * l * r.x + l * l * i.x,
      y: u * u * e.y + 2 * u * l * r.y + l * l * i.y
    };
    o.push({ x: c.x + (f.x - c.x) * n, y: c.y + (f.y - c.y) * n });
  }
  return o;
}
function aa(e, t, i = {}, n = 0) {
  const s = i.height ?? 300, r = i.color ?? "#1e293b", o = (i.facing ?? 1) < 0 ? -1 : 1, a = Math.min(3, Math.max(0.3, t.stretch ?? 1)), l = Math.sqrt(a), c = ta * s, u = c / Math.sqrt(a), f = c * Math.sqrt(a), h = -0.46 * s * a, d = -0.76 * s * a;
  e.save(), e.scale(o, 1), e.strokeStyle = r, e.lineWidth = i.lineWidth ?? s * 0.025, e.lineCap = "round", e.lineJoin = "round";
  const g = (v, T, x, M, I) => {
    const A = sa(x, M);
    return { x: v + A.x * I * s, y: T + A.y * I * s };
  }, p = i.sketch ? rn(e, i.sketch, n) : void 0, m = (...v) => {
    if (p) return p.line(v);
    e.beginPath(), e.moveTo(v[0].x, v[0].y);
    for (const T of v.slice(1)) e.lineTo(T.x, T.y);
    e.stroke();
  }, y = (v, T, x) => {
    const M = Math.min(1, Math.max(0, i.rubber ?? 0));
    if (M === 0) return m(v, T, x);
    const I = oa(v, T, x, M);
    if (p) return p.curve(I);
    e.beginPath(), e.moveTo(I[0].x, I[0].y);
    for (const A of I.slice(1)) e.lineTo(A.x, A.y);
    e.stroke();
  };
  for (const [v, T, x] of [
    [-1, t.leftHip, t.leftKnee],
    [1, t.rightHip, t.rightKnee]
  ]) {
    const M = g(0, h, T, v, ln * a);
    y({ x: 0, y: h }, M, g(M.x, M.y, T - x, v, cn * a));
  }
  e.translate(0, h), e.rotate(Xt(t.lean)), e.translate(0, -h), m({ x: 0, y: h }, { x: 0, y: d });
  const w = d + ea * s * a;
  for (const [v, T, x] of [
    [-1, t.leftShoulder, t.leftElbow],
    [1, t.rightShoulder, t.rightElbow]
  ]) {
    const M = g(0, w, T, v, ia * l);
    y(
      { x: 0, y: w },
      M,
      g(M.x, M.y, T + x, v, na * l)
    );
  }
  e.translate(0, d), e.rotate(Xt(t.headTilt));
  const b = -f;
  e.beginPath(), e.ellipse(0, b, u, f, 0, 0, Math.PI * 2);
  const k = i.headFill ?? "#ffffff";
  if (k !== "none" && (e.fillStyle = k, e.fill()), p) {
    p.ellipse(0, b, u, f);
    const v = p.nudge();
    e.translate(v.x, v.y);
  } else
    e.stroke();
  e.translate(0, b), e.scale(u / c, f / c), ra(e, t, c, 0, r, i.lineWidth ?? s * 0.025), e.restore(), i.label && (e.save(), e.fillStyle = r, e.font = i.labelFont ?? `700 ${Math.round(s * 0.11)}px sans-serif`, e.textAlign = "center", e.textBaseline = "bottom", e.fillText(i.label, 0, -s * a - 0.04 * s), e.restore());
}
function Ya(e) {
  const t = e.style ?? {}, i = t.height ?? 300, n = i * 0.8, s = { ...X(e.pose ?? {}), walk: 0, walking: 0, talk: 0, rubber: t.rubber ?? 0 };
  return {
    type: "custom",
    x: e.x - n / 2,
    y: e.y - i,
    width: n,
    height: i,
    props: { ...s },
    draw(r, o, a) {
      const l = o.props, c = { ...l };
      let u = l.walking > 0 ? Ko(c, Qo(l.walk, c), l.walking) : c;
      l.talk > 0 && (u = { ...u, mouth: Math.max(u.mouth, l.talk * Jo(a)) }), r.translate(n / 2, i), aa(r, u, { ...t, rubber: l.rubber }, a);
    }
  };
}
function Xa(e, t) {
  const i = [];
  return t.forEach((n, s) => {
    const r = s === 0 ? ht : i[s - 1], o = typeof n.pose == "string" ? Go[n.pose] : { ...r, ...n.pose };
    i.push(n.expression ? zo(o, n.expression) : o);
  }), an.filter((n) => i.some((s) => s[n] !== ht[n])).map((n) => ({
    id: `${e}-${n}`,
    target: e,
    property: n,
    keyframes: t.map((s, r) => ({
      time: s.time,
      value: i[r][n],
      ...s.easing ? { easing: s.easing } : {}
    }))
  }));
}
function la(e, t, i = {}, n) {
  const s = i.length ?? 240, r = 9, o = 28, a = s - 22;
  e.save(), e.translate(t.x, t.y), e.rotate((i.angle ?? -30) * Math.PI / 180), e.fillStyle = i.color ?? "#f4c542", e.fillRect(o, -r, a - o, 2 * r), e.fillStyle = "#e8b4a0", e.fillRect(a, -r, s - a, 2 * r), e.fillStyle = "#f1dcbf", e.beginPath(), e.moveTo(0, 0), e.lineTo(o, -r), e.lineTo(o, r), e.closePath(), e.fill(), e.fillStyle = i.outline ?? "#2f2f33", e.beginPath(), e.moveTo(0, 0), e.lineTo(o * 0.35, -r * 0.35), e.lineTo(o * 0.35, r * 0.35), e.closePath(), e.fill(), e.strokeStyle = i.outline ?? "#2f2f33", e.lineWidth = 3, e.lineJoin = "round", e.lineCap = "round";
  const l = [
    [{ x: 0, y: 0 }, { x: o, y: -r }, { x: s, y: -r }, { x: s, y: r }, { x: o, y: r }, { x: 0, y: 0 }],
    [{ x: o, y: -r }, { x: o, y: r }],
    [{ x: a, y: -r }, { x: a, y: r }]
  ];
  for (const c of l) fn(e, c, n);
  e.restore();
}
function hn(e, t, i = {}, n) {
  const s = i.length ?? 90, r = i.thickness ?? 34;
  e.save(), e.translate(t.x, t.y), e.rotate((i.angle ?? -35) * Math.PI / 180);
  const o = -r / 2;
  e.fillStyle = i.color ?? "#f4a7b9", e.fillRect(0, o, s, r), e.fillStyle = "#e9edf2", e.fillRect(s * 0.45, o, s * 0.55, r), e.strokeStyle = i.outline ?? "#2f2f33", e.lineWidth = 3, e.lineJoin = "round";
  const a = [
    { x: 0, y: o },
    { x: s, y: o },
    { x: s, y: -o },
    { x: 0, y: -o },
    { x: 0, y: o }
  ], l = [{ x: s * 0.45, y: o }, { x: s * 0.45, y: -o }];
  if (n)
    n.line(a), n.line(l);
  else
    for (const c of [a, l]) {
      e.beginPath(), e.moveTo(c[0].x, c[0].y);
      for (const u of c.slice(1)) e.lineTo(u.x, u.y);
      e.stroke();
    }
  e.restore();
}
function un(e, t, i = {}, n) {
  const s = i.tool ?? "pencil", r = i.skin ?? "#f1c9a5", o = i.outline ?? "#2f2f33", a = s === "eraser" ? 17 : 9, l = s === "eraser" ? -40 : 0, c = n ? n.nudge(0.6) : { x: 0, y: 0 };
  e.save(), e.translate(t.x + c.x, t.y + c.y), e.rotate((i.angle ?? -30) * Math.PI / 180), e.scale(i.scale ?? 1, i.scale ?? 1), e.lineCap = "round", e.lineJoin = "round";
  const u = (d, g, p, m) => {
    for (const [y, w] of [
      [o, p + 6],
      [m, p]
    ])
      e.strokeStyle = y, e.lineWidth = w, e.beginPath(), e.moveTo(d.x, d.y), e.lineTo(g.x, g.y), e.stroke();
  };
  e.save(), e.translate(l, 0);
  const f = { x: 165, y: -a - 26 }, h = (d) => ({ x: f.x + d * 0.8, y: f.y + d * 0.6 });
  u(f, h(2e3), 64, r), u(h(110), h(2e3), 92, i.sleeve ?? "#5b7db1"), e.fillStyle = r, e.strokeStyle = o, e.lineWidth = 3, e.beginPath(), e.ellipse(f.x, f.y, 54, 40, 0.25, 0, Math.PI * 2), e.fill(), e.stroke(), e.restore(), s === "eraser" ? hn(e, { x: 0, y: 0 }, { angle: 0, outline: o }, n) : la(e, { x: 0, y: 0 }, { angle: 0, outline: o }, n), e.translate(l, 0), u({ x: 150, y: a + 8 }, { x: 92, y: a + 12 }, 22, r), u({ x: 140, y: -a - 18 }, { x: 58, y: -a - 6 }, 20, r), u({ x: 150, y: -a - 30 }, { x: 112, y: -a + 2 }, 20, r), u({ x: 172, y: -a - 30 }, { x: 140, y: -a + 4 }, 20, r), e.restore();
}
function Wa(e, t, i, n = 0.08, s = 32) {
  const r = Math.PI * 2 * (1 + n), o = [];
  for (let a = 0; a <= s; a++) {
    const l = -Math.PI / 2 + r * a / s;
    o.push({ x: e + Math.cos(l) * i, y: t + Math.sin(l) * i });
  }
  return o;
}
function Va(e) {
  const { path: t } = e, i = t.map((a) => a.x), n = t.map((a) => a.y), s = Math.min(...i), r = Math.min(...n), o = e.hand === !1 ? void 0 : e.hand === !0 || e.hand === void 0 ? {} : e.hand;
  return {
    type: "custom",
    x: s,
    y: r,
    width: Math.max(1, Math.max(...i) - s),
    height: Math.max(1, Math.max(...n) - r),
    props: { draw: 0 },
    draw(a, l, c) {
      const u = Math.min(1, Math.max(0, Number(l.props?.draw ?? 0)));
      a.translate(-s, -r), a.strokeStyle = e.color ?? "#2f2f33", a.lineWidth = e.lineWidth ?? 5, a.lineCap = "round", a.lineJoin = "round";
      const f = e.sketch ? rn(a, e.sketch, c) : void 0;
      u > 0 && (f ? e.smooth ? f.curve(t, u) : f.line(t, u) : fn(a, kt(t, u))), o && u > 0 && u < 1 && un(a, sn(t, u), o, f);
    }
  };
}
function fn(e, t, i) {
  if (!(t.length < 2)) {
    if (i) return i.line(t);
    e.beginPath(), e.moveTo(t[0].x, t[0].y);
    for (const n of t.slice(1)) e.lineTo(n.x, n.y);
    e.stroke();
  }
}
const It = 1e5;
function Ua(e, t, i, n, s = 6) {
  const r = [], o = Math.max(1, Math.round(s));
  for (let a = 0; a <= o; a++)
    r.push({ x: a % 2 === 0 ? e : e + i, y: t + n * a / o });
  return r;
}
function dn(e, t, i, n) {
  if (n <= 0 || t.length === 0) return;
  const s = kt(t, n), r = i / 2, o = (a) => {
    e.beginPath(), e.rect(-It, -It, 2 * It, 2 * It), a(), e.clip("evenodd");
  };
  for (const a of s)
    o(() => {
      e.moveTo(a.x + r, a.y), e.arc(a.x, a.y, r, 0, Math.PI * 2);
    });
  for (let a = 1; a < s.length; a++) {
    const l = s[a - 1], c = s[a], u = Math.hypot(c.x - l.x, c.y - l.y);
    if (u === 0) continue;
    const f = -(c.y - l.y) / u * r, h = (c.x - l.x) / u * r;
    o(() => {
      e.moveTo(l.x + f, l.y + h), e.lineTo(c.x + f, c.y + h), e.lineTo(c.x - f, c.y - h), e.lineTo(l.x - f, l.y - h), e.closePath();
    });
  }
}
function ja(e, t, i, n, s) {
  e.save(), dn(e, t, i, n), s(), e.restore();
}
function Ha(e, t) {
  const i = t.width ?? 40, n = t.hand === !0 ? {} : t.hand || void 0, s = t.eraser === !1 ? void 0 : t.eraser === !0 || t.eraser === void 0 ? {} : t.eraser;
  return {
    ...e,
    props: { ...e.props, erase: 0 },
    draw(r, o, a) {
      const l = Number(o.props?.erase ?? 0);
      if (r.save(), dn(r, t.path, i, l), e.draw(r, o, a), r.restore(), !s || l <= 0 || l >= 1) return;
      const c = sn(t.path, l);
      n ? un(r, c, { ...n, tool: "eraser" }) : hn(r, c, s);
    }
  };
}
function za(e) {
  const { timeline: t } = e, i = new J();
  for (const [c, u] of Object.entries(e.targets)) {
    const f = typeof u == "string" ? document.querySelector(u) : u;
    if (!f)
      throw new Error(`quickPlay: no element found for target "${c}" (${String(u)})`);
    i.registerTarget(c, f);
  }
  t.onUpdate = (c) => {
    i.applyState(c), e.onUpdate?.(c);
  }, e.onComplete && (t.onComplete = e.onComplete);
  let n = null, s = null, r = !1;
  const o = (c) => {
    if (r) return;
    const u = s === null ? 0 : c - s;
    s = c, u > 0 && t.tick(u), n = requestAnimationFrame(o);
  }, a = () => {
    n !== null || r || (s = null, n = requestAnimationFrame(o));
  }, l = () => {
    n !== null && cancelAnimationFrame(n), n = null, s = null;
  };
  return i.applyState(t.getStateAtTime(t.currentTime)), e.autoplay !== !1 && (t.play(), a()), {
    timeline: t,
    adapter: i,
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
      t.seek(c * 1e3), i.applyState(t.getStateAtTime(t.currentTime));
    },
    destroy() {
      r = !0, l(), t.stop(), i.clearTargets();
    }
  };
}
const Ga = {
  timeline: ir,
  to(e, t, i) {
    const n = new ot(i);
    return n.to(e, t), n;
  },
  from(e, t, i) {
    const n = new ot(i);
    return n.from(e, t), n;
  },
  fromTo(e, t, i, n) {
    const s = new ot(n);
    return s.fromTo(e, t, i), s;
  },
  set(e, t, i) {
    const n = new ot(i);
    return n.set(e, t), n;
  }
}, Ka = Y.to, Za = Y.from, Qa = Y.fromTo, Ja = Y.set, tl = Y.timeline, el = Y.ticker, il = Y.splitText, nl = Y.context, sl = Y.matchMedia, rl = Y.quickTo, ol = Y.imageSequence, al = Y.pageTransition;
Xo();
export {
  ua as Clock,
  ot as CompatTimeline,
  ho as CustomBounce,
  co as CustomEase,
  uo as CustomWiggle,
  Ai as DEFAULT_BAKE_INTERVAL_MS,
  Ce as DEFAULT_INERTIA_FRICTION,
  So as DEFAULT_LABELS,
  W as DEFAULT_SPRING,
  Na as DEFAULT_TRANSITION,
  zi as Draggable,
  K as EXPRESSIONS,
  Ft as FORMAT_VERSION,
  xn as INERTIA_MAX_DURATION_MS,
  ds as InertiaTrackPlayer,
  H as LiveTimeline,
  ba as MORPH_SAMPLES,
  ha as ManualClock,
  pi as MediaSync,
  Sr as Observer,
  Go as POSES,
  ht as REST_POSE,
  Ti as SPRING_MAX_DURATION_MS,
  Gt as SPRING_PRESETS,
  yt as SPRING_STEP_MS,
  jr as ScrollAnimator,
  Ht as ScrollDriver,
  Hr as ScrollMarkers,
  Yr as ScrollPin,
  ai as SmoothScroll,
  Vt as SpringSampler,
  fs as SpringTrackPlayer,
  gr as Stage,
  Ri as Timeline,
  Pe as TinyflyPlayer,
  Wo as TinyflySequencer,
  te as TrackPlayer,
  Ea as ValueResolver,
  qr as VisibilityDriver,
  Fn as backOut,
  _i as bakeEasing,
  Pi as bakeInertiaTrack,
  Ei as bakeSpringTrack,
  Fo as bindChoiceHotspots,
  Ko as blendPose,
  Uo as boilFrame,
  $n as bounceOut,
  ms as charactersFor,
  Wa as circlePath,
  Qi as clamp01,
  va as clearMorphCache,
  ga as clearPathCache,
  dn as clipErased,
  si as containerProgressAt,
  nl as context,
  Da as create,
  Po as createControls,
  Rn as createCubicBezier,
  bo as createLive,
  Fi as createRandom,
  de as createTrack,
  pa as criticalDamping,
  Es as customBounce,
  As as customEase,
  Ps as customWiggle,
  wt as deserializeTimeline,
  ws as deserializeTrack,
  Ia as draggable,
  hn as drawEraser,
  un as drawHand,
  la as drawPencil,
  aa as drawStickFigure,
  Va as drawnPathTarget,
  Pn as easeIn,
  ki as easeInCubic,
  _n as easeInOut,
  jt as easeInOutCubic,
  En as easeInOutQuad,
  Mn as easeInQuad,
  Cn as easeOut,
  xi as easeOutCubic,
  An as easeOutQuad,
  Ln as elasticOut,
  Ha as erasable,
  hs as expandParametricEasings,
  Za as from,
  Sa as fromJSON,
  Qa as fromTo,
  z as getEasingFunction,
  Bt as getInterpolator,
  Ii as getMotionPathPoint,
  ya as getPathLength,
  jn as getPointAtProgress,
  Ar as gridLinesFor,
  vn as hasKeyframes,
  ks as hashSeed,
  ol as imageSequence,
  St as inertiaDuration,
  xt as inertiaRest,
  he as inertiaValueAt,
  ma as inertiaVelocityAt,
  ls as interpolateArray,
  as as interpolateColor,
  ka as interpolateMotionPath,
  j as interpolateNumber,
  cs as interpolatePathString,
  We as interpolateString,
  bn as isCubicBezierEasing,
  tt as isInertiaTrack,
  ca as isMotionPathPoint,
  bi as isMotionPathTrack,
  $t as isParametricEasing,
  Mt as isPathData,
  et as isSpringTrack,
  Te as isTextTrack,
  da as isUnderdamped,
  Aa as isUnresolved,
  ue as linear,
  Y as live,
  Ot as mapEase,
  sl as matchMedia,
  wi as maxStaggerDistance,
  ss as morphPath,
  Bo as mount,
  qo as mountAll,
  Ca as narrationMarkers,
  _a as narrationSceneAt,
  Dt as naturalRest,
  al as pageTransition,
  Bn as parametricEasing,
  ni as parseEdge,
  at as parsePath,
  Zi as parseTrigger,
  kt as partialPath,
  Vo as pathLength,
  Pa as planNarration,
  Fa as play,
  Oa as playSequence,
  La as playWhenVisible,
  Li as playheadCrossings,
  sn as pointAlong,
  Si as pointAtDistance,
  $s as pointsToPath,
  X as pose,
  Xa as poseTracks,
  za as quickPlay,
  rl as quickTo,
  Di as randomBetween,
  Ma as randomChoice,
  xs as randomSnapped,
  Ss as resolveSequence,
  Ni as resolveValue,
  oa as rubberLimb,
  Ra as scrollProgress,
  $a as scrubOnScroll,
  Ua as scrubPath,
  Ts as serializeTimeline,
  vs as serializeTrack,
  Ja as set,
  xe as shapeToPathData,
  us as simplifyKeyframes,
  rn as sketchPen,
  Nr as smoothToward,
  Mr as snapAxis,
  Wr as snapConfig,
  Ur as snapDuration,
  Vr as snapProgress,
  il as splitText,
  wn as springDuration,
  fa as springValueAt,
  vi as staggerDistance,
  ke as staggerOffset,
  ce as staggerOffsets,
  Wt as staggerSpan,
  Dn as stepsEasing,
  Ya as stickFigureTarget,
  qa as strideLength,
  xo as syncMediaElement,
  Jo as talkingMouth,
  ys as textAt,
  Ga as tf,
  el as ticker,
  tl as timeline,
  Ka as to,
  xa as toJSON,
  wa as toKeyframedTrack,
  Ta as toKeyframedTracks,
  Q as trackTargets,
  Tt as triggerDistance,
  Ba as unmount,
  Qo as walkPose,
  ja as withErased,
  zo as withExpression
};
