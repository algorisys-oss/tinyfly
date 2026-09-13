function ci(e) {
  return typeof e == "object" && e !== null && e.type === "cubic-bezier";
}
function Nt(e) {
  return e.property === "text" && "textConfig" in e;
}
function j(e) {
  return e.kind === "inertia" && "inertia" in e;
}
function W(e) {
  return e.kind === "spring" && "spring" in e;
}
function ke(e) {
  return e.property === "motionPath" && "motionPathConfig" in e;
}
function Mn(e) {
  return typeof e == "object" && e !== null && "x" in e && "y" in e && "angle" in e;
}
function li(e) {
  return "keyframes" in e;
}
class _n {
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
class Pn {
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
function xe(e, t, i = "start") {
  if (t <= 1) return 0;
  if (typeof i == "number") {
    const s = Math.max(0, Math.min(t - 1, i));
    return Math.abs(e - s);
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
function hi(e, t = "start") {
  if (e <= 1) return 0;
  let i = 0;
  for (let s = 0; s < e; s++)
    i = Math.max(i, xe(s, e, t));
  return i;
}
function Ae(e, t, i) {
  const s = i.from ?? "start", n = xe(e, t, s);
  if (i.amount !== void 0) {
    const r = hi(t, s);
    return r === 0 ? 0 : i.amount * n / r;
  }
  return i.each !== void 0 ? i.each * n : 0;
}
function ui(e, t) {
  return Array.from({ length: e }, (i, s) => Ae(s, e, t));
}
function vt(e, t) {
  return e <= 1 ? 0 : Math.max(...ui(e, t));
}
const rt = 1, Me = 6e4, pt = Me / rt, F = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, xt = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class wt {
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
    this.from = t.from, this.to = t.to, this.stiffness = t.stiffness ?? F.stiffness, this.damping = t.damping ?? F.damping, this.mass = t.mass ?? F.mass, this.restDelta = t.restDelta ?? F.restDelta, this.restSpeed = t.restSpeed ?? F.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = t.velocity ?? F.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const i = Math.floor(t / rt);
    if (this.simulateTo(i + 1), this.settledStep !== null && i >= this.settledStep)
      return this.to;
    const s = this.samples[Math.min(i, this.samples.length - 1)], n = this.samples[Math.min(i + 1, this.samples.length - 1)], r = t / rt - i;
    return s + (n - s) * r;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(pt + 1), this.settledStep !== null ? this.settledStep * rt : Me;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(t) {
    if (this.settledStep !== null) return;
    const i = Math.min(t, pt + 1), s = rt / 1e3;
    for (; this.samples.length < i; ) {
      const n = this.samples[this.samples.length - 1], r = n - this.to, o = -this.stiffness * r, a = -this.damping * this.velocity, c = (o + a) / this.mass;
      this.velocity += c * s;
      const l = n + this.velocity * s;
      if (this.samples.push(l), this.isAtRest(l)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > pt && (this.settledStep = pt);
  }
}
function Cn(e, t) {
  return new wt(e).valueAt(t);
}
function fi(e) {
  return new wt(e).settleTime();
}
function $n(e) {
  const t = e.stiffness ?? F.stiffness, i = e.damping ?? F.damping, s = e.mass ?? F.mass;
  return i < 2 * Math.sqrt(t * s);
}
function En(e) {
  const t = e.stiffness ?? F.stiffness, i = e.mass ?? F.mass;
  return 2 * Math.sqrt(t * i);
}
const Ut = 4, pi = 2e-3, di = 1e-4, mi = 6e4;
function St(e) {
  const t = e.friction ?? Ut;
  return t > 0 ? t : Ut;
}
function yt(e) {
  return e.from + e.velocity / St(e);
}
function gi(e, t) {
  if (t === void 0) return e;
  if (typeof t == "number")
    return t > 0 ? Math.round(e / t) * t : e;
  if (t.length === 0) return e;
  let i = t[0];
  for (const s of t)
    Math.abs(s - e) < Math.abs(i - e) && (i = s);
  return i;
}
function ct(e) {
  let t = gi(yt(e), e.end);
  return e.min !== void 0 && (t = Math.max(e.min, t)), e.max !== void 0 && (t = Math.min(e.max, t)), t;
}
function lt(e) {
  const t = Math.abs(ct(e) - e.from);
  if (t === 0) return 0;
  const i = e.restDelta ?? Math.max(di, t * pi);
  if (i >= t) return 0;
  const s = Math.log(t / i) / St(e);
  return Math.min(mi, s * 1e3);
}
function Ft(e, t) {
  if (t <= 0) return e.from;
  const i = ct(e);
  if (t >= lt(e)) return i;
  const s = St(e);
  return e.from + (i - e.from) * (1 - Math.exp(-s * t / 1e3));
}
function In(e, t) {
  const i = St(e), s = ct(e);
  return t >= lt(e) ? 0 : (s - e.from) * i * Math.exp(-i * Math.max(0, t) / 1e3);
}
const _e = (e) => e, yi = (e) => e * e, bi = (e) => 1 - (1 - e) * (1 - e), Ti = (e) => e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2, Pe = (e) => e * e * e, Ce = (e) => 1 - Math.pow(1 - e, 3), $e = (e) => e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2, vi = Pe, wi = Ce, Si = $e, ki = {
  linear: _e,
  "ease-in": vi,
  "ease-out": wi,
  "ease-in-out": Si,
  "ease-in-quad": yi,
  "ease-out-quad": bi,
  "ease-in-out-quad": Ti,
  "ease-in-cubic": Pe,
  "ease-out-cubic": Ce,
  "ease-in-out-cubic": $e
};
function xi(e) {
  const [t, i, s, n] = e, r = 3 * t, o = 3 * (s - t) - r, a = 1 - r - o, c = 3 * i, l = 3 * (n - i) - c, u = 1 - c - l, f = (d) => ((a * d + o) * d + r) * d, h = (d) => ((u * d + l) * d + c) * d, p = (d) => (3 * a * d + 2 * o) * d + r, g = (d) => {
    let m = d;
    for (let S = 0; S < 8; S++) {
      const k = f(m) - d;
      if (Math.abs(k) < 1e-7)
        return m;
      const b = p(m);
      if (Math.abs(b) < 1e-7)
        break;
      m -= k / b;
    }
    let y = 0, v = 1;
    for (m = d; y < v; ) {
      const S = f(m);
      if (Math.abs(S - d) < 1e-7)
        return m;
      d > S ? y = m : v = m, m = (y + v) / 2;
    }
    return m;
  };
  return (d) => {
    if (d <= 0) return 0;
    if (d >= 1) return 1;
    const m = g(d);
    return h(m);
  };
}
function Ee(e) {
  return e === void 0 ? _e : ci(e) ? xi(e.points) : ki[e];
}
const jt = 32, Ai = 256, z = /* @__PURE__ */ new Map(), Mi = /[MmLlHhVvCcSsQqTtAaZz]/, _i = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, Pi = {
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
function Ci(e) {
  const t = [];
  let i = 0, s = null;
  const n = () => {
    for (; i < e.length && /[\s,]/.test(e[i]); ) i++;
  };
  for (; i < e.length && (n(), !(i >= e.length)); ) {
    const r = e[i];
    if (Mi.test(r)) {
      s = { type: r, args: [] }, t.push(s), i++;
      continue;
    }
    if (!s) break;
    const o = s.type === "A" || s.type === "a", a = s.args.length % 7;
    if (o && (a === 3 || a === 4)) {
      if (r !== "0" && r !== "1") break;
      s.args.push(r === "1" ? 1 : 0), i++;
      continue;
    }
    const c = _i.exec(e.slice(i));
    if (!c) break;
    s.args.push(parseFloat(c[0])), i += c[0].length;
  }
  return t;
}
function $i(e, t, i, s, n, r, o, a, c) {
  if (e === a && t === c) return [];
  let l = Math.abs(i), u = Math.abs(s);
  if (l === 0 || u === 0) return [[e, t, a, c, a, c]];
  const f = n * Math.PI / 180, h = Math.cos(f), p = Math.sin(f), g = (e - a) / 2, d = (t - c) / 2, m = h * g + p * d, y = -p * g + h * d, v = m * m / (l * l) + y * y / (u * u);
  if (v > 1) {
    const C = Math.sqrt(v);
    l *= C, u *= C;
  }
  const S = r === o ? -1 : 1, k = l * l * u * u - l * l * y * y - u * u * m * m, b = l * l * y * y + u * u * m * m, w = S * Math.sqrt(Math.max(0, k / b)), x = w * l * y / u, E = -w * u * m / l, L = h * x - p * E + (e + a) / 2, A = p * x + h * E + (t + c) / 2, T = (C, I, D, H) => {
    const kt = C * D + I * H, ft = Math.sqrt((C * C + I * I) * (D * D + H * H)), et = Math.acos(Math.max(-1, Math.min(1, kt / ft)));
    return C * H - I * D < 0 ? -et : et;
  }, _ = T(1, 0, (m - x) / l, (y - E) / u);
  let M = T((m - x) / l, (y - E) / u, (-m - x) / l, (-y - E) / u);
  !o && M > 0 && (M -= 2 * Math.PI), o && M < 0 && (M += 2 * Math.PI);
  const P = Math.max(1, Math.ceil(Math.abs(M) / (Math.PI / 2))), R = M / P, N = 4 / 3 * Math.tan(R / 4), Y = (C) => {
    const I = l * Math.cos(C), D = u * Math.sin(C);
    return [h * I - p * D + L, p * I + h * D + A];
  }, tt = (C) => {
    const I = -l * Math.sin(C), D = u * Math.cos(C);
    return [h * I - p * D, p * I + h * D];
  }, ut = [];
  for (let C = 0; C < P; C++) {
    const I = _ + C * R, D = I + R, [H, kt] = Y(I), [ft, et] = C === P - 1 ? [a, c] : Y(D), [ni, ri] = tt(I), [oi, ai] = tt(D);
    ut.push([H + N * ni, kt + N * ri, ft - N * oi, et - N * ai, ft, et]);
  }
  return ut;
}
function q(e, t, i, s, n) {
  const r = 1 - n;
  return r * r * r * e + 3 * r * r * n * t + 3 * r * n * n * i + n * n * n * s;
}
function Wt(e, t, i, s, n) {
  const r = 1 - n;
  return 3 * r * r * (t - e) + 6 * r * n * (i - t) + 3 * n * n * (s - i);
}
function it(e, t, i, s) {
  return {
    subpath: 0,
    type: "L",
    points: [i, s],
    startX: e,
    startY: t,
    endX: i,
    endY: s,
    length: Math.hypot(i - e, s - t)
  };
}
function dt(e, t, i) {
  const [s, n, r, o, a, c] = i, l = [0];
  let u = e, f = t, h = 0;
  for (let p = 1; p <= jt; p++) {
    const g = p / jt, d = q(e, s, r, a, g), m = q(t, n, o, c, g);
    h += Math.hypot(d - u, m - f), l.push(h), u = d, f = m;
  }
  return {
    subpath: 0,
    type: "C",
    points: [s, n, r, o, a, c],
    startX: e,
    startY: t,
    endX: a,
    endY: c,
    length: h,
    lengths: l
  };
}
function ot(e) {
  const t = z.get(e);
  if (t) return t;
  const i = [];
  let s = 0, n = 0, r = 0, o = 0, a = null, c = null, l = -1;
  const u = /* @__PURE__ */ new Set(), f = (d) => {
    l < 0 && (l = 0), d.subpath = l, i.push(d);
  };
  for (const { type: d, args: m } of Ci(e)) {
    const y = d.toUpperCase(), v = d !== y, S = Pi[y];
    if (y === "Z") {
      (s !== r || n !== o) && f(it(s, n, r, o)), l >= 0 && u.add(l), s = r, n = o, a = c = null;
      continue;
    }
    for (let k = 0; k + S <= m.length; k += S) {
      const b = m.slice(k, k + S), w = v ? s : 0, x = v ? n : 0;
      let E = null, L = null;
      switch (y) {
        case "M":
          k === 0 ? (s = b[0] + w, n = b[1] + x, r = s, o = n, (l < 0 || i[i.length - 1]?.subpath === l) && l++) : (f(it(s, n, b[0] + w, b[1] + x)), s = b[0] + w, n = b[1] + x);
          break;
        case "L":
          f(it(s, n, b[0] + w, b[1] + x)), s = b[0] + w, n = b[1] + x;
          break;
        case "H":
          f(it(s, n, b[0] + w, n)), s = b[0] + w;
          break;
        case "V":
          f(it(s, n, s, b[0] + x)), n = b[0] + x;
          break;
        case "C": {
          const A = [b[0] + w, b[1] + x, b[2] + w, b[3] + x, b[4] + w, b[5] + x];
          f(dt(s, n, A)), E = [A[2], A[3]], s = A[4], n = A[5];
          break;
        }
        case "S": {
          const [A, T] = a ? [2 * s - a[0], 2 * n - a[1]] : [s, n], _ = [A, T, b[0] + w, b[1] + x, b[2] + w, b[3] + x];
          f(dt(s, n, _)), E = [_[2], _[3]], s = _[4], n = _[5];
          break;
        }
        case "Q":
        case "T": {
          let A = s, T = n;
          y === "Q" ? (A = b[0] + w, T = b[1] + x) : c && (A = 2 * s - c[0], T = 2 * n - c[1]);
          const _ = y === "Q" ? b[2] + w : b[0] + w, M = y === "Q" ? b[3] + x : b[1] + x;
          f(
            dt(s, n, [
              s + 2 / 3 * (A - s),
              n + 2 / 3 * (T - n),
              _ + 2 / 3 * (A - _),
              M + 2 / 3 * (T - M),
              _,
              M
            ])
          ), L = [A, T], s = _, n = M;
          break;
        }
        case "A": {
          const A = b[5] + w, T = b[6] + x;
          let _ = s, M = n;
          for (const P of $i(s, n, b[0], b[1], b[2], b[3], b[4], A, T))
            f(dt(_, M, P)), _ = P[4], M = P[5];
          s = A, n = T;
          break;
        }
      }
      a = E, c = L;
    }
  }
  const h = i.reduce((d, m) => d + m.length, 0), p = [];
  for (let d = 0; d < i.length; ) {
    const m = i[d].subpath;
    let y = d, v = 0;
    for (; y < i.length && i[y].subpath === m; ) v += i[y++].length;
    const S = i[d], k = i[y - 1], b = u.has(m) || Math.abs(k.endX - S.startX) < 1e-9 && Math.abs(k.endY - S.startY) < 1e-9;
    p.push({ start: d, end: y, length: v, closed: b }), d = y;
  }
  const g = { segments: i, totalLength: h, subpaths: p };
  return z.size >= Ai && z.delete(z.keys().next().value), z.set(e, g), g;
}
function Ei(e, t) {
  const i = e.lengths;
  if (t <= 0) return 0;
  if (t >= e.length) return 1;
  let s = 0, n = i.length - 1;
  for (; s < n - 1; ) {
    const a = s + n >> 1;
    i[a] < t ? s = a : n = a;
  }
  const r = i[n] - i[s], o = r > 0 ? (t - i[s]) / r : 0;
  return (s + o) / (i.length - 1);
}
function Ii(e, t) {
  if (e.type === "L") {
    const f = e.length > 0 ? Math.max(0, Math.min(1, t / e.length)) : 0;
    return {
      x: e.startX + (e.endX - e.startX) * f,
      y: e.startY + (e.endY - e.startY) * f,
      angle: Math.atan2(e.endY - e.startY, e.endX - e.startX) * 180 / Math.PI
    };
  }
  const [i, s, n, r, o, a] = e.points, c = Ei(e, t);
  let l = Wt(e.startX, i, n, o, c), u = Wt(e.startY, s, r, a, c);
  if (Math.hypot(l, u) < 1e-9) {
    const f = c < 0.5 ? Math.min(1, c + 1e-3) : Math.max(0, c - 1e-3), h = q(e.startX, i, n, o, f), p = q(e.startY, s, r, a, f), g = q(e.startX, i, n, o, c), d = q(e.startY, s, r, a, c);
    l = c < 0.5 ? h - g : g - h, u = c < 0.5 ? p - d : d - p;
  }
  return {
    x: q(e.startX, i, n, o, c),
    y: q(e.startY, s, r, a, c),
    angle: Math.atan2(u, l) * 180 / Math.PI
  };
}
function Ie(e, t, i = 0, s = e.length) {
  if (s <= i) return { x: 0, y: 0, angle: 0 };
  let n = 0;
  for (let r = i; r < s; r++) {
    const o = e[r];
    if (n + o.length >= t || r === s - 1)
      return Ii(o, t - n);
    n += o.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function Di(e, t) {
  const { segments: i, totalLength: s } = ot(e);
  return Ie(i, Math.max(0, Math.min(1, t)) * s);
}
function Dn() {
  z.clear();
}
function Rn(e) {
  return ot(e).totalLength;
}
const Ri = 24, Fi = 320, Li = 2.5, st = 72, Fn = 64, Bi = 128, Z = /* @__PURE__ */ new Map(), Gt = (e) => Math.round(e * 100) / 100;
function Ht(e, t) {
  const { segments: i, subpaths: s, totalLength: n } = ot(e);
  if (i.length === 0) return [];
  if (t) {
    const r = s.every((o) => o.closed);
    return [{ segments: i, start: 0, end: i.length, length: n, closed: r }];
  }
  return s.filter((r) => r.length > 0).map((r) => ({ segments: i, start: r.start, end: r.end, length: r.length, closed: r.closed }));
}
function Lt(e, t) {
  const i = e.closed ? (t % 1 + 1) % 1 : Math.max(0, Math.min(1, t)), s = Ie(e.segments, i * e.length, e.start, e.end);
  return [s.x, s.y];
}
function zt(e) {
  const t = [];
  let i = 0;
  for (let s = e.start; s < e.end; s++)
    i += e.segments[s].length, e.length > 0 && t.push(i / e.length);
  return t;
}
function Zt(e, t) {
  const i = [];
  for (let s = 0; s < t; s++)
    i.push(Lt(e, e.closed ? s / t : s / (t - 1)));
  return i;
}
function Kt(e) {
  let t = 0, i = 0;
  for (const [s, n] of e)
    t += s, i += n;
  return t /= e.length, i /= e.length, e.map(([s, n]) => [s - t, n - i]);
}
function Xi(e, t, i) {
  const s = e.closed && t.closed;
  if (i !== void 0)
    return { offset: s ? Math.abs(i) % st / st : 0, reversed: i < 0 };
  const n = Kt(Zt(e, st)), r = Kt(Zt(t, st)), o = st;
  let a = { offset: 0, reversed: !1 }, c = 1 / 0;
  for (const l of [!1, !0]) {
    const u = s ? o : 1;
    for (let f = 0; f < u; f++) {
      let h = 0;
      for (let p = 0; p < o && h < c; p++) {
        const g = s ? l ? (f - p + o) % o : (p + f) % o : l ? o - 1 - p : p, d = n[p][0] - r[g][0], m = n[p][1] - r[g][1];
        h += d * d + m * m;
      }
      h < c && (c = h, a = { offset: s ? f / o : 0, reversed: l });
    }
  }
  return a;
}
function Ni(e, t, i) {
  return i ? ((t.reversed ? t.offset - e : e + t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function Yi(e, t, i) {
  return i ? ((t.reversed ? t.offset - e : e - t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function Oi(e, t, i) {
  const s = e.closed && t.closed, n = Xi(e, t, i.shapeIndex), r = Math.max(
    Ri,
    Math.min(Fi, Math.ceil(Math.max(e.length, t.length) / Li))
  ), o = /* @__PURE__ */ new Set(), a = (f) => o.add(Math.round(f * 1e7) / 1e7);
  for (let f = 0; f <= r; f++) a(f / r);
  for (const f of zt(e)) a(f);
  for (const f of zt(t)) a(Yi(f, n, s));
  let c = [...o].sort((f, h) => f - h);
  s && (c = c.filter((f) => f < 1));
  const l = [], u = [];
  for (const f of c)
    l.push(...Lt(e, f)), u.push(...Lt(t, Ni(f, n, s)));
  return { from: l, to: u, closed: s };
}
function qi(e, t, i) {
  const s = `${i.shapeIndex ?? "auto"}|${e}|${t}`, n = Z.get(s);
  if (n) return n;
  const r = ot(e).subpaths.filter((l) => l.length > 0).length === ot(t).subpaths.filter((l) => l.length > 0).length, o = Ht(e, !r), a = Ht(t, !r), c = {
    pairs: o.map((l, u) => Oi(l, a[u], i))
  };
  return Z.size >= Bi && Z.delete(Z.keys().next().value), Z.set(s, c), c;
}
function Vi(e, t, i, s = {}) {
  if (!e) return t;
  if (!t) return e;
  const n = Math.max(0, Math.min(1, i));
  if (n === 0) return e;
  if (n === 1) return t;
  const r = qi(e, t, s);
  if (r.pairs.length === 0) return n < 0.5 ? e : t;
  let o = "";
  for (const a of r.pairs) {
    for (let c = 0; c < a.from.length; c += 2) {
      const l = Gt(a.from[c] + (a.to[c] - a.from[c]) * n), u = Gt(a.from[c + 1] + (a.to[c + 1] - a.from[c + 1]) * n);
      o += `${c === 0 ? o ? " M" : "M" : " L"}${l} ${u}`;
    }
    a.closed && (o += " Z");
  }
  return o;
}
function Ln() {
  Z.clear();
}
function ht(e) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(e);
}
const O = (e, t, i) => e + (t - e) * i, De = 512, At = /* @__PURE__ */ new Map(), Mt = /* @__PURE__ */ new Map();
function Qt(e) {
  const t = At.get(e);
  if (t) return t;
  const i = e.replace("#", ""), s = [
    parseInt(i.slice(0, 2), 16),
    parseInt(i.slice(2, 4), 16),
    parseInt(i.slice(4, 6), 16)
  ];
  return At.size < De && At.set(e, s), s;
}
const Jt = (e) => e.charCodeAt(0) === 35, te = (e) => e.startsWith("rgb"), ee = (e) => e.startsWith("rgba"), Ui = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, _t = (e) => Math.round(e).toString(16).padStart(2, "0");
function ji(e, t, i) {
  return `#${_t(e)}${_t(t)}${_t(i)}`;
}
function ie(e) {
  const t = Mt.get(e);
  if (t) return t;
  const i = e.match(Ui);
  if (!i)
    throw new Error(`Invalid rgb color: ${e}`);
  const s = parseInt(i[1], 10), n = parseInt(i[2], 10), r = parseInt(i[3], 10), o = i[4] !== void 0 ? [s, n, r, parseFloat(i[4])] : [s, n, r];
  return Mt.size < De && Mt.set(e, o), o;
}
const Wi = (e, t, i) => {
  if (Jt(e) && Jt(t)) {
    const [s, n, r] = Qt(e), [o, a, c] = Qt(t), l = O(s, o, i), u = O(n, a, i), f = O(r, c, i);
    return ji(l, u, f);
  }
  if ((te(e) || ee(e)) && (te(t) || ee(t))) {
    const s = ie(e), n = ie(t), r = Math.round(O(s[0], n[0], i)), o = Math.round(O(s[1], n[1], i)), a = Math.round(O(s[2], n[2], i));
    if (s.length === 4 || n.length === 4) {
      const c = s[3] ?? 1, l = n[3] ?? 1, u = O(c, l, i);
      return `rgba(${r}, ${o}, ${a}, ${u})`;
    }
    return `rgb(${r}, ${o}, ${a})`;
  }
  return i < 1 ? e : t;
}, Gi = (e, t, i) => {
  const s = Math.min(e.length, t.length), n = [];
  for (let r = 0; r < s; r++)
    n.push(O(e[r], t[r], i));
  return n;
}, se = (e, t, i) => i < 1 ? e : t, Hi = (e, t, i) => Vi(e, t, i);
function Re(e) {
  return typeof e == "number" ? O : Array.isArray(e) ? Gi : typeof e == "string" ? e.startsWith("#") || e.startsWith("rgb") ? Wi : ht(e) ? Hi : se : se;
}
const Fe = 1e3 / 60;
function Le(e, t = {}) {
  if (!W(e))
    throw new Error(`bakeSpringTrack: track "${e.id}" is not a spring track`);
  const i = new wt(e.spring);
  return Xe(e, (s) => i.valueAt(s), i.settleTime(), e.spring.from, e.spring.to, t);
}
function Be(e, t = {}) {
  if (!j(e))
    throw new Error(`bakeInertiaTrack: track "${e.id}" is not an inertia track`);
  const i = e.inertia;
  return Xe(
    e,
    (s) => Ft(i, s),
    lt(i),
    i.from,
    ct(i),
    t
  );
}
function Xe(e, t, i, s, n, r) {
  const o = r.intervalMs ?? Fe, a = r.tolerance ?? 0.01, c = e.delay ?? 0, l = [];
  for (let f = 0; f <= i; f += o)
    l.push({ time: f + c, value: t(f), easing: "linear" });
  const u = l[l.length - 1];
  return !u || u.time < i + c ? l.push({ time: i + c, value: n, easing: "linear" }) : u.value = n, c > 0 && l.unshift({ time: 0, value: s, easing: "linear" }), {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: a > 0 ? Zi(l, a) : l,
    ...e.targets && { targets: [...e.targets] },
    ...e.stagger && { stagger: { ...e.stagger } }
  };
}
function zi(e, t, i, s = {}) {
  const n = s.intervalMs ?? Fe, r = typeof i == "function" ? i : Ee(i), o = Re(e.value), a = t.time - e.time;
  if (a <= 0) return [t];
  const c = [];
  for (let l = n; l < a; l += n) {
    const u = l / a;
    c.push({
      time: e.time + l,
      value: o(e.value, t.value, r(u)),
      easing: "linear"
    });
  }
  return c.push({ ...t, easing: "linear" }), c;
}
function Bn(e, t) {
  return W(e) ? Le(e, t) : j(e) ? Be(e, t) : e;
}
function Xn(e, t) {
  return e.filter(li).concat(
    e.filter(W).map((i) => Le(i, t)),
    e.filter(j).map((i) => Be(i, t))
  );
}
function Zi(e, t) {
  if (e.length <= 2) return e;
  const i = [e[0]];
  for (let s = 1; s < e.length - 1; s++) {
    const n = i[i.length - 1], r = e[s], o = e[s + 1], a = o.time - n.time;
    if (a <= 0) continue;
    const c = (r.time - n.time) / a, l = n.value + (o.value - n.value) * c;
    Math.abs(r.value - l) > t && i.push(r);
  }
  return i.push(e[e.length - 1]), i;
}
function Bt(e) {
  const t = [...e.keyframes].sort((i, s) => i.time - s.time);
  return {
    ...e,
    keyframes: t
  };
}
function V(e) {
  return e.targets && e.targets.length > 0 ? e.targets : [e.target];
}
function J(e, t, i, s) {
  const n = i ?? 0;
  return !s || t <= 1 ? n : n + Ae(e, t, s);
}
class Pt {
  track;
  targets;
  constructor(t) {
    this.track = t, this.targets = V(t);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(t) {
    return this.valueForOffset(t - J(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  /**
   * Every target's value at a specific time, in target order.
   *
   * Single-target tracks yield one entry; staggered tracks yield one per target,
   * each sampled at its own offset time.
   */
  getTargetValues(t) {
    const i = this.targets.length, s = [];
    for (let n = 0; n < i; n++) {
      const r = J(n, i, this.track.delay, this.track.stagger), o = this.valueForOffset(t - r);
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
    const i = t[t.length - 1].time, s = this.track.stagger ? vt(this.targets.length, this.track.stagger) : 0;
    return i + (this.track.delay ?? 0) + s + (this.track.endDelay ?? 0);
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
    const { from: s, to: n } = this.findSurroundingKeyframes(t);
    if (!s || !n)
      return;
    if (s.time === t)
      return s.value;
    const r = n.time - s.time, o = (t - s.time) / r, c = Ee(n.easing)(o);
    return Re(s.value)(s.value, n.value, c);
  }
  /**
   * Find the keyframes surrounding a given time.
   */
  findSurroundingKeyframes(t) {
    const { keyframes: i } = this.track;
    for (let s = 0; s < i.length - 1; s++)
      if (t >= i[s].time && t <= i[s + 1].time)
        return { from: i[s], to: i[s + 1] };
    return { from: null, to: null };
  }
}
class Ki {
  track;
  targets;
  sampler;
  constructor(t) {
    this.track = t, this.targets = V(t), this.sampler = new wt(t.spring);
  }
  getValueAtTime(t) {
    return this.sampler.valueAt(t - J(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const i = this.targets.length, s = [];
    for (let n = 0; n < i; n++) {
      const r = J(n, i, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[n], value: this.sampler.valueAt(t - r), start: r });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? vt(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
class Qi {
  track;
  targets;
  duration;
  constructor(t) {
    this.track = t, this.targets = V(t), this.duration = lt(t.inertia);
  }
  getValueAtTime(t) {
    return Ft(this.track.inertia, t - J(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const i = this.targets.length, s = [];
    for (let n = 0; n < i; n++) {
      const r = J(n, i, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[n], value: Ft(this.track.inertia, t - r), start: r });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? vt(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
function Ne(e, t) {
  const i = { ...Di(e.pathData, t) };
  if (e.matrix) {
    const [s, n, r, o, a, c] = e.matrix, { x: l, y: u } = i;
    i.x = s * l + r * u + a, i.y = n * l + o * u + c;
    const f = i.angle * Math.PI / 180, h = Math.cos(f), p = Math.sin(f);
    i.angle = Math.atan2(n * h + o * p, s * h + r * p) * 180 / Math.PI;
  }
  return e.autoRotate && e.rotateOffset && (i.angle += e.rotateOffset), i;
}
function Nn(e, t, i, s) {
  const n = t + (i - t) * s;
  return Ne(e, n);
}
const Ct = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, Ji = 20;
function ts(e) {
  const t = Ct[e ?? "upperCase"] ?? e ?? Ct.upperCase, i = Array.from(t);
  return i.length > 0 ? i : Array.from(Ct.upperCase);
}
function es(e, t, i) {
  let s = (e | 0) ^ Math.imul(t + 1, 2654435761) ^ Math.imul(i + 1, 2246822507);
  return s = Math.imul(s ^ s >>> 16, 2146121005), s = Math.imul(s ^ s >>> 15, 2221713035), (s ^ s >>> 16) >>> 0;
}
function is(e, t, i = 0) {
  const s = e.from ?? "", n = e.to, r = Math.max(0, Math.min(1, t));
  if (r <= 0) return s;
  if (r >= 1) return n;
  const o = Array.from(s), a = Array.from(n), c = e.rightToLeft ?? !1;
  if (e.mode === "type") {
    const v = Math.round(r * Math.max(o.length, a.length));
    return c ? o.slice(0, Math.max(0, o.length - v)).join("") + a.slice(Math.max(0, a.length - v)).join("") : a.slice(0, v).join("") + o.slice(v).join("");
  }
  const l = Math.max(0, Math.min(0.999, e.revealDelay ?? 0)), u = Math.max(0, (r - l) / (1 - l)), f = Math.floor(u * a.length), h = e.tweenLength === !1 ? a.length : Math.round(o.length + (a.length - o.length) * r), p = ts(e.chars), g = e.refreshRate ?? Ji, d = g > 0 ? Math.floor(i * g / 1e3) : 0, m = e.seed ?? 1;
  let y = "";
  for (let v = 0; v < h; v++) {
    const S = c ? v >= h - f : v < f, k = c ? a[a.length - (h - v)] : a[v];
    S && k !== void 0 || k === " " || k === `
` ? y += k : y += p[es(m, v, d) % p.length];
  }
  return y;
}
class Ye {
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
        const c = i - this._currentTime;
        if (n >= c) {
          if (n -= c, this._currentTime = i, !this._handleEndReached())
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
    const i = /* @__PURE__ */ new Map();
    if (this._hasSharedWrites())
      this._resolveShared(t, i);
    else
      for (const [s, n] of this._trackPlayers) {
        const r = n.getTrack().property;
        for (const { target: o, value: a, start: c } of n.getTargetValues(t))
          this._write(i, s, o, r, a, t - c);
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
    const s = /* @__PURE__ */ new Map();
    for (const [n, r] of this._trackPlayers) {
      const o = r.getTrack().property;
      for (const { target: a, value: c, start: l } of r.getTargetValues(t)) {
        const u = `${a}\0${o}`, f = l <= t, h = s.get(u);
        (!h || (f !== h.started ? f : f ? l >= h.start : l <= h.start)) && s.set(u, { trackId: n, target: a, property: o, value: c, start: l, started: f });
      }
    }
    for (const { trackId: n, target: r, property: o, value: a, start: c } of s.values())
      this._write(i, n, r, o, a, t - c);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(t, i, s, n, r, o) {
    if (r === void 0) return;
    let a = t.get(s);
    a || (a = /* @__PURE__ */ new Map(), t.set(s, a));
    const c = this._textTracks.get(i);
    if (c && typeof r == "number") {
      a.set("text", is(c.textConfig, r, Math.max(0, o)));
      return;
    }
    const l = this._motionPathTracks.get(i);
    if (l && typeof r == "number") {
      const u = Ne(l.motionPathConfig, r);
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
      t: for (const i of this._tracks)
        for (const s of V(i)) {
          const n = `${s}\0${i.property}`;
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
      this._trackPlayers.set(t.id, new Qi(t));
      return;
    }
    if (W(t)) {
      this._trackPlayers.set(t.id, new Ki(t)), this._springTracks.set(t.id, t);
      return;
    }
    if (Nt(t))
      this._trackPlayers.set(t.id, new Pt(t)), this._textTracks.set(t.id, t);
    else if (ke(t)) {
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
      this._trackPlayers.set(t.id, new Pt(i)), this._motionPathTracks.set(t.id, t);
    } else
      this._trackPlayers.set(t.id, new Pt(t));
  }
  /**
   * Replace a track with a new version, keeping its place in the track order
   * (which decides ties when tracks overlap). The new track may have a
   * different id. Does nothing if no track has `trackId`.
   */
  replaceTrack(t, i) {
    const s = this._tracks.findIndex((r) => r.id === t);
    if (s < 0) return;
    const n = this._tracks.slice(s + 1);
    this.removeTrack(t);
    for (const r of n) this.removeTrack(r.id);
    this.addTrack(i);
    for (const r of n) this.addTrack(r);
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
    const i = this.getTracks(t).map((s) => s.id);
    for (const s of i)
      this.removeTrack(s);
    return i;
  }
  /**
   * The time span a track is active over: [start, end] in milliseconds.
   */
  getTrackSpan(t) {
    const i = this._trackPlayers.get(t);
    if (!i) return;
    const s = i.getTrack(), n = s.delay ?? 0;
    if (W(s) || j(s))
      return { from: n, to: i.getDuration() };
    const r = s.keyframes;
    if (!(!r || r.length === 0))
      return { from: r[0].time + n, to: i.getDuration() };
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
      const s = this._tracks[i], n = this.getTrackSpan(s.id);
      if (n)
        for (let r = 0; r < i; r++) {
          const o = this._tracks[r];
          if (o.property !== s.property) continue;
          const a = V(o).filter((f) => V(s).includes(f));
          if (a.length === 0) continue;
          const c = this.getTrackSpan(o.id);
          if (!c || !(c.from <= n.to && n.from <= c.to)) continue;
          const u = n.from >= c.from;
          for (const f of a)
            t.push({
              target: f,
              property: s.property,
              losingTrackId: u ? o.id : s.id,
              winningTrackId: u ? s.id : o.id
            });
        }
    }
    return t;
  }
  _matches(t, i) {
    if (i.id !== void 0 && t.id !== i.id || i.property !== void 0 && t.property !== i.property || i.target !== void 0 && !V(t).includes(i.target)) return !1;
    if (i.timeRange) {
      const s = this.getTrackSpan(t.id);
      if (!s || s.to < i.timeRange.from || s.from > i.timeRange.to) return !1;
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
function ss(e) {
  return j(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "inertia",
    inertia: Oe(e.inertia),
    ...X(e)
  } : W(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "spring",
    spring: { ...e.spring },
    ...X(e)
  } : Nt(e) ? {
    id: e.id,
    target: e.target,
    property: "text",
    textConfig: { ...e.textConfig },
    keyframes: e.keyframes.map($t),
    ...X(e)
  } : ke(e) ? {
    id: e.id,
    target: e.target,
    property: "motionPath",
    motionPathConfig: { ...e.motionPathConfig },
    keyframes: e.keyframes.map($t),
    ...X(e)
  } : {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes.map($t),
    ...X(e)
  };
}
function Oe(e) {
  return { ...e, ...Array.isArray(e.end) && { end: [...e.end] } };
}
function $t(e) {
  return {
    time: e.time,
    value: e.value,
    ...e.easing && { easing: e.easing }
  };
}
function X(e) {
  const t = e.endDelay;
  return {
    ...e.delay !== void 0 && { delay: e.delay },
    ...t !== void 0 && { endDelay: t },
    ...e.targets !== void 0 && { targets: [...e.targets] },
    ...e.stagger !== void 0 && { stagger: { ...e.stagger } }
  };
}
function ns(e) {
  if (j(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "inertia",
      inertia: Oe(t.inertia),
      ...X(t)
    };
  }
  if (W(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "spring",
      spring: { ...t.spring },
      ...X(t)
    };
  }
  if (Nt(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: "text",
      textConfig: { ...t.textConfig },
      keyframes: [...t.keyframes].sort((i, s) => i.time - s.time),
      ...X(t)
    };
  }
  if (e.property === "motionPath" && "motionPathConfig" in e) {
    const t = e, i = [...t.keyframes].sort((s, n) => s.time - n.time);
    return {
      id: t.id,
      target: t.target,
      property: "motionPath",
      motionPathConfig: { ...t.motionPathConfig },
      keyframes: i,
      ...X(t)
    };
  }
  return Bt({
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes,
    ...X(e)
  });
}
function rs(e) {
  return {
    id: e.id,
    name: e.name,
    config: {
      duration: e.duration > 0 ? e.duration : void 0,
      loop: e._config.loop,
      speed: e._config.speed,
      alternate: e._config.alternate,
      repeatDelay: e._config.repeatDelay
    },
    tracks: e.tracks.map(ss)
  };
}
function at(e) {
  return new Ye({
    id: e.id,
    name: e.name,
    config: e.config,
    tracks: e.tracks.map(ns)
  });
}
function Yn(e) {
  return JSON.stringify(rs(e));
}
function On(e) {
  const t = JSON.parse(e);
  return at(t);
}
function qn(e) {
  let t = 2166136261;
  for (let i = 0; i < e.length; i++)
    t ^= e.charCodeAt(i), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function os(e) {
  let t = e >>> 0 || 2654435769;
  return {
    seed: e >>> 0,
    next() {
      return t ^= t << 13, t >>>= 0, t ^= t >> 17, t ^= t << 5, t >>>= 0, t / 4294967296;
    }
  };
}
function qe(e, t, i) {
  return t + e.next() * (i - t);
}
function as(e, t, i, s) {
  if (s <= 0) return qe(e, t, i);
  const n = Math.floor((i - t) / s), r = Math.round(e.next() * n);
  return t + r * s;
}
function Vn(e, t) {
  if (t.length !== 0)
    return t[Math.floor(e.next() * t.length)];
}
const Ve = /^([+\-*/])=\s*(-?[\d.]+)$/, Ue = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function Un(e) {
  return typeof e != "string" ? !1 : Ve.test(e.trim()) || Ue.test(e.trim());
}
function je(e, t = {}) {
  if (typeof e != "string") return e;
  const i = e.trim(), s = Ve.exec(i);
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
  const n = Ue.exec(i);
  if (n) {
    if (!t.random)
      throw new Error(
        `resolveValue: "${i}" needs a random source — pass one via context.random`
      );
    const r = Number.parseFloat(n[1]), o = Number.parseFloat(n[2]), a = n[3] !== void 0 ? Number.parseFloat(n[3]) : void 0;
    return a !== void 0 ? as(t.random, r, o, a) : qe(t.random, r, o);
  }
  return e;
}
function cs(e, t = 0, i) {
  const s = [];
  let n = t;
  for (const r of e) {
    const o = je(r, { base: n, random: i });
    s.push(o), typeof o == "number" && (n = o);
  }
  return s;
}
class jn {
  random;
  constructor(t) {
    this.random = os(t);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(t, i = 0) {
    return je(t, { base: i, random: this.random });
  }
  resolveSequence(t, i = 0) {
    return cs(t, i, this.random);
  }
}
const B = (e) => Math.round(e * 1e3) / 1e3;
function ls(e, t = {}) {
  if (e.length === 0) return "";
  const i = t.curviness ?? 1, s = t.closed ?? !1, n = e.length;
  let r = `M${B(e[0].x)} ${B(e[0].y)}`;
  if (n === 1) return r;
  const o = (c) => s ? e[(c % n + n) % n] : e[Math.max(0, Math.min(n - 1, c))], a = s ? n : n - 1;
  for (let c = 0; c < a; c++) {
    const l = o(c - 1), u = o(c), f = o(c + 1), h = o(c + 2);
    if (i === 0) {
      r += ` L${B(f.x)} ${B(f.y)}`;
      continue;
    }
    const p = i / 6, g = u.x + (f.x - l.x) * p, d = u.y + (f.y - l.y) * p, m = f.x - (h.x - u.x) * p, y = f.y - (h.y - u.y) * p;
    r += ` C${B(g)} ${B(d)} ${B(m)} ${B(y)} ${B(f.x)} ${B(f.y)}`;
  }
  return s ? `${r} Z` : r;
}
const $ = (e, t = 0) => {
  const i = parseFloat(e ?? "");
  return Number.isFinite(i) ? i : t;
};
function hs(e) {
  const t = (e ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), i = [];
  for (let s = 0; s + 1 < t.length; s += 2) i.push({ x: t[s], y: t[s + 1] });
  return i;
}
function Yt(e) {
  const t = e.attributes;
  switch (e.tag.toLowerCase()) {
    case "path":
      return t.d ?? null;
    case "circle":
    case "ellipse": {
      const i = $(t.cx), s = $(t.cy), n = e.tag.toLowerCase() === "circle" ? $(t.r) : $(t.rx), r = e.tag.toLowerCase() === "circle" ? $(t.r) : $(t.ry);
      return `M${i + n} ${s} A${n} ${r} 0 1 1 ${i - n} ${s} A${n} ${r} 0 1 1 ${i + n} ${s} Z`;
    }
    case "rect": {
      const i = $(t.x), s = $(t.y), n = $(t.width), r = $(t.height);
      let o = t.rx != null ? $(t.rx) : t.ry != null ? $(t.ry) : 0, a = t.ry != null ? $(t.ry) : o;
      return o = Math.min(o, n / 2), a = Math.min(a, r / 2), o === 0 || a === 0 ? `M${i} ${s} H${i + n} V${s + r} H${i} Z` : `M${i + o} ${s} H${i + n - o} A${o} ${a} 0 0 1 ${i + n} ${s + a} V${s + r - a} A${o} ${a} 0 0 1 ${i + n - o} ${s + r} H${i + o} A${o} ${a} 0 0 1 ${i} ${s + r - a} V${s + a} A${o} ${a} 0 0 1 ${i + o} ${s} Z`;
    }
    case "line":
      return `M${$(t.x1)} ${$(t.y1)} L${$(t.x2)} ${$(t.y2)}`;
    case "polyline":
    case "polygon": {
      const i = hs(t.points);
      if (i.length === 0) return null;
      const s = i.map((n, r) => `${r === 0 ? "M" : "L"}${n.x} ${n.y}`).join(" ");
      return e.tag.toLowerCase() === "polygon" ? `${s} Z` : s;
    }
    default:
      return null;
  }
}
const ne = {
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
}, re = {
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
function us(e) {
  let t = e.trim().toLowerCase();
  return t = t.replace(/\.ease(in|out|inout)$/, ".$1"), !t.includes(".") && !t.startsWith("steps") && t !== "none" && t !== "linear" && (t = `${t}.out`), t;
}
function Ot(e = 1, t = 0.3) {
  return (i) => {
    if (i === 0 || i === 1) return i;
    const s = t / (2 * Math.PI) * Math.asin(1 / Math.max(1, e));
    return e * Math.pow(2, -10 * i) * Math.sin((i - s) * (2 * Math.PI) / t) + 1;
  };
}
function We(e = 1, t = 0.3) {
  const i = Ot(e, t);
  return (s) => 1 - i(1 - s);
}
function fs(e = 1, t = 0.3) {
  const i = We(e, t), s = Ot(e, t);
  return (n) => n < 0.5 ? i(n * 2) / 2 : s(n * 2 - 1) / 2 + 0.5;
}
const qt = (e) => {
  if (e < 1 / 2.75) return 7.5625 * e * e;
  if (e < 2 / 2.75) {
    const n = e - 0.5454545454545454;
    return 7.5625 * n * n + 0.75;
  }
  if (e < 2.5 / 2.75) {
    const n = e - 0.8181818181818182;
    return 7.5625 * n * n + 0.9375;
  }
  const s = e - 2.625 / 2.75;
  return 7.5625 * s * s + 0.984375;
}, Ge = (e) => 1 - qt(1 - e), ps = (e) => e < 0.5 ? Ge(e * 2) / 2 : qt(e * 2 - 1) / 2 + 0.5;
function ds(e) {
  const t = Math.max(1, Math.floor(e));
  return (i) => Math.min(1, Math.floor(i * t) / (t - 1 || 1));
}
function oe(e) {
  const t = us(e), i = /^steps\(\s*(\d+)\s*\)$/.exec(t);
  if (i)
    return { fn: ds(Number.parseInt(i[1], 10)), requiresBaking: "steps" };
  if (t.startsWith("elastic")) {
    const s = t.split(".")[1] ?? "out";
    return { fn: s === "in" ? We() : s === "inout" ? fs() : Ot(), requiresBaking: "elastic" };
  }
  if (t.startsWith("bounce")) {
    const s = t.split(".")[1] ?? "out";
    return { fn: s === "in" ? Ge : s === "inout" ? ps : qt, requiresBaking: "bounce" };
  }
  return t in re ? { easing: re[t] } : t in ne ? { easing: { type: "cubic-bezier", points: ne[t] } } : { easing: "ease-out" };
}
const ms = /^([+-])=\s*(-?[\d.]+)$/, gs = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function Et(e, t) {
  const i = t.scale ?? 1, s = (l) => Number.parseFloat(l) * i;
  if (e === void 0) return t.cursor;
  if (typeof e == "number") return e * i;
  const n = e.trim();
  if (n === "") return t.cursor;
  const r = ms.exec(n);
  if (r) {
    const l = s(r[2]);
    return t.cursor + (r[1] === "-" ? -l : l);
  }
  const o = gs.exec(n);
  if (o) {
    const l = o[1] === "<" ? t.previousStart : t.previousEnd;
    if (o[3] === void 0) return l;
    const u = s(o[3]);
    return l + (o[2] === "-" ? -u : u);
  }
  const a = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(n);
  if (a) {
    const l = t.labels.get(a[1].trim());
    if (l !== void 0) {
      const u = s(a[3]);
      return l + (a[2] === "-" ? -u : u);
    }
  }
  const c = t.labels.get(n);
  return c !== void 0 ? c : /^-?[\d.]+$/.test(n) ? s(n) : t.cursor;
}
const ys = /* @__PURE__ */ new Set([
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
function gt(e) {
  const t = {}, i = {};
  for (const [s, n] of Object.entries(e))
    ys.has(s) ? t[s] = n : i[s] = n;
  return { config: t, properties: i };
}
function Xt(e, t) {
  return e === void 0 ? t : e * 1e3;
}
function bs(e) {
  if (e !== void 0)
    return typeof e == "number" ? { each: e * 1e3 } : {
      ...e.each !== void 0 && { each: e.each * 1e3 },
      ...e.amount !== void 0 && { amount: e.amount * 1e3 },
      ...e.from !== void 0 && { from: e.from }
    };
}
const Ts = {
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
function vs(e) {
  return Ts[e];
}
function ws(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : e;
  if (!t || typeof t.path != "string" && !Array.isArray(t.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let i;
  if (Array.isArray(t.path))
    i = ls(t.path, { curviness: t.curviness });
  else if (ht(t.path))
    i = t.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${t.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const s = { pathData: i };
  return t.autoRotate !== void 0 && t.autoRotate !== !1 && (s.autoRotate = !0, typeof t.autoRotate == "number" && (s.rotateOffset = t.autoRotate)), t.matrix && (s.matrix = t.matrix), { config: s, start: t.start ?? 0, end: t.end ?? 1 };
}
function Ss(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : { ...e };
  return { ...t, start: t.end ?? 1, end: t.start ?? 0 };
}
function He(e) {
  return typeof e == "object" && e !== null && "shape" in e ? e.shape : e;
}
function ks(e) {
  if (e.morphSVG === void 0) return e;
  const { morphSVG: t, ...i } = e, s = He(t);
  if (typeof s != "string" || !ht(s))
    throw new Error(
      `gsap-compat: morphSVG "${String(s)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...i, d: s };
}
function xs(e, t) {
  if (e === !0) return [0, t];
  if (e === !1) return [0, 0];
  if (typeof e == "number") return [0, ae(e, t)];
  const i = e.trim().split(/[\s,]+/).filter(Boolean), s = (o) => {
    const a = Number.parseFloat(o);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${e}" is not a length or percentage`);
    return ae(o.endsWith("%") ? t * a / 100 : a, t);
  };
  if (i.length === 0) return [0, t];
  if (i.length === 1) return [0, s(i[0])];
  const n = s(i[0]), r = s(i[1]);
  return n <= r ? [n, r] : [r, n];
}
function As(e, t) {
  const [i, s] = xs(e, t);
  return { strokeDasharray: [s - i, t], strokeDashoffset: -i };
}
function Ms(e, t) {
  if (e.drawSVG === void 0) return e;
  const { drawSVG: i, ...s } = e;
  return { ...s, ...As(i, t) };
}
function _s(e) {
  if (e.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return e;
}
function ae(e, t) {
  return Math.max(0, Math.min(t, e));
}
function Ps(e) {
  let t = 2166136261;
  for (let i = 0; i < e.length; i++) t = Math.imul(t ^ e.charCodeAt(i), 16777619);
  return t >>> 0;
}
function Cs(e, t, i) {
  if (e.scrambleText !== void 0) {
    const s = e.scrambleText, n = typeof s == "string" ? { text: s } : s;
    if (typeof n?.text != "string")
      throw new Error("gsap-compat: scrambleText needs the text to end on — a string, or { text }.");
    const r = n.revealDelay && i > 0 ? n.revealDelay * 1e3 / i : void 0;
    return {
      to: n.text,
      mode: "scramble",
      ...n.chars !== void 0 && { chars: n.chars },
      ...n.speed !== void 0 && { refreshRate: 20 * n.speed },
      ...r !== void 0 && { revealDelay: Math.min(r, 0.999) },
      ...n.tweenLength !== void 0 && { tweenLength: n.tweenLength },
      ...n.rightToLeft !== void 0 && { rightToLeft: n.rightToLeft },
      seed: n.seed ?? Ps(`${t}|${n.text}`)
    };
  }
  if (e.text !== void 0) {
    const s = e.text, n = typeof s == "string" ? { value: s } : s;
    if (typeof n?.value != "string")
      throw new Error("gsap-compat: text needs the text to end on — a string, or { value }.");
    return {
      to: n.value,
      mode: "type",
      ...n.rightToLeft !== void 0 && { rightToLeft: n.rightToLeft }
    };
  }
}
function ze(e) {
  return Math.max(0.1, e / 25);
}
function $s(e, t) {
  const i = typeof t == "number" ? { velocity: t } : t;
  if (typeof i?.velocity != "number" || !Number.isFinite(i.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const s = i.friction ?? (i.resistance !== void 0 ? ze(i.resistance) : void 0), n = {
    from: e,
    velocity: i.velocity,
    ...s !== void 0 && { friction: s },
    ...i.min !== void 0 && { min: i.min },
    ...i.max !== void 0 && { max: i.max }
  };
  return typeof i.end == "function" ? n.end = [i.end(yt(n))] : i.end !== void 0 && (n.end = Array.isArray(i.end) ? [...i.end] : i.end), n;
}
function Es(e) {
  const t = e === !0 ? {} : typeof e == "string" ? { preset: e } : e;
  if (t.preset !== void 0 && !(t.preset in xt))
    throw new Error(
      `gsap-compat: unknown spring preset "${t.preset}" — use one of ${Object.keys(xt).join(", ")}`
    );
  return {
    ...t.preset ? xt[t.preset] : {},
    ...t.stiffness !== void 0 && { stiffness: t.stiffness },
    ...t.damping !== void 0 && { damping: t.damping },
    ...t.mass !== void 0 && { mass: t.mass },
    ...t.restDelta !== void 0 && { restDelta: t.restDelta }
  };
}
function Is(e, t) {
  if (e === !0 || typeof e == "string") return;
  const i = e.velocity;
  return typeof i == "number" ? i : i?.[t];
}
class Q {
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
    this.options = t, this.timeline = new Ye({
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
  to(t, i, s) {
    return this.build(t, void 0, nt(i), s);
  }
  /** Animate from the given values to where the property already is. */
  from(t, i, s) {
    const { config: n, properties: r } = gt(nt(i)), { motionPath: o, text: a, scrambleText: c, ...l } = r, u = this.targetsOf(t)[0], f = { ...n };
    for (const g of Object.keys(l))
      f[g] = this.resolveStart(u, g);
    o !== void 0 && (f.motionPath = Ss(o));
    const h = {}, p = String(this.resolveStart(u, "text"));
    return a !== void 0 && (h.text = It(a), f.text = typeof a == "object" ? { ...a, value: p } : p), c !== void 0 && (h.text = It(c), f.scrambleText = typeof c == "object" ? { ...c, text: p } : p), this.build(t, { ...l, ...h }, f, s);
  }
  /** Animate between two explicit sets of values. */
  fromTo(t, i, s, n) {
    const { properties: r } = gt(nt(i));
    return this.build(t, r, nt(s), n);
  }
  /** Set values instantly — a single held keyframe. */
  set(t, i, s) {
    return this.build(t, void 0, { ...nt(i), duration: 0 }, s);
  }
  // --- sequencing ---------------------------------------------------------
  /** Name a point in time, for use as a position parameter. */
  addLabel(t, i) {
    return this.labels.set(t, Et(i, this.context())), this;
  }
  /** Time of a label, in milliseconds. */
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
    const s = Et(i, this.context());
    for (const r of t.timeline.tracks) {
      if (!("keyframes" in r)) continue;
      const o = Bt({
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
  build(t, i, s, n) {
    const { config: r, properties: o } = gt(s), { motionPath: a, text: c, scrambleText: l, inertia: u, ...f } = o, h = this.targetsOf(t), p = Et(n, this.context()), g = Xt(r.delay, 0), d = Xt(r.duration, 500), m = bs(r.stagger), y = this.easingFor(r.ease), v = [], S = r.spring;
    let k = 0, b = !1;
    for (const [T, _] of Object.entries(f)) {
      const M = _;
      let P = i?.[T] !== void 0 ? i[T] : this.resolveStart(h[0], T);
      if (typeof P != typeof M && (this.warn(
        `no usable start value for "${T}" on "${h[0]}" — it will snap to ${String(M)}. Use fromTo() to animate it.`
      ), P = M), S !== void 0 && typeof P == "number" && typeof M == "number") {
        const Y = {
          ...Es(S),
          from: P,
          to: M,
          velocity: Is(S, T) ?? this.options.startVelocity?.(h[0], T) ?? 0
        }, tt = this.nextTrackId(`${h[0]}-${T}-spring`), ut = {
          id: tt,
          target: h[0],
          ...h.length > 1 && { targets: h },
          ...m && h.length > 1 && { stagger: m },
          property: T,
          kind: "spring",
          spring: Y,
          delay: p + g
        };
        this.timeline.addTrack(ut), v.push(tt), k = Math.max(k, fi(Y));
        for (const C of h) this.lastValues.set(`${C}|${T}`, M);
        continue;
      }
      b = !0;
      const R = this.keyframesFor(P, M, d, y, r.ease), N = this.nextTrackId(`${h[0]}-${T}`);
      this.timeline.addTrack(
        Bt({
          id: N,
          target: h[0],
          ...h.length > 1 && { targets: h },
          ...m && h.length > 1 && { stagger: m },
          property: T,
          delay: p + g,
          keyframes: R
        })
      ), v.push(N);
      for (const Y of h) this.lastValues.set(`${Y}|${T}`, M);
    }
    const w = Cs({ text: c, scrambleText: l }, h[0], d);
    if (w) {
      const T = i?.text ?? i?.scrambleText, _ = T !== void 0 ? It(T) : this.resolveStart(h[0], "text"), M = this.nextTrackId(`${h[0]}-text`), P = {
        id: M,
        target: h[0],
        ...h.length > 1 && { targets: h },
        ...m && h.length > 1 && { stagger: m },
        property: "text",
        textConfig: { from: typeof _ == "string" ? _ : String(_ ?? ""), ...w },
        delay: p + g,
        keyframes: this.keyframesFor(0, 1, d, y, r.ease)
      };
      this.timeline.addTrack(P), v.push(M);
      for (const R of h) this.lastValues.set(`${R}|text`, w.to);
    }
    if (a !== void 0) {
      const { config: T, start: _, end: M } = ws(a), P = this.nextTrackId(`${h[0]}-motionPath`), R = {
        id: P,
        target: h[0],
        ...h.length > 1 && { targets: h },
        ...m && h.length > 1 && { stagger: m },
        property: "motionPath",
        motionPathConfig: T,
        delay: p + g,
        keyframes: this.keyframesFor(_, M, d, y, r.ease)
      };
      this.timeline.addTrack(R), v.push(P);
    }
    if (u !== void 0)
      for (const [T, _] of Object.entries(u)) {
        const M = this.resolveStart(h[0], T);
        if (typeof M != "number") {
          this.warn(`inertia on "${T}" needs a numeric start value; skipped`);
          continue;
        }
        const P = $s(M, _), R = this.nextTrackId(`${h[0]}-${T}-inertia`), N = {
          id: R,
          target: h[0],
          ...h.length > 1 && { targets: h },
          ...m && h.length > 1 && { stagger: m },
          property: T,
          kind: "inertia",
          inertia: P,
          delay: p + g
        };
        this.timeline.addTrack(N), v.push(R), k = Math.max(k, lt(P));
        for (const Y of h) this.lastValues.set(`${Y}|${T}`, ct(P));
      }
    const L = ((u !== void 0 || S !== void 0) && !b && !w && a === void 0 ? k : Math.max(d, k)) + (m && h.length > 1 ? vt(h.length, m) : 0), A = p + g + L;
    return this.previousStart = p + g, this.previousEnd = A, this.cursor = Math.max(this.cursor, A), {
      trackIds: v,
      start: p + g,
      end: A,
      kill: () => {
        for (const T of v) this.timeline.removeTrack(T);
      }
    };
  }
  /**
   * Two keyframes, or a baked sequence when the ease has no closed form.
   */
  keyframesFor(t, i, s, n, r) {
    const o = { time: 0, value: t };
    if (s <= 0)
      return [{ time: 0, value: i }];
    const a = typeof r == "string" ? oe(r) : void 0;
    return a?.requiresBaking && this.options.bakeEases && a.fn ? [
      o,
      ...zi(o, { time: s, value: i }, a.fn, {
        intervalMs: this.options.bakeIntervalMs
      })
    ] : (a?.requiresBaking && !this.options.bakeEases && this.warn(
      `ease "${r}" cannot be represented as a cubic-bezier; falling back to a smooth curve. Pass { bakeEases: true } to sample it into keyframes.`
    ), [o, { time: s, value: i, ...n && { easing: n } }]);
  }
  /** Resolve a start value through the documented chain. */
  resolveStart(t, i) {
    const s = this.lastValues.get(`${t}|${i}`);
    if (s !== void 0) return s;
    const n = this.options.startValue?.(t, i);
    if (n !== void 0) return n;
    const r = this.options.defaults?.[i];
    if (r !== void 0) return r;
    if (i === "text") return "";
    if (i === "d")
      throw new Error(
        `gsap-compat: no starting shape for "${t}". Use fromTo({ d: … }, { morphSVG: … }), or live.to(), which reads the element's current shape.`
      );
    const o = vs(i);
    return o !== void 0 ? (this.warn(
      `no start value for "${i}" on "${t}" — using the static default ${o}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), o) : (this.warn(`no start value or default for "${i}" on "${t}" — using 0`), 0);
  }
  easingFor(t) {
    if (t !== void 0) {
      if (typeof t == "string") return oe(t).easing;
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
function It(e) {
  if (typeof e == "string") return e;
  if (e && typeof e == "object") {
    const t = e;
    return String(t.value ?? t.text ?? "");
  }
  return String(e ?? "");
}
function Ds(e) {
  return new Q(e);
}
function nt(e) {
  return _s(ks(e));
}
const Rs = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), Fs = "#ffffff", Ls = "rgba(0, 0, 0, 0.5)";
function Bs(e) {
  const t = [];
  if (e.blur !== void 0 && t.push(`blur(${Math.max(0, e.blur)}px)`), e.brightness !== void 0 && t.push(`brightness(${Math.max(0, e.brightness)})`), e.glow !== void 0 && t.push(`drop-shadow(0 0 ${Math.max(0, e.glow)}px ${e.glowColor ?? Fs})`), e.shadowX !== void 0 || e.shadowY !== void 0 || e.shadowBlur !== void 0) {
    const i = e.shadowX ?? 0, s = e.shadowY ?? 0, n = Math.max(0, e.shadowBlur ?? 0);
    t.push(`drop-shadow(${i}px ${s}px ${n}px ${e.shadowColor ?? Ls})`);
  }
  return t.length > 0 ? t.join(" ") : null;
}
function Xs(e, t) {
  const i = e.childNodes.length === 1 ? e.firstChild : null;
  if (i && i.nodeType === 3) {
    const s = i;
    s.data !== t && (s.data = t);
    return;
  }
  e.textContent !== t && (e.textContent = t);
}
function Ns(e) {
  if (!("ownerSVGElement" in e)) return;
  const t = e.style;
  !t || t.transformBox || (t.transformBox = "fill-box", t.transformOrigin || (t.transformOrigin = "50% 50%"));
}
const ce = /* @__PURE__ */ new Set([
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
]), Ys = /* @__PURE__ */ new Set([
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
]), Os = /* @__PURE__ */ new Set(["originX", "originY"]), qs = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), Vs = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
};
class U {
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
    for (const [i, s] of t.values) {
      const n = this.targets.get(i);
      n && this.applyProperties(n, s);
    }
  }
  /**
   * Apply properties to a single element.
   */
  applyProperties(t, i) {
    const s = [];
    let n = null, r = null, o = null;
    const a = i.has("motionPathX"), c = i.has("motionPathY"), l = i.has("motionPathRotate");
    for (const [h, p] of i)
      if (!(h === "x" && a) && !(h === "y" && c) && !((h === "rotate" || h === "rotateZ") && l)) {
        if (Ys.has(h)) {
          const g = this.buildTransformPart(h, p);
          g && s.push(g);
        } else if (Os.has(h))
          typeof p == "number" && ((n ??= {})[h] = p);
        else if (qs.has(h))
          typeof p == "number" && ((r ??= {})[h] = p);
        else if (Rs.has(h))
          (o ??= {})[h] = p;
        else if (h !== "perspective") {
          if (h !== "shine") if (h === "text" && typeof p == "string")
            Xs(t, p);
          else if (h === "d" && typeof p == "string") {
            const g = t;
            (g.tagName?.toLowerCase() === "path" ? g : g.querySelector?.("path"))?.setAttribute?.("d", p);
          } else
            this.applyStyleProperty(t, h, p);
        }
      }
    const u = i.get("shine");
    typeof u == "number" && this.applyShine(t, u);
    const f = i.get("perspective");
    if (typeof f == "number" && s.unshift(`perspective(${f}px)`), s.length > 0 && (t.style.transform = s.join(" "), Ns(t)), n) {
      const h = n.originX ?? 50, p = n.originY ?? 50;
      t.style.transformOrigin = `${h}% ${p}%`;
    }
    if (r) {
      const h = r.clipTop ?? 0, p = r.clipRight ?? 0, g = r.clipBottom ?? 0, d = r.clipLeft ?? 0;
      t.style.clipPath = `inset(${h}% ${p}% ${g}% ${d}%)`;
    }
    if (o) {
      const h = Bs(o);
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
    const s = t.dataset.shineBase, n = -20 + i * 140, r = t.style;
    r.color = "transparent", r.backgroundImage = `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.9) 50%, transparent 60%), linear-gradient(${s}, ${s})`, r.backgroundSize = "250% 100%, 100% 100%", r.backgroundPosition = `${n}% 0, 0 0`, r.backgroundRepeat = "no-repeat", r.webkitBackgroundClip = "text", r.backgroundClip = "text";
  }
  /**
   * Apply a single style property to an element.
   */
  applyStyleProperty(t, i, s) {
    let n;
    i === "fill" && t.dataset.elementType === "text" ? n = "color" : n = Vs[i] ?? i;
    let r;
    typeof s == "number" ? ce.has(i) || ce.has(n) ? r = `${s}px` : r = String(s) : Array.isArray(s) ? r = s.join(", ") : r = s, t.style[n] = r;
  }
}
const Us = {
  request: (e) => requestAnimationFrame(e),
  cancel: (e) => cancelAnimationFrame(e)
};
class js {
  adapter = new U();
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
    this.scheduler = t.scheduler ?? Us, this.rootOption = t.root;
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
    for (const s of this.targetsOf(t))
      i.push(this.nameFor(s));
    return i;
  }
  /** Find one element the way selector targets are found: within the stage's root. */
  query(t) {
    return this.root.querySelector(t);
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
    for (const n of [...this.active.keys()].reverse()) {
      if (n.getTracks({ target: t, property: i }).length === 0) continue;
      const r = n.currentTime;
      if (r < 4) return 0;
      const o = n.getStateAtTime(r).values.get(t)?.get(i), a = n.getStateAtTime(r - 4).values.get(t)?.get(i);
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
      this.destroyed || (this.tickerCallbacks.size === 0 && (this.tickerTime = 0, this.tickerFrame = 0), this.tickerCallbacks.add(t), this.startLoop());
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
    this.destroyed || (t.onUpdate = (s) => this.write(s), this.active.delete(t), this.active.set(t, i), this.startLoop());
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
  apply(t, i) {
    if (this.destroyed) return;
    const s = new Map(Object.entries(i));
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
    for (const [i, s] of [...this.active])
      i.duration <= 0 ? (this.write(i.getStateAtTime(0)), i.stop()) : i.tick(t), s.onUpdate?.(), i.playbackState !== "playing" && this.active.delete(i);
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
    for (const [i, s] of t.values) {
      let n = this.applied.get(i);
      n || (n = /* @__PURE__ */ new Map(), this.applied.set(i, n));
      for (const [r, o] of s) n.set(r, o);
      this.dirty.add(i);
    }
  }
  flush() {
    if (this.dirty.size === 0) return;
    const t = /* @__PURE__ */ new Map();
    for (const i of this.dirty) {
      const s = this.applied.get(i), n = this.objects.get(i);
      if (n)
        for (const [r, o] of s) n[r] = o;
      else
        t.set(i, s);
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
      return Array.from(this.root.querySelectorAll(t));
    if (le(t)) return [t];
    if (!Ws(t)) return [t];
    const i = [];
    for (const s of Array.from(t))
      i.push(...this.targetsOf(s));
    return i;
  }
  nameFor(t) {
    return le(t) ? this.elementName(t) : this.objectName(t);
  }
  objectName(t) {
    const i = this.objectNames.get(t);
    if (i) return i;
    let s;
    do
      this.nameCounter += 1, s = `obj-${this.nameCounter}`;
    while (this.objects.has(s) || this.elements.has(s));
    return this.objectNames.set(t, s), this.objects.set(s, t), s;
  }
  elementName(t) {
    const i = this.names.get(t);
    if (i) return i;
    let s = t.id ? `#${t.id}` : "";
    if (!s || this.elements.has(s))
      do
        this.nameCounter += 1, s = `el-${this.nameCounter}`;
      while (this.elements.has(s));
    return this.names.set(t, s), this.elements.set(s, t), this.adapter.registerTarget(s, t), s;
  }
}
function le(e) {
  return typeof e == "object" && e !== null && e.nodeType === 1;
}
function Ws(e) {
  if (Array.isArray(e)) return !0;
  const t = e;
  return typeof t.length == "number" && typeof t.item == "function";
}
function bt(e) {
  const t = e.style;
  if (!t) return e.getBoundingClientRect();
  const i = t.transform;
  t.transform = "none";
  const s = e.getBoundingClientRect();
  return t.transform = i, s;
}
const he = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function Gs(e) {
  const t = {};
  for (const i of Array.from(e.attributes)) t[i.name] = i.value;
  return t;
}
function Hs(e) {
  const t = e.getScreenCTM?.();
  if (t) return [t.a, t.b, t.c, t.d, t.e, t.f];
  const i = e.getBoundingClientRect();
  return [1, 0, 0, 1, i.left, i.top];
}
function zs(e, t) {
  const i = typeof e == "string" || Array.isArray(e) || he(e) ? { path: e } : e, { align: s, alignOrigin: n, path: r, ...o } = i, a = (w) => {
    const x = he(w) ? w : t.query(w);
    return x || t.warn(`gsap-compat: motionPath could not find "${String(w)}"`), x;
  };
  let c = null, l = "";
  if (Array.isArray(r) || typeof r == "string" && ht(r))
    l = r;
  else {
    c = a(r);
    const w = c && Yt({ tag: c.localName, attributes: Gs(c) });
    c && !w && t.warn(`gsap-compat: motionPath element <${c.localName}> has no path geometry`), l = w ?? "";
  }
  const u = { ...o, path: l };
  if (s === void 0 || s === !1) return u;
  const f = s === !0 ? c : a(s);
  if (!f)
    return s === !0 && t.warn("gsap-compat: motionPath align: true needs the path to be an element"), u;
  const h = t.targets[0];
  if (!h) return u;
  const [p, g, d, m, y, v] = Hs(f), S = bt(h), [k, b] = n ?? [0.5, 0.5];
  for (const w of t.targets.slice(1)) {
    const x = bt(w);
    if (Math.abs(x.left - S.left) > 0.5 || Math.abs(x.top - S.top) > 0.5) {
      t.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return u.matrix = [p, g, d, m, y - S.left - k * S.width, v - S.top - b * S.height], u;
}
const Ze = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function Ke(e) {
  const t = {};
  for (const i of Array.from(e.attributes)) t[i.name] = i.value;
  return t;
}
function Qe(e) {
  if (!e) return null;
  const t = Yt({ tag: e.localName, attributes: Ke(e) });
  return t || (e.querySelector("path")?.getAttribute("d") ?? null);
}
function Zs(e, t, i) {
  const s = He(e);
  if (typeof s == "string" && ht(s)) return s;
  const n = Ze(s) ? s : typeof s == "string" ? t(s) : null, r = Qe(n);
  return r || (i(`gsap-compat: morphSVG could not find a shape for "${String(s)}"`), "");
}
const Ks = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function Qs(e, t = document) {
  return (typeof e == "string" ? Array.from(t.querySelectorAll(e)) : Ze(e) ? [e] : Array.from(e)).map((s) => {
    if (s.localName === "path") return s;
    const n = Yt({ tag: s.localName, attributes: Ke(s) });
    if (!n || !s.parentNode) return s;
    const r = s.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const o of Array.from(s.attributes))
      Ks.has(o.name) || r.setAttribute(o.name, o.value);
    return r.setAttribute("d", n), s.parentNode.replaceChild(r, s), r;
  });
}
const ue = 0.3;
class Js {
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
  begin(t, i, s) {
    this.dragging = !0, this.passedTolerance = !1, this.startX = t, this.startY = i, this.lastX = t, this.lastY = i, this.velocityX = 0, this.velocityY = 0, this.lastTime = fe(), this.options.onPress?.(this.stateFrom(0, 0, s));
  }
  move(t, i, s) {
    if (!this.dragging) return;
    const n = t - this.lastX, r = i - this.lastY;
    this.lastX = t, this.lastY = i;
    const o = t - this.startX, a = i - this.startY, c = this.options.tolerance ?? 3;
    if (!this.passedTolerance) {
      if (Math.hypot(o, a) < c) return;
      this.passedTolerance = !0;
    }
    this.updateVelocity(n, r), this.options.preventDefault !== !1 && s.cancelable && s.preventDefault(), this.options.onMove?.(this.stateFrom(n, r, s));
  }
  end(t) {
    this.dragging && (this.dragging = !1, this.options.onRelease?.(this.stateFrom(0, 0, t)));
  }
  updateVelocity(t, i) {
    const s = fe(), n = Math.max(1, s - this.lastTime);
    this.lastTime = s;
    const r = t / n * 1e3, o = i / n * 1e3;
    this.velocityX += (r - this.velocityX) * ue, this.velocityY += (o - this.velocityY) * ue;
  }
  stateFrom(t, i, s) {
    return {
      deltaX: t,
      deltaY: i,
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
    const i = t, s = this.target;
    if (typeof i.pointerId == "number" && typeof s.setPointerCapture == "function")
      try {
        s.setPointerCapture(i.pointerId);
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
function fe() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function tn(e, t, i) {
  let s = { delta: 0, line: null }, n = i;
  for (const r of e)
    for (const o of t) {
      const a = Math.abs(o - r);
      a <= n && (n = a, s = { delta: o - r, line: o });
    }
  return s;
}
function en(e, t) {
  return t <= 0 ? [] : e.map((i) => Math.round(i / t) * t);
}
class Je {
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
    this.options = t, this.x = t.initialX ?? 0, this.y = t.initialY ?? 0, this.observer = new Js({
      target: t.target,
      onPress: (i) => {
        const s = t.getPosition?.();
        s && (this.x = s.x, this.y = s.y), this.originX = this.x, this.originY = this.y, t.onPress?.(i);
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
    const s = this.options.axis ?? "both";
    this.x = s === "y" ? this.x : this.applyConstraints(t, "x"), this.y = s === "x" ? this.y : this.applyConstraints(i, "y");
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
    const s = this.options.scrubDistance ?? 500;
    if (s === 0) return;
    const n = (this.options.axis ?? "both") === "y" ? this.y : this.x, r = sn(n / s);
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
    let s = t;
    const n = [
      ...en([s], this.options.snap ?? 0),
      ...(i === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], r = tn([s], n, this.snapThreshold());
    s += r.delta, i === "x" ? this.snappedX = r.line : this.snappedY = r.line;
    const o = this.options.bounds;
    if (o) {
      const a = i === "x" ? o.minX : o.minY, c = i === "x" ? o.maxX : o.maxY;
      a !== void 0 && (s = Math.max(a, s)), c !== void 0 && (s = Math.min(c, s));
    }
    return s;
  }
}
function sn(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e;
}
function Wn(e) {
  const t = new Je(e);
  return t.start(), t;
}
const nn = { x: "x", y: "y", "x,y": "both" }, pe = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function de(e, t) {
  const i = bt(e), s = t.getBoundingClientRect();
  return {
    minX: s.left - i.left,
    maxX: s.right - i.right,
    minY: s.top - i.top,
    maxY: s.bottom - i.bottom
  };
}
function me(e) {
  return Array.isArray(e) ? [...e] : e;
}
function rn(e, t, i, s = {}) {
  const [n] = t.resolveTargets(i), r = n ? t.elementFor(n) : void 0;
  if (!n || !r)
    throw new Error(`gsap-compat: live.draggable could not find ${String(i)}`);
  const o = nn[s.type ?? "x,y"], a = () => {
    const d = t.appliedValue(n, "x"), m = t.appliedValue(n, "y");
    return { x: typeof d == "number" ? d : 0, y: typeof m == "number" ? m : 0 };
  }, c = typeof s.bounds == "string" ? t.query(s.bounds) : pe(s.bounds) ? s.bounds : null, u = { bounds: (!c && s.bounds && !pe(s.bounds) ? s.bounds : void 0) ?? (c ? de(r, c) : void 0) };
  let f = null;
  const h = () => {
    f?.kill(), f = null;
  }, p = (d) => {
    const m = s.inertia === !0 ? {} : s.inertia, y = m.friction ?? (m.resistance !== void 0 ? ze(m.resistance) : 4), v = a(), S = u.bounds ?? {};
    let k, b;
    const w = m.end;
    if (Array.isArray(w)) {
      const E = yt({ from: v.x, velocity: o === "y" ? 0 : d.x, friction: y }), L = yt({ from: v.y, velocity: o === "x" ? 0 : d.y, friction: y });
      let A = w[0];
      for (const T of w)
        Math.hypot(T.x - E, T.y - L) < Math.hypot(A.x - E, A.y - L) && (A = T);
      A && (k = [A.x], b = [A.y]);
    } else typeof w == "number" ? (k = w, b = w) : w && (k = me(w.x), b = me(w.y));
    const x = {};
    o !== "y" && (x.x = { velocity: d.x, friction: y, min: S.minX, max: S.maxX, end: k }), o !== "x" && (x.y = { velocity: d.y, friction: y, min: S.minY, max: S.maxY, end: b }), f = e.to(r, { inertia: x, onComplete: () => s.onThrowComplete?.() });
  }, g = new Je({
    target: r,
    axis: o,
    snap: s.snap,
    get bounds() {
      return u.bounds;
    },
    getPosition: a,
    onPress: () => {
      h(), c && (u.bounds = de(r, c)), s.onPress?.();
    },
    onDrag: (d) => {
      t.apply(n, o === "x" ? { x: d.x } : o === "y" ? { y: d.y } : { x: d.x, y: d.y }), s.onDrag?.(d);
    },
    onRelease: () => {
      const d = g.velocity;
      s.onRelease?.(d), s.inertia && p(d);
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
const on = { opacity: 0, scale: 0.6 };
function an(e) {
  const t = e.getBoundingClientRect();
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function ge(e) {
  const t = bt(e);
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function ye(e, t) {
  const s = e.resolveTargets(t).map((o) => e.elementFor(o)).filter((o) => !!o), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of s) {
    const a = an(o);
    n.set(o, a);
    const c = ti(o);
    a && c !== void 0 && !r.has(c) && r.set(c, { element: o, box: a });
  }
  return { elements: s, boxes: n, ids: r };
}
const Dt = /* @__PURE__ */ new WeakMap();
function be(e, t, i, s = {}) {
  const n = s.duration ?? 0.6, r = s.ease ?? "power2.inOut", o = s.stagger ?? 0, a = s.scale !== !1, c = s.enter === void 0 ? on : s.enter, l = new Set(i.elements);
  if (s.targets !== void 0)
    for (const p of e.resolveTargets(s.targets)) {
      const g = e.elementFor(p);
      g && l.add(g);
    }
  const u = [...l].sort(
    (p, g) => p === g ? 0 : p.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), f = t({ onComplete: s.onComplete });
  let h = 0;
  for (const p of u) {
    const g = ge(p);
    if (!g) continue;
    let d = i.boxes.get(p) ?? null, m;
    const y = ti(p), v = !d && y !== void 0 ? i.ids.get(y) : void 0;
    v && v.element !== p && (d = v.box, m = v.element);
    const [S] = e.resolveTargets(p);
    Dt.get(p)?.timeline.removeTracks({ target: S });
    const k = h * o;
    if (!d) {
      if (c === !1) continue;
      f.fromTo(p, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...c }, { ...cn(c), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: n, ease: r, delay: k }, 0), Dt.set(p, f), h++;
      continue;
    }
    const b = d.cx - g.cx, w = d.cy - g.cy, x = a ? d.width / g.width : 1, E = a ? d.height / g.height : 1;
    if (!(Math.abs(b) > 0.5 || Math.abs(w) > 0.5 || Math.abs(x - 1) > 1e-3 || Math.abs(E - 1) > 1e-3)) {
      const T = (_, M) => {
        const P = e.appliedValue(S, _);
        return typeof P == "number" && Math.abs(P - M) > 1e-6;
      };
      (T("x", 0) || T("y", 0) || T("scaleX", 1) || T("scaleY", 1)) && f.set(p, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const A = s.fade === !0 && m !== void 0;
    f.fromTo(
      p,
      { x: b, y: w, scaleX: x, scaleY: E, ...A && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...A && { opacity: 1 }, duration: n, ease: r, delay: k },
      0
    ), A && m && ge(m) && f.fromTo(m, { opacity: 1 }, { opacity: 0, duration: n, ease: r, delay: k }, 0), Dt.set(p, f), h++;
  }
  return f;
}
function ti(e) {
  return e.dataset?.flipId;
}
function cn(e) {
  const t = {};
  for (const i of Object.keys(e))
    t[i] = i === "opacity" || i.startsWith("scale") ? 1 : 0;
  return t;
}
function ln(e, t = {}) {
  const i = new Set((t.type ?? "chars,words,lines").split(",").map((a) => a.trim())), s = {
    chars: t.charsClass ?? "char",
    words: t.wordsClass ?? "word",
    lines: t.linesClass ?? "line"
  }, n = t.aria !== !1, r = [], o = { elements: e, chars: [], words: [], lines: [], masks: [] };
  for (const a of e) {
    r.push({ element: a, html: a.innerHTML, ariaLabel: a.getAttribute("aria-label") });
    const c = (a.textContent ?? "").replace(/\s+/g, " ").trim(), l = hn(a, s.words), u = i.has("chars") ? l.flatMap((p) => un(p, s.chars)) : [], f = i.has("lines") ? pn(a, l, s.lines) : [];
    if (n) {
      !a.hasAttribute("aria-label") && c && a.setAttribute("aria-label", c);
      for (const p of l) p.setAttribute("aria-hidden", "true");
    }
    if (i.has("words")) o.words.push(...l);
    else for (const p of l) p.removeAttribute("class");
    o.chars.push(...u), o.lines.push(...f);
    const h = t.mask === "lines" ? f : t.mask === "words" ? l : t.mask === "chars" ? u : [];
    for (const p of h) o.masks.push(dn(p, `${s[t.mask]}-mask`));
  }
  return {
    ...o,
    revert() {
      for (const { element: a, html: c, ariaLabel: l } of r)
        a.innerHTML = c, l === null ? a.removeAttribute("aria-label") : a.setAttribute("aria-label", l);
    }
  };
}
function hn(e, t) {
  const i = e.ownerDocument, s = [], n = i.createTreeWalker(
    e,
    4
    /* NodeFilter.SHOW_TEXT */
  ), r = [];
  for (let o = n.nextNode(); o; o = n.nextNode()) r.push(o);
  for (const o of r) {
    const a = o.data.match(/\s+|\S+/g) ?? [];
    if (a.length === 0) continue;
    const c = i.createDocumentFragment();
    for (const l of a) {
      if (/^\s/.test(l)) {
        c.appendChild(i.createTextNode(l));
        continue;
      }
      const u = i.createElement("span");
      u.className = t, u.style.display = "inline-block", u.textContent = l, c.appendChild(u), s.push(u);
    }
    o.replaceWith(c);
  }
  return s;
}
function un(e, t) {
  const i = e.ownerDocument, s = fn(e.textContent ?? "").map((n) => {
    const r = i.createElement("span");
    return r.className = t, r.style.display = "inline-block", r.textContent = n, r;
  });
  return e.replaceChildren(...s), s;
}
function fn(e) {
  const t = Intl.Segmenter;
  return t ? Array.from(new t(void 0, { granularity: "grapheme" }).segment(e), (i) => i.segment) : Array.from(e);
}
function pn(e, t, i) {
  const s = e.ownerDocument, n = new Map(t.map((g) => [g, g.getBoundingClientRect()])), r = [], o = (g) => {
    for (const d of Array.from(g.childNodes))
      d.nodeType === 3 || n.has(d) || d.tagName === "BR" ? r.push(d) : o(d);
  };
  o(e);
  const a = [];
  let c = null, l = 0, u = 0, f = !1, h = [];
  const p = () => {
    c = s.createElement("span"), c.className = i, c.style.display = "block", a.push(c), h = [];
  };
  for (const g of r) {
    if (g.tagName === "BR") {
      f = !0;
      continue;
    }
    const d = n.get(g);
    if (d && (!c || f || d.top > l + u) && (p(), l = d.top, u = d.height / 2, f = !1), !c) continue;
    const m = [];
    for (let S = g.parentNode; S && S !== e; S = S.parentNode) m.unshift(S);
    let y = 0;
    for (; y < h.length && y < m.length && h[y].original === m[y]; ) y++;
    h.length = y;
    let v = y === 0 ? c : h[y - 1].clone;
    for (const S of m.slice(y)) {
      const k = S.cloneNode(!1);
      v.appendChild(k), h.push({ original: S, clone: k }), v = k;
    }
    v.appendChild(g);
  }
  return e.replaceChildren(...a), a;
}
function dn(e, t) {
  const i = e.ownerDocument.createElement("span");
  return i.className = t, i.style.display = e.style.display === "block" ? "block" : "inline-block", i.style.overflow = "clip", e.replaceWith(i), i.appendChild(e), i;
}
const Te = {
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
function ve(e) {
  const t = e.trim().toLowerCase();
  if (t in Te) return Te[t];
  if (t.endsWith("%")) {
    const i = Number.parseFloat(t.slice(0, -1));
    return Number.isNaN(i) ? void 0 : i / 100;
  }
}
function mn(e) {
  if (typeof e == "number")
    return { elementFraction: 0, viewportFraction: 0, offsetPx: 0, absolutePx: e };
  let t = 0;
  const s = e.replace(/([+-])=\s*(-?[\d.]+)/g, (o, a, c) => (t += (a === "-" ? -1 : 1) * Number.parseFloat(c), "")).trim().split(/\s+/).filter(Boolean);
  if (s.length === 1 && /^-?[\d.]+$/.test(s[0]))
    return {
      elementFraction: 0,
      viewportFraction: 0,
      offsetPx: 0,
      absolutePx: Number.parseFloat(s[0]) + t
    };
  const n = s[0] !== void 0 ? ve(s[0]) : void 0, r = s[1] !== void 0 ? ve(s[1]) : void 0;
  return {
    elementFraction: n ?? 0,
    viewportFraction: r ?? 0,
    offsetPx: t
  };
}
function Tt(e, t, i) {
  const s = mn(i), n = s.absolutePx !== void 0 ? e.top + s.absolutePx : e.top + e.height * s.elementFraction, r = t * s.viewportFraction;
  return n - r + s.offsetPx;
}
function Gn(e, t, i, s) {
  const n = Tt(e, t, i), o = Tt(e, t, s) - n;
  return o <= 0 ? n <= 0 ? 1 : 0 : ei(-n / o);
}
function ei(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e === 0 ? 0 : e;
}
function gn(e, t, i, s) {
  if (i <= 0) return t;
  const n = 1 - Math.exp(-(s / 1e3) / i);
  return e + (t - e) * n;
}
class yn {
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
function Hn(e) {
  const t = new yn(e);
  return t.start(), t;
}
class bn {
  element;
  spacer;
  saved;
  constructor(t) {
    this.element = t;
    const i = t.ownerDocument;
    this.spacer = i.createElement("div"), this.spacer.className = "pin-spacer", this.saved = { position: t.style.position, top: t.style.top }, t.replaceWith(this.spacer), this.spacer.appendChild(t);
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
  apply(t, i) {
    const s = this.element.offsetHeight;
    this.spacer.style.height = `${s + Math.max(0, i)}px`, this.element.style.position = "sticky", this.element.style.top = `${t}px`;
  }
  /** Remove the spacer and restore the element's own styles. */
  destroy() {
    this.element.style.position = this.saved.position, this.element.style.top = this.saved.top, this.spacer.parentNode && this.spacer.replaceWith(this.element);
  }
}
const Tn = 120, K = [], Rt = () => {
  for (const e of K) e.refresh();
};
class Vt {
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
  constructor(t) {
    this.timeline = t.timeline, this.options = t;
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const t = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    t && (this.pin = new bn(t)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), K.length === 0 && typeof window < "u" && window.addEventListener("resize", Rt, { passive: !0 }), K.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), K.splice(K.indexOf(this), 1), K.length === 0 && typeof window < "u" && window.removeEventListener("resize", Rt), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null);
  }
  /** Stop, and remove any pin spacer. */
  destroy() {
    this.stop(), this.pin?.destroy(), this.pin = null;
  }
  /**
   * Re-measure every started driver, in the order they started. Call after a
   * layout change a resize would not catch (images or fonts loading).
   */
  static refreshAll() {
    Rt();
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
    const t = this.scrollPosition();
    this.pin?.release();
    const i = this.triggerRect();
    if (i) {
      const s = this.viewportHeight();
      if (this.startPx = t + Tt(i, s, this.options.start ?? "top bottom"), this.endPx = this.resolveEnd(i, s, t), this.pin) {
        const n = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(n.top - (this.startPx - t), this.endPx - this.startPx);
      }
    }
    this.lastScroll = null, this.updateFrom(t, !this.measured), this.measured = !0;
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
    this.trackVelocity(t);
    const s = this.endPx - this.startPx, n = this.zone;
    this.targetProgress = s > 0 ? ei((t - this.startPx) / s) : t >= this.startPx ? 1 : 0, this.zone = s > 0 ? t <= this.startPx ? "before" : t >= this.endPx ? "after" : "active" : t >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(n, this.zone), i || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const t = this.options.scrub;
    return typeof t == "number" ? Math.max(0, t) : 0;
  }
  resolveEnd(t, i, s) {
    const n = this.options.end ?? "bottom top", r = typeof n == "string" ? n.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (r) {
      const o = Number.parseFloat(r[1]);
      return this.startPx + (r[2] === "%" ? i * o / 100 : o);
    }
    return s + Tt(t, i, n);
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
      this.idleTimer = null, this.velocityPxPerSecond = 0, this.emitUpdate();
    }, Tn));
  }
  /**
   * Emit enter/leave callbacks as the scroll position moves between zones. A jump
   * straight across the range (a fast flick, or loading the page scrolled past
   * it) fires both edges in order.
   */
  fireBoundaryCallbacks(t, i) {
    if (t === i) return;
    const { onEnter: s, onLeave: n, onEnterBack: r, onLeaveBack: o } = this.options;
    t === "before" ? (s?.(), i === "after" && n?.()) : t === "after" ? (r?.(), i === "before" && o?.()) : i === "after" ? n?.() : o?.();
  }
  startSmoothing() {
    if (this.rafId !== null || typeof requestAnimationFrame > "u") return;
    const t = (i) => {
      if (this.rafId = null, !this.running) return;
      const s = this.lastFrameTime === null ? 16.67 : i - this.lastFrameTime;
      this.lastFrameTime = i, this.displayProgress = gn(this.displayProgress, this.targetProgress, this.smoothing(), s);
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
    const i = this.options.scroller;
    if (i && typeof i.getBoundingClientRect == "function") {
      const s = i.getBoundingClientRect();
      return { top: t.top - s.top, bottom: t.bottom - s.top, height: t.height };
    }
    return { top: t.top, bottom: t.bottom, height: t.height };
  }
  viewportHeight() {
    const t = this.options.scroller;
    return t ? t.clientHeight : typeof window < "u" ? window.innerHeight : 0;
  }
}
function zn(e) {
  const t = new Vt(e);
  return t.start(), t;
}
function vn(e, t) {
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
function ii(e, t, i, s, n = () => {
}) {
  const r = (h) => typeof h == "string" ? e.query(h) ?? void 0 : h, o = r(t.trigger) ?? s;
  if (!o) {
    n(`gsap-compat: scrollTrigger has no trigger element${typeof t.trigger == "string" ? ` for "${t.trigger}"` : ""}`);
    return;
  }
  const a = t.scrub === void 0 || t.scrub === !1 ? !1 : t.scrub, c = (t.toggleActions ?? "play none none none").trim().split(/\s+/);
  let l = 0, u;
  const f = (h, p) => () => {
    p?.(), i && !a && vn(i, c[h] ?? "none"), t.once && h === 0 && queueMicrotask(() => u.destroy());
  };
  return u = new Vt({
    trigger: o,
    start: t.start,
    end: t.end,
    scrub: a === !1 ? void 0 : a,
    pin: t.pin === !0 ? !0 : r(t.pin),
    scroller: r(t.scroller),
    onUpdate: (h, p) => {
      if (i && a !== !1 && i.progress(h), t.onUpdate) {
        const g = h < l || p < 0 ? -1 : 1;
        t.onUpdate({ progress: h, velocity: p, direction: g });
      }
      l = h;
    },
    onEnter: f(0, t.onEnter),
    onLeave: f(1, t.onLeave),
    onEnterBack: f(2, t.onEnterBack),
    onLeaveBack: f(3, t.onLeaveBack)
  }), i && a === !1 && i.progress(0), u.start(), e.own(u);
}
class mt {
  /** The compiled compat timeline. */
  compat;
  stage;
  options;
  /** Cleared once playback has been started or explicitly controlled. */
  autoplayPending;
  started = !1;
  killed = !1;
  /** The first element any tween targeted: a scroll trigger's default trigger. */
  firstElement;
  scrollDriver;
  constructor(t, i = {}) {
    if (this.stage = t, this.options = i, this.compat = new Q({
      ...i,
      startValue: (s, n) => {
        const r = t.objectFor(s);
        if (r) return Sn(r[n]);
        const o = t.appliedValue(s, n);
        if (o !== void 0) return o;
        if (n === "d") return Qe(t.elementFor(s)) ?? void 0;
        if (n === "text") return t.elementFor(s)?.textContent ?? void 0;
        if (n === "strokeDasharray" || n === "strokeDashoffset") {
          const a = we(t.elementFor(s));
          if (a !== void 0) return n === "strokeDasharray" ? [a, a] : 0;
        }
      },
      startVelocity: (s, n) => t.velocityOf(s, n)
    }), this.compat.timeline.onComplete = () => i.onComplete?.(), this.autoplayPending = !i.paused && !i.scrollTrigger, i.scrollTrigger) {
      const s = i.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = ii(t, s, this, this.firstElement, (n) => i.onWarning?.(n)));
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
  to(t, i, s) {
    const n = this.resolve(t);
    return n && this.perElementStarts(n, i, s, (r, o, a) => this.compat.to(r, o, a)), this;
  }
  from(t, i, s) {
    const n = this.resolve(t);
    return n && this.perElementStarts(n, i, s, (r, o, a) => this.compat.from(r, o, a)), this;
  }
  fromTo(t, i, s, n) {
    const r = this.resolve(t);
    return r ? i.drawSVG === void 0 && s.drawSVG === void 0 || r.length === 1 ? (this.compat.fromTo(r, this.prepare(i, r), this.prepare(s, r), n), this) : (this.eachElement(
      r,
      s,
      n,
      (o, a, c) => this.compat.fromTo([o], this.prepare(i, [o]), this.prepare(a, [o]), c)
    ), this) : this;
  }
  set(t, i, s) {
    const n = this.resolve(t);
    return n && this.compat.set(n, this.prepare(i, n), s), this;
  }
  addLabel(t, i) {
    return this.compat.addLabel(t, i), this;
  }
  /** Merge another timeline in at a position (flattened, as in `tf`). */
  add(t, i) {
    return t.autoplayPending = !1, t.timeline.stop(), t.stage.deactivate(t.timeline), this.compat.add(t.compat, i), this;
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
  /** Whether the timeline is set to play backwards. */
  reversed() {
    return this.timeline.direction === "reverse";
  }
  /** Jump to a time in seconds, or to a label, and apply it immediately. */
  seek(t) {
    return this.autoplayPending = !1, this.compat.seek(t), this.stage.render(this.timeline), this;
  }
  /** Read or set progress, 0..1. Setting applies immediately. */
  progress(t) {
    if (t === void 0) return this.compat.progress();
    this.autoplayPending = !1;
    const i = this.compat.progress(t);
    return this.stage.render(this.timeline), i;
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
  /**
   * A track has one start value, but each element starts from its own shape or
   * text, and each plain object from its own current values. So a morph or text tween over several elements builds one tween per
   * element, all at the same position, with any stagger turned into delays.
   */
  perElementStarts(t, i, s, n) {
    if (!(i.morphSVG !== void 0 || i.drawSVG !== void 0 || i.text !== void 0 || i.scrambleText !== void 0 || t.some((o) => this.stage.objectFor(o) !== void 0)) || t.length === 1) {
      n(t, this.prepare(i, t), s);
      return;
    }
    this.eachElement(t, i, s, (o, a, c) => n([o], this.prepare(a, [o]), c));
  }
  /** One tween per element at the same position, with any stagger turned into delays. */
  eachElement(t, i, s, n) {
    const { stagger: r, ...o } = i, a = typeof r == "number" ? r : r?.each ?? 0;
    t.forEach((c, l) => {
      const u = Xt(o.delay, 0) / 1e3 + l * a;
      n(c, { ...o, delay: u }, l === 0 ? s : "<");
    });
  }
  /**
   * Resolve the parts of vars that refer to the page — today, a motion path
   * given as a selector or element, and its `align` — into plain data.
   */
  prepare(t, i) {
    const s = (o) => this.options.onWarning?.(o), n = (o) => this.stage.query(o);
    let r = t;
    if (t.motionPath !== void 0) {
      const o = zs(t.motionPath, {
        query: n,
        targets: i.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: s
      });
      r = { ...r, motionPath: o };
    }
    if (t.morphSVG !== void 0) {
      const o = Zs(t.morphSVG, n, s), { morphSVG: a, ...c } = r;
      r = o ? { ...r, morphSVG: o } : c;
    }
    if (t.drawSVG !== void 0) {
      const o = we(this.stage.elementFor(i[0]));
      if (o === void 0) {
        s("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...c } = r;
        r = c;
      } else
        r = Ms(r, o);
    }
    return r;
  }
  resolve(t) {
    const i = this.stage.resolveTargets(t);
    if (i.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${kn(t)}`);
      return;
    }
    return this.firstElement ??= i.map((s) => this.stage.elementFor(s)).find((s) => s !== void 0), i;
  }
}
function wn(e = new js()) {
  const t = (s) => {
    const { config: n } = gt(s);
    return new mt(e, {
      repeat: n.repeat,
      yoyo: n.yoyo,
      repeatDelay: n.repeatDelay,
      paused: n.paused,
      onStart: n.onStart,
      onUpdate: n.onUpdate,
      onComplete: n.onComplete,
      scrollTrigger: n.scrollTrigger
    });
  }, i = {
    stage: e,
    ticker: e.ticker,
    scrollTrigger: (s) => ii(e, s),
    refreshScroll: () => Vt.refreshAll(),
    timeline: (s) => new mt(e, s),
    to: (s, n) => t(n).to(s, n),
    from: (s, n) => t(n).from(s, n),
    fromTo: (s, n, r) => t(r).fromTo(s, n, r),
    set: (s, n) => t(n).set(s, n),
    convertToPath: (s) => Qs(s, e.root),
    splitText: (s, n) => ln(
      typeof s == "string" ? Array.from(e.root.querySelectorAll(s)) : "nodeType" in s ? [s] : Array.from(s),
      n
    ),
    draggable: (s, n) => rn(i, e, s, n),
    getFlipState: (s) => ye(e, s),
    flipFrom: (s, n) => be(e, (r) => new mt(e, r), s, n),
    flip: (s, n, r) => {
      const o = ye(e, s);
      return n(), be(e, (a) => new mt(e, a), o, { targets: s, ...r });
    }
  };
  return i;
}
const G = /* @__PURE__ */ wn();
function we(e) {
  const t = e;
  if (typeof t?.getTotalLength == "function")
    return t.getTotalLength();
}
function Sn(e) {
  if (typeof e == "number" || typeof e == "string" || Array.isArray(e) && e.every((t) => typeof t == "number")) return e;
}
function kn(e) {
  return typeof e == "string" ? `"${e}"` : String(e);
}
class Se {
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
    const s = this.targetTime(t);
    i ? (this.media.paused && this.safePlay(), Math.abs(this.media.currentTime - s) > this.driftTolerance && (this.media.currentTime = s)) : (this.media.paused || this.media.pause(), this.media.currentTime !== s && (this.media.currentTime = s));
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
function xn(e, t, i, s, n) {
  const r = i - n;
  if (r < 0) {
    t.paused || t.pause(), t.currentTime = 0;
    return;
  }
  e.update(r, s);
}
class si {
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
  constructor(t, i = {}) {
    if (typeof t == "string") {
      const s = document.querySelector(t);
      if (!s)
        throw new Error(`Container not found: ${t}`);
      this.container = s;
    } else
      this.container = t;
    this.options = i, this.adapter = new U();
  }
  /**
   * Load animation from a URL or JSON object.
   */
  async load(t) {
    let i;
    if (typeof t == "string") {
      const s = await fetch(t);
      if (!s.ok)
        throw new Error(`Failed to load animation: ${s.statusText}`);
      i = await s.json();
    } else
      i = t;
    this.options.speed !== void 0 && (i.config = { ...i.config, speed: this.options.speed }), this.options.loop !== void 0 && (i.config = { ...i.config, loop: this.options.loop }), this.options.alternate !== void 0 && (i.config = { ...i.config, alternate: this.options.alternate }), this.timeline = at(i), this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia(), this.options.autoplay && this.play();
  }
  /**
   * Find embedded media elements (`[data-tinyfly-media]`) in the container and
   * bind each to the timeline. Emitted by the editor's export for audio/video
   * scene elements; the `data-tinyfly-start` attribute sets when each begins.
   */
  scanMedia() {
    this.mediaTargets = [], this.container.querySelectorAll("[data-tinyfly-media]").forEach((i) => {
      const s = i, n = Number(s.getAttribute("data-tinyfly-start") ?? "0") || 0, r = s.getAttribute("data-volume");
      r !== null && (s.volume = Math.max(0, Math.min(1, Number(r) || 0))), this.mediaTargets.push({ el: s, startTime: n, sync: new Se(s) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(t, i) {
    for (const s of this.mediaTargets)
      xn(s.sync, s.el, t, i, s.startTime);
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
      const s = this.container.querySelector(i);
      s && (this.targets[t] = s, this.adapter.registerTarget(t, s));
    } else
      this.targets[t] = i, this.adapter.registerTarget(t, i);
  }
  /**
   * Auto-register targets using data-tinyfly attribute.
   */
  autoRegisterTargets() {
    this.container.querySelectorAll("[data-tinyfly]").forEach((i) => {
      const s = i.closest("[data-tinyfly-symbol]");
      if (s && s !== i) return;
      const n = i.getAttribute("data-tinyfly");
      n && this.registerTarget(n, i);
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
    const i = new Map(t.map((s) => [s.id, s]));
    this.container.querySelectorAll("[data-tinyfly-symbol]").forEach((s) => {
      const n = s.getAttribute("data-tinyfly-symbol");
      if (!n) return;
      const r = i.get(n);
      if (!r || !r.timeline.tracks?.length) return;
      const o = new U();
      s.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const c = a.getAttribute("data-tinyfly");
        c && o.registerTarget(c, a);
      }), this.symbolInstances.push({ adapter: o, timeline: at(r.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(t, i) {
    this.mediaSync = new Se(t, i), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const t = (i) => {
      if (this.isDestroyed || !this.timeline) return;
      const s = i - (this.lastTime ?? i);
      this.lastTime = i, this.timeline.tick(s), this.applyState();
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
    for (const i of this.symbolInstances) {
      const s = i.timeline.duration;
      i.adapter.applyState(i.timeline.getStateAtTime(s > 0 ? t % s : t));
    }
  }
}
async function Zn(e, t, i = {}) {
  const s = new si(e, { ...i, autoplay: !0 });
  return await s.load(t), s;
}
function Kn(e, t = {}) {
  return new si(e, t);
}
class An {
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
      const s = document.querySelector(t);
      if (!s) throw new Error(`Container not found: ${t}`);
      this.container = s;
    } else
      this.container = t;
    this.options = i, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new U(), this.adapterB = new U();
  }
  /**
   * Load a sequence from a URL or inline definition.
   */
  async load(t) {
    let i;
    if (typeof t == "string") {
      const s = await fetch(t);
      if (!s.ok)
        throw new Error(`Failed to load sequence: ${s.statusText}`);
      i = await s.json();
    } else
      i = t;
    this.sequence = i, this.symbolDefs.clear();
    for (const s of i.symbols ?? [])
      s.timeline?.tracks?.length && this.symbolDefs.set(s.id, s.timeline);
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
    const s = this.sequence.scenes[t];
    if (this.renderScene(s, this.containerA, this.adapterA), this.timelineA = this.createTimeline(s), this.options.onSceneChange?.(t), i)
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
  renderScene(t, i, s) {
    i.innerHTML = "", s.clearTargets();
    const n = document.createElement("div");
    n.style.cssText = "position:absolute;inset:0;transform-origin:center center", n.setAttribute("data-tinyfly", "Camera"), i.appendChild(n), s.registerTarget("Camera", n);
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
  setupNested(t, i) {
    const s = [];
    t.querySelectorAll("[data-tinyfly-symbol]").forEach((n) => {
      const r = n.getAttribute("data-tinyfly-symbol");
      if (!r) return;
      const o = this.symbolDefs.get(r);
      if (!o) return;
      const a = new U();
      n.querySelectorAll("[data-tinyfly]").forEach((c) => {
        const l = c.getAttribute("data-tinyfly");
        l && a.registerTarget(l, c);
      }), s.push({ adapter: a, timeline: at(o) });
    }), s.length ? this.nestedByAdapter.set(i, s) : this.nestedByAdapter.delete(i);
  }
  /** Apply the nested symbol states for a slot at a given scene time. */
  applyNested(t, i) {
    const s = this.nestedByAdapter.get(t);
    if (s)
      for (const n of s) {
        const r = n.timeline.duration;
        n.adapter.applyState(n.timeline.getStateAtTime(r > 0 ? i % r : i));
      }
  }
  clearContainer(t) {
    t.innerHTML = "";
  }
  createTimeline(t) {
    return t.timeline ? at(t.timeline) : null;
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
    const i = this.sequence.scenes[t], s = i.transition;
    if (s.type === "none" || s.duration <= 0) {
      this.switchToScene(t);
      return;
    }
    this._state = "transitioning", this.containerB.style.visibility = "visible", this.renderScene(i, this.containerB, this.adapterB), this.timelineB = this.createTimeline(i), this.timelineB && this.timelineB.play(), this.applyTransition(s.type, s.duration), this.transitionTimer = window.setTimeout(() => {
      this.finishTransition(t);
    }, s.duration);
  }
  applyTransition(t, i) {
    const s = `${i}ms`, n = "ease-in-out";
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
    const i = this.containerA;
    this.containerA = this.containerB, this.containerB = i;
    const s = this.adapterA;
    this.adapterA = this.adapterB, this.adapterB = s, this.timelineA = this.timelineB, this.timelineB = null, this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB), this._currentSceneIndex = t, this._state = "playing-scene", this.options.onSceneChange?.(t), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.playbackState !== "playing" && this.timelineA.play()) : this.onSceneComplete();
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
      const s = i - (this.lastTime ?? i);
      if (this.lastTime = i, this.timelineA && this.timelineA.playbackState === "playing") {
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
async function Qn(e, t, i = {}) {
  const s = new An(e, { ...i, autoplay: !0 });
  return await s.load(t), s;
}
const Jn = { type: "none", duration: 0 };
function tr(e) {
  const { timeline: t } = e, i = new U();
  for (const [l, u] of Object.entries(e.targets)) {
    const f = typeof u == "string" ? document.querySelector(u) : u;
    if (!f)
      throw new Error(`quickPlay: no element found for target "${l}" (${String(u)})`);
    i.registerTarget(l, f);
  }
  t.onUpdate = (l) => {
    i.applyState(l), e.onUpdate?.(l);
  }, e.onComplete && (t.onComplete = e.onComplete);
  let s = null, n = null, r = !1;
  const o = (l) => {
    if (r) return;
    const u = n === null ? 0 : l - n;
    n = l, u > 0 && t.tick(u), s = requestAnimationFrame(o);
  }, a = () => {
    s !== null || r || (n = null, s = requestAnimationFrame(o));
  }, c = () => {
    s !== null && cancelAnimationFrame(s), s = null, n = null;
  };
  return i.applyState(t.getStateAtTime(t.currentTime)), e.autoplay !== !1 && (t.play(), a()), {
    timeline: t,
    adapter: i,
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
      t.seek(l * 1e3), i.applyState(t.getStateAtTime(t.currentTime));
    },
    destroy() {
      r = !0, c(), t.stop(), i.clearTargets();
    }
  };
}
const er = {
  timeline: Ds,
  to(e, t, i) {
    const s = new Q(i);
    return s.to(e, t), s;
  },
  from(e, t, i) {
    const s = new Q(i);
    return s.from(e, t), s;
  },
  fromTo(e, t, i, s) {
    const n = new Q(s);
    return n.fromTo(e, t, i), n;
  },
  set(e, t, i) {
    const s = new Q(i);
    return s.set(e, t), s;
  }
}, ir = G.to, sr = G.from, nr = G.fromTo, rr = G.set, or = G.timeline, ar = G.ticker, cr = G.splitText;
export {
  Pn as Clock,
  Q as CompatTimeline,
  Fe as DEFAULT_BAKE_INTERVAL_MS,
  Ut as DEFAULT_INERTIA_FRICTION,
  F as DEFAULT_SPRING,
  Jn as DEFAULT_TRANSITION,
  Je as Draggable,
  mi as INERTIA_MAX_DURATION_MS,
  Qi as InertiaTrackPlayer,
  mt as LiveTimeline,
  Fn as MORPH_SAMPLES,
  _n as ManualClock,
  Se as MediaSync,
  Js as Observer,
  Me as SPRING_MAX_DURATION_MS,
  xt as SPRING_PRESETS,
  rt as SPRING_STEP_MS,
  Vt as ScrollDriver,
  bn as ScrollPin,
  wt as SpringSampler,
  Ki as SpringTrackPlayer,
  js as Stage,
  Ye as Timeline,
  si as TinyflyPlayer,
  An as TinyflySequencer,
  Pt as TrackPlayer,
  jn as ValueResolver,
  yn as VisibilityDriver,
  zi as bakeEasing,
  Be as bakeInertiaTrack,
  Le as bakeSpringTrack,
  ts as charactersFor,
  ei as clamp01,
  Ln as clearMorphCache,
  Dn as clearPathCache,
  Kn as create,
  xi as createCubicBezier,
  wn as createLive,
  os as createRandom,
  Bt as createTrack,
  En as criticalDamping,
  at as deserializeTimeline,
  ns as deserializeTrack,
  Wn as draggable,
  vi as easeIn,
  Pe as easeInCubic,
  Si as easeInOut,
  $e as easeInOutCubic,
  Ti as easeInOutQuad,
  yi as easeInQuad,
  wi as easeOut,
  Ce as easeOutCubic,
  bi as easeOutQuad,
  sr as from,
  On as fromJSON,
  nr as fromTo,
  Ee as getEasingFunction,
  Re as getInterpolator,
  Ne as getMotionPathPoint,
  Rn as getPathLength,
  Di as getPointAtProgress,
  en as gridLinesFor,
  li as hasKeyframes,
  qn as hashSeed,
  lt as inertiaDuration,
  ct as inertiaRest,
  Ft as inertiaValueAt,
  In as inertiaVelocityAt,
  Gi as interpolateArray,
  Wi as interpolateColor,
  Nn as interpolateMotionPath,
  O as interpolateNumber,
  Hi as interpolatePathString,
  se as interpolateString,
  ci as isCubicBezierEasing,
  j as isInertiaTrack,
  Mn as isMotionPathPoint,
  ke as isMotionPathTrack,
  ht as isPathData,
  W as isSpringTrack,
  Nt as isTextTrack,
  $n as isUnderdamped,
  Un as isUnresolved,
  _e as linear,
  G as live,
  oe as mapEase,
  hi as maxStaggerDistance,
  Vi as morphPath,
  yt as naturalRest,
  ve as parseEdge,
  ot as parsePath,
  mn as parseTrigger,
  Zn as play,
  Qn as playSequence,
  Hn as playWhenVisible,
  Ie as pointAtDistance,
  ls as pointsToPath,
  tr as quickPlay,
  qe as randomBetween,
  Vn as randomChoice,
  as as randomSnapped,
  cs as resolveSequence,
  je as resolveValue,
  Gn as scrollProgress,
  zn as scrubOnScroll,
  rs as serializeTimeline,
  ss as serializeTrack,
  rr as set,
  Yt as shapeToPathData,
  Zi as simplifyKeyframes,
  gn as smoothToward,
  tn as snapAxis,
  cr as splitText,
  fi as springDuration,
  Cn as springValueAt,
  xe as staggerDistance,
  Ae as staggerOffset,
  ui as staggerOffsets,
  vt as staggerSpan,
  xn as syncMediaElement,
  is as textAt,
  er as tf,
  ar as ticker,
  or as timeline,
  ir as to,
  Yn as toJSON,
  Bn as toKeyframedTrack,
  Xn as toKeyframedTracks,
  V as trackTargets,
  Tt as triggerDistance
};
