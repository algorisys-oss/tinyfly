function As(s) {
  return typeof s == "object" && s !== null && s.type === "cubic-bezier";
}
function Wt(s) {
  return s.property === "text" && "textConfig" in s;
}
function j(s) {
  return s.kind === "inertia" && "inertia" in s;
}
function z(s) {
  return s.kind === "spring" && "spring" in s;
}
function Re(s) {
  return s.property === "motionPath" && "motionPathConfig" in s;
}
function hr(s) {
  return typeof s == "object" && s !== null && "x" in s && "y" in s && "angle" in s;
}
function Ms(s) {
  return "keyframes" in s;
}
class ur {
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
class fr {
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
function De(s, t, e = "start") {
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
function Ps(s, t = "start") {
  if (s <= 1) return 0;
  let e = 0;
  for (let i = 0; i < s; i++)
    e = Math.max(e, De(i, s, t));
  return e;
}
function Le(s, t, e) {
  const i = e.from ?? "start", n = De(s, t, i);
  if (e.amount !== void 0) {
    const r = Ps(t, i);
    return r === 0 ? 0 : e.amount * n / r;
  }
  return e.each !== void 0 ? e.each * n : 0;
}
function Be(s, t) {
  return Array.from({ length: s }, (e, i) => Le(i, s, t));
}
function kt(s, t) {
  return s <= 1 ? 0 : Math.max(...Be(s, t));
}
const lt = 1, Oe = 6e4, yt = Oe / lt, L = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, Pt = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class xt {
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
    this.from = t.from, this.to = t.to, this.stiffness = t.stiffness ?? L.stiffness, this.damping = t.damping ?? L.damping, this.mass = t.mass ?? L.mass, this.restDelta = t.restDelta ?? L.restDelta, this.restSpeed = t.restSpeed ?? L.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = t.velocity ?? L.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const e = Math.floor(t / lt);
    if (this.simulateTo(e + 1), this.settledStep !== null && e >= this.settledStep)
      return this.to;
    const i = this.samples[Math.min(e, this.samples.length - 1)], n = this.samples[Math.min(e + 1, this.samples.length - 1)], r = t / lt - e;
    return i + (n - i) * r;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(yt + 1), this.settledStep !== null ? this.settledStep * lt : Oe;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(t) {
    if (this.settledStep !== null) return;
    const e = Math.min(t, yt + 1), i = lt / 1e3;
    for (; this.samples.length < e; ) {
      const n = this.samples[this.samples.length - 1], r = n - this.to, o = -this.stiffness * r, a = -this.damping * this.velocity, c = (o + a) / this.mass;
      this.velocity += c * i;
      const l = n + this.velocity * i;
      if (this.samples.push(l), this.isAtRest(l)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > yt && (this.settledStep = yt);
  }
}
function dr(s, t) {
  return new xt(s).valueAt(t);
}
function _s(s) {
  return new xt(s).settleTime();
}
function pr(s) {
  const t = s.stiffness ?? L.stiffness, e = s.damping ?? L.damping, i = s.mass ?? L.mass;
  return e < 2 * Math.sqrt(t * i);
}
function mr(s) {
  const t = s.stiffness ?? L.stiffness, e = s.mass ?? L.mass;
  return 2 * Math.sqrt(t * e);
}
const te = 4, Cs = 2e-3, Es = 1e-4, $s = 6e4;
function At(s) {
  const t = s.friction ?? te;
  return t > 0 ? t : te;
}
function wt(s) {
  return s.from + s.velocity / At(s);
}
function Is(s, t) {
  if (t === void 0) return s;
  if (typeof t == "number")
    return t > 0 ? Math.round(s / t) * t : s;
  if (t.length === 0) return s;
  let e = t[0];
  for (const i of t)
    Math.abs(i - s) < Math.abs(e - s) && (e = i);
  return e;
}
function ft(s) {
  let t = Is(wt(s), s.end);
  return s.min !== void 0 && (t = Math.max(s.min, t)), s.max !== void 0 && (t = Math.min(s.max, t)), t;
}
function dt(s) {
  const t = Math.abs(ft(s) - s.from);
  if (t === 0) return 0;
  const e = s.restDelta ?? Math.max(Es, t * Cs);
  if (e >= t) return 0;
  const i = Math.log(t / e) / At(s);
  return Math.min($s, i * 1e3);
}
function Ot(s, t) {
  if (t <= 0) return s.from;
  const e = ft(s);
  if (t >= dt(s)) return e;
  const i = At(s);
  return s.from + (e - s.from) * (1 - Math.exp(-i * t / 1e3));
}
function gr(s, t) {
  const e = At(s), i = ft(s);
  return t >= dt(s) ? 0 : (i - s.from) * e * Math.exp(-e * Math.max(0, t) / 1e3);
}
const Xe = (s) => s, Fs = (s) => s * s, Rs = (s) => 1 - (1 - s) * (1 - s), Ds = (s) => s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2, Ne = (s) => s * s * s, Ye = (s) => 1 - Math.pow(1 - s, 3), jt = (s) => s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2, Ls = Ne, Bs = Ye, Os = jt, Xs = {
  linear: Xe,
  "ease-in": Ls,
  "ease-out": Bs,
  "ease-in-out": Os,
  "ease-in-quad": Fs,
  "ease-out-quad": Rs,
  "ease-in-out-quad": Ds,
  "ease-in-cubic": Ne,
  "ease-out-cubic": Ye,
  "ease-in-out-cubic": jt
};
function Ns(s) {
  const [t, e, i, n] = s, r = 3 * t, o = 3 * (i - t) - r, a = 1 - r - o, c = 3 * e, l = 3 * (n - e) - c, u = 1 - c - l, f = (p) => ((a * p + o) * p + r) * p, h = (p) => ((u * p + l) * p + c) * p, d = (p) => (3 * a * p + 2 * o) * p + r, g = (p) => {
    let m = p;
    for (let T = 0; T < 8; T++) {
      const S = f(m) - p;
      if (Math.abs(S) < 1e-7)
        return m;
      const b = d(m);
      if (Math.abs(b) < 1e-7)
        break;
      m -= S / b;
    }
    let y = 0, v = 1;
    for (m = p; y < v; ) {
      const T = f(m);
      if (Math.abs(T - p) < 1e-7)
        return m;
      p > T ? y = m : v = m, m = (y + v) / 2;
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
function zt(s) {
  return s === void 0 ? Xe : As(s) ? Ns(s.points) : Xs[s];
}
const ee = 32, Ys = 256, Z = /* @__PURE__ */ new Map(), qs = /[MmLlHhVvCcSsQqTtAaZz]/, Vs = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, Us = {
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
function Ws(s) {
  const t = [];
  let e = 0, i = null;
  const n = () => {
    for (; e < s.length && /[\s,]/.test(s[e]); ) e++;
  };
  for (; e < s.length && (n(), !(e >= s.length)); ) {
    const r = s[e];
    if (qs.test(r)) {
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
    const c = Vs.exec(s.slice(e));
    if (!c) break;
    i.args.push(parseFloat(c[0])), e += c[0].length;
  }
  return t;
}
function js(s, t, e, i, n, r, o, a, c) {
  if (s === a && t === c) return [];
  let l = Math.abs(e), u = Math.abs(i);
  if (l === 0 || u === 0) return [[s, t, a, c, a, c]];
  const f = n * Math.PI / 180, h = Math.cos(f), d = Math.sin(f), g = (s - a) / 2, p = (t - c) / 2, m = h * g + d * p, y = -d * g + h * p, v = m * m / (l * l) + y * y / (u * u);
  if (v > 1) {
    const C = Math.sqrt(v);
    l *= C, u *= C;
  }
  const T = r === o ? -1 : 1, S = l * l * u * u - l * l * y * y - u * u * m * m, b = l * l * y * y + u * u * m * m, w = T * Math.sqrt(Math.max(0, S / b)), x = w * l * y / u, $ = -w * u * m / l, B = h * x - d * $ + (s + a) / 2, A = d * x + h * $ + (t + c) / 2, k = (C, I, F, G) => {
    const Mt = C * F + I * G, gt = Math.sqrt((C * C + I * I) * (F * F + G * G)), nt = Math.acos(Math.max(-1, Math.min(1, Mt / gt)));
    return C * G - I * F < 0 ? -nt : nt;
  }, P = k(1, 0, (m - x) / l, (y - $) / u);
  let M = k((m - x) / l, (y - $) / u, (-m - x) / l, (-y - $) / u);
  !o && M > 0 && (M -= 2 * Math.PI), o && M < 0 && (M += 2 * Math.PI);
  const _ = Math.max(1, Math.ceil(Math.abs(M) / (Math.PI / 2))), R = M / _, N = 4 / 3 * Math.tan(R / 4), Y = (C) => {
    const I = l * Math.cos(C), F = u * Math.sin(C);
    return [h * I - d * F + B, d * I + h * F + A];
  }, it = (C) => {
    const I = -l * Math.sin(C), F = u * Math.cos(C);
    return [h * I - d * F, d * I + h * F];
  }, mt = [];
  for (let C = 0; C < _; C++) {
    const I = P + C * R, F = I + R, [G, Mt] = Y(I), [gt, nt] = C === _ - 1 ? [a, c] : Y(F), [ws, Ss] = it(I), [ks, xs] = it(F);
    mt.push([G + N * ws, Mt + N * Ss, gt - N * ks, nt - N * xs, gt, nt]);
  }
  return mt;
}
function V(s, t, e, i, n) {
  const r = 1 - n;
  return r * r * r * s + 3 * r * r * n * t + 3 * r * n * n * e + n * n * n * i;
}
function se(s, t, e, i, n) {
  const r = 1 - n;
  return 3 * r * r * (t - s) + 6 * r * n * (e - t) + 3 * n * n * (i - e);
}
function rt(s, t, e, i) {
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
function bt(s, t, e) {
  const [i, n, r, o, a, c] = e, l = [0];
  let u = s, f = t, h = 0;
  for (let d = 1; d <= ee; d++) {
    const g = d / ee, p = V(s, i, r, a, g), m = V(t, n, o, c, g);
    h += Math.hypot(p - u, m - f), l.push(h), u = p, f = m;
  }
  return {
    subpath: 0,
    type: "C",
    points: [i, n, r, o, a, c],
    startX: s,
    startY: t,
    endX: a,
    endY: c,
    length: h,
    lengths: l
  };
}
function et(s) {
  const t = Z.get(s);
  if (t) return t;
  const e = [];
  let i = 0, n = 0, r = 0, o = 0, a = null, c = null, l = -1;
  const u = /* @__PURE__ */ new Set(), f = (p) => {
    l < 0 && (l = 0), p.subpath = l, e.push(p);
  };
  for (const { type: p, args: m } of Ws(s)) {
    const y = p.toUpperCase(), v = p !== y, T = Us[y];
    if (y === "Z") {
      (i !== r || n !== o) && f(rt(i, n, r, o)), l >= 0 && u.add(l), i = r, n = o, a = c = null;
      continue;
    }
    for (let S = 0; S + T <= m.length; S += T) {
      const b = m.slice(S, S + T), w = v ? i : 0, x = v ? n : 0;
      let $ = null, B = null;
      switch (y) {
        case "M":
          S === 0 ? (i = b[0] + w, n = b[1] + x, r = i, o = n, (l < 0 || e[e.length - 1]?.subpath === l) && l++) : (f(rt(i, n, b[0] + w, b[1] + x)), i = b[0] + w, n = b[1] + x);
          break;
        case "L":
          f(rt(i, n, b[0] + w, b[1] + x)), i = b[0] + w, n = b[1] + x;
          break;
        case "H":
          f(rt(i, n, b[0] + w, n)), i = b[0] + w;
          break;
        case "V":
          f(rt(i, n, i, b[0] + x)), n = b[0] + x;
          break;
        case "C": {
          const A = [b[0] + w, b[1] + x, b[2] + w, b[3] + x, b[4] + w, b[5] + x];
          f(bt(i, n, A)), $ = [A[2], A[3]], i = A[4], n = A[5];
          break;
        }
        case "S": {
          const [A, k] = a ? [2 * i - a[0], 2 * n - a[1]] : [i, n], P = [A, k, b[0] + w, b[1] + x, b[2] + w, b[3] + x];
          f(bt(i, n, P)), $ = [P[2], P[3]], i = P[4], n = P[5];
          break;
        }
        case "Q":
        case "T": {
          let A = i, k = n;
          y === "Q" ? (A = b[0] + w, k = b[1] + x) : c && (A = 2 * i - c[0], k = 2 * n - c[1]);
          const P = y === "Q" ? b[2] + w : b[0] + w, M = y === "Q" ? b[3] + x : b[1] + x;
          f(
            bt(i, n, [
              i + 2 / 3 * (A - i),
              n + 2 / 3 * (k - n),
              P + 2 / 3 * (A - P),
              M + 2 / 3 * (k - M),
              P,
              M
            ])
          ), B = [A, k], i = P, n = M;
          break;
        }
        case "A": {
          const A = b[5] + w, k = b[6] + x;
          let P = i, M = n;
          for (const _ of js(i, n, b[0], b[1], b[2], b[3], b[4], A, k))
            f(bt(P, M, _)), P = _[4], M = _[5];
          i = A, n = k;
          break;
        }
      }
      a = $, c = B;
    }
  }
  const h = e.reduce((p, m) => p + m.length, 0), d = [];
  for (let p = 0; p < e.length; ) {
    const m = e[p].subpath;
    let y = p, v = 0;
    for (; y < e.length && e[y].subpath === m; ) v += e[y++].length;
    const T = e[p], S = e[y - 1], b = u.has(m) || Math.abs(S.endX - T.startX) < 1e-9 && Math.abs(S.endY - T.startY) < 1e-9;
    d.push({ start: p, end: y, length: v, closed: b }), p = y;
  }
  const g = { segments: e, totalLength: h, subpaths: d };
  return Z.size >= Ys && Z.delete(Z.keys().next().value), Z.set(s, g), g;
}
function zs(s, t) {
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
function Gs(s, t) {
  if (s.type === "L") {
    const f = s.length > 0 ? Math.max(0, Math.min(1, t / s.length)) : 0;
    return {
      x: s.startX + (s.endX - s.startX) * f,
      y: s.startY + (s.endY - s.startY) * f,
      angle: Math.atan2(s.endY - s.startY, s.endX - s.startX) * 180 / Math.PI
    };
  }
  const [e, i, n, r, o, a] = s.points, c = zs(s, t);
  let l = se(s.startX, e, n, o, c), u = se(s.startY, i, r, a, c);
  if (Math.hypot(l, u) < 1e-9) {
    const f = c < 0.5 ? Math.min(1, c + 1e-3) : Math.max(0, c - 1e-3), h = V(s.startX, e, n, o, f), d = V(s.startY, i, r, a, f), g = V(s.startX, e, n, o, c), p = V(s.startY, i, r, a, c);
    l = c < 0.5 ? h - g : g - h, u = c < 0.5 ? d - p : p - d;
  }
  return {
    x: V(s.startX, e, n, o, c),
    y: V(s.startY, i, r, a, c),
    angle: Math.atan2(u, l) * 180 / Math.PI
  };
}
function qe(s, t, e = 0, i = s.length) {
  if (i <= e) return { x: 0, y: 0, angle: 0 };
  let n = 0;
  for (let r = e; r < i; r++) {
    const o = s[r];
    if (n + o.length >= t || r === i - 1)
      return Gs(o, t - n);
    n += o.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function Hs(s, t) {
  const { segments: e, totalLength: i } = et(s);
  return qe(e, Math.max(0, Math.min(1, t)) * i);
}
function yr() {
  Z.clear();
}
function br(s) {
  return et(s).totalLength;
}
const Zs = 24, Ks = 320, Qs = 2.5, ot = 72, vr = 64, Js = 128, K = /* @__PURE__ */ new Map(), ie = (s) => Math.round(s * 100) / 100;
function ne(s, t) {
  const { segments: e, subpaths: i, totalLength: n } = et(s);
  if (e.length === 0) return [];
  if (t) {
    const r = i.every((o) => o.closed);
    return [{ segments: e, start: 0, end: e.length, length: n, closed: r }];
  }
  return i.filter((r) => r.length > 0).map((r) => ({ segments: e, start: r.start, end: r.end, length: r.length, closed: r.closed }));
}
function Xt(s, t) {
  const e = s.closed ? (t % 1 + 1) % 1 : Math.max(0, Math.min(1, t)), i = qe(s.segments, e * s.length, s.start, s.end);
  return [i.x, i.y];
}
function re(s) {
  const t = [];
  let e = 0;
  for (let i = s.start; i < s.end; i++)
    e += s.segments[i].length, s.length > 0 && t.push(e / s.length);
  return t;
}
function oe(s, t) {
  const e = [];
  for (let i = 0; i < t; i++)
    e.push(Xt(s, s.closed ? i / t : i / (t - 1)));
  return e;
}
function ae(s) {
  let t = 0, e = 0;
  for (const [i, n] of s)
    t += i, e += n;
  return t /= s.length, e /= s.length, s.map(([i, n]) => [i - t, n - e]);
}
function ti(s, t, e) {
  const i = s.closed && t.closed;
  if (e !== void 0)
    return { offset: i ? Math.abs(e) % ot / ot : 0, reversed: e < 0 };
  const n = ae(oe(s, ot)), r = ae(oe(t, ot)), o = ot;
  let a = { offset: 0, reversed: !1 }, c = 1 / 0;
  for (const l of [!1, !0]) {
    const u = i ? o : 1;
    for (let f = 0; f < u; f++) {
      let h = 0;
      for (let d = 0; d < o && h < c; d++) {
        const g = i ? l ? (f - d + o) % o : (d + f) % o : l ? o - 1 - d : d, p = n[d][0] - r[g][0], m = n[d][1] - r[g][1];
        h += p * p + m * m;
      }
      h < c && (c = h, a = { offset: i ? f / o : 0, reversed: l });
    }
  }
  return a;
}
function ei(s, t, e) {
  return e ? ((t.reversed ? t.offset - s : s + t.offset) % 1 + 1) % 1 : t.reversed ? 1 - s : s;
}
function si(s, t, e) {
  return e ? ((t.reversed ? t.offset - s : s - t.offset) % 1 + 1) % 1 : t.reversed ? 1 - s : s;
}
function ii(s, t, e) {
  const i = s.closed && t.closed, n = ti(s, t, e.shapeIndex), r = Math.max(
    Zs,
    Math.min(Ks, Math.ceil(Math.max(s.length, t.length) / Qs))
  ), o = /* @__PURE__ */ new Set(), a = (f) => o.add(Math.round(f * 1e7) / 1e7);
  for (let f = 0; f <= r; f++) a(f / r);
  for (const f of re(s)) a(f);
  for (const f of re(t)) a(si(f, n, i));
  let c = [...o].sort((f, h) => f - h);
  i && (c = c.filter((f) => f < 1));
  const l = [], u = [];
  for (const f of c)
    l.push(...Xt(s, f)), u.push(...Xt(t, ei(f, n, i)));
  return { from: l, to: u, closed: i };
}
function ni(s, t, e) {
  const i = `${e.shapeIndex ?? "auto"}|${s}|${t}`, n = K.get(i);
  if (n) return n;
  const r = et(s).subpaths.filter((l) => l.length > 0).length === et(t).subpaths.filter((l) => l.length > 0).length, o = ne(s, !r), a = ne(t, !r), c = {
    pairs: o.map((l, u) => ii(l, a[u], e))
  };
  return K.size >= Js && K.delete(K.keys().next().value), K.set(i, c), c;
}
function ri(s, t, e, i = {}) {
  if (!s) return t;
  if (!t) return s;
  const n = Math.max(0, Math.min(1, e));
  if (n === 0) return s;
  if (n === 1) return t;
  const r = ni(s, t, i);
  if (r.pairs.length === 0) return n < 0.5 ? s : t;
  let o = "";
  for (const a of r.pairs) {
    for (let c = 0; c < a.from.length; c += 2) {
      const l = ie(a.from[c] + (a.to[c] - a.from[c]) * n), u = ie(a.from[c + 1] + (a.to[c + 1] - a.from[c + 1]) * n);
      o += `${c === 0 ? o ? " M" : "M" : " L"}${l} ${u}`;
    }
    a.closed && (o += " Z");
  }
  return o;
}
function Tr() {
  K.clear();
}
function pt(s) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(s);
}
const q = (s, t, e) => s + (t - s) * e, Ve = 512, _t = /* @__PURE__ */ new Map(), Ct = /* @__PURE__ */ new Map();
function ce(s) {
  const t = _t.get(s);
  if (t) return t;
  const e = s.replace("#", ""), i = [
    parseInt(e.slice(0, 2), 16),
    parseInt(e.slice(2, 4), 16),
    parseInt(e.slice(4, 6), 16)
  ];
  return _t.size < Ve && _t.set(s, i), i;
}
const le = (s) => s.charCodeAt(0) === 35, he = (s) => s.startsWith("rgb"), ue = (s) => s.startsWith("rgba"), oi = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, Et = (s) => Math.round(s).toString(16).padStart(2, "0");
function ai(s, t, e) {
  return `#${Et(s)}${Et(t)}${Et(e)}`;
}
function fe(s) {
  const t = Ct.get(s);
  if (t) return t;
  const e = s.match(oi);
  if (!e)
    throw new Error(`Invalid rgb color: ${s}`);
  const i = parseInt(e[1], 10), n = parseInt(e[2], 10), r = parseInt(e[3], 10), o = e[4] !== void 0 ? [i, n, r, parseFloat(e[4])] : [i, n, r];
  return Ct.size < Ve && Ct.set(s, o), o;
}
const ci = (s, t, e) => {
  if (le(s) && le(t)) {
    const [i, n, r] = ce(s), [o, a, c] = ce(t), l = q(i, o, e), u = q(n, a, e), f = q(r, c, e);
    return ai(l, u, f);
  }
  if ((he(s) || ue(s)) && (he(t) || ue(t))) {
    const i = fe(s), n = fe(t), r = Math.round(q(i[0], n[0], e)), o = Math.round(q(i[1], n[1], e)), a = Math.round(q(i[2], n[2], e));
    if (i.length === 4 || n.length === 4) {
      const c = i[3] ?? 1, l = n[3] ?? 1, u = q(c, l, e);
      return `rgba(${r}, ${o}, ${a}, ${u})`;
    }
    return `rgb(${r}, ${o}, ${a})`;
  }
  return e < 1 ? s : t;
}, li = (s, t, e) => {
  const i = Math.min(s.length, t.length), n = [];
  for (let r = 0; r < i; r++)
    n.push(q(s[r], t[r], e));
  return n;
}, de = (s, t, e) => e < 1 ? s : t, hi = (s, t, e) => ri(s, t, e);
function Ue(s) {
  return typeof s == "number" ? q : Array.isArray(s) ? li : typeof s == "string" ? s.startsWith("#") || s.startsWith("rgb") ? ci : pt(s) ? hi : de : de;
}
const We = 1e3 / 60;
function je(s, t = {}) {
  if (!z(s))
    throw new Error(`bakeSpringTrack: track "${s.id}" is not a spring track`);
  const e = new xt(s.spring);
  return Ge(s, (i) => e.valueAt(i), e.settleTime(), s.spring.from, s.spring.to, t);
}
function ze(s, t = {}) {
  if (!j(s))
    throw new Error(`bakeInertiaTrack: track "${s.id}" is not an inertia track`);
  const e = s.inertia;
  return Ge(
    s,
    (i) => Ot(e, i),
    dt(e),
    e.from,
    ft(e),
    t
  );
}
function Ge(s, t, e, i, n, r) {
  const o = r.intervalMs ?? We, a = r.tolerance ?? 0.01, c = s.delay ?? 0, l = [];
  for (let f = 0; f <= e; f += o)
    l.push({ time: f + c, value: t(f), easing: "linear" });
  const u = l[l.length - 1];
  return !u || u.time < e + c ? l.push({ time: e + c, value: n, easing: "linear" }) : u.value = n, c > 0 && l.unshift({ time: 0, value: i, easing: "linear" }), {
    id: s.id,
    target: s.target,
    property: s.property,
    keyframes: a > 0 ? fi(l, a) : l,
    ...s.targets && { targets: [...s.targets] },
    ...s.stagger && { stagger: { ...s.stagger } }
  };
}
function ui(s, t, e, i = {}) {
  const n = i.intervalMs ?? We, r = typeof e == "function" ? e : zt(e), o = Ue(s.value), a = t.time - s.time;
  if (a <= 0) return [t];
  const c = [];
  for (let u = n; u < a; u += n) {
    const f = u / a;
    c.push({
      time: s.time + u,
      value: o(s.value, t.value, r(f)),
      easing: "linear"
    });
  }
  const l = r(1);
  return c.push({ ...t, ...l !== 1 && { value: o(s.value, t.value, l) }, easing: "linear" }), c;
}
function wr(s, t) {
  return z(s) ? je(s, t) : j(s) ? ze(s, t) : s;
}
function Sr(s, t) {
  return s.filter(Ms).concat(
    s.filter(z).map((e) => je(e, t)),
    s.filter(j).map((e) => ze(e, t))
  );
}
function fi(s, t) {
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
function Nt(s) {
  const t = [...s.keyframes].sort((e, i) => e.time - i.time);
  return {
    ...s,
    keyframes: t
  };
}
function U(s) {
  return s.targets && s.targets.length > 0 ? s.targets : [s.target];
}
function st(s, t, e, i) {
  const n = e ?? 0;
  return !i || t <= 1 ? n : n + Le(s, t, i);
}
class $t {
  track;
  targets;
  constructor(t) {
    this.track = t, this.targets = U(t);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(t) {
    return this.valueForOffset(t - st(0, this.targets.length, this.track.delay, this.track.stagger));
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
      const r = st(n, e, this.track.delay, this.track.stagger), o = this.valueForOffset(t - r);
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
    const e = t[t.length - 1].time, i = this.track.stagger ? kt(this.targets.length, this.track.stagger) : 0;
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
    const r = n.time - i.time, o = (t - i.time) / r, c = zt(n.easing)(o);
    return Ue(i.value)(i.value, n.value, c);
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
class di {
  track;
  targets;
  sampler;
  constructor(t) {
    this.track = t, this.targets = U(t), this.sampler = new xt(t.spring);
  }
  getValueAtTime(t) {
    return this.sampler.valueAt(t - st(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const e = this.targets.length, i = [];
    for (let n = 0; n < e; n++) {
      const r = st(n, e, this.track.delay, this.track.stagger);
      i.push({ target: this.targets[n], value: this.sampler.valueAt(t - r), start: r });
    }
    return i;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? kt(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
class pi {
  track;
  targets;
  duration;
  constructor(t) {
    this.track = t, this.targets = U(t), this.duration = dt(t.inertia);
  }
  getValueAtTime(t) {
    return Ot(this.track.inertia, t - st(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const e = this.targets.length, i = [];
    for (let n = 0; n < e; n++) {
      const r = st(n, e, this.track.delay, this.track.stagger);
      i.push({ target: this.targets[n], value: Ot(this.track.inertia, t - r), start: r });
    }
    return i;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? kt(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
function He(s, t) {
  const e = { ...Hs(s.pathData, t) };
  if (s.matrix) {
    const [i, n, r, o, a, c] = s.matrix, { x: l, y: u } = e;
    e.x = i * l + r * u + a, e.y = n * l + o * u + c;
    const f = e.angle * Math.PI / 180, h = Math.cos(f), d = Math.sin(f);
    e.angle = Math.atan2(n * h + o * d, i * h + r * d) * 180 / Math.PI;
  }
  return s.autoRotate && s.rotateOffset && (e.angle += s.rotateOffset), e;
}
function kr(s, t, e, i) {
  const n = t + (e - t) * i;
  return He(s, n);
}
const It = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, mi = 20;
function gi(s) {
  const t = It[s ?? "upperCase"] ?? s ?? It.upperCase, e = Array.from(t);
  return e.length > 0 ? e : Array.from(It.upperCase);
}
function yi(s, t, e) {
  let i = (s | 0) ^ Math.imul(t + 1, 2654435761) ^ Math.imul(e + 1, 2246822507);
  return i = Math.imul(i ^ i >>> 16, 2146121005), i = Math.imul(i ^ i >>> 15, 2221713035), (i ^ i >>> 16) >>> 0;
}
function bi(s, t, e = 0) {
  const i = s.from ?? "", n = s.to, r = Math.max(0, Math.min(1, t));
  if (r <= 0) return i;
  if (r >= 1) return n;
  const o = Array.from(i), a = Array.from(n), c = s.rightToLeft ?? !1;
  if (s.mode === "type") {
    const v = Math.round(r * Math.max(o.length, a.length));
    return c ? o.slice(0, Math.max(0, o.length - v)).join("") + a.slice(Math.max(0, a.length - v)).join("") : a.slice(0, v).join("") + o.slice(v).join("");
  }
  const l = Math.max(0, Math.min(0.999, s.revealDelay ?? 0)), u = Math.max(0, (r - l) / (1 - l)), f = Math.floor(u * a.length), h = s.tweenLength === !1 ? a.length : Math.round(o.length + (a.length - o.length) * r), d = gi(s.chars), g = s.refreshRate ?? mi, p = g > 0 ? Math.floor(e * g / 1e3) : 0, m = s.seed ?? 1;
  let y = "";
  for (let v = 0; v < h; v++) {
    const T = c ? v >= h - f : v < f, S = c ? a[a.length - (h - v)] : a[v];
    T && S !== void 0 || S === " " || S === `
` ? y += S : y += d[yi(m, v, p) % d.length];
  }
  return y;
}
class Ze {
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
    this._explicitDuration = t, t !== void 0 && (this._config = { ...this._config, duration: t });
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
        const u = `${a}\0${o}`, f = l <= t, h = i.get(u);
        (!h || (f !== h.started ? f : f ? l >= h.start : l <= h.start)) && i.set(u, { trackId: n, target: a, property: o, value: c, start: l, started: f });
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
      a.set("text", bi(c.textConfig, r, Math.max(0, o)));
      return;
    }
    const l = this._motionPathTracks.get(e);
    if (l && typeof r == "number") {
      const u = He(l.motionPathConfig, r);
      a.set("motionPathX", u.x), a.set("motionPathY", u.y), l.motionPathConfig.autoRotate && a.set("motionPathRotate", u.angle);
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
        for (const i of U(e)) {
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
    if (this._tracks.push(t), this._sharedWrites = null, j(t)) {
      this._trackPlayers.set(t.id, new pi(t));
      return;
    }
    if (z(t)) {
      this._trackPlayers.set(t.id, new di(t)), this._springTracks.set(t.id, t);
      return;
    }
    if (Wt(t))
      this._trackPlayers.set(t.id, new $t(t)), this._textTracks.set(t.id, t);
    else if (Re(t)) {
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
      this._trackPlayers.set(t.id, new $t(e)), this._motionPathTracks.set(t.id, t);
    } else
      this._trackPlayers.set(t.id, new $t(t));
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
    if (z(i) || j(i))
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
          const a = U(o).filter((f) => U(i).includes(f));
          if (a.length === 0) continue;
          const c = this.getTrackSpan(o.id);
          if (!c || !(c.from <= n.to && n.from <= c.to)) continue;
          const u = n.from >= c.from;
          for (const f of a)
            t.push({
              target: f,
              property: i.property,
              losingTrackId: u ? o.id : i.id,
              winningTrackId: u ? i.id : o.id
            });
        }
    }
    return t;
  }
  _matches(t, e) {
    if (e.id !== void 0 && t.id !== e.id || e.property !== void 0 && t.property !== e.property || e.target !== void 0 && !U(t).includes(e.target)) return !1;
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
function vi(s) {
  return j(s) ? {
    id: s.id,
    target: s.target,
    property: s.property,
    kind: "inertia",
    inertia: Ke(s.inertia),
    ...X(s)
  } : z(s) ? {
    id: s.id,
    target: s.target,
    property: s.property,
    kind: "spring",
    spring: { ...s.spring },
    ...X(s)
  } : Wt(s) ? {
    id: s.id,
    target: s.target,
    property: "text",
    textConfig: { ...s.textConfig },
    keyframes: s.keyframes.map(Ft),
    ...X(s)
  } : Re(s) ? {
    id: s.id,
    target: s.target,
    property: "motionPath",
    motionPathConfig: { ...s.motionPathConfig },
    keyframes: s.keyframes.map(Ft),
    ...X(s)
  } : {
    id: s.id,
    target: s.target,
    property: s.property,
    keyframes: s.keyframes.map(Ft),
    ...X(s)
  };
}
function Ke(s) {
  return { ...s, ...Array.isArray(s.end) && { end: [...s.end] } };
}
function Ft(s) {
  return {
    time: s.time,
    value: s.value,
    ...s.easing && { easing: s.easing }
  };
}
function X(s) {
  const t = s.endDelay;
  return {
    ...s.delay !== void 0 && { delay: s.delay },
    ...t !== void 0 && { endDelay: t },
    ...s.targets !== void 0 && { targets: [...s.targets] },
    ...s.stagger !== void 0 && { stagger: { ...s.stagger } }
  };
}
function Ti(s) {
  if (j(s)) {
    const t = s;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "inertia",
      inertia: Ke(t.inertia),
      ...X(t)
    };
  }
  if (z(s)) {
    const t = s;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "spring",
      spring: { ...t.spring },
      ...X(t)
    };
  }
  if (Wt(s)) {
    const t = s;
    return {
      id: t.id,
      target: t.target,
      property: "text",
      textConfig: { ...t.textConfig },
      keyframes: [...t.keyframes].sort((e, i) => e.time - i.time),
      ...X(t)
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
      ...X(t)
    };
  }
  return Nt({
    id: s.id,
    target: s.target,
    property: s.property,
    keyframes: s.keyframes,
    ...X(s)
  });
}
function wi(s) {
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
    tracks: s.tracks.map(vi)
  };
}
function ht(s) {
  return new Ze({
    id: s.id,
    name: s.name,
    config: s.config,
    tracks: s.tracks.map(Ti)
  });
}
function xr(s) {
  return JSON.stringify(wi(s));
}
function Ar(s) {
  const t = JSON.parse(s);
  return ht(t);
}
function Mr(s) {
  let t = 2166136261;
  for (let e = 0; e < s.length; e++)
    t ^= s.charCodeAt(e), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function Si(s) {
  let t = s >>> 0 || 2654435769;
  return {
    seed: s >>> 0,
    next() {
      return t ^= t << 13, t >>>= 0, t ^= t >> 17, t ^= t << 5, t >>>= 0, t / 4294967296;
    }
  };
}
function Qe(s, t, e) {
  return t + s.next() * (e - t);
}
function ki(s, t, e, i) {
  if (i <= 0) return Qe(s, t, e);
  const n = Math.floor((e - t) / i), r = Math.round(s.next() * n);
  return t + r * i;
}
function Pr(s, t) {
  if (t.length !== 0)
    return t[Math.floor(s.next() * t.length)];
}
const Je = /^([+\-*/])=\s*(-?[\d.]+)$/, ts = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function _r(s) {
  return typeof s != "string" ? !1 : Je.test(s.trim()) || ts.test(s.trim());
}
function es(s, t = {}) {
  if (typeof s != "string") return s;
  const e = s.trim(), i = Je.exec(e);
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
  const n = ts.exec(e);
  if (n) {
    if (!t.random)
      throw new Error(
        `resolveValue: "${e}" needs a random source — pass one via context.random`
      );
    const r = Number.parseFloat(n[1]), o = Number.parseFloat(n[2]), a = n[3] !== void 0 ? Number.parseFloat(n[3]) : void 0;
    return a !== void 0 ? ki(t.random, r, o, a) : Qe(t.random, r, o);
  }
  return s;
}
function xi(s, t = 0, e) {
  const i = [];
  let n = t;
  for (const r of s) {
    const o = es(r, { base: n, random: e });
    i.push(o), typeof o == "number" && (n = o);
  }
  return i;
}
class Cr {
  random;
  constructor(t) {
    this.random = Si(t);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(t, e = 0) {
    return es(t, { base: e, random: this.random });
  }
  resolveSequence(t, e = 0) {
    return xi(t, e, this.random);
  }
}
const Ai = 600;
function Mi(s) {
  if (Array.isArray(s)) {
    const [h, d, g, p] = s;
    return { fn: pe(h, d, g, p), bezier: [h, d, g, p] };
  }
  const { segments: t } = et(s);
  if (t.length === 0) throw new Error(`customEase: no curve in "${s}"`);
  const e = t[0].startX, i = t[0].startY, n = t[t.length - 1], r = n.endX - e, o = n.endY - i;
  if (r === 0 || o === 0) throw new Error(`customEase: "${s}" must move along both axes`);
  const a = (h) => (h - e) / r, c = (h) => (h - i) / o;
  if (t.length === 1 && n.type === "C") {
    const [h, d, g, p] = n.points, m = [a(h), c(d), a(g), c(p)];
    return { fn: pe(...m), bezier: m };
  }
  const l = [], u = [], f = Math.max(8, Math.ceil(Ai / t.length));
  for (const h of t)
    for (let d = l.length === 0 ? 0 : 1; d <= f; d++) {
      const [g, p] = Ci(h, d / f);
      l.push(a(g)), u.push(c(p));
    }
  return { fn: Ei(l, u) };
}
function Pi(s = {}) {
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
        const c = i[a] / 2, l = c * c, u = o - c;
        return 1 - (l - u * u);
      }
      o -= i[a];
    }
    return 1;
  };
}
function _i(s = {}) {
  const t = Math.max(1, s.wiggles ?? 10), e = s.type ?? "easeOut", i = (n) => e === "uniform" ? 1 : e === "easeInOut" ? Math.sin(Math.PI * n) : (1 - n) ** 2;
  return (n) => n <= 0 || n >= 1 ? 0 : Math.sin(n * t * Math.PI * 2) * i(n);
}
function Ci(s, t) {
  if (s.type === "L") {
    const [l, u] = s.points;
    return [s.startX + (l - s.startX) * t, s.startY + (u - s.startY) * t];
  }
  const [e, i, n, r, o, a] = s.points, c = 1 - t;
  return [
    c * c * c * s.startX + 3 * c * c * t * e + 3 * c * t * t * n + t * t * t * o,
    c * c * c * s.startY + 3 * c * c * t * i + 3 * c * t * t * r + t * t * t * a
  ];
}
function Ei(s, t) {
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
function pe(s, t, e, i) {
  const n = (o, a, c) => 3 * (1 - o) * (1 - o) * o * a + 3 * (1 - o) * o * o * c + o * o * o, r = (o, a, c) => 3 * (1 - o) * (1 - o) * a + 6 * (1 - o) * o * (c - a) + 3 * o * o * (1 - c);
  return (o) => {
    if (o <= 0) return 0;
    if (o >= 1) return 1;
    let a = o;
    for (let u = 0; u < 8; u++) {
      const f = n(a, s, e) - o, h = r(a, s, e);
      if (Math.abs(f) < 1e-6) return n(a, t, i);
      if (Math.abs(h) < 1e-6) break;
      a -= f / h;
    }
    let c = 0, l = 1;
    a = o;
    for (let u = 0; u < 40; u++)
      n(a, s, e) < o ? c = a : l = a, a = (c + l) / 2;
    return n(a, t, i);
  };
}
const O = (s) => Math.round(s * 1e3) / 1e3;
function $i(s, t = {}) {
  if (s.length === 0) return "";
  const e = t.curviness ?? 1, i = t.closed ?? !1, n = s.length;
  let r = `M${O(s[0].x)} ${O(s[0].y)}`;
  if (n === 1) return r;
  const o = (c) => i ? s[(c % n + n) % n] : s[Math.max(0, Math.min(n - 1, c))], a = i ? n : n - 1;
  for (let c = 0; c < a; c++) {
    const l = o(c - 1), u = o(c), f = o(c + 1), h = o(c + 2);
    if (e === 0) {
      r += ` L${O(f.x)} ${O(f.y)}`;
      continue;
    }
    const d = e / 6, g = u.x + (f.x - l.x) * d, p = u.y + (f.y - l.y) * d, m = f.x - (h.x - u.x) * d, y = f.y - (h.y - u.y) * d;
    r += ` C${O(g)} ${O(p)} ${O(m)} ${O(y)} ${O(f.x)} ${O(f.y)}`;
  }
  return i ? `${r} Z` : r;
}
const E = (s, t = 0) => {
  const e = parseFloat(s ?? "");
  return Number.isFinite(e) ? e : t;
};
function Ii(s) {
  const t = (s ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), e = [];
  for (let i = 0; i + 1 < t.length; i += 2) e.push({ x: t[i], y: t[i + 1] });
  return e;
}
function Gt(s) {
  const t = s.attributes;
  switch (s.tag.toLowerCase()) {
    case "path":
      return t.d ?? null;
    case "circle":
    case "ellipse": {
      const e = E(t.cx), i = E(t.cy), n = s.tag.toLowerCase() === "circle" ? E(t.r) : E(t.rx), r = s.tag.toLowerCase() === "circle" ? E(t.r) : E(t.ry);
      return `M${e + n} ${i} A${n} ${r} 0 1 1 ${e - n} ${i} A${n} ${r} 0 1 1 ${e + n} ${i} Z`;
    }
    case "rect": {
      const e = E(t.x), i = E(t.y), n = E(t.width), r = E(t.height);
      let o = t.rx != null ? E(t.rx) : t.ry != null ? E(t.ry) : 0, a = t.ry != null ? E(t.ry) : o;
      return o = Math.min(o, n / 2), a = Math.min(a, r / 2), o === 0 || a === 0 ? `M${e} ${i} H${e + n} V${i + r} H${e} Z` : `M${e + o} ${i} H${e + n - o} A${o} ${a} 0 0 1 ${e + n} ${i + a} V${i + r - a} A${o} ${a} 0 0 1 ${e + n - o} ${i + r} H${e + o} A${o} ${a} 0 0 1 ${e} ${i + r - a} V${i + a} A${o} ${a} 0 0 1 ${e + o} ${i} Z`;
    }
    case "line":
      return `M${E(t.x1)} ${E(t.y1)} L${E(t.x2)} ${E(t.y2)}`;
    case "polyline":
    case "polygon": {
      const e = Ii(t.points);
      if (e.length === 0) return null;
      const i = e.map((n, r) => `${r === 0 ? "M" : "L"}${n.x} ${n.y}`).join(" ");
      return s.tag.toLowerCase() === "polygon" ? `${i} Z` : i;
    }
    default:
      return null;
  }
}
const me = {
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
}, ge = {
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
function Fi(s) {
  let t = s.trim().toLowerCase();
  return t = t.replace(/\.ease(in|out|inout)$/, ".$1"), !t.includes(".") && !t.startsWith("steps") && t !== "none" && t !== "linear" && (t = `${t}.out`), t;
}
function Ht(s = 1, t = 0.3) {
  return (e) => {
    if (e === 0 || e === 1) return e;
    const i = t / (2 * Math.PI) * Math.asin(1 / Math.max(1, s));
    return s * Math.pow(2, -10 * e) * Math.sin((e - i) * (2 * Math.PI) / t) + 1;
  };
}
function ss(s = 1, t = 0.3) {
  const e = Ht(s, t);
  return (i) => 1 - e(1 - i);
}
function Ri(s = 1, t = 0.3) {
  const e = ss(s, t), i = Ht(s, t);
  return (n) => n < 0.5 ? e(n * 2) / 2 : i(n * 2 - 1) / 2 + 0.5;
}
const Zt = (s) => {
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
}, is = (s) => 1 - Zt(1 - s), Di = (s) => s < 0.5 ? is(s * 2) / 2 : Zt(s * 2 - 1) / 2 + 0.5;
function Li(s) {
  const t = Math.max(1, Math.floor(s));
  return (e) => Math.min(1, Math.floor(e * t) / (t - 1 || 1));
}
function Yt(s) {
  const t = ns.get(s.trim().toLowerCase());
  if (t) return t;
  const e = Fi(s), i = /^steps\(\s*(\d+)\s*\)$/.exec(e);
  if (i)
    return { fn: Li(Number.parseInt(i[1], 10)), requiresBaking: "steps" };
  if (e.startsWith("elastic")) {
    const n = e.split(".")[1] ?? "out";
    return { fn: n === "in" ? ss() : n === "inout" ? Ri() : Ht(), requiresBaking: "elastic" };
  }
  if (e.startsWith("bounce")) {
    const n = e.split(".")[1] ?? "out";
    return { fn: n === "in" ? is : n === "inout" ? Di : Zt, requiresBaking: "bounce" };
  }
  return e in ge ? { easing: ge[e] } : e in me ? { easing: { type: "cubic-bezier", points: me[e] } } : { easing: "ease-out" };
}
const ns = /* @__PURE__ */ new Map();
function Kt(s, t) {
  return ns.set(
    s.trim().toLowerCase(),
    t.bezier ? { easing: { type: "cubic-bezier", points: t.bezier }, fn: t.fn } : { fn: t.fn, requiresBaking: "custom" }
  ), s;
}
const Bi = /^([+-])=\s*(-?[\d.]+)$/, Oi = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function Rt(s, t) {
  const e = t.scale ?? 1, i = (l) => Number.parseFloat(l) * e;
  if (s === void 0) return t.cursor;
  if (typeof s == "number") return s * e;
  const n = s.trim();
  if (n === "") return t.cursor;
  const r = Bi.exec(n);
  if (r) {
    const l = i(r[2]);
    return t.cursor + (r[1] === "-" ? -l : l);
  }
  const o = Oi.exec(n);
  if (o) {
    const l = o[1] === "<" ? t.previousStart : t.previousEnd;
    if (o[3] === void 0) return l;
    const u = i(o[3]);
    return l + (o[2] === "-" ? -u : u);
  }
  const a = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(n);
  if (a) {
    const l = t.labels.get(a[1].trim());
    if (l !== void 0) {
      const u = i(a[3]);
      return l + (a[2] === "-" ? -u : u);
    }
  }
  const c = t.labels.get(n);
  return c !== void 0 ? c : /^-?[\d.]+$/.test(n) ? i(n) : t.cursor;
}
const Qt = /* @__PURE__ */ new Set([
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
  "id",
  "immediateRender",
  "overwrite",
  "paused",
  "scrollTrigger",
  "spring"
]);
function Tt(s) {
  const t = {}, e = {};
  for (const [i, n] of Object.entries(s))
    Qt.has(i) ? t[i] = n : e[i] = n;
  return { config: t, properties: e };
}
function qt(s, t) {
  return s === void 0 ? t : s * 1e3;
}
function rs(s) {
  if (s !== void 0)
    return typeof s == "number" ? { each: s * 1e3 } : {
      ...s.each !== void 0 && { each: s.each * 1e3 },
      ...s.amount !== void 0 && { amount: s.amount * 1e3 },
      ...s.from !== void 0 && { from: s.from }
    };
}
const Xi = {
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
function Ni(s) {
  return Xi[s];
}
function Yi(s) {
  const t = typeof s == "string" || Array.isArray(s) ? { path: s } : s;
  if (!t || typeof t.path != "string" && !Array.isArray(t.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let e;
  if (Array.isArray(t.path))
    e = $i(t.path, { curviness: t.curviness });
  else if (pt(t.path))
    e = t.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${t.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const i = { pathData: e };
  return t.autoRotate !== void 0 && t.autoRotate !== !1 && (i.autoRotate = !0, typeof t.autoRotate == "number" && (i.rotateOffset = t.autoRotate)), t.matrix && (i.matrix = t.matrix), { config: i, start: t.start ?? 0, end: t.end ?? 1 };
}
function qi(s) {
  const t = typeof s == "string" || Array.isArray(s) ? { path: s } : { ...s };
  return { ...t, start: t.end ?? 1, end: t.start ?? 0 };
}
function os(s) {
  return typeof s == "object" && s !== null && "shape" in s ? s.shape : s;
}
function Vi(s) {
  if (s.morphSVG === void 0) return s;
  const { morphSVG: t, ...e } = s, i = os(t);
  if (typeof i != "string" || !pt(i))
    throw new Error(
      `gsap-compat: morphSVG "${String(i)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...e, d: i };
}
function Ui(s, t) {
  if (s === !0) return [0, t];
  if (s === !1) return [0, 0];
  if (typeof s == "number") return [0, ye(s, t)];
  const e = s.trim().split(/[\s,]+/).filter(Boolean), i = (o) => {
    const a = Number.parseFloat(o);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${s}" is not a length or percentage`);
    return ye(o.endsWith("%") ? t * a / 100 : a, t);
  };
  if (e.length === 0) return [0, t];
  if (e.length === 1) return [0, i(e[0])];
  const n = i(e[0]), r = i(e[1]);
  return n <= r ? [n, r] : [r, n];
}
function Wi(s, t) {
  const [e, i] = Ui(s, t);
  return { strokeDasharray: [i - e, t], strokeDashoffset: -e };
}
function ji(s, t) {
  if (s.drawSVG === void 0) return s;
  const { drawSVG: e, ...i } = s;
  return { ...i, ...Wi(e, t) };
}
function zi(s) {
  if (s.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return s;
}
function ye(s, t) {
  return Math.max(0, Math.min(t, s));
}
function Gi(s) {
  let t = 2166136261;
  for (let e = 0; e < s.length; e++) t = Math.imul(t ^ s.charCodeAt(e), 16777619);
  return t >>> 0;
}
function Hi(s, t, e) {
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
      seed: n.seed ?? Gi(`${t}|${n.text}`)
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
function as(s) {
  return Math.max(0.1, s / 25);
}
function Zi(s, t) {
  const e = typeof t == "number" ? { velocity: t } : t;
  if (typeof e?.velocity != "number" || !Number.isFinite(e.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const i = e.friction ?? (e.resistance !== void 0 ? as(e.resistance) : void 0), n = {
    from: s,
    velocity: e.velocity,
    ...i !== void 0 && { friction: i },
    ...e.min !== void 0 && { min: e.min },
    ...e.max !== void 0 && { max: e.max }
  };
  return typeof e.end == "function" ? n.end = [e.end(wt(n))] : e.end !== void 0 && (n.end = Array.isArray(e.end) ? [...e.end] : e.end), n;
}
function Ki(s) {
  const t = s === !0 ? {} : typeof s == "string" ? { preset: s } : s;
  if (t.preset !== void 0 && !(t.preset in Pt))
    throw new Error(
      `gsap-compat: unknown spring preset "${t.preset}" — use one of ${Object.keys(Pt).join(", ")}`
    );
  return {
    ...t.preset ? Pt[t.preset] : {},
    ...t.stiffness !== void 0 && { stiffness: t.stiffness },
    ...t.damping !== void 0 && { damping: t.damping },
    ...t.mass !== void 0 && { mass: t.mass },
    ...t.restDelta !== void 0 && { restDelta: t.restDelta }
  };
}
function Qi(s, t) {
  if (s === !0 || typeof s == "string") return;
  const e = s.velocity;
  return typeof e == "number" ? e : e?.[t];
}
class tt {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(t = {}) {
    this.options = t, this.timeline = new Ze({
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
    return this.build(t, void 0, at(e), i);
  }
  /** Animate from the given values to where the property already is. */
  from(t, e, i) {
    const { config: n, properties: r } = Tt(at(e)), { motionPath: o, text: a, scrambleText: c, ...l } = r, u = this.targetsOf(t)[0], f = { ...n };
    for (const g of Object.keys(l))
      f[g] = this.resolveStart(u, g);
    o !== void 0 && (f.motionPath = qi(o));
    const h = {}, d = String(this.resolveStart(u, "text"));
    return a !== void 0 && (h.text = Dt(a), f.text = typeof a == "object" ? { ...a, value: d } : d), c !== void 0 && (h.text = Dt(c), f.scrambleText = typeof c == "object" ? { ...c, text: d } : d), this.build(t, { ...l, ...h }, f, i);
  }
  /** Animate between two explicit sets of values. */
  fromTo(t, e, i, n) {
    const { properties: r } = Tt(at(e));
    return this.build(t, r, at(i), n);
  }
  /** Set values instantly — a single held keyframe. */
  set(t, e, i) {
    return this.build(t, void 0, { ...at(e), duration: 0 }, i);
  }
  // --- sequencing ---------------------------------------------------------
  /** Name a point in time, for use as a position parameter. */
  addLabel(t, e) {
    return this.labels.set(t, Rt(e, this.context())), this;
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
    const i = Rt(e, this.context());
    for (const r of t.timeline.tracks) {
      if (!("keyframes" in r)) continue;
      const o = Nt({
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
    const { config: r, properties: o } = Tt(i), { motionPath: a, text: c, scrambleText: l, inertia: u, ...f } = o, h = this.targetsOf(t), d = Rt(n, this.context()), g = qt(r.delay, 0), p = qt(r.duration, 500), m = rs(r.stagger), y = this.easingFor(r.ease), v = [], T = r.spring;
    let S = 0, b = !1;
    for (const [k, P] of Object.entries(f)) {
      const M = P;
      let _ = e?.[k] !== void 0 ? e[k] : this.resolveStart(h[0], k);
      if (typeof _ != typeof M && (this.warn(
        `no usable start value for "${k}" on "${h[0]}" — it will snap to ${String(M)}. Use fromTo() to animate it.`
      ), _ = M), T !== void 0 && typeof _ == "number" && typeof M == "number") {
        const Y = {
          ...Ki(T),
          from: _,
          to: M,
          velocity: Qi(T, k) ?? this.options.startVelocity?.(h[0], k) ?? 0
        }, it = this.nextTrackId(`${h[0]}-${k}-spring`), mt = {
          id: it,
          target: h[0],
          ...h.length > 1 && { targets: h },
          ...m && h.length > 1 && { stagger: m },
          property: k,
          kind: "spring",
          spring: Y,
          delay: d + g
        };
        this.timeline.addTrack(mt), v.push(it), S = Math.max(S, _s(Y));
        for (const C of h) this.lastValues.set(`${C}|${k}`, M);
        continue;
      }
      b = !0;
      const R = this.keyframesFor(_, M, p, y, r.ease), N = this.nextTrackId(`${h[0]}-${k}`);
      this.timeline.addTrack(
        Nt({
          id: N,
          target: h[0],
          ...h.length > 1 && { targets: h },
          ...m && h.length > 1 && { stagger: m },
          property: k,
          delay: d + g,
          keyframes: R
        })
      ), v.push(N);
      for (const Y of h) this.lastValues.set(`${Y}|${k}`, M);
    }
    const w = Hi({ text: c, scrambleText: l }, h[0], p);
    if (w) {
      const k = e?.text ?? e?.scrambleText, P = k !== void 0 ? Dt(k) : this.resolveStart(h[0], "text"), M = this.nextTrackId(`${h[0]}-text`), _ = {
        id: M,
        target: h[0],
        ...h.length > 1 && { targets: h },
        ...m && h.length > 1 && { stagger: m },
        property: "text",
        textConfig: { from: typeof P == "string" ? P : String(P ?? ""), ...w },
        delay: d + g,
        keyframes: this.keyframesFor(0, 1, p, y, r.ease)
      };
      this.timeline.addTrack(_), v.push(M);
      for (const R of h) this.lastValues.set(`${R}|text`, w.to);
    }
    if (a !== void 0) {
      const { config: k, start: P, end: M } = Yi(a), _ = this.nextTrackId(`${h[0]}-motionPath`), R = {
        id: _,
        target: h[0],
        ...h.length > 1 && { targets: h },
        ...m && h.length > 1 && { stagger: m },
        property: "motionPath",
        motionPathConfig: k,
        delay: d + g,
        keyframes: this.keyframesFor(P, M, p, y, r.ease)
      };
      this.timeline.addTrack(R), v.push(_);
    }
    if (u !== void 0)
      for (const [k, P] of Object.entries(u)) {
        const M = this.resolveStart(h[0], k);
        if (typeof M != "number") {
          this.warn(`inertia on "${k}" needs a numeric start value; skipped`);
          continue;
        }
        const _ = Zi(M, P), R = this.nextTrackId(`${h[0]}-${k}-inertia`), N = {
          id: R,
          target: h[0],
          ...h.length > 1 && { targets: h },
          ...m && h.length > 1 && { stagger: m },
          property: k,
          kind: "inertia",
          inertia: _,
          delay: d + g
        };
        this.timeline.addTrack(N), v.push(R), S = Math.max(S, dt(_));
        for (const Y of h) this.lastValues.set(`${Y}|${k}`, ft(_));
      }
    const B = ((u !== void 0 || T !== void 0) && !b && !w && a === void 0 ? S : Math.max(p, S)) + (m && h.length > 1 ? kt(h.length, m) : 0), A = d + g + B;
    return this.previousStart = d + g, this.previousEnd = A, this.cursor = Math.max(this.cursor, A), {
      trackIds: v,
      start: d + g,
      end: A,
      kill: () => {
        for (const k of v) this.timeline.removeTrack(k);
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
    const a = typeof r == "string" ? Yt(r) : void 0;
    return a?.requiresBaking && (this.options.bakeEases || a.requiresBaking === "custom") && a.fn ? [
      o,
      ...ui(o, { time: i, value: e }, a.fn, {
        intervalMs: this.options.bakeIntervalMs
      })
    ] : (a?.requiresBaking && !this.options.bakeEases && this.warn(
      `ease "${r}" cannot be represented as a cubic-bezier; falling back to a smooth curve. Pass { bakeEases: true } to sample it into keyframes.`
    ), [o, { time: i, value: e, ...n && { easing: n } }]);
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
    const o = Ni(e);
    return o !== void 0 ? (this.warn(
      `no start value for "${e}" on "${t}" — using the static default ${o}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), o) : (this.warn(`no start value or default for "${e}" on "${t}" — using 0`), 0);
  }
  easingFor(t) {
    if (t !== void 0) {
      if (typeof t == "string") return Yt(t).easing;
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
function Dt(s) {
  if (typeof s == "string") return s;
  if (s && typeof s == "object") {
    const t = s;
    return String(t.value ?? t.text ?? "");
  }
  return String(s ?? "");
}
function Ji(s) {
  return new tt(s);
}
function at(s) {
  return zi(Vi(s));
}
const tn = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), en = "#ffffff", sn = "rgba(0, 0, 0, 0.5)";
function nn(s) {
  const t = [];
  if (s.blur !== void 0 && t.push(`blur(${Math.max(0, s.blur)}px)`), s.brightness !== void 0 && t.push(`brightness(${Math.max(0, s.brightness)})`), s.glow !== void 0 && t.push(`drop-shadow(0 0 ${Math.max(0, s.glow)}px ${s.glowColor ?? en})`), s.shadowX !== void 0 || s.shadowY !== void 0 || s.shadowBlur !== void 0) {
    const e = s.shadowX ?? 0, i = s.shadowY ?? 0, n = Math.max(0, s.shadowBlur ?? 0);
    t.push(`drop-shadow(${e}px ${i}px ${n}px ${s.shadowColor ?? sn})`);
  }
  return t.length > 0 ? t.join(" ") : null;
}
function rn(s, t) {
  const e = s.childNodes.length === 1 ? s.firstChild : null;
  if (e && e.nodeType === 3) {
    const i = e;
    i.data !== t && (i.data = t);
    return;
  }
  s.textContent !== t && (s.textContent = t);
}
function on(s) {
  if (!("ownerSVGElement" in s)) return;
  const t = s.style;
  !t || t.transformBox || (t.transformBox = "fill-box", t.transformOrigin || (t.transformOrigin = "50% 50%"));
}
const be = /* @__PURE__ */ new Set([
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
]), an = /* @__PURE__ */ new Set([
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
]), cn = /* @__PURE__ */ new Set(["originX", "originY"]), ln = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), hn = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
};
class W {
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
    for (const [h, d] of e)
      if (!(h === "x" && a) && !(h === "y" && c) && !((h === "rotate" || h === "rotateZ") && l)) {
        if (an.has(h)) {
          const g = this.buildTransformPart(h, d);
          g && i.push(g);
        } else if (cn.has(h))
          typeof d == "number" && ((n ??= {})[h] = d);
        else if (ln.has(h))
          typeof d == "number" && ((r ??= {})[h] = d);
        else if (tn.has(h))
          (o ??= {})[h] = d;
        else if (h !== "perspective") {
          if (h !== "shine") if (h === "text" && typeof d == "string")
            rn(t, d);
          else if (h === "d" && typeof d == "string") {
            const g = t;
            (g.tagName?.toLowerCase() === "path" ? g : g.querySelector?.("path"))?.setAttribute?.("d", d);
          } else
            this.applyStyleProperty(t, h, d);
        }
      }
    const u = e.get("shine");
    typeof u == "number" && this.applyShine(t, u);
    const f = e.get("perspective");
    if (typeof f == "number" && i.unshift(`perspective(${f}px)`), i.length > 0 && (t.style.transform = i.join(" "), on(t)), n) {
      const h = n.originX ?? 50, d = n.originY ?? 50;
      t.style.transformOrigin = `${h}% ${d}%`;
    }
    if (r) {
      const h = r.clipTop ?? 0, d = r.clipRight ?? 0, g = r.clipBottom ?? 0, p = r.clipLeft ?? 0;
      t.style.clipPath = `inset(${h}% ${d}% ${g}% ${p}%)`;
    }
    if (o) {
      const h = nn(o);
      h && (t.style.filter = h);
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
    e === "fill" && t.dataset.elementType === "text" ? n = "color" : n = hn[e] ?? e;
    let r;
    typeof i == "number" ? be.has(e) || be.has(n) ? r = `${i}px` : r = String(i) : Array.isArray(i) ? r = i.join(", ") : r = i, t.style[n] = r;
  }
}
const un = {
  request: (s) => requestAnimationFrame(s),
  cancel: (s) => cancelAnimationFrame(s)
};
class fn {
  adapter = new W();
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
    this.scheduler = t.scheduler ?? un, this.rootOption = t.root;
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
      Lt(i) && this.currentCollector?.touch(i, n), e.push(n);
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
    this.active.clear(), this.stopLoop(), this.adapter.clearTargets(), this.elements.clear(), this.names = /* @__PURE__ */ new WeakMap(), this.objects.clear(), this.objectNames = /* @__PURE__ */ new WeakMap(), this.tickerCallbacks.clear(), this.applied.clear(), this.dirty.clear();
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
    for (const [e, i] of [...this.active])
      e.duration <= 0 ? (this.write(e.getStateAtTime(0)), e.stop()) : e.tick(t), i.onUpdate?.(), e.playbackState !== "playing" && this.active.delete(e);
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
    if (Lt(t)) return [t];
    if (!dn(t)) return [t];
    const e = [];
    for (const i of Array.from(t))
      e.push(...this.targetsOf(i));
    return e;
  }
  nameFor(t) {
    return Lt(t) ? this.elementName(t) : this.objectName(t);
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
function Lt(s) {
  return typeof s == "object" && s !== null && s.nodeType === 1;
}
function dn(s) {
  if (Array.isArray(s)) return !0;
  const t = s;
  return typeof t.length == "number" && typeof t.item == "function";
}
function St(s) {
  const t = s.style;
  if (!t) return s.getBoundingClientRect();
  const e = t.transform;
  t.transform = "none";
  const i = s.getBoundingClientRect();
  return t.transform = e, i;
}
const ve = (s) => typeof s == "object" && s !== null && s.nodeType === 1;
function pn(s) {
  const t = {};
  for (const e of Array.from(s.attributes)) t[e.name] = e.value;
  return t;
}
function mn(s) {
  const t = s.getScreenCTM?.();
  if (t) return [t.a, t.b, t.c, t.d, t.e, t.f];
  const e = s.getBoundingClientRect();
  return [1, 0, 0, 1, e.left, e.top];
}
function gn(s, t) {
  const e = typeof s == "string" || Array.isArray(s) || ve(s) ? { path: s } : s, { align: i, alignOrigin: n, path: r, ...o } = e, a = (w) => {
    const x = ve(w) ? w : t.query(w);
    return x || t.warn(`gsap-compat: motionPath could not find "${String(w)}"`), x;
  };
  let c = null, l = "";
  if (Array.isArray(r) || typeof r == "string" && pt(r))
    l = r;
  else {
    c = a(r);
    const w = c && Gt({ tag: c.localName, attributes: pn(c) });
    c && !w && t.warn(`gsap-compat: motionPath element <${c.localName}> has no path geometry`), l = w ?? "";
  }
  const u = { ...o, path: l };
  if (i === void 0 || i === !1) return u;
  const f = i === !0 ? c : a(i);
  if (!f)
    return i === !0 && t.warn("gsap-compat: motionPath align: true needs the path to be an element"), u;
  const h = t.targets[0];
  if (!h) return u;
  const [d, g, p, m, y, v] = mn(f), T = St(h), [S, b] = n ?? [0.5, 0.5];
  for (const w of t.targets.slice(1)) {
    const x = St(w);
    if (Math.abs(x.left - T.left) > 0.5 || Math.abs(x.top - T.top) > 0.5) {
      t.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return u.matrix = [d, g, p, m, y - T.left - S * T.width, v - T.top - b * T.height], u;
}
const cs = (s) => typeof s == "object" && s !== null && s.nodeType === 1;
function ls(s) {
  const t = {};
  for (const e of Array.from(s.attributes)) t[e.name] = e.value;
  return t;
}
function hs(s) {
  if (!s) return null;
  const t = Gt({ tag: s.localName, attributes: ls(s) });
  return t || (s.querySelector("path")?.getAttribute("d") ?? null);
}
function yn(s, t, e) {
  const i = os(s);
  if (typeof i == "string" && pt(i)) return i;
  const n = cs(i) ? i : typeof i == "string" ? t(i) : null, r = hs(n);
  return r || (e(`gsap-compat: morphSVG could not find a shape for "${String(i)}"`), "");
}
const bn = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function vn(s, t = document) {
  return (typeof s == "string" ? Array.from(t.querySelectorAll(s)) : cs(s) ? [s] : Array.from(s)).map((i) => {
    if (i.localName === "path") return i;
    const n = Gt({ tag: i.localName, attributes: ls(i) });
    if (!n || !i.parentNode) return i;
    const r = i.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const o of Array.from(i.attributes))
      bn.has(o.name) || r.setAttribute(o.name, o.value);
    return r.setAttribute("d", n), i.parentNode.replaceChild(r, i), r;
  });
}
const Te = 0.3;
class Tn {
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
    this.dragging = !0, this.passedTolerance = !1, this.startX = t, this.startY = e, this.lastX = t, this.lastY = e, this.velocityX = 0, this.velocityY = 0, this.lastTime = we(), this.options.onPress?.(this.stateFrom(0, 0, i));
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
    const i = we(), n = Math.max(1, i - this.lastTime);
    this.lastTime = i;
    const r = t / n * 1e3, o = e / n * 1e3;
    this.velocityX += (r - this.velocityX) * Te, this.velocityY += (o - this.velocityY) * Te;
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
function we() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function wn(s, t, e) {
  let i = { delta: 0, line: null }, n = e;
  for (const r of s)
    for (const o of t) {
      const a = Math.abs(o - r);
      a <= n && (n = a, i = { delta: o - r, line: o });
    }
  return i;
}
function Sn(s, t) {
  return t <= 0 ? [] : s.map((e) => Math.round(e / t) * t);
}
class us {
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
    this.options = t, this.x = t.initialX ?? 0, this.y = t.initialY ?? 0, this.observer = new Tn({
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
    const n = (this.options.axis ?? "both") === "y" ? this.y : this.x, r = kn(n / i);
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
      ...Sn([i], this.options.snap ?? 0),
      ...(e === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], r = wn([i], n, this.snapThreshold());
    i += r.delta, e === "x" ? this.snappedX = r.line : this.snappedY = r.line;
    const o = this.options.bounds;
    if (o) {
      const a = e === "x" ? o.minX : o.minY, c = e === "x" ? o.maxX : o.maxY;
      a !== void 0 && (i = Math.max(a, i)), c !== void 0 && (i = Math.min(c, i));
    }
    return i;
  }
}
function kn(s) {
  return s < 0 ? 0 : s > 1 ? 1 : s;
}
function Er(s) {
  const t = new us(s);
  return t.start(), t;
}
const xn = { x: "x", y: "y", "x,y": "both" }, Se = (s) => typeof s == "object" && s !== null && s.nodeType === 1;
function ke(s, t) {
  const e = St(s), i = t.getBoundingClientRect();
  return {
    minX: i.left - e.left,
    maxX: i.right - e.right,
    minY: i.top - e.top,
    maxY: i.bottom - e.bottom
  };
}
function xe(s) {
  return Array.isArray(s) ? [...s] : s;
}
function An(s, t, e, i = {}) {
  const [n] = t.resolveTargets(e), r = n ? t.elementFor(n) : void 0;
  if (!n || !r)
    throw new Error(`gsap-compat: live.draggable could not find ${String(e)}`);
  const o = xn[i.type ?? "x,y"], a = () => {
    const p = t.appliedValue(n, "x"), m = t.appliedValue(n, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof m == "number" ? m : 0 };
  }, c = typeof i.bounds == "string" ? t.query(i.bounds) : Se(i.bounds) ? i.bounds : null, u = { bounds: (!c && i.bounds && !Se(i.bounds) ? i.bounds : void 0) ?? (c ? ke(r, c) : void 0) };
  let f = null;
  const h = () => {
    f?.kill(), f = null;
  }, d = (p) => {
    const m = i.inertia === !0 ? {} : i.inertia, y = m.friction ?? (m.resistance !== void 0 ? as(m.resistance) : 4), v = a(), T = u.bounds ?? {};
    let S, b;
    const w = m.end;
    if (Array.isArray(w)) {
      const $ = wt({ from: v.x, velocity: o === "y" ? 0 : p.x, friction: y }), B = wt({ from: v.y, velocity: o === "x" ? 0 : p.y, friction: y });
      let A = w[0];
      for (const k of w)
        Math.hypot(k.x - $, k.y - B) < Math.hypot(A.x - $, A.y - B) && (A = k);
      A && (S = [A.x], b = [A.y]);
    } else typeof w == "number" ? (S = w, b = w) : w && (S = xe(w.x), b = xe(w.y));
    const x = {};
    o !== "y" && (x.x = { velocity: p.x, friction: y, min: T.minX, max: T.maxX, end: S }), o !== "x" && (x.y = { velocity: p.y, friction: y, min: T.minY, max: T.maxY, end: b }), f = s.to(r, { inertia: x, onComplete: () => i.onThrowComplete?.() });
  }, g = new us({
    target: r,
    axis: o,
    snap: i.snap,
    get bounds() {
      return u.bounds;
    },
    getPosition: a,
    onPress: () => {
      h(), c && (u.bounds = ke(r, c)), i.onPress?.();
    },
    onDrag: (p) => {
      t.apply(n, o === "x" ? { x: p.x } : o === "y" ? { y: p.y } : { x: p.x, y: p.y }), i.onDrag?.(p);
    },
    onRelease: () => {
      const p = g.velocity;
      i.onRelease?.(p), i.inertia && d(p);
    }
  });
  return g.start(), {
    draggable: g,
    get position() {
      return a();
    },
    destroy() {
      h(), g.destroy();
    }
  };
}
const Mn = { opacity: 0, scale: 0.6 };
function Pn(s) {
  const t = s.getBoundingClientRect();
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function Ae(s) {
  const t = St(s);
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function Vt(s, t) {
  const i = s.resolveTargets(t).map((o) => s.elementFor(o)).filter((o) => !!o), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of i) {
    const a = Pn(o);
    n.set(o, a);
    const c = fs(o);
    a && c !== void 0 && !r.has(c) && r.set(c, { element: o, box: a });
  }
  return { elements: i, boxes: n, ids: r };
}
const Bt = /* @__PURE__ */ new WeakMap();
function Ut(s, t, e, i = {}) {
  const n = i.duration ?? 0.6, r = i.ease ?? "power2.inOut", o = i.stagger ?? 0, a = i.scale !== !1, c = i.enter === void 0 ? Mn : i.enter, l = new Set(e.elements);
  if (i.targets !== void 0)
    for (const d of s.resolveTargets(i.targets)) {
      const g = s.elementFor(d);
      g && l.add(g);
    }
  const u = [...l].sort(
    (d, g) => d === g ? 0 : d.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), f = t({ onComplete: i.onComplete });
  let h = 0;
  for (const d of u) {
    const g = Ae(d);
    if (!g) continue;
    let p = e.boxes.get(d) ?? null, m;
    const y = fs(d), v = !p && y !== void 0 ? e.ids.get(y) : void 0;
    v && v.element !== d && (p = v.box, m = v.element);
    const [T] = s.resolveTargets(d);
    Bt.get(d)?.timeline.removeTracks({ target: T });
    const S = h * o;
    if (!p) {
      if (c === !1) continue;
      f.fromTo(d, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...c }, { ...ds(c), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: n, ease: r, delay: S }, 0), Bt.set(d, f), h++;
      continue;
    }
    const b = p.cx - g.cx, w = p.cy - g.cy, x = a ? p.width / g.width : 1, $ = a ? p.height / g.height : 1;
    if (!(Math.abs(b) > 0.5 || Math.abs(w) > 0.5 || Math.abs(x - 1) > 1e-3 || Math.abs($ - 1) > 1e-3)) {
      const k = (P, M) => {
        const _ = s.appliedValue(T, P);
        return typeof _ == "number" && Math.abs(_ - M) > 1e-6;
      };
      (k("x", 0) || k("y", 0) || k("scaleX", 1) || k("scaleY", 1)) && f.set(d, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const A = i.fade === !0 && m !== void 0;
    f.fromTo(
      d,
      { x: b, y: w, scaleX: x, scaleY: $, ...A && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...A && { opacity: 1 }, duration: n, ease: r, delay: S },
      0
    ), A && m && Ae(m) && f.fromTo(m, { opacity: 1 }, { opacity: 0, duration: n, ease: r, delay: S }, 0), Bt.set(d, f), h++;
  }
  return f;
}
function fs(s) {
  return s.dataset?.flipId;
}
function ds(s) {
  const t = {};
  for (const e of Object.keys(s))
    t[e] = e === "opacity" || e.startsWith("scale") ? 1 : 0;
  return t;
}
function _n(s, t = {}) {
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
  const u = () => {
    for (const { element: p, html: m, ariaLabel: y } of r)
      p.innerHTML = m, y === null ? p.removeAttribute("aria-label") : p.setAttribute("aria-label", y);
  }, f = () => {
    a && (a.revert ? a.revert() : a.kill?.(), a = void 0);
  }, h = () => {
    const p = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: m } of r) {
      const y = (m.textContent ?? "").replace(/\s+/g, " ").trim(), v = Cn(m, i.words), T = e.has("chars") ? v.flatMap((w) => En(w, i.chars)) : [], S = e.has("lines") ? In(m, v, i.lines) : [];
      if (n) {
        !m.hasAttribute("aria-label") && y && m.setAttribute("aria-label", y);
        for (const w of v) w.setAttribute("aria-hidden", "true");
      }
      if (e.has("words")) p.words.push(...v);
      else for (const w of v) w.removeAttribute("class");
      p.chars.push(...T), p.lines.push(...S);
      const b = t.mask === "lines" ? S : t.mask === "words" ? v : t.mask === "chars" ? T : [];
      for (const w of b) p.masks.push(Fn(w, `${i[t.mask]}-mask`));
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
      l || (f(), u(), h(), a = t.onSplit?.(d));
    },
    revert() {
      l = !0, c?.disconnect(), f(), u();
    }
  };
  h(), a = t.onSplit?.(d), t.autoSplit && g();
  function g() {
    const p = /* @__PURE__ */ new Map();
    let m = !1;
    const y = () => {
      if (m) return;
      m = !0;
      const T = () => {
        m = !1, d.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(T) : setTimeout(T, 0);
    };
    if (typeof ResizeObserver == "function") {
      c = new ResizeObserver((T) => {
        let S = !1;
        for (const b of T) {
          const w = Math.round(b.contentRect.width), x = p.get(b.target);
          p.set(b.target, w), x !== void 0 && x !== w && (S = !0);
        }
        S && y();
      });
      for (const T of s) c.observe(T);
    }
    const v = s[0]?.ownerDocument?.fonts;
    v && v.status !== "loaded" && v.ready.then(() => y());
  }
  return d;
}
function Cn(s, t) {
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
      const u = e.createElement("span");
      u.className = t, u.style.display = "inline-block", u.textContent = l, c.appendChild(u), i.push(u);
    }
    o.replaceWith(c);
  }
  return i;
}
function En(s, t) {
  const e = s.ownerDocument, i = $n(s.textContent ?? "").map((n) => {
    const r = e.createElement("span");
    return r.className = t, r.style.display = "inline-block", r.textContent = n, r;
  });
  return s.replaceChildren(...i), i;
}
function $n(s) {
  const t = Intl.Segmenter;
  return t ? Array.from(new t(void 0, { granularity: "grapheme" }).segment(s), (e) => e.segment) : Array.from(s);
}
function In(s, t, e) {
  const i = s.ownerDocument, n = new Map(t.map((g) => [g, g.getBoundingClientRect()])), r = [], o = (g) => {
    for (const p of Array.from(g.childNodes))
      p.nodeType === 3 || n.has(p) || p.tagName === "BR" ? r.push(p) : o(p);
  };
  o(s);
  const a = [];
  let c = null, l = 0, u = 0, f = !1, h = [];
  const d = () => {
    c = i.createElement("span"), c.className = e, c.style.display = "block", a.push(c), h = [];
  };
  for (const g of r) {
    if (g.tagName === "BR") {
      f = !0;
      continue;
    }
    const p = n.get(g);
    if (p && (!c || f || p.top > l + u) && (d(), l = p.top, u = p.height / 2, f = !1), !c) continue;
    const m = [];
    for (let T = g.parentNode; T && T !== s; T = T.parentNode) m.unshift(T);
    let y = 0;
    for (; y < h.length && y < m.length && h[y].original === m[y]; ) y++;
    h.length = y;
    let v = y === 0 ? c : h[y - 1].clone;
    for (const T of m.slice(y)) {
      const S = T.cloneNode(!1);
      v.appendChild(S), h.push({ original: T, clone: S }), v = S;
    }
    v.appendChild(g);
  }
  return s.replaceChildren(...a), a;
}
function Fn(s, t) {
  const e = s.ownerDocument.createElement("span");
  return e.className = t, e.style.display = s.style.display === "block" ? "block" : "inline-block", e.style.overflow = "clip", e.style.paddingBottom = "0.12em", e.style.marginBottom = "-0.12em", s.replaceWith(e), e.appendChild(s), e;
}
const Me = {
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
function Pe(s) {
  const t = s.trim().toLowerCase();
  if (t in Me) return Me[t];
  if (t.endsWith("%")) {
    const e = Number.parseFloat(t.slice(0, -1));
    return Number.isNaN(e) ? void 0 : e / 100;
  }
}
function ps(s) {
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
  const n = i[0] !== void 0 ? Pe(i[0]) : void 0, r = i[1] !== void 0 ? Pe(i[1]) : void 0;
  return {
    elementFraction: n ?? 0,
    viewportFraction: r ?? 0,
    offsetPx: t
  };
}
function ut(s, t, e) {
  const i = ps(e), n = i.absolutePx !== void 0 ? s.top + i.absolutePx : s.top + s.height * i.elementFraction, r = t * i.viewportFraction;
  return n - r + i.offsetPx;
}
function $r(s, t, e, i) {
  const n = ut(s, t, e), o = ut(s, t, i) - n;
  return o <= 0 ? n <= 0 ? 1 : 0 : ms(-n / o);
}
function ms(s) {
  return s < 0 ? 0 : s > 1 ? 1 : s === 0 ? 0 : s;
}
function Rn(s, t, e, i) {
  if (e <= 0) return t;
  const n = 1 - Math.exp(-(i / 1e3) / e);
  return s + (t - s) * n;
}
function _e(s, t, e, i, n) {
  const r = (u) => ut({ top: s + n(u), bottom: s + n(u) + t, height: t }, e, i), o = r(0), a = r(1);
  if (Math.sign(o) === Math.sign(a) || o === 0 || a === 0)
    return o === 0 ? 0 : a === 0 ? 1 : Math.abs(o) < Math.abs(a) ? 0 : 1;
  let c = 0, l = 1;
  for (let u = 0; u < 40; u++) {
    const f = (c + l) / 2;
    Math.sign(r(f)) === Math.sign(o) ? c = f : l = f;
  }
  return (c + l) / 2;
}
class Dn {
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
function Ir(s) {
  const t = new Dn(s);
  return t.start(), t;
}
class Ln {
  element;
  spacer;
  saved;
  constructor(t) {
    this.element = t;
    const e = t.ownerDocument;
    this.spacer = e.createElement("div"), this.spacer.className = "pin-spacer", this.saved = { position: t.style.position, top: t.style.top }, t.replaceWith(this.spacer), this.spacer.appendChild(t);
  }
  /**
   * Put the element back in the flow for measuring: unstuck, at the top of its
   * spacer, which is where it sits without pinning. The spacer keeps its height,
   * so the page does not change length and the scroll position is not clamped.
   */
  release() {
    this.element.style.position = this.saved.position, this.element.style.top = this.saved.top;
  }
  /** Stick at `topPx` from the scroller's top for `distancePx` of scrolling. */
  apply(t, e) {
    const i = this.element.offsetHeight;
    this.spacer.style.height = `${i + Math.max(0, e)}px`, this.element.style.position = "sticky", this.element.style.top = `${t}px`;
  }
  /** Remove the spacer and restore the element's own styles. */
  destroy() {
    this.element.style.position = this.saved.position, this.element.style.top = this.saved.top, this.spacer.parentNode && this.spacer.replaceWith(this.element);
  }
}
const Bn = 0.15;
function On(s) {
  return typeof s == "object" && !Array.isArray(s) ? s : { snapTo: s };
}
function Xn(s, t, e) {
  const i = vt(s + t * Bn);
  if (typeof e == "function") return vt(e(i));
  if (typeof e == "number")
    return e <= 0 ? s : vt(Math.round(i / e) * e);
  if (e.length === 0) return s;
  let n = e[0];
  for (const r of e)
    Math.abs(r - i) < Math.abs(n - i) && (n = r);
  return vt(n);
}
function Nn(s, t, e) {
  const i = s.duration ?? { min: 0.2, max: 0.8 };
  if (typeof i == "number") return i;
  const n = Math.min(1, Math.abs(t) / Math.max(1, e));
  return i.min + (i.max - i.min) * n;
}
class Yn {
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
  animate(t, e, i, n = jt, r) {
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
function vt(s) {
  return Math.max(0, Math.min(1, s));
}
class qn {
  options;
  scroller;
  nodes = [];
  scrollerStart;
  scrollerEnd;
  start;
  end;
  constructor(t, e, i) {
    this.options = i === !0 ? {} : i, this.scroller = e;
    const { startColor: n = "#3ecf7a", endColor: r = "#ff5a5a", id: o } = this.options, a = o ? `${o} ` : "", c = (l, u, f) => {
      const h = t.createElement("div");
      return h.textContent = `${a}${l}`, h.setAttribute("aria-hidden", "true"), h.className = "scroll-marker", Object.assign(h.style, {
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
      }), (e ?? t.body).appendChild(h), this.nodes.push(h), h;
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
const Vn = 120, Q = [], gs = () => {
  for (const s of Q) s.refresh();
};
let J = { width: 0, height: 0 };
const Ce = () => {
  const s = window.innerWidth, t = window.innerHeight, e = s === J.width && t !== J.height, i = Math.abs(t - J.height) < J.height * 0.25, n = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  e && i && n || (J = { width: s, height: t }, gs());
};
class Jt {
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
    this.timeline = t.timeline, this.options = t, this.snapper = new Yn((e) => this.scrollTo(e), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const t = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    t && !this.options.container && (this.pin = new Ln(t)), this.options.markers && typeof document < "u" && (this.markers = new qn(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), Q.length === 0 && typeof window < "u" && (J = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", Ce, { passive: !0 })), Q.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), Q.splice(Q.indexOf(this), 1), Q.length === 0 && typeof window < "u" && window.removeEventListener("resize", Ce), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    gs();
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
      if (this.startPx = t + ut(e, i, ct(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(e, i, t), this.pin) {
        const n = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(n.top - (this.startPx - t), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(i) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, t), this.lastScroll = null, this.updateFrom(t, !this.measured), this.measured = !0;
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
    this.targetProgress = i > 0 ? ms((t - this.startPx) / i) : t >= this.startPx ? 1 : 0, this.zone = i > 0 ? t <= this.startPx ? "before" : t >= this.endPx ? "after" : "active" : t >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(n, this.zone), e || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const t = this.options.scrub;
    return typeof t == "number" ? Math.max(0, t) : 0;
  }
  resolveEnd(t, e, i) {
    const n = ct(this.options.end) ?? "bottom top", r = typeof n == "string" ? n.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (r) {
      const o = Number.parseFloat(r[1]);
      return this.startPx + (r[2] === "%" ? e * o / 100 : o);
    }
    return i + ut(t, e, n);
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
    }, Vn));
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
    const e = On(t), i = () => {
      this.snapTimer = null;
      const n = this.endPx - this.startPx, r = this.scrollPosition();
      if (!this.running || n <= 0 || r <= this.startPx || r >= this.endPx) return;
      const o = (r - this.startPx) / n, a = this.startPx + Xn(o, this.releaseVelocity / n, e.snapTo) * n;
      Math.abs(a - r) < 1 || this.snapper.animate(r, a, Nn(e, a - r, this.viewportHeight()), e.ease);
    };
    e.delay ? this.snapTimer = setTimeout(i, e.delay * 1e3) : i();
  }
  scrollTo(t) {
    const e = this.options.scroller;
    e ? typeof e.scrollTo == "function" ? e.scrollTo({ top: t, behavior: "instant" }) : e.scrollTop = t : typeof window < "u" && window.scrollTo({ top: t, behavior: "instant" });
  }
  /**
   * Resolve start and end for a trigger inside a horizontally moving container:
   * find the container progress where each horizontal position fires, and turn
   * it into the container's scroll offsets.
   */
  measureInContainer(t) {
    const e = this.options.trigger;
    if (typeof e?.getBoundingClientRect != "function") return;
    const i = e.getBoundingClientRect(), n = this.options.scroller?.getBoundingClientRect?.().left ?? 0, r = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, o = i.left - n - t.shiftAt(t.progress()), { start: a, end: c } = t.range(), l = (d) => a + d * (c - a), u = _e(o, i.width, r, ct(this.options.start) ?? "left right", t.shiftAt);
    this.startPx = l(u);
    const f = ct(this.options.end) ?? "right left", h = typeof f == "string" ? f.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = h ? this.startPx + Number.parseFloat(h[1]) : l(_e(o, i.width, r, f, t.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(t) {
    const e = (r, o) => {
      const a = ct(r) ?? o;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const c = ps(a);
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
      this.lastFrameTime = e, this.displayProgress = Rn(this.displayProgress, this.targetProgress, this.smoothing(), i);
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
    const t = this.options.scroller;
    return t ? t.scrollTop ?? 0 : typeof window < "u" ? window.scrollY ?? 0 : 0;
  }
  triggerRect() {
    const t = this.options.trigger;
    return typeof t?.getBoundingClientRect != "function" ? null : this.relativeRect(t.getBoundingClientRect());
  }
  /** A viewport rect, relative to the scroll container when there is one. */
  relativeRect(t) {
    const e = this.options.scroller;
    if (e && typeof e.getBoundingClientRect == "function") {
      const i = e.getBoundingClientRect();
      return { top: t.top - i.top, bottom: t.bottom - i.top, height: t.height };
    }
    return { top: t.top, bottom: t.bottom, height: t.height };
  }
  viewportHeight() {
    const t = this.options.scroller;
    return t ? t.clientHeight : typeof window < "u" ? window.innerHeight : 0;
  }
}
function ct(s) {
  return typeof s == "function" ? s() : s;
}
function Fr(s) {
  const t = new Jt(s);
  return t.start(), t;
}
function Un(s, t) {
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
function ys(s, t, e, i, n = () => {
}) {
  const r = (d) => typeof d == "string" ? s.query(d) ?? void 0 : d, o = r(t.trigger) ?? i;
  if (!o) {
    n(`gsap-compat: scrollTrigger has no trigger element${typeof t.trigger == "string" ? ` for "${t.trigger}"` : ""}`);
    return;
  }
  const a = t.scrub === void 0 || t.scrub === !1 ? !1 : t.scrub, c = (t.toggleActions ?? "play none none none").trim().split(/\s+/);
  let l = 0, u;
  const f = (d, g) => () => {
    g?.(), e && !a && Un(e, c[d] ?? "none"), t.once && d === 0 && queueMicrotask(() => u.destroy());
  }, h = t.containerAnimation ? zn(s, t.containerAnimation, o, n) : void 0;
  return u = new Jt({
    trigger: o,
    start: t.start,
    end: t.end,
    scrub: a === !1 ? void 0 : a,
    pin: t.pin === !0 ? !0 : r(t.pin),
    scroller: r(t.scroller),
    onRefresh: t.invalidateOnRefresh && e?.invalidate ? () => e.invalidate() : void 0,
    snap: t.snap === void 0 ? void 0 : Wn(t.snap, e),
    markers: t.markers,
    container: h,
    onUpdate: (d, g) => {
      if (e && a !== !1 && e.progress(d), t.onUpdate) {
        const p = d < l || g < 0 ? -1 : 1;
        t.onUpdate({ progress: d, velocity: g, direction: p });
      }
      l = d;
    },
    onEnter: f(0, t.onEnter),
    onLeave: f(1, t.onLeave),
    onEnterBack: f(2, t.onEnterBack),
    onLeaveBack: f(3, t.onLeaveBack)
  }), e && a === !1 && e.progress(0), u.start(), s.own(u);
}
function Wn(s, t) {
  const e = (n) => n === "labels" ? (r) => jn(r, t?.labelProgresses?.() ?? []) : n;
  if (typeof s != "object" || Array.isArray(s)) return e(s);
  const i = s.ease ? Yt(s.ease) : void 0;
  return {
    snapTo: e(s.snapTo),
    duration: s.duration,
    delay: s.delay,
    ease: i ? i.fn ?? zt(i.easing) : void 0
  };
}
function jn(s, t) {
  return t.reduce((e, i) => Math.abs(i - s) < Math.abs(e - s) ? i : e, t[0] ?? s);
}
function zn(s, t, e, i) {
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
class bs {
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
class Gn {
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
    const r = new bs(this.host, this.scope);
    r.conditions = e, r.add(() => t.setup(r)), t.context = r;
  }
}
class Hn {
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
const Zn = { opacity: 0, y: -16 }, Kn = { opacity: 0, y: 16 };
async function Qn(s, t, e, i) {
  const n = t.collector?.scope ?? t.root, r = n.ownerDocument ?? n, o = () => i.shared ? [...n.querySelectorAll(i.shared)] : [];
  if (i.native && typeof r.startViewTransition == "function")
    return Jn(r, i, o);
  const a = i.duration ?? 0.35, c = i.ease ?? "power2.inOut", l = (m) => new Promise((y) => {
    m(y) || y();
  }), u = o(), f = u.length ? Vt(t, u) : void 0, h = i.from !== void 0 ? Ee(t, i.from, i.shared) : [];
  if (h.length && i.leave !== !1) {
    const m = i.leave ?? Zn;
    await l((y) => s.to(h, { ...m, duration: a, ease: c, onComplete: y }));
  }
  await i.update();
  const d = [], g = typeof i.to == "function" ? i.to() : i.to, p = g !== void 0 ? Ee(t, g, i.shared) : [];
  if (p.length && i.enter !== !1) {
    const m = i.enter ?? Kn;
    d.push(l((y) => s.fromTo(p, m, { ...ds(m), duration: a, ease: c, onComplete: y })));
  }
  if (f) {
    const m = o().filter((y) => !u.includes(y));
    m.length && d.push(
      l(
        (y) => Ut(t, e, f, {
          targets: m,
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
function Ee(s, t, e) {
  const i = s.resolveTargets(t).map((n) => s.elementFor(n)).filter((n) => !!n);
  return e ? i.flatMap((n) => !n.querySelector(e) && !n.matches(e) ? [n] : [...n.children].filter((r) => !r.matches(e) && !r.querySelector(e))) : i;
}
async function Jn(s, t, e) {
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
const tr = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (s, t) => Kt(s, Mi(t))
}, er = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (s, t) => Kt(s, { fn: Pi(t) })
}, sr = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (s, t) => Kt(s, { fn: _i(t) })
};
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
  constructor(t, e = {}) {
    if (this.stage = t, this.options = e, this.compat = new tt({
      ...e,
      startValue: (i, n) => {
        const r = t.objectFor(i);
        if (r) return or(r[n]);
        const o = t.appliedValue(i, n);
        if (o !== void 0) return o;
        if (n === "d") return hs(t.elementFor(i)) ?? void 0;
        if (n === "text") return t.elementFor(i)?.textContent ?? void 0;
        if (n === "strokeDasharray" || n === "strokeDashoffset") {
          const a = Ie(t.elementFor(i));
          if (a !== void 0) return n === "strokeDasharray" ? [a, a] : 0;
        }
      },
      startVelocity: (i, n) => t.velocityOf(i, n)
    }), this.compat.timeline.onComplete = () => e.onComplete?.(), t.collector?.track(this), this.autoplayPending = !e.paused && !e.scrollTrigger, e.scrollTrigger) {
      const i = e.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = ys(t, i, this, this.firstElement, (n) => e.onWarning?.(n)));
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
    return this.record(() => this.tween(t, [e], i, ([n], r, o) => this.compat.to(r, n, o)));
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
    this.compat.progress(0), this.stage.render(this.timeline), this.compat.reset();
    for (const e of this.recipe) e();
    return this.compat.progress(t), this.stage.render(this.timeline), this;
  }
  // --- playback -----------------------------------------------------------
  play() {
    return this.autoplayPending = !1, this.started || (this.started = !0, this.options.onStart?.()), this.timeline.play(), this.stage.render(this.timeline), this.stage.activate(this.timeline, { onUpdate: this.options.onUpdate }), this;
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
    return this.timeline.stop(), this.play();
  }
  /** Flip direction and keep playing (from the end, if already finished). */
  reverse() {
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
    return this.autoplayPending = !1, this.compat.seek(t), this.stage.render(this.timeline), this.options.onUpdate?.(), this;
  }
  /** Read or set progress, 0..1. Setting applies immediately. */
  progress(t) {
    if (t === void 0) return this.compat.progress();
    this.autoplayPending = !1;
    const e = this.compat.progress(t);
    return this.stage.render(this.timeline), this.options.onUpdate?.(), e;
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
    return this.killed = !0, this.scrollDriver?.destroy(), this.scrollDriver = void 0, this.autoplayPending = !1, this.timeline.stop(), this.stage.deactivate(this.timeline), this.compat.kill(), this;
  }
  /** The compiled animation, as plain JSON. */
  toDefinition() {
    return this.compat.toDefinition();
  }
  /** Run a building step now, and keep it so `invalidate()` can run it again. */
  record(t) {
    return this.recipe.push(t), t(), this;
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
    if (!(r.length > 1 && (e.some(rr) || r.some((h) => this.stage.objectFor(h) !== void 0)))) {
      const h = this.targetFor(r[0]);
      n(e.map((d) => this.prepare($e(d, 0, h), r)), r, i);
      return;
    }
    const a = e.length - 1, { stagger: c, ...l } = e[a], u = rs(c), f = u ? Be(r.length, u).map((h) => h / 1e3) : r.map(() => 0);
    r.forEach((h, d) => {
      const g = d === 0 ? qt(l.delay, 0) / 1e3 + f[0] : 0, p = d === 0 ? 0 : f[d] - f[d - 1], m = d === 0 ? i : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, v = e.map((T, S) => S === a ? { ...l, delay: g } : T).map((T) => this.prepare($e(T, d, this.targetFor(h)), [h]));
      n(v, [h], m);
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
      const o = gn(t.motionPath, {
        query: n,
        targets: e.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: i
      });
      r = { ...r, motionPath: o };
    }
    if (t.morphSVG !== void 0) {
      const o = yn(t.morphSVG, n, i), { morphSVG: a, ...c } = r;
      r = o ? { ...r, morphSVG: o } : c;
    }
    if (t.drawSVG !== void 0) {
      const o = Ie(this.stage.elementFor(e[0]));
      if (o === void 0) {
        i("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...c } = r;
        r = c;
      } else
        r = ji(r, o);
    }
    return r;
  }
  resolve(t) {
    const e = this.stage.resolveTargets(t);
    if (e.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${ar(t)}`);
      return;
    }
    return this.firstElement ??= e.map((i) => this.stage.elementFor(i)).find((i) => i !== void 0), e;
  }
}
function ir(s = new fn()) {
  const t = (n) => {
    const { config: r } = Tt(n);
    return new H(s, {
      repeat: r.repeat,
      yoyo: r.yoyo,
      repeatDelay: r.repeatDelay,
      paused: r.paused,
      onStart: r.onStart,
      onUpdate: r.onUpdate,
      onComplete: r.onComplete,
      scrollTrigger: r.scrollTrigger
    });
  }, e = (n) => (n && s.collector?.track(n), n), i = {
    stage: s,
    ticker: s.ticker,
    scrollTrigger: (n) => e(ys(s, n)),
    refreshScroll: () => Jt.refreshAll(),
    context: (n, r) => {
      const o = new bs(s, r);
      return n && o.add(() => n(o)), o;
    },
    matchMedia: (n) => new Gn(s, n),
    customEase: tr.create,
    customBounce: er.create,
    customWiggle: sr.create,
    pageTransition: (n) => Qn(i, s, (r) => new H(s, r), n),
    imageSequence: (n, r) => {
      const o = typeof n == "string" ? (s.collector?.scope ?? s.root).querySelector(n) : n;
      if (!(o instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(n)}`);
      return e(new Hn(o, r));
    },
    quickTo: (n, r, o = {}) => {
      const a = new H(s, { paused: !0 }), [c] = s.resolveTargets(n);
      return Object.assign((u) => {
        if (!c) return;
        const f = o.spring !== void 0 ? s.velocityOf(c, r) ?? 0 : 0;
        a.compat.reset(), a.compat.to(c, {
          [r]: u,
          duration: o.duration ?? 0.4,
          ease: o.ease ?? "power3.out",
          ...o.spring !== void 0 && { spring: nr(o.spring, r, f) }
        }), a.timeline.stop(), a.timeline.play(), s.activate(a.timeline);
      }, { tween: a, kill: () => a.kill() });
    },
    timeline: (n) => new H(s, n),
    to: (n, r) => t(r).to(n, r),
    from: (n, r) => t(r).from(n, r),
    fromTo: (n, r, o) => t(o).fromTo(n, r, o),
    set: (n, r) => t(r).set(n, r),
    convertToPath: (n) => vn(n, s.root),
    splitText: (n, r) => {
      const o = s.collector?.scope ?? s.root, a = typeof n == "string" ? Array.from(o.querySelectorAll(n)) : "nodeType" in n ? [n] : Array.from(n);
      return e(_n(a, r));
    },
    draggable: (n, r) => e(An(i, s, n, r)),
    getFlipState: (n) => Vt(s, n),
    flipFrom: (n, r) => Ut(s, (o) => new H(s, o), n, r),
    flip: (n, r, o) => {
      const a = Vt(s, n);
      return r(), Ut(s, (c) => new H(s, c), a, { targets: n, ...o });
    }
  };
  return i;
}
const D = /* @__PURE__ */ ir();
function nr(s, t, e) {
  return s === !0 ? { velocity: { [t]: e } } : typeof s == "string" ? { preset: s, velocity: { [t]: e } } : { ...s, velocity: { [t]: e } };
}
function rr(s) {
  return s.morphSVG !== void 0 || s.drawSVG !== void 0 || s.text !== void 0 || s.scrambleText !== void 0 || vs(s);
}
function vs(s) {
  return Object.entries(s).some(([t, e]) => typeof e == "function" && !Qt.has(t));
}
function $e(s, t, e) {
  if (!vs(s)) return s;
  const i = {};
  for (const [n, r] of Object.entries(s))
    i[n] = typeof r == "function" && !Qt.has(n) ? r(t, e) : r;
  return i;
}
function Ie(s) {
  const t = s;
  if (typeof t?.getTotalLength == "function")
    return t.getTotalLength();
}
function or(s) {
  if (typeof s == "number" || typeof s == "string" || Array.isArray(s) && s.every((t) => typeof t == "number")) return s;
}
function ar(s) {
  return typeof s == "string" ? `"${s}"` : String(s);
}
class Fe {
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
function cr(s, t, e, i, n) {
  const r = e - n;
  if (r < 0) {
    t.paused || t.pause(), t.currentTime = 0;
    return;
  }
  s.update(r, i);
}
class Ts {
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
    this.options = e, this.adapter = new W();
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
    this.options.speed !== void 0 && (e.config = { ...e.config, speed: this.options.speed }), this.options.loop !== void 0 && (e.config = { ...e.config, loop: this.options.loop }), this.options.alternate !== void 0 && (e.config = { ...e.config, alternate: this.options.alternate }), this.timeline = ht(e), this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia(), this.options.autoplay && this.play();
  }
  /**
   * Find embedded media elements (`[data-tinyfly-media]`) in the container and
   * bind each to the timeline. Emitted by the editor's export for audio/video
   * scene elements; the `data-tinyfly-start` attribute sets when each begins.
   */
  scanMedia() {
    this.mediaTargets = [], this.container.querySelectorAll("[data-tinyfly-media]").forEach((e) => {
      const i = e, n = Number(i.getAttribute("data-tinyfly-start") ?? "0") || 0, r = i.getAttribute("data-volume");
      r !== null && (i.volume = Math.max(0, Math.min(1, Number(r) || 0))), this.mediaTargets.push({ el: i, startTime: n, sync: new Fe(i) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(t, e) {
    for (const i of this.mediaTargets)
      cr(i.sync, i.el, t, e, i.startTime);
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
      const o = new W();
      i.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const c = a.getAttribute("data-tinyfly");
        c && o.registerTarget(c, a);
      }), this.symbolInstances.push({ adapter: o, timeline: ht(r.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(t, e) {
    this.mediaSync = new Fe(t, e), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
async function Rr(s, t, e = {}) {
  const i = new Ts(s, { ...e, autoplay: !0 });
  return await i.load(t), i;
}
function Dr(s, t = {}) {
  return new Ts(s, t);
}
class lr {
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
    this.options = e, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new W(), this.adapterB = new W();
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
      const a = new W();
      n.querySelectorAll("[data-tinyfly]").forEach((c) => {
        const l = c.getAttribute("data-tinyfly");
        l && a.registerTarget(l, c);
      }), i.push({ adapter: a, timeline: ht(o) });
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
    return t.timeline ? ht(t.timeline) : null;
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
async function Lr(s, t, e = {}) {
  const i = new lr(s, { ...e, autoplay: !0 });
  return await i.load(t), i;
}
const Br = { type: "none", duration: 0 };
function Or(s) {
  const { timeline: t } = s, e = new W();
  for (const [l, u] of Object.entries(s.targets)) {
    const f = typeof u == "string" ? document.querySelector(u) : u;
    if (!f)
      throw new Error(`quickPlay: no element found for target "${l}" (${String(u)})`);
    e.registerTarget(l, f);
  }
  t.onUpdate = (l) => {
    e.applyState(l), s.onUpdate?.(l);
  }, s.onComplete && (t.onComplete = s.onComplete);
  let i = null, n = null, r = !1;
  const o = (l) => {
    if (r) return;
    const u = n === null ? 0 : l - n;
    n = l, u > 0 && t.tick(u), i = requestAnimationFrame(o);
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
const Xr = {
  timeline: Ji,
  to(s, t, e) {
    const i = new tt(e);
    return i.to(s, t), i;
  },
  from(s, t, e) {
    const i = new tt(e);
    return i.from(s, t), i;
  },
  fromTo(s, t, e, i) {
    const n = new tt(i);
    return n.fromTo(s, t, e), n;
  },
  set(s, t, e) {
    const i = new tt(e);
    return i.set(s, t), i;
  }
}, Nr = D.to, Yr = D.from, qr = D.fromTo, Vr = D.set, Ur = D.timeline, Wr = D.ticker, jr = D.splitText, zr = D.context, Gr = D.matchMedia, Hr = D.quickTo, Zr = D.imageSequence, Kr = D.pageTransition;
export {
  fr as Clock,
  tt as CompatTimeline,
  er as CustomBounce,
  tr as CustomEase,
  sr as CustomWiggle,
  We as DEFAULT_BAKE_INTERVAL_MS,
  te as DEFAULT_INERTIA_FRICTION,
  L as DEFAULT_SPRING,
  Br as DEFAULT_TRANSITION,
  us as Draggable,
  $s as INERTIA_MAX_DURATION_MS,
  pi as InertiaTrackPlayer,
  H as LiveTimeline,
  vr as MORPH_SAMPLES,
  ur as ManualClock,
  Fe as MediaSync,
  Tn as Observer,
  Oe as SPRING_MAX_DURATION_MS,
  Pt as SPRING_PRESETS,
  lt as SPRING_STEP_MS,
  Yn as ScrollAnimator,
  Jt as ScrollDriver,
  qn as ScrollMarkers,
  Ln as ScrollPin,
  xt as SpringSampler,
  di as SpringTrackPlayer,
  fn as Stage,
  Ze as Timeline,
  Ts as TinyflyPlayer,
  lr as TinyflySequencer,
  $t as TrackPlayer,
  Cr as ValueResolver,
  Dn as VisibilityDriver,
  ui as bakeEasing,
  ze as bakeInertiaTrack,
  je as bakeSpringTrack,
  gi as charactersFor,
  ms as clamp01,
  Tr as clearMorphCache,
  yr as clearPathCache,
  _e as containerProgressAt,
  zr as context,
  Dr as create,
  Ns as createCubicBezier,
  ir as createLive,
  Si as createRandom,
  Nt as createTrack,
  mr as criticalDamping,
  Pi as customBounce,
  Mi as customEase,
  _i as customWiggle,
  ht as deserializeTimeline,
  Ti as deserializeTrack,
  Er as draggable,
  Ls as easeIn,
  Ne as easeInCubic,
  Os as easeInOut,
  jt as easeInOutCubic,
  Ds as easeInOutQuad,
  Fs as easeInQuad,
  Bs as easeOut,
  Ye as easeOutCubic,
  Rs as easeOutQuad,
  Yr as from,
  Ar as fromJSON,
  qr as fromTo,
  zt as getEasingFunction,
  Ue as getInterpolator,
  He as getMotionPathPoint,
  br as getPathLength,
  Hs as getPointAtProgress,
  Sn as gridLinesFor,
  Ms as hasKeyframes,
  Mr as hashSeed,
  Zr as imageSequence,
  dt as inertiaDuration,
  ft as inertiaRest,
  Ot as inertiaValueAt,
  gr as inertiaVelocityAt,
  li as interpolateArray,
  ci as interpolateColor,
  kr as interpolateMotionPath,
  q as interpolateNumber,
  hi as interpolatePathString,
  de as interpolateString,
  As as isCubicBezierEasing,
  j as isInertiaTrack,
  hr as isMotionPathPoint,
  Re as isMotionPathTrack,
  pt as isPathData,
  z as isSpringTrack,
  Wt as isTextTrack,
  pr as isUnderdamped,
  _r as isUnresolved,
  Xe as linear,
  D as live,
  Yt as mapEase,
  Gr as matchMedia,
  Ps as maxStaggerDistance,
  ri as morphPath,
  wt as naturalRest,
  Kr as pageTransition,
  Pe as parseEdge,
  et as parsePath,
  ps as parseTrigger,
  Rr as play,
  Lr as playSequence,
  Ir as playWhenVisible,
  qe as pointAtDistance,
  $i as pointsToPath,
  Or as quickPlay,
  Hr as quickTo,
  Qe as randomBetween,
  Pr as randomChoice,
  ki as randomSnapped,
  xi as resolveSequence,
  es as resolveValue,
  $r as scrollProgress,
  Fr as scrubOnScroll,
  wi as serializeTimeline,
  vi as serializeTrack,
  Vr as set,
  Gt as shapeToPathData,
  fi as simplifyKeyframes,
  Rn as smoothToward,
  wn as snapAxis,
  On as snapConfig,
  Nn as snapDuration,
  Xn as snapProgress,
  jr as splitText,
  _s as springDuration,
  dr as springValueAt,
  De as staggerDistance,
  Le as staggerOffset,
  Be as staggerOffsets,
  kt as staggerSpan,
  cr as syncMediaElement,
  bi as textAt,
  Xr as tf,
  Wr as ticker,
  Ur as timeline,
  Nr as to,
  xr as toJSON,
  wr as toKeyframedTrack,
  Sr as toKeyframedTracks,
  U as trackTargets,
  ut as triggerDistance
};
