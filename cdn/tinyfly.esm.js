function Sd(t) {
  return typeof t == "object" && t !== null && t.type === "cubic-bezier";
}
function so(t) {
  return typeof t == "object" && t !== null && t.type !== "cubic-bezier";
}
const Ra = 2;
function xh(t) {
  return t.some((e) => e.interpolation !== void 0) ? 2 : 1;
}
function Fr(t) {
  return t.property === "text" && "textConfig" in t;
}
function Ze(t) {
  return t.kind === "inertia" && "inertia" in t;
}
function Qe(t) {
  return t.kind === "spring" && "spring" in t;
}
function Sh(t) {
  return t.property === "motionPath" && "motionPathConfig" in t;
}
function Dv(t) {
  return typeof t == "object" && t !== null && "x" in t && "y" in t && "angle" in t;
}
function Td(t) {
  return "keyframes" in t;
}
class Bv {
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
class zv {
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
function Ed(t, e) {
  if (!(e > 0)) return t;
  const n = 1e3 / e;
  return Math.floor(t / n + 1e-9) * n;
}
function Th(t, e, n = "start") {
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
function Eh(t, e = "start") {
  if (t <= 1) return 0;
  let n = 0;
  for (let s = 0; s < t; s++)
    n = Math.max(n, Th(s, t, e));
  return n;
}
function Wr(t, e, n) {
  if (n.offsets) return n.offsets[t] ?? 0;
  const s = n.from ?? "start", o = Th(t, e, s);
  if (n.amount !== void 0) {
    const i = Eh(e, s);
    return i === 0 ? 0 : n.amount * o / i;
  }
  return n.each !== void 0 ? n.each * o : 0;
}
function Gi(t, e) {
  return Array.from({ length: t }, (n, s) => Wr(s, t, e));
}
function Oo(t, e) {
  return t <= 1 ? 0 : Math.max(...Gi(t, e));
}
const Jn = 1, Ah = 6e4, $s = Ah / Jn, ne = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, ai = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class _o {
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
    this.from = e.from, this.to = e.to, this.stiffness = e.stiffness ?? ne.stiffness, this.damping = e.damping ?? ne.damping, this.mass = e.mass ?? ne.mass, this.restDelta = e.restDelta ?? ne.restDelta, this.restSpeed = e.restSpeed ?? ne.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = e.velocity ?? ne.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = Math.floor(e / Jn);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const s = this.samples[Math.min(n, this.samples.length - 1)], o = this.samples[Math.min(n + 1, this.samples.length - 1)], i = e / Jn - n;
    return s + (o - s) * i;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo($s + 1), this.settledStep !== null ? this.settledStep * Jn : Ah;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(e) {
    if (this.settledStep !== null) return;
    const n = Math.min(e, $s + 1), s = Jn / 1e3;
    for (; this.samples.length < n; ) {
      const o = this.samples[this.samples.length - 1], i = o - this.to, r = -this.stiffness * i, a = -this.damping * this.velocity, l = (r + a) / this.mass;
      this.velocity += l * s;
      const c = o + this.velocity * s;
      if (this.samples.push(c), this.isAtRest(c)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > $s && (this.settledStep = $s);
  }
}
function qv(t, e) {
  return new _o(t).valueAt(e);
}
function Ad(t) {
  return new _o(t).settleTime();
}
function Yv(t) {
  const e = t.stiffness ?? ne.stiffness, n = t.damping ?? ne.damping, s = t.mass ?? ne.mass;
  return n < 2 * Math.sqrt(e * s);
}
function jv(t) {
  const e = t.stiffness ?? ne.stiffness, n = t.mass ?? ne.mass;
  return 2 * Math.sqrt(e * n);
}
const La = 4, $d = 2e-3, Pd = 1e-4, Id = 6e4;
function Ho(t) {
  const e = t.friction ?? La;
  return e > 0 ? e : La;
}
function oo(t) {
  return t.from + t.velocity / Ho(t);
}
function Od(t, e) {
  if (e === void 0) return t;
  if (typeof e == "number")
    return e > 0 ? Math.round(t / e) * e : t;
  if (e.length === 0) return t;
  let n = e[0];
  for (const s of e)
    Math.abs(s - t) < Math.abs(n - t) && (n = s);
  return n;
}
function vs(t) {
  let e = Od(oo(t), t.end);
  return t.min !== void 0 && (e = Math.max(t.min, e)), t.max !== void 0 && (e = Math.min(t.max, e)), e;
}
function Ms(t) {
  const e = Math.abs(vs(t) - t.from);
  if (e === 0) return 0;
  const n = t.restDelta ?? Math.max(Pd, e * $d);
  if (n >= e) return 0;
  const s = Math.log(e / n) / Ho(t);
  return Math.min(Id, s * 1e3);
}
function Vi(t, e) {
  if (e <= 0) return t.from;
  const n = vs(t);
  if (e >= Ms(t)) return n;
  const s = Ho(t);
  return t.from + (n - t.from) * (1 - Math.exp(-s * e / 1e3));
}
function Kv(t, e) {
  const n = Ho(t), s = vs(t);
  return e >= Ms(t) ? 0 : (s - t.from) * n * Math.exp(-n * Math.max(0, e) / 1e3);
}
const Ji = (t) => t, _d = (t) => t * t, Hd = (t) => 1 - (1 - t) * (1 - t), Cd = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, $h = (t) => t * t * t, Ph = (t) => 1 - Math.pow(1 - t, 3), Co = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, Rd = $h, Ld = Ph, Fd = Co, Wd = {
  linear: Ji,
  "ease-in": Rd,
  "ease-out": Ld,
  "ease-in-out": Fd,
  "ease-in-quad": _d,
  "ease-out-quad": Hd,
  "ease-in-out-quad": Cd,
  "ease-in-cubic": $h,
  "ease-out-cubic": Ph,
  "ease-in-out-cubic": Co
};
function Nd(t) {
  const [e, n, s, o] = t, i = 3 * e, r = 3 * (s - e) - i, a = 1 - i - r, l = 3 * n, c = 3 * (o - n) - l, h = 1 - l - c, u = (p) => ((a * p + r) * p + i) * p, d = (p) => ((h * p + c) * p + l) * p, f = (p) => (3 * a * p + 2 * r) * p + i, g = (p) => {
    let m = p;
    for (let w = 0; w < 8; w++) {
      const y = u(m) - p;
      if (Math.abs(y) < 1e-7)
        return m;
      const T = f(m);
      if (Math.abs(T) < 1e-7)
        break;
      m -= y / T;
    }
    let b = 0, v = 1;
    for (m = p; b < v; ) {
      const w = u(m);
      if (Math.abs(w - p) < 1e-7)
        return m;
      p > w ? b = m : v = m, m = (b + v) / 2;
    }
    return m;
  };
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    const m = g(p);
    return d(m);
  };
}
function li(t, e = "out") {
  if (e === "out") return t;
  const n = (s) => 1 - t(1 - s);
  return e === "in" ? n : (s) => s < 0.5 ? n(s * 2) / 2 : t(s * 2 - 1) / 2 + 0.5;
}
function Dd(t = 1, e = 0.3) {
  const n = Math.max(1, t), s = e / (2 * Math.PI) * Math.asin(1 / n);
  return (o) => o <= 0 ? 0 : o >= 1 ? 1 : n * Math.pow(2, -10 * o) * Math.sin((o - s) * (2 * Math.PI) / e) + 1;
}
const Bd = (t) => {
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
function zd(t = 1.70158) {
  return (e) => {
    if (e <= 0) return 0;
    if (e >= 1) return 1;
    const n = e - 1;
    return n * n * ((t + 1) * n + t) + 1;
  };
}
function qd(t, e = "end") {
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
function Yd(t) {
  switch (t.type) {
    case "steps":
      return qd(t.count, t.position);
    case "elastic":
      return li(Dd(t.amplitude, t.period), t.mode);
    case "bounce":
      return li(Bd, t.mode);
    case "back":
      return li(zd(t.overshoot), t.mode);
  }
}
function Ft(t) {
  return t === void 0 ? Ji : Sd(t) ? Nd(t.points) : so(t) ? Yd(t) : Wd[t] ?? Ji;
}
const Fa = 32, jd = 256, mn = /* @__PURE__ */ new Map(), Kd = /[MmLlHhVvCcSsQqTtAaZz]/, Xd = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, Ud = {
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
function Gd(t) {
  const e = [];
  let n = 0, s = null;
  const o = () => {
    for (; n < t.length && /[\s,]/.test(t[n]); ) n++;
  };
  for (; n < t.length && (o(), !(n >= t.length)); ) {
    const i = t[n];
    if (Kd.test(i)) {
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
    const l = Xd.exec(t.slice(n));
    if (!l) break;
    s.args.push(parseFloat(l[0])), n += l[0].length;
  }
  return e;
}
function Vd(t, e, n, s, o, i, r, a, l) {
  if (t === a && e === l) return [];
  let c = Math.abs(n), h = Math.abs(s);
  if (c === 0 || h === 0) return [[t, e, a, l, a, l]];
  const u = o * Math.PI / 180, d = Math.cos(u), f = Math.sin(u), g = (t - a) / 2, p = (e - l) / 2, m = d * g + f * p, b = -f * g + d * p, v = m * m / (c * c) + b * b / (h * h);
  if (v > 1) {
    const R = Math.sqrt(v);
    c *= R, h *= R;
  }
  const w = i === r ? -1 : 1, y = c * c * h * h - c * c * b * b - h * h * m * m, T = c * c * b * b + h * h * m * m, $ = w * Math.sqrt(Math.max(0, y / T)), M = $ * c * b / h, S = -$ * h * m / c, k = d * M - f * S + (t + a) / 2, x = f * M + d * S + (e + l) / 2, P = (R, D, I, A) => {
    const H = R * I + D * A, N = Math.sqrt((R * R + D * D) * (I * I + A * A)), z = Math.acos(Math.max(-1, Math.min(1, H / N)));
    return R * A - D * I < 0 ? -z : z;
  }, E = P(1, 0, (m - M) / c, (b - S) / h);
  let O = P((m - M) / c, (b - S) / h, (-m - M) / c, (-b - S) / h);
  !r && O > 0 && (O -= 2 * Math.PI), r && O < 0 && (O += 2 * Math.PI);
  const _ = Math.max(1, Math.ceil(Math.abs(O) / (Math.PI / 2))), L = O / _, B = 4 / 3 * Math.tan(L / 4), X = (R) => {
    const D = c * Math.cos(R), I = h * Math.sin(R);
    return [d * D - f * I + k, f * D + d * I + x];
  }, J = (R) => {
    const D = -c * Math.sin(R), I = h * Math.cos(R);
    return [d * D - f * I, f * D + d * I];
  }, q = [];
  for (let R = 0; R < _; R++) {
    const D = E + R * L, I = D + L, [A, H] = X(D), [N, z] = R === _ - 1 ? [a, l] : X(I), [W, j] = J(D), [G, F] = J(I);
    q.push([A + B * W, H + B * j, N - B * G, z - B * F, N, z]);
  }
  return q;
}
function Se(t, e, n, s, o) {
  const i = 1 - o;
  return i * i * i * t + 3 * i * i * o * e + 3 * i * o * o * n + o * o * o * s;
}
function Wa(t, e, n, s, o) {
  const i = 1 - o;
  return 3 * i * i * (e - t) + 6 * i * o * (n - e) + 3 * o * o * (s - n);
}
function Bn(t, e, n, s) {
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
function Ps(t, e, n) {
  const [s, o, i, r, a, l] = n, c = [0];
  let h = t, u = e, d = 0;
  for (let f = 1; f <= Fa; f++) {
    const g = f / Fa, p = Se(t, s, i, a, g), m = Se(e, o, r, l, g);
    d += Math.hypot(p - h, m - u), c.push(d), h = p, u = m;
  }
  return {
    subpath: 0,
    type: "C",
    points: [s, o, i, r, a, l],
    startX: t,
    startY: e,
    endX: a,
    endY: l,
    length: d,
    lengths: c
  };
}
function In(t) {
  const e = mn.get(t);
  if (e) return e;
  const n = [];
  let s = 0, o = 0, i = 0, r = 0, a = null, l = null, c = -1;
  const h = /* @__PURE__ */ new Set(), u = (p) => {
    c < 0 && (c = 0), p.subpath = c, n.push(p);
  };
  for (const { type: p, args: m } of Gd(t)) {
    const b = p.toUpperCase(), v = p !== b, w = Ud[b];
    if (b === "Z") {
      (s !== i || o !== r) && u(Bn(s, o, i, r)), c >= 0 && h.add(c), s = i, o = r, a = l = null;
      continue;
    }
    for (let y = 0; y + w <= m.length; y += w) {
      const T = m.slice(y, y + w), $ = v ? s : 0, M = v ? o : 0;
      let S = null, k = null;
      switch (b) {
        case "M":
          y === 0 ? (s = T[0] + $, o = T[1] + M, i = s, r = o, (c < 0 || n[n.length - 1]?.subpath === c) && c++) : (u(Bn(s, o, T[0] + $, T[1] + M)), s = T[0] + $, o = T[1] + M);
          break;
        case "L":
          u(Bn(s, o, T[0] + $, T[1] + M)), s = T[0] + $, o = T[1] + M;
          break;
        case "H":
          u(Bn(s, o, T[0] + $, o)), s = T[0] + $;
          break;
        case "V":
          u(Bn(s, o, s, T[0] + M)), o = T[0] + M;
          break;
        case "C": {
          const x = [T[0] + $, T[1] + M, T[2] + $, T[3] + M, T[4] + $, T[5] + M];
          u(Ps(s, o, x)), S = [x[2], x[3]], s = x[4], o = x[5];
          break;
        }
        case "S": {
          const [x, P] = a ? [2 * s - a[0], 2 * o - a[1]] : [s, o], E = [x, P, T[0] + $, T[1] + M, T[2] + $, T[3] + M];
          u(Ps(s, o, E)), S = [E[2], E[3]], s = E[4], o = E[5];
          break;
        }
        case "Q":
        case "T": {
          let x = s, P = o;
          b === "Q" ? (x = T[0] + $, P = T[1] + M) : l && (x = 2 * s - l[0], P = 2 * o - l[1]);
          const E = b === "Q" ? T[2] + $ : T[0] + $, O = b === "Q" ? T[3] + M : T[1] + M;
          u(
            Ps(s, o, [
              s + 2 / 3 * (x - s),
              o + 2 / 3 * (P - o),
              E + 2 / 3 * (x - E),
              O + 2 / 3 * (P - O),
              E,
              O
            ])
          ), k = [x, P], s = E, o = O;
          break;
        }
        case "A": {
          const x = T[5] + $, P = T[6] + M;
          let E = s, O = o;
          for (const _ of Vd(s, o, T[0], T[1], T[2], T[3], T[4], x, P))
            u(Ps(E, O, _)), E = _[4], O = _[5];
          s = x, o = P;
          break;
        }
      }
      a = S, l = k;
    }
  }
  const d = n.reduce((p, m) => p + m.length, 0), f = [];
  for (let p = 0; p < n.length; ) {
    const m = n[p].subpath;
    let b = p, v = 0;
    for (; b < n.length && n[b].subpath === m; ) v += n[b++].length;
    const w = n[p], y = n[b - 1], T = h.has(m) || Math.abs(y.endX - w.startX) < 1e-9 && Math.abs(y.endY - w.startY) < 1e-9;
    f.push({ start: p, end: b, length: v, closed: T }), p = b;
  }
  const g = { segments: n, totalLength: d, subpaths: f };
  return mn.size >= jd && mn.delete(mn.keys().next().value), mn.set(t, g), g;
}
function Jd(t, e) {
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
function Zd(t, e) {
  if (t.type === "L") {
    const u = t.length > 0 ? Math.max(0, Math.min(1, e / t.length)) : 0;
    return {
      x: t.startX + (t.endX - t.startX) * u,
      y: t.startY + (t.endY - t.startY) * u,
      angle: Math.atan2(t.endY - t.startY, t.endX - t.startX) * 180 / Math.PI
    };
  }
  const [n, s, o, i, r, a] = t.points, l = Jd(t, e);
  let c = Wa(t.startX, n, o, r, l), h = Wa(t.startY, s, i, a, l);
  if (Math.hypot(c, h) < 1e-9) {
    const u = l < 0.5 ? Math.min(1, l + 1e-3) : Math.max(0, l - 1e-3), d = Se(t.startX, n, o, r, u), f = Se(t.startY, s, i, a, u), g = Se(t.startX, n, o, r, l), p = Se(t.startY, s, i, a, l);
    c = l < 0.5 ? d - g : g - d, h = l < 0.5 ? f - p : p - f;
  }
  return {
    x: Se(t.startX, n, o, r, l),
    y: Se(t.startY, s, i, a, l),
    angle: Math.atan2(h, c) * 180 / Math.PI
  };
}
function Ih(t, e, n = 0, s = t.length) {
  if (s <= n) return { x: 0, y: 0, angle: 0 };
  let o = 0;
  for (let i = n; i < s; i++) {
    const r = t[i];
    if (o + r.length >= e || i === s - 1)
      return Zd(r, e - o);
    o += r.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function Qd(t, e) {
  const { segments: n, totalLength: s } = In(t);
  return Ih(n, Math.max(0, Math.min(1, e)) * s);
}
function Xv() {
  mn.clear();
}
function Uv(t) {
  return In(t).totalLength;
}
const tf = 24, ef = 320, nf = 2.5, zn = 72, Gv = 64, sf = 0.2, of = 128, Zn = /* @__PURE__ */ new Map();
let Ks = 0, Me;
const Na = (t) => Math.round(t * 100) / 100;
function Da(t, e) {
  const { segments: n, subpaths: s, totalLength: o } = In(t);
  if (n.length === 0) return [];
  if (e) {
    const i = s.every((r) => r.closed);
    return [{ segments: n, start: 0, end: n.length, length: o, closed: i }];
  }
  return s.filter((i) => i.length > 0).map((i) => ({ segments: n, start: i.start, end: i.end, length: i.length, closed: i.closed }));
}
function Zi(t, e) {
  const n = t.closed ? (e % 1 + 1) % 1 : Math.max(0, Math.min(1, e)), s = Ih(t.segments, n * t.length, t.start, t.end);
  return [s.x, s.y];
}
function Ba(t) {
  const e = [];
  let n = 0;
  for (let s = t.start; s < t.end; s++)
    n += t.segments[s].length, t.length > 0 && e.push(n / t.length);
  return e;
}
function za(t, e) {
  const n = [];
  for (let s = 0; s < e; s++)
    n.push(Zi(t, t.closed ? s / e : s / (e - 1)));
  return n;
}
function qa(t) {
  let e = 0, n = 0;
  for (const [s, o] of t)
    e += s, n += o;
  return e /= t.length, n /= t.length, t.map(([s, o]) => [s - e, o - n]);
}
function rf(t, e, n) {
  const s = t.closed && e.closed;
  if (n !== void 0)
    return { offset: s ? Math.abs(n) % zn / zn : 0, reversed: n < 0 };
  const o = qa(za(t, zn)), i = qa(za(e, zn)), r = zn;
  let a = { offset: 0, reversed: !1 }, l = 1 / 0;
  for (const c of [!1, !0]) {
    const h = s ? r : 1;
    for (let u = 0; u < h; u++) {
      let d = 0;
      for (let f = 0; f < r && d < l; f++) {
        const g = s ? c ? (u - f + r) % r : (f + u) % r : c ? r - 1 - f : f, p = o[f][0] - i[g][0], m = o[f][1] - i[g][1];
        d += p * p + m * m;
      }
      d < l && (l = d, a = { offset: s ? u / r : 0, reversed: c });
    }
  }
  return a;
}
function af(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t + e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function lf(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t - e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function cf(t, e, n) {
  const s = t.closed && e.closed, o = rf(t, e, n.shapeIndex), i = Math.max(
    tf,
    Math.min(ef, Math.ceil(Math.max(t.length, e.length) / nf))
  ), r = /* @__PURE__ */ new Set(), a = (u) => r.add(Math.round(u * 1e7) / 1e7);
  for (let u = 0; u <= i; u++) a(u / i);
  for (const u of Ba(t)) a(u);
  for (const u of Ba(e)) a(lf(u, o, s));
  let l = [...r].sort((u, d) => u - d);
  s && (l = l.filter((u) => u < 1));
  const c = [], h = [];
  for (const u of l)
    c.push(...Zi(t, u)), h.push(...Zi(e, af(u, o, s)));
  return hf({ from: c, to: h, closed: s });
}
function hf(t) {
  const e = t.from.length / 2;
  if (e <= 3) return t;
  const n = new Uint8Array(e);
  n[0] = 1, n[e - 1] = 1;
  const s = [[0, e - 1]];
  for (; s.length > 0; ) {
    const [r, a] = s.pop();
    let l = -1, c = sf;
    for (let h = r + 1; h < a; h++) {
      const u = Math.max(Ya(t.from, r, a, h), Ya(t.to, r, a, h));
      u > c && (c = u, l = h);
    }
    l !== -1 && (n[l] = 1, s.push([r, l], [l, a]));
  }
  const o = [], i = [];
  for (let r = 0; r < e; r++)
    n[r] && (o.push(t.from[r * 2], t.from[r * 2 + 1]), i.push(t.to[r * 2], t.to[r * 2 + 1]));
  return { from: o, to: i, closed: t.closed };
}
function Ya(t, e, n, s) {
  const o = t[e * 2], i = t[e * 2 + 1], r = t[n * 2] - o, a = t[n * 2 + 1] - i, l = t[s * 2] - o, c = t[s * 2 + 1] - i, h = r * r + a * a, u = h === 0 ? 0 : Math.max(0, Math.min(1, (l * r + c * a) / h));
  return Math.hypot(l - u * r, c - u * a);
}
function uf(t, e, n) {
  const s = n.shapeIndex;
  if (Me && Me.from === t && Me.to === e && Me.shapeIndex === s) return Me.plan;
  const i = Zn.get(String(s ?? "auto"))?.get(t)?.get(e);
  if (i)
    return Me = { from: t, to: e, shapeIndex: s, plan: i }, i;
  const r = In(t).subpaths.filter((f) => f.length > 0).length === In(e).subpaths.filter((f) => f.length > 0).length, a = Da(t, !r), l = Da(e, !r), c = {
    pairs: a.map((f, g) => cf(f, l[g], n))
  };
  Ks >= of && (Zn.clear(), Ks = 0);
  const h = String(s ?? "auto"), u = Zn.get(h) ?? /* @__PURE__ */ new Map();
  Zn.set(h, u);
  const d = u.get(t) ?? /* @__PURE__ */ new Map();
  return u.set(t, d), d.set(e, c), Ks++, Me = { from: t, to: e, shapeIndex: s, plan: c }, c;
}
function df(t, e, n, s = {}) {
  if (!t) return e;
  if (!e) return t;
  const o = Math.max(0, Math.min(1, n));
  if (o === 0) return t;
  if (o === 1) return e;
  const i = uf(t, e, s);
  if (i.pairs.length === 0) return o < 0.5 ? t : e;
  let r = "";
  for (const a of i.pairs) {
    for (let l = 0; l < a.from.length; l += 2) {
      const c = Na(a.from[l] + (a.to[l] - a.from[l]) * o), h = Na(a.from[l + 1] + (a.to[l + 1] - a.from[l + 1]) * o);
      r += `${l === 0 ? r ? " M" : "M" : " L"}${c} ${h}`;
    }
    a.closed && (r += " Z");
  }
  return r;
}
function Vv() {
  Zn.clear(), Ks = 0, Me = void 0;
}
function xs(t) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(t);
}
const yn = Math.PI / 180, ff = 0.9995;
function Nr() {
  return [0, 0, 0, 1];
}
function Vt(t, e) {
  const n = Math.hypot(t[0], t[1], t[2]);
  if (n === 0) return Nr();
  const s = e * yn / 2, o = Math.sin(s) / n;
  return [t[0] * o, t[1] * o, t[2] * o, Math.cos(s)];
}
function pf(t, e, n) {
  return Qi(Qi(Vt([0, 1, 0], e), Vt([1, 0, 0], t)), Vt([0, 0, 1], n));
}
function gf(t) {
  const [e, n, s, o] = Pe(t), i = 2 * (e * s + n * o), r = 2 * (e * n + s * o), a = 1 - 2 * (e * e + s * s), l = 2 * (n * s - e * o), c = 1 - 2 * (n * n + s * s), h = 2 * (e * s - n * o), u = 1 - 2 * (e * e + n * n), d = Math.asin(Math.max(-1, Math.min(1, -l)));
  return Math.abs(l) < 0.9999999 ? [d / yn, Math.atan2(i, u) / yn, Math.atan2(r, a) / yn] : [d / yn, Math.atan2(-h, c) / yn, 0];
}
function Qi(t, e) {
  const [n, s, o, i] = t, [r, a, l, c] = e;
  return [
    i * r + n * c + s * l - o * a,
    i * a - n * l + s * c + o * r,
    i * l + n * a - s * r + o * c,
    i * c - n * r - s * a - o * l
  ];
}
function Oh(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function _h(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function Pe(t) {
  const e = _h(t);
  return e === 0 ? Nr() : [t[0] / e, t[1] / e, t[2] / e, t[3] / e];
}
function mf(t) {
  return [-t[0], -t[1], -t[2], t[3]];
}
function Hh(t, e, n) {
  const s = Pe(t);
  let o = Pe(e), i = Oh(s, o);
  if (i < 0 && (o = [-o[0], -o[1], -o[2], -o[3]], i = -i), i > ff)
    return Pe([
      s[0] + (o[0] - s[0]) * n,
      s[1] + (o[1] - s[1]) * n,
      s[2] + (o[2] - s[2]) * n,
      s[3] + (o[3] - s[3]) * n
    ]);
  const r = Math.acos(i), a = Math.sin(r), l = Math.sin((1 - n) * r) / a, c = Math.sin(n * r) / a;
  return Pe([
    s[0] * l + o[0] * c,
    s[1] * l + o[1] * c,
    s[2] * l + o[2] * c,
    s[3] * l + o[3] * c
  ]);
}
function yf(t, e) {
  const [n, s, o, i] = Pe(t), r = 2 * (s * e[2] - o * e[1]), a = 2 * (o * e[0] - n * e[2]), l = 2 * (n * e[1] - s * e[0]);
  return [e[0] + i * r + (s * l - o * a), e[1] + i * a + (o * r - n * l), e[2] + i * l + (n * a - s * r)];
}
const Jv = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  conjugate: mf,
  dot: Oh,
  fromAxisAngle: Vt,
  fromEuler: pf,
  identity: Nr,
  length: _h,
  multiply: Qi,
  normalize: Pe,
  rotateVec3: yf,
  slerp: Hh,
  toEuler: gf
}, Symbol.toStringTag, { value: "Module" })), be = (t, e, n) => t + (e - t) * n, Ch = 512, ci = /* @__PURE__ */ new Map(), hi = /* @__PURE__ */ new Map();
function ja(t) {
  const e = ci.get(t);
  if (e) return e;
  const n = t.replace("#", ""), s = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return ci.size < Ch && ci.set(t, s), s;
}
const Ka = (t) => t.charCodeAt(0) === 35, Xa = (t) => t.startsWith("rgb"), Ua = (t) => t.startsWith("rgba"), bf = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, ui = (t) => Math.round(t).toString(16).padStart(2, "0");
function wf(t, e, n) {
  return `#${ui(t)}${ui(e)}${ui(n)}`;
}
function Ga(t) {
  const e = hi.get(t);
  if (e) return e;
  const n = t.match(bf);
  if (!n)
    throw new Error(`Invalid rgb color: ${t}`);
  const s = parseInt(n[1], 10), o = parseInt(n[2], 10), i = parseInt(n[3], 10), r = n[4] !== void 0 ? [s, o, i, parseFloat(n[4])] : [s, o, i];
  return hi.size < Ch && hi.set(t, r), r;
}
const kf = (t, e, n) => {
  if (Ka(t) && Ka(e)) {
    const [s, o, i] = ja(t), [r, a, l] = ja(e), c = be(s, r, n), h = be(o, a, n), u = be(i, l, n);
    return wf(c, h, u);
  }
  if ((Xa(t) || Ua(t)) && (Xa(e) || Ua(e))) {
    const s = Ga(t), o = Ga(e), i = Math.round(be(s[0], o[0], n)), r = Math.round(be(s[1], o[1], n)), a = Math.round(be(s[2], o[2], n));
    if (s.length === 4 || o.length === 4) {
      const l = s[3] ?? 1, c = o[3] ?? 1, h = be(l, c, n);
      return `rgba(${i}, ${r}, ${a}, ${h})`;
    }
    return `rgb(${i}, ${r}, ${a})`;
  }
  return n < 1 ? t : e;
}, vf = (t, e, n) => {
  const s = Math.min(t.length, e.length), o = [];
  for (let i = 0; i < s; i++)
    o.push(be(t[i], e[i], n));
  return o;
}, Mf = (t, e, n) => Hh(t, e, n), Va = (t, e, n) => n < 1 ? t : e, xf = (t, e, n) => df(t, e, n);
function io(t, e) {
  return e === "slerp" ? Mf : typeof t == "number" ? be : Array.isArray(t) ? vf : typeof t == "string" ? t.startsWith("#") || t.startsWith("rgb") ? kf : xs(t) ? xf : Va : Va;
}
const Rh = 1e3 / 60;
function Lh(t, e = {}) {
  if (!Qe(t))
    throw new Error(`bakeSpringTrack: track "${t.id}" is not a spring track`);
  const n = new _o(t.spring);
  return Wh(t, (s) => n.valueAt(s), n.settleTime(), t.spring.from, t.spring.to, e);
}
function Fh(t, e = {}) {
  if (!Ze(t))
    throw new Error(`bakeInertiaTrack: track "${t.id}" is not an inertia track`);
  const n = t.inertia;
  return Wh(
    t,
    (s) => Vi(n, s),
    Ms(n),
    n.from,
    vs(n),
    e
  );
}
function Wh(t, e, n, s, o, i) {
  const r = i.intervalMs ?? Rh, a = i.tolerance ?? 0.01, l = t.delay ?? 0, c = [];
  for (let u = 0; u <= n; u += r)
    c.push({ time: u + l, value: e(u), easing: "linear" });
  const h = c[c.length - 1];
  return !h || h.time < n + l ? c.push({ time: n + l, value: o, easing: "linear" }) : h.value = o, l > 0 && c.unshift({ time: 0, value: s, easing: "linear" }), {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: a > 0 ? Tf(c, a) : c,
    ...t.targets && { targets: [...t.targets] },
    ...t.stagger && { stagger: { ...t.stagger } }
  };
}
function Nh(t, e, n, s = {}) {
  const o = s.intervalMs ?? Rh, i = typeof n == "function" ? n : Ft(n), r = io(t.value, s.interpolation), a = e.time - t.time;
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
function Zv(t, e) {
  return Qe(t) ? Lh(t, e) : Ze(t) ? Fh(t, e) : t;
}
function Sf(t, e = {}) {
  const n = t.keyframes;
  if (!n.some((i) => so(i.easing))) return t;
  const s = n.length > 0 ? [n[0]] : [], o = { ...e, interpolation: t.interpolation ?? e.interpolation };
  for (let i = 1; i < n.length; i++) {
    const r = n[i];
    so(r.easing) ? s.push(...Nh(n[i - 1], r, r.easing, o)) : s.push(r);
  }
  return { ...t, keyframes: s };
}
function Qv(t, e) {
  return t.filter(Td).map((n) => Sf(n, e)).concat(
    t.filter(Qe).map((n) => Lh(n, e)),
    t.filter(Ze).map((n) => Fh(n, e))
  );
}
function Tf(t, e) {
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
function tr(t) {
  const e = [...t.keyframes].sort((n, s) => n.time - s.time);
  return {
    ...t,
    keyframes: e
  };
}
function We(t) {
  return t.targets && t.targets.length > 0 ? t.targets : [t.target];
}
function On(t, e, n, s) {
  const o = n ?? 0;
  return !s || e <= 1 ? o : o + Wr(t, e, s);
}
class Xs {
  track;
  targets;
  constructor(e) {
    this.track = e, this.targets = We(e);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(e) {
    return this.valueForOffset(e - On(0, this.targets.length, this.track.delay, this.track.stagger));
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
      const i = On(o, n, this.track.delay, this.track.stagger), r = this.valueForOffset(e - i);
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
    const n = e[e.length - 1].time, s = this.track.stagger ? Oo(this.targets.length, this.track.stagger) : 0;
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
    return io(s.value, this.track.interpolation)(s.value, o.value, l);
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
class Ef {
  track;
  targets;
  sampler;
  constructor(e) {
    this.track = e, this.targets = We(e), this.sampler = new _o(e.spring);
  }
  getValueAtTime(e) {
    return this.sampler.valueAt(e - On(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let o = 0; o < n; o++) {
      const i = On(o, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[o], value: this.sampler.valueAt(e - i), start: i });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? Oo(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
class Af {
  track;
  targets;
  duration;
  constructor(e) {
    this.track = e, this.targets = We(e), this.duration = Ms(e.inertia);
  }
  getValueAtTime(e) {
    return Vi(this.track.inertia, e - On(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let o = 0; o < n; o++) {
      const i = On(o, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[o], value: Vi(this.track.inertia, e - i), start: i });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? Oo(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
function Dh(t, e) {
  const n = { ...Qd(t.pathData, e) };
  if (t.matrix) {
    const [s, o, i, r, a, l] = t.matrix, { x: c, y: h } = n;
    n.x = s * c + i * h + a, n.y = o * c + r * h + l;
    const u = n.angle * Math.PI / 180, d = Math.cos(u), f = Math.sin(u);
    n.angle = Math.atan2(o * d + r * f, s * d + i * f) * 180 / Math.PI;
  }
  return t.autoRotate && t.rotateOffset && (n.angle += t.rotateOffset), n;
}
function tM(t, e, n, s) {
  const o = e + (n - e) * s;
  return Dh(t, o);
}
const di = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, $f = 20;
function Pf(t) {
  const e = di[t ?? "upperCase"] ?? t ?? di.upperCase, n = Array.from(e);
  return n.length > 0 ? n : Array.from(di.upperCase);
}
function If(t, e, n) {
  let s = (t | 0) ^ Math.imul(e + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return s = Math.imul(s ^ s >>> 16, 2146121005), s = Math.imul(s ^ s >>> 15, 2221713035), (s ^ s >>> 16) >>> 0;
}
function Of(t, e, n = 0) {
  const s = t.from ?? "", o = t.to, i = Math.max(0, Math.min(1, e));
  if (i <= 0) return s;
  if (i >= 1) return o;
  const r = Array.from(s), a = Array.from(o), l = t.rightToLeft ?? !1;
  if (t.mode === "type") {
    const v = Math.round(i * Math.max(r.length, a.length));
    return l ? r.slice(0, Math.max(0, r.length - v)).join("") + a.slice(Math.max(0, a.length - v)).join("") : a.slice(0, v).join("") + r.slice(v).join("");
  }
  const c = Math.max(0, Math.min(0.999, t.revealDelay ?? 0)), h = Math.max(0, (i - c) / (1 - c)), u = Math.floor(h * a.length), d = t.tweenLength === !1 ? a.length : Math.round(r.length + (a.length - r.length) * i), f = Pf(t.chars), g = t.refreshRate ?? $f, p = g > 0 ? Math.floor(n * g / 1e3) : 0, m = t.seed ?? 1;
  let b = "";
  for (let v = 0; v < d; v++) {
    const w = l ? v >= d - u : v < u, y = l ? a[a.length - (d - v)] : a[v];
    w && y !== void 0 || y === " " || y === `
` ? b += y : b += f[If(m, v, p) % f.length];
  }
  return b;
}
class It {
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
    if (e = Ed(e, this._config.drawingRate ?? 0), this._hasSharedWrites())
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
        const h = `${a}\0${r}`, u = c <= e, d = s.get(h);
        (!d || (u !== d.started ? u : u ? c >= d.start : c <= d.start)) && s.set(h, { trackId: o, target: a, property: r, value: l, start: c, started: u });
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
      a.set("text", Of(l.textConfig, i, Math.max(0, r)));
      return;
    }
    const c = this._motionPathTracks.get(n);
    if (c && typeof i == "number") {
      const h = Dh(c.motionPathConfig, i);
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
        for (const s of We(n)) {
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
    if (this._tracks.push(e), this._sharedWrites = null, Ze(e)) {
      this._trackPlayers.set(e.id, new Af(e));
      return;
    }
    if (Qe(e)) {
      this._trackPlayers.set(e.id, new Ef(e)), this._springTracks.set(e.id, e);
      return;
    }
    if (Fr(e))
      this._trackPlayers.set(e.id, new Xs(e)), this._textTracks.set(e.id, e);
    else if (Sh(e)) {
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
      this._trackPlayers.set(e.id, new Xs(n)), this._motionPathTracks.set(e.id, e);
    } else
      this._trackPlayers.set(e.id, new Xs(e));
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
    if (Qe(s) || Ze(s))
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
          const a = We(r).filter((u) => We(s).includes(u));
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
    if (n.id !== void 0 && e.id !== n.id || n.property !== void 0 && e.property !== n.property || n.target !== void 0 && !We(e).includes(n.target)) return !1;
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
      formatVersion: xh(this._tracks),
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
const _f = 100;
function Bh(t, e, n, s) {
  const o = [], i = [], { duration: r, alternate: a } = s, l = (f, g, p, m) => {
    i.push([f, g]);
    const b = [];
    t.forEach((v, w) => {
      (p === "forward" ? (m ? v >= f : v > f) && v <= g : (m ? v <= f : v < f) && v >= g) && b.push(w);
    }), b.sort((v, w) => (p === "forward" ? t[v] - t[w] : t[w] - t[v]) || v - w);
    for (const v of b) o.push({ kind: "event", index: v, direction: p });
  };
  let c = e.time, h = e.direction, u = e.fresh === !0;
  const d = Math.min(_f, Math.max(0, n.iteration - e.iteration));
  for (let f = 0; f < d; f++) {
    const g = h === "forward" ? r : 0;
    l(c, g, h, u), o.push({ kind: "repeat" }), a ? (h = h === "forward" ? "reverse" : "forward", c = g, u = !1) : (c = h === "forward" ? 0 : r, u = !0);
  }
  return d > 0 && s.holding && !a ? { crossings: o, passes: i } : (l(c, n.time, h, u), { crossings: o, passes: i });
}
function Hf(t) {
  return Ze(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "inertia",
    inertia: zh(t.inertia),
    ...ce(t)
  } : Qe(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "spring",
    spring: { ...t.spring },
    ...ce(t)
  } : Fr(t) ? {
    id: t.id,
    target: t.target,
    property: "text",
    textConfig: { ...t.textConfig },
    keyframes: t.keyframes.map(fi),
    ...ce(t)
  } : Sh(t) ? {
    id: t.id,
    target: t.target,
    property: "motionPath",
    motionPathConfig: { ...t.motionPathConfig },
    keyframes: t.keyframes.map(fi),
    ...ce(t)
  } : {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes.map(fi),
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...ce(t)
  };
}
function zh(t) {
  return { ...t, ...Array.isArray(t.end) && { end: [...t.end] } };
}
function fi(t) {
  return {
    time: t.time,
    value: t.value,
    ...t.easing && { easing: t.easing }
  };
}
function ce(t) {
  const e = t.endDelay;
  return {
    ...t.delay !== void 0 && { delay: t.delay },
    ...e !== void 0 && { endDelay: e },
    ...t.targets !== void 0 && { targets: [...t.targets] },
    ...t.stagger !== void 0 && { stagger: { ...t.stagger } }
  };
}
function Cf(t) {
  if (Ze(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "inertia",
      inertia: zh(e.inertia),
      ...ce(e)
    };
  }
  if (Qe(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "spring",
      spring: { ...e.spring },
      ...ce(e)
    };
  }
  if (Fr(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: "text",
      textConfig: { ...e.textConfig },
      keyframes: [...e.keyframes].sort((n, s) => n.time - s.time),
      ...ce(e)
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
      ...ce(e)
    };
  }
  return tr({
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes,
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...ce(t)
  });
}
function Rf(t) {
  const e = t._config.markers;
  return {
    formatVersion: xh(t.tracks),
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
    tracks: t.tracks.map(Hf),
    ...t.captions && { captions: JSON.parse(JSON.stringify(t.captions)) }
  };
}
function cs(t) {
  const e = t.formatVersion ?? 1;
  if (e > Ra)
    throw new Error(
      `tinyfly: this animation uses format version ${e}, but this tinyfly reads up to version ${Ra}. Update tinyfly to play it.`
    );
  return new It({
    id: t.id,
    name: t.name,
    config: t.config,
    tracks: t.tracks.map(Cf),
    captions: t.captions
  });
}
function eM(t) {
  return JSON.stringify(Rf(t));
}
function nM(t) {
  const e = JSON.parse(t);
  return cs(e);
}
function Qt(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++)
    e ^= t.charCodeAt(n), e = Math.imul(e, 16777619);
  return e >>> 0;
}
function nn(t) {
  let e = t >>> 0 || 2654435769;
  return {
    seed: t >>> 0,
    next() {
      return e ^= e << 13, e >>>= 0, e ^= e >> 17, e ^= e << 5, e >>>= 0, e / 4294967296;
    }
  };
}
function qh(t, e, n) {
  return e + t.next() * (n - e);
}
function Lf(t, e, n, s) {
  if (s <= 0) return qh(t, e, n);
  const o = Math.floor((n - e) / s), i = Math.round(t.next() * o);
  return e + i * s;
}
function sM(t, e) {
  if (e.length !== 0)
    return e[Math.floor(t.next() * e.length)];
}
const Yh = /^([+\-*/])=\s*(-?[\d.]+)$/, jh = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function oM(t) {
  return typeof t != "string" ? !1 : Yh.test(t.trim()) || jh.test(t.trim());
}
function Kh(t, e = {}) {
  if (typeof t != "string") return t;
  const n = t.trim(), s = Yh.exec(n);
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
  const o = jh.exec(n);
  if (o) {
    if (!e.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const i = Number.parseFloat(o[1]), r = Number.parseFloat(o[2]), a = o[3] !== void 0 ? Number.parseFloat(o[3]) : void 0;
    return a !== void 0 ? Lf(e.random, i, r, a) : qh(e.random, i, r);
  }
  return t;
}
function Ff(t, e = 0, n) {
  const s = [];
  let o = e;
  for (const i of t) {
    const r = Kh(i, { base: o, random: n });
    s.push(r), typeof r == "number" && (o = r);
  }
  return s;
}
class iM {
  random;
  constructor(e) {
    this.random = nn(e);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(e, n = 0) {
    return Kh(e, { base: n, random: this.random });
  }
  resolveSequence(e, n = 0) {
    return Ff(e, n, this.random);
  }
}
const Wf = 600;
function Nf(t) {
  if (Array.isArray(t)) {
    const [d, f, g, p] = t;
    return { fn: Ja(d, f, g, p), bezier: [d, f, g, p] };
  }
  const { segments: e } = In(t);
  if (e.length === 0) throw new Error(`customEase: no curve in "${t}"`);
  const n = e[0].startX, s = e[0].startY, o = e[e.length - 1], i = o.endX - n, r = o.endY - s;
  if (i === 0 || r === 0) throw new Error(`customEase: "${t}" must move along both axes`);
  const a = (d) => (d - n) / i, l = (d) => (d - s) / r;
  if (e.length === 1 && o.type === "C") {
    const [d, f, g, p] = o.points, m = [a(d), l(f), a(g), l(p)];
    return { fn: Ja(...m), bezier: m };
  }
  const c = [], h = [], u = Math.max(8, Math.ceil(Wf / e.length));
  for (const d of e)
    for (let f = c.length === 0 ? 0 : 1; f <= u; f++) {
      const [g, p] = zf(d, f / u);
      c.push(a(g)), h.push(l(p));
    }
  return { fn: qf(c, h) };
}
function Df(t = {}) {
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
function Bf(t = {}) {
  const e = Math.max(1, t.wiggles ?? 10), n = t.type ?? "easeOut", s = (o) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * o) : (1 - o) ** 2;
  return (o) => o <= 0 || o >= 1 ? 0 : Math.sin(o * e * Math.PI * 2) * s(o);
}
function zf(t, e) {
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
function qf(t, e) {
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
function Ja(t, e, n, s) {
  const o = (r, a, l) => 3 * (1 - r) * (1 - r) * r * a + 3 * (1 - r) * r * r * l + r * r * r, i = (r, a, l) => 3 * (1 - r) * (1 - r) * a + 6 * (1 - r) * r * (l - a) + 3 * r * r * (1 - l);
  return (r) => {
    if (r <= 0) return 0;
    if (r >= 1) return 1;
    let a = r;
    for (let h = 0; h < 8; h++) {
      const u = o(a, t, n) - r, d = i(a, t, n);
      if (Math.abs(u) < 1e-6) return o(a, e, s);
      if (Math.abs(d) < 1e-6) break;
      a -= u / d;
    }
    let l = 0, c = 1;
    a = r;
    for (let h = 0; h < 40; h++)
      o(a, t, n) < r ? l = a : c = a, a = (l + c) / 2;
    return o(a, e, s);
  };
}
const Yf = 350, jf = 300, Kf = 550;
function rM(t, e = {}) {
  const n = e.lead ?? Yf, s = e.gap ?? jf, o = e.tail ?? Kf, i = [];
  let r = 0;
  return t.forEach((a, l) => {
    const c = [];
    let h = r + n;
    a.lines.forEach((d, f) => {
      if (!(d.duration >= 0))
        throw new Error(`narration: scene ${l} line ${f} has an invalid duration (${d.duration})`);
      f > 0 && (h += s), c.push({
        id: d.id ?? `s${l}-l${f}`,
        scene: l,
        line: f,
        start: h,
        end: h + d.duration,
        text: d.text
      }), h += d.duration;
    });
    const u = h + o + (a.tail ?? 0);
    i.push({ id: a.id ?? `s${l}`, start: r, duration: u - r, cues: c }), r = u;
  }), { duration: r, scenes: i, cues: i.flatMap((a) => a.cues) };
}
function aM(t) {
  return t.cues.map((e) => ({ id: e.id, time: e.start, label: e.text }));
}
function lM(t, e) {
  let n = t.scenes[0];
  for (const s of t.scenes)
    if (e >= s.start) n = s;
    else break;
  return n;
}
const Ro = (t) => 6e4 / t.bpm;
function Dr(t, e) {
  return t.offset + e * Ro(t);
}
function Lo(t, e) {
  return (e - t.offset) / Ro(t);
}
function cM(t, e) {
  return Dr(t, Math.round(Lo(t, e)));
}
function hM(t, e) {
  return Dr(t, Math.ceil(Lo(t, e) - 1e-9));
}
function uM(t, e, n) {
  const s = Math.max(1, Math.round(t.beatsPerBar ?? 4)), o = [];
  if (!(t.bpm > 0) || n < e) return o;
  for (let i = Math.ceil(Lo(t, e) - 1e-9); ; i++) {
    const r = Dr(t, i);
    if (r > n + 1e-9) break;
    o.push({ time: r, bar: (i % s + s) % s === 0, n: i });
  }
  return o;
}
const ln = 100;
function dM(t, e, n = {}) {
  const s = n.minBpm ?? 70, o = n.maxBpm ?? 180, i = Math.max(1, Math.round(e / ln)), r = Math.min(t.length, Math.round((n.maxSeconds ?? 60) * e)), a = Math.floor(r / i);
  if (a < 4) return { bpm: 120, offset: 0, confidence: 0 };
  const l = new Float64Array(a);
  for (let k = 0; k < a; k++) {
    let x = 0;
    for (let P = k * i; P < (k + 1) * i; P++) x += t[P] * t[P];
    l[k] = Math.log(1e-6 + x / i);
  }
  const c = new Float64Array(a);
  for (let k = 1; k < a; k++) c[k] = Math.max(0, l[k] - l[k - 1]);
  const h = c.reduce((k, x) => k + x, 0) / a;
  for (let k = 0; k < a; k++) c[k] = Math.max(0, c[k] - h);
  const u = Math.max(1, Math.floor(60 * ln / o)), d = Math.min(a - 1, Math.ceil(60 * ln / s)), f = (k) => {
    let x = 0;
    for (let P = k; P < a; P++) x += c[P] * c[P - k];
    return x / (a - k);
  };
  let g = 0;
  for (let k = 0; k < a; k++) g += c[k] * c[k];
  g /= a;
  let p = u, m = -1 / 0;
  for (let k = u; k <= d; k++) {
    const x = 60 * ln / k, P = Math.exp(-0.5 * (Math.log2(x / 120) / 0.9) ** 2), E = f(k) * P;
    E > m && (m = E, p = k);
  }
  const b = (k) => {
    const x = Math.floor(k);
    return x < 0 || x + 1 >= a ? 0 : c[x] + (c[x + 1] - c[x]) * (k - x);
  }, v = (k, x) => {
    let P = 0;
    for (let E = x; E < a; E += k) P += b(E);
    return P;
  };
  let w = p, y = 0, T = -1 / 0;
  for (let k = p - 0.6; k <= p + 0.6 + 1e-9; k += 0.02) {
    if (k < 1) continue;
    const x = Math.max(1, Math.round(k * 4));
    for (let P = 0; P < x; P++) {
      const E = P / x * k, O = v(k, E);
      O > T && (T = O, y = E, w = k);
    }
  }
  const $ = 60 * ln / w, M = g > 0 ? Math.max(0, Math.min(1, f(p) / g)) : 0, S = (y + 0.5) * 1e3 / ln;
  return { bpm: Math.round($ * 100) / 100, offset: Math.round(S % (6e4 / $)), confidence: M };
}
const Xf = 600, Uf = 250, Za = 1;
function fM(t, e) {
  const n = e.target ?? "Camera", s = { x: e.stage.width / 2, y: e.stage.height / 2 }, o = {}, i = (u, d, f, g) => {
    const p = o[u] ??= [];
    for (; p.length > 0 && p[p.length - 1].time >= d; ) p.pop();
    p.push({ time: d, value: f, ...g ? { easing: g } : {} });
  }, r = (u) => {
    const d = u.rotate * Math.PI / 180, f = (u.focusX - s.x) * u.scale, g = (u.focusY - s.y) * u.scale;
    return {
      x: -(f * Math.cos(d) - g * Math.sin(d)),
      y: -(f * Math.sin(d) + g * Math.cos(d)),
      scale: u.scale,
      rotate: u.rotate
    };
  }, a = (u, d, f) => {
    const g = r(d);
    for (const p of ["x", "y", "scale", "rotate"]) i(p, u, g[p], f);
  };
  let l = { focusX: s.x, focusY: s.y, scale: 1, rotate: 0 };
  const c = [...t].sort((u, d) => u.at - d.at), h = c.filter((u) => !("shake" in u));
  h.length > 0 && a(0, l);
  for (const u of h)
    if ("frame" in u) {
      const d = Math.max(Za, u.duration ?? Xf);
      a(u.at, l), l = {
        focusX: u.frame.focus?.x ?? s.x,
        focusY: u.frame.focus?.y ?? s.y,
        scale: u.frame.scale ?? 1,
        rotate: u.frame.rotate ?? 0
      }, a(u.at + d, l, u.easing ?? (d > Za ? "ease-in-out" : void 0));
    } else {
      const { follow: d } = u, f = d.lag ?? Uf, g = new It({ id: "follow", tracks: [{ id: "x", target: "s", property: "x", keyframes: d.x }] }), p = (v) => g.getStateAtTime(v).values.get("s")?.get("x") ?? l.focusX, m = [u.at, ...d.x.map((v) => v.time).filter((v) => v > u.at && v < u.until), u.until];
      a(u.at, l);
      const b = (v) => ({
        focusX: p(v) + (d.lead ?? 0),
        focusY: d.y ?? l.focusY,
        scale: d.scale ?? l.scale,
        rotate: l.rotate
      });
      for (const v of m) {
        const w = d.x.find((y) => y.time === v)?.easing;
        a(v + f, b(v), v === u.at ? "ease-in-out" : w);
      }
      l = b(u.until);
    }
  for (const u of c.filter((d) => "shake" in d)) {
    const d = u.shake.strength ?? 12, f = u.shake.roll ?? 1.5, g = 1e3 / (u.shake.frequency ?? 24), p = nn(u.shake.seed ?? Math.round(u.at) + 1), m = () => p.next() * 2 - 1;
    for (const b of ["shakeX", "shakeY", "shakeRotate"]) i(b, u.at, 0);
    for (let b = u.at + g; b < u.at + u.duration; b += g) {
      const v = 1 - (b - u.at) / u.duration;
      i("shakeX", b, m() * d * v), i("shakeY", b, m() * d * v), i("shakeRotate", b, m() * f * v);
    }
    for (const b of ["shakeX", "shakeY", "shakeRotate"]) i(b, u.at + u.duration, 0, "ease-out");
  }
  return Object.entries(o).map(([u, d]) => ({ id: `${n}-${u}`, target: n, property: u, keyframes: d }));
}
function Gf(t, e) {
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
function ro(t, e) {
  const n = t.toLowerCase(), s = e.find((r) => r.toLowerCase().includes(n) || n.includes(r.toLowerCase()));
  if (s && Math.min(t.length, s.length) >= 3) return s;
  let o, i = 1 / 0;
  for (const r of e) {
    const a = Gf(t, r);
    a < i && (i = a, o = r);
  }
  return o !== void 0 && i <= Math.max(2, Math.floor(t.length / 3)) ? o : void 0;
}
function ut(t, e, n, s) {
  const o = typeof e == "string" ? s ?? ro(e, n) : void 0;
  return `Unknown ${t} ${JSON.stringify(e)}${o ? `: did you mean "${o}"?` : "."} Known: ${n.join(", ")}`;
}
function Us(t, e) {
  const n = e.step ?? 33, s = e.stiffness ?? 120, o = e.damping ?? 9, i = e.mass ?? 1;
  let r = t(e.start), a = 0;
  const l = [{ time: e.start, value: r }];
  let c = e.start + n;
  for (let h = e.start + 1; h <= e.end; h++) {
    const d = s * (t(h) - r) - o * a;
    a += d / i * 1e-3, r += a * 1e-3, (h >= c || h === e.end) && (l.push({ time: h, value: r }), c += n);
  }
  return l;
}
function _n(t, e, n = 1) {
  if (!(e > 0)) return 0;
  const s = t * n / e;
  return s - Math.floor(s);
}
function Xh(t) {
  const e = t - Math.floor(t);
  return 1 - Math.abs(e * 2 - 1);
}
function pM(t, e) {
  const n = Math.max(1, Math.round(e.cycles ?? 1)), s = e.amplitude ?? 1, o = _n(t, e.period, n) + (e.phase ?? 0), i = o - Math.floor(o);
  switch (e.shape ?? "sine") {
    case "triangle":
      return s * (Xh(i + 0.25) * 2 - 1);
    case "square":
      return i < 0.5 ? s : -s;
    default:
      return s * Math.sin(i * Math.PI * 2);
  }
}
function gM(t, e) {
  const n = Math.max(1, Math.round(e.cycles ?? 1)), s = typeof e.easing == "function" ? e.easing : Ft(e.easing ?? "ease-in-out"), o = _n(t, e.period, n) + (e.phase ?? 0);
  return s(Xh(o));
}
function mM(t, e) {
  const n = Uh(e.seed), s = Math.max(1, Math.round(e.cycles ?? 1)), o = (_n(t, e.period, 1) + (e.phase ?? 0)) * Math.PI * 2, i = s / Math.PI;
  return Gh([Math.cos(o) * i + 7.31, Math.sin(o) * i + 3.17], n, e.octaves ?? 1);
}
function yM(t, e, n) {
  const s = Uh(n.seed), o = Math.max(1, Math.round(n.cycles ?? 1)), i = Math.max(1, Math.round(n.cyclesAlong ?? 1)), r = _n(t, n.period, 1) * Math.PI * 2, a = _n(e, n.periodAlong, 1) * Math.PI * 2, l = o / Math.PI, c = i / Math.PI;
  return Gh([Math.cos(r) * l + 5.13, Math.sin(r) * l + 9.47, Math.cos(a) * c + 2.71, Math.sin(a) * c + 6.29], s, n.octaves ?? 1);
}
const Uh = (t) => typeof t == "string" ? Qt(t) : (t ?? 0) >>> 0;
function Gh(t, e, n) {
  const s = Math.max(1, Math.min(6, Math.round(n)));
  let o = 0, i = 1, r = 0;
  for (let a = 0; a < s; a++) {
    const l = 2 ** a;
    o += i * Vf(t.map((c) => c * l), e + a * 1013), r += i, i *= 0.5;
  }
  return o / r;
}
function Vf(t, e) {
  const n = t.length, s = t.map(Math.floor), i = t.map((a, l) => a - s[l]).map((a) => a * a * (3 - 2 * a));
  let r = 0;
  for (let a = 0; a < 1 << n; a++) {
    let l = 1;
    const c = [];
    for (let h = 0; h < n; h++) {
      const u = a >> h & 1;
      l *= u ? i[h] : 1 - i[h], c.push(s[h] + u);
    }
    l !== 0 && (r += l * Jf(c, e));
  }
  return r;
}
function Jf(t, e) {
  let n = (e ^ 2654435769) >>> 0;
  for (const s of t)
    n = Math.imul(n ^ (s | 0), 2246822507) >>> 0, n = (n ^ n >>> 13) >>> 0, n = Math.imul(n, 3266489909) >>> 0, n = (n ^ n >>> 16) >>> 0;
  return n / 4294967296 * 2 - 1;
}
function bM(t, e = {}) {
  if (t.length === 0) throw new Error("curve: needs at least one key");
  const s = { id: "curve", target: "curve", property: "value", keyframes: t.map((i) => ({ time: i.at, value: i.value, easing: i.easing })).sort((i, r) => i.time - r.time), interpolation: e.interpolation }, o = new Xs(s);
  return (i) => o.getValueAtTime(i);
}
function wM(t, e) {
  return e * Ro({ bpm: t.bpm });
}
function kM(t, e) {
  const n = Math.max(1, Math.round(t / Ro(e)));
  return { beats: n, grid: { ...e, bpm: n * 6e4 / t } };
}
function vM(t, e, n = {}) {
  const s = Math.max(1e-6, n.attack ?? 0.05), o = Math.max(1e-6, n.decay ?? 0.4), i = Lo(e, t), r = i - Math.floor(i), a = r < s ? r / s : Math.max(0, 1 - (r - s) / o), l = n.barAccent ?? 0;
  if (l <= 0) return a;
  const c = Math.max(1, Math.round(e.beatsPerBar ?? 4)), u = (Math.floor(i) % c + c) % c === 0;
  return a * (u ? 1 + l : 1) / (1 + l);
}
function MM(t, e, n = {}) {
  const s = n.fps ?? 30, o = Math.max(1, Math.round(e / s)), i = Math.max(1, Math.ceil(t.length / o)), r = new Float32Array(i), a = Math.min(0.99, Math.max(0, n.smoothing ?? 0.5));
  let l = 0, c = 0;
  for (let h = 0; h < i; h++) {
    let u = 0;
    const d = h * o, f = Math.min(t.length, d + o);
    for (let p = d; p < f; p++) u += t[p] * t[p];
    const g = f > d ? Math.sqrt(u / (f - d)) : 0;
    l = g > l ? g : l * a + g * (1 - a), r[h] = l, c = Math.max(c, l);
  }
  if (n.normalize !== !1 && c > 0) for (let h = 0; h < i; h++) r[h] /= c;
  return r;
}
function xM(t, e, n = 30, s) {
  if (t.length === 0) return 0;
  const i = (s ? _n(e, s) * s : e) * n / 1e3, r = Math.floor(i), a = t[Math.min(t.length - 1, Math.max(0, r))], l = t[Math.min(t.length - 1, Math.max(0, r + 1))];
  return a + (l - a) * (i - r);
}
const Zf = {
  "16:9": 16 / 9,
  "2.39:1": 2.39,
  "4:3": 4 / 3,
  "1:1": 1,
  "9:16": 9 / 16,
  "4:5": 4 / 5
}, Vh = (t) => typeof t == "number" ? t : Zf[t];
function SM(t, e) {
  const n = Vh(e), s = t.width / t.height;
  if (n >= s) {
    const i = t.width / n;
    return { x: 0, y: (t.height - i) / 2, width: t.width, height: i };
  }
  const o = t.height * n;
  return { x: (t.width - o) / 2, y: 0, width: o, height: t.height };
}
function TM(t, e) {
  const n = Vh(t), s = (o) => Math.max(2, Math.round(o / 2) * 2);
  return "width" in e ? { width: s(e.width), height: s(e.width / n) } : { width: s(e.height * n), height: s(e.height) };
}
function EM(t, e = {}) {
  const n = (s) => ({
    x: t.x + t.width * (1 - s) / 2,
    y: t.y + t.height * (1 - s) / 2,
    width: t.width * s,
    height: t.height * s
  });
  return { action: n(e.action ?? 0.9), title: n(e.title ?? 0.8) };
}
const re = (t) => Math.round(t * 1e3) / 1e3;
function Qf(t, e = {}) {
  if (t.length === 0) return "";
  const n = e.curviness ?? 1, s = e.closed ?? !1, o = t.length;
  let i = `M${re(t[0].x)} ${re(t[0].y)}`;
  if (o === 1) return i;
  const r = (l) => s ? t[(l % o + o) % o] : t[Math.max(0, Math.min(o - 1, l))], a = s ? o : o - 1;
  for (let l = 0; l < a; l++) {
    const c = r(l - 1), h = r(l), u = r(l + 1), d = r(l + 2);
    if (n === 0) {
      i += ` L${re(u.x)} ${re(u.y)}`;
      continue;
    }
    const f = n / 6, g = h.x + (u.x - c.x) * f, p = h.y + (u.y - c.y) * f, m = u.x - (d.x - h.x) * f, b = u.y - (d.y - h.y) * f;
    i += ` C${re(g)} ${re(p)} ${re(m)} ${re(b)} ${re(u.x)} ${re(u.y)}`;
  }
  return s ? `${i} Z` : i;
}
const _t = (t, e = 0) => {
  const n = parseFloat(t ?? "");
  return Number.isFinite(n) ? n : e;
};
function tp(t) {
  const e = (t ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let s = 0; s + 1 < e.length; s += 2) n.push({ x: e[s], y: e[s + 1] });
  return n;
}
function Br(t) {
  const e = t.attributes;
  switch (t.tag.toLowerCase()) {
    case "path":
      return e.d ?? null;
    case "circle":
    case "ellipse": {
      const n = _t(e.cx), s = _t(e.cy), o = t.tag.toLowerCase() === "circle" ? _t(e.r) : _t(e.rx), i = t.tag.toLowerCase() === "circle" ? _t(e.r) : _t(e.ry);
      return `M${n + o} ${s} A${o} ${i} 0 1 1 ${n - o} ${s} A${o} ${i} 0 1 1 ${n + o} ${s} Z`;
    }
    case "rect": {
      const n = _t(e.x), s = _t(e.y), o = _t(e.width), i = _t(e.height);
      let r = e.rx != null ? _t(e.rx) : e.ry != null ? _t(e.ry) : 0, a = e.ry != null ? _t(e.ry) : r;
      return r = Math.min(r, o / 2), a = Math.min(a, i / 2), r === 0 || a === 0 ? `M${n} ${s} H${n + o} V${s + i} H${n} Z` : `M${n + r} ${s} H${n + o - r} A${r} ${a} 0 0 1 ${n + o} ${s + a} V${s + i - a} A${r} ${a} 0 0 1 ${n + o - r} ${s + i} H${n + r} A${r} ${a} 0 0 1 ${n} ${s + i - a} V${s + a} A${r} ${a} 0 0 1 ${n + r} ${s} Z`;
    }
    case "line":
      return `M${_t(e.x1)} ${_t(e.y1)} L${_t(e.x2)} ${_t(e.y2)}`;
    case "polyline":
    case "polygon": {
      const n = tp(e.points);
      if (n.length === 0) return null;
      const s = n.map((o, i) => `${i === 0 ? "M" : "L"}${o.x} ${o.y}`).join(" ");
      return t.tag.toLowerCase() === "polygon" ? `${s} Z` : s;
    }
    default:
      return null;
  }
}
function AM(t, e, n) {
  const s = Math.max(2, Math.round(n.samples ?? 32)), o = Math.max(0, n.length), i = n.since !== void 0 ? Math.max(e - o, n.since) : e - o;
  if (i >= e) return [];
  const r = n.period, a = [];
  for (let l = 0; l < s; l++) {
    const c = i + (e - i) * l / (s - 1), h = r && r > 0 && l < s - 1 ? (c % r + r) % r : c;
    a.push({ at: t(h), time: c, age: o > 0 ? (e - c) / o : 0 });
  }
  return a;
}
const ep = 2.5;
function np(t) {
  const e = [], n = [], s = t.length, o = (i, r) => {
    for (let a = i + r; a >= 0 && a < s; a += r) {
      const l = (t[a].x - t[i].x) * r, c = (t[a].y - t[i].y) * r, h = Math.hypot(l, c);
      if (h > 1e-9) return [l / h, c / h];
    }
    return null;
  };
  for (let i = 0; i < s; i++) {
    const r = t[i], a = o(i, -1), l = o(i, 1), c = a ?? l ?? [1, 0], h = l ?? a ?? [1, 0];
    let u = c[0] + h[0], d = c[1] + h[1];
    const f = Math.hypot(u, d);
    f < 1e-9 ? (u = c[0], d = c[1]) : (u /= f, d /= f);
    const g = u * c[0] + d * c[1], p = Math.min(ep, 1 / Math.max(g, 1e-6)), m = r.width / 2 * p;
    e.push({ x: r.x - d * m, y: r.y + u * m }), n.push({ x: r.x + d * m, y: r.y - u * m });
  }
  return { left: e, right: n };
}
function sp(t) {
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
const $M = { scale: 1, turn: 0, x: 0, y: 0 };
function PM(t = {}) {
  return { scale: t.scale ?? 1, turn: t.turn ?? 0, x: t.x ?? 0, y: t.y ?? 0 };
}
function op(t, e, n) {
  const { ax: s, ay: o } = Fo(t, e);
  return { scale: t, turn: e, x: n.x - (s * n.x - o * n.y), y: n.y - (o * n.x + s * n.y) };
}
function Jh(t, e) {
  const { ax: n, ay: s } = Fo(t.scale, t.turn);
  return { x: n * e.x - s * e.y + t.x, y: s * e.x + n * e.y + t.y };
}
function IM(t, e) {
  const n = Jh(e, { x: t.x, y: t.y });
  return { scale: t.scale * e.scale, turn: t.turn + e.turn, x: n.x, y: n.y };
}
function OM(t) {
  if (t.scale === 0) throw new Error("invertSimilarity: a scale of 0 cannot be undone");
  const e = { scale: 1 / t.scale, turn: -t.turn, x: 0, y: 0 }, n = Jh(e, { x: t.x, y: t.y });
  return { ...e, x: -n.x, y: -n.y };
}
function ip(t) {
  const { ax: e, ay: n } = Fo(t.scale, t.turn), s = 1 - e, o = -n, i = s * s + o * o;
  return i < 1e-18 ? null : { x: (t.x * s + t.y * o) / i, y: (t.y * s - t.x * o) / i };
}
function _M(t, e) {
  if (t.scale <= 0) throw new Error("powSimilarity: the scale must be positive");
  const n = Math.pow(t.scale, e), s = t.turn * e, o = ip(t);
  return o ? op(n, s, o) : { scale: n, turn: s, x: t.x * e, y: t.y * e };
}
function HM(t) {
  const { ax: e, ay: n } = Fo(t.scale, t.turn);
  return [e, n, -n, e, t.x, t.y];
}
const Fo = (t, e) => {
  const n = e * Math.PI / 180;
  return { ax: t * Math.cos(n), ay: t * Math.sin(n) };
};
function zr([t, e, n], s = {}) {
  const o = s.scale ?? 1, i = s.centre ?? { x: 0, y: 0 }, r = Math.sqrt(3) / 2;
  return { x: i.x + (t - e) * r * o, y: i.y + ((t + e) * 0.5 - n) * o };
}
const Zh = ([t, e, n]) => t + e + n;
function Qh(t, e = {}) {
  const [n, s, o] = t.min, [i, r, a] = t.max, l = (d) => zr(d, e), c = [(n + i) / 2, (s + r) / 2, (o + a) / 2], h = Zh(c), u = [
    { side: "top", depth: h, tag: t.tag, points: [l([n, s, a]), l([i, s, a]), l([i, r, a]), l([n, r, a])] },
    { side: "left", depth: h, tag: t.tag, points: [l([n, r, o]), l([i, r, o]), l([i, r, a]), l([n, r, a])] },
    { side: "right", depth: h, tag: t.tag, points: [l([i, s, o]), l([i, r, o]), l([i, r, a]), l([i, s, a])] }
  ];
  return t.hide ? u.filter((d) => !t.hide.includes(d.side)) : u;
}
function t0(t, e = {}) {
  return t.map((n) => ({ box: n, depth: Zh([(n.min[0] + n.max[0]) / 2, (n.min[1] + n.max[1]) / 2, (n.min[2] + n.max[2]) / 2]) })).sort((n, s) => n.depth - s.depth).flatMap(({ box: n }) => Qh(n, e));
}
function CM(t = {}) {
  const e = t.size ?? 10, s = (t.thickness ?? 2) / 2, o = [
    { tag: 0, min: [-s, -s, -s], max: [e - s, s, s] },
    { tag: 1, min: [e - s, -s, -s], max: [e + s, e - s, s] },
    { tag: 2, min: [e - s, e - s, -s], max: [e + s, e + s, e] }
  ], i = t.centre ?? { x: 0, y: 0 }, r = zr([2 * e / 3, e / 3, e / 3], { scale: t.scale }), a = { centre: { x: i.x - r.x, y: i.y - r.y }, scale: t.scale };
  return { boxes: o, faces: [...t0(o, a), ...Qh({ ...o[0], hide: ["right"] }, a)] };
}
function RM(t = {}) {
  const e = Math.max(2, Math.round(t.steps ?? 8)), n = t.tread ?? 1.5, s = t.rise ?? 0.25, o = t.width ?? 3, i = t.base ?? 1.5, r = Math.max(1, Math.round(e * (n - 2 * s) / (n + 2 * s))), a = 2 * (e + r), l = n * (e - r) / a, c = [
    { dir: [1, 0, 0], across: [0, 1, 0], count: e },
    { dir: [0, 1, 0], across: [-1, 0, 0], count: e },
    { dir: [-1, 0, 0], across: [0, -1, 0], count: r },
    { dir: [0, -1, 0], across: [1, 0, 0], count: r }
  ], h = [];
  let u = [0, 0, 0], d = 0;
  for (const b of c) {
    for (let v = 0; v < b.count; v++) {
      const w = d * l, y = [u[0] + b.dir[0] * v * n, u[1] + b.dir[1] * v * n, 0], T = [y[0] + b.dir[0] * n + b.across[0] * o, y[1] + b.dir[1] * n + b.across[1] * o, 0];
      h.push({
        tag: d,
        min: [Math.min(y[0], T[0]), Math.min(y[1], T[1]), 0],
        max: [Math.max(y[0], T[0]), Math.max(y[1], T[1]), w + i]
      }), d++;
    }
    u = [u[0] + b.dir[0] * b.count * n, u[1] + b.dir[1] * b.count * n, 0];
  }
  const f = a * l, g = t.centre ?? { x: 0, y: 0 }, p = zr([e * n / 2, e * n / 2, f / 2 + i], { scale: t.scale }), m = { centre: { x: g.x - p.x, y: g.y - p.y }, scale: t.scale };
  return { boxes: h, faces: t0(h, m), rise: l };
}
function rp(t, e, n) {
  let s = 0;
  for (const o of t) {
    const i = (e - o.x) ** 2 + (n - o.y) ** 2;
    s += i > 1e-9 ? o.r * o.r / i : 1e9;
  }
  return s;
}
function LM(t, e = {}) {
  if (t.length === 0) return [];
  const n = e.threshold ?? 1, s = Math.max(0.5, e.cell ?? 4), o = Math.sqrt(1 / n) * 1.6, i = e.bounds ?? {
    x: Math.min(...t.map((f) => f.x - f.r * o)),
    y: Math.min(...t.map((f) => f.y - f.r * o)),
    width: Math.max(...t.map((f) => f.x + f.r * o)) - Math.min(...t.map((f) => f.x - f.r * o)),
    height: Math.max(...t.map((f) => f.y + f.r * o)) - Math.min(...t.map((f) => f.y - f.r * o))
  }, r = Math.max(2, Math.ceil(i.width / s) + 1), a = Math.max(2, Math.ceil(i.height / s) + 1), l = new Float64Array(r * a);
  for (let f = 0; f < a; f++) for (let g = 0; g < r; g++) l[f * r + g] = rp(t, i.x + g * s, i.y + f * s) - n;
  const c = (f, g) => l[g * r + f], h = (f, g, p, m, b, v) => {
    const w = p === v ? 0.5 : p / (p - v);
    return { x: f + (m - f) * w, y: g + (b - g) * w };
  }, u = [];
  for (let f = 0; f + 1 < a; f++)
    for (let g = 0; g + 1 < r; g++) {
      const p = i.x + g * s, m = i.y + f * s, b = p + s, v = m + s, w = [c(g, f), c(g + 1, f), c(g + 1, f + 1), c(g, f + 1)], y = (w[0] > 0 ? 1 : 0) | (w[1] > 0 ? 2 : 0) | (w[2] > 0 ? 4 : 0) | (w[3] > 0 ? 8 : 0);
      if (y === 0 || y === 15) continue;
      const T = () => h(p, m, w[0], b, m, w[1]), $ = () => h(b, m, w[1], b, v, w[2]), M = () => h(p, v, w[3], b, v, w[2]), S = () => h(p, m, w[0], p, v, w[3]), k = (w[0] + w[1] + w[2] + w[3]) / 4 > 0;
      switch (y) {
        case 1:
        case 14:
          u.push([S(), T()]);
          break;
        case 2:
        case 13:
          u.push([T(), $()]);
          break;
        case 3:
        case 12:
          u.push([S(), $()]);
          break;
        case 4:
        case 11:
          u.push([$(), M()]);
          break;
        case 6:
        case 9:
          u.push([T(), M()]);
          break;
        case 7:
        case 8:
          u.push([S(), M()]);
          break;
        case 5:
          k ? u.push([S(), M()], [T(), $()]) : u.push([S(), T()], [$(), M()]);
          break;
        case 10:
          k ? u.push([S(), T()], [$(), M()]) : u.push([S(), M()], [T(), $()]);
          break;
      }
    }
  const d = ap(u);
  return e.smooth === !1 ? d : d.map((f) => Qa(Qa(f)));
}
function ap(t) {
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
function Qa(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const s = t[n], o = t[(n + 1) % t.length];
    e.push({ x: s.x * 0.75 + o.x * 0.25, y: s.y * 0.75 + o.y * 0.25 }, { x: s.x * 0.25 + o.x * 0.75, y: s.y * 0.25 + o.y * 0.75 });
  }
  return e;
}
function FM(t) {
  const e = Math.min(1, Math.max(0, t.progress));
  if (e <= 0) return [];
  const n = t.width / 2, s = n * (0.55 + 0.75 * e), o = Math.max(t.length * e, s * 1.2), i = t.x, r = t.y + o - s, a = Math.max(0.1, n * (0.35 - 0.3 * e)), l = r - Math.sqrt(Math.max(0, s * s - a * a)), c = Math.max(0, l - t.y), h = 8, u = [], d = [];
  for (let v = 0; v <= h; v++) {
    const w = v / h, y = a + (n - a) * Math.pow(1 - w, 1.6 + 1.4 * e);
    u.push({ x: i - y, y: t.y + c * w }), d.push({ x: i + y, y: t.y + c * w });
  }
  const f = Math.max(8, Math.round(t.segments ?? 12)), g = Math.acos(Math.min(1, a / s)), p = -g, m = Math.PI + g, b = [];
  for (let v = 1; v < f; v++) {
    const w = p + (m - p) * v / f;
    b.push({ x: i + Math.cos(w) * s, y: r + Math.sin(w) * s });
  }
  return [...d, ...b, ...u.reverse()];
}
function WM(t) {
  const e = Math.min(1, Math.max(0, t.grow ?? 1)), n = e >= 1 ? 1 : 1 - Math.pow(1 - e, 3) + 0.08 * Math.sin(e * Math.PI) * e, s = t.r * Math.max(0, n);
  if (s <= 0) return [];
  const o = Math.max(12, Math.round(t.segments ?? 48)), i = t.wobble ?? 0.05, r = t.time ?? 0, a = t.period ? r / t.period : r / 2500, l = (a - Math.floor(a)) * Math.PI * 2, c = t.seed ?? 0, h = [];
  for (let u = 0; u < o; u++) {
    const d = u / o * Math.PI * 2, f = 1 + i * (Math.sin(2 * d + l + c) * 0.6 + Math.sin(3 * d - 2 * l + c * 1.7) * 0.4);
    h.push({ x: t.x + Math.cos(d) * s * f, y: t.y + Math.sin(d) * s * f });
  }
  return h;
}
function NM(t) {
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
function DM(t, e = {}) {
  const n = Math.max(0.05, 1 + t);
  return { sx: e.keep === "volume" ? 1 / Math.sqrt(n) : 1 / n, sy: n };
}
function BM(t, e, n = { x: 0, y: 0 }) {
  return t.map((s) => ({ x: n.x + (s.x - n.x) * e.sx, y: n.y + (s.y - n.y) * e.sy }));
}
function Gs(t, e) {
  return [t[0] + e[0], t[1] + e[1], t[2] + e[2]];
}
function Nn(t, e) {
  return [t[0] - e[0], t[1] - e[1], t[2] - e[2]];
}
function Tn(t, e) {
  return [t[0] * e, t[1] * e, t[2] * e];
}
function Oe(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function ao(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function Wo(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function qr(t, e) {
  return Wo(Nn(t, e));
}
function tn(t) {
  const e = Wo(t);
  return e === 0 ? [0, 0, 0] : Tn(t, 1 / e);
}
function e0(t, e, n) {
  return [t[0] + (e[0] - t[0]) * n, t[1] + (e[1] - t[1]) * n, t[2] + (e[2] - t[2]) * n];
}
const zM = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Gs,
  cross: ao,
  distance: qr,
  dot: Oe,
  length: Wo,
  lerp: e0,
  normalize: tn,
  scale: Tn,
  subtract: Nn
}, Symbol.toStringTag, { value: "Module" })), lp = Math.PI / 180;
function No() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function At(t, e) {
  const n = new Array(16);
  for (let s = 0; s < 4; s++)
    for (let o = 0; o < 4; o++) {
      let i = 0;
      for (let r = 0; r < 4; r++) i += t[r * 4 + o] * e[s * 4 + r];
      n[s * 4 + o] = i;
    }
  return n;
}
function Ne(t) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1];
}
function Ke(t) {
  return [t[0], 0, 0, 0, 0, t[1], 0, 0, 0, 0, t[2], 0, 0, 0, 0, 1];
}
function oe(t) {
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
function Yr(t, e, n) {
  const s = oe(e);
  for (let o = 0; o < 3; o++)
    s[o] *= n[0], s[4 + o] *= n[1], s[8 + o] *= n[2];
  return s[12] = t[0], s[13] = t[1], s[14] = t[2], s;
}
function cp(t) {
  const e = new Array(16);
  for (let n = 0; n < 4; n++) for (let s = 0; s < 4; s++) e[s * 4 + n] = t[n * 4 + s];
  return e;
}
function jr(t) {
  const [e, n, s, o, i, r, a, l, c, h, u, d, f, g, p, m] = t, b = e * r - n * i, v = e * a - s * i, w = e * l - o * i, y = n * a - s * r, T = n * l - o * r, $ = s * l - o * a, M = c * g - h * f, S = c * p - u * f, k = c * m - d * f, x = h * p - u * g, P = h * m - d * g, E = u * m - d * p, O = b * E - v * P + w * x + y * k - T * S + $ * M;
  if (Math.abs(O) < 1e-12) return null;
  const _ = 1 / O;
  return [
    (r * E - a * P + l * x) * _,
    (s * P - n * E - o * x) * _,
    (g * $ - p * T + m * y) * _,
    (u * T - h * $ - d * y) * _,
    (a * k - i * E - l * S) * _,
    (e * E - s * k + o * S) * _,
    (p * w - f * $ - m * v) * _,
    (c * $ - u * w + d * v) * _,
    (i * P - r * k + l * M) * _,
    (n * k - e * P - o * M) * _,
    (f * T - g * w + m * b) * _,
    (h * w - c * T - d * b) * _,
    (r * S - i * x - a * M) * _,
    (e * x - n * S + s * M) * _,
    (g * v - f * y - p * b) * _,
    (c * y - h * v + u * b) * _
  ];
}
function hp(t, e, n, s) {
  const o = 1 / Math.tan(t * lp / 2), i = 1 / (n - s);
  return [o / e, 0, 0, 0, 0, o, 0, 0, 0, 0, (s + n) * i, -1, 0, 0, 2 * s * n * i, 0];
}
function up(t, e, n, s, o, i) {
  const r = 1 / (e - t), a = 1 / (s - n), l = 1 / (i - o);
  return [2 * r, 0, 0, 0, 0, 2 * a, 0, 0, 0, 0, -2 * l, 0, -(e + t) * r, -(s + n) * a, -(i + o) * l, 1];
}
function dp(t, e, n = [0, 1, 0]) {
  const s = tn(Nn(t, e)), o = tn(ao(n, s)), i = ao(s, o);
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
    -Oe(o, t),
    -Oe(i, t),
    -Oe(s, t),
    1
  ];
}
function jt(t, e) {
  const n = t[0] * e[0] + t[4] * e[1] + t[8] * e[2] + t[12], s = t[1] * e[0] + t[5] * e[1] + t[9] * e[2] + t[13], o = t[2] * e[0] + t[6] * e[1] + t[10] * e[2] + t[14], i = t[3] * e[0] + t[7] * e[1] + t[11] * e[2] + t[15];
  return i === 1 || i === 0 ? [n, s, o] : [n / i, s / i, o / i];
}
const qM = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  compose: Yr,
  fromQuat: oe,
  identity: No,
  invert: jr,
  lookAt: dp,
  multiply: At,
  orthographic: up,
  perspective: hp,
  scaling: Ke,
  transformPoint: jt,
  translation: Ne,
  transpose: cp
}, Symbol.toStringTag, { value: "Module" })), Is = {
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
}, tl = {
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
function fp(t) {
  let e = t.trim().toLowerCase();
  e = e.replace(/\.ease(in|out|inout)$/, ".$1");
  const n = /^([a-z]+\d?)(\(.*\))?$/.exec(e);
  return n && n[1] !== "steps" && e !== "none" && e !== "linear" && (e = `${n[1]}.out${n[2] ?? ""}`), e;
}
Ft({ type: "bounce", mode: "in" });
Ft({ type: "bounce", mode: "in-out" });
function lo(t) {
  const e = n0.get(t.trim().toLowerCase());
  if (e) return e;
  const n = fp(t), s = /^steps\(\s*(\d+)\s*\)$/.exec(n);
  if (s) {
    const r = { type: "steps", count: Math.max(1, Number.parseInt(s[1], 10)) + 1, position: "none" };
    return { easing: r, fn: Ft(r) };
  }
  const o = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(n);
  if (o) {
    const [, i, r, a] = o, l = (a ?? "").split(",").map((u) => Number.parseFloat(u)).filter((u) => Number.isFinite(u)), c = r === "inout" ? "in-out" : r;
    if (i === "back" && l.length === 0 && n in Is)
      return { easing: { type: "cubic-bezier", points: Is[n] } };
    const h = i === "elastic" ? { type: "elastic", mode: c, ...l[0] !== void 0 && { amplitude: l[0] }, ...l[1] !== void 0 && { period: l[1] } } : i === "bounce" ? { type: "bounce", mode: c } : { type: "back", mode: c, ...l[0] !== void 0 && { overshoot: l[0] } };
    return { easing: h, fn: Ft(h) };
  }
  return n in tl ? { easing: tl[n] } : n in Is ? { easing: { type: "cubic-bezier", points: Is[n] } } : { easing: "ease-out" };
}
const n0 = /* @__PURE__ */ new Map();
function Kr(t, e) {
  return n0.set(
    t.trim().toLowerCase(),
    e.bezier ? { easing: { type: "cubic-bezier", points: e.bezier }, fn: e.fn } : { fn: e.fn, requiresBaking: "custom" }
  ), t;
}
function er(t) {
  let e = t >>> 0;
  return () => {
    e = e + 1831565813 >>> 0;
    let n = e;
    return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const s0 = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function o0(t) {
  return typeof t == "string" && s0.test(t);
}
function pp(t = 1) {
  let e = er(t);
  const n = (l, c) => ((...h) => h.length >= l ? c(...h) : (u) => c(...h, u)), s = (l, c, h) => Math.min(Math.max(h, Math.min(l, c)), Math.max(l, c)), o = (l, c, h, u, d) => c === l ? h : h + (d - l) / (c - l) * (u - h), i = (l, c) => {
    if (typeof l == "number") return l === 0 ? c : Math.round(c / l) * l;
    if (Array.isArray(l)) return el(l, c, 1 / 0);
    if ("values" in l) return el(l.values, c, l.radius ?? 1 / 0);
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
        for (const d of Object.keys(l))
          u[d] = io(l[d])(l[d], c[d], h);
        return u;
      }
      return io(l)(l, c, h);
    }),
    wrap: ((l, c, h) => {
      if (Array.isArray(l)) {
        const p = l, m = (b) => p[(Math.round(b) % p.length + p.length) % p.length];
        return c === void 0 ? m : m(c);
      }
      const u = l, f = c - u, g = (p) => f === 0 ? u : ((p - u) % f + f) % f + u;
      return h === void 0 ? g : g(h);
    }),
    wrapYoyo: n(3, (l, c, h) => {
      const u = c - l;
      if (u === 0) return l;
      const d = ((h - l) % (u * 2) + u * 2) % (u * 2);
      return l + (d > u ? u * 2 - d : d);
    }),
    snap: n(2, i),
    random: ((l, c, h, u) => {
      if (Array.isArray(l)) {
        const f = () => l[Math.floor(e() * l.length)];
        return c === !0 ? f : f();
      }
      const d = () => r(l, c, h);
      return u ? d : d();
    }),
    shuffle: (l) => {
      for (let c = l.length - 1; c > 0; c--) {
        const h = Math.floor(e() * (c + 1));
        [l[c], l[h]] = [l[h], l[c]];
      }
      return l;
    },
    distribute: ({ base: l = 0, amount: c, each: h, from: u = "start", ease: d }) => (f, g, p) => {
      const m = p.length, v = Wr(f, m, { ...c !== void 0 ? { amount: c } : { each: h ?? 1 }, from: u }), w = c !== void 0 ? c : (h ?? 1) * Eh(m, u), y = d && w > 0 ? d(v / w) * w : v;
      return l + y;
    },
    pipe: (...l) => (c) => l.reduce((h, u) => u(h), c),
    splitColor: (l) => gp(l),
    getUnit: (l) => typeof l == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(l.trim())?.[1] ?? "",
    seed: (l) => {
      e = er(l);
    },
    resolveRandomString: (l) => {
      const c = s0.exec(l)?.[1] ?? "";
      if (c.startsWith("[")) {
        const g = c.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean).map((p) => Number.isFinite(Number(p)) ? Number(p) : p.replace(/^['"]|['"]$/g, ""));
        return g[Math.floor(e() * g.length)];
      }
      const [h, u, d] = c.split(",").map((f) => Number.parseFloat(f));
      return r(h, u, Number.isFinite(d) ? d : void 0);
    }
  };
}
function el(t, e, n) {
  let s = e, o = 1 / 0;
  for (const i of t) {
    const r = Math.abs(i - e);
    r < o && (o = r, s = i);
  }
  return o <= n ? s : e;
}
function gp(t) {
  const e = t.trim(), n = /^#([0-9a-f]{3,8})$/i.exec(e)?.[1];
  if (n) {
    const i = (n.length <= 4 ? [...n].map((r) => r + r).join("") : n).match(/../g).map((r) => Number.parseInt(r, 16));
    return i.length >= 4 ? [i[0], i[1], i[2], Math.round(i[3] / 255 * 1e3) / 1e3] : [i[0], i[1], i[2]];
  }
  const s = (/rgba?\(([^)]+)\)/i.exec(e)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((o) => Number.parseFloat(o));
  return s.length >= 4 ? [s[0], s[1], s[2], s[3]] : [s[0] ?? 0, s[1] ?? 0, s[2] ?? 0];
}
const mp = /^([+-])=\s*(-?[\d.]+)$/, yp = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function qn(t, e) {
  const n = e.scale ?? 1, s = (c) => Number.parseFloat(c) * n;
  if (t === void 0) return e.cursor;
  if (typeof t == "number") return t * n;
  const o = t.trim();
  if (o === "") return e.cursor;
  const i = mp.exec(o);
  if (i) {
    const c = s(i[2]);
    return e.cursor + (i[1] === "-" ? -c : c);
  }
  const r = yp.exec(o);
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
function bp(t) {
  if (typeof t != "object" || t === null) return !1;
  const e = t;
  return e.grid !== void 0 || e.from === "random" || Array.isArray(e.from) || e.ease !== void 0 || e.axis !== void 0;
}
function wp(t, e, n = {}) {
  if (t === 0) return [];
  const s = e.grid === "auto" ? Math.max(1, Math.min(t, n.columnsFromLayout?.() ?? t)) : Array.isArray(e.grid) ? Math.max(1, e.grid[1]) : t, o = Array.isArray(e.grid) ? Math.max(1, e.grid[0]) : Math.ceil(t / s), i = (g) => ({ x: g % s, y: Math.floor(g / s) }), r = e.from ?? "start", a = Array.isArray(r) ? { x: r[0] * (s - 1), y: r[1] * (o - 1) } : typeof r == "number" ? i(Math.max(0, Math.min(t - 1, r))) : r === "end" ? i(t - 1) : r === "center" || r === "edges" ? { x: (s - 1) / 2, y: (o - 1) / 2 } : { x: 0, y: 0 }, l = (g) => {
    const { x: p, y: m } = i(g), b = Math.abs(p - a.x), v = Math.abs(m - a.y);
    return e.axis === "x" ? b : e.axis === "y" ? v : Math.hypot(b, v);
  };
  let c = Array.from({ length: t }, (g, p) => l(p));
  const h = Math.max(...c);
  if (r === "edges" && (c = c.map((g) => h - g)), r === "random") {
    const g = n.random ?? Math.random;
    c = c.map(() => g() * h);
  }
  const u = e.amount !== void 0 ? e.amount : (e.each ?? 0) * h, d = e.ease ? lo(e.ease) : void 0, f = d ? d.fn ?? Ft(d.easing) : void 0;
  return c.map((g) => {
    const p = h === 0 ? 0 : g / h;
    return (f ? f(p) : p) * u;
  });
}
const Xr = /* @__PURE__ */ new Set([
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
]), kp = {
  rotation: "rotate",
  rotationZ: "rotate",
  rotationX: "rotateX",
  rotationY: "rotateY",
  transformPerspective: "perspective",
  perspective: "childPerspective"
};
function Vs(t) {
  const e = {}, n = {};
  for (const [s, o] of Object.entries(t))
    Xr.has(s) ? e[s] = o : n[kp[s] ?? s] = o;
  return { config: e, properties: n };
}
function co(t, e) {
  return t === void 0 ? e : t * 1e3;
}
function nr(t, e) {
  if (t !== void 0)
    return typeof t == "number" ? { each: t * 1e3 } : bp(t) ? { offsets: wp(e?.count ?? 0, t, e ?? {}).map((s) => s * 1e3) } : {
      ...t.each !== void 0 && { each: t.each * 1e3 },
      ...t.amount !== void 0 && { amount: t.amount * 1e3 },
      ...t.from !== void 0 && { from: t.from }
    };
}
const vp = {
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
function i0(t) {
  return vp[t];
}
function Mp(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : t;
  if (!e || typeof e.path != "string" && !Array.isArray(e.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(e.path))
    n = Qf(e.path, { curviness: e.curviness });
  else if (xs(e.path))
    n = e.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${e.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const s = { pathData: n };
  return e.autoRotate !== void 0 && e.autoRotate !== !1 && (s.autoRotate = !0, typeof e.autoRotate == "number" && (s.rotateOffset = e.autoRotate)), e.matrix && (s.matrix = e.matrix), { config: s, start: e.start ?? 0, end: e.end ?? 1 };
}
function xp(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : { ...t };
  return { ...e, start: e.end ?? 1, end: e.start ?? 0 };
}
function r0(t) {
  return typeof t == "object" && t !== null && "shape" in t ? t.shape : t;
}
function Sp(t) {
  if (t.morphSVG === void 0) return t;
  const { morphSVG: e, ...n } = t, s = r0(e);
  if (typeof s != "string" || !xs(s))
    throw new Error(
      `gsap-compat: morphSVG "${String(s)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: s };
}
function Tp(t, e) {
  if (t === !0) return [0, e];
  if (t === !1) return [0, 0];
  if (typeof t == "number") return [0, nl(t, e)];
  const n = t.trim().split(/[\s,]+/).filter(Boolean), s = (r) => {
    const a = Number.parseFloat(r);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${t}" is not a length or percentage`);
    return nl(r.endsWith("%") ? e * a / 100 : a, e);
  };
  if (n.length === 0) return [0, e];
  if (n.length === 1) return [0, s(n[0])];
  const o = s(n[0]), i = s(n[1]);
  return o <= i ? [o, i] : [i, o];
}
function Ep(t, e) {
  const [n, s] = Tp(t, e);
  return { strokeDasharray: [s - n, e], strokeDashoffset: -n };
}
function Ap(t, e) {
  if (t.drawSVG === void 0) return t;
  const { drawSVG: n, ...s } = t;
  return { ...s, ...Ep(n, e) };
}
function $p(t) {
  if (t.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return t;
}
function nl(t, e) {
  return Math.max(0, Math.min(e, t));
}
function Pp(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++) e = Math.imul(e ^ t.charCodeAt(n), 16777619);
  return e >>> 0;
}
function Ip(t, e, n) {
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
      seed: o.seed ?? Pp(`${e}|${o.text}`)
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
function Ur(t) {
  return Math.max(0.1, t / 25);
}
function Op(t, e) {
  const n = typeof e == "number" ? { velocity: e } : e;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const s = n.friction ?? (n.resistance !== void 0 ? Ur(n.resistance) : void 0), o = {
    from: t,
    velocity: n.velocity,
    ...s !== void 0 && { friction: s },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? o.end = [n.end(oo(o))] : n.end !== void 0 && (o.end = Array.isArray(n.end) ? [...n.end] : n.end), o;
}
function _p(t) {
  const e = t === !0 ? {} : typeof t == "string" ? { preset: t } : t;
  if (e.preset !== void 0 && !(e.preset in ai))
    throw new Error(
      `gsap-compat: unknown spring preset "${e.preset}" — use one of ${Object.keys(ai).join(", ")}`
    );
  return {
    ...e.preset ? ai[e.preset] : {},
    ...e.stiffness !== void 0 && { stiffness: e.stiffness },
    ...e.damping !== void 0 && { damping: e.damping },
    ...e.mass !== void 0 && { mass: e.mass },
    ...e.restDelta !== void 0 && { restDelta: e.restDelta }
  };
}
function Hp(t, e) {
  if (t === !0 || typeof t == "string") return;
  const n = t.velocity;
  return typeof n == "number" ? n : n?.[e];
}
class xn {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = er(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(e = {}) {
    this.options = e, this.timeline = new It({
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
    return this.build(e, void 0, Yn(n), s);
  }
  /** Animate from the given values to where the property already is. */
  from(e, n, s) {
    const { config: o, properties: i } = Vs(Yn(n)), { motionPath: r, text: a, scrambleText: l, ...c } = i, h = this.targetsOf(e)[0], u = { ...o };
    for (const g of Object.keys(c))
      u[g] = this.resolveStart(h, g);
    r !== void 0 && (u.motionPath = xp(r));
    const d = {}, f = String(this.resolveStart(h, "text"));
    return a !== void 0 && (d.text = pi(a), u.text = typeof a == "object" ? { ...a, value: f } : f), l !== void 0 && (d.text = pi(l), u.scrambleText = typeof l == "object" ? { ...l, text: f } : f), this.build(e, { ...c, ...d }, u, s);
  }
  /** Animate between two explicit sets of values. */
  fromTo(e, n, s, o) {
    const { properties: i } = Vs(Yn(n));
    return this.build(e, i, Yn(s), o);
  }
  /** Set values instantly — a single held keyframe. */
  set(e, n, s) {
    return this.build(e, void 0, { ...Yn(n), duration: 0 }, s);
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
    const n = Math.max(0, qn(e, this.context()));
    return this.previousStart = n, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), n;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(e) {
    return qn(e, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(e, n) {
    return this.labels.set(e, qn(n, this.context())), this;
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
    const s = qn(n, this.context());
    for (const i of e.timeline.tracks) {
      if (!("keyframes" in i)) continue;
      const r = tr({
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
    const { config: i, properties: r } = Vs(s), { motionPath: a, text: l, scrambleText: c, inertia: h, ...u } = r, d = this.targetsOf(e), f = qn(o, this.context()), g = co(i.delay, 0), p = co(i.duration, 500), m = nr(i.stagger, {
      count: d.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(d) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), b = this.easingFor(i.ease), v = [], w = i.spring;
    let y = 0, T = !1;
    for (const [P, E] of Object.entries(u)) {
      const O = E;
      let _ = n?.[P] !== void 0 ? n[P] : this.resolveStart(d[0], P);
      if (typeof _ != typeof O && (this.warn(
        `no usable start value for "${P}" on "${d[0]}" — it will snap to ${String(O)}. Use fromTo() to animate it.`
      ), _ = O), w !== void 0 && (typeof _ != "number" || typeof O != "number") && this.warn(`spring works on numbers, so "${P}" on "${d[0]}" eases instead`), w !== void 0 && typeof _ == "number" && typeof O == "number") {
        const X = {
          ..._p(w),
          from: _,
          to: O,
          velocity: Hp(w, P) ?? this.options.startVelocity?.(d[0], P) ?? 0
        }, J = this.nextTrackId(`${d[0]}-${P}-spring`), q = {
          id: J,
          target: d[0],
          ...d.length > 1 && { targets: d },
          ...m && d.length > 1 && { stagger: m },
          property: P,
          kind: "spring",
          spring: X,
          delay: f + g
        };
        this.timeline.addTrack(q), v.push(J), y = Math.max(y, Ad(X));
        for (const R of d) this.lastValues.set(`${R}|${P}`, O);
        continue;
      }
      T = !0;
      const L = this.keyframesFor(_, O, p, b, i.ease), B = this.nextTrackId(`${d[0]}-${P}`);
      this.timeline.addTrack(
        tr({
          id: B,
          target: d[0],
          ...d.length > 1 && { targets: d },
          ...m && d.length > 1 && { stagger: m },
          property: P,
          delay: f + g,
          keyframes: L,
          // A quaternion is a rotation: it turns the short way round (see Track.interpolation).
          ...P === "quaternion" && { interpolation: "slerp" }
        })
      ), v.push(B);
      for (const X of d) this.lastValues.set(`${X}|${P}`, O);
    }
    const $ = Ip({ text: l, scrambleText: c }, d[0], p);
    if ($) {
      const P = n?.text ?? n?.scrambleText, E = P !== void 0 ? pi(P) : this.resolveStart(d[0], "text"), O = this.nextTrackId(`${d[0]}-text`), _ = {
        id: O,
        target: d[0],
        ...d.length > 1 && { targets: d },
        ...m && d.length > 1 && { stagger: m },
        property: "text",
        textConfig: { from: typeof E == "string" ? E : String(E ?? ""), ...$ },
        delay: f + g,
        keyframes: this.keyframesFor(0, 1, p, b, i.ease)
      };
      this.timeline.addTrack(_), v.push(O);
      for (const L of d) this.lastValues.set(`${L}|text`, $.to);
    }
    if (a !== void 0) {
      const { config: P, start: E, end: O } = Mp(a), _ = this.nextTrackId(`${d[0]}-motionPath`), L = {
        id: _,
        target: d[0],
        ...d.length > 1 && { targets: d },
        ...m && d.length > 1 && { stagger: m },
        property: "motionPath",
        motionPathConfig: P,
        delay: f + g,
        keyframes: this.keyframesFor(E, O, p, b, i.ease)
      };
      this.timeline.addTrack(L), v.push(_);
    }
    if (h !== void 0)
      for (const [P, E] of Object.entries(h)) {
        const O = this.resolveStart(d[0], P);
        if (typeof O != "number") {
          this.warn(`inertia on "${P}" needs a numeric start value; skipped`);
          continue;
        }
        const _ = Op(O, E), L = this.nextTrackId(`${d[0]}-${P}-inertia`), B = {
          id: L,
          target: d[0],
          ...d.length > 1 && { targets: d },
          ...m && d.length > 1 && { stagger: m },
          property: P,
          kind: "inertia",
          inertia: _,
          delay: f + g
        };
        this.timeline.addTrack(B), v.push(L), y = Math.max(y, Ms(_));
        for (const X of d) this.lastValues.set(`${X}|${P}`, vs(_));
      }
    const k = ((h !== void 0 || w !== void 0) && !T && !$ && a === void 0 ? y : Math.max(p, y)) + (m && d.length > 1 ? Oo(d.length, m) : 0), x = f + g + k;
    return this.previousStart = f + g, this.previousEnd = x, this.cursor = Math.max(this.cursor, x), {
      trackIds: v,
      start: f + g,
      end: x,
      kill: () => {
        for (const P of v) this.timeline.removeTrack(P);
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
    const a = typeof i == "string" ? lo(i) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && so(o)) {
      const c = a?.fn ?? Ft(o);
      return [r, ...Nh(r, { time: s, value: n }, c, { intervalMs: this.options.bakeIntervalMs })];
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
    const r = i0(n);
    return r !== void 0 ? (this.warn(
      `no start value for "${n}" on "${e}" — using the static default ${r}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), r) : (this.warn(`no start value or default for "${n}" on "${e}" — using 0`), 0);
  }
  easingFor(e) {
    if (e !== void 0) {
      if (typeof e == "string") return lo(e).easing;
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
function pi(t) {
  if (typeof t == "string") return t;
  if (t && typeof t == "object") {
    const e = t;
    return String(e.value ?? e.text ?? "");
  }
  return String(t ?? "");
}
function Cp(t) {
  return new xn(t);
}
function Yn(t) {
  return $p(Sp(t));
}
function Rp(t) {
  return !Array.isArray(t) || t.length !== 4 ? null : `matrix3d(${oe(Pe(t)).map((n) => Math.round(n * 1e6) / 1e6 + 0).join(", ")})`;
}
const Lp = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), Fp = "#ffffff", Wp = "rgba(0, 0, 0, 0.5)";
function Np(t) {
  const e = [];
  if (t.blur !== void 0 && e.push(`blur(${Math.max(0, t.blur)}px)`), t.brightness !== void 0 && e.push(`brightness(${Math.max(0, t.brightness)})`), t.glow !== void 0 && e.push(`drop-shadow(0 0 ${Math.max(0, t.glow)}px ${t.glowColor ?? Fp})`), t.shadowX !== void 0 || t.shadowY !== void 0 || t.shadowBlur !== void 0) {
    const n = t.shadowX ?? 0, s = t.shadowY ?? 0, o = Math.max(0, t.shadowBlur ?? 0);
    e.push(`drop-shadow(${n}px ${s}px ${o}px ${t.shadowColor ?? Wp})`);
  }
  return e.length > 0 ? e.join(" ") : null;
}
function Dp(t, e) {
  const n = t.childNodes.length === 1 ? t.firstChild : null;
  if (n && n.nodeType === 3) {
    const s = n;
    s.data !== e && (s.data = e);
    return;
  }
  t.textContent !== e && (t.textContent = e);
}
function Bp(t) {
  if (!("ownerSVGElement" in t)) return;
  const e = t.style;
  !e || e.transformBox || (e.transformBox = "fill-box", e.transformOrigin || (e.transformOrigin = "50% 50%"));
}
const sl = /* @__PURE__ */ new Set([
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
]), zp = /* @__PURE__ */ new Set([
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
]), qp = [
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
], Yp = /* @__PURE__ */ new Set(["childPerspective", "perspectiveOriginX", "perspectiveOriginY"]), jp = /* @__PURE__ */ new Set(["originX", "originY"]), Kp = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), Xp = /* @__PURE__ */ new Set(["drawOn"]), Up = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, ol = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, Gp = "http://www.w3.org/2000/svg";
class Xe {
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
      if (!(g === "x" && l) && !(g === "y" && c) && !((g === "rotate" || g === "rotateZ") && h) && !Xp.has(g)) {
        if (zp.has(g))
          (s ??= {})[g] = p;
        else if (Yp.has(g))
          typeof p == "number" && ((o ??= {})[g] = p);
        else if (jp.has(g))
          typeof p == "number" && ((i ??= {})[g] = p);
        else if (Kp.has(g))
          typeof p == "number" && ((r ??= {})[g] = p);
        else if (Lp.has(g))
          (a ??= {})[g] = p;
        else if (g !== "perspective") {
          if (g !== "shine") if (g === "text" && typeof p == "string")
            Dp(e, p);
          else if (g === "d" && typeof p == "string") {
            const m = e;
            (m.tagName?.toLowerCase() === "path" ? m : m.querySelector?.("path"))?.setAttribute?.("d", p);
          } else
            this.applyStyleProperty(e, g, p);
        }
      }
    const u = n.get("shine");
    typeof u == "number" && this.applyShine(e, u);
    const d = [], f = n.get("perspective");
    if (typeof f == "number" && f > 0 && d.push(`perspective(${f}px)`), s)
      for (const g of qp) {
        const p = s[g];
        if (p === void 0) continue;
        const m = this.buildTransformPart(g, p);
        m && d.push(m);
      }
    if (d.length > 0 && (e.style.transform = d.join(" "), Bp(e)), o && (o.childPerspective !== void 0 && (e.style.perspective = `${o.childPerspective}px`), (o.perspectiveOriginX !== void 0 || o.perspectiveOriginY !== void 0) && (e.style.perspectiveOrigin = `${o.perspectiveOriginX ?? 50}% ${o.perspectiveOriginY ?? 50}%`)), i) {
      const g = i.originX ?? 50, p = i.originY ?? 50;
      e.style.transformOrigin = `${g}% ${p}%`;
    }
    if (r) {
      const g = r.clipTop ?? 0, p = r.clipRight ?? 0, m = r.clipBottom ?? 0, b = r.clipLeft ?? 0;
      e.style.clipPath = `inset(${g}% ${p}% ${m}% ${b}%)`;
    }
    if (a) {
      const g = Np(a);
      g && (e.style.filter = g);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(e, n) {
    if (e === "quaternion") return Rp(n);
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
    if (e.namespaceURI === Gp && n in ol) {
      const a = Array.isArray(s) ? s.join(", ") : String(s);
      e.style[ol[n]] = a;
      return;
    } else n === "fill" && e.dataset?.elementType === "text" ? o = "color" : o = Up[n] ?? n;
    let r;
    typeof s == "number" ? sl.has(n) || sl.has(o) ? r = `${s}px` : r = String(s) : Array.isArray(s) ? r = s.join(", ") : r = s, e.style[o] = r;
  }
}
const Vp = {
  request: (t) => requestAnimationFrame(t),
  cancel: (t) => cancelAnimationFrame(t)
};
class Jp {
  adapter = new Xe();
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
  utils = pp();
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
    this.scheduler = e.scheduler ?? Vp, this.rootOption = e.root, this.onWarning = e.onWarning;
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
      gi(s) && this.currentCollector?.touch(s, o), n.push(o);
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
    if (gi(e)) return [e];
    if (!Zp(e)) return [e];
    const n = [];
    for (const s of Array.from(e))
      n.push(...this.targetsOf(s));
    return n;
  }
  nameFor(e) {
    return gi(e) ? this.elementName(e) : this.objectName(e);
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
function gi(t) {
  return typeof t == "object" && t !== null && t.nodeType === 1;
}
function Zp(t) {
  if (Array.isArray(t)) return !0;
  const e = t;
  return typeof e.length == "number" && typeof e.item == "function";
}
function ho(t) {
  const e = t.style;
  if (!e) return t.getBoundingClientRect();
  const n = e.transform;
  e.transform = "none";
  const s = t.getBoundingClientRect();
  return e.transform = n, s;
}
const il = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function Qp(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function tg(t) {
  const e = t.getScreenCTM?.();
  if (e) return [e.a, e.b, e.c, e.d, e.e, e.f];
  const n = t.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function eg(t, e) {
  const n = typeof t == "string" || Array.isArray(t) || il(t) ? { path: t } : t, { align: s, alignOrigin: o, path: i, ...r } = n, a = ($) => {
    const M = il($) ? $ : e.query($);
    return M || e.warn(`gsap-compat: motionPath could not find "${String($)}"`), M;
  };
  let l = null, c = "";
  if (Array.isArray(i) || typeof i == "string" && xs(i))
    c = i;
  else {
    l = a(i);
    const $ = l && Br({ tag: l.localName, attributes: Qp(l) });
    l && !$ && e.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), c = $ ?? "";
  }
  const h = { ...r, path: c };
  if (s === void 0 || s === !1) return h;
  const u = s === !0 ? l : a(s);
  if (!u)
    return s === !0 && e.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const d = e.targets[0];
  if (!d) return h;
  const [f, g, p, m, b, v] = tg(u), w = ho(d), [y, T] = o ?? [0.5, 0.5];
  for (const $ of e.targets.slice(1)) {
    const M = ho($);
    if (Math.abs(M.left - w.left) > 0.5 || Math.abs(M.top - w.top) > 0.5) {
      e.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [f, g, p, m, b - w.left - y * w.width, v - w.top - T * w.height], h;
}
const a0 = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function l0(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function c0(t) {
  if (!t) return null;
  const e = Br({ tag: t.localName, attributes: l0(t) });
  return e || (t.querySelector("path")?.getAttribute("d") ?? null);
}
function ng(t, e, n) {
  const s = r0(t);
  if (typeof s == "string" && xs(s)) return s;
  const o = a0(s) ? s : typeof s == "string" ? e(s) : null, i = c0(o);
  return i || (n(`gsap-compat: morphSVG could not find a shape for "${String(s)}"`), "");
}
const sg = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function og(t, e = document) {
  return (typeof t == "string" ? Array.from(e.querySelectorAll(t)) : a0(t) ? [t] : Array.from(t)).map((s) => {
    if (s.localName === "path") return s;
    const o = Br({ tag: s.localName, attributes: l0(s) });
    if (!o || !s.parentNode) return s;
    const i = s.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const r of Array.from(s.attributes))
      sg.has(r.name) || i.setAttribute(r.name, r.value);
    return i.setAttribute("d", o), s.parentNode.replaceChild(i, s), i;
  });
}
const rl = 0.3;
class ig {
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
    this.dragging = !0, this.passedTolerance = !1, this.startX = e, this.startY = n, this.lastX = e, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = al(), this.options.onPress?.(this.stateFrom(0, 0, s));
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
    const s = al(), o = Math.max(1, s - this.lastTime);
    this.lastTime = s;
    const i = e / o * 1e3, r = n / o * 1e3;
    this.velocityX += (i - this.velocityX) * rl, this.velocityY += (r - this.velocityY) * rl;
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
function al() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function rg(t, e, n) {
  let s = { delta: 0, line: null }, o = n;
  for (const i of t)
    for (const r of e) {
      const a = Math.abs(r - i);
      a <= o && (o = a, s = { delta: r - i, line: r });
    }
  return s;
}
function ag(t, e) {
  return e <= 0 ? [] : t.map((n) => Math.round(n / e) * e);
}
class h0 {
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
    this.options = e, this.x = e.initialX ?? 0, this.y = e.initialY ?? 0, this.observer = new ig({
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
    const o = (this.options.axis ?? "both") === "y" ? this.y : this.x, i = lg(o / s);
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
      ...ag([s], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], i = rg([s], o, this.snapThreshold());
    s += i.delta, n === "x" ? this.snappedX = i.line : this.snappedY = i.line;
    const r = this.options.bounds;
    if (r) {
      const a = n === "x" ? r.minX : r.minY, l = n === "x" ? r.maxX : r.maxY;
      a !== void 0 && (s = Math.max(a, s)), l !== void 0 && (s = Math.min(l, s));
    }
    return s;
  }
}
function lg(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
function YM(t) {
  const e = new h0(t);
  return e.start(), e;
}
const cg = { x: "x", y: "y", "x,y": "both" }, sr = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function ll(t, e) {
  const n = ho(t), s = e.getBoundingClientRect();
  return {
    minX: s.left - n.left,
    maxX: s.right - n.right,
    minY: s.top - n.top,
    maxY: s.bottom - n.bottom
  };
}
function cl(t) {
  return Array.isArray(t) ? [...t] : t;
}
function hg(t, e, n, s = {}) {
  const [o] = e.resolveTargets(n), i = o ? e.elementFor(o) : void 0;
  if (!o || !i)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  if (s.type === "rotation") return ug(t, e, o, i, s);
  const r = cg[s.type ?? "x,y"], a = () => {
    const p = e.appliedValue(o, "x"), m = e.appliedValue(o, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof m == "number" ? m : 0 };
  }, l = typeof s.bounds == "string" ? e.query(s.bounds) : sr(s.bounds) ? s.bounds : null, h = { bounds: (!l && s.bounds && !sr(s.bounds) ? s.bounds : void 0) ?? (l ? ll(i, l) : void 0) };
  let u = null;
  const d = () => {
    u?.kill(), u = null;
  }, f = (p) => {
    const m = s.inertia === !0 ? {} : s.inertia, b = m.friction ?? (m.resistance !== void 0 ? Ur(m.resistance) : 4), v = a(), w = h.bounds ?? {};
    let y, T;
    const $ = m.end;
    if (Array.isArray($)) {
      const S = oo({ from: v.x, velocity: r === "y" ? 0 : p.x, friction: b }), k = oo({ from: v.y, velocity: r === "x" ? 0 : p.y, friction: b });
      let x = $[0];
      for (const P of $)
        Math.hypot(P.x - S, P.y - k) < Math.hypot(x.x - S, x.y - k) && (x = P);
      x && (y = [x.x], T = [x.y]);
    } else typeof $ == "number" ? (y = $, T = $) : $ && (y = cl($.x), T = cl($.y));
    const M = {};
    r !== "y" && (M.x = { velocity: p.x, friction: b, min: w.minX, max: w.maxX, end: y }), r !== "x" && (M.y = { velocity: p.y, friction: b, min: w.minY, max: w.maxY, end: T }), u = t.to(i, { inertia: M, onComplete: () => s.onThrowComplete?.() });
  }, g = new h0({
    target: i,
    axis: r,
    snap: s.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: a,
    onPress: () => {
      d(), l && (h.bounds = ll(i, l)), s.onPress?.();
    },
    onDrag: (p) => {
      e.apply(o, r === "x" ? { x: p.x } : r === "y" ? { y: p.y } : { x: p.x, y: p.y }), s.onDrag?.(p);
    },
    onRelease: () => {
      const p = g.velocity;
      s.onRelease?.(p), s.inertia && f(p);
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
      d(), g.destroy();
    }
  };
}
function ug(t, e, n, s, o) {
  const i = typeof o.bounds == "object" && o.bounds !== null && !sr(o.bounds) ? o.bounds : {}, r = () => {
    const w = e.appliedValue(n, "rotate");
    return typeof w == "number" ? w : 0;
  }, a = (w) => Math.min(i.maxRotation ?? 1 / 0, Math.max(i.minRotation ?? -1 / 0, w));
  let l = null, c = !1, h, u = { x: 0, y: 0 }, d = 0, f = 0, g = [];
  const p = (w) => Math.atan2(w.clientY - u.y, w.clientX - u.x) * 180 / Math.PI, m = (w) => {
    if (c) return;
    l?.kill(), l = null, c = !0, h = w.pointerId, s.setPointerCapture?.(w.pointerId);
    const y = s.getBoundingClientRect();
    u = { x: y.left + y.width / 2, y: y.top + y.height / 2 }, d = p(w), f = r(), g = [{ time: performance.now(), rotation: f }], o.onPress?.();
  }, b = (w) => {
    if (!c || w.pointerId !== h) return;
    const y = p(w);
    let T = y - d;
    T > 180 && (T -= 360), T < -180 && (T += 360), d = y, f += T;
    let $ = a(f);
    o.snap && ($ = a(Math.round($ / o.snap) * o.snap)), e.apply(n, { rotate: $ });
    const M = performance.now();
    for (g.push({ time: M, rotation: $ }); g.length > 2 && M - g[0].time > 100; ) g.shift();
    const S = { x: 0, y: 0 };
    o.onDrag?.(S);
  }, v = (w) => {
    if (!c || w.pointerId !== h) return;
    c = !1;
    const y = g[0], T = g[g.length - 1], $ = y && T ? (T.time - y.time) / 1e3 : 0, M = $ > 0 ? (T.rotation - y.rotation) / $ : 0;
    if (o.onRelease?.({ x: M, y: 0 }), !o.inertia) return;
    const S = o.inertia === !0 ? {} : o.inertia, k = S.friction ?? (S.resistance !== void 0 ? Ur(S.resistance) : 4), x = typeof S.end == "number" || Array.isArray(S.end) ? S.end : void 0;
    l = t.to(s, {
      inertia: {
        rotate: {
          velocity: M,
          friction: k,
          min: i.minRotation,
          max: i.maxRotation,
          end: Array.isArray(x) ? x.filter((P) => typeof P == "number") : x
        }
      },
      onComplete: () => o.onThrowComplete?.()
    });
  };
  return s.addEventListener("pointerdown", m), s.addEventListener("pointermove", b), s.addEventListener("pointerup", v), s.addEventListener("pointercancel", v), s.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return r();
    },
    destroy() {
      l?.kill(), s.removeEventListener("pointerdown", m), s.removeEventListener("pointermove", b), s.removeEventListener("pointerup", v), s.removeEventListener("pointercancel", v);
    }
  };
}
const dg = { opacity: 0, scale: 0.6 };
function fg(t) {
  const e = t.getBoundingClientRect();
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function hl(t) {
  const e = ho(t);
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function or(t, e) {
  const s = t.resolveTargets(e).map((r) => t.elementFor(r)).filter((r) => !!r), o = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  for (const r of s) {
    const a = fg(r);
    o.set(r, a);
    const l = u0(r);
    a && l !== void 0 && !i.has(l) && i.set(l, { element: r, box: a });
  }
  return { elements: s, boxes: o, ids: i };
}
const mi = /* @__PURE__ */ new WeakMap();
function ir(t, e, n, s = {}) {
  const o = s.duration ?? 0.6, i = s.ease ?? "power2.inOut", r = s.stagger ?? 0, a = s.scale !== !1, l = s.enter === void 0 ? dg : s.enter, c = new Set(n.elements);
  if (s.targets !== void 0)
    for (const f of t.resolveTargets(s.targets)) {
      const g = t.elementFor(f);
      g && c.add(g);
    }
  const h = [...c].sort(
    (f, g) => f === g ? 0 : f.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), u = e({ onComplete: s.onComplete });
  let d = 0;
  for (const f of h) {
    const g = hl(f);
    if (!g) continue;
    let p = n.boxes.get(f) ?? null, m;
    const b = u0(f), v = !p && b !== void 0 ? n.ids.get(b) : void 0;
    v && v.element !== f && (p = v.box, m = v.element);
    const [w] = t.resolveTargets(f);
    mi.get(f)?.timeline.removeTracks({ target: w });
    const y = d * r;
    if (!p) {
      if (l === !1) continue;
      u.fromTo(f, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...d0(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: o, ease: i, delay: y }, 0), mi.set(f, u), d++;
      continue;
    }
    const T = p.cx - g.cx, $ = p.cy - g.cy, M = a ? p.width / g.width : 1, S = a ? p.height / g.height : 1;
    if (!(Math.abs(T) > 0.5 || Math.abs($) > 0.5 || Math.abs(M - 1) > 1e-3 || Math.abs(S - 1) > 1e-3)) {
      const P = (E, O) => {
        const _ = t.appliedValue(w, E);
        return typeof _ == "number" && Math.abs(_ - O) > 1e-6;
      };
      (P("x", 0) || P("y", 0) || P("scaleX", 1) || P("scaleY", 1)) && u.set(f, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const x = s.fade === !0 && m !== void 0;
    u.fromTo(
      f,
      { x: T, y: $, scaleX: M, scaleY: S, ...x && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...x && { opacity: 1 }, duration: o, ease: i, delay: y },
      0
    ), x && m && hl(m) && u.fromTo(m, { opacity: 1 }, { opacity: 0, duration: o, ease: i, delay: y }, 0), mi.set(f, u), d++;
  }
  return u;
}
function u0(t) {
  return t.dataset?.flipId;
}
function d0(t) {
  const e = {};
  for (const n of Object.keys(t))
    e[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return e;
}
function pg(t, e = {}) {
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
  }, d = () => {
    const p = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: m } of i) {
      const b = (m.textContent ?? "").replace(/\s+/g, " ").trim(), v = gg(m, s.words), w = n.has("chars") ? v.flatMap(($) => mg($, s.chars)) : [], y = n.has("lines") ? bg(m, v, s.lines) : [];
      if (o) {
        !m.hasAttribute("aria-label") && b && m.setAttribute("aria-label", b);
        for (const $ of v) $.setAttribute("aria-hidden", "true");
      }
      if (n.has("words")) p.words.push(...v);
      else for (const $ of v) $.removeAttribute("class");
      p.chars.push(...w), p.lines.push(...y);
      const T = e.mask === "lines" ? y : e.mask === "words" ? v : e.mask === "chars" ? w : [];
      for (const $ of T) p.masks.push(wg($, `${s[e.mask]}-mask`));
    }
    r = p;
  }, f = {
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
      c || (u(), h(), d(), a = e.onSplit?.(f));
    },
    revert() {
      c = !0, l?.disconnect(), u(), h();
    }
  };
  d(), a = e.onSplit?.(f), e.autoSplit && g();
  function g() {
    const p = /* @__PURE__ */ new Map();
    let m = !1;
    const b = () => {
      if (m) return;
      m = !0;
      const w = () => {
        m = !1, f.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(w) : setTimeout(w, 0);
    };
    if (typeof ResizeObserver == "function") {
      l = new ResizeObserver((w) => {
        let y = !1;
        for (const T of w) {
          const $ = Math.round(T.contentRect.width), M = p.get(T.target);
          p.set(T.target, $), M !== void 0 && M !== $ && (y = !0);
        }
        y && b();
      });
      for (const w of t) l.observe(w);
    }
    const v = t[0]?.ownerDocument?.fonts;
    v && v.status !== "loaded" && v.ready.then(() => b());
  }
  return f;
}
function gg(t, e) {
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
function mg(t, e) {
  const n = t.ownerDocument, s = yg(t.textContent ?? "").map((o) => {
    const i = n.createElement("span");
    return i.className = e, i.style.display = "inline-block", i.textContent = o, i;
  });
  return t.replaceChildren(...s), s;
}
function yg(t) {
  const e = Intl.Segmenter;
  return e ? Array.from(new e(void 0, { granularity: "grapheme" }).segment(t), (n) => n.segment) : Array.from(t);
}
function bg(t, e, n) {
  const s = t.ownerDocument, o = new Map(e.map((g) => [g, g.getBoundingClientRect()])), i = [], r = (g) => {
    for (const p of Array.from(g.childNodes))
      p.nodeType === 3 || o.has(p) || p.tagName === "BR" ? i.push(p) : r(p);
  };
  r(t);
  const a = [];
  let l = null, c = 0, h = 0, u = !1, d = [];
  const f = () => {
    l = s.createElement("span"), l.className = n, l.style.display = "block", a.push(l), d = [];
  };
  for (const g of i) {
    if (g.tagName === "BR") {
      u = !0;
      continue;
    }
    const p = o.get(g);
    if (p && (!l || u || p.top > c + h) && (f(), c = p.top, h = p.height / 2, u = !1), !l) continue;
    const m = [];
    for (let w = g.parentNode; w && w !== t; w = w.parentNode) m.unshift(w);
    let b = 0;
    for (; b < d.length && b < m.length && d[b].original === m[b]; ) b++;
    d.length = b;
    let v = b === 0 ? l : d[b - 1].clone;
    for (const w of m.slice(b)) {
      const y = w.cloneNode(!1);
      v.appendChild(y), d.push({ original: w, clone: y }), v = y;
    }
    v.appendChild(g);
  }
  return t.replaceChildren(...a), a;
}
function wg(t, e) {
  const n = t.ownerDocument.createElement("span");
  return n.className = e, n.style.display = t.style.display === "block" ? "block" : "inline-block", n.style.overflow = "clip", n.style.paddingBottom = "0.12em", n.style.marginBottom = "-0.12em", t.replaceWith(n), n.appendChild(t), n;
}
const ul = {
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
function dl(t) {
  const e = t.trim().toLowerCase();
  if (e in ul) return ul[e];
  if (e.endsWith("%")) {
    const n = Number.parseFloat(e.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function f0(t) {
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
  const o = s[0] !== void 0 ? dl(s[0]) : void 0, i = s[1] !== void 0 ? dl(s[1]) : void 0;
  return {
    elementFraction: o ?? 0,
    viewportFraction: i ?? 0,
    offsetPx: e
  };
}
function hs(t, e, n) {
  const s = f0(n), o = s.absolutePx !== void 0 ? t.top + s.absolutePx : t.top + t.height * s.elementFraction, i = e * s.viewportFraction;
  return o - i + s.offsetPx;
}
function jM(t, e, n, s) {
  const o = hs(t, e, n), r = hs(t, e, s) - o;
  return r <= 0 ? o <= 0 ? 1 : 0 : p0(-o / r);
}
function p0(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t === 0 ? 0 : t;
}
function kg(t, e, n, s) {
  if (n <= 0) return e;
  const o = 1 - Math.exp(-(s / 1e3) / n);
  return t + (e - t) * o;
}
function fl(t, e, n, s, o) {
  const i = (h) => hs({ top: t + o(h), bottom: t + o(h) + e, height: e }, n, s), r = i(0), a = i(1);
  if (Math.sign(r) === Math.sign(a) || r === 0 || a === 0)
    return r === 0 ? 0 : a === 0 ? 1 : Math.abs(r) < Math.abs(a) ? 0 : 1;
  let l = 0, c = 1;
  for (let h = 0; h < 40; h++) {
    const u = (l + c) / 2;
    Math.sign(i(u)) === Math.sign(r) ? l = u : c = u;
  }
  return (l + c) / 2;
}
class vg {
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
function KM(t) {
  const e = new vg(t);
  return e.start(), e;
}
class Mg {
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
const xg = 0.15;
function Sg(t) {
  return typeof t == "object" && !Array.isArray(t) ? t : { snapTo: t };
}
function Tg(t, e, n) {
  const s = Os(t + e * xg);
  if (typeof n == "function") return Os(n(s));
  if (typeof n == "number")
    return n <= 0 ? t : Os(Math.round(s / n) * n);
  if (n.length === 0) return t;
  let o = n[0];
  for (const i of n)
    Math.abs(i - s) < Math.abs(o - s) && (o = i);
  return Os(o);
}
function Eg(t, e, n) {
  const s = t.duration ?? { min: 0.2, max: 0.8 };
  if (typeof s == "number") return s;
  const o = Math.min(1, Math.abs(e) / Math.max(1, n));
  return s.min + (s.max - s.min) * o;
}
class Ag {
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
  animate(e, n, s, o = Co, i) {
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
function Os(t) {
  return Math.max(0, Math.min(1, t));
}
class $g {
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
      const d = e.createElement("div");
      return d.textContent = `${a}${c}`, d.setAttribute("aria-hidden", "true"), d.className = "scroll-marker", Object.assign(d.style, {
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
      }), (n ?? e.body).appendChild(d), this.nodes.push(d), d;
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
const Pg = 120, bn = [], Hn = /* @__PURE__ */ new Set();
let yi = !1;
const Ig = () => {
  yi || Hn.size === 0 || (yi = !0, queueMicrotask(() => {
    yi = !1;
    for (const t of Hn) t.afterRefresh();
  }));
}, g0 = () => {
  for (const t of Hn) t.beforeRefresh();
  for (const t of bn) t.refresh();
  for (const t of Hn) t.afterRefresh();
};
let wn = { width: 0, height: 0 };
const pl = () => {
  const t = window.innerWidth, e = window.innerHeight, n = t === wn.width && e !== wn.height, s = Math.abs(e - wn.height) < wn.height * 0.25, o = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  n && s && o || (wn = { width: t, height: e }, g0());
};
class Do {
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
    this.timeline = e.timeline, this.options = e, this.snapper = new Ag((n) => this.scrollTo(n), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const e = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    e && !this.options.container && (this.pin = new Mg(e, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new $g(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), bn.length === 0 && typeof window < "u" && (wn = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", pl, { passive: !0 })), bn.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), bn.splice(bn.indexOf(this), 1), bn.length === 0 && typeof window < "u" && window.removeEventListener("resize", pl), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    g0();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(e) {
    return Hn.add(e), () => Hn.delete(e);
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
      if (this.startPx = e + hs(n, s, jn(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(n, s, e), this.pin) {
        const o = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(o.top - (this.startPx - e), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(s) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, e), this.lastScroll = null, this.updateFrom(e, !this.measured), this.measured = !0, Ig();
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
    this.targetProgress = s > 0 ? p0((e - this.startPx) / s) : e >= this.startPx ? 1 : 0, this.zone = s > 0 ? e <= this.startPx ? "before" : e >= this.endPx ? "after" : "active" : e >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(o, this.zone), n || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const e = this.options.scrub;
    return typeof e == "number" ? Math.max(0, e) : 0;
  }
  resolveEnd(e, n, s) {
    const o = jn(this.options.end) ?? "bottom top", i = typeof o == "string" ? o.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (i) {
      const r = Number.parseFloat(i[1]);
      return this.startPx + (i[2] === "%" ? n * r / 100 : r);
    }
    return s + hs(e, n, o);
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
    }, Pg));
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
    const n = Sg(e), s = () => {
      this.snapTimer = null;
      const o = this.endPx - this.startPx, i = this.scrollPosition();
      if (!this.running || o <= 0 || i <= this.startPx || i >= this.endPx) return;
      const r = (i - this.startPx) / o, a = this.startPx + Tg(r, this.releaseVelocity / o, n.snapTo) * o;
      Math.abs(a - i) < 1 || this.snapper.animate(i, a, Eg(n, a - i, this.viewportHeight()), n.ease);
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
    const s = n.getBoundingClientRect(), o = this.options.scroller?.getBoundingClientRect?.().left ?? 0, i = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, r = s.left - o - e.shiftAt(e.progress()), { start: a, end: l } = e.range(), c = (f) => a + f * (l - a), h = fl(r, s.width, i, jn(this.options.start) ?? "left right", e.shiftAt);
    this.startPx = c(h);
    const u = jn(this.options.end) ?? "right left", d = typeof u == "string" ? u.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = d ? this.startPx + Number.parseFloat(d[1]) : c(fl(r, s.width, i, u, e.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(e) {
    const n = (i, r) => {
      const a = jn(i) ?? r;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const l = f0(a);
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
      this.lastFrameTime = n, this.displayProgress = kg(this.displayProgress, this.targetProgress, this.smoothing(), s);
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
function jn(t) {
  return typeof t == "function" ? t() : t;
}
function XM(t) {
  const e = new Do(t);
  return e.start(), e;
}
const bi = /* @__PURE__ */ new Set(), Og = 16, gl = 0.5, _g = 2;
class ml {
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
    return e.addEventListener("wheel", this.onWheel, { passive: !1 }), e.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), bi.add(this), this.stopListening = Do.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const e of bi) e.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const e = this.options.scroller ?? window;
    return e.removeEventListener("wheel", this.onWheel), e.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), bi.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const e of this.effects) wi(e.element, e.saved);
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
    this.target = s, this.journey = { from: this.current, to: s, ms: i * 1e3, ease: n.ease ?? Co, elapsed: 0 }, this.requestFrame();
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
    for (const e of this.effects) wi(e.element, e.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(e) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || this.nestedScrollerTakes(e)) return;
    const n = e.deltaMode === 1 ? Og : e.deltaMode === 2 ? this.viewportHeight() : 1, s = e.deltaY * n * (this.options.wheelMultiplier ?? 1), o = this.clamp(this.target + s);
    o === this.target && o === this.current || (e.preventDefault(), this.journey = null, this.target = o, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const e = this.position();
    this.written !== null && Math.abs(e - this.written) <= _g || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = e, this.requestFrame());
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
      this.current += (this.target - this.current) * (1 - Math.exp(-n / i)), Math.abs(this.target - this.current) < gl && (this.current = this.target);
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
        o.lagged = e === 0 ? s : o.lagged + (s - o.lagged) * (1 - Math.exp(-e / r)), Math.abs(s - o.lagged) < gl ? o.lagged = s : n = !0, i += s - o.lagged;
      }
      wi(o.element, i === 0 ? o.saved : `0 ${Hg(i)}px`), o.shift = i;
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
function wi(t, e) {
  e ? t.style.setProperty("translate", e) : t.style.removeProperty("translate");
}
function Hg(t) {
  return Math.round(t * 100) / 100;
}
function Cg(t, e) {
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
function Gr(t, e, n, s, o = () => {
}) {
  const i = (f) => typeof f == "string" ? t.query(f) ?? void 0 : f, r = i(e.trigger) ?? s;
  if (!r) {
    o(`gsap-compat: scrollTrigger has no trigger element${typeof e.trigger == "string" ? ` for "${e.trigger}"` : ""}`);
    return;
  }
  const a = e.scrub === void 0 || e.scrub === !1 ? !1 : e.scrub, l = (e.toggleActions ?? "play none none none").trim().split(/\s+/);
  let c = 0, h;
  const u = (f, g) => () => {
    g?.(), n && !a && Cg(n, l[f] ?? "none"), e.once && f === 0 && queueMicrotask(() => h.destroy());
  }, d = e.containerAnimation ? Fg(t, e.containerAnimation, r, o) : void 0;
  return h = new Do({
    trigger: r,
    start: e.start,
    end: e.end,
    scrub: a === !1 ? void 0 : a,
    pin: e.pin === !0 ? !0 : i(e.pin),
    scroller: i(e.scroller),
    horizontal: e.horizontal,
    pinSpacing: e.pinSpacing,
    onRefresh: e.invalidateOnRefresh && n?.invalidate ? () => n.invalidate() : void 0,
    snap: e.snap === void 0 ? void 0 : Rg(e.snap, n),
    markers: e.markers,
    container: d,
    onUpdate: (f, g) => {
      if (n && a !== !1 && n.progress(f), e.onUpdate) {
        const p = f < c || g < 0 ? -1 : 1;
        e.onUpdate({ progress: f, velocity: g, direction: p });
      }
      c = f;
    },
    onEnter: u(0, e.onEnter),
    onLeave: u(1, e.onLeave),
    onEnterBack: u(2, e.onEnterBack),
    onLeaveBack: u(3, e.onLeaveBack)
  }), n && a === !1 && n.progress(0), h.start(), t.own(h);
}
function Rg(t, e) {
  const n = (o) => o === "labels" ? (i) => Lg(i, e?.labelProgresses?.() ?? []) : o;
  if (typeof t != "object" || Array.isArray(t)) return n(t);
  const s = t.ease ? lo(t.ease) : void 0;
  return {
    snapTo: n(t.snapTo),
    duration: t.duration,
    delay: t.delay,
    ease: s ? s.fn ?? Ft(s.easing) : void 0
  };
}
function Lg(t, e) {
  return e.reduce((n, s) => Math.abs(s - t) < Math.abs(n - t) ? s : n, e[0] ?? t);
}
function Fg(t, e, n, s) {
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
class m0 {
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
class Wg {
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
    const i = new m0(this.host, this.scope);
    i.conditions = n, i.add(() => e.setup(i)), e.context = i;
  }
}
class Ng {
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
const Dg = { opacity: 0, y: -16 }, Bg = { opacity: 0, y: 16 };
async function zg(t, e, n, s) {
  const o = e.collector?.scope ?? e.root, i = o.ownerDocument ?? o, r = () => s.shared ? [...o.querySelectorAll(s.shared)] : [];
  if (s.native && typeof i.startViewTransition == "function")
    return qg(i, s, r);
  const a = s.duration ?? 0.35, l = s.ease ?? "power2.inOut", c = (m) => new Promise((b) => {
    m(b) || b();
  }), h = r(), u = h.length ? or(e, h) : void 0, d = s.from !== void 0 ? yl(e, s.from, s.shared) : [];
  if (d.length && s.leave !== !1) {
    const m = s.leave ?? Dg;
    await c((b) => t.to(d, { ...m, duration: a, ease: l, onComplete: b }));
  }
  await s.update();
  const f = [], g = typeof s.to == "function" ? s.to() : s.to, p = g !== void 0 ? yl(e, g, s.shared) : [];
  if (p.length && s.enter !== !1) {
    const m = s.enter ?? Bg;
    f.push(c((b) => t.fromTo(p, m, { ...d0(m), duration: a, ease: l, onComplete: b })));
  }
  if (u) {
    const m = r().filter((b) => !h.includes(b));
    m.length && f.push(
      c(
        (b) => ir(e, n, u, {
          targets: m,
          duration: a * 1.4,
          ease: l,
          enter: !1,
          onComplete: b
        })
      )
    );
  }
  await Promise.all(f);
}
function yl(t, e, n) {
  const s = t.resolveTargets(e).map((o) => t.elementFor(o)).filter((o) => !!o);
  return n ? s.flatMap((o) => !o.querySelector(n) && !o.matches(n) ? [o] : [...o.children].filter((i) => !i.matches(n) && !i.querySelector(n))) : s;
}
async function qg(t, e, n) {
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
const Yg = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (t, e) => Kr(t, Nf(e))
}, jg = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (t, e) => Kr(t, { fn: Df(e) })
}, Kg = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (t, e) => Kr(t, { fn: Bf(e) })
}, Xg = /* @__PURE__ */ new Set([
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
]), bl = 0.5, Ug = "power1.inOut";
function Gg(t) {
  return t.keyframes !== void 0 && t.keyframes !== null;
}
function Vg(t) {
  const e = t.keyframes, n = {};
  for (const [c, h] of Object.entries(t)) Xg.has(c) || (n[c] = h);
  if (Array.isArray(e))
    return e.map((c) => ({
      ...n,
      ...c,
      duration: c.duration ?? t.duration ?? bl
    }));
  const s = Object.entries(e), o = t.duration ?? bl, i = e.easeEach ?? t.easeEach ?? Ug;
  if (s.length > 0 && s.every(([c]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(c) || c === "easeEach")) {
    const c = s.filter(([d]) => d !== "easeEach").map(([d, f]) => ({ at: Number.parseFloat(d) / 100, step: f })).sort((d, f) => d.at - f.at), h = [];
    let u = 0;
    for (const { at: d, step: f } of c) {
      const g = Math.max(0, d - u);
      h.push({ ...n, ease: i, ...f, duration: g * o }), u = d;
    }
    return h;
  }
  const r = s.filter(([c, h]) => c !== "easeEach" && Array.isArray(h)), a = Math.max(0, ...r.map(([, c]) => c.length)), l = [];
  for (let c = 0; c < a; c++) {
    const h = { ...n, ease: i, duration: o / a };
    for (const [u, d] of r)
      c < d.length && (h[u] = d[c]);
    l.push(h);
  }
  return l;
}
function wl(t, e, n, s = {}) {
  const o = e.collector?.scope ?? e.root, i = typeof s.scroller == "string" ? o.querySelector(s.scroller) : s.scroller ?? null, r = {
    x: i ? i.scrollLeft : window.scrollX,
    y: i ? i.scrollTop : window.scrollY
  }, a = {
    x: i ? i.scrollWidth - i.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: i ? i.scrollHeight - i.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, l = (v, w) => {
    if (w === void 0) return r[v];
    if (typeof w == "number") return w;
    if (w === "max") return a[v];
    const y = typeof w == "string" ? o.querySelector(w) : w;
    if (!y) return r[v];
    const T = y.getBoundingClientRect(), $ = i?.getBoundingClientRect(), M = (v === "x" ? s.offsetX : s.offsetY) ?? s.offset ?? 0;
    return v === "x" ? T.left - ($?.left ?? 0) + r.x - M : T.top - ($?.top ?? 0) + r.y - M;
  }, c = typeof n == "object" && n !== null && !("nodeType" in n) ? { x: l("x", n.x), y: l("y", n.y) } : { x: r.x, y: l("y", n) }, h = { x: Math.max(0, Math.min(a.x, c.x)), y: Math.max(0, Math.min(a.y, c.y)) }, u = { ...r }, d = () => {
    i ? (i.scrollLeft = u.x, i.scrollTop = u.y) : window.scrollTo({ left: u.x, top: u.y, behavior: "instant" });
  }, f = ["wheel", "touchstart", "keydown"], g = i ?? window, p = () => {
    b.kill(), m();
  }, m = () => {
    for (const v of f) g.removeEventListener(v, p);
  }, b = t.to(u, {
    x: h.x,
    y: h.y,
    duration: s.duration ?? 1,
    ease: s.ease ?? "power2.inOut",
    onStart: s.onStart,
    onUpdate: () => {
      d(), s.onUpdate?.();
    },
    onComplete: () => {
      m(), s.onComplete?.();
    }
  });
  if (s.autoKill !== !1) for (const v of f) g.addEventListener(v, p, { passive: !0 });
  return b;
}
function Jg(t, e, n) {
  const s = t.collector?.scope ?? t.root, o = typeof e == "string" ? [...s.querySelectorAll(e)] : "nodeType" in e ? [e] : Array.from(e), { interval: i = 0.1, batchMax: r, onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h, ...u } = n, d = { onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h }, f = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, g = {}, p = (b) => {
    g[b] !== void 0 && clearTimeout(g[b]), g[b] = void 0;
    const v = f[b].splice(0);
    v.length > 0 && d[b]?.(v);
  }, m = (b, v) => {
    if (d[b]) {
      if (f[b].push(v), r !== void 0 && f[b].length >= r) return p(b);
      g[b] === void 0 && (g[b] = setTimeout(() => p(b), i * 1e3));
    }
  };
  return o.map(
    (b) => Gr(t, {
      ...u,
      trigger: b,
      onEnter: () => m("onEnter", b),
      onLeave: () => m("onLeave", b),
      onEnterBack: () => m("onEnterBack", b),
      onLeaveBack: () => m("onLeaveBack", b)
    })
  ).filter((b) => b !== void 0);
}
class we {
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
    if (this.options = s, this.compat = new xn({
      ...s,
      startValue: (o, i) => {
        const r = e.objectFor(o);
        if (r) return em(r[i]);
        const a = e.appliedValue(o, i);
        if (a !== void 0) return a;
        if (i === "d") return c0(e.elementFor(o)) ?? void 0;
        if (i === "text") return e.elementFor(o)?.textContent ?? void 0;
        if (i === "strokeDasharray" || i === "strokeDashoffset") {
          const l = Ml(e.elementFor(o));
          if (l !== void 0) return i === "strokeDasharray" ? [l, l] : 0;
        }
      },
      startVelocity: (o, i) => e.velocityOf(o, i),
      layoutColumns: (o) => vl(o.map((i) => e.elementFor(i))),
      random: () => e.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, e.collector?.track(this), e.liveTimelines.add(this), this.autoplayPending = !s.paused && !s.scrollTrigger, s.scrollTrigger) {
      const o = s.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = Gr(e, o, this, this.firstElement, (i) => s.onWarning?.(i)));
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
    return Gg(n) ? this.record(() => this.keyframed(e, n, s)) : this.record(() => this.tween(e, [n], s, ([o], i, r) => this.compat.to(i, o, r)));
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
    const o = this.timeline.currentTime, i = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(n))), r = { time: o }, a = s.duration ?? Math.abs(i - o) / 1e3 / (this.timeScale() || 1), l = new we(this.stage, { onStart: s.onStart, onComplete: s.onComplete });
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
    const o = this.events, { crossings: i, passes: r } = Bh(
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
      const u = (d, f, g) => {
        o(d, f, g), c = Math.min(c, this.compat.lastStart), h = Math.max(h, this.compat.lastEnd);
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
    const i = Vg(n);
    if (i.length === 0) return;
    const r = o.length > 1 ? nr(n.stagger, this.staggerContext(o)) : void 0, a = o.map((m) => this.targetFor(m)).filter((m) => m !== void 0), l = r ? a.map((m) => [m]) : [a], c = r ? Gi(o.length, r).map((m) => m / 1e3) : [0], h = this.compat.timeOf(s) / 1e3 + co(n.delay, 0) / 1e3;
    let u = 1 / 0, d = -1 / 0;
    if (l.forEach((m, b) => {
      i.forEach((v, w) => {
        const y = w === 0 ? h + c[b] : ">";
        this.tween(m, [v], y, ([T], $, M) => this.compat.to($, T, M)), u = Math.min(u, this.compat.lastStart), d = Math.max(d, this.compat.lastEnd);
      });
    }), u === 1 / 0) return;
    const { onStart: f, onUpdate: g, onComplete: p } = n;
    f && this.events.push({ time: u, direction: "forward", run: f }), g && this.ranges.push({ start: u, end: d, run: g }), p && this.events.push({ time: d, direction: "forward", run: p });
  }
  staggerContext(e) {
    return {
      count: e.length,
      columnsFromLayout: () => vl(e.map((n) => this.stage.elementFor(n))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(e, n, s, o) {
    const i = e.map((d) => this.targetFor(d));
    if (!(e.length > 1 && (n.some(tm) || e.some((d) => this.stage.objectFor(d) !== void 0)))) {
      const d = this.targetFor(e[0]);
      o(n.map((f) => this.prepare(kl(f, 0, d, this.stage.utils, i), e)), e, s);
      return;
    }
    const a = n.length - 1, { stagger: l, ...c } = n[a], h = nr(l, this.staggerContext(e)), u = h ? Gi(e.length, h).map((d) => d / 1e3) : e.map(() => 0);
    e.forEach((d, f) => {
      const g = f === 0 ? co(c.delay, 0) / 1e3 + u[0] : 0, p = f === 0 ? 0 : u[f] - u[f - 1], m = f === 0 ? s : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, v = n.map((w, y) => y === a ? { ...c, delay: g } : w).map((w) => this.prepare(kl(w, f, this.targetFor(d), this.stage.utils, i), [d]));
      o(v, [d], m);
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
      const r = eg(e.motionPath, {
        query: o,
        targets: n.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: s
      });
      i = { ...i, motionPath: r };
    }
    if (e.morphSVG !== void 0) {
      const r = ng(e.morphSVG, o, s), { morphSVG: a, ...l } = i;
      i = r ? { ...i, morphSVG: r } : l;
    }
    if (e.drawSVG !== void 0) {
      const r = Ml(this.stage.elementFor(n[0]));
      if (r === void 0) {
        s("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...l } = i;
        i = l;
      } else
        i = Ap(i, r);
    }
    return i;
  }
  resolve(e) {
    const n = this.stage.resolveTargets(e);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${nm(e)}`);
      return;
    }
    return this.firstElement ??= n.map((s) => this.stage.elementFor(s)).find((s) => s !== void 0), n;
  }
}
function Zg(t = new Jp()) {
  const e = (i) => {
    const { config: r } = Vs(i);
    return new we(t, {
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
    const { onStart: r, onUpdate: a, onComplete: l, onRepeat: c, onReverseComplete: h, repeatRefresh: u, ...d } = i;
    return d;
  }, s = (i) => (i && t.collector?.track(i), i), o = {
    stage: t,
    ticker: t.ticker,
    utils: t.utils,
    getProperty: (i, r) => {
      const [a] = t.resolveTargets(i);
      if (a === void 0) return;
      const l = t.objectFor(a);
      return l ? l[r] : t.appliedValue(a, r) ?? i0(r);
    },
    scrollTrigger: (i) => s(Gr(t, i)),
    scrollBatch: (i, r) => Jg(t, i, r).map((a) => s(a)),
    scrollTo: (i, r) => wl(o, t, i, r),
    refreshScroll: () => {
      Do.refreshAll(), ml.refreshAll();
    },
    smoothScroll: (i = {}) => {
      const r = typeof i.scroller == "string" ? (t.collector?.scope ?? t.root).querySelector(i.scroller) : i.scroller;
      return s(new ml({ ...i, scroller: r }).start());
    },
    context: (i, r) => {
      const a = new m0(t, r);
      return i && a.add(() => i(a)), a;
    },
    matchMedia: (i) => new Wg(t, i),
    customEase: Yg.create,
    customBounce: jg.create,
    customWiggle: Kg.create,
    pageTransition: (i) => zg(o, t, (r) => new we(t, r), i),
    imageSequence: (i, r) => {
      const a = typeof i == "string" ? (t.collector?.scope ?? t.root).querySelector(i) : i;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(i)}`);
      return s(new Ng(a, r));
    },
    quickTo: (i, r, a = {}) => {
      const l = new we(t, { paused: !0 }), [c] = t.resolveTargets(i);
      return Object.assign((u) => {
        if (!c) return;
        const d = a.spring !== void 0 ? t.velocityOf(c, r) ?? 0 : 0;
        l.compat.reset(), l.compat.to(c, {
          [r]: u,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: Qg(a.spring, r, d) }
        }), l.timeline.stop(), l.timeline.play(), t.activate(l.timeline);
      }, { tween: l, kill: () => l.kill() });
    },
    timeline: (i) => new we(t, i),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (i, r) => {
      if (r.scrollTo !== void 0) {
        const { scrollTo: a, ...l } = r, c = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, h = typeof i != "string" && i !== window && i.nodeType === 1;
        return wl(o, t, a, {
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
    delayedCall: (i, r, a) => new we(t).call(r, a, i),
    killTweensOf: (i, r) => {
      const a = t.resolveTargets(i), l = typeof r == "string" ? r.split(",").map((c) => c.trim()).filter(Boolean) : r;
      for (const c of [...t.liveTimelines]) c.killTweensOf(a, l);
    },
    convertToPath: (i) => og(i, t.root),
    splitText: (i, r) => {
      const a = t.collector?.scope ?? t.root, l = typeof i == "string" ? Array.from(a.querySelectorAll(i)) : "nodeType" in i ? [i] : Array.from(i);
      return s(pg(l, r));
    },
    draggable: (i, r) => s(hg(o, t, i, r)),
    getFlipState: (i) => or(t, i),
    flipFrom: (i, r) => ir(t, (a) => new we(t, a), i, r),
    flip: (i, r, a) => {
      const l = or(t, i);
      return r(), ir(t, (c) => new we(t, c), l, { targets: i, ...a });
    }
  };
  return o;
}
const te = /* @__PURE__ */ Zg();
function Qg(t, e, n) {
  return t === !0 ? { velocity: { [e]: n } } : typeof t == "string" ? { preset: t, velocity: { [e]: n } } : { ...t, velocity: { [e]: n } };
}
function tm(t) {
  return t.morphSVG !== void 0 || t.drawSVG !== void 0 || t.text !== void 0 || t.scrambleText !== void 0 || y0(t);
}
function y0(t) {
  return Object.entries(t).some(([e, n]) => (typeof n == "function" || o0(n)) && !Xr.has(e));
}
function kl(t, e, n, s, o) {
  if (!y0(t)) return t;
  const i = {};
  for (const [r, a] of Object.entries(t))
    Xr.has(r) ? i[r] = a : typeof a == "function" ? i[r] = a(e, n, o) : o0(a) ? i[r] = s.resolveRandomString(a) : i[r] = a;
  return i;
}
function vl(t) {
  const e = t.map((s) => s?.getBoundingClientRect().top);
  if (e[0] === void 0) return t.length;
  let n = 0;
  for (const s of e) {
    if (s === void 0 || Math.abs(s - e[0]) > 1) break;
    n++;
  }
  return Math.max(1, n);
}
function Ml(t) {
  const e = t;
  if (typeof e?.getTotalLength == "function")
    return e.getTotalLength();
}
function em(t) {
  if (typeof t == "number" || typeof t == "string" || Array.isArray(t) && t.every((e) => typeof e == "number")) return t;
}
function nm(t) {
  return typeof t == "string" ? `"${t}"` : String(t);
}
class xl {
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
function sm(t, e, n, s, o) {
  const i = n - o;
  if (i < 0) {
    e.paused || e.pause(), e.currentTime = 0;
    return;
  }
  t.update(i, s);
}
class Vr {
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
    this.options = n, this.adapter = new Xe();
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
    this.options.speed !== void 0 && (n.speed = this.options.speed), this.options.loop !== void 0 && (n.loop = this.options.loop), this.options.alternate !== void 0 && (n.alternate = this.options.alternate), this.timeline = cs({ ...e, config: n }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
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
      i !== null && (s.volume = Math.max(0, Math.min(1, Number(i) || 0))), this.mediaTargets.push({ el: s, startTime: o, sync: new xl(s) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(e, n) {
    for (const s of this.mediaTargets)
      sm(s.sync, s.el, e, n, s.startTime);
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
      const r = new Xe();
      s.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const l = a.getAttribute("data-tinyfly");
        l && r.registerTarget(l, a);
      }), this.symbolInstances.push({ adapter: r, timeline: cs(i.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(e, n) {
    this.mediaSync = new xl(e, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const { crossings: i } = Bh(
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
async function UM(t, e, n = {}) {
  const s = new Vr(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
function GM(t, e = {}) {
  return new Vr(t, e);
}
const om = {
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
}, Sl = "tinyfly-controls-style", im = `
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
let rm = 0;
function am(t) {
  if (t.getElementById(Sl)) return;
  const e = t.createElement("style");
  e.id = Sl, e.textContent = im, t.head.appendChild(e);
}
function lm(t, e, n = {}) {
  const s = e.ownerDocument;
  am(s);
  const o = { ...om, ...n.labels }, i = n.speeds ?? [0.5, 1, 2], r = () => t.markers.length > 0, a = () => t.markers.some((L) => L.label !== void 0 || t.caption(L.id) !== void 0), l = s.createElement("div");
  l.className = "tf-ctl";
  const c = s.createElement("div");
  c.className = "tf-ctl-bar", c.setAttribute("role", "group");
  const h = (L, B, X, J = "") => {
    const q = s.createElement("button");
    return q.type = "button", q.className = `tf-ctl-btn ${J}`.trim(), q.setAttribute("aria-label", L), q.title = L, q.textContent = B, q.addEventListener("click", X), q;
  }, u = h(o.restart, "⟲", () => {
    t.pause(), t.seek(0);
  }), d = h(o.prev, "|◀", () => t.prev()), f = h(o.play, "▶", () => t.isPlaying ? t.pause() : p(), "tf-ctl-primary"), g = h(o.next, "▶|", () => t.next()), p = () => {
    t.currentTime >= t.duration - 0.5 && t.seek(0), t.play();
  }, m = s.createElement("input");
  m.type = "range", m.className = "tf-ctl-scrub", m.min = "0", m.max = "1000", m.step = "1", m.setAttribute("aria-label", o.scrub), m.addEventListener("input", () => {
    t.pause(), t.seek(Number(m.value) / 1e3 * t.duration);
  });
  const b = s.createElement("span");
  b.className = "tf-ctl-step";
  const v = s.createElement("select");
  v.className = "tf-ctl-speed", v.setAttribute("aria-label", o.speed);
  for (const L of i) {
    const B = s.createElement("option");
    B.value = String(L), B.textContent = `${L}×`, L === 1 && (B.selected = !0), v.appendChild(B);
  }
  v.addEventListener("change", () => t.setSpeed(Number(v.value))), c.append(u, d, f, g, m, b), i.length > 0 && c.append(v), l.append(c);
  const w = n.fullscreen ? dm(e, s, o) : void 0;
  w && c.append(w.button);
  const y = s.createElement("p");
  y.className = "tf-ctl-caption", y.setAttribute("aria-live", "polite"), n.captions !== !1 && l.append(y);
  const T = s.createElement("div");
  T.className = "tf-ctl-question", T.hidden = !0;
  const $ = s.createElement("span"), M = h(o.reveal, o.reveal, () => t.play(), "tf-ctl-primary");
  T.append($, M), l.append(T);
  const S = cm(t, s, o.scenario, n.scenarioControl ?? "buttons");
  S && l.append(S.element);
  const k = n.mount;
  k ? k.appendChild(l) : e.insertAdjacentElement("afterend", l);
  const x = () => {
    const L = t.isPlaying;
    f.textContent = L ? "❚❚" : "▶", f.setAttribute("aria-label", L ? o.pause : o.play), f.title = L ? o.pause : o.play;
    const B = t.duration;
    s.activeElement !== m && (m.value = String(B > 0 ? Math.round(t.currentTime / B * 1e3) : 0));
    const X = t.markers;
    if (d.hidden = g.hidden = b.hidden = X.length === 0, X.length > 0) {
      const J = t.currentMarker, q = J ? X.indexOf(J) + 1 : 0;
      b.textContent = o.stepFormat.replace("{index}", String(q)).replace("{total}", String(X.length)), b.setAttribute("aria-label", `${o.step} ${q} ${o.of} ${X.length}`), d.disabled = t.currentTime <= 0.5, g.disabled = t.currentTime >= B - 0.5;
      const R = t.caption() ?? "";
      y.textContent !== R && (y.textContent = R), y.hidden = !a();
      const D = !L && J?.question !== void 0 && Math.abs(t.currentTime - J.time) < 1;
      T.hidden = !D, D && $.textContent !== J.question && ($.textContent = J.question);
    } else
      T.hidden = !0, y.hidden = !0;
    S?.update();
  }, P = t.subscribe(x);
  x();
  const E = n.keyboardScope ?? e;
  !E.hasAttribute("tabindex") && E.tabIndex < 0 && (E.tabIndex = 0);
  const O = /* @__PURE__ */ new WeakSet(), _ = (L) => {
    if (O.has(L) || (O.add(L), L.defaultPrevented || L.altKey || L.ctrlKey || L.metaKey)) return;
    const B = L.target;
    if (!(B.tagName === "INPUT" || B.tagName === "SELECT") && !(L.key === " " && B.tagName === "BUTTON"))
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
  return E.addEventListener("keydown", _), l.addEventListener("keydown", _), {
    element: l,
    fullscreen: w && {
      get active() {
        return w.active;
      },
      enter: w.enter,
      exit: w.exit
    },
    destroy() {
      w?.destroy(), P(), E.removeEventListener("keydown", _), l.removeEventListener("keydown", _), l.remove();
    }
  };
}
function cm(t, e, n, s) {
  const o = t.scenarios;
  if (o.length < 2) return;
  if (s === "slider") {
    const h = e.createElement("div");
    h.className = "tf-ctl-choice-slider";
    const u = e.createElement("span");
    u.textContent = n, u.setAttribute("aria-hidden", "true");
    const d = e.createElement("input");
    d.type = "range", d.min = "0", d.max = String(o.length - 1), d.step = "1", d.setAttribute("aria-label", n);
    const f = e.createElement("output");
    return f.setAttribute("aria-hidden", "true"), d.addEventListener("input", () => {
      const p = o[Number(d.value)];
      p && t.setScenario(p.id);
    }), h.append(u, d, f), { element: h, update: () => {
      const p = Math.max(0, o.findIndex((b) => b.id === t.scenario));
      e.activeElement !== d && (d.value = String(p));
      const m = o[p].label;
      f.textContent !== m && (f.textContent = m), d.setAttribute("aria-valuetext", m);
    } };
  }
  const i = e.createElement("fieldset");
  i.className = "tf-ctl-choices";
  const r = e.createElement("legend");
  r.textContent = n, i.append(r);
  const a = `tf-ctl-scenario-${++rm}`, l = o.map((h) => {
    const u = e.createElement("label");
    u.className = "tf-ctl-choice";
    const d = e.createElement("input");
    d.type = "radio", d.name = a, d.value = h.id, d.addEventListener("change", () => {
      d.checked && t.setScenario(h.id);
    });
    const f = e.createElement("span");
    return f.textContent = h.label, u.append(d, f), i.append(u), d;
  });
  return { element: i, update: () => {
    for (const h of l) {
      const u = h.value === t.scenario;
      h.checked !== u && (h.checked = u);
    }
  } };
}
const hm = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', um = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function dm(t, e, n) {
  const s = e, o = t, i = e.createElement("button");
  i.type = "button", i.className = "tf-ctl-btn tf-ctl-fullscreen";
  let r, a = "";
  const l = () => {
    const p = r !== void 0;
    i.innerHTML = p ? um : hm;
    const m = p ? n.exitFullscreen : n.fullscreen;
    i.setAttribute("aria-label", m), i.title = m, i.setAttribute("aria-pressed", String(p)), t.classList.toggle("tf-fullscreen", p), t.classList.toggle("tf-fullscreen-overlay", r === "overlay");
  }, c = () => s.fullscreenElement ?? s.webkitFullscreenElement ?? null, h = () => {
    c() === t ? r = "native" : r === "native" && (r = void 0), l();
  }, u = (p) => {
    p.key === "Escape" && g();
  }, d = () => {
    r = "overlay", a = e.documentElement.style.overflow, e.documentElement.style.overflow = "hidden", e.addEventListener("keydown", u), l();
  };
  async function f() {
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
    d();
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
    r ? g() : f();
  }), e.addEventListener("fullscreenchange", h), e.addEventListener("webkitfullscreenchange", h), l(), {
    button: i,
    get active() {
      return r !== void 0;
    },
    enter: f,
    exit: g,
    destroy() {
      g(), e.removeEventListener("fullscreenchange", h), e.removeEventListener("webkitfullscreenchange", h), i.remove();
    }
  };
}
const Tl = "tinyfly-choices-style", fm = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function pm(t) {
  if (t.getElementById(Tl)) return;
  const e = t.createElement("style");
  e.id = Tl, e.textContent = fm, t.head.appendChild(e);
}
function gm(t, e) {
  const n = Array.from(e.querySelectorAll("[data-tinyfly-choose]"));
  if (n.length === 0) return () => {
  };
  pm(e.ownerDocument);
  const s = [], o = [];
  for (const a of n) {
    const l = a.getAttribute("data-tinyfly-choose") ?? "", c = [], h = (g, p) => {
      a.hasAttribute(g) || (a.setAttribute(g, p), c.push(g));
    };
    h("role", "button"), h("tabindex", "0");
    const u = t.scenarios.find((g) => g.id === l)?.label;
    u !== void 0 && h("aria-label", u), a.setAttribute("aria-pressed", "false"), c.push("aria-pressed"), s.push({ element: a, attributes: c });
    const d = () => t.setScenario(l), f = (g) => {
      const p = g.key;
      p !== "Enter" && p !== " " || (g.preventDefault(), d());
    };
    a.addEventListener("click", d), a.addEventListener("keydown", f), o.push(() => {
      a.removeEventListener("click", d), a.removeEventListener("keydown", f);
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
const uo = /* @__PURE__ */ new WeakMap(), rr = /* @__PURE__ */ new WeakMap();
let mm = 0;
function Qn(t, e, n) {
  if (t)
    try {
      return JSON.parse(t);
    } catch (s) {
      console.warn(`tinyfly: invalid ${e} JSON on`, n, s);
      return;
    }
}
async function ym(t, e = {}) {
  const n = uo.get(t);
  if (n) return n;
  const s = Array.from(t.querySelectorAll("script[data-tinyfly-timeline]")), o = s[0], i = t.getAttribute("data-src"), r = wm(t.getAttribute("data-markers")), a = s.length > 1 || o?.hasAttribute("data-scenario") ? bm(s, r, t) : void 0;
  if (a && a.length === 0) return;
  let l = o && !a ? Qn(o.textContent, "timeline", t) : void 0;
  if (!l && i && r) {
    const f = await fetch(i);
    f.ok && (l = await f.json());
  }
  if (l && r && (l = b0(l, r)), !l && !i && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', t);
    return;
  }
  const c = Qn(t.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", t), h = {
    playWhenVisible: !0,
    ...e.player,
    ...c && { captions: c },
    ...Qn(t.getAttribute("data-options"), "data-options", t)
  };
  vm(t);
  const u = new Vr(t, h), d = { element: t, player: u };
  if (uo.set(t, d), t.setAttribute("data-tinyfly-mounted", ""), a) {
    const f = t.getAttribute("data-scenario") ?? void 0;
    await u.loadScenarios(a, { initial: a.some((g) => g.id === f) ? f : void 0 }), rr.set(t, gm(u, t));
  } else
    await u.load(l ?? i);
  if (t.getAttribute("data-controls") !== "false") {
    const f = Qn(t.getAttribute("data-labels"), "data-labels", t), g = t.querySelector("figcaption"), p = t.getAttribute("data-scenario-legend"), m = t.getAttribute("data-scenario-control");
    d.controls = lm(u, t, {
      ...e.controls,
      ...t.getAttribute("data-fullscreen") === "true" ? { fullscreen: !0 } : {},
      ...m === "slider" || m === "buttons" ? { scenarioControl: m } : {},
      labels: { ...e.controls?.labels, ...f, ...p ? { scenario: p } : {} },
      // Inside the figure, before its figcaption, so the caption stays last.
      mount: void 0
    }), g ? t.insertBefore(d.controls.element, g) : t.appendChild(d.controls.element);
  }
  return d;
}
function bm(t, e, n) {
  const s = [];
  return t.forEach((o, i) => {
    const r = Qn(o.textContent, "timeline", n);
    if (!r) return;
    const a = o.getAttribute("data-scenario") || `scenario-${i + 1}`;
    if (s.some((c) => c.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, n);
      return;
    }
    const l = o.getAttribute("data-scenario-label") ?? void 0;
    s.push({ id: a, label: l, timeline: e ? b0(r, e) : r });
  }), s;
}
function b0(t, e) {
  return t.config.markers?.length ? t : { ...t, config: { ...t.config, markers: e.map((n, s) => ({ id: `step-${s + 1}`, time: n })) } };
}
function wm(t) {
  if (!t) return;
  const e = t.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((n, s) => n - s);
  return e.length > 0 ? e : void 0;
}
async function km(t = document, e = {}) {
  const n = Array.from(t.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(n.map((o) => ym(o, e)))).filter((o) => o !== void 0);
}
function VM(t) {
  const e = uo.get(t);
  e && (rr.get(t)?.(), rr.delete(t), e.controls?.destroy(), e.player.destroy(), uo.delete(t), t.removeAttribute("data-tinyfly-mounted"));
}
function vm(t) {
  const e = t.querySelector("svg");
  if (!e || e.hasAttribute("role") || e.hasAttribute("aria-hidden")) return;
  const n = t.getAttribute("data-alt"), s = t.querySelector("figcaption");
  e.setAttribute("role", "img"), n ? e.setAttribute("aria-label", n) : s && (s.id ||= `tinyfly-caption-${++mm}`, e.setAttribute("aria-labelledby", s.id));
}
function Mm() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const e = () => {
    km();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
class xm {
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
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new Xe(), this.adapterB = new Xe();
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
      const a = new Xe();
      o.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const c = l.getAttribute("data-tinyfly");
        c && a.registerTarget(c, l);
      }), s.push({ adapter: a, timeline: cs(r) });
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
    return e.timeline ? cs(e.timeline) : null;
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
async function JM(t, e, n = {}) {
  const s = new xm(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
const ZM = { type: "none", duration: 0 }, Et = (t) => ({ description: t, unit: "degrees" }), St = (t, e = 0, n = 1) => ({ description: t, unit: `${e}..${n}`, min: e, max: n }), w0 = {
  lean: Et("Upper body tipped about the hips (+ toward the way it faces)"),
  bend: Et("Line of action: the spine curved (+ curls forward, − arches back)"),
  headTilt: Et("Head tilt"),
  leftShoulder: Et("Left upper arm: 0 hangs down, 90 straight out to its side, 180 straight up; in profile, forward is negative for the left arm"),
  rightShoulder: Et("Right upper arm: 0 hangs down, 90 straight out (forward, in profile), 180 straight up"),
  leftElbow: Et("Left elbow bend, added to the upper arm"),
  rightElbow: Et("Right elbow bend, added to the upper arm"),
  leftHip: Et("Left thigh: 0 straight down; in profile negative is forward"),
  rightHip: Et("Right thigh: 0 straight down; in profile positive is forward"),
  leftKnee: Et("Left knee bend (negative folds the shin back)"),
  rightKnee: Et("Right knee bend (positive folds the shin back)"),
  leftWrist: Et("Left wrist bend, added to the forearm"),
  rightWrist: Et("Right wrist bend, added to the forearm"),
  leftAnkle: Et("Left ankle: + points the toe down (tiptoe), − onto the heel"),
  rightAnkle: Et("Right ankle: + points the toe down (tiptoe), − onto the heel"),
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
  spin: Et("Whole body turned about the hips: + rolls forward (a front flip), 360 a full turn"),
  rise: { description: "Lift off the ground, as a fraction of its height (the arc of a jump)", unit: "× height" }
}, k0 = {
  walk: { description: "Walk-cycle phase, in strides: animate 0 → n for n strides", unit: "strides" },
  walking: St("How much of the walk cycle is applied (0 standing)"),
  gait: { description: "How it walks: a gait name (walk, bouncy, doubleBounce, sneak, strut, tired, run, shove); a string track switches it", kind: "string" },
  talk: St("How much the mouth chatters"),
  rubber: St("Limbs from jointed (0) to rubber hose (1)"),
  facing: { description: "Which way it faces: 1 right, −1 left (key the flip while turn is near 0)", unit: "±1", min: -1, max: 1 },
  beat: { description: "Beats into its dance (with a dance)", unit: "beats" },
  dancing: St("How much of the dance is applied")
}, v0 = {
  "thumb.curl": St("Thumb curled in"),
  "thumb.across": St("Thumb across the palm"),
  "index.curl": St("Index finger curled"),
  "middle.curl": St("Middle finger curled"),
  "ring.curl": St("Ring finger curled"),
  "pinky.curl": St("Little finger curled"),
  spread: St("Fingers spread apart"),
  turn: Et("Hand turned about the forearm"),
  bend: Et("Hand bent at the wrist, palm-ward"),
  tilt: Et("Hand tilted sideways"),
  roll: Et("Hand rolled to show the back or the palm")
};
let M0;
function Sm(t) {
  M0 = t;
}
function Tm(t) {
  return M0?.(t) ?? {};
}
function Em(t) {
  let e = 0;
  for (let n = 1; n < t.length; n++) e += Math.hypot(t[n].x - t[n - 1].x, t[n].y - t[n - 1].y);
  return e;
}
function us(t, e) {
  const n = Math.min(1, Math.max(0, e));
  if (t.length < 2 || n === 1) return t.slice();
  if (n === 0) return t.slice(0, 1);
  let s = Em(t) * n;
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
function Jr(t, e) {
  const n = us(t, e);
  return n[n.length - 1];
}
function x0(t, e) {
  return e > 0 ? Math.floor(Math.max(0, t) * e / 1e3) : 0;
}
function ar(t, e, n) {
  const s = e.roughness ?? 2, o = Math.max(1, Math.round(e.passes ?? 2)), i = x0(n, e.boil ?? 8);
  let r = 0;
  const a = () => {
    const d = r++;
    return (f) => nn(Qt(`${e.seed ?? 1}:${i}:${d}:${f}`));
  }, l = (d, f) => (d.next() * 2 - 1) * f, c = (d) => {
    const f = a(), g = t.lineWidth, p = t.globalAlpha;
    for (let m = 0; m < o; m++)
      t.lineWidth = m === 0 ? g : g * 0.55, t.globalAlpha = m === 0 ? p : p * 0.6, d(f(m));
    t.lineWidth = g, t.globalAlpha = p;
  }, h = (d, f = 1) => {
    if (d.length < 2) return;
    const g = d.slice(1).map((m, b) => Math.hypot(m.x - d[b].x, m.y - d[b].y)), p = g.reduce((m, b) => m + b, 0) * Math.min(1, Math.max(0, f));
    c((m) => {
      const b = [], v = [];
      if (d.forEach((y, T) => {
        b.push({ x: y.x + l(m, s * 0.5), y: y.y + l(m, s * 0.5) }), T > 0 && v.push([m.next() * 2 - 1, m.next() * 2 - 1]);
      }), p <= 0) return;
      t.beginPath(), t.moveTo(b[0].x, b[0].y);
      let w = 0;
      for (let y = 1; y < b.length; y++) {
        const T = Am(b[y - 1], b[y], s, v[y - 1]), $ = g[y - 1];
        if (w + $ <= p) {
          t.bezierCurveTo(T[1].x, T[1].y, T[2].x, T[2].y, T[3].x, T[3].y), w += $;
          continue;
        }
        const M = $m(T, $ === 0 ? 1 : (p - w) / $);
        t.bezierCurveTo(M[1].x, M[1].y, M[2].x, M[2].y, M[3].x, M[3].y);
        break;
      }
      t.stroke();
    });
  }, u = (d, f, g, p, m = 1) => {
    c((b) => {
      const w = b.next() * Math.PI * 2, y = Math.PI * 2 + 0.15 + b.next() * 0.3, T = [];
      for (let M = 0; M <= 14; M++) {
        const S = w + y * M / 14, k = l(b, s * 0.6);
        T.push({ x: d + Math.cos(S) * (g + k), y: f + Math.sin(S) * (p + k) });
      }
      const $ = us(T, m);
      $.length < 2 || (El(t, $), t.stroke());
    });
  };
  return {
    line: h,
    curve(d, f = 1) {
      if (d.length < 2) return;
      const g = d[0], p = d[d.length - 1], m = Math.hypot(p.x - g.x, p.y - g.y) || 1, b = -(p.y - g.y) / m, v = (p.x - g.x) / m;
      c((w) => {
        const y = { x: l(w, s * 0.5), y: l(w, s * 0.5) }, T = { x: l(w, s * 0.5), y: l(w, s * 0.5) }, $ = l(w, s * Math.min(1.5, Math.max(0.3, m / 80))), M = d.map((k, x) => {
          const P = x / (d.length - 1), E = Math.sin(Math.PI * P) * $;
          return {
            x: k.x + y.x + (T.x - y.x) * P + b * E,
            y: k.y + y.y + (T.y - y.y) * P + v * E
          };
        }), S = us(M, f);
        S.length < 2 || (El(t, S), t.stroke());
      });
    },
    circle(d, f, g, p = 1) {
      u(d, f, g, g, p);
    },
    ellipse: u,
    nudge(d = 0.5) {
      const f = a()(0);
      return { x: l(f, s * d), y: l(f, s * d) };
    }
  };
}
function Am(t, e, n, s) {
  const o = e.x - t.x, i = e.y - t.y, r = Math.hypot(o, i) || 1, a = n * Math.min(1.5, Math.max(0.3, r / 80)), l = -i / r, c = o / r;
  return [
    t,
    { x: t.x + o / 3 + l * s[0] * a, y: t.y + i / 3 + c * s[0] * a },
    { x: t.x + 2 * o / 3 + l * s[1] * a, y: t.y + 2 * i / 3 + c * s[1] * a },
    e
  ];
}
function $m([t, e, n, s], o) {
  const i = (u, d) => ({ x: u.x + (d.x - u.x) * o, y: u.y + (d.y - u.y) * o }), r = i(t, e), a = i(e, n), l = i(n, s), c = i(r, a), h = i(a, l);
  return [t, r, c, i(c, h)];
}
function El(t, e) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let s = 1; s < e.length - 1; s++) {
    const o = { x: (e[s].x + e[s + 1].x) / 2, y: (e[s].y + e[s + 1].y) / 2 };
    t.quadraticCurveTo(e[s].x, e[s].y, o.x, o.y);
  }
  const n = e[e.length - 1];
  t.lineTo(n.x, n.y);
}
function Rt(t, e, n) {
  const s = t.length;
  if (s < 2) return [];
  const o = [], i = [], r = (a) => e + (n - e) * a / (s - 1);
  return t.forEach((a, l) => {
    const c = t[Math.max(0, l - 1)], h = t[Math.min(s - 1, l + 1)], u = Math.hypot(h.x - c.x, h.y - c.y) || 1, d = r(l) / 2, f = -(h.y - c.y) / u * d, g = (h.x - c.x) / u * d;
    o.push({ x: a.x + f, y: a.y + g }), i.push({ x: a.x - f, y: a.y - g });
  }), [...o, ...i.reverse()];
}
function Zr(t, e, n, s) {
  const o = e.length;
  if (o < 2) return;
  const i = Rt(e, n, s), r = (a) => n + (s - n) * a / (o - 1);
  t.beginPath(), t.moveTo(i[0].x, i[0].y);
  for (const a of i.slice(1)) t.lineTo(a.x, a.y);
  t.closePath(), t.fill(), e.forEach((a, l) => {
    l !== 0 && l !== o - 1 && o > 3 || (t.beginPath(), t.arc(a.x, a.y, r(l) / 2, 0, Math.PI * 2), t.fill());
  });
}
function Cn(t, e, n, s, o = 16) {
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
function Al(t, e, n, s, o, i = 0, r = 1, a = 40) {
  const l = Math.cos(o), c = Math.sin(o);
  return Array.from({ length: a + 1 }, (h, u) => {
    const d = i + Math.PI * 2 * r * u / a, f = Math.cos(d) * n, g = Math.sin(d) * s;
    return { x: t + f * l - g * c, y: e + f * c + g * l };
  });
}
function Bo(t, e) {
  return e.look === "pencil" ? _m(t, e) : Pm(t, e.ink, e.look);
}
function fo(t, e, n = !1) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (const s of e.slice(1)) t.lineTo(s.x, s.y);
  n && t.closePath();
}
function Pm(t, e, n) {
  const s = n === "silhouette", o = s ? 1.25 : 1;
  return {
    look: n,
    ink: e,
    limb(i, r, a) {
      t.fillStyle = e, Zr(t, i, r * o, a * o);
    },
    line(i, r) {
      i.length < 2 || (t.strokeStyle = e, t.lineWidth = r * o, t.lineCap = "round", t.lineJoin = "round", fo(t, i), t.stroke());
    },
    shape(i, r, a) {
      fo(t, i, !0), (r !== null || s) && (t.fillStyle = s ? e : r, t.fill()), !(a <= 0) && (t.strokeStyle = e, t.lineWidth = a * o, t.lineJoin = "round", t.stroke());
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
function Im(t, e) {
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
function Om(t, e) {
  const n = t.length;
  return t.map((s, o) => {
    const i = t[Math.max(0, o - 1)], r = t[Math.min(n - 1, o + 1)], a = Math.hypot(r.x - i.x, r.y - i.y) || 1, l = e(n === 1 ? 0 : o / (n - 1));
    return { x: s.x - (r.y - i.y) / a * l, y: s.y + (r.x - i.x) / a * l };
  });
}
function $l(t) {
  const e = [0.6, 1.4, 2.9].map((s) => ({
    frequency: s * (0.8 + t.next() * 0.4),
    phase: t.next() * Math.PI * 2,
    amount: 0.5 + t.next() * 0.5
  })), n = e.reduce((s, o) => s + o.amount, 0);
  return (s) => e.reduce((o, i) => o + i.amount * Math.sin(Math.PI * 2 * i.frequency * s + i.phase), 0) / n;
}
function _m(t, e) {
  const n = e.pencil ?? {}, s = e.ink, o = n.roughness ?? Math.max(1, e.lineWidth * 0.12), i = Math.max(1, Math.round(n.passes ?? 2)), r = Math.min(1, Math.max(0, n.pressure ?? 0.25)), a = Math.min(1, Math.max(0, n.rubbedOut ?? 0.15)), l = x0(e.time, n.boil ?? 8);
  let c = 0;
  const h = (g, p, m = !1) => nn(Qt(`${e.seed}:${m ? "paper" : l}:${g}:${p}`)), u = (g, p, m, b, v, w = 0) => {
    if (g.length < 2) return;
    const y = g.slice(1).reduce((P, E, O) => P + Math.hypot(E.x - g[O].x, E.y - g[O].y), 0);
    let T = Im(g, Math.max(1.5, Math.min(e.lineWidth * 0.8, y / 24)));
    if (w > 0 && T.length >= 2) {
      const [P, E] = [T[T.length - 2], T[T.length - 1]], O = Math.hypot(E.x - P.x, E.y - P.y) || 1;
      T = [...T, { x: E.x + (E.x - P.x) / O * w, y: E.y + (E.y - P.y) / O * w }];
    }
    const $ = $l(m), M = $l(m), S = T.length, k = [], x = [];
    T.forEach((P, E) => {
      const O = S === 1 ? 0 : E / (S - 1), _ = T[Math.max(0, E - 1)], L = T[Math.min(S - 1, E + 1)], B = Math.hypot(L.x - _.x, L.y - _.y) || 1, X = -(L.y - _.y) / B, J = (L.x - _.x) / B, q = $(O) * v, R = Math.min(1, O / 0.08, (1 - O) / 0.08), D = (0.55 + 0.45 * Math.sqrt(Math.max(0, R))) * (1 + r * M(O)), I = Math.max(0.3, p(O) * D / 2), A = P.x + X * q, H = P.y + J * q;
      k.push({ x: A + X * I, y: H + J * I }), x.push({ x: A - X * I, y: H - J * I });
    }), t.save(), t.globalAlpha *= b, t.fillStyle = s, fo(t, [...k, ...x.reverse()], !0), t.fill(), t.restore();
  }, d = (g, p) => {
    const m = c++, b = h(m, 99, !0);
    if (b.next() < a) {
      const T = (b.next() * 2 - 1) * e.lineWidth * 1.4, $ = (b.next() * 2 - 1) * e.lineWidth * 1.4, M = g.map((S) => ({ x: S.x + T, y: S.y + $ }));
      u(M, (S) => p(S) * 1.8, h(m, 98, !0), 0.035, o), u(M, (S) => p(S) * 0.45, h(m, 97, !0), 0.12, o * 1.5);
    }
    const v = g.slice(1).reduce((T, $, M) => T + Math.hypot($.x - g[M].x, $.y - g[M].y), 0), w = p(0.5) > 4 && v > p(0.5) * 6, y = w ? [-0.3, 0.3, 0] : [0];
    for (let T = 0; T < i; T++) {
      const $ = T === 0;
      y.forEach((M, S) => {
        const k = h(m, T * 10 + S), x = M === 0 ? g : Om(g, (E) => p(E) * M * Math.sqrt(Math.sin(Math.PI * E))), P = !$ && M === 0 ? e.lineWidth * (0.3 + k.next() * 0.8) : 0;
        u(x, (E) => p(E) * (w ? 0.5 : 1) * ($ ? 1 : 0.6), k, $ ? 0.85 : 0.45, o * ($ ? 0.6 : 1), P);
      });
    }
  }, f = (g, p, m, b, v, w) => {
    const T = h(c, 50).next() * Math.PI * 2;
    d(Al(g, p, m, b, v, T, 1.08, 48), () => w);
  };
  return {
    look: "pencil",
    ink: s,
    limb(g, p, m) {
      d(g, (b) => p + (m - p) * b);
    },
    line(g, p) {
      d(g, () => p);
    },
    shape(g, p, m) {
      p !== null && (t.save(), t.globalAlpha *= 0.88, t.fillStyle = p, fo(t, g, !0), t.fill(), t.restore()), m > 0 && d([...g, g[0]], () => m);
    },
    ellipse(g, p, m, b, v, w, y) {
      w !== null && (t.save(), t.globalAlpha *= 0.9, t.fillStyle = w, t.beginPath(), t.ellipse(g, p, m, b, v, 0, Math.PI * 2), t.fill(), t.restore()), f(g, p, m, b, v, y);
    },
    dot(g, p, m) {
      t.save(), t.globalAlpha *= 0.9, t.fillStyle = s, t.beginPath(), t.arc(g, p, m, 0, Math.PI * 2), t.fill(), t.restore();
    },
    guide(g) {
      if (n.construction === !1 || g.length < 2) return;
      const p = c++;
      u(g, () => Math.max(0.6, e.lineWidth * 0.18), h(p, 0), 0.28, o * 1.2, e.lineWidth);
    },
    guideEllipse(g, p, m, b, v) {
      if (n.construction === !1) return;
      const w = c++, y = h(w, 0), T = Al(g, p, m, b, v, y.next() * Math.PI * 2, 1.12, 48);
      u(T, () => Math.max(0.6, e.lineWidth * 0.18), y, 0.28, o * 1.5);
    }
  };
}
const Hm = ["thumb", "index", "middle", "ring", "pinky"], $t = {
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
function Ot(t = {}) {
  return { ...$t, ...t };
}
const qt = (t, e, n, s, o) => ({
  "thumb.curl": t,
  "index.curl": e,
  "middle.curl": n,
  "ring.curl": s,
  "pinky.curl": o
}), Pt = {
  relaxed: $t,
  open: Ot({ ...qt(0, 0, 0, 0, 0), "thumb.across": 0, spread: 0.55 }),
  spread: Ot({ ...qt(0, 0, 0, 0, 0), "thumb.across": 0, spread: 1 }),
  flat: Ot({ ...qt(0, 0, 0, 0, 0), "thumb.across": 0.35, spread: 0 }),
  fist: Ot({ ...qt(0.7, 1, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  point: Ot({ ...qt(0.75, 0, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  /** The fist on its side, knuckles toward the viewer, the thumb up */
  thumbsUp: Ot({ ...qt(0, 1, 1, 1, 1), "thumb.across": 0, spread: 0, roll: 70 }),
  peace: Ot({ ...qt(0.75, 0, 0, 1, 1), "thumb.across": 0.9, spread: 1 }),
  ok: Ot({ ...qt(0.12, 0.6, 0.1, 0.15, 0.2), "thumb.across": 0.55, spread: 0.6 }),
  pinch: Ot({ ...qt(0.1, 0.65, 0.75, 0.85, 0.9), "thumb.across": 0.55, spread: 0 }),
  cupped: Ot({ ...qt(0.25, 0.4, 0.4, 0.4, 0.4), "thumb.across": 0.4, spread: 0.05, turn: 2 }),
  wave: Ot({ ...qt(0, 0.05, 0.05, 0.1, 0.12), "thumb.across": 0, spread: 0.7, turn: 2 }),
  /** Holding a pencil to write: thumb and middle finger pinch it, the index finger rests on top */
  pencilGrip: Ot({ ...qt(0.1, 0.6, 0.72, 0.88, 0.95), "thumb.across": 0.5, spread: 0, turn: 0.8, bend: 10 }),
  /** Holding a handle, a cup or a bar: every finger wrapped round it */
  hold: Ot({ ...qt(0.5, 0.7, 0.72, 0.74, 0.76), "thumb.across": 0.75, spread: 0, turn: 1 })
};
function ds(t, e, n) {
  const s = { ...t };
  for (const [o, i] of Object.entries(e)) {
    const r = t[o] ?? i;
    s[o] = r + (i - r) * n;
  }
  return s;
}
const Cm = {
  index: { knuckle: [-0.16, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.125, fan: -1 },
  middle: { knuckle: [-0.055, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.13, fan: -0.2 },
  ring: { knuckle: [0.05, 0.475, -0.02], bones: [0.2, 0.125, 0.1], width: 0.122, fan: 0.55 },
  pinky: { knuckle: [0.15, 0.43, -0.02], bones: [0.16, 0.1, 0.085], width: 0.108, fan: 1.25 }
}, Rm = {
  index: { knuckle: [-0.14, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.15, fan: -1 },
  middle: { knuckle: [0, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.155, fan: 0 },
  pinky: { knuckle: [0.14, 0.45, -0.02], bones: [0.19, 0.115, 0.095], width: 0.145, fan: 1 }
}, pe = {
  base: [-0.11, 0.1, -0.05],
  bones: [0.2, 0.15, 0.12],
  widths: [0.2, 0.145, 0.135],
  /** Where the thumb points with `across` 0 and 1 */
  out: [-0.7, 0.68, -0.22],
  across: [0.35, 0.5, -0.8]
}, Lm = [82, 100, 62], Fm = [48, 72], Wm = 3, Nm = 13, Dm = 0.035, Bm = -0.075, zm = [
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
], Ae = (t) => t * Math.PI / 180, lr = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], Js = (t, e) => [t[0] * e, t[1] * e, t[2] * e], cr = (t, e) => [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]], Kn = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function Ue(t, e, n) {
  const s = Math.cos(n), o = Math.sin(n), i = cr(e, t), r = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
  return [
    t[0] * s + i[0] * o + e[0] * r * (1 - s),
    t[1] * s + i[1] * o + e[1] * r * (1 - s),
    t[2] * s + i[2] * o + e[2] * r * (1 - s)
  ];
}
const Pl = [1, 0, 0], Il = [0, 1, 0], ns = [0, 0, 1];
function qm(t, e, n) {
  const s = Ae(t.fan * (Wm + Nm * n)), o = [Math.sin(s), Math.cos(s), 0], i = [Math.cos(s), -Math.sin(s), 0], r = [t.knuckle];
  let a = 0;
  t.bones.forEach((h, u) => {
    a += Ae(Lm[u] * e), r.push(lr(r[u], Js(Ue(o, i, -a), h)));
  });
  const l = Ue(ns, i, -a), c = r.map((h, u) => t.width * (1 - 0.14 * (u / (r.length - 1))));
  return { joints: r, back: l, widths: c };
}
function Ym(t, e, n = 1, s = 1) {
  const o = Math.min(1, Math.max(0, e)), i = Kn(lr(Js(Kn(pe.out), 1 - o), Js(Kn(pe.across), o))), r = Kn(cr(ns, i)), a = Kn(cr(i, r)), l = [[pe.base[0] * s, pe.base[1], pe.base[2]]];
  let c = 0;
  pe.bones.forEach((d, f) => {
    f > 0 && (c += Ae(Fm[f - 1] * t)), l.push(lr(l[f], Js(Ue(i, r, c), d)));
  });
  const h = Ue(a, r, c), u = [...pe.widths, pe.widths[pe.widths.length - 1] * 0.92].map((d) => d * n);
  return { joints: l, back: h, widths: u };
}
function hr(t, e = {}) {
  const n = { ...$t, ...t }, s = e.size ?? 100, o = e.side ?? "right", i = o === "left" ? -1 : 1, r = Ae(e.angle ?? 0), a = e.fingers === 4, l = Math.max(0.5, e.plump ?? 1), c = 1 + (l - 1) * 0.7, h = (E) => ({
    ...E,
    knuckle: [E.knuckle[0] * c, E.knuckle[1], E.knuckle[2]],
    width: E.width * l
  }), u = Ae(n.bend ?? 0), d = Ae(n.tilt ?? 0), f = Ae(90 * (n.turn ?? 0)), g = (E) => Ue(Ue(Ue(E, Pl, -u), ns, -d), Il, f), p = Math.cos(r), m = Math.sin(r), b = Ae(n.roll ?? 0), v = Math.cos(b), w = Math.sin(b), y = (E) => {
    const O = E[0] * s, _ = -E[1] * s, L = (O * v - _ * w) * i, B = O * w + _ * v;
    return { x: L * p - B * m, y: L * m + B * p };
  }, T = (E) => {
    const O = y(E), _ = Math.hypot(O.x, O.y);
    return _ > 1e-6 * s ? { x: O.x / _, y: O.y / _ } : { x: 0, y: 0 };
  }, $ = {
    thumb: Ym(n["thumb.curl"] ?? 0, n["thumb.across"] ?? 0, l, c)
  }, M = a ? Rm : Cm;
  for (const E of Hm) {
    const O = M[E];
    O && ($[E] = qm(h(O), n[`${E}.curl`] ?? 0, n.spread ?? 0));
  }
  const S = {};
  for (const [E, O] of Object.entries($)) {
    const _ = O.joints.map(g), L = g(O.back);
    S[E] = {
      points: _.map(y),
      depths: _.map((B) => B[2] * s),
      widths: O.widths.map((B) => B * s),
      nail: L[2],
      back: T(L)
    };
  }
  const k = zm.flatMap(([E, O]) => [g([E * c, O, Dm]), g([E * c, O, Bm])]), x = Km(k.map(y)), P = k.reduce((E, O) => E + O[2], 0) / k.length * s;
  return {
    size: s,
    side: o,
    wrist: { x: 0, y: 0 },
    palm: x,
    palmDepth: P,
    palmFacing: -g(ns)[2],
    fingers: S,
    axes: { up: T(g(Il)), across: T(g(Pl)), out: T(g(ns)) },
    curls: Object.fromEntries(Object.keys(S).map((E) => [E, n[`${E}.curl`] ?? 0]))
  };
}
function jm(t, e) {
  const n = (o) => ({ x: o.x + e.x - t.wrist.x, y: o.y + e.y - t.wrist.y }), s = {};
  for (const [o, i] of Object.entries(t.fingers))
    s[o] = { ...i, points: i.points.map(n) };
  return { ...t, wrist: n(t.wrist), palm: t.palm.map(n), fingers: s };
}
function Km(t) {
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
const Xm = "#f1c9a5", Um = "#2f2f33";
function Qr(t, e, n, s = {}, o = 0) {
  const i = jm(hr(n, s), e), r = s.ink ?? Um, a = s.lineWidth ?? i.size * 0.035, l = s.pen ?? Bo(t, {
    look: s.look ?? "clean",
    ink: r,
    lineWidth: a,
    seed: s.seed ?? 1,
    time: o,
    pencil: { construction: !1, ...s.pencil }
  }), c = s.skin ?? Xm, h = s.nails ?? !0, u = [
    {
      depth: i.palmDepth,
      draw: () => Gm(l, i, c, a)
    }
  ];
  for (const d of Object.values(i.fingers)) {
    const f = d.depths.reduce((g, p) => g + p, 0) / d.depths.length;
    u.push({
      depth: f,
      draw: () => Vm(t, l, d, c, a, h)
    });
  }
  if (s.prop) {
    const d = s.prop;
    u.push({ depth: d.depth, draw: () => d.draw(l) });
  }
  t.save(), t.lineCap = "round", t.lineJoin = "round";
  for (const d of [...u].sort((f, g) => f.depth - g.depth)) d.draw();
  return t.restore(), i;
}
function Gm(t, e, n, s) {
  if (t.shape(e.palm, n, s), e.palmFacing < -0.3 && t.look !== "silhouette") {
    const { up: o } = e.axes;
    for (const [i, r] of Object.entries(e.fingers)) {
      const a = e.curls[i] ?? 0;
      if (i === "thumb" || a < 0.5) continue;
      const l = r.points[0], c = r.widths[0] * 0.42, h = { x: l.x - o.x * c * 0.2, y: l.y - o.y * c * 0.2 }, u = Math.atan2(o.y, o.x), d = Array.from({ length: 7 }, (f, g) => {
        const p = u - Math.PI / 2 + Math.PI * g / 6;
        return { x: h.x + Math.cos(p) * c, y: h.y + Math.sin(p) * c };
      });
      t.line(d, s * 0.6);
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
function Vm(t, e, n, s, o, i) {
  const { widths: r } = n, a = Jm(n.points, 2), l = n.points[0], c = a[a.length - 1], h = r[0], u = r[r.length - 1];
  if (t.save(), e.look !== "silhouette") {
    t.beginPath(), t.rect(l.x - 1e5, l.y - 1e5, 2e5, 2e5);
    const p = h / 2 + o * 1.6;
    t.moveTo(l.x + p, l.y), t.arc(l.x, l.y, p, 0, Math.PI * 2), t.clip("evenodd");
  }
  if (e.limb(a, h + 2 * o, u + 2 * o), t.restore(), e.look !== "silhouette" && (t.fillStyle = s, Zr(t, a, h, u)), e.look === "silhouette" || !i || n.nail < 0.25) return;
  const d = a[a.length - 2], f = Zm({ x: c.x - d.x, y: c.y - d.y }) ?? {
    x: 0,
    y: -1
  }, g = {
    x: c.x - f.x * u * 0.22 + n.back.x * u * 0.1,
    y: c.y - f.y * u * 0.22 + n.back.y * u * 0.1
  };
  e.ellipse(g.x, g.y, u * 0.24 * Math.max(0.35, n.nail), u * 0.19, Math.atan2(f.y, f.x), "#f8e3d3", o * 0.45);
}
function Jm(t, e) {
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
const Zm = (t) => {
  const e = Math.hypot(t.x, t.y);
  return e > 1e-6 ? { x: t.x / e, y: t.y / e } : null;
}, zt = {
  walk: { swing: 24, knee: 30, arm: 22, elbow: 28, lean: 4 },
  bouncy: { swing: 26, knee: 45, arm: 34, elbow: 30, lean: 2, bend: -4, bounce: 0.035, squash: 0.06 },
  doubleBounce: { swing: 22, knee: 40, arm: 26, elbow: 24, lean: 3, bounce: 0.02, bounces: 2, squash: 0.04 },
  sneak: { swing: 28, knee: 70, arm: 6, elbow: 0, forearm: 110, shoulder: 55, lean: 16, bend: 14, headTilt: -8, crouch: 50, tiptoe: 25 },
  strut: { swing: 26, knee: 30, arm: 30, elbow: 20, lean: -4, bend: -10, headTilt: -6, sway: 4, bounce: 0.01 },
  tired: { swing: 14, knee: 14, arm: 6, elbow: 6, lean: 10, bend: 16, headTilt: 12 },
  run: { swing: 40, knee: 95, arm: 45, elbow: 0, forearm: 90, lean: 16, bend: 6, bounce: 0.05, squash: 0.06 },
  shove: { swing: 18, knee: 28, arm: 0, elbow: 0, lean: 0 }
}, Qm = 40;
function zo(t) {
  return t === void 0 ? zt.walk : typeof t == "string" ? zt[t] ?? zt.walk : t;
}
function t1(t, e, n = lt, s = 1) {
  const o = zo(t);
  if (o === zt.walk) return n1(e, n, s);
  const i = e * Math.PI * 2, r = Math.sin(i) * s, a = Math.cos(i) * s, l = (b) => Math.abs(b) <= Qm, c = o.shoulder ?? 0, h = (b, v) => l(b) ? v * c + o.arm * r : b, u = o.forearm ?? 0, d = l(n.leftShoulder) ? n.leftElbow - u - o.elbow * Math.max(0, -r) : n.leftElbow, f = l(n.rightShoulder) ? n.rightElbow + u + o.elbow * Math.max(0, r) : n.rightElbow, g = o.bounces ?? 1, p = (1 + Math.cos(i * 2 * g)) / 2, m = o.crouch ?? 0;
  return {
    ...n,
    lean: n.lean + o.lean * s + (o.sway ?? 0) * Math.sin(i) * (1 - (n.turn ?? 0)),
    bend: (n.bend ?? 0) + (o.bend ?? 0),
    headTilt: n.headTilt - o.lean * 0.5 * s + (o.headTilt ?? 0),
    leftElbow: d,
    rightElbow: f,
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
function ur(t, e, n = 1) {
  const s = zo(t), o = zt.walk.swing, i = (r) => Math.sin(r * Math.PI / 180);
  return s1(e, n) * i(s.swing * n) / i(o * n);
}
const lt = {
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
function Ct(t) {
  return { ...lt, ...t };
}
const S0 = {
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
}, Ht = (t) => ({ ...S0, ...t }), vt = {
  neutral: S0,
  happy: Ht({ smile: 0.9, leftBrow: 0.2, rightBrow: 0.2 }),
  joyful: Ht({ mouth: 0.6, smile: 1, mouthWidth: 1.2, leftEye: 0, rightEye: 0, leftBrow: 0.4, rightBrow: 0.4 }),
  sad: Ht({ smile: -0.8, leftEye: 0.8, rightEye: 0.8, browTilt: 0.9, leftBrow: -0.1, rightBrow: -0.1, lookY: 0.6 }),
  crying: Ht({ mouth: 0.45, smile: -1, leftEye: 0, rightEye: 0, browTilt: 1, lookY: 0.4 }),
  surprised: Ht({ mouth: 0.7, mouthWidth: 0.7, leftEye: 1.5, rightEye: 1.5, leftBrow: 1, rightBrow: 1 }),
  shocked: Ht({ mouth: 1, mouthWidth: 0.8, leftEye: 1.6, rightEye: 1.6, leftBrow: 1, rightBrow: 1, browTilt: 0.4 }),
  angry: Ht({ smile: -0.6, mouthWidth: 0.9, leftEye: 0.8, rightEye: 0.8, leftBrow: -0.6, rightBrow: -0.6, browTilt: -1 }),
  furious: Ht({ mouth: 0.5, smile: -1, mouthWidth: 1.3, leftEye: 0.9, rightEye: 0.9, leftBrow: -0.9, rightBrow: -0.9, browTilt: -1 }),
  worried: Ht({ smile: -0.3, mouthWidth: 0.8, leftEye: 1.1, rightEye: 1.1, leftBrow: 0.3, rightBrow: 0.3, browTilt: 0.8, lookX: -0.5 }),
  scared: Ht({ mouth: 0.35, smile: -0.5, mouthWidth: 0.8, leftEye: 1.45, rightEye: 1.45, leftBrow: 0.8, rightBrow: 0.8, browTilt: 0.9 }),
  confused: Ht({ smile: -0.2, mouthWidth: 0.8, leftEye: 0.9, rightEye: 1.15, leftBrow: -0.3, rightBrow: 0.8, lookX: 0.5, lookY: -0.4 }),
  skeptical: Ht({ smile: -0.1, leftEye: 0.6, rightEye: 1, leftBrow: -0.4, rightBrow: 0.7, lookX: 0.4 }),
  thinking: Ht({ smile: 0, mouthWidth: 0.7, leftBrow: 0.3, rightBrow: 0.5, lookX: 0.6, lookY: -0.8 }),
  sleepy: Ht({ smile: 0.1, leftEye: 0.25, rightEye: 0.25, leftBrow: -0.3, rightBrow: -0.3, lookY: 0.5 }),
  disgusted: Ht({ smile: -0.7, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.75, leftBrow: -0.5, rightBrow: -0.2, browTilt: -0.4, lookX: -0.6 }),
  smug: Ht({ smile: 0.6, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.6, leftBrow: 0.1, rightBrow: 0.5, lookX: 0.5 }),
  wink: Ht({ smile: 0.9, leftEye: 0, rightEye: 1, leftBrow: -0.2, rightBrow: 0.3 })
};
function De(t, e) {
  return { ...t, ...typeof e == "string" ? vt[e] : e };
}
const Zt = {
  rest: lt,
  wave: Ct({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...vt.happy }),
  cheer: Ct({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...vt.joyful }),
  shrug: Ct({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...vt.confused, lookX: 0, lookY: 0 }),
  point: Ct({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: Ct({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...vt.thinking }),
  handsOnHips: Ct({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: Ct({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...vt.sad }),
  surprised: Ct({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...vt.surprised }),
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: Ct({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  // Seated, hands resting on the knees. Arm angles spread outward per side, so
  // reaching forward (+x, the way the figure faces) is negative for the left arm.
  sit: Ct({ sit: 1, turn: 0.5, leftShoulder: -25, rightShoulder: 25, leftElbow: -55, rightElbow: 55 }),
  jump: Ct({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...vt.joyful }),
  // Ducking: squashed low, bent over, arms over the head.
  duck: Ct({ stretch: 0.62, bend: 28, headTilt: -8, leftShoulder: 150, rightShoulder: 150, leftElbow: 130, rightElbow: 130, leftHip: 25, rightHip: 25, ...vt.scared }),
  // Lying on its back on the floor (rolled back about the hips and lowered), hands behind the head.
  lie: Ct({ spin: -90, rise: -0.42, leftShoulder: 165, rightShoulder: 165, leftElbow: 150, rightElbow: 150, ...vt.sleepy }),
  // Full splits: legs flat along the floor, so the planted feet bring the hips right down to it.
  // Side (straddle) split, seen front-on: each leg straight out to its side, toes pointed.
  sideSplit: Ct({ leftHip: 90, rightHip: 90, leftAnkle: -45, rightAnkle: -45, leftShoulder: 120, rightShoulder: 120, leftElbow: 10, rightElbow: 10, ...vt.happy }),
  // Front split, in profile: the left leg forward (+x), the right leg back.
  frontSplit: Ct({ turn: 1, leftHip: -90, rightHip: -90, leftAnkle: -45, rightAnkle: -45, leftShoulder: -150, rightShoulder: 150, leftElbow: 10, rightElbow: -10, ...vt.happy })
}, T0 = Object.keys(lt);
function fs(t, e, n) {
  const s = { ...t };
  for (const o of T0) s[o] = t[o] + (e[o] - t[o]) * n;
  return s;
}
const dr = 24, Ol = 4, _l = 28, e1 = 40;
function n1(t, e = lt, n = 1) {
  const s = Math.sin(t * Math.PI * 2) * n, o = Math.cos(t * Math.PI * 2) * n, i = (c) => Math.abs(c) <= e1, r = (c) => i(c) ? 22 * s : c, a = i(e.leftShoulder) ? e.leftElbow - _l * Math.max(0, -s) : e.leftElbow, l = i(e.rightShoulder) ? e.rightElbow + _l * Math.max(0, s) : e.rightElbow;
  return {
    ...e,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: e.lean + Ol * n,
    headTilt: e.headTilt - Ol * 0.5 * n,
    leftElbow: a,
    rightElbow: l,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -dr * s,
    rightHip: -dr * s,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, o),
    rightKnee: 30 * Math.max(0, -o),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: r(e.leftShoulder),
    rightShoulder: r(e.rightShoulder)
  };
}
function s1(t, e = 1) {
  return 4 * ((fr + po) * t) * Math.sin(dr * e * Math.PI / 180);
}
function o1(t) {
  const e = Math.abs(Math.sin(t / 65)), n = 0.55 + 0.45 * Math.sin(t / 310);
  return e * n;
}
const E0 = 0.12, Hl = 0.46, i1 = 1 - 2 * E0, r1 = 0.1, a1 = 0.21, l1 = 0.19, fr = 0.24, po = 0.22, A0 = 0.12, c1 = 0.14, $0 = 0.33, Cl = 0.7, Rl = 0.3, h1 = 0.35, u1 = [1.7, 1.05], d1 = [1.3, 0.75], Ll = [1.45, 0.85], f1 = [1.15, 0.75], Fl = 0.06, p1 = 0.7, g1 = 0.65, P0 = 0.075, m1 = 0.3, y1 = 0.02, b1 = 0.012, w1 = 12, k1 = 0.25, _s = 90, v1 = 0.25, M1 = 0.04, I0 = 0.01, Be = (t) => Math.min(1, Math.max(0, t ?? 0));
function QM(t, e = 1) {
  return po * t * e;
}
const pr = -0.12, O0 = 0.4, Gt = (t) => t * Math.PI / 180, x1 = (t, e) => ({ x: e * Math.sin(Gt(t)), y: Math.cos(Gt(t)) }), _0 = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), H0 = (t, e, n, s) => t - 0.3 * e - n * 0.14 * e - Math.max(0, s - 1) * 0.12 * e;
function S1(t, e, n, s, o, i) {
  const r = Math.max(1, Math.min(i * 0.6, c1 * n)), a = Be(e.turn), l = (A0 + $0 * a) * n, c = s + pr * n, h = l + e.lookX * 0.08 * n, u = e.lookY * 0.07 * n, d = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * n * (1 - Cl * a), squeeze: 1 - Cl * a, open: e.leftEye, brow: e.leftBrow, side: -1 },
    { x: 0.34 * n * (1 - Rl * a), squeeze: 1 - Rl * a, open: e.rightEye, brow: e.rightBrow, side: 1 }
  ];
  t.fillStyle = o, t.strokeStyle = o, t.lineWidth = r;
  for (const b of d) {
    const v = _0(b.open, e.blink);
    if (v < 0.2) {
      const $ = e.smile > 0.5 ? -0.12 * n : 0.06 * n;
      t.beginPath(), t.moveTo(b.x + l - 0.12 * n, c), t.quadraticCurveTo(b.x + l, c + $, b.x + l + 0.12 * n, c), t.stroke();
    } else {
      if (v > 1.2) {
        const M = 0.13 * n * v;
        t.beginPath(), t.ellipse(b.x + l, c, M * 0.85, M, 0, 0, Math.PI * 2), t.fillStyle = "#ffffff", t.fill(), t.stroke(), t.fillStyle = o;
      }
      const $ = v > 1.2 ? 0.075 * n : 0.1 * n;
      t.beginPath(), t.ellipse(b.x + h, c + u, $, $ * 1.1 * Math.min(v, 1), 0, 0, Math.PI * 2), t.fill();
    }
    const w = H0(c, n, b.brow, v), y = b.x + l - b.side * 0.13 * n * b.squeeze, T = b.x + l + b.side * 0.13 * n * b.squeeze;
    t.beginPath(), t.moveTo(T, w), t.lineTo(y, w - e.browTilt * 0.1 * n), t.stroke();
  }
  const f = s + O0 * n, g = 0.25 * n * Math.max(0.3, e.mouthWidth) * (1 - h1 * a), p = Math.min(1, Math.max(0, e.mouth));
  if (t.beginPath(), p <= 0.05) {
    t.moveTo(l - g, f), t.quadraticCurveTo(l, f + e.smile * 0.25 * n, l + g, f), t.stroke();
    return;
  }
  const m = 0.3 * n * p;
  e.smile > 0.3 ? (t.moveTo(l - g, f - 0.05 * n), t.lineTo(l + g, f - 0.05 * n), t.quadraticCurveTo(l, f + m * 2, l - g, f - 0.05 * n)) : e.smile < -0.3 ? (t.moveTo(l - g, f + m * 0.6), t.lineTo(l + g, f + m * 0.6), t.quadraticCurveTo(l, f - m * 1.4, l - g, f + m * 0.6)) : t.ellipse(l, f, g * 0.8, m, 0, 0, Math.PI * 2), t.fill();
}
function C0(t, e) {
  const n = e.height ?? 300, s = Math.min(3, Math.max(0.3, t.stretch ?? 1)), o = Math.sqrt(s), i = e.armLength ?? 1;
  if (!Number.isFinite(i) || i <= 0) throw new Error("stick figure: armLength must be a positive finite multiplier");
  const r = (e.headSize ?? 2 * E0) / 2, a = e.headSize === void 0 ? i1 : 1 - 2 * r, l = r * n, c = Be(t.sit), h = t.leftHip + (-_s - t.leftHip) * c, u = t.leftKnee + (-_s - t.leftKnee) * c, d = t.rightHip + (_s - t.rightHip) * c, f = t.rightKnee + (_s - t.rightKnee) * c, g = e.classic === !0, p = Be(t.turn), m = (q, R, D, I, A) => {
    const H = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.abs(Gt(R - D) / 2) + Gt(I))), N = Math.max(-1, Math.min(1, p1 + A)), z = p + (1 - p) * q * N;
    return g ? { x: 0, y: 0 } : { x: Math.cos(H) * Fl * z, y: Math.sin(H) * Fl };
  }, b = { left: t.leftAnkle ?? 0, right: t.rightAnkle ?? 0 }, v = { left: t.leftFootOut ?? 0, right: t.rightFootOut ?? 0 };
  let w = 0;
  if (c > 0 || !g) {
    const q = (A, H, N, z, W) => fr * Math.cos(Gt(H)) + po * Math.cos(Gt(H - N)) + Math.max(0, m(A, H, N, z, W).y), R = Math.max(
      q(-1, h, u, b.left, v.left),
      q(1, d, f, b.right, v.right)
    ), D = 1 - Be((t.rise ?? 0) / M1), I = (g ? Math.min(1, c / v1) : 1) * D;
    w = (Hl - R) * I * n * s;
  }
  const y = -Hl * n * s + w, T = -a * n * s + w, $ = g ? 0 : (y1 * Be(t.turn) + b1 * c) * n * s, M = Gt(t.bend ?? 0), S = { end: Nl(y, T, M, 1), bend: M };
  let k;
  if (M !== 0) {
    k = [];
    for (let q = 0; q <= Wl; q++) {
      const R = q / Wl, D = Nl(y, T, M, R);
      k.push({ x: D.x - $ * Math.sin(Math.PI * R), y: D.y });
    }
  } else
    k = $ === 0 ? [{ x: 0, y }, { x: 0, y: T }] : Cn({ x: 0, y }, { x: -$, y: (y + T) / 2 }, { x: 0, y: T }, 1, 8);
  const x = T + r1 * n * s, P = (e.shoulderWidth ?? 0) * n * Math.cos(p * Math.PI / 2), E = (q, R, D, I, A) => {
    const H = x1(D, I);
    return { x: q + H.x * A * n, y: R + H.y * A * n };
  }, O = (q, R, D) => {
    const I = E(0, y, R, q, fr * s);
    return { root: { x: 0, y }, joint: I, end: E(I.x, I.y, R - D, q, po * s) };
  }, _ = (q, R, D) => {
    const I = { x: q * P, y: x }, A = E(I.x, I.y, R, q, a1 * o * i);
    return { root: I, joint: A, end: E(A.x, A.y, R + D, q, l1 * o * i) };
  }, L = { left: O(-1, h, u), right: O(1, d, f) }, B = (q, R, D, I, A, H) => {
    const N = m(q, D, I, A, H);
    return { x: R.end.x + N.x * n * s, y: R.end.y + N.y * n * s };
  }, X = (q, R, D, I, A) => E(R.end.x, R.end.y, D + I + A, q, P0 * o), J = {
    left: _(-1, t.leftShoulder, t.leftElbow),
    right: _(1, t.rightShoulder, t.rightElbow)
  };
  return {
    height: n,
    facing: (e.facing ?? 1) < 0 ? -1 : 1,
    stretch: s,
    lineWidth: e.lineWidth ?? n * 0.025,
    rubber: Math.min(1, Math.max(g ? 0 : m1, e.rubber ?? 0)),
    r: l,
    // The head keeps its area: taller and narrower when stretched.
    headRx: l / Math.sqrt(s),
    headRy: l * Math.sqrt(s),
    hipY: y,
    neckY: T,
    drop: w,
    lean: g ? t.lean : t.lean + w1 * Math.sin(Math.PI * c),
    classic: g,
    legs: L,
    toes: {
      left: B(-1, L.left, h, u, b.left, v.left),
      right: B(1, L.right, d, f, b.right, v.right)
    },
    spine: k,
    chest: S,
    arms: J,
    handTips: {
      left: X(-1, J.left, t.leftShoulder, t.leftElbow, t.leftWrist ?? 0),
      right: X(1, J.right, t.rightShoulder, t.rightElbow, t.rightWrist ?? 0)
    }
  };
}
const Wl = 10;
function Nl(t, e, n, s) {
  const o = t - e, i = n * s;
  if (Math.abs(n) < 1e-9) return { x: 0, y: t - o * s };
  const r = o / n;
  return { x: r * (1 - Math.cos(i)), y: t - r * Math.sin(i) };
}
function T1(t, e) {
  if (t.chest.bend === 0) return e;
  const n = ps(e, { x: 0, y: t.neckY }, t.chest.bend);
  return { x: n.x + t.chest.end.x, y: n.y + t.chest.end.y - t.neckY };
}
const ts = (t, e) => e === 0 ? [t.root, t.joint, t.end] : Cn(t.root, t.joint, t.end, e);
function ps(t, e, n) {
  const s = Math.cos(n), o = Math.sin(n), i = t.x - e.x, r = t.y - e.y;
  return { x: e.x + i * s - r * o, y: e.y + i * o + r * s };
}
function R0(t, e, n = !0) {
  const s = A1(t, e), o = e.spin ?? 0, i = e.rise ?? 0;
  return n && (o !== 0 || i !== 0) ? E1(s, t, o, i) : s;
}
function L0(t, e, n) {
  return { pivot: { x: 0, y: t.hipY }, angle: t.facing * Gt(e), lift: n * t.height };
}
function E1(t, e, n, s) {
  const { pivot: o, angle: i, lift: r } = L0(e, n, s), a = (d) => {
    const f = ps(d, o, i);
    return { x: f.x, y: f.y - r };
  }, l = (d) => ({ left: a(d.left), right: a(d.right) }), c = { left: Math.max(a(t.feet.left).y, a(t.toes.left).y), right: Math.max(a(t.feet.right).y, a(t.toes.right).y) }, h = Math.max(c.left, c.right), u = I0 * e.height;
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
function A1(t, e) {
  const n = Gt(t.lean), s = Gt(e.headTilt), o = { x: 0, y: t.hipY }, i = (y) => ({ x: t.facing * y.x, y: y.y }), r = (y) => i(ps(y, o, n)), a = (y) => r(T1(t, y)), l = (y) => a(ps({ x: y.x, y: y.y + t.neckY }, { x: 0, y: t.neckY }, s)), c = ts(t.arms.left, t.rubber).map(a), h = ts(t.arms.right, t.rubber).map(a), u = (y, T) => Math.atan2(T.y - y.y, T.x - y.x), d = { left: a(t.handTips.left), right: a(t.handTips.right) }, f = (y, T) => {
    const [$, M] = y.slice(-2), S = t.arms[T], k = u(a(S.end), d[T]) - u(a(S.joint), a(S.end));
    return u($, M) + k;
  };
  let g = 1 / 0;
  for (const [y, T] of [
    [e.leftBrow, e.leftEye],
    [e.rightBrow, e.rightEye]
  ]) {
    const $ = H0(pr, 1, y, _0(T, e.blink));
    g = Math.min(g, $, $ - e.browTilt * 0.1);
  }
  const p = { left: i(t.legs.left.end), right: i(t.legs.right.end) }, m = { left: i(t.toes.left), right: i(t.toes.right) }, b = { left: Math.max(p.left.y, m.left.y), right: Math.max(p.right.y, m.right.y) }, v = Math.max(b.left, b.right), w = I0 * t.height;
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
    feetY: v,
    grounded: { left: b.left >= v - w, right: b.right >= v - w },
    fingertips: d,
    handAngle: { left: f(c, "left"), right: f(h, "right") },
    limbs: {
      leftArm: c,
      rightArm: h,
      leftLeg: ts(t.legs.left, t.rubber).map(i),
      rightLeg: ts(t.legs.right, t.rubber).map(i),
      spine: t.spine.map(r)
    },
    head: {
      center: l({ x: 0, y: -t.headRy }),
      rx: t.headRx,
      ry: t.headRy,
      // Mirroring a turn reverses it.
      angle: t.facing * (n + t.chest.bend + s),
      eyeY: pr,
      browTopY: g,
      mouthY: O0,
      faceX: t.facing * (A0 + $0 * Be(e.turn))
    }
  };
}
function le(t, e = {}) {
  return R0(C0(t, e), t);
}
function tx(t, e, n) {
  return ps({ x: t.center.x + e * t.rx, y: t.center.y + n * t.ry }, t.center, t.angle);
}
function $1(t, e, n) {
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
function P1(t, e, n = {}, s = 0) {
  const o = C0(e, n), i = n.color ?? "#1e293b", r = n.layers ?? {}, a = n.layers ? R0(o, e, !1) : void 0, l = n.sketch ? ar(t, n.sketch, s) : void 0, c = n.sketch && n.layers ? ar(t, n.sketch, s) : void 0, h = (M) => {
    t.save(), M(), t.restore();
  }, u = (M) => {
    M && a && h(() => M(t, a, s, c));
  }, d = () => t.scale(o.facing, 1), f = () => {
    d(), t.translate(0, o.hipY), t.rotate(Gt(o.lean)), t.translate(0, -o.hipY);
  }, g = () => {
    f(), o.chest.bend !== 0 && (t.translate(o.chest.end.x, o.chest.end.y), t.rotate(o.chest.bend), t.translate(0, -o.neckY));
  }, p = (M, S, k) => {
    if (l) return S ? l.curve(M) : l.line(M);
    if (o.classic) {
      t.beginPath(), t.moveTo(M[0].x, M[0].y);
      for (const x of M.slice(1)) t.lineTo(x.x, x.y);
      t.stroke();
      return;
    }
    Zr(t, M, k[0] * o.lineWidth, k[1] * o.lineWidth);
  }, m = (M, S) => p(ts(M, o.rubber), o.rubber > 0, S), b = (M) => {
    o.classic || p([o.legs[M].end, o.toes[M]], !1, f1);
  }, v = (M) => {
    if (n.hands && !o.classic) return y(M);
    if (o.classic || l) return;
    const S = o.arms[M].end;
    t.beginPath(), t.arc(S.x, S.y, g1 * o.lineWidth, 0, Math.PI * 2), t.fill();
  };
  t.save(), t.strokeStyle = i, t.fillStyle = i, t.lineWidth = o.lineWidth, t.lineCap = "round", t.lineJoin = "round";
  const w = L0(o, e.spin ?? 0, e.rise ?? 0);
  (w.angle !== 0 || w.lift !== 0) && (t.translate(0, -w.lift), t.translate(w.pivot.x, w.pivot.y), t.rotate(w.angle), t.translate(-w.pivot.x, -w.pivot.y));
  function y(M) {
    const S = n.hands ?? {}, k = o.arms[M].end, x = o.handTips[M], P = n.headFill ?? "#ffffff";
    Qr(t, k, S[M] ?? $t, {
      side: M,
      // Degrees clockwise from straight up, in the frame the hand is drawn in.
      angle: Math.atan2(x.x - k.x, k.y - x.y) * 180 / Math.PI,
      size: (S.size ?? P0) * o.height * Math.sqrt(o.stretch),
      skin: S.skin ?? (P === "none" ? void 0 : P),
      ink: i,
      lineWidth: o.lineWidth * 0.45,
      fingers: S.fingers,
      plump: S.plump,
      look: n.sketch ? "pencil" : "clean",
      seed: n.sketch?.seed
    }, s);
  }
  const T = (M) => {
    h(() => {
      g(), m(o.arms[M], d1), v(M);
    });
    const S = r.sleeve;
    S && a && h(() => S(t, a, M, s, c));
  }, $ = Be(e.turn) > k1;
  u(r.behind), h(() => {
    d(), m(o.legs.left, Ll), b("left"), m(o.legs.right, Ll), b("right");
  }), $ && T("left"), h(() => {
    f(), p(o.spine, o.spine.length > 2, u1);
  }), h(() => {
    g();
    const { left: M, right: S } = { left: o.arms.left.root, right: o.arms.right.root };
    if (M.x !== S.x)
      if (o.classic) p([M, S], !1, [1, 1]);
      else {
        const k = { x: (M.x + S.x) / 2, y: M.y - 0.3 * Math.abs(S.x - M.x) };
        p(Cn(M, k, S, 1, 8), !0, [1.1, 1.1]);
      }
  }), u(r.body), $ || T("left"), T("right"), u(r.behindHead), h(() => {
    g(), t.translate(0, o.neckY), t.rotate(Gt(e.headTilt));
    const M = -o.headRy;
    t.beginPath(), t.ellipse(0, M, o.headRx, o.headRy, 0, 0, Math.PI * 2);
    const S = n.headFill ?? "#ffffff";
    if (S !== "none" && (t.fillStyle = S, t.fill()), l) {
      l.ellipse(0, M, o.headRx, o.headRy);
      const k = l.nudge();
      t.translate(k.x, k.y);
    } else
      t.stroke();
    t.translate(0, M), t.scale(o.headRx / o.r, o.headRy / o.r), S1(t, e, o.r, 0, i, o.lineWidth);
  }), u(r.overHead), u(r.front), t.restore(), n.label && (t.save(), t.fillStyle = i, t.font = n.labelFont ?? `700 ${Math.round(o.height * 0.11)}px sans-serif`, t.textAlign = "center", t.textBaseline = "bottom", t.fillText(n.label, 0, -o.height * o.stretch - 0.04 * o.height + o.drop), t.restore());
}
function F0(t, e, n, s) {
  const o = { ...t }, i = t.gait && s?.[t.gait] || t.gait;
  let r = t.walking > 0 ? fs(o, t1(i, t.walk, o), t.walking) : o, a = O1(t);
  const l = t.dancing ?? 0;
  if (n && l > 0) {
    const c = n(t.beat ?? 0);
    if (r = fs(r, c.pose, l), c.hands) {
      const h = (u, d) => d ? ds(u ?? $t, d, l) : u;
      a = { left: h(a?.left, c.hands.left), right: h(a?.right, c.hands.right) };
    }
  }
  return t.talk > 0 && (r = { ...r, mouth: Math.max(r.mouth, t.talk * o1(e)) }), { pose: r, hands: a };
}
function I1(t, e, n, s) {
  return F0(t, e, n, s).pose;
}
const W0 = (t, e) => (t.facing ?? e.facing ?? 1) < 0 ? -1 : 1, go = (t, e) => `hand.${t}.${e}`;
function O1(t) {
  const e = (o) => {
    if (typeof t[go(o, "spread")] == "number")
      return Object.fromEntries(Object.keys($t).map((i) => [i, t[go(o, i)]]));
  }, n = e("left"), s = e("right");
  return n || s ? { left: n, right: s } : void 0;
}
function _1(t, e) {
  return !e || !t.hands ? t : { ...t, hands: { ...t.hands, left: e.left ?? t.hands.left, right: e.right ?? t.hands.right } };
}
function N0(t) {
  const e = t.style ?? {}, n = e.height ?? 300, s = n * 0.8, o = { ...Ct(t.pose ?? {}), walk: 0, walking: 0, gait: "walk", facing: (e.facing ?? 1) < 0 ? -1 : 1, talk: 0, rubber: e.rubber ?? 0, beat: 0, dancing: 0 }, i = {};
  if (e.hands)
    for (const r of ["left", "right"]) {
      const a = e.hands[r] ?? $t;
      for (const l of Object.keys($t)) i[go(r, l)] = a[l] ?? $t[l];
    }
  return {
    type: "custom",
    x: t.x - s / 2,
    y: t.y - n,
    width: s,
    height: n,
    props: { ...o, ...i },
    about: H1(Object.keys(i), t.cast),
    figureStyle: e,
    figureDance: t.dance,
    figureGaits: t.cast?.gaits,
    draw(r, a, l) {
      const c = a.props, h = F0(c, l, t.dance, t.cast?.gaits);
      r.translate(s / 2, n), P1(r, h.pose, _1({ ...e, rubber: c.rubber, facing: W0(c, e) }, h.hands), l);
    }
  };
}
function H1(t, e) {
  const n = { ...w0, ...k0 };
  for (const s of t) {
    const [, o, ...i] = s.split("."), r = v0[i.join(".")];
    r && (n[s] = { ...r, description: `${o === "left" ? "Left" : "Right"} hand: ${r.description.toLowerCase()}` });
  }
  return {
    kind: "stick figure",
    summary: "A poseable stick figure: pose it with joint tracks, or give it beats (`scriptTracks`) that compile into acted tracks.",
    props: n,
    // Read when asked: the list is registered by the acting module (see figure-actions).
    get actions() {
      return Tm(e);
    }
  };
}
function D0(t, e, n) {
  const s = t.figureStyle;
  if (!s) throw new Error("stickFigureAt: the target was not made by stickFigureTarget");
  const o = { ...t.props };
  let i = 0, r = 0;
  for (const [c, h] of e.state?.values.get(n) ?? [])
    c === "gait" && typeof h == "string" && (o.gait = h), typeof h == "number" && (c === "x" || c === "motionPathX" ? i = h : c === "y" || c === "motionPathY" ? r = h : c in o && (o[c] = h));
  const a = I1(o, e.time, t.figureDance, t.figureGaits), l = le(a, { ...s, rubber: o.rubber, facing: W0(o, s) });
  return { pose: a, joints: $1(l, t.x + i + t.width / 2, t.y + r + t.height) };
}
function ta(t) {
  const e = [];
  return t.forEach((n, s) => {
    const o = s === 0 ? lt : e[s - 1], i = typeof n.pose == "string" ? Zt[n.pose] : { ...o, ...n.pose };
    e.push(n.expression ? De(i, n.expression) : i);
  }), e;
}
function ex(t, e) {
  const n = ta(e);
  return T0.filter((s) => n.some((o) => o[s] !== lt[s])).map((s) => ({
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
const ki = 0.5, gr = {
  /** Flag: fingers together and straight, thumb bent in */
  pataka: Ot({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Pataka with the ring finger bent */
  tripataka: Ot({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 1, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Lotus in bloom: fingers fanned, each a little more curled than the last */
  alapadma: Ot({ "thumb.curl": 0.1, "thumb.across": 0, "index.curl": 0.05, "middle.curl": 0.15, "ring.curl": 0.25, "pinky.curl": 0.35, spread: 1, turn: 2 }),
  /** Fist */
  mushti: Pt.fist,
  /** Fist, thumb up */
  shikhara: Pt.thumbsUp,
  /** Swan's beak: thumb and index touch, the others fanned */
  hamsasya: Ot({ "thumb.curl": 0.15, "thumb.across": 0.6, "index.curl": 0.6, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0.7, turn: 2 }),
  /** Bracelet: thumb, index and middle meet, ring and little finger out */
  katakamukha: Ot({ "thumb.curl": 0.2, "thumb.across": 0.6, "index.curl": 0.65, "middle.curl": 0.7, "ring.curl": 0, "pinky.curl": 0, spread: 0.4, turn: 2 })
};
function mo(t) {
  return typeof t != "string" ? t : t in gr ? gr[t] : Pt[t];
}
function B0(t, e, n) {
  const s = [];
  for (const o of t.keys) {
    const i = s[s.length - 1], r = !i || o.reset ? { pose: e, ...n } : i;
    s.push({
      beat: o.beat,
      pose: { ...r.pose, ...o.pose },
      left: o.hands?.left ? mo(o.hands.left) : r.left,
      right: o.hands?.right ? mo(o.hands.right) : r.right,
      easing: o.easing ?? t.easing
    });
  }
  return s;
}
const ea = (t, e) => (t % e + e) % e;
function C1(t, e, n, s) {
  const o = B0(t, n, s);
  if (o.length === 0) return { pose: n, hands: s };
  const i = ea(e, t.beats);
  let r = o.length - 1;
  for (let f = 0; f < o.length; f++) o[f].beat <= i && (r = f);
  const a = o[r], l = o[(r + 1) % o.length], c = a.beat <= i ? a.beat : a.beat - t.beats, h = l.beat > c ? l.beat : l.beat + t.beats, u = h > c ? (i - c) / (h - c) : 0, d = Ft(l.easing ?? "ease-in-out")(Math.min(1, Math.max(0, u)));
  return {
    pose: fs(a.pose, l.pose, d),
    hands: { left: ds(a.left, l.left, d), right: ds(a.right, l.right, d) }
  };
}
const R1 = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftWrist", "rightWrist"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
  ["leftAnkle", "rightAnkle"],
  ["leftFootOut", "rightFootOut"],
  ["leftEye", "rightEye"],
  ["leftBrow", "rightBrow"]
], L1 = ["lean", "headTilt", "lookX", "spin"], F1 = /* @__PURE__ */ new Set(["leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee"]);
function W1(t) {
  const e = { ...t }, n = (t.turn ?? 0) >= 0.5;
  for (const [s, o] of R1) {
    const i = n && F1.has(s) ? -1 : 1;
    e[s] = i * t[o], e[o] = i * t[s];
  }
  if (!n) for (const s of L1) e[s] = -t[s];
  return e;
}
const N1 = (t) => Math.min(1, Math.max(-1, (0.5 - t) * 4));
function D1(t, e, n) {
  const s = ea(n, 1), o = (1 + Math.cos(2 * Math.PI * s)) / 2, i = e.bounce * (e.accent === "up" ? 1 - o : o), r = Math.min(1, Math.max(0, t.turn ?? 0)), a = N1(r);
  return {
    ...t,
    leftHip: t.leftHip + a * i / 2,
    rightHip: t.rightHip + i / 2,
    leftKnee: t.leftKnee + a * i,
    rightKnee: t.rightKnee + i,
    lean: t.lean + (e.sway ?? 0) * (1 - r) * Math.sin(Math.PI * n)
  };
}
function mr(t) {
  const e = { ...lt, ...t.stance };
  return t.expression ? De(e, t.expression) : e;
}
function z0(t) {
  return {
    left: t.hands?.left ? mo(t.hands.left) : $t,
    right: t.hands?.right ? mo(t.hands.right) : $t
  };
}
function vi(t, e, n) {
  const s = t.moves[e.move];
  if (!s) throw new Error(`dance: "${t.label}" has no move "${e.move}"`);
  const o = C1(s, n, mr(t), z0(t));
  return e.mirror ? { pose: W1(o.pose), hands: { left: o.hands?.right, right: o.hands?.left } } : o;
}
function na(t, e, n = {}) {
  const s = typeof t == "string" ? sn[t] : t;
  let o;
  if (n.move)
    o = vi(s, { move: n.move, mirror: n.mirror }, e);
  else {
    const i = s.routine, r = i.reduce((u, d) => u + d.beats, 0), a = ea(e, r);
    let l = 0, c = 0;
    for (; c < i.length - 1 && a >= l + i[c].beats; ) l += i[c++].beats;
    const h = a - l;
    if (o = vi(s, i[c], h), h < ki && i.length > 1 && e >= ki) {
      const u = i[(c - 1 + i.length) % i.length], d = vi(s, u, u.beats + h), f = Ft("ease-in-out")(h / ki);
      o = {
        pose: fs(d.pose, o.pose, f),
        hands: { left: ds(d.hands.left, o.hands.left, f), right: ds(d.hands.right, o.hands.right, f) }
      };
    }
  }
  return { ...o, pose: D1(o.pose, s.groove, e) };
}
function nx(t, e, n = {}) {
  return na(t, e, n).pose;
}
function sa(t) {
  return (typeof t == "string" ? sn[t] : t).routine.reduce((n, s) => n + s.beats, 0);
}
const B1 = { leftToe: "rightToe", rightToe: "leftToe", leftHeel: "rightHeel", rightHeel: "leftHeel" };
function Dl(t, e, n, s, o, i, r) {
  for (let a = 0; a * t.beats < n; a++)
    for (const l of t.keys) {
      const c = a * t.beats + l.beat, h = e + c;
      if (!(c >= n || h < i || h >= r))
        for (const u of l.taps ?? []) o.push({ beat: h, tap: s ? B1[u] : u });
    }
}
function sx(t, e, n, s = {}) {
  const o = typeof t == "string" ? sn[t] : t, i = [];
  if (n <= e) return i;
  if (s.move) {
    const r = o.moves[s.move], a = Math.floor(e / r.beats) * r.beats;
    Dl(r, a, Math.ceil((n - a) / r.beats) * r.beats, s.mirror, i, e, n);
  } else {
    const r = sa(o);
    for (let a = Math.floor(e / r) * r; a < n; a += r) {
      let l = a;
      for (const c of o.routine)
        Dl(o.moves[c.move], l, c.beats, c.mirror, i, e, n), l += c.beats;
    }
  }
  return i.sort((r, a) => r.beat - a.beat);
}
function Bl(t, e) {
  const n = t.moves[e.move];
  if (!n?.travel) return 0;
  const s = n.travel / n.beats;
  return e.mirror ? (B0(n, mr(t), z0(t))[0]?.pose.turn ?? mr(t).turn ?? 0) >= 0.5 ? s : -s : s;
}
function q0(t, e) {
  return e.move ? [{ move: e.move, beats: t.moves[e.move].beats, mirror: e.mirror }] : t.routine;
}
function Mi(t, e, n = {}) {
  const s = typeof t == "string" ? sn[t] : t, o = q0(s, n), i = o.reduce((h, u) => h + u.beats, 0), r = o.reduce((h, u) => h + Bl(s, u) * u.beats, 0), a = Math.floor(e / i);
  let l = a * r, c = e - a * i;
  for (const h of o) {
    const u = Math.min(h.beats, c);
    if (l += Bl(s, h) * u, c -= u, c <= 0) break;
  }
  return l;
}
function z1(t, e, n) {
  const s = q0(t, n), o = [0];
  let i = 0;
  for (let r = 0; i < e; r = (r + 1) % s.length)
    i += s[r].beats, o.push(Math.min(i, e));
  return o;
}
const q1 = 8;
function Y1(t, e, n) {
  const s = typeof e == "string" ? sn[e] : e, o = n.bpm ?? s.bpm, i = n.beats ?? (n.move ? s.moves[n.move].beats : sa(s)), r = z1(s, i, n);
  if (r.every((b) => Mi(s, b, n) === 0)) return;
  const a = Math.min(n.fade ?? 1, i / 2), l = Ft("ease-in-out"), c = (b) => a <= 0 ? 1 : Math.min(l(Math.min(1, b / a)), l(Math.min(1, (i - b) / a))), h = Math.ceil(a * q1), u = a <= 0 ? [] : Array.from({ length: h + 1 }, (b, v) => [v / h * a, i - v / h * a]).flat(), d = [.../* @__PURE__ */ new Set([...r, ...u])].sort((b, v) => b - v);
  let f = 0;
  const g = d.map((b, v) => {
    if (v > 0) {
      const w = d[v - 1], y = Math.max(1, Math.ceil((b - w) * 16));
      for (let T = 0; T < y; T++) {
        const $ = w + (b - w) * T / y, M = w + (b - w) * (T + 1) / y;
        f += (Mi(s, M, n) - Mi(s, $, n)) * c(($ + M) / 2);
      }
    }
    return { beat: b, travel: f };
  }), p = n.start ?? 0, m = n.x ?? 0;
  return {
    id: `${t}-x`,
    target: t,
    property: "x",
    keyframes: g.map((b) => ({ time: p + b.beat * 6e4 / o, value: m + n.height * b.travel, easing: "linear" }))
  };
}
function ox(t, e, n = 0) {
  return (t - n) * e / 6e4;
}
function ix(t, e = {}) {
  return (n) => na(t, n, e);
}
function rx(t, e) {
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
function ax(t, e, n = {}) {
  const s = typeof e == "string" ? sn[e] : e, o = n.bpm ?? s.bpm, i = n.beats ?? (n.move ? s.moves[n.move].beats : sa(s)), r = n.samplesPerBeat ?? 4, a = n.start ?? 0, l = Math.round(i * r), c = Array.from({ length: l + 1 }, (p, m) => {
    const b = m / r;
    return { time: a + b * 6e4 / o, frame: na(s, b, n) };
  }), h = (p, m) => ({
    id: `${t}-${p}`,
    target: t,
    property: p,
    keyframes: c.map((b) => ({ time: b.time, value: m(b.frame) }))
  }), d = Object.keys(lt).filter((p) => c.some((m) => m.frame.pose[p] !== c[0].frame.pose[p]) || c[0].frame.pose[p] !== lt[p]).map((p) => h(p, (m) => m.pose[p])), f = n.height === void 0 ? void 0 : Y1(t, s, { ...n, bpm: o, beats: i, start: a, height: n.height, fade: 0 });
  if (f && d.push(f), n.hands === !1) return d;
  const g = [];
  for (const p of ["left", "right"])
    for (const m of Object.keys($t)) {
      const b = (v) => v.hands?.[p]?.[m] ?? $t[m];
      c.some((v) => b(v.frame) !== $t[m]) && g.push(h(go(p, m), b));
    }
  return [...d, ...g];
}
const ss = { type: "back", mode: "out", overshoot: 1.1 }, Bt = "ease-out-cubic", j1 = {
  label: "Disco",
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 6, rightKnee: 6 },
  expression: { smile: 0.9, mouth: 0.15, leftBrow: 0.3, rightBrow: 0.3 },
  groove: { bounce: 10, accent: "down", sway: 2 },
  moves: {
    point: {
      label: "The point",
      beats: 2,
      easing: Bt,
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
        { beat: 0, pose: { lean: -10, rightHip: 22, leftHip: 4, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: Bt },
        { beat: 1, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: "flat", right: "flat" } },
        { beat: 2, pose: { lean: 10, rightHip: 4, leftHip: 22, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: Bt },
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
}, K1 = {
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
}, X1 = {
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
        { beat: 0, pose: { rightHip: -24, rightKnee: 10, leftHip: 10, leftShoulder: 80, leftElbow: 40, rightShoulder: 55, rightElbow: -50, lean: 6, headTilt: -6 }, easing: Bt },
        { beat: 1, reset: !0, pose: { leftHip: 18, rightHip: 18 } },
        { beat: 2, pose: { leftHip: -24, leftKnee: 10, rightHip: 10, rightShoulder: 80, rightElbow: 40, leftShoulder: 55, leftElbow: -50, lean: -6, headTilt: 6 }, easing: Bt },
        { beat: 3, reset: !0, pose: { leftHip: 18, rightHip: 18 } }
      ]
    },
    kick: {
      label: "Kick out",
      beats: 2,
      keys: [
        { beat: 0, pose: { rightHip: 72, rightKnee: 4, rightAnkle: -20, leftHip: 4, lean: -12, leftShoulder: 100, leftElbow: 20 }, easing: Bt },
        { beat: 1, reset: !0 }
      ]
    },
    freeze: {
      label: "B-boy stance",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 26, leftElbow: -122, rightShoulder: 22, rightElbow: -118, leftHip: 18, rightHip: 18, leftKnee: 6, rightKnee: 6, lean: -4, headTilt: 10, smile: 0.6, leftEye: 0.6, rightEye: 0.6 }, easing: ss },
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
}, U1 = {
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
        hands: e === 0 ? { left: { ...Pt.spread, turn: 2 }, right: { ...Pt.spread, turn: 2 } } : void 0
      }))
    },
    kickBallChange: {
      label: "Kick ball change",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 88, rightKnee: 0, rightAnkle: 55, leftHip: 4, lean: -12, leftShoulder: 112, rightShoulder: 112, leftWrist: 15, rightWrist: 15 }, hands: { left: "flat", right: "flat" }, easing: Bt },
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
}, G1 = {
  label: "K-pop",
  bpm: 125,
  stance: { leftHip: 9, rightHip: 9, leftKnee: 4, rightKnee: 4 },
  expression: "happy",
  groove: { bounce: 5, accent: "down" },
  moves: {
    pointCombo: {
      label: "Point combo",
      beats: 4,
      easing: ss,
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
        { beat: 0, reset: !0, pose: { leftShoulder: 165, rightShoulder: 165, leftElbow: 46, rightElbow: 46, headTilt: -8, lean: -4 }, hands: { left: "cupped", right: "cupped" }, easing: ss },
        { beat: 1, pose: { headTilt: 8, lean: 4 } },
        { beat: 2, reset: !0, pose: { rightShoulder: 32, rightElbow: 112, rightWrist: 10, leftShoulder: 20, leftElbow: -30, headTilt: 10, leftEye: 0, smile: 1 }, hands: { right: "pinch", left: "relaxed" }, easing: ss },
        { beat: 3, pose: { headTilt: 4 } }
      ]
    },
    isolations: {
      label: "Isolations",
      beats: 2,
      easing: Bt,
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
}, V1 = {
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
        { beat: 0, reset: !0, pose: { rightShoulder: 160, rightElbow: 12, rightWrist: -15, leftShoulder: 40, leftElbow: -12, leftWrist: -45, lean: -4, rightHip: 16, lookX: 0.5, lookY: -0.6 }, hands: { right: { ...Pt.cupped, roll: -30 }, left: { ...Pt.flat, turn: 0 } } },
        { beat: 0.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...Pt.cupped, roll: 30 } } },
        { beat: 1, pose: { rightWrist: -15, rightElbow: 12, leftWrist: -45, lean: -4, rightHip: 16, leftHip: 6 }, hands: { right: { ...Pt.cupped, roll: -30 } } },
        { beat: 1.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...Pt.cupped, roll: 30 } } }
      ]
    },
    thumka: {
      label: "Thumka",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { lean: -11, rightHip: 22, leftHip: 2, leftKnee: 14, rightShoulder: 45, rightElbow: -105, leftShoulder: 128, leftElbow: 18, leftWrist: 35, headTilt: 10, lookX: -0.5 }, hands: { right: "fist", left: { ...Pt.open, turn: 2 } }, easing: Bt },
        { beat: 0.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } },
        { beat: 1, pose: { lean: -11, rightHip: 22, headTilt: 10 }, easing: Bt },
        { beat: 1.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } }
      ]
    },
    flick: {
      label: "Cross and flick",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26 }, hands: { left: "fist", right: "fist" } },
        { beat: 1, pose: { leftShoulder: 132, rightShoulder: 132, leftElbow: 0, rightElbow: 0, leftWrist: 30, rightWrist: 30, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10, stretch: 1.03 }, hands: { left: "spread", right: "spread" }, easing: Bt },
        { beat: 2, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftWrist: 0, rightWrist: 0, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26, stretch: 1 }, hands: { left: "fist", right: "fist" } },
        { beat: 3, pose: { leftShoulder: 62, rightShoulder: 62, leftElbow: 0, rightElbow: 0, leftWrist: 35, rightWrist: 35, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10 }, hands: { left: "spread", right: "spread" }, easing: Bt }
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
}, J1 = {
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
}, Z1 = { leftHip: 42, rightHip: 42, leftKnee: 82, rightKnee: 82, leftFootOut: 0.3, rightFootOut: 0.3 }, Q1 = {
  label: "Bharatanatyam",
  bpm: 80,
  // Natyarambhe: arms out at shoulder height, hands raised in pataka.
  stance: { ...Z1, leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0, leftWrist: 75, rightWrist: 75 },
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
}, ty = {
  label: "Charleston",
  bpm: 150,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 10, rightKnee: 10, leftShoulder: 30, rightShoulder: 30, leftElbow: 20, rightElbow: 20 },
  expression: { mouth: 0.4, smile: 1, leftBrow: 0.5, rightBrow: 0.5 },
  hands: { left: { ...Pt.spread, turn: 2 }, right: { ...Pt.spread, turn: 2 } },
  groove: { bounce: 8, accent: "down" },
  moves: {
    basic: {
      label: "Kick forward, kick back",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 48, rightKnee: 8, rightAnkle: 45, leftShoulder: 75, rightShoulder: 15, leftElbow: 30, rightElbow: -10, lean: -7, headTilt: -5 }, easing: Bt },
        { beat: 1, reset: !0 },
        { beat: 2, reset: !0, pose: { leftHip: 18, leftKnee: 85, leftAnkle: 35, rightShoulder: 75, leftShoulder: 15, rightElbow: 30, leftElbow: -10, lean: 7, headTilt: 5 }, easing: Bt },
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
}, ey = {
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
        { beat: 1, pose: { rightShoulder: 135, leftShoulder: 125, leftElbow: 0, rightElbow: 0, leftWrist: 0, rightWrist: 30, rightKnee: 8, leftKnee: -8, rightHip: 4, leftHip: -4 }, hands: { left: { ...Pt.spread, turn: 2 }, right: { ...Pt.spread, turn: 2 } } },
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
}, ny = {
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
          easing: ss
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
}, sn = {
  disco: j1,
  hipHop: K1,
  breaking: X1,
  jazz: U1,
  kpop: G1,
  bollywood: V1,
  bhangra: J1,
  bharatanatyam: Q1,
  charleston: ty,
  tap: ey,
  popping: ny
}, yr = {
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
}, xi = 0.215, Si = 0.205, sy = 0.065, zl = 0.035, oy = 0.165, iy = 0.155, ry = 12, ay = 0.3, ly = 0.7, cy = 0.35, hy = (t) => t * Math.PI / 180, ht = {
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
const uy = /* @__PURE__ */ new Set(["turn", "side", "head.turn", "head.tilt", "roll", "lookX", "hair.swing"]);
function dy(t) {
  const e = {};
  for (const [n, s] of Object.entries(t)) {
    const o = n.replace(/(^|\.)(left|right)(\.|$)/, (i, r, a, l) => `${r}${a === "left" ? "right" : "left"}${l}`);
    e[o] = uy.has(n) ? -s : s;
  }
  return e;
}
function xt(t, e) {
  const n = {};
  for (const s of ["left", "right"]) for (const [o, i] of Object.entries(e)) n[`${t}.${s}.${o}`] = i;
  return n;
}
const he = {
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
}, fy = ["round", "flat", "pointed", "big"], py = {
  round: { length: 1, width: [0.95, 0.7] },
  flat: { length: 1.12, width: [0.85, 0.85] },
  pointed: { length: 1.25, width: [1, 0.3] },
  big: { length: 1.5, width: [1.25, 1.1] }
};
function Y0(t = {}) {
  const e = t.headSize ?? 0.3, n = t.shoulderWidth ?? 0.06, s = t.hipWidth ?? 0.022, o = t.legLength ?? 1, i = t.armLength ?? 1, r = py[t.feet ?? "round"], a = Math.max(0.12, 1 - e - zl - (xi + Si) * o), l = (u) => ({
    id: `arm.${u}`,
    parent: "spine",
    offset: [(u === "left" ? 1 : -1) * n, -0.035, 0],
    rest: [0, -1, 0],
    side: u === "left" ? 1 : -1,
    bones: [
      { length: oy * i, width: [1.25, 0.9] },
      { length: iy * i, width: [0.9, 0.75] }
    ]
  }), c = (u) => ({
    id: `leg.${u}`,
    parent: null,
    offset: [(u === "left" ? 1 : -1) * s, 0, 0],
    rest: [0, -1, 0],
    side: u === "left" ? 1 : -1,
    bones: [
      { length: xi * o, width: [1.45, 1.05] },
      { length: Si * o, width: [1.05, 0.85] },
      { length: sy * Math.sqrt(o) * r.length, width: r.width }
    ]
  }), h = (u, d) => u[d] ?? ht[d] ?? 0;
  return {
    id: "human",
    hipHeight: (xi + Si) * o,
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
      { id: "neck", parent: "spine", rest: [0, 1, 0], bones: [{ length: zl, width: [1, 0.9] }] },
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
    angles(u, d) {
      if (d.id === "spine") {
        const v = -h(u, "lean") / 2, w = h(u, "side") / 2, y = -h(u, "bend");
        return [
          { swing: v + y * ay, spread: w },
          { swing: v + y * ly, spread: w }
        ];
      }
      if (d.id === "neck") return [{ swing: -h(u, "bend") * cy, spread: 0 }];
      const [f, g] = d.id.split("."), p = (v) => h(u, `${f}.${g}.${v}`);
      if (f === "arm")
        return [
          { swing: p("swing"), spread: p("spread") },
          { swing: p("elbow"), spread: p("bend") }
        ];
      const m = (d.side ?? 1) * p("rotate"), b = 1 - Math.cos(hy(p("rotate")));
      return [
        { swing: p("swing"), spread: p("spread"), yaw: m },
        { swing: -p("knee"), spread: 0, yaw: m },
        // The foot points forward, square to the shin, turned out a little (more with `toeOut`).
        { swing: 90 + p("ankle") - b * (p("swing") - p("knee")), spread: 0, yaw: (ry + p("toeOut")) * (d.side ?? 1) }
      ];
    },
    withAngles(u, d, f) {
      const [g, p] = d.id.split("."), m = (b) => `${g}.${p}.${b}`;
      return g === "arm" ? {
        ...u,
        [m("swing")]: f[0].swing,
        [m("spread")]: f[0].spread,
        [m("elbow")]: f[1].swing,
        [m("bend")]: f[1].spread
      } : g === "leg" ? { ...u, [m("swing")]: f[0].swing, [m("spread")]: f[0].spread, [m("knee")]: -f[1].swing } : u;
    },
    boneScale(u, d) {
      const f = Math.min(3, Math.max(0.3, h(u, "stretch")));
      return d?.id.startsWith("arm.") ? Math.sqrt(f) : f;
    },
    headPose(u) {
      const d = Math.min(3, Math.max(0.3, h(u, "stretch")));
      return {
        yaw: h(u, "head.turn"),
        nod: h(u, "head.nod"),
        tilt: h(u, "head.tilt"),
        // The head keeps its area: taller and narrower when stretched.
        sx: 1 / Math.sqrt(d),
        sy: Math.sqrt(d)
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
function lx(t) {
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
const gy = {
  leftEye: "eye.left",
  rightEye: "eye.right",
  leftBrow: "brow.left",
  rightBrow: "brow.right"
}, my = { blush: 0, tears: 0, sweat: 0, pupil: 1, lid: 0, bulge: 0 }, on = Object.fromEntries(
  Object.entries(vt).map(([t, e]) => [
    t,
    { ...Object.fromEntries(Object.entries(e).map(([n, s]) => [gy[n] ?? n, s])), ...my }
  ])
);
on.crying.tears = 1;
on.scared.sweat = 0.8;
on.scared.bulge = 0.4;
on.sleepy.lid = 0.5;
on.worried.sweat = 0.6;
const Xt = (t) => ({ ...on.neutral, ...t }), j0 = {
  ...on,
  laughing: Xt({ mouth: 0.75, smile: 1, mouthWidth: 1.25, "eye.left": 0, "eye.right": 0, "brow.left": 0.5, "brow.right": 0.5 }),
  afraid: Xt({ mouth: 0.4, smile: -0.6, mouthWidth: 0.9, "eye.left": 1.3, "eye.right": 1.3, "brow.left": 0.6, "brow.right": 0.6, browTilt: 1, sweat: 1, pupil: 0.8, bulge: 0.5 }),
  bored: Xt({ smile: -0.05, mouthWidth: 0.6, "eye.left": 0.45, "eye.right": 0.45, "brow.left": -0.4, "brow.right": -0.4, lookX: 0.5 }),
  tired: Xt({ mouth: 0.2, smile: -0.3, mouthWidth: 0.7, "eye.left": 0.3, "eye.right": 0.3, "brow.left": -0.1, "brow.right": -0.1, browTilt: 0.6, lookY: 0.6 }),
  embarrassed: Xt({ smile: 0.4, mouthWidth: 0.7, "eye.left": 0.9, "eye.right": 0.9, browTilt: 0.7, "brow.left": 0.2, "brow.right": 0.2, lookX: -0.6, lookY: 0.5, blush: 1 }),
  proud: Xt({ smile: 0.75, mouthWidth: 1, "eye.left": 0.75, "eye.right": 0.75, "brow.left": 0.5, "brow.right": 0.5, lookY: -0.2 }),
  determined: Xt({ smile: 0.35, mouthWidth: 0.8, "eye.left": 0.85, "eye.right": 0.85, "brow.left": -0.5, "brow.right": -0.5, browTilt: -0.9 }),
  affectionate: Xt({ smile: 0.85, "eye.left": 0, "eye.right": 0, "brow.left": 0.3, "brow.right": 0.3, blush: 0.8 }),
  hurt: Xt({ smile: -0.7, mouthWidth: 0.8, "eye.left": 1.1, "eye.right": 1.1, "brow.left": 0.2, "brow.right": 0.2, browTilt: 1, lookY: 0.3, tears: 0.35 }),
  suspicious: Xt({ smile: -0.25, mouthWidth: 0.7, "eye.left": 0.5, "eye.right": 0.85, "brow.left": -0.6, "brow.right": 0.4, browTilt: -0.3, lookX: 0.8, lid: 0.3 }),
  relieved: Xt({ smile: 0.7, "eye.left": 0, "eye.right": 0, "brow.left": 0.4, "brow.right": 0.4, browTilt: 0.4 }),
  excited: Xt({ mouth: 0.6, smile: 1, mouthWidth: 1.1, "eye.left": 1.4, "eye.right": 1.4, "brow.left": 0.9, "brow.right": 0.9, blush: 0.4, pupil: 1.3 })
}, se = (t) => t * Math.PI / 180;
function oa([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t, e * o + n * i, -e * i + n * o];
}
function qo([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o - e * i, t * i + e * o, n];
}
function Jt([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o + n * i, e, -t * i + n * o];
}
const _e = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], yo = (t, e) => [t[0] * e, t[1] * e, t[2] * e], Zs = (t, e) => qo(oa(t, e.swing), e.spread);
function Hs(t, e) {
  const n = Jt(t, e);
  return { point: { x: n[0], y: -n[1] }, depth: n[2] };
}
function Yo(t, e, n) {
  const s = n, i = [0, t.hipHeight * s * (t.boneScale?.(e, null) ?? 1), 0], r = {};
  for (const p of t.chains) {
    const m = p.parent ? r[p.parent] : void 0;
    if (p.parent && !m) throw new Error(`body plan ${t.id}: chain ${p.id} comes before its parent ${p.parent}`);
    const b = p.at ?? (m ? m.joints3.length - 1 : 0), v = m ? m.joints3[b] : i, w = m ? m.frames[Math.max(0, b - 1)] : { swing: 0, spread: 0 }, y = p.offset ? _e(v, Zs(yo(p.offset, s), w)) : v, T = p.side ?? 1, $ = t.boneScale?.(e, p) ?? 1, M = t.angles(e, p), S = [y], k = [];
    let x = w.swing, P = w.spread;
    p.bones.forEach((E, O) => {
      const _ = M[O] ?? { swing: 0, spread: 0 };
      x += se(_.swing), P += se(_.spread) * T, k.push({ swing: x, spread: P });
      const L = Jt(Zs(p.rest, { swing: x, spread: P }), se(_.yaw ?? 0));
      S.push(_e(S[O], yo(L, E.length * s * $)));
    }), r[p.id] = { joints3: S, frames: k };
  }
  const a = r[t.head.on], l = t.headPose?.(e) ?? { yaw: 0, nod: 0, tilt: 0, sx: 1, sy: 1 }, c = a.frames[a.frames.length - 1], h = t.head.size / 2 * s, u = h * l.sx, d = h * l.sy, f = (p) => Zs(Jt(oa(qo(p, -se(l.tilt)), -se(l.nod)), se(l.yaw)), c), g = _e(a.joints3[a.joints3.length - 1], f([0, d, 0]));
  return { height: s, root: i, chains: r, head: { center: g, rx: u, ry: d, toBody: f } };
}
function ia(t, e, n) {
  const s = n.height, o = se(90 * (e.turn ?? 0)), i = Yo(t, e, s), { root: r } = i, a = i.chains, { rx: l, ry: c } = i.head, h = i.head.toBody, u = i.head.center, d = {};
  for (const k of t.chains) {
    const { joints3: x, frames: P } = a[k.id], E = x.map((O) => Hs(O, o));
    d[k.id] = {
      id: k.id,
      joints3: x,
      frames: P,
      points: E.map((O) => O.point),
      depths: E.map((O) => O.depth)
    };
  }
  const f = Hs(u, o), g = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((k) => Jt(h(k), o)), p = Hs(r, o).point, m = se(e.roll ?? 0), b = (k) => {
    const x = k.x - p.x, P = k.y - p.y;
    return { x: p.x + x * Math.cos(m) - P * Math.sin(m), y: p.y + x * Math.sin(m) + P * Math.cos(m) };
  }, v = ([k, x, P]) => [k * Math.cos(m) + x * Math.sin(m), -k * Math.sin(m) + x * Math.cos(m), P];
  for (const k of Object.values(d)) k.points = k.points.map(b);
  const w = {
    center: b(f.point),
    depth: f.depth,
    rx: l,
    ry: c,
    angle: 0,
    axes: g.map(v)
  }, y = w.axes[1];
  w.angle = Math.atan2(y[0], y[1]);
  const T = (k) => {
    if ("head" in k) return { x: w.center.x + y[0] * c, y: w.center.y - y[1] * c };
    const x = d[k.chain];
    return x.points[Math.min(k.joint, x.points.length - 1)];
  };
  let $ = 0;
  (n.contact ?? "ground") === "ground" && ($ = -Math.max(...t.contacts.map((k) => T(k).y))), $ -= (e.lift ?? 0) * s;
  const M = (k) => ({ x: k.x, y: k.y + $ });
  for (const k of Object.values(d)) k.points = k.points.map(M);
  w.center = M(w.center);
  const S = t.contacts.map((k) => ({ spec: k, point: T(k) }));
  return {
    height: s,
    view: o,
    chains: d,
    head: w,
    hip: M(b(p)),
    hipDepth: Hs(r, o).depth,
    contacts: S,
    groundY: Math.max(...S.map((k) => k.point.y))
  };
}
const br = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], K0 = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function jo(t, e, n) {
  const s = n.height, o = se(90 * (e.turn ?? 0)), i = se(e.roll ?? 0), r = Yo(t, e, s), a = Jt(r.root, o), l = (m) => _e(qo(br(Jt(m, o), a), -i), a), c = {};
  for (const m of t.chains) c[m.id] = r.chains[m.id].joints3.map(l);
  const h = l(r.head.center), u = (m) => K0(br(l(_e(r.head.center, r.head.toBody(m))), h)), d = [u([1, 0, 0]), u([0, 1, 0]), u([0, 0, 1])], f = (m) => {
    if ("head" in m) return _e(h, yo(d[1], r.head.ry));
    const b = c[m.chain];
    return b[Math.min(m.joint, b.length - 1)];
  };
  let g = 0;
  (n.contact ?? "ground") === "ground" && (g = -Math.min(...t.contacts.map((m) => f(m)[1]))), g += (e.lift ?? 0) * s;
  const p = (m) => [m[0], m[1] + g, m[2]];
  return {
    height: s,
    hip: p(a),
    chains: Object.fromEntries(Object.entries(c).map(([m, b]) => [m, b.map(p)])),
    head: { center: p(h), rx: r.head.rx, ry: r.head.ry, axes: d }
  };
}
function ra(t, e, n, s) {
  const o = n.height, i = se(90 * (e.turn ?? 0)), r = Yo(t, e, o), a = jo(t, e, n), l = a.hip, c = a.chains, h = a.head.center, u = (k) => {
    if ("head" in k) return _e(h, yo(a.head.axes[1], a.head.ry));
    const x = c[k.chain];
    return x[Math.min(k.joint, x.length - 1)];
  }, d = s.toView(l), f = s.toScreen(d), g = s.toScreen([d[0] + 1, d[1], d[2]]), p = Math.hypot(g.x - f.x, g.y - f.y), m = (k) => {
    const x = s.toView(k);
    return { point: s.toScreen(x), depth: x[2] * p };
  }, b = {};
  for (const k of t.chains) {
    const x = c[k.id].map(m);
    b[k.id] = {
      id: k.id,
      joints3: r.chains[k.id].joints3,
      frames: r.chains[k.id].frames,
      points: x.map((P) => P.point),
      depths: x.map((P) => P.depth)
    };
  }
  const v = s.toView(h), w = s.toScreen(v), y = s.toScreen([v[0] + 1, v[1], v[2]]), T = Math.hypot(y.x - w.x, y.y - w.y), $ = a.head.axes.map((k) => K0(br(s.toView(_e(h, k)), v))), M = {
    center: w,
    depth: v[2] * p,
    rx: r.head.rx * T,
    ry: r.head.ry * T,
    angle: Math.atan2($[1][0], $[1][1]),
    axes: $
  }, S = t.contacts.map((k) => ({ spec: k, point: m(u(k)).point }));
  return {
    height: o * p,
    view: i,
    chains: b,
    head: M,
    hip: f,
    hipDepth: d[2] * p,
    contacts: S,
    groundY: Math.max(...S.map((k) => k.point.y))
  };
}
function Ko(t, [e, n, s]) {
  const [o, i, r] = t.axes, a = [
    o[0] * e * t.rx + i[0] * n * t.ry + r[0] * s * t.rx,
    o[1] * e * t.rx + i[1] * n * t.ry + r[1] * s * t.rx,
    o[2] * e * t.rx + i[2] * n * t.ry + r[2] * s * t.rx
  ], l = Math.hypot(e, n, s) || 1, c = (o[2] * e + i[2] * n + r[2] * s) / l;
  return { point: { x: t.center.x + a[0], y: t.center.y - a[1] }, depth: t.depth + a[2], facing: c };
}
const Cs = (t) => t * 180 / Math.PI, Re = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], Ti = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2], kn = (t) => Math.hypot(t[0], t[1], t[2]), wr = (t) => {
  const e = kn(t) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}, Rs = (t) => Math.atan2(Math.sin(t), Math.cos(t));
function ql(t) {
  const [e, n, s] = wr(t);
  return { swing: Math.asin(Math.max(-1, Math.min(1, s))), spread: Math.atan2(e, -n) };
}
function bo(t, e, n, s, o) {
  const i = t.chains.find((E) => E.id === n);
  if (!i) throw new Error(`reach: no chain ${n} in ${t.id}`);
  if (i.bones.length < 2 || i.rest[1] > -0.99) throw new Error(`reach: ${n} is not a hanging limb of two bones or more`);
  if (!t.withAngles) throw new Error(`reach: the ${t.id} plan cannot set angles`);
  const r = ia(t, { ...e, turn: 0, roll: 0, lift: 0 }, { height: o.height, contact: "none" }), a = r.chains[n];
  if (kn(Re(s, a.joints3[2])) < o.height * 1e-12) return e;
  const l = a.joints3[0], c = kn(Re(a.joints3[1], a.joints3[0])), h = kn(Re(a.joints3[2], a.joints3[1])), u = i.parent ? r.chains[i.parent].frames[Math.max(0, (i.at ?? r.chains[i.parent].joints3.length - 1) - 1)] : { swing: 0, spread: 0 }, d = Re(s, l), f = t.angles(e, i), g = (E) => (f[E]?.yaw ?? 0) * Math.PI / 180, p = Math.min(c + h - 1e-6, Math.max(Math.abs(c - h) + 1e-6, kn(d))), m = wr(d), b = i.parent !== null, v = Jt(Zs(i.pole ?? (b ? [0, -0.35, -1] : [0, 0, 1]), u), g(0));
  let w = Re(v, [m[0] * Ti(v, m), m[1] * Ti(v, m), m[2] * Ti(v, m)]);
  kn(w) < 1e-6 && (w = Jt([1, 0, 0], g(0))), w = wr(w);
  const y = (c * c + p * p - h * h) / (2 * c * p), T = Math.sqrt(Math.max(0, 1 - y * y)), $ = [
    l[0] + c * (y * m[0] + T * w[0]),
    l[1] + c * (y * m[1] + T * w[1]),
    l[2] + c * (y * m[2] + T * w[2])
  ], M = [l[0] + m[0] * p, l[1] + m[1] * p, l[2] + m[2] * p], S = i.side ?? 1, k = ql(Jt(Re($, l), -g(0))), x = ql(Jt(Re(M, $), -g(1))), P = [
    { swing: Cs(Rs(k.swing - u.swing)), spread: Cs(Rs(k.spread - u.spread)) * S },
    { swing: Cs(Rs(x.swing - k.swing)), spread: Cs(Rs(x.spread - k.spread)) * S }
  ];
  return t.withAngles(e, i, P);
}
const Sn = (t, e) => (t % e + e) % e, Yl = (t) => t * t * (3 - 2 * t), yy = (t) => Object.fromEntries(
  ["left", "right"].flatMap((e) => Object.entries(Pt[t]).map(([n, s]) => [`hand.${e}.${n}`, s]))
);
function Ei(t, e = !1) {
  const n = Y0(), s = bo(n, ht, "arm.left", [0.015, 0.68, 0.2], { height: 1 }), o = bo(n, s, "arm.right", [-0.015, 0.68, 0.2], { height: 1 });
  return Array.from({ length: 32 }, (i, r) => {
    const a = r / 4, l = Math.floor(a), c = a - l, h = l % 2 === 0, u = Math.sin(Math.PI * c), d = Math.max(0, ...t.map((g) => 1 - Math.min(Sn(a - g, 8), Sn(g - a, 8)) / 0.5)), f = {
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
      "arm.left.swing": 22 + d * (e ? 45 : 42),
      "arm.right.swing": 22 + d * (e ? 45 : 42),
      "arm.left.spread": 28 - 22 * d,
      "arm.right.spread": 28 - 22 * d,
      "arm.left.elbow": 48 + 22 * d,
      "arm.right.elbow": 48 + 22 * d,
      "arm.left.bend": -35 * d,
      "arm.right.bend": -35 * d,
      smile: 0.9,
      ...yy(e ? "hold" : "spread")
    };
    if (!e)
      for (const g of Object.keys(o)) g.startsWith("arm.") && (f[g] += (o[g] - f[g]) * d);
    return { beat: a, pose: f };
  });
}
const Rn = {
  garba: { label: "Garba · two clap", bpm: 120, beats: 8, strikes: [2, 3, 6, 7], keys: Ei([2, 3, 6, 7]) },
  garbaThreeClap: { label: "Garba · three clap", bpm: 120, beats: 8, strikes: [1, 2, 3, 5, 6, 7], keys: Ei([1, 2, 3, 5, 6, 7]) },
  dandiya: { label: "Dandiya · partner strikes", bpm: 120, beats: 8, strikes: [1, 3, 5, 7], keys: Ei([1, 3, 5, 7], !0) }
};
function X0(t) {
  const e = typeof t == "string" && Object.hasOwn(Rn, t) ? Rn[t] : typeof t == "string" ? void 0 : t;
  if (!e || !Number.isFinite(e.beats) || e.beats <= 0 || !Array.isArray(e.keys) || !e.keys.length || !Array.isArray(e.strikes) || !e.keys.every((n, s) => Number.isFinite(n.beat) && n.beat >= 0 && n.beat < e.beats && (s === 0 || n.beat > e.keys[s - 1].beat) && n.pose && Object.values(n.pose).every(Number.isFinite)) || !e.strikes.every((n) => Number.isFinite(n) && n >= 0 && n < e.beats)) throw new Error("humanDanceFrame: a dance with positive finite beats, ordered pose keys and strike beats within its loop is required");
  return e;
}
function wo(t, e, n = ht) {
  const s = X0(t);
  if (!Number.isFinite(e)) throw new Error("humanDanceFrame: beat must be finite");
  const o = Sn(e, s.beats);
  let i = s.keys.length - 1;
  for (let m = 0; m < s.keys.length; m++) s.keys[m].beat <= o && (i = m);
  const r = s.keys[i], a = s.keys[(i + 1) % s.keys.length], l = r.beat > o ? r.beat - s.beats : r.beat, c = a.beat <= r.beat ? a.beat + s.beats : a.beat, h = Yl((o - l) / (c - r.beat)), u = { ...ht, ...n };
  for (const m of new Set(s.keys.flatMap((b) => Object.keys(b.pose)))) {
    if (m === "turn" || m === "roll") continue;
    const b = m.match(/^hand\.(?:left|right)\.(.+)$/)?.[1], v = n[m] ?? ht[m] ?? (b ? $t[b] : void 0) ?? 0, w = r.pose[m] ?? v;
    u[m] = w + ((a.pose[m] ?? v) - w) * h;
  }
  const d = Math.floor(e), f = e - d, g = f <= 0.6 ? 1 : 1 - Yl((f - 0.6) / 0.4), p = Math.max(0, ...s.strikes.map((m) => 1 - Math.min(Sn(o - m, s.beats), Sn(m - o, s.beats)) / 0.25));
  return { pose: u, contact: { side: Sn(d, 2) === 0 ? "left" : "right", start: d, weight: g }, strike: p };
}
function cx(t, e) {
  const n = X0(e.style), s = e.bpm ?? n.bpm, o = e.beats ?? n.beats, i = e.samplesPerBeat ?? 16;
  if (![s, o, i].every((l) => Number.isFinite(l) && l > 0)) throw new Error("humanDanceTracks: bpm, beats and samplesPerBeat must be positive and finite");
  if (!Number.isFinite(e.start ?? 0)) throw new Error("humanDanceTracks: start must be finite");
  const r = Math.max(1, Math.ceil(o * i)), a = Array.from({ length: r + 1 }, (l, c) => ({ time: (e.start ?? 0) + o * c / r * 6e4 / s, pose: wo(n, o * c / r, e.pose).pose }));
  return Object.keys(a[0].pose).filter((l) => l !== "turn" && l !== "roll" && a.some((c) => c.pose[l] !== (e.pose?.[l] ?? ht[l]))).map((l) => ({
    id: `${t}-dance-${l}`,
    target: t,
    property: l,
    keyframes: a.map((c) => ({ time: c.time, value: c.pose[l], easing: "linear" }))
  }));
}
function by(t, e) {
  const n = Math.min(0.95, Math.max(0.55, e.jawWidth ?? 0.74)), s = Math.min(0.35, Math.max(0.03, e.chinWidth ?? 0.14)), o = [[-1, 0], [-0.92, s], [-0.5, n], [-0.12, Math.sqrt(1 - 0.12 ** 2)]];
  for (let r = 0; r <= 12; r++) {
    const a = r * Math.PI / 24;
    o.push([Math.sin(a), Math.cos(a)]);
  }
  const i = [];
  for (const [r, a] of o)
    for (let l = 0; l < 40; l++) {
      const c = l * Math.PI / 20;
      i.push(Ko(t, [a * Math.cos(c), r, a * Math.sin(c)]).point);
    }
  return U0(i);
}
function U0(t) {
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
const G0 = 0.34, Dt = 0.12, Wt = -0.4, Nt = (t, e, n) => t[e] ?? n, wy = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), ky = 0.45, vy = 0.35, My = 0.7;
function Mt(t, e, n) {
  const s = (f) => Math.sqrt(Math.max(0, 1 - f.x * f.x - f.y * f.y)), o = Ko(t, [n.x, n.y, s(n)]).facing, i = t.axes[2], r = Math.atan2(i[0], i[2]), a = Math.cos(r), l = a >= 0 ? 1 : -1, c = l * Math.max(vy, Math.abs(a)), h = l * Math.max(My, Math.abs(a)), u = Math.cos(t.angle), d = Math.sin(t.angle);
  return {
    facing: o,
    points: e.map((f) => {
      const g = ky * Math.sin(r) + n.x * c + (f.x - n.x) * h, p = f.y + i[1] * s(f), m = g * t.rx, b = p * t.ry;
      return { x: t.center.x + m * u + b * d, y: t.center.y + m * d - b * u };
    })
  };
}
const $e = (t, e, n, s = 12) => Array.from({ length: s + 1 }, (o, i) => {
  const r = i / s, a = 1 - r;
  return { x: a * a * t.x + 2 * a * r * e.x + r * r * n.x, y: a * a * t.y + 2 * a * r * e.y + r * r * n.y };
}), os = (t, e, n, s) => {
  const o = Math.min(1, Math.max(0, (s - t.x) / (n.x - t.x))), i = 1 - o;
  return i * i * t.y + 2 * i * o * e.y + o * o * n.y;
}, ke = (t, e, n, s, o = 16) => Array.from({ length: o }, (i, r) => {
  const a = Math.PI * 2 * r / o;
  return { x: t + Math.cos(a) * n, y: e + Math.sin(a) * s };
}), Ge = 0.05, xy = 0.3, Sy = "#e06b7d";
function Ty(t, e, n, s, o = {}, i) {
  const r = Math.max(1, Math.min(s * 0.6, 0.14 * e.rx)), a = (E, O) => Mt(e, E, O).points, l = (E, O) => Mt(e, [], { x: E, y: O }).facing, c = Nt(n, "smile", 0), h = Nt(n, "blink", 0), u = Nt(n, "lookX", 0), d = Nt(n, "lookY", 0), f = Nt(n, "browTilt", 0), g = Math.max(0.2, Nt(n, "pupil", 1)), p = Math.min(1, Math.max(0, Nt(n, "lid", 0))), m = Math.min(1, Math.max(0, Nt(n, "bulge", 0)));
  for (const E of [1, -1]) {
    const O = E === 1 ? "left" : "right", _ = G0 * E;
    if (l(_, Dt) < Ge) continue;
    const L = { x: _, y: Dt }, B = wy(Nt(n, `eye.${O}`, 1), h);
    if (B < 0.2 || o.style === "anime" && p >= 0.98) {
      const R = c > 0.5 ? 0.12 : -0.06;
      t.line(a($e({ x: _ - 0.12, y: Dt }, { x: _, y: Dt + R }, { x: _ + 0.12, y: Dt }), L), r);
    } else if (o.style === "anime")
      Ey(t, e, L, E, B, p, m, g, u, d, r, o, i);
    else {
      const R = B > 1.2 || m > 0.02, D = 0.13 * Math.max(B, 1) * (1 + m * 0.7);
      R && t.shape(a(ke(_, Dt, D * 0.85, D), L), "#ffffff", r);
      const I = (B > 1.2 ? 0.075 : 0.1) * g * (1 + m * 0.3), A = _ + u * 0.08, H = Dt - d * 0.07, N = ke(A, H, I, I * 1.1 * Math.min(B, 1));
      if (t.shape(a(N, L), t.ink, 0), o.inPupil && i) {
        const [z] = a([{ x: A, y: H }], L), W = a(N, L), j = Math.min(...W.map((G) => Math.hypot(G.x - z.x, G.y - z.y)));
        j > 0.5 && (i.save(), i.beginPath(), i.arc(z.x, z.y, j, 0, Math.PI * 2), i.clip(), o.inPupil(i, { x: z.x, y: z.y, r: j, side: O }), i.restore());
      }
      if (p > 0.02) {
        const z = R ? D * 1.15 : I * 1.4, W = Dt + z, j = W - z * 2 * p, G = z * 1.1;
        t.shape(a([{ x: _ - G, y: W + 0.02 }, { x: _ + G, y: W + 0.02 }, { x: _ + G, y: j }, { x: _ - G, y: j }], L), o.skin ?? "#ffffff", 0), t.line(a([{ x: _ - G, y: j }, { x: _ + G, y: j }], L), r);
      }
    }
    const X = Dt + (o.style === "anime" ? 0.38 : 0.3) + Nt(n, `brow.${O}`, 0) * 0.14 + Math.max(0, B - 1) * 0.12, J = { x: _ + E * 0.13, y: X }, q = { x: _ - E * 0.13, y: X + f * 0.1 };
    t.line(a([J, { x: (J.x + q.x) / 2, y: (J.y + q.y) / 2 }, q], { x: _, y: X }), r);
  }
  $y(t, e, n, r), Ay(t, e, o.ageLines ?? 0, r);
  const b = { x: 0, y: Wt };
  if (l(0, Wt) < -Ge) return;
  o.nose && l(0, Dt - 0.15) >= Ge && t.line(a([{ x: 0.01, y: Dt - 0.1 }, { x: 0.03, y: Wt + 0.2 }, { x: -0.05, y: Wt + 0.17 }], { x: 0, y: Wt + 0.22 }), r);
  const v = 0.25 * Math.max(0.3, Nt(n, "mouthWidth", 1)), w = Math.min(1, Math.max(0, Nt(n, "mouth", 0)));
  if (w <= 0.05) {
    t.line(a($e({ x: -v, y: Wt }, { x: 0, y: Wt - c * 0.25 }, { x: v, y: Wt }), b), r);
    return;
  }
  const y = 0.3 * w;
  let T, $, M, S;
  if (c > 0.3) {
    const E = Wt + 0.05, O = { x: 0, y: Wt - y * 2 };
    T = [...$e({ x: v, y: E }, O, { x: -v, y: E })], $ = () => E, M = (_) => os({ x: v, y: E }, O, { x: -v, y: E }, _), S = 0.85;
  } else if (c < -0.3) {
    const E = Wt - y * 0.6, O = { x: 0, y: Wt + y * 1.4 };
    T = [...$e({ x: v, y: E }, O, { x: -v, y: E })], $ = (_) => os({ x: v, y: E }, O, { x: -v, y: E }, _), M = () => E, S = 0.5;
  } else {
    const E = v * 0.8;
    T = ke(0, Wt, E, y);
    const O = (_) => y * Math.sqrt(Math.max(0, 1 - (_ / E) ** 2));
    $ = (_) => Wt + O(_), M = (_) => Wt - O(_), S = 0.5;
  }
  if (t.shape(a(T, b), t.ink, 0), w < xy) return;
  const k = $(0) - M(0), x = v * S, P = (E, O, _ = 8) => Array.from({ length: _ + 1 }, (L, B) => E + (O - E) * B / _);
  if (o.tongue) {
    const E = x * 0.55, O = P(E, -E).map((L) => ({ x: L, y: M(L) })), _ = $e({ x: -E, y: M(-E) }, { x: 0, y: M(0) + k * 0.8 }, { x: E, y: M(E) }, 8);
    t.shape(a([...O, ..._.slice(1, -1)], b), Sy, 0);
  }
  if (o.teeth) {
    const E = Math.min(0.06, k * 0.4), O = P(-x, x).map((L) => ({ x: L, y: $(L) })), _ = O.map(({ x: L, y: B }) => ({ x: L * 0.92, y: B - E })).reverse();
    t.shape(a([...O, ..._], b), "#ffffff", 0);
    for (const L of [-0.5, 0, 0.5]) {
      const B = x * L;
      t.line(a([{ x: B, y: $(B) }, { x: B * 0.92, y: $(B) - E }], b), r * 0.6);
    }
  }
}
function Ey(t, e, n, s, o, i, r, a, l, c, h, u, d) {
  const { x: f, y: g } = n, p = Math.min(1.2, Math.max(0.5, u.eyeScale ?? 1)), m = Math.min(1.2, Math.max(0.45, u.eyeAspect ?? 1)), b = 0.21 * p * (1 + r * 0.15), v = 0.25 * p * m * Math.min(o, 1.6) * (1 - i) * (1 + r * 0.3), w = { x: f - b, y: g }, y = { x: f + b, y: g }, T = { x: f, y: g + v * 1.9 }, $ = { x: f, y: g - v * 1.35 }, M = $e(w, T, y), S = $e(y, $, w), k = (X) => Mt(e, X, n).points, x = (X) => X.map((J) => {
    const q = Math.min(y.x, Math.max(w.x, J.x));
    return { x: q, y: Math.min(os(w, T, y, q), Math.max(os(y, $, w, q), J.y)) };
  });
  t.shape(k([...M, ...S.slice(1, -1)]), "#ffffff", h * 0.5);
  const P = f + Math.max(-1, Math.min(1, l)) * 0.07 * p, E = g - Math.max(-1, Math.min(1, c)) * 0.055 * p, O = 0.115 * p, _ = 0.185 * p;
  t.shape(k(x(ke(P, E, O, _, 24))), u.iris ?? "#4b7fce", h * 0.4), t.shape(k(x(ke(P, E - 0.075 * p, O * 0.7, _ * 0.35))), "rgba(255,255,255,0.25)", 0);
  const L = Math.min(0.085, 0.042 * a) * p, B = x(ke(P, E, L, L * 1.35));
  if (t.shape(k(B), t.ink, 0), u.inPupil && d) {
    const [X] = k([{ x: P, y: E }]), J = Math.min(...k(B).map((q) => Math.hypot(q.x - X.x, q.y - X.y)));
    J > 0.5 && (d.save(), d.beginPath(), d.arc(X.x, X.y, J, 0, Math.PI * 2), d.clip(), u.inPupil(d, { ...X, r: J, side: s === 1 ? "left" : "right" }), d.restore());
  }
  if (t.shape(k(x(ke(P - 0.038 * p, E + 0.075 * p, 0.035 * p, 0.045 * p))), "#ffffff", 0), t.shape(k(x(ke(P + 0.04 * p, E - 0.04 * p, 0.014 * p, 0.02 * p))), "#ffffff", 0), t.line(k(M), h * 1.1), u.lashes !== !1)
    for (const X of [0, 0.035]) {
      const J = f + s * (b - X), q = os(w, T, y, J);
      t.line(k([{ x: J, y: q }, { x: J + s * 0.055, y: q + 0.07 }]), h * 0.75);
    }
}
function Ay(t, e, n, s) {
  const o = Math.min(1, Math.max(0, n));
  if (!(o <= 0))
    for (const i of [-1, 1]) {
      const r = { x: i * 0.59, y: Dt };
      if (Mt(e, [], r).facing < Ge) continue;
      for (const c of [-0.06, 0.035]) {
        const h = [{ x: r.x, y: r.y }, { x: r.x + i * 0.1, y: r.y + c }];
        t.line(Mt(e, h, r).points, s * 0.45 * o);
      }
      const a = { x: i * 0.3, y: -0.38 }, l = $e({ x: a.x, y: -0.31 }, { x: a.x + i * 0.07, y: -0.4 }, { x: a.x + i * 0.035, y: -0.49 });
      t.line(Mt(e, l, a).points, s * 0.35 * o);
    }
}
const jl = "#8fd0f5", Kl = (t, e, n) => Array.from({ length: 18 }, (s, o) => {
  const i = Math.PI * 2 * o / 18, r = Math.sin(i / 2);
  return { x: t + Math.sin(i) * n * r, y: e - n * 0.9 + Math.cos(i) * n * 1.6 * (0.55 + 0.45 * r) - n * 0.4 };
});
function $y(t, e, n, s) {
  const o = Math.min(1, Math.max(0, Nt(n, "blush", 0))), i = Math.min(1, Math.max(0, Nt(n, "tears", 0))), r = Math.min(1, Math.max(0, Nt(n, "sweat", 0)));
  if (!(o + i + r <= 0.01)) {
    for (const a of [1, -1]) {
      const l = { x: 0.5 * a, y: -0.16 }, c = Mt(e, [], l).facing >= Ge;
      if (o > 0.01 && c) {
        const { points: u } = Mt(e, ke(l.x, l.y, 0.17, 0.1), l);
        if (t.shape(u, `rgba(240, 120, 140, ${(0.75 * o).toFixed(3)})`, 0), o > 0.5)
          for (const d of [-0.07, 0, 0.07]) {
            const f = [{ x: l.x + d - 0.018, y: l.y - 0.03 }, { x: l.x + d + 0.018, y: l.y + 0.03 }];
            t.line(Mt(e, f, l).points, s * 0.3);
          }
      }
      const h = { x: G0 * a, y: Dt };
      if (i > 0.01 && Mt(e, [], h).facing >= Ge) {
        const u = 0.05 + 0.04 * i, d = { x: h.x + 0.06 * a, y: Dt - 0.2 - 0.12 * i };
        if (t.shape(Mt(e, Kl(d.x, d.y, u), d).points, jl, s * 0.35), i > 0.6) {
          const f = [{ x: h.x + 0.05 * a, y: Dt - 0.1 }, { x: d.x, y: d.y + u * 0.8 }];
          t.line(Mt(e, f, d).points, s * 0.3);
        }
      }
    }
    if (r > 0.01) {
      const a = { x: 0.64, y: 0.42 };
      Mt(e, [], a).facing >= Ge && t.shape(Mt(e, Kl(a.x, a.y, 0.05 + 0.05 * r), a).points, jl, s * 0.35);
    }
  }
}
const Py = 15;
function de(t, e) {
  const n = Math.sqrt(Math.max(0, 1 - e * e));
  return [n * Math.sin(t), e, n * Math.cos(t)];
}
const Iy = ([t, e, n]) => {
  const s = Math.hypot(t, e, n) || 1;
  return [t / s, e / s, n / s];
};
function fe(t, [e, n, s]) {
  const [o, i, r] = t.axes;
  return o[2] * e + i[2] * n + r[2] * s;
}
function Lt(t, e) {
  return Ko(t, e).point;
}
function ko(t, e) {
  const n = Math.abs(t - e) % (Math.PI * 2);
  return n > Math.PI ? Math.PI * 2 - n : n;
}
function Xo(t, e, n = 64) {
  const s = e.top ?? 1, o = e.bottom ?? -1, i = Math.max(8, Math.ceil((s - o) * Py)), r = (g) => Math.min(s, Math.max(o, s - (s - o) * (g - 1) / i)), a = (g) => -Math.PI + Math.PI * 2 * g / n, l = (g, p) => e.normal ? e.normal(g, p) : Iy(e.position(g, p)), c = i + 3, h = new Float64Array(n * c), u = new Float64Array(n * c);
  for (let g = 0; g < c; g++) {
    const p = g === 0 || g === c - 1, m = r(g);
    for (let b = 0; b < n; b++) {
      const v = g * n + b;
      if (p) {
        h[v] = -1;
        continue;
      }
      const w = a(b);
      h[v] = e.inside(w, m), u[v] = h[v] > -0.35 ? fe(t, l(w, m)) : 0;
    }
  }
  const d = (g) => (g % n + n) % n, f = (g) => {
    const p = n + 1, m = new Float64Array(p * c);
    for (let E = 0; E < c; E++)
      for (let O = 0; O <= n; O++) {
        const _ = E * n + (O === n ? 0 : O);
        m[E * p + O] = Math.min(h[_], g * u[_]);
      }
    const b = (E, O) => m[O * p + E], v = (E, O, _, L) => {
      const B = b(E, O), X = b(_, L), J = B === X ? 0.5 : Math.min(1, Math.max(0, B / (B - X)));
      return Lt(t, e.position(a(E + (_ - E) * J), r(O + (L - O) * J)));
    }, w = n * c * 2, y = new Int32Array(w).fill(-1), T = new Int32Array(w).fill(-1), $ = /* @__PURE__ */ new Map(), M = (E, O, _) => {
      const L = (_ * n + d(O)) * 2 + (E ? 1 : 0);
      return $.has(L) || $.set(L, E ? v(d(O), _, d(O), _ + 1) : v(O, _, O + 1, _)), L;
    }, S = (E, O) => {
      y[E] === -1 ? y[E] = O : T[E] = O;
    }, k = (E, O) => {
      S(E, O), S(O, E);
    };
    for (let E = 0; E < c - 1; E++)
      for (let O = 0; O < n; O++) {
        const _ = E * p + O, L = (m[_] > 0 ? 8 : 0) | (m[_ + 1] > 0 ? 4 : 0) | (m[_ + p + 1] > 0 ? 2 : 0) | (m[_ + p] > 0 ? 1 : 0);
        if (L === 0 || L === 15) continue;
        const B = () => M(!1, O, E), X = () => M(!1, O, E + 1), J = () => M(!0, O, E), q = () => M(!0, O + 1, E);
        switch (L) {
          case 1:
          case 14:
            k(J(), X());
            break;
          case 2:
          case 13:
            k(X(), q());
            break;
          case 3:
          case 12:
            k(J(), q());
            break;
          case 4:
          case 11:
            k(B(), q());
            break;
          case 6:
          case 9:
            k(B(), X());
            break;
          case 7:
          case 8:
            k(J(), B());
            break;
          case 5:
          case 10: {
            const R = (b(O, E) + b(O + 1, E) + b(O + 1, E + 1) + b(O, E + 1)) / 4 > 0;
            L === 5 === R ? (k(J(), B()), k(X(), q())) : (k(J(), X()), k(B(), q()));
            break;
          }
        }
      }
    const x = [], P = new Uint8Array(w);
    for (const E of $.keys()) {
      if (P[E]) continue;
      const O = [];
      let _ = -1, L = E;
      for (; L !== -1 && !P[L]; ) {
        P[L] = 1, O.push($.get(L));
        const B = y[L], X = T[L], J = B !== -1 && B !== _ && !P[B] ? B : X !== -1 && X !== _ && !P[X] ? X : -1;
        _ = L, L = J;
      }
      O.length >= 3 && x.push(O);
    }
    return x;
  };
  return { near: f(1), far: f(-1) };
}
const Xl = /* @__PURE__ */ new WeakMap();
function aa(t, e, n) {
  let s = Xl.get(t);
  s || Xl.set(t, s = /* @__PURE__ */ new Map());
  let o = s.get(e);
  return o || s.set(e, o = n()), o;
}
function la(t, e, n) {
  t.save(), t.beginPath(), t.rect(-1e5, -1e5, 2e5, 2e5), t.ellipse(e.center.x, e.center.y, e.rx, e.ry, e.angle, 0, Math.PI * 2), t.clip("evenodd"), n(), t.restore();
}
function V0(t, e, n, s = 0.04) {
  const o = [];
  let i = [];
  return e.forEach((r, a) => {
    fe(t, n[a]) > s ? i.push(Lt(t, r)) : (i.length >= 2 && o.push(i), i = []);
  }), i.length >= 2 && o.push(i), o;
}
const gs = { swing: 0, trail: 0, lift: 0 };
function ca(t) {
  if (!t) return gs;
  const e = t["hair.swing"] ?? 0, n = t["hair.trail"] ?? 0, s = t["hair.lift"] ?? 0;
  return e === 0 && n === 0 && s === 0 ? gs : { swing: e, trail: n, lift: s };
}
const J0 = (t) => t.swing === 0 && t.trail === 0 && t.lift === 0;
function Oy(t) {
  return t.length > 0 || t.ties.some((e) => e.kind !== "bun");
}
function kr([t, e, n], s) {
  if (s === 0) return [t, e, n];
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o - n * i, e, n * o + t * i];
}
const Ul = {
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
}, Gl = 1.75, Z0 = {
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
  shoulderStraight: { volume: 0.16, length: Gl, opening: 84, part: 0, strands: "part", hairline: { front: 0.5, side: 0.05, back: -0.85 }, coversEars: !0 },
  shoulderWaves: { volume: 0.22, length: Gl, opening: 84, part: 22, texture: "wavy", textureAmount: 0.12, hairline: { front: 0.45, side: 0.05, back: -0.85 }, coversEars: !0 },
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
}, ye = {
  black: "#22201f",
  brown: "#6b4630",
  chestnut: "#7b4a2b",
  auburn: "#9a4426",
  blond: "#d9b55a",
  ginger: "#c8662f",
  gray: "#a7a29c",
  white: "#ecebe7"
};
function _y(t) {
  const e = typeof t == "string" ? { style: t } : t, n = e.style ? Z0[e.style] : {};
  if (e.style && !n) throw new Error(`hair: unknown style '${e.style}'`);
  const { style: s, hairline: o, ...i } = e;
  return {
    ...Ul,
    ...n,
    ...i,
    hairline: { ...Ul.hairline, ...n.hairline, ...o },
    ties: (i.ties ?? n.ties ?? []).map((r) => ({ ...r })),
    ...i.spikes ?? n.spikes ? { spikes: (i.spikes ?? n.spikes).map((r) => ({ ...r })) } : {}
  };
}
const Ve = (t) => t * Math.PI / 180, is = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
}, vr = (t) => 1 - Math.abs(2 * (t - Math.floor(t)) - 1);
function vo(t, e) {
  const { front: n, side: s, back: o } = t.hairline, i = (n - o) / 2, r = (n + o) / 2, a = (r + s) / 2, l = (r - s) / 2, c = Math.max(0, Math.cos(e));
  let h = a + i * Math.cos(e) + l * Math.cos(2 * e);
  return h -= t.sweep * Math.sin(e) * c, h += t.recede * Math.exp(-(((Math.abs(e) - 0.75) / 0.32) ** 2)), (t.texture === "spiky" || t.texture === "curly") && (h -= t.textureAmount * 0.6 * vr(e * 11 / (Math.PI * 2)) * c), h;
}
function Vl(t, e, n) {
  const s = t.textureAmount;
  switch (t.texture) {
    case "spiky":
      return s * (vr(e * 11 / (Math.PI * 2)) * vr(n * 2.6 + 0.5)) ** 1.2 * is(-0.3, 0.4, n);
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
function Q0(t, e, n = gs) {
  const s = t.length > 0, o = /* @__PURE__ */ new Map(), i = (h) => {
    let u = o.get(h);
    return u === void 0 && o.set(h, u = vo(t, h)), u;
  }, r = Ve(t.opening), a = (h) => t.length + (t.texture === "wavy" || t.texture === "curly" || t.texture === "locs" ? 0.12 * Math.sin(h * 9) : 0), l = (h, u, d) => {
    if (t.flat <= 0 || u < 0.45) return null;
    const f = (u - 0.45) / 0.55, g = Math.sqrt(1 - 0.45 * 0.45) * d * (1 - f ** 5), p = 0.45 + (1 + t.flat - 0.45) * Math.min(1, f * 1.8);
    return [g * Math.sin(h), p * (1 + e), g * Math.cos(h)];
  }, c = {
    top: 1,
    bottom: s ? -(t.length + 0.25) : -1,
    inside(h, u) {
      const d = u - i(h);
      if (!s) return d;
      const f = Math.min(u + a(h), ko(h, 0) - r);
      return Math.max(d, f);
    },
    position(h, u) {
      if (s && u < 0) {
        const w = t.length < 1.5 ? 0.14 * is(-t.length + 0.45, -t.length - 0.1, u) : 0, y = 1 + e + t.volume * (1 - w * 2.5) + Vl(t, h, u) - w;
        return [y * Math.sin(h), u, y * Math.cos(h)];
      }
      const d = 0.4 + 0.6 * is(0, 0.3, u - vo(t, h)), f = 1 + e + (t.volume + Vl(t, h, u)) * d, g = l(h, u, f);
      if (g) return g;
      const [p, m, b] = de(h, u), v = [p * f, m * f, b * f];
      if (t.quiff > 0) {
        const w = t.quiff * Math.exp(-((h / 0.7) ** 2)) * is(0.15, 0.85, u);
        v[1] += w * 0.7, v[2] += w * 0.45;
      }
      return v;
    },
    normal(h, u) {
      return s && u < 0 ? [Math.sin(h), 0, Math.cos(h)] : de(h, u);
    }
  };
  return s && !J0(n) ? Hy(c, t, n) : c;
}
function Hy(t, e, n) {
  const s = (i) => i < 0 ? is(-0.15, -Math.max(0.7, e.length), i) : 0, o = (i) => Ve(n.swing) * s(i);
  return {
    top: t.top,
    bottom: t.bottom,
    inside: (i, r) => t.inside(i + o(r), r),
    position(i, r) {
      const a = s(r);
      if (a === 0) return t.position(i, r);
      const l = o(r), [c, h, u] = kr(t.position(i + l, r), l);
      return [c, h + n.lift * a, u - n.trail * a];
    },
    normal: (i, r) => kr(t.normal(i + o(r), r), o(r))
  };
}
const Cy = (t) => t.texture === "spiky" || t.texture === "curly" || t.texture === "locs" ? 104 : t.texture === "wavy" ? 80 : 64;
function tu(t, e, n, s) {
  return aa(t, Ly(e, s), () => Xo(t, n, Cy(e)));
}
const Jl = /* @__PURE__ */ new WeakMap();
let Ry = 1;
function Ly(t, e) {
  if (J0(e)) return t;
  let n = Jl.get(t);
  return n || Jl.set(t, n = Ry++), `${n}:${e.swing}:${e.trail}:${e.lift}`;
}
function eu(t) {
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
function Ai(t, [e, n, s]) {
  const o = Lt(t, [e, n, s]);
  return { x: o.x - t.center.x, y: o.y - t.center.y };
}
function Fy(t, e, n, s = 16) {
  return Array.from({ length: s + 1 }, (o, i) => {
    const r = i / s, a = 1 - r;
    return { x: a * a * t.x + 2 * a * r * e.x + r * r * n.x, y: a * a * t.y + 2 * a * r * e.y + r * r * n.y };
  });
}
function Wy(t, e, n, s, o) {
  const i = t.ry, r = (e.length ?? 1.8) * i, a = Ai(t, kr(s, Ve(o.swing))), l = Ai(t, [0, o.lift, -o.trail]), c = Math.hypot(a.x, a.y) || 1, h = e.at === "high" || e.at === "low" || e.at === "top" ? Ai(t, [0.95, 0, 0]) : { x: 0 }, u = e.kind === "braid" ? 0.15 : 0.5, d = {
    x: n.x + a.x / c * i * u + h.x * 0.9 + l.x * 0.5,
    y: n.y + a.y / c * i * u * 0.6 + l.y * 0.5
  }, f = { x: n.x + a.x / c * i * u * 0.6 + h.x * 1.3 + l.x, y: n.y + r + l.y };
  return Fy(n, d, f);
}
const Uo = (t) => Math.max(1, t * 0.5), nu = (t, e) => Math.max(0.8, Math.min(t * 0.4, 0.1 * e.rx));
function su(t, e, n, s, o, i) {
  const { point: r, out: a } = eu(s.at), l = 1 + n.volume, c = Lt(e, [r[0] * l, r[1] * l, r[2] * l]), h = Uo(o), u = nu(o, e);
  if (s.kind === "bun") {
    const p = s.size ?? 0.32, m = Lt(e, [r[0] * l + a[0] * p, r[1] * l + a[1] * p, r[2] * l + a[2] * p]);
    t.ellipse(m.x, m.y, p * e.rx, p * e.ry, e.angle, n.color, h);
    const b = p * e.rx * 0.55;
    t.line(
      Array.from({ length: 9 }, (v, w) => {
        const y = -0.4 + w / 8 * Math.PI * 1.3;
        return { x: m.x + Math.cos(y) * b, y: m.y + Math.sin(y) * b * 0.8 };
      }),
      u
    );
    return;
  }
  const d = Wy(e, s, c, a, i), f = (s.size ?? (s.kind === "braid" ? 0.2 : 0.34)) * e.rx * 2;
  if (s.kind === "ponytail")
    t.shape(Rt(d, f, f * 0.15), n.color, h), t.line(d.slice(3, d.length - 3), u);
  else {
    const m = d.slice(0, d.length - 3);
    for (let w = 0; w < 7; w++) {
      const y = m[Math.floor(w / 7 * (m.length - 1))], T = m[Math.floor((w + 1) / 7 * (m.length - 1))], $ = Math.atan2(T.y - y.y, T.x - y.x), M = Math.hypot(T.x - y.x, T.y - y.y), S = f * (1 - w / (7 * 2.2)), k = (w % 2 === 0 ? 1 : -1) * 0.35, x = { x: (y.x + T.x) / 2, y: (y.y + T.y) / 2 };
      t.ellipse(x.x, x.y, M * 0.62, S * 0.5, $ + k, n.color, h * 0.8);
    }
    const b = m[m.length - 1], v = d[d.length - 1];
    t.shape(Rt([b, v], f * 0.7, f * 0.2), n.color, h * 0.8);
  }
  const g = d[s.kind === "braid" ? d.length - 4 : 2];
  t.ellipse(g.x, g.y, f * 0.32, f * 0.22, e.angle, n.color, h);
}
function ou(t, e) {
  return fe(t, eu(e.at).out) < -0.2;
}
function Ny(t) {
  const e = (o, i, r = 0, a = 14) => Array.from({ length: a + 1 }, (l, c) => {
    const h = c / a;
    return [o[0] + (i[0] - o[0]) * h + r * Math.sin(Math.PI * h), o[1] + (i[1] - o[1]) * h];
  }), n = Ve(t.part ?? 0), s = (o) => vo(t, o) + 0.04;
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
      const o = t.length > 0 ? -t.length + 0.25 : -0.4, i = [-2.6, -2, -1.4, 1.4, 2, 2.6, 3.05].map((r) => e([r, vo(t, r) < 0.9 ? 0.6 : 0.9], [r, o], 0));
      return t.part !== null && i.push(e([n, s(n)], [n, 0.97])), i;
    }
    default:
      return [];
  }
}
function Dy(t, e, n, s, o) {
  if (s.fill === "stipple" || s.hairline.front > 1.5) return;
  const i = o.motion ?? gs, r = o.lineWidth * 0.45 / n.rx, { far: a } = tu(n, s, Q0(s, r, i), i);
  la(e, n, () => {
    for (const l of s.ties) ou(n, l) && su(t, n, s, l, o.lineWidth, i);
    ru(t, n, s, o.lineWidth, r, !1);
    for (const l of a) t.shape(l, s.color, Uo(o.lineWidth));
  });
}
function iu(t, e, n, s) {
  if (n.hairline.front > 1.5) return;
  const o = s.motion ?? gs, i = s.lineWidth * 0.45 / e.rx, r = Q0(n, i, o), a = nu(s.lineWidth, e);
  if (n.fill === "stipple") {
    for (let h = 0.97; h > -1; h -= 0.17)
      for (let u = -Math.PI; u < Math.PI; u += 0.27) {
        const d = Math.round(h * 100) % 2 * 0.13;
        if (r.inside(u + d, h) < 0.02) continue;
        const f = de(u + d, h);
        if (fe(e, f) < 0.12) continue;
        const g = Lt(e, f);
        t.dot(g.x, g.y, a * 0.4);
      }
    return;
  }
  const { near: l } = tu(e, n, r, o), c = Uo(s.lineWidth);
  ru(t, e, n, s.lineWidth, i, !0);
  for (const h of l) t.shape(h, n.color, c);
  for (const h of Ny(n)) {
    const u = h.map(([f, g]) => {
      const [p, m, b] = r.position(f, g);
      return [p * 0.985, m * 0.985, b * 0.985];
    }), d = h.map(([f, g]) => r.normal(f, g));
    for (const f of V0(e, u, d, 0.12)) t.line(f, a);
  }
  for (const h of n.ties) ou(e, h) || su(t, e, n, h, s.lineWidth, o);
}
function ru(t, e, n, s, o, i) {
  for (const r of n.spikes ?? []) {
    const a = de(Ve(r.around), Math.max(-1, Math.min(1, r.up)));
    if (fe(e, a) >= 0 !== i) continue;
    const l = [Math.cos(Ve(r.around)), 0, -Math.sin(Ve(r.around))], c = [a[1] * l[2], a[2] * l[0] - a[0] * l[2], -a[1] * l[0]], h = 1 + n.volume + o, u = Math.max(0, r.width), d = Math.max(0, r.length), f = [Lt(e, a.map((g) => g * (h + d)))];
    for (let g = 0; g < 8; g++) {
      const p = g * Math.PI / 4, m = a.map((b, v) => b * h + u * (l[v] * Math.cos(p) + c[v] * Math.sin(p)));
      f.push(Lt(e, m));
    }
    t.shape(U0(f), n.color, Uo(s));
  }
}
const au = 0.35, ha = (t) => ({ centre: [t * 0.98, -0.02, -0.08], out: [t, 0, -0.12] });
function lu(t, e, n, s, o) {
  const { centre: i, out: r } = ha(n), a = fe(e, r), l = Math.max(1, s.lineWidth * 0.55), c = s.skin === "none" ? null : s.skin, h = e.ry * 0.27;
  if (!o) {
    const m = Lt(e, [i[0] * 1.06, i[1], i[2]]);
    t.ellipse(m.x, m.y, e.rx * 0.17, h, e.angle, c, l);
    return;
  }
  const u = Lt(e, i), d = e.rx * (0.12 + 0.08 * a);
  t.ellipse(u.x, u.y, d, h, e.angle, c, l);
  const f = Math.cos(e.angle), g = Math.sin(e.angle), p = Array.from({ length: 9 }, (m, b) => {
    const v = -Math.PI * 0.55 + b / 8 * Math.PI * 1.1, w = Math.cos(v) * d * 0.45 * -n, y = Math.sin(v) * h * 0.55;
    return { x: u.x + w * f - y * g, y: u.y + w * g + y * f };
  });
  t.line(p, Math.max(0.8, l * 0.7));
}
function By(t, e, n, s) {
  la(e, n, () => {
    for (const o of [1, -1]) fe(n, ha(o).out) < au && lu(t, n, o, s, !1);
  });
}
function zy(t, e, n) {
  for (const s of [1, -1]) fe(e, ha(s).out) >= au && lu(t, e, s, n, !0);
}
const cu = {
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
function qy(t, e) {
  const n = typeof t == "string" ? { style: t } : t, s = n.style ? cu[n.style] : void 0;
  if (n.style && !s) throw new Error(`facialHair: unknown style '${n.style}'`);
  return {
    color: n.color ?? e ?? "#6b4630",
    moustache: n.moustache ?? s?.moustache ?? "none",
    beard: n.beard ?? s?.beard ?? "none"
  };
}
const Te = (t) => t * Math.PI / 180, Qs = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
}, hu = {
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
}, Yy = (t, e) => {
  const n = Qs(Te(48), Te(100), ko(e, 0));
  return t.top[0] + (t.top[1] - t.top[0]) * n;
}, jy = (t) => t === "sideburns" || t === "muttonChops";
function Mr(t, e) {
  const n = hu[t];
  if (!n) return null;
  const s = Te(n.reach), o = (i) => {
    const r = ko(i, 0);
    return n.shape === "point" ? Math.exp(-((r / 0.42) ** 2)) : n.shape === "square" ? 1 - Qs(Te(45), Te(85), r) : Math.cos(Math.min(r, Math.PI / 2)) ** 0.7;
  };
  return {
    top: Math.max(n.top[0], n.top[1]) + 0.05,
    bottom: -1,
    inside(i, r) {
      const a = ko(i, 0), l = Yy(n, i);
      let c = Math.min(l - r, s - a);
      if (n.band > 0 && (c = Math.min(c, r - (l - n.band))), jy(t)) {
        const h = t === "muttonChops" ? Te(70) - Te(22) * Qs(0.08, -0.6, r) : Te(72);
        c = Math.min(c, a - h);
      }
      return c;
    },
    position(i, r) {
      const [a, l, c] = de(i, r), h = 1 + e + n.volume, u = n.length * o(i) * Qs(-0.45, -1, r);
      return [a * h, l * h - u, c * h + u * 0.25];
    },
    normal: (i, r) => de(i, r)
  };
}
function Ky(t) {
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
const ms = (t) => Math.max(1, t * 0.45);
function Xy(t, e, n, s) {
  for (let o = 0.1; o > -1; o -= 0.13)
    for (let i = -Math.PI / 1.7; i < Math.PI / 1.7; i += 0.2) {
      const r = Math.round(o * 100) % 2 * 0.1;
      if (n.inside(i + r, o) < 0.02) continue;
      const a = de(i + r, o);
      if (fe(e, a) < 0.15) continue;
      const l = Lt(e, a);
      t.dot(l.x, l.y, s);
    }
}
function Uy(t, e, n, s, o) {
  const i = s.beard === "stubble" ? null : Mr(s.beard, o.lineWidth * 0.45 / n.rx);
  if (!i) return;
  const { far: r } = aa(n, s, () => Xo(n, i));
  la(e, n, () => {
    for (const a of r) t.shape(a, s.color, ms(o.lineWidth));
  });
}
function Gy(t, e, n, s, o) {
  if (n.beard === "none") return;
  const i = s.lineWidth * 0.45 / e.rx;
  if (n.beard === "stubble") {
    Xy(t, e, Mr("full", i), Math.max(0.5, s.lineWidth * 0.09));
    return;
  }
  if (n.beard === "soulPatch") {
    const l = [{ x: -0.05, y: -0.55 }, { x: 0.05, y: -0.55 }, { x: 0, y: -0.68 }], { points: c, facing: h } = Mt(e, l, { x: 0, y: -0.6 });
    h > -0.05 && t.shape(c, n.color, ms(s.lineWidth) * 0.7);
    return;
  }
  const r = Mr(n.beard, i);
  if (!r) return;
  const { near: a } = aa(e, n, () => Xo(e, r));
  for (const l of a) t.shape(l, n.color, ms(s.lineWidth));
  if (hu[n.beard]?.aroundMouth) {
    const l = 0.27 * Math.max(0.3, o), c = Array.from({ length: 20 }, (d, f) => {
      const g = Math.PI * 2 * f / 20;
      return { x: Math.cos(g) * l, y: -0.42 + Math.sin(g) * 0.13 };
    }), { points: h, facing: u } = Mt(e, c, { x: 0, y: -0.42 });
    u > -0.05 && t.shape(h, s.skin === "none" ? "#ffffff" : s.skin, 0);
  }
}
function Vy(t, e, n, s) {
  if (n.moustache === "none") return;
  const o = { x: 0, y: -0.24 };
  if (n.moustache === "pencil") {
    const l = [-0.2, -0.1, 0, 0.1, 0.2].map((u) => ({ x: u, y: -0.25 + 0.03 * Math.cos(u / 0.2 * Math.PI) })), { points: c, facing: h } = Mt(e, l, o);
    h > -0.05 && t.line(c, Math.max(1, s.lineWidth * 0.32));
    return;
  }
  const i = Ky(n.moustache);
  if (!i) return;
  const { points: r, facing: a } = Mt(e, i, o);
  if (!(a <= -0.05) && (t.shape(r, n.color, ms(s.lineWidth) * 0.8), n.moustache === "handlebar"))
    for (const l of [1, -1]) {
      const c = Array.from({ length: 10 }, (h, u) => {
        const d = -Math.PI / 2 + u / 9 * Math.PI * 1.4;
        return { x: l * (0.27 + 0.05 * Math.cos(d)), y: -0.21 + 0.05 * (1 + Math.sin(d)) };
      });
      c.unshift({ x: l * 0.22, y: -0.27 }), t.line(Mt(e, c, o).points, ms(s.lineWidth) * 0.8);
    }
}
const uu = { round: !0, square: !0, sunglasses: !0 };
function Jy(t) {
  const n = (typeof t == "string" ? { style: t } : t).style ?? "round";
  if (!(n in uu)) throw new Error(`glasses: unknown style '${n}'`);
  return { style: n };
}
const Zl = 0.34, ae = 0.12, Zy = 0.05;
function Qy(t, e) {
  return Array.from({ length: 28 }, (s, o) => {
    const i = Math.PI * 2 * o / 28;
    if (t === "round") return { x: e + Math.cos(i) * 0.2, y: ae + Math.sin(i) * 0.19 };
    const r = Math.cos(i), a = Math.sin(i), l = t === "sunglasses" ? 0.22 : 0.21, c = t === "sunglasses" ? 0.17 : 0.16;
    return { x: e + Math.sign(r) * Math.abs(r) ** 0.45 * l, y: ae - 0.01 + Math.sign(a) * Math.abs(a) ** 0.45 * c };
  });
}
function tb(t, e, n, s) {
  const o = Math.max(1, Math.min(s.lineWidth * 0.5, 0.11 * e.rx)), i = [];
  for (const r of [1, -1]) {
    const a = Zl * r, { points: l, facing: c } = Mt(e, Qy(n.style, a), { x: a, y: ae });
    if (c < Zy) continue;
    i.push(r), t.shape(l, n.style === "sunglasses" ? "#1f2328" : null, o);
    const h = [r * 0.97, ae + 0.02, -0.1];
    if (fe(e, [r, 0, 0]) > 0.15) {
      const u = Mt(e, [{ x: a + r * 0.21, y: ae + 0.02 }], { x: a, y: ae }).points[0];
      t.line([u, Lt(e, h)], o * 0.9);
    }
  }
  if (i.length === 2) {
    const r = [
      { x: Zl - 0.2, y: ae + 0.02 },
      { x: 0, y: ae + 0.07 },
      { x: -0.14, y: ae + 0.02 }
    ];
    t.line(Mt(e, r, { x: 0, y: ae }).points, o);
  }
}
const ua = {
  cap: { color: "#d64535", brim: [0.36, 0.16], height: 1, peak: 0.7, detail: "seams" },
  beanie: { color: "#3a6ea5", brim: [0.3, 0.12], height: 1.08, detail: "fold" },
  hardHat: { color: "#f2c230", brim: [0.34, 0.22], height: 1.12, ring: 0.16, detail: "ridge" },
  sunHat: { color: "#e3c98f", brim: [0.36, 0.3], height: 1.02, ring: 0.62, detail: "band" },
  bowler: { color: "#2f2b2a", brim: [0.36, 0.28], height: 1.15, ring: 0.2, detail: "band" }
};
function eb(t) {
  const e = typeof t == "string" ? { style: t } : t, n = e.style ?? "cap", s = ua[n];
  if (!s) throw new Error(`hat: unknown style '${n}'`);
  return { style: n, color: e.color ?? s.color };
}
const Je = (t, e) => t.brim[1] + (t.brim[0] - t.brim[1]) * (1 + Math.cos(e)) / 2;
function nb(t, e) {
  return {
    top: 1,
    bottom: Math.min(...t.brim) - 0.05,
    inside: (n, s) => s - Je(t, n),
    position(n, s) {
      const [o, i, r] = de(n, s), a = Je(t, n), l = s > a ? (i - a) * (t.height - 1) : 0;
      return [o * e, i * e + l, r * e];
    },
    normal: (n, s) => de(n, s)
  };
}
function sb(t, e, n) {
  const o = (i, r, a) => {
    const l = Je(e, i) * n - a;
    return [Math.sin(i) * r, l, Math.cos(i) * r];
  };
  if (e.peak) {
    const i = [], r = [];
    for (let a = 0; a <= 24; a++) {
      const l = (-80 + 160 * a / 24) * (Math.PI / 180), c = e.peak * Math.cos(l) ** 0.6;
      i.push(Lt(t, [Math.sin(l) * (n + c * 0.25), Je(e, l) * n - 0.07 * Math.cos(l), Math.cos(l) * (n + c)])), r.push(Lt(t, o(l, n, 0)));
    }
    return [...i, ...r.reverse()];
  }
  return e.ring ? Array.from({ length: 48 }, (i, r) => Lt(t, o(Math.PI * 2 * r / 48, n + e.ring, 0.07))) : null;
}
function ob(t) {
  const e = (s) => Array.from({ length: 13 }, (o, i) => [s, Je(t, s) + (0.97 - Je(t, s)) * i / 12]), n = (s) => Array.from({ length: 49 }, (o, i) => {
    const r = -Math.PI + Math.PI * 2 * i / 48;
    return [r, Je(t, r) + s];
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
function du(t, e, n, s) {
  const o = ua[n.style], r = 1 + s.lineWidth * 0.45 / e.rx + Math.max(0.05, Math.min(0.3, s.hairVolume) + 0.04), a = Math.max(1, s.lineWidth * 0.5), l = sb(e, o, r);
  l && t.shape(l, n.color, a);
  const c = nb(o, r), { near: h, far: u } = Xo(e, c);
  for (const f of [...u, ...h]) t.shape(f, n.color, a);
  const d = Math.max(0.8, a * 0.7);
  for (const f of ob(o)) {
    const g = f.map(([m, b]) => {
      const [v, w, y] = c.position(m, b);
      return [v * 0.99, w * 0.99, y * 0.99];
    }), p = f.map(([m, b]) => de(m, b));
    for (const m of V0(e, g, p, 0.1)) t.line(m, d);
  }
  if (o.detail === "seams") {
    const f = Lt(e, [0, r * 1.01, 0]);
    t.dot(f.x, f.y, a * 0.9);
  }
}
function ib(t) {
  const e = t.hair ? _y(t.hair) : null;
  return {
    hair: e,
    facialHair: t.facialHair ? qy(t.facialHair, e?.color) : null,
    glasses: t.glasses ? Jy(t.glasses) : null,
    hat: t.hat ? eb(t.hat) : null,
    ears: t.ears ?? !1
  };
}
const fu = (t) => !t.hair && !t.facialHair && !t.glasses && !t.hat && !t.ears, pu = (t) => t.axes[2][2] < -0.3, gu = (t) => t.ears && !t.hair?.coversEars;
function mu(t, e, n, s, o, i) {
  fu(n) || (n.hair && Dy(e, t, s, n.hair, { ...i, motion: ca(o) }), n.facialHair && Uy(e, t, s, n.facialHair, i), gu(n) && By(e, t, s, i));
}
function rb(t, e, n, s, o, i, r) {
  if (fu(n)) {
    r();
    return;
  }
  const a = pu(s);
  gu(n) && zy(e, s, i), n.hair && !a && iu(e, s, n.hair, { ...i, motion: ca(o) }), n.facialHair && Gy(e, s, n.facialHair, i, o.mouthWidth ?? 1), r(), n.facialHair && Vy(e, s, n.facialHair, i), n.glasses && tb(e, s, n.glasses, i), n.hat && !a && du(e, s, n.hat, { lineWidth: i.lineWidth, hairVolume: n.hair?.volume ?? 0 });
}
function yu(t, e, n, s, o, i) {
  pu(s) && (n.hair && iu(e, s, n.hair, { ...i, motion: ca(o) }), n.hat && du(e, s, n.hat, { lineWidth: i.lineWidth, hairVolume: n.hair?.volume ?? 0 }));
}
const Ql = 40, ab = 0.215 + 0.205, Yt = (t, e) => {
  const n = {};
  for (const s of ["left", "right"]) for (const [o, i] of Object.entries(e)) n[`${t}.${s}.${o}`] = i;
  return n;
}, ft = (t, e) => t[e] ?? ht[e] ?? 0;
function bu(t, e, n = ht, s = 1) {
  const o = zo(t), i = e * Math.PI * 2, r = Math.sin(i) * s, a = Math.cos(i) * s, l = (1 + Math.cos(i * 2 * (o.bounces ?? 1))) / 2, c = o.crouch ?? 0, h = o.shoulder ?? 0, u = o.forearm ?? 0, d = { ...ht, ...n };
  d["leg.left.swing"] = o.swing * r + c * 0.6, d["leg.right.swing"] = -o.swing * r + c * 0.6, d["leg.left.knee"] = o.knee * Math.max(0, a) + c * 1.2, d["leg.right.knee"] = o.knee * Math.max(0, -a) + c * 1.2, d["leg.left.ankle"] = ft(n, "leg.left.ankle") - (o.tiptoe ?? 0), d["leg.right.ankle"] = ft(n, "leg.right.ankle") - (o.tiptoe ?? 0);
  for (const [f, g] of [["left", -1], ["right", 1]])
    ft(n, `arm.${f}.spread`) > Ql || ft(n, `arm.${f}.swing`) > Ql || (d[`arm.${f}.swing`] = h + g * o.arm * r, d[`arm.${f}.elbow`] = ft(n, `arm.${f}.elbow`) + u + o.elbow * Math.max(0, g * r));
  return d.lean = ft(n, "lean") + o.lean * s, d.bend = ft(n, "bend") + (o.bend ?? 0), d["head.nod"] = ft(n, "head.nod") - o.lean * 0.5 * s + (o.headTilt ?? 0), d.side = ft(n, "side") + (o.sway ?? 0) * Math.sin(i), d.lift = ft(n, "lift") + (o.bounce ?? 0) * s * l, d.stretch = ft(n, "stretch") * (1 + (o.squash ?? 0) * (l - 0.5)), d;
}
function wu(t, e, n = 1, s = 1) {
  const o = zo(t);
  return 4 * ab * s * e * Math.sin(o.swing * n * Math.PI / 180);
}
const cn = (t) => j0[t], da = {
  /** Squash down in a squint, shoot up stretched with arms flung up, hang, land squashed, end surprised. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: ft(t, "lean") - 4, ...Yt("arm", { spread: 6, swing: 0, elbow: 10 }), "eye.left": 0.35, "eye.right": 0.35, "brow.left": -0.6, "brow.right": -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { lift: 0.22, stretch: 1.35, bend: -14, ...Yt("arm", { spread: 150, bend: 35, swing: 0, elbow: 0 }), ...Yt("leg", { swing: 25, knee: 60 }), ...cn("shocked") }, easing: "ease-out-cubic" },
    { after: 720, pose: { lift: 0.25, stretch: 1.25, bend: -10, ...Yt("arm", { spread: 140 }) }, easing: "ease-in-out" },
    { after: 900, pose: { lift: 0, stretch: 0.74, bend: 12, ...Yt("arm", { spread: 70, bend: 0 }), ...Yt("leg", { swing: 30, knee: 60 }) }, easing: "ease-in-quad" },
    {
      after: 1060,
      pose: {
        stretch: 1.06,
        bend: -3,
        ...Yt("arm", { spread: 60 }),
        "leg.left.swing": ft(t, "leg.left.swing"),
        "leg.right.swing": ft(t, "leg.right.swing"),
        "leg.left.knee": ft(t, "leg.left.knee"),
        "leg.right.knee": ft(t, "leg.right.knee")
      },
      easing: "ease-out"
    },
    { after: 1260, pose: { stretch: ft(t, "stretch"), bend: ft(t, "bend"), ...cn("surprised"), ...Yt("arm", { spread: 55, bend: 60 }) }, easing: "ease-in-out" }
  ],
  /** Glance ahead, look away unbothered, then snap back in shock with a little hop. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0, "head.turn": 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, "head.turn": 30, "head.nod": ft(t, "head.nod") - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { "head.turn": 0, "head.nod": ft(t, "head.nod") - 10, bend: ft(t, "bend") - 10, lift: 0.05, stretch: 1.18, ...cn("shocked"), lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { lift: 0, stretch: 0.88, "head.nod": ft(t, "head.nod") - 4, bend: ft(t, "bend") + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: ft(t, "stretch"), "head.nod": ft(t, "head.nod"), bend: ft(t, "bend") }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
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
        ...cn("angry"),
        lookX: 1
      },
      easing: "ease-out"
    },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, "head.nod": 6, "arm.left.swing": -30, "arm.right.swing": 60, "leg.left.swing": -20, "leg.left.knee": 30, "leg.right.swing": 20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { lift: 0, stretch: 0.7, bend: 14, ...Yt("arm", { spread: 75 }), ...Yt("leg", { swing: 25, knee: 50 }) }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, "arm.left.spread": ft(t, "arm.left.spread"), "arm.right.spread": ft(t, "arm.right.spread") }, easing: "ease-out" },
    { after: 460, pose: { lift: 0, stretch: ft(t, "stretch"), bend: ft(t, "bend"), ...Yt("leg", { swing: 0, knee: 0 }) }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: paws up, fast small shakes side to side, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...cn("scared"), ...Yt("arm", { swing: 40, elbow: 110, spread: 14 }), stretch: 0.94, bend: ft(t, "bend") + 8 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) {
      const s = n % 2 === 0 ? 1 : -1;
      e.push({ after: 80 + n * 45, pose: { side: ft(t, "side") + 2.5 * s, "head.tilt": ft(t, "head.tilt") - 2 * s } });
    }
    return e.push({ after: 755, pose: { side: ft(t, "side"), "head.tilt": ft(t, "head.tilt"), bend: ft(t, "bend") } }), e;
  },
  /** A sigh: the body sags, the back curls, the head and arms drop. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, "head.nod": ft(t, "head.nod") - 4, "brow.left": 0.3, "brow.right": 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...cn("sad"), bend: 18, stretch: 0.92, lean: ft(t, "lean") + 5, "head.nod": 14, ...Yt("arm", { spread: 6, swing: 0, elbow: 4, bend: 0 }) }, easing: "ease-in-out" }
  ]
};
function lb(t, e) {
  const n = wt(e.from ?? {}), s = e.speed ?? 1;
  let o = n;
  return [
    { time: e.at, pose: n },
    ...da[t](n).map((i) => (o = { ...o, ...i.pose }, { time: e.at + i.after * s, pose: o, act: !1, ...i.easing ? { easing: i.easing } : {} }))
  ];
}
function cb(t, e = ht) {
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
function hb(t, e = ht) {
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
const tc = { sweeping: cb, brushing: hb };
function hx(t, e, n = ht) {
  const s = tc[t];
  if (!s) throw new Error(`humanCyclePose: ${ut("cycle", t, Object.keys(tc))}`);
  return s(e, n);
}
const ub = { apron: "#d8b48a", labCoat: "#f4f6f8", hoodie: "#6b7280", cardigan: "#6b8e4e", overalls: "", sari: "#16a34a" }, $i = (t, e, n) => t.slice(Math.floor((t.length - 1) * e), Math.ceil((t.length - 1) * n) + 1), gt = (t, e, n) => ({ x: t.x + (e.x - t.x) * n, y: t.y + (e.y - t.y) * n });
function db(t) {
  return t.parts["leg.left"].order > t.parts["leg.right"].order ? "left" : "right";
}
const ec = (t) => Math.max(t.parts["leg.left"].order, t.parts["leg.right"].order) > t.parts.spine.order, Ut = (t) => Math.cos(t.turn * Math.PI / 2);
function fb(t = {}) {
  const e = t.shirt ?? "#e2493b", n = t.trousers ?? "#24476b", s = t.sleeves ?? "short", o = t.bottom ?? "trousers", i = t.over === "labCoat", r = t.over === "hoodie", a = t.over === "cardigan", l = t.over === "overalls", c = t.over === "sari", h = t.overColor ?? (t.over && t.over !== "overalls" ? ub[t.over] : n), u = t.shoes === "boots", d = t.shoeColor ?? "#3b2a1e", f = (I) => I.lineWidth * 0.45, g = (I, A, H) => {
    const N = I.parts[`leg.${H}`].points;
    if (!(o === "skirt" && !l)) {
      if (o === "shorts" && !l) {
        const z = $i(N, 0, 0.5);
        A.shape(Rt(z, I.height * 0.085, I.height * 0.07), n, f(I));
        return;
      }
      A.shape(Rt(N, I.height * 0.08, I.height * 0.05), n, f(I));
    }
  }, p = (I, A, H) => {
    const N = I.parts[`leg.${H}`].points, z = $i(N, 0.7, 1);
    if (z.length < 2) return;
    A.shape(Rt(z, I.height * 0.075, I.height * 0.07), d, f(I));
    const W = z[0], j = z[1], G = j.x - W.x, F = j.y - W.y, K = Math.hypot(G, F) || 1, Y = I.height * 0.04;
    A.line([{ x: W.x - F / K * Y, y: W.y + G / K * Y }, { x: W.x + F / K * Y, y: W.y - G / K * Y }], f(I) * 0.9);
  }, m = (I) => {
    const A = I.chains.spine, H = A[0], N = A[A.length - 1], z = { x: H.x - (N.x - H.x) * 0.25, y: H.y - (N.y - H.y) * 0.25 };
    return { hip: H, top: N, below: z, line: [z, ...I.parts.spine.points] };
  }, b = (I) => {
    const A = r ? 1.14 : 1, H = Math.hypot(I.points["hip.left"].x - I.points["hip.right"].x, I.points["hip.left"].y - I.points["hip.right"].y), N = Math.max(I.height * 0.15 * A, H + Math.max(I.height * 0.08, I.lineWidth * 1.45) + f(I));
    return Rt(m(I).line, N, I.height * 0.14 * A);
  }, v = (I, A) => {
    const H = [b(A)], { top: N, hip: z } = m(A);
    a && H.push(Rt([N, gt(N, z, 0.5), gt(N, z, 1.08)], A.height * 0.155, A.height * 0.15)), i && H.push(Rt([N, gt(N, z, 0.5), z], A.height * 0.14, A.height * 0.15));
    const W = Object.values(A.points), j = Math.min(...W.map((Y) => Y.x)) - A.height, G = Math.min(...W.map((Y) => Y.y)) - A.height, F = Math.max(...W.map((Y) => Y.x)) + A.height, K = Math.max(...W.map((Y) => Y.y)) + A.height;
    for (const Y of H) {
      I.beginPath(), I.rect(j, G, F - j, K - G), I.moveTo(Y[0].x, Y[0].y);
      for (const Z of Y.slice(1)) I.lineTo(Z.x, Z.y);
      I.closePath(), I.clip("evenodd");
    }
  }, w = (I, A) => {
    const H = r ? h : e;
    A.shape(b(I), H, f(I));
  }, y = (I, A) => {
    const H = Ut(I), { top: N, hip: z } = m(I), W = I.height * 0.07, j = { x: (N.x - z.x) * 0.16, y: (N.y - z.y) * 0.16 };
    if (H >= 0) {
      A.shape(
        [
          { x: N.x - W, y: N.y + j.y * 0.25 },
          { x: N.x - W * 0.8 + j.x, y: N.y + j.y },
          { x: N.x + j.x * 1.2, y: N.y + j.y * 1.35 },
          { x: N.x + W * 0.8 + j.x, y: N.y + j.y },
          { x: N.x + W, y: N.y + j.y * 0.25 }
        ],
        h,
        f(I)
      );
      return;
    }
    const G = gt(N, z, 0.42);
    A.shape(
      [
        { x: N.x - W * 0.9, y: N.y },
        { x: N.x + W * 0.9, y: N.y },
        { x: G.x + W * 0.7, y: G.y },
        { x: G.x, y: G.y + I.height * 0.02 },
        { x: G.x - W * 0.7, y: G.y }
      ],
      h,
      f(I)
    );
  }, T = (I, A) => {
    const H = Ut(I);
    if (H < 0.2) return;
    const { top: N, hip: z } = m(I), W = Math.sin(I.turn * Math.PI / 2) * I.height * 0.03, j = I.height * 0.06 * H, G = gt(N, z, 0.62), F = gt(N, z, 0.9);
    A.line([{ x: G.x + W - j, y: G.y }, { x: F.x + W - j * 1.1, y: F.y }], f(I) * 0.7), A.line([{ x: G.x + W + j, y: G.y }, { x: F.x + W + j * 1.1, y: F.y }], f(I) * 0.7);
    const K = gt(N, z, 0.1);
    for (const Y of [-1, 1]) A.line([{ x: K.x + W + Y * j * 0.2, y: K.y }, { x: K.x + W + Y * j * 0.35, y: K.y + I.height * 0.07 }], f(I) * 0.6);
  }, $ = (I, A) => {
    const { top: H, hip: N } = m(I), z = Ut(I);
    if (A.shape(Rt([H, gt(H, N, 0.5), gt(H, N, 1.08)], I.height * 0.155, I.height * 0.15), h, f(I)), z < 0.2) return;
    const W = Math.sin(I.turn * Math.PI / 2) * I.height * 0.03, j = I.height * 0.02 * z, G = gt(H, N, 0.12), F = gt(H, N, 1.05);
    A.shape([{ x: G.x + W - j, y: G.y }, { x: G.x + W + j, y: G.y }, { x: F.x + W + j * 1.3, y: F.y }, { x: F.x + W - j * 1.3, y: F.y }], e, f(I) * 0.7);
    for (const K of [0.35, 0.55, 0.75]) {
      const Y = gt(H, N, K);
      A.dot(Y.x + W + j * 1.6, Y.y, f(I) * 1.2);
    }
  }, M = (I, A) => {
    const H = Ut(I), { top: N, hip: z } = m(I), W = Math.sin(I.turn * Math.PI / 2) * I.height * 0.04, j = gt(z, N, 0.12), G = gt(z, N, 0.74);
    if (H < 0.15) {
      if (H < -0.3) {
        const Z = I.points["shoulder.left"], tt = I.points["shoulder.right"];
        A.line([Z, { x: j.x + I.height * 0.03, y: j.y }], f(I) * 0.8), A.line([tt, { x: j.x - I.height * 0.03, y: j.y }], f(I) * 0.8);
      }
      return;
    }
    const F = I.height * 0.07 * H;
    A.shape(
      [
        { x: G.x + W - F * 0.75, y: G.y },
        { x: G.x + W + F * 0.75, y: G.y },
        { x: j.x + W + F * 1.1, y: j.y },
        { x: j.x + W - F * 1.1, y: j.y }
      ],
      n,
      f(I)
    );
    for (const Z of ["left", "right"]) {
      const tt = I.points[`shoulder.${Z}`], it = { x: G.x + W + (tt.x > G.x + W ? 1 : -1) * F * 0.55, y: G.y };
      A.line([it, { x: tt.x + (it.x - tt.x) * 0.15, y: tt.y + (it.y - tt.y) * 0.15 }], f(I) * 1.6);
    }
    const K = gt(G, j, 0.3), Y = F * 0.4;
    A.line([{ x: K.x + W - Y, y: K.y }, { x: K.x + W - Y, y: K.y + Y * 1.4 }, { x: K.x + W + Y, y: K.y + Y * 1.4 }, { x: K.x + W + Y, y: K.y }], f(I) * 0.6);
  }, S = (I, A) => {
    const { hip: H, top: N } = m(I), z = gt(H, N, 0.2), W = [I.points["ankle.left"], I.points["ankle.right"]], j = gt(H, { x: (W[0].x + W[1].x) / 2, y: (W[0].y + W[1].y) / 2 }, 0.98), G = I.height * 0.075, F = Math.max(I.height * 0.12, Math.abs(W[0].x - W[1].x) / 2 + I.height * 0.07), K = j.x - z.x, Y = j.y - z.y, Z = Math.hypot(K, Y) || 1, tt = { x: -Y / Z, y: K / Z };
    if (A.shape(
      [
        { x: z.x + tt.x * G, y: z.y + tt.y * G },
        { x: j.x + tt.x * F, y: j.y + tt.y * F },
        { x: j.x - tt.x * F, y: j.y - tt.y * F },
        { x: z.x - tt.x * G, y: z.y - tt.y * G }
      ],
      h,
      f(I)
    ), Ut(I) > 0.2) {
      const rt = Math.sin(I.turn * Math.PI / 2) * I.height * 0.03;
      for (const C of [-0.35, 0, 0.35]) {
        const V = G * 0.5 * C, et = F * 0.45 * C;
        A.line([{ x: z.x + rt + tt.x * V, y: z.y + tt.y * V + I.height * 0.02 }, { x: j.x + rt + tt.x * et, y: j.y + tt.y * et }], f(I) * 0.5);
      }
    }
  }, k = (I, A) => {
    const H = Ut(I), { top: N, hip: z } = m(I), W = Math.sin(I.turn * Math.PI / 2), j = W >= 0 ? "left" : "right", G = j === "left" ? "right" : "left", F = I.points[`shoulder.${j}`], K = I.height * 0.035;
    if (H < 0.15) {
      const tt = gt(N, z, 0.9);
      A.shape(Rt([F, { x: tt.x + (F.x - N.x) * 0.5, y: tt.y }], K * 2.2, K * 2.6), h, f(I));
      return;
    }
    const Y = { x: z.x + (I.points[`hip.${G}`].x - z.x) * 1.2, y: gt(z, N, 0.08).y };
    A.shape(Rt([Y, gt(Y, F, 0.5), F], K * 2.4, K * 2), h, f(I));
    const Z = { x: F.x - (z.x - F.x) * 0.05 - W * I.height * 0.03, y: F.y + I.height * 0.16 };
    A.shape(Rt([F, Z], K * 2, K * 1.6), h, f(I));
  }, x = (I, A) => {
    const { hip: H, top: N } = m(I), z = gt(H, N, 0.18), W = [I.points["knee.left"], I.points["knee.right"]], j = gt(H, { x: (W[0].x + W[1].x) / 2, y: (W[0].y + W[1].y) / 2 }, 1.05), G = I.height * 0.075, F = Math.max(I.height * 0.13, Math.abs(W[0].x - W[1].x) / 2 + I.height * 0.08), K = j.x - z.x, Y = j.y - z.y, Z = Math.hypot(K, Y) || 1, tt = { x: -Y / Z, y: K / Z };
    A.shape(
      [
        { x: z.x + tt.x * G, y: z.y + tt.y * G },
        { x: j.x + tt.x * F, y: j.y + tt.y * F },
        { x: j.x - tt.x * F, y: j.y - tt.y * F },
        { x: z.x - tt.x * G, y: z.y - tt.y * G }
      ],
      n,
      f(I)
    );
  }, P = (I, A) => {
    const H = Ut(I);
    if (H < 0.2) return;
    const { top: N, hip: z } = m(I), W = { x: (z.x - N.x) * 0.12, y: (z.y - N.y) * 0.12 }, j = I.height * 0.045 * H;
    for (const G of [-1, 1])
      A.shape(
        [
          { x: N.x + G * j * 0.2, y: N.y + W.y * 0.1 },
          { x: N.x + G * j * 1.3, y: N.y - W.y * 0.1 },
          { x: N.x + G * j * 0.6 + W.x, y: N.y + W.y }
        ],
        e,
        f(I) * 0.8
      );
  }, E = (I, A, H) => {
    const N = Ut(I);
    if (N < 0.25) return;
    const { top: z, hip: W } = m(I), j = Math.sin(I.turn * Math.PI / 2) * I.height * 0.03, G = (Z) => ({ x: gt(z, W, Z).x + j, y: gt(z, W, Z).y }), F = I.height * 0.022 * N, K = G(0.08), Y = G(0.62);
    A.shape([{ x: K.x - F, y: K.y - F }, { x: K.x + F, y: K.y - F }, { x: K.x + F * 0.6, y: K.y + F }, { x: K.x - F * 0.6, y: K.y + F }], H, f(I) * 0.7), A.shape([{ x: K.x - F * 0.6, y: K.y + F }, { x: K.x + F * 0.6, y: K.y + F }, { x: Y.x + F * 1.4, y: Y.y - F * 2 }, Y, { x: Y.x - F * 1.4, y: Y.y - F * 2 }], H, f(I) * 0.7);
  }, O = (I, A) => {
    const H = Ut(I), { top: N, hip: z } = m(I), W = gt(z, N, 0.72), j = [I.points["knee.left"], I.points["knee.right"]], G = gt(z, { x: (j[0].x + j[1].x) / 2, y: (j[0].y + j[1].y) / 2 }, 0.9), F = Math.sin(I.turn * Math.PI / 2) * I.height * 0.04;
    if (H < 0.15) {
      const Z = gt(z, N, 0.2);
      H < -0.3 && A.line([{ x: Z.x - I.height * 0.05, y: Z.y }, { x: Z.x + I.height * 0.05, y: Z.y }], f(I));
      return;
    }
    const K = I.height * 0.075 * H, Y = gt(z, N, 0.2);
    A.shape(
      [
        { x: W.x + F - K * 0.7, y: W.y },
        { x: W.x + F + K * 0.7, y: W.y },
        { x: Y.x + F + K, y: Y.y },
        { x: G.x + F + K * 1.15, y: G.y },
        { x: G.x + F - K * 1.15, y: G.y },
        { x: Y.x + F - K, y: Y.y }
      ],
      h,
      f(I)
    ), A.line([{ x: W.x + F - K * 0.6, y: W.y }, { x: N.x - K * 0.2, y: N.y }, { x: W.x + F + K * 0.6, y: W.y }], f(I) * 0.8);
  }, _ = (I, A, H) => {
    const { top: N, hip: z } = m(I), W = [I.points["knee.left"], I.points["knee.right"]], j = gt(z, { x: (W[0].x + W[1].x) / 2, y: (W[0].y + W[1].y) / 2 }, 0.95);
    H ? A.shape(Rt([gt(N, z, 0.8), z, j], I.height * 0.145, I.height * 0.17), h, f(I)) : A.shape(Rt([N, gt(N, z, 0.5), z], I.height * 0.14, I.height * 0.15), h, f(I));
    const G = Ut(I);
    if (G > 0.2) {
      const F = Math.sin(I.turn * Math.PI / 2) * I.height * 0.03, [K, Y] = H ? [z, j] : [N, z];
      if (A.line([{ x: K.x + F, y: K.y }, { x: Y.x + F, y: Y.y }], f(I) * 0.8), !H) {
        const Z = gt(N, z, 0.35), tt = I.height * 0.025 * G;
        A.shape([{ x: Z.x + F - tt * 2.4, y: Z.y }, { x: Z.x + F - tt * 0.6, y: Z.y }, { x: Z.x + F - tt * 0.6, y: Z.y + tt * 1.6 }, { x: Z.x + F - tt * 2.4, y: Z.y + tt * 1.6 }], h, f(I) * 0.6);
      }
    }
  }, L = (I, A, H, N, z) => {
    const W = I.parts[`arm.${H}`].points, j = W[0], G = I.chains.spine[I.chains.spine.length - 1], K = [{ x: j.x + (G.x - j.x) * 0.45, y: j.y + (G.y - j.y) * 0.45 }, ...$i(W, 0, z)], Y = Rt(K, I.height * 0.085, I.height * (z > 0.6 ? 0.045 : 0.06)), Z = K.length, tt = Y.slice(0, Z), it = Y.slice(Z).reverse();
    A.shape(Y, N, 0);
    const rt = (et) => Math.hypot(et[1].x - G.x, et[1].y - G.y), [C, V] = rt(tt) > rt(it) ? [tt, it] : [it, tt];
    A.line(C.slice(1), f(I)), A.line(V.slice(Math.ceil(Z * 0.45)), f(I)), A.line([tt[Z - 1], it[Z - 1]], f(I));
  }, B = i || r || a, X = B ? h : e, J = B || s === "long" ? 0.95 : 0.45, q = B || s !== "none", R = (I, A) => {
    o === "skirt" && !l && !c && x(I, A), c && S(I, A), i && _(I, A, !0), t.over === "apron" && O(I, A);
  }, D = (I) => (A, H, N) => {
    A.save(), v(A, H), g(H, N, I), u && p(H, N, I), A.restore(), db(H) === I && ec(H) && R(H, N);
  };
  return {
    parts: {
      "leg.left": { clip: v, over: D("left") },
      "leg.right": { clip: v, over: D("right") },
      spine: {
        over: (I, A, H) => {
          r && Ut(A) >= 0 && y(A, H), w(A, H), t.collar && !r && P(A, H), t.tie && !r && E(A, H, t.tie), i && _(A, H, !1), a && $(A, H), r && (Ut(A) < 0 && y(A, H), T(A, H)), l && M(A, H), c && k(A, H), ec(A) || R(A, H);
        }
      },
      "arm.left": { over: q ? (I, A, H) => L(A, H, "left", X, J) : void 0 },
      "arm.right": { over: q ? (I, A, H) => L(A, H, "right", X, J) : void 0 }
    }
  };
}
const ku = {
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
function pb(t) {
  const e = {};
  for (const n of ["left", "right", "both"]) {
    const s = t[n];
    if (!s) continue;
    const o = typeof s == "string" ? s : s.item, i = ku[o];
    if (!i) throw new Error(`holding: unknown item '${o}'`);
    if (n === "both" && i.hands === "one") throw new Error(`holding: a ${o} is held in one hand ('left' or 'right'), not 'both'`);
    if (n !== "both" && i.hands === "both") throw new Error(`holding: a ${o} is held in both hands ('both')`);
    e[n] = { item: o, color: (typeof s == "object" ? s.color : void 0) ?? i.color };
  }
  return e;
}
function Pi(t, e) {
  const n = t.chains[`arm.${e}`], s = n[n.length - 1], o = n[n.length - 2], i = Math.hypot(s.x - o.x, s.y - o.y) || 1, r = { x: (s.x - o.x) / i, y: (s.y - o.y) / i }, a = t.lineWidth * 0.5;
  return { point: { x: s.x + r.x * a, y: s.y + r.y * a }, along: r, depth: t.parts[`arm.${e}`]?.depth ?? 0 };
}
function hn(t, e, n, s = 0) {
  const o = Math.cos(s), i = Math.sin(s);
  return [
    [-e / 2, -n / 2],
    [e / 2, -n / 2],
    [e / 2, n / 2],
    [-e / 2, n / 2]
  ].map(([r, a]) => ({ x: t.x + r * o - a * i, y: t.y + r * i + a * o }));
}
const un = (t, e, n, s, o = 12) => Array.from({ length: o + 1 }, (i, r) => {
  const a = n + (s - n) * r / o;
  return { x: t.x + Math.cos(a) * e, y: t.y + Math.sin(a) * e };
});
function nc(t, e, n, s, o, i = 1, r) {
  const { point: a, along: l } = n, c = s / 300;
  switch (e.item) {
    case "mug": {
      const h = hn({ x: a.x, y: a.y - 4 * c }, 20 * c, 24 * c);
      t.line(un({ x: a.x + 10 * c * Math.sign(i || 1), y: a.y - 4 * c }, 7 * c, -Math.PI / 2, Math.PI / 2).map((u) => ({ x: a.x + (u.x - a.x) * Math.sign(i || 1), y: u.y })), o), t.shape(h, e.color, o);
      return;
    }
    case "phone": {
      const h = Math.atan2(l.y, l.x) - Math.PI / 2;
      t.shape(hn(a, 13 * c, 24 * c, h), e.color, o), t.shape(hn(a, 9 * c, 17 * c, h), "#8fd0f5", 0);
      return;
    }
    case "book": {
      const h = 26 * c, u = 34 * c;
      t.shape([{ x: a.x, y: a.y - u / 2 }, { x: a.x - h, y: a.y - u / 2 - 3 * c }, { x: a.x - h, y: a.y + u / 2 - 3 * c }, { x: a.x, y: a.y + u / 2 }], e.color, o), t.shape([{ x: a.x, y: a.y - u / 2 }, { x: a.x + h, y: a.y - u / 2 - 3 * c }, { x: a.x + h, y: a.y + u / 2 - 3 * c }, { x: a.x, y: a.y + u / 2 }], e.color, o);
      for (const d of [-1, 1])
        for (const f of [0.3, 0.5, 0.7]) {
          const g = a.y - u / 2 + u * f;
          t.line([{ x: a.x + d * 5 * c, y: g }, { x: a.x + d * (h - 5 * c), y: g - 2 * c }], Math.max(0.8, o * 0.5));
        }
      return;
    }
    case "bag": {
      const h = a.y + 10 * c;
      t.line([{ x: a.x - 9 * c, y: h }, { x: a.x - 5 * c, y: a.y - 2 * c }, { x: a.x + 5 * c, y: a.y - 2 * c }, { x: a.x + 9 * c, y: h }], o), t.shape([{ x: a.x - 17 * c, y: h }, { x: a.x + 17 * c, y: h }, { x: a.x + 20 * c, y: h + 40 * c }, { x: a.x - 20 * c, y: h + 40 * c }], e.color, o);
      return;
    }
    case "briefcase": {
      t.line(un({ x: a.x, y: a.y + 6 * c }, 7 * c, Math.PI, Math.PI * 2), o), t.shape(hn({ x: a.x, y: a.y + 22 * c }, 46 * c, 32 * c), e.color, o), t.line([{ x: a.x - 23 * c, y: a.y + 14 * c }, { x: a.x + 23 * c, y: a.y + 14 * c }], Math.max(0.8, o * 0.6));
      return;
    }
    case "umbrella": {
      const h = 78 * c, u = (r ?? a.y - 120 * c) - 14 * c, d = { x: a.x, y: Math.min(a.y - 60 * c, u - h * 0.55) };
      t.line([{ x: a.x, y: a.y + 10 * c }, d], o), t.line(un({ x: a.x + 5 * c, y: a.y + 10 * c }, 5 * c, Math.PI, 0, 8), o);
      const f = [...un({ x: d.x, y: d.y + h * 0.55 }, h, Math.PI, Math.PI * 2, 24)], g = [];
      for (let p = 4; p >= 0; p--) {
        const m = d.x - h + 2 * h * p / 5;
        g.push(...un({ x: m + h / 5, y: d.y + h * 0.55 }, h / 5, 0, -Math.PI, 6).reverse());
      }
      t.shape([...f, ...g], e.color, o);
      return;
    }
    case "broom": {
      const h = { x: l.x * 0.4 + 0.25 * Math.sign(i || 1), y: Math.max(0.6, l.y) }, u = Math.hypot(h.x, h.y), d = { x: h.x / u, y: h.y / u }, f = { x: a.x - d.x * 40 * c, y: a.y - d.y * 40 * c }, g = { x: a.x + d.x * 120 * c, y: a.y + d.y * 120 * c };
      t.line([f, g], o * 1.1);
      const p = { x: -d.y, y: d.x }, m = [
        { x: g.x + p.x * 6 * c, y: g.y + p.y * 6 * c },
        { x: g.x - p.x * 6 * c, y: g.y - p.y * 6 * c },
        { x: g.x - p.x * 16 * c + d.x * 34 * c, y: g.y - p.y * 16 * c + d.y * 34 * c },
        { x: g.x + p.x * 16 * c + d.x * 34 * c, y: g.y + p.y * 16 * c + d.y * 34 * c }
      ];
      t.shape(m, e.color, o);
      return;
    }
    case "cane": {
      const h = Math.min(0.56 * s, Math.max(0.3 * s, -a.y)), u = 0.12 * Math.sign(i || 1), d = { x: u / Math.hypot(u, 1), y: 1 / Math.hypot(u, 1) }, f = { x: a.x + d.x * h, y: a.y + d.y * h }, g = un({ x: a.x + 7 * c * Math.sign(i || 1), y: a.y - 2 * c }, 7 * c, Math.PI, Math.PI * 2, 8).map((p) => ({ x: a.x + (p.x - a.x) * Math.sign(i || 1), y: p.y }));
      t.line([...g, { x: a.x, y: a.y + 2 * c }, f], o * 1.2), t.shape(hn({ x: f.x, y: f.y - 3 * c }, 9 * c, 7 * c), e.color, 0);
      return;
    }
    case "parcel": {
      const h = { x: a.x, y: a.y - 6 * c };
      t.shape(hn(h, 50 * c, 40 * c), e.color, o), t.line([{ x: h.x - 25 * c, y: h.y - 6 * c }, { x: h.x + 25 * c, y: h.y - 6 * c }], Math.max(0.8, o * 0.7)), t.line([{ x: h.x, y: h.y - 20 * c }, { x: h.x, y: h.y + 20 * c }], Math.max(0.8, o * 0.7));
      return;
    }
  }
}
const sc = (t, e) => (t[`held.${e}`] ?? 1) >= 0.5, oc = (t) => Math.sin(t * Math.PI / 2);
function gb(t) {
  const e = (i) => Math.max(1, i.lineWidth * 0.45), n = (i) => (r, a, l, c, h) => {
    const u = t[i];
    u && sc(h ?? {}, i) && nc(l, u, Pi(a, i), a.height, e(a), oc(a.turn), a.head.center.y - a.head.ry);
  }, s = (i, r, a, l, c) => {
    const h = t.both;
    if (!h || !sc(c ?? {}, "both")) return;
    const u = Pi(r, "left"), d = Pi(r, "right"), f = {
      point: { x: (u.point.x + d.point.x) / 2, y: (u.point.y + d.point.y) / 2 },
      along: { x: (u.along.x + d.along.x) / 2, y: (u.along.y + d.along.y) / 2 },
      depth: (u.depth + d.depth) / 2
    };
    nc(a, h, f, r.height, e(r), oc(r.turn), r.head.center.y - r.head.ry);
  }, o = { parts: {} };
  if (t.left && (o.parts["arm.left"] = { over: n("left") }), t.right && (o.parts["arm.right"] = { over: n("right") }), t.both) {
    const i = (r) => (a, l, c, h, u) => {
      const d = r === "left" ? "right" : "left";
      (r === "left" ? l.parts["arm.left"].depth >= l.parts["arm.right"].depth : l.parts["arm.right"].depth > l.parts[`arm.${d}`].depth) && s(a, l, c, h, u);
    };
    for (const r of ["left", "right"]) o.parts[`arm.${r}`] = { ...o.parts[`arm.${r}`], over: mb(o.parts[`arm.${r}`]?.over, i(r)) };
  }
  return o;
}
function mb(t, e) {
  return t ? (n, s, o, i, r) => {
    t(n, s, o, i, r), e(n, s, o, i, r);
  } : e;
}
function ic(t, e) {
  const n = (o, i) => o && i ? (r, a, l, c, h) => {
    o(r, a, l, c, h), i(r, a, l, c, h);
  } : o ?? i, s = {};
  for (const o of /* @__PURE__ */ new Set([...Object.keys(t.parts ?? {}), ...Object.keys(e.parts ?? {})])) {
    const i = t.parts?.[o], r = e.parts?.[o];
    s[o] = { under: n(i?.under, r?.under), clip: n(i?.clip, r?.clip), over: n(i?.over, r?.over) };
  }
  return { behind: n(t.behind, e.behind), parts: s, front: n(t.front, e.front) };
}
function fa(t = {}) {
  if (t.build && !(t.build in yr)) throw new Error(`character: unknown build '${t.build}'`);
  const e = t.build ? yr[t.build] : {}, n = (t.proportions ?? "bold") === "bold", s = t.figure ?? "fluid", o = t.look ?? "clean", i = t.height ?? 300, r = s === "stick", a = t.outfit ? fb(t.outfit) : null, l = t.holding ? pb(t.holding) : {};
  let c = a ? ic(a, t.layers ?? {}) : t.layers ?? {};
  return Object.keys(l).length > 0 && (c = ic(c, gb(l))), {
    plan: t.plan ?? Y0({
      headSize: t.headSize ?? e.headSize ?? (n ? 0.3 : 0.24),
      shoulderWidth: r ? 0 : t.shoulderWidth ?? e.shoulderWidth ?? 0.06,
      hipWidth: r ? 0 : t.hipWidth ?? e.hipWidth ?? 0.022,
      legLength: t.legLength ?? e.legLength ?? 1,
      armLength: t.armLength ?? e.armLength ?? 1,
      feet: t.feet ?? e.feet
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
    head: ib(t),
    face: { ...t.face, teeth: t.face?.teeth ?? !1, tongue: t.face?.tongue ?? !1 }
  };
}
function ux(t, e, n, s) {
  const { point: o, facing: i } = Ko(t, [e, n, s]);
  return { point: o, facing: i };
}
const xr = (t) => t.rest[1] < -0.5, yb = 0.3;
function bb(t, e, n) {
  return t.figure === "stick" ? xr(e) ? n.slice(0, 3) : n : xr(e) && n.length >= 3 ? Cn(n[0], n[1], n[2], yb) : n.length === 3 ? Cn(n[0], n[1], n[2], 1) : n;
}
function ys(t, e) {
  const n = t.plan.id === "human" ? { ...ht, ...e } : e;
  return Go(t, n, ia(t.plan, n, { height: t.height, contact: t.contact }));
}
function Go(t, e, n) {
  const s = {}, o = {}, i = {}, r = 0.01 * t.height;
  t.plan.chains.forEach((d) => {
    const f = n.chains[d.id];
    s[d.id] = f.points;
    const g = f.depths.reduce((v, w) => v + w, 0) / f.depths.length, p = d.parent ? n.chains[d.parent] : void 0, m = p ? p.depths[d.at ?? p.depths.length - 1] : n.hipDepth, b = g - m;
    i[d.id] = Math.abs(b) < r ? 0 : b, o[d.id] = { points: bb(t, d, f.points), depth: g, order: 0 };
  }), o.head = { points: [n.head.center], depth: n.head.depth, order: 0 }, i.head = 0;
  const a = [...t.plan.chains.map((d) => d.id), "head"], l = [...a].sort((d, f) => i[d] - i[f] || a.indexOf(d) - a.indexOf(f));
  l.forEach((d, f) => {
    o[d].order = f;
  });
  const c = { hip: n.hip };
  for (const [d, [f, g]] of Object.entries(t.plan.landmarks ?? {})) {
    const p = n.chains[f]?.points;
    p && (c[d] = p[Math.min(g, p.length - 1)]);
  }
  const h = {};
  for (const [d, f] of Object.entries(c)) h[d] = f.y >= n.groundY - 0.01 * t.height;
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
function ie(t, e) {
  return ys(t, e).joints;
}
function vu(t, e, n) {
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
function Mu(t, e, n, s, o, i) {
  const r = n.lineWidth;
  if (o === "head") {
    const { head: f } = s, g = n.skin === "none" ? null : n.skin;
    n.face.shape === "angular" ? e.shape(by(f, n.face), g, r) : e.ellipse(f.center.x, f.center.y, f.rx, f.ry, f.angle, g, r), rb(t, e, n.head, f, i, { lineWidth: r, skin: n.skin }, () => {
      e.look !== "silhouette" && Ty(e, f, i, r, { ...n.face, skin: n.skin === "none" ? "#ffffff" : n.skin }, t);
    });
    return;
  }
  const a = n.plan.chains.find((f) => f.id === o), l = s.chains[o], c = s.parts[o].points;
  if (n.figure === "stick") {
    if (o === "neck") return;
    const f = o === "spine" ? [...l, ...s.chains.neck?.slice(1) ?? []] : c;
    e.line(f, r);
    return;
  }
  const h = (f, g) => [a.bones[f].width[0] * r, a.bones[g].width[1] * r];
  if (xr(a)) {
    const [f, g] = h(0, 1);
    if (e.limb(c, f, g), a.bones.length >= 3)
      e.limb([l[2], l[3]], a.bones[2].width[0] * r, a.bones[2].width[1] * r);
    else if (n.hands === "cartoon" && o.startsWith("arm."))
      kb(t, e, n, l, o.endsWith(".left") ? "left" : "right", i);
    else {
      const p = l[l.length - 1];
      e.dot(p.x, p.y, r * 0.62);
    }
    return;
  }
  if (o === "spine") {
    const f = s.points["hip.left"], g = s.points["hip.right"];
    f && g && Math.hypot(f.x - g.x, f.y - g.y) > 0.5 && e.limb([f, g], r * 1.3, r * 1.3);
    const [p, m] = h(0, a.bones.length - 1);
    e.limb(c, p, m);
    const b = s.points["shoulder.left"], v = s.points["shoulder.right"];
    b && v && Math.hypot(b.x - v.x, b.y - v.y) > 0.5 && e.limb(Cn(b, l[l.length - 1], v, 1, 10), r * 1.15, r * 1.15);
    return;
  }
  const [u, d] = h(0, a.bones.length - 1);
  e.limb(c, u, d);
}
function wb(t, e) {
  const n = `hand.${e}.`, s = {};
  for (const [r, a] of Object.entries(t)) r.startsWith(n) && (s[r.slice(n.length)] = a);
  const o = t.turn ?? 0, i = e === "right" ? 1 - o : 1 + o;
  return { ...$t, ...s, turn: i + (s.turn ?? 0) };
}
function kb(t, e, n, s, o, i) {
  const r = s[s.length - 1], a = s[s.length - 2], l = Math.atan2(r.x - a.x, -(r.y - a.y)) * 180 / Math.PI;
  Qr(t, r, wb(i, o), {
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
function vb(t, e, n, s = 0) {
  const o = e.plan.id === "human" ? { ...ht, ...n } : n;
  pa(t, e, o, ys(e, o), s);
}
function Vo(t, e) {
  const n = e / t.height;
  return { ...t, height: e, lineWidth: t.lineWidth * n };
}
function dx(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...ht, ...e } : e, i = ra(t.plan, o, { height: s.height, contact: t.contact }, n);
  return Go(Vo(t, i.height), o, i).joints;
}
function fx(t, e, n, s, o) {
  const i = e.plan.id === "human" ? { ...ht, ...n } : n, r = ra(e.plan, i, { height: o.height, contact: e.contact }, s), a = Vo(e, r.height);
  pa(t, a, i, Go(a, i, r), o.time ?? 0);
}
function Mb(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...ht, ...e } : e, i = ra(t.plan, o, { height: s.height, contact: t.contact }, n), r = Vo(t, i.height), { joints: a, order: l } = Go(r, o, i), c = i.height / s.height;
  return l.map((h, u) => ({
    part: h,
    depth: (a.parts[h]?.depth ?? 0) / c,
    draw(d, f = 0) {
      const g = Bo(d, { look: r.look, ink: r.ink, lineWidth: r.lineWidth, seed: Qt(`${r.seed}:${h}`), time: f, pencil: r.pencil }), p = (b) => {
        b && (d.save(), b(d, a, g, f, o), d.restore());
      };
      d.save(), d.lineCap = "round", d.lineJoin = "round", u === 0 && (r.look === "pencil" && r.pencil.construction !== !1 && vu(g, r, a), p(r.layers.behind), mu(d, g, r.head, a.head, o, { lineWidth: r.lineWidth, skin: r.skin }));
      const m = r.layers.parts?.[h];
      p(m?.under), d.save(), m?.clip?.(d, a, g, f, o), Mu(d, g, r, a, h, o), d.restore(), p(m?.over), u === l.length - 1 && (yu(d, g, r.head, a.head, o, { lineWidth: r.lineWidth, skin: r.skin }), p(r.layers.front)), d.restore();
    }
  }));
}
function pa(t, e, n, s, o, i) {
  const { joints: r } = s, a = i ? s.order.filter((h) => i.has(h)) : s.order, l = Bo(t, {
    look: e.look,
    ink: e.ink,
    lineWidth: e.lineWidth,
    seed: e.seed,
    time: o,
    pencil: e.pencil
  }), c = (h) => {
    h && (t.save(), h(t, r, l, o, n), t.restore());
  };
  t.save(), t.lineCap = "round", t.lineJoin = "round", !i && e.look === "pencil" && e.pencil.construction !== !1 && vu(l, e, r), i || c(e.layers.behind), mu(t, l, e.head, r.head, n, { lineWidth: e.lineWidth, skin: e.skin });
  for (const h of a) {
    const u = e.layers.parts?.[h];
    c(u?.under), t.save(), u?.clip?.(t, r, l, o, n), Mu(t, l, e, r, h, n), t.restore(), c(u?.over);
  }
  yu(t, l, e.head, r.head, n, { lineWidth: e.lineWidth, skin: e.skin }), i || c(e.layers.front), t.restore();
}
function px(t, e, n, s) {
  const o = e.plan.id === "human" ? { ...ht, ...n } : n, i = ys(e, o).joints.head.rx, r = Vo(e, e.height * s.radius / Math.max(1e-6, i)), a = ys(r, o);
  t.save(), t.translate(s.x - a.joints.head.center.x, s.y - a.joints.head.center.y), pa(t, r, o, a, s.time ?? 0, /* @__PURE__ */ new Set(["head"])), t.restore();
}
function xu(t, e, n) {
  const s = { ...t };
  for (const [o, i] of Object.entries(e)) {
    const r = t[o] ?? i;
    s[o] = r + (i - r) * n;
  }
  return s;
}
function He(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...ht, ...e } : e;
  let i;
  if (Array.isArray(s))
    i = s;
  else {
    const { skeleton: r } = ys(t, o), a = ia(t.plan, { ...o, roll: 0 }, { height: t.height, contact: "none" }), l = (o.roll ?? 0) * Math.PI / 180, c = s.x - r.hip.x, h = s.y - r.hip.y, u = a.hip.x + c * Math.cos(-l) - h * Math.sin(-l), d = a.hip.y + c * Math.sin(-l) + h * Math.cos(-l), f = Math.PI / 2 * (o.turn ?? 0), g = s.depth ?? r.chains[n].depths[r.chains[n].depths.length - 1], p = Math.cos(f), m = Math.sin(f);
    i = [u * p - g * m, -d, u * m + g * p];
  }
  return bo(t.plan, o, n, i, { height: t.height });
}
const Su = /* @__PURE__ */ new Set(["walk", "walking", "gait"]);
function ga(t, e = ht, n) {
  let s = { ...e };
  for (const [i, r] of Object.entries(t))
    typeof r == "number" && !Su.has(i) && (s[i] = r);
  const o = Math.max(0, Math.min(1, typeof t.walking == "number" ? t.walking : 0));
  if (o > 0) {
    const i = typeof t.gait == "string" ? t.gait : void 0, r = i ? n?.[i] ?? i : void 0, a = bu(r, typeof t.walk == "number" ? t.walk : 0, s);
    s = Object.fromEntries(Object.keys({ ...s, ...a }).map((l) => [l, (s[l] ?? 0) + ((a[l] ?? 0) - (s[l] ?? 0)) * o]));
  }
  return s;
}
function gx(t) {
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
      i.translate(n / 2, s), vb(i, e, ga(r.props ?? {}, o, t.gaits), a);
    }
  };
}
function xb(t, e, n) {
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
function mx(t, e, n) {
  const s = t.character;
  if (!s) throw new Error("characterAt: the target was not made by characterTarget");
  const o = { ...t.props };
  let i = 0, r = 0;
  for (const [c, h] of e.state?.values.get(n) ?? [])
    c === "x" || c === "motionPathX" ? i = typeof h == "number" ? h : i : c === "y" || c === "motionPathY" ? r = typeof h == "number" ? h : r : (typeof h == "number" || Su.has(c)) && (o[c] = h);
  const a = ga(o, s.plan.id === "human" ? ht : {}, t.gaits), l = ie(s, a);
  return { pose: a, joints: xb(l, t.x + i + t.width / 2, t.y + r + t.height) };
}
function Tu(t, e = ht) {
  const n = [];
  return t.forEach((s, o) => {
    const i = o === 0 ? e : n[o - 1], r = typeof s.pose == "string" ? he[s.pose] : void 0;
    n.push(r ? { ...r, turn: i.turn ?? 0 } : { ...i, ...s.pose });
  }), n;
}
function yx(t, e, n = ht) {
  const s = Tu(e, n);
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
const Jo = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], ue = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], Mo = (t, e) => [t[0] * e, t[1] * e, t[2] * e], ma = (t) => Math.hypot(...t), Eu = (t) => Mo(t, 1 / (ma(t) || 1)), Zo = (t) => ({ ...ht, ...t }), ya = (t) => jo(t.character.plan, Zo(t.pose), { height: t.character.height, contact: t.character.contact });
function Ln(t, e, n) {
  return Jo(t.position, ya(t).chains[e][n]);
}
function Au(t, e, n) {
  const s = Zo(t.pose), o = ya(t).hip, i = Yo(t.character.plan, s, t.character.height), r = ue(ue(n, t.position), o), a = qo(r, (s.roll ?? 0) * Math.PI / 180), l = Jo(i.root, Jt(a, -(s.turn ?? 0) * Math.PI / 2));
  return bo(t.character.plan, s, e, l, { height: t.character.height });
}
function Sb(t, e, n, s = "toe") {
  const o = `leg.${e}`, i = s === "toe" ? 3 : 2;
  let r = { ...t, pose: Zo(t.pose), position: [...t.position] };
  for (let l = 0; l < 6; l++) {
    const c = ya(r).chains[o], h = ue(c[i], c[2]);
    r = { ...r, pose: Au(r, o, ue(n, h)) };
    const u = Ln(r, o, i);
    r.position[1] += n[1] - u[1];
  }
  const a = ma(ue(Ln(r, o, i), n));
  return { ...r, reached: a < t.character.height * 2e-3 };
}
function rc(t, e) {
  const n = Ln(t, `arm.${e}`, 2), s = Ln(t, `arm.${e}`, 1);
  return Jo(n, Mo(Eu(ue(n, s)), t.character.lineWidth * 0.5));
}
function bx(t, e, n = {}) {
  const s = Math.min(t.character.height, e.character.height), o = n.length ?? s * 0.22;
  if (!(o > 0) || !Number.isFinite(o)) throw new Error("meetDandiya: stick length must be positive and finite");
  const i = n.point ?? [(t.position[0] + e.position[0]) / 2, Math.max(t.position[1], e.position[1]) + s * 0.62, (t.position[2] + e.position[2]) / 2], r = (c, h) => {
    const u = Eu([i[0] - c.position[0], s * 0.2, i[2] - c.position[2]]), d = ue(i, Mo(u, o));
    let f = Zo(c.pose);
    for (let p = 0; p < 6; p++) {
      const m = { ...c, pose: f }, b = Ln(m, `arm.${h}`, 2);
      f = Au(m, `arm.${h}`, ue(d, ue(rc(m, h), b)));
    }
    for (const [p, m] of Object.entries(Pt.hold)) f[`hand.${h}.${p}`] = m;
    const g = rc({ ...c, pose: f }, h);
    return { pose: f, stick: { grip: g, tip: Jo(g, Mo(u, o)) } };
  }, a = r(t, n.sideA ?? "right"), l = r(e, n.sideB ?? "right");
  return {
    a: a.pose,
    b: l.pose,
    sticks: [a.stick, l.stick],
    point: i,
    reached: [a.stick, l.stick].every((c) => ma(ue(c.tip, i)) < s * 2e-3)
  };
}
function Tb(t, e) {
  const n = e.count ?? 8, s = e.beatsPerTurn ?? 32;
  if (!Number.isFinite(t) || !Number.isFinite(e.radius) || e.radius <= 0 || !Number.isInteger(n) || n < 1 || !Number.isFinite(s) || s <= 0) throw new Error("danceCircleAt: finite beat, positive radius/beatsPerTurn and a positive integer count are required");
  const o = e.center ?? [0, 0], i = e.direction ?? 1;
  if (o.length !== 2 || !o.every(Number.isFinite) || !Number.isFinite(e.angle ?? 0) || !Number.isFinite(e.spins ?? 0) || ![1, -1].includes(i) || e.facing !== void 0 && !(typeof e.facing == "number" ? Number.isFinite(e.facing) : ["inward", "outward", "tangent"].includes(e.facing))) throw new Error("danceCircleAt: center, angle, spins and facing must be finite; direction is 1 or -1");
  const r = e.character ?? fa({ height: 1.7 }), a = e.style ?? "garba", l = (h, u) => {
    const d = (e.angle ?? 0) + 360 * u / n + i * 360 * h / s, f = d * Math.PI / 180, g = e.facing ?? "inward", p = (typeof g == "number" ? g : d + (g === "inward" ? 180 : g === "tangent" ? i * 90 : 0)) + (e.spins ?? 0) * 360 * h / s, m = wo(a, h, { ...e.pose, turn: p / 90 });
    return { character: r, position: [o[0] + e.radius * Math.sin(f), 0, o[1] + e.radius * Math.cos(f)], pose: m.pose, heading: p, strike: m.strike };
  }, c = wo(a, t).contact;
  return Array.from({ length: n }, (h, u) => {
    const d = l(t, u);
    if (e.plantFeet === !1) return { ...d, planted: !1 };
    const f = l(c.start, u), g = Ln(f, `leg.${c.side}`, 3), p = Sb(d, c.side, g);
    return {
      ...d,
      pose: xu(d.pose, p.pose, c.weight),
      position: [d.position[0], p.position[1] * c.weight, d.position[2]],
      planted: p.reached && c.weight === 1
    };
  });
}
function wx(t, e) {
  if (e.count !== void 0 && e.count !== t.length) throw new Error("danceCircleTracks: count must match targets.length");
  const n = e.bpm ?? 120, s = e.samplesPerBeat ?? 16;
  if (!t.length || ![n, e.beats, s].every((l) => Number.isFinite(l) && l > 0)) throw new Error("danceCircleTracks: targets and positive finite bpm, beats and samplesPerBeat are required");
  if (!Number.isFinite(e.start ?? 0)) throw new Error("danceCircleTracks: start must be finite");
  const o = Math.max(1, Math.ceil(e.beats * s)), i = Array.from({ length: o + 1 }, (l, c) => ({ time: (e.start ?? 0) + e.beats * c / o * 6e4 / n, members: Tb(e.beats * c / o, { ...e, count: t.length }) })), r = i.some((l) => l.members.some((c) => c.pose.roll !== 0)), a = /* @__PURE__ */ new Set(["x", "y", "z", "rotateY", ...r ? ["turn", "roll"] : []]);
  return t.flatMap((l, c) => {
    const h = i.map((u) => {
      const d = u.members[c], { turn: f, ...g } = d.pose;
      return { time: u.time, pose: { ...r ? d.pose : g, x: d.position[0], y: d.position[1], z: d.position[2], rotateY: r ? 0 : d.heading } };
    });
    return Object.keys(h[0].pose).filter((u) => a.has(u) || h.some((d) => d.pose[u] !== (e.pose?.[u] ?? ht[u]))).map((u) => ({
      id: `${l}-circle-${u}`,
      target: l,
      property: u,
      keyframes: h.map((d) => ({ time: d.time, value: d.pose[u], easing: "linear" }))
    }));
  });
}
const xo = (t) => Math.min(1, Math.max(0, t));
function Eb(t) {
  const e = { ...lt, turn: t.view }, n = [];
  for (const s of t.keys) {
    const o = n[n.length - 1], i = !o || s.reset ? e : o.pose;
    n.push({ at: s.at, pose: { ...i, ...s.pose }, easing: s.easing });
  }
  return n;
}
function Ab(t) {
  return t - $b * Math.sin(2 * Math.PI * t) / (2 * Math.PI);
}
const $b = 0.5;
function Pb(t, e) {
  if (!(e <= t.takeoff || e >= t.landing))
    return (e - t.takeoff) / (t.landing - t.takeoff);
}
function Ib(t, e) {
  const n = typeof t == "string" ? Qo[t] : t, s = Eb(n), o = xo(e);
  let i = 0;
  for (let u = 0; u < s.length; u++) s[u].at <= o && (i = u);
  const r = s[i], a = s[Math.min(i + 1, s.length - 1)], l = a.at > r.at ? (o - r.at) / (a.at - r.at) : 0, c = fs(r.pose, a.pose, Ft(a.easing ?? "ease-in-out")(xo(l))), h = Pb(n, o);
  return h === void 0 ? { ...c, spin: 0, rise: 0 } : {
    ...c,
    spin: n.spin * Ab(h),
    rise: 4 * n.height * h * (1 - h)
  };
}
function Ob(t, e, n) {
  const s = typeof t == "string" ? Qo[t] : t, o = xo(e), i = xo((o - s.takeoff) / (s.landing - s.takeoff));
  return s.travel * n * i;
}
function kx(t, e, n = {}) {
  const s = typeof e == "string" ? Qo[e] : e, o = n.start ?? 0, i = n.duration ?? s.duration, r = n.samples ?? 48, a = Array.from({ length: r + 1 }, (h, u) => {
    const d = u / r;
    return { time: o + d * i, progress: d, pose: Ib(s, d) };
  }), c = Object.keys(lt).filter((h) => a.some((u) => u.pose[h] !== lt[h])).map((h) => ({
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
      keyframes: a.map((u) => ({ time: u.time, value: (n.x ?? 0) + h * Ob(s, u.progress, n.height) }))
    });
  }
  return c;
}
const _b = {
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
}, Hb = {
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
}, Ls = {
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
}, Cb = {
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
}, Rb = {
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
function dn(t, e, n, s, o, i = 1300) {
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
      { at: 0.16, pose: _b },
      { at: 0.27, pose: Hb, easing: "ease-out-quad" },
      ...o,
      { at: 0.76, pose: Cb },
      { at: 0.86, pose: Rb, easing: "ease-out-quad" },
      { at: 1, reset: !0 }
    ]
  };
}
const Qo = {
  frontFlip: dn("Front flip (tuck)", 360, 0.56, 0.35, [
    { at: 0.38, pose: Ls, easing: "ease-out-cubic" },
    { at: 0.64, pose: Ls }
  ]),
  backFlip: dn("Back flip (tuck)", -360, 0.58, -0.15, [
    { at: 0.36, pose: { ...Ls, lean: 18 }, easing: "ease-out-cubic" },
    { at: 0.64, pose: { ...Ls, lean: 18 } }
  ]),
  layout: dn("Back layout (straight body)", -360, 0.66, -0.2, [
    // Arched, arms overhead, legs together and long.
    { at: 0.4, pose: { leftHip: 8, rightHip: -8, leftKnee: 0, rightKnee: 0, leftAnkle: 60, rightAnkle: 60, leftShoulder: -178, rightShoulder: 178, lean: -18, headTilt: -14 } },
    { at: 0.64, pose: { leftHip: -4, rightHip: 4, lean: -6, headTilt: -4, leftShoulder: -150, rightShoulder: 150 } }
  ], 1400),
  scissorFlip: dn("Scissor flip", 360, 0.6, 0.45, [
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
  splitLeap: dn("Split leap (grand jeté)", 0, 0.36, 0.9, [
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
  backHandspring: dn("Back handspring", -360, 0.16, -0.7, [
    // Arms reach back overhead to the ground, legs snap over.
    { at: 0.38, pose: { leftHip: 10, rightHip: -10, leftKnee: 0, rightKnee: 0, leftShoulder: -178, rightShoulder: 178, lean: -26, headTilt: -20 } },
    { at: 0.6, pose: { leftHip: -40, rightHip: 40, leftKnee: -20, rightKnee: 20, lean: 6, headTilt: 0 } }
  ], 1200)
};
function Lb(t, e) {
  const n = Math.min(1, Math.max(0, t.turn ?? 0)), s = 1 - n, o = { ...ht, turn: n }, i = [
    { stick: "right", human: "left", s: 1 },
    { stick: "left", human: "right", s: -1 }
  ];
  for (const { stick: a, human: l, s: c } of i) {
    const h = t[`${a}Shoulder`], u = t[`${a}Elbow`];
    o[`arm.${l}.spread`] = h * s, o[`arm.${l}.swing`] = c * h * n, o[`arm.${l}.bend`] = u * s, o[`arm.${l}.elbow`] = c * u * n;
    const d = t[`${a}Hip`], f = t[`${a}Knee`], g = s + c * n;
    o[`leg.${l}.rotate`] = 90 * s, o[`leg.${l}.spread`] = 0, o[`leg.${l}.swing`] = d * g, o[`leg.${l}.knee`] = f * g, o[`leg.${l}.ankle`] = -(t[`${a}Ankle`] ?? 0), o[`leg.${l}.toeOut`] = (t[`${a}FootOut`] ?? 0) * Fb, o[`eye.${l}`] = t[`${a}Eye`], o[`brow.${l}`] = t[`${a}Brow`], e && Object.assign(o, Wb(l, e[a] ?? $t, t[`${a}Wrist`] ?? 0, n));
  }
  const r = t.bend ?? 0;
  o.lean = t.lean * n, o.bend = r * n, o.side = (t.lean + r * 0.5) * s, o["head.tilt"] = (t.headTilt + r * 0.5) * s, o["head.nod"] = t.headTilt * n;
  for (const a of ["mouth", "smile", "mouthWidth", "blink", "browTilt", "lookX", "lookY", "stretch"]) o[a] = t[a];
  return o.lift = t.rise ?? 0, o.roll = t.spin ?? 0, o;
}
const Fb = 70;
function Wb(t, e, n, s) {
  const o = t === "right" ? 1 - s : 1 + s, i = {};
  for (const r of Object.keys($t)) i[`hand.${t}.${r}`] = e[r] ?? $t[r];
  return i[`hand.${t}.turn`] = (e.turn ?? 0) - o, i[`hand.${t}.roll`] = (e.roll ?? 0) + n, i;
}
class $u {
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
function Nb(t) {
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
const ba = Math.PI * 2;
function Db(t, e = 16) {
  const n = new $u(), s = Math.max(6, Math.round(e)), o = Math.max(3, Math.round(s / 2)), i = [];
  for (let r = 0; r <= o; r++) {
    const a = r / o * Math.PI, l = [];
    for (let c = 0; c <= s; c++) {
      const h = c / s * ba, u = Math.sin(a) * Math.sin(h), d = Math.cos(a), f = Math.sin(a) * Math.cos(h);
      l.push(n.vertex(u * t, d * t, f * t, u, d, f));
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
function ac(t, e, n, s, o) {
  const i = t.vertex(0, n, 0, 0, s, 0), r = Array.from({ length: o }, (a, l) => {
    const c = l / o * ba;
    return t.vertex(Math.sin(c) * e, n, Math.cos(c) * e, 0, s, 0);
  });
  for (let a = 0; a < o; a++) {
    const l = r[a], c = r[(a + 1) % o];
    s === 1 ? t.triangle(i, l, c) : t.triangle(i, c, l);
  }
}
function Pu(t, e, n = 24) {
  const s = new $u(), o = Math.max(6, Math.round(n)), i = e / 2, r = -e / 2, a = (h) => Array.from({ length: o + 1 }, (u, d) => {
    const f = d / o * ba;
    return s.vertex(Math.sin(f) * t, h, Math.cos(f) * t, Math.sin(f), 0, Math.cos(f));
  }), l = a(r), c = a(i);
  for (let h = 0; h < o; h++) s.quad(l[h], l[h + 1], c[h + 1], c[h]);
  return ac(s, t, i, 1, o), ac(s, t, r, -1, o), s.build();
}
function So(t) {
  const e = Array.from({ length: t.indices.length / 3 }, () => []);
  for (const n of Nb(t))
    for (const s of n.faces) {
      const o = n.faces.find((i) => i !== s) ?? -1;
      e[s].push({ a: n.a, b: n.b, across: o });
    }
  return { ...t, faceEdges: e };
}
const Ii = /* @__PURE__ */ new Map();
function Bb(t) {
  const e = Ii.get(t);
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
  return Ii.size < 512 && Ii.set(t, n), n;
}
tn([-3, -5, -4]);
const zb = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
};
function Iu(t, e, n) {
  const s = [0, 0, 0];
  for (const o of n) {
    const i = Bb(o.color);
    let r;
    if (o.light === "ambient")
      r = o.intensity;
    else if (o.light === "directional")
      r = o.intensity * Math.max(0, -Oe(e, o.direction));
    else {
      const a = Nn(o.position, t), l = Wo(a), c = l > 0 ? Tn(a, 1 / l) : e, h = o.range ? Math.max(0, 1 - l / o.range) ** 2 : 1;
      if (r = o.intensity * Math.max(0, Oe(e, c)) * h, o.light === "spot") {
        const u = Math.cos(o.angle * Math.PI / 180), d = Math.cos(o.angle * 0.8 * Math.PI / 180);
        r *= zb(u, d, -Oe(c, o.direction));
      }
    }
    s[0] += i[0] * r, s[1] += i[1] * r, s[2] += i[2] * r;
  }
  return s;
}
function Ou(t, e) {
  return t ? Math.min(1, Math.max(0, (e - t.near) / (t.far - t.near))) : 0;
}
function _u(t, e, n = {}) {
  t.save(), qb(t, e, n), t.restore();
}
function qb(t, e, n) {
  const s = Hu(e, n);
  n.shadow !== !1 && Cu(t, e, n);
  for (const o of e.under) lc(t, o, s, n);
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
  for (const o of e.over) lc(t, o, s, n);
}
function lc(t, e, n, s) {
  const o = s.loose?.[e.part.id];
  if (!o) {
    Sr(t, e, n, s);
    return;
  }
  if (o.opacity <= 0) return;
  const i = e.faces.flatMap((c) => c.points);
  if (i.length === 0) return;
  const r = i.map((c) => c.x), a = i.map((c) => c.y), l = { x: (Math.min(...r) + Math.max(...r)) / 2, y: (Math.min(...a) + Math.max(...a)) / 2 };
  t.save(), t.globalAlpha *= Math.min(1, o.opacity), t.translate(l.x + o.x, l.y + o.y), t.rotate(o.rotate * Math.PI / 180), t.translate(-l.x, -l.y), Sr(t, e, n, s), t.restore();
}
function Hu(t, e = {}) {
  return e.lineWidth ?? Math.max(1.3, t.sizePx * 0.022);
}
function Cu(t, e, n = {}) {
  e.shadow.opacity <= 0 || e.shadow.points.length < 3 || (t.save(), t.globalAlpha = e.shadow.opacity, ti(t, e.shadow.points, n.ink ?? "#26262b", !1), t.restore());
}
function vx(t, e, n, s = {}) {
  t.save(), Sr(t, e, n, s), t.restore();
}
function Yb(t, e, n, s = {}) {
  const o = s.style === "stick", i = e.flatMap((h) => {
    if (o && h.part.solidOnly) return [];
    const u = h.part.layer ?? 0;
    return o && h.spine ? [{ depth: h.depth, layer: u, part: h }] : h.faces.map((d) => ({ depth: d.depth, layer: u, part: h, face: d }));
  }), r = /* @__PURE__ */ new Map();
  for (const h of i) {
    const u = h.face?.normal;
    if (!h.face?.center || !u) continue;
    const d = Math.abs(u[0]) >= Math.abs(u[1]) && Math.abs(u[0]) >= Math.abs(u[2]) ? 0 : Math.abs(u[1]) >= Math.abs(u[2]) ? 1 : 2, f = d * 2 + (u[d] < 0 ? 1 : 0);
    r.set(f, [...r.get(f) ?? [], h]);
  }
  for (const h of r.values())
    for (const u of h) {
      const { center: d, normal: f } = u.face;
      for (const g of h) {
        if (g.part.part.id === u.part.part.id) continue;
        const p = g.face;
        if (p.normal[0] * f[0] + p.normal[1] * f[1] + p.normal[2] * f[2] <= 0.8) continue;
        const b = p.normal[0] * (d[0] - p.center[0]) + p.normal[1] * (d[1] - p.center[1]) + p.normal[2] * (d[2] - p.center[2]);
        b > -cc / 5 && b < cc && (u.layer = Math.max(u.layer, g.layer), u.depth = Math.max(u.depth, g.depth + 1e-6));
      }
    }
  i.sort((h, u) => h.layer - u.layer || h.depth - u.depth);
  const a = /* @__PURE__ */ new Map(), l = (h) => {
    let u = a.get(h.part.id);
    return u || a.set(h.part.id, u = wa(t, h, n, s)), u;
  };
  t.save();
  const c = t.globalAlpha;
  for (const { part: h, face: u } of i) {
    t.globalAlpha = c * h.opacity;
    const d = l(h);
    if (!u) d.line(h.spine, n * 1.15);
    else {
      const f = o ? Ru(h, s) : u.light ? jb(h, u, s) : ka(h);
      f && (!o && s.look === "silhouette" ? d.shape(u.points, f, 0) : ti(t, u.points, o || u.light ? f : Ma(f, u.tone), !0, h.cut ? 1.6 : 0.8));
      const g = (h.part.outline ?? 1) * n;
      if (g > 0)
        for (const p of u.edges ?? []) p.length > 1 && d.line(p, g);
      for (const p of u.marks ?? []) d.line(p, n * 0.7);
    }
  }
  t.restore();
}
const cc = 0.05;
function wa(t, e, n, s) {
  return Bo(t, {
    look: s.look ?? "clean",
    ink: e.part.ink ?? s.ink ?? "#26262b",
    lineWidth: n,
    seed: Qt(`${s.seed ?? 0}:${e.part.id}`),
    time: s.time ?? 0,
    pencil: { construction: !1, rubbedOut: 0, ...s.pencil }
  });
}
function ka(t) {
  const { part: e } = t;
  return e.glow && t.glow > 0 && e.fill ? Fu(e.fill, e.glow.color, t.glow) : e.fill;
}
function jb(t, e, n) {
  const { part: s } = t;
  if (!s.fill) return;
  const o = Lu(s.fill, e.light, e.fog ?? 0, n.fog);
  return s.glow && t.glow > 0 ? Fu(o, s.glow.color, t.glow) : o;
}
function Ru(t, e) {
  const n = ka(t);
  return n && (Xb(n) || t.glow > 0) ? n : e.paper ?? "#fbf8ef";
}
function Sr(t, e, n, s) {
  e.opacity < 1 ? (t.save(), t.globalAlpha *= e.opacity, hc(t, e, n, s), t.restore()) : hc(t, e, n, s);
}
function hc(t, e, n, s) {
  if (s.style === "stick") return Kb(t, e, n, s);
  const { part: o } = e, i = wa(t, e, n, s), r = ka(e), a = s.look === "silhouette";
  for (const c of e.faces)
    r && (a ? i.shape(c.points, r, 0) : ti(t, c.points, Ma(r, c.tone)));
  const l = (o.outline ?? 1) * n;
  if (l > 0)
    for (const c of e.edges) c.length > 1 && i.line(c, l);
  for (const c of e.marks) i.line(c, n * 0.7);
}
function Kb(t, e, n, s) {
  const { part: o } = e;
  if (o.solidOnly) return;
  const i = wa(t, e, n, s);
  if (e.spine) {
    i.line(e.spine, n * 1.15);
    return;
  }
  const r = Ru(e, s);
  for (const l of e.faces) ti(t, l.points, r);
  const a = (o.outline ?? 1) * n;
  if (a > 0)
    for (const l of e.edges) l.length > 1 && i.line(l, a);
  for (const l of e.marks) i.line(l, n * 0.7);
}
function Xb(t) {
  const e = Fn(t);
  return e ? (0.299 * e[0] + 0.587 * e[1] + 0.114 * e[2]) / 255 < 0.3 : !1;
}
function ti(t, e, n, s = !0, o = 0.8) {
  t.fillStyle = n, t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let i = 1; i < e.length; i++) t.lineTo(e[i].x, e[i].y);
  t.closePath(), t.fill(), s && (t.strokeStyle = n, t.lineWidth = o, t.lineJoin = "round", t.stroke());
}
function Fn(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return;
  const n = e[1].length === 3 ? e[1].replace(/./g, (s) => s + s) : e[1];
  return [0, 2, 4].map((s) => parseInt(n.slice(s, s + 2), 16));
}
const va = (t) => `#${t.map((e) => Math.round(Math.max(0, Math.min(255, e))).toString(16).padStart(2, "0")).join("")}`;
function Ma(t, e) {
  const n = Fn(t);
  return n ? va(e >= 1 ? n.map((s) => s + (255 - s) * (e - 1) * 2) : n.map((s) => s * e)) : t;
}
function Lu(t, e, n, s) {
  const o = Fn(t);
  if (!o) return t;
  let i = o.map((a, l) => a * e[l]);
  const r = s ? Fn(s) : void 0;
  return r && n > 0 && (i = i.map((a, l) => a + (r[l] - a) * n)), va(i);
}
function Fu(t, e, n) {
  const s = Fn(t), o = Fn(e);
  return !s || !o ? n < 0.5 ? t : e : va(s.map((i, r) => i + (o[r] - i) * n));
}
const Ub = /* @__PURE__ */ new Set([
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
]), Gb = /* @__PURE__ */ new Set(["walk", "walking", "gait"]), uc = (t) => typeof t == "number" ? t : void 0, Vb = 1.7;
function Jb(t, e, n) {
  const s = Array.from({ length: 24 }, (o, i) => {
    const r = i / 24 * Math.PI * 2, a = e.toView([Math.cos(r) * n, 0, Math.sin(r) * n * 0.8]);
    return a[2] < -1e-3 ? e.toScreen(a) : null;
  });
  s.some((o) => o === null) || (t.beginPath(), s.forEach((o, i) => i === 0 ? t.moveTo(o.x, o.y) : t.lineTo(o.x, o.y)), t.closePath(), t.fillStyle = "rgba(0, 0, 0, 0.22)", t.fill());
}
function Zb(t) {
  const e = Oe([0, 1, 0], t);
  if (e > 0.999999) return No();
  if (e < -0.999999) return oe(Vt([1, 0, 0], 180));
  const n = ao([0, 1, 0], t);
  return oe(Vt(n, Math.acos(e) * 180 / Math.PI));
}
function Qb(t, e, n, s, o) {
  const i = t.solid ?? {}, r = i.outline === !1 ? void 0 : i.outline ?? { width: 2, color: "#0f172a" }, a = { color: i.color ?? "#475569", shading: i.shading ?? "toon", outline: r }, l = { color: i.skin ?? "#f2c49b", shading: i.shading ?? "toon", outline: r }, c = { color: "#0f172a", shading: "unlit" }, h = s.height * 0.034, u = [], d = (w, y, T) => u.push({ mesh: w, world: At(o, y), material: T }), f = (w, y, T) => d(e.sphere, Yr(w, [0, 0, 0, 1], [y, y, y]), T);
  for (const w of n.chains) {
    const y = s.chains[w.id], T = w.id === "spine" ? 1.9 : 1;
    w.bones.forEach(($, M) => {
      const S = y[M], k = y[M + 1], x = qr(S, k), [P, E] = $.width ?? [1, 1], O = h * T * (P + E) / 2;
      if (x > 1e-6) {
        const _ = e0(S, k, 0.5), L = Zb(tn(Nn(k, S)));
        d(e.cylinder, At(Ne(_), At(L, Ke([O, x, O]))), a);
      }
      f(S, h * T * P, a), f(k, h * T * E, a);
    }), w.id.startsWith("arm.") && f(y[y.length - 1], h * 1.5, l);
  }
  const { center: g, rx: p, ry: m, axes: b } = s.head, v = [...b[0], 0, ...b[1], 0, ...b[2], 0, ...g, 1];
  d(e.sphere, At(v, Ke([p, m, p])), l);
  for (const w of [-1, 1]) {
    const y = tn([w * 0.36, 0.15, 0.92]), T = Gs(g, Gs(Gs(Tn(b[0], y[0] * p * 1.04), Tn(b[1], y[1] * m * 1.04)), Tn(b[2], y[2] * p * 1.04))), $ = [...b[0], 0, ...b[1], 0, ...b[2], 0, ...T, 1];
    d(e.sphere, At($, Ke([p * 0.11, m * 0.14, p * 0.03])), c);
  }
  return u;
}
const Mx = {
  kind: "character",
  validate(t) {
    const e = t;
    return e.height !== void 0 && !(e.height > 0) ? ["a character's height must be positive"] : [];
  },
  prepare(t) {
    return {
      who: fa({ ...t.character, height: 1 }),
      cylinder: So(Pu(1, 1, 16)),
      sphere: So(Db(1, 20))
    };
  },
  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object: t, prepared: e, values: n, world: s, camera: o, lights: i = [], fog: r, toScreen: a }) {
    const l = t, c = e, h = c.who;
    let u = { ...ht, ...l.pose };
    for (const [S, k] of n)
      typeof k == "number" && !Ub.has(S) && !Gb.has(S) && (u[S] = k);
    const d = Math.max(0, Math.min(1, uc(n.get("walking")) ?? l.walking ?? 0));
    if (d > 0) {
      const S = typeof n.get("gait") == "string" ? n.get("gait") : l.gait, k = bu(S, uc(n.get("walk")) ?? 0, u);
      u = Object.fromEntries(Object.keys({ ...u, ...k }).map((x) => [x, (u[x] ?? 0) + ((k[x] ?? 0) - (u[x] ?? 0)) * d]));
    }
    const f = l.height ?? Vb, g = At(o.view, s), p = {
      toView: (S) => jt(g, S),
      toScreen: (S) => a(S)
    }, b = -p.toView([0, f / 2, 0])[2];
    if (b <= o.near) return null;
    const v = l.shadow === !1 ? [] : [{ depth: b + f, draw: (S) => Jb(S, p, f * 0.18) }];
    if (l.look === "solid") {
      const S = jo(h.plan, u, { height: f, contact: h.contact });
      return { meshes: Qb(l, c, h.plan, S, s), drawables: v };
    }
    const w = jt(s, [0, f * 0.6, 0]), y = tn(Nn(o.position, w)), T = Iu(w, y, i).map((S) => Math.min(1, S)), $ = i.length > 0 && h.skin !== "none" ? { ...h, skin: Lu(h.skin, T, Ou(r, qr(w, o.position)), r?.color) } : h, M = Mb($, u, p, { height: f });
    return {
      drawables: [
        ...v,
        // Ties keep the character's own order.
        ...M.map((S, k) => ({ depth: -S.depth - k * 1e-6, draw: (x, P) => S.draw(x, P.time) }))
      ]
    };
  }
}, Fe = {
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
}, Xn = 1, Fs = 0.55, dc = 0.35, tw = 1.6, fc = { a: "a", e: "e", i: "i", y: "i", o: "o", u: "u" }, pc = { m: "m", b: "m", p: "m", f: "f", v: "f", w: "u", q: "u", l: "l", n: "l", d: "l", t: "l" }, gc = {
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
}, mc = {
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
}, ew = { प: "m", फ: "m", ब: "m", भ: "m", म: "m", व: "u" }, nw = "्", yc = "़", sw = (t) => t >= "क" && t <= "ह", bc = /* @__PURE__ */ new Set([".", ",", "!", "?", ";", ":", "…", "।", "॥", "—", "-"]);
function ow(t) {
  const e = [], n = Array.from(t.toLowerCase()), s = (o, i) => {
    const r = e[e.length - 1];
    r && r.viseme === o ? r.weight += i * 0.5 : e.push({ viseme: o, weight: i });
  };
  for (let o = 0; o < n.length; o++) {
    const i = n[o], r = n[o + 1];
    if (bc.has(i)) s("rest", tw);
    else if (/\s/.test(i)) {
      const a = e[e.length - 1];
      a && a.viseme !== "rest" && e.push({ viseme: "c", weight: dc });
    } else if ((i === "o" || i === "e") && r === i)
      s(i === "o" ? "u" : "i", Xn), o++;
    else if (i in fc) s(fc[i], Xn);
    else if (i in pc) s(pc[i], Fs);
    else {
      if (i === "h") continue;
      if (/[a-z]/.test(i)) s("c", Fs);
      else if (i in gc) s(gc[i], Xn);
      else if (sw(i)) {
        const a = r === yc ? i === "फ" ? "f" : void 0 : ew[i];
        s(a ?? "c", Fs);
        let l = o + 1;
        n[l] === yc && l++;
        const c = n[l];
        c === nw ? o = l : c && c in mc ? (s(mc[c], Xn), o = l) : (!c || /\s/.test(c) || bc.has(c) || s("a", Xn * 0.6), o = l - 1);
      } else (i === "ं" || i === "ँ") && s("l", Fs * 0.6);
    }
  }
  for (; e.length > 0 && (e[e.length - 1].viseme === "rest" || e[e.length - 1].weight === dc); ) e.pop();
  return e;
}
function Wu(t, e = {}) {
  const n = e.fields?.mouth ?? "mouth", s = e.fields?.mouthWidth ?? "mouthWidth", o = e.energy ?? 1, i = ow(t.text), r = [{ time: t.start, value: Fe.rest.mouth }], a = [{ time: t.start, value: Fe.rest.mouthWidth }], l = i.reduce((h, u) => h + u.weight, 0), c = t.end - t.start;
  if (l > 0 && c > 0) {
    let h = t.start;
    for (const u of i) {
      const d = c * u.weight / l, f = h + Math.min(d * 0.4, 60);
      if (f > r[r.length - 1].time) {
        const g = Fe[u.viseme];
        r.push({ time: f, value: g.mouth * o, easing: "ease-out" }), a.push({ time: f, value: 1 + (g.mouthWidth - 1) * Math.min(1.3, o), easing: "ease-out" });
      }
      h += d;
    }
  }
  return t.end > r[r.length - 1].time && (r.push({ time: t.end, value: Fe.rest.mouth, easing: "ease-in-out" }), a.push({ time: t.end, value: Fe.rest.mouthWidth, easing: "ease-in-out" })), { [n]: r, [s]: a };
}
function xx(t, e, n = {}) {
  const s = {};
  for (const o of [...e].sort((i, r) => i.start - r.start))
    for (const [i, r] of Object.entries(Wu(o, n))) {
      const a = s[i] ??= [], l = a.length > 0 ? a[a.length - 1].time : -1 / 0;
      a.push(...r.filter((c) => c.time > l));
    }
  return Object.entries(s).map(([o, i]) => ({ id: `${t}-${o}`, target: t, property: o, keyframes: i }));
}
function xa(t, e, n, s = {}) {
  if (n.length === 0) return e;
  const o = s.fields?.mouth ?? "mouth", i = s.fields?.mouthWidth ?? "mouthWidth", r = { [o]: Fe.rest.mouth, [i]: Fe.rest.mouthWidth, ...s.rest }, a = new It({ id: "before-speech", tracks: e }), l = (u, d) => a.getStateAtTime(d).values.get(t)?.get(u) ?? r[u], c = [o, i], h = e.filter((u) => u.target !== t || !c.includes(u.property));
  for (const u of c) {
    const d = e.find((g) => g.target === t && g.property === u);
    let f = d ? [...d.keyframes] : [{ time: 0, value: l(u, 0) }];
    for (const g of n) {
      const p = Wu(g, s)[u];
      p[0] = { ...p[0], value: l(u, g.start) }, p[p.length - 1] = { ...p[p.length - 1], value: l(u, g.end) }, f = [...f.filter((m) => m.time < g.start || m.time > g.end), ...p], f.sort((m, b) => m.time - b.time);
    }
    h.push({ id: d?.id ?? `${t}-${u}`, target: t, property: u, keyframes: f });
  }
  return h;
}
const rs = ([t, e, n]) => {
  const s = Math.hypot(t, e, n) || 1;
  return [t / s, e / s, n / s];
};
function iw([t, e, n]) {
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
const fn = (t, [e, n, s]) => t === "z" ? [e, n, s] : t === "x" ? [s, n, e] : [e, s, n];
function rw(t, e, n = "x", s = 20, o = 0) {
  const i = [], r = e / 2;
  for (const c of [-r, r])
    for (let h = 0; h < s; h++) {
      const u = Math.PI * 2 * h / s;
      i.push(fn(n, [Math.cos(u) * t, Math.sin(u) * t, c]));
    }
  const a = [
    { corners: Array.from({ length: s }, (c, h) => s - 1 - h), normal: fn(n, [0, 0, -1]) },
    { corners: Array.from({ length: s }, (c, h) => s + h), normal: fn(n, [0, 0, 1]) }
  ];
  for (let c = 0; c < s; c++) {
    const h = (c + 1) % s, u = Math.PI * 2 * (c + 0.5) / s;
    a.push({ corners: [c, h, s + h, s + c], normal: fn(n, [Math.cos(u), Math.sin(u), 0]) });
  }
  const l = [];
  if (o > 0)
    for (const c of [-r, r]) {
      const h = i.push(fn(n, [0, 0, c * 1.01])) - 1;
      for (let u = 0; u < o; u++) {
        const d = Math.PI * 2 * u / o, f = i.push(fn(n, [Math.cos(d) * t * 0.82, Math.sin(d) * t * 0.82, c * 1.01])) - 1;
        l.push([h, f]);
      }
    }
  return { vertices: i, faces: a, marks: l, creases: !0 };
}
function aw([t, e, n], s = 16) {
  const o = Math.max(4, Math.round(s / 2)), i = [[0, e, 0]];
  for (let h = 1; h < o; h++) {
    const u = Math.PI * h / o;
    for (let d = 0; d < s; d++) {
      const f = Math.PI * 2 * d / s;
      i.push([Math.sin(u) * Math.cos(f) * t, Math.cos(u) * e, Math.sin(u) * Math.sin(f) * n]);
    }
  }
  const r = i.push([0, -e, 0]) - 1, a = (h, u) => 1 + (h - 1) * s + u % s, l = (h) => {
    const u = h.reduce((d, f) => [d[0] + i[f][0], d[1] + i[f][1], d[2] + i[f][2]], [0, 0, 0]);
    return rs([u[0] / (t * t), u[1] / (e * e), u[2] / (n * n)]);
  }, c = [];
  for (let h = 0; h < s; h++) {
    const u = [0, a(1, h + 1), a(1, h)];
    c.push({ corners: u, normal: l(u) });
    for (let f = 1; f < o - 1; f++) {
      const g = [a(f, h), a(f, h + 1), a(f + 1, h + 1), a(f + 1, h)];
      c.push({ corners: g, normal: l(g) });
    }
    const d = [a(o - 1, h), a(o - 1, h + 1), r];
    c.push({ corners: d, normal: l(d) });
  }
  return { vertices: i, faces: c, creases: !1 };
}
const lw = (t) => t.reduce((e, [n, s], o) => {
  const [i, r] = t[(o + 1) % t.length];
  return e + n * r - i * s;
}, 0) / 2;
function cw(t, e) {
  const n = lw(t) < 0 ? [...t].reverse() : t, s = n.length, o = e / 2, i = [...n.map(([a, l]) => [o, l, a]), ...n.map(([a, l]) => [-o, l, a])], r = [
    // Seen from +x, (forward, up) = (z, y) runs anticlockwise when z points left on screen: so reverse for the left cap.
    { corners: Array.from({ length: s }, (a, l) => s - 1 - l), normal: [1, 0, 0] },
    { corners: Array.from({ length: s }, (a, l) => s + l), normal: [-1, 0, 0] }
  ];
  for (let a = 0; a < s; a++) {
    const l = (a + 1) % s, [c, h] = [n[l][0] - n[a][0], n[l][1] - n[a][1]];
    r.push({ corners: [a, l, s + l, s + a], normal: rs([0, -c, h]) });
  }
  return { vertices: i, faces: r, creases: !0 };
}
function hw(t, e) {
  const n = {
    left: ([o, i]) => [0, i, o],
    right: ([o, i]) => [0, i, o],
    front: ([o, i]) => [o, i, 0],
    back: ([o, i]) => [o, i, 0],
    up: ([o, i]) => [o, 0, i]
  }, s = { left: [1, 0, 0], right: [-1, 0, 0], front: [0, 0, 1], back: [0, 0, -1], up: [0, 1, 0] };
  return { vertices: t.map(n[e]), faces: [{ corners: t.map((o, i) => i), normal: s[e] }] };
}
function uw(t, e, n = 8) {
  const s = (r) => Array.isArray(e) ? e[Math.min(r, e.length - 1)] : e, o = [], i = [];
  t.forEach((r, a) => {
    const l = t[Math.min(a + 1, t.length - 1)], c = t[Math.max(a - 1, 0)], h = rs([l[0] - c[0], l[1] - c[1], l[2] - c[2]]), u = Math.abs(h[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], d = rs(wc(h, u)), f = wc(d, h);
    for (let g = 0; g < n; g++) {
      const p = Math.PI * 2 * g / n, m = Math.cos(p) * s(a), b = Math.sin(p) * s(a);
      o.push([r[0] + d[0] * m + f[0] * b, r[1] + d[1] * m + f[1] * b, r[2] + d[2] * m + f[2] * b]);
    }
  });
  for (let r = 0; r < t.length - 1; r++)
    for (let a = 0; a < n; a++) {
      const l = (a + 1) % n, c = [r * n + a, r * n + l, (r + 1) * n + l, (r + 1) * n + a], h = c.reduce((d, f) => [d[0] + o[f][0] / 4, d[1] + o[f][1] / 4, d[2] + o[f][2] / 4], [0, 0, 0]), u = [(t[r][0] + t[r + 1][0]) / 2, (t[r][1] + t[r + 1][1]) / 2, (t[r][2] + t[r + 1][2]) / 2];
      i.push({ corners: c, normal: rs([h[0] - u[0], h[1] - u[1], h[2] - u[2]]) });
    }
  return { vertices: o, faces: i, creases: !1 };
}
function wc(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function dw(t) {
  switch (t.type) {
    case "box":
      return iw(t.size);
    case "cylinder":
      return rw(t.radius, t.length, t.axis, t.segments, t.spokes);
    case "ellipsoid":
      return aw(t.radii, t.segments);
    case "extrude":
      return cw(t.profile, t.width);
    case "panel":
      return hw(t.points, t.facing);
    case "tube":
      return { ...uw(t.points, t.radius, t.segments), joined: t.joined };
  }
}
function Nu(t, e) {
  if (t.length < 2) return t;
  const n = (o) => t[Math.max(0, Math.min(t.length - 1, o))], s = (o) => {
    const i = o * (t.length - 1), r = Math.min(t.length - 2, Math.floor(i)), a = i - r, [l, c, h, u] = [n(r - 1), n(r), n(r + 1), n(r + 2)];
    return [0, 1, 2].map((d) => {
      const f = l[d], g = c[d], p = h[d], m = u[d];
      return 0.5 * (2 * g + (-f + p) * a + (2 * f - 5 * g + 4 * p - m) * a * a + (-f + 3 * g - 3 * p + m) * a * a * a);
    });
  };
  return Array.from({ length: e }, (o, i) => s(i / (e - 1)));
}
const ze = (t) => Array.isArray(t) && t.length === 2 && t.every((e) => typeof e == "number" && Number.isFinite(e));
function To(t, e) {
  return ((e - t) % 360 + 540) % 360 - 180;
}
function Du(t) {
  const e = t.map((n, s) => ({ frame: n, i: s })).sort((n, s) => n.frame.time - s.frame.time || n.i - s.i).map(({ frame: n }) => n);
  return e.filter((n, s) => s + 1 >= e.length || e[s + 1].time !== n.time);
}
function En(t, e) {
  return Math.atan2(e[0] - t[0], e[1] - t[1]) * 180 / Math.PI;
}
function Bu(t) {
  const e = t.filter((o, i) => i === 0 || Math.hypot(o[0] - t[i - 1][0], o[1] - t[i - 1][1]) > 1e-6);
  if (e.length < 2) return [];
  const n = e.length === 2 ? e : Nu(e.map(([o, i]) => [o, 0, i]), (e.length - 1) * 12).map(([o, , i]) => [o, i]);
  let s = 0;
  return n.map((o, i) => (i > 0 && (s += Math.hypot(o[0] - n[i - 1][0], o[1] - n[i - 1][1])), { point: o, at: s }));
}
function zu(t, e) {
  let n = 1;
  for (; n < t.length - 1 && t[n].at < e; ) n++;
  const s = t[n - 1], o = t[n], i = o.at > s.at ? Math.max(0, Math.min(1, (e - s.at) / (o.at - s.at))) : 0;
  return {
    point: [s.point[0] + (o.point[0] - s.point[0]) * i, s.point[1] + (o.point[1] - s.point[1]) * i],
    direction: [o.point[0] - s.point[0], o.point[1] - s.point[1]]
  };
}
function qu(t, e) {
  if (e <= 0) return 0;
  if (e >= 1) return 1;
  let n = 0, s = 1;
  for (let o = 0; o < 40; o++) {
    const i = (n + s) / 2;
    t(i) < e ? n = i : s = i;
  }
  return (n + s) / 2;
}
const Un = 520, kc = ["do", "at", "for", "to", "through", "toward", "speed", "pose", "gag", "say", "look", "turns", "dance", "bpm", "beats"], fw = (t) => Math.max(700, Array.from(t).length * 65), vc = 70, Mc = 35;
function Yu(t, e) {
  const n = e[0] - t.x, s = e[1] - t.eyeHeight, o = e[2] - t.z, i = t.heading * Math.PI / 180, r = n * Math.cos(i) - o * Math.sin(i), a = n * Math.sin(i) + o * Math.cos(i), l = Math.atan2(r, a) * 180 / Math.PI, c = Math.hypot(r, a), h = -Math.atan2(s, c) * 180 / Math.PI, u = Math.max(-vc, Math.min(vc, l * 0.75)), d = Math.max(-Mc, Math.min(Mc, h * 0.7));
  return {
    "head.turn": u,
    "head.nod": d,
    lookX: Math.max(-1, Math.min(1, (l - u) / 45)),
    lookY: Math.max(-1, Math.min(1, (h - d) / 30))
  };
}
const pw = {
  walk: 1.3,
  bouncy: 1.4,
  doubleBounce: 1.2,
  sneak: 0.6,
  strut: 1.2,
  tired: 0.8,
  run: 3.6,
  shove: 0.7
}, Tr = Object.keys(zt), Oi = Object.keys(he), _i = Object.keys(da), gw = 0.25, mw = 700 / 180, yw = 200, bw = 300;
function ww(t) {
  if (!Array.isArray(t)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const e = [...Tr, "face", "spin", "dance", "hold", "pose", "gag", "place", "say", "look"], n = [];
  return t.forEach((s, o) => {
    const i = (c) => n.push({ beat: o, message: c });
    if (!s || typeof s != "object" || Array.isArray(s)) return i("Each beat must be an object like { do: 'walk', to: [x, z] }.");
    const r = s, a = { duration: "for", path: "through", position: "to", heading: "toward", direction: "toward" };
    for (const c of Object.keys(r)) kc.includes(c) || i(ut("beat field", c, kc, a[c]));
    const l = typeof r.do == "string" ? Oi.includes(r.do) ? "pose" : _i.includes(r.do) ? "gag" : r.do === "turn" ? "face" : void 0 : void 0;
    if (typeof r.do != "string" || !e.includes(r.do)) return i(ut("character 3D beat", r.do, e, l));
    for (const c of ["at", "for", "turns", "bpm", "beats"]) {
      const h = r[c];
      h !== void 0 && (typeof h != "number" || !Number.isFinite(h) || (c === "at" ? h < 0 : c !== "turns" && h <= 0)) && i(`\`${c}\` must be finite${c === "turns" ? "" : c === "at" ? " and non-negative" : " and positive"}.`);
    }
    if (r.do === "dance" && !(typeof r.dance == "string" && Object.hasOwn(Rn, r.dance)) && i(ut("native dance", r.dance, Object.keys(Rn))), Tr.includes(r.do) && (r.to === void 0 && r.through === void 0 && i(`\`${r.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`), r.to !== void 0 && !ze(r.to) && i(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(r.to)}).`), r.through !== void 0 && !(Array.isArray(r.through) && r.through.length > 0 && r.through.every(ze)) && i("`through` is a list of points on the ground, each [x, z] metres.")), r.do === "place" && !ze(r.to) && i("`place` needs `to`: a point on the ground, [x, z] metres."), r.do === "face" && !(ze(r.toward) || typeof r.toward == "number" && Number.isFinite(r.toward)) && i("`face` needs `toward`: a point [x, z] or a finite heading in degrees."), r.do === "say" && !(typeof r.say == "string" && r.say.trim().length > 0) && i("`say` needs `say`: the line spoken."), r.do === "look") {
      const c = r.look ?? r.toward;
      Array.isArray(c) && (c.length === 2 || c.length === 3) && c.every((u) => typeof u == "number" && Number.isFinite(u)) || c === "camera" || i("`look` needs `look`: a point [x, z] or [x, y, z] to look at, or `camera`.");
    }
    r.do === "pose" && !(typeof r.pose == "object" && r.pose !== null) && !Oi.includes(r.pose) && i(ut("pose", r.pose, Oi)), r.do === "gag" && !_i.includes(r.gag) && i(ut("gag", r.gag, _i));
  }), n;
}
function Sx(t, e, n) {
  const s = ww(e);
  if (s.length > 0) throw new Error(`characterScript3D: ${s.length} problem(s) in the beats:
${s.map((M) => `  beat ${M.beat}: ${M.message}`).join(`
`)}`);
  const o = n.height ?? 1.7, i = { ...ht, ...n.pose }, r = (M, S = i) => {
    const k = M.match(/^hand\.(?:left|right)\.(.+)$/)?.[1];
    return S[M] ?? ht[M] ?? (k ? $t[k] : void 0) ?? 0;
  };
  let [a, l] = n.position ?? [0, 0], c = n.heading ?? 0, h = 0;
  const u = /* @__PURE__ */ new Map(), d = [], f = (M, S, k, x = "linear") => {
    const P = u.get(M) ?? [];
    P.push({ time: S, value: k, easing: x }), u.set(M, P);
  }, g = (M, S, k) => {
    const x = u.get(M) ?? [];
    for (let P = x.length - 1; P >= 0; P--)
      if (x[P].time === S) {
        if (x[P].value === k) return;
        break;
      }
    f(M, S, k);
  };
  f("x", 0, a), f("z", 0, l), f("rotateY", 0, c);
  const p = (M, S, k) => {
    const x = To(c, S);
    if (Math.abs(x) < 1)
      return k !== void 0 && (g("rotateY", M, c), f("rotateY", M + k, c)), M + (k ?? 0);
    const P = k ?? Math.max(yw, Math.abs(x) * mw);
    return g("rotateY", M, c), c += x, f("rotateY", M + P, c, "ease-in-out"), M + P;
  }, m = (M, S, k, x = "ease-in-out") => {
    for (const [P, E] of Object.entries(k))
      r(P) !== E && (g(P, M, r(P)), f(P, S, E, x), i[P] = E);
  }, b = (M, S, k) => {
    const x = Bu([[a, l], ...S.through ?? [S.to]]);
    if (x.length < 2) return k;
    const P = p(k, En(x[0].point, x[1].point)), E = x[x.length - 1].at, O = S.speed ?? pw[M] * Math.sqrt(o / 1.7), _ = S.for ?? E / O * 1e3, L = wu(M, o), B = Ft("ease-in-out"), X = Math.min(bw, _ / 4);
    d.push({ time: P, value: M }), g("walking", P, 0), f("walking", P + X, 1, "ease-out"), f("walking", P + _ - X, 1), f("walking", P + _, 0, "ease-in");
    const J = h;
    let q = c;
    for (let R = 0; ; R = Math.min(E, R + gw)) {
      const D = P + qu(B, R / E) * _, { point: I, direction: A } = zu(x, R);
      q += To(q, En([0, 0], A));
      const H = R === 0 ? g : f;
      if (H("x", D, I[0]), H("z", D, I[1]), H("rotateY", D, q), H("walk", D, J + R / L), R >= E) break;
    }
    return h = J + E / L, [a, l] = x[x.length - 1].point, c = q, P + _;
  }, v = [], w = [];
  let y = 0;
  for (const M of e) {
    const S = M.at ?? y;
    let k = S;
    if (Tr.includes(M.do)) k = b(M.do, M, S);
    else if (M.do === "face") k = p(S, typeof M.toward == "number" ? M.toward : En([a, l], M.toward), M.for);
    else if (M.do === "spin")
      k = S + (M.for ?? 1e3), g("rotateY", S, c), c += (M.turns ?? 1) * 360, f("rotateY", k, c, "linear");
    else if (M.do === "dance") {
      const x = Rn[M.dance], P = M.bpm ?? x.bpm, E = M.beats ?? (M.for !== void 0 ? M.for * P / 6e4 : x.beats);
      k = S + (M.for ?? E * 6e4 / P);
      const O = { ...i }, _ = Math.max(1, Math.ceil(E * 16)), L = Array.from({ length: _ + 1 }, (X, J) => wo(M.dance, E * J / _, O).pose), B = Math.min(150, (k - S) / 4);
      for (const X of Object.keys(L[0])) {
        const J = r(X, O);
        X === "turn" || X === "roll" || L.every((q) => q[X] === J) || (g(X, S, J), L.slice(1).forEach((q, R) => {
          const D = S + (k - S) * (R + 1) / _, I = Math.min(1, (D - S) / B), A = I * I * (3 - 2 * I);
          f(X, D, J + (q[X] - J) * A);
        }), i[X] = L[_][X]);
      }
    } else if (M.do === "hold") k = S + (M.for ?? 1e3);
    else if (M.do === "place")
      g("x", S, a), g("z", S, l), [a, l] = M.to, f("x", S + 1, a), f("z", S + 1, l), typeof M.toward == "number" && (g("rotateY", S, c), c = M.toward, f("rotateY", S + 1, c)), k = S + 1;
    else if (M.do === "pose") {
      k = S + (M.for ?? 500);
      const x = typeof M.pose == "string" ? he[M.pose] : M.pose;
      m(S, k, x);
    } else if (M.do === "gag") {
      const x = lb(M.gag, { at: S, from: { ...i } });
      let P = x[0];
      for (const E of x.slice(1))
        m(P.time, E.time, Object.fromEntries(Object.entries(E.pose).filter(([O, _]) => i[O] !== _)), E.easing ?? "ease-in-out"), P = E;
      k = P.time;
    } else if (M.do === "say") {
      k = S + (M.for ?? fw(M.say)), w.push({ text: M.say, start: S, end: k });
      const x = { tilt: i["head.tilt"] ?? 0, left: i["brow.left"] ?? 0, right: i["brow.right"] ?? 0 };
      let P = 0;
      for (let E = S + Un; E < k - Un / 2; E += Un, P++) {
        const O = P % 2 === 0;
        m(E - Un / 2, E, { "head.tilt": x.tilt + (O ? 3 : -2), "brow.left": x.left + (O ? 0.25 : 0), "brow.right": x.right + (O ? 0.25 : 0) });
      }
      P > 0 && m(k - Un / 2, k, { "head.tilt": x.tilt, "brow.left": x.left, "brow.right": x.right });
    } else if (M.do === "look") {
      const x = M.look ?? M.toward, P = o * 0.9, E = x === "camera" ? n.camera ?? [0, 1.6, 8] : x.length === 3 ? x : [x[0], P, x[1]];
      k = S + (M.for ?? 500), m(S, k, Yu({ x: a, z: l, heading: c, eyeHeight: P }, E), "ease-out");
    }
    v.push({ do: M.do, start: S, end: k }), y = k;
  }
  const T = `${n.scene}/${t}`;
  let $ = [...u].map(([M, S]) => ({ id: `${t}-${M}`, target: T, property: M, keyframes: Du(S) }));
  return d.length > 0 && $.push({ id: `${t}-gait`, target: T, property: "gait", keyframes: d }), w.length > 0 && ($ = xa(T, $, w, { rest: { mouth: n.pose?.mouth ?? ht.mouth ?? 0, mouthWidth: n.pose?.mouthWidth ?? ht.mouthWidth ?? 1 } })), { tracks: $, duration: y, beats: v, end: { position: [a, l], heading: c, pose: { ...i } } };
}
function xc(t, e, n = [0, 0, 0]) {
  const s = t.filter((i) => i.target === e), o = new It({ id: `${e}-position`, tracks: s });
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
function Tx(t, e) {
  const n = `${e.scene}/${e.character}`, s = e.height ?? 1.7, o = Math.max(1, e.every ?? 66), i = e.objects?.[e.character] ?? [0, 0, 0], r = new It({ id: `${n}-own`, tracks: t.filter((u) => u.target === n) }), a = e.at, l = typeof a == "function" ? a : Array.isArray(a) ? () => a : "camera" in a ? xc(t, `${e.scene}/${a.camera}`, e.objects?.[a.camera] ?? [0, 1.6, 8]) : (() => {
    const u = xc(t, `${e.scene}/${a.object}`, e.objects?.[a.object] ?? [0, 0, 0]), d = a.eyeHeight ?? s * 0.9;
    return (f) => {
      const g = u(f);
      return [g[0], g[1] + d, g[2]];
    };
  })(), c = ["head.turn", "head.nod", "lookX", "lookY"], h = { "head.turn": [], "head.nod": [], lookX: [], lookY: [] };
  for (let u = e.start; ; u = Math.min(e.end, u + o)) {
    const d = r.getStateAtTime(u).values.get(n), f = (p, m) => {
      const b = d?.get(p);
      return typeof b == "number" ? b : m;
    }, g = Yu({ x: f("x", i[0]), z: f("z", i[2]), heading: f("rotateY", 0), eyeHeight: f("y", i[1]) + s * 0.9 }, l(u));
    for (const p of c) h[p].push({ time: u, value: g[p] ?? 0 });
    if (u >= e.end) break;
  }
  return c.map((u) => ({ id: `${n}-lookAt-${u}`, target: n, property: u, keyframes: h[u] }));
}
function Ex(t) {
  const e = Math.max(1, Math.round(t.count)), [n, s] = t.centre ?? [0, 0], o = t.spacing ?? 1.2, i = t.shape ?? "line", r = [];
  if (i === "circle") {
    const h = e < 2 ? 0 : Math.max(o, o * e / (Math.PI * 2));
    for (let u = 0; u < e; u++) {
      const d = u / e * Math.PI * 2, f = n + Math.sin(d) * h, g = s + Math.cos(d) * h;
      r.push({ position: [f, g], heading: (Math.atan2(n - f, s - g) * 180 / Math.PI + 360) % 360 });
    }
    return r;
  }
  if (i === "cluster") {
    let h = (t.seed ?? 1) >>> 0 || 7;
    const u = () => (h ^= h << 13, h >>>= 0, h ^= h >> 17, h ^= h << 5, h >>>= 0, h / 4294967296), d = [];
    for (let f = 0; f < e; f++) {
      let g = [n, s], p = -1 / 0;
      for (let m = 0; m < 24; m++) {
        const b = Math.sqrt(u()) * o * Math.max(1, Math.sqrt(e) * 0.9), v = u() * Math.PI * 2, w = [n + Math.cos(v) * b, s + Math.sin(v) * b], y = d.length === 0 ? 1 / 0 : Math.min(...d.map((T) => Math.hypot(T[0] - w[0], T[1] - w[1])));
        if (y > p && (p = y, g = w), y >= o) break;
      }
      d.push(g), r.push({ position: g, heading: 0 });
    }
    return r;
  }
  const a = (t.heading ?? 90) * Math.PI / 180, l = o * (e - 1), c = (t.bend ?? 60) * Math.PI / 180;
  for (let h = 0; h < e; h++) {
    const u = e === 1 ? 0 : h / (e - 1) - 0.5, d = u * l;
    let f = n + Math.sin(a) * d, g = s + Math.cos(a) * d, p = ((t.heading ?? 90) - 90 + 360) % 360;
    if (i === "arc") {
      const m = (1 - Math.cos(u * c)) * l * 0.5;
      f -= Math.cos(a) * m, g += Math.sin(a) * m, p = (p - u * (t.bend ?? 60) + 360) % 360;
    }
    r.push({ position: [f, g], heading: p });
  }
  return r;
}
const kw = { x: 0, y: 0, scale: 1, rotate: 0, shakeX: 0, shakeY: 0, shakeRotate: 0 };
function Ax(t) {
  const e = (n) => {
    const s = t?.get(n);
    return typeof s == "number" ? s : kw[n];
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
function $x(t, e, n) {
  const s = n.width / 2, o = n.height / 2, r = 1 + 2 * Math.max(Math.abs(e.shakeX), Math.abs(e.shakeY)) / Math.max(1, Math.min(n.width, n.height));
  t.translate(s + e.x + e.shakeX, o + e.y + e.shakeY), t.rotate((e.rotate + e.shakeRotate) * Math.PI / 180), t.scale(e.scale * r, e.scale * r), t.translate(-s, -o);
}
function Px(t, e, n) {
  const s = e.width / 2, o = e.height / 2, i = (t.rotate + t.shakeRotate) * Math.PI / 180, r = (n.x - s) * t.scale, a = (n.y - o) * t.scale;
  return {
    x: s + t.x + t.shakeX + r * Math.cos(i) - a * Math.sin(i),
    y: o + t.y + t.shakeY + r * Math.sin(i) + a * Math.cos(i)
  };
}
function vw(t, e, n = {}, s) {
  const o = n.length ?? 240, i = 9, r = 28, a = o - 22;
  t.save(), t.translate(e.x, e.y), t.rotate((n.angle ?? -30) * Math.PI / 180), t.fillStyle = n.color ?? "#f4c542", t.fillRect(r, -i, a - r, 2 * i), t.fillStyle = "#e8b4a0", t.fillRect(a, -i, o - a, 2 * i), t.fillStyle = "#f1dcbf", t.beginPath(), t.moveTo(0, 0), t.lineTo(r, -i), t.lineTo(r, i), t.closePath(), t.fill(), t.fillStyle = n.outline ?? "#2f2f33", t.beginPath(), t.moveTo(0, 0), t.lineTo(r * 0.35, -i * 0.35), t.lineTo(r * 0.35, i * 0.35), t.closePath(), t.fill(), t.strokeStyle = n.outline ?? "#2f2f33", t.lineWidth = 3, t.lineJoin = "round", t.lineCap = "round";
  const l = [
    [{ x: 0, y: 0 }, { x: r, y: -i }, { x: o, y: -i }, { x: o, y: i }, { x: r, y: i }, { x: 0, y: 0 }],
    [{ x: r, y: -i }, { x: r, y: i }],
    [{ x: a, y: -i }, { x: a, y: i }]
  ];
  for (const c of l) Uu(t, c, s);
  t.restore();
}
function ju(t, e, n = {}, s) {
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
const Ku = 150, Mw = { pencil: 44, eraser: 30 };
function Xu(t, e, n = {}, s) {
  const o = n.tool ?? "pencil", i = n.skin ?? "#f1c9a5", r = n.outline ?? "#2f2f33", a = n.scale ?? 1, l = Math.min(1, Math.max(0, n.lift ?? 0)), c = (n.angle ?? -30) * Math.PI / 180, h = s ? s.nudge(0.6) : { x: 0, y: 0 }, u = Ku * a * (1 + 0.05 * l);
  l > 0 && (t.save(), t.fillStyle = r, t.globalAlpha = 0.15 * l, t.beginPath(), t.ellipse(e.x, e.y, 9 * a, 4 * a, 0, 0, Math.PI * 2), t.fill(), t.restore());
  const d = { x: e.x + h.x + 6 * l * a, y: e.y + h.y - 18 * l * a }, f = Pt.pencilGrip, g = (M) => {
    const S = M.fingers.thumb, k = M.fingers.index, x = M.fingers.middle, P = Sc([S.points[3], k.points[3], x.points[3]]), E = Sc([S.points[1], k.points[0]]), O = (S.depths[3] + k.depths[3] + x.depths[3]) / 3;
    return { pinch: P, direction: Math.atan2(E.y - P.y, E.x - P.x), depth: O };
  }, p = hr(f, { size: u }), m = c - g(p).direction, b = hr(f, { size: u, angle: m * 180 / Math.PI }), v = g(b), w = Mw[o] * a, y = { x: v.pinch.x - Math.cos(c) * w, y: v.pinch.y - Math.sin(c) * w }, T = { x: d.x - y.x, y: d.y - y.y }, $ = b.axes.up;
  xw(t, T, { x: -$.x, y: -$.y }, u, n.arm ?? 300 * a, i, n.sleeve ?? "#5b7db1", r), Qr(t, T, f, {
    size: u,
    angle: m * 180 / Math.PI,
    skin: i,
    ink: r,
    lineWidth: 3 * a,
    prop: {
      depth: v.depth,
      draw: () => {
        t.save(), t.translate(d.x, d.y), t.scale(a, a), o === "eraser" ? ju(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, outline: r }, s) : vw(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, length: 190, outline: r }, s), t.restore();
      }
    }
  });
}
const Sc = (t) => ({
  x: t.reduce((e, n) => e + n.x, 0) / t.length,
  y: t.reduce((e, n) => e + n.y, 0) / t.length
});
function xw(t, e, n, s, o, i, r, a) {
  const l = { x: -n.y, y: n.x }, c = s * 0.15, h = (p, m, b) => ({
    x: e.x + n.x * p + l.x * m * b,
    y: e.y + n.y * p + l.y * m * b
  }), u = h(o, 0, 0), d = (p) => {
    const m = t.createLinearGradient(e.x, e.y, u.x, u.y);
    return m.addColorStop(0, p), m.addColorStop(0.6, p), m.addColorStop(1, Sw(p)), m;
  }, f = Math.min(s * 0.55, o * 0.35);
  t.save(), t.lineJoin = "round", t.lineCap = "round", t.lineWidth = 3 * (s / Ku), t.beginPath(), t.moveTo(h(-s * 0.1, -1, c).x, h(-s * 0.1, -1, c).y), t.lineTo(h(f + 4, -1, c * 1.1).x, h(f + 4, -1, c * 1.1).y), t.lineTo(h(f + 4, 1, c * 1.1).x, h(f + 4, 1, c * 1.1).y), t.lineTo(h(-s * 0.1, 1, c).x, h(-s * 0.1, 1, c).y), t.closePath(), t.fillStyle = i, t.fill(), t.strokeStyle = a, t.beginPath(), t.moveTo(h(0, -1, c).x, h(0, -1, c).y), t.lineTo(h(f, -1, c * 1.1).x, h(f, -1, c * 1.1).y), t.moveTo(h(0, 1, c).x, h(0, 1, c).y), t.lineTo(h(f, 1, c * 1.1).x, h(f, 1, c * 1.1).y), t.stroke();
  const g = [h(f, -1, c * 1.3), h(o, -1, c * 1.5), h(o, 1, c * 1.5), h(f, 1, c * 1.3)];
  t.beginPath(), g.forEach((p, m) => m ? t.lineTo(p.x, p.y) : t.moveTo(p.x, p.y)), t.closePath(), t.fillStyle = d(r), t.fill(), t.strokeStyle = d(a), t.beginPath(), t.moveTo(g[1].x, g[1].y), t.lineTo(g[0].x, g[0].y), t.lineTo(g[3].x, g[3].y), t.lineTo(g[2].x, g[2].y), t.stroke(), t.restore();
}
function Ix(t, e, n = {}) {
  const s = n.offstage ?? { x: 2e3, y: 1400 }, o = n.enter ?? 450, i = n.exit ?? 450, r = n.linger ?? 1500, a = [...t].filter((p) => p.path.length > 0).sort((p, m) => p.start - m.start), l = (p) => p.tool ?? "pencil", c = (p) => {
    const m = Math.min(1, Math.max(0, p));
    return m * m * (3 - 2 * m);
  }, h = (p, m, b) => ({ x: p.x + (m.x - p.x) * b, y: p.y + (m.y - p.y) * b }), u = a.find((p) => e >= p.start && e <= p.end);
  if (u) {
    const p = u.end - u.start, m = p > 0 ? (e - u.start) / p : 1;
    return { at: Jr(u.path, m), tool: l(u), lift: 0, drawing: !0 };
  }
  const d = [...a].reverse().find((p) => p.end < e), f = a.find((p) => p.start > e), g = (p) => p.path[p.path.length - 1];
  if (d && f && f.start - d.end <= r) {
    const p = (e - d.end) / (f.start - d.end), m = p < 0.5 ? l(d) : l(f);
    return { at: h(g(d), f.path[0], c(p)), tool: m, lift: Math.sin(Math.PI * p), drawing: !1 };
  }
  if (f && f.start - e <= o) {
    const p = 1 - (f.start - e) / o;
    return { at: h(s, f.path[0], c(p)), tool: l(f), lift: 1 - c(p), drawing: !1 };
  }
  if (d && e - d.end <= i) {
    const p = (e - d.end) / i;
    return { at: h(g(d), s, c(p)), tool: l(d), lift: c(p), drawing: !1 };
  }
  return null;
}
function Ox(t, e, n, s = 0.08, o = 32) {
  const i = Math.PI * 2 * (1 + s), r = [];
  for (let a = 0; a <= o; a++) {
    const l = -Math.PI / 2 + i * a / o;
    r.push({ x: t + Math.cos(l) * n, y: e + Math.sin(l) * n });
  }
  return r;
}
function _x(t) {
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
      const u = t.sketch ? ar(a, t.sketch, c) : void 0;
      h > 0 && (u ? t.smooth ? u.curve(e, h) : u.line(e, h) : Uu(a, us(e, h))), r && h > 0 && h < 1 && Xu(a, Jr(e, h), r, u);
    }
  };
}
function Sw(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return "rgba(0, 0, 0, 0)";
  const n = e[1].length === 3 ? [...e[1]].map((r) => r + r).join("") : e[1], [s, o, i] = [0, 2, 4].map((r) => parseInt(n.slice(r, r + 2), 16));
  return `rgba(${s}, ${o}, ${i}, 0)`;
}
function Uu(t, e, n) {
  if (!(e.length < 2)) {
    if (n) return n.line(e);
    t.beginPath(), t.moveTo(e[0].x, e[0].y);
    for (const s of e.slice(1)) t.lineTo(s.x, s.y);
    t.stroke();
  }
}
const Ws = 1e5;
function Hx(t, e, n, s, o = 6) {
  const i = [], r = Math.max(1, Math.round(o));
  for (let a = 0; a <= r; a++)
    i.push({ x: a % 2 === 0 ? t : t + n, y: e + s * a / r });
  return i;
}
function Gu(t, e, n, s) {
  if (s <= 0 || e.length === 0) return;
  const o = us(e, s), i = n / 2, r = (a) => {
    t.beginPath(), t.rect(-Ws, -Ws, 2 * Ws, 2 * Ws), a(), t.clip("evenodd");
  };
  for (const a of o)
    r(() => {
      t.moveTo(a.x + i, a.y), t.arc(a.x, a.y, i, 0, Math.PI * 2);
    });
  for (let a = 1; a < o.length; a++) {
    const l = o[a - 1], c = o[a], h = Math.hypot(c.x - l.x, c.y - l.y);
    if (h === 0) continue;
    const u = -(c.y - l.y) / h * i, d = (c.x - l.x) / h * i;
    r(() => {
      t.moveTo(l.x + u, l.y + d), t.lineTo(c.x + u, c.y + d), t.lineTo(c.x - u, c.y - d), t.lineTo(l.x - u, l.y - d), t.closePath();
    });
  }
}
function Cx(t, e, n, s, o) {
  t.save(), Gu(t, e, n, s), o(), t.restore();
}
function Rx(t, e) {
  const n = e.width ?? 40, s = e.hand === !0 ? {} : e.hand || void 0, o = e.eraser === !1 ? void 0 : e.eraser === !0 || e.eraser === void 0 ? {} : e.eraser;
  return {
    ...t,
    props: { ...t.props, erase: 0 },
    draw(i, r, a) {
      const l = Number(r.props?.erase ?? 0);
      if (i.save(), Gu(i, e.path, n, l), t.draw(i, r, a), i.restore(), !o || l <= 0 || l >= 1) return;
      const c = Jr(e.path, l);
      s ? Xu(i, c, { ...s, tool: "eraser" }) : ju(i, c, o);
    }
  };
}
function Ss() {
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
    valueAt: (n, s) => Sa(t.get(n), s),
    cutAfter(n, s) {
      for (const o of n) t.set(o, (t.get(o) ?? []).filter((i) => i.time <= s));
    },
    tracks(n) {
      return [...t].filter(([, s]) => s.length > 0).map(([s, o]) => ({
        id: `${n}-${s}`,
        target: n,
        property: s,
        keyframes: Tw(o)
      }));
    }
  };
}
function Sa(t, e) {
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
function bs(t) {
  const e = [...t ?? []].sort((n, s) => n.time - s.time);
  return e.slice(1).flatMap((n, s) => n.value !== e[s].value ? [{ start: e[s].time, end: n.time }] : []);
}
function Tw(t) {
  return [...t].sort((n, s) => n.time - s.time).map((n) => ({ time: n.time, value: n.value, ...n.easing ? { easing: n.easing } : {} }));
}
const Ew = 16e-4, Aw = 0.6, qe = 33;
function ei(t) {
  const e = (i, r) => `piece.${i.id}.${r}`, n = (i, r) => ({
    x: i.home.x + t.valueAt(e(i, "x"), r),
    y: i.home.y + t.valueAt(e(i, "y"), r)
  }), s = (i, r) => {
    const a = t.keys(e(i, "x"));
    if (!a || a.length < 2) return;
    const l = n(i, r - qe), c = n(i, r);
    return { x: (c.x - l.x) / qe, y: (c.y - l.y) / qe };
  }, o = (i, r) => t.cutAfter(["x", "y", "rotate"].map((a) => e(i, a)), r);
  return {
    at: n,
    cutAfter: o,
    follow(i, r) {
      for (const a of r)
        t.push(e(i, "x"), { time: a.time, value: a.x - i.home.x }), t.push(e(i, "y"), { time: a.time, value: a.y - i.home.y });
    },
    fling(i, r) {
      const a = n(i, r.at), l = r.velocity ?? s(i, r.at) ?? { x: 0.5, y: -0.6 }, c = r.gravity ?? Ew, h = r.duration ?? 900, u = (r.spin ?? Aw) * (l.x < 0 ? -1 : 1), d = t.valueAt(e(i, "rotate"), r.at);
      o(i, r.at);
      for (let f = 0; f <= h; f += qe) {
        const g = a.x + l.x * f, p = a.y + l.y * f + 0.5 * c * f * f;
        t.push(e(i, "x"), { time: r.at + f, value: g - i.home.x }), t.push(e(i, "y"), { time: r.at + f, value: p - i.home.y }), t.push(e(i, "rotate"), { time: r.at + f, value: d + u * f });
      }
      t.tween(e(i, "opacity"), 1, 0, { at: r.at + h * 0.6, duration: h * 0.4 });
    },
    move(i, r) {
      const a = n(i, r.at);
      t.tween(e(i, "x"), a.x - i.home.x, r.to.x - i.home.x, r, 400), t.tween(e(i, "y"), a.y - i.home.y, r.to.y - i.home.y, r, 400);
    }
  };
}
function Ta(t, e, { ground: n, every: s, floors: o }) {
  if (o.every((w) => w.windows.length === 0)) return t;
  const i = t.find((w) => w.target === e && w.property === "y"), r = new It({ id: `${e}-ride`, tracks: i ? [i] : [] }), a = (w) => i ? Number(r.getStateAtTime(w).values.get(e)?.get("y") ?? 0) : 0, l = (w) => {
    const y = n + a(w);
    return o.findIndex((T) => Math.abs(T.top - y) < 0.5);
  }, c = (i?.keyframes ?? []).map((w) => w.time), h = (w) => {
    const y = (k) => k < 0 ? 0 : o[k].offset(w), T = l(w);
    if (T >= 0) return y(T);
    if (Math.abs(a(w)) < 0.5) return 0;
    const $ = (k) => l(k) >= 0 || Math.abs(a(k)) < 0.5, M = [...c].reverse().find((k) => k <= w && $(k)), S = c.find((k) => k >= w && $(k));
    return M === void 0 && S === void 0 ? 0 : M === void 0 ? y(l(S)) : S === void 0 || S === M ? y(l(M)) : y(l(M)) + (y(l(S)) - y(l(M))) * (w - M) / (S - M);
  }, u = o.flatMap((w) => w.windows), d = (w, y) => u.some((T) => T.start < y && T.end > w) || h(w) !== h(y), f = i ? [...i.keyframes] : [{ time: 0, value: 0 }], g = [{ ...f[0], value: f[0].value + h(f[0].time) }], p = (w, y) => {
    const T = /* @__PURE__ */ new Set([y]);
    for (let $ = w + s; $ < y; $ += s) T.add($);
    for (const $ of u) for (const M of [$.start, $.end]) M > w && M < y && T.add(M);
    for (const $ of [...T].sort((M, S) => M - S)) g.push({ time: $, value: a($) + h($) });
  };
  for (let w = 1; w < f.length; w++) {
    const y = f[w - 1].time, T = f[w].time;
    d(y, T) ? p(y, T) : g.push({ ...f[w], value: f[w].value + h(T) });
  }
  const m = f[f.length - 1].time, b = Math.max(m, ...u.map((w) => w.end));
  b > m && p(m, b);
  const v = { id: i?.id ?? `${e}-y`, target: e, property: "y", keyframes: g };
  return i ? t.map((w) => w === i ? v : w) : [...t, v];
}
function Wn(t) {
  const e = t.indexOf(":");
  return e < 0 ? { kind: t, rest: "" } : { kind: t.slice(0, e), rest: t.slice(e + 1) };
}
function Ye(t, e, n, s) {
  const o = Object.keys(n.anchors).map((r) => Wn(r).kind), { kind: i } = Wn(e);
  return o.includes(i) ? new Error(`${t}: no anchor "${e}"${s ? `: ${s}` : ""} (anchors: ${Object.keys(n.anchors).join(", ")})`) : new Error(`${t}: ${ut("anchor", i, o)} (anchors: ${Object.keys(n.anchors).join(", ")})`);
}
function ni(t, e, n) {
  return new Error(`${t}.edit: ${ut("edit", e, Object.keys(n.edits))}`);
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
const $w = {
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
}, Er = ["wipe", "fly", "blur"], to = {
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
}, Pw = 0.9, Iw = 8;
function Lx(t) {
  const e = { ...$w, ...t.theme }, n = t.code.replace(/\t/g, "    ").replace(/\n$/, "").split(`
`), s = t.fontSize ?? 16, o = (t.lineHeight ?? 1.6) * s, i = (t.charWidth ?? 0.6) * s, r = t.padding ?? 12, a = t.lineNumbers === !1 ? 0 : (String(n.length).length + 2) * i, l = Math.max(1, ...n.map((R) => R.length)), c = t.width ?? r * 2 + a + l * i, h = r * 2 + n.length * o, u = t.x + r + a, d = new Set(t.hidden ?? []), f = t.language ?? "plain";
  if (!Ar.includes(f)) throw new Error(`codePanel: ${ut("language", f, Ar)}`);
  const g = n.map((R) => Cw(R, f).flatMap((D) => Array.from(D.text, () => e[D.kind]))), p = Ss(), m = ei(p), b = [], v = /* @__PURE__ */ new Map(), w = [], y = [], T = (R) => {
    if (!Number.isInteger(R) || R < 1 || R > n.length) throw new Error(`codePanel: no line ${R} (it has ${n.length})`);
  }, $ = p.tween, M = p.last, S = (R, D, I, A, H, N = 300) => {
    T(R), $(`line.${R}.${D}`, I, A, H, N);
  }, k = (R, D) => b.filter((I) => I.line < R && I.closed <= D).length, x = kt, P = (R) => t.y + r + (R - 1) * o, E = (R) => Array.isArray(R) ? R : [R], O = (R, D, I) => {
    let A = -1;
    for (let H = 0; H < I; H++)
      if (A = n[R - 1].indexOf(D, A + 1), A < 0) throw new Error(`codePanel: line ${R} has no ${I > 1 ? `${I}th ` : ""}"${D}"`);
    return A;
  }, _ = {};
  n.forEach((R, D) => {
    const I = D + 1;
    _[`line.${I}.highlight`] = 0, _[`line.${I}.strike`] = 0, _[`line.${I}.wipe`] = 0, _[`line.${I}.reveal`] = d.has(I) ? 0 : 1, _[`line.${I}.shift`] = 0;
  });
  const L = {
    type: "custom",
    x: t.x,
    y: t.y,
    width: c,
    height: h,
    props: _,
    about: {
      kind: "code panel",
      summary: `${n.length} lines of ${f} code. Its lines and words are places in the scene (line(), token(), spot()); its edits are methods that record tracks (tracks()).`,
      // Pieces and inserts add props as they are made; these describe them by pattern.
      get props() {
        return _w(Object.keys(_));
      },
      actions: Vu
    },
    draw(R, D) {
      const I = D.props ?? {}, A = (W) => Number(I[W] ?? _[W]), H = r + a, N = (W) => r + (W - 1) * o - A(`line.${W}.shift`) * o;
      R.fillStyle = e.background, Tc(R, 0, 0, c, h, 8), R.fill(), R.font = `${s}px ${e.font}`, R.textBaseline = "middle", R.textAlign = "left";
      const z = (W, j, G, F, K) => {
        const Y = n[W - 1];
        for (let Z = j; Z < G; Z++)
          Y[Z] !== " " && (R.fillStyle = g[W - 1][Z], R.fillText(Y[Z], F + (Z - j) * i, K));
      };
      R.save(), Tc(R, 0, 0, c, h, 8), R.clip(), n.forEach((W, j) => {
        const G = j + 1, F = A(`line.${G}.wipe`);
        if (F >= 1) return;
        const K = N(G), Y = K + o / 2, Z = Math.max(1, W.length) * i, tt = Math.round(A(`line.${G}.reveal`) * W.length), it = v.get(G) ?? { style: "wipe", from: "left" };
        R.save(), F > 0 && Ow(R, it, F, { left: H - a, top: K, width: a + Z + i, height: o }, c);
        const rt = A(`line.${G}.highlight`);
        rt > 0 && (R.globalAlpha *= Math.min(1, rt), R.fillStyle = e.highlight, R.fillRect(H - i / 2, K, Z + i, o), R.globalAlpha /= Math.min(1, rt)), a > 0 && tt > 0 && (R.fillStyle = e.gutter, R.textAlign = "right", R.fillText(String(G), H - i, Y), R.textAlign = "left");
        const C = [
          ...w.filter((nt) => nt.line === G).map((nt) => ({ column: nt.column, length: nt.text.length, piece: nt, insert: void 0 })),
          ...y.filter((nt) => nt.line === G).map((nt) => ({ column: nt.column, length: 0, piece: void 0, insert: nt }))
        ].sort((nt, at) => nt.column - at.column || nt.length - at.length);
        let V = 0, et = H;
        for (const nt of C) {
          z(G, V, Math.min(nt.column, tt), et, Y), et += (nt.column - V) * i;
          let at = nt.length, Q = "";
          if (nt.piece) {
            const U = nt.piece.written ?? "", st = A(`piece.${nt.piece.id}.write`);
            U && st > 0 ? (Q = U.slice(0, Math.round(st * U.length)), at = nt.length + (U.length - nt.length) * Math.min(1, st * 2)) : at = nt.length * (1 - A(`piece.${nt.piece.id}.away`));
          } else nt.insert && (at = nt.insert.chars * A(`insert.${nt.insert.id}.open`), nt.insert.text && (Q = nt.insert.text.slice(0, Math.round(A(`insert.${nt.insert.id}.type`) * nt.insert.text.length))));
          R.fillStyle = e.text;
          for (let U = 0; U < Q.length; U++) Q[U] !== " " && R.fillText(Q[U], et + U * i, Y);
          et += at * i, V = nt.column + nt.length;
        }
        z(G, V, Math.max(V, tt), et, Y);
        const ot = A(`line.${G}.strike`);
        ot > 0 && (R.strokeStyle = e.strike, R.lineWidth = Math.max(1.5, s / 10), R.beginPath(), R.moveTo(H, Y), R.lineTo(H + Z * Math.min(1, ot), Y), R.stroke()), R.restore();
      });
      for (const W of w) {
        const j = A(`piece.${W.id}.opacity`);
        if (j <= 0 || A(`line.${W.line}.wipe`) >= 1) continue;
        const G = H + (W.column + W.text.length / 2) * i + A(`piece.${W.id}.x`), F = N(W.line) + o / 2 + A(`piece.${W.id}.y`);
        R.save(), R.globalAlpha = Math.min(1, j), R.translate(G, F), R.rotate(A(`piece.${W.id}.rotate`) * Math.PI / 180), z(W.line, W.column, W.column + W.text.length, -W.text.length * i / 2, 0), R.restore();
      }
      R.restore();
    }
  }, B = (R) => {
    const { kind: D, rest: I } = Wn(R), A = (H) => Ye("codePanel", R, to, H);
    if (D === "box") {
      if (I) throw A("box takes no arguments");
      return { kind: D };
    }
    if (D === "line") {
      if (!/^\d+$/.test(I)) throw A("write it line:N");
      return { kind: D, n: Number(I) };
    }
    if (D === "token") {
      const H = /^(\d+)(?:#(\d+))?:(.+)$/.exec(I);
      if (!H) throw A("write it token:N:TEXT, or token:N#K:TEXT for the Kth");
      return { kind: D, n: Number(H[1]), occurrence: H[2] ? Number(H[2]) : 1, text: H[3] };
    }
    if (D === "spot") {
      const H = /^(\d+):(\d+)(?::(\d+))?$/.exec(I);
      if (!H) throw A("write it spot:N:C, or spot:N:C:W for W characters");
      return { kind: D, n: Number(H[1]), column: Number(H[2]), width: H[3] ? Number(H[3]) : 1 };
    }
    throw A();
  }, X = (R, D, I, A = !1) => {
    const H = Array.isArray(D) ? D : [D];
    if (H.length === 0 || A && H.length > 1) throw new Error(`codePanel.edit: ${R} takes ${A ? "one" : "at least one"} ${I} anchor`);
    return H.map((N) => {
      const z = B(N);
      if (z.kind !== I) throw new Error(`codePanel.edit: ${R} takes ${I} anchors (${I}:…), not "${N}"`);
      return z;
    });
  }, J = (R, D) => {
    if (typeof D.text != "string") throw new Error(`codePanel.edit: ${R} needs \`text\` (the text to write)`);
    return D.text;
  }, q = {
    kind: "code",
    about: to,
    target: L,
    lines: n,
    box: x(t.x, t.y, c, h),
    line(R, D = 1 / 0) {
      return T(R), x(u, P(R) - k(R, D) * o, Math.max(1, n[R - 1].length) * i, o);
    },
    token(R, D, I = 1, A = 1 / 0) {
      T(R);
      const H = O(R, D, I);
      return x(u + H * i, P(R) - k(R, A) * o, D.length * i, o);
    },
    highlight(R, D) {
      for (const I of E(R)) {
        const A = M(`line.${I}.highlight`, 0);
        S(I, "highlight", A, D.on === !1 ? 0 : 1, D, 200);
      }
      return q;
    },
    strike(R, D) {
      for (const I of E(R)) S(I, "strike", M(`line.${I}.strike`, 0), 1, D);
      return q;
    },
    remove(R, D) {
      const I = E(R), A = D.style ?? "wipe";
      if (!Er.includes(A)) throw new Error(`codePanel.remove: ${ut("style", A, Er)}`);
      const H = A === "wipe" ? 300 : 450, N = D.at + (D.duration ?? H), z = D.close ?? 250;
      for (const W of I)
        S(W, "wipe", 0, 1, { ...D, easing: D.easing ?? (A === "fly" ? "ease-in" : void 0) }, H), v.set(W, { style: A, from: D.from ?? "left" }), b.push({ line: W, closed: N + z });
      for (let W = 1; W <= n.length; W++) {
        if (I.includes(W)) continue;
        const j = I.filter((F) => F < W).length;
        if (j === 0) continue;
        const G = M(`line.${W}.shift`, 0);
        S(W, "shift", G, G + j, { at: N, duration: z, easing: "ease-in-out" });
      }
      return q;
    },
    type(R, D) {
      return S(R, "reveal", 0, 1, { duration: n[R - 1].length * 45, ...D }), q;
    },
    piece(R, D, I = 1) {
      if (typeof R == "string") {
        const W = B(R);
        if (W.kind !== "token") throw new Error(`codePanel.piece: a piece is a word, token:N:TEXT, not "${R}"`);
        return q.piece(W.n, W.text, W.occurrence);
      }
      const A = R;
      if (D === void 0) throw new Error('codePanel.piece: which word? piece(n, text) or piece("token:N:TEXT")');
      T(A);
      const H = O(A, D, I), N = w.find((W) => W.line === A && W.column === H && W.text === D);
      if (N) return N;
      if (w.some((W) => W.line === A && H < W.column + W.text.length && W.column < H + D.length))
        throw new Error(`codePanel: "${D}" on line ${A} overlaps another piece`);
      const z = { id: w.length + 1, line: A, column: H, text: D, home: q.token(A, D, I, 0) };
      w.push(z);
      for (const W of ["x", "y", "rotate", "write", "away"]) _[`piece.${z.id}.${W}`] = 0;
      return _[`piece.${z.id}.opacity`] = 1, z;
    },
    follow(R, D) {
      return m.follow(R, D), q;
    },
    fling(R, D) {
      return m.fling(R, D), q;
    },
    move(R, D) {
      return m.move(R, D), q;
    },
    write(R, D, I) {
      return R.written = D, $(`piece.${R.id}.write`, 0, 1, { duration: Math.max(1, D.length) * 70, ...I }), q;
    },
    spot(R, D, I = 1, A = 1 / 0) {
      T(R);
      const H = y.filter((N) => N.line === R && N.column <= D && N.at <= A).reduce((N, z) => N + z.chars, 0);
      return x(u + (D + H) * i, P(R) - k(R, A) * o, I * i, o);
    },
    insert(R, D, I, A) {
      T(R);
      const H = { id: y.length + 1, line: R, column: D, chars: I.length, text: I, at: A.at };
      y.push(H), _[`insert.${H.id}.open`] = 0, _[`insert.${H.id}.type`] = 0;
      const N = A.duration ?? I.length * 70;
      return $(`insert.${H.id}.open`, 0, 1, { at: A.at, duration: N * 0.6, easing: "ease-out" }), $(`insert.${H.id}.type`, 0, 1, { at: A.at, duration: N }), q;
    },
    drop(R, D, I, A) {
      T(D);
      const H = A.duration ?? 250, N = D === R.line, z = A.easing ?? (N ? "linear" : "ease-out"), W = q.landing(R, D, I, A.at), j = { id: y.length + 1, line: D, column: I, chars: R.text.length, at: A.at };
      return y.push(j), _[`insert.${j.id}.open`] = 0, $(`insert.${j.id}.open`, 0, 1, { at: A.at, duration: H, easing: N ? z : "ease-out" }), $(`piece.${R.id}.away`, M(`piece.${R.id}.away`, 0), 1, { at: A.at, duration: H, easing: N ? z : "ease-in-out" }), m.cutAfter(R, A.at), q.move(R, { at: A.at, duration: H, easing: z, to: { x: W.x, y: W.y } }), $(`piece.${R.id}.rotate`, p.valueAt(`piece.${R.id}.rotate`, A.at), 0, { at: A.at, duration: H }), q;
    },
    landing(R, D, I, A = 1 / 0) {
      const H = q.spot(D, I, R.text.length, A), N = D === R.line && I > R.column ? R.text.length * i : 0;
      return x(H.left - N, H.top, H.width, H.height);
    },
    ride(R, D, I) {
      const A = n.map((H, N) => {
        const z = p.keys(`line.${N + 1}.shift`) ?? [];
        return { top: P(N + 1), offset: (W) => -Sa(z, W) * o, windows: bs(z) };
      });
      return Ta(R, D, { ground: I.ground, every: I.every ?? qe, floors: A });
    },
    tracks: p.tracks,
    anchor(R, D = 1 / 0) {
      const I = B(R);
      return I.kind === "box" ? q.box : I.kind === "line" ? q.line(I.n, D) : I.kind === "token" ? q.token(I.n, I.text, I.occurrence, D) : q.spot(I.n, I.column, I.width, D);
    },
    edit(R, D, I) {
      const A = () => X(R, D, "line").map((H) => H.n);
      if (R === "highlight") return q.highlight(A(), I);
      if (R === "strike") return q.strike(A(), I);
      if (R === "remove") return q.remove(A(), I);
      if (R === "type") {
        for (const H of A()) q.type(H, I);
        return q;
      }
      if (R === "insert") {
        const [H] = X(R, D, "spot", !0);
        return q.insert(H.n, H.column, J(R, I), I);
      }
      if (R === "write" || R === "drop" || R === "move" || R === "fling") {
        const [H] = X(R, D, "token", !0), N = q.piece(H.n, H.text, H.occurrence);
        if (R === "write") return q.write(N, J(R, I), I);
        if (R === "fling") return q.fling(N, I);
        if (R === "drop") {
          const W = typeof I.into == "string" ? B(I.into) : void 0;
          if (W?.kind !== "spot") throw new Error("codePanel.edit: drop needs `into`, a spot anchor (spot:N:C)");
          return q.drop(N, W.n, W.column, I);
        }
        const z = typeof I.to == "string" ? q.anchor(I.to, I.at) : I.to;
        if (!z || typeof z.x != "number" || typeof z.y != "number") throw new Error("codePanel.edit: move needs `to`, an anchor name or { x, y }");
        return q.move(N, { ...I, to: z });
      }
      throw ni("codePanel", R, to);
    }
  };
  return q;
}
function Ow(t, e, n, s, o) {
  if (e.style === "wipe") {
    t.beginPath(), e.from === "right" ? t.rect(s.left, s.top, s.width * (1 - n), s.height) : t.rect(s.left + n * s.width, s.top, s.width * (1 - n), s.height), t.clip();
    return;
  }
  const i = Iw * n;
  if (i > 0.2 && "filter" in t && (t.filter = `blur(${i.toFixed(1)}px)`), t.globalAlpha *= 1 - n, e.style === "fly") {
    const r = e.from === "right" ? -1 : 1;
    t.translate(r * n * Pw * o, 0), t.rotate(r * n * 0.08);
  } else {
    const r = 1 + 0.08 * n, a = s.left + s.width / 2, l = s.top + s.height / 2;
    t.translate(a, l), t.scale(r, r), t.translate(-a, -l);
  }
}
const Vu = {
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
function _w(t) {
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
function Tc(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
const Eo = {
  go: ["break", "case", "chan", "const", "continue", "default", "defer", "else", "fallthrough", "for", "func", "go", "goto", "if", "import", "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var", "nil", "true", "false"],
  rust: ["as", "async", "await", "break", "const", "continue", "crate", "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "self", "Self", "static", "struct", "super", "trait", "true", "type", "unsafe", "use", "where", "while", "Some", "None", "Ok", "Err"],
  csharp: ["abstract", "async", "await", "base", "bool", "break", "case", "catch", "class", "const", "continue", "default", "do", "else", "enum", "false", "finally", "for", "foreach", "if", "in", "int", "interface", "internal", "is", "namespace", "new", "null", "object", "out", "override", "private", "protected", "public", "readonly", "ref", "return", "sealed", "static", "string", "struct", "switch", "this", "throw", "true", "try", "using", "var", "virtual", "void", "while"],
  javascript: ["async", "await", "break", "case", "catch", "class", "const", "continue", "default", "delete", "do", "else", "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "let", "new", "null", "of", "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof", "undefined", "var", "void", "while", "yield"],
  typescript: [],
  python: ["and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "False", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass", "raise", "return", "True", "try", "while", "with", "yield"],
  plain: []
};
Eo.typescript = [...Eo.javascript, "enum", "interface", "type", "implements", "private", "public", "readonly", "keyof", "as", "declare", "namespace"];
const Ar = Object.keys(Eo), Hw = {
  go: "//",
  rust: "//",
  csharp: "//",
  javascript: "//",
  typescript: "//",
  python: "#",
  plain: null
};
function Cw(t, e) {
  const n = new Set(Eo[e]), s = Hw[e], o = [], i = (a, l) => {
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
const Hi = '"Patrick Hand", "Segoe Print", "Bradley Hand", "Comic Sans MS", "Chalkboard SE", cursive', Ns = {
  whiteboard: {
    background: "#f7f7f2",
    frame: "#b8bcc4",
    ink: "#1f2a44",
    colors: { ink: "#1f2a44", red: "#d03b3b", blue: "#2f6fd0", green: "#2e9a52", orange: "#e07b1a" },
    font: Hi,
    stroke: 0.09,
    opacity: 1
  },
  chalkboard: {
    background: "#2f4a3a",
    frame: "#7a5a3a",
    ink: "#f1f1e8",
    colors: { ink: "#f1f1e8", red: "#f2a3a3", blue: "#a8c8f0", green: "#b7e4a8", orange: "#f5c98a", yellow: "#f6ef9a" },
    font: Hi,
    stroke: 0.1,
    opacity: 0.9
  },
  lines: {
    background: "#fffdf5",
    frame: "#d9d3c0",
    ink: "#24315c",
    colors: { ink: "#24315c", red: "#c73b3b", blue: "#2f6fd0", green: "#2e9a52", orange: "#e07b1a", pencil: "#6b6b6b" },
    font: Hi,
    stroke: 0.08,
    opacity: 1,
    rule: { color: "#c9d6ec", spacing: 1.55, margin: "#f0a3a3" }
  }
}, Ec = ["circle", "box", "underline", "arrow"], xe = {
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
}, Ac = 90, $c = 300, Rw = 0.3;
function Fx(t) {
  const e = typeof t.theme == "string" ? t.theme : "whiteboard";
  if (!(e in Ns)) throw new Error(`whiteboard: ${ut("theme", e, Object.keys(Ns))}`);
  const n = typeof t.theme == "object" ? { ...Ns.whiteboard, ...t.theme } : Ns[e], s = t.fontSize ?? 28, o = t.charWidth ?? 0.55, i = (y) => y === void 0 ? n.ink : n.colors[y] ?? y, r = (y) => kt(t.x + y.left, t.y + y.top, y.width, y.height), a = Ss(), l = ei(a), c = {}, h = /* @__PURE__ */ new Map(), u = [], d = [], f = (y, T, $, M) => {
    const S = h.get(y);
    if (!S || S.kind !== "text") throw Ye("whiteboard", M, xe, `there is no text "${y}" (texts: ${g().join(", ") || "none"})`);
    let k = -1;
    for (let P = 0; P < $; P++)
      if (k = S.item.text.indexOf(T, k + 1), k < 0) throw Ye("whiteboard", M, xe, `text "${y}" has no ${$ > 1 ? `${$}th ` : ""}"${T}"`);
    const x = S.size * o;
    return { column: k, box: kt(S.box.left + k * x, S.box.top, T.length * x, S.box.height) };
  }, g = () => [...h.values()].filter((y) => y.kind === "text").map((y) => y.item.id), p = (y) => {
    const { kind: T, rest: $ } = Wn(y), M = (S) => Ye("whiteboard", y, xe, S);
    if (T === "box") {
      if ($) throw M("box takes no arguments");
      return { kind: T };
    }
    if (T === "text" || T === "mark") {
      if (!$) throw M(`write it ${T}:ID`);
      return { kind: T, id: $ };
    }
    if (T === "term") {
      const S = /^([^:#]+)(?:#(\d+))?:(.+)$/.exec($);
      if (!S) throw M("write it term:ID:TEXT, or term:ID#K:TEXT for the Kth");
      return { kind: T, id: S[1], occurrence: S[2] ? Number(S[2]) : 1, text: S[3] };
    }
    throw M();
  }, m = (y) => {
    const T = p(y);
    if (T.kind === "box") return kt(0, 0, t.width, t.height);
    if (T.kind === "term") return f(T.id, T.text, T.occurrence, y).box;
    const $ = h.get(T.id);
    if (!$ || $.kind !== T.kind) {
      const M = [...h.values()].filter((S) => S.kind === T.kind).map((S) => S.item.id);
      throw Ye("whiteboard", y, xe, `there is no ${T.kind} "${T.id}" (${T.kind}s: ${M.join(", ") || "none"})`);
    }
    return $.box;
  };
  for (const y of t.items ?? []) {
    if (!y || typeof y.id != "string" || !y.id || /[:#]/.test(y.id)) throw new Error(`whiteboard: every item needs an \`id\` without ":" or "#" (got ${JSON.stringify(y?.id)})`);
    if (h.has(y.id)) throw new Error(`whiteboard: two items are called "${y.id}"`);
    if ("text" in y) {
      if (!Array.isArray(y.at) || y.at.length !== 2 || !y.at.every((P) => typeof P == "number")) throw new Error(`whiteboard: text "${y.id}" needs \`at\`, [x, y] from the board's top-left`);
      const k = y.size ?? s, x = kt(y.at[0], y.at[1], Math.max(1, y.text.length) * k * o, k * 1.3);
      h.set(y.id, { kind: "text", item: y, size: k, color: i(y.color), box: x }), c[`text.${y.id}.write`] = y.hidden ? 0 : 1, c[`text.${y.id}.erase`] = 0;
      continue;
    }
    if (!Ec.includes(y.mark)) throw new Error(`whiteboard: mark "${y.id}": ${ut("mark", y.mark, Ec)}`);
    const T = y.mark === "arrow" ? ["from", "to"] : ["around"];
    for (const k of T) if (typeof y[k] != "string") throw new Error(`whiteboard: ${y.mark} "${y.id}" needs \`${k}\`, a place on the board (an item before it)`);
    const $ = new Set([y.from, y.to].filter((k) => typeof k == "string").map((k) => k.split(":")[1])), M = y.mark === "arrow" ? [...h.values()].filter((k) => k.kind === "text" && !$.has(k.item.id)).map((k) => k.box) : [], S = Lw(y, m, s, M);
    h.set(y.id, { kind: "mark", item: y, color: i(y.color), points: S, box: Nw(S) }), c[`mark.${y.id}.draw`] = y.hidden ? 0 : 1, c[`mark.${y.id}.erase`] = 0;
  }
  const b = (y) => u.filter((T) => T.item === y), v = {
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
        return Dw(Object.keys(c));
      },
      actions: xe.edits
    },
    draw(y, T) {
      const $ = T.props ?? {}, M = (S) => Number($[S] ?? c[S] ?? 0);
      if (y.save(), y.fillStyle = n.background, Oc(y, 0, 0, t.width, t.height, 10), y.fill(), y.lineWidth = Math.max(4, t.width * 0.012), y.strokeStyle = n.frame, y.stroke(), n.rule) {
        y.save(), y.beginPath(), Oc(y, 0, 0, t.width, t.height, 10), y.clip(), y.lineWidth = 1, y.strokeStyle = n.rule.color;
        const S = s * (n.rule.spacing ?? 1.55);
        for (let k = S; k < t.height; k += S)
          y.beginPath(), y.moveTo(0, k), y.lineTo(t.width, k), y.stroke();
        n.rule.margin && (y.strokeStyle = n.rule.margin, y.beginPath(), y.moveTo(s * 2.2, 0), y.lineTo(s * 2.2, t.height), y.stroke()), y.restore();
      }
      y.textAlign = "center", y.textBaseline = "middle", y.lineCap = "round", y.lineJoin = "round", y.globalAlpha = n.opacity;
      for (const S of h.values()) {
        if (y.save(), Ci(y, S.box, M(`${S.kind}.${S.item.id}.erase`)), S.kind === "text") {
          const k = b(S.item.id), x = M(`text.${S.item.id}.write`) * S.item.text.length;
          y.font = `${S.size}px ${n.font}`, y.fillStyle = S.color;
          for (let P = 0; P < Math.ceil(x); P++)
            S.item.text[P] === " " || k.some((E) => P >= E.column && P < E.column + E.text.length) || (y.globalAlpha = n.opacity * Math.min(1, x - P), y.fillText(S.item.text[P], S.box.left + (P + 0.5) * S.size * o, S.box.y));
        } else
          Ic(y, S.points, M(`mark.${S.item.id}.draw`), S.color, s * n.stroke, S.item.mark === "arrow");
        y.restore();
      }
      for (const S of d) {
        const k = M(`strike.${S.id}.draw`);
        if (k <= 0) continue;
        const { box: x } = S, P = x.height * 0.15;
        Ic(y, [{ x: x.left - 3, y: x.y + P }, { x: x.right + 3, y: x.y - P }], k, n.colors.red ?? n.ink, s * n.stroke * 0.8, !1);
      }
      for (const S of u) {
        const k = h.get(S.item), x = k.size * o;
        y.font = `${k.size}px ${n.font}`, y.fillStyle = k.color;
        const P = S.written;
        if (P) {
          const L = M(`piece.${S.id}.write`) * P.length, B = S.home.x - t.x - P.length * x / 2;
          for (let X = 0; X < Math.ceil(L); X++)
            P[X] !== " " && (y.globalAlpha = n.opacity * Math.min(1, L - X), y.fillText(P[X], B + (X + 0.5) * x, S.home.y - t.y));
        }
        const E = M(`piece.${S.id}.opacity`) * Math.min(1, M(`text.${S.item}.write`) * k.item.text.length - S.column);
        if (E <= 0) continue;
        y.save();
        const O = { x: S.home.x - t.x, y: S.home.y - t.y }, _ = { x: M(`piece.${S.id}.x`), y: M(`piece.${S.id}.y`) };
        Ci(y, kt(O.x + _.x - S.home.width / 2, O.y + _.y - S.home.height / 2, S.home.width, S.home.height), M(`piece.${S.id}.erase`)), Math.hypot(_.x, _.y) < 1 && Ci(y, k.box, M(`text.${S.item}.erase`)), y.globalAlpha = n.opacity * Math.min(1, E), y.translate(O.x + _.x, O.y + _.y), y.rotate(M(`piece.${S.id}.rotate`) * Math.PI / 180);
        for (let L = 0; L < S.text.length; L++) S.text[L] !== " " && y.fillText(S.text[L], (L + 0.5 - S.text.length / 2) * x, 0);
        y.restore();
      }
      y.restore();
    }
  }, w = {
    kind: "board",
    about: xe,
    target: v,
    box: kt(t.x, t.y, t.width, t.height),
    anchor(y) {
      return r(m(y));
    },
    piece(y) {
      const T = p(y);
      if (T.kind !== "term") throw new Error(`whiteboard.piece: a piece is a term, term:ID:TEXT, not "${y}"`);
      const { column: $, box: M } = f(T.id, T.text, T.occurrence, y), S = u.find((x) => x.item === T.id && x.column === $ && x.text === T.text);
      if (S) return S;
      if (u.some((x) => x.item === T.id && $ < x.column + x.text.length && x.column < $ + T.text.length))
        throw new Error(`whiteboard: "${T.text}" in "${T.id}" overlaps another piece`);
      const k = { id: u.length + 1, item: T.id, column: $, text: T.text, home: r(M) };
      u.push(k);
      for (const x of ["x", "y", "rotate", "erase", "write"]) c[`piece.${k.id}.${x}`] = 0;
      return c[`piece.${k.id}.opacity`] = 1, k;
    },
    edit(y, T, $) {
      const M = Array.isArray(T) ? T : [T];
      if (M.length === 0) throw new Error(`whiteboard.edit: ${y} takes at least one anchor`);
      const S = M.map((P) => ({ name: P, anchor: p(P) }));
      for (const { name: P } of S) m(P);
      const k = (P, E = !1) => {
        const O = S.find((_) => !P.includes(_.anchor.kind));
        if (O) throw new Error(`whiteboard.edit: ${y} takes ${P.join(" or ")} anchors, not "${O.name}"`);
        if (E && S.length > 1) throw new Error(`whiteboard.edit: ${y} takes one ${P.join(" or ")} anchor`);
      }, x = () => w.piece(S[0].name);
      if (y === "write") {
        if (S.some((P) => P.anchor.kind === "term")) {
          if (k(["term"], !0), typeof $.text != "string") throw new Error("whiteboard.edit: write into a term needs `text` (the new text)");
          const P = x();
          return P.written = $.text, a.tween(`piece.${P.id}.write`, 0, 1, { duration: Math.max($c, $.text.length * Ac), ...$ }), w;
        }
        k(["text"]);
        for (const { anchor: P } of S) {
          const E = P.id, O = h.get(E).item.text;
          a.tween(`text.${E}.write`, 0, 1, { duration: Math.max($c, O.length * Ac), ...$ });
        }
        return w;
      }
      if (y === "draw") {
        k(["mark"]);
        for (const { anchor: P } of S) a.tween(`mark.${P.id}.draw`, 0, 1, { duration: 500, ...$ });
        return w;
      }
      if (y === "erase") {
        k(["text", "term", "mark"]);
        for (const P of S) {
          const E = P.anchor.kind === "term" ? `piece.${w.piece(P.name).id}.erase` : `${P.anchor.kind}.${P.anchor.id}.erase`;
          a.tween(E, 0, 1, { duration: 400, ...$ });
        }
        return w;
      }
      if (y === "strike") {
        k(["text", "term"]);
        for (const P of S) {
          const E = { id: d.length + 1, box: m(P.name) };
          d.push(E), c[`strike.${E.id}.draw`] = 0, a.tween(`strike.${E.id}.draw`, 0, 1, { duration: 250, ...$ });
        }
        return w;
      }
      if (y === "move") {
        k(["term"], !0);
        const P = typeof $.to == "string" ? w.anchor($.to) : $.to;
        if (!P || typeof P.x != "number" || typeof P.y != "number") throw new Error("whiteboard.edit: move needs `to`, an anchor name or { x, y }");
        return w.move(x(), { ...$, to: P });
      }
      if (y === "fling")
        return k(["term"], !0), w.fling(x(), $);
      throw ni("whiteboard", y, xe);
    },
    follow(y, T) {
      return l.follow(y, T), w;
    },
    fling(y, T) {
      return l.fling(y, T), w;
    },
    move(y, T) {
      return l.move(y, T), w;
    },
    ride(y) {
      return y;
    },
    tracks: a.tracks
  };
  return w;
}
function Lw(t, e, n, s = []) {
  const o = nn(Qt(t.id)), i = (p) => (o.next() * 2 - 1) * p, r = n * Rw;
  if (t.mark === "arrow") {
    const p = e(t.from), m = e(t.to), b = Pc(p, m, r * 0.6), v = Pc(m, p, r * 0.6), w = Math.hypot(v.x - b.x, v.y - b.y), y = Ww(b, v);
    let T = w * (0.06 + i(0.04));
    if (t.bend !== void 0) T = w * t.bend;
    else {
      const S = Fw(b, v, y, s, r);
      S !== 0 && (T = S);
    }
    const $ = { x: (b.x + v.x) / 2 + y.x * T, y: (b.y + v.y) / 2 + y.y * T }, M = [];
    for (let S = 0; S <= 24; S++) {
      const k = S / 24;
      M.push({ x: (1 - k) ** 2 * b.x + 2 * (1 - k) * k * $.x + k * k * v.x, y: (1 - k) ** 2 * b.y + 2 * (1 - k) * k * $.y + k * k * v.y });
    }
    return M;
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
    const p = a.left - r, m = a.right + r, b = a.top - r * 0.6, v = a.bottom + r * 0.6, w = (T, $) => ({ x: T + i(r * 0.2), y: $ + i(r * 0.2) }), y = w(p, b);
    return [y, w(m, b), w(m, v), w(p, v), y, { x: y.x + r * 0.8, y: y.y + i(2) }];
  }
  const l = a.width / 2 + r, c = a.height / 2 + r * 0.6, h = -2.2 + i(0.3), u = o.next() * Math.PI * 2, d = 1.12, f = 64, g = [];
  for (let p = 0; p <= f * d; p++) {
    const m = p / f, b = h + m * Math.PI * 2, v = 1 + 0.035 * Math.sin(m * Math.PI * 4 + u) + 0.06 * m;
    g.push({ x: a.x + Math.cos(b) * l * v, y: a.y + Math.sin(b) * c * v });
  }
  return g;
}
function Fw(t, e, n, s, o) {
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
    ].map((g) => ({ t: (g.x - t.x) * r.x + (g.y - t.y) * r.y, n: (g.x - t.x) * n.x + (g.y - t.y) * n.y })), d = u.some((g) => g.t > 0 && g.t < i), f = u.some((g) => g.n > 0) && u.some((g) => g.n < 0);
    !d || !f || (a = Math.max(a, ...u.map((g) => g.n)), l = Math.min(l, ...u.map((g) => g.n)));
  }
  return a === 0 && l === 0 ? 0 : a <= -l ? 2 * (a + o) : 2 * (l - o);
}
function Pc(t, e, n) {
  const s = e.x - t.x, o = e.y - t.y;
  if (s === 0 && o === 0) return { x: t.x, y: t.y };
  const i = Math.min(s === 0 ? 1 / 0 : (t.width / 2 + n) / Math.abs(s), o === 0 ? 1 / 0 : (t.height / 2 + n) / Math.abs(o));
  return { x: t.x + s * i, y: t.y + o * i };
}
function Ww(t, e) {
  const n = Math.hypot(e.x - t.x, e.y - t.y) || 1;
  return { x: -(e.y - t.y) / n, y: (e.x - t.x) / n };
}
function Nw(t) {
  const e = t.map((i) => i.x), n = t.map((i) => i.y), s = Math.min(...e), o = Math.min(...n);
  return kt(s, o, Math.max(...e) - s, Math.max(...n) - o);
}
function Ic(t, e, n, s, o, i) {
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
  const c = (n - 0.85) / 0.15, h = e[e.length - 1], u = e[e.length - 3] ?? e[0], d = Math.atan2(h.y - u.y, h.x - u.x), f = o * 4.5 * c;
  t.beginPath();
  for (const g of [-1, 1])
    t.moveTo(h.x, h.y), t.lineTo(h.x - Math.cos(d + g * 0.45) * f, h.y - Math.sin(d + g * 0.45) * f);
  t.stroke();
}
function Ci(t, e, n) {
  if (n <= 0) return;
  const s = 8;
  t.beginPath(), t.rect(e.left - s + n * (e.width + s * 2), e.top - s * 4, (1 - n) * (e.width + s * 2), e.height + s * 8), t.clip();
}
function Oc(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
function Dw(t) {
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
const _c = ["bar", "line", "pie", "donut"], Hc = 'system-ui, -apple-system, "Segoe UI", sans-serif', Ds = {
  light: {
    background: "#ffffff",
    text: "#3b4252",
    grid: "#d8dee9",
    color: "#4c7bd9",
    highlight: "#e8833a",
    palette: ["#4c7bd9", "#3fa66b", "#b05cc9", "#d9c04c", "#4cb8c4", "#d95c6f", "#8a7a5a", "#6b7a99"],
    font: Hc
  },
  dark: {
    background: "#1e2230",
    text: "#cdd6f4",
    grid: "#3a4055",
    color: "#89b4fa",
    highlight: "#fab387",
    palette: ["#89b4fa", "#a6e3a1", "#cba6f7", "#f9e2af", "#94e2d5", "#f38ba8", "#b4a58a", "#9399b2"],
    font: Hc
  }
}, vn = {
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
}, Bw = 600, zw = 500, qw = 200, Yw = 400, jw = 0.14, Kw = Math.PI * 2;
function Wx(t) {
  if (!_c.includes(t.kind)) throw new Error(`chart: ${ut("kind", t.kind, _c)}`);
  const e = typeof t.theme == "string" ? t.theme : "light";
  if (!(e in Ds)) throw new Error(`chart: ${ut("theme", e, Object.keys(Ds))}`);
  const n = typeof t.theme == "object" ? { ...Ds.light, ...t.theme } : Ds[e];
  if (!Array.isArray(t.data) || t.data.length === 0) throw new Error("chart: `data` needs at least one { id, value }");
  const s = t.kind, o = s === "pie" || s === "donut", i = Array.isArray(t.series) && t.series.length > 1, r = Array.isArray(t.series) && t.series.length > 0 ? t.series : [{ id: "value" }];
  if (o && i) throw new Error(`chart: a ${s} shows one series (got ${r.length}); make a chart per series`);
  const a = /* @__PURE__ */ new Set();
  for (const C of r) {
    if (typeof C?.id != "string" || !C.id || /[:.]/.test(C.id)) throw new Error(`chart: every series needs an \`id\` without ":" or "." (got ${JSON.stringify(C?.id)})`);
    if (a.has(C.id)) throw new Error(`chart: two series are called "${C.id}"`);
    a.add(C.id);
  }
  const l = new Map(r.map((C, V) => [C.id, V])), c = (C) => r[l.get(C)].color ?? (l.get(C) === 0 ? n.color : n.palette[l.get(C) % n.palette.length]), h = /* @__PURE__ */ new Set(), u = (C, V) => {
    const et = C.values?.[V.id] ?? (t.series ? void 0 : C.value) ?? C.value;
    if (typeof et != "number" || !Number.isFinite(et))
      throw new Error(i ? `chart: "${C.id}" needs a value for series "${V.id}" (\`values: { ${V.id}: … }\`)` : `chart: "${C.id}" needs a \`value\`, a number`);
    return et;
  };
  for (const C of t.data) {
    if (typeof C?.id != "string" || !C.id || /[:.]/.test(C.id)) throw new Error(`chart: every datum needs an \`id\` without ":" or "." (got ${JSON.stringify(C?.id)})`);
    if (h.has(C.id)) throw new Error(`chart: two data are called "${C.id}"`);
    for (const V of r) u(C, V);
    h.add(C.id);
  }
  const d = s === "bar" ? "bar" : s === "line" ? "point" : "slice", f = Math.max(...t.data.flatMap((C) => r.map((V) => u(C, V)))), g = o ? t.data.reduce((C, V) => C + u(V, r[0]), 0) : t.max ?? Xw(f * 1.1);
  if (!o && !(g > 0)) throw new Error(`chart: \`max\` must be above 0 (got ${g})`);
  const p = Math.max(10, Math.min(16, t.height / 20)), m = i && t.legend !== !1, b = o ? void 0 : t.axis?.x, v = o ? void 0 : t.axis?.y, w = t.title ? p * 2.3 : p * 0.5, y = {
    left: p * 3.6 + (v ? p * 1.5 : 0),
    right: t.width - p,
    top: (t.title ? p * 3 : p * 1.6) + (m ? p * 1.6 : 0),
    bottom: t.height - p * 2.4 - (b ? p * 1.4 : 0)
  }, T = y.bottom - y.top, $ = (y.right - y.left) / t.data.length, M = i ? $ * 0.72 / r.length : $ * 0.6, S = i ? M * 0.86 : M, k = Math.max(4, p * 0.35), x = T / g, P = new Map(t.data.map((C, V) => [C.id, V])), E = (C) => y.left + $ * (P.get(C) + 0.5), O = (C, V) => i ? E(C) - $ * 0.36 + M * l.get(V) + (M - S) / 2 : E(C) - S / 2, _ = (C, V) => O(C, V) + S / 2, L = t.height - p * 1.2, B = {
    cx: t.width / 2,
    cy: (y.top + L) / 2,
    r: Math.max(10, Math.min(t.width / 2, (L - y.top) / 2) - p * 2.6)
  }, X = s === "donut" ? B.r * 0.55 : 0, J = s === "donut" ? (X + B.r) / 2 : B.r * 0.62, q = /* @__PURE__ */ new Map();
  if (m) {
    let C = y.right;
    for (const V of [...r].reverse()) {
      const et = V.label ?? V.id, ot = p * 0.62 * et.length + p * 1.9;
      q.set(V.id, kt(C - ot, w, ot, p * 1.4)), C -= ot + p * 0.6;
    }
  }
  const R = Ss(), D = ei(R), I = {}, A = (C, V, et) => i ? `${d}.${C}.${V}.${et}` : `${d}.${C}.${et}`;
  for (const C of t.data)
    for (const V of r)
      I[A(C.id, V.id, "value")] = u(C, V), I[A(C.id, V.id, "show")] = C.hidden ? 0 : 1, I[A(C.id, V.id, "highlight")] = 0, o && (I[A(C.id, V.id, "pull")] = 0);
  const H = (C, V) => R.keys(C)?.length ? Sa(R.keys(C), V) : I[C], N = (C, V, et) => H(A(C, V, "value"), et) * (s === "bar" ? H(A(C, V, "show"), et) : 1) * x, z = (C) => {
    const V = r[0].id, et = t.data.map((Q) => Math.max(0, C(A(Q.id, V, "value"))) * Math.max(0, Math.min(1, C(A(Q.id, V, "show"))))), ot = et.reduce((Q, U) => Q + U, 0), nt = /* @__PURE__ */ new Map();
    let at = -Math.PI / 2;
    return t.data.forEach((Q, U) => {
      const st = ot > 0 ? Kw * et[U] / ot : 0, ct = at + st / 2, dt = Math.max(0, Math.min(1, C(A(Q.id, V, "pull")))) * B.r * jw;
      nt.set(Q.id, {
        start: at,
        sweep: st,
        mid: ct,
        out: dt,
        centre: { x: B.cx + Math.cos(ct) * (J + dt), y: B.cy + Math.sin(ct) * (J + dt) }
      }), at += st;
    }), nt;
  }, W = (C) => z((V) => H(V, C)), j = (C) => {
    const { kind: V, rest: et } = Wn(C), ot = (nt) => Ye("chart", C, vn, nt);
    if (V === "box") {
      if (et) throw ot("box takes no arguments");
      return { kind: "box" };
    }
    if (V === "legend") {
      if (!q.has(et)) throw ot(m ? `there is no series "${et}" (series: ${r.map((nt) => nt.id).join(", ")})` : "only a chart with several series has a legend");
      return { kind: "legend", series: et };
    }
    if (V === "bar" || V === "point" || V === "slice" || V === "label" || V === "value") {
      if (!et) throw ot(`write it ${V}:ID`);
      const nt = et.indexOf(":"), at = nt < 0 ? et : et.slice(0, nt), Q = nt < 0 ? r[0].id : et.slice(nt + 1);
      if (!P.has(at)) throw ot(`there is no "${at}" (data: ${[...P.keys()].join(", ")})`);
      if (!a.has(Q)) throw ot(`there is no series "${Q}" (series: ${r.map((U) => U.id).join(", ")})`);
      if (V === "label" && nt >= 0) throw ot("a label is one per datum: label:ID");
      if ((V === "bar" || V === "point" || V === "slice") && V !== d) throw ot(`a ${s} chart has ${d}s, not ${V}s: ${d}:${at}`);
      return { kind: V, id: at, series: Q };
    }
    throw ot();
  }, G = (C, V) => {
    if (C.kind === "box") return kt(0, 0, t.width, t.height);
    if (C.kind === "legend") return q.get(C.series);
    if (o) {
      const Q = W(V).get(C.id), U = Math.max(p * 1.5, B.r * 0.42);
      if (C.kind === "slice") return kt(Q.centre.x - U / 2, Q.centre.y - U / 2, U, U);
      const st = F(Q);
      return C.kind === "label" ? st : Q.sweep >= 0.3 ? kt(Q.centre.x - p * 1.6, Q.centre.y - p * 0.65, p * 3.2, p * 1.3) : kt(st.left, st.bottom, st.width, p * 1.3);
    }
    const et = C.kind === "label" ? E(C.id) : _(C.id, C.series), ot = y.bottom - N(C.id, C.series, V);
    if (C.kind === "bar") return kt(et - S / 2, ot, S, y.bottom - ot);
    if (C.kind === "point") return kt(E(C.id) - k, ot - k, k * 2, k * 2);
    if (C.kind === "label") return kt(et - $ / 2, y.bottom + p * 0.4, $, p * 1.4);
    const nt = ot - (s === "line" ? k : 0) - p * 0.3, at = i && s === "bar" ? M : $;
    return kt((s === "line" ? E(C.id) : et) - at / 2, nt - p * 1.3, at, p * 1.3);
  }, F = (C) => {
    const V = B.r + C.out + p * 0.9, et = { x: B.cx + Math.cos(C.mid) * V, y: B.cy + Math.sin(C.mid) * V }, ot = p * 4.2, nt = Math.cos(C.mid), at = nt > 0.2 ? et.x : nt < -0.2 ? et.x - ot : et.x - ot / 2;
    return kt(at, et.y - p * 0.7, ot, p * 1.4);
  }, K = (C) => kt(t.x + C.left, t.y + C.top, C.width, C.height), Y = (C) => `${t.prefix ?? ""}${C.toFixed(t.decimals ?? 0)}${t.suffix ?? ""}`, Z = /* @__PURE__ */ new Map(), tt = {
    type: "custom",
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    props: I,
    about: {
      kind: `${s} chart`,
      summary: `A ${s} chart of ${t.data.length} values (${t.data.map((C) => C.id).join(", ")})${i ? ` in ${r.length} series (${r.map((C) => C.id).join(", ")})` : ""}${o ? "" : `, scaled to ${g}`}. Its ${d}s and labels are places in the scene (anchor()); its edits record tracks (edit(), tracks()).`,
      props: Object.fromEntries(Object.keys(I).map((C) => [C, Vw(C)])),
      actions: vn.edits
    },
    draw(C, V) {
      const et = V.props ?? {}, ot = (Q) => Number(et[Q] ?? I[Q] ?? 0);
      if (C.save(), C.fillStyle = n.background, Cc(C, 0, 0, t.width, t.height, 8), C.fill(), C.font = `${p}px ${n.font}`, C.textBaseline = "middle", t.title && (C.fillStyle = n.text, C.textAlign = "left", C.font = `600 ${p * 1.2}px ${n.font}`, C.fillText(t.title, o ? p : y.left, p * 1.5), C.font = `${p}px ${n.font}`), m) {
        C.textAlign = "left";
        for (const Q of r) {
          const U = q.get(Q.id);
          C.fillStyle = c(Q.id), Cc(C, U.left, U.top + p * 0.25, p * 0.9, p * 0.9, 2), C.fill(), C.fillStyle = n.text, C.fillText(Q.label ?? Q.id, U.left + p * 1.3, U.top + U.height / 2);
        }
      }
      if (o) {
        it(C, ot), C.restore();
        return;
      }
      C.lineWidth = 1, C.textAlign = "right";
      for (let Q = 0; Q <= 4; Q++) {
        const U = y.bottom - T * Q / 4;
        C.strokeStyle = n.grid, C.beginPath(), C.moveTo(y.left, U), C.lineTo(y.right, U), C.stroke(), C.fillStyle = n.text, C.globalAlpha = 0.7, C.fillText(Uw(g * Q / 4), y.left - p * 0.5, U), C.globalAlpha = 1;
      }
      (v || b) && (C.fillStyle = n.text, C.textAlign = "center", C.globalAlpha = 0.85, v && (C.save(), C.translate(p * 0.9, (y.top + y.bottom) / 2), C.rotate(-Math.PI / 2), C.fillText(v, 0, 0), C.restore()), b && C.fillText(b, (y.left + y.right) / 2, y.bottom + p * 2.3), C.globalAlpha = 1);
      const nt = (Q, U) => ot(A(Q, U, "value")) * (s === "bar" ? ot(A(Q, U, "show")) : 1) * x, at = (Q, U) => Ri(c(U), n.highlight, ot(A(Q, U, "highlight")));
      if (s === "line") {
        C.lineWidth = Math.max(2, p * 0.2), C.lineJoin = "round", C.lineCap = "round";
        for (const Q of r)
          C.strokeStyle = c(Q.id), C.beginPath(), t.data.forEach((U, st) => {
            const ct = { x: E(U.id), y: y.bottom - nt(U.id, Q.id) }, dt = ot(A(U.id, Q.id, "show"));
            if (st === 0) {
              dt > 0 && C.moveTo(ct.x, ct.y);
              return;
            }
            const yt = t.data[st - 1];
            if (ot(A(yt.id, Q.id, "show")) < 1 || dt <= 0) return;
            const mt = { x: E(yt.id), y: y.bottom - nt(yt.id, Q.id) };
            C.lineTo(mt.x + (ct.x - mt.x) * dt, mt.y + (ct.y - mt.y) * dt);
          }), C.stroke();
      }
      C.textAlign = "center";
      for (const Q of t.data) {
        for (const U of r) {
          const st = s === "bar" ? _(Q.id, U.id) : E(Q.id), ct = nt(Q.id, U.id), dt = ot(A(Q.id, U.id, "show"));
          if (C.fillStyle = at(Q.id, U.id), s === "bar" ? ct > 0.5 && (Gw(C, st - S / 2, y.bottom - ct, S, ct, Math.min(6, S / 4)), C.fill()) : dt > 0 && (C.beginPath(), C.arc(st, y.bottom - ct, k * Math.min(1, dt * 1.5) * (1 + 0.3 * ot(A(Q.id, U.id, "highlight"))), 0, Math.PI * 2), C.fill()), t.values !== !1 && dt > 0) {
            C.globalAlpha = Math.min(1, dt * 2), C.font = `600 ${i ? p * 0.85 : p}px ${n.font}`, C.fillStyle = Ri(n.text, n.highlight, ot(A(Q.id, U.id, "highlight")));
            const yt = y.bottom - ct - (s === "line" ? k : 0) - p * 0.95;
            C.fillText(Y(ot(A(Q.id, U.id, "value"))), st, yt), C.font = `${p}px ${n.font}`, C.globalAlpha = 1;
          }
        }
        C.fillStyle = n.text, C.fillText(Q.label ?? Q.id, E(Q.id), y.bottom + p * 1.1);
      }
      C.strokeStyle = n.text, C.lineWidth = 1.5, C.beginPath(), C.moveTo(y.left, y.bottom), C.lineTo(y.right, y.bottom), C.stroke(), C.restore();
    }
  };
  function it(C, V) {
    const et = r[0].id, ot = z(V);
    t.data.forEach((nt, at) => {
      const Q = ot.get(nt.id);
      if (Q.sweep <= 1e-4) return;
      const U = Z.get(nt.id), st = U ? { x: V(`piece.${U.id}.x`), y: V(`piece.${U.id}.y`) } : { x: 0, y: 0 }, ct = U ? V(`piece.${U.id}.rotate`) * Math.PI / 180 : 0, dt = U ? V(`piece.${U.id}.opacity`) : 1;
      if (dt <= 0) return;
      C.save(), C.globalAlpha = dt;
      const yt = { x: B.cx + Math.cos(Q.mid) * Q.out, y: B.cy + Math.sin(Q.mid) * Q.out };
      C.translate(Q.centre.x + st.x, Q.centre.y + st.y), C.rotate(ct), C.translate(-Q.centre.x, -Q.centre.y), C.beginPath(), C.arc(yt.x, yt.y, B.r, Q.start, Q.start + Q.sweep), X > 0 ? C.arc(yt.x, yt.y, X, Q.start + Q.sweep, Q.start, !0) : C.lineTo(yt.x, yt.y), C.closePath(), C.fillStyle = Ri(n.palette[at % n.palette.length], n.highlight, V(A(nt.id, et, "highlight"))), C.fill(), C.strokeStyle = n.background, C.lineWidth = Math.max(1.5, p * 0.15), C.stroke(), t.values !== !1 && Q.sweep >= 0.3 && (C.fillStyle = n.background, C.font = `600 ${p}px ${n.font}`, C.textAlign = "center", C.fillText(Y(V(A(nt.id, et, "value"))), Q.centre.x, Q.centre.y), C.font = `${p}px ${n.font}`), C.restore();
      const mt = F(Q), Kt = Math.cos(Q.mid);
      C.globalAlpha = dt, C.fillStyle = n.text, C.textAlign = Kt > 0.2 ? "left" : Kt < -0.2 ? "right" : "center";
      const Dn = Kt > 0.2 ? mt.left : Kt < -0.2 ? mt.right : mt.left + mt.width / 2;
      C.fillText(nt.label ?? nt.id, Dn, mt.top + mt.height / 2), t.values !== !1 && Q.sweep < 0.3 && (C.globalAlpha = dt * 0.8, C.fillText(Y(V(A(nt.id, et, "value"))), Dn, mt.bottom + p * 0.65)), C.globalAlpha = 1;
    });
  }
  const rt = {
    kind: "chart",
    chartKind: s,
    about: vn,
    target: tt,
    max: g,
    box: kt(t.x, t.y, t.width, t.height),
    anchor(C, V = 1 / 0) {
      return K(G(j(C), V));
    },
    piece(C) {
      const V = j(C);
      if (V.kind !== "slice")
        throw new Error(o ? `chart: a piece is a slice, slice:ID, not "${C}"` : `chart: a ${d} is not a piece; slices of a pie or donut are (slice:ID). Change a ${d} with edit('set' | 'show' | 'highlight', …)`);
      const et = Z.get(V.id);
      if (et) return et;
      const ot = { id: Z.size + 1, datum: V.id, home: K(G(V, 0)) };
      Z.set(V.id, ot);
      for (const nt of ["x", "y", "rotate"]) I[`piece.${ot.id}.${nt}`] = 0;
      return I[`piece.${ot.id}.opacity`] = 1, ot;
    },
    edit(C, V, et) {
      const ot = Array.isArray(V) ? V : [V];
      if (ot.length === 0) throw new Error(`chart.edit: ${C} takes at least one anchor`);
      if (!(C in vn.edits)) throw ni("chart", C, vn);
      if (C === "pull" && !o) throw new Error(`chart.edit: pull takes slice anchors of a pie or donut; a ${s} chart has ${d}s`);
      const nt = ot.map((at) => {
        const Q = j(at);
        if (Q.kind !== d) throw new Error(`chart.edit: ${C} takes ${d} anchors (${d}:ID), not "${at}"`);
        return Q;
      });
      for (const { id: at, series: Q } of nt) {
        const U = (st) => A(at, Q, st);
        if (C === "set") {
          if (typeof et.value != "number" || !Number.isFinite(et.value)) throw new Error("chart.edit: set needs `value`, a number");
          R.tween(U("value"), H(U("value"), et.at), et.value, et, Bw);
        } else C === "show" ? R.tween(U("show"), H(U("show"), et.at), et.on === !1 ? 0 : 1, et, zw) : C === "pull" ? R.tween(U("pull"), H(U("pull"), et.at), et.on === !1 ? 0 : 1, et, Yw) : R.tween(U("highlight"), H(U("highlight"), et.at), et.on === !1 ? 0 : 1, et, qw);
      }
      return rt;
    },
    follow(C, V) {
      return D.follow(C, V), rt;
    },
    fling(C, V) {
      return D.fling(C, V), rt;
    },
    move(C, V) {
      return D.move(C, V), rt;
    },
    ride(C, V, et) {
      if (s !== "bar") return C;
      const ot = t.data.flatMap(
        (nt) => r.map((at) => {
          const Q = N(nt.id, at.id, 0), U = [...bs(R.keys(A(nt.id, at.id, "value"))), ...bs(R.keys(A(nt.id, at.id, "show")))];
          return { top: t.y + y.bottom - Q, offset: (st) => Q - N(nt.id, at.id, st), windows: U };
        })
      );
      return Ta(C, V, { ground: et.ground, every: et.every ?? qe, floors: ot });
    },
    tracks: R.tracks
  };
  return rt;
}
function Xw(t) {
  if (!(t > 0)) return 1;
  const e = 10 ** Math.floor(Math.log10(t));
  for (const n of [1, 2, 2.5, 5, 10]) if (n * e >= t - 1e-9) return n * e;
  return 10 * e;
}
function Uw(t) {
  return Number.isInteger(t) ? String(t) : String(Number(t.toFixed(2)));
}
function Ri(t, e, n) {
  if (n <= 0) return t;
  if (n >= 1) return e;
  const s = (r) => [1, 3, 5].map((a) => parseInt(r.slice(a, a + 2), 16));
  if (!/^#[0-9a-f]{6}$/i.test(t) || !/^#[0-9a-f]{6}$/i.test(e)) return n < 0.5 ? t : e;
  const [o, i] = [s(t), s(e)];
  return `#${o.map((r, a) => Math.round(r + (i[a] - r) * n).toString(16).padStart(2, "0")).join("")}`;
}
function Cc(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
function Gw(t, e, n, s, o, i) {
  const r = Math.min(i, o);
  t.beginPath(), t.moveTo(e, n + o), t.lineTo(e, n + r), t.arcTo(e, n, e + r, n, r), t.lineTo(e + s - r, n), t.arcTo(e + s, n, e + s, n + r, r), t.lineTo(e + s, n + o), t.closePath();
}
function Vw(t) {
  return t.endsWith(".value") ? { description: "Its value (the bar’s height, the point’s, or the slice’s share, and its value label)", unit: "value" } : t.endsWith(".show") ? { description: "How much of it is shown: a bar grown in from the axis, the line drawn out to the point, a slice opened", unit: "0..1", min: 0, max: 1 } : t.endsWith(".pull") ? { description: "How far the slice is pulled out from the centre", unit: "0..1", min: 0, max: 1 } : t.startsWith("piece.") ? { description: t.endsWith(".opacity") ? "The loose slice’s opacity" : t.endsWith(".rotate") ? "The loose slice’s turn, degrees" : "The loose slice’s offset from home, px", unit: t.endsWith(".rotate") ? "degrees" : t.endsWith(".opacity") ? "0..1" : "px" } : { description: "How much it is coloured out", unit: "0..1", min: 0, max: 1 };
}
const Jw = {
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
}, Zw = {
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
}, Ju = {
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
    options: { build: "child", hair: { style: "bob", color: ye.chestnut }, ears: !0, outfit: { shirt: "#e86a92", trousers: "#4a5b8c", bottom: "skirt" } }
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
    options: { build: "slim", hair: { style: "highPonytail", color: ye.auburn }, ears: !0, outfit: { shirt: "#f0b43c", trousers: "#36507a" } }
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
    options: { build: "curvy", hair: { style: "shoulderWaves", color: ye.black }, ears: !0, outfit: { shirt: "#9b5fc0", trousers: "#2f2f3a", sleeves: "long" } }
  },
  grandpa: {
    label: "Grandpa",
    group: "family",
    scale: 0.96,
    options: {
      build: "stocky",
      hair: { style: "receding", color: ye.gray },
      facialHair: { style: "shortBoxed", color: ye.white },
      glasses: "square",
      ears: !0,
      outfit: { shirt: "#b98a5a", trousers: "#4b4440", sleeves: "long", collar: !0 }
    }
  },
  grandma: {
    label: "Grandma",
    group: "family",
    scale: 0.9,
    options: { build: "short", hair: { style: "topBun", color: ye.white }, glasses: "round", ears: !0, outfit: { shirt: "#5d9fa8", trousers: "#5a4a5e", sleeves: "long", bottom: "skirt" } }
  },
  doctor: {
    label: "Doctor",
    group: "work",
    scale: 0.97,
    options: { build: "slim", hair: { style: "lowPonytail", color: ye.black }, ears: !0, outfit: { shirt: "#8fb8d8", trousers: "#36507a", over: "labCoat", collar: !0 } }
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
    options: { build: "stocky", hair: { style: "shoulderStraight", color: ye.blond }, hat: "sunHat", ears: !0, outfit: { shirt: "#d64535", trousers: "#4f6b3a", sleeves: "long" } }
  },
  ...Jw,
  ...Zw
};
function Nx(t, e = 300, n = {}) {
  const s = Ju[t];
  if (!s) throw new Error(`castMember: unknown cast member '${t}'`);
  return { ...s.options, height: Math.round(e * s.scale), ...n };
}
const Ao = {
  handshake: { height: 0.47, spacing: 0.42, lean: 6 },
  highFive: { height: 0.9, spacing: 0.4, lean: 4 },
  fistBump: { height: 0.55, spacing: 0.44, lean: 6 },
  handOver: { height: 0.52, spacing: 0.46, lean: 8 }
};
function Dx(t, e, n) {
  return Ao[t].spacing * Math.min(e.height, n.height);
}
const Rc = 0.075;
function Bx(t, e, n, s = {}) {
  const o = Ao[t];
  if (!o) throw new Error(`meetHands: unknown meeting '${t}' (one of ${Object.keys(Ao).join(", ")})`);
  const [i, r] = e.x <= n.x ? [e, n] : [n, e], a = s.view === "side", l = Math.min(i.character.height, r.character.height), c = { x: (i.x + r.x) / 2, y: -(s.height ?? o.height) * l }, h = (m, b) => {
    const v = b ? a ? 1 : 0.62 : a ? 3 : 3.38;
    let w = { ...ht, ...m.pose, turn: v, lean: (m.pose?.lean ?? 0) + o.lean };
    const y = b ? 1 : -1, T = ($, M, S) => {
      w = He(m.character, w, $, { x: c.x + M - m.x, y: c.y, depth: S });
    };
    if (t === "handOver") {
      const $ = Rc * l;
      T("arm.left", -y * $ * 0.9, $), T("arm.right", -y * $ * 0.9, -$);
    } else
      T("arm.right", 0, 0);
    return t === "fistBump" && (w = { ...w, "hand.right.index.curl": 1, "hand.right.middle.curl": 1, "hand.right.ring.curl": 1, "hand.right.pinky.curl": 1 }), w;
  }, u = h(i, !0), d = h(r, !1), f = 0.03 * l, g = (m, b) => {
    const v = ie(m.character, b), w = t === "handOver" ? ["hand.left", "hand.right"] : ["hand.right"], y = t === "handOver" ? Rc * l + f : f;
    return w.every((T) => Math.abs(v.points[T].y - c.y) < f && Math.abs(v.points[T].x + m.x - c.x) < y);
  }, p = g(i, u) && g(r, d);
  return e.x <= n.x ? { a: u, b: d, point: c, reached: p } : { a: d, b: u, point: c, reached: p };
}
const $r = { spacing: 0.3, lean: 10, tilt: 8 };
function zx(t, e) {
  return $r.spacing * Math.min(t.height, e.height);
}
function qx(t, e, n = {}) {
  const [s, o] = t.x <= e.x ? [t, e] : [e, t], i = n.view === "side", r = Math.min(s.character.height, o.character.height), a = (g, p, m) => ({
    over: { x: p.x - m * 0.02 * r - g.x, y: -0.72 * r, depth: -0.08 * r },
    round: { x: p.x - m * 0.04 * r - g.x, y: -0.5 * r, depth: 0.06 * r }
  }), l = (g, p, m) => {
    const b = m ? i ? 1 : 0.62 : i ? 3 : 3.38, v = m ? 1 : -1;
    let w = { ...ht, ...g.pose, turn: b, lean: (g.pose?.lean ?? 0) + $r.lean, "head.tilt": (g.pose?.["head.tilt"] ?? 0) + v * $r.tilt };
    const { over: y, round: T } = a(g, p, v);
    return w = He(g.character, w, "arm.right", y), w = He(g.character, w, "arm.left", T), w;
  }, c = l(s, o, !0), h = l(o, s, !1), u = 0.05 * r, d = (g, p, m, b) => {
    const v = ie(g.character, b).points, { over: w, round: y } = a(g, p, m);
    return Math.hypot(v["hand.right"].x - w.x, v["hand.right"].y - w.y) < u && Math.hypot(v["hand.left"].x - y.x, v["hand.left"].y - y.y) < u;
  }, f = d(s, o, 1, c) && d(o, s, -1, h);
  return t.x <= e.x ? { a: c, b: h, reached: f } : { a: h, b: c, reached: f };
}
const Mn = { spacing: 0.32, low: 0.3, high: 0.5, helperLean: 40, helperBend: 16 };
function Yx(t, e) {
  return Mn.spacing * Math.min(t.height, e.height);
}
function jx(t, e, n, s = {}) {
  const o = Math.max(0, Math.min(1, n)), i = s.view === "side", r = t.x <= e.x, a = Math.min(t.character.height, e.character.height), l = { x: (t.x + e.x) / 2, y: -(Mn.low + (Mn.high - Mn.low) * o) * a }, c = (m) => m ? i ? 1 : 0.62 : i ? 3 : 3.38;
  let h = { ...ht, ...t.pose, turn: c(r), lean: (t.pose?.lean ?? 0) + Mn.helperLean * (1 - o) + 4, bend: (t.pose?.bend ?? 0) + Mn.helperBend * (1 - o), "head.nod": 18 * (1 - o) };
  h = He(t.character, h, "arm.right", { x: l.x - t.x, y: l.y });
  const u = { ...he.sitFloor, ...e.pose, turn: c(!r) }, d = { ...ht, ...e.pose, turn: c(!r) };
  let f = xu(u, d, o);
  f = He(e.character, f, "arm.right", { x: l.x - e.x, y: l.y });
  const g = 0.04 * a, p = (m, b) => {
    const v = ie(m.character, b).points["hand.right"];
    return Math.hypot(v.x + m.x - l.x, v.y - l.y) < g;
  };
  return { helper: h, sitter: f, point: l, reached: p(t, h) && p(e, f) };
}
const Qw = 0.7, t2 = 50, e2 = 1.2, n2 = 0.8, s2 = 3, o2 = 30, i2 = 0.8, r2 = 0.6, Li = (t, e) => Math.max(-e, Math.min(e, t)), a2 = ["hair.swing", "hair.trail", "hair.lift"];
function l2(t, e) {
  const n = e.start ?? 0, s = e.amount ?? 1, o = Math.max(1e-6, e.headRadius);
  let i = NaN, r = { x: 0, y: 0, turn: 0 };
  const a = (f) => (f !== i && (r = t(f), i = f), r), l = (f) => {
    const g = a(f);
    return g.turn * 90 + (g.headTurn ?? 0);
  }, c = { start: n, end: e.end, step: e.step, stiffness: e.stiffness ?? 70, damping: e.damping ?? 6 }, h = Us(l, c), u = Us((f) => a(f).x, c), d = Us((f) => a(f).y, c);
  return h.map((f, g) => {
    const p = a(f.time), m = f.value - l(f.time), b = u[g].value - p.x - (e.wind ?? 0) * Qw * o, v = d[g].value - p.y, w = Math.sin(p.turn * Math.PI / 2), y = Math.cos(p.turn * Math.PI / 2), T = m * s2 + b * y / o * o2, $ = -b * w / o * i2, M = -v / o * r2;
    return {
      time: f.time,
      swing: Li(T * s, t2),
      trail: Li($ * s, e2),
      lift: Li(M * s, n2)
    };
  });
}
function Kx(t, e) {
  if (t.length === 0) return { "hair.swing": 0, "hair.trail": 0, "hair.lift": 0 };
  if (e <= t[0].time) return Lc(t[0]);
  if (e >= t[t.length - 1].time) return Lc(t[t.length - 1]);
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
const Lc = (t) => ({ "hair.swing": t.swing, "hair.trail": t.trail, "hair.lift": t.lift }), pn = 16, c2 = 1500;
function Xx(t, e, n, s = {}) {
  const o = n.head.hair;
  if (!o || !Oy(o)) return [];
  const i = e.filter((v) => v.target === t), r = i.reduce((v, w) => w.keyframes.reduce((y, T) => Math.max(y, T.time), v), 0), a = ht, l = /* @__PURE__ */ new Set(["x", "y", "turn", "head.turn"]), c = new It({ id: `${t}-hair-follow`, tracks: i.filter((v) => l.has(v.property)) }), h = (v, w, y) => {
    const T = c.getStateAtTime(v).values.get(t)?.get(w);
    return typeof T == "number" ? T : y;
  }, u = new It({ id: `${t}-hair-pose`, tracks: i }), d = (v) => u.getStateAtTime(v).values.get(t), f = /* @__PURE__ */ new Map(), g = (v) => {
    const w = Math.round(v / pn);
    let y = f.get(w);
    if (!y) {
      const T = {};
      for (const [M, S] of d(w * pn) ?? []) T[M] = S;
      const $ = ie(n, ga(T, a, s.gaits)).head.center;
      f.set(w, y = { x: $.x, y: $.y });
    }
    return y;
  }, p = (v) => {
    const w = Math.floor(v / pn), y = v / pn - w, T = g(w * pn), $ = g((w + 1) * pn);
    return { x: T.x + ($.x - T.x) * y, y: T.y + ($.y - T.y) * y };
  }, m = l2(
    (v) => {
      const w = p(v);
      return {
        x: h(v, "x", 0) + w.x,
        y: h(v, "y", 0) + w.y,
        turn: h(v, "turn", a.turn ?? 0),
        headTurn: h(v, "head.turn", a["head.turn"] ?? 0)
      };
    },
    {
      start: 0,
      end: r + (s.settle ?? c2),
      headRadius: ie(n, ht).head.rx,
      step: s.step,
      stiffness: s.stiffness,
      damping: s.damping,
      amount: s.amount,
      wind: s.wind
    }
  ), b = [];
  for (const v of a2) {
    const w = v.slice(5);
    let y = m.map(($) => ({ time: $.time, value: $[w] }));
    if (y.every(($) => Math.abs($.value) < 1e-3)) continue;
    const T = i.find(($) => $.property === v);
    if (T) {
      const $ = new It({ id: `${t}-${v}-own`, tracks: [T] }), M = (S) => Number($.getStateAtTime(S).values.get(t)?.get(v) ?? 0);
      y = y.map((S) => ({ time: S.time, value: S.value + M(S.time) }));
    }
    b.push({ id: `${t}-${v}`, target: t, property: v, keyframes: y });
  }
  return b;
}
const An = {
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
function Zu(t) {
  if (t === void 0) return An.full;
  if (typeof t == "string") return An[t];
  const { base: e, ...n } = t;
  return { ...An[e ?? "full"], ...n };
}
const Pr = 160, h2 = 120, u2 = 700, Fi = 60, d2 = 90, Bs = 3200, $n = 1, je = 1e-6;
function Ea(t, e, n = {}) {
  const s = Zu(n.style), o = n.seed ?? 1, i = {};
  if (t.length === 0) return i;
  const r = Object.keys(t[0].pose).filter((u) => t.some((d) => Math.abs(d.pose[u] - t[0].pose[u]) > je));
  for (const u of r) i[u] = f2(u, t, e, s, o);
  const a = e.blink, l = a !== void 0 && r.includes(a);
  if (s.blinks && a !== void 0 && !l && a in t[0].pose) {
    const u = p2(t, e, s, o, t[0].pose[a]);
    u.length > 0 && (i[a] = u);
  }
  const { lift: c, stretch: h } = e;
  if (s.jumpSquash > 0 && c && h && r.includes(c) && !r.includes(h) && h in t[0].pose) {
    const u = g2(t, c, t[0].pose[h], s.jumpSquash);
    u.length > 0 && (i[h] = u);
  }
  return i;
}
function f2(t, e, n, s, o) {
  const i = n.eyes.includes(t), r = n.limits[t], a = r !== void 0, l = i ? -s.eyeLead : (n.depth[t] ?? 1) * s.overlap, c = (f) => {
    const g = (e[f].time - e[f - 1].time) / 2;
    return Math.max(-g, Math.min(g, l));
  }, h = [{ time: e[0].time, value: e[0].pose[t] }], u = (f, g, p) => {
    const m = h[h.length - 1];
    if (f <= m.time + $n) {
      h[h.length - 1] = { ...m, value: g, ...p ? { easing: p } : {} };
      return;
    }
    h.push({ time: f, value: g, ...p ? { easing: p } : {} });
  };
  let d = e[0].pose[t];
  for (let f = 1; f < e.length; f++) {
    const g = e[f], p = e[f - 1].pose[t], m = g.pose[t], b = m - p, v = h[h.length - 1].time, w = g.act !== !1;
    if (Math.abs(b) <= je) {
      const P = g.time + (w ? c(f) : 0);
      if (f === e.length - 1)
        Math.abs(d - m) > je && u(Math.max(P, v + Pr), m, "ease-in-out"), d = m;
      else if (w && a && s.drift > 0 && n.drift.includes(t) && P - v >= u2) {
        const E = Qt(`${o}:${t}:${f}`) % 2 === 0 ? 1 : -1;
        d = m + E * s.drift * r, u(P, d, "ease-in-out");
      }
      continue;
    }
    if (!w) {
      u(e[f - 1].time, d), u(g.time, m, g.easing), d = m;
      continue;
    }
    const y = c(f), T = Math.max(e[f - 1].time + y, v);
    let $ = g.time + y;
    i && s.eyeDart > 0 && ($ = Math.min($, T + s.eyeDart));
    const M = $ - T;
    if (M <= $n) {
      u(g.time, m, g.easing), d = m;
      continue;
    }
    u(T, d);
    const S = Math.sign(b);
    if (a && s.anticipation > 0 && r > 0 && M >= Pr) {
      const P = d - S * Math.min(Math.abs(b) * s.anticipation, r), E = T + M * s.anticipationTime;
      u(E, P, "ease-in-out"), s.hold > 0 && u(E + M * s.hold, P);
    }
    const k = f + 1 < e.length ? e[f + 1].time - g.time : 1 / 0, x = Math.min(s.settle, k / 2);
    if (a && s.overshoot > 0 && r > 0 && M >= h2 && x > $n) {
      const P = Math.min(Math.abs(b) * s.overshoot, r);
      u($, m + S * P, g.easing ?? s.actionEase), u($ + x, m, s.settleEase);
    } else
      u($, m, g.easing ?? s.actionEase);
    d = m;
  }
  return h;
}
function p2(t, e, n, s, o) {
  const i = [], r = Fi + d2;
  for (let f = 1; f < t.length; f++) {
    const g = t[f - 1].pose, p = t[f].pose;
    Object.entries(e.headTurns).some(([b, v]) => Math.abs((p[b] ?? 0) - (g[b] ?? 0)) > v) && t[f].act !== !1 && i.push(Math.max(t[0].time, t[f - 1].time - n.eyeLead));
  }
  const a = t[0].time, l = t[t.length - 1].time, c = [...i];
  let h = a + Bs * 0.6, u = 0;
  for (; h < l; ) {
    c.some((p) => Math.abs(p - h) < Bs / 2) || i.push(h);
    const g = (Qt(`${s}:blink:${u++}`) % 1e3 / 1e3 - 0.5) * (Bs * 0.66);
    h += Bs + g;
  }
  i.sort((f, g) => f - g);
  const d = [{ time: a, value: o }];
  for (const f of i) {
    const g = d[d.length - 1].time;
    f + Fi <= g + $n || (f > g + $n && d.push({ time: f, value: o }), d.push({ time: f + Fi, value: 1, easing: "ease-in" }), d.push({ time: f + r, value: o, easing: "ease-out" }));
  }
  return d.length > 1 ? d : [];
}
function g2(t, e, n, s) {
  const o = n * (1 - 0.18 * s), i = n * (1 + 0.14 * s), r = [{ time: t[0].time, value: n }], a = (l, c, h) => {
    const u = r[r.length - 1];
    l <= u.time + $n || r.push({ time: l, value: c, ...h ? { easing: h } : {} });
  };
  for (let l = 1; l < t.length; l++) {
    const c = t[l - 1].pose[e], h = t[l].pose[e], u = t[l - 1].time, d = t[l].time, f = d - u;
    if (!(f < Pr || t[l].act === !1)) {
      if (c <= je && h > je)
        a(u, n), a(u + f * 0.2, o, "ease-out"), a(u + f * 0.45, i, "ease-out"), a(d, n, "ease-in-out");
      else if (c > je && h <= je) {
        const g = l + 1 < t.length ? t[l + 1].time - d : 400;
        a(u + f * 0.5, n), a(d - Math.min(60, f * 0.15), i, "ease-in"), a(d, o, "ease-out"), a(d + Math.min(260, g / 2), n, { type: "back", mode: "out", overshoot: 1.4 });
      }
    }
  }
  return r.length > 1 ? r : [];
}
const m2 = {
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
function y2(t) {
  return /^(turn|lean|bend|side|lift|roll|stretch)$/.test(t) ? { depth: 0, limit: { turn: 0.06, lean: 10, bend: 10, side: 8, lift: 0, roll: 25, stretch: 0.08 }[t] } : /^leg\.\w+\.(swing|spread|rotate)$/.test(t) ? { depth: 0, limit: 12 } : /^head\./.test(t) ? { depth: 1, limit: 12 } : /^arm\.\w+\.(swing|spread)$/.test(t) ? { depth: 1, limit: 20 } : /^leg\.\w+\.knee$/.test(t) ? { depth: 1, limit: 15 } : /^(brow\.|browTilt$)/.test(t) ? { depth: 1, limit: t === "browTilt" ? void 0 : 0.25 } : /^eye\./.test(t) ? { depth: 1, limit: 0.15 } : /^arm\.\w+\.(elbow|bend)$/.test(t) ? { depth: 2, limit: 18 } : /^leg\.\w+\.(ankle|toeOut)$/.test(t) ? { depth: 2, limit: 10 } : /^(mouth|smile|mouthWidth)$/.test(t) ? { depth: 2 } : /^hand\./.test(t) ? { depth: 3 } : { depth: 1 };
}
function b2() {
  const t = {}, e = {};
  for (const n of Object.keys(ht)) {
    const s = y2(n);
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
const w2 = b2();
function Qu(t, e) {
  return Object.entries(e).map(([n, s]) => ({ id: `${t}-${n}`, target: t, property: n, keyframes: s }));
}
function k2(t, e, n = {}) {
  const s = ta(e), o = e.map((i, r) => ({ time: i.time, pose: { ...s[r] }, easing: i.easing, act: i.act }));
  return Qu(t, Ea(o, n.rig ?? m2, n));
}
function v2(t, e, n = {}) {
  const s = n.rest ?? ht, o = Tu(e, s), i = e.map((r, a) => ({ time: r.time, pose: { ...s, ...o[a] }, easing: r.easing, act: r.act }));
  return Qu(t, Ea(i, n.rig ?? w2, n));
}
const Fc = vt.shocked, M2 = vt.scared, en = {
  /** The classic take: squash down in a squint, then shoot up stretched with eyes popping, hang, and land squashed. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: t.lean - 4, leftShoulder: 8, rightShoulder: 8, leftEye: 0.35, rightEye: 0.35, leftBrow: -0.6, rightBrow: -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { rise: 0.22, stretch: 1.35, bend: -14, leftShoulder: 150, rightShoulder: 150, leftElbow: 35, rightElbow: 35, leftHip: 22, rightHip: 22, leftKnee: 45, rightKnee: 45, ...Fc, headTilt: 0 }, easing: "ease-out-cubic" },
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
    { after: 1180, pose: { bend: t.bend - 10, headTilt: t.headTilt + 10, rise: 0.05, stretch: 1.18, ...Fc, lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
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
    { after: 460, pose: { rise: 0, stretch: t.stretch, bend: t.bend, leftHip: lt.leftHip, rightHip: lt.rightHip, leftKnee: 0, rightKnee: 0 }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: small, fast shakes with wide eyes, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...M2, bend: t.bend + 8, leftShoulder: 40, rightShoulder: 40, leftElbow: 110, rightElbow: 110, stretch: 0.94 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) e.push({ after: 80 + n * 45, pose: { lean: t.lean + (n % 2 === 0 ? 2.5 : -2.5), headTilt: t.headTilt + (n % 2 === 0 ? -2 : 2) } });
    return e.push({ after: 755, pose: { lean: t.lean, headTilt: t.headTilt, bend: t.bend } }), e;
  },
  /** A sigh: the body sags, shoulders drop, head and eyes go down. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, headTilt: t.headTilt + 4, leftBrow: 0.3, rightBrow: 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...Zt.sad, bend: 18, stretch: 0.92, lean: t.lean + 5, turn: t.turn, sit: t.sit }, easing: "ease-in-out" }
  ]
};
function Wc(t, e) {
  const n = typeof e.from == "string" ? Zt[e.from] : e.from ?? lt;
  return td(en[t](n), { ...e, from: n });
}
function td(t, e) {
  const n = e.speed ?? 1;
  let s = e.from;
  return [
    { time: e.at, pose: e.from },
    ...t.map((o) => (s = { ...s, ...o.pose }, { time: e.at + o.after * n, pose: s, act: !1, ...o.easing ? { easing: o.easing } : {} }))
  ];
}
function $o(t, e = 1) {
  const n = en[t](lt);
  return n[n.length - 1].after * e;
}
function x2(t, e, n = {}) {
  if (e.length < 2) return;
  const s = Math.max(1, Math.round(n.lines ?? 3)), o = n.spacing ?? 5, i = n.lineWidth ?? 2, r = n.opacity ?? 0.7;
  t.save(), t.strokeStyle = n.color ?? "#222", t.lineCap = "round";
  for (let a = 0; a < s; a++) {
    const l = (a - (s - 1) / 2) * o, c = Math.floor(Math.abs(l) / Math.max(o, 1) * (e.length / 6));
    for (let h = c + 1; h < e.length; h++) {
      const u = e[h - 1], d = e[h], f = d.x - u.x, g = d.y - u.y, p = Math.hypot(f, g) || 1, m = -g / p, b = f / p, v = 1 - h / (e.length - 1);
      t.globalAlpha = r * (1 - v), t.lineWidth = i * (1 - v * 0.7), t.beginPath(), t.moveTo(u.x + m * l, u.y + b * l), t.lineTo(d.x + m * l, d.y + b * l), t.stroke();
    }
  }
  t.restore();
}
const S2 = {
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
function Ux(t, e, n, s, o = {}) {
  const i = n.stateAt;
  if (!i) return;
  const r = o.length ?? 120, a = Math.max(2, Math.round(o.samples ?? 8)), l = Math.max(0, n.time - r);
  if (n.time - l < 1) return;
  const c = [];
  for (let f = 0; f < a; f++) {
    const g = l + (n.time - l) * f / (a - 1);
    c.push(D0(e, { time: g, state: i(g) }, s).joints);
  }
  const h = c[c.length - 1].height, u = (o.threshold ?? 1.2) * h, d = (o.parts ?? ["hands", "toes", "head"]).flatMap((f) => S2[f]);
  for (const f of d) {
    const g = c.map(f.at);
    let p = 0;
    for (let v = 1; v < g.length; v++) p += Math.hypot(g[v].x - g[v - 1].x, g[v].y - g[v - 1].y);
    const m = p / ((n.time - l) / 1e3);
    if (m <= u) continue;
    const b = Math.min(1, (m - u) / (u * 0.5));
    x2(t, g, { ...o, opacity: (o.opacity ?? 0.7) * b, spacing: o.spacing ?? h * 0.02 });
  }
}
function T2(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const o = s.size ?? 40, i = s.seed ?? 1, r = 0.45 + 0.55 * (1 - (1 - n) ** 3);
  t.save(), t.strokeStyle = s.color ?? "#555", t.lineWidth = Math.max(1, o * 0.03), t.globalAlpha = Math.min(1, n / 0.08) * (1 - n);
  for (let a = 0; a < 5; a++) {
    const l = Qt(`${i}:puff:${a}`) % 1e3 / 1e3, c = a - 2, h = e.x + c * o * 0.3 * r, u = e.y - o * (0.06 + 0.12 * l) * r + Math.abs(c) * o * 0.03, d = o * (0.11 + 0.07 * l) * r;
    t.beginPath(), t.arc(h, u, d, Math.PI * 0.95, Math.PI * 2.05), t.stroke();
  }
  t.restore();
}
function Gx(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const o = s.size ?? 40, i = 5, r = 1 - (1 - n) ** 2;
  t.save(), t.strokeStyle = s.color ?? "#222", t.lineWidth = Math.max(1, o * 0.035), t.lineJoin = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  for (let a = 0; a < i; a++) {
    const l = -Math.PI / 2 + (a - (i - 1) / 2) * Math.PI / (i + 1), c = o * (0.3 + 0.7 * r), h = e.x + Math.cos(l) * c, u = e.y + Math.sin(l) * c;
    E2(t, h, u, o * 0.14, n * Math.PI + a), t.stroke();
  }
  t.restore();
}
function E2(t, e, n, s, o) {
  t.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? s : s * 0.45, a = o + i * Math.PI / 5 - Math.PI / 2, l = e + Math.cos(a) * r, c = n + Math.sin(a) * r;
    i === 0 ? t.moveTo(l, c) : t.lineTo(l, c);
  }
  t.closePath();
}
const si = {
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
function ed(t = {}) {
  return [
    ...Object.keys(zt),
    ...Object.keys(Zt),
    ...Object.keys(en),
    ...Object.keys(si),
    ...Object.keys(t.gaits ?? {}),
    ...Object.keys(t.actions ?? {})
  ];
}
function nd(t = {}) {
  const e = new Set(ed()), n = [];
  for (const s of [...Object.keys(t.actions ?? {}), ...Object.keys(t.gaits ?? {})])
    e.has(s) && n.push(`Custom action or gait "${s}" has the name of a built-in one; give it its own name.`);
  for (const s of Object.keys(t.actions ?? {}))
    t.gaits && s in t.gaits && n.push(`"${s}" is both a custom action and a custom gait.`);
  return n;
}
function sd(t = {}) {
  const e = {};
  for (const n of Object.keys(zt)) e[n] = `Walks to \`to\` in the ${n} gait, feet planted, turning round first if needed.`;
  for (const n of Object.keys(Zt)) e[n] = `Moves into the ${n} pose and holds it.`;
  for (const n of Object.keys(en)) e[n] = `The ${n} gag, built on the current pose.`;
  for (const [n, s] of Object.entries(si)) e[n] = s.summary;
  for (const [n, s] of Object.entries(t.gaits ?? {})) e[n] = s.summary ?? `Walks to \`to\` in the ${n} gait (custom).`;
  for (const [n, s] of Object.entries(t.actions ?? {})) e[n] = s.summary;
  return e;
}
const Ir = ["do", "at", "for", "to", "toward", "mood", "say", "pose", "target", "onto"], A2 = {
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
}, zs = ["viewer", "ahead", "back"], Le = (t) => typeof t == "number" && Number.isFinite(t);
function Po(t, e = {}) {
  const n = nd(e).map((l) => ({ level: "error", beat: -1, message: l }));
  if (!Array.isArray(t)) return [...n, { level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const s = ed(e), o = (l) => l in zt || l in (e.gaits ?? {}), i = Object.keys(vt), r = Object.keys(lt);
  let a = -1 / 0;
  return t.forEach((l, c) => {
    const h = (p) => n.push({ level: "error", beat: c, message: p }), u = (p) => n.push({ level: "warning", beat: c, message: p });
    if (!l || typeof l != "object" || Array.isArray(l)) {
      h(`Each beat must be an object like { do: 'walk', to: 400 } (got ${JSON.stringify(l)}).`);
      return;
    }
    const d = l;
    for (const p of Object.keys(d))
      Ir.includes(p) || h(ut("beat field", p, Ir, A2[p.toLowerCase()]));
    const f = d.do;
    if (f === void 0) {
      h(`A beat needs \`do\` (what happens). Actions: ${s.join(", ")}`);
      return;
    }
    if (typeof f != "string" || !s.includes(f)) {
      h(ut("action", f, s));
      return;
    }
    const g = si[f] ?? e.actions?.[f];
    for (const p of g?.needs ?? [])
      d[p] === void 0 && h(`\`${f}\` needs \`${p}\`.`);
    if (o(f) && d.to === void 0 && u(`\`${f}\` without \`to\` walks nowhere.`), f === "leap" && d.to === void 0 && d.onto === void 0 && u("`leap` without `to` or `onto` jumps on the spot."), d.mood !== void 0 && (typeof d.mood != "string" || !i.includes(d.mood)) && h(ut("mood", d.mood, i)), d.pose !== void 0)
      if (!d.pose || typeof d.pose != "object" || Array.isArray(d.pose))
        h("`pose` is joints to change, an object like { rightShoulder: 90 } (for a named pose, use it as the action).");
      else
        for (const [p, m] of Object.entries(d.pose))
          r.includes(p) ? Le(m) || h(`Pose joint \`${p}\` must be a number (got ${JSON.stringify(m)}).`) : h(ut("pose joint", p, r));
    for (const p of ["at", "for"]) {
      const m = d[p];
      m !== void 0 && !(Le(m) && m >= 0) && h(`\`${p}\` is milliseconds, a number ≥ 0 (got ${JSON.stringify(m)}).`);
    }
    Le(d.at) && (d.at < a && u(`\`at\` ${d.at} is before an earlier beat's \`at\` (${a}); beats run in order, so it starts when the one before ends.`), a = d.at);
    for (const p of ["to", "onto"]) {
      const m = d[p];
      m !== void 0 && !Le(m) && h(`\`${p}\` is a scene ${p === "to" ? "x" : "y"} in px, a number (got ${JSON.stringify(m)}).`);
    }
    if (d.toward !== void 0 && !Le(d.toward) && !zs.includes(d.toward) && h(`\`toward\` is a scene x or one of ${zs.join(", ")}${typeof d.toward == "string" && ro(d.toward, zs) ? ` (did you mean "${ro(d.toward, zs)}"?)` : ""} (got ${JSON.stringify(d.toward)}).`), d.say !== void 0 && typeof d.say != "string" && h(`\`say\` is the line spoken, a string (got ${JSON.stringify(d.say)}).`), d.target !== void 0) {
      const p = d.target;
      (!p || typeof p != "object" || !Le(p.x) || !Le(p.y)) && h("`target` is a point or box in scene px: { x, y } (a code panel’s line(), token() or spot() fits).");
    }
  }), n;
}
function Nc(t, e = {}, n = "scriptTracks") {
  const s = Po(t, e).filter((o) => o.level === "error");
  if (s.length !== 0)
    throw new Error(`${n}: ${s.length} problem(s) in the beats:
${s.map((o) => `  ${o.beat >= 0 ? `beat ${o.beat}: ` : ""}${o.message}`).join(`
`)}`);
}
Sm(sd);
function Vx(t) {
  const e = "steps" in t && typeof t.steps == "function", n = "beats" in t && typeof t.beats == "function";
  if (e === n) throw new Error("defineAction: give either `steps: (from, beat) => [...]` or `beats: (beat) => [...]`");
  if (!t.summary) throw new Error("defineAction: give a `summary`: one line on what the figure does");
  return t;
}
function Jx(t) {
  for (const e of ["swing", "knee", "arm", "elbow", "lean"])
    if (typeof t[e] != "number") throw new Error(`defineGait: \`${e}\` must be a number (degrees)`);
  if (t.cycle !== void 0 && !(t.cycle > 0)) throw new Error("defineGait: `cycle` is ms per two steps, above 0");
  return t;
}
const Dc = 8;
function Aa(t, e = {}, n = 0) {
  if (n > Dc) throw new Error(`scriptTracks: custom actions nest more than ${Dc} deep (does one build itself?)`);
  return t.flatMap((s) => {
    const o = e[s.do];
    if (!o || !("beats" in o)) return [s];
    const i = o.beats(s).map(
      (r, a) => a === 0 ? { ...r, ...s.at !== void 0 && r.at === void 0 ? { at: s.at } : {}, ...s.mood && !r.mood ? { mood: s.mood } : {}, ...s.say && !r.say ? { say: s.say } : {} } : r
    );
    return Aa(i, e, n + 1);
  });
}
function $2(t) {
  return t.length === 0 ? 0 : Math.max(...t.map((e) => e.after));
}
const Bc = {
  walk: 1e3,
  bouncy: 900,
  doubleBounce: 1100,
  sneak: 1600,
  strut: 1100,
  tired: 1500,
  shove: 1300,
  run: 560
}, P2 = 450, I2 = 2.4, O2 = 160, zc = 2.5, _2 = 200, H2 = 340, C2 = 1.1, qc = [380, 900], R2 = 0.35, qs = 300, Wi = 150, L2 = 260, F2 = 1.2, Ni = 160, Yc = 400, Gn = 300, W2 = 450, jc = 500, Di = 350, Kc = 150, N2 = 120, Bi = 180, Xc = 420, D2 = 300, Uc = 300, B2 = 140, zi = 150, Gc = 450, z2 = 450, qi = 150, Vc = 350, Jc = 400, q2 = 12, Y2 = 600, Zc = 90, Qc = 400, j2 = 200, K2 = 0.09, th = 350, ge = 450, Yi = 1200, X2 = 700, gn = 320, me = 220, U2 = 65, G2 = 700, eh = (t) => t in en, V2 = (t) => t in Zt;
function J2(t) {
  return Math.max(G2, Array.from(t).length * U2);
}
function $a(t, e, n = {}) {
  const s = { actions: n.actions, gaits: n.gaits };
  Nc(e, s);
  const o = n.gait ?? "walk", i = Aa(e, n.actions).map((A) => A.do === "go" ? { ...A, do: o } : A);
  Nc(i, s, "scriptTracks (after expanding custom actions)");
  const r = (A) => zt[A] ?? n.gaits?.[A], a = (A) => Bc[A] ?? n.gaits?.[A]?.cycle ?? 1e3, l = (A) => {
    const H = n.actions?.[A];
    return H && "steps" in H ? H : void 0;
  }, c = n.from ?? 0, h = n.ground ?? 0, u = n.height ?? 300;
  let d = c, f = h, g = n.facing ?? 1, p = n.start ?? lt, m = 0, b = 0;
  const v = [{ time: 0, pose: p }], w = [{ time: 0, value: 0 }], y = [{ time: 0, value: 0 }], T = [{ time: 0, value: 0 }], $ = [{ time: 0, value: 0 }], M = [{ time: 0, value: "walk" }], S = [{ time: 0, value: g }], k = [], x = [], P = [], E = (A, H, N, z) => {
    p = { ...p, ...H }, N && (p = De(p, N)), v.push({ time: A, pose: p, ...z === !1 ? { act: z } : {} });
  }, O = (A, H, N) => (E(A + gn / 2, { turn: 0 }, N), S.push({ time: A + gn / 2, value: g }, { time: A + gn / 2 + 1, value: H }), g = H, E(A + gn, { turn: 1 }), A + gn), _ = (A) => A < d ? -1 : 1, L = (A, H, N) => _(H) !== g ? O(A, _(H), N) : A, B = (A, H, N, z = "arm") => {
    const W = z === "arm", j = le({ ...A, ...W ? { rightShoulder: 0, rightElbow: 0 } : { rightHip: 0, rightKnee: 0 } }, { height: u, facing: g }), G = W ? j.shoulders.right : j.hip, F = W ? j.elbows.right : j.knees.right, K = (tt, it) => Math.atan2(g * tt, it) * 180 / Math.PI, Z = ((K(H - (d + G.x), N - (f + G.y)) - K(F.x - G.x, F.y - G.y)) % 360 + 360) % 360;
    return Z > 270 ? Z - 360 : Z;
  }, X = (A, H, N, z) => {
    const W = z === "arm", j = le({ ...A, ...W ? { rightShoulder: 90, rightElbow: 0, rightWrist: 0 } : { rightHip: 90, rightKnee: 0 } }, { height: u, facing: g }), G = W ? j.shoulders.right : j.hip, F = W ? { x: (j.hands.right.x + j.fingertips.right.x) / 2, y: (j.hands.right.y + j.fingertips.right.y) / 2 } : j.feet.right, K = Math.hypot(F.x - G.x, F.y - G.y) * ((W ? n.reach?.arm : n.reach?.leg) ?? 1), Y = N - (f + G.y), Z = Math.abs(Y) < K ? Math.sqrt(K * K - Y * Y) : K * 0.1;
    return H - G.x - g * Z;
  }, J = (A) => {
    const H = le(A, { height: u, facing: g });
    return { x: d + (H.hands.right.x + H.fingertips.right.x) / 2, y: f + (H.hands.right.y + H.fingertips.right.y) / 2 };
  }, q = (A, H, N) => {
    const z = { ...A, rightWrist: 0, rightElbow: 0, rightShoulder: B(A, H, N) }, W = le(z, { height: u, facing: g }), j = { x: d + W.shoulders.right.x, y: f + W.shoulders.right.y }, G = { x: d + W.elbows.right.x, y: f + W.elbows.right.y }, F = J(z), K = Math.hypot(G.x - j.x, G.y - j.y), Y = Math.hypot(F.x - G.x, F.y - G.y), Z = Math.min(K + Y - 0.01, Math.max(Math.abs(K - Y) + 0.01, Math.hypot(H - j.x, N - j.y))), tt = (et) => et * 180 / Math.PI, it = tt(Math.acos((K * K + Z * Z - Y * Y) / (2 * K * Z))), rt = 180 - tt(Math.acos((K * K + Y * Y - Z * Z) / (2 * K * Y)));
    let C = { rightShoulder: z.rightShoulder, rightElbow: 0 }, V = 1 / 0;
    for (const et of [1, -1])
      for (const ot of [1, -1]) {
        const nt = { rightShoulder: z.rightShoulder + et * it, rightElbow: ot * rt }, at = { ...A, rightWrist: 0, ...nt }, Q = J(at), st = Math.hypot(Q.x - H, Q.y - N) - le(at, { height: u, facing: g }).elbows.right.y * 1e-3;
        st < V && (V = st, C = nt);
      }
    return C;
  }, R = (A, H, N) => Math.abs(H - d) < 2 ? A : (w.push({ time: A, value: d - c }, { time: A + N, value: H - c, easing: "ease-in-out" }), d = H, A + N);
  for (const A of i) {
    const H = Math.max(A.at ?? b, b === 0 ? 0 : v[v.length - 1].time);
    let N = H, z, W;
    const j = A.pose ?? {}, G = l(A.do);
    if (r(A.do)) {
      const F = A.to ?? d, K = F === d ? g : _(F);
      let Y = H;
      K !== g ? Y = O(H, K, A.mood) : p.turn < 1 ? (Y = H + me, E(Y, { turn: 1, ...j }, A.mood)) : (A.mood || A.pose) && E(H + me, j, A.mood);
      const tt = Math.abs(F - d) / ur(r(A.do), u), it = A.for ?? Math.max(me * 2, tt * a(A.do)), rt = Y + it;
      M.push({ time: Y, value: A.do }), $.push({ time: Y, value: 0 }, { time: Y + me, value: 1, easing: "ease-out" }), $.push({ time: rt - me, value: 1 }, { time: rt, value: 0, easing: "ease-in" }), T.push({ time: Y, value: m }, { time: rt, value: m + tt }), w.push({ time: Y, value: d - c }, { time: rt, value: F - c }), m += tt, d = F, E(rt, {}), N = rt;
    } else if (A.do === "zip") {
      const F = A.to ?? d, K = F === d ? g : _(F);
      let Y = H;
      K !== g ? Y = O(H, K, A.mood) : p.turn < 1 && (Y = H + me, E(Y, { turn: 1 }, A.mood));
      const Z = Wc("windUp", { at: Y, from: A.mood ? De(p, A.mood) : p });
      v.push(...Z), p = Z[Z.length - 1].pose;
      const tt = Y + $o("windUp"), it = tt + P2, rt = it + Math.max(O2, Math.abs(F - d) / I2);
      M.push({ time: tt, value: "run" }), $.push({ time: tt, value: 0 }, { time: tt + 80, value: 1, easing: "ease-out" }, { time: rt, value: 1 }, { time: rt + 120, value: 0 }), T.push({ time: tt, value: m }, { time: it, value: m + zc, easing: "ease-in" }), m += zc + (rt - it) / Bc.run * 1.5, T.push({ time: rt, value: m }), w.push({ time: it, value: d - c }, { time: rt, value: F - c, easing: "ease-in" }), P.push({ kind: "dust", time: it, x: d, y: f, length: 900 }), d = F, E(rt, {}), N = rt;
    } else if (A.do === "leap") {
      const F = A.to ?? d, K = A.onto ?? f;
      let Y = F === d ? H : L(H, F, A.mood);
      p.turn < 1 && (Y += me, E(Y, { turn: 1 }, A.mood));
      const Z = { leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50 };
      E(Y + _2, { stretch: 0.75, bend: 12, leftHip: 22, rightHip: 22, ...Z }, A.mood, !1);
      const tt = Y + H2;
      E(tt - 40, { stretch: 0.72 }, void 0, !1), E(tt, { stretch: 1.2, bend: -6, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4 }, void 0, !1);
      const it = Math.hypot(F - d, K - f), rt = A.for ?? Math.min(qc[1], Math.max(qc[0], 300 + it * C2)), C = Math.min(f, K) - R2 * u, V = Math.sqrt(f - C), et = Math.sqrt(K - C), ot = tt + rt * V / (V + et), nt = tt + rt;
      E(ot, { stretch: 1, bend: 4, leftHip: -55, leftKnee: -80, rightHip: 55, rightKnee: 80, leftShoulder: 110, rightShoulder: 110 }, void 0, !1), E(nt, { stretch: 0.72, bend: 12, leftShoulder: 75, rightShoulder: 75, leftElbow: 0, rightElbow: 0, leftHip: 18, rightHip: 18, leftKnee: 0, rightKnee: 0 }, void 0, !1), E(nt + 180, { stretch: 1.05, bend: -3 }, void 0, !1), E(nt + 340, { stretch: 1, bend: 0, leftHip: lt.leftHip, rightHip: lt.rightHip, leftShoulder: lt.leftShoulder, rightShoulder: lt.rightShoulder, leftElbow: lt.leftElbow, rightElbow: lt.rightElbow }, void 0, !1), w.push({ time: tt, value: d - c }, { time: nt, value: F - c }), y.push(
        { time: tt, value: f - h },
        { time: ot, value: C - h, easing: "ease-out-quad" },
        { time: nt, value: K - h, easing: "ease-in-quad" }
      ), d = F, f = K, P.push({ kind: "dust", time: nt, x: d, y: f, length: 500 }), N = nt + 340, z = nt;
    } else if (A.do === "point" && A.target) {
      const F = A.target, K = L(H, F.x, A.mood), Y = { ...p, ...A.mood ? vt[A.mood] : {}, turn: Math.max(p.turn, 0.6), rightElbow: 0, rightWrist: 0, ...j }, Z = le(Y, { height: u, facing: g }).head.center, tt = Math.abs(F.x - (d + Z.x)), it = F.y - (f + Z.y), rt = K + ge;
      E(rt, { ...Y, rightShoulder: B(Y, F.x, F.y), lookX: 1, lookY: Z2(it / Math.max(1, Math.hypot(tt, it))) * 0.8 }), N = rt + (A.for ?? Yi), z = rt, W = N;
    } else if (A.do === "swipe") {
      const F = A.target ?? { x: d + g * u * 0.5, y: f - u * 0.6 }, K = _(F.x), Y = L(H, F.x, A.mood), Z = K === 1 ? F.left ?? F.x : F.right ?? F.x, tt = K === 1 ? F.right ?? F.x : F.left ?? F.x, it = { ...p, turn: 1, lean: -10, bend: -8, rightElbow: 40, lookX: 1, ...j };
      E(Y + qs, { ...it, rightShoulder: B(it, d - g * u * 0.3, f - u * 1.1) }, A.mood, !1);
      const rt = { ...p, lean: 6, bend: 4, rightElbow: 0, rightWrist: 0 }, C = { ...p, lean: 14, bend: 12, rightElbow: 0, rightWrist: 0 };
      R(Y, X(rt, Z, F.y, "arm"), qs + Wi), E(Y + qs + Wi, { lean: -12 }, void 0, !1);
      const V = Y + qs + Wi + 80;
      E(V, { ...rt, rightShoulder: B(rt, Z, F.y) }, void 0, !1);
      const et = V + (A.for ?? Math.max(L2, Math.abs(tt - Z) / F2));
      w.push({ time: V, value: d - c }), d = X(C, tt, F.y, "arm"), w.push({ time: et, value: d - c }), E(et, { ...C, rightShoulder: B(C, tt, F.y) }, void 0, !1), E(et + Ni, { lean: 16, bend: 14, rightShoulder: B(p, tt + K * u * 0.4, F.y + u * 0.25) }, void 0, !1), E(et + Ni + Yc, { lean: 0, bend: 0, rightShoulder: lt.rightShoulder, rightElbow: lt.rightElbow }), N = et + Ni + Yc, z = V, W = et;
    } else if (A.do === "grab" && A.target) {
      const F = A.target, K = L(H, F.x, A.mood), Y = F.y > f - u * 0.5, Z = {
        ...p,
        turn: 1,
        rightElbow: 0,
        bend: Y ? 35 : 0,
        lean: Y ? 12 : 0,
        stretch: Y ? 0.75 : 1,
        lookX: 1,
        lookY: Y ? 0.8 : 0,
        ...j
      }, it = R(K, X(Z, F.x, F.y, "arm"), Gn) + W2;
      E(it, { ...Z, rightShoulder: B(Z, F.x, F.y) }, A.mood, !1), E(it + 120, {}, void 0, !1), E(it + jc, { bend: 0, lean: -3, stretch: 1, rightShoulder: 165, rightElbow: 20, lookY: -0.6 }), N = it + jc + 150, z = it;
    } else if (A.do === "throw") {
      const F = A.target?.x ?? A.to ?? d + g * u, K = L(H, F, A.mood), Y = { ...p, turn: 1, lean: -12, bend: -10, rightElbow: 60, stretch: 0.95, lookX: 1, lookY: -0.3, ...j };
      E(K + Di, { ...Y, rightShoulder: B(Y, d - g * u * 0.4, f - u * 1.05) }, A.mood, !1), E(K + Di + Kc, { lean: -14 }, void 0, !1);
      const Z = K + Di + Kc + N2, tt = { ...p, lean: 14, bend: 12, rightElbow: 0, stretch: 1.04 };
      v.push({ time: Z, pose: p = { ...tt, rightShoulder: B(tt, d + g * u, f - u * 1.1) }, easing: "ease-in", act: !1 }), E(Z + Bi, { lean: 18, bend: 14, rightShoulder: 55, stretch: 1 }, void 0, !1), E(Z + Bi + Xc, { lean: 0, bend: 0, rightShoulder: lt.rightShoulder, rightElbow: lt.rightElbow, lookY: 0 }), N = Z + Bi + Xc, z = Z, W = Z;
    } else if (A.do === "kick" && A.target) {
      const F = A.target, K = L(H, F.x, A.mood), Y = { ...p, turn: 1, lean: -12, bend: -6, rightKnee: 0, leftShoulder: 100, rightShoulder: 70 }, Z = R(K, X(Y, F.x, F.y, "leg"), D2), tt = { leftShoulder: 70, rightShoulder: 50, leftElbow: -20, rightElbow: 20 };
      E(Z + Uc, { turn: 1, lean: 8, bend: 6, rightHip: -40, rightKnee: 80, lookX: 1, lookY: 0.7, ...tt, ...j }, A.mood, !1);
      const it = Z + Uc + B2, rt = B(Y, F.x, F.y, "leg");
      v.push({ time: it, pose: p = { ...p, ...Y, rightHip: rt }, easing: "ease-in", act: !1 }), E(it + zi, { lean: -15, rightHip: rt + 20 }, void 0, !1), E(it + zi + Gc, {
        lean: 0,
        bend: 0,
        rightHip: lt.rightHip,
        rightKnee: 0,
        leftShoulder: lt.leftShoulder,
        rightShoulder: lt.rightShoulder,
        leftElbow: lt.leftElbow,
        rightElbow: lt.rightElbow,
        lookY: 0
      }), N = it + zi + Gc, z = it;
    } else if (A.do === "put" && A.target) {
      const F = A.target, K = L(H, F.x, A.mood), Y = F.y > f - u * 0.5, Z = { ...p, turn: 1, rightElbow: 0, rightWrist: 0, bend: Y ? 35 : 0, lean: Y ? 12 : 0, stretch: Y ? 0.75 : 1, lookX: 1, lookY: Y ? 0.8 : 0, ...j }, it = R(K, X(Z, F.x, F.y, "arm"), Gn) + z2;
      E(it, { ...Z, rightShoulder: B(Z, F.x, F.y) }, A.mood, !1), E(it + qi, {}, void 0, !1), E(it + qi + Vc, { bend: 0, lean: 0, stretch: 1, rightShoulder: lt.rightShoulder, rightElbow: lt.rightElbow, lookY: 0 }), N = it + qi + Vc, z = it;
    } else if (A.do === "write" && A.target) {
      const F = A.target, K = F.left ?? F.x, Y = F.right ?? F.x, Z = L(H, (K + Y) / 2, A.mood), tt = { ...p, turn: 1, rightElbow: 0, rightWrist: 0, ...vt.thinking, lookX: 1, lookY: 0, ...j }, it = (Q) => X(tt, Q, F.y, "arm") + g * u * 0.08, rt = (Q) => {
        const U = J({ ...tt, ...q(tt, Q, F.y), rightWrist: 0 });
        return Math.hypot(U.x - Q, U.y - F.y) < 2;
      }, C = g === 1 ? K : Y, V = R(Z, it((K + Y) / 2), Gn), et = !rt(K) || !rt(Y), ot = et ? R(V, it(K), Gn) + Jc : V + Jc;
      E(ot, { ...tt, ...q(tt, et ? K : C, F.y) }, A.mood, !1);
      const nt = A.for ?? Math.max(Y2, Math.abs(Y - K) * q2);
      et && w.push({ time: ot, value: d - c });
      for (let Q = Zc, U = 0; Q <= nt; Q += Zc, U++) {
        const st = K + (Y - K) * Math.min(Q, nt) / nt;
        et && (d = it(st), w.push({ time: ot + Q, value: d - c }));
        const ct = (U % 2 === 0 ? -1 : 1) * u * 0.02;
        E(ot + Q, q(tt, st, F.y + ct), void 0, !1);
      }
      const at = ot + nt;
      E(at, q(tt, Y, F.y), void 0, !1), E(at + Qc, { rightShoulder: lt.rightShoulder, rightElbow: lt.rightElbow, ...vt.happy }), N = at + Qc, z = ot, W = at;
    } else if (A.do === "push" && A.target) {
      const F = A.target, K = A.to ?? F.x, Y = L(H, d + (K >= F.x ? 1 : -1), A.mood), Z = g === 1 ? F.left ?? F.x : F.right ?? F.x, tt = { ...p, turn: 1, lean: 16, bend: 8, rightWrist: 0, leftWrist: 0, lookX: 1, ...j }, it = X(tt, Z, F.y, "arm"), rt = R(Y, it + g * u * 0.06, Gn), C = q(tt, Z, F.y), V = { ...tt, ...C, leftShoulder: -C.rightShoulder, leftElbow: -C.rightElbow }, et = rt + j2;
      E(et, V, A.mood, !1);
      const ot = Math.abs(K - F.x), nt = et + (A.for ?? Math.max(600, ot / K2)), at = ot / ur("shove", u);
      M.push({ time: et, value: "shove" }), $.push({ time: et, value: 0 }, { time: et + me, value: 1, easing: "ease-out" }, { time: nt - me, value: 1 }, { time: nt, value: 0, easing: "ease-in" }), T.push({ time: et, value: m }, { time: nt, value: m + at }), m += at, w.push({ time: et, value: d - c }, { time: nt, value: d + (K - F.x) - c }), d += K - F.x, E(nt, {}, void 0, !1), E(nt + th, { lean: 0, bend: 0, rightShoulder: lt.rightShoulder, leftShoulder: lt.leftShoulder, rightElbow: lt.rightElbow, leftElbow: lt.leftElbow }), N = nt + th, z = et, W = nt;
    } else if (G) {
      const F = A.mood ? De(p, A.mood) : p, K = G.steps(F, A), Y = td(K, { at: H, from: F });
      v.push(...Y), p = Y[Y.length - 1].pose, N = H + Math.max($2(K), A.for ?? 0);
    } else if (eh(A.do)) {
      const F = Wc(A.do, { at: H, from: A.mood ? De(p, A.mood) : p });
      v.push(...F), p = F[F.length - 1].pose, N = H + $o(A.do), A.do === "take" && P.push({ kind: "dust", time: H + 900, x: d, y: f, length: 500 }), A.do === "land" && P.push({ kind: "dust", time: H + 120, x: d, y: f, length: 500 });
    } else if (A.do === "look" || A.do === "face") {
      const F = A.toward ?? "viewer", K = A.for ?? X2;
      if (F === "viewer") E(H + ge, { turn: 0, lookX: 0, lookY: 0, ...j }, A.mood);
      else if (F === "ahead") E(H + ge, { turn: A.do === "face" ? 1 : 0.6, lookX: 1, ...j }, A.mood);
      else if (F === "back") E(H + ge, { turn: 0.2, lookX: -1, ...j }, A.mood);
      else {
        const Y = _(F);
        Y !== g && A.do === "face" ? (O(H, Y, A.mood), E(H + gn + 1, { lookX: 1, ...j })) : Y !== g ? E(H + ge, { turn: 0.25, lookX: -1, ...j }, A.mood) : E(H + ge, { turn: A.do === "face" ? 1 : 0.6, lookX: 1, ...j }, A.mood);
      }
      N = H + Math.max(K, ge);
    } else if (V2(A.do) || A.do === "stand") {
      const F = A.do === "stand" ? n.rest ?? lt : Zt[A.do], K = F.turn !== lt.turn ? F.turn : p.turn, Y = A.mood ? vt[A.mood] : { lookX: p.lookX, lookY: p.lookY };
      E(H + ge, { ...F, turn: K, ...Y, ...j }), N = H + (A.for ?? Yi);
    } else {
      const F = A.for ?? (A.say ? J2(A.say) : Yi);
      (A.mood || A.pose) && E(H + Math.min(ge, F / 2), j, A.mood), N = H + F;
    }
    if (A.say) {
      const F = r(A.do) || eh(A.do) || G ? H : H + Math.min(150, (N - H) / 4), K = r(A.do) ? N : Math.max(F + 200, N - 100);
      k.push({ text: A.say, start: F, end: K }), A.do === "say" && ek(v, p, F, K);
    }
    A.onto !== void 0 && A.do !== "leap" && A.onto !== f && (y.push({ time: H, value: f - h }, { time: N, value: A.onto - h, easing: "ease-in-out" }), f = A.onto), N > v[v.length - 1].time && v.push({ time: N, pose: p }), x.push({ start: H, end: N, ...z !== void 0 ? { contact: z } : {}, ...W !== void 0 ? { release: W } : {} }), b = N;
  }
  const D = k2(t, tk(v), n), I = [
    { id: `${t}-x`, target: t, property: "x", keyframes: w },
    { id: `${t}-y`, target: t, property: "y", keyframes: y },
    { id: `${t}-walk`, target: t, property: "walk", keyframes: T },
    { id: `${t}-walking`, target: t, property: "walking", keyframes: $ },
    { id: `${t}-gait`, target: t, property: "gait", keyframes: M },
    { id: `${t}-facing`, target: t, property: "facing", keyframes: S }
  ].filter(
    (A) => A.keyframes.length > 1 || A.property === "x" || // Starting left is kept even if it never turns: a figure target faces right unless told.
    A.property === "facing" && A.keyframes[0].value === -1
  );
  return {
    tracks: [...xa(t, D, k, { energy: n.energy }), ...I],
    duration: b,
    lines: k,
    keys: v,
    beats: x,
    effects: P
  };
}
const Z2 = (t) => Math.max(-1, Math.min(1, t)), Q2 = 30;
function tk(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && n.time - s.time < Q2 ? e[e.length - 1] = { ...n, time: s.time } : e.push(n);
  }
  return e;
}
function ek(t, e, n, s) {
  const i = t.filter((l) => l.time > n), r = t.filter((l) => l.time <= n), a = [];
  for (let l = n + 520, c = 0; l < s - 520 / 2; l += 520, c++) {
    const h = c % 2 === 0 ? 3 : -2;
    a.push({ time: l, pose: { ...e, headTilt: e.headTilt + h, leftBrow: e.leftBrow + (c % 2 === 0 ? 0.25 : 0), rightBrow: e.rightBrow + (c % 2 === 0 ? 0.25 : 0) } });
  }
  a.length > 0 && a.push({ time: s, pose: e }), t.length = 0, t.push(...r, ...a.filter((l) => !i.some((c) => Math.abs(c.time - l.time) < 60)), ...i), t.sort((l, c) => l.time - c.time);
}
function od(t, e, n) {
  const s = new It({ id: `${t}-hand`, tracks: e.filter((l) => l.target === t) }), o = N0({ x: n.x, y: n.y, style: n.style, cast: n.cast }), i = n.side ?? "right", r = n.every ?? 33, a = [];
  for (let l = n.start; ; l = Math.min(n.end, l + r)) {
    const { joints: c } = D0(o, { time: l, state: s.getStateAtTime(l) }, t), h = c.hands[i], u = c.fingertips[i];
    if (a.push({ time: l, x: (h.x + u.x) / 2, y: (h.y + u.y) / 2 }), l >= n.end) break;
  }
  return a;
}
const as = ["start", "contact", "release", "end"], nk = ["surface", "edit", "anchor", "at", "until"], sk = ["carry"], eo = (t) => !!t && typeof t == "object" && !Array.isArray(t) && "surface" in t && "anchor" in t, ok = (t) => t.then === void 0 ? [] : Array.isArray(t.then) ? t.then : [t.then];
function Zx(t, e, n, s = {}) {
  const o = ik(n, e, s).filter((d) => d.level === "error");
  if (o.length > 0)
    throw new Error(`surfaceScript: ${o.length} problem(s) in the beats:
${o.map((d) => `  ${d.beat >= 0 ? `beat ${d.beat}: ` : ""}${d.message}`).join(`
`)}`);
  const i = n.map((d) => id(d, e)), r = $a(t, i, s), a = rk(i, r.beats, s), l = s.ground ?? 0, c = (d) => s.ride === !1 ? d : Object.values(e).reduce((f, g) => g.ride(f, t, { ground: l }), d);
  n.forEach((d, f) => {
    for (const g of ok(d)) {
      const p = (y) => new Error(`surfaceScript: beat ${f} (${d.do}), ${g.edit} on ${g.surface}: ${y}`), m = (y, T) => {
        const $ = typeof y == "object" ? y.beat : f, M = (typeof y == "object" ? y.at : y) ?? T ?? "start", S = a[$][M];
        if (S === void 0) {
          const k = as.filter((x) => a[$][x] !== void 0).join(", ");
          throw p(`beat ${$} (${n[$].do}) has no ${M} (it has ${k})`);
        }
        return S;
      }, b = e[g.surface], v = m(g.at ?? (a[f].contact !== void 0 ? "contact" : "start")), w = g.until === void 0 ? void 0 : m(g.until, "end");
      if (w !== void 0 && w < v) throw p(`it ends (${w} ms) before it starts (${v} ms)`);
      try {
        if (g.edit === "carry") {
          const T = b.piece(g.anchor), $ = od(t, c(r.tracks), {
            x: s.from ?? 0,
            y: l,
            style: s.figureStyle ?? (s.height ? { height: s.height } : void 0),
            cast: s,
            start: v,
            end: w
          });
          b.follow(T, $);
          continue;
        }
        const y = Object.fromEntries(Object.entries(g).filter(([T]) => !nk.includes(T)));
        b.edit(g.edit, g.anchor, { ...y, at: v, ...w !== void 0 ? { duration: w - v } : {} });
      } catch (y) {
        throw p(y.message);
      }
    }
  });
  const h = c(r.tracks), u = Object.entries(e).flatMap(([d, f]) => f.tracks(d));
  return { ...r, tracks: [...h, ...u], figureTracks: h };
}
function ik(t, e, n = {}) {
  if (!Array.isArray(t)) return Po(t, n);
  const s = [], o = Object.keys(e), i = (c, h, u) => {
    const d = typeof h == "string" ? e[h] : void 0;
    return d || s.push({ level: "error", beat: c, message: `${u}: ${ut("surface", h, o)}` }), d;
  }, r = (c, h, u, d) => {
    if (typeof u != "string") {
      s.push({ level: "error", beat: c, message: `${d}: \`anchor\` is a place name such as ${Object.keys(h.about.anchors).join(", ")} (got ${JSON.stringify(u)}).` });
      return;
    }
    try {
      h.anchor(u, 0);
    } catch (f) {
      s.push({ level: "error", beat: c, message: `${d}: ${f.message}` });
    }
  }, a = (c, h, u) => {
    const d = typeof h == "object" && h !== null ? h.at : h;
    if (typeof h == "object" && h !== null) {
      const f = h.beat;
      if ((typeof f != "number" || !Number.isInteger(f) || f < c || f >= t.length) && s.push({ level: "error", beat: c, message: `${u}: \`beat\` is the index of this beat or a later one, ${c} to ${t.length - 1} (got ${JSON.stringify(f)}).` }), d === void 0) return;
    }
    typeof d == "number" ? s.push({ level: "error", beat: c, message: `${u}: a cue starts at a moment of its beat (${as.join(", ")}), not at ms; set the beat's own \`at\` to move it.` }) : (typeof d != "string" || !as.includes(d)) && s.push({ level: "error", beat: c, message: `${u}: ${ut("moment", d, as)}` });
  };
  t.forEach((c, h) => {
    if (!c || typeof c != "object" || Array.isArray(c)) return;
    const u = c;
    for (const f of ["target", "to", "onto"]) {
      if (!eo(u[f])) continue;
      const g = u[f], p = i(h, g.surface, `\`${f}\``);
      p && r(h, p, g.anchor, `\`${f}\``);
    }
    if (u.then === void 0) return;
    (Array.isArray(u.then) ? u.then : [u.then]).forEach((f) => {
      if (!f || typeof f != "object" || Array.isArray(f)) {
        s.push({ level: "error", beat: h, message: "`then` is a cue, { surface, edit, anchor, at?, until? }, or a list of them." });
        return;
      }
      const g = f, p = i(h, g.surface, "`then`");
      if (!p) return;
      const m = `\`then\` (${String(g.edit)} on ${String(g.surface)})`, b = [...Object.keys(p.about.edits), ...sk];
      if (typeof g.edit != "string" || !b.includes(g.edit)) {
        s.push({ level: "error", beat: h, message: `\`then\`: ${ut("edit", g.edit, b)}` });
        return;
      }
      for (const v of Array.isArray(g.anchor) ? g.anchor : [g.anchor]) r(h, p, v, m);
      g.edit === "carry" && typeof g.anchor != "string" && s.push({ level: "error", beat: h, message: `${m}: \`carry\` takes one anchor, the piece it carries.` }), g.edit === "carry" && g.until === void 0 && s.push({ level: "error", beat: h, message: `${m}: \`carry\` needs \`until\` (when it lets go, such as { beat: ${h + 1}, at: 'release' }).` }), g.at !== void 0 && a(h, g.at, `${m} \`at\``), g.until !== void 0 && a(h, g.until, `${m} \`until\``), g.until !== void 0 && g.duration !== void 0 && s.push({ level: "error", beat: h, message: `${m}: give \`until\` or \`duration\`, not both.` });
    });
  });
  const l = t.map((c) => c && typeof c == "object" && !Array.isArray(c) ? id(c, e, !0) : c);
  return [...Po(l, n), ...s];
}
function id(t, e, n = !1) {
  const { then: s, ...o } = t, i = (a) => {
    try {
      return e[a.surface].anchor(a.anchor, 0);
    } catch (l) {
      if (n) return { x: 0, y: 0, left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
      throw l;
    }
  }, r = { ...o };
  return eo(t.target) && (r.target = i(t.target)), eo(t.to) && (r.to = i(t.to).x), eo(t.onto) && (r.onto = i(t.onto).top), r;
}
function rk(t, e, n) {
  let s = 0;
  return t.map((o) => {
    const i = Aa([o], n.actions).length, r = e.slice(s, s + i);
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
function Qx(t) {
  const e = { actions: t.actions, gaits: t.gaits }, n = nd(e);
  if (n.length > 0) throw new Error(`persona "${t.name}": ${n.join(" ")}`);
  const s = [...Object.keys(zt), ...Object.keys(t.gaits ?? {})], o = t.gait ?? "walk";
  if (!s.includes(o)) throw new Error(`persona "${t.name}": ${ut("gait", o, s)}`);
  if (t.mood && !(t.mood in vt)) throw new Error(`persona "${t.name}": ${ut("mood", t.mood, Object.keys(vt))}`);
  const i = t.acting ?? "snappy";
  if (typeof i == "string" && !(i in An)) throw new Error(`persona "${t.name}": ${ut("acting style", i, Object.keys(An))}`);
  if (typeof t.stance == "string" && !(t.stance in Zt)) throw new Error(`persona "${t.name}": ${ut("stance", t.stance, Object.keys(Zt))}`);
  const r = t.height ?? 120, a = typeof t.stance == "string" ? Zt[t.stance] : Ct(t.stance ?? {}), l = t.mood ? De(a, t.mood) : a, c = { ...t.look, height: r }, h = t.summary ?? `${t.name}, a stick figure`;
  return {
    name: t.name,
    summary: h,
    cast: e,
    rest: l,
    height: r,
    figure: (u) => N0({ x: u.x, y: u.y, pose: l, style: { ...c, ...u.facing ? { facing: u.facing } : {} }, cast: e }),
    script: (u, d, f = {}) => $a(u, d, {
      ...e,
      from: f.from,
      ground: f.ground,
      facing: f.facing,
      height: r,
      style: i,
      gait: o,
      start: l,
      rest: l,
      energy: t.energy
    }),
    check: (u) => Po(u, e),
    handPath: (u, d, f) => od(u, d, { ...f, style: c, cast: e }),
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
      actions: sd(e),
      own: { actions: Object.keys(t.actions ?? {}), gaits: Object.keys(t.gaits ?? {}) }
    })
  };
}
const ak = /* @__PURE__ */ new Set(["x", "y", "walking", "gait"]), nh = 0.215 + 0.205;
function lk(t, e, n = 1) {
  const { points: s } = ie(t, ht), o = s["hip.left"], i = s["knee.left"], r = s["ankle.left"], a = o && i && r ? Math.hypot(i.x - o.x, i.y - o.y) + Math.hypot(r.x - i.x, r.y - i.y) : nh * t.height;
  return wu(e, a / nh, n);
}
function tS(t, e, n, s = {}) {
  const o = $a(t, n, { ...s, height: e.height, reach: s.reach ?? ck(e) }), i = o.tracks.find((b) => b.property === "facing")?.keyframes ?? [], r = (b) => {
    let v = s.facing ?? 1;
    for (const w of i) w.time <= b && (v = w.value);
    return v;
  }, a = ta(o.keys), l = o.keys.map((b, v) => {
    const w = Lb(a[v]);
    return {
      time: b.time,
      pose: r(b.time) < 0 ? dy(w) : w,
      ...b.easing ? { easing: b.easing } : {},
      ...b.act === !1 ? { act: !1 } : {}
    };
  }), { rest: c, start: h, ...u } = s;
  dk(l, a, n, o, e, r, s);
  const d = v2(t, l, u), f = xa(t, d, o.lines, { energy: s.energy }), g = o.tracks.filter((b) => ak.has(b.property)), p = o.tracks.find((b) => b.property === "walk");
  return { tracks: p ? [...f, ...g, bk(t, p, o.tracks, e, s)] : [...f, ...g], duration: o.duration, lines: o.lines, keys: l, beats: o.beats, effects: o.effects };
}
function ck(t) {
  const e = wt({ "arm.left.spread": 90, "arm.left.elbow": 0, "arm.left.bend": 0, "leg.left.knee": 0 }), n = ie(t, e).points, s = Math.hypot(n["hand.left"].x - n["shoulder.left"].x, n["hand.left"].y - n["shoulder.left"].y), o = Math.hypot(n["toe.left"].x - n["hip.left"].x, n["toe.left"].y - n["hip.left"].y), i = le({ ...lt, rightShoulder: 90, rightElbow: 0, rightWrist: 0 }, { height: t.height, facing: 1 }), r = le({ ...lt, rightHip: 90, rightKnee: 0 }, { height: t.height, facing: 1 }), a = { x: (i.hands.right.x + i.fingertips.right.x) / 2, y: (i.hands.right.y + i.fingertips.right.y) / 2 }, l = Math.hypot(a.x - i.shoulders.right.x, a.y - i.shoulders.right.y), c = Math.hypot(r.feet.right.x - r.hip.x, r.feet.right.y - r.hip.y);
  return { arm: l > 0 ? s / l : 1, leg: c > 0 ? o / c : 1 };
}
const hk = { point: "arm", grab: "arm", put: "arm", write: "arm", swipe: "arm", push: "arm", kick: "leg" }, uk = /* @__PURE__ */ new Set(["point", "grab", "put", "kick"]);
function dk(t, e, n, s, o, i, r) {
  const a = s.beats;
  if (n.length !== a.length) return;
  const l = new It({ id: "placed", tracks: s.tracks.filter((h) => h.property === "x" || h.property === "y") }), c = (h) => {
    const u = l.getStateAtTime(h).values.get(s.tracks[0]?.target ?? "");
    return { x: (r.from ?? 0) + Number(u?.get("x") ?? 0), y: (r.ground ?? 0) + Number(u?.get("y") ?? 0) };
  };
  n.forEach((h, u) => {
    const d = hk[h.do], f = a[u];
    if (!d || f.contact === void 0 || h.do !== "swipe" && !h.target) return;
    const g = f.contact, p = f.release ?? f.contact;
    t.forEach((m, b) => {
      if (m.time < g - 1 || m.time > p + 1) return;
      const v = i(m.time), w = le(e[b], { height: o.height, facing: v < 0 ? -1 : 1 }), y = c(m.time), T = uk.has(h.do) && h.target ? { x: h.target.x - y.x, y: h.target.y - y.y } : void 0, $ = { x: (w.hands.right.x + w.fingertips.right.x) / 2, y: (w.hands.right.y + w.fingertips.right.y) / 2 }, M = T ?? (d === "arm" ? $ : w.toes.right), S = v < 0 ? "right" : "left", k = `${d}.${S}`;
      let x = m.pose;
      if (h.do === "point")
        x = He(o, x, k, M);
      else if (d === "arm")
        x = He(o, yk(o, x, S, M), k, M);
      else
        for (let P = 0; P < 3; P++) {
          const E = ie(o, x).points, O = E[`ankle.${S}`], _ = E[`toe.${S}`];
          x = He(o, x, k, { x: M.x - (_.x - O.x), y: M.y - (_.y - O.y) });
        }
      t[b] = { ...m, pose: x };
    });
  });
}
function fk(t, e) {
  const n = wt({ [`arm.${e}.spread`]: 90, [`arm.${e}.elbow`]: 0, [`arm.${e}.bend`]: 0 }), s = ie(t, n).points;
  return Math.hypot(s[`hand.${e}`].x - s[`shoulder.${e}`].x, s[`hand.${e}`].y - s[`shoulder.${e}`].y);
}
const pk = 5, gk = 4, mk = 8;
function yk(t, e, n, s) {
  const o = fk(t, n) * 0.9, i = (a) => {
    const l = ie(t, a).points[`shoulder.${n}`];
    return Math.hypot(s.x - l.x, s.y - l.y) <= o;
  };
  if (i(e)) return e;
  let r = e;
  for (let a = 1; a <= mk; a++)
    if (r = { ...e, lean: (e.lean ?? 0) + pk * a, bend: (e.bend ?? 0) + gk * a }, i(r)) return r;
  return r;
}
function bk(t, e, n, s, o) {
  const i = n.find((u) => u.property === "gait"), r = i ? new It({ id: `${t}-gait-of`, tracks: [i] }) : void 0, a = (u) => {
    const d = r?.getStateAtTime(u).values.get(t)?.get("gait");
    if (typeof d == "string")
      return zt[d] ?? o.gaits?.[d] ?? d;
  }, l = e.keyframes, c = [];
  let h = l[0]?.value ?? 0;
  return l.forEach((u, d) => {
    if (d > 0) {
      const f = l[d - 1], g = a((f.time + u.time) / 2), p = ur(g, s.height), m = lk(s, g);
      h += (u.value - f.value) * (m > 0 ? p / m : 1);
    } else
      h = u.value;
    c.push({ ...u, value: h });
  }), { ...e, keyframes: c };
}
const pt = ["rect", "circle", "text", "line", "path", "image", "custom"], wk = ["rect", "circle", "line", "path"], Pa = {
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
  drawOn: { description: "How much of the outline is drawn, for drawing a shape on; the fill appears when it is complete", unit: "0..1", min: 0, max: 1, types: wk },
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
}, Or = { fillStyle: "fill", strokeStyle: "stroke", lineWidth: "strokeWidth", rotateZ: "rotate", motionPathX: "x", motionPathY: "y", motionPathRotate: "rotate" }, kk = {
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
function vk(t) {
  const e = t, n = Object.entries(Pa).filter(([, o]) => o.types.includes(t.type)).map(([o, { types: i, ...r }]) => ({ name: o, ...r, ...e[o] !== void 0 && typeof e[o] != "object" ? { value: e[o] } : {} }));
  if (t.type !== "custom") return { type: t.type, properties: n };
  const s = t.about;
  for (const [o, i] of Object.entries(t.props ?? {}))
    n.push({ name: o, description: s?.props?.[o]?.description ?? "", ...s?.props?.[o], value: i });
  return { type: "custom", ...s ? { kind: s.kind, summary: s.summary } : {}, properties: n, ...s?.actions ? { actions: s.actions } : {} };
}
function Mk(t) {
  const e = vk(t).properties.map((n) => n.name);
  return [...e, ...Object.keys(Or).filter((n) => e.includes(Or[n]))];
}
function eS(t, e) {
  const n = [], s = Object.keys(e);
  for (const o of t) {
    const i = (d) => n.push({ level: "error", track: o.id, message: d }), r = e[o.target];
    if (!r) {
      i(ut("target", o.target, s));
      continue;
    }
    const a = Mk(r), l = r.type === "custom" && r.acceptsProp?.(o.property);
    if (!a.includes(o.property) && !l) {
      i(`${o.target}: ${ut("property", o.property, a, kk[o.property])}`);
      continue;
    }
    const c = o.keyframes ?? [];
    for (let d = 1; d < c.length; d++)
      c[d].time < c[d - 1].time && i(`${o.target}.${o.property}: keyframes out of time order (${c[d - 1].time} ms, then ${c[d].time} ms).`);
    const h = Pa[Or[o.property] ?? o.property] ?? r.about?.props?.[o.property], u = h && (h.kind ?? "number") === "number";
    for (const d of c) {
      if (u && typeof d.value != "number") {
        i(`${o.target}.${o.property}: values are numbers${h.unit ? ` (${h.unit})` : ""} (got ${JSON.stringify(d.value)} at ${d.time} ms).`);
        break;
      }
      if (u && typeof d.value == "number" && (h.min !== void 0 && d.value < h.min || h.max !== void 0 && d.value > h.max)) {
        n.push({ level: "warning", track: o.id, message: `${o.target}.${o.property}: ${d.value} at ${d.time} ms is outside ${h.min ?? "−∞"}..${h.max ?? "∞"}${h.unit ? ` (${h.unit})` : ""}.` });
        break;
      }
    }
  }
  return n;
}
const Pn = (t, e) => t[2] <= -e;
function _r(t, e, n) {
  const s = (-n - t[2]) / (e[2] - t[2]);
  return [t[0] + (e[0] - t[0]) * s, t[1] + (e[1] - t[1]) * s, -n];
}
function sh(t, e) {
  if (t.every((s) => Pn(s, e))) return t;
  const n = [];
  return t.forEach((s, o) => {
    const i = t[(o + t.length - 1) % t.length], r = Pn(s, e), a = Pn(i, e);
    r !== a && n.push(_r(i, s, e)), r && n.push(s);
  }), n.length >= 3 ? n : [];
}
function xk(t, e) {
  if (t.every((o) => Pn(o, e))) return [t];
  const n = [];
  let s = [];
  return t.forEach((o, i) => {
    const r = Pn(o, e);
    if (i > 0) {
      const a = t[i - 1], l = Pn(a, e);
      l && !r ? (s.push(_r(a, o, e)), n.push(s), s = []) : !l && r && s.push(_r(a, o, e));
    }
    r && s.push(o);
  }), s.length > 0 && n.push(s), n.filter((o) => o.length >= 2);
}
function oh(t, e, n) {
  const s = e - t;
  if (!(s >= n * 1.5)) return [t, e];
  const o = Math.round(s / n);
  return Array.from({ length: o + 1 }, (i, r) => t + s * r / o);
}
function Sk(t, e, n) {
  const s = (o, i) => Math.max(0, Math.min(o.length - 2, o.findIndex((r, a) => a > 0 && i <= r) - 1));
  return [s(t, n[0]), s(e, n[2])];
}
function Tk(t, e) {
  const n = (s) => {
    const o = [e[0] * s[0] + e[4] * s[1] + e[8] * s[2], e[1] * s[0] + e[5] * s[1] + e[9] * s[2], e[2] * s[0] + e[6] * s[1] + e[10] * s[2]], i = Math.hypot(...o) || 1;
    return [o[0] / i, o[1] / i, o[2] / i];
  };
  return { ...t, vertices: t.vertices.map((s) => jt(e, s)), faces: t.faces.map((s) => ({ corners: s.corners, normal: n(s.normal) })) };
}
function Ys(t, e, n, s) {
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
function Ek(t, e, n) {
  const s = t.faces.map((r) => ({ points: r.corners.map((a) => t.vertices[a]), normal: r.normal })), o = [], i = { x: e.slice(1, -1), z: n.slice(1, -1) };
  for (let r = 0; r + 1 < e.length; r++)
    for (let a = 0; a + 1 < n.length; a++) {
      const l = [], c = /* @__PURE__ */ new Map(), h = (g) => {
        const p = g.map((b) => Math.round(b * 1e6)).join(",");
        let m = c.get(p);
        return m === void 0 && (m = l.length, l.push(g), c.set(p, m)), m;
      }, u = [], d = (g) => g === 0, f = (g, p) => g + 2 === p.length;
      for (const g of s) {
        let p = g.points;
        d(r) || (p = Ys(p, 0, e[r], 1)), p.length && !f(r, e) && (p = Ys(p, 0, e[r + 1], -1)), p.length && !d(a) && (p = Ys(p, 2, n[a], 1)), p.length && !f(a, n) && (p = Ys(p, 2, n[a + 1], -1)), p.length >= 3 && u.push({ corners: p.map(h), normal: g.normal });
      }
      u.length > 0 && o.push({ cell: [r, a], mesh: { vertices: l, faces: u, creases: t.creases, joined: t.joined, walls: i } });
    }
  return o;
}
const Ak = /* @__PURE__ */ new WeakMap(), $k = /* @__PURE__ */ new WeakMap(), Pk = 48, rd = (t) => t.map((e) => Math.round(e * 1e5)).join(",");
function ad(t, e, n, s) {
  let o = t.get(e);
  o || t.set(e, o = /* @__PURE__ */ new Map());
  let i = o.get(n);
  return i === void 0 && (o.size >= Pk && o.clear(), o.set(n, i = s())), i;
}
function Ia(t, e) {
  const n = rd(e);
  return ad(Ak, t, n, () => {
    const s = Tk(t, e), o = [1 / 0, 1 / 0, 1 / 0], i = [-1 / 0, -1 / 0, -1 / 0];
    for (const r of s.vertices) for (const a of [0, 1, 2])
      o[a] = Math.min(o[a], r[a]), i[a] = Math.max(i[a], r[a]);
    return { key: n, inSpace: s, low: o, high: i };
  });
}
function Ik(t, e) {
  const n = t.map((h) => ({ ...h, ...Ia(h.mesh, h.local) })), s = [1 / 0, 1 / 0, 1 / 0], o = [-1 / 0, -1 / 0, -1 / 0];
  for (const h of n) for (const u of [0, 1, 2])
    s[u] = Math.min(s[u], h.low[u]), o[u] = Math.max(o[u], h.high[u]);
  const i = oh(s[0], o[0], e), r = oh(s[2], o[2], e), a = `${i.join(",")}|${r.join(",")}`, l = n.flatMap((h) => {
    if (h.high[0] - h.low[0] <= e * 2.5 && h.high[2] - h.low[2] <= e * 2.5 || h.whole || h.mesh.joined || (h.mesh.marks?.length ?? 0) > 0) {
      const d = [(h.low[0] + h.high[0]) / 2, (h.low[1] + h.high[1]) / 2, (h.low[2] + h.high[2]) / 2];
      return [{ part: h.part, mesh: h.mesh, cut: !1, cell: Sk(i, r, d) }];
    }
    return ad($k, h.inSpace, a, () => Ek(h.inSpace, i, r)).map((d) => ({ part: h.part, mesh: d.mesh, cut: !0, cell: d.cell }));
  }), c = (s[1] + o[1]) / 2;
  return { pieces: l, middle: ([h, u]) => [(i[h] + i[h + 1]) / 2, c, (r[u] + r[u + 1]) / 2] };
}
const ih = 4e-3, ji = 0.05, rh = /* @__PURE__ */ new WeakMap();
function Ok(t) {
  let e = rh.get(t);
  return e === void 0 && (e = !t.joined && !t.walls && t.faces.length >= 4 && t.faces.every((n) => {
    const s = t.vertices[n.corners[0]];
    return t.vertices.every((o) => n.normal[0] * (o[0] - s[0]) + n.normal[1] * (o[1] - s[1]) + n.normal[2] * (o[2] - s[2]) <= 1e-6);
  }), rh.set(t, e)), e;
}
const ah = /* @__PURE__ */ new WeakMap();
function ld(t) {
  return t.filter(({ mesh: e }) => Ok(e)).map(({ part: e, key: n, inSpace: s, low: o, high: i }) => {
    let r = ah.get(s);
    return r || (r = s.faces.map((a) => {
      const l = s.vertices[a.corners[0]];
      return { normal: a.normal, offset: a.normal[0] * l[0] + a.normal[1] * l[1] + a.normal[2] * l[2] };
    }), ah.set(s, r)), { part: e, key: n, planes: r, low: o, high: i };
  });
}
function _k(t, e, n, s) {
  const o = e.reduce((i, r) => [i[0] + r[0] / e.length, i[1] + r[1] / e.length, i[2] + r[2] / e.length], [0, 0, 0]);
  for (const i of s) {
    if (i.part === t || [0, 1, 2].some((a) => o[a] < i.low[a] - ji || o[a] > i.high[a] + ji)) continue;
    if (i.planes.every((a) => {
      const l = a.normal[0] * n[0] + a.normal[1] * n[1] + a.normal[2] * n[2], c = e.map((u) => a.normal[0] * u[0] + a.normal[1] * u[1] + a.normal[2] * u[2] - a.offset);
      if (c.every((u) => Math.abs(u) <= ih)) return l < -0.9;
      const h = Math.abs(l) < 0.5 ? ji : ih;
      return c.every((u) => u <= h);
    })) return !0;
  }
  return !1;
}
const lh = /* @__PURE__ */ new WeakMap();
function cd(t, e, n, s, o) {
  const i = `${s}|${o.map((l) => l.key).join(";")}`;
  let r = lh.get(e);
  r || lh.set(e, r = /* @__PURE__ */ new Map());
  let a = r.get(i);
  if (!a) {
    r.size >= 48 && r.clear();
    const l = (h) => {
      const u = [n[0] * h[0] + n[4] * h[1] + n[8] * h[2], n[1] * h[0] + n[5] * h[1] + n[9] * h[2], n[2] * h[0] + n[6] * h[1] + n[10] * h[2]], d = Math.hypot(...u) || 1;
      return [u[0] / d, u[1] / d, u[2] / d];
    }, c = e.vertices.map((h) => jt(n, h));
    a = e.faces.map((h) => _k(t, h.corners.map((u) => c[u]), l(h.normal), o)), r.set(i, a);
  }
  return a;
}
const Ts = {
  turn: { description: "Which way it faces: 0 toward the viewer, 1 screen-right, 2 away, 3 (or −1) screen-left; in between turns it in 3D", unit: "quarter turns" },
  tilt: { description: "How far the camera looks down on it: 0 level, 12 the ¾ look, 90 straight down", unit: "degrees", default: 12, min: -90, max: 90 },
  pitch: { description: "Nose up (+) or down (−), about its middle on the ground", unit: "degrees" },
  roll: { description: "Tipped onto its right (+) or left (−) side", unit: "degrees" },
  squash: { description: "Squash and stretch about the ground, keeping its volume: 1 normal, below squashed, above stretched", unit: "factor", default: 1, min: 0.3, max: 3 },
  lift: { description: "Off the ground", unit: "metres" },
  lean: { description: "The top sheared forward (+) or back (−): speed and drag", unit: "shear" },
  size: { description: "Its size, about the ground: 1 as built, 0 gone (pop it in or out)", unit: "factor", default: 1, min: 0 }
}, Hr = Math.PI / 180;
function Hk(t, e, n) {
  return {
    toView: (s) => oa(Jt(s, t * 90 * Hr), -e * Hr),
    toScreen: (s) => ({ x: s[0] * n, y: -s[1] * n })
  };
}
const ch = /* @__PURE__ */ new WeakMap(), Io = (t) => no(t), no = (t) => {
  let e = ch.get(t);
  return e || ch.set(t, e = dw(t)), e;
};
function Tt(t, e, n) {
  return e[n] ?? t.controls[n]?.default ?? Ts[n]?.default ?? 0;
}
function ws(t, e) {
  const n = Math.max(0.05, Tt(t, e, "squash")), s = 1 / Math.sqrt(n), i = [1, 0, 0, 0, 0, 1, Tt(t, e, "lean"), 0, 0, 0, 1, 0, 0, 0, 0, 1];
  return [
    Ne([0, Tt(t, e, "lift"), 0]),
    oe(Vt([1, 0, 0], -Tt(t, e, "pitch"))),
    oe(Vt([0, 0, 1], Tt(t, e, "roll"))),
    i,
    Ke([s, n, s]),
    Ke(Array(3).fill(Math.max(0, Tt(t, e, "size"))))
  ].reduce((r, a) => At(r, a));
}
function Oa(t, e) {
  const n = ws(t, e), s = /* @__PURE__ */ new Map(), o = Object.entries(t.controls).flatMap(([r, a]) => (a.bind ?? []).map((l) => ({ value: Tt(t, e, r), bind: l }))), i = (r) => {
    const a = s.get(r.id);
    if (a) return a;
    const l = r.parent ? t.parts.find((h) => h.id === r.parent) : void 0;
    if (r.parent && !l) throw new Error(`prop rig: part "${r.id}" hangs from "${r.parent}", which is not a part`);
    let c = At(l ? i(l) : n, Ne(r.at ?? [0, 0, 0]));
    if (r.rotate) {
      const [h, u, d] = r.rotate;
      h && (c = At(c, oe(Vt([1, 0, 0], h)))), u && (c = At(c, oe(Vt([0, 1, 0], u)))), d && (c = At(c, oe(Vt([0, 0, 1], d))));
    }
    for (const { value: h, bind: u } of o)
      if (!(!u.parts.includes(r.id) || h === 0)) {
        if (u.translate && (c = At(c, Ne([u.translate[0] * h, u.translate[1] * h, u.translate[2] * h]))), u.rotate) {
          const d = u.rotate.pivot ?? [0, 0, 0], f = u.rotate.axis === "x" ? [1, 0, 0] : u.rotate.axis === "y" ? [0, 1, 0] : [0, 0, 1];
          c = [c, Ne(d), oe(Vt(f, u.rotate.degrees * h)), Ne([-d[0], -d[1], -d[2]])].reduce((g, p) => At(g, p));
        }
        u.scale && (c = At(c, Ke([1 + (u.scale[0] - 1) * h, 1 + (u.scale[1] - 1) * h, 1 + (u.scale[2] - 1) * h])));
      }
    return s.set(r.id, c), c;
  };
  for (const r of t.parts) i(r);
  return s;
}
const Ki = (() => {
  const t = [-0.45, 0.75, 0.5], e = Math.hypot(...t);
  return [t[0] / e, t[1] / e, t[2] / e];
})(), Ck = Math.cos(35 * Hr);
function hd(t, e, n, s, o = {}) {
  const i = t.derive ? { ...e, ...t.derive(e) } : e, r = Oa(t, i), a = n.toView([0, 0, 0]), l = (_) => (L) => [_[0] * L[0] + _[4] * L[1] + _[8] * L[2], _[1] * L[0] + _[5] * L[1] + _[9] * L[2], _[2] * L[0] + _[6] * L[1] + _[10] * L[2]], c = ws(t, i), h = o.slice === void 0 ? null : jr(c), u = h ? t.parts.map((_) => ({ part: _, mesh: no(_.shape), local: At(h, r.get(_.id)), whole: _.shape.type === "tube" })) : void 0, d = u ? Ik(u, o.slice) : void 0, f = u ? ld(u.map((_) => ({ part: _.part.id, mesh: _.mesh, ...Ia(_.mesh, _.local) }))) : void 0, g = (_, L, B, X) => {
    const J = (U) => n.toView(jt(B, U)), q = L.vertices.map(J), R = q.map((U) => n.toScreen(U)), D = o.perspective ? o.near : void 0, I = (U) => U.map((st) => n.toScreen(st)), A = (U) => D === void 0 ? U : sh(U, D), H = (U) => D === void 0 ? [U] : xk(U, D), N = l(B), z = L.faces.map((U) => {
      const st = n.toView(N(U.normal)), ct = [st[0] - a[0], st[1] - a[1], st[2] - a[2]], dt = Math.hypot(...ct) || 1;
      return [ct[0] / dt, ct[1] / dt, ct[2] / dt];
    }), W = f && X ? cd(_.id, L, X, rd(X), f) : void 0, j = (U) => W?.[U] ?? !1, G = z.map((U, st) => {
      if (j(st)) return !1;
      if (!o.perspective) return U[2] > 1e-6;
      const dt = L.faces[st].corners.reduce((yt, mt) => [yt[0] + q[mt][0], yt[1] + q[mt][1], yt[2] + q[mt][2]], [0, 0, 0]);
      return -(U[0] * dt[0] + U[1] * dt[1] + U[2] * dt[2]) > 1e-9;
    }), F = (U) => L.faces[U].corners.reduce((st, ct) => st + q[ct][2], 0) / L.faces[U].corners.length, K = L.faces.map((U, st) => ({ face: U, i: st })).filter(({ i: U }) => G[U]).map(({ face: U, i: st }) => ({
      i: st,
      solved: {
        points: D === void 0 ? U.corners.map((ct) => R[ct]) : I(A(U.corners.map((ct) => q[ct]))),
        depth: F(st),
        tone: 0.72 + 0.33 * Math.max(0, z[st][0] * Ki[0] + z[st][1] * Ki[1] + z[st][2] * Ki[2])
      }
    })).filter((U) => U.solved.points.length >= 3).sort((U, st) => U.solved.depth - st.solved.depth);
    if (o.light) {
      const U = l(B);
      for (const { i: st, solved: ct } of K) {
        const dt = L.faces[st].corners, yt = dt.reduce((ii, xd) => {
          const ri = jt(B, L.vertices[xd]);
          return [ii[0] + ri[0] / dt.length, ii[1] + ri[1] / dt.length, ii[2] + ri[2] / dt.length];
        }, [0, 0, 0]), mt = U(L.faces[st].normal), Kt = Math.hypot(...mt) || 1, Dn = o.light(yt, [mt[0] / Kt, mt[1] / Kt, mt[2] / Kt]);
        ct.light = Dn.light, ct.fog = Dn.fog;
      }
    }
    const Y = K.map((U) => U.solved), Z = Rk(L), tt = [], it = [];
    for (const [U, st] of Z) {
      const ct = st.filter((yt) => G[yt]).length;
      if (ct === 0) continue;
      const dt = st.length === 2 && ct === 2 && L.creases !== !1 && z[st[0]][0] * z[st[1]][0] + z[st[0]][1] * z[st[1]][1] + z[st[0]][2] * z[st[1]][2] < Ck;
      st.length === 1 && (L.joined || Wk(L, U)) || (st.length === 1 || ct === 1 || dt) && (tt.push(U.split("-").map(Number)), it.push(st.filter((yt) => G[yt]).reduce((yt, mt) => F(mt) > F(yt) ? mt : yt)));
    }
    const rt = (U) => L.faces.findIndex((st) => st.corners.length > 4 && Math.sign(Dk(L.vertices[U], st.normal)) > 0), C = (L.marks ?? []).filter(([U]) => rt(U) < 0 || G[rt(U)]), V = ([U, st]) => D === void 0 ? [[R[U], R[st]]] : H([q[U], q[st]]).map(I), et = C.flatMap(V), ot = (U) => D === void 0 ? [U.map((st) => R[st])] : H(U.map((st) => q[st])).map(I);
    if (o.slice !== void 0) {
      const U = /* @__PURE__ */ new Map();
      tt.forEach((st, ct) => U.set(it[ct], [...U.get(it[ct]) ?? [], st]));
      for (const { i: st, solved: ct } of K) {
        ct.edges = uh(U.get(st) ?? []).flatMap(ot);
        const dt = L.faces[st].corners;
        ct.center = dt.reduce((mt, Kt) => [mt[0] + q[Kt][0] / dt.length, mt[1] + q[Kt][1] / dt.length, mt[2] + q[Kt][2] / dt.length], [0, 0, 0]), ct.normal = z[st];
        const yt = K[K.length - 1].i;
        ct.marks = C.filter(([mt]) => (rt(mt) >= 0 ? rt(mt) : yt) === st).flatMap(V);
      }
    }
    const nt = _.glow ? Math.max(0, Math.min(1, Tt(t, i, _.glow.control))) : 0, at = _.fade ? Math.max(0, Math.min(1, Tt(t, i, _.fade.control))) : 0, Q = _.fade ? Math.max(0, Math.min(1, _.fade.from + (_.fade.to - _.fade.from) * at)) : 1;
    return {
      part: _,
      depth: q.reduce((U, st) => U + st[2], 0) / Math.max(1, q.length),
      faces: Y,
      edges: uh(tt).flatMap(ot),
      marks: et,
      glow: nt,
      opacity: Q,
      ..._.shape.type === "tube" ? { spine: Nk(H(_.shape.points.map(J)).map(I)) } : {},
      ...L.walls ? { cut: !0 } : {}
    };
  }, p = new Map(u?.map((_) => [_.part.id, _.local])), b = (d ? d.pieces.map((_) => ({
    part: _.part,
    mesh: _.mesh,
    // A cut piece is already in rest space: the body's matrix places it.
    m: _.cut ? c : r.get(_.part.id),
    local: _.cut ? No() : p.get(_.part.id),
    cell: _.cell
  })) : t.parts.map((_) => ({ part: _, mesh: no(_.shape), m: r.get(_.id), local: void 0, cell: void 0 }))).map((_) => ({ cell: _.cell, solved: g(_.part, _.mesh, _.m, _.local) })), v = b.map((_) => _.solved), w = (_) => _.filter((L) => L.faces.length > 0 && L.opacity > 0.01).sort((L, B) => L.depth - B.depth);
  let y;
  if (d) {
    const _ = new Map(t.parts.map((B) => {
      const X = r.get(B.id), J = no(B.shape).vertices;
      return [B.id, J.reduce((q, R) => q + n.toView(jt(X, R))[2], 0) / Math.max(1, J.length)];
    })), L = /* @__PURE__ */ new Map();
    for (const B of b) {
      const X = B.cell.join(",");
      L.has(X) || L.set(X, { cell: B.cell, parts: [] }), L.get(X).parts.push(B.solved), B.solved.depth = _.get(B.solved.part.id);
    }
    y = [...L.values()].map(({ cell: B, parts: X }) => ({ depth: n.toView(jt(c, d.middle(B)))[2], parts: w(X) })).filter((B) => B.parts.length > 0);
  }
  const T = {};
  for (const [_, L] of Object.entries(t.anchors ?? {})) {
    const B = L.part ? r.get(L.part) : ws(t, i);
    if (!B) throw new Error(`prop rig: anchor "${_}" is on "${L.part}", which is not a part`);
    const X = n.toView(jt(B, L.at));
    T[_] = { point: n.toScreen(X), depth: X[2] };
  }
  const [$, M] = t.footprint ?? [t.length * 0.45, t.length], S = Math.max(0, Tt(t, i, "lift")), k = Math.max(0, Tt(t, i, "size")) / (1 + S * 0.8), x = Array.from({ length: 24 }, (_, L) => {
    const B = Math.PI * 2 * L / 24;
    return n.toView([Math.cos(B) * $ * 0.55 * k, 0, Math.sin(B) * M * 0.55 * k]);
  }), P = o.perspective ? o.near : void 0, E = {
    points: (P === void 0 ? x : sh(x, P)).map((_) => n.toScreen(_)),
    opacity: 0.16 * k
  }, O = v.filter((_) => _.part.seeThrough && _.opacity > 0.01).flatMap((_) => _.faces.map((L) => L.points));
  return { under: w(v.filter((_) => !_.part.overRider)), over: w(v.filter((_) => _.part.overRider)), ...y ? { cells: y } : {}, anchors: T, openings: O, shadow: E, pxPerUnit: s, sizePx: t.height * s };
}
const hh = /* @__PURE__ */ new WeakMap();
function Rk(t) {
  let e = hh.get(t);
  if (!e) {
    e = /* @__PURE__ */ new Map();
    for (let n = 0; n < t.faces.length; n++) {
      const s = t.faces[n].corners;
      for (let o = 0; o < s.length; o++) {
        const i = s[o], r = s[(o + 1) % s.length], a = i < r ? `${i}-${r}` : `${r}-${i}`, l = e.get(a);
        l ? l.push(n) : e.set(a, [n]);
      }
    }
    hh.set(t, e);
  }
  return e;
}
function Lk(t, e) {
  const n = t.derive ? { ...e, ...t.derive(e) } : e, s = Oa(t, n), o = jr(ws(t, n)) ?? No(), i = (r) => Math.max(0, Math.min(1, r));
  return t.parts.map((r) => {
    const a = r.fade ? i(Tt(t, n, r.fade.control)) : 0;
    return {
      part: r,
      matrix: s.get(r.id),
      local: At(o, s.get(r.id)),
      glow: r.glow ? i(Tt(t, n, r.glow.control)) : 0,
      opacity: r.fade ? i(r.fade.from + (r.fade.to - r.fade.from) * a) : 1
    };
  });
}
function Fk(t, e) {
  const n = t.derive ? { ...e, ...t.derive(e) } : e, s = Oa(t, n), o = ws(t, n), i = {};
  for (const [r, a] of Object.entries(t.anchors ?? {})) {
    const l = a.part ? s.get(a.part) : o;
    if (!l) throw new Error(`prop rig: anchor "${r}" is on "${a.part}", which is not a part`);
    i[r] = jt(l, a.at);
  }
  return i;
}
function Wk(t, e) {
  if (!t.walls) return !1;
  const [n, s] = e.split("-").map((i) => t.vertices[Number(i)]), o = (i, r) => r.some((a) => Math.abs(n[i] - a) < 1e-6 && Math.abs(s[i] - a) < 1e-6);
  return o(0, t.walls.x) || o(2, t.walls.z);
}
function Nk(t) {
  return t.reduce((e, n) => !e || n.length > e.length ? n : e, void 0);
}
const Dk = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
function uh(t) {
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
function ud(t, e) {
  if (!t.loose?.size) return;
  const n = {};
  for (const [s, o] of t.loose)
    n[s] = { x: e[`piece.${o}.x`] ?? 0, y: e[`piece.${o}.y`] ?? 0, rotate: e[`piece.${o}.rotate`] ?? 0, opacity: e[`piece.${o}.opacity`] ?? 1 };
  return n;
}
function dd(t) {
  const e = {};
  for (const [n, s] of Object.entries({ ...Ts, ...t.rig.controls })) {
    const { bind: o, ...i } = s;
    e[n] = i;
  }
  return e;
}
function Bk(t) {
  const { prop: e } = t, n = t.scale ?? 60, s = e.rig.length * n * 1.4, o = e.rig.height * n * 1.6, i = dd(e), r = {};
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
      l.translate(s / 2, o), _u(l, Es(e, u, n), { ...a, time: h, loose: ud(c, u) });
    }
  };
}
function Es(t, e, n) {
  const s = Hk(Tt(t.rig, e, "turn"), Tt(t.rig, e, "tilt"), n);
  return hd(t.rig, e, s, n);
}
function _a(t, e, n) {
  const s = { ...t.props };
  let o = 0, i = 0;
  for (const [l, c] of e.state?.values.get(n) ?? [])
    typeof c == "number" && (l === "x" ? o = c : l === "y" ? i = c : l in s && (s[l] = c));
  const r = { x: t.x + t.width / 2 + o, y: t.y + t.height + i }, a = Es(t.prop, s, t.propScale);
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
function nS(t, e, n, s, o = {}) {
  const i = _a(e, n, s);
  return t.save(), t.translate(i.origin.x, i.origin.y), _u(t, i.solved, {
    ...e.propDraw,
    time: n.time,
    loose: ud(e, i.values),
    // The rider is drawn in scene px.
    rider: o.rider ? (r) => {
      r.save(), r.translate(-i.origin.x, -i.origin.y), o.rider(r), r.restore();
    } : void 0
  }), t.restore(), i;
}
const es = {
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
}, zk = 400, qk = 0.2;
function sS(t, e = {}) {
  const { prop: n } = t, s = dd(n), o = Object.keys(s), i = Object.keys(n.rig.anchors ?? {}), r = n.rig.parts.map(($) => $.id), a = Ss(), l = ei(a), c = e.tracks?.length ? new It({ id: `${n.kind}-surface`, tracks: e.tracks }) : void 0, h = Math.max(0, ...(e.tracks ?? []).flatMap(($) => $.keyframes.map((M) => M.time))), u = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map();
  t.loose = d;
  const f = t.props, g = ($) => {
    const M = { ...t.props };
    let S = 0, k = 0;
    if (c) {
      const x = c.getStateAtTime(Math.min($, h));
      for (const P of x.values.values())
        for (const [E, O] of P)
          typeof O == "number" && (E === "x" ? S = O : E === "y" ? k = O : E in M && (M[E] = O));
    }
    for (const x of o) a.keys(x)?.length && (M[x] = a.valueAt(x, $));
    return { values: M, origin: { x: t.x + t.width / 2 + S, y: t.y + t.height + k } };
  }, p = ($) => {
    const { kind: M, rest: S } = Wn($), k = (x) => Ye(n.kind, $, es, x);
    if (M === "box") {
      if (S) throw k("box takes no arguments");
      return { kind: M };
    }
    if (M === "anchor") {
      if (!i.includes(S)) throw k(ut(`${n.kind} anchor`, S, i));
      return { kind: M, name: S };
    }
    if (M === "part") {
      if (!r.includes(S)) throw k(ut(`${n.kind} part`, S, r));
      return { kind: M, name: S };
    }
    if (M === "control") {
      if (!o.includes(S)) throw k(ut(`${n.kind} control`, S, o));
      return { kind: M, name: S };
    }
    throw k();
  }, m = ($) => {
    const M = (n.rig.controls[$]?.bind ?? []).flatMap((k) => k.parts), S = n.rig.parts.filter((k) => k.glow?.control === $).map((k) => k.id);
    return /* @__PURE__ */ new Set([...M, ...S]);
  }, b = /* @__PURE__ */ new Map(), v = ($) => {
    let M = b.get($);
    if (!M) {
      const S = g($);
      b.set($, M = { ...S, solved: Es(n, S.values, t.propScale) });
    }
    return M;
  }, w = ($, M) => {
    const S = p($), { values: k, origin: x, solved: P } = v(M);
    if (S.kind === "box") return kt(x.x - t.width / 2, x.y - t.height, t.width, t.height);
    if (S.kind === "anchor") {
      const _ = P.anchors[S.name].point, L = qk * t.propScale;
      return kt(x.x + _.x - L / 2, x.y + _.y - L / 2, L, L);
    }
    if (S.kind === "part") return O(/* @__PURE__ */ new Set([S.name]), `part "${S.name}" is`);
    const E = m(S.name);
    if (E.size === 0) return kt(x.x - t.width / 2, x.y - t.height, t.width, t.height);
    return O(E, `the parts control "${S.name}" moves are`);
    function O(_, L) {
      const B = [...P.under, ...P.over].filter((D) => _.has(D.part.id)).flatMap((D) => D.faces.flatMap((I) => I.points));
      if (B.length === 0) {
        const D = Number.isFinite(M) ? `at ${M} ms` : "after its edits";
        throw new Error(`${n.kind}: ${L} turned away from the viewer ${D}; aim at an anchor (${i.map((I) => `anchor:${I}`).join(", ") || "none"}) or box`);
      }
      const X = B.map((D) => D.x), J = B.map((D) => D.y), q = Math.min(...X), R = Math.min(...J);
      return kt(x.x + q, x.y + R, Math.max(...X) - q, Math.max(...J) - R);
    }
  }, y = ($, M) => {
    try {
      return w($, M);
    } catch {
      return;
    }
  }, T = {
    kind: "prop",
    prop: t,
    about: es,
    target: t,
    box: kt(t.x, t.y, t.width, t.height),
    anchor($, M = 1 / 0) {
      return w($, M);
    },
    piece($) {
      const M = p($);
      if (M.kind !== "part") throw new Error(`${n.kind}: a piece is a part, part:ID (${r.slice(0, 6).map((P) => `part:${P}`).join(", ")}…), not "${$}"`);
      const S = u.get(M.name);
      if (S) return S;
      const k = [M.name];
      for (let P = 0; P < k.length; P++) for (const E of n.rig.parts) E.parent === k[P] && !k.includes(E.id) && k.push(E.id);
      const x = { id: u.size + 1, part: M.name, home: w($, 0) };
      u.set(M.name, x);
      for (const P of k) d.set(P, x.id);
      for (const P of ["x", "y", "rotate"]) f[`piece.${x.id}.${P}`] = 0;
      return f[`piece.${x.id}.opacity`] = 1, x;
    },
    edit($, M, S) {
      if (!($ in es.edits)) throw ni(n.kind, $, es);
      const k = Array.isArray(M) ? M : [M];
      if (k.length === 0) throw new Error(`${n.kind}.edit: ${$} takes at least one anchor`);
      if (b.clear(), $ === "move" || $ === "fling") {
        if (k.length > 1) throw new Error(`${n.kind}.edit: ${$} takes one part anchor`);
        const x = T.piece(k[0]);
        if ($ === "fling") return T.fling(x, S);
        const P = S.to;
        if (!P) throw new Error(`${n.kind}.edit: move needs \`to\`, an anchor name or { x, y }`);
        const E = typeof P == "string" ? w(P, S.at) : void 0;
        return T.move(x, { ...S, to: E ? { x: E.left + E.width / 2, y: E.top + E.height / 2 } : P });
      }
      for (const x of k) {
        const P = p(x);
        if (P.kind !== "control") throw new Error(`${n.kind}.edit: ${$} takes control anchors (control:${o.join(", control:")}), not "${x}"`);
        const E = s[P.name];
        let O;
        if ($ === "set") {
          if (typeof S.value != "number" || !Number.isFinite(S.value)) throw new Error(`${n.kind}.edit: set needs \`value\`, a number (${P.name}: ${E.description})`);
          O = S.value;
        } else
          O = S.on === !1 ? E.default ?? E.min ?? 0 : E.max ?? 1;
        a.tween(P.name, g(S.at).values[P.name], O, S, zk);
      }
      return T;
    },
    follow($, M) {
      return b.clear(), l.follow($, M), T;
    },
    fling($, M) {
      return b.clear(), l.fling($, M), T;
    },
    move($, M) {
      return b.clear(), l.move($, M), T;
    },
    ride($, M, S) {
      const k = [
        ...o.flatMap((P) => bs(a.keys(P))),
        ...(e.tracks ?? []).flatMap((P) => bs(P.keyframes.filter((E) => typeof E.value == "number")))
      ];
      if (k.length === 0) return $;
      const x = [...i.map((P) => `anchor:${P}`), ...r.map((P) => `part:${P}`)].flatMap((P) => {
        const E = y(P, 0);
        return E ? [{ top: E.top, offset: (O) => (y(P, O)?.top ?? E.top) - E.top, windows: k }] : [];
      });
      return Ta($, M, { ground: S.ground, every: S.every ?? qe, floors: x });
    },
    tracks: a.tracks
  };
  return T;
}
const Yk = { body: "#e8574a", trim: "#3b3b44", glass: "#bfe3f2", tyre: "#2c2c33", hub: "#c9ccd3", light: "#fff4b8", tail: "#ff5a4f", inside: "#3b3640", seat: "#6d5d55" };
function Ce(t) {
  const e = { ...Yk, ...t.colors }, n = [], { forwardMost: s, backMost: o, top: i } = fd(t);
  t.body && n.push({ id: "body", shape: { type: "extrude", profile: t.body, width: t.width }, fill: e.body });
  for (const [h, u] of (t.frame ?? []).entries())
    n.push({ id: `frame-${h}`, shape: { type: "tube", points: u.points, radius: u.radius ?? 0.035, segments: 6 }, fill: u.color ?? e.body, outline: 0.7 });
  for (const [h, u] of (t.windows ?? []).entries())
    for (const d of [1, -1])
      n.push({
        id: `window-${h}-${d > 0 ? "left" : "right"}`,
        shape: { type: "panel", points: [[u.from, u.low], [u.to, u.low], [u.to, u.high], [u.from, u.high]], facing: d > 0 ? "left" : "right" },
        at: [d * (t.width / 2 + 0.01), 0, 0],
        fill: e.glass,
        outline: 0.7,
        seeThrough: !0,
        glow: t.lights ? { control: "lights", color: "#ffe9a3" } : void 0
      });
  for (const h of t.extras ?? []) n.push(h);
  if (t.cabin) {
    const h = t.cabin.width ?? t.width * 0.85;
    n.push({ id: "cabin", shape: { type: "extrude", profile: t.cabin.profile, width: h }, fill: e.glass, outline: 0.9, seeThrough: !0, layer: 1 });
    const u = Math.min(...t.cabin.profile.map(([, f]) => f)), d = Math.max(...t.cabin.profile.map(([, f]) => f));
    for (const [f, g] of (t.cabin.pillars ?? []).entries())
      n.push({ id: `pillar-${f}`, shape: { type: "box", size: [h + 0.02, d - u, 0.1] }, at: [0, (u + d) / 2, g], fill: e.body, outline: 0.8, layer: 1 });
  }
  const r = t.wheels[0]?.radius ?? 0.4, a = [];
  t.wheels.forEach((h, u) => {
    const d = h.side === 0 ? [0] : [1, -1], f = h.thickness ?? (h.style === "spoked" ? 0.05 : 0.26);
    for (const g of d) {
      const p = `wheel-${u}-${g > 0 ? "left" : g < 0 ? "right" : "middle"}`;
      if (a.push({ parts: [p], rotate: { axis: "x", degrees: r / h.radius } }), n.push({
        id: p,
        shape: { type: "cylinder", radius: h.radius, length: f, axis: "x", segments: 20, spokes: h.style === "spoked" ? 8 : 0 },
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
            at: [m * (f / 2 + 0.012), 0, 0],
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
    const { from: h, to: u, low: d, high: f } = t.door, g = [[h, d], [u, d], [u, f], [h, f]];
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
      const b = h + (u - h) * 0.15, v = h + (u - h) * 0.55;
      n.push({
        id: `seat-back-${m}`,
        shape: { type: "panel", points: [[b, d + 0.05], [v, d + 0.05], [v - 0.08, f - 0.06], [b + 0.06, f - 0.04]], facing: p > 0 ? "left" : "right" },
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
    const { across: h, low: u, high: d, front: f, back: g } = t.lights, p = (t.lights.size ?? 0.32) / 2, m = [[-p, u], [p, u], [p, d], [-p, d]];
    for (const b of [1, -1])
      n.push({ id: `headlight-${b}`, shape: { type: "panel", points: m, facing: "front" }, at: [b * h, 0, f], fill: e.light, outline: 0.6, glow: { control: "lights", color: "#ffffff" } }), n.push({ id: `taillight-${b}`, shape: { type: "panel", points: m, facing: "back" }, at: [b * h, 0, g], fill: Ma(e.tail, 0.62), outline: 0.6, glow: { control: "lights", color: e.tail } });
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
    actions: Kk(t),
    acting: jk,
    colors: { body: e.body, ink: "#26262b" },
    follow: t.antenna ? [{ control: "antenna", of: "x", per: 0.9, stiffness: 140, damping: 7, limit: 35 }] : void 0,
    wheelRadius: r,
    // In world metres: its wheels turn 180/π degrees per wheel radius covered.
    ...t.wheels.length > 0 ? { moves: { drive: { speed: t.speed ?? 6, perMetre: { wheelSpin: 180 / (Math.PI * r) } } } } : {}
  };
}
function fd(t) {
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
const jk = {
  depth: { turn: 0, lift: 0, lights: 0, pitch: 1, roll: 1, squash: 1, lean: 1, door: 2 },
  limits: { turn: 0.08, pitch: 5, roll: 4, lean: 0.1, squash: 0.06, door: 0.12, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
};
function js(t, e, n, s, o, i, r = !1) {
  const a = t.facing() || Math.sign(s - t.x) || 1, l = t.values.wheelSpin ?? 0, c = (s - t.x) * a / t.scale;
  t.set("wheelSpin", e, l), t.move(e, n, s, { easing: o }), t.set("wheelSpin", n, r ? l : l + c / i * (180 / Math.PI), o);
}
const dh = 0.4;
function Kk(t) {
  const e = t.wheels[0]?.radius ?? 0.4, { forwardMost: n, backMost: s } = fd(t), o = (n - s) / 2, i = (a, l, c) => {
    const h = a.exaggeration;
    let u = l;
    return a.facing() !== c && (u = a.turnTo(u, c > 0 ? "right" : "left")), a.key(u + 200, { pitch: 4 * h, squash: 1 - 0.07 * h, lean: -0.1 * h }, { act: !1, easing: "ease-out" }), js(a, u, u + 200, a.x - c * 0.15 * h * a.scale, "ease-out", e), a.effect({ kind: "exhaust", time: u + 150, x: a.x - c * o * a.scale, y: a.floor - 0.3 * a.scale, length: 900, direction: -c }), u + 260;
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
        const u = i(a, c, h), d = a.exaggeration, f = Math.abs(l.to - a.x), g = l.for ?? Math.max(500, f / (l.speed ?? dh));
        return a.effect({ kind: "dust", time: u, x: a.x - h * o * a.scale, y: a.floor, length: 600, direction: -h }), a.key(u + 140, { pitch: -1.5 * d, squash: 1 + 0.05 * d, lean: 0.12 * d }, { act: !1, easing: "ease-out" }), a.key(u + Math.max(160, g - 160), { pitch: 0, lean: 0.08 * d, squash: 1.02 }, { act: !1 }), js(a, u, u + g, l.to, "ease-in-out", e), r(a, u + g, !1), { end: u + g + 380, contact: u, release: u + g };
      }
    },
    brake: {
      summary: "Drives toward `to` and slams on the brakes: the wheels lock and it skids the last stretch, nose diving, leaving skid marks.",
      needs: ["to"],
      uses: ["speed", "for"],
      run(a, l, c) {
        const h = Math.sign(l.to - a.x);
        if (h === 0) return { end: c };
        const u = i(a, c, h), d = a.exaggeration, f = a.x, g = Math.abs(l.to - f), p = l.for ?? Math.max(600, g / (l.speed ?? dh * 1.2)), m = u + p * 0.55, b = f + (l.to - f) * 0.65;
        return a.key(u + 140, { pitch: -1.5 * d, squash: 1 + 0.06 * d, lean: 0.14 * d }, { act: !1, easing: "ease-out" }), js(a, u, m, b, "ease-in", e), a.key(m + 80, { pitch: -7 * d, lean: -0.12 * d, squash: 0.94 }, { act: !1, easing: "ease-out" }), js(a, m, u + p, l.to, "ease-out", e, !0), a.effect({ kind: "skid", time: m, x: b, toX: l.to, y: a.floor, length: p * 0.45 + 1500 }), a.effect({ kind: "dust", time: u + p, x: l.to + h * o * a.scale, y: a.floor, length: 600, direction: h }), r(a, u + p, !0), { end: u + p + 380, contact: m, release: u + p };
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
function Xk(t = {}) {
  return Ce({
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
function Uk(t = {}) {
  return Ce({
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
function Gk(t = {}) {
  return Ce({
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
function Vk(t = {}) {
  return Ce({
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
function Jk(t = {}) {
  const e = t.colors?.body ?? "#a8743f";
  return Ce({
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
function Zk(t = {}) {
  return Ce({
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
function Qk(t = {}) {
  const e = t.colors?.body ?? "#e0473b", n = [0, 0.32, -0.05], s = [0, 0.86, -0.22], o = [0, 0.9, 0.42], i = [0, 0.34, 0.56], r = [0, 0.34, -0.56];
  return Ce({
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
function t5(t = {}) {
  return Ce({
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
function e5(t = {}) {
  const e = t.height ?? 2.4, n = t.trunkRadius ?? 0.16, s = t.canopy?.radius ?? 1.1, o = t.canopy?.shape === "tall", i = { trunk: "#8a5a3b", leaves: "#5cae5a", ...t.colors }, r = nn(t.canopy?.seed ?? 7), a = [
    { id: "trunk", shape: { type: "tube", points: [[0, 0, 0], [0.06, e * 0.5, 0], [-0.02, e, 0]], radius: n, segments: 8 }, fill: i.trunk },
    { id: "branch", parent: "trunk", shape: { type: "tube", points: [[0, 0, 0], [0.45, 0.4, 0.1]], radius: n * 0.45, segments: 6 }, at: [0.04, e * 0.62, 0], fill: i.trunk },
    { id: "canopy", parent: "trunk", shape: { type: "ellipsoid", radii: [s, s * (o ? 1.35 : 0.88), s], segments: 14 }, at: [-0.02, e + s * 0.55, 0], fill: i.leaves }
  ], l = t.canopy?.lobes ?? 7;
  for (let h = 0; h < l; h++) {
    const u = Math.PI * 2 * h / l + r.next() * 0.6, d = (r.next() - 0.25) * s * (o ? 1.1 : 0.7), f = s * (0.48 + r.next() * 0.22), g = [Math.cos(u) * s * 0.78, d, Math.sin(u) * s * 0.6];
    a.push({ id: `lobe-${h}`, parent: "canopy", shape: { type: "ellipsoid", radii: [f, f * 0.86, f], segments: 12 }, at: g, fill: i.leaves });
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
    actions: s5(),
    acting: n5,
    colors: { body: i.leaves }
  };
}
const n5 = {
  depth: { sway: 1, canopySway: 2, size: 0, squash: 1 },
  limits: { sway: 2, canopySway: 3, squash: 0.08 },
  eyes: [],
  headTurns: {},
  drift: []
};
function s5() {
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
          const h = 0.55 + 0.45 * Math.sin(c / i * Math.PI * 2.3), u = Math.sin(c / 170) * 0.35, d = -o * 9 * r * (h + u * o);
          e.key(s + c, { sway: d, canopySway: l * 1.3 }, { act: !1, easing: "ease-in-out" }), l = d;
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
function o5(t = {}) {
  const e = t.width ?? 4, n = t.depth ?? 3.2, s = t.wallHeight ?? 2.5, o = t.roofHeight ?? 1.5, i = t.overhang ?? 0.25, r = { walls: "#f1d9a8", roof: "#b8433a", door: "#7a4b2a", doorway: "#3a2a22", glass: "#bfe3f2", lit: "#ffd66b", chimney: "#9b5a45", ...t.colors }, a = n / 2 + 0.01, l = t.door?.width ?? 0.9, c = t.door?.height ?? 1.9, h = t.door?.at ?? 0, u = t.windows ?? [
    { at: -1.25, low: 1, width: 0.8, height: 0.8 },
    { at: 1.25, low: 1, width: 0.8, height: 0.8 }
  ], d = [
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
    d.push({
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
    d.push({
      id: `side-window-${p > 0 ? "left" : "right"}`,
      shape: { type: "panel", points: [[-0.4, 1], [0.4, 1], [0.4, 1.8], [-0.4, 1.8]], facing: p > 0 ? "left" : "right" },
      at: [p * (e / 2 + 0.01), 0, 0],
      fill: r.glass,
      outline: 0.8,
      glow: { control: "lights", color: r.lit }
    });
  const f = t.chimney === !1 ? void 0 : { at: t.chimney?.at ?? e * 0.28, back: t.chimney?.back ?? -n * 0.18 };
  if (f) {
    const p = s + o * (1 - Math.abs(f.back) / (n / 2 + i)), m = s + o + 0.45;
    d.push({ id: "chimney", shape: { type: "box", size: [0.42, m - p + 0.3, 0.42] }, at: [f.at, (m + p - 0.3) / 2, f.back], fill: r.chimney, layer: 1 });
  }
  const g = {
    parts: d,
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
      ...f ? { chimney: { at: [f.at, s + o + 0.5, f.back] } } : {}
    }
  };
  return {
    kind: t.kind ?? "house",
    family: "building",
    summary: t.summary ?? "A house: opens its door, lights its windows, puffs chimney smoke, shakes, pops up.",
    rig: g,
    actions: r5(!!f),
    acting: i5,
    colors: { body: r.walls }
  };
}
const i5 = {
  depth: { door: 1, lights: 0, roll: 1, squash: 1, size: 0 },
  limits: { door: 0.1, roll: 1.5, squash: 0.05 },
  eyes: [],
  headTurns: {},
  drift: []
};
function r5(t) {
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
function a5(t = {}) {
  const e = t.width ?? 0.46, n = t.depth ?? 0.46, s = t.seatHeight ?? 0.46, o = t.backHeight ?? 0.95, i = { wood: "#8a5a3b", seat: "#c48a4a", ...t.colors }, r = 0.05, a = 0.025, l = [
    { id: "seat", shape: { type: "box", size: [e, r, n] }, at: [0, s - r / 2, 0], fill: i.seat },
    { id: "back", shape: { type: "box", size: [e, o - s, r] }, at: [0, (o + s) / 2, -n / 2 + r / 2], fill: i.wood }
  ];
  for (const [h, u, d] of [[-1, 1, "front-left"], [1, 1, "front-right"], [-1, -1, "back-left"], [1, -1, "back-right"]])
    l.push({ id: `leg-${d}`, shape: { type: "tube", points: [[0, 0, 0], [0, s - r, 0]], radius: a, segments: 6 }, at: [h * (e / 2 - a * 1.5), 0, u * (n / 2 - a * 1.5)], fill: i.wood });
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
    actions: c5(),
    acting: l5,
    colors: { body: i.seat }
  };
}
const l5 = {
  depth: { tip: 1, roll: 1, squash: 1, size: 0 },
  limits: { tip: 2, roll: 1, squash: 0.05 },
  eyes: [],
  headTurns: {},
  drift: []
};
function c5() {
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
function h5(t = {}) {
  const e = t.width ?? 1.4, n = t.depth ?? 0.7, s = t.height ?? 0.75, o = { wood: "#8a5a3b", top: "#a9754a", knob: "#2b2b2b", ...t.colors }, i = 0.04, r = 0.03, a = 0.14, l = e * 0.4, c = [
    { id: "top", shape: { type: "box", size: [e, i, n] }, at: [0, s - i / 2, 0], fill: o.top },
    // The drawer: a box under the top on the left, sliding forward on its control.
    { id: "drawer", shape: { type: "box", size: [l, a, n * 0.8] }, at: [-e / 2 + l / 2 + 0.05, s - i - a / 2, 0], fill: o.wood },
    { id: "knob", parent: "drawer", shape: { type: "ellipsoid", radii: [0.02, 0.02, 0.015], segments: 8 }, at: [0, 0, n * 0.4 + 0.012], fill: o.knob, outline: 0.6 }
  ];
  for (const [u, d, f] of [[-1, 1, "front-left"], [1, 1, "front-right"], [-1, -1, "back-left"], [1, -1, "back-right"]])
    c.push({ id: `leg-${f}`, shape: { type: "tube", points: [[0, 0, 0], [0, s - i, 0]], radius: r, segments: 6 }, at: [u * (e / 2 - r * 2), 0, d * (n / 2 - r * 2)], fill: o.wood });
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
        run(u, d, f) {
          return u.key(f + 400, { drawer: d.open ? 1 : 0 }, { easing: d.open ? "ease-out" : "ease-in" }), { end: f + 500, contact: f + 400 };
        }
      }
    },
    acting: u5,
    colors: { body: o.top }
  };
}
const u5 = {
  depth: { drawer: 1, roll: 1, squash: 1, size: 0 },
  limits: { drawer: 0.08, roll: 1, squash: 0.04 },
  eyes: [],
  headTurns: {},
  drift: []
};
function d5(t = {}) {
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
        run(h, u, d) {
          const f = u.for ?? 700, g = h.exaggeration;
          return h.key(d + 90, { give: 1 - 0.18 * g }, { act: !1, easing: "ease-out" }), h.key(d + f * 0.45, { give: 1 + 0.05 * g }, { act: !1, easing: "ease-in-out" }), h.key(d + f * 0.7, { give: 1 - 0.04 * g }, { act: !1, easing: "ease-in-out" }), h.key(d + f, { give: 1 }), { end: d + f, contact: d + 90 };
        }
      }
    },
    acting: f5,
    colors: { body: i.blanket }
  };
}
const f5 = {
  depth: { give: 1, roll: 1, squash: 1, size: 0 },
  limits: { give: 0.03, roll: 0.5, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: []
};
function p5(t = {}) {
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
    actions: m5(),
    acting: g5,
    colors: { body: o.door }
  };
}
const g5 = {
  depth: { open: 1, roll: 1, squash: 1, size: 0 },
  limits: { open: 0.08, roll: 0.6, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: []
};
function m5() {
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
const pd = 1.4;
function y5(t = {}) {
  const e = t.width ?? 0.5, n = t.seatHeight ?? 0.5, s = t.wheelRadius ?? 0.3, o = 0.08, i = { frame: "#2b2f36", seat: "#3c6ea5", tyre: "#1f2328", ...t.colors }, r = 0.04, a = 0.018, l = 0.44, c = n + 0.5, h = -0.08, u = e / 2 + 0.06, d = [
    { id: "seat", shape: { type: "box", size: [e, r, l] }, at: [0, n - r / 2, 0], fill: i.seat },
    { id: "back", shape: { type: "box", size: [e, c - n - 0.02, r] }, at: [0, (c + n) / 2, -l / 2 + r / 2], fill: i.seat },
    // Footrests: a bar in front, low, with two plates.
    { id: "footrest", shape: { type: "box", size: [e * 0.8, 0.02, 0.14] }, at: [0, 0.12, l / 2 + 0.22], fill: i.frame }
  ];
  for (const [p, m] of [[-1, "left"], [1, "right"]]) {
    const b = p * u, v = (w, y, T = a) => {
      d.push({ id: w, shape: { type: "tube", points: y, radius: T, segments: 6 }, fill: i.frame, outline: 0.7 });
    };
    v(`post-${m}`, [[b, n - 0.1, -l / 2], [b, c + 0.04, -l / 2], [b, c + 0.04, -l / 2 - 0.14]]), v(`rail-${m}`, [[b, n - 0.03, -l / 2], [b, n - 0.03, l / 2]]), v(`leg-${m}`, [[b, n - 0.03, l / 2], [b * 0.85, o, l / 2 + 0.06]]), v(`strut-${m}`, [[b * 0.85, o + 0.08, l / 2 + 0.04], [b * 0.8, 0.13, l / 2 + 0.22]]), v(`armrest-${m}`, [[b, n + 0.22, -l / 2 + 0.02], [b, n + 0.22, l / 2 - 0.08]], a * 1.3), d.push({
      id: `wheel-${m}`,
      shape: { type: "cylinder", radius: s, length: 0.04, axis: "x", segments: 20, spokes: 8 },
      at: [b + p * 0.03, s, h],
      ink: i.tyre,
      outline: 1.3
    }), d.push({ id: `rim-${m}`, shape: { type: "cylinder", radius: s * 0.9, length: 0.012, axis: "x", segments: 20 }, at: [p * 0.045, 0, 0], parent: `wheel-${m}`, ink: i.frame, outline: 0.8 }), d.push({
      id: `castor-${m}`,
      shape: { type: "cylinder", radius: o, length: 0.03, axis: "x", segments: 12, spokes: 3 },
      at: [b * 0.85, o, l / 2 + 0.06],
      fill: i.tyre
    });
  }
  const f = d.map((p) => p.id).filter((p) => !p.startsWith("rim-")), g = {
    parts: d,
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
        bind: [{ parts: f, rotate: { axis: "x", degrees: 1, pivot: [0, s, h] } }]
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
    actions: w5(s),
    acting: b5,
    colors: { body: i.seat, ink: i.frame },
    wheelRadius: s,
    moves: { roll: { speed: pd, perMetre: { wheelSpin: 180 / (Math.PI * s) } } }
  };
}
const b5 = {
  depth: { wheelSpin: 0, tip: 1, roll: 1, squash: 1, size: 0 },
  limits: { tip: 2, roll: 1, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: []
};
function fh(t, e, n, s, o, i, r = !1) {
  const a = t.facing() || Math.sign(s - t.x) || 1, l = t.values.wheelSpin ?? 0, c = (s - t.x) * a / t.scale;
  t.set("wheelSpin", e, l), t.move(e, n, s, { easing: o }), t.set("wheelSpin", n, r ? l : l + c / i * (180 / Math.PI), o);
}
function w5(t) {
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
        const r = Math.abs(n.to - e.x), a = n.for ?? Math.max(300, r / (n.speed ?? pd * e.scale / 1e3));
        return e.key(i + 150, { tip: 1.5 * e.exaggeration }, { act: !1, easing: "ease-out" }), fh(e, i, i + a, n.to, "ease-in-out", t), e.key(i + a, { tip: 0 }, { easing: "ease-out" }), { end: i + a };
      }
    },
    brake: {
      summary: "Stops short at `to`: the wheels lock and it skids the last bit, tipping forward a touch.",
      needs: ["to"],
      uses: ["for"],
      run(e, n, s) {
        if (Math.sign(n.to - e.x) === 0) return { end: s };
        const i = n.for ?? 500;
        return fh(e, s, s + i, n.to, "ease-out", t, !0), e.key(s + i, { tip: 0 }, { easing: "ease-out" }), e.effect({ kind: "dust", time: s + i * 0.5, x: n.to, y: e.floor, length: 500 }), { end: s + i, contact: s + i };
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
function k5(t = {}) {
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
    actions: v5(),
    acting: gd,
    colors: { body: e.body, ink: "#26262b" },
    // In world metres: flies with its rotor spinning (a blur), at the height a beat gives.
    moves: { fly: { speed: 15, flies: !0, hold: { blur: 1 }, perSecond: { rotor: Ee * 1e3 } } }
  };
}
const gd = {
  depth: { turn: 0, lift: 0, blur: 0, pitch: 1, roll: 1, squash: 1, lean: 1, size: 0 },
  limits: { turn: 0.08, pitch: 6, roll: 6, squash: 0.06, lift: 0.15 },
  eyes: [],
  headTurns: {},
  drift: []
}, Ee = 2.6;
function v5() {
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
        t(n, o, o + 900, Ee, "ease-in"), n.key(o + 900, { blur: 1 }, { act: !1, easing: "ease-in" }), n.key(o + 700, { squash: 1 - 0.08 * i }, { act: !1, easing: "ease-in" });
        const a = o + 1e3;
        return n.key(a + 150, { squash: 1 + 0.06 * i, lift: 0.3 }, { act: !1, easing: "ease-out" }), n.key(a + 1300, { squash: 1, lift: r, pitch: -4 * i }, { act: !1, easing: "ease-in-out" }), n.key(a + 1700, { pitch: 0 }), t(n, o + 900, a + 1700, Ee), n.effect({ kind: "dust", time: a, x: n.x, y: n.floor, length: 900 }), { end: a + 1700, contact: a };
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
        return n.key(a + 300, { pitch: -9 * i, roll: 6 * i }, { act: !1, easing: "ease-out" }), n.key(a + c - 250, { pitch: -4 * i, roll: 3 * i, lift: h }, { act: !1 }), n.key(a + c, { pitch: 7 * i, roll: 0 }, { act: !1, easing: "ease-out" }), n.key(a + c + 450, { pitch: 0 }), n.move(a, a + c, s.to, { easing: "ease-in-out" }), t(n, o, a + c + 450, Ee), { end: a + c + 450, contact: a, release: a + c };
      }
    },
    hover: {
      summary: "Hovers in place for `for` ms (default 2000), bobbing gently.",
      uses: ["for"],
      run(n, s, o) {
        const i = s.for ?? 2e3, r = n.values.lift, a = n.exaggeration;
        for (let l = 350, c = 0; l < i; l += 350, c++)
          n.key(o + l, { lift: r + (c % 2 === 0 ? 0.12 : -0.06) * a, roll: (c % 2 === 0 ? 1.5 : -1.5) * a }, { act: !1, easing: "ease-in-out" });
        return n.key(o + i, { lift: r, roll: 0 }, { act: !1, easing: "ease-in-out" }), (e(n) || r > 0) && t(n, o, o + i, Ee), { end: o + i };
      }
    },
    land: {
      summary: "Settles down onto its skids: a flare, a squash on touchdown with dust, and the rotor spools down.",
      run(n, s, o) {
        const i = n.exaggeration, r = o + Math.max(900, n.values.lift * 450);
        return n.key(o + 400, { pitch: 3 * i }, { act: !1, easing: "ease-out" }), n.key(r, { lift: 0, pitch: 0, squash: 1 - 0.14 * i }, { act: !1, easing: "ease-in" }), n.key(r + 280, { squash: 1 }), t(n, o, r, Ee), t(n, r, r + 1600, Ee, "ease-out"), n.key(r + 1600, { blur: 0 }, { act: !1, easing: "ease-out" }), n.effect({ kind: "dust", time: r, x: n.x, y: n.floor, length: 800 }), { end: r + 1600, contact: r };
      }
    }
  };
}
function M5(t = {}) {
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
    actions: S5(),
    acting: gd,
    colors: { body: e.body, ink: "#26262b" },
    moves: { fly: { speed: 30, flies: !0, hold: { blur: 1 }, perSecond: { rotor: Ee * 1e3 } } }
  };
}
const x5 = 3.2;
function S5() {
  const t = (n, s, o, i) => {
    const r = n.values.rotor ?? 0;
    n.set("rotor", s, r), n.set("rotor", o, r + x5 * (o - s) * (i ? 0.5 : 1), i);
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
        for (let d = 1; d <= l; d++) {
          const f = Math.PI * 2 * d / l, g = o + i * d / l;
          n.key(g, { lift: h + r * (1 - Math.cos(f)), pitch: u + 360 * d / l }, { act: !1 }), n.move(o + i * (d - 1) / l, g, c + a * (r * Math.sin(f) + d / l * r * 1.2) * n.scale);
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
const As = ["walk", "trot", "canter", "gallop"], oS = As, md = ["fl", "fr", "hl", "hr"], oi = {
  walk: { offsets: { hl: 0, fl: 0.25, hr: 0.5, fr: 0.75 }, swing: 16, lift: 45, bob: 0.02, rock: 0, cycle: 1100 },
  trot: { offsets: { fl: 0, hr: 0, fr: 0.5, hl: 0.5 }, swing: 22, lift: 75, bob: 0.05, rock: 0, cycle: 640 },
  canter: { offsets: { hr: 0, hl: 0.33, fr: 0.33, fl: 0.66 }, swing: 30, lift: 70, bob: 0.08, rock: 5, cycle: 560 },
  gallop: { offsets: { hr: 0, hl: 0.1, fr: 0.5, fl: 0.6 }, swing: 40, lift: 80, bob: 0.1, rock: 7, cycle: 460 }
}, Ie = Math.PI / 180;
function Ha(t, e) {
  return 4 * t * Math.sin(oi[e].swing * Ie);
}
function rn(t) {
  const { legs: e, colors: n } = t, s = e.upper + e.lower + e.foot, o = s + t.body.rise, i = (u, d) => [d * u[0], u[1], u[2]], r = [
    { id: "body", shape: { type: "ellipsoid", radii: t.body.radii, segments: 18 }, at: [0, o, 0], fill: n.coat },
    // The neck tapers from the shoulders up to the head.
    { id: "neck", shape: { type: "tube", points: t.neck.points, radius: t.neck.points.map((u, d, f) => t.neck.radius * (1.25 - 0.4 * d / Math.max(1, f.length - 1))), segments: 12 }, at: t.neck.at, fill: n.coat },
    { id: "head", parent: "neck", shape: { type: "ellipsoid", radii: t.head.radii, segments: 14 }, at: t.head.at, rotate: t.head.rotate, fill: n.coat },
    ...E5(t, n, o)
  ];
  t.mane && r.push({ id: "mane", parent: "neck", shape: { type: "tube", points: t.mane.points, radius: t.mane.radius, segments: 6 }, fill: n.dark, outline: 0.7 }), t.muzzle && r.push({ id: "muzzle", parent: "head", shape: { type: "ellipsoid", radii: t.muzzle.radii, segments: 10 }, at: t.muzzle.at, fill: n.muzzle, outline: 0.8 });
  for (const u of [1, -1]) {
    const d = u > 0 ? "left" : "right", f = t.ears.rotate ? i(t.ears.rotate, 1).map((g, p) => p === 2 ? u * g : g) : void 0;
    r.push(
      { id: `ear-${d}`, parent: "head", shape: { type: "ellipsoid", radii: t.ears.radii, segments: 8 }, at: i(t.ears.at, u), rotate: f, fill: n.coat, outline: 0.7 },
      { id: `eye-${d}`, parent: "head", shape: { type: "ellipsoid", radii: [t.eyes.size * 0.8, t.eyes.size, t.eyes.size * 0.9], segments: 8 }, at: i(t.eyes.at, u), fill: "#1d1d22", outline: 0.4 }
    );
  }
  r.push(...t.extras?.(n) ?? []);
  const a = {
    walk: { description: "Phase of the stride, in full cycles (keyed in step with the distance covered)", unit: "cycles" },
    walking: { description: "How much of the gait is applied: 0 standing, 1 moving", unit: "0..1", min: 0, max: 1 },
    gait: { description: `Which gait: ${t.gaits.map((u) => `${As.indexOf(u)} ${u}`).join(", ")}`, unit: "index", min: 0, max: 3 },
    neck: { description: "Neck bent down (+, eating, sniffing) or up (−, alert)", unit: "degrees", bind: [{ parts: ["neck"], rotate: { axis: "x", degrees: 1 } }] },
    // The tail bends along its length: each segment turns its share, so the whole tail curls.
    tail: { description: "Tail flicked up and back (+), curling along its length, on a spring behind the motion", unit: "degrees", bind: [{ parts: ee, rotate: { axis: "x", degrees: 1 / ee.length } }] },
    wag: { description: "Tail swung side to side, curling", unit: "degrees", bind: [{ parts: ee, rotate: { axis: "y", degrees: 1 / ee.length } }] },
    // The ears hinge at their base: laid back on a run, on a spring behind the motion.
    ears: { description: "Ears pricked forward (+) or laid back (−), on a spring behind the motion", unit: "degrees", bind: [{ parts: ["ear-left", "ear-right"], rotate: { axis: "x", degrees: 1, pivot: [0, -t.ears.radii[1], 0] } }] }
  };
  for (const u of md) {
    const d = u[0] === "f", f = u[1] === "l" ? 1 : -1, g = d ? e.thickness[0] : e.thickness[1];
    r.push(
      // Tapered from the hip down, a rounded knee, a tapered lower leg and a rounded paw or hoof.
      { id: `${u}-upper`, shape: { type: "tube", points: [[0, e.upper * 0.2, 0], [0, -e.upper * 0.5, 0], [0, -e.upper, 0]], radius: [g, g * 0.85, e.lowerThickness * 1.15], segments: 10 }, at: [f * e.across, s, d ? e.front : e.hind], fill: n.coat },
      { id: `${u}-knee`, parent: `${u}-upper`, shape: { type: "ellipsoid", radii: Array(3).fill(e.lowerThickness * 1.08), segments: 10 }, at: [0, -e.upper, 0], fill: n.coat, solidOnly: !0 },
      { id: `${u}-lower`, parent: `${u}-upper`, shape: { type: "tube", points: [[0, 0, 0], [0, -e.lower, 0]], radius: [e.lowerThickness * 1.1, e.lowerThickness * 0.85], segments: 10 }, at: [0, -e.upper, 0], fill: n.coat },
      { id: `${u}-foot`, parent: `${u}-lower`, shape: { type: "ellipsoid", radii: [e.footSize[0] / 2, e.foot / 2 + 4e-3, e.footSize[1] / 2], segments: 12 }, at: [0, -e.lower - e.foot / 2, e.footSize[1] * 0.12], fill: n.foot, outline: 0.8 }
    );
    const p = `${d ? "Front" : "Hind"} ${f > 0 ? "left" : "right"} leg`;
    a[`${u}.swing`] = { description: `${p}: forward (+) or back (−) from the hip`, unit: "degrees", bind: [{ parts: [`${u}-upper`], rotate: { axis: "x", degrees: -1 } }] }, a[`${u}.knee`] = { description: `${p}: knee (hock) folded`, unit: "degrees", bind: [{ parts: [`${u}-lower`], rotate: { axis: "x", degrees: d ? 1 : -1 } }] }, a[`${u}.ankle`] = { description: `${p}: foot turned at the ankle (+ toe forward)`, unit: "degrees", bind: [{ parts: [`${u}-foot`], rotate: { axis: "x", degrees: -1, pivot: [0, e.foot / 2, -e.footSize[1] * 0.12] } }] };
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
    derive: (u) => A5(u, t, s)
  }, h = {
    legLength: s,
    upper: e.upper,
    lower: e.lower,
    foot: e.foot,
    tailHangs: t.tail.points[t.tail.points.length - 1][1] < 0,
    front: e.front,
    hind: e.hind,
    call(u, d) {
      const f = u.anchor("mouth");
      u.effect({ kind: "honk", time: d, x: f.x, y: f.y, length: 800, direction: u.facing() || 1 });
    }
  };
  return {
    kind: t.kind,
    family: "animal",
    summary: t.summary,
    rig: c,
    actions: { ...P5(t, h), ...t.actions?.(h) },
    acting: yd,
    colors: { body: n.coat, ink: "#26262b" },
    follow: [
      { control: "tail", of: "x", per: 0.6, stiffness: 90, damping: 6, limit: 40 },
      { control: "ears", of: "x", per: 1.4, stiffness: 150, damping: 8, limit: 45 }
    ],
    moves: T5(t, s)
  };
}
function T5(t, e) {
  const n = (o) => {
    const i = Ha(e, o);
    return {
      speed: i / (oi[o].cycle * (t.cycleScale ?? 1) / 1e3),
      set: { gait: As.indexOf(o) },
      hold: { walking: 1 },
      perMetre: { walk: 1 / i }
    };
  }, s = Object.fromEntries(t.gaits.map((o) => [o === "gallop" && !t.gaits.includes("canter") ? "run" : o, n(o)]));
  return t.gaits.includes("gallop") && !s.gallop && (s.gallop = n("gallop")), s;
}
const ee = Array.from({ length: 7 }, (t, e) => e === 0 ? "tail" : `tail-${e}`);
function E5(t, e, n) {
  const s = Nu(t.tail.points, ee.length + 1), [, o, i] = t.body.radii, r = (t.tail.at[1] - n) / o, a = Math.abs(r) < 1 ? -i * Math.sqrt(1 - r * r) : t.tail.at[2], l = [t.tail.at[0], t.tail.at[1], a + Math.min(0.04, i * 0.08)], c = (f) => t.tail.radius * (1 - 0.5 * f / ee.length), h = ee.map((f, g) => {
    const p = s[g], m = s[g + 1], b = [m[0] - p[0], m[1] - p[1], m[2] - p[2]], v = g === 0 ? void 0 : s[g - 1];
    return {
      id: f,
      ...g > 0 ? { parent: ee[g - 1] } : {},
      shape: { type: "tube", points: [[0, 0, 0], b], radius: [c(g), c(g + 1)], segments: 8, joined: !0 },
      // The first segment starts where the tail does; each next one starts at the end of the one before.
      at: g === 0 ? l : [p[0] - v[0], p[1] - v[1], p[2] - v[2]],
      fill: e.dark,
      outline: 0.8
    };
  }), u = s[s.length - 1], d = s[s.length - 2];
  return h.push({
    id: "tail-tip",
    parent: ee[ee.length - 1],
    shape: { type: "ellipsoid", radii: Array(3).fill(c(ee.length) * 1.05), segments: 8 },
    at: [u[0] - d[0], u[1] - d[1], u[2] - d[2]],
    fill: e.dark,
    outline: 0.8,
    solidOnly: !0
  }), h;
}
function A5(t, e, n) {
  const s = Math.max(0, Math.min(1, t.walking ?? 0));
  if (s === 0) return {};
  const o = As[Math.max(0, Math.min(3, Math.round(t.gait ?? 0)))], i = oi[e.gaits.includes(o) ? o : e.gaits[0]], r = t.walk ?? 0, a = {};
  for (const c of md) {
    const h = Math.PI * 2 * (r + i.offsets[c]);
    a[`${c}.swing`] = (t[`${c}.swing`] ?? 0) + s * i.swing * Math.sin(h), a[`${c}.knee`] = (t[`${c}.knee`] ?? 0) + s * i.lift * Math.max(0, Math.cos(h));
  }
  const l = Math.PI * 2 * r;
  return a.lift = (t.lift ?? 0) + s * i.bob * n * Math.abs(Math.sin(l * 2)), a.pitch = (t.pitch ?? 0) + s * i.rock * Math.sin(l), a.neck = (t.neck ?? 0) + s * (i.rock > 0 ? -i.rock * 1.4 : 5) * Math.sin(l * 2), a;
}
function ph(t) {
  const n = Math.sin(32 * Ie), s = t.legLength - (t.front - t.hind) * n, o = 72, r = (s - t.upper * Math.cos(o * Ie) - t.foot) / t.lower, a = r >= 1 ? 0 : r <= -1 ? 180 : Math.acos(r) / Ie, l = {
    pitch: 32,
    // The front hips stay at standing height: tipping up raises them by front · sin, and swinging them round the
    // middle lowers them by leg · (1 − cos); the front legs are held upright, so both are taken back.
    lift: t.legLength * (1 - Math.cos(32 * Ie)) - t.front * n,
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
const yd = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, neck: 2, tail: 3, wag: 3, "fl.swing": 2, "fr.swing": 2, "hl.swing": 2, "hr.swing": 2, "fl.knee": 3, "fr.knee": 3, "hl.knee": 3, "hr.knee": 3 },
  limits: { pitch: 6, neck: 8, tail: 10, wag: 8, "fl.swing": 8, "fr.swing": 8, "hl.swing": 8, "hr.swing": 8, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
}, iS = yd;
function $5(t) {
  const e = (t.upper + t.lower) * 0.32, n = Math.asin(Math.min(1, e / (t.upper + t.lower + t.foot))) / Ie, s = {
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
function P5(t, e) {
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
      const d = a.exaggeration;
      a.key(u + 180, { neck: -12 * d }, { act: !1, easing: "ease-out" });
      const g = Math.abs(l.to - a.x) / a.scale / Ha(e.legLength, r), p = l.for ?? Math.max(500, g * oi[r].cycle * n), m = a.values.walk ?? 0;
      return a.set("gait", u, a.values.gait ?? 0), a.set("gait", u + 1, As.indexOf(r)), a.set("walking", u, 0), a.set("walking", u + 240, 1, "ease-out"), a.set("walking", u + p - 240, 1), a.set("walking", u + p, 0, "ease-in"), a.set("walk", u, m), a.move(u, u + p, l.to, { easing: "ease-in-out" }), a.set("walk", u + p, m + g, "ease-in-out"), a.key(u + p + 300, { neck: 0 }), (r === "gallop" || r === "canter") && (a.effect({ kind: "dust", time: u + 200, x: a.x - h * e.legLength * a.scale, y: a.floor, length: 700, direction: -h }), a.effect({ kind: "dust", time: u + p, x: l.to + h * e.legLength * 0.6 * a.scale, y: a.floor, length: 600, direction: h })), { end: u + p + 300, contact: u, release: u + p };
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
        const c = ph(e), h = l + 450;
        r.key(h, c, { act: !1, easing: "ease-in-out" }), r.key(h + (a.for ?? 1500), c, { act: !1 });
        const u = h + (a.for ?? 1500) + 450, d = {};
        for (const f of Object.keys(c)) d[f] = 0;
        return r.key(u, d), { end: u, contact: h, release: u - 450 };
      }
    },
    lie: {
      summary: "Lies down for `for` ms (default 2000), head up and front paws forward (sinking back onto its haunches first), then gets up.",
      uses: ["for"],
      run(r, a, l) {
        const c = $5(e), h = { ...ph(e) }, u = l + 400, d = u + 450;
        r.key(u, h, { act: !1, easing: "ease-in-out" }), r.key(d, c, { act: !1, easing: "ease-in-out" }), r.key(d + (a.for ?? 2e3), c, { act: !1 });
        const f = d + (a.for ?? 2e3) + 600, g = {};
        for (const p of /* @__PURE__ */ new Set([...Object.keys(c), ...Object.keys(h)])) g[p] = 0;
        return r.key(f, g), { end: f, contact: d, release: f - 600 };
      }
    },
    jump: {
      summary: "Crouches and jumps (forward to `to`, or up on the spot), legs tucked in the air, landing with a squash and dust.",
      uses: ["to"],
      run(r, a, l) {
        const c = r.exaggeration, h = e.legLength * 0.8 * c, u = l + 260, d = u + 90, f = d + 520;
        if (r.key(u, { squash: 0.86, "hl.knee": 40, "hr.knee": 40, "fl.knee": 25, "fr.knee": 25, neck: 8 }, { act: !1, easing: "ease-out" }), r.key(d, { squash: 1.12, "hl.knee": 0, "hr.knee": 0, "fl.knee": 0, "fr.knee": 0, pitch: 8, "fl.swing": 35, "fr.swing": 35, "hl.swing": -35, "hr.swing": -35 }, { act: !1, easing: "ease-out" }), r.key((d + f) / 2, { lift: h, squash: 1, pitch: 0, "fl.knee": 60, "fr.knee": 60, "hl.knee": 60, "hr.knee": 60, "fl.swing": 25, "fr.swing": 25, "hl.swing": -20, "hr.swing": -20 }, { act: !1, easing: "ease-out" }), r.key(f, { lift: 0, squash: 0.85, pitch: -4, "fl.knee": 0, "fr.knee": 0, "hl.knee": 0, "hr.knee": 0, "fl.swing": 0, "fr.swing": 0, "hl.swing": 0, "hr.swing": 0 }, { act: !1, easing: "ease-in" }), r.key(f + 280, { squash: 1, pitch: 0, neck: 0 }), a.to !== void 0) {
          const g = Math.sign(a.to - r.x);
          g !== 0 && r.facing() !== g && r.turnTo(l, g > 0 ? "right" : "left"), r.move(d, f, a.to);
        }
        return r.effect({ kind: "dust", time: f, x: r.x, y: r.floor, length: 550 }), { end: f + 280, contact: f };
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
function I5(t = {}) {
  return rn({
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
          const i = n.exaggeration, r = Math.min(55, 32 * i), a = -e.hind * Math.sin(r * Ie), l = s.for ?? 700;
          n.key(o + 200, { pitch: -4, neck: 6, "hl.knee": 12, "hr.knee": 12 }, { act: !1, easing: "ease-out" }), n.key(o + 520, { pitch: r, lift: a, neck: -25, "fl.swing": 55, "fl.knee": 95, "fr.swing": 40, "fr.knee": 80, "hl.knee": 0, "hr.knee": 0 }, { act: !1, easing: "ease-out" }), n.key(o + 520 + l * 0.5, { "fl.swing": 35, "fl.knee": 70, "fr.swing": 58, "fr.knee": 100 }, { act: !1, easing: "ease-in-out" }), n.key(o + 520 + l, { "fl.swing": 55, "fl.knee": 95, "fr.swing": 40, "fr.knee": 80 }, { act: !1, easing: "ease-in-out" });
          const c = o + 520 + l + 380;
          return n.key(c, { pitch: 0, lift: 0, neck: 8, squash: 0.94, "fl.swing": 0, "fl.knee": 0, "fr.swing": 0, "fr.knee": 0 }, { act: !1, easing: "ease-in" }), n.key(c + 320, { neck: 0, squash: 1 }), e.call(n, o + 520), n.effect({ kind: "dust", time: c, x: n.x + (n.facing() || 1) * e.front * n.scale, y: n.floor, length: 600 }), { end: c + 320, contact: c };
        }
      },
      buck: {
        summary: "Bucks: drops its head and kicks both hind legs up and back.",
        run(n, s, o) {
          const i = n.exaggeration, r = Math.min(35, 18 * i), a = e.front * Math.sin(r * Ie);
          return n.key(o + 220, { pitch: 3, squash: 0.95 }, { act: !1, easing: "ease-out" }), n.key(o + 480, { pitch: -r, lift: a, neck: 30, "hl.swing": -65, "hr.swing": -60, "hl.knee": 10, "hr.knee": 10 }, { act: !1, easing: "ease-out" }), n.key(o + 900, { pitch: 0, lift: 0, neck: 0, squash: 0.95, "hl.swing": 0, "hr.swing": 0, "hl.knee": 0, "hr.knee": 0 }, { act: !1, easing: "ease-in" }), n.key(o + 1150, { squash: 1 }), n.effect({ kind: "dust", time: o + 900, x: n.x - (n.facing() || 1) * 0.6 * n.scale, y: n.floor, length: 600 }), { end: o + 1150, contact: o + 480 };
        }
      }
    })
  });
}
function O5(t = {}) {
  return rn({
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
function _5(t = {}) {
  return rn({
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
function H5(t = {}) {
  return rn({
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
function rS(t) {
  return Ha(1, t);
}
function C5(t = {}) {
  return rn({
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
function R5(t = {}) {
  return rn({
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
function L5(t = {}) {
  return rn({
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
const ve = 0.6, bd = 75, Xi = 80;
function an(t) {
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
    const u = h > 0 ? "left" : "right", d = t.head.radius;
    a.push({ id: `eye-${u}`, parent: "head", shape: { type: "ellipsoid", radii: [d * 0.16, d * 0.2, d * 0.18], segments: 8 }, at: [h * d * 0.72, d * 0.18, d * 0.42], fill: "#1d1d22", outline: 0.3 }), a.push({
      id: `wing-${u}`,
      shape: { type: "ellipsoid", radii: [4e-3, 4e-3, 4e-3], segments: 4 },
      at: [h * t.wing.shoulder[0], t.wing.shoulder[1], t.wing.shoulder[2]],
      rotate: [-8, h * 90, 0],
      outline: 0
    }), a.push({
      id: `wing-${u}-blade`,
      parent: `wing-${u}`,
      shape: { type: "ellipsoid", radii: [t.wing.span * ve / 2, t.wing.chord * 0.1, t.wing.chord / 2], segments: 12 },
      at: [h * t.wing.span * ve / 2, 0, -t.wing.chord * 0.1],
      // Folded, the blade is rolled about its length so it lies flat against the body's side.
      rotate: [-Xi, 0, 0],
      fill: e.wing,
      outline: 0.8
    }), a.push({
      id: `wing-${u}-tip`,
      parent: `wing-${u}-blade`,
      shape: { type: "ellipsoid", radii: [t.wing.span * ve / 2.4, t.wing.chord * 0.06, t.wing.chord * 0.3], segments: 10 },
      at: [h * t.wing.span * ve / 4, 0, -t.wing.chord * 0.3],
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
        { parts: ["wing-left-blade"], translate: [t.wing.span * (1 - ve) / 2, 0, 0], rotate: { axis: "x", degrees: Xi }, scale: [1 / ve, 1, 1] },
        { parts: ["wing-right-blade"], translate: [-t.wing.span * (1 - ve) / 2, 0, 0], rotate: { axis: "x", degrees: Xi }, scale: [1 / ve, 1, 1] }
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
      bind: [{ parts: ["neck"], rotate: { axis: "x", degrees: 1 }, translate: [0, -(t.neckReach ?? 0) / bd, 0] }]
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
      const u = {}, d = Math.max(0, Math.min(1, h.flapping ?? 0));
      d > 0 && (u.flap = (h.flap ?? 0) + d * 48 * Math.sin(Math.PI * 2 * (h.wingbeat ?? 0)));
      const f = Math.max(0, Math.min(1, h.stepping ?? 0));
      if (f > 0) {
        const g = Math.sin(Math.PI * 2 * (h.step ?? 0));
        u["leg.left"] = (h["leg.left"] ?? 0) + f * 28 * g, u["leg.right"] = (h["leg.right"] ?? 0) - f * 28 * g, u.peck = (h.peck ?? 0) + f * 12 * Math.sin(Math.PI * 4 * (h.step ?? 0));
      }
      return u;
    }
  };
  return {
    kind: t.kind,
    family: "bird",
    summary: t.summary,
    rig: c,
    actions: N5(t),
    acting: W5,
    colors: { body: e.body, ink: "#26262b" },
    moves: F5(t)
  };
}
function F5(t) {
  const e = t.legs.length * 1.2, n = { walk: { speed: e / 0.42, hold: { stepping: 1 }, perMetre: { step: 0.5 / e } } };
  return t.flies !== !1 && (n.fly = { speed: 4 + t.wing.span * 12, flies: !0, hold: { flapping: 1, spread: 1 }, perSecond: { wingbeat: t.beatsPerSecond ?? 4 } }), n;
}
const W5 = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, spread: 1, flap: 2, peck: 2 },
  limits: { pitch: 6, roll: 6, squash: 0.06, peck: 8, flap: 10, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
};
function N5(t) {
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
        const c = s(r, l, a.to), h = r.x, u = Math.abs(a.to - h), d = Math.max(1, Math.round(u / (t.body.radii[2] * 3 * r.scale))), f = 260;
        for (let g = 0; g < d; g++) {
          const p = c + g * f;
          r.key(p + 60, { squash: 0.85 }, { act: !1, easing: "ease-out" }), r.key(p + 150, { squash: 1.1, lift: t.legs.length * 1.4, spread: 0.15 }, { act: !1, easing: "ease-out" }), r.key(p + f, { squash: 0.9, lift: 0, spread: 0 }, { act: !1, easing: "ease-in" }), r.move(p + 60, p + f, h + (a.to - h) * (g + 1) / d, { easing: "ease-in-out" });
        }
        return r.key(c + d * f + 120, { squash: 1 }), { end: c + d * f + 120 };
      }
    },
    walk: {
      summary: "Walks to `to` on its two legs, its head bobbing with each step.",
      needs: ["to"],
      uses: ["for"],
      run(r, a, l) {
        const c = s(r, l, a.to), h = Math.abs(a.to - r.x) / r.scale, u = t.legs.length * 1.2, d = h / u, f = a.for ?? Math.max(400, d * 420), g = r.values.step ?? 0;
        return r.set("stepping", c, 0), r.set("stepping", c + 150, 1, "ease-out"), r.set("stepping", c + f - 150, 1), r.set("stepping", c + f, 0, "ease-in"), r.set("step", c, g), r.move(c, c + f, a.to, { easing: "ease-in-out" }), r.set("step", c + f, g + d / 2, "ease-in-out"), { end: c + f, contact: c, release: c + f };
      }
    },
    peck: {
      summary: "Pecks at the ground (`for` ms, default 900): quick jabs of the head.",
      uses: ["for"],
      run(r, a, l) {
        const c = a.for ?? 900, h = Math.max(1, Math.round(c / 300));
        r.key(l + 120, { pitch: -(t.stoop ?? 12) }, { act: !1, easing: "ease-out" });
        for (let u = 0; u < h; u++)
          r.key(l + 120 + u * 300 + 90, { peck: bd }, { act: !1, easing: "ease-in" }), r.key(l + 120 + u * 300 + 260, { peck: 20 }, { act: !1, easing: "ease-out" });
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
      const h = s(r, l, a.to), u = a.height ?? 2, d = a.for ?? Math.max(700, Math.abs(a.to - r.x) / 0.35), f = r.values.lift > t.legs.length, g = f ? h : h + 200;
      return f || (r.key(h + 160, { squash: 1 - 0.18 * c, spread: 0.6 }, { act: !1, easing: "ease-out" }), r.effect({ kind: "dust", time: g, x: r.x, y: r.floor, length: 400 })), r.key(g + 100, { spread: 1, squash: 1.08, pitch: 10 }, { act: !1, easing: "ease-out" }), r.set("flapping", g, r.values.flapping ?? 0), r.set("flapping", g + 100, 1, "ease-out"), r.set("flapping", g + d, 0.6), n(r, g, g + d), r.key(g + d * 0.4, { lift: u, pitch: -5, squash: 1 }, { act: !1, easing: "ease-out" }), r.key(g + d, { lift: u, pitch: 0 }, { act: !1, easing: "ease-in-out" }), r.move(g, g + d, a.to, { easing: "ease-in-out" }), { end: g + d, contact: g, release: g + d };
    }
  }, i.glide = {
    summary: "Glides to `to` on still, spread wings, sinking gently to `height` metres (default: a third lower than it is); from the ground it takes off first, flying the first stretch.",
    needs: ["to"],
    uses: ["height", "for"],
    run(r, a, l) {
      let c = l;
      if (r.values.lift <= t.legs.length) {
        const f = r.x + (a.to - r.x) / 3;
        c = i.fly.run(r, { do: "fly", to: f, height: (a.height ?? 1.5) * 1.3 }, l).end;
      }
      c = s(r, c, a.to);
      const h = r.values.lift, u = a.height ?? h * 0.67, d = a.for ?? Math.max(900, Math.abs(a.to - r.x) / 0.3);
      return r.set("flapping", c, r.values.flapping ?? 1), r.set("flapping", c + 250, 0, "ease-out"), n(r, c, c + 250), r.key(c + 300, { spread: 1, flap: 10, pitch: -6 }, { act: !1, easing: "ease-out" }), r.key(c + d, { lift: u, pitch: -3, flap: 10 }, { act: !1, easing: "ease-in-out" }), r.move(c, c + d, a.to, { easing: "ease-in-out" }), { end: c + d, contact: c, release: c + d };
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
function D5(t = {}) {
  return an({
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
function B5(t = {}) {
  return an({
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
function z5(t = {}) {
  return an({
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
function q5(t = {}) {
  return an({
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
function Y5(t = {}) {
  return an({
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
function j5(t = {}) {
  return an({
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
function K5(t = {}) {
  return an({
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
const ks = { car: Xk, truck: Uk, bus: Gk, tractor: Vk, cart: Jk, trainCar: Zk, bike: Qk, motorbike: t5, tree: e5, house: o5, chair: a5, desk: h5, bed: d5, door: p5, wheelchair: y5, helicopter: k5, airplane: M5, horse: I5, dog: O5, cat: _5, cow: H5, goat: C5, rabbit: R5, squirrel: L5, songbird: D5, crow: B5, chicken: z5, pigeon: q5, duck: Y5, owl: j5, parrot: K5 };
function wd(t, e = {}) {
  const n = ks[t];
  if (!n) throw new Error(ut("prop preset", t, Object.keys(ks)));
  return n(e);
}
const Cr = ["do", "at", "for", "to", "toward", "speed", "open", "on", "height", "wind"], Rr = { viewer: 0, right: 1, away: 2, left: 3 }, X5 = 420, kd = {
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
function Ca(t) {
  return { ...kd, ...t.actions };
}
const Ui = (t) => typeof t == "number" && Number.isFinite(t);
function U5(t, e) {
  if (!Array.isArray(t)) return [{ level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = Ca(e), s = Object.keys(n), o = [];
  return t.forEach((i, r) => {
    const a = (c) => o.push({ level: "error", beat: r, message: c });
    if (!i || typeof i != "object" || Array.isArray(i)) return a(`Each beat must be an object like { do: '${s[s.length - 1]}' }.`);
    const l = i;
    for (const c of Object.keys(l))
      Cr.includes(c) || a(ut("beat field", c, Cr, c === "duration" ? "for" : c === "direction" ? "toward" : void 0));
    if (typeof l.do != "string" || !s.includes(l.do)) return a(ut(`${e.kind} action`, l.do, s));
    for (const c of n[l.do].needs ?? []) l[c] === void 0 && a(`\`${l.do}\` needs \`${c}\`.`);
    for (const c of ["at", "for", "speed", "height", "wind"])
      l[c] !== void 0 && !(Ui(l[c]) && l[c] >= 0) && a(`\`${c}\` must be a number ≥ 0 (got ${JSON.stringify(l[c])}).`);
    if (l.to !== void 0 && !Ui(l.to) && a(`\`to\` is a scene x in px (got ${JSON.stringify(l.to)}).`), l.toward !== void 0 && !Ui(l.toward) && !(typeof l.toward == "string" && l.toward in Rr)) {
      const c = typeof l.toward == "string" ? ro(l.toward, Object.keys(Rr)) : void 0;
      a(`\`toward\` is viewer, right, away, left or a quarter-turn number${c ? ` (did you mean "${c}"?)` : ""} (got ${JSON.stringify(l.toward)}).`);
    }
    for (const c of ["open", "on"])
      l[c] !== void 0 && typeof l[c] != "boolean" && a(`\`${c}\` is true or false (got ${JSON.stringify(l[c])}).`);
  }), o;
}
function G5(t, e, n, s = {}) {
  const o = U5(n, e).filter((k) => k.level === "error");
  if (o.length > 0) throw new Error(`propScript (${e.kind}): ${o.length} problem(s) in the beats:
${o.map((k) => `  beat ${k.beat}: ${k.message}`).join(`
`)}`);
  const i = s.from ?? 0, r = s.ground ?? 0, a = s.scale ?? 60, l = s.exaggeration ?? 1, c = Ca(e), h = {};
  for (const k of [...Object.keys(Ts), ...Object.keys(e.rig.controls)]) h[k] = s.start?.[k] ?? Tt(e.rig, {}, k);
  const u = [{ time: 0, pose: { ...h } }], d = /* @__PURE__ */ new Map(), f = [];
  let g = i, p = r;
  const m = (k, x, P, E) => {
    const O = d.get(k) ?? [{ time: 0, value: k === "x" || k === "y" ? 0 : h[k] }];
    O.push({ time: x, value: P, ...E ? { easing: E } : {} }), d.set(k, O), k !== "x" && k !== "y" && (h[k] = P);
  }, b = (k, x) => {
    const P = k === "x" ? g - i : k === "y" ? p - r : h[k], E = d.get(k);
    (!E || E[E.length - 1].time < x) && m(k, x, P);
  }, v = {
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
      const k = Math.sin(h.turn * Math.PI / 2);
      return Math.abs(k) < 0.5 ? 0 : k > 0 ? 1 : -1;
    },
    key(k, x, P = {}) {
      Object.assign(h, x), u.push({ time: k, pose: { ...h }, ...P.act === !1 ? { act: !1 } : {}, ...P.easing ? { easing: P.easing } : {} });
    },
    move(k, x, P, E = {}) {
      b("x", k), m("x", x, P - i, E.easing), g = P, E.floor !== void 0 && (b("y", k), m("y", x, E.floor - r, E.easing), p = E.floor);
    },
    set(k, x, P, E) {
      m(k, x, P, E);
    },
    turnTo(k, x) {
      const P = typeof x == "number" ? x : Rr[x], E = h.turn, _ = [P - 4, P, P + 4].map((B) => ({ t: B, d: Math.abs(B - E) })).sort((B, X) => B.d - X.d || Math.abs(B.t) - Math.abs(X.t))[0];
      if (_.d < 1e-3) return k;
      const L = k + X5 * Math.max(1, _.d);
      return v.key(L, { turn: _.t }), L;
    },
    effect(k) {
      f.push(k);
    },
    anchor(k) {
      const P = Es(e, h, a).anchors[k];
      if (!P) throw new Error(`${e.kind}: no anchor "${k}"`);
      return { x: g + P.point.x, y: p + P.point.y };
    }
  }, w = [];
  let y = 0;
  for (const k of n) {
    const x = Math.max(k.at ?? y, u[u.length - 1].time), P = c[k.do].run(v, k, x);
    P.end > u[u.length - 1].time && u.push({ time: P.end, pose: { ...h } }), w.push({ start: x, end: P.end, ...P.contact !== void 0 ? { contact: P.contact } : {}, ...P.release !== void 0 ? { release: P.release } : {} }), y = P.end;
  }
  const T = Zu(s.style ?? "snappy"), $ = { ...T, anticipation: T.anticipation * l, overshoot: T.overshoot * l }, M = Ea(Q5(u), e.acting, { style: $ }), S = [
    // Controls keyed exactly (wheels, rotors) are not acted.
    ...Object.entries(M).filter(([k]) => !d.has(k)).map(([k, x]) => ({ id: `${t}-${k}`, target: t, property: k, keyframes: x })),
    ...[...d].map(([k, x]) => ({ id: `${t}-${k}`, target: t, property: k, keyframes: tv(x) }))
  ];
  for (const k of J5(t, e, S, y, u[0].pose)) {
    const x = S.findIndex((O) => O.property === k.property);
    if (x < 0) {
      S.push(k);
      continue;
    }
    const P = new It({ id: `${t}-own`, tracks: [S[x]] }), E = (O) => Number(P.getStateAtTime(O).values.get(t)?.get(k.property) ?? 0);
    S[x] = { ...k, keyframes: k.keyframes.map((O) => ({ time: O.time, value: Number(O.value) + E(O.time) })) };
  }
  return { tracks: S, duration: y, beats: w, effects: f };
}
const V5 = 1500;
function J5(t, e, n, s, o) {
  if (!e.follow?.length) return [];
  const i = new It({ id: `${t}-follow`, tracks: n.filter((a) => a.property === "turn" || e.follow.some((l) => l.of === a.property)) }), r = (a, l) => {
    const c = i.getStateAtTime(a).values.get(t)?.get(l);
    return typeof c == "number" ? c : o[l] ?? 0;
  };
  return e.follow.map((a) => {
    const l = s + V5, c = Us((d) => r(d, a.of), { start: 0, end: l, stiffness: a.stiffness, damping: a.damping }), h = a.limit ?? 1 / 0, u = c.map(({ time: d, value: f }) => {
      const g = Math.sin(r(d, "turn") * Math.PI / 2), p = (f - r(d, a.of)) * g;
      return { time: d, value: Math.max(-h, Math.min(h, p * a.per)) };
    });
    return { id: `${t}-${a.control}`, target: t, property: a.control, keyframes: u };
  });
}
const Z5 = 20;
function Q5(t) {
  const e = [...t].sort((s, o) => s.time - o.time), n = [];
  for (const s of e) {
    const o = n[n.length - 1];
    o && s.time - o.time < Z5 ? n[n.length - 1] = { ...s, time: o.time } : n.push(s);
  }
  return n;
}
function tv(t) {
  const e = t.map((s, o) => ({ k: s, i: o })).sort((s, o) => s.k.time - o.k.time || s.i - o.i), n = [];
  for (const { k: s } of e)
    n.length > 0 && n[n.length - 1].time === s.time ? n[n.length - 1] = s : n.push(s);
  return n;
}
const ev = {
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
function nv(t, e = {}) {
  const n = {};
  for (const s of Object.keys(zt)) n[s] = { summary: `Walks to \`to\` in the ${s} gait.`, needs: ["to"] };
  for (const s of Object.keys(Zt)) n[s] = { summary: `Moves into the ${s} pose and holds it (\`for\` ms).` };
  for (const s of Object.keys(en)) n[s] = { summary: `The ${s} gag (${$o(s)} ms).` };
  for (const [s, o] of Object.entries(si)) n[s] = { ...o };
  return {
    ...t ? { version: t } : {},
    timing: "JSON timelines and tracks are in milliseconds; the GSAP-style API (live.to, tf.timeline) takes seconds. Scene x grows right, y grows down, in px.",
    easings: {
      named: Object.keys(ev),
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
    canvasProperties: Pa,
    stickFigure: {
      poseFields: w0,
      props: k0,
      handFields: v0,
      poses: Object.keys(Zt),
      expressions: Object.keys(vt),
      gags: Object.fromEntries(Object.keys(en).map((s) => [s, $o(s)])),
      gaits: Object.keys(zt),
      actingStyles: Object.keys(An),
      beatFields: Ir,
      actions: n,
      dances: Object.fromEntries(Object.entries(sn).map(([s, o]) => [s, Object.keys(o.moves)])),
      flips: Object.fromEntries(Object.entries(Qo).map(([s, o]) => [s, o.label])),
      handShapes: Object.keys(Pt),
      mudras: Object.keys(gr)
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
      beatFields: Cr,
      commonControls: Object.fromEntries(Object.entries(Ts).map(([s, o]) => [s, `${o.description}${o.unit ? ` (${o.unit})` : ""}`])),
      commonActions: Object.fromEntries(Object.entries(kd).map(([s, o]) => [s, o.summary])),
      presets: Object.fromEntries(
        Object.entries(ks).map(([s, o]) => {
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
      poses: Object.keys(he),
      dances: Object.keys(Rn),
      expressions: Object.keys(j0),
      faceStyles: ["simple", "anime"],
      faceShapes: ["round", "angular"],
      gags: Object.keys(da),
      builds: Object.keys(yr),
      hair: Object.keys(Z0),
      hairColors: { ...ye },
      facialHair: Object.keys(cu),
      glasses: Object.keys(uu),
      hats: Object.keys(ua),
      feet: [...fy],
      cast: Object.keys(Ju),
      heldItems: Object.fromEntries(Object.entries(ku).map(([s, o]) => [s, o.hands])),
      handMeetings: Object.keys(Ao)
    },
    codePanel: {
      languages: Ar,
      removeStyles: Er,
      anchors: {
        "line(n, time?)": "line n’s text box { x, y, left, right, top, bottom, width, height }: stand on top, point at x, y",
        "token(n, text, occurrence?, time?)": "a word on a line",
        "spot(n, column, width?, time?)": "a place in a line, for put and write",
        "landing(piece, n, column)": "where a dropped piece will land",
        box: "the whole panel"
      },
      edits: Vu
    },
    surfaces: { code: to, board: xe, chart: vn, prop: es },
    surfaceScript: {
      "surfaceScript(figureId, { name: surface }, beats, options)": "compiles beats that act on surfaces: returns the script result with `tracks` (the figure’s, ridden, then every surface’s, keyed by its name) and `figureTracks`; options are scriptTracks’ plus `figureStyle` (for carry) and `ride` (default true)",
      "checkSurfaceBeats(beats, surfaces, cast?)": "every problem checkBeats finds, plus unknown surfaces, places, edits and moments, with suggestions",
      "{ surface, anchor }": "a named place, where a beat takes `target` (its box), `to` (its centre x) or `onto` (its top); as laid out, before any edit moves it",
      "then: { surface, edit, anchor, at?, until?, …options }": "what the surface does in answer to the beat (or a list of them): one of its edits, or `carry` (the piece follows the hand until `until`); the other fields are the edit’s options",
      at: `a moment of the beat: ${as.join(", ")} (default contact, or start when the beat has none); not ms`,
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
const bt = (t) => t.map((e) => `\`${e}\``).join(", "), gh = (t) => Object.entries(t).map(([e, n]) => `| \`${e}\` | ${n.unit ?? n.kind ?? ""} | ${n.description} |`).join(`
`);
function aS(t, e = {}) {
  const n = nv(t, e), s = n.stickFigure;
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
    gh(s.poseFields),
    "",
    "### Other props",
    "",
    "| Prop | Unit | What it does |",
    "|---|---|---|",
    gh(s.props),
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
    `- \`hair\`: ${bt(n.character.hair)} (colours: ${bt(Object.keys(n.character.hairColors))} in \`HAIR_COLORS\`)`,
    `- \`facialHair\`: ${bt(n.character.facialHair)}`,
    `- \`glasses\`: ${bt(n.character.glasses)}; \`hat\`: ${bt(n.character.hats)}; \`ears: true\`; \`face: { teeth, tongue }\` (shown when the mouth opens); \`feet\`: ${bt(n.character.feet)}`,
    "- `outfit`: `{ shirt, trousers, sleeves: short | long | none, bottom: trousers | shorts | skirt, collar, tie: colour, over: apron | labCoat | hoodie | cardigan | overalls | sari, overColor, shoes: boots, shoeColor }`",
    `- \`castMember(name, height)\`: ${bt(n.character.cast)}`,
    "- Face marks (pose fields, 0–1): `blush`, `tears`, `sweat`; close-up fields `pupil` (size, 1 usual), `lid` (upper lids lowered, 0–1), `bulge` (eyes out of the head, 0–1); `face: { nose: true, inPupil(ctx, pupil) }`; `drawCharacterHead(ctx, who, pose, { x, y, radius })` draws just the head big",
    `- Face styles: ${bt(n.character.faceStyles)}; \`face: { style: 'anime', iris: '#4b7fce', lashes: true, ageLines: 0.8 }\` uses coloured eyes and the same expressions, blinks and gaze. \`ANIME_CAST\` contains eight age presets, also available through \`castMember\`.`,
    `- Face shapes: ${bt(n.character.faceShapes)}; \`face: { shape: 'angular', jawWidth: 0.74, chinWidth: 0.14, eyeScale: 0.8, eyeAspect: 0.65 }\` sets a tapered 3D jaw and narrower anime eyes. \`MANGA_CAST\` contains four original young adult presets; hair styles \`mangaSpikes\` and \`mangaSweep\` remain editable.`,
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
function lS(t, e, n, s = {}) {
  const o = s.color ?? "#555", i = s.size ?? 60;
  for (const r of e) {
    const a = (n - r.time) / r.length;
    if (a <= 0 || a >= 1) continue;
    const l = Qt(`${r.kind}:${r.time}:${r.x}`);
    r.kind === "dust" ? T2(t, { x: r.x, y: r.y }, a, { size: i, color: o, seed: l }) : r.kind === "exhaust" ? iv(t, r, a, i, o, l) : r.kind === "skid" ? rv(t, r, a, n, o) : r.kind === "honk" ? av(t, r, a, i, o) : r.kind === "smoke" ? sv(t, r, n, i, o) : r.kind === "leaves" && ov(t, r, a, i, s.leafColor ?? "#5cae5a", o, l);
  }
}
function sv(t, e, n, s, o, i) {
  const r = e.direction ?? 1, a = 380, l = 1500;
  t.save(), t.strokeStyle = o, t.lineWidth = Math.max(1, s * 0.025);
  for (let c = e.time; c <= e.time + e.length - l; c += a) {
    const h = (n - c) / l;
    if (h <= 0 || h >= 1) continue;
    const u = Math.sin(c / 97 + h * 4) * s * 0.06, d = e.x + r * h * s * 0.7 + u, f = e.y - h * s * 1.6;
    t.globalAlpha = Math.min(1, h * 6) * (1 - h) * 0.85, t.beginPath(), t.arc(d, f, s * (0.07 + h * 0.2), 0, Math.PI * 2), t.stroke();
  }
  t.restore();
}
function ov(t, e, n, s, o, i, r) {
  const a = e.direction ?? 1, l = e.toY ?? e.y + s * 3;
  t.save(), t.lineWidth = Math.max(1, s * 0.02), t.strokeStyle = i, t.fillStyle = o;
  for (let c = 0; c < 4; c++) {
    const h = Qt(`${r}:${c}`) % 1e3 / 1e3, u = Math.min(1, n * (1.1 + h * 0.4)), d = e.x + (h - 0.5) * s * 1.2, f = e.y + (h - 0.3) * s * 0.4, g = u * u * 0.4 + u * 0.6, p = d + a * u * s * (0.6 + h) + Math.sin(u * 9 + h * 6) * s * 0.18, m = Math.min(l - 2, f + (l - f) * g);
    t.globalAlpha = n > 0.85 ? (1 - n) / 0.15 : 1, t.save(), t.translate(p, m), t.rotate(Math.sin(u * 7 + h * 5) * 1.2), t.beginPath(), t.ellipse(0, 0, s * 0.07, s * 0.035, 0, 0, Math.PI * 2), t.fill(), t.stroke(), t.restore();
  }
  t.restore();
}
function iv(t, e, n, s, o, i) {
  const r = e.direction ?? -1;
  t.save(), t.strokeStyle = o, t.lineWidth = Math.max(1, s * 0.025);
  for (let a = 0; a < 3; a++) {
    const l = n * 1.6 - a * 0.25;
    if (l <= 0 || l >= 1) continue;
    const c = (Qt(`${i}:${a}`) % 100 / 100 - 0.5) * s * 0.1, h = e.x + r * l * s * 0.9, u = e.y - l * s * 0.45 + c;
    t.globalAlpha = (1 - l) * 0.9, t.beginPath(), t.arc(h, u, s * (0.06 + l * 0.14), 0, Math.PI * 2), t.stroke();
  }
  t.restore();
}
function rv(t, e, n, s, o) {
  const i = e.toX ?? e.x, r = Math.min(1, (s - e.time) / e.length * 3), a = e.x + (i - e.x) * r;
  t.save(), t.strokeStyle = o, t.lineCap = "round", t.globalAlpha = n < 0.6 ? 0.8 : 0.8 * (1 - (n - 0.6) / 0.4), t.lineWidth = 3;
  for (const l of [-2, 4])
    t.beginPath(), t.moveTo(e.x, e.y + l), t.lineTo(a, e.y + l), t.stroke();
  t.restore();
}
function av(t, e, n, s, o) {
  const i = e.direction ?? 1;
  t.save(), t.strokeStyle = o, t.lineWidth = Math.max(1.5, s * 0.04), t.lineCap = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  const r = s * (0.15 + 0.5 * (1 - (1 - n) ** 2));
  for (let a = -1; a <= 1; a++) {
    const l = a * Math.PI / 7, c = e.x + i * Math.cos(l) * r, h = e.y + Math.sin(l) * r;
    t.beginPath(), t.arc(c, h, s * 0.12, i > 0 ? -Math.PI / 3 : Math.PI * 2 / 3, i > 0 ? Math.PI / 3 : Math.PI * 4 / 3), t.stroke();
  }
  t.restore();
}
function cS(t) {
  const e = new It({ id: `${t.propId}-ride`, tracks: t.propTracks.filter((h) => h.target === t.propId) }), n = t.every ?? 33, s = [], o = [], i = [], r = [];
  let a = 1;
  for (let h = t.start; ; h = Math.min(t.end, h + n)) {
    const u = _a(t.prop, { state: e.getStateAtTime(h) }, t.propId), d = u.anchor(t.anchor);
    s.push({ time: h, value: d.x + (t.offset?.x ?? 0) - t.figure.x }), o.push({ time: h, value: d.y + (t.offset?.y ?? 0) - t.figure.y });
    const f = Math.sin(u.values.turn * Math.PI / 2);
    if (Math.abs(f) > 0.15 && (a = f > 0 ? 1 : -1), i.push({ time: h, value: Math.abs(f) }), r.push({ time: h, value: a }), h >= t.end) break;
  }
  const l = t.figureId, c = [
    { id: `${l}-x`, target: l, property: "x", keyframes: s },
    { id: `${l}-y`, target: l, property: "y", keyframes: o }
  ];
  return t.turn !== !1 && c.push({ id: `${l}-turn`, target: l, property: "turn", keyframes: i }, { id: `${l}-facing`, target: l, property: "facing", keyframes: lv(r) }), c;
}
function lv(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && s.value !== n.value && e.push({ time: n.time - 1, value: s.value }), (!s || s.value !== n.value || n === t[t.length - 1]) && e.push(n);
  }
  return e;
}
function hS(t, e, n) {
  const s = (r) => `${r.target}\0${r.property}`, o = new Map(e.map((r) => [s(r), r]));
  return [...t.map((r) => {
    const a = o.get(s(r));
    if (!a) return r;
    o.delete(s(r));
    const c = [...(r.keyframes ?? []).filter((h) => h.time < n.from || h.time > n.to), ...a.keyframes ?? []].sort((h, u) => h.time - u.time);
    return { ...r, keyframes: c };
  }), ...o.values()];
}
function uS(t) {
  const e = new It({ id: `${t.leaderId}-tow`, tracks: t.leaderTracks.filter((f) => f.target === t.leaderId) }), n = t.every ?? 33, s = t.towed, o = s.x + s.width / 2, i = s.props, r = s.prop.wheelRadius, a = [], l = [], c = [];
  let h = i.wheelSpin ?? 0, u;
  for (let f = t.start; ; f = Math.min(t.end, f + n)) {
    const g = _a(t.leader, { state: e.getStateAtTime(f) }, t.leaderId), p = g.anchor(t.hitch), m = g.values.turn, b = Es(s.prop, { ...i, turn: m }, s.propScale).anchors[t.anchor];
    if (!b) throw new Error(`propTow: ${s.prop.kind} has no anchor "${t.anchor}"`);
    const v = p.x - b.point.x;
    if (u !== void 0 && r) {
      const w = Math.sin(m * Math.PI / 2);
      h += (v - u) * (w || 1) / s.propScale / r * (180 / Math.PI);
    }
    if (u = v, a.push({ time: f, value: v - o }), l.push({ time: f, value: m }), c.push({ time: f, value: h }), f >= t.end) break;
  }
  const d = t.towedId;
  return [
    { id: `${d}-x`, target: d, property: "x", keyframes: a },
    { id: `${d}-turn`, target: d, property: "turn", keyframes: l },
    ...r ? [{ id: `${d}-wheelSpin`, target: d, property: "wheelSpin", keyframes: c }] : []
  ];
}
const mh = /* @__PURE__ */ new WeakMap();
function cv(t, e) {
  const n = e?.some(Boolean) ? e.map((d) => d ? 1 : 0).join("") : "";
  let s = mh.get(t);
  s || mh.set(t, s = /* @__PURE__ */ new Map());
  const o = s.get(n);
  if (o) return o;
  const i = Io(t), r = { vertices: i.vertices, faces: i.faces.filter((d, f) => !e?.[f]) }, a = r.vertices.flatMap((d) => [d[0], d[1], d[2]]), l = r.vertices.map(() => [0, 0, 0]), c = [];
  r.faces.forEach((d) => {
    for (const p of d.corners) for (const m of [0, 1, 2]) l[p][m] += d.normal[m];
    const [f, ...g] = d.corners;
    for (let p = 0; p + 1 < g.length; p++) {
      const [m, b, v] = [f, g[p], g[p + 1]], [w, y, T] = [r.vertices[m], r.vertices[b], r.vertices[v]], $ = [y[0] - w[0], y[1] - w[1], y[2] - w[2]], M = [T[0] - w[0], T[1] - w[1], T[2] - w[2]], S = [$[1] * M[2] - $[2] * M[1], $[2] * M[0] - $[0] * M[2], $[0] * M[1] - $[1] * M[0]], k = S[0] * d.normal[0] + S[1] * d.normal[1] + S[2] * d.normal[2];
      c.push(...k >= 0 ? [m, b, v] : [m, v, b]);
    }
  });
  const h = l.flatMap((d) => {
    const f = Math.hypot(...d) || 1;
    return [d[0] / f, d[1] / f, d[2] / f];
  }), u = So({ positions: a, normals: h, indices: c });
  return s.size >= 16 && s.clear(), s.set(n, u), u;
}
function hv(t, e, n = {}) {
  const s = t.ink ?? n.ink ?? "#26262b", o = (n.outline ?? 2) * (t.outline ?? 1), i = t.glow && e.glow > 0 ? uv(t.glow.color, e.glow) : void 0;
  return {
    // A part with no fill (a spoked wheel's wire) is drawn in its ink.
    color: t.fill ?? s,
    // A smooth shape (an ellipsoid, a tube) shows only its silhouette, not the facets it is built of.
    creases: Io(t.shape).creases !== !1,
    shading: n.shading ?? "toon",
    ...o > 0 ? { outline: { width: o, color: s } } : {},
    ...i ? { emissive: i } : {},
    ...t.seeThrough ? { opacity: 0.45 * e.opacity } : e.opacity < 1 ? { opacity: e.opacity } : {}
  };
}
function uv(t, e) {
  const n = /^#([0-9a-f]{6})$/i.exec(t.trim());
  return n ? `#${[0, 2, 4].map((o) => Math.round(parseInt(n[1].slice(o, o + 2), 16) * Math.max(0, Math.min(1, e)))).map((o) => o.toString(16).padStart(2, "0")).join("")}` : t;
}
const dv = So(Pu(1, 2e-3, 28));
function fv(t, e, n) {
  const s = t.rig, [o, i] = s.footprint ?? [s.length * 0.45, s.length], r = Math.max(0, Tt(s, e, "lift")), a = Math.max(0, Tt(s, e, "size")) / (1 + r * 0.8);
  return {
    mesh: dv,
    world: At(n, Yr([0, 4e-3, 0], [0, 0, 0, 1], [o * 0.55 * a || 1e-4, 1, i * 0.55 * a || 1e-4])),
    material: { color: "#000000", shading: "unlit", opacity: 0.16 * a }
  };
}
const pv = /* @__PURE__ */ new Set([
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
]), gv = 1, dS = {
  kind: "prop",
  validate(t) {
    const e = t, n = typeof e.prop == "string" && e.prop in ks ? [] : [ut("prop preset", e.prop, Object.keys(ks))];
    for (const [s, o] of [[0, "rotateX"], [1, "rotateY"], [2, "rotateZ"]])
      o in e && n.push(`${o} is a track, not a field: place it turned with rotation: [${[0, 1, 2].map((i) => i === s ? e[o] : 0).join(", ")}]`);
    return n;
  },
  prepare(t) {
    const e = t;
    return wd(e.prop, e.options);
  },
  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object: t, prepared: e, values: n, world: s, camera: o, lights: i = [], fog: r, toScreen: a }) {
    const l = t, c = e, h = { ...l.values };
    for (const [M, S] of n)
      typeof S == "number" && !pv.has(M) && (h[M] = S);
    h.turn = 0, h.tilt = 0;
    const u = At(o.view, s), d = {
      toView: (M) => jt(u, M),
      toScreen: (M) => a(M)
    }, f = d.toView([0, c.rig.height / 2, 0]);
    if (-f[2] <= o.near) return null;
    if (l.look === "mesh") {
      const M = Lk(c.rig, h), S = M.map(({ part: P, local: E }) => ({ part: P.id, mesh: Io(P.shape), ...Ia(Io(P.shape), E) })), k = ld(S), x = M.map((P, E) => ({ ...P, hidden: cd(P.part.id, S[E].mesh, P.local, S[E].key, k) })).filter(({ opacity: P }) => P > 0.01).map(({ part: P, matrix: E, glow: O, opacity: _, hidden: L }) => ({
        mesh: cv(P.shape, L),
        world: At(s, E),
        material: hv(P, { glow: O, opacity: _ }, { shading: l.shading, ink: l.ink, outline: l.outline })
      }));
      return { meshes: l.shadow === !1 ? x : [fv(c, h, s), ...x] };
    }
    const g = a(f), p = a(d.toView([0, c.rig.height / 2 + 1, 0])), m = Math.hypot(p.x - g.x, p.y - g.y), b = i.length === 0 ? void 0 : (M, S) => {
      const k = jt(s, M), x = [s[0] * S[0] + s[4] * S[1] + s[8] * S[2], s[1] * S[0] + s[5] * S[1] + s[9] * S[2], s[2] * S[0] + s[6] * S[1] + s[10] * S[2]], P = Math.hypot(...x) || 1;
      return { light: Iu(k, [x[0] / P, x[1] / P, x[2] / P], i), fog: Ou(r, Math.hypot(k[0] - o.position[0], k[1] - o.position[1], k[2] - o.position[2])) };
    }, v = hd(c.rig, h, d, m, { perspective: !0, near: o.near, slice: gv, light: b }), w = { look: l.look, style: l.style, ink: l.ink, paper: l.paper, fog: r?.color }, y = Hu(v), T = v.cells ?? [], $ = Math.max(...T.map((M) => -M.depth), -f[2]);
    return {
      drawables: [
        ...l.shadow === !1 ? [] : [{ depth: $ + c.rig.length, draw: (M) => Cu(M, v, w) }],
        ...T.map((M) => ({
          depth: -M.depth,
          draw(S, k) {
            S.lineCap = "round", S.lineJoin = "round", Yb(S, M.parts, y, { ...w, time: k.time });
          }
        }))
      ]
    };
  }
}, yh = ["do", "at", "for", "to", "through", "toward", "speed", "height", "open", "on", "wind"], mv = 0.25, yv = 800 / 180, bv = 220, wv = 300, kv = ["turn"];
function vv(t) {
  const e = Ca(t), n = Object.keys(t.moves ?? {});
  return Object.keys(e).filter((s) => !n.includes(s) && !kv.includes(s) && !(e[s].needs ?? []).includes("to"));
}
function Mv(t, e) {
  if (!Array.isArray(t)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = Object.keys(e.moves ?? {}), s = vv(e), o = [...n, "face", "hold", ...s.filter((r) => r !== "hold")], i = [];
  return t.forEach((r, a) => {
    const l = (u) => i.push({ beat: a, message: u });
    if (!r || typeof r != "object" || Array.isArray(r)) return l(`Each beat must be an object like { do: '${o[0] ?? "hold"}' }.`);
    const c = r, h = { duration: "for", path: "through", points: "through", position: "to", heading: "toward", direction: "toward" };
    for (const u of Object.keys(c)) yh.includes(u) || l(ut("beat field", u, yh, h[u]));
    if (typeof c.do != "string" || !o.includes(c.do)) {
      const u = c.do === "turn" ? "face" : void 0;
      return l(ut(`${e.kind} 3D beat`, c.do, o, u));
    }
    n.includes(c.do) && (c.to === void 0 && c.through === void 0 && l(`\`${c.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`), c.to !== void 0 && !ze(c.to) && l(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(c.to)}).`), c.through !== void 0 && !(Array.isArray(c.through) && c.through.length > 0 && c.through.every(ze)) && l("`through` is a list of points on the ground, each [x, z] metres.")), c.do === "face" && !(ze(c.toward) || typeof c.toward == "number") && l("`face` needs `toward`: a point [x, z] or a heading in degrees.");
  }), i;
}
function fS(t, e, n, s) {
  const o = Mv(n, e);
  if (o.length > 0) throw new Error(`propScript3D (${e.kind}): ${o.length} problem(s) in the beats:
${o.map((w) => `  beat ${w.beat}: ${w.message}`).join(`
`)}`);
  const i = {};
  for (const w of [...Object.keys(Ts), ...Object.keys(e.rig.controls)]) i[w] = s.values?.[w] ?? Tt(e.rig, {}, w);
  let [r, a] = s.position ?? [0, 0], l = s.heading ?? 0;
  const c = /* @__PURE__ */ new Map(), h = (w, y, T, $ = "linear") => {
    const M = c.get(w) ?? [];
    M.push({ time: y, value: T, easing: $ }), c.set(w, M);
  }, u = (w, y, T) => h(w, y, T);
  h("x", 0, r), h("z", 0, a), h("rotateY", 0, l);
  const d = (w, y) => {
    const T = To(l, y);
    if (Math.abs(T) < 1) return w;
    const $ = Math.max(bv, Math.abs(T) * yv);
    return u("rotateY", w, l), l += T, h("rotateY", w + $, l, "ease-in-out"), w + $;
  }, f = (w, y, T) => {
    const $ = Bu([[r, a], ...y.through ?? [y.to]]);
    if ($.length < 2) return T;
    const M = d(T, En($[0].point, $[1].point)), S = $[$.length - 1].at, k = y.for ?? S / (y.speed ?? w.speed) * 1e3, x = Ft("ease-in-out"), P = Math.min(wv, k / 4);
    for (const [X, J] of Object.entries(w.set ?? {}))
      u(X, M, i[X]), h(X, M + 1, J), i[X] = J;
    const E = w.flies ? y.height ?? (i.lift > 0.05 ? i.lift : 2) : void 0, O = E !== void 0 && E > 0.05;
    for (const [X, J] of Object.entries(w.hold ?? {}))
      u(X, M, i[X]), h(X, M + P, J, "ease-out"), O || (h(X, M + k - P, J), h(X, M + k, 0, "ease-in")), i[X] = O ? J : 0;
    E !== void 0 && (u("lift", M, i.lift), h("lift", M + Math.min(k * 0.35, 1400), E, "ease-out"), h("lift", M + k, E), i.lift = E);
    const _ = { ...i };
    let L = l;
    for (let X = 0; ; X = Math.min(S, X + mv)) {
      const J = M + qu(x, X / S) * k, { point: q, direction: R } = zu($, X);
      L += To(L, En([0, 0], R)), h("x", J, q[0]), h("z", J, q[1]), h("rotateY", J, L);
      for (const [D, I] of Object.entries(w.perMetre ?? {})) h(D, J, _[D] + X * I);
      for (const [D, I] of Object.entries(w.perSecond ?? {})) h(D, J, _[D] + (J - M) / 1e3 * I);
      if (X >= S) break;
    }
    for (const [X, J] of Object.entries(w.perMetre ?? {})) i[X] = _[X] + S * J;
    for (const [X, J] of Object.entries(w.perSecond ?? {})) i[X] = _[X] + k / 1e3 * J;
    return [r, a] = $[$.length - 1].point, l = L, M + k;
  }, g = (w, y) => {
    const T = Object.fromEntries(Object.entries(w).filter(([M]) => !["at", "to", "through", "toward"].includes(M))), $ = G5(t, e, [T], { start: { ...i, turn: 1 }, scale: 100, style: s.style, exaggeration: s.exaggeration });
    for (const M of $.tracks) {
      if (xv.includes(M.property)) continue;
      const S = M.keyframes ?? [], k = i[M.property];
      if (!S.every((x) => x.value === k)) {
        u(M.property, y, k);
        for (const x of S) x.time > 0 && c.get(M.property).push({ ...x, time: y + x.time });
        i[M.property] = S[S.length - 1].value;
      }
    }
    return y + $.duration;
  }, p = [];
  let m = 0;
  for (const w of n) {
    const y = w.at ?? m;
    let T = y;
    const $ = e.moves?.[w.do];
    $ ? T = f($, w, y) : w.do === "face" ? T = d(y, typeof w.toward == "number" ? w.toward : En([r, a], w.toward)) : w.do === "hold" ? T = y + (w.for ?? 1e3) : T = g(w, y), p.push({ do: w.do, start: y, end: T }), m = T;
  }
  const b = `${s.scene}/${t}`;
  return { tracks: [...c].map(([w, y]) => ({
    id: `${t}-${w}`,
    target: b,
    property: w,
    keyframes: Du(y)
  })), duration: m, beats: p, end: { position: [r, a], heading: l, values: { ...i } } };
}
const xv = ["x", "y", "turn", "facing", "tilt"], Sv = 0.35, vd = {
  seated: he.sit,
  astride: { ...he.sit, "leg.left.spread": 26, "leg.right.spread": 26, "leg.left.swing": 40, "leg.right.swing": 40, "leg.left.knee": 70, "leg.right.knee": 70 },
  driving: { ...he.sit, "arm.left.swing": 52, "arm.right.swing": 52, "arm.left.spread": 8, "arm.right.spread": 8, "arm.left.elbow": 38, "arm.right.elbow": 38, lean: 4 },
  wheeling: { ...he.sit, "arm.left.swing": -6, "arm.right.swing": -6, "arm.left.spread": 16, "arm.right.spread": 16, "arm.left.elbow": 28, "arm.right.elbow": 28, "leg.left.knee": 80, "leg.right.knee": 80 },
  cycling: { ...he.sit, lean: 22, bend: 10, "head.nod": -14, "arm.left.swing": 58, "arm.right.swing": 58, "arm.left.spread": 10, "arm.right.spread": 10, "arm.left.elbow": 22, "arm.right.elbow": 22, "leg.left.spread": 6, "leg.right.spread": 6 }
}, Tv = 22, bh = 38;
function wh(t, e = vd.cycling) {
  const n = t * Math.PI * 2, s = (r) => ({
    swing: (e["leg.left.swing"] ?? 40) + Tv * Math.cos(n + r),
    // The knee straightens as the foot pushes down and over the bottom of the stroke.
    knee: (e["leg.left.knee"] ?? 70) + bh * (0.5 + 0.5 * Math.cos(n + r)) - bh * 0.5,
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
function pS(t) {
  const e = t.cadence ?? 1.2, n = Math.max(2, t.samplesPerTurn ?? 8), s = 1e3 / e / n, o = [];
  for (let i = t.start, r = 0; i < t.end; i += s, r++)
    o.push({ time: Math.round(i), pose: wh((i - t.start) / 1e3 * e, t.base), ...r > 0 ? { act: !1 } : {} });
  return o.push({ time: t.end, pose: wh((t.end - t.start) / 1e3 * e, t.base), act: !1 }), o;
}
const kh = (t, e) => {
  const n = e * Math.PI / 180;
  return [t[0] * Math.cos(n) + t[2] * Math.sin(n), t[1], -t[0] * Math.sin(n) + t[2] * Math.cos(n)];
};
function gS(t) {
  const e = `${t.scene}/${t.propId}`, n = new It({ id: `${t.propId}-ride-3d`, tracks: t.propTracks.filter((m) => m.target === e) }), s = t.placement ?? {}, [o, i, r] = s.position ?? [0, 0, 0], a = t.prop.rig, l = fa({ ...t.character, height: 1 }), c = { ...ht, ...t.pose ?? vd.seated }, h = jo(l.plan, c, { height: t.height ?? 1.7, contact: l.contact }).hip, u = t.facing ?? 0, d = t.every ?? 33, f = { x: [], y: [], z: [], rotateY: [] };
  for (let m = t.start; ; m = Math.min(t.end, m + d)) {
    const b = n.getStateAtTime(m).values.get(e) ?? /* @__PURE__ */ new Map(), v = (_, L) => {
      const B = b.get(_);
      return typeof B == "number" ? B : L;
    }, w = { ...s.values };
    for (const _ of Object.keys(a.controls)) w[_] = v(_, s.values?.[_] ?? Tt(a, {}, _));
    for (const _ of ["pitch", "roll", "squash", "lift", "lean", "size"]) w[_] = v(_, s.values?.[_] ?? Tt(a, {}, _));
    const y = Fk(a, w)[t.anchor];
    if (!y) throw new Error(`propRide3D: ${t.prop.kind} has no anchor "${t.anchor}" (it has ${Object.keys(a.anchors ?? {}).join(", ") || "none"})`);
    const T = v("rotateY", s.heading ?? 0), $ = kh(y, T), M = [v("x", o) + $[0], v("y", i) + $[1], v("z", r) + $[2]], S = T + u, k = kh(h, S);
    let x = [M[0] - k[0], M[1] - k[1], M[2] - k[2]];
    const P = (_, L) => {
      const B = L * L * (3 - 2 * L);
      return [_[0] + (x[0] - _[0]) * B, x[1] * B + Sv * Math.sin(Math.PI * L), _[1] + (x[2] - _[1]) * B];
    }, E = t.mount ? Math.max(1, t.mount.for ?? 450) : 0, O = t.dismount ? Math.max(1, t.dismount.for ?? 450) : 0;
    if (t.mount && m < t.start + E ? x = P(t.mount.from, (m - t.start) / E) : t.dismount && m > t.end - O && (x = P(t.dismount.to, (t.end - m) / O)), f.x.push({ time: m, value: x[0] }), f.y.push({ time: m, value: x[1] }), f.z.push({ time: m, value: x[2] }), f.rotateY.push({ time: m, value: S }), m >= t.end) break;
  }
  const g = t.riderId, p = `${t.scene}/${g}`;
  return Object.keys(f).map((m) => ({ id: `${g}-${m}`, target: p, property: m, keyframes: f[m] }));
}
const Ev = {
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
}, Vn = [
  [0, "#0b1530", "#1b2a4a"],
  [4.5, "#141a3e", "#2a2f5a"],
  [6, "#4a3f7a", "#f0a070"],
  [7.5, "#86c2ee", "#d8ecf8"],
  [12, "#5aaef2", "#c0e2f8"],
  [16.5, "#69b0e6", "#f5d79a"],
  [18.5, "#4c3f78", "#f08a5a"],
  [20.5, "#17203f", "#2d3660"],
  [24, "#0b1530", "#1b2a4a"]
], ls = (t, e, n) => {
  const s = (r) => [1, 3, 5].map((a) => parseInt(r.slice(a, a + 2), 16)), [o, i] = [s(t), s(e)];
  return `#${o.map((r, a) => Math.round(r + (i[a] - r) * n).toString(16).padStart(2, "0")).join("")}`;
}, Av = (t) => {
  const e = (t % 24 + 24) % 24;
  return e < 5 || e > 20 ? 0 : e < 7 ? (e - 5) / 2 : e > 18 ? (20 - e) / 2 : 1;
};
function $v(t) {
  const e = (t % 24 + 24) % 24;
  for (let n = 1; n < Vn.length; n++) {
    const [s, o, i] = Vn[n - 1], [r, a, l] = Vn[n];
    if (e <= r) {
      const c = (e - s) / (r - s);
      return { top: ls(o, a, c), bottom: ls(i, l, c) };
    }
  }
  return { top: Vn[0][1], bottom: Vn[0][2] };
}
const Pv = (t, e) => {
  const n = ((t - e) % 24 + 24) % 24;
  return n <= 12 ? n / 12 : -1;
}, Iv = 9, Ov = 55, _v = 28;
function Hv(t) {
  const { x: e, y: n, width: s, height: o } = t, i = t.kind ?? "sky", r = t.ground ?? n + o * 0.85, a = { ...Ev, ...t.colors }, l = t.horizon ?? "hills", c = t.window !== !1, h = nn(t.seed ?? 1), u = s * o / 1e5, d = Array.from({ length: Math.ceil(Iv * u) + 2 }, () => ({ u: h.next(), v: h.next(), size: 0.6 + h.next() * 0.8, puffs: 2 + Math.floor(h.next() * 3) })), f = Array.from({ length: Math.ceil(Ov * u) + 4 }, () => ({ u: h.next(), v: h.next(), speed: 0.8 + h.next() * 0.5 })), g = Array.from({ length: Math.ceil(_v * u) + 4 }, () => ({ u: h.next(), v: h.next(), speed: 0.7 + h.next() * 0.6, sway: h.next() * Math.PI * 2, size: 1.5 + h.next() * 2 })), p = Array.from({ length: Math.ceil(30 * u) + 10 }, () => ({ u: h.next(), v: h.next() * 0.6, size: 0.6 + h.next() * 1.2 })), m = Array.from({ length: 6 }, () => ({ phase: h.next() * Math.PI * 2, amp: 0.5 + h.next() })), b = Array.from({ length: 24 }, () => ({ h: 0.35 + h.next() * 0.65, w: 0.6 + h.next() * 0.8, windows: h.next() > 0.3 })), v = {
    hour: t.hour ?? 12,
    clouds: t.clouds ?? 0.3,
    wind: t.wind ?? 0,
    rain: t.rain ?? 0,
    snow: t.snow ?? 0
  }, w = Ss(), y = (x, P) => w.keys(x)?.length ? w.valueAt(x, P) : v[x], T = (x, P) => {
    const E = Pv(x, P), O = E < 0 ? 0.5 : E, _ = r - n;
    return { x: 0.1 * s + 0.8 * s * O, y: E < 0 ? _ + o * 0.2 : _ - Math.sin(O * Math.PI) * _ * 0.8, up: E >= 0 };
  }, $ = (x, P, E, O, _) => {
    const L = P("hour"), { top: B, bottom: X } = $v(L), J = x.createLinearGradient(0, O.y, 0, O.ground);
    J.addColorStop(0, B), J.addColorStop(1, X), x.fillStyle = J, x.fillRect(O.x, O.y, O.w, O.ground - O.y);
    const q = Av(L);
    if (q < 0.6) {
      x.fillStyle = "#ffffff", x.globalAlpha = (0.6 - q) / 0.6 * 0.9;
      for (const W of p)
        x.beginPath(), x.arc(O.x + W.u * O.w, O.y + W.v * (O.ground - O.y), W.size, 0, Math.PI * 2), x.fill();
      x.globalAlpha = 1;
    }
    const R = T(L, 6), D = T(L, 18), I = Math.min(O.w, O.h) * 0.06;
    if (R.up && (x.fillStyle = a.sun, x.beginPath(), x.arc(O.x + R.x / s * O.w, O.y + R.y / o * O.h, I, 0, Math.PI * 2), x.fill()), D.up) {
      const W = O.x + D.x / s * O.w, j = O.y + D.y / o * O.h;
      x.fillStyle = a.moon, x.beginPath(), x.arc(W, j, I * 0.8, 0, Math.PI * 2), x.fill(), x.fillStyle = B, x.beginPath(), x.arc(W - I * 0.35, j - I * 0.15, I * 0.7, 0, Math.PI * 2), x.fill();
    }
    const A = Math.max(0, Math.min(1, P("clouds"))), H = Math.max(-1, Math.min(1, P("wind"))), N = Math.round(A * d.length);
    x.fillStyle = ls("#ffffff", a.cloud === "#ffffff" ? "#ffffff" : a.cloud, 1), x.globalAlpha = 0.55 + 0.4 * q;
    for (let W = 0; W < N; W++) {
      const j = d[W], G = ((j.u * O.w + H * E * 0.012 * (0.6 + j.size * 0.5)) % (O.w * 1.4) + O.w * 1.4) % (O.w * 1.4) - O.w * 0.2, F = O.x + G, K = O.y + (0.08 + j.v * 0.42) * (O.ground - O.y), Y = Math.min(O.w, O.h) * 0.07 * j.size;
      for (let Z = 0; Z < j.puffs; Z++)
        x.beginPath(), x.ellipse(F + (Z - (j.puffs - 1) / 2) * Y * 0.9, K + Z % 2 * Y * 0.25, Y * (Z % 2 ? 0.8 : 1), Y * 0.62, 0, 0, Math.PI * 2), x.fill();
    }
    x.globalAlpha = 1;
    const z = (W) => ls(ls(W, "#0b1530", 0.65), W, q);
    if (l === "hills") {
      x.fillStyle = z(a.hills), x.beginPath(), x.moveTo(O.x, O.ground);
      const W = 40;
      for (let j = 0; j <= W; j++) {
        const G = j / W;
        let F = 0;
        m.forEach((K, Y) => F += Math.sin(G * Math.PI * (1.5 + Y * 0.7) + K.phase) * K.amp), x.lineTo(O.x + G * O.w, O.ground - Math.max(0, F) * O.h * 0.045 - O.h * 0.03);
      }
      x.lineTo(O.x + O.w, O.ground), x.closePath(), x.fill();
    } else if (l === "city") {
      x.fillStyle = z(a.city);
      let W = O.x;
      const j = O.w / 18;
      for (const G of b) {
        if (W > O.x + O.w) break;
        const F = j * G.w, K = O.h * 0.22 * G.h;
        if (x.fillRect(W, O.ground - K, F, K), G.windows && q < 0.5) {
          x.fillStyle = "#ffd66b", x.globalAlpha = 0.5 - q;
          for (let Y = O.ground - K + 6; Y < O.ground - 8; Y += 9) for (let Z = W + 4; Z < W + F - 4; Z += 8) x.fillRect(Z, Y, 3, 4);
          x.globalAlpha = 1, x.fillStyle = z(a.city);
        }
        W += F + j * 0.15;
      }
    }
    x.fillStyle = z(a.ground), x.fillRect(O.x, O.ground, O.w, O.y + O.h - O.ground);
  }, M = (x, P, E, O) => {
    const _ = Math.max(-1, Math.min(1, P("wind"))), L = Math.max(0, Math.min(1, P("rain"))), B = Math.max(0, Math.min(1, P("snow")));
    if (L > 0) {
      x.strokeStyle = a.rain, x.globalAlpha = 0.35 + 0.45 * L, x.lineWidth = 1.2, x.lineCap = "round";
      const X = O.h * 0.05, J = _ * 0.45, q = Math.round(L * f.length);
      x.beginPath();
      for (let R = 0; R < q; R++) {
        const D = f[R], I = ((D.v * O.h + E * D.speed * 0.9) % O.h + O.h) % O.h, A = ((D.u * O.w + I * J) % O.w + O.w) % O.w;
        x.moveTo(O.x + A, O.y + I), x.lineTo(O.x + A + J * X, O.y + I + X);
      }
      x.stroke(), x.globalAlpha = 1;
    }
    if (B > 0) {
      x.fillStyle = a.snow, x.globalAlpha = 0.85;
      const X = Math.round(B * g.length);
      for (let J = 0; J < X; J++) {
        const q = g[J], R = ((q.v * O.h + E * q.speed * 0.08) % O.h + O.h) % O.h, D = Math.sin(E * 2e-3 + q.sway) * O.w * 0.02, I = ((q.u * O.w + D + _ * R * 0.3) % O.w + O.w) % O.w;
        x.beginPath(), x.arc(O.x + I, O.y + R, q.size, 0, Math.PI * 2), x.fill();
      }
      x.globalAlpha = 1;
    }
  }, k = {
    kind: "scenery",
    target: {
      type: "custom",
      x: e,
      y: n,
      width: s,
      height: o,
      props: v,
      about: {
        kind: i === "room" ? "room" : "sky",
        summary: i === "room" ? "A room: a wall, a floor and a window on the sky. Its values are tracks: hour, clouds, wind, rain, snow (seen through the window)." : `A sky over ${l === "flat" ? "the ground" : l}: the sun and moon on their arcs, stars, clouds on the wind, rain and snow. Its values are tracks: hour (0–24), clouds, wind (−1..1), rain, snow (0..1).`,
        props: Object.fromEntries(Object.keys(v).map((x) => [x, Cv(x)]))
      },
      draw(x, P, E) {
        const O = P.props ?? {}, _ = (B) => Number(O[B] ?? v[B] ?? 0);
        x.save();
        const L = { x: 0, y: 0, w: s, h: o, ground: r - n };
        if (i === "sky")
          $(x, _, E, L), M(x, _, E, L);
        else if (x.fillStyle = a.wall, x.fillRect(0, 0, s, L.ground), x.fillStyle = a.floor, x.fillRect(0, L.ground, s, o - L.ground), x.fillStyle = a.skirting, x.fillRect(0, L.ground - o * 0.012, s, o * 0.012), c) {
          const B = s * 0.26, X = L.ground * 0.5, J = s * 0.62, q = L.ground * 0.14;
          x.fillStyle = a.frame, x.fillRect(J - 6, q - 6, B + 12, X + 12), x.save(), x.beginPath(), x.rect(J, q, B, X), x.clip(), $(x, _, E, { x: J, y: q, w: B, h: X, ground: q + X * 0.8 }), M(x, _, E, { x: J, y: q, w: B, h: X }), x.restore(), x.strokeStyle = a.frame, x.lineWidth = 4, x.beginPath(), x.moveTo(J + B / 2, q), x.lineTo(J + B / 2, q + X), x.moveTo(J, q + X / 2), x.lineTo(J + B, q + X / 2), x.stroke();
        }
        x.restore();
      }
    },
    ground: r,
    anchor(x, P = 1 / 0) {
      const E = y("hour", P);
      if (x === "sun" || x === "moon") {
        const O = T(E, x === "sun" ? 6 : 18);
        return { x: e + O.x, y: n + O.y };
      }
      if (x === "horizon") return { x: e + s / 2, y: r - o * 0.03 };
      if (x === "ground") return { x: e + s / 2, y: r };
      throw new Error(`scenery: ${ut("place", x, ["sun", "moon", "horizon", "ground"])}`);
    },
    set(x, P) {
      if (!(x in v)) throw new Error(`scenery: ${ut("value", x, Object.keys(v))}`);
      if (typeof P.value != "number" || !Number.isFinite(P.value)) throw new Error("scenery.set needs `value`, a number");
      return w.tween(x, y(x, P.at), P.value, P, 1e3), k;
    },
    tracks: w.tracks
  };
  return k;
}
function Cv(t) {
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
function Rv(t, e) {
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
      throw new Error(ut("scene preset", t, ["park", "street", "office", "home"]));
  }
}
function mS(t, e) {
  const n = Rv(t, e), s = Hv(n.scenery), o = n.props.map((i) => Bk({ x: i.x, y: s.ground, prop: wd(i.preset), scale: i.scale, values: { turn: i.turn ?? 0, ...i.values } }));
  return { scenery: s, props: o, ground: s.ground };
}
function yS(t) {
  const { timeline: e } = t, n = new Xe();
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
const bS = {
  timeline: Cp,
  to(t, e, n) {
    const s = new xn(n);
    return s.to(t, e), s;
  },
  from(t, e, n) {
    const s = new xn(n);
    return s.from(t, e), s;
  },
  fromTo(t, e, n, s) {
    const o = new xn(s);
    return o.fromTo(t, e, n), o;
  },
  set(t, e, n) {
    const s = new xn(n);
    return s.set(t, e), s;
  }
};
function Md(t, e, n) {
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
function Lv(t, e) {
  const n = t.length / 4, s = new Float32Array(n * 3), o = Math.min(0.999, Math.max(0, e));
  for (let i = 0; i < n; i++) {
    const r = t[i * 4] / 255, a = t[i * 4 + 1] / 255, l = t[i * 4 + 2] / 255, c = t[i * 4 + 3] / 255, h = Math.max(r, a, l);
    if (h <= o) continue;
    const u = (h - o) / (1 - o) * c / h;
    s[i * 3] = r * u, s[i * 3 + 1] = a * u, s[i * 3 + 2] = l * u;
  }
  return s;
}
function vh(t, e, n, s, o) {
  const i = new Float32Array(t.length), r = o ? n : e, a = o ? e : n, l = (h, u) => (o ? h * e + u : u * e + h) * 3, c = s * 2 + 1;
  for (let h = 0; h < r; h++)
    for (let u = 0; u < 3; u++) {
      let d = 0;
      for (let f = -s; f <= s; f++) d += t[l(h, Math.min(a - 1, Math.max(0, f))) + u];
      for (let f = 0; f < a; f++) {
        i[l(h, f) + u] = d / c;
        const g = t[l(h, Math.max(0, f - s)) + u], p = t[l(h, Math.min(a - 1, f + s + 1)) + u];
        d += p - g;
      }
    }
  return i;
}
function Mh(t, e, n, s) {
  const o = Math.max(1, Math.round(s / Math.sqrt(3)));
  let i = t;
  for (let r = 0; r < 3; r++)
    i = vh(i, e, n, o, !0), i = vh(i, e, n, o, !1);
  return i;
}
function wS(t, e = {}) {
  const n = t.canvas, s = n.width, o = n.height;
  if (!(s > 0 && o > 0)) return;
  const i = Math.max(1, Math.round(e.downsample ?? 4)), r = Math.max(1, Math.ceil(s / i)), a = Math.max(1, Math.ceil(o / i)), l = Md(t, r, a), c = l?.getContext("2d");
  if (!l || !c) return;
  c.imageSmoothingEnabled = !0, c.drawImage(t.canvas, 0, 0, r, a);
  const h = Lv(c.getImageData(0, 0, r, a).data, e.threshold ?? 0.55), u = (e.radius ?? Math.max(s, o) * 0.02) / i, d = Mh(h, r, a, u), f = Mh(h, r, a, u * 3), g = e.halo ?? 0.6, p = c.createImageData(r, a);
  for (let m = 0; m < r * a; m++) {
    for (let b = 0; b < 3; b++) p.data[m * 4 + b] = Math.round(Math.min(1, d[m * 3 + b] + f[m * 3 + b] * g) * 255);
    p.data[m * 4 + 3] = 255;
  }
  c.putImageData(p, 0, 0), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalCompositeOperation = "lighter", t.globalAlpha = Math.max(0, e.strength ?? 0.9), t.imageSmoothingEnabled = !0, t.drawImage(l, 0, 0, s, o), t.restore();
}
function kS(t, e, n) {
  const s = n.width ?? 6, o = n.taper ?? 1, i = n.fade ?? 1, r = n.opacity ?? 1, a = n.blend === "add";
  if (t.save(), e.length >= 2) {
    const c = Wv(e, s, o, i, r);
    a ? (t.globalCompositeOperation = "lighter", Lr(t, c, n.color)) : Nv(t, c, n.color);
  }
  const l = e[e.length - 1];
  if (n.head && l && n.head.radius > 0) {
    a && (t.globalCompositeOperation = "lighter");
    const c = n.head.color ?? n.color, h = t.createRadialGradient(l.at.x, l.at.y, 0, l.at.x, l.at.y, n.head.radius);
    h.addColorStop(0, c), h.addColorStop(0.35, c), h.addColorStop(1, Fv(t, c)), t.globalAlpha = r, t.fillStyle = h, t.beginPath(), t.arc(l.at.x, l.at.y, n.head.radius, 0, Math.PI * 2), t.fill();
  }
  t.restore();
}
function Fv(t, e) {
  t.fillStyle = e;
  const n = String(t.fillStyle), s = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(n);
  if (s) return `rgba(${parseInt(s[1], 16)}, ${parseInt(s[2], 16)}, ${parseInt(s[3], 16)}, 0)`;
  const o = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(n);
  return o ? `rgba(${o[1]}, ${o[2]}, ${o[3]}, 0)` : "rgba(0, 0, 0, 0)";
}
function Wv(t, e, n, s, o) {
  const i = t.map((c) => ({ x: c.at.x, y: c.at.y, width: e * (1 - n * c.age) })), r = np(i), a = sp(i) ?? void 0, l = [];
  for (let c = 0; c + 1 < t.length; c++) {
    const h = (t[c].age + t[c + 1].age) / 2, u = o * (1 - s * h);
    if (u <= 0) continue;
    const d = c + 2 === t.length;
    l.push({ corners: [r.left[c], r.left[c + 1], r.right[c + 1], r.right[c]], alpha: u, ...d && a && { cap: a } });
  }
  return l;
}
function Lr(t, e, n) {
  t.fillStyle = n;
  for (const s of e) {
    const [o, i, r, a] = s.corners;
    t.globalAlpha = Math.min(1, s.alpha), t.beginPath(), t.moveTo(o.x, o.y), t.lineTo(i.x, i.y), s.cap && t.arc(s.cap.x, s.cap.y, s.cap.radius, s.cap.start, s.cap.start - Math.PI, !0), t.lineTo(r.x, r.y), t.lineTo(a.x, a.y), t.closePath(), t.fill();
  }
}
function Nv(t, e, n) {
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
  const u = Math.floor(a) - 1, d = Math.floor(l) - 1, f = s ? Md(t, Math.ceil(c) + 1 - u, Math.ceil(h) + 1 - d) : null, g = f?.getContext("2d");
  if (!f || !g) {
    Lr(t, e, n);
    return;
  }
  g.translate(-u, -d), g.globalCompositeOperation = "lighter", Lr(g, r, n), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalAlpha = 1, t.drawImage(f, u, d), t.restore();
}
const vS = te.to, MS = te.from, xS = te.fromTo, SS = te.set, TS = te.timeline, ES = te.ticker, AS = te.splitText, $S = te.context, PS = te.matchMedia, IS = te.quickTo, OS = te.imageSequence, _S = te.pageTransition;
Mm();
export {
  An as ACTING_STYLES,
  gd as AIRCRAFT_ACTING,
  As as ANIMAL_GAITS,
  Jw as ANIME_CAST,
  Ir as BEAT_FIELDS,
  as as BEAT_MOMENTS,
  f5 as BED_ACTING,
  W5 as BIRD_ACTING,
  Ec as BOARD_MARKS,
  Ns as BOARD_THEMES,
  Pa as CANVAS_PROPERTIES,
  l5 as CHAIR_ACTING,
  kc as CHARACTER_BEAT_3D_FIELDS,
  Ju as CHARACTER_CAST,
  pw as CHARACTER_GAIT_SPEEDS,
  _c as CHART_KINDS,
  vn as CHART_SURFACE,
  Ds as CHART_THEMES,
  Ar as CODE_LANGUAGES,
  Vu as CODE_PANEL_EDITS,
  to as CODE_SURFACE,
  $w as CODE_THEME,
  zv as Clock,
  xn as CompatTimeline,
  jg as CustomBounce,
  Yg as CustomEase,
  Kg as CustomWiggle,
  sn as DANCE_STYLES,
  Rh as DEFAULT_BAKE_INTERVAL_MS,
  La as DEFAULT_INERTIA_FRICTION,
  om as DEFAULT_LABELS,
  ne as DEFAULT_SPRING,
  ZM as DEFAULT_TRANSITION,
  u5 as DESK_ACTING,
  g5 as DOOR_ACTING,
  h0 as Draggable,
  $r as EMBRACE,
  vt as EXPRESSIONS,
  cu as FACIAL_HAIR_STYLES,
  Hm as FINGERS,
  Qo as FLIPS,
  fy as FOOT_SHAPES,
  Ra as FORMAT_VERSION,
  Zf as FRAME_ASPECTS,
  en as GAGS,
  zt as GAITS,
  Bc as GAIT_CYCLE_MS,
  uu as GLASSES_STYLES,
  ye as HAIR_COLORS,
  gs as HAIR_STILL,
  Z0 as HAIR_STYLES,
  Ao as HAND_MEETINGS,
  $t as HAND_REST,
  Pt as HAND_SHAPES,
  ua as HAT_STYLES,
  ku as HELD_ITEMS,
  Mn as HELP_UP,
  iS as HORSE_ACTING,
  oS as HORSE_GAITS,
  i5 as HOUSE_ACTING,
  w2 as HUMAN_ACTING_RIG,
  yr as HUMAN_BUILDS,
  tc as HUMAN_CYCLES,
  Rn as HUMAN_DANCES,
  j0 as HUMAN_EXPRESSIONS,
  da as HUMAN_GAGS,
  he as HUMAN_POSES,
  ht as HUMAN_REST,
  kw as IDENTITY_CAMERA,
  $M as IDENTITY_SIMILARITY,
  Id as INERTIA_MAX_DURATION_MS,
  Af as InertiaTrackPlayer,
  we as LiveTimeline,
  Zw as MANGA_CAST,
  Gv as MORPH_SAMPLES,
  gr as MUDRAS,
  Bv as ManualClock,
  xl as MediaSync,
  ig as Observer,
  Zt as POSES,
  yh as PROP_BEAT_3D_FIELDS,
  Cr as PROP_BEAT_FIELDS,
  kd as PROP_COMMON_ACTIONS,
  Ts as PROP_COMMON_CONTROLS,
  ks as PROP_PRESETS,
  es as PROP_SURFACE,
  yd as QUADRUPED_ACTING,
  Er as REMOVE_STYLES,
  lt as REST_POSE,
  vd as RIDING_POSES,
  qe as SAMPLE_STEP,
  Ev as SCENERY_COLORS,
  si as SCRIPT_ACTIONS,
  Ah as SPRING_MAX_DURATION_MS,
  ai as SPRING_PRESETS,
  Jn as SPRING_STEP_MS,
  m2 as STICK_ACTING_RIG,
  Ag as ScrollAnimator,
  Do as ScrollDriver,
  $g as ScrollMarkers,
  Mg as ScrollPin,
  ml as SmoothScroll,
  _o as SpringSampler,
  Ef as SpringTrackPlayer,
  Jp as Stage,
  n5 as TREE_ACTING,
  It as Timeline,
  Vr as TinyflyPlayer,
  xm as TinyflySequencer,
  Xs as TrackPlayer,
  jk as VEHICLE_ACTING,
  Fe as VISEMES,
  iM as ValueResolver,
  vg as VisibilityDriver,
  b5 as WHEELCHAIR_ACTING,
  xe as WHITEBOARD_SURFACE,
  v2 as actCharacterTracks,
  Ea as actKeyframes,
  k2 as actTracks,
  ed as actionNames,
  M5 as airplane,
  Ye as anchorError,
  Ha as animalStrideLength,
  Mk as animatableProperties,
  wS as applyBloom,
  $x as applyCamera,
  D1 as applyGroove,
  Jh as applySimilarity,
  Vh as aspectOf,
  Nc as assertBeats,
  MM as audioEnvelope,
  zd as backOut,
  ax as bakeDanceTracks,
  Nh as bakeEasing,
  Fh as bakeInertiaTrack,
  Lh as bakeSpringTrack,
  fb as basicOutfit,
  ox as beatAt,
  Lo as beatAtTime,
  Ro as beatLength,
  wM as beatPeriod,
  vM as beatPulse,
  Dr as beatTime,
  uM as beatsBetween,
  d5 as bed,
  Qk as bike,
  gm as bindChoiceHotspots,
  an as bird,
  fs as blendPose,
  x0 as boilFrame,
  Bd as bounceOut,
  iw as boxMesh,
  hb as brushingPose,
  WM as bubblePath,
  NM as bubblePop,
  mS as buildScene,
  Gk as bus,
  Ax as cameraFromValues,
  Px as cameraPoint,
  fM as cameraTracks,
  nv as capabilities,
  aS as capabilitiesMarkdown,
  Xk as car,
  Jk as cart,
  Nx as castMember,
  _5 as cat,
  a5 as chair,
  bs as changingWindows,
  fa as character,
  mx as characterAt,
  wb as characterHandPose,
  ie as characterJoints,
  dx as characterJointsInView,
  Tx as characterLookAtTracks,
  Mx as characterObjects,
  Mb as characterPartsInView,
  ga as characterPoseOf,
  yx as characterPoseTracks,
  tS as characterScript,
  Sx as characterScript3D,
  lk as characterStrideLength,
  gx as characterTarget,
  Pf as charactersFor,
  Wx as chart,
  Po as checkBeats,
  nd as checkCast,
  ww as checkCharacterBeats3D,
  U5 as checkPropBeats,
  Mv as checkPropBeats3D,
  ik as checkSurfaceBeats,
  eS as checkTracks,
  z5 as chicken,
  Ox as circlePath,
  p0 as clamp01,
  Vv as clearMorphCache,
  Xv as clearPathCache,
  Gu as clipErased,
  ro as closestName,
  Lx as codePanel,
  Cw as codeTokens,
  IM as composeSimilarity,
  fl as containerProgressAt,
  $S as context,
  Tt as controlValue,
  H5 as cow,
  GM as create,
  lm as createControls,
  Nd as createCubicBezier,
  Zg as createLive,
  Bo as createPen,
  nn as createRandom,
  tr as createTrack,
  jv as criticalDamping,
  B5 as crow,
  bM as curve,
  Df as customBounce,
  Nf as customEase,
  Bf as customWiggle,
  rw as cylinderMesh,
  Tb as danceCircleAt,
  wx as danceCircleTracks,
  na as danceFrame,
  Ln as danceJoint,
  nx as dancePose,
  mr as danceStance,
  sx as danceTaps,
  rx as danceTracks,
  Mi as danceTravel,
  Y1 as danceTravelTrack,
  ix as dancer,
  Vx as defineAction,
  Jx as defineGait,
  vk as describeTarget,
  cs as deserializeTimeline,
  Cf as deserializeTrack,
  h5 as desk,
  dM as detectTempo,
  O5 as dog,
  p5 as door,
  YM as draggable,
  Qr as drawCartoonHand,
  vb as drawCharacter,
  px as drawCharacterHead,
  fx as drawCharacterInView,
  T2 as drawDustPuff,
  ju as drawEraser,
  Xu as drawHand,
  nc as drawHeldItem,
  Gx as drawImpactStars,
  vw as drawPencil,
  nS as drawProp,
  lS as drawPropEffects,
  Cu as drawPropShadow,
  Yb as drawSolvedFaces,
  vx as drawSolvedPart,
  _u as drawSolvedProp,
  x2 as drawSpeedLines,
  P1 as drawStickFigure,
  Ux as drawStickSmear,
  kS as drawTrail,
  _x as drawnPathTarget,
  FM as dripPath,
  Y5 as duck,
  Rd as easeIn,
  $h as easeInCubic,
  Fd as easeInOut,
  Co as easeInOutCubic,
  Cd as easeInOutQuad,
  _d as easeInQuad,
  Ld as easeOut,
  Ph as easeOutCubic,
  Hd as easeOutQuad,
  Gf as editDistance,
  ni as editError,
  Ss as editLog,
  Dd as elasticOut,
  Al as ellipsePoints,
  aw as ellipsoidMesh,
  qx as embrace,
  zx as embraceSpacing,
  xM as envelopeAt,
  Rx as erasable,
  Aa as expandBeats,
  Sf as expandParametricEasings,
  cw as extrudeMesh,
  Ib as flipPose,
  kx as flipTracks,
  Ob as flipTravel,
  xh as formatVersionFor,
  SM as frameRect,
  TM as frameSize,
  MS as from,
  nM as fromJSON,
  xS as fromTo,
  Wc as gag,
  $o as gagDuration,
  t1 as gaitPose,
  ur as gaitStrideLength,
  Ft as getEasingFunction,
  io as getInterpolator,
  Dh as getMotionPathPoint,
  Uv as getPathLength,
  Qd as getPointAtProgress,
  C5 as goat,
  ag as gridLinesFor,
  l2 as hairFollow,
  Xx as hairFollowTracks,
  Oy as hairHangs,
  Kx as hairMotionAt,
  ca as hairMotionOf,
  vo as hairlineAt,
  Ix as handAt,
  Pi as handGrip,
  hr as handJoints,
  jm as handJointsAt,
  od as handPath,
  Ot as handPose,
  go as handProp,
  Td as hasKeyframes,
  Qt as hashSeed,
  tx as headPoint,
  Ed as heldTime,
  k5 as helicopter,
  jx as helpUp,
  Yx as helpUpSpacing,
  gb as holdingLayers,
  I5 as horse,
  rS as horseStrideLength,
  o5 as house,
  hx as humanCyclePose,
  wo as humanDanceFrame,
  cx as humanDanceTracks,
  lx as humanFieldLabel,
  lb as humanGag,
  bu as humanGaitPose,
  wu as humanGaitStrideLength,
  Y0 as humanPlan,
  wt as humanPose,
  OS as imageSequence,
  Ms as inertiaDuration,
  vs as inertiaRest,
  Vi as inertiaValueAt,
  Kv as inertiaVelocityAt,
  vf as interpolateArray,
  kf as interpolateColor,
  tM as interpolateMotionPath,
  be as interpolateNumber,
  xf as interpolatePathString,
  Mf as interpolateQuaternion,
  Va as interpolateString,
  OM as invertSimilarity,
  Sd as isCubicBezierEasing,
  sc as isHeld,
  Ze as isInertiaTrack,
  Dv as isMotionPathPoint,
  Sh as isMotionPathTrack,
  so as isParametricEasing,
  xs as isPathData,
  Qe as isSpringTrack,
  Fr as isTextTrack,
  Yv as isUnderdamped,
  oM as isUnresolved,
  Zh as isoDepth,
  Qh as isometricBoxFaces,
  t0 as isometricFaces,
  xb as jointsInScene,
  $1 as jointsToScene,
  Ji as linear,
  Wu as lipSyncKeyframes,
  xa as lipSyncOver,
  xx as lipSyncTracks,
  Lu as lit,
  te as live,
  Yu as lookFields,
  kM as loopBeats,
  gM as loopEase,
  mM as loopNoise,
  ud as loosePartsOf,
  $5 as lyingPose,
  lo as mapEase,
  qM as mat4,
  PS as matchMedia,
  Eh as maxStaggerDistance,
  bx as meetDandiya,
  Bx as meetHands,
  Dx as meetingSpacing,
  LM as metaballContours,
  rp as metaballField,
  dy as mirrorHumanPose,
  W1 as mirrorPose,
  Fu as mixColors,
  ds as mixHandPoses,
  xu as mixPoses,
  df as morphPath,
  t5 as motorbike,
  ym as mount,
  km as mountAll,
  aM as narrationMarkers,
  lM as narrationSceneAt,
  oo as naturalRest,
  cM as nearestBeat,
  hM as nextBeat,
  Xw as niceCeiling,
  xc as objectPositionAt,
  j5 as owl,
  _S as pageTransition,
  hw as panelMesh,
  Yd as parametricEasing,
  K5 as parrot,
  Wn as parseAnchor,
  dl as parseEdge,
  In as parsePath,
  f0 as parseTrigger,
  us as partialPath,
  Em as pathLength,
  pS as pedallingKeys,
  wh as pedallingPose,
  RM as penroseStairs,
  CM as penroseTriangle,
  Qx as persona,
  _n as phaseOf,
  ei as pieceMotion,
  q5 as pigeon,
  Xh as pingPong,
  rM as planNarration,
  Sb as plantDanceFoot,
  UM as play,
  JM as playSequence,
  KM as playWhenVisible,
  Bh as playheadCrossings,
  Jr as pointAlong,
  Ih as pointAtDistance,
  ux as pointOnHead,
  Qf as pointsToPath,
  Ct as pose,
  ex as poseTracks,
  _M as powSimilarity,
  zr as projectIsometric,
  Ca as propActions,
  Fk as propAnchors3D,
  _a as propAt,
  dd as propControls,
  Hu as propLineWidth,
  dS as propObjects,
  Lk as propPartsInSpace,
  wd as propPreset,
  cS as propRide,
  gS as propRide3D,
  G5 as propScript,
  fS as propScript3D,
  Io as propShapeMesh,
  sS as propSurface,
  Bk as propTarget,
  uS as propTow,
  Hk as propView,
  rn as quadruped,
  Jv as quat,
  yS as quickPlay,
  IS as quickTo,
  R5 as rabbit,
  qh as randomBetween,
  sM as randomChoice,
  Lf as randomSnapped,
  He as reachCharacter,
  ck as reachOf,
  Zu as resolveActingStyle,
  Tu as resolveCharacterPoseKeys,
  qy as resolveFacialHair,
  zo as resolveGait,
  Jy as resolveGlasses,
  _y as resolveHair,
  eb as resolveHat,
  ib as resolveHeadLook,
  pb as resolveHolding,
  ta as resolvePoseKeys,
  Ff as resolveSequence,
  F0 as resolveStickFrame,
  I1 as resolveStickPose,
  Kh as resolveValue,
  np as ribbon,
  sp as ribbonHeadCap,
  Ta as rideFloors,
  Ue as rotateAbout,
  sa as routineBeats,
  Cn as rubberLimb,
  EM as safeAreas,
  BM as scalePoints,
  Rv as scenePreset,
  Hv as scenery,
  sd as scriptActionSummaries,
  $a as scriptTracks,
  jM as scrollProgress,
  XM as scrubOnScroll,
  Hx as scrubPath,
  QM as seatHeight,
  Rf as serializeTimeline,
  Hf as serializeTrack,
  SS as set,
  Ma as shade,
  dw as shapeMesh,
  Br as shapeToPathData,
  PM as similarity,
  op as similarityAbout,
  ip as similarityFixedPoint,
  HM as similarityMatrix,
  Tf as simplifyKeyframes,
  ph as sittingPose,
  ra as skeletonInView,
  ar as sketchPen,
  $v as skyColors,
  Nu as smoothPath,
  kg as smoothToward,
  rg as snapAxis,
  Sg as snapConfig,
  Eg as snapDuration,
  Tg as snapProgress,
  Es as solveAt,
  Yo as solvePlanSpace,
  hd as solveProp,
  D5 as songbird,
  ow as soundsOf,
  J2 as speechDuration,
  fw as speechLength,
  hS as spliceTracks,
  AS as splitText,
  Ad as springDuration,
  Us as springFollow,
  qv as springValueAt,
  DM as squashStretch,
  L5 as squirrel,
  jo as stagePlanSpace,
  Ex as stageSpots,
  Th as staggerDistance,
  Wr as staggerOffset,
  Gi as staggerOffsets,
  Oo as staggerSpan,
  $2 as stepsDuration,
  qd as stepsEasing,
  td as stepsToKeys,
  D0 as stickFigureAt,
  le as stickFigureJoints,
  N0 as stickFigureTarget,
  Lb as stickToHuman,
  s1 as strideLength,
  kt as surfaceBox,
  Zx as surfaceScript,
  cb as sweepingPose,
  sm as syncMediaElement,
  o1 as talkingMouth,
  Zr as taperedLine,
  Rt as taperedOutline,
  Of as textAt,
  bS as tf,
  ES as ticker,
  TS as timeline,
  vS as to,
  eM as toJSON,
  Zv as toKeyframedTrack,
  Qv as toKeyframedTracks,
  yM as torusNoise,
  We as trackTargets,
  Vk as tractor,
  AM as trailSamples,
  Zk as trainCar,
  e5 as tree,
  hs as triggerDistance,
  Uk as truck,
  uw as tubeMesh,
  ut as unknownName,
  VM as unmount,
  Sa as valueAt,
  zM as vec3,
  Ce as vehicle,
  n1 as walkPose,
  y5 as wheelchair,
  Fx as whiteboard,
  Cx as withErased,
  De as withExpression,
  pM as wobble
};
