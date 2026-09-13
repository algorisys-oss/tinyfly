function ms(e) {
  return typeof e == "object" && e !== null && e.type === "cubic-bezier";
}
function Nt(e) {
  return e.property === "text" && "textConfig" in e;
}
function W(e) {
  return e.kind === "inertia" && "inertia" in e;
}
function G(e) {
  return e.kind === "spring" && "spring" in e;
}
function _e(e) {
  return e.property === "motionPath" && "motionPathConfig" in e;
}
function Fn(e) {
  return typeof e == "object" && e !== null && "x" in e && "y" in e && "angle" in e;
}
function gs(e) {
  return "keyframes" in e;
}
class Ln {
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
class Bn {
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
function Pe(e, t, s = "start") {
  if (t <= 1) return 0;
  if (typeof s == "number") {
    const i = Math.max(0, Math.min(t - 1, s));
    return Math.abs(e - i);
  }
  switch (s) {
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
function ys(e, t = "start") {
  if (e <= 1) return 0;
  let s = 0;
  for (let i = 0; i < e; i++)
    s = Math.max(s, Pe(i, e, t));
  return s;
}
function Ce(e, t, s) {
  const i = s.from ?? "start", n = Pe(e, t, i);
  if (s.amount !== void 0) {
    const r = ys(t, i);
    return r === 0 ? 0 : s.amount * n / r;
  }
  return s.each !== void 0 ? s.each * n : 0;
}
function bs(e, t) {
  return Array.from({ length: e }, (s, i) => Ce(i, e, t));
}
function wt(e, t) {
  return e <= 1 ? 0 : Math.max(...bs(e, t));
}
const at = 1, $e = 6e4, mt = $e / at, F = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, At = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class St {
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
    const s = Math.floor(t / at);
    if (this.simulateTo(s + 1), this.settledStep !== null && s >= this.settledStep)
      return this.to;
    const i = this.samples[Math.min(s, this.samples.length - 1)], n = this.samples[Math.min(s + 1, this.samples.length - 1)], r = t / at - s;
    return i + (n - i) * r;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(mt + 1), this.settledStep !== null ? this.settledStep * at : $e;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(t) {
    if (this.settledStep !== null) return;
    const s = Math.min(t, mt + 1), i = at / 1e3;
    for (; this.samples.length < s; ) {
      const n = this.samples[this.samples.length - 1], r = n - this.to, o = -this.stiffness * r, a = -this.damping * this.velocity, c = (o + a) / this.mass;
      this.velocity += c * i;
      const l = n + this.velocity * i;
      if (this.samples.push(l), this.isAtRest(l)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > mt && (this.settledStep = mt);
  }
}
function On(e, t) {
  return new St(e).valueAt(t);
}
function Ts(e) {
  return new St(e).settleTime();
}
function Xn(e) {
  const t = e.stiffness ?? F.stiffness, s = e.damping ?? F.damping, i = e.mass ?? F.mass;
  return s < 2 * Math.sqrt(t * i);
}
function Nn(e) {
  const t = e.stiffness ?? F.stiffness, s = e.mass ?? F.mass;
  return 2 * Math.sqrt(t * s);
}
const Wt = 4, vs = 2e-3, ws = 1e-4, Ss = 6e4;
function kt(e) {
  const t = e.friction ?? Wt;
  return t > 0 ? t : Wt;
}
function bt(e) {
  return e.from + e.velocity / kt(e);
}
function ks(e, t) {
  if (t === void 0) return e;
  if (typeof t == "number")
    return t > 0 ? Math.round(e / t) * t : e;
  if (t.length === 0) return e;
  let s = t[0];
  for (const i of t)
    Math.abs(i - e) < Math.abs(s - e) && (s = i);
  return s;
}
function ht(e) {
  let t = ks(bt(e), e.end);
  return e.min !== void 0 && (t = Math.max(e.min, t)), e.max !== void 0 && (t = Math.min(e.max, t)), t;
}
function ut(e) {
  const t = Math.abs(ht(e) - e.from);
  if (t === 0) return 0;
  const s = e.restDelta ?? Math.max(ws, t * vs);
  if (s >= t) return 0;
  const i = Math.log(t / s) / kt(e);
  return Math.min(Ss, i * 1e3);
}
function Lt(e, t) {
  if (t <= 0) return e.from;
  const s = ht(e);
  if (t >= ut(e)) return s;
  const i = kt(e);
  return e.from + (s - e.from) * (1 - Math.exp(-i * t / 1e3));
}
function Yn(e, t) {
  const s = kt(e), i = ht(e);
  return t >= ut(e) ? 0 : (i - e.from) * s * Math.exp(-s * Math.max(0, t) / 1e3);
}
const Ee = (e) => e, xs = (e) => e * e, As = (e) => 1 - (1 - e) * (1 - e), Ms = (e) => e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2, Ie = (e) => e * e * e, De = (e) => 1 - Math.pow(1 - e, 3), Re = (e) => e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2, _s = Ie, Ps = De, Cs = Re, $s = {
  linear: Ee,
  "ease-in": _s,
  "ease-out": Ps,
  "ease-in-out": Cs,
  "ease-in-quad": xs,
  "ease-out-quad": As,
  "ease-in-out-quad": Ms,
  "ease-in-cubic": Ie,
  "ease-out-cubic": De,
  "ease-in-out-cubic": Re
};
function Es(e) {
  const [t, s, i, n] = e, r = 3 * t, o = 3 * (i - t) - r, a = 1 - r - o, c = 3 * s, l = 3 * (n - s) - c, f = 1 - c - l, u = (d) => ((a * d + o) * d + r) * d, h = (d) => ((f * d + l) * d + c) * d, p = (d) => (3 * a * d + 2 * o) * d + r, g = (d) => {
    let m = d;
    for (let w = 0; w < 8; w++) {
      const k = u(m) - d;
      if (Math.abs(k) < 1e-7)
        return m;
      const b = p(m);
      if (Math.abs(b) < 1e-7)
        break;
      m -= k / b;
    }
    let y = 0, T = 1;
    for (m = d; y < T; ) {
      const w = u(m);
      if (Math.abs(w - d) < 1e-7)
        return m;
      d > w ? y = m : T = m, m = (y + T) / 2;
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
function Fe(e) {
  return e === void 0 ? Ee : ms(e) ? Es(e.points) : $s[e];
}
const Gt = 32, Is = 256, H = /* @__PURE__ */ new Map(), Ds = /[MmLlHhVvCcSsQqTtAaZz]/, Rs = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, Fs = {
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
function Ls(e) {
  const t = [];
  let s = 0, i = null;
  const n = () => {
    for (; s < e.length && /[\s,]/.test(e[s]); ) s++;
  };
  for (; s < e.length && (n(), !(s >= e.length)); ) {
    const r = e[s];
    if (Ds.test(r)) {
      i = { type: r, args: [] }, t.push(i), s++;
      continue;
    }
    if (!i) break;
    const o = i.type === "A" || i.type === "a", a = i.args.length % 7;
    if (o && (a === 3 || a === 4)) {
      if (r !== "0" && r !== "1") break;
      i.args.push(r === "1" ? 1 : 0), s++;
      continue;
    }
    const c = Rs.exec(e.slice(s));
    if (!c) break;
    i.args.push(parseFloat(c[0])), s += c[0].length;
  }
  return t;
}
function Bs(e, t, s, i, n, r, o, a, c) {
  if (e === a && t === c) return [];
  let l = Math.abs(s), f = Math.abs(i);
  if (l === 0 || f === 0) return [[e, t, a, c, a, c]];
  const u = n * Math.PI / 180, h = Math.cos(u), p = Math.sin(u), g = (e - a) / 2, d = (t - c) / 2, m = h * g + p * d, y = -p * g + h * d, T = m * m / (l * l) + y * y / (f * f);
  if (T > 1) {
    const C = Math.sqrt(T);
    l *= C, f *= C;
  }
  const w = r === o ? -1 : 1, k = l * l * f * f - l * l * y * y - f * f * m * m, b = l * l * y * y + f * f * m * m, v = w * Math.sqrt(Math.max(0, k / b)), x = v * l * y / f, E = -v * f * m / l, L = h * x - p * E + (e + a) / 2, A = p * x + h * E + (t + c) / 2, S = (C, I, D, z) => {
    const xt = C * D + I * z, pt = Math.sqrt((C * C + I * I) * (D * D + z * z)), st = Math.acos(Math.max(-1, Math.min(1, xt / pt)));
    return C * z - I * D < 0 ? -st : st;
  }, _ = S(1, 0, (m - x) / l, (y - E) / f);
  let M = S((m - x) / l, (y - E) / f, (-m - x) / l, (-y - E) / f);
  !o && M > 0 && (M -= 2 * Math.PI), o && M < 0 && (M += 2 * Math.PI);
  const P = Math.max(1, Math.ceil(Math.abs(M) / (Math.PI / 2))), R = M / P, N = 4 / 3 * Math.tan(R / 4), Y = (C) => {
    const I = l * Math.cos(C), D = f * Math.sin(C);
    return [h * I - p * D + L, p * I + h * D + A];
  }, et = (C) => {
    const I = -l * Math.sin(C), D = f * Math.cos(C);
    return [h * I - p * D, p * I + h * D];
  }, dt = [];
  for (let C = 0; C < P; C++) {
    const I = _ + C * R, D = I + R, [z, xt] = Y(I), [pt, st] = C === P - 1 ? [a, c] : Y(D), [us, fs] = et(I), [ds, ps] = et(D);
    dt.push([z + N * us, xt + N * fs, pt - N * ds, st - N * ps, pt, st]);
  }
  return dt;
}
function V(e, t, s, i, n) {
  const r = 1 - n;
  return r * r * r * e + 3 * r * r * n * t + 3 * r * n * n * s + n * n * n * i;
}
function zt(e, t, s, i, n) {
  const r = 1 - n;
  return 3 * r * r * (t - e) + 6 * r * n * (s - t) + 3 * n * n * (i - s);
}
function it(e, t, s, i) {
  return {
    subpath: 0,
    type: "L",
    points: [s, i],
    startX: e,
    startY: t,
    endX: s,
    endY: i,
    length: Math.hypot(s - e, i - t)
  };
}
function gt(e, t, s) {
  const [i, n, r, o, a, c] = s, l = [0];
  let f = e, u = t, h = 0;
  for (let p = 1; p <= Gt; p++) {
    const g = p / Gt, d = V(e, i, r, a, g), m = V(t, n, o, c, g);
    h += Math.hypot(d - f, m - u), l.push(h), f = d, u = m;
  }
  return {
    subpath: 0,
    type: "C",
    points: [i, n, r, o, a, c],
    startX: e,
    startY: t,
    endX: a,
    endY: c,
    length: h,
    lengths: l
  };
}
function ct(e) {
  const t = H.get(e);
  if (t) return t;
  const s = [];
  let i = 0, n = 0, r = 0, o = 0, a = null, c = null, l = -1;
  const f = /* @__PURE__ */ new Set(), u = (d) => {
    l < 0 && (l = 0), d.subpath = l, s.push(d);
  };
  for (const { type: d, args: m } of Ls(e)) {
    const y = d.toUpperCase(), T = d !== y, w = Fs[y];
    if (y === "Z") {
      (i !== r || n !== o) && u(it(i, n, r, o)), l >= 0 && f.add(l), i = r, n = o, a = c = null;
      continue;
    }
    for (let k = 0; k + w <= m.length; k += w) {
      const b = m.slice(k, k + w), v = T ? i : 0, x = T ? n : 0;
      let E = null, L = null;
      switch (y) {
        case "M":
          k === 0 ? (i = b[0] + v, n = b[1] + x, r = i, o = n, (l < 0 || s[s.length - 1]?.subpath === l) && l++) : (u(it(i, n, b[0] + v, b[1] + x)), i = b[0] + v, n = b[1] + x);
          break;
        case "L":
          u(it(i, n, b[0] + v, b[1] + x)), i = b[0] + v, n = b[1] + x;
          break;
        case "H":
          u(it(i, n, b[0] + v, n)), i = b[0] + v;
          break;
        case "V":
          u(it(i, n, i, b[0] + x)), n = b[0] + x;
          break;
        case "C": {
          const A = [b[0] + v, b[1] + x, b[2] + v, b[3] + x, b[4] + v, b[5] + x];
          u(gt(i, n, A)), E = [A[2], A[3]], i = A[4], n = A[5];
          break;
        }
        case "S": {
          const [A, S] = a ? [2 * i - a[0], 2 * n - a[1]] : [i, n], _ = [A, S, b[0] + v, b[1] + x, b[2] + v, b[3] + x];
          u(gt(i, n, _)), E = [_[2], _[3]], i = _[4], n = _[5];
          break;
        }
        case "Q":
        case "T": {
          let A = i, S = n;
          y === "Q" ? (A = b[0] + v, S = b[1] + x) : c && (A = 2 * i - c[0], S = 2 * n - c[1]);
          const _ = y === "Q" ? b[2] + v : b[0] + v, M = y === "Q" ? b[3] + x : b[1] + x;
          u(
            gt(i, n, [
              i + 2 / 3 * (A - i),
              n + 2 / 3 * (S - n),
              _ + 2 / 3 * (A - _),
              M + 2 / 3 * (S - M),
              _,
              M
            ])
          ), L = [A, S], i = _, n = M;
          break;
        }
        case "A": {
          const A = b[5] + v, S = b[6] + x;
          let _ = i, M = n;
          for (const P of Bs(i, n, b[0], b[1], b[2], b[3], b[4], A, S))
            u(gt(_, M, P)), _ = P[4], M = P[5];
          i = A, n = S;
          break;
        }
      }
      a = E, c = L;
    }
  }
  const h = s.reduce((d, m) => d + m.length, 0), p = [];
  for (let d = 0; d < s.length; ) {
    const m = s[d].subpath;
    let y = d, T = 0;
    for (; y < s.length && s[y].subpath === m; ) T += s[y++].length;
    const w = s[d], k = s[y - 1], b = f.has(m) || Math.abs(k.endX - w.startX) < 1e-9 && Math.abs(k.endY - w.startY) < 1e-9;
    p.push({ start: d, end: y, length: T, closed: b }), d = y;
  }
  const g = { segments: s, totalLength: h, subpaths: p };
  return H.size >= Is && H.delete(H.keys().next().value), H.set(e, g), g;
}
function Os(e, t) {
  const s = e.lengths;
  if (t <= 0) return 0;
  if (t >= e.length) return 1;
  let i = 0, n = s.length - 1;
  for (; i < n - 1; ) {
    const a = i + n >> 1;
    s[a] < t ? i = a : n = a;
  }
  const r = s[n] - s[i], o = r > 0 ? (t - s[i]) / r : 0;
  return (i + o) / (s.length - 1);
}
function Xs(e, t) {
  if (e.type === "L") {
    const u = e.length > 0 ? Math.max(0, Math.min(1, t / e.length)) : 0;
    return {
      x: e.startX + (e.endX - e.startX) * u,
      y: e.startY + (e.endY - e.startY) * u,
      angle: Math.atan2(e.endY - e.startY, e.endX - e.startX) * 180 / Math.PI
    };
  }
  const [s, i, n, r, o, a] = e.points, c = Os(e, t);
  let l = zt(e.startX, s, n, o, c), f = zt(e.startY, i, r, a, c);
  if (Math.hypot(l, f) < 1e-9) {
    const u = c < 0.5 ? Math.min(1, c + 1e-3) : Math.max(0, c - 1e-3), h = V(e.startX, s, n, o, u), p = V(e.startY, i, r, a, u), g = V(e.startX, s, n, o, c), d = V(e.startY, i, r, a, c);
    l = c < 0.5 ? h - g : g - h, f = c < 0.5 ? p - d : d - p;
  }
  return {
    x: V(e.startX, s, n, o, c),
    y: V(e.startY, i, r, a, c),
    angle: Math.atan2(f, l) * 180 / Math.PI
  };
}
function Le(e, t, s = 0, i = e.length) {
  if (i <= s) return { x: 0, y: 0, angle: 0 };
  let n = 0;
  for (let r = s; r < i; r++) {
    const o = e[r];
    if (n + o.length >= t || r === i - 1)
      return Xs(o, t - n);
    n += o.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function Ns(e, t) {
  const { segments: s, totalLength: i } = ct(e);
  return Le(s, Math.max(0, Math.min(1, t)) * i);
}
function qn() {
  H.clear();
}
function Vn(e) {
  return ct(e).totalLength;
}
const Ys = 24, qs = 320, Vs = 2.5, nt = 72, Un = 64, Us = 128, Z = /* @__PURE__ */ new Map(), Ht = (e) => Math.round(e * 100) / 100;
function Zt(e, t) {
  const { segments: s, subpaths: i, totalLength: n } = ct(e);
  if (s.length === 0) return [];
  if (t) {
    const r = i.every((o) => o.closed);
    return [{ segments: s, start: 0, end: s.length, length: n, closed: r }];
  }
  return i.filter((r) => r.length > 0).map((r) => ({ segments: s, start: r.start, end: r.end, length: r.length, closed: r.closed }));
}
function Bt(e, t) {
  const s = e.closed ? (t % 1 + 1) % 1 : Math.max(0, Math.min(1, t)), i = Le(e.segments, s * e.length, e.start, e.end);
  return [i.x, i.y];
}
function Kt(e) {
  const t = [];
  let s = 0;
  for (let i = e.start; i < e.end; i++)
    s += e.segments[i].length, e.length > 0 && t.push(s / e.length);
  return t;
}
function Qt(e, t) {
  const s = [];
  for (let i = 0; i < t; i++)
    s.push(Bt(e, e.closed ? i / t : i / (t - 1)));
  return s;
}
function Jt(e) {
  let t = 0, s = 0;
  for (const [i, n] of e)
    t += i, s += n;
  return t /= e.length, s /= e.length, e.map(([i, n]) => [i - t, n - s]);
}
function js(e, t, s) {
  const i = e.closed && t.closed;
  if (s !== void 0)
    return { offset: i ? Math.abs(s) % nt / nt : 0, reversed: s < 0 };
  const n = Jt(Qt(e, nt)), r = Jt(Qt(t, nt)), o = nt;
  let a = { offset: 0, reversed: !1 }, c = 1 / 0;
  for (const l of [!1, !0]) {
    const f = i ? o : 1;
    for (let u = 0; u < f; u++) {
      let h = 0;
      for (let p = 0; p < o && h < c; p++) {
        const g = i ? l ? (u - p + o) % o : (p + u) % o : l ? o - 1 - p : p, d = n[p][0] - r[g][0], m = n[p][1] - r[g][1];
        h += d * d + m * m;
      }
      h < c && (c = h, a = { offset: i ? u / o : 0, reversed: l });
    }
  }
  return a;
}
function Ws(e, t, s) {
  return s ? ((t.reversed ? t.offset - e : e + t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function Gs(e, t, s) {
  return s ? ((t.reversed ? t.offset - e : e - t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function zs(e, t, s) {
  const i = e.closed && t.closed, n = js(e, t, s.shapeIndex), r = Math.max(
    Ys,
    Math.min(qs, Math.ceil(Math.max(e.length, t.length) / Vs))
  ), o = /* @__PURE__ */ new Set(), a = (u) => o.add(Math.round(u * 1e7) / 1e7);
  for (let u = 0; u <= r; u++) a(u / r);
  for (const u of Kt(e)) a(u);
  for (const u of Kt(t)) a(Gs(u, n, i));
  let c = [...o].sort((u, h) => u - h);
  i && (c = c.filter((u) => u < 1));
  const l = [], f = [];
  for (const u of c)
    l.push(...Bt(e, u)), f.push(...Bt(t, Ws(u, n, i)));
  return { from: l, to: f, closed: i };
}
function Hs(e, t, s) {
  const i = `${s.shapeIndex ?? "auto"}|${e}|${t}`, n = Z.get(i);
  if (n) return n;
  const r = ct(e).subpaths.filter((l) => l.length > 0).length === ct(t).subpaths.filter((l) => l.length > 0).length, o = Zt(e, !r), a = Zt(t, !r), c = {
    pairs: o.map((l, f) => zs(l, a[f], s))
  };
  return Z.size >= Us && Z.delete(Z.keys().next().value), Z.set(i, c), c;
}
function Zs(e, t, s, i = {}) {
  if (!e) return t;
  if (!t) return e;
  const n = Math.max(0, Math.min(1, s));
  if (n === 0) return e;
  if (n === 1) return t;
  const r = Hs(e, t, i);
  if (r.pairs.length === 0) return n < 0.5 ? e : t;
  let o = "";
  for (const a of r.pairs) {
    for (let c = 0; c < a.from.length; c += 2) {
      const l = Ht(a.from[c] + (a.to[c] - a.from[c]) * n), f = Ht(a.from[c + 1] + (a.to[c + 1] - a.from[c + 1]) * n);
      o += `${c === 0 ? o ? " M" : "M" : " L"}${l} ${f}`;
    }
    a.closed && (o += " Z");
  }
  return o;
}
function jn() {
  Z.clear();
}
function ft(e) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(e);
}
const q = (e, t, s) => e + (t - e) * s, Be = 512, Mt = /* @__PURE__ */ new Map(), _t = /* @__PURE__ */ new Map();
function te(e) {
  const t = Mt.get(e);
  if (t) return t;
  const s = e.replace("#", ""), i = [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16)
  ];
  return Mt.size < Be && Mt.set(e, i), i;
}
const ee = (e) => e.charCodeAt(0) === 35, se = (e) => e.startsWith("rgb"), ie = (e) => e.startsWith("rgba"), Ks = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, Pt = (e) => Math.round(e).toString(16).padStart(2, "0");
function Qs(e, t, s) {
  return `#${Pt(e)}${Pt(t)}${Pt(s)}`;
}
function ne(e) {
  const t = _t.get(e);
  if (t) return t;
  const s = e.match(Ks);
  if (!s)
    throw new Error(`Invalid rgb color: ${e}`);
  const i = parseInt(s[1], 10), n = parseInt(s[2], 10), r = parseInt(s[3], 10), o = s[4] !== void 0 ? [i, n, r, parseFloat(s[4])] : [i, n, r];
  return _t.size < Be && _t.set(e, o), o;
}
const Js = (e, t, s) => {
  if (ee(e) && ee(t)) {
    const [i, n, r] = te(e), [o, a, c] = te(t), l = q(i, o, s), f = q(n, a, s), u = q(r, c, s);
    return Qs(l, f, u);
  }
  if ((se(e) || ie(e)) && (se(t) || ie(t))) {
    const i = ne(e), n = ne(t), r = Math.round(q(i[0], n[0], s)), o = Math.round(q(i[1], n[1], s)), a = Math.round(q(i[2], n[2], s));
    if (i.length === 4 || n.length === 4) {
      const c = i[3] ?? 1, l = n[3] ?? 1, f = q(c, l, s);
      return `rgba(${r}, ${o}, ${a}, ${f})`;
    }
    return `rgb(${r}, ${o}, ${a})`;
  }
  return s < 1 ? e : t;
}, ti = (e, t, s) => {
  const i = Math.min(e.length, t.length), n = [];
  for (let r = 0; r < i; r++)
    n.push(q(e[r], t[r], s));
  return n;
}, re = (e, t, s) => s < 1 ? e : t, ei = (e, t, s) => Zs(e, t, s);
function Oe(e) {
  return typeof e == "number" ? q : Array.isArray(e) ? ti : typeof e == "string" ? e.startsWith("#") || e.startsWith("rgb") ? Js : ft(e) ? ei : re : re;
}
const Xe = 1e3 / 60;
function Ne(e, t = {}) {
  if (!G(e))
    throw new Error(`bakeSpringTrack: track "${e.id}" is not a spring track`);
  const s = new St(e.spring);
  return qe(e, (i) => s.valueAt(i), s.settleTime(), e.spring.from, e.spring.to, t);
}
function Ye(e, t = {}) {
  if (!W(e))
    throw new Error(`bakeInertiaTrack: track "${e.id}" is not an inertia track`);
  const s = e.inertia;
  return qe(
    e,
    (i) => Lt(s, i),
    ut(s),
    s.from,
    ht(s),
    t
  );
}
function qe(e, t, s, i, n, r) {
  const o = r.intervalMs ?? Xe, a = r.tolerance ?? 0.01, c = e.delay ?? 0, l = [];
  for (let u = 0; u <= s; u += o)
    l.push({ time: u + c, value: t(u), easing: "linear" });
  const f = l[l.length - 1];
  return !f || f.time < s + c ? l.push({ time: s + c, value: n, easing: "linear" }) : f.value = n, c > 0 && l.unshift({ time: 0, value: i, easing: "linear" }), {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: a > 0 ? ii(l, a) : l,
    ...e.targets && { targets: [...e.targets] },
    ...e.stagger && { stagger: { ...e.stagger } }
  };
}
function si(e, t, s, i = {}) {
  const n = i.intervalMs ?? Xe, r = typeof s == "function" ? s : Fe(s), o = Oe(e.value), a = t.time - e.time;
  if (a <= 0) return [t];
  const c = [];
  for (let l = n; l < a; l += n) {
    const f = l / a;
    c.push({
      time: e.time + l,
      value: o(e.value, t.value, r(f)),
      easing: "linear"
    });
  }
  return c.push({ ...t, easing: "linear" }), c;
}
function Wn(e, t) {
  return G(e) ? Ne(e, t) : W(e) ? Ye(e, t) : e;
}
function Gn(e, t) {
  return e.filter(gs).concat(
    e.filter(G).map((s) => Ne(s, t)),
    e.filter(W).map((s) => Ye(s, t))
  );
}
function ii(e, t) {
  if (e.length <= 2) return e;
  const s = [e[0]];
  for (let i = 1; i < e.length - 1; i++) {
    const n = s[s.length - 1], r = e[i], o = e[i + 1], a = o.time - n.time;
    if (a <= 0) continue;
    const c = (r.time - n.time) / a, l = n.value + (o.value - n.value) * c;
    Math.abs(r.value - l) > t && s.push(r);
  }
  return s.push(e[e.length - 1]), s;
}
function Ot(e) {
  const t = [...e.keyframes].sort((s, i) => s.time - i.time);
  return {
    ...e,
    keyframes: t
  };
}
function U(e) {
  return e.targets && e.targets.length > 0 ? e.targets : [e.target];
}
function tt(e, t, s, i) {
  const n = s ?? 0;
  return !i || t <= 1 ? n : n + Ce(e, t, i);
}
class Ct {
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
    return this.valueForOffset(t - tt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  /**
   * Every target's value at a specific time, in target order.
   *
   * Single-target tracks yield one entry; staggered tracks yield one per target,
   * each sampled at its own offset time.
   */
  getTargetValues(t) {
    const s = this.targets.length, i = [];
    for (let n = 0; n < s; n++) {
      const r = tt(n, s, this.track.delay, this.track.stagger), o = this.valueForOffset(t - r);
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
    const s = t[t.length - 1].time, i = this.track.stagger ? wt(this.targets.length, this.track.stagger) : 0;
    return s + (this.track.delay ?? 0) + i + (this.track.endDelay ?? 0);
  }
  /**
   * Get the track metadata.
   */
  getTrack() {
    return this.track;
  }
  /** Interpolated value at a time already shifted into the track's own frame. */
  valueForOffset(t) {
    const { keyframes: s } = this.track;
    if (s.length === 0)
      return;
    if (s.length === 1 || t <= s[0].time)
      return s[0].value;
    if (t >= s[s.length - 1].time)
      return s[s.length - 1].value;
    const { from: i, to: n } = this.findSurroundingKeyframes(t);
    if (!i || !n)
      return;
    if (i.time === t)
      return i.value;
    const r = n.time - i.time, o = (t - i.time) / r, c = Fe(n.easing)(o);
    return Oe(i.value)(i.value, n.value, c);
  }
  /**
   * Find the keyframes surrounding a given time.
   */
  findSurroundingKeyframes(t) {
    const { keyframes: s } = this.track;
    for (let i = 0; i < s.length - 1; i++)
      if (t >= s[i].time && t <= s[i + 1].time)
        return { from: s[i], to: s[i + 1] };
    return { from: null, to: null };
  }
}
class ni {
  track;
  targets;
  sampler;
  constructor(t) {
    this.track = t, this.targets = U(t), this.sampler = new St(t.spring);
  }
  getValueAtTime(t) {
    return this.sampler.valueAt(t - tt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const s = this.targets.length, i = [];
    for (let n = 0; n < s; n++) {
      const r = tt(n, s, this.track.delay, this.track.stagger);
      i.push({ target: this.targets[n], value: this.sampler.valueAt(t - r), start: r });
    }
    return i;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? wt(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
class ri {
  track;
  targets;
  duration;
  constructor(t) {
    this.track = t, this.targets = U(t), this.duration = ut(t.inertia);
  }
  getValueAtTime(t) {
    return Lt(this.track.inertia, t - tt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const s = this.targets.length, i = [];
    for (let n = 0; n < s; n++) {
      const r = tt(n, s, this.track.delay, this.track.stagger);
      i.push({ target: this.targets[n], value: Lt(this.track.inertia, t - r), start: r });
    }
    return i;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? wt(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
function Ve(e, t) {
  const s = { ...Ns(e.pathData, t) };
  if (e.matrix) {
    const [i, n, r, o, a, c] = e.matrix, { x: l, y: f } = s;
    s.x = i * l + r * f + a, s.y = n * l + o * f + c;
    const u = s.angle * Math.PI / 180, h = Math.cos(u), p = Math.sin(u);
    s.angle = Math.atan2(n * h + o * p, i * h + r * p) * 180 / Math.PI;
  }
  return e.autoRotate && e.rotateOffset && (s.angle += e.rotateOffset), s;
}
function zn(e, t, s, i) {
  const n = t + (s - t) * i;
  return Ve(e, n);
}
const $t = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, oi = 20;
function ai(e) {
  const t = $t[e ?? "upperCase"] ?? e ?? $t.upperCase, s = Array.from(t);
  return s.length > 0 ? s : Array.from($t.upperCase);
}
function ci(e, t, s) {
  let i = (e | 0) ^ Math.imul(t + 1, 2654435761) ^ Math.imul(s + 1, 2246822507);
  return i = Math.imul(i ^ i >>> 16, 2146121005), i = Math.imul(i ^ i >>> 15, 2221713035), (i ^ i >>> 16) >>> 0;
}
function li(e, t, s = 0) {
  const i = e.from ?? "", n = e.to, r = Math.max(0, Math.min(1, t));
  if (r <= 0) return i;
  if (r >= 1) return n;
  const o = Array.from(i), a = Array.from(n), c = e.rightToLeft ?? !1;
  if (e.mode === "type") {
    const T = Math.round(r * Math.max(o.length, a.length));
    return c ? o.slice(0, Math.max(0, o.length - T)).join("") + a.slice(Math.max(0, a.length - T)).join("") : a.slice(0, T).join("") + o.slice(T).join("");
  }
  const l = Math.max(0, Math.min(0.999, e.revealDelay ?? 0)), f = Math.max(0, (r - l) / (1 - l)), u = Math.floor(f * a.length), h = e.tweenLength === !1 ? a.length : Math.round(o.length + (a.length - o.length) * r), p = ai(e.chars), g = e.refreshRate ?? oi, d = g > 0 ? Math.floor(s * g / 1e3) : 0, m = e.seed ?? 1;
  let y = "";
  for (let T = 0; T < h; T++) {
    const w = c ? T >= h - u : T < u, k = c ? a[a.length - (h - T)] : a[T];
    w && k !== void 0 || k === " " || k === `
` ? y += k : y += p[ci(m, T, d) % p.length];
  }
  return y;
}
class Ue {
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
      for (const s of t.tracks)
        this.addTrack(s);
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
    const s = this.duration > 0 ? this.duration : 1 / 0;
    this._currentTime = Math.max(0, Math.min(t, s)), this._repeatDelayRemaining = 0, this._wrapAfterDelay = !1;
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
    const s = this.duration;
    if (s <= 0)
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
        const c = s - this._currentTime;
        if (n >= c) {
          if (n -= c, this._currentTime = s, !this._handleEndReached())
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
    const s = /* @__PURE__ */ new Map();
    if (this._hasSharedWrites())
      this._resolveShared(t, s);
    else
      for (const [i, n] of this._trackPlayers) {
        const r = n.getTrack().property;
        for (const { target: o, value: a, start: c } of n.getTargetValues(t))
          this._write(s, i, o, r, a, t - c);
      }
    return {
      values: s,
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
  _resolveShared(t, s) {
    const i = /* @__PURE__ */ new Map();
    for (const [n, r] of this._trackPlayers) {
      const o = r.getTrack().property;
      for (const { target: a, value: c, start: l } of r.getTargetValues(t)) {
        const f = `${a}\0${o}`, u = l <= t, h = i.get(f);
        (!h || (u !== h.started ? u : u ? l >= h.start : l <= h.start)) && i.set(f, { trackId: n, target: a, property: o, value: c, start: l, started: u });
      }
    }
    for (const { trackId: n, target: r, property: o, value: a, start: c } of i.values())
      this._write(s, n, r, o, a, t - c);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(t, s, i, n, r, o) {
    if (r === void 0) return;
    let a = t.get(i);
    a || (a = /* @__PURE__ */ new Map(), t.set(i, a));
    const c = this._textTracks.get(s);
    if (c && typeof r == "number") {
      a.set("text", li(c.textConfig, r, Math.max(0, o)));
      return;
    }
    const l = this._motionPathTracks.get(s);
    if (l && typeof r == "number") {
      const f = Ve(l.motionPathConfig, r);
      a.set("motionPathX", f.x), a.set("motionPathY", f.y), l.motionPathConfig.autoRotate && a.set("motionPathRotate", f.angle);
    } else
      a.set(n, r);
  }
  /** Cached: does any target+property have more than one track? */
  _sharedWrites = null;
  _hasSharedWrites() {
    if (this._sharedWrites === null) {
      const t = /* @__PURE__ */ new Set();
      this._sharedWrites = !1;
      t: for (const s of this._tracks)
        for (const i of U(s)) {
          const n = `${i}\0${s.property}`;
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
    if (this._tracks.push(t), this._sharedWrites = null, W(t)) {
      this._trackPlayers.set(t.id, new ri(t));
      return;
    }
    if (G(t)) {
      this._trackPlayers.set(t.id, new ni(t)), this._springTracks.set(t.id, t);
      return;
    }
    if (Nt(t))
      this._trackPlayers.set(t.id, new Ct(t)), this._textTracks.set(t.id, t);
    else if (_e(t)) {
      const s = {
        id: t.id,
        target: t.target,
        property: t.property,
        keyframes: t.keyframes,
        delay: t.delay,
        endDelay: t.endDelay,
        targets: t.targets,
        stagger: t.stagger
      };
      this._trackPlayers.set(t.id, new Ct(s)), this._motionPathTracks.set(t.id, t);
    } else
      this._trackPlayers.set(t.id, new Ct(t));
  }
  /**
   * Replace a track with a new version, keeping its place in the track order
   * (which decides ties when tracks overlap). The new track may have a
   * different id. Does nothing if no track has `trackId`.
   */
  replaceTrack(t, s) {
    const i = this._tracks.findIndex((r) => r.id === t);
    if (i < 0) return;
    const n = this._tracks.slice(i + 1);
    this.removeTrack(t);
    for (const r of n) this.removeTrack(r.id);
    this.addTrack(s);
    for (const r of n) this.addTrack(r);
  }
  /**
   * Remove a track by its ID.
   */
  removeTrack(t) {
    this._tracks = this._tracks.filter((s) => s.id !== t), this._sharedWrites = null, this._trackPlayers.delete(t), this._motionPathTracks.delete(t), this._springTracks.delete(t), this._textTracks.delete(t);
  }
  /**
   * Tracks matching a filter. All provided fields must match (AND).
   *
   * This is the closest principled equivalent to GSAP's per-tween handle: we
   * have no live tween objects to hold, so a "tween" is addressed by describing
   * the tracks it produced.
   */
  getTracks(t = {}) {
    return this._tracks.filter((s) => this._matches(s, t));
  }
  /**
   * Remove every track matching a filter. Returns the ids removed.
   *
   * `timeline.removeTracks({ target: 'box' })` is the equivalent of killing all
   * tweens on an element.
   */
  removeTracks(t = {}) {
    const s = this.getTracks(t).map((i) => i.id);
    for (const i of s)
      this.removeTrack(i);
    return s;
  }
  /**
   * The time span a track is active over: [start, end] in milliseconds.
   */
  getTrackSpan(t) {
    const s = this._trackPlayers.get(t);
    if (!s) return;
    const i = s.getTrack(), n = i.delay ?? 0;
    if (G(i) || W(i))
      return { from: n, to: s.getDuration() };
    const r = i.keyframes;
    if (!(!r || r.length === 0))
      return { from: r[0].time + n, to: s.getDuration() };
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
    for (let s = 0; s < this._tracks.length; s++) {
      const i = this._tracks[s], n = this.getTrackSpan(i.id);
      if (n)
        for (let r = 0; r < s; r++) {
          const o = this._tracks[r];
          if (o.property !== i.property) continue;
          const a = U(o).filter((u) => U(i).includes(u));
          if (a.length === 0) continue;
          const c = this.getTrackSpan(o.id);
          if (!c || !(c.from <= n.to && n.from <= c.to)) continue;
          const f = n.from >= c.from;
          for (const u of a)
            t.push({
              target: u,
              property: i.property,
              losingTrackId: f ? o.id : i.id,
              winningTrackId: f ? i.id : o.id
            });
        }
    }
    return t;
  }
  _matches(t, s) {
    if (s.id !== void 0 && t.id !== s.id || s.property !== void 0 && t.property !== s.property || s.target !== void 0 && !U(t).includes(s.target)) return !1;
    if (s.timeRange) {
      const i = this.getTrackSpan(t.id);
      if (!i || i.to < s.timeRange.from || i.from > s.timeRange.to) return !1;
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
    for (const [, s] of this._trackPlayers)
      t = Math.max(t, s.getDuration());
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
function hi(e) {
  return W(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "inertia",
    inertia: je(e.inertia),
    ...O(e)
  } : G(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "spring",
    spring: { ...e.spring },
    ...O(e)
  } : Nt(e) ? {
    id: e.id,
    target: e.target,
    property: "text",
    textConfig: { ...e.textConfig },
    keyframes: e.keyframes.map(Et),
    ...O(e)
  } : _e(e) ? {
    id: e.id,
    target: e.target,
    property: "motionPath",
    motionPathConfig: { ...e.motionPathConfig },
    keyframes: e.keyframes.map(Et),
    ...O(e)
  } : {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes.map(Et),
    ...O(e)
  };
}
function je(e) {
  return { ...e, ...Array.isArray(e.end) && { end: [...e.end] } };
}
function Et(e) {
  return {
    time: e.time,
    value: e.value,
    ...e.easing && { easing: e.easing }
  };
}
function O(e) {
  const t = e.endDelay;
  return {
    ...e.delay !== void 0 && { delay: e.delay },
    ...t !== void 0 && { endDelay: t },
    ...e.targets !== void 0 && { targets: [...e.targets] },
    ...e.stagger !== void 0 && { stagger: { ...e.stagger } }
  };
}
function ui(e) {
  if (W(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "inertia",
      inertia: je(t.inertia),
      ...O(t)
    };
  }
  if (G(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "spring",
      spring: { ...t.spring },
      ...O(t)
    };
  }
  if (Nt(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: "text",
      textConfig: { ...t.textConfig },
      keyframes: [...t.keyframes].sort((s, i) => s.time - i.time),
      ...O(t)
    };
  }
  if (e.property === "motionPath" && "motionPathConfig" in e) {
    const t = e, s = [...t.keyframes].sort((i, n) => i.time - n.time);
    return {
      id: t.id,
      target: t.target,
      property: "motionPath",
      motionPathConfig: { ...t.motionPathConfig },
      keyframes: s,
      ...O(t)
    };
  }
  return Ot({
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes,
    ...O(e)
  });
}
function fi(e) {
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
    tracks: e.tracks.map(hi)
  };
}
function lt(e) {
  return new Ue({
    id: e.id,
    name: e.name,
    config: e.config,
    tracks: e.tracks.map(ui)
  });
}
function Hn(e) {
  return JSON.stringify(fi(e));
}
function Zn(e) {
  const t = JSON.parse(e);
  return lt(t);
}
function Kn(e) {
  let t = 2166136261;
  for (let s = 0; s < e.length; s++)
    t ^= e.charCodeAt(s), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function di(e) {
  let t = e >>> 0 || 2654435769;
  return {
    seed: e >>> 0,
    next() {
      return t ^= t << 13, t >>>= 0, t ^= t >> 17, t ^= t << 5, t >>>= 0, t / 4294967296;
    }
  };
}
function We(e, t, s) {
  return t + e.next() * (s - t);
}
function pi(e, t, s, i) {
  if (i <= 0) return We(e, t, s);
  const n = Math.floor((s - t) / i), r = Math.round(e.next() * n);
  return t + r * i;
}
function Qn(e, t) {
  if (t.length !== 0)
    return t[Math.floor(e.next() * t.length)];
}
const Ge = /^([+\-*/])=\s*(-?[\d.]+)$/, ze = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function Jn(e) {
  return typeof e != "string" ? !1 : Ge.test(e.trim()) || ze.test(e.trim());
}
function He(e, t = {}) {
  if (typeof e != "string") return e;
  const s = e.trim(), i = Ge.exec(s);
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
  const n = ze.exec(s);
  if (n) {
    if (!t.random)
      throw new Error(
        `resolveValue: "${s}" needs a random source — pass one via context.random`
      );
    const r = Number.parseFloat(n[1]), o = Number.parseFloat(n[2]), a = n[3] !== void 0 ? Number.parseFloat(n[3]) : void 0;
    return a !== void 0 ? pi(t.random, r, o, a) : We(t.random, r, o);
  }
  return e;
}
function mi(e, t = 0, s) {
  const i = [];
  let n = t;
  for (const r of e) {
    const o = He(r, { base: n, random: s });
    i.push(o), typeof o == "number" && (n = o);
  }
  return i;
}
class tr {
  random;
  constructor(t) {
    this.random = di(t);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(t, s = 0) {
    return He(t, { base: s, random: this.random });
  }
  resolveSequence(t, s = 0) {
    return mi(t, s, this.random);
  }
}
const B = (e) => Math.round(e * 1e3) / 1e3;
function gi(e, t = {}) {
  if (e.length === 0) return "";
  const s = t.curviness ?? 1, i = t.closed ?? !1, n = e.length;
  let r = `M${B(e[0].x)} ${B(e[0].y)}`;
  if (n === 1) return r;
  const o = (c) => i ? e[(c % n + n) % n] : e[Math.max(0, Math.min(n - 1, c))], a = i ? n : n - 1;
  for (let c = 0; c < a; c++) {
    const l = o(c - 1), f = o(c), u = o(c + 1), h = o(c + 2);
    if (s === 0) {
      r += ` L${B(u.x)} ${B(u.y)}`;
      continue;
    }
    const p = s / 6, g = f.x + (u.x - l.x) * p, d = f.y + (u.y - l.y) * p, m = u.x - (h.x - f.x) * p, y = u.y - (h.y - f.y) * p;
    r += ` C${B(g)} ${B(d)} ${B(m)} ${B(y)} ${B(u.x)} ${B(u.y)}`;
  }
  return i ? `${r} Z` : r;
}
const $ = (e, t = 0) => {
  const s = parseFloat(e ?? "");
  return Number.isFinite(s) ? s : t;
};
function yi(e) {
  const t = (e ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), s = [];
  for (let i = 0; i + 1 < t.length; i += 2) s.push({ x: t[i], y: t[i + 1] });
  return s;
}
function Yt(e) {
  const t = e.attributes;
  switch (e.tag.toLowerCase()) {
    case "path":
      return t.d ?? null;
    case "circle":
    case "ellipse": {
      const s = $(t.cx), i = $(t.cy), n = e.tag.toLowerCase() === "circle" ? $(t.r) : $(t.rx), r = e.tag.toLowerCase() === "circle" ? $(t.r) : $(t.ry);
      return `M${s + n} ${i} A${n} ${r} 0 1 1 ${s - n} ${i} A${n} ${r} 0 1 1 ${s + n} ${i} Z`;
    }
    case "rect": {
      const s = $(t.x), i = $(t.y), n = $(t.width), r = $(t.height);
      let o = t.rx != null ? $(t.rx) : t.ry != null ? $(t.ry) : 0, a = t.ry != null ? $(t.ry) : o;
      return o = Math.min(o, n / 2), a = Math.min(a, r / 2), o === 0 || a === 0 ? `M${s} ${i} H${s + n} V${i + r} H${s} Z` : `M${s + o} ${i} H${s + n - o} A${o} ${a} 0 0 1 ${s + n} ${i + a} V${i + r - a} A${o} ${a} 0 0 1 ${s + n - o} ${i + r} H${s + o} A${o} ${a} 0 0 1 ${s} ${i + r - a} V${i + a} A${o} ${a} 0 0 1 ${s + o} ${i} Z`;
    }
    case "line":
      return `M${$(t.x1)} ${$(t.y1)} L${$(t.x2)} ${$(t.y2)}`;
    case "polyline":
    case "polygon": {
      const s = yi(t.points);
      if (s.length === 0) return null;
      const i = s.map((n, r) => `${r === 0 ? "M" : "L"}${n.x} ${n.y}`).join(" ");
      return e.tag.toLowerCase() === "polygon" ? `${i} Z` : i;
    }
    default:
      return null;
  }
}
const oe = {
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
}, ae = {
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
function bi(e) {
  let t = e.trim().toLowerCase();
  return t = t.replace(/\.ease(in|out|inout)$/, ".$1"), !t.includes(".") && !t.startsWith("steps") && t !== "none" && t !== "linear" && (t = `${t}.out`), t;
}
function qt(e = 1, t = 0.3) {
  return (s) => {
    if (s === 0 || s === 1) return s;
    const i = t / (2 * Math.PI) * Math.asin(1 / Math.max(1, e));
    return e * Math.pow(2, -10 * s) * Math.sin((s - i) * (2 * Math.PI) / t) + 1;
  };
}
function Ze(e = 1, t = 0.3) {
  const s = qt(e, t);
  return (i) => 1 - s(1 - i);
}
function Ti(e = 1, t = 0.3) {
  const s = Ze(e, t), i = qt(e, t);
  return (n) => n < 0.5 ? s(n * 2) / 2 : i(n * 2 - 1) / 2 + 0.5;
}
const Vt = (e) => {
  if (e < 1 / 2.75) return 7.5625 * e * e;
  if (e < 2 / 2.75) {
    const n = e - 0.5454545454545454;
    return 7.5625 * n * n + 0.75;
  }
  if (e < 2.5 / 2.75) {
    const n = e - 0.8181818181818182;
    return 7.5625 * n * n + 0.9375;
  }
  const i = e - 2.625 / 2.75;
  return 7.5625 * i * i + 0.984375;
}, Ke = (e) => 1 - Vt(1 - e), vi = (e) => e < 0.5 ? Ke(e * 2) / 2 : Vt(e * 2 - 1) / 2 + 0.5;
function wi(e) {
  const t = Math.max(1, Math.floor(e));
  return (s) => Math.min(1, Math.floor(s * t) / (t - 1 || 1));
}
function ce(e) {
  const t = bi(e), s = /^steps\(\s*(\d+)\s*\)$/.exec(t);
  if (s)
    return { fn: wi(Number.parseInt(s[1], 10)), requiresBaking: "steps" };
  if (t.startsWith("elastic")) {
    const i = t.split(".")[1] ?? "out";
    return { fn: i === "in" ? Ze() : i === "inout" ? Ti() : qt(), requiresBaking: "elastic" };
  }
  if (t.startsWith("bounce")) {
    const i = t.split(".")[1] ?? "out";
    return { fn: i === "in" ? Ke : i === "inout" ? vi : Vt, requiresBaking: "bounce" };
  }
  return t in ae ? { easing: ae[t] } : t in oe ? { easing: { type: "cubic-bezier", points: oe[t] } } : { easing: "ease-out" };
}
const Si = /^([+-])=\s*(-?[\d.]+)$/, ki = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function It(e, t) {
  const s = t.scale ?? 1, i = (l) => Number.parseFloat(l) * s;
  if (e === void 0) return t.cursor;
  if (typeof e == "number") return e * s;
  const n = e.trim();
  if (n === "") return t.cursor;
  const r = Si.exec(n);
  if (r) {
    const l = i(r[2]);
    return t.cursor + (r[1] === "-" ? -l : l);
  }
  const o = ki.exec(n);
  if (o) {
    const l = o[1] === "<" ? t.previousStart : t.previousEnd;
    if (o[3] === void 0) return l;
    const f = i(o[3]);
    return l + (o[2] === "-" ? -f : f);
  }
  const a = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(n);
  if (a) {
    const l = t.labels.get(a[1].trim());
    if (l !== void 0) {
      const f = i(a[3]);
      return l + (a[2] === "-" ? -f : f);
    }
  }
  const c = t.labels.get(n);
  return c !== void 0 ? c : /^-?[\d.]+$/.test(n) ? i(n) : t.cursor;
}
const Ut = /* @__PURE__ */ new Set([
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
function yt(e) {
  const t = {}, s = {};
  for (const [i, n] of Object.entries(e))
    Ut.has(i) ? t[i] = n : s[i] = n;
  return { config: t, properties: s };
}
function Xt(e, t) {
  return e === void 0 ? t : e * 1e3;
}
function xi(e) {
  if (e !== void 0)
    return typeof e == "number" ? { each: e * 1e3 } : {
      ...e.each !== void 0 && { each: e.each * 1e3 },
      ...e.amount !== void 0 && { amount: e.amount * 1e3 },
      ...e.from !== void 0 && { from: e.from }
    };
}
const Ai = {
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
function Mi(e) {
  return Ai[e];
}
function _i(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : e;
  if (!t || typeof t.path != "string" && !Array.isArray(t.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let s;
  if (Array.isArray(t.path))
    s = gi(t.path, { curviness: t.curviness });
  else if (ft(t.path))
    s = t.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${t.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const i = { pathData: s };
  return t.autoRotate !== void 0 && t.autoRotate !== !1 && (i.autoRotate = !0, typeof t.autoRotate == "number" && (i.rotateOffset = t.autoRotate)), t.matrix && (i.matrix = t.matrix), { config: i, start: t.start ?? 0, end: t.end ?? 1 };
}
function Pi(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : { ...e };
  return { ...t, start: t.end ?? 1, end: t.start ?? 0 };
}
function Qe(e) {
  return typeof e == "object" && e !== null && "shape" in e ? e.shape : e;
}
function Ci(e) {
  if (e.morphSVG === void 0) return e;
  const { morphSVG: t, ...s } = e, i = Qe(t);
  if (typeof i != "string" || !ft(i))
    throw new Error(
      `gsap-compat: morphSVG "${String(i)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...s, d: i };
}
function $i(e, t) {
  if (e === !0) return [0, t];
  if (e === !1) return [0, 0];
  if (typeof e == "number") return [0, le(e, t)];
  const s = e.trim().split(/[\s,]+/).filter(Boolean), i = (o) => {
    const a = Number.parseFloat(o);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${e}" is not a length or percentage`);
    return le(o.endsWith("%") ? t * a / 100 : a, t);
  };
  if (s.length === 0) return [0, t];
  if (s.length === 1) return [0, i(s[0])];
  const n = i(s[0]), r = i(s[1]);
  return n <= r ? [n, r] : [r, n];
}
function Ei(e, t) {
  const [s, i] = $i(e, t);
  return { strokeDasharray: [i - s, t], strokeDashoffset: -s };
}
function Ii(e, t) {
  if (e.drawSVG === void 0) return e;
  const { drawSVG: s, ...i } = e;
  return { ...i, ...Ei(s, t) };
}
function Di(e) {
  if (e.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return e;
}
function le(e, t) {
  return Math.max(0, Math.min(t, e));
}
function Ri(e) {
  let t = 2166136261;
  for (let s = 0; s < e.length; s++) t = Math.imul(t ^ e.charCodeAt(s), 16777619);
  return t >>> 0;
}
function Fi(e, t, s) {
  if (e.scrambleText !== void 0) {
    const i = e.scrambleText, n = typeof i == "string" ? { text: i } : i;
    if (typeof n?.text != "string")
      throw new Error("gsap-compat: scrambleText needs the text to end on — a string, or { text }.");
    const r = n.revealDelay && s > 0 ? n.revealDelay * 1e3 / s : void 0;
    return {
      to: n.text,
      mode: "scramble",
      ...n.chars !== void 0 && { chars: n.chars },
      ...n.speed !== void 0 && { refreshRate: 20 * n.speed },
      ...r !== void 0 && { revealDelay: Math.min(r, 0.999) },
      ...n.tweenLength !== void 0 && { tweenLength: n.tweenLength },
      ...n.rightToLeft !== void 0 && { rightToLeft: n.rightToLeft },
      seed: n.seed ?? Ri(`${t}|${n.text}`)
    };
  }
  if (e.text !== void 0) {
    const i = e.text, n = typeof i == "string" ? { value: i } : i;
    if (typeof n?.value != "string")
      throw new Error("gsap-compat: text needs the text to end on — a string, or { value }.");
    return {
      to: n.value,
      mode: "type",
      ...n.rightToLeft !== void 0 && { rightToLeft: n.rightToLeft }
    };
  }
}
function Je(e) {
  return Math.max(0.1, e / 25);
}
function Li(e, t) {
  const s = typeof t == "number" ? { velocity: t } : t;
  if (typeof s?.velocity != "number" || !Number.isFinite(s.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const i = s.friction ?? (s.resistance !== void 0 ? Je(s.resistance) : void 0), n = {
    from: e,
    velocity: s.velocity,
    ...i !== void 0 && { friction: i },
    ...s.min !== void 0 && { min: s.min },
    ...s.max !== void 0 && { max: s.max }
  };
  return typeof s.end == "function" ? n.end = [s.end(bt(n))] : s.end !== void 0 && (n.end = Array.isArray(s.end) ? [...s.end] : s.end), n;
}
function Bi(e) {
  const t = e === !0 ? {} : typeof e == "string" ? { preset: e } : e;
  if (t.preset !== void 0 && !(t.preset in At))
    throw new Error(
      `gsap-compat: unknown spring preset "${t.preset}" — use one of ${Object.keys(At).join(", ")}`
    );
  return {
    ...t.preset ? At[t.preset] : {},
    ...t.stiffness !== void 0 && { stiffness: t.stiffness },
    ...t.damping !== void 0 && { damping: t.damping },
    ...t.mass !== void 0 && { mass: t.mass },
    ...t.restDelta !== void 0 && { restDelta: t.restDelta }
  };
}
function Oi(e, t) {
  if (e === !0 || typeof e == "string") return;
  const s = e.velocity;
  return typeof s == "number" ? s : s?.[t];
}
class J {
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
    this.options = t, this.timeline = new Ue({
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
  to(t, s, i) {
    return this.build(t, void 0, rt(s), i);
  }
  /** Animate from the given values to where the property already is. */
  from(t, s, i) {
    const { config: n, properties: r } = yt(rt(s)), { motionPath: o, text: a, scrambleText: c, ...l } = r, f = this.targetsOf(t)[0], u = { ...n };
    for (const g of Object.keys(l))
      u[g] = this.resolveStart(f, g);
    o !== void 0 && (u.motionPath = Pi(o));
    const h = {}, p = String(this.resolveStart(f, "text"));
    return a !== void 0 && (h.text = Dt(a), u.text = typeof a == "object" ? { ...a, value: p } : p), c !== void 0 && (h.text = Dt(c), u.scrambleText = typeof c == "object" ? { ...c, text: p } : p), this.build(t, { ...l, ...h }, u, i);
  }
  /** Animate between two explicit sets of values. */
  fromTo(t, s, i, n) {
    const { properties: r } = yt(rt(s));
    return this.build(t, r, rt(i), n);
  }
  /** Set values instantly — a single held keyframe. */
  set(t, s, i) {
    return this.build(t, void 0, { ...rt(s), duration: 0 }, i);
  }
  // --- sequencing ---------------------------------------------------------
  /** Name a point in time, for use as a position parameter. */
  addLabel(t, s) {
    return this.labels.set(t, It(s, this.context())), this;
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
  add(t, s) {
    const i = It(s, this.context());
    for (const r of t.timeline.tracks) {
      if (!("keyframes" in r)) continue;
      const o = Ot({
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
      const s = this.labels.get(t);
      return s !== void 0 && this.timeline.seek(s), this;
    }
    return this.timeline.seek(t * 1e3), this;
  }
  /** Progress through the timeline, 0..1. */
  progress(t) {
    const s = this.timeline.duration;
    return t !== void 0 && s > 0 && this.timeline.seek(t * s), s > 0 ? this.timeline.currentTime / s : 0;
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
  build(t, s, i, n) {
    const { config: r, properties: o } = yt(i), { motionPath: a, text: c, scrambleText: l, inertia: f, ...u } = o, h = this.targetsOf(t), p = It(n, this.context()), g = Xt(r.delay, 0), d = Xt(r.duration, 500), m = xi(r.stagger), y = this.easingFor(r.ease), T = [], w = r.spring;
    let k = 0, b = !1;
    for (const [S, _] of Object.entries(u)) {
      const M = _;
      let P = s?.[S] !== void 0 ? s[S] : this.resolveStart(h[0], S);
      if (typeof P != typeof M && (this.warn(
        `no usable start value for "${S}" on "${h[0]}" — it will snap to ${String(M)}. Use fromTo() to animate it.`
      ), P = M), w !== void 0 && typeof P == "number" && typeof M == "number") {
        const Y = {
          ...Bi(w),
          from: P,
          to: M,
          velocity: Oi(w, S) ?? this.options.startVelocity?.(h[0], S) ?? 0
        }, et = this.nextTrackId(`${h[0]}-${S}-spring`), dt = {
          id: et,
          target: h[0],
          ...h.length > 1 && { targets: h },
          ...m && h.length > 1 && { stagger: m },
          property: S,
          kind: "spring",
          spring: Y,
          delay: p + g
        };
        this.timeline.addTrack(dt), T.push(et), k = Math.max(k, Ts(Y));
        for (const C of h) this.lastValues.set(`${C}|${S}`, M);
        continue;
      }
      b = !0;
      const R = this.keyframesFor(P, M, d, y, r.ease), N = this.nextTrackId(`${h[0]}-${S}`);
      this.timeline.addTrack(
        Ot({
          id: N,
          target: h[0],
          ...h.length > 1 && { targets: h },
          ...m && h.length > 1 && { stagger: m },
          property: S,
          delay: p + g,
          keyframes: R
        })
      ), T.push(N);
      for (const Y of h) this.lastValues.set(`${Y}|${S}`, M);
    }
    const v = Fi({ text: c, scrambleText: l }, h[0], d);
    if (v) {
      const S = s?.text ?? s?.scrambleText, _ = S !== void 0 ? Dt(S) : this.resolveStart(h[0], "text"), M = this.nextTrackId(`${h[0]}-text`), P = {
        id: M,
        target: h[0],
        ...h.length > 1 && { targets: h },
        ...m && h.length > 1 && { stagger: m },
        property: "text",
        textConfig: { from: typeof _ == "string" ? _ : String(_ ?? ""), ...v },
        delay: p + g,
        keyframes: this.keyframesFor(0, 1, d, y, r.ease)
      };
      this.timeline.addTrack(P), T.push(M);
      for (const R of h) this.lastValues.set(`${R}|text`, v.to);
    }
    if (a !== void 0) {
      const { config: S, start: _, end: M } = _i(a), P = this.nextTrackId(`${h[0]}-motionPath`), R = {
        id: P,
        target: h[0],
        ...h.length > 1 && { targets: h },
        ...m && h.length > 1 && { stagger: m },
        property: "motionPath",
        motionPathConfig: S,
        delay: p + g,
        keyframes: this.keyframesFor(_, M, d, y, r.ease)
      };
      this.timeline.addTrack(R), T.push(P);
    }
    if (f !== void 0)
      for (const [S, _] of Object.entries(f)) {
        const M = this.resolveStart(h[0], S);
        if (typeof M != "number") {
          this.warn(`inertia on "${S}" needs a numeric start value; skipped`);
          continue;
        }
        const P = Li(M, _), R = this.nextTrackId(`${h[0]}-${S}-inertia`), N = {
          id: R,
          target: h[0],
          ...h.length > 1 && { targets: h },
          ...m && h.length > 1 && { stagger: m },
          property: S,
          kind: "inertia",
          inertia: P,
          delay: p + g
        };
        this.timeline.addTrack(N), T.push(R), k = Math.max(k, ut(P));
        for (const Y of h) this.lastValues.set(`${Y}|${S}`, ht(P));
      }
    const L = ((f !== void 0 || w !== void 0) && !b && !v && a === void 0 ? k : Math.max(d, k)) + (m && h.length > 1 ? wt(h.length, m) : 0), A = p + g + L;
    return this.previousStart = p + g, this.previousEnd = A, this.cursor = Math.max(this.cursor, A), {
      trackIds: T,
      start: p + g,
      end: A,
      kill: () => {
        for (const S of T) this.timeline.removeTrack(S);
      }
    };
  }
  /**
   * Two keyframes, or a baked sequence when the ease has no closed form.
   */
  keyframesFor(t, s, i, n, r) {
    const o = { time: 0, value: t };
    if (i <= 0)
      return [{ time: 0, value: s }];
    const a = typeof r == "string" ? ce(r) : void 0;
    return a?.requiresBaking && this.options.bakeEases && a.fn ? [
      o,
      ...si(o, { time: i, value: s }, a.fn, {
        intervalMs: this.options.bakeIntervalMs
      })
    ] : (a?.requiresBaking && !this.options.bakeEases && this.warn(
      `ease "${r}" cannot be represented as a cubic-bezier; falling back to a smooth curve. Pass { bakeEases: true } to sample it into keyframes.`
    ), [o, { time: i, value: s, ...n && { easing: n } }]);
  }
  /** Resolve a start value through the documented chain. */
  resolveStart(t, s) {
    const i = this.lastValues.get(`${t}|${s}`);
    if (i !== void 0) return i;
    const n = this.options.startValue?.(t, s);
    if (n !== void 0) return n;
    const r = this.options.defaults?.[s];
    if (r !== void 0) return r;
    if (s === "text") return "";
    if (s === "d")
      throw new Error(
        `gsap-compat: no starting shape for "${t}". Use fromTo({ d: … }, { morphSVG: … }), or live.to(), which reads the element's current shape.`
      );
    const o = Mi(s);
    return o !== void 0 ? (this.warn(
      `no start value for "${s}" on "${t}" — using the static default ${o}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), o) : (this.warn(`no start value or default for "${s}" on "${t}" — using 0`), 0);
  }
  easingFor(t) {
    if (t !== void 0) {
      if (typeof t == "string") return ce(t).easing;
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
function Dt(e) {
  if (typeof e == "string") return e;
  if (e && typeof e == "object") {
    const t = e;
    return String(t.value ?? t.text ?? "");
  }
  return String(e ?? "");
}
function Xi(e) {
  return new J(e);
}
function rt(e) {
  return Di(Ci(e));
}
const Ni = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), Yi = "#ffffff", qi = "rgba(0, 0, 0, 0.5)";
function Vi(e) {
  const t = [];
  if (e.blur !== void 0 && t.push(`blur(${Math.max(0, e.blur)}px)`), e.brightness !== void 0 && t.push(`brightness(${Math.max(0, e.brightness)})`), e.glow !== void 0 && t.push(`drop-shadow(0 0 ${Math.max(0, e.glow)}px ${e.glowColor ?? Yi})`), e.shadowX !== void 0 || e.shadowY !== void 0 || e.shadowBlur !== void 0) {
    const s = e.shadowX ?? 0, i = e.shadowY ?? 0, n = Math.max(0, e.shadowBlur ?? 0);
    t.push(`drop-shadow(${s}px ${i}px ${n}px ${e.shadowColor ?? qi})`);
  }
  return t.length > 0 ? t.join(" ") : null;
}
function Ui(e, t) {
  const s = e.childNodes.length === 1 ? e.firstChild : null;
  if (s && s.nodeType === 3) {
    const i = s;
    i.data !== t && (i.data = t);
    return;
  }
  e.textContent !== t && (e.textContent = t);
}
function ji(e) {
  if (!("ownerSVGElement" in e)) return;
  const t = e.style;
  !t || t.transformBox || (t.transformBox = "fill-box", t.transformOrigin || (t.transformOrigin = "50% 50%"));
}
const he = /* @__PURE__ */ new Set([
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
]), Wi = /* @__PURE__ */ new Set([
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
]), Gi = /* @__PURE__ */ new Set(["originX", "originY"]), zi = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), Hi = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
};
class j {
  targets = /* @__PURE__ */ new Map();
  /**
   * Register an HTML element as an animation target.
   */
  registerTarget(t, s) {
    this.targets.set(t, s);
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
    for (const [s, i] of t.values) {
      const n = this.targets.get(s);
      n && this.applyProperties(n, i);
    }
  }
  /**
   * Apply properties to a single element.
   */
  applyProperties(t, s) {
    const i = [];
    let n = null, r = null, o = null;
    const a = s.has("motionPathX"), c = s.has("motionPathY"), l = s.has("motionPathRotate");
    for (const [h, p] of s)
      if (!(h === "x" && a) && !(h === "y" && c) && !((h === "rotate" || h === "rotateZ") && l)) {
        if (Wi.has(h)) {
          const g = this.buildTransformPart(h, p);
          g && i.push(g);
        } else if (Gi.has(h))
          typeof p == "number" && ((n ??= {})[h] = p);
        else if (zi.has(h))
          typeof p == "number" && ((r ??= {})[h] = p);
        else if (Ni.has(h))
          (o ??= {})[h] = p;
        else if (h !== "perspective") {
          if (h !== "shine") if (h === "text" && typeof p == "string")
            Ui(t, p);
          else if (h === "d" && typeof p == "string") {
            const g = t;
            (g.tagName?.toLowerCase() === "path" ? g : g.querySelector?.("path"))?.setAttribute?.("d", p);
          } else
            this.applyStyleProperty(t, h, p);
        }
      }
    const f = s.get("shine");
    typeof f == "number" && this.applyShine(t, f);
    const u = s.get("perspective");
    if (typeof u == "number" && i.unshift(`perspective(${u}px)`), i.length > 0 && (t.style.transform = i.join(" "), ji(t)), n) {
      const h = n.originX ?? 50, p = n.originY ?? 50;
      t.style.transformOrigin = `${h}% ${p}%`;
    }
    if (r) {
      const h = r.clipTop ?? 0, p = r.clipRight ?? 0, g = r.clipBottom ?? 0, d = r.clipLeft ?? 0;
      t.style.clipPath = `inset(${h}% ${p}% ${g}% ${d}%)`;
    }
    if (o) {
      const h = Vi(o);
      h && (t.style.filter = h);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(t, s) {
    if (typeof s != "number") return null;
    switch (t) {
      case "x":
      case "motionPathX":
        return `translateX(${s}px)`;
      case "y":
      case "motionPathY":
        return `translateY(${s}px)`;
      case "z":
        return `translateZ(${s}px)`;
      case "rotate":
      case "rotateZ":
      case "motionPathRotate":
        return `rotate(${s}deg)`;
      case "rotateX":
        return `rotateX(${s}deg)`;
      case "rotateY":
        return `rotateY(${s}deg)`;
      case "scale":
        return `scale(${s})`;
      case "scaleX":
        return `scaleX(${s})`;
      case "scaleY":
        return `scaleY(${s})`;
      case "scaleZ":
        return `scaleZ(${s})`;
      case "skewX":
        return `skewX(${s}deg)`;
      case "skewY":
        return `skewY(${s}deg)`;
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
  applyShine(t, s) {
    t.dataset.shineBase || (t.dataset.shineBase = t.style.color || "currentColor");
    const i = t.dataset.shineBase, n = -20 + s * 140, r = t.style;
    r.color = "transparent", r.backgroundImage = `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.9) 50%, transparent 60%), linear-gradient(${i}, ${i})`, r.backgroundSize = "250% 100%, 100% 100%", r.backgroundPosition = `${n}% 0, 0 0`, r.backgroundRepeat = "no-repeat", r.webkitBackgroundClip = "text", r.backgroundClip = "text";
  }
  /**
   * Apply a single style property to an element.
   */
  applyStyleProperty(t, s, i) {
    let n;
    s === "fill" && t.dataset.elementType === "text" ? n = "color" : n = Hi[s] ?? s;
    let r;
    typeof i == "number" ? he.has(s) || he.has(n) ? r = `${i}px` : r = String(i) : Array.isArray(i) ? r = i.join(", ") : r = i, t.style[n] = r;
  }
}
const Zi = {
  request: (e) => requestAnimationFrame(e),
  cancel: (e) => cancelAnimationFrame(e)
};
class Ki {
  adapter = new j();
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
    this.scheduler = t.scheduler ?? Zi, this.rootOption = t.root;
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
    const s = [];
    for (const i of this.targetsOf(t)) {
      const n = this.nameFor(i);
      Rt(i) && this.currentCollector?.touch(i, n), s.push(n);
    }
    return s;
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
  appliedValue(t, s) {
    return this.applied.get(t)?.get(s);
  }
  /**
   * How fast a property is changing right now, in units per second, taken from
   * the most recently played timeline that animates it — so a spring started
   * mid-motion carries the momentum. A finite difference over a few milliseconds
   * of that timeline's own (deterministic) state; undefined when nothing playing
   * animates the property.
   */
  velocityOf(t, s) {
    for (const n of [...this.active.keys()].reverse()) {
      if (n.getTracks({ target: t, property: s }).length === 0) continue;
      const r = n.currentTime;
      if (r < 4) return 0;
      const o = n.getStateAtTime(r).values.get(t)?.get(s), a = n.getStateAtTime(r - 4).values.get(t)?.get(s);
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
  activate(t, s = {}) {
    this.destroyed || (t.onUpdate = (i) => this.write(i), this.active.delete(t), this.active.set(t, s), this.startLoop());
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
  apply(t, s) {
    if (this.destroyed) return;
    const i = new Map(Object.entries(s));
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
    for (const [s, i] of [...this.active])
      s.duration <= 0 ? (this.write(s.getStateAtTime(0)), s.stop()) : s.tick(t), i.onUpdate?.(), s.playbackState !== "playing" && this.active.delete(s);
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
      for (const s of [...this.tickerCallbacks])
        s(this.tickerTime / 1e3, t, this.tickerFrame);
    }
  }
  write(t) {
    for (const [s, i] of t.values) {
      let n = this.applied.get(s);
      n || (n = /* @__PURE__ */ new Map(), this.applied.set(s, n));
      for (const [r, o] of i) n.set(r, o);
      this.dirty.add(s);
    }
  }
  flush() {
    if (this.dirty.size === 0) return;
    const t = /* @__PURE__ */ new Map();
    for (const s of this.dirty) {
      const i = this.applied.get(s), n = this.objects.get(s);
      if (n)
        for (const [r, o] of i) n[r] = o;
      else
        t.set(s, i);
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
    const s = this.lastTimestamp === null ? 0 : t - this.lastTimestamp;
    this.lastTimestamp = t, s > 0 && this.tick(s), this.running && this.frameId === null && (this.frameId = this.scheduler.request(this.frame));
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
    if (Rt(t)) return [t];
    if (!Qi(t)) return [t];
    const s = [];
    for (const i of Array.from(t))
      s.push(...this.targetsOf(i));
    return s;
  }
  nameFor(t) {
    return Rt(t) ? this.elementName(t) : this.objectName(t);
  }
  objectName(t) {
    const s = this.objectNames.get(t);
    if (s) return s;
    let i;
    do
      this.nameCounter += 1, i = `obj-${this.nameCounter}`;
    while (this.objects.has(i) || this.elements.has(i));
    return this.objectNames.set(t, i), this.objects.set(i, t), i;
  }
  elementName(t) {
    const s = this.names.get(t);
    if (s) return s;
    let i = t.id ? `#${t.id}` : "";
    if (!i || this.elements.has(i))
      do
        this.nameCounter += 1, i = `el-${this.nameCounter}`;
      while (this.elements.has(i));
    return this.names.set(t, i), this.elements.set(i, t), this.adapter.registerTarget(i, t), i;
  }
}
function Rt(e) {
  return typeof e == "object" && e !== null && e.nodeType === 1;
}
function Qi(e) {
  if (Array.isArray(e)) return !0;
  const t = e;
  return typeof t.length == "number" && typeof t.item == "function";
}
function Tt(e) {
  const t = e.style;
  if (!t) return e.getBoundingClientRect();
  const s = t.transform;
  t.transform = "none";
  const i = e.getBoundingClientRect();
  return t.transform = s, i;
}
const ue = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function Ji(e) {
  const t = {};
  for (const s of Array.from(e.attributes)) t[s.name] = s.value;
  return t;
}
function tn(e) {
  const t = e.getScreenCTM?.();
  if (t) return [t.a, t.b, t.c, t.d, t.e, t.f];
  const s = e.getBoundingClientRect();
  return [1, 0, 0, 1, s.left, s.top];
}
function en(e, t) {
  const s = typeof e == "string" || Array.isArray(e) || ue(e) ? { path: e } : e, { align: i, alignOrigin: n, path: r, ...o } = s, a = (v) => {
    const x = ue(v) ? v : t.query(v);
    return x || t.warn(`gsap-compat: motionPath could not find "${String(v)}"`), x;
  };
  let c = null, l = "";
  if (Array.isArray(r) || typeof r == "string" && ft(r))
    l = r;
  else {
    c = a(r);
    const v = c && Yt({ tag: c.localName, attributes: Ji(c) });
    c && !v && t.warn(`gsap-compat: motionPath element <${c.localName}> has no path geometry`), l = v ?? "";
  }
  const f = { ...o, path: l };
  if (i === void 0 || i === !1) return f;
  const u = i === !0 ? c : a(i);
  if (!u)
    return i === !0 && t.warn("gsap-compat: motionPath align: true needs the path to be an element"), f;
  const h = t.targets[0];
  if (!h) return f;
  const [p, g, d, m, y, T] = tn(u), w = Tt(h), [k, b] = n ?? [0.5, 0.5];
  for (const v of t.targets.slice(1)) {
    const x = Tt(v);
    if (Math.abs(x.left - w.left) > 0.5 || Math.abs(x.top - w.top) > 0.5) {
      t.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return f.matrix = [p, g, d, m, y - w.left - k * w.width, T - w.top - b * w.height], f;
}
const ts = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function es(e) {
  const t = {};
  for (const s of Array.from(e.attributes)) t[s.name] = s.value;
  return t;
}
function ss(e) {
  if (!e) return null;
  const t = Yt({ tag: e.localName, attributes: es(e) });
  return t || (e.querySelector("path")?.getAttribute("d") ?? null);
}
function sn(e, t, s) {
  const i = Qe(e);
  if (typeof i == "string" && ft(i)) return i;
  const n = ts(i) ? i : typeof i == "string" ? t(i) : null, r = ss(n);
  return r || (s(`gsap-compat: morphSVG could not find a shape for "${String(i)}"`), "");
}
const nn = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function rn(e, t = document) {
  return (typeof e == "string" ? Array.from(t.querySelectorAll(e)) : ts(e) ? [e] : Array.from(e)).map((i) => {
    if (i.localName === "path") return i;
    const n = Yt({ tag: i.localName, attributes: es(i) });
    if (!n || !i.parentNode) return i;
    const r = i.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const o of Array.from(i.attributes))
      nn.has(o.name) || r.setAttribute(o.name, o.value);
    return r.setAttribute("d", n), i.parentNode.replaceChild(r, i), r;
  });
}
const fe = 0.3;
class on {
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
  begin(t, s, i) {
    this.dragging = !0, this.passedTolerance = !1, this.startX = t, this.startY = s, this.lastX = t, this.lastY = s, this.velocityX = 0, this.velocityY = 0, this.lastTime = de(), this.options.onPress?.(this.stateFrom(0, 0, i));
  }
  move(t, s, i) {
    if (!this.dragging) return;
    const n = t - this.lastX, r = s - this.lastY;
    this.lastX = t, this.lastY = s;
    const o = t - this.startX, a = s - this.startY, c = this.options.tolerance ?? 3;
    if (!this.passedTolerance) {
      if (Math.hypot(o, a) < c) return;
      this.passedTolerance = !0;
    }
    this.updateVelocity(n, r), this.options.preventDefault !== !1 && i.cancelable && i.preventDefault(), this.options.onMove?.(this.stateFrom(n, r, i));
  }
  end(t) {
    this.dragging && (this.dragging = !1, this.options.onRelease?.(this.stateFrom(0, 0, t)));
  }
  updateVelocity(t, s) {
    const i = de(), n = Math.max(1, i - this.lastTime);
    this.lastTime = i;
    const r = t / n * 1e3, o = s / n * 1e3;
    this.velocityX += (r - this.velocityX) * fe, this.velocityY += (o - this.velocityY) * fe;
  }
  stateFrom(t, s, i) {
    return {
      deltaX: t,
      deltaY: s,
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
    const s = t, i = this.target;
    if (typeof s.pointerId == "number" && typeof i.setPointerCapture == "function")
      try {
        i.setPointerCapture(s.pointerId);
      } catch {
      }
    this.begin(s.clientX, s.clientY, t);
  };
  onPointerMove = (t) => {
    const s = t;
    this.move(s.clientX, s.clientY, t);
  };
  onPointerUp = (t) => this.end(t);
  onTouchStart = (t) => {
    const s = t.touches[0];
    s && this.begin(s.clientX, s.clientY, t);
  };
  onTouchMove = (t) => {
    const s = t.touches[0];
    s && this.move(s.clientX, s.clientY, t);
  };
  onTouchEnd = (t) => this.end(t);
  onWheel = (t) => {
    const s = t;
    this.options.preventDefault !== !1 && s.cancelable && s.preventDefault(), this.updateVelocity(s.deltaX, s.deltaY), this.options.onMove?.({
      deltaX: s.deltaX,
      deltaY: s.deltaY,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      totalX: 0,
      totalY: 0,
      isDragging: !1,
      event: t
    });
  };
}
function de() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function an(e, t, s) {
  let i = { delta: 0, line: null }, n = s;
  for (const r of e)
    for (const o of t) {
      const a = Math.abs(o - r);
      a <= n && (n = a, i = { delta: o - r, line: o });
    }
  return i;
}
function cn(e, t) {
  return t <= 0 ? [] : e.map((s) => Math.round(s / t) * t);
}
class is {
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
    this.options = t, this.x = t.initialX ?? 0, this.y = t.initialY ?? 0, this.observer = new on({
      target: t.target,
      onPress: (s) => {
        const i = t.getPosition?.();
        i && (this.x = i.x, this.y = i.y), this.originX = this.x, this.originY = this.y, t.onPress?.(s);
      },
      onMove: (s) => this.handleMove(s),
      onRelease: (s) => t.onRelease?.(s)
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
  setPosition(t, s) {
    const i = this.options.axis ?? "both";
    this.x = i === "y" ? this.x : this.applyConstraints(t, "x"), this.y = i === "x" ? this.y : this.applyConstraints(s, "y");
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
    const s = t.duration;
    if (s <= 0) return;
    const i = this.options.scrubDistance ?? 500;
    if (i === 0) return;
    const n = (this.options.axis ?? "both") === "y" ? this.y : this.x, r = ln(n / i);
    t.pause(), t.seek(r * s);
  }
  /**
   * Apply snapping, then bounds. Snapping uses the shared `snapAxis` helper —
   * the same one the editor stage snaps with — rather than a private rounding
   * rule, so grid and edge snapping behave identically in both places.
   *
   * Bounds are applied last so a snap can never push the target out of range.
   */
  applyConstraints(t, s) {
    let i = t;
    const n = [
      ...cn([i], this.options.snap ?? 0),
      ...(s === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], r = an([i], n, this.snapThreshold());
    i += r.delta, s === "x" ? this.snappedX = r.line : this.snappedY = r.line;
    const o = this.options.bounds;
    if (o) {
      const a = s === "x" ? o.minX : o.minY, c = s === "x" ? o.maxX : o.maxY;
      a !== void 0 && (i = Math.max(a, i)), c !== void 0 && (i = Math.min(c, i));
    }
    return i;
  }
}
function ln(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e;
}
function er(e) {
  const t = new is(e);
  return t.start(), t;
}
const hn = { x: "x", y: "y", "x,y": "both" }, pe = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function me(e, t) {
  const s = Tt(e), i = t.getBoundingClientRect();
  return {
    minX: i.left - s.left,
    maxX: i.right - s.right,
    minY: i.top - s.top,
    maxY: i.bottom - s.bottom
  };
}
function ge(e) {
  return Array.isArray(e) ? [...e] : e;
}
function un(e, t, s, i = {}) {
  const [n] = t.resolveTargets(s), r = n ? t.elementFor(n) : void 0;
  if (!n || !r)
    throw new Error(`gsap-compat: live.draggable could not find ${String(s)}`);
  const o = hn[i.type ?? "x,y"], a = () => {
    const d = t.appliedValue(n, "x"), m = t.appliedValue(n, "y");
    return { x: typeof d == "number" ? d : 0, y: typeof m == "number" ? m : 0 };
  }, c = typeof i.bounds == "string" ? t.query(i.bounds) : pe(i.bounds) ? i.bounds : null, f = { bounds: (!c && i.bounds && !pe(i.bounds) ? i.bounds : void 0) ?? (c ? me(r, c) : void 0) };
  let u = null;
  const h = () => {
    u?.kill(), u = null;
  }, p = (d) => {
    const m = i.inertia === !0 ? {} : i.inertia, y = m.friction ?? (m.resistance !== void 0 ? Je(m.resistance) : 4), T = a(), w = f.bounds ?? {};
    let k, b;
    const v = m.end;
    if (Array.isArray(v)) {
      const E = bt({ from: T.x, velocity: o === "y" ? 0 : d.x, friction: y }), L = bt({ from: T.y, velocity: o === "x" ? 0 : d.y, friction: y });
      let A = v[0];
      for (const S of v)
        Math.hypot(S.x - E, S.y - L) < Math.hypot(A.x - E, A.y - L) && (A = S);
      A && (k = [A.x], b = [A.y]);
    } else typeof v == "number" ? (k = v, b = v) : v && (k = ge(v.x), b = ge(v.y));
    const x = {};
    o !== "y" && (x.x = { velocity: d.x, friction: y, min: w.minX, max: w.maxX, end: k }), o !== "x" && (x.y = { velocity: d.y, friction: y, min: w.minY, max: w.maxY, end: b }), u = e.to(r, { inertia: x, onComplete: () => i.onThrowComplete?.() });
  }, g = new is({
    target: r,
    axis: o,
    snap: i.snap,
    get bounds() {
      return f.bounds;
    },
    getPosition: a,
    onPress: () => {
      h(), c && (f.bounds = me(r, c)), i.onPress?.();
    },
    onDrag: (d) => {
      t.apply(n, o === "x" ? { x: d.x } : o === "y" ? { y: d.y } : { x: d.x, y: d.y }), i.onDrag?.(d);
    },
    onRelease: () => {
      const d = g.velocity;
      i.onRelease?.(d), i.inertia && p(d);
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
const fn = { opacity: 0, scale: 0.6 };
function dn(e) {
  const t = e.getBoundingClientRect();
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function ye(e) {
  const t = Tt(e);
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function be(e, t) {
  const i = e.resolveTargets(t).map((o) => e.elementFor(o)).filter((o) => !!o), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of i) {
    const a = dn(o);
    n.set(o, a);
    const c = ns(o);
    a && c !== void 0 && !r.has(c) && r.set(c, { element: o, box: a });
  }
  return { elements: i, boxes: n, ids: r };
}
const Ft = /* @__PURE__ */ new WeakMap();
function Te(e, t, s, i = {}) {
  const n = i.duration ?? 0.6, r = i.ease ?? "power2.inOut", o = i.stagger ?? 0, a = i.scale !== !1, c = i.enter === void 0 ? fn : i.enter, l = new Set(s.elements);
  if (i.targets !== void 0)
    for (const p of e.resolveTargets(i.targets)) {
      const g = e.elementFor(p);
      g && l.add(g);
    }
  const f = [...l].sort(
    (p, g) => p === g ? 0 : p.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), u = t({ onComplete: i.onComplete });
  let h = 0;
  for (const p of f) {
    const g = ye(p);
    if (!g) continue;
    let d = s.boxes.get(p) ?? null, m;
    const y = ns(p), T = !d && y !== void 0 ? s.ids.get(y) : void 0;
    T && T.element !== p && (d = T.box, m = T.element);
    const [w] = e.resolveTargets(p);
    Ft.get(p)?.timeline.removeTracks({ target: w });
    const k = h * o;
    if (!d) {
      if (c === !1) continue;
      u.fromTo(p, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...c }, { ...pn(c), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: n, ease: r, delay: k }, 0), Ft.set(p, u), h++;
      continue;
    }
    const b = d.cx - g.cx, v = d.cy - g.cy, x = a ? d.width / g.width : 1, E = a ? d.height / g.height : 1;
    if (!(Math.abs(b) > 0.5 || Math.abs(v) > 0.5 || Math.abs(x - 1) > 1e-3 || Math.abs(E - 1) > 1e-3)) {
      const S = (_, M) => {
        const P = e.appliedValue(w, _);
        return typeof P == "number" && Math.abs(P - M) > 1e-6;
      };
      (S("x", 0) || S("y", 0) || S("scaleX", 1) || S("scaleY", 1)) && u.set(p, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const A = i.fade === !0 && m !== void 0;
    u.fromTo(
      p,
      { x: b, y: v, scaleX: x, scaleY: E, ...A && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...A && { opacity: 1 }, duration: n, ease: r, delay: k },
      0
    ), A && m && ye(m) && u.fromTo(m, { opacity: 1 }, { opacity: 0, duration: n, ease: r, delay: k }, 0), Ft.set(p, u), h++;
  }
  return u;
}
function ns(e) {
  return e.dataset?.flipId;
}
function pn(e) {
  const t = {};
  for (const s of Object.keys(e))
    t[s] = s === "opacity" || s.startsWith("scale") ? 1 : 0;
  return t;
}
function mn(e, t = {}) {
  const s = new Set((t.type ?? "chars,words,lines").split(",").map((d) => d.trim())), i = {
    chars: t.charsClass ?? "char",
    words: t.wordsClass ?? "word",
    lines: t.linesClass ?? "line"
  }, n = t.aria !== !1, r = e.map((d) => ({
    element: d,
    html: d.innerHTML,
    ariaLabel: d.getAttribute("aria-label")
  }));
  let o = { chars: [], words: [], lines: [], masks: [] }, a, c, l = !1;
  const f = () => {
    for (const { element: d, html: m, ariaLabel: y } of r)
      d.innerHTML = m, y === null ? d.removeAttribute("aria-label") : d.setAttribute("aria-label", y);
  }, u = () => {
    a && (a.revert ? a.revert() : a.kill?.(), a = void 0);
  }, h = () => {
    const d = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: m } of r) {
      const y = (m.textContent ?? "").replace(/\s+/g, " ").trim(), T = gn(m, i.words), w = s.has("chars") ? T.flatMap((v) => yn(v, i.chars)) : [], k = s.has("lines") ? Tn(m, T, i.lines) : [];
      if (n) {
        !m.hasAttribute("aria-label") && y && m.setAttribute("aria-label", y);
        for (const v of T) v.setAttribute("aria-hidden", "true");
      }
      if (s.has("words")) d.words.push(...T);
      else for (const v of T) v.removeAttribute("class");
      d.chars.push(...w), d.lines.push(...k);
      const b = t.mask === "lines" ? k : t.mask === "words" ? T : t.mask === "chars" ? w : [];
      for (const v of b) d.masks.push(vn(v, `${i[t.mask]}-mask`));
    }
    o = d;
  }, p = {
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
      l || (u(), f(), h(), a = t.onSplit?.(p));
    },
    revert() {
      l = !0, c?.disconnect(), u(), f();
    }
  };
  h(), a = t.onSplit?.(p), t.autoSplit && g();
  function g() {
    const d = /* @__PURE__ */ new Map();
    let m = !1;
    const y = () => {
      if (m) return;
      m = !0;
      const w = () => {
        m = !1, p.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(w) : setTimeout(w, 0);
    };
    if (typeof ResizeObserver == "function") {
      c = new ResizeObserver((w) => {
        let k = !1;
        for (const b of w) {
          const v = Math.round(b.contentRect.width), x = d.get(b.target);
          d.set(b.target, v), x !== void 0 && x !== v && (k = !0);
        }
        k && y();
      });
      for (const w of e) c.observe(w);
    }
    const T = e[0]?.ownerDocument?.fonts;
    T && T.status !== "loaded" && T.ready.then(() => y());
  }
  return p;
}
function gn(e, t) {
  const s = e.ownerDocument, i = [], n = s.createTreeWalker(
    e,
    4
    /* NodeFilter.SHOW_TEXT */
  ), r = [];
  for (let o = n.nextNode(); o; o = n.nextNode()) r.push(o);
  for (const o of r) {
    const a = o.data.match(/\s+|\S+/g) ?? [];
    if (a.length === 0) continue;
    const c = s.createDocumentFragment();
    for (const l of a) {
      if (/^\s/.test(l)) {
        c.appendChild(s.createTextNode(l));
        continue;
      }
      const f = s.createElement("span");
      f.className = t, f.style.display = "inline-block", f.textContent = l, c.appendChild(f), i.push(f);
    }
    o.replaceWith(c);
  }
  return i;
}
function yn(e, t) {
  const s = e.ownerDocument, i = bn(e.textContent ?? "").map((n) => {
    const r = s.createElement("span");
    return r.className = t, r.style.display = "inline-block", r.textContent = n, r;
  });
  return e.replaceChildren(...i), i;
}
function bn(e) {
  const t = Intl.Segmenter;
  return t ? Array.from(new t(void 0, { granularity: "grapheme" }).segment(e), (s) => s.segment) : Array.from(e);
}
function Tn(e, t, s) {
  const i = e.ownerDocument, n = new Map(t.map((g) => [g, g.getBoundingClientRect()])), r = [], o = (g) => {
    for (const d of Array.from(g.childNodes))
      d.nodeType === 3 || n.has(d) || d.tagName === "BR" ? r.push(d) : o(d);
  };
  o(e);
  const a = [];
  let c = null, l = 0, f = 0, u = !1, h = [];
  const p = () => {
    c = i.createElement("span"), c.className = s, c.style.display = "block", a.push(c), h = [];
  };
  for (const g of r) {
    if (g.tagName === "BR") {
      u = !0;
      continue;
    }
    const d = n.get(g);
    if (d && (!c || u || d.top > l + f) && (p(), l = d.top, f = d.height / 2, u = !1), !c) continue;
    const m = [];
    for (let w = g.parentNode; w && w !== e; w = w.parentNode) m.unshift(w);
    let y = 0;
    for (; y < h.length && y < m.length && h[y].original === m[y]; ) y++;
    h.length = y;
    let T = y === 0 ? c : h[y - 1].clone;
    for (const w of m.slice(y)) {
      const k = w.cloneNode(!1);
      T.appendChild(k), h.push({ original: w, clone: k }), T = k;
    }
    T.appendChild(g);
  }
  return e.replaceChildren(...a), a;
}
function vn(e, t) {
  const s = e.ownerDocument.createElement("span");
  return s.className = t, s.style.display = e.style.display === "block" ? "block" : "inline-block", s.style.overflow = "clip", e.replaceWith(s), s.appendChild(e), s;
}
const ve = {
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
function we(e) {
  const t = e.trim().toLowerCase();
  if (t in ve) return ve[t];
  if (t.endsWith("%")) {
    const s = Number.parseFloat(t.slice(0, -1));
    return Number.isNaN(s) ? void 0 : s / 100;
  }
}
function wn(e) {
  if (typeof e == "number")
    return { elementFraction: 0, viewportFraction: 0, offsetPx: 0, absolutePx: e };
  let t = 0;
  const i = e.replace(/([+-])=\s*(-?[\d.]+)/g, (o, a, c) => (t += (a === "-" ? -1 : 1) * Number.parseFloat(c), "")).trim().split(/\s+/).filter(Boolean);
  if (i.length === 1 && /^-?[\d.]+$/.test(i[0]))
    return {
      elementFraction: 0,
      viewportFraction: 0,
      offsetPx: 0,
      absolutePx: Number.parseFloat(i[0]) + t
    };
  const n = i[0] !== void 0 ? we(i[0]) : void 0, r = i[1] !== void 0 ? we(i[1]) : void 0;
  return {
    elementFraction: n ?? 0,
    viewportFraction: r ?? 0,
    offsetPx: t
  };
}
function vt(e, t, s) {
  const i = wn(s), n = i.absolutePx !== void 0 ? e.top + i.absolutePx : e.top + e.height * i.elementFraction, r = t * i.viewportFraction;
  return n - r + i.offsetPx;
}
function sr(e, t, s, i) {
  const n = vt(e, t, s), o = vt(e, t, i) - n;
  return o <= 0 ? n <= 0 ? 1 : 0 : rs(-n / o);
}
function rs(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e === 0 ? 0 : e;
}
function Sn(e, t, s, i) {
  if (s <= 0) return t;
  const n = 1 - Math.exp(-(i / 1e3) / s);
  return e + (t - e) * n;
}
class kn {
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
          for (const s of t)
            s.isIntersecting ? this.enter() : this.leave();
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
function ir(e) {
  const t = new kn(e);
  return t.start(), t;
}
class xn {
  element;
  spacer;
  saved;
  constructor(t) {
    this.element = t;
    const s = t.ownerDocument;
    this.spacer = s.createElement("div"), this.spacer.className = "pin-spacer", this.saved = { position: t.style.position, top: t.style.top }, t.replaceWith(this.spacer), this.spacer.appendChild(t);
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
  apply(t, s) {
    const i = this.element.offsetHeight;
    this.spacer.style.height = `${i + Math.max(0, s)}px`, this.element.style.position = "sticky", this.element.style.top = `${t}px`;
  }
  /** Remove the spacer and restore the element's own styles. */
  destroy() {
    this.element.style.position = this.saved.position, this.element.style.top = this.saved.top, this.spacer.parentNode && this.spacer.replaceWith(this.element);
  }
}
const An = 120, K = [], os = () => {
  for (const e of K) e.refresh();
};
let Q = { width: 0, height: 0 };
const Se = () => {
  const e = window.innerWidth, t = window.innerHeight, s = e === Q.width && t !== Q.height, i = Math.abs(t - Q.height) < Q.height * 0.25, n = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  s && i && n || (Q = { width: e, height: t }, os());
};
class jt {
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
    t && (this.pin = new xn(t)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), K.length === 0 && typeof window < "u" && (Q = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", Se, { passive: !0 })), K.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), K.splice(K.indexOf(this), 1), K.length === 0 && typeof window < "u" && window.removeEventListener("resize", Se), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null);
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
    os();
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
    const s = this.triggerRect();
    if (s) {
      const i = this.viewportHeight();
      if (this.startPx = t + vt(s, i, ke(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(s, i, t), this.pin) {
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
  updateFrom(t, s) {
    this.trackVelocity(t);
    const i = this.endPx - this.startPx, n = this.zone;
    this.targetProgress = i > 0 ? rs((t - this.startPx) / i) : t >= this.startPx ? 1 : 0, this.zone = i > 0 ? t <= this.startPx ? "before" : t >= this.endPx ? "after" : "active" : t >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(n, this.zone), s || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const t = this.options.scrub;
    return typeof t == "number" ? Math.max(0, t) : 0;
  }
  resolveEnd(t, s, i) {
    const n = ke(this.options.end) ?? "bottom top", r = typeof n == "string" ? n.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (r) {
      const o = Number.parseFloat(r[1]);
      return this.startPx + (r[2] === "%" ? s * o / 100 : o);
    }
    return i + vt(t, s, n);
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
    const s = typeof performance < "u" ? performance.now() : Date.now();
    this.lastScroll !== null && s > this.lastScrollTime && t !== this.lastScroll && (this.velocityPxPerSecond = (t - this.lastScroll) / (s - this.lastScrollTime) * 1e3), (this.lastScroll === null || t !== this.lastScroll) && (this.lastScroll = t, this.lastScrollTime = s), !(this.velocityPxPerSecond === 0 || typeof setTimeout > "u") && (this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = setTimeout(() => {
      this.idleTimer = null, this.velocityPxPerSecond = 0, this.emitUpdate();
    }, An));
  }
  /**
   * Emit enter/leave callbacks as the scroll position moves between zones. A jump
   * straight across the range (a fast flick, or loading the page scrolled past
   * it) fires both edges in order.
   */
  fireBoundaryCallbacks(t, s) {
    if (t === s) return;
    const { onEnter: i, onLeave: n, onEnterBack: r, onLeaveBack: o } = this.options;
    t === "before" ? (i?.(), s === "after" && n?.()) : t === "after" ? (r?.(), s === "before" && o?.()) : s === "after" ? n?.() : o?.();
  }
  startSmoothing() {
    if (this.rafId !== null || typeof requestAnimationFrame > "u") return;
    const t = (s) => {
      if (this.rafId = null, !this.running) return;
      const i = this.lastFrameTime === null ? 16.67 : s - this.lastFrameTime;
      this.lastFrameTime = s, this.displayProgress = Sn(this.displayProgress, this.targetProgress, this.smoothing(), i);
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
    const s = this.options.scroller;
    if (s && typeof s.getBoundingClientRect == "function") {
      const i = s.getBoundingClientRect();
      return { top: t.top - i.top, bottom: t.bottom - i.top, height: t.height };
    }
    return { top: t.top, bottom: t.bottom, height: t.height };
  }
  viewportHeight() {
    const t = this.options.scroller;
    return t ? t.clientHeight : typeof window < "u" ? window.innerHeight : 0;
  }
}
function ke(e) {
  return typeof e == "function" ? e() : e;
}
function nr(e) {
  const t = new jt(e);
  return t.start(), t;
}
function Mn(e, t) {
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
function as(e, t, s, i, n = () => {
}) {
  const r = (h) => typeof h == "string" ? e.query(h) ?? void 0 : h, o = r(t.trigger) ?? i;
  if (!o) {
    n(`gsap-compat: scrollTrigger has no trigger element${typeof t.trigger == "string" ? ` for "${t.trigger}"` : ""}`);
    return;
  }
  const a = t.scrub === void 0 || t.scrub === !1 ? !1 : t.scrub, c = (t.toggleActions ?? "play none none none").trim().split(/\s+/);
  let l = 0, f;
  const u = (h, p) => () => {
    p?.(), s && !a && Mn(s, c[h] ?? "none"), t.once && h === 0 && queueMicrotask(() => f.destroy());
  };
  return f = new jt({
    trigger: o,
    start: t.start,
    end: t.end,
    scrub: a === !1 ? void 0 : a,
    pin: t.pin === !0 ? !0 : r(t.pin),
    scroller: r(t.scroller),
    onRefresh: t.invalidateOnRefresh && s?.invalidate ? () => s.invalidate() : void 0,
    onUpdate: (h, p) => {
      if (s && a !== !1 && s.progress(h), t.onUpdate) {
        const g = h < l || p < 0 ? -1 : 1;
        t.onUpdate({ progress: h, velocity: p, direction: g });
      }
      l = h;
    },
    onEnter: u(0, t.onEnter),
    onLeave: u(1, t.onLeave),
    onEnterBack: u(2, t.onEnterBack),
    onLeaveBack: u(3, t.onLeaveBack)
  }), s && a === !1 && s.progress(0), f.start(), e.own(f);
}
class cs {
  /** For contexts made by matchMedia: which named queries match */
  conditions = {};
  scope;
  host;
  items = [];
  snapshots = /* @__PURE__ */ new Map();
  constructor(t, s) {
    this.host = t, this.scope = s;
  }
  /**
   * Run `fn` with this context collecting, and return what it returns. A function
   * it returns is kept as cleanup and called on `revert()`.
   */
  add(t) {
    const s = this.host.collector;
    this.host.setCollector(this);
    try {
      const i = t();
      return typeof i == "function" && this.items.push({ revert: i }), i;
    } finally {
      this.host.setCollector(s);
    }
  }
  track(t) {
    this.items.push(t);
  }
  touch(t, s) {
    this.snapshots.has(t) || this.snapshots.set(t, { name: s, style: t.getAttribute("style"), d: t.getAttribute("d") });
  }
  /** Undo everything, newest first, and restore the elements this context animated. */
  revert() {
    for (const t of this.items.splice(0).reverse())
      t.revert ? t.revert() : t.kill ? t.kill() : t.destroy?.();
    for (const [t, { name: s, style: i, d: n }] of this.snapshots)
      i === null ? t.removeAttribute("style") : t.setAttribute("style", i), n !== null && t.setAttribute("d", n), this.host.forget(s);
    this.snapshots.clear();
  }
  /** Same as `revert()`: GSAP's name for dropping a context. */
  kill() {
    this.revert();
  }
}
class _n {
  host;
  scope;
  entries = [];
  listeners = [];
  scheduled = !1;
  constructor(t, s) {
    this.host = t, this.scope = s;
  }
  add(t, s) {
    const i = { conditions: t, setup: s, queries: /* @__PURE__ */ new Map() }, n = typeof t == "string" ? { matches: t } : t;
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
    const s = {};
    for (const [o, a] of t.queries) s[o] = a.matches;
    const i = Object.values(s).some(Boolean), n = i ? JSON.stringify(s) : void 0;
    if (n === t.key || (t.context?.revert(), t.context = void 0, t.key = n, !i)) return;
    const r = new cs(this.host, this.scope);
    r.conditions = s, r.add(() => t.setup(r)), t.context = r;
  }
}
class ot {
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
  constructor(t, s = {}) {
    if (this.stage = t, this.options = s, this.compat = new J({
      ...s,
      startValue: (i, n) => {
        const r = t.objectFor(i);
        if (r) return En(r[n]);
        const o = t.appliedValue(i, n);
        if (o !== void 0) return o;
        if (n === "d") return ss(t.elementFor(i)) ?? void 0;
        if (n === "text") return t.elementFor(i)?.textContent ?? void 0;
        if (n === "strokeDasharray" || n === "strokeDashoffset") {
          const a = Ae(t.elementFor(i));
          if (a !== void 0) return n === "strokeDasharray" ? [a, a] : 0;
        }
      },
      startVelocity: (i, n) => t.velocityOf(i, n)
    }), this.compat.timeline.onComplete = () => s.onComplete?.(), t.collector?.track(this), this.autoplayPending = !s.paused && !s.scrollTrigger, s.scrollTrigger) {
      const i = s.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = as(t, i, this, this.firstElement, (n) => s.onWarning?.(n)));
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
  to(t, s, i) {
    return this.record(() => this.tween(t, [s], i, ([n], r, o) => this.compat.to(r, n, o)));
  }
  from(t, s, i) {
    return this.record(() => this.tween(t, [s], i, ([n], r, o) => this.compat.from(r, n, o)));
  }
  fromTo(t, s, i, n) {
    return this.record(
      () => this.tween(t, [s, i], n, ([r, o], a, c) => this.compat.fromTo(a, r, o, c))
    );
  }
  set(t, s, i) {
    return this.record(() => this.tween(t, [s], i, ([n], r, o) => this.compat.set(r, n, o)));
  }
  addLabel(t, s) {
    return this.record(() => this.compat.addLabel(t, s));
  }
  /** Merge another timeline in at a position (flattened, as in `tf`). */
  add(t, s) {
    return this.record(() => {
      t.autoplayPending = !1, t.timeline.stop(), t.stage.deactivate(t.timeline), this.compat.add(t.compat, s);
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
    for (const s of this.recipe) s();
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
    const s = this.compat.progress(t);
    return this.stage.render(this.timeline), s;
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
  tween(t, s, i, n) {
    const r = this.resolve(t);
    if (!r) return;
    if (!(r.length > 1 && (s.some($n) || r.some((u) => this.stage.objectFor(u) !== void 0)))) {
      const u = this.targetFor(r[0]);
      n(s.map((h) => this.prepare(xe(h, 0, u), r)), r, i);
      return;
    }
    const a = s.length - 1, { stagger: c, ...l } = s[a], f = typeof c == "number" ? c : c?.each ?? 0;
    r.forEach((u, h) => {
      const p = Xt(l.delay, 0) / 1e3 + h * f, d = s.map((m, y) => y === a ? { ...l, delay: p } : m).map((m) => this.prepare(xe(m, h, this.targetFor(u)), [u]));
      n(d, [u], h === 0 ? i : "<");
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
  prepare(t, s) {
    const i = (o) => this.options.onWarning?.(o), n = (o) => this.stage.query(o);
    let r = t;
    if (t.motionPath !== void 0) {
      const o = en(t.motionPath, {
        query: n,
        targets: s.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: i
      });
      r = { ...r, motionPath: o };
    }
    if (t.morphSVG !== void 0) {
      const o = sn(t.morphSVG, n, i), { morphSVG: a, ...c } = r;
      r = o ? { ...r, morphSVG: o } : c;
    }
    if (t.drawSVG !== void 0) {
      const o = Ae(this.stage.elementFor(s[0]));
      if (o === void 0) {
        i("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...c } = r;
        r = c;
      } else
        r = Ii(r, o);
    }
    return r;
  }
  resolve(t) {
    const s = this.stage.resolveTargets(t);
    if (s.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${In(t)}`);
      return;
    }
    return this.firstElement ??= s.map((i) => this.stage.elementFor(i)).find((i) => i !== void 0), s;
  }
}
function Pn(e = new Ki()) {
  const t = (n) => {
    const { config: r } = yt(n);
    return new ot(e, {
      repeat: r.repeat,
      yoyo: r.yoyo,
      repeatDelay: r.repeatDelay,
      paused: r.paused,
      onStart: r.onStart,
      onUpdate: r.onUpdate,
      onComplete: r.onComplete,
      scrollTrigger: r.scrollTrigger
    });
  }, s = (n) => (n && e.collector?.track(n), n), i = {
    stage: e,
    ticker: e.ticker,
    scrollTrigger: (n) => s(as(e, n)),
    refreshScroll: () => jt.refreshAll(),
    context: (n, r) => {
      const o = new cs(e, r);
      return n && o.add(() => n(o)), o;
    },
    matchMedia: (n) => new _n(e, n),
    quickTo: (n, r, o = {}) => {
      const a = new ot(e, { paused: !0 }), [c] = e.resolveTargets(n);
      return Object.assign((f) => {
        if (!c) return;
        const u = o.spring !== void 0 ? e.velocityOf(c, r) ?? 0 : 0;
        a.compat.reset(), a.compat.to(c, {
          [r]: f,
          duration: o.duration ?? 0.4,
          ease: o.ease ?? "power3.out",
          ...o.spring !== void 0 && { spring: Cn(o.spring, r, u) }
        }), a.timeline.stop(), a.timeline.play(), e.activate(a.timeline);
      }, { tween: a, kill: () => a.kill() });
    },
    timeline: (n) => new ot(e, n),
    to: (n, r) => t(r).to(n, r),
    from: (n, r) => t(r).from(n, r),
    fromTo: (n, r, o) => t(o).fromTo(n, r, o),
    set: (n, r) => t(r).set(n, r),
    convertToPath: (n) => rn(n, e.root),
    splitText: (n, r) => {
      const o = e.collector?.scope ?? e.root, a = typeof n == "string" ? Array.from(o.querySelectorAll(n)) : "nodeType" in n ? [n] : Array.from(n);
      return s(mn(a, r));
    },
    draggable: (n, r) => s(un(i, e, n, r)),
    getFlipState: (n) => be(e, n),
    flipFrom: (n, r) => Te(e, (o) => new ot(e, o), n, r),
    flip: (n, r, o) => {
      const a = be(e, n);
      return r(), Te(e, (c) => new ot(e, c), a, { targets: n, ...o });
    }
  };
  return i;
}
const X = /* @__PURE__ */ Pn();
function Cn(e, t, s) {
  return e === !0 ? { velocity: { [t]: s } } : typeof e == "string" ? { preset: e, velocity: { [t]: s } } : { ...e, velocity: { [t]: s } };
}
function $n(e) {
  return e.morphSVG !== void 0 || e.drawSVG !== void 0 || e.text !== void 0 || e.scrambleText !== void 0 || ls(e);
}
function ls(e) {
  return Object.entries(e).some(([t, s]) => typeof s == "function" && !Ut.has(t));
}
function xe(e, t, s) {
  if (!ls(e)) return e;
  const i = {};
  for (const [n, r] of Object.entries(e))
    i[n] = typeof r == "function" && !Ut.has(n) ? r(t, s) : r;
  return i;
}
function Ae(e) {
  const t = e;
  if (typeof t?.getTotalLength == "function")
    return t.getTotalLength();
}
function En(e) {
  if (typeof e == "number" || typeof e == "string" || Array.isArray(e) && e.every((t) => typeof t == "number")) return e;
}
function In(e) {
  return typeof e == "string" ? `"${e}"` : String(e);
}
class Me {
  media;
  offset;
  driftTolerance;
  constructor(t, s = {}) {
    this.media = t, this.offset = s.offset ?? 0, this.driftTolerance = Math.max(0, s.driftTolerance ?? 0.15);
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
  update(t, s) {
    const i = this.targetTime(t);
    s ? (this.media.paused && this.safePlay(), Math.abs(this.media.currentTime - i) > this.driftTolerance && (this.media.currentTime = i)) : (this.media.paused || this.media.pause(), this.media.currentTime !== i && (this.media.currentTime = i));
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
function Dn(e, t, s, i, n) {
  const r = s - n;
  if (r < 0) {
    t.paused || t.pause(), t.currentTime = 0;
    return;
  }
  e.update(r, i);
}
class hs {
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
  constructor(t, s = {}) {
    if (typeof t == "string") {
      const i = document.querySelector(t);
      if (!i)
        throw new Error(`Container not found: ${t}`);
      this.container = i;
    } else
      this.container = t;
    this.options = s, this.adapter = new j();
  }
  /**
   * Load animation from a URL or JSON object.
   */
  async load(t) {
    let s;
    if (typeof t == "string") {
      const i = await fetch(t);
      if (!i.ok)
        throw new Error(`Failed to load animation: ${i.statusText}`);
      s = await i.json();
    } else
      s = t;
    this.options.speed !== void 0 && (s.config = { ...s.config, speed: this.options.speed }), this.options.loop !== void 0 && (s.config = { ...s.config, loop: this.options.loop }), this.options.alternate !== void 0 && (s.config = { ...s.config, alternate: this.options.alternate }), this.timeline = lt(s), this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia(), this.options.autoplay && this.play();
  }
  /**
   * Find embedded media elements (`[data-tinyfly-media]`) in the container and
   * bind each to the timeline. Emitted by the editor's export for audio/video
   * scene elements; the `data-tinyfly-start` attribute sets when each begins.
   */
  scanMedia() {
    this.mediaTargets = [], this.container.querySelectorAll("[data-tinyfly-media]").forEach((s) => {
      const i = s, n = Number(i.getAttribute("data-tinyfly-start") ?? "0") || 0, r = i.getAttribute("data-volume");
      r !== null && (i.volume = Math.max(0, Math.min(1, Number(r) || 0))), this.mediaTargets.push({ el: i, startTime: n, sync: new Me(i) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(t, s) {
    for (const i of this.mediaTargets)
      Dn(i.sync, i.el, t, s, i.startTime);
  }
  /**
   * Load animation from inline JSON string.
   */
  loadFromString(t) {
    const s = JSON.parse(t);
    this.load(s);
  }
  /**
   * Register a target element by name.
   */
  registerTarget(t, s) {
    if (typeof s == "string") {
      const i = this.container.querySelector(s);
      i && (this.targets[t] = i, this.adapter.registerTarget(t, i));
    } else
      this.targets[t] = s, this.adapter.registerTarget(t, s);
  }
  /**
   * Auto-register targets using data-tinyfly attribute.
   */
  autoRegisterTargets() {
    this.container.querySelectorAll("[data-tinyfly]").forEach((s) => {
      const i = s.closest("[data-tinyfly-symbol]");
      if (i && i !== s) return;
      const n = s.getAttribute("data-tinyfly");
      n && this.registerTarget(n, s);
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
    const s = new Map(t.map((i) => [i.id, i]));
    this.container.querySelectorAll("[data-tinyfly-symbol]").forEach((i) => {
      const n = i.getAttribute("data-tinyfly-symbol");
      if (!n) return;
      const r = s.get(n);
      if (!r || !r.timeline.tracks?.length) return;
      const o = new j();
      i.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const c = a.getAttribute("data-tinyfly");
        c && o.registerTarget(c, a);
      }), this.symbolInstances.push({ adapter: o, timeline: lt(r.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(t, s) {
    this.mediaSync = new Me(t, s), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const t = (s) => {
      if (this.isDestroyed || !this.timeline) return;
      const i = s - (this.lastTime ?? s);
      this.lastTime = s, this.timeline.tick(i), this.applyState();
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
    for (const s of this.symbolInstances) {
      const i = s.timeline.duration;
      s.adapter.applyState(s.timeline.getStateAtTime(i > 0 ? t % i : t));
    }
  }
}
async function rr(e, t, s = {}) {
  const i = new hs(e, { ...s, autoplay: !0 });
  return await i.load(t), i;
}
function or(e, t = {}) {
  return new hs(e, t);
}
class Rn {
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
  constructor(t, s = {}) {
    if (typeof t == "string") {
      const i = document.querySelector(t);
      if (!i) throw new Error(`Container not found: ${t}`);
      this.container = i;
    } else
      this.container = t;
    this.options = s, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new j(), this.adapterB = new j();
  }
  /**
   * Load a sequence from a URL or inline definition.
   */
  async load(t) {
    let s;
    if (typeof t == "string") {
      const i = await fetch(t);
      if (!i.ok)
        throw new Error(`Failed to load sequence: ${i.statusText}`);
      s = await i.json();
    } else
      s = t;
    this.sequence = s, this.symbolDefs.clear();
    for (const i of s.symbols ?? [])
      i.timeline?.tracks?.length && this.symbolDefs.set(i.id, i.timeline);
    this.container.style.width = `${s.canvas.width}px`, this.container.style.height = `${s.canvas.height}px`, s.scenes.length > 0 && (this.renderScene(s.scenes[0], this.containerA, this.adapterA), this.timelineA = this.createTimeline(s.scenes[0])), this.options.autoplay && this.play();
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
    const s = this._isPlaying;
    this.transitionTimer !== void 0 && (clearTimeout(this.transitionTimer), this.transitionTimer = void 0), this.stopAnimationLoop(), this.timelineA && this.timelineA.stop(), this.timelineB && this.timelineB.stop(), this._currentSceneIndex = t, this._state = s ? "playing-scene" : "idle", this.clearContainer(this.containerA), this.clearContainer(this.containerB), this.adapterA.clearTargets(), this.adapterB.clearTargets(), this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB);
    const i = this.sequence.scenes[t];
    if (this.renderScene(i, this.containerA, this.adapterA), this.timelineA = this.createTimeline(i), this.options.onSceneChange?.(t), s)
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
      for (const s of t) s.adapter.clearTargets();
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
  renderScene(t, s, i) {
    s.innerHTML = "", i.clearTargets();
    const n = document.createElement("div");
    n.style.cssText = "position:absolute;inset:0;transform-origin:center center", n.setAttribute("data-tinyfly", "Camera"), s.appendChild(n), i.registerTarget("Camera", n);
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
  setupNested(t, s) {
    const i = [];
    t.querySelectorAll("[data-tinyfly-symbol]").forEach((n) => {
      const r = n.getAttribute("data-tinyfly-symbol");
      if (!r) return;
      const o = this.symbolDefs.get(r);
      if (!o) return;
      const a = new j();
      n.querySelectorAll("[data-tinyfly]").forEach((c) => {
        const l = c.getAttribute("data-tinyfly");
        l && a.registerTarget(l, c);
      }), i.push({ adapter: a, timeline: lt(o) });
    }), i.length ? this.nestedByAdapter.set(s, i) : this.nestedByAdapter.delete(s);
  }
  /** Apply the nested symbol states for a slot at a given scene time. */
  applyNested(t, s) {
    const i = this.nestedByAdapter.get(t);
    if (i)
      for (const n of i) {
        const r = n.timeline.duration;
        n.adapter.applyState(n.timeline.getStateAtTime(r > 0 ? s % r : s));
      }
  }
  clearContainer(t) {
    t.innerHTML = "";
  }
  createTimeline(t) {
    return t.timeline ? lt(t.timeline) : null;
  }
  onSceneComplete() {
    if (this._isDestroyed || !this.sequence) return;
    const t = this._currentSceneIndex + 1;
    if (t >= this.sequence.scenes.length) {
      const s = this.options.loop ?? this.sequence.loop ?? 0;
      s === -1 || s > 0 && this.loopIteration < s - 1 ? (this.loopIteration++, this.beginTransitionTo(0)) : (this._isPlaying = !1, this._state = "idle", this.stopAnimationLoop(), this.options.onComplete?.());
    } else
      this.beginTransitionTo(t);
  }
  beginTransitionTo(t) {
    if (!this.sequence || this._isDestroyed) return;
    const s = this.sequence.scenes[t], i = s.transition;
    if (i.type === "none" || i.duration <= 0) {
      this.switchToScene(t);
      return;
    }
    this._state = "transitioning", this.containerB.style.visibility = "visible", this.renderScene(s, this.containerB, this.adapterB), this.timelineB = this.createTimeline(s), this.timelineB && this.timelineB.play(), this.applyTransition(i.type, i.duration), this.transitionTimer = window.setTimeout(() => {
      this.finishTransition(t);
    }, i.duration);
  }
  applyTransition(t, s) {
    const i = `${s}ms`, n = "ease-in-out";
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
    const s = this.containerA;
    this.containerA = this.containerB, this.containerB = s;
    const i = this.adapterA;
    this.adapterA = this.adapterB, this.adapterB = i, this.timelineA = this.timelineB, this.timelineB = null, this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB), this._currentSceneIndex = t, this._state = "playing-scene", this.options.onSceneChange?.(t), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.playbackState !== "playing" && this.timelineA.play()) : this.onSceneComplete();
  }
  switchToScene(t) {
    if (!this.sequence || this._isDestroyed) return;
    this.timelineA && this.timelineA.stop(), this.adapterA.clearTargets(), this.clearContainer(this.containerA);
    const s = this.sequence.scenes[t];
    this.renderScene(s, this.containerA, this.adapterA), this.timelineA = this.createTimeline(s), this._currentSceneIndex = t, this._state = "playing-scene", this.options.onSceneChange?.(t), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.play()) : this.onSceneComplete();
  }
  startAnimationLoop() {
    if (this.animationFrameId !== void 0) return;
    this.lastTime = performance.now();
    const t = (s) => {
      if (this._isDestroyed || !this._isPlaying) return;
      const i = s - (this.lastTime ?? s);
      if (this.lastTime = s, this.timelineA && this.timelineA.playbackState === "playing") {
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
async function ar(e, t, s = {}) {
  const i = new Rn(e, { ...s, autoplay: !0 });
  return await i.load(t), i;
}
const cr = { type: "none", duration: 0 };
function lr(e) {
  const { timeline: t } = e, s = new j();
  for (const [l, f] of Object.entries(e.targets)) {
    const u = typeof f == "string" ? document.querySelector(f) : f;
    if (!u)
      throw new Error(`quickPlay: no element found for target "${l}" (${String(f)})`);
    s.registerTarget(l, u);
  }
  t.onUpdate = (l) => {
    s.applyState(l), e.onUpdate?.(l);
  }, e.onComplete && (t.onComplete = e.onComplete);
  let i = null, n = null, r = !1;
  const o = (l) => {
    if (r) return;
    const f = n === null ? 0 : l - n;
    n = l, f > 0 && t.tick(f), i = requestAnimationFrame(o);
  }, a = () => {
    i !== null || r || (n = null, i = requestAnimationFrame(o));
  }, c = () => {
    i !== null && cancelAnimationFrame(i), i = null, n = null;
  };
  return s.applyState(t.getStateAtTime(t.currentTime)), e.autoplay !== !1 && (t.play(), a()), {
    timeline: t,
    adapter: s,
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
      t.seek(l * 1e3), s.applyState(t.getStateAtTime(t.currentTime));
    },
    destroy() {
      r = !0, c(), t.stop(), s.clearTargets();
    }
  };
}
const hr = {
  timeline: Xi,
  to(e, t, s) {
    const i = new J(s);
    return i.to(e, t), i;
  },
  from(e, t, s) {
    const i = new J(s);
    return i.from(e, t), i;
  },
  fromTo(e, t, s, i) {
    const n = new J(i);
    return n.fromTo(e, t, s), n;
  },
  set(e, t, s) {
    const i = new J(s);
    return i.set(e, t), i;
  }
}, ur = X.to, fr = X.from, dr = X.fromTo, pr = X.set, mr = X.timeline, gr = X.ticker, yr = X.splitText, br = X.context, Tr = X.matchMedia, vr = X.quickTo;
export {
  Bn as Clock,
  J as CompatTimeline,
  Xe as DEFAULT_BAKE_INTERVAL_MS,
  Wt as DEFAULT_INERTIA_FRICTION,
  F as DEFAULT_SPRING,
  cr as DEFAULT_TRANSITION,
  is as Draggable,
  Ss as INERTIA_MAX_DURATION_MS,
  ri as InertiaTrackPlayer,
  ot as LiveTimeline,
  Un as MORPH_SAMPLES,
  Ln as ManualClock,
  Me as MediaSync,
  on as Observer,
  $e as SPRING_MAX_DURATION_MS,
  At as SPRING_PRESETS,
  at as SPRING_STEP_MS,
  jt as ScrollDriver,
  xn as ScrollPin,
  St as SpringSampler,
  ni as SpringTrackPlayer,
  Ki as Stage,
  Ue as Timeline,
  hs as TinyflyPlayer,
  Rn as TinyflySequencer,
  Ct as TrackPlayer,
  tr as ValueResolver,
  kn as VisibilityDriver,
  si as bakeEasing,
  Ye as bakeInertiaTrack,
  Ne as bakeSpringTrack,
  ai as charactersFor,
  rs as clamp01,
  jn as clearMorphCache,
  qn as clearPathCache,
  br as context,
  or as create,
  Es as createCubicBezier,
  Pn as createLive,
  di as createRandom,
  Ot as createTrack,
  Nn as criticalDamping,
  lt as deserializeTimeline,
  ui as deserializeTrack,
  er as draggable,
  _s as easeIn,
  Ie as easeInCubic,
  Cs as easeInOut,
  Re as easeInOutCubic,
  Ms as easeInOutQuad,
  xs as easeInQuad,
  Ps as easeOut,
  De as easeOutCubic,
  As as easeOutQuad,
  fr as from,
  Zn as fromJSON,
  dr as fromTo,
  Fe as getEasingFunction,
  Oe as getInterpolator,
  Ve as getMotionPathPoint,
  Vn as getPathLength,
  Ns as getPointAtProgress,
  cn as gridLinesFor,
  gs as hasKeyframes,
  Kn as hashSeed,
  ut as inertiaDuration,
  ht as inertiaRest,
  Lt as inertiaValueAt,
  Yn as inertiaVelocityAt,
  ti as interpolateArray,
  Js as interpolateColor,
  zn as interpolateMotionPath,
  q as interpolateNumber,
  ei as interpolatePathString,
  re as interpolateString,
  ms as isCubicBezierEasing,
  W as isInertiaTrack,
  Fn as isMotionPathPoint,
  _e as isMotionPathTrack,
  ft as isPathData,
  G as isSpringTrack,
  Nt as isTextTrack,
  Xn as isUnderdamped,
  Jn as isUnresolved,
  Ee as linear,
  X as live,
  ce as mapEase,
  Tr as matchMedia,
  ys as maxStaggerDistance,
  Zs as morphPath,
  bt as naturalRest,
  we as parseEdge,
  ct as parsePath,
  wn as parseTrigger,
  rr as play,
  ar as playSequence,
  ir as playWhenVisible,
  Le as pointAtDistance,
  gi as pointsToPath,
  lr as quickPlay,
  vr as quickTo,
  We as randomBetween,
  Qn as randomChoice,
  pi as randomSnapped,
  mi as resolveSequence,
  He as resolveValue,
  sr as scrollProgress,
  nr as scrubOnScroll,
  fi as serializeTimeline,
  hi as serializeTrack,
  pr as set,
  Yt as shapeToPathData,
  ii as simplifyKeyframes,
  Sn as smoothToward,
  an as snapAxis,
  yr as splitText,
  Ts as springDuration,
  On as springValueAt,
  Pe as staggerDistance,
  Ce as staggerOffset,
  bs as staggerOffsets,
  wt as staggerSpan,
  Dn as syncMediaElement,
  li as textAt,
  hr as tf,
  gr as ticker,
  mr as timeline,
  ur as to,
  Hn as toJSON,
  Wn as toKeyframedTrack,
  Gn as toKeyframedTracks,
  U as trackTargets,
  vt as triggerDistance
};
