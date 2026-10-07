function fl(t) {
  return typeof t == "object" && t !== null && t.type === "cubic-bezier";
}
function $n(t) {
  return typeof t == "object" && t !== null && t.type !== "cubic-bezier";
}
const Ri = 2;
function Mr(t) {
  return t.some((e) => e.interpolation !== void 0) ? 2 : 1;
}
function hi(t) {
  return t.property === "text" && "textConfig" in t;
}
function re(t) {
  return t.kind === "inertia" && "inertia" in t;
}
function ae(t) {
  return t.kind === "spring" && "spring" in t;
}
function Tr(t) {
  return t.property === "motionPath" && "motionPathConfig" in t;
}
function lg(t) {
  return typeof t == "object" && t !== null && "x" in t && "y" in t && "angle" in t;
}
function dl(t) {
  return "keyframes" in t;
}
class cg {
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
class hg {
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
function pl(t, e) {
  if (!(e > 0)) return t;
  const n = 1e3 / e;
  return Math.floor(t / n + 1e-9) * n;
}
function Er(t, e, n = "start") {
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
function Ar(t, e = "start") {
  if (t <= 1) return 0;
  let n = 0;
  for (let s = 0; s < t; s++)
    n = Math.max(n, Er(s, t, e));
  return n;
}
function ui(t, e, n) {
  if (n.offsets) return n.offsets[t] ?? 0;
  const s = n.from ?? "start", i = Er(t, e, s);
  if (n.amount !== void 0) {
    const o = Ar(e, s);
    return o === 0 ? 0 : n.amount * i / o;
  }
  return n.each !== void 0 ? n.each * i : 0;
}
function Cs(t, e) {
  return Array.from({ length: t }, (n, s) => ui(s, t, e));
}
function qn(t, e) {
  return t <= 1 ? 0 : Math.max(...Cs(t, e));
}
const We = 1, Pr = 6e4, an = Pr / We, _t = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, ns = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class Un {
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
    this.from = e.from, this.to = e.to, this.stiffness = e.stiffness ?? _t.stiffness, this.damping = e.damping ?? _t.damping, this.mass = e.mass ?? _t.mass, this.restDelta = e.restDelta ?? _t.restDelta, this.restSpeed = e.restSpeed ?? _t.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = e.velocity ?? _t.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = Math.floor(e / We);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const s = this.samples[Math.min(n, this.samples.length - 1)], i = this.samples[Math.min(n + 1, this.samples.length - 1)], o = e / We - n;
    return s + (i - s) * o;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(an + 1), this.settledStep !== null ? this.settledStep * We : Pr;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(e) {
    if (this.settledStep !== null) return;
    const n = Math.min(e, an + 1), s = We / 1e3;
    for (; this.samples.length < n; ) {
      const i = this.samples[this.samples.length - 1], o = i - this.to, r = -this.stiffness * o, a = -this.damping * this.velocity, l = (r + a) / this.mass;
      this.velocity += l * s;
      const c = i + this.velocity * s;
      if (this.samples.push(c), this.isAtRest(c)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > an && (this.settledStep = an);
  }
}
function ug(t, e) {
  return new Un(t).valueAt(e);
}
function gl(t) {
  return new Un(t).settleTime();
}
function fg(t) {
  const e = t.stiffness ?? _t.stiffness, n = t.damping ?? _t.damping, s = t.mass ?? _t.mass;
  return n < 2 * Math.sqrt(e * s);
}
function dg(t) {
  const e = t.stiffness ?? _t.stiffness, n = t.mass ?? _t.mass;
  return 2 * Math.sqrt(e * n);
}
const Li = 4, ml = 2e-3, yl = 1e-4, bl = 6e4;
function Vn(t) {
  const e = t.friction ?? Li;
  return e > 0 ? e : Li;
}
function _n(t) {
  return t.from + t.velocity / Vn(t);
}
function wl(t, e) {
  if (e === void 0) return t;
  if (typeof e == "number")
    return e > 0 ? Math.round(t / e) * e : t;
  if (e.length === 0) return t;
  let n = e[0];
  for (const s of e)
    Math.abs(s - t) < Math.abs(n - t) && (n = s);
  return n;
}
function nn(t) {
  let e = wl(_n(t), t.end);
  return t.min !== void 0 && (e = Math.max(t.min, e)), t.max !== void 0 && (e = Math.min(t.max, e)), e;
}
function sn(t) {
  const e = Math.abs(nn(t) - t.from);
  if (e === 0) return 0;
  const n = t.restDelta ?? Math.max(yl, e * ml);
  if (n >= e) return 0;
  const s = Math.log(e / n) / Vn(t);
  return Math.min(bl, s * 1e3);
}
function Os(t, e) {
  if (e <= 0) return t.from;
  const n = nn(t);
  if (e >= sn(t)) return n;
  const s = Vn(t);
  return t.from + (n - t.from) * (1 - Math.exp(-s * e / 1e3));
}
function pg(t, e) {
  const n = Vn(t), s = nn(t);
  return e >= sn(t) ? 0 : (s - t.from) * n * Math.exp(-n * Math.max(0, e) / 1e3);
}
const Rs = (t) => t, kl = (t) => t * t, vl = (t) => 1 - (1 - t) * (1 - t), Sl = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, $r = (t) => t * t * t, _r = (t) => 1 - Math.pow(1 - t, 3), zn = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, xl = $r, Ml = _r, Tl = zn, El = {
  linear: Rs,
  "ease-in": xl,
  "ease-out": Ml,
  "ease-in-out": Tl,
  "ease-in-quad": kl,
  "ease-out-quad": vl,
  "ease-in-out-quad": Sl,
  "ease-in-cubic": $r,
  "ease-out-cubic": _r,
  "ease-in-out-cubic": zn
};
function Al(t) {
  const [e, n, s, i] = t, o = 3 * e, r = 3 * (s - e) - o, a = 1 - o - r, l = 3 * n, c = 3 * (i - n) - l, h = 1 - l - c, u = (p) => ((a * p + r) * p + o) * p, f = (p) => ((h * p + c) * p + l) * p, d = (p) => (3 * a * p + 2 * r) * p + o, g = (p) => {
    let m = p;
    for (let w = 0; w < 8; w++) {
      const M = u(m) - p;
      if (Math.abs(M) < 1e-7)
        return m;
      const x = d(m);
      if (Math.abs(x) < 1e-7)
        break;
      m -= M / x;
    }
    let y = 0, b = 1;
    for (m = p; y < b; ) {
      const w = u(m);
      if (Math.abs(w - p) < 1e-7)
        return m;
      p > w ? y = m : b = m, m = (y + b) / 2;
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
function ss(t, e = "out") {
  if (e === "out") return t;
  const n = (s) => 1 - t(1 - s);
  return e === "in" ? n : (s) => s < 0.5 ? n(s * 2) / 2 : t(s * 2 - 1) / 2 + 0.5;
}
function Pl(t = 1, e = 0.3) {
  const n = Math.max(1, t), s = e / (2 * Math.PI) * Math.asin(1 / n);
  return (i) => i <= 0 ? 0 : i >= 1 ? 1 : n * Math.pow(2, -10 * i) * Math.sin((i - s) * (2 * Math.PI) / e) + 1;
}
const $l = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) {
    const i = t - 0.5454545454545454;
    return 7.5625 * i * i + 0.75;
  }
  if (t < 2.5 / 2.75) {
    const i = t - 0.8181818181818182;
    return 7.5625 * i * i + 0.9375;
  }
  const s = t - 2.625 / 2.75;
  return 7.5625 * s * s + 0.984375;
};
function _l(t = 1.70158) {
  return (e) => {
    if (e <= 0) return 0;
    if (e >= 1) return 1;
    const n = e - 1;
    return n * n * ((t + 1) * n + t) + 1;
  };
}
function Il(t, e = "end") {
  const n = Math.max(1, Math.floor(t));
  return (s) => {
    if (s >= 1) return 1;
    if (s <= 0) return e === "start" || e === "both" ? e === "start" ? 1 / n : 1 / (n + 1) : 0;
    const i = Math.floor(s * n);
    switch (e) {
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
function Hl(t) {
  switch (t.type) {
    case "steps":
      return Il(t.count, t.position);
    case "elastic":
      return ss(Pl(t.amplitude, t.period), t.mode);
    case "bounce":
      return ss($l, t.mode);
    case "back":
      return ss(_l(t.overshoot), t.mode);
  }
}
function Tt(t) {
  return t === void 0 ? Rs : fl(t) ? Al(t.points) : $n(t) ? Hl(t) : El[t] ?? Rs;
}
const Fi = 32, Cl = 256, me = /* @__PURE__ */ new Map(), Ol = /[MmLlHhVvCcSsQqTtAaZz]/, Rl = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, Ll = {
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
function Fl(t) {
  const e = [];
  let n = 0, s = null;
  const i = () => {
    for (; n < t.length && /[\s,]/.test(t[n]); ) n++;
  };
  for (; n < t.length && (i(), !(n >= t.length)); ) {
    const o = t[n];
    if (Ol.test(o)) {
      s = { type: o, args: [] }, e.push(s), n++;
      continue;
    }
    if (!s) break;
    const r = s.type === "A" || s.type === "a", a = s.args.length % 7;
    if (r && (a === 3 || a === 4)) {
      if (o !== "0" && o !== "1") break;
      s.args.push(o === "1" ? 1 : 0), n++;
      continue;
    }
    const l = Rl.exec(t.slice(n));
    if (!l) break;
    s.args.push(parseFloat(l[0])), n += l[0].length;
  }
  return e;
}
function Wl(t, e, n, s, i, o, r, a, l) {
  if (t === a && e === l) return [];
  let c = Math.abs(n), h = Math.abs(s);
  if (c === 0 || h === 0) return [[t, e, a, l, a, l]];
  const u = i * Math.PI / 180, f = Math.cos(u), d = Math.sin(u), g = (t - a) / 2, p = (e - l) / 2, m = f * g + d * p, y = -d * g + f * p, b = m * m / (c * c) + y * y / (h * h);
  if (b > 1) {
    const Y = Math.sqrt(b);
    c *= Y, h *= Y;
  }
  const w = o === r ? -1 : 1, M = c * c * h * h - c * c * y * y - h * h * m * m, x = c * c * y * y + h * h * m * m, v = w * Math.sqrt(Math.max(0, M / x)), A = v * c * y / h, C = -v * h * m / c, T = f * A - d * C + (t + a) / 2, H = d * A + f * C + (e + l) / 2, _ = (Y, k, E, S) => {
    const $ = Y * E + k * S, I = Math.sqrt((Y * Y + k * k) * (E * E + S * S)), F = Math.acos(Math.max(-1, Math.min(1, $ / I)));
    return Y * S - k * E < 0 ? -F : F;
  }, O = _(1, 0, (m - A) / c, (y - C) / h);
  let L = _((m - A) / c, (y - C) / h, (-m - A) / c, (-y - C) / h);
  !r && L > 0 && (L -= 2 * Math.PI), r && L < 0 && (L += 2 * Math.PI);
  const W = Math.max(1, Math.ceil(Math.abs(L) / (Math.PI / 2))), j = L / W, U = 4 / 3 * Math.tan(j / 4), P = (Y) => {
    const k = c * Math.cos(Y), E = h * Math.sin(Y);
    return [f * k - d * E + T, d * k + f * E + H];
  }, R = (Y) => {
    const k = -c * Math.sin(Y), E = h * Math.cos(Y);
    return [f * k - d * E, d * k + f * E];
  }, D = [];
  for (let Y = 0; Y < W; Y++) {
    const k = O + Y * j, E = k + j, [S, $] = P(k), [I, F] = Y === W - 1 ? [a, l] : P(E), [N, B] = R(k), [K, G] = R(E);
    D.push([S + U * N, $ + U * B, I - U * K, F - U * G, I, F]);
  }
  return D;
}
function qt(t, e, n, s, i) {
  const o = 1 - i;
  return o * o * o * t + 3 * o * o * i * e + 3 * o * i * i * n + i * i * i * s;
}
function Wi(t, e, n, s, i) {
  const o = 1 - i;
  return 3 * o * o * (e - t) + 6 * o * i * (n - e) + 3 * i * i * (s - n);
}
function Pe(t, e, n, s) {
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
function ln(t, e, n) {
  const [s, i, o, r, a, l] = n, c = [0];
  let h = t, u = e, f = 0;
  for (let d = 1; d <= Fi; d++) {
    const g = d / Fi, p = qt(t, s, o, a, g), m = qt(e, i, r, l, g);
    f += Math.hypot(p - h, m - u), c.push(f), h = p, u = m;
  }
  return {
    subpath: 0,
    type: "C",
    points: [s, i, o, r, a, l],
    startX: t,
    startY: e,
    endX: a,
    endY: l,
    length: f,
    lengths: c
  };
}
function xe(t) {
  const e = me.get(t);
  if (e) return e;
  const n = [];
  let s = 0, i = 0, o = 0, r = 0, a = null, l = null, c = -1;
  const h = /* @__PURE__ */ new Set(), u = (p) => {
    c < 0 && (c = 0), p.subpath = c, n.push(p);
  };
  for (const { type: p, args: m } of Fl(t)) {
    const y = p.toUpperCase(), b = p !== y, w = Ll[y];
    if (y === "Z") {
      (s !== o || i !== r) && u(Pe(s, i, o, r)), c >= 0 && h.add(c), s = o, i = r, a = l = null;
      continue;
    }
    for (let M = 0; M + w <= m.length; M += w) {
      const x = m.slice(M, M + w), v = b ? s : 0, A = b ? i : 0;
      let C = null, T = null;
      switch (y) {
        case "M":
          M === 0 ? (s = x[0] + v, i = x[1] + A, o = s, r = i, (c < 0 || n[n.length - 1]?.subpath === c) && c++) : (u(Pe(s, i, x[0] + v, x[1] + A)), s = x[0] + v, i = x[1] + A);
          break;
        case "L":
          u(Pe(s, i, x[0] + v, x[1] + A)), s = x[0] + v, i = x[1] + A;
          break;
        case "H":
          u(Pe(s, i, x[0] + v, i)), s = x[0] + v;
          break;
        case "V":
          u(Pe(s, i, s, x[0] + A)), i = x[0] + A;
          break;
        case "C": {
          const H = [x[0] + v, x[1] + A, x[2] + v, x[3] + A, x[4] + v, x[5] + A];
          u(ln(s, i, H)), C = [H[2], H[3]], s = H[4], i = H[5];
          break;
        }
        case "S": {
          const [H, _] = a ? [2 * s - a[0], 2 * i - a[1]] : [s, i], O = [H, _, x[0] + v, x[1] + A, x[2] + v, x[3] + A];
          u(ln(s, i, O)), C = [O[2], O[3]], s = O[4], i = O[5];
          break;
        }
        case "Q":
        case "T": {
          let H = s, _ = i;
          y === "Q" ? (H = x[0] + v, _ = x[1] + A) : l && (H = 2 * s - l[0], _ = 2 * i - l[1]);
          const O = y === "Q" ? x[2] + v : x[0] + v, L = y === "Q" ? x[3] + A : x[1] + A;
          u(
            ln(s, i, [
              s + 2 / 3 * (H - s),
              i + 2 / 3 * (_ - i),
              O + 2 / 3 * (H - O),
              L + 2 / 3 * (_ - L),
              O,
              L
            ])
          ), T = [H, _], s = O, i = L;
          break;
        }
        case "A": {
          const H = x[5] + v, _ = x[6] + A;
          let O = s, L = i;
          for (const W of Wl(s, i, x[0], x[1], x[2], x[3], x[4], H, _))
            u(ln(O, L, W)), O = W[4], L = W[5];
          s = H, i = _;
          break;
        }
      }
      a = C, l = T;
    }
  }
  const f = n.reduce((p, m) => p + m.length, 0), d = [];
  for (let p = 0; p < n.length; ) {
    const m = n[p].subpath;
    let y = p, b = 0;
    for (; y < n.length && n[y].subpath === m; ) b += n[y++].length;
    const w = n[p], M = n[y - 1], x = h.has(m) || Math.abs(M.endX - w.startX) < 1e-9 && Math.abs(M.endY - w.startY) < 1e-9;
    d.push({ start: p, end: y, length: b, closed: x }), p = y;
  }
  const g = { segments: n, totalLength: f, subpaths: d };
  return me.size >= Cl && me.delete(me.keys().next().value), me.set(t, g), g;
}
function Bl(t, e) {
  const n = t.lengths;
  if (e <= 0) return 0;
  if (e >= t.length) return 1;
  let s = 0, i = n.length - 1;
  for (; s < i - 1; ) {
    const a = s + i >> 1;
    n[a] < e ? s = a : i = a;
  }
  const o = n[i] - n[s], r = o > 0 ? (e - n[s]) / o : 0;
  return (s + r) / (n.length - 1);
}
function Dl(t, e) {
  if (t.type === "L") {
    const u = t.length > 0 ? Math.max(0, Math.min(1, e / t.length)) : 0;
    return {
      x: t.startX + (t.endX - t.startX) * u,
      y: t.startY + (t.endY - t.startY) * u,
      angle: Math.atan2(t.endY - t.startY, t.endX - t.startX) * 180 / Math.PI
    };
  }
  const [n, s, i, o, r, a] = t.points, l = Bl(t, e);
  let c = Wi(t.startX, n, i, r, l), h = Wi(t.startY, s, o, a, l);
  if (Math.hypot(c, h) < 1e-9) {
    const u = l < 0.5 ? Math.min(1, l + 1e-3) : Math.max(0, l - 1e-3), f = qt(t.startX, n, i, r, u), d = qt(t.startY, s, o, a, u), g = qt(t.startX, n, i, r, l), p = qt(t.startY, s, o, a, l);
    c = l < 0.5 ? f - g : g - f, h = l < 0.5 ? d - p : p - d;
  }
  return {
    x: qt(t.startX, n, i, r, l),
    y: qt(t.startY, s, o, a, l),
    angle: Math.atan2(h, c) * 180 / Math.PI
  };
}
function Ir(t, e, n = 0, s = t.length) {
  if (s <= n) return { x: 0, y: 0, angle: 0 };
  let i = 0;
  for (let o = n; o < s; o++) {
    const r = t[o];
    if (i + r.length >= e || o === s - 1)
      return Dl(r, e - i);
    i += r.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function Nl(t, e) {
  const { segments: n, totalLength: s } = xe(t);
  return Ir(n, Math.max(0, Math.min(1, e)) * s);
}
function gg() {
  me.clear();
}
function mg(t) {
  return xe(t).totalLength;
}
const Kl = 24, Yl = 320, jl = 2.5, $e = 72, yg = 64, Xl = 0.2, ql = 128, Be = /* @__PURE__ */ new Map();
let vn = 0, Xt;
const Bi = (t) => Math.round(t * 100) / 100;
function Di(t, e) {
  const { segments: n, subpaths: s, totalLength: i } = xe(t);
  if (n.length === 0) return [];
  if (e) {
    const o = s.every((r) => r.closed);
    return [{ segments: n, start: 0, end: n.length, length: i, closed: o }];
  }
  return s.filter((o) => o.length > 0).map((o) => ({ segments: n, start: o.start, end: o.end, length: o.length, closed: o.closed }));
}
function Ls(t, e) {
  const n = t.closed ? (e % 1 + 1) % 1 : Math.max(0, Math.min(1, e)), s = Ir(t.segments, n * t.length, t.start, t.end);
  return [s.x, s.y];
}
function Ni(t) {
  const e = [];
  let n = 0;
  for (let s = t.start; s < t.end; s++)
    n += t.segments[s].length, t.length > 0 && e.push(n / t.length);
  return e;
}
function Ki(t, e) {
  const n = [];
  for (let s = 0; s < e; s++)
    n.push(Ls(t, t.closed ? s / e : s / (e - 1)));
  return n;
}
function Yi(t) {
  let e = 0, n = 0;
  for (const [s, i] of t)
    e += s, n += i;
  return e /= t.length, n /= t.length, t.map(([s, i]) => [s - e, i - n]);
}
function Ul(t, e, n) {
  const s = t.closed && e.closed;
  if (n !== void 0)
    return { offset: s ? Math.abs(n) % $e / $e : 0, reversed: n < 0 };
  const i = Yi(Ki(t, $e)), o = Yi(Ki(e, $e)), r = $e;
  let a = { offset: 0, reversed: !1 }, l = 1 / 0;
  for (const c of [!1, !0]) {
    const h = s ? r : 1;
    for (let u = 0; u < h; u++) {
      let f = 0;
      for (let d = 0; d < r && f < l; d++) {
        const g = s ? c ? (u - d + r) % r : (d + u) % r : c ? r - 1 - d : d, p = i[d][0] - o[g][0], m = i[d][1] - o[g][1];
        f += p * p + m * m;
      }
      f < l && (l = f, a = { offset: s ? u / r : 0, reversed: c });
    }
  }
  return a;
}
function Vl(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t + e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function zl(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t - e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function Gl(t, e, n) {
  const s = t.closed && e.closed, i = Ul(t, e, n.shapeIndex), o = Math.max(
    Kl,
    Math.min(Yl, Math.ceil(Math.max(t.length, e.length) / jl))
  ), r = /* @__PURE__ */ new Set(), a = (u) => r.add(Math.round(u * 1e7) / 1e7);
  for (let u = 0; u <= o; u++) a(u / o);
  for (const u of Ni(t)) a(u);
  for (const u of Ni(e)) a(zl(u, i, s));
  let l = [...r].sort((u, f) => u - f);
  s && (l = l.filter((u) => u < 1));
  const c = [], h = [];
  for (const u of l)
    c.push(...Ls(t, u)), h.push(...Ls(e, Vl(u, i, s)));
  return Jl({ from: c, to: h, closed: s });
}
function Jl(t) {
  const e = t.from.length / 2;
  if (e <= 3) return t;
  const n = new Uint8Array(e);
  n[0] = 1, n[e - 1] = 1;
  const s = [[0, e - 1]];
  for (; s.length > 0; ) {
    const [r, a] = s.pop();
    let l = -1, c = Xl;
    for (let h = r + 1; h < a; h++) {
      const u = Math.max(ji(t.from, r, a, h), ji(t.to, r, a, h));
      u > c && (c = u, l = h);
    }
    l !== -1 && (n[l] = 1, s.push([r, l], [l, a]));
  }
  const i = [], o = [];
  for (let r = 0; r < e; r++)
    n[r] && (i.push(t.from[r * 2], t.from[r * 2 + 1]), o.push(t.to[r * 2], t.to[r * 2 + 1]));
  return { from: i, to: o, closed: t.closed };
}
function ji(t, e, n, s) {
  const i = t[e * 2], o = t[e * 2 + 1], r = t[n * 2] - i, a = t[n * 2 + 1] - o, l = t[s * 2] - i, c = t[s * 2 + 1] - o, h = r * r + a * a, u = h === 0 ? 0 : Math.max(0, Math.min(1, (l * r + c * a) / h));
  return Math.hypot(l - u * r, c - u * a);
}
function Zl(t, e, n) {
  const s = n.shapeIndex;
  if (Xt && Xt.from === t && Xt.to === e && Xt.shapeIndex === s) return Xt.plan;
  const o = Be.get(String(s ?? "auto"))?.get(t)?.get(e);
  if (o)
    return Xt = { from: t, to: e, shapeIndex: s, plan: o }, o;
  const r = xe(t).subpaths.filter((d) => d.length > 0).length === xe(e).subpaths.filter((d) => d.length > 0).length, a = Di(t, !r), l = Di(e, !r), c = {
    pairs: a.map((d, g) => Gl(d, l[g], n))
  };
  vn >= ql && (Be.clear(), vn = 0);
  const h = String(s ?? "auto"), u = Be.get(h) ?? /* @__PURE__ */ new Map();
  Be.set(h, u);
  const f = u.get(t) ?? /* @__PURE__ */ new Map();
  return u.set(t, f), f.set(e, c), vn++, Xt = { from: t, to: e, shapeIndex: s, plan: c }, c;
}
function Ql(t, e, n, s = {}) {
  if (!t) return e;
  if (!e) return t;
  const i = Math.max(0, Math.min(1, n));
  if (i === 0) return t;
  if (i === 1) return e;
  const o = Zl(t, e, s);
  if (o.pairs.length === 0) return i < 0.5 ? t : e;
  let r = "";
  for (const a of o.pairs) {
    for (let l = 0; l < a.from.length; l += 2) {
      const c = Bi(a.from[l] + (a.to[l] - a.from[l]) * i), h = Bi(a.from[l + 1] + (a.to[l + 1] - a.from[l + 1]) * i);
      r += `${l === 0 ? r ? " M" : "M" : " L"}${c} ${h}`;
    }
    a.closed && (r += " Z");
  }
  return r;
}
function bg() {
  Be.clear(), vn = 0, Xt = void 0;
}
function on(t) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(t);
}
const ye = Math.PI / 180, tc = 0.9995;
function fi() {
  return [0, 0, 0, 1];
}
function ve(t, e) {
  const n = Math.hypot(t[0], t[1], t[2]);
  if (n === 0) return fi();
  const s = e * ye / 2, i = Math.sin(s) / n;
  return [t[0] * i, t[1] * i, t[2] * i, Math.cos(s)];
}
function ec(t, e, n) {
  return Fs(Fs(ve([0, 1, 0], e), ve([1, 0, 0], t)), ve([0, 0, 1], n));
}
function nc(t) {
  const [e, n, s, i] = Vt(t), o = 2 * (e * s + n * i), r = 2 * (e * n + s * i), a = 1 - 2 * (e * e + s * s), l = 2 * (n * s - e * i), c = 1 - 2 * (n * n + s * s), h = 2 * (e * s - n * i), u = 1 - 2 * (e * e + n * n), f = Math.asin(Math.max(-1, Math.min(1, -l)));
  return Math.abs(l) < 0.9999999 ? [f / ye, Math.atan2(o, u) / ye, Math.atan2(r, a) / ye] : [f / ye, Math.atan2(-h, c) / ye, 0];
}
function Fs(t, e) {
  const [n, s, i, o] = t, [r, a, l, c] = e;
  return [
    o * r + n * c + s * l - i * a,
    o * a - n * l + s * c + i * r,
    o * l + n * a - s * r + i * c,
    o * c - n * r - s * a - i * l
  ];
}
function Hr(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function Cr(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function Vt(t) {
  const e = Cr(t);
  return e === 0 ? fi() : [t[0] / e, t[1] / e, t[2] / e, t[3] / e];
}
function sc(t) {
  return [-t[0], -t[1], -t[2], t[3]];
}
function Or(t, e, n) {
  const s = Vt(t);
  let i = Vt(e), o = Hr(s, i);
  if (o < 0 && (i = [-i[0], -i[1], -i[2], -i[3]], o = -o), o > tc)
    return Vt([
      s[0] + (i[0] - s[0]) * n,
      s[1] + (i[1] - s[1]) * n,
      s[2] + (i[2] - s[2]) * n,
      s[3] + (i[3] - s[3]) * n
    ]);
  const r = Math.acos(o), a = Math.sin(r), l = Math.sin((1 - n) * r) / a, c = Math.sin(n * r) / a;
  return Vt([
    s[0] * l + i[0] * c,
    s[1] * l + i[1] * c,
    s[2] * l + i[2] * c,
    s[3] * l + i[3] * c
  ]);
}
function ic(t, e) {
  const [n, s, i, o] = Vt(t), r = 2 * (s * e[2] - i * e[1]), a = 2 * (i * e[0] - n * e[2]), l = 2 * (n * e[1] - s * e[0]);
  return [e[0] + o * r + (s * l - i * a), e[1] + o * a + (i * r - n * l), e[2] + o * l + (n * a - s * r)];
}
const wg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  conjugate: sc,
  dot: Hr,
  fromAxisAngle: ve,
  fromEuler: ec,
  identity: fi,
  length: Cr,
  multiply: Fs,
  normalize: Vt,
  rotateVec3: ic,
  slerp: Or,
  toEuler: nc
}, Symbol.toStringTag, { value: "Module" })), Dt = (t, e, n) => t + (e - t) * n, Rr = 512, is = /* @__PURE__ */ new Map(), os = /* @__PURE__ */ new Map();
function Xi(t) {
  const e = is.get(t);
  if (e) return e;
  const n = t.replace("#", ""), s = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return is.size < Rr && is.set(t, s), s;
}
const qi = (t) => t.charCodeAt(0) === 35, Ui = (t) => t.startsWith("rgb"), Vi = (t) => t.startsWith("rgba"), oc = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, rs = (t) => Math.round(t).toString(16).padStart(2, "0");
function rc(t, e, n) {
  return `#${rs(t)}${rs(e)}${rs(n)}`;
}
function zi(t) {
  const e = os.get(t);
  if (e) return e;
  const n = t.match(oc);
  if (!n)
    throw new Error(`Invalid rgb color: ${t}`);
  const s = parseInt(n[1], 10), i = parseInt(n[2], 10), o = parseInt(n[3], 10), r = n[4] !== void 0 ? [s, i, o, parseFloat(n[4])] : [s, i, o];
  return os.size < Rr && os.set(t, r), r;
}
const ac = (t, e, n) => {
  if (qi(t) && qi(e)) {
    const [s, i, o] = Xi(t), [r, a, l] = Xi(e), c = Dt(s, r, n), h = Dt(i, a, n), u = Dt(o, l, n);
    return rc(c, h, u);
  }
  if ((Ui(t) || Vi(t)) && (Ui(e) || Vi(e))) {
    const s = zi(t), i = zi(e), o = Math.round(Dt(s[0], i[0], n)), r = Math.round(Dt(s[1], i[1], n)), a = Math.round(Dt(s[2], i[2], n));
    if (s.length === 4 || i.length === 4) {
      const l = s[3] ?? 1, c = i[3] ?? 1, h = Dt(l, c, n);
      return `rgba(${o}, ${r}, ${a}, ${h})`;
    }
    return `rgb(${o}, ${r}, ${a})`;
  }
  return n < 1 ? t : e;
}, lc = (t, e, n) => {
  const s = Math.min(t.length, e.length), i = [];
  for (let o = 0; o < s; o++)
    i.push(Dt(t[o], e[o], n));
  return i;
}, cc = (t, e, n) => Or(t, e, n), Gi = (t, e, n) => n < 1 ? t : e, hc = (t, e, n) => Ql(t, e, n);
function In(t, e) {
  return e === "slerp" ? cc : typeof t == "number" ? Dt : Array.isArray(t) ? lc : typeof t == "string" ? t.startsWith("#") || t.startsWith("rgb") ? ac : on(t) ? hc : Gi : Gi;
}
const Lr = 1e3 / 60;
function Fr(t, e = {}) {
  if (!ae(t))
    throw new Error(`bakeSpringTrack: track "${t.id}" is not a spring track`);
  const n = new Un(t.spring);
  return Br(t, (s) => n.valueAt(s), n.settleTime(), t.spring.from, t.spring.to, e);
}
function Wr(t, e = {}) {
  if (!re(t))
    throw new Error(`bakeInertiaTrack: track "${t.id}" is not an inertia track`);
  const n = t.inertia;
  return Br(
    t,
    (s) => Os(n, s),
    sn(n),
    n.from,
    nn(n),
    e
  );
}
function Br(t, e, n, s, i, o) {
  const r = o.intervalMs ?? Lr, a = o.tolerance ?? 0.01, l = t.delay ?? 0, c = [];
  for (let u = 0; u <= n; u += r)
    c.push({ time: u + l, value: e(u), easing: "linear" });
  const h = c[c.length - 1];
  return !h || h.time < n + l ? c.push({ time: n + l, value: i, easing: "linear" }) : h.value = i, l > 0 && c.unshift({ time: 0, value: s, easing: "linear" }), {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: a > 0 ? fc(c, a) : c,
    ...t.targets && { targets: [...t.targets] },
    ...t.stagger && { stagger: { ...t.stagger } }
  };
}
function Dr(t, e, n, s = {}) {
  const i = s.intervalMs ?? Lr, o = typeof n == "function" ? n : Tt(n), r = In(t.value, s.interpolation), a = e.time - t.time;
  if (a <= 0) return [e];
  const l = [];
  for (let h = i; h < a; h += i) {
    const u = h / a;
    l.push({
      time: t.time + h,
      value: r(t.value, e.value, o(u)),
      easing: "linear"
    });
  }
  const c = o(1);
  return l.push({ ...e, ...c !== 1 && { value: r(t.value, e.value, c) }, easing: "linear" }), l;
}
function kg(t, e) {
  return ae(t) ? Fr(t, e) : re(t) ? Wr(t, e) : t;
}
function uc(t, e = {}) {
  const n = t.keyframes;
  if (!n.some((o) => $n(o.easing))) return t;
  const s = n.length > 0 ? [n[0]] : [], i = { ...e, interpolation: t.interpolation ?? e.interpolation };
  for (let o = 1; o < n.length; o++) {
    const r = n[o];
    $n(r.easing) ? s.push(...Dr(n[o - 1], r, r.easing, i)) : s.push(r);
  }
  return { ...t, keyframes: s };
}
function vg(t, e) {
  return t.filter(dl).map((n) => uc(n, e)).concat(
    t.filter(ae).map((n) => Fr(n, e)),
    t.filter(re).map((n) => Wr(n, e))
  );
}
function fc(t, e) {
  if (t.length <= 2) return t;
  const n = [t[0]];
  for (let s = 1; s < t.length - 1; s++) {
    const i = n[n.length - 1], o = t[s], r = t[s + 1], a = r.time - i.time;
    if (a <= 0) continue;
    const l = (o.time - i.time) / a, c = i.value + (r.value - i.value) * l;
    Math.abs(o.value - c) > e && n.push(o);
  }
  return n.push(t[t.length - 1]), n;
}
function Ws(t) {
  const e = [...t.keyframes].sort((n, s) => n.time - s.time);
  return {
    ...t,
    keyframes: e
  };
}
function ee(t) {
  return t.targets && t.targets.length > 0 ? t.targets : [t.target];
}
function Me(t, e, n, s) {
  const i = n ?? 0;
  return !s || e <= 1 ? i : i + ui(t, e, s);
}
class as {
  track;
  targets;
  constructor(e) {
    this.track = e, this.targets = ee(e);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(e) {
    return this.valueForOffset(e - Me(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  /**
   * Every target's value at a specific time, in target order.
   *
   * Single-target tracks yield one entry; staggered tracks yield one per target,
   * each sampled at its own offset time.
   */
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const o = Me(i, n, this.track.delay, this.track.stagger), r = this.valueForOffset(e - o);
      r !== void 0 && s.push({ target: this.targets[i], value: r, start: o + this.track.keyframes[0].time });
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
    const n = e[e.length - 1].time, s = this.track.stagger ? qn(this.targets.length, this.track.stagger) : 0;
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
    const { from: s, to: i } = this.findSurroundingKeyframes(e);
    if (!s || !i)
      return;
    if (s.time === e)
      return s.value;
    const o = i.time - s.time, r = (e - s.time) / o, l = Tt(i.easing)(r);
    return In(s.value, this.track.interpolation)(s.value, i.value, l);
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
class dc {
  track;
  targets;
  sampler;
  constructor(e) {
    this.track = e, this.targets = ee(e), this.sampler = new Un(e.spring);
  }
  getValueAtTime(e) {
    return this.sampler.valueAt(e - Me(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const o = Me(i, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[i], value: this.sampler.valueAt(e - o), start: o });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? qn(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
class pc {
  track;
  targets;
  duration;
  constructor(e) {
    this.track = e, this.targets = ee(e), this.duration = sn(e.inertia);
  }
  getValueAtTime(e) {
    return Os(this.track.inertia, e - Me(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const o = Me(i, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[i], value: Os(this.track.inertia, e - o), start: o });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? qn(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
function Nr(t, e) {
  const n = { ...Nl(t.pathData, e) };
  if (t.matrix) {
    const [s, i, o, r, a, l] = t.matrix, { x: c, y: h } = n;
    n.x = s * c + o * h + a, n.y = i * c + r * h + l;
    const u = n.angle * Math.PI / 180, f = Math.cos(u), d = Math.sin(u);
    n.angle = Math.atan2(i * f + r * d, s * f + o * d) * 180 / Math.PI;
  }
  return t.autoRotate && t.rotateOffset && (n.angle += t.rotateOffset), n;
}
function Sg(t, e, n, s) {
  const i = e + (n - e) * s;
  return Nr(t, i);
}
const ls = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, gc = 20;
function mc(t) {
  const e = ls[t ?? "upperCase"] ?? t ?? ls.upperCase, n = Array.from(e);
  return n.length > 0 ? n : Array.from(ls.upperCase);
}
function yc(t, e, n) {
  let s = (t | 0) ^ Math.imul(e + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return s = Math.imul(s ^ s >>> 16, 2146121005), s = Math.imul(s ^ s >>> 15, 2221713035), (s ^ s >>> 16) >>> 0;
}
function bc(t, e, n = 0) {
  const s = t.from ?? "", i = t.to, o = Math.max(0, Math.min(1, e));
  if (o <= 0) return s;
  if (o >= 1) return i;
  const r = Array.from(s), a = Array.from(i), l = t.rightToLeft ?? !1;
  if (t.mode === "type") {
    const b = Math.round(o * Math.max(r.length, a.length));
    return l ? r.slice(0, Math.max(0, r.length - b)).join("") + a.slice(Math.max(0, a.length - b)).join("") : a.slice(0, b).join("") + r.slice(b).join("");
  }
  const c = Math.max(0, Math.min(0.999, t.revealDelay ?? 0)), h = Math.max(0, (o - c) / (1 - c)), u = Math.floor(h * a.length), f = t.tweenLength === !1 ? a.length : Math.round(r.length + (a.length - r.length) * o), d = mc(t.chars), g = t.refreshRate ?? gc, p = g > 0 ? Math.floor(n * g / 1e3) : 0, m = t.seed ?? 1;
  let y = "";
  for (let b = 0; b < f; b++) {
    const w = l ? b >= f - u : b < u, M = l ? a[a.length - (f - b)] : a[b];
    w && M !== void 0 || M === " " || M === `
` ? y += M : y += d[yc(m, b, p) % d.length];
  }
  return y;
}
class Ae {
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
    let i = e * this.speed;
    if (this._repeatDelayRemaining > 0) {
      const a = Math.min(this._repeatDelayRemaining, i);
      if (this._repeatDelayRemaining -= a, i -= a, this._repeatDelayRemaining > 0) {
        this.onUpdate?.(this.getStateAtTime(this._currentTime));
        return;
      }
      this._wrapAfterDelay && (this._wrapAfterDelay = !1, this._currentTime = 0);
    }
    const o = 1e3;
    for (let a = 0; a < o && i > 0 && this._playbackState === "playing"; a++)
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
    const r = this.getStateAtTime(this._currentTime);
    this.onUpdate?.(r);
  }
  /**
   * Get the animation state at a specific time.
   */
  getStateAtTime(e) {
    const n = /* @__PURE__ */ new Map();
    if (e = pl(e, this._config.drawingRate ?? 0), this._hasSharedWrites())
      this._resolveShared(e, n);
    else
      for (const [s, i] of this._trackPlayers) {
        const o = i.getTrack().property;
        for (const { target: r, value: a, start: l } of i.getTargetValues(e))
          this._write(n, s, r, o, a, e - l);
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
    for (const [i, o] of this._trackPlayers) {
      const r = o.getTrack().property;
      for (const { target: a, value: l, start: c } of o.getTargetValues(e)) {
        const h = `${a}\0${r}`, u = c <= e, f = s.get(h);
        (!f || (u !== f.started ? u : u ? c >= f.start : c <= f.start)) && s.set(h, { trackId: i, target: a, property: r, value: l, start: c, started: u });
      }
    }
    for (const { trackId: i, target: o, property: r, value: a, start: l } of s.values())
      this._write(n, i, o, r, a, e - l);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(e, n, s, i, o, r) {
    if (o === void 0) return;
    let a = e.get(s);
    a || (a = /* @__PURE__ */ new Map(), e.set(s, a));
    const l = this._textTracks.get(n);
    if (l && typeof o == "number") {
      a.set("text", bc(l.textConfig, o, Math.max(0, r)));
      return;
    }
    const c = this._motionPathTracks.get(n);
    if (c && typeof o == "number") {
      const h = Nr(c.motionPathConfig, o);
      a.set("motionPathX", h.x), a.set("motionPathY", h.y), c.motionPathConfig.autoRotate && a.set("motionPathRotate", h.angle);
    } else
      a.set(i, o);
  }
  /** Cached: does any target+property have more than one track? */
  _sharedWrites = null;
  _hasSharedWrites() {
    if (this._sharedWrites === null) {
      const e = /* @__PURE__ */ new Set();
      this._sharedWrites = !1;
      t: for (const n of this._tracks)
        for (const s of ee(n)) {
          const i = `${s}\0${n.property}`;
          if (e.has(i)) {
            this._sharedWrites = !0;
            break t;
          }
          e.add(i);
        }
    }
    return this._sharedWrites;
  }
  /**
   * Add a track to the timeline.
   */
  addTrack(e) {
    if (this._tracks.push(e), this._sharedWrites = null, re(e)) {
      this._trackPlayers.set(e.id, new pc(e));
      return;
    }
    if (ae(e)) {
      this._trackPlayers.set(e.id, new dc(e)), this._springTracks.set(e.id, e);
      return;
    }
    if (hi(e))
      this._trackPlayers.set(e.id, new as(e)), this._textTracks.set(e.id, e);
    else if (Tr(e)) {
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
      this._trackPlayers.set(e.id, new as(n)), this._motionPathTracks.set(e.id, e);
    } else
      this._trackPlayers.set(e.id, new as(e));
  }
  /**
   * Replace a track with a new version, keeping its place in the track order
   * (which decides ties when tracks overlap). The new track may have a
   * different id. Does nothing if no track has `trackId`.
   */
  replaceTrack(e, n) {
    const s = this._tracks.findIndex((o) => o.id === e);
    if (s < 0) return;
    const i = this._tracks.slice(s + 1);
    this.removeTrack(e);
    for (const o of i) this.removeTrack(o.id);
    this.addTrack(n);
    for (const o of i) this.addTrack(o);
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
    const s = n.getTrack(), i = s.delay ?? 0;
    if (ae(s) || re(s))
      return { from: i, to: n.getDuration() };
    const o = s.keyframes;
    if (!(!o || o.length === 0))
      return { from: o[0].time + i, to: n.getDuration() };
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
      const s = this._tracks[n], i = this.getTrackSpan(s.id);
      if (i)
        for (let o = 0; o < n; o++) {
          const r = this._tracks[o];
          if (r.property !== s.property) continue;
          const a = ee(r).filter((u) => ee(s).includes(u));
          if (a.length === 0) continue;
          const l = this.getTrackSpan(r.id);
          if (!l || !(l.from <= i.to && i.from <= l.to)) continue;
          const h = i.from >= l.from;
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
    if (n.id !== void 0 && e.id !== n.id || n.property !== void 0 && e.property !== n.property || n.target !== void 0 && !ee(e).includes(n.target)) return !1;
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
      formatVersion: Mr(this._tracks),
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
    const n = e && e.length > 0 ? [...e].sort((i, o) => i.time - o.time).map((i) => ({ ...i })) : void 0, s = { ...this._config };
    n ? s.markers = n : delete s.markers, this._config = s;
  }
  /** Caption text per language, per marker id */
  get captions() {
    return this._captions;
  }
  /** Replace the captions; languages with no captions are dropped. */
  setCaptions(e) {
    const n = {};
    for (const [s, i] of Object.entries(e ?? {})) n[s] = { ...i };
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
const wc = 100;
function Kr(t, e, n, s) {
  const i = [], o = [], { duration: r, alternate: a } = s, l = (d, g, p, m) => {
    o.push([d, g]);
    const y = [];
    t.forEach((b, w) => {
      (p === "forward" ? (m ? b >= d : b > d) && b <= g : (m ? b <= d : b < d) && b >= g) && y.push(w);
    }), y.sort((b, w) => (p === "forward" ? t[b] - t[w] : t[w] - t[b]) || b - w);
    for (const b of y) i.push({ kind: "event", index: b, direction: p });
  };
  let c = e.time, h = e.direction, u = e.fresh === !0;
  const f = Math.min(wc, Math.max(0, n.iteration - e.iteration));
  for (let d = 0; d < f; d++) {
    const g = h === "forward" ? r : 0;
    l(c, g, h, u), i.push({ kind: "repeat" }), a ? (h = h === "forward" ? "reverse" : "forward", c = g, u = !1) : (c = h === "forward" ? 0 : r, u = !0);
  }
  return f > 0 && s.holding && !a ? { crossings: i, passes: o } : (l(c, n.time, h, u), { crossings: i, passes: o });
}
function kc(t) {
  return re(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "inertia",
    inertia: Yr(t.inertia),
    ...Rt(t)
  } : ae(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "spring",
    spring: { ...t.spring },
    ...Rt(t)
  } : hi(t) ? {
    id: t.id,
    target: t.target,
    property: "text",
    textConfig: { ...t.textConfig },
    keyframes: t.keyframes.map(cs),
    ...Rt(t)
  } : Tr(t) ? {
    id: t.id,
    target: t.target,
    property: "motionPath",
    motionPathConfig: { ...t.motionPathConfig },
    keyframes: t.keyframes.map(cs),
    ...Rt(t)
  } : {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes.map(cs),
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...Rt(t)
  };
}
function Yr(t) {
  return { ...t, ...Array.isArray(t.end) && { end: [...t.end] } };
}
function cs(t) {
  return {
    time: t.time,
    value: t.value,
    ...t.easing && { easing: t.easing }
  };
}
function Rt(t) {
  const e = t.endDelay;
  return {
    ...t.delay !== void 0 && { delay: t.delay },
    ...e !== void 0 && { endDelay: e },
    ...t.targets !== void 0 && { targets: [...t.targets] },
    ...t.stagger !== void 0 && { stagger: { ...t.stagger } }
  };
}
function vc(t) {
  if (re(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "inertia",
      inertia: Yr(e.inertia),
      ...Rt(e)
    };
  }
  if (ae(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "spring",
      spring: { ...e.spring },
      ...Rt(e)
    };
  }
  if (hi(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: "text",
      textConfig: { ...e.textConfig },
      keyframes: [...e.keyframes].sort((n, s) => n.time - s.time),
      ...Rt(e)
    };
  }
  if (t.property === "motionPath" && "motionPathConfig" in t) {
    const e = t, n = [...e.keyframes].sort((s, i) => s.time - i.time);
    return {
      id: e.id,
      target: e.target,
      property: "motionPath",
      motionPathConfig: { ...e.motionPathConfig },
      keyframes: n,
      ...Rt(e)
    };
  }
  return Ws({
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes,
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...Rt(t)
  });
}
function Sc(t) {
  const e = t._config.markers;
  return {
    formatVersion: Mr(t.tracks),
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
    tracks: t.tracks.map(kc),
    ...t.captions && { captions: JSON.parse(JSON.stringify(t.captions)) }
  };
}
function Ve(t) {
  const e = t.formatVersion ?? 1;
  if (e > Ri)
    throw new Error(
      `tinyfly: this animation uses format version ${e}, but this tinyfly reads up to version ${Ri}. Update tinyfly to play it.`
    );
  return new Ae({
    id: t.id,
    name: t.name,
    config: t.config,
    tracks: t.tracks.map(vc),
    captions: t.captions
  });
}
function xg(t) {
  return JSON.stringify(Sc(t));
}
function Mg(t) {
  const e = JSON.parse(t);
  return Ve(e);
}
function rn(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++)
    e ^= t.charCodeAt(n), e = Math.imul(e, 16777619);
  return e >>> 0;
}
function Gn(t) {
  let e = t >>> 0 || 2654435769;
  return {
    seed: t >>> 0,
    next() {
      return e ^= e << 13, e >>>= 0, e ^= e >> 17, e ^= e << 5, e >>>= 0, e / 4294967296;
    }
  };
}
function jr(t, e, n) {
  return e + t.next() * (n - e);
}
function xc(t, e, n, s) {
  if (s <= 0) return jr(t, e, n);
  const i = Math.floor((n - e) / s), o = Math.round(t.next() * i);
  return e + o * s;
}
function Tg(t, e) {
  if (e.length !== 0)
    return e[Math.floor(t.next() * e.length)];
}
const Xr = /^([+\-*/])=\s*(-?[\d.]+)$/, qr = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function Eg(t) {
  return typeof t != "string" ? !1 : Xr.test(t.trim()) || qr.test(t.trim());
}
function Ur(t, e = {}) {
  if (typeof t != "string") return t;
  const n = t.trim(), s = Xr.exec(n);
  if (s) {
    const [, o, r] = s, a = e.base ?? 0, l = Number.parseFloat(r);
    switch (o) {
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
  const i = qr.exec(n);
  if (i) {
    if (!e.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const o = Number.parseFloat(i[1]), r = Number.parseFloat(i[2]), a = i[3] !== void 0 ? Number.parseFloat(i[3]) : void 0;
    return a !== void 0 ? xc(e.random, o, r, a) : jr(e.random, o, r);
  }
  return t;
}
function Mc(t, e = 0, n) {
  const s = [];
  let i = e;
  for (const o of t) {
    const r = Ur(o, { base: i, random: n });
    s.push(r), typeof r == "number" && (i = r);
  }
  return s;
}
class Ag {
  random;
  constructor(e) {
    this.random = Gn(e);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(e, n = 0) {
    return Ur(e, { base: n, random: this.random });
  }
  resolveSequence(e, n = 0) {
    return Mc(e, n, this.random);
  }
}
const Tc = 600;
function Ec(t) {
  if (Array.isArray(t)) {
    const [f, d, g, p] = t;
    return { fn: Ji(f, d, g, p), bezier: [f, d, g, p] };
  }
  const { segments: e } = xe(t);
  if (e.length === 0) throw new Error(`customEase: no curve in "${t}"`);
  const n = e[0].startX, s = e[0].startY, i = e[e.length - 1], o = i.endX - n, r = i.endY - s;
  if (o === 0 || r === 0) throw new Error(`customEase: "${t}" must move along both axes`);
  const a = (f) => (f - n) / o, l = (f) => (f - s) / r;
  if (e.length === 1 && i.type === "C") {
    const [f, d, g, p] = i.points, m = [a(f), l(d), a(g), l(p)];
    return { fn: Ji(...m), bezier: m };
  }
  const c = [], h = [], u = Math.max(8, Math.ceil(Tc / e.length));
  for (const f of e)
    for (let d = c.length === 0 ? 0 : 1; d <= u; d++) {
      const [g, p] = $c(f, d / u);
      c.push(a(g)), h.push(l(p));
    }
  return { fn: _c(c, h) };
}
function Ac(t = {}) {
  const n = 0.1 + Math.max(0, Math.min(1, t.strength ?? 0.7)) * 0.7, s = [1];
  for (let o = n; o > 2e-3; o *= n) s.push(2 * Math.sqrt(o));
  const i = s.reduce((o, r) => o + r, 0);
  return (o) => {
    if (o <= 0) return 0;
    if (o >= 1) return 1;
    let r = o * i;
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
function Pc(t = {}) {
  const e = Math.max(1, t.wiggles ?? 10), n = t.type ?? "easeOut", s = (i) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * i) : (1 - i) ** 2;
  return (i) => i <= 0 || i >= 1 ? 0 : Math.sin(i * e * Math.PI * 2) * s(i);
}
function $c(t, e) {
  if (t.type === "L") {
    const [c, h] = t.points;
    return [t.startX + (c - t.startX) * e, t.startY + (h - t.startY) * e];
  }
  const [n, s, i, o, r, a] = t.points, l = 1 - e;
  return [
    l * l * l * t.startX + 3 * l * l * e * n + 3 * l * e * e * i + e * e * e * r,
    l * l * l * t.startY + 3 * l * l * e * s + 3 * l * e * e * o + e * e * e * a
  ];
}
function _c(t, e) {
  return (n) => {
    if (n <= t[0]) return e[0];
    if (n >= t[t.length - 1]) return e[e.length - 1];
    let s = 0, i = t.length - 1;
    for (; i - s > 1; ) {
      const r = s + i >> 1;
      t[r] <= n ? s = r : i = r;
    }
    const o = t[i] - t[s];
    return o === 0 ? e[i] : e[s] + (n - t[s]) / o * (e[i] - e[s]);
  };
}
function Ji(t, e, n, s) {
  const i = (r, a, l) => 3 * (1 - r) * (1 - r) * r * a + 3 * (1 - r) * r * r * l + r * r * r, o = (r, a, l) => 3 * (1 - r) * (1 - r) * a + 6 * (1 - r) * r * (l - a) + 3 * r * r * (1 - l);
  return (r) => {
    if (r <= 0) return 0;
    if (r >= 1) return 1;
    let a = r;
    for (let h = 0; h < 8; h++) {
      const u = i(a, t, n) - r, f = o(a, t, n);
      if (Math.abs(u) < 1e-6) return i(a, e, s);
      if (Math.abs(f) < 1e-6) break;
      a -= u / f;
    }
    let l = 0, c = 1;
    a = r;
    for (let h = 0; h < 40; h++)
      i(a, t, n) < r ? l = a : c = a, a = (l + c) / 2;
    return i(a, e, s);
  };
}
const Ic = 350, Hc = 300, Cc = 550;
function Pg(t, e = {}) {
  const n = e.lead ?? Ic, s = e.gap ?? Hc, i = e.tail ?? Cc, o = [];
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
    const u = h + i + (a.tail ?? 0);
    o.push({ id: a.id ?? `s${l}`, start: r, duration: u - r, cues: c }), r = u;
  }), { duration: r, scenes: o, cues: o.flatMap((a) => a.cues) };
}
function $g(t) {
  return t.cues.map((e) => ({ id: e.id, time: e.start, label: e.text }));
}
function _g(t, e) {
  let n = t.scenes[0];
  for (const s of t.scenes)
    if (e >= s.start) n = s;
    else break;
  return n;
}
const Vr = (t) => 6e4 / t.bpm;
function di(t, e) {
  return t.offset + e * Vr(t);
}
function pi(t, e) {
  return (e - t.offset) / Vr(t);
}
function Ig(t, e) {
  return di(t, Math.round(pi(t, e)));
}
function Hg(t, e) {
  return di(t, Math.ceil(pi(t, e) - 1e-9));
}
function Cg(t, e, n) {
  const s = Math.max(1, Math.round(t.beatsPerBar ?? 4)), i = [];
  if (!(t.bpm > 0) || n < e) return i;
  for (let o = Math.ceil(pi(t, e) - 1e-9); ; o++) {
    const r = di(t, o);
    if (r > n + 1e-9) break;
    i.push({ time: r, bar: (o % s + s) % s === 0, n: o });
  }
  return i;
}
const ue = 100;
function Og(t, e, n = {}) {
  const s = n.minBpm ?? 70, i = n.maxBpm ?? 180, o = Math.max(1, Math.round(e / ue)), r = Math.min(t.length, Math.round((n.maxSeconds ?? 60) * e)), a = Math.floor(r / o);
  if (a < 4) return { bpm: 120, offset: 0, confidence: 0 };
  const l = new Float64Array(a);
  for (let T = 0; T < a; T++) {
    let H = 0;
    for (let _ = T * o; _ < (T + 1) * o; _++) H += t[_] * t[_];
    l[T] = Math.log(1e-6 + H / o);
  }
  const c = new Float64Array(a);
  for (let T = 1; T < a; T++) c[T] = Math.max(0, l[T] - l[T - 1]);
  const h = c.reduce((T, H) => T + H, 0) / a;
  for (let T = 0; T < a; T++) c[T] = Math.max(0, c[T] - h);
  const u = Math.max(1, Math.floor(60 * ue / i)), f = Math.min(a - 1, Math.ceil(60 * ue / s)), d = (T) => {
    let H = 0;
    for (let _ = T; _ < a; _++) H += c[_] * c[_ - T];
    return H / (a - T);
  };
  let g = 0;
  for (let T = 0; T < a; T++) g += c[T] * c[T];
  g /= a;
  let p = u, m = -1 / 0;
  for (let T = u; T <= f; T++) {
    const H = 60 * ue / T, _ = Math.exp(-0.5 * (Math.log2(H / 120) / 0.9) ** 2), O = d(T) * _;
    O > m && (m = O, p = T);
  }
  const y = (T) => {
    const H = Math.floor(T);
    return H < 0 || H + 1 >= a ? 0 : c[H] + (c[H + 1] - c[H]) * (T - H);
  }, b = (T, H) => {
    let _ = 0;
    for (let O = H; O < a; O += T) _ += y(O);
    return _;
  };
  let w = p, M = 0, x = -1 / 0;
  for (let T = p - 0.6; T <= p + 0.6 + 1e-9; T += 0.02) {
    if (T < 1) continue;
    const H = Math.max(1, Math.round(T * 4));
    for (let _ = 0; _ < H; _++) {
      const O = _ / H * T, L = b(T, O);
      L > x && (x = L, M = O, w = T);
    }
  }
  const v = 60 * ue / w, A = g > 0 ? Math.max(0, Math.min(1, d(p) / g)) : 0, C = (M + 0.5) * 1e3 / ue;
  return { bpm: Math.round(v * 100) / 100, offset: Math.round(C % (6e4 / v)), confidence: A };
}
const Oc = 600, Rc = 250, Zi = 1;
function Rg(t, e) {
  const n = e.target ?? "Camera", s = { x: e.stage.width / 2, y: e.stage.height / 2 }, i = {}, o = (u, f, d, g) => {
    const p = i[u] ??= [];
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
    for (const p of ["x", "y", "scale", "rotate"]) o(p, u, g[p], d);
  };
  let l = { focusX: s.x, focusY: s.y, scale: 1, rotate: 0 };
  const c = [...t].sort((u, f) => u.at - f.at), h = c.filter((u) => !("shake" in u));
  h.length > 0 && a(0, l);
  for (const u of h)
    if ("frame" in u) {
      const f = Math.max(Zi, u.duration ?? Oc);
      a(u.at, l), l = {
        focusX: u.frame.focus?.x ?? s.x,
        focusY: u.frame.focus?.y ?? s.y,
        scale: u.frame.scale ?? 1,
        rotate: u.frame.rotate ?? 0
      }, a(u.at + f, l, u.easing ?? (f > Zi ? "ease-in-out" : void 0));
    } else {
      const { follow: f } = u, d = f.lag ?? Rc, g = new Ae({ id: "follow", tracks: [{ id: "x", target: "s", property: "x", keyframes: f.x }] }), p = (b) => g.getStateAtTime(b).values.get("s")?.get("x") ?? l.focusX, m = [u.at, ...f.x.map((b) => b.time).filter((b) => b > u.at && b < u.until), u.until];
      a(u.at, l);
      const y = (b) => ({
        focusX: p(b) + (f.lead ?? 0),
        focusY: f.y ?? l.focusY,
        scale: f.scale ?? l.scale,
        rotate: l.rotate
      });
      for (const b of m) {
        const w = f.x.find((M) => M.time === b)?.easing;
        a(b + d, y(b), b === u.at ? "ease-in-out" : w);
      }
      l = y(u.until);
    }
  for (const u of c.filter((f) => "shake" in f)) {
    const f = u.shake.strength ?? 12, d = u.shake.roll ?? 1.5, g = 1e3 / (u.shake.frequency ?? 24), p = Gn(u.shake.seed ?? Math.round(u.at) + 1), m = () => p.next() * 2 - 1;
    for (const y of ["shakeX", "shakeY", "shakeRotate"]) o(y, u.at, 0);
    for (let y = u.at + g; y < u.at + u.duration; y += g) {
      const b = 1 - (y - u.at) / u.duration;
      o("shakeX", y, m() * f * b), o("shakeY", y, m() * f * b), o("shakeRotate", y, m() * d * b);
    }
    for (const y of ["shakeX", "shakeY", "shakeRotate"]) o(y, u.at + u.duration, 0, "ease-out");
  }
  return Object.entries(i).map(([u, f]) => ({ id: `${n}-${u}`, target: n, property: u, keyframes: f }));
}
function Lc(t, e) {
  const n = t.toLowerCase(), s = e.toLowerCase();
  let i = Array.from({ length: s.length + 1 }, (o, r) => r);
  for (let o = 1; o <= n.length; o++) {
    const r = [o];
    for (let a = 1; a <= s.length; a++)
      r[a] = Math.min(i[a] + 1, r[a - 1] + 1, i[a - 1] + (n[o - 1] === s[a - 1] ? 0 : 1));
    i = r;
  }
  return i[s.length];
}
function Bs(t, e) {
  const n = t.toLowerCase(), s = e.find((r) => r.toLowerCase().includes(n) || n.includes(r.toLowerCase()));
  if (s && Math.min(t.length, s.length) >= 3) return s;
  let i, o = 1 / 0;
  for (const r of e) {
    const a = Lc(t, r);
    a < o && (o = a, i = r);
  }
  return i !== void 0 && o <= Math.max(2, Math.floor(t.length / 3)) ? i : void 0;
}
function zt(t, e, n, s) {
  const i = typeof e == "string" ? s ?? Bs(e, n) : void 0;
  return `Unknown ${t} ${JSON.stringify(e)}${i ? `: did you mean "${i}"?` : "."} Known: ${n.join(", ")}`;
}
const Ct = (t) => Math.round(t * 1e3) / 1e3;
function Fc(t, e = {}) {
  if (t.length === 0) return "";
  const n = e.curviness ?? 1, s = e.closed ?? !1, i = t.length;
  let o = `M${Ct(t[0].x)} ${Ct(t[0].y)}`;
  if (i === 1) return o;
  const r = (l) => s ? t[(l % i + i) % i] : t[Math.max(0, Math.min(i - 1, l))], a = s ? i : i - 1;
  for (let l = 0; l < a; l++) {
    const c = r(l - 1), h = r(l), u = r(l + 1), f = r(l + 2);
    if (n === 0) {
      o += ` L${Ct(u.x)} ${Ct(u.y)}`;
      continue;
    }
    const d = n / 6, g = h.x + (u.x - c.x) * d, p = h.y + (u.y - c.y) * d, m = u.x - (f.x - h.x) * d, y = u.y - (f.y - h.y) * d;
    o += ` C${Ct(g)} ${Ct(p)} ${Ct(m)} ${Ct(y)} ${Ct(u.x)} ${Ct(u.y)}`;
  }
  return s ? `${o} Z` : o;
}
const pt = (t, e = 0) => {
  const n = parseFloat(t ?? "");
  return Number.isFinite(n) ? n : e;
};
function Wc(t) {
  const e = (t ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let s = 0; s + 1 < e.length; s += 2) n.push({ x: e[s], y: e[s + 1] });
  return n;
}
function gi(t) {
  const e = t.attributes;
  switch (t.tag.toLowerCase()) {
    case "path":
      return e.d ?? null;
    case "circle":
    case "ellipse": {
      const n = pt(e.cx), s = pt(e.cy), i = t.tag.toLowerCase() === "circle" ? pt(e.r) : pt(e.rx), o = t.tag.toLowerCase() === "circle" ? pt(e.r) : pt(e.ry);
      return `M${n + i} ${s} A${i} ${o} 0 1 1 ${n - i} ${s} A${i} ${o} 0 1 1 ${n + i} ${s} Z`;
    }
    case "rect": {
      const n = pt(e.x), s = pt(e.y), i = pt(e.width), o = pt(e.height);
      let r = e.rx != null ? pt(e.rx) : e.ry != null ? pt(e.ry) : 0, a = e.ry != null ? pt(e.ry) : r;
      return r = Math.min(r, i / 2), a = Math.min(a, o / 2), r === 0 || a === 0 ? `M${n} ${s} H${n + i} V${s + o} H${n} Z` : `M${n + r} ${s} H${n + i - r} A${r} ${a} 0 0 1 ${n + i} ${s + a} V${s + o - a} A${r} ${a} 0 0 1 ${n + i - r} ${s + o} H${n + r} A${r} ${a} 0 0 1 ${n} ${s + o - a} V${s + a} A${r} ${a} 0 0 1 ${n + r} ${s} Z`;
    }
    case "line":
      return `M${pt(e.x1)} ${pt(e.y1)} L${pt(e.x2)} ${pt(e.y2)}`;
    case "polyline":
    case "polygon": {
      const n = Wc(e.points);
      if (n.length === 0) return null;
      const s = n.map((i, o) => `${o === 0 ? "M" : "L"}${i.x} ${i.y}`).join(" ");
      return t.tag.toLowerCase() === "polygon" ? `${s} Z` : s;
    }
    default:
      return null;
  }
}
function Lg(t, e, n) {
  const s = Math.max(2, Math.round(n.samples ?? 32)), i = Math.max(0, n.length), o = n.since !== void 0 ? Math.max(e - i, n.since) : e - i;
  if (o >= e) return [];
  const r = n.period, a = [];
  for (let l = 0; l < s; l++) {
    const c = o + (e - o) * l / (s - 1), h = r && r > 0 && l < s - 1 ? (c % r + r) % r : c;
    a.push({ at: t(h), time: c, age: i > 0 ? (e - c) / i : 0 });
  }
  return a;
}
const Bc = 2.5;
function Dc(t) {
  const e = [], n = [], s = t.length, i = (o, r) => {
    for (let a = o + r; a >= 0 && a < s; a += r) {
      const l = (t[a].x - t[o].x) * r, c = (t[a].y - t[o].y) * r, h = Math.hypot(l, c);
      if (h > 1e-9) return [l / h, c / h];
    }
    return null;
  };
  for (let o = 0; o < s; o++) {
    const r = t[o], a = i(o, -1), l = i(o, 1), c = a ?? l ?? [1, 0], h = l ?? a ?? [1, 0];
    let u = c[0] + h[0], f = c[1] + h[1];
    const d = Math.hypot(u, f);
    d < 1e-9 ? (u = c[0], f = c[1]) : (u /= d, f /= d);
    const g = u * c[0] + f * c[1], p = Math.min(Bc, 1 / Math.max(g, 1e-6)), m = r.width / 2 * p;
    e.push({ x: r.x - f * m, y: r.y + u * m }), n.push({ x: r.x + f * m, y: r.y - u * m });
  }
  return { left: e, right: n };
}
function Nc(t) {
  const e = t.length;
  if (e < 2) return null;
  const n = t[e - 1];
  for (let s = e - 2; s >= 0; s--) {
    const i = n.x - t[s].x, o = n.y - t[s].y, r = Math.hypot(i, o);
    if (r > 1e-9)
      return { x: n.x, y: n.y, radius: n.width / 2, start: Math.atan2(i / r, -o / r) };
  }
  return null;
}
function Sn(t, e) {
  return [t[0] + e[0], t[1] + e[1], t[2] + e[2]];
}
function Jn(t, e) {
  return [t[0] - e[0], t[1] - e[1], t[2] - e[2]];
}
function Ye(t, e) {
  return [t[0] * e, t[1] * e, t[2] * e];
}
function je(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function Hn(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function mi(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function zr(t, e) {
  return mi(Jn(t, e));
}
function ze(t) {
  const e = mi(t);
  return e === 0 ? [0, 0, 0] : Ye(t, 1 / e);
}
function Gr(t, e, n) {
  return [t[0] + (e[0] - t[0]) * n, t[1] + (e[1] - t[1]) * n, t[2] + (e[2] - t[2]) * n];
}
const Fg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Sn,
  cross: Hn,
  distance: zr,
  dot: je,
  length: mi,
  lerp: Gr,
  normalize: ze,
  scale: Ye,
  subtract: Jn
}, Symbol.toStringTag, { value: "Module" })), Kc = Math.PI / 180;
function Jr() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function Qt(t, e) {
  const n = new Array(16);
  for (let s = 0; s < 4; s++)
    for (let i = 0; i < 4; i++) {
      let o = 0;
      for (let r = 0; r < 4; r++) o += t[r * 4 + i] * e[s * 4 + r];
      n[s * 4 + i] = o;
    }
  return n;
}
function Zr(t) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1];
}
function xn(t) {
  return [t[0], 0, 0, 0, 0, t[1], 0, 0, 0, 0, t[2], 0, 0, 0, 0, 1];
}
function Ge(t) {
  const [e, n, s, i] = t;
  return [
    1 - 2 * (n * n + s * s),
    2 * (e * n + s * i),
    2 * (e * s - n * i),
    0,
    2 * (e * n - s * i),
    1 - 2 * (e * e + s * s),
    2 * (n * s + e * i),
    0,
    2 * (e * s + n * i),
    2 * (n * s - e * i),
    1 - 2 * (e * e + n * n),
    0,
    0,
    0,
    0,
    1
  ];
}
function Qr(t, e, n) {
  const s = Ge(e);
  for (let i = 0; i < 3; i++)
    s[i] *= n[0], s[4 + i] *= n[1], s[8 + i] *= n[2];
  return s[12] = t[0], s[13] = t[1], s[14] = t[2], s;
}
function Yc(t) {
  const e = new Array(16);
  for (let n = 0; n < 4; n++) for (let s = 0; s < 4; s++) e[s * 4 + n] = t[n * 4 + s];
  return e;
}
function jc(t) {
  const [e, n, s, i, o, r, a, l, c, h, u, f, d, g, p, m] = t, y = e * r - n * o, b = e * a - s * o, w = e * l - i * o, M = n * a - s * r, x = n * l - i * r, v = s * l - i * a, A = c * g - h * d, C = c * p - u * d, T = c * m - f * d, H = h * p - u * g, _ = h * m - f * g, O = u * m - f * p, L = y * O - b * _ + w * H + M * T - x * C + v * A;
  if (Math.abs(L) < 1e-12) return null;
  const W = 1 / L;
  return [
    (r * O - a * _ + l * H) * W,
    (s * _ - n * O - i * H) * W,
    (g * v - p * x + m * M) * W,
    (u * x - h * v - f * M) * W,
    (a * T - o * O - l * C) * W,
    (e * O - s * T + i * C) * W,
    (p * w - d * v - m * b) * W,
    (c * v - u * w + f * b) * W,
    (o * _ - r * T + l * A) * W,
    (n * T - e * _ - i * A) * W,
    (d * x - g * w + m * y) * W,
    (h * w - c * x - f * y) * W,
    (r * C - o * H - a * A) * W,
    (e * H - n * C + s * A) * W,
    (g * b - d * M - p * y) * W,
    (c * M - h * b + u * y) * W
  ];
}
function Xc(t, e, n, s) {
  const i = 1 / Math.tan(t * Kc / 2), o = 1 / (n - s);
  return [i / e, 0, 0, 0, 0, i, 0, 0, 0, 0, (s + n) * o, -1, 0, 0, 2 * s * n * o, 0];
}
function qc(t, e, n, s, i, o) {
  const r = 1 / (e - t), a = 1 / (s - n), l = 1 / (o - i);
  return [2 * r, 0, 0, 0, 0, 2 * a, 0, 0, 0, 0, -2 * l, 0, -(e + t) * r, -(s + n) * a, -(o + i) * l, 1];
}
function Uc(t, e, n = [0, 1, 0]) {
  const s = ze(Jn(t, e)), i = ze(Hn(n, s)), o = Hn(s, i);
  return [
    i[0],
    o[0],
    s[0],
    0,
    i[1],
    o[1],
    s[1],
    0,
    i[2],
    o[2],
    s[2],
    0,
    -je(i, t),
    -je(o, t),
    -je(s, t),
    1
  ];
}
function ta(t, e) {
  const n = t[0] * e[0] + t[4] * e[1] + t[8] * e[2] + t[12], s = t[1] * e[0] + t[5] * e[1] + t[9] * e[2] + t[13], i = t[2] * e[0] + t[6] * e[1] + t[10] * e[2] + t[14], o = t[3] * e[0] + t[7] * e[1] + t[11] * e[2] + t[15];
  return o === 1 || o === 0 ? [n, s, i] : [n / o, s / o, i / o];
}
const Wg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  compose: Qr,
  fromQuat: Ge,
  identity: Jr,
  invert: jc,
  lookAt: Uc,
  multiply: Qt,
  orthographic: qc,
  perspective: Xc,
  scaling: xn,
  transformPoint: ta,
  translation: Zr,
  transpose: Yc
}, Symbol.toStringTag, { value: "Module" })), cn = {
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
}, Qi = {
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
function Vc(t) {
  let e = t.trim().toLowerCase();
  e = e.replace(/\.ease(in|out|inout)$/, ".$1");
  const n = /^([a-z]+\d?)(\(.*\))?$/.exec(e);
  return n && n[1] !== "steps" && e !== "none" && e !== "linear" && (e = `${n[1]}.out${n[2] ?? ""}`), e;
}
Tt({ type: "bounce", mode: "in" });
Tt({ type: "bounce", mode: "in-out" });
function Cn(t) {
  const e = ea.get(t.trim().toLowerCase());
  if (e) return e;
  const n = Vc(t), s = /^steps\(\s*(\d+)\s*\)$/.exec(n);
  if (s) {
    const r = { type: "steps", count: Math.max(1, Number.parseInt(s[1], 10)) + 1, position: "none" };
    return { easing: r, fn: Tt(r) };
  }
  const i = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(n);
  if (i) {
    const [, o, r, a] = i, l = (a ?? "").split(",").map((u) => Number.parseFloat(u)).filter((u) => Number.isFinite(u)), c = r === "inout" ? "in-out" : r;
    if (o === "back" && l.length === 0 && n in cn)
      return { easing: { type: "cubic-bezier", points: cn[n] } };
    const h = o === "elastic" ? { type: "elastic", mode: c, ...l[0] !== void 0 && { amplitude: l[0] }, ...l[1] !== void 0 && { period: l[1] } } : o === "bounce" ? { type: "bounce", mode: c } : { type: "back", mode: c, ...l[0] !== void 0 && { overshoot: l[0] } };
    return { easing: h, fn: Tt(h) };
  }
  return n in Qi ? { easing: Qi[n] } : n in cn ? { easing: { type: "cubic-bezier", points: cn[n] } } : { easing: "ease-out" };
}
const ea = /* @__PURE__ */ new Map();
function yi(t, e) {
  return ea.set(
    t.trim().toLowerCase(),
    e.bezier ? { easing: { type: "cubic-bezier", points: e.bezier }, fn: e.fn } : { fn: e.fn, requiresBaking: "custom" }
  ), t;
}
function Ds(t) {
  let e = t >>> 0;
  return () => {
    e = e + 1831565813 >>> 0;
    let n = e;
    return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const na = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function sa(t) {
  return typeof t == "string" && na.test(t);
}
function zc(t = 1) {
  let e = Ds(t);
  const n = (l, c) => ((...h) => h.length >= l ? c(...h) : (u) => c(...h, u)), s = (l, c, h) => Math.min(Math.max(h, Math.min(l, c)), Math.max(l, c)), i = (l, c, h, u, f) => c === l ? h : h + (f - l) / (c - l) * (u - h), o = (l, c) => {
    if (typeof l == "number") return l === 0 ? c : Math.round(c / l) * l;
    if (Array.isArray(l)) return to(l, c, 1 / 0);
    if ("values" in l) return to(l.values, c, l.radius ?? 1 / 0);
    const h = Math.round(c / l.increment) * l.increment;
    return Math.abs(h - c) <= (l.radius ?? 1 / 0) ? h : c;
  }, r = (l, c, h) => {
    const u = l + e() * (c - l);
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
          u[f] = In(l[f])(l[f], c[f], h);
        return u;
      }
      return In(l)(l, c, h);
    }),
    wrap: ((l, c, h) => {
      if (Array.isArray(l)) {
        const p = l, m = (y) => p[(Math.round(y) % p.length + p.length) % p.length];
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
    snap: n(2, o),
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
      const m = p.length, b = ui(d, m, { ...c !== void 0 ? { amount: c } : { each: h ?? 1 }, from: u }), w = c !== void 0 ? c : (h ?? 1) * Ar(m, u), M = f && w > 0 ? f(b / w) * w : b;
      return l + M;
    },
    pipe: (...l) => (c) => l.reduce((h, u) => u(h), c),
    splitColor: (l) => Gc(l),
    getUnit: (l) => typeof l == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(l.trim())?.[1] ?? "",
    seed: (l) => {
      e = Ds(l);
    },
    resolveRandomString: (l) => {
      const c = na.exec(l)?.[1] ?? "";
      if (c.startsWith("[")) {
        const g = c.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean).map((p) => Number.isFinite(Number(p)) ? Number(p) : p.replace(/^['"]|['"]$/g, ""));
        return g[Math.floor(e() * g.length)];
      }
      const [h, u, f] = c.split(",").map((d) => Number.parseFloat(d));
      return r(h, u, Number.isFinite(f) ? f : void 0);
    }
  };
}
function to(t, e, n) {
  let s = e, i = 1 / 0;
  for (const o of t) {
    const r = Math.abs(o - e);
    r < i && (i = r, s = o);
  }
  return i <= n ? s : e;
}
function Gc(t) {
  const e = t.trim(), n = /^#([0-9a-f]{3,8})$/i.exec(e)?.[1];
  if (n) {
    const o = (n.length <= 4 ? [...n].map((r) => r + r).join("") : n).match(/../g).map((r) => Number.parseInt(r, 16));
    return o.length >= 4 ? [o[0], o[1], o[2], Math.round(o[3] / 255 * 1e3) / 1e3] : [o[0], o[1], o[2]];
  }
  const s = (/rgba?\(([^)]+)\)/i.exec(e)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((i) => Number.parseFloat(i));
  return s.length >= 4 ? [s[0], s[1], s[2], s[3]] : [s[0] ?? 0, s[1] ?? 0, s[2] ?? 0];
}
const Jc = /^([+-])=\s*(-?[\d.]+)$/, Zc = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function _e(t, e) {
  const n = e.scale ?? 1, s = (c) => Number.parseFloat(c) * n;
  if (t === void 0) return e.cursor;
  if (typeof t == "number") return t * n;
  const i = t.trim();
  if (i === "") return e.cursor;
  const o = Jc.exec(i);
  if (o) {
    const c = s(o[2]);
    return e.cursor + (o[1] === "-" ? -c : c);
  }
  const r = Zc.exec(i);
  if (r) {
    const c = r[1] === "<" ? e.previousStart : e.previousEnd;
    if (r[3] === void 0) return c;
    const h = s(r[3]);
    return c + (r[2] === "-" ? -h : h);
  }
  const a = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(i);
  if (a) {
    const c = e.labels.get(a[1].trim());
    if (c !== void 0) {
      const h = s(a[3]);
      return c + (a[2] === "-" ? -h : h);
    }
  }
  const l = e.labels.get(i);
  return l !== void 0 ? l : /^-?[\d.]+$/.test(i) ? s(i) : e.cursor;
}
function Qc(t) {
  if (typeof t != "object" || t === null) return !1;
  const e = t;
  return e.grid !== void 0 || e.from === "random" || Array.isArray(e.from) || e.ease !== void 0 || e.axis !== void 0;
}
function th(t, e, n = {}) {
  if (t === 0) return [];
  const s = e.grid === "auto" ? Math.max(1, Math.min(t, n.columnsFromLayout?.() ?? t)) : Array.isArray(e.grid) ? Math.max(1, e.grid[1]) : t, i = Array.isArray(e.grid) ? Math.max(1, e.grid[0]) : Math.ceil(t / s), o = (g) => ({ x: g % s, y: Math.floor(g / s) }), r = e.from ?? "start", a = Array.isArray(r) ? { x: r[0] * (s - 1), y: r[1] * (i - 1) } : typeof r == "number" ? o(Math.max(0, Math.min(t - 1, r))) : r === "end" ? o(t - 1) : r === "center" || r === "edges" ? { x: (s - 1) / 2, y: (i - 1) / 2 } : { x: 0, y: 0 }, l = (g) => {
    const { x: p, y: m } = o(g), y = Math.abs(p - a.x), b = Math.abs(m - a.y);
    return e.axis === "x" ? y : e.axis === "y" ? b : Math.hypot(y, b);
  };
  let c = Array.from({ length: t }, (g, p) => l(p));
  const h = Math.max(...c);
  if (r === "edges" && (c = c.map((g) => h - g)), r === "random") {
    const g = n.random ?? Math.random;
    c = c.map(() => g() * h);
  }
  const u = e.amount !== void 0 ? e.amount : (e.each ?? 0) * h, f = e.ease ? Cn(e.ease) : void 0, d = f ? f.fn ?? Tt(f.easing) : void 0;
  return c.map((g) => {
    const p = h === 0 ? 0 : g / h;
    return (d ? d(p) : p) * u;
  });
}
const bi = /* @__PURE__ */ new Set([
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
]), eh = {
  rotation: "rotate",
  rotationZ: "rotate",
  rotationX: "rotateX",
  rotationY: "rotateY",
  transformPerspective: "perspective",
  perspective: "childPerspective"
};
function Mn(t) {
  const e = {}, n = {};
  for (const [s, i] of Object.entries(t))
    bi.has(s) ? e[s] = i : n[eh[s] ?? s] = i;
  return { config: e, properties: n };
}
function On(t, e) {
  return t === void 0 ? e : t * 1e3;
}
function Ns(t, e) {
  if (t !== void 0)
    return typeof t == "number" ? { each: t * 1e3 } : Qc(t) ? { offsets: th(e?.count ?? 0, t, e ?? {}).map((s) => s * 1e3) } : {
      ...t.each !== void 0 && { each: t.each * 1e3 },
      ...t.amount !== void 0 && { amount: t.amount * 1e3 },
      ...t.from !== void 0 && { from: t.from }
    };
}
const nh = {
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
function ia(t) {
  return nh[t];
}
function sh(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : t;
  if (!e || typeof e.path != "string" && !Array.isArray(e.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(e.path))
    n = Fc(e.path, { curviness: e.curviness });
  else if (on(e.path))
    n = e.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${e.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const s = { pathData: n };
  return e.autoRotate !== void 0 && e.autoRotate !== !1 && (s.autoRotate = !0, typeof e.autoRotate == "number" && (s.rotateOffset = e.autoRotate)), e.matrix && (s.matrix = e.matrix), { config: s, start: e.start ?? 0, end: e.end ?? 1 };
}
function ih(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : { ...t };
  return { ...e, start: e.end ?? 1, end: e.start ?? 0 };
}
function oa(t) {
  return typeof t == "object" && t !== null && "shape" in t ? t.shape : t;
}
function oh(t) {
  if (t.morphSVG === void 0) return t;
  const { morphSVG: e, ...n } = t, s = oa(e);
  if (typeof s != "string" || !on(s))
    throw new Error(
      `gsap-compat: morphSVG "${String(s)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: s };
}
function rh(t, e) {
  if (t === !0) return [0, e];
  if (t === !1) return [0, 0];
  if (typeof t == "number") return [0, eo(t, e)];
  const n = t.trim().split(/[\s,]+/).filter(Boolean), s = (r) => {
    const a = Number.parseFloat(r);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${t}" is not a length or percentage`);
    return eo(r.endsWith("%") ? e * a / 100 : a, e);
  };
  if (n.length === 0) return [0, e];
  if (n.length === 1) return [0, s(n[0])];
  const i = s(n[0]), o = s(n[1]);
  return i <= o ? [i, o] : [o, i];
}
function ah(t, e) {
  const [n, s] = rh(t, e);
  return { strokeDasharray: [s - n, e], strokeDashoffset: -n };
}
function lh(t, e) {
  if (t.drawSVG === void 0) return t;
  const { drawSVG: n, ...s } = t;
  return { ...s, ...ah(n, e) };
}
function ch(t) {
  if (t.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return t;
}
function eo(t, e) {
  return Math.max(0, Math.min(e, t));
}
function hh(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++) e = Math.imul(e ^ t.charCodeAt(n), 16777619);
  return e >>> 0;
}
function uh(t, e, n) {
  if (t.scrambleText !== void 0) {
    const s = t.scrambleText, i = typeof s == "string" ? { text: s } : s;
    if (typeof i?.text != "string")
      throw new Error("gsap-compat: scrambleText needs the text to end on — a string, or { text }.");
    const o = i.revealDelay && n > 0 ? i.revealDelay * 1e3 / n : void 0;
    return {
      to: i.text,
      mode: "scramble",
      ...i.chars !== void 0 && { chars: i.chars },
      ...i.speed !== void 0 && { refreshRate: 20 * i.speed },
      ...o !== void 0 && { revealDelay: Math.min(o, 0.999) },
      ...i.tweenLength !== void 0 && { tweenLength: i.tweenLength },
      ...i.rightToLeft !== void 0 && { rightToLeft: i.rightToLeft },
      seed: i.seed ?? hh(`${e}|${i.text}`)
    };
  }
  if (t.text !== void 0) {
    const s = t.text, i = typeof s == "string" ? { value: s } : s;
    if (typeof i?.value != "string")
      throw new Error("gsap-compat: text needs the text to end on — a string, or { value }.");
    return {
      to: i.value,
      mode: "type",
      ...i.rightToLeft !== void 0 && { rightToLeft: i.rightToLeft }
    };
  }
}
function wi(t) {
  return Math.max(0.1, t / 25);
}
function fh(t, e) {
  const n = typeof e == "number" ? { velocity: e } : e;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const s = n.friction ?? (n.resistance !== void 0 ? wi(n.resistance) : void 0), i = {
    from: t,
    velocity: n.velocity,
    ...s !== void 0 && { friction: s },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? i.end = [n.end(_n(i))] : n.end !== void 0 && (i.end = Array.isArray(n.end) ? [...n.end] : n.end), i;
}
function dh(t) {
  const e = t === !0 ? {} : typeof t == "string" ? { preset: t } : t;
  if (e.preset !== void 0 && !(e.preset in ns))
    throw new Error(
      `gsap-compat: unknown spring preset "${e.preset}" — use one of ${Object.keys(ns).join(", ")}`
    );
  return {
    ...e.preset ? ns[e.preset] : {},
    ...e.stiffness !== void 0 && { stiffness: e.stiffness },
    ...e.damping !== void 0 && { damping: e.damping },
    ...e.mass !== void 0 && { mass: e.mass },
    ...e.restDelta !== void 0 && { restDelta: e.restDelta }
  };
}
function ph(t, e) {
  if (t === !0 || typeof t == "string") return;
  const n = t.velocity;
  return typeof n == "number" ? n : n?.[e];
}
class ke {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = Ds(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(e = {}) {
    this.options = e, this.timeline = new Ae({
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
    return this.build(e, void 0, Ie(n), s);
  }
  /** Animate from the given values to where the property already is. */
  from(e, n, s) {
    const { config: i, properties: o } = Mn(Ie(n)), { motionPath: r, text: a, scrambleText: l, ...c } = o, h = this.targetsOf(e)[0], u = { ...i };
    for (const g of Object.keys(c))
      u[g] = this.resolveStart(h, g);
    r !== void 0 && (u.motionPath = ih(r));
    const f = {}, d = String(this.resolveStart(h, "text"));
    return a !== void 0 && (f.text = hs(a), u.text = typeof a == "object" ? { ...a, value: d } : d), l !== void 0 && (f.text = hs(l), u.scrambleText = typeof l == "object" ? { ...l, text: d } : d), this.build(e, { ...c, ...f }, u, s);
  }
  /** Animate between two explicit sets of values. */
  fromTo(e, n, s, i) {
    const { properties: o } = Mn(Ie(n));
    return this.build(e, o, Ie(s), i);
  }
  /** Set values instantly — a single held keyframe. */
  set(e, n, s) {
    return this.build(e, void 0, { ...Ie(n), duration: 0 }, s);
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
    const n = Math.max(0, _e(e, this.context()));
    return this.previousStart = n, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), n;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(e) {
    return _e(e, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(e, n) {
    return this.labels.set(e, _e(n, this.context())), this;
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
    const s = _e(n, this.context());
    for (const o of e.timeline.tracks) {
      if (!("keyframes" in o)) continue;
      const r = Ws({
        ...o,
        id: this.nextTrackId(`nested-${o.id}`),
        keyframes: o.keyframes.map((a) => ({ ...a, time: a.time + s }))
      });
      this.timeline.addTrack(r);
    }
    const i = s + e.timeline.duration;
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
  build(e, n, s, i) {
    const { config: o, properties: r } = Mn(s), { motionPath: a, text: l, scrambleText: c, inertia: h, ...u } = r, f = this.targetsOf(e), d = _e(i, this.context()), g = On(o.delay, 0), p = On(o.duration, 500), m = Ns(o.stagger, {
      count: f.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(f) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), y = this.easingFor(o.ease), b = [], w = o.spring;
    let M = 0, x = !1;
    for (const [_, O] of Object.entries(u)) {
      const L = O;
      let W = n?.[_] !== void 0 ? n[_] : this.resolveStart(f[0], _);
      if (typeof W != typeof L && (this.warn(
        `no usable start value for "${_}" on "${f[0]}" — it will snap to ${String(L)}. Use fromTo() to animate it.`
      ), W = L), w !== void 0 && (typeof W != "number" || typeof L != "number") && this.warn(`spring works on numbers, so "${_}" on "${f[0]}" eases instead`), w !== void 0 && typeof W == "number" && typeof L == "number") {
        const P = {
          ...dh(w),
          from: W,
          to: L,
          velocity: ph(w, _) ?? this.options.startVelocity?.(f[0], _) ?? 0
        }, R = this.nextTrackId(`${f[0]}-${_}-spring`), D = {
          id: R,
          target: f[0],
          ...f.length > 1 && { targets: f },
          ...m && f.length > 1 && { stagger: m },
          property: _,
          kind: "spring",
          spring: P,
          delay: d + g
        };
        this.timeline.addTrack(D), b.push(R), M = Math.max(M, gl(P));
        for (const Y of f) this.lastValues.set(`${Y}|${_}`, L);
        continue;
      }
      x = !0;
      const j = this.keyframesFor(W, L, p, y, o.ease), U = this.nextTrackId(`${f[0]}-${_}`);
      this.timeline.addTrack(
        Ws({
          id: U,
          target: f[0],
          ...f.length > 1 && { targets: f },
          ...m && f.length > 1 && { stagger: m },
          property: _,
          delay: d + g,
          keyframes: j,
          // A quaternion is a rotation: it turns the short way round (see Track.interpolation).
          ..._ === "quaternion" && { interpolation: "slerp" }
        })
      ), b.push(U);
      for (const P of f) this.lastValues.set(`${P}|${_}`, L);
    }
    const v = uh({ text: l, scrambleText: c }, f[0], p);
    if (v) {
      const _ = n?.text ?? n?.scrambleText, O = _ !== void 0 ? hs(_) : this.resolveStart(f[0], "text"), L = this.nextTrackId(`${f[0]}-text`), W = {
        id: L,
        target: f[0],
        ...f.length > 1 && { targets: f },
        ...m && f.length > 1 && { stagger: m },
        property: "text",
        textConfig: { from: typeof O == "string" ? O : String(O ?? ""), ...v },
        delay: d + g,
        keyframes: this.keyframesFor(0, 1, p, y, o.ease)
      };
      this.timeline.addTrack(W), b.push(L);
      for (const j of f) this.lastValues.set(`${j}|text`, v.to);
    }
    if (a !== void 0) {
      const { config: _, start: O, end: L } = sh(a), W = this.nextTrackId(`${f[0]}-motionPath`), j = {
        id: W,
        target: f[0],
        ...f.length > 1 && { targets: f },
        ...m && f.length > 1 && { stagger: m },
        property: "motionPath",
        motionPathConfig: _,
        delay: d + g,
        keyframes: this.keyframesFor(O, L, p, y, o.ease)
      };
      this.timeline.addTrack(j), b.push(W);
    }
    if (h !== void 0)
      for (const [_, O] of Object.entries(h)) {
        const L = this.resolveStart(f[0], _);
        if (typeof L != "number") {
          this.warn(`inertia on "${_}" needs a numeric start value; skipped`);
          continue;
        }
        const W = fh(L, O), j = this.nextTrackId(`${f[0]}-${_}-inertia`), U = {
          id: j,
          target: f[0],
          ...f.length > 1 && { targets: f },
          ...m && f.length > 1 && { stagger: m },
          property: _,
          kind: "inertia",
          inertia: W,
          delay: d + g
        };
        this.timeline.addTrack(U), b.push(j), M = Math.max(M, sn(W));
        for (const P of f) this.lastValues.set(`${P}|${_}`, nn(W));
      }
    const T = ((h !== void 0 || w !== void 0) && !x && !v && a === void 0 ? M : Math.max(p, M)) + (m && f.length > 1 ? qn(f.length, m) : 0), H = d + g + T;
    return this.previousStart = d + g, this.previousEnd = H, this.cursor = Math.max(this.cursor, H), {
      trackIds: b,
      start: d + g,
      end: H,
      kill: () => {
        for (const _ of b) this.timeline.removeTrack(_);
      }
    };
  }
  /**
   * Two keyframes, or a baked sequence when the ease has no closed form.
   */
  keyframesFor(e, n, s, i, o) {
    const r = { time: 0, value: e };
    if (s <= 0)
      return [{ time: 0, value: n }];
    const a = typeof o == "string" ? Cn(o) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && $n(i)) {
      const c = a?.fn ?? Tt(i);
      return [r, ...Dr(r, { time: s, value: n }, c, { intervalMs: this.options.bakeIntervalMs })];
    }
    return [r, { time: s, value: n, ...i && { easing: i } }];
  }
  /** Resolve a start value through the documented chain. */
  resolveStart(e, n) {
    const s = this.lastValues.get(`${e}|${n}`);
    if (s !== void 0) return s;
    const i = this.options.startValue?.(e, n);
    if (i !== void 0) return i;
    const o = this.options.defaults?.[n];
    if (o !== void 0) return o;
    if (n === "text") return "";
    if (n === "quaternion") return [0, 0, 0, 1];
    if (n === "d")
      throw new Error(
        `gsap-compat: no starting shape for "${e}". Use fromTo({ d: … }, { morphSVG: … }), or live.to(), which reads the element's current shape.`
      );
    const r = ia(n);
    return r !== void 0 ? (this.warn(
      `no start value for "${n}" on "${e}" — using the static default ${r}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), r) : (this.warn(`no start value or default for "${n}" on "${e}" — using 0`), 0);
  }
  easingFor(e) {
    if (e !== void 0) {
      if (typeof e == "string") return Cn(e).easing;
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
function hs(t) {
  if (typeof t == "string") return t;
  if (t && typeof t == "object") {
    const e = t;
    return String(e.value ?? e.text ?? "");
  }
  return String(t ?? "");
}
function gh(t) {
  return new ke(t);
}
function Ie(t) {
  return ch(oh(t));
}
function mh(t) {
  return !Array.isArray(t) || t.length !== 4 ? null : `matrix3d(${Ge(Vt(t)).map((n) => Math.round(n * 1e6) / 1e6 + 0).join(", ")})`;
}
const yh = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), bh = "#ffffff", wh = "rgba(0, 0, 0, 0.5)";
function kh(t) {
  const e = [];
  if (t.blur !== void 0 && e.push(`blur(${Math.max(0, t.blur)}px)`), t.brightness !== void 0 && e.push(`brightness(${Math.max(0, t.brightness)})`), t.glow !== void 0 && e.push(`drop-shadow(0 0 ${Math.max(0, t.glow)}px ${t.glowColor ?? bh})`), t.shadowX !== void 0 || t.shadowY !== void 0 || t.shadowBlur !== void 0) {
    const n = t.shadowX ?? 0, s = t.shadowY ?? 0, i = Math.max(0, t.shadowBlur ?? 0);
    e.push(`drop-shadow(${n}px ${s}px ${i}px ${t.shadowColor ?? wh})`);
  }
  return e.length > 0 ? e.join(" ") : null;
}
function vh(t, e) {
  const n = t.childNodes.length === 1 ? t.firstChild : null;
  if (n && n.nodeType === 3) {
    const s = n;
    s.data !== e && (s.data = e);
    return;
  }
  t.textContent !== e && (t.textContent = e);
}
function Sh(t) {
  if (!("ownerSVGElement" in t)) return;
  const e = t.style;
  !e || e.transformBox || (e.transformBox = "fill-box", e.transformOrigin || (e.transformOrigin = "50% 50%"));
}
const no = /* @__PURE__ */ new Set([
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
]), xh = /* @__PURE__ */ new Set([
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
]), Mh = [
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
], Th = /* @__PURE__ */ new Set(["childPerspective", "perspectiveOriginX", "perspectiveOriginY"]), Eh = /* @__PURE__ */ new Set(["originX", "originY"]), Ah = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), Ph = /* @__PURE__ */ new Set(["drawOn"]), $h = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, so = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, _h = "http://www.w3.org/2000/svg";
class ie {
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
      const i = this.targets.get(n);
      i && this.applyProperties(i, s);
    }
  }
  /**
   * Apply properties to a single element.
   */
  applyProperties(e, n) {
    let s = null, i = null, o = null, r = null, a = null;
    const l = n.has("motionPathX"), c = n.has("motionPathY"), h = n.has("motionPathRotate");
    for (const [g, p] of n)
      if (!(g === "x" && l) && !(g === "y" && c) && !((g === "rotate" || g === "rotateZ") && h) && !Ph.has(g)) {
        if (xh.has(g))
          (s ??= {})[g] = p;
        else if (Th.has(g))
          typeof p == "number" && ((i ??= {})[g] = p);
        else if (Eh.has(g))
          typeof p == "number" && ((o ??= {})[g] = p);
        else if (Ah.has(g))
          typeof p == "number" && ((r ??= {})[g] = p);
        else if (yh.has(g))
          (a ??= {})[g] = p;
        else if (g !== "perspective") {
          if (g !== "shine") if (g === "text" && typeof p == "string")
            vh(e, p);
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
      for (const g of Mh) {
        const p = s[g];
        if (p === void 0) continue;
        const m = this.buildTransformPart(g, p);
        m && f.push(m);
      }
    if (f.length > 0 && (e.style.transform = f.join(" "), Sh(e)), i && (i.childPerspective !== void 0 && (e.style.perspective = `${i.childPerspective}px`), (i.perspectiveOriginX !== void 0 || i.perspectiveOriginY !== void 0) && (e.style.perspectiveOrigin = `${i.perspectiveOriginX ?? 50}% ${i.perspectiveOriginY ?? 50}%`)), o) {
      const g = o.originX ?? 50, p = o.originY ?? 50;
      e.style.transformOrigin = `${g}% ${p}%`;
    }
    if (r) {
      const g = r.clipTop ?? 0, p = r.clipRight ?? 0, m = r.clipBottom ?? 0, y = r.clipLeft ?? 0;
      e.style.clipPath = `inset(${g}% ${p}% ${m}% ${y}%)`;
    }
    if (a) {
      const g = kh(a);
      g && (e.style.filter = g);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(e, n) {
    if (e === "quaternion") return mh(n);
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
    const s = e.dataset.shineBase, i = -20 + n * 140, o = e.style;
    o.color = "transparent", o.backgroundImage = `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.9) 50%, transparent 60%), linear-gradient(${s}, ${s})`, o.backgroundSize = "250% 100%, 100% 100%", o.backgroundPosition = `${i}% 0, 0 0`, o.backgroundRepeat = "no-repeat", o.webkitBackgroundClip = "text", o.backgroundClip = "text";
  }
  /**
   * Apply a single style property to an element.
   */
  applyStyleProperty(e, n, s) {
    let i;
    if (e.namespaceURI === _h && n in so) {
      const a = Array.isArray(s) ? s.join(", ") : String(s);
      e.style[so[n]] = a;
      return;
    } else n === "fill" && e.dataset?.elementType === "text" ? i = "color" : i = $h[n] ?? n;
    let r;
    typeof s == "number" ? no.has(n) || no.has(i) ? r = `${s}px` : r = String(s) : Array.isArray(s) ? r = s.join(", ") : r = s, e.style[i] = r;
  }
}
const Ih = {
  request: (t) => requestAnimationFrame(t),
  cancel: (t) => cancelAnimationFrame(t)
};
class Hh {
  adapter = new ie();
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
  utils = zc();
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
    this.scheduler = e.scheduler ?? Ih, this.rootOption = e.root, this.onWarning = e.onWarning;
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
      const i = this.nameFor(s);
      us(s) && this.currentCollector?.touch(s, i), n.push(i);
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
    for (const i of [...this.active.keys()].reverse()) {
      if (i.getTracks({ target: e, property: n }).length === 0) continue;
      const o = i.currentTime;
      if (o < 4) return 0;
      const r = i.getStateAtTime(o).values.get(e)?.get(n), a = i.getStateAtTime(o - 4).values.get(e)?.get(n);
      if (typeof r != "number" || typeof a != "number") return;
      const l = (r - a) / 4;
      return (i.direction === "reverse" ? -l : l) * 1e3;
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
    for (const [s, i] of n)
      i.onUpdate?.(), s.playbackState !== "playing" && this.active.get(s) === i && this.active.delete(s);
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
      let i = this.applied.get(n);
      i || (i = /* @__PURE__ */ new Map(), this.applied.set(n, i));
      for (const [o, r] of s) i.set(o, r);
      this.dirty.add(n);
    }
  }
  flush() {
    if (this.dirty.size === 0) return;
    const e = /* @__PURE__ */ new Map();
    for (const n of this.dirty) {
      const s = this.applied.get(n), i = this.objects.get(n);
      if (i)
        for (const [o, r] of s) i[o] = r;
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
    if (us(e)) return [e];
    if (!Ch(e)) return [e];
    const n = [];
    for (const s of Array.from(e))
      n.push(...this.targetsOf(s));
    return n;
  }
  nameFor(e) {
    return us(e) ? this.elementName(e) : this.objectName(e);
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
function us(t) {
  return typeof t == "object" && t !== null && t.nodeType === 1;
}
function Ch(t) {
  if (Array.isArray(t)) return !0;
  const e = t;
  return typeof e.length == "number" && typeof e.item == "function";
}
function Rn(t) {
  const e = t.style;
  if (!e) return t.getBoundingClientRect();
  const n = e.transform;
  e.transform = "none";
  const s = t.getBoundingClientRect();
  return e.transform = n, s;
}
const io = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function Oh(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function Rh(t) {
  const e = t.getScreenCTM?.();
  if (e) return [e.a, e.b, e.c, e.d, e.e, e.f];
  const n = t.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function Lh(t, e) {
  const n = typeof t == "string" || Array.isArray(t) || io(t) ? { path: t } : t, { align: s, alignOrigin: i, path: o, ...r } = n, a = (v) => {
    const A = io(v) ? v : e.query(v);
    return A || e.warn(`gsap-compat: motionPath could not find "${String(v)}"`), A;
  };
  let l = null, c = "";
  if (Array.isArray(o) || typeof o == "string" && on(o))
    c = o;
  else {
    l = a(o);
    const v = l && gi({ tag: l.localName, attributes: Oh(l) });
    l && !v && e.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), c = v ?? "";
  }
  const h = { ...r, path: c };
  if (s === void 0 || s === !1) return h;
  const u = s === !0 ? l : a(s);
  if (!u)
    return s === !0 && e.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const f = e.targets[0];
  if (!f) return h;
  const [d, g, p, m, y, b] = Rh(u), w = Rn(f), [M, x] = i ?? [0.5, 0.5];
  for (const v of e.targets.slice(1)) {
    const A = Rn(v);
    if (Math.abs(A.left - w.left) > 0.5 || Math.abs(A.top - w.top) > 0.5) {
      e.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [d, g, p, m, y - w.left - M * w.width, b - w.top - x * w.height], h;
}
const ra = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function aa(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function la(t) {
  if (!t) return null;
  const e = gi({ tag: t.localName, attributes: aa(t) });
  return e || (t.querySelector("path")?.getAttribute("d") ?? null);
}
function Fh(t, e, n) {
  const s = oa(t);
  if (typeof s == "string" && on(s)) return s;
  const i = ra(s) ? s : typeof s == "string" ? e(s) : null, o = la(i);
  return o || (n(`gsap-compat: morphSVG could not find a shape for "${String(s)}"`), "");
}
const Wh = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function Bh(t, e = document) {
  return (typeof t == "string" ? Array.from(e.querySelectorAll(t)) : ra(t) ? [t] : Array.from(t)).map((s) => {
    if (s.localName === "path") return s;
    const i = gi({ tag: s.localName, attributes: aa(s) });
    if (!i || !s.parentNode) return s;
    const o = s.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const r of Array.from(s.attributes))
      Wh.has(r.name) || o.setAttribute(r.name, r.value);
    return o.setAttribute("d", i), s.parentNode.replaceChild(o, s), o;
  });
}
const oo = 0.3;
class Dh {
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
    this.dragging = !0, this.passedTolerance = !1, this.startX = e, this.startY = n, this.lastX = e, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = ro(), this.options.onPress?.(this.stateFrom(0, 0, s));
  }
  move(e, n, s) {
    if (!this.dragging) return;
    const i = e - this.lastX, o = n - this.lastY;
    this.lastX = e, this.lastY = n;
    const r = e - this.startX, a = n - this.startY, l = this.options.tolerance ?? 3;
    if (!this.passedTolerance) {
      if (Math.hypot(r, a) < l) return;
      this.passedTolerance = !0;
    }
    this.updateVelocity(i, o), this.options.preventDefault !== !1 && s.cancelable && s.preventDefault(), this.options.onMove?.(this.stateFrom(i, o, s));
  }
  end(e) {
    this.dragging && (this.dragging = !1, this.options.onRelease?.(this.stateFrom(0, 0, e)));
  }
  updateVelocity(e, n) {
    const s = ro(), i = Math.max(1, s - this.lastTime);
    this.lastTime = s;
    const o = e / i * 1e3, r = n / i * 1e3;
    this.velocityX += (o - this.velocityX) * oo, this.velocityY += (r - this.velocityY) * oo;
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
function ro() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function Nh(t, e, n) {
  let s = { delta: 0, line: null }, i = n;
  for (const o of t)
    for (const r of e) {
      const a = Math.abs(r - o);
      a <= i && (i = a, s = { delta: r - o, line: r });
    }
  return s;
}
function Kh(t, e) {
  return e <= 0 ? [] : t.map((n) => Math.round(n / e) * e);
}
class ca {
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
    this.options = e, this.x = e.initialX ?? 0, this.y = e.initialY ?? 0, this.observer = new Dh({
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
    const i = (this.options.axis ?? "both") === "y" ? this.y : this.x, o = Yh(i / s);
    e.pause(), e.seek(o * n);
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
    const i = [
      ...Kh([s], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], o = Nh([s], i, this.snapThreshold());
    s += o.delta, n === "x" ? this.snappedX = o.line : this.snappedY = o.line;
    const r = this.options.bounds;
    if (r) {
      const a = n === "x" ? r.minX : r.minY, l = n === "x" ? r.maxX : r.maxY;
      a !== void 0 && (s = Math.max(a, s)), l !== void 0 && (s = Math.min(l, s));
    }
    return s;
  }
}
function Yh(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
function Bg(t) {
  const e = new ca(t);
  return e.start(), e;
}
const jh = { x: "x", y: "y", "x,y": "both" }, Ks = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function ao(t, e) {
  const n = Rn(t), s = e.getBoundingClientRect();
  return {
    minX: s.left - n.left,
    maxX: s.right - n.right,
    minY: s.top - n.top,
    maxY: s.bottom - n.bottom
  };
}
function lo(t) {
  return Array.isArray(t) ? [...t] : t;
}
function Xh(t, e, n, s = {}) {
  const [i] = e.resolveTargets(n), o = i ? e.elementFor(i) : void 0;
  if (!i || !o)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  if (s.type === "rotation") return qh(t, e, i, o, s);
  const r = jh[s.type ?? "x,y"], a = () => {
    const p = e.appliedValue(i, "x"), m = e.appliedValue(i, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof m == "number" ? m : 0 };
  }, l = typeof s.bounds == "string" ? e.query(s.bounds) : Ks(s.bounds) ? s.bounds : null, h = { bounds: (!l && s.bounds && !Ks(s.bounds) ? s.bounds : void 0) ?? (l ? ao(o, l) : void 0) };
  let u = null;
  const f = () => {
    u?.kill(), u = null;
  }, d = (p) => {
    const m = s.inertia === !0 ? {} : s.inertia, y = m.friction ?? (m.resistance !== void 0 ? wi(m.resistance) : 4), b = a(), w = h.bounds ?? {};
    let M, x;
    const v = m.end;
    if (Array.isArray(v)) {
      const C = _n({ from: b.x, velocity: r === "y" ? 0 : p.x, friction: y }), T = _n({ from: b.y, velocity: r === "x" ? 0 : p.y, friction: y });
      let H = v[0];
      for (const _ of v)
        Math.hypot(_.x - C, _.y - T) < Math.hypot(H.x - C, H.y - T) && (H = _);
      H && (M = [H.x], x = [H.y]);
    } else typeof v == "number" ? (M = v, x = v) : v && (M = lo(v.x), x = lo(v.y));
    const A = {};
    r !== "y" && (A.x = { velocity: p.x, friction: y, min: w.minX, max: w.maxX, end: M }), r !== "x" && (A.y = { velocity: p.y, friction: y, min: w.minY, max: w.maxY, end: x }), u = t.to(o, { inertia: A, onComplete: () => s.onThrowComplete?.() });
  }, g = new ca({
    target: o,
    axis: r,
    snap: s.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: a,
    onPress: () => {
      f(), l && (h.bounds = ao(o, l)), s.onPress?.();
    },
    onDrag: (p) => {
      e.apply(i, r === "x" ? { x: p.x } : r === "y" ? { y: p.y } : { x: p.x, y: p.y }), s.onDrag?.(p);
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
      const p = e.appliedValue(i, "rotate");
      return typeof p == "number" ? p : 0;
    },
    destroy() {
      f(), g.destroy();
    }
  };
}
function qh(t, e, n, s, i) {
  const o = typeof i.bounds == "object" && i.bounds !== null && !Ks(i.bounds) ? i.bounds : {}, r = () => {
    const w = e.appliedValue(n, "rotate");
    return typeof w == "number" ? w : 0;
  }, a = (w) => Math.min(o.maxRotation ?? 1 / 0, Math.max(o.minRotation ?? -1 / 0, w));
  let l = null, c = !1, h, u = { x: 0, y: 0 }, f = 0, d = 0, g = [];
  const p = (w) => Math.atan2(w.clientY - u.y, w.clientX - u.x) * 180 / Math.PI, m = (w) => {
    if (c) return;
    l?.kill(), l = null, c = !0, h = w.pointerId, s.setPointerCapture?.(w.pointerId);
    const M = s.getBoundingClientRect();
    u = { x: M.left + M.width / 2, y: M.top + M.height / 2 }, f = p(w), d = r(), g = [{ time: performance.now(), rotation: d }], i.onPress?.();
  }, y = (w) => {
    if (!c || w.pointerId !== h) return;
    const M = p(w);
    let x = M - f;
    x > 180 && (x -= 360), x < -180 && (x += 360), f = M, d += x;
    let v = a(d);
    i.snap && (v = a(Math.round(v / i.snap) * i.snap)), e.apply(n, { rotate: v });
    const A = performance.now();
    for (g.push({ time: A, rotation: v }); g.length > 2 && A - g[0].time > 100; ) g.shift();
    const C = { x: 0, y: 0 };
    i.onDrag?.(C);
  }, b = (w) => {
    if (!c || w.pointerId !== h) return;
    c = !1;
    const M = g[0], x = g[g.length - 1], v = M && x ? (x.time - M.time) / 1e3 : 0, A = v > 0 ? (x.rotation - M.rotation) / v : 0;
    if (i.onRelease?.({ x: A, y: 0 }), !i.inertia) return;
    const C = i.inertia === !0 ? {} : i.inertia, T = C.friction ?? (C.resistance !== void 0 ? wi(C.resistance) : 4), H = typeof C.end == "number" || Array.isArray(C.end) ? C.end : void 0;
    l = t.to(s, {
      inertia: {
        rotate: {
          velocity: A,
          friction: T,
          min: o.minRotation,
          max: o.maxRotation,
          end: Array.isArray(H) ? H.filter((_) => typeof _ == "number") : H
        }
      },
      onComplete: () => i.onThrowComplete?.()
    });
  };
  return s.addEventListener("pointerdown", m), s.addEventListener("pointermove", y), s.addEventListener("pointerup", b), s.addEventListener("pointercancel", b), s.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return r();
    },
    destroy() {
      l?.kill(), s.removeEventListener("pointerdown", m), s.removeEventListener("pointermove", y), s.removeEventListener("pointerup", b), s.removeEventListener("pointercancel", b);
    }
  };
}
const Uh = { opacity: 0, scale: 0.6 };
function Vh(t) {
  const e = t.getBoundingClientRect();
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function co(t) {
  const e = Rn(t);
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function Ys(t, e) {
  const s = t.resolveTargets(e).map((r) => t.elementFor(r)).filter((r) => !!r), i = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const r of s) {
    const a = Vh(r);
    i.set(r, a);
    const l = ha(r);
    a && l !== void 0 && !o.has(l) && o.set(l, { element: r, box: a });
  }
  return { elements: s, boxes: i, ids: o };
}
const fs = /* @__PURE__ */ new WeakMap();
function js(t, e, n, s = {}) {
  const i = s.duration ?? 0.6, o = s.ease ?? "power2.inOut", r = s.stagger ?? 0, a = s.scale !== !1, l = s.enter === void 0 ? Uh : s.enter, c = new Set(n.elements);
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
    const g = co(d);
    if (!g) continue;
    let p = n.boxes.get(d) ?? null, m;
    const y = ha(d), b = !p && y !== void 0 ? n.ids.get(y) : void 0;
    b && b.element !== d && (p = b.box, m = b.element);
    const [w] = t.resolveTargets(d);
    fs.get(d)?.timeline.removeTracks({ target: w });
    const M = f * r;
    if (!p) {
      if (l === !1) continue;
      u.fromTo(d, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...ua(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: i, ease: o, delay: M }, 0), fs.set(d, u), f++;
      continue;
    }
    const x = p.cx - g.cx, v = p.cy - g.cy, A = a ? p.width / g.width : 1, C = a ? p.height / g.height : 1;
    if (!(Math.abs(x) > 0.5 || Math.abs(v) > 0.5 || Math.abs(A - 1) > 1e-3 || Math.abs(C - 1) > 1e-3)) {
      const _ = (O, L) => {
        const W = t.appliedValue(w, O);
        return typeof W == "number" && Math.abs(W - L) > 1e-6;
      };
      (_("x", 0) || _("y", 0) || _("scaleX", 1) || _("scaleY", 1)) && u.set(d, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const H = s.fade === !0 && m !== void 0;
    u.fromTo(
      d,
      { x, y: v, scaleX: A, scaleY: C, ...H && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...H && { opacity: 1 }, duration: i, ease: o, delay: M },
      0
    ), H && m && co(m) && u.fromTo(m, { opacity: 1 }, { opacity: 0, duration: i, ease: o, delay: M }, 0), fs.set(d, u), f++;
  }
  return u;
}
function ha(t) {
  return t.dataset?.flipId;
}
function ua(t) {
  const e = {};
  for (const n of Object.keys(t))
    e[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return e;
}
function zh(t, e = {}) {
  const n = new Set((e.type ?? "chars,words,lines").split(",").map((p) => p.trim())), s = {
    chars: e.charsClass ?? "char",
    words: e.wordsClass ?? "word",
    lines: e.linesClass ?? "line"
  }, i = e.aria !== !1, o = t.map((p) => ({
    element: p,
    html: p.innerHTML,
    ariaLabel: p.getAttribute("aria-label")
  }));
  let r = { chars: [], words: [], lines: [], masks: [] }, a, l, c = !1;
  const h = () => {
    for (const { element: p, html: m, ariaLabel: y } of o)
      p.innerHTML = m, y === null ? p.removeAttribute("aria-label") : p.setAttribute("aria-label", y);
  }, u = () => {
    a && (a.revert ? a.revert() : a.kill?.(), a = void 0);
  }, f = () => {
    const p = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: m } of o) {
      const y = (m.textContent ?? "").replace(/\s+/g, " ").trim(), b = Gh(m, s.words), w = n.has("chars") ? b.flatMap((v) => Jh(v, s.chars)) : [], M = n.has("lines") ? Qh(m, b, s.lines) : [];
      if (i) {
        !m.hasAttribute("aria-label") && y && m.setAttribute("aria-label", y);
        for (const v of b) v.setAttribute("aria-hidden", "true");
      }
      if (n.has("words")) p.words.push(...b);
      else for (const v of b) v.removeAttribute("class");
      p.chars.push(...w), p.lines.push(...M);
      const x = e.mask === "lines" ? M : e.mask === "words" ? b : e.mask === "chars" ? w : [];
      for (const v of x) p.masks.push(tu(v, `${s[e.mask]}-mask`));
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
    const y = () => {
      if (m) return;
      m = !0;
      const w = () => {
        m = !1, d.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(w) : setTimeout(w, 0);
    };
    if (typeof ResizeObserver == "function") {
      l = new ResizeObserver((w) => {
        let M = !1;
        for (const x of w) {
          const v = Math.round(x.contentRect.width), A = p.get(x.target);
          p.set(x.target, v), A !== void 0 && A !== v && (M = !0);
        }
        M && y();
      });
      for (const w of t) l.observe(w);
    }
    const b = t[0]?.ownerDocument?.fonts;
    b && b.status !== "loaded" && b.ready.then(() => y());
  }
  return d;
}
function Gh(t, e) {
  const n = t.ownerDocument, s = [], i = n.createTreeWalker(
    t,
    4
    /* NodeFilter.SHOW_TEXT */
  ), o = [];
  for (let r = i.nextNode(); r; r = i.nextNode()) o.push(r);
  for (const r of o) {
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
function Jh(t, e) {
  const n = t.ownerDocument, s = Zh(t.textContent ?? "").map((i) => {
    const o = n.createElement("span");
    return o.className = e, o.style.display = "inline-block", o.textContent = i, o;
  });
  return t.replaceChildren(...s), s;
}
function Zh(t) {
  const e = Intl.Segmenter;
  return e ? Array.from(new e(void 0, { granularity: "grapheme" }).segment(t), (n) => n.segment) : Array.from(t);
}
function Qh(t, e, n) {
  const s = t.ownerDocument, i = new Map(e.map((g) => [g, g.getBoundingClientRect()])), o = [], r = (g) => {
    for (const p of Array.from(g.childNodes))
      p.nodeType === 3 || i.has(p) || p.tagName === "BR" ? o.push(p) : r(p);
  };
  r(t);
  const a = [];
  let l = null, c = 0, h = 0, u = !1, f = [];
  const d = () => {
    l = s.createElement("span"), l.className = n, l.style.display = "block", a.push(l), f = [];
  };
  for (const g of o) {
    if (g.tagName === "BR") {
      u = !0;
      continue;
    }
    const p = i.get(g);
    if (p && (!l || u || p.top > c + h) && (d(), c = p.top, h = p.height / 2, u = !1), !l) continue;
    const m = [];
    for (let w = g.parentNode; w && w !== t; w = w.parentNode) m.unshift(w);
    let y = 0;
    for (; y < f.length && y < m.length && f[y].original === m[y]; ) y++;
    f.length = y;
    let b = y === 0 ? l : f[y - 1].clone;
    for (const w of m.slice(y)) {
      const M = w.cloneNode(!1);
      b.appendChild(M), f.push({ original: w, clone: M }), b = M;
    }
    b.appendChild(g);
  }
  return t.replaceChildren(...a), a;
}
function tu(t, e) {
  const n = t.ownerDocument.createElement("span");
  return n.className = e, n.style.display = t.style.display === "block" ? "block" : "inline-block", n.style.overflow = "clip", n.style.paddingBottom = "0.12em", n.style.marginBottom = "-0.12em", t.replaceWith(n), n.appendChild(t), n;
}
const ho = {
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
function uo(t) {
  const e = t.trim().toLowerCase();
  if (e in ho) return ho[e];
  if (e.endsWith("%")) {
    const n = Number.parseFloat(e.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function fa(t) {
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
  const i = s[0] !== void 0 ? uo(s[0]) : void 0, o = s[1] !== void 0 ? uo(s[1]) : void 0;
  return {
    elementFraction: i ?? 0,
    viewportFraction: o ?? 0,
    offsetPx: e
  };
}
function Je(t, e, n) {
  const s = fa(n), i = s.absolutePx !== void 0 ? t.top + s.absolutePx : t.top + t.height * s.elementFraction, o = e * s.viewportFraction;
  return i - o + s.offsetPx;
}
function Dg(t, e, n, s) {
  const i = Je(t, e, n), r = Je(t, e, s) - i;
  return r <= 0 ? i <= 0 ? 1 : 0 : da(-i / r);
}
function da(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t === 0 ? 0 : t;
}
function eu(t, e, n, s) {
  if (n <= 0) return e;
  const i = 1 - Math.exp(-(s / 1e3) / n);
  return t + (e - t) * i;
}
function fo(t, e, n, s, i) {
  const o = (h) => Je({ top: t + i(h), bottom: t + i(h) + e, height: e }, n, s), r = o(0), a = o(1);
  if (Math.sign(r) === Math.sign(a) || r === 0 || a === 0)
    return r === 0 ? 0 : a === 0 ? 1 : Math.abs(r) < Math.abs(a) ? 0 : 1;
  let l = 0, c = 1;
  for (let h = 0; h < 40; h++) {
    const u = (l + c) / 2;
    Math.sign(o(u)) === Math.sign(r) ? l = u : c = u;
  }
  return (l + c) / 2;
}
class nu {
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
function Ng(t) {
  const e = new nu(t);
  return e.start(), e;
}
class su {
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
const iu = 0.15;
function ou(t) {
  return typeof t == "object" && !Array.isArray(t) ? t : { snapTo: t };
}
function ru(t, e, n) {
  const s = hn(t + e * iu);
  if (typeof n == "function") return hn(n(s));
  if (typeof n == "number")
    return n <= 0 ? t : hn(Math.round(s / n) * n);
  if (n.length === 0) return t;
  let i = n[0];
  for (const o of n)
    Math.abs(o - s) < Math.abs(i - s) && (i = o);
  return hn(i);
}
function au(t, e, n) {
  const s = t.duration ?? { min: 0.2, max: 0.8 };
  if (typeof s == "number") return s;
  const i = Math.min(1, Math.abs(e) / Math.max(1, n));
  return s.min + (s.max - s.min) * i;
}
class lu {
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
  animate(e, n, s, i = zn, o) {
    if (this.cancel(), typeof requestAnimationFrame > "u" || s <= 0) {
      this.write(n), o?.();
      return;
    }
    for (const l of this.cancelEvents) this.eventTarget?.addEventListener(l, this.onInterrupt, { passive: !0 });
    let r = null;
    const a = (l) => {
      r ??= l;
      const c = Math.min(1, (l - r) / (s * 1e3));
      this.write(e + (n - e) * i(c)), c < 1 ? this.rafId = requestAnimationFrame(a) : (this.rafId = null, this.detach(), o?.());
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
function hn(t) {
  return Math.max(0, Math.min(1, t));
}
class cu {
  options;
  scroller;
  nodes = [];
  scrollerStart;
  scrollerEnd;
  start;
  end;
  constructor(e, n, s) {
    this.options = s === !0 ? {} : s, this.scroller = n;
    const { startColor: i = "#3ecf7a", endColor: o = "#ff5a5a", id: r } = this.options, a = r ? `${r} ` : "", l = (c, h, u) => {
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
    this.scrollerStart = l("scroller-start", i, !n), this.scrollerEnd = l("scroller-end", o, !n), this.start = l("start", i, !1), this.end = l("end", o, !1), n && getComputedStyle(n).position === "static" && (n.style.position = "relative");
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
const hu = 120, be = [], Te = /* @__PURE__ */ new Set();
let ds = !1;
const uu = () => {
  ds || Te.size === 0 || (ds = !0, queueMicrotask(() => {
    ds = !1;
    for (const t of Te) t.afterRefresh();
  }));
}, pa = () => {
  for (const t of Te) t.beforeRefresh();
  for (const t of be) t.refresh();
  for (const t of Te) t.afterRefresh();
};
let we = { width: 0, height: 0 };
const po = () => {
  const t = window.innerWidth, e = window.innerHeight, n = t === we.width && e !== we.height, s = Math.abs(e - we.height) < we.height * 0.25, i = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  n && s && i || (we = { width: t, height: e }, pa());
};
class Zn {
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
    this.timeline = e.timeline, this.options = e, this.snapper = new lu((n) => this.scrollTo(n), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const e = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    e && !this.options.container && (this.pin = new su(e, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new cu(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), be.length === 0 && typeof window < "u" && (we = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", po, { passive: !0 })), be.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), be.splice(be.indexOf(this), 1), be.length === 0 && typeof window < "u" && window.removeEventListener("resize", po), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    pa();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(e) {
    return Te.add(e), () => Te.delete(e);
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
      if (this.startPx = e + Je(n, s, He(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(n, s, e), this.pin) {
        const i = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(i.top - (this.startPx - e), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(s) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, e), this.lastScroll = null, this.updateFrom(e, !this.measured), this.measured = !0, uu();
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
    const s = this.endPx - this.startPx, i = this.zone;
    this.targetProgress = s > 0 ? da((e - this.startPx) / s) : e >= this.startPx ? 1 : 0, this.zone = s > 0 ? e <= this.startPx ? "before" : e >= this.endPx ? "after" : "active" : e >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(i, this.zone), n || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const e = this.options.scrub;
    return typeof e == "number" ? Math.max(0, e) : 0;
  }
  resolveEnd(e, n, s) {
    const i = He(this.options.end) ?? "bottom top", o = typeof i == "string" ? i.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (o) {
      const r = Number.parseFloat(o[1]);
      return this.startPx + (o[2] === "%" ? n * r / 100 : r);
    }
    return s + Je(e, n, i);
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
    }, hu));
  }
  /**
   * Emit enter/leave callbacks as the scroll position moves between zones. A jump
   * straight across the range (a fast flick, or loading the page scrolled past
   * it) fires both edges in order.
   */
  fireBoundaryCallbacks(e, n) {
    if (e === n) return;
    const { onEnter: s, onLeave: i, onEnterBack: o, onLeaveBack: r } = this.options;
    e === "before" ? (s?.(), n === "after" && i?.()) : e === "after" ? (o?.(), n === "before" && r?.()) : n === "after" ? i?.() : r?.();
  }
  /** Scrolling has stopped: settle on the nearest snap point, if there is one. */
  scheduleSnap() {
    const e = this.options.snap;
    if (e === void 0 || this.snapper.active) return;
    const n = ou(e), s = () => {
      this.snapTimer = null;
      const i = this.endPx - this.startPx, o = this.scrollPosition();
      if (!this.running || i <= 0 || o <= this.startPx || o >= this.endPx) return;
      const r = (o - this.startPx) / i, a = this.startPx + ru(r, this.releaseVelocity / i, n.snapTo) * i;
      Math.abs(a - o) < 1 || this.snapper.animate(o, a, au(n, a - o, this.viewportHeight()), n.ease);
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
    const s = n.getBoundingClientRect(), i = this.options.scroller?.getBoundingClientRect?.().left ?? 0, o = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, r = s.left - i - e.shiftAt(e.progress()), { start: a, end: l } = e.range(), c = (d) => a + d * (l - a), h = fo(r, s.width, o, He(this.options.start) ?? "left right", e.shiftAt);
    this.startPx = c(h);
    const u = He(this.options.end) ?? "right left", f = typeof u == "string" ? u.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = f ? this.startPx + Number.parseFloat(f[1]) : c(fo(r, s.width, o, u, e.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(e) {
    const n = (o, r) => {
      const a = He(o) ?? r;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const l = fa(a);
      return e * l.viewportFraction - l.offsetPx;
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
    const e = (n) => {
      if (this.rafId = null, !this.running) return;
      const s = this.lastFrameTime === null ? 16.67 : n - this.lastFrameTime;
      this.lastFrameTime = n, this.displayProgress = eu(this.displayProgress, this.targetProgress, this.smoothing(), s);
      const i = Math.abs(this.targetProgress - this.displayProgress) < 1e-4;
      i && (this.displayProgress = this.targetProgress), this.applyProgress(), i ? this.lastFrameTime = null : this.rafId = requestAnimationFrame(e);
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
    const n = this.options.horizontal, s = n ? e.left ?? 0 : e.top, i = n ? e.right ?? 0 : e.bottom, o = n ? e.width ?? 0 : e.height, r = this.options.scroller;
    if (r && typeof r.getBoundingClientRect == "function") {
      const a = r.getBoundingClientRect(), l = n ? a.left : a.top;
      return { top: s - l, bottom: i - l, height: o };
    }
    return { top: s, bottom: i, height: o };
  }
  /** The viewport's size along the scroll axis. */
  viewportHeight() {
    const e = this.options.scroller, n = this.options.horizontal;
    return e ? n ? e.clientWidth : e.clientHeight : typeof window < "u" ? n ? window.innerWidth : window.innerHeight : 0;
  }
}
function He(t) {
  return typeof t == "function" ? t() : t;
}
function Kg(t) {
  const e = new Zn(t);
  return e.start(), e;
}
const ps = /* @__PURE__ */ new Set(), fu = 16, go = 0.5, du = 2;
class mo {
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
    return e.addEventListener("wheel", this.onWheel, { passive: !1 }), e.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), ps.add(this), this.stopListening = Zn.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const e of ps) e.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const e = this.options.scroller ?? window;
    return e.removeEventListener("wheel", this.onWheel), e.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), ps.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const e of this.effects) gs(e.element, e.saved);
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
    const s = this.clamp(this.resolve(e) + (n.offset ?? 0)), i = Math.abs(s - this.current), o = this.reduced ? 0 : n.duration ?? Math.min(1.2, Math.max(0.4, i / 2500));
    if (o <= 0) {
      this.journey = null, this.current = this.target = s, this.write(s), this.applyEffects(0);
      return;
    }
    this.target = s, this.journey = { from: this.current, to: s, ms: o * 1e3, ease: n.ease ?? zn, elapsed: 0 }, this.requestFrame();
  }
  /** Re-measure the scrollable length and every effect element (resizes do this). */
  refresh() {
    if (!this.running) return;
    this.rest(), this.effects = [];
    const e = this.options.effects === !0 ? "[data-speed], [data-lag]" : this.options.effects || "";
    if (e && !this.reduced) {
      const n = this.options.scroller ?? document, s = this.position(), i = this.viewportHeight(), o = this.options.scroller?.getBoundingClientRect().top ?? 0;
      for (const r of n.querySelectorAll(e)) {
        const a = Number.parseFloat(r.dataset.speed ?? ""), l = Number.parseFloat(r.dataset.lag ?? ""), c = r.getBoundingClientRect(), h = c.top - o + s;
        this.effects.push({
          element: r,
          speed: Number.isFinite(a) ? a : void 0,
          lag: Number.isFinite(l) && l > 0 ? l : void 0,
          centre: h + c.height / 2 - i / 2,
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
    for (const e of this.effects) gs(e.element, e.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(e) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || this.nestedScrollerTakes(e)) return;
    const n = e.deltaMode === 1 ? fu : e.deltaMode === 2 ? this.viewportHeight() : 1, s = e.deltaY * n * (this.options.wheelMultiplier ?? 1), i = this.clamp(this.target + s);
    i === this.target && i === this.current || (e.preventDefault(), this.journey = null, this.target = i, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const e = this.position();
    this.written !== null && Math.abs(e - this.written) <= du || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = e, this.requestFrame());
  }
  nestedScrollerTakes(e) {
    const n = this.options.scroller ?? document.documentElement;
    for (let s = e.target; s && s !== n && s !== document.body; s = s.parentElement) {
      if (s.hasAttribute?.("data-smooth-ignore")) return !0;
      const i = getComputedStyle(s);
      if (!/(auto|scroll)/.test(i.overflowY) || s.scrollHeight <= s.clientHeight) continue;
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
      const o = this.journey;
      o.elapsed += n;
      const r = Math.min(1, o.elapsed / o.ms);
      this.current = o.from + (o.to - o.from) * o.ease(r), r >= 1 && (this.journey = null);
    } else if (this.current !== this.target) {
      const o = (this.options.smooth ?? 0.8) * 1e3 / 3;
      this.current += (this.target - this.current) * (1 - Math.exp(-n / o)), Math.abs(this.target - this.current) < go && (this.current = this.target);
    }
    this.current !== s && this.write(this.current), this.velocityPxPerSecond = n > 0 ? (this.current - s) * 1e3 / n : 0;
    const i = this.applyEffects(n);
    this.current !== s && this.options.onUpdate?.(this.state), this.journey || this.current !== this.target || i ? this.requestFrame() : (this.lastTime = null, this.velocityPxPerSecond = 0);
  }
  /** Position every effect for the current scroll; true while a lag is still catching up. */
  applyEffects(e) {
    let n = !1;
    const s = this.current;
    for (const i of this.effects) {
      let o = 0;
      if (i.speed !== void 0 && (o += (s - i.centre) * (1 - i.speed)), i.lag !== void 0) {
        const r = i.lag * 1e3 / 3;
        i.lagged = e === 0 ? s : i.lagged + (s - i.lagged) * (1 - Math.exp(-e / r)), Math.abs(s - i.lagged) < go ? i.lagged = s : n = !0, o += s - i.lagged;
      }
      gs(i.element, o === 0 ? i.saved : `0 ${pu(o)}px`), i.shift = o;
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
    const i = this.options.scroller?.getBoundingClientRect().top ?? 0, o = this.effects.find((r) => r.element === s)?.shift ?? 0;
    return s.getBoundingClientRect().top - i + this.position() - o;
  }
}
function gs(t, e) {
  e ? t.style.setProperty("translate", e) : t.style.removeProperty("translate");
}
function pu(t) {
  return Math.round(t * 100) / 100;
}
function gu(t, e) {
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
function ki(t, e, n, s, i = () => {
}) {
  const o = (d) => typeof d == "string" ? t.query(d) ?? void 0 : d, r = o(e.trigger) ?? s;
  if (!r) {
    i(`gsap-compat: scrollTrigger has no trigger element${typeof e.trigger == "string" ? ` for "${e.trigger}"` : ""}`);
    return;
  }
  const a = e.scrub === void 0 || e.scrub === !1 ? !1 : e.scrub, l = (e.toggleActions ?? "play none none none").trim().split(/\s+/);
  let c = 0, h;
  const u = (d, g) => () => {
    g?.(), n && !a && gu(n, l[d] ?? "none"), e.once && d === 0 && queueMicrotask(() => h.destroy());
  }, f = e.containerAnimation ? bu(t, e.containerAnimation, r, i) : void 0;
  return h = new Zn({
    trigger: r,
    start: e.start,
    end: e.end,
    scrub: a === !1 ? void 0 : a,
    pin: e.pin === !0 ? !0 : o(e.pin),
    scroller: o(e.scroller),
    horizontal: e.horizontal,
    pinSpacing: e.pinSpacing,
    onRefresh: e.invalidateOnRefresh && n?.invalidate ? () => n.invalidate() : void 0,
    snap: e.snap === void 0 ? void 0 : mu(e.snap, n),
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
function mu(t, e) {
  const n = (i) => i === "labels" ? (o) => yu(o, e?.labelProgresses?.() ?? []) : i;
  if (typeof t != "object" || Array.isArray(t)) return n(t);
  const s = t.ease ? Cn(t.ease) : void 0;
  return {
    snapTo: n(t.snapTo),
    duration: t.duration,
    delay: t.delay,
    ease: s ? s.fn ?? Tt(s.easing) : void 0
  };
}
function yu(t, e) {
  return e.reduce((n, s) => Math.abs(s - t) < Math.abs(n - t) ? s : n, e[0] ?? t);
}
function bu(t, e, n, s) {
  const i = () => e.timeline.getTracks({ property: "x" }).map((o) => o.target).filter((o) => {
    const r = t.elementFor(o);
    return !!r && r !== n && r.contains(n);
  });
  return i().length === 0 && s("gsap-compat: containerAnimation does not move an ancestor of the trigger along x"), {
    range: () => {
      const o = e.scrollTrigger;
      return o || s("gsap-compat: containerAnimation needs its own scrollTrigger (created before this one)"), { start: o?.startOffset ?? 0, end: o?.endOffset ?? 0 };
    },
    progress: () => e.progress(),
    shiftAt: (o) => {
      const r = e.timeline.getStateAtTime(o * e.timeline.duration);
      let a = 0;
      for (const l of i()) {
        const c = r.values.get(l)?.get("x");
        typeof c == "number" && (a += c);
      }
      return a;
    }
  };
}
class ga {
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
    for (const [e, { name: n, style: s, d: i }] of this.snapshots)
      s === null ? e.removeAttribute("style") : e.setAttribute("style", s), i !== null && e.setAttribute("d", i), this.host.forget(n);
    this.snapshots.clear();
  }
  /** Same as `revert()`: GSAP's name for dropping a context. */
  kill() {
    this.revert();
  }
}
class wu {
  host;
  scope;
  entries = [];
  listeners = [];
  scheduled = !1;
  constructor(e, n) {
    this.host = e, this.scope = n;
  }
  add(e, n) {
    const s = { conditions: e, setup: n, queries: /* @__PURE__ */ new Map() }, i = typeof e == "string" ? { matches: e } : e;
    if (typeof window < "u" && typeof window.matchMedia == "function")
      for (const [o, r] of Object.entries(i)) {
        const a = window.matchMedia(r);
        s.queries.set(o, a);
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
    const s = Object.values(n).some(Boolean), i = s ? JSON.stringify(n) : void 0;
    if (i === e.key || (e.context?.revert(), e.context = void 0, e.key = i, !s)) return;
    const o = new ga(this.host, this.scope);
    o.conditions = n, o.add(() => e.setup(o)), e.context = o;
  }
}
class ku {
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
    const s = this.images[n], { width: i, height: o } = this.canvas, r = (this.options.fit ?? "cover") === "cover" ? Math.max(i / s.naturalWidth, o / s.naturalHeight) : Math.min(i / s.naturalWidth, o / s.naturalHeight), a = s.naturalWidth * r, l = s.naturalHeight * r;
    this.context.clearRect(0, 0, i, o), this.context.drawImage(s, (i - a) / 2, (o - l) / 2, a, l), this.drawn = n, this.pump();
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
      for (const i of s === 0 ? [n] : [n + s, n - s])
        i < 0 || i >= this.frames || this.images[i] || this.inFlight >= e || this.load(i);
  }
  load(e) {
    const n = new Image();
    n.decoding = "async", this.images[e] = n, this.inFlight++;
    const s = (i) => {
      if (!this.destroyed) {
        if (this.inFlight--, i) {
          this.ready[e] = !0, this.loadedCount++, this.options.onProgress?.(this.loadedCount, this.frames);
          const o = Math.round(this.current);
          (Math.abs(e - o) < Math.abs(this.drawn - o) || this.drawn === -1) && (this.drawn = -1, this.draw());
        }
        this.pump();
      }
    };
    n.onload = () => s(!0), n.onerror = () => s(!1), n.src = this.options.url(e);
  }
}
const vu = { opacity: 0, y: -16 }, Su = { opacity: 0, y: 16 };
async function xu(t, e, n, s) {
  const i = e.collector?.scope ?? e.root, o = i.ownerDocument ?? i, r = () => s.shared ? [...i.querySelectorAll(s.shared)] : [];
  if (s.native && typeof o.startViewTransition == "function")
    return Mu(o, s, r);
  const a = s.duration ?? 0.35, l = s.ease ?? "power2.inOut", c = (m) => new Promise((y) => {
    m(y) || y();
  }), h = r(), u = h.length ? Ys(e, h) : void 0, f = s.from !== void 0 ? yo(e, s.from, s.shared) : [];
  if (f.length && s.leave !== !1) {
    const m = s.leave ?? vu;
    await c((y) => t.to(f, { ...m, duration: a, ease: l, onComplete: y }));
  }
  await s.update();
  const d = [], g = typeof s.to == "function" ? s.to() : s.to, p = g !== void 0 ? yo(e, g, s.shared) : [];
  if (p.length && s.enter !== !1) {
    const m = s.enter ?? Su;
    d.push(c((y) => t.fromTo(p, m, { ...ua(m), duration: a, ease: l, onComplete: y })));
  }
  if (u) {
    const m = r().filter((y) => !h.includes(y));
    m.length && d.push(
      c(
        (y) => js(e, n, u, {
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
function yo(t, e, n) {
  const s = t.resolveTargets(e).map((i) => t.elementFor(i)).filter((i) => !!i);
  return n ? s.flatMap((i) => !i.querySelector(n) && !i.matches(n) ? [i] : [...i.children].filter((o) => !o.matches(n) && !o.querySelector(n))) : s;
}
async function Mu(t, e, n) {
  const s = (a, l) => {
    const c = a.dataset?.flipId;
    c && a.style.setProperty("view-transition-name", l ? `tf-${c.replace(/[^\w-]/g, "-")}` : "");
  }, i = n();
  i.forEach((a) => s(a, !0));
  let o = [];
  await t.startViewTransition(async () => {
    i.forEach((a) => s(a, !1)), await e.update(), o = n(), o.forEach((a) => s(a, !0));
  }).finished, o.forEach((a) => s(a, !1));
}
const Tu = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (t, e) => yi(t, Ec(e))
}, Eu = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (t, e) => yi(t, { fn: Ac(e) })
}, Au = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (t, e) => yi(t, { fn: Pc(e) })
}, Pu = /* @__PURE__ */ new Set([
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
]), bo = 0.5, $u = "power1.inOut";
function _u(t) {
  return t.keyframes !== void 0 && t.keyframes !== null;
}
function Iu(t) {
  const e = t.keyframes, n = {};
  for (const [c, h] of Object.entries(t)) Pu.has(c) || (n[c] = h);
  if (Array.isArray(e))
    return e.map((c) => ({
      ...n,
      ...c,
      duration: c.duration ?? t.duration ?? bo
    }));
  const s = Object.entries(e), i = t.duration ?? bo, o = e.easeEach ?? t.easeEach ?? $u;
  if (s.length > 0 && s.every(([c]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(c) || c === "easeEach")) {
    const c = s.filter(([f]) => f !== "easeEach").map(([f, d]) => ({ at: Number.parseFloat(f) / 100, step: d })).sort((f, d) => f.at - d.at), h = [];
    let u = 0;
    for (const { at: f, step: d } of c) {
      const g = Math.max(0, f - u);
      h.push({ ...n, ease: o, ...d, duration: g * i }), u = f;
    }
    return h;
  }
  const r = s.filter(([c, h]) => c !== "easeEach" && Array.isArray(h)), a = Math.max(0, ...r.map(([, c]) => c.length)), l = [];
  for (let c = 0; c < a; c++) {
    const h = { ...n, ease: o, duration: i / a };
    for (const [u, f] of r)
      c < f.length && (h[u] = f[c]);
    l.push(h);
  }
  return l;
}
function wo(t, e, n, s = {}) {
  const i = e.collector?.scope ?? e.root, o = typeof s.scroller == "string" ? i.querySelector(s.scroller) : s.scroller ?? null, r = {
    x: o ? o.scrollLeft : window.scrollX,
    y: o ? o.scrollTop : window.scrollY
  }, a = {
    x: o ? o.scrollWidth - o.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: o ? o.scrollHeight - o.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, l = (b, w) => {
    if (w === void 0) return r[b];
    if (typeof w == "number") return w;
    if (w === "max") return a[b];
    const M = typeof w == "string" ? i.querySelector(w) : w;
    if (!M) return r[b];
    const x = M.getBoundingClientRect(), v = o?.getBoundingClientRect(), A = (b === "x" ? s.offsetX : s.offsetY) ?? s.offset ?? 0;
    return b === "x" ? x.left - (v?.left ?? 0) + r.x - A : x.top - (v?.top ?? 0) + r.y - A;
  }, c = typeof n == "object" && n !== null && !("nodeType" in n) ? { x: l("x", n.x), y: l("y", n.y) } : { x: r.x, y: l("y", n) }, h = { x: Math.max(0, Math.min(a.x, c.x)), y: Math.max(0, Math.min(a.y, c.y)) }, u = { ...r }, f = () => {
    o ? (o.scrollLeft = u.x, o.scrollTop = u.y) : window.scrollTo({ left: u.x, top: u.y, behavior: "instant" });
  }, d = ["wheel", "touchstart", "keydown"], g = o ?? window, p = () => {
    y.kill(), m();
  }, m = () => {
    for (const b of d) g.removeEventListener(b, p);
  }, y = t.to(u, {
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
  if (s.autoKill !== !1) for (const b of d) g.addEventListener(b, p, { passive: !0 });
  return y;
}
function Hu(t, e, n) {
  const s = t.collector?.scope ?? t.root, i = typeof e == "string" ? [...s.querySelectorAll(e)] : "nodeType" in e ? [e] : Array.from(e), { interval: o = 0.1, batchMax: r, onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h, ...u } = n, f = { onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h }, d = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, g = {}, p = (y) => {
    g[y] !== void 0 && clearTimeout(g[y]), g[y] = void 0;
    const b = d[y].splice(0);
    b.length > 0 && f[y]?.(b);
  }, m = (y, b) => {
    if (f[y]) {
      if (d[y].push(b), r !== void 0 && d[y].length >= r) return p(y);
      g[y] === void 0 && (g[y] = setTimeout(() => p(y), o * 1e3));
    }
  };
  return i.map(
    (y) => ki(t, {
      ...u,
      trigger: y,
      onEnter: () => m("onEnter", y),
      onLeave: () => m("onLeave", y),
      onEnterBack: () => m("onEnterBack", y),
      onLeaveBack: () => m("onLeaveBack", y)
    })
  ).filter((y) => y !== void 0);
}
class Nt {
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
    if (this.options = s, this.compat = new ke({
      ...s,
      startValue: (i, o) => {
        const r = e.objectFor(i);
        if (r) return Lu(r[o]);
        const a = e.appliedValue(i, o);
        if (a !== void 0) return a;
        if (o === "d") return la(e.elementFor(i)) ?? void 0;
        if (o === "text") return e.elementFor(i)?.textContent ?? void 0;
        if (o === "strokeDasharray" || o === "strokeDashoffset") {
          const l = So(e.elementFor(i));
          if (l !== void 0) return o === "strokeDasharray" ? [l, l] : 0;
        }
      },
      startVelocity: (i, o) => e.velocityOf(i, o),
      layoutColumns: (i) => vo(i.map((o) => e.elementFor(o))),
      random: () => e.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, e.collector?.track(this), e.liveTimelines.add(this), this.autoplayPending = !s.paused && !s.scrollTrigger, s.scrollTrigger) {
      const i = s.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = ki(e, i, this, this.firstElement, (o) => s.onWarning?.(o)));
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
    return _u(n) ? this.record(() => this.keyframed(e, n, s)) : this.record(() => this.tween(e, [n], s, ([i], o, r) => this.compat.to(o, i, r)));
  }
  from(e, n, s) {
    return this.record(() => this.tween(e, [n], s, ([i], o, r) => this.compat.from(o, i, r)));
  }
  fromTo(e, n, s, i) {
    return this.record(
      () => this.tween(e, [n, s], i, ([o, r], a, l) => this.compat.fromTo(a, o, r, l))
    );
  }
  set(e, n, s) {
    return this.record(() => this.tween(e, [n], s, ([i], o, r) => this.compat.set(o, i, r)));
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
      const i = this.compat.addEvent(s);
      this.events.push({ time: i, run: () => e(...n) });
    });
  }
  /** Pause exactly at `position` when the playhead reaches it, then run `callback`. `play()` continues. */
  addPause(e, n, s = []) {
    return this.record(() => {
      const i = this.compat.addEvent(e);
      this.events.push({ time: i, pause: !0, run: () => n?.(...s) });
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
    const i = this.timeline.currentTime, o = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(n))), r = { time: i }, a = s.duration ?? Math.abs(o - i) / 1e3 / (this.timeScale() || 1), l = new Nt(this.stage, { onStart: s.onStart, onComplete: s.onComplete });
    return l.to(r, {
      time: o,
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
      for (const i of n ?? [void 0])
        this.timeline.removeTracks({ target: s, ...i !== void 0 && { property: i } });
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
    const s = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: e >= n.time ? "forward" : "reverse" }, i = { ...n, iteration: s.iteration, direction: s.direction };
    this.playhead = { ...this.readPlayhead() }, this.waitingToWrap = !1, this.runCrossings(i, s, !1), this.options.onUpdate?.();
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
    const s = this.playhead, i = this.readPlayhead();
    this.playhead = i;
    const o = this.options.yoyo === !0;
    n && !o && i.iteration > s.iteration && (this.playhead = { time: 0, iteration: i.iteration, direction: "forward", fresh: !0 }, this.waitingToWrap = !0);
    const r = this.runCrossings(s, i, n);
    if (this.options.onUpdate?.(), this.finishedThisFrame && !r) {
      this.finishedThisFrame = !1;
      const a = e.currentTime === 0 && e.direction === "reverse";
      !this.scrollDriver && !o && this.stage.liveTimelines.delete(this), a && this.backwards ? this.options.onReverseComplete?.() : this.options.onComplete?.();
    }
    this.finishedThisFrame = !1;
  }
  /** Fire events and repeats between two playheads. Returns true if a pause stopped it. */
  runCrossings(e, n, s) {
    if (this.events.length === 0 && this.ranges.length === 0 && !this.options.onRepeat && !this.options.repeatRefresh) return !1;
    const i = this.events, { crossings: o, passes: r } = Kr(
      i.map((a) => a.time),
      e,
      n,
      { duration: this.timeline.duration, alternate: this.options.yoyo === !0, holding: s }
    );
    for (const a of o) {
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
  tween(e, n, s, i) {
    const o = this.resolve(e);
    if (!o) return;
    const { onStart: r, onUpdate: a, onComplete: l } = n[n.length - 1];
    if (r || a || l) {
      let c = 1 / 0, h = -1 / 0;
      const u = (f, d, g) => {
        i(f, d, g), c = Math.min(c, this.compat.lastStart), h = Math.max(h, this.compat.lastEnd);
      };
      if (this.buildTween(o, n, s, u), c === 1 / 0) return;
      r && this.events.push({ time: c, direction: "forward", run: r }), a && this.ranges.push({ start: c, end: h, run: a }), l && this.events.push({ time: h, direction: "forward", run: l });
      return;
    }
    this.buildTween(o, n, s, i);
  }
  /**
   * A tween with `keyframes`: its segments one after another, from the tween's
   * position and delay. With `stagger`, each target plays the whole sequence,
   * offset like any stagger. Callbacks belong to the sequence as a whole.
   */
  keyframed(e, n, s) {
    const i = this.resolve(e);
    if (!i) return;
    const o = Iu(n);
    if (o.length === 0) return;
    const r = i.length > 1 ? Ns(n.stagger, this.staggerContext(i)) : void 0, a = i.map((m) => this.targetFor(m)).filter((m) => m !== void 0), l = r ? a.map((m) => [m]) : [a], c = r ? Cs(i.length, r).map((m) => m / 1e3) : [0], h = this.compat.timeOf(s) / 1e3 + On(n.delay, 0) / 1e3;
    let u = 1 / 0, f = -1 / 0;
    if (l.forEach((m, y) => {
      o.forEach((b, w) => {
        const M = w === 0 ? h + c[y] : ">";
        this.tween(m, [b], M, ([x], v, A) => this.compat.to(v, x, A)), u = Math.min(u, this.compat.lastStart), f = Math.max(f, this.compat.lastEnd);
      });
    }), u === 1 / 0) return;
    const { onStart: d, onUpdate: g, onComplete: p } = n;
    d && this.events.push({ time: u, direction: "forward", run: d }), g && this.ranges.push({ start: u, end: f, run: g }), p && this.events.push({ time: f, direction: "forward", run: p });
  }
  staggerContext(e) {
    return {
      count: e.length,
      columnsFromLayout: () => vo(e.map((n) => this.stage.elementFor(n))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(e, n, s, i) {
    const o = e.map((f) => this.targetFor(f));
    if (!(e.length > 1 && (n.some(Ru) || e.some((f) => this.stage.objectFor(f) !== void 0)))) {
      const f = this.targetFor(e[0]);
      i(n.map((d) => this.prepare(ko(d, 0, f, this.stage.utils, o), e)), e, s);
      return;
    }
    const a = n.length - 1, { stagger: l, ...c } = n[a], h = Ns(l, this.staggerContext(e)), u = h ? Cs(e.length, h).map((f) => f / 1e3) : e.map(() => 0);
    e.forEach((f, d) => {
      const g = d === 0 ? On(c.delay, 0) / 1e3 + u[0] : 0, p = d === 0 ? 0 : u[d] - u[d - 1], m = d === 0 ? s : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, b = n.map((w, M) => M === a ? { ...c, delay: g } : w).map((w) => this.prepare(ko(w, d, this.targetFor(f), this.stage.utils, o), [f]));
      i(b, [f], m);
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
    const s = (r) => this.options.onWarning?.(r), i = (r) => this.stage.query(r);
    let o = e;
    if (e.motionPath !== void 0) {
      const r = Lh(e.motionPath, {
        query: i,
        targets: n.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: s
      });
      o = { ...o, motionPath: r };
    }
    if (e.morphSVG !== void 0) {
      const r = Fh(e.morphSVG, i, s), { morphSVG: a, ...l } = o;
      o = r ? { ...o, morphSVG: r } : l;
    }
    if (e.drawSVG !== void 0) {
      const r = So(this.stage.elementFor(n[0]));
      if (r === void 0) {
        s("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...l } = o;
        o = l;
      } else
        o = lh(o, r);
    }
    return o;
  }
  resolve(e) {
    const n = this.stage.resolveTargets(e);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${Fu(e)}`);
      return;
    }
    return this.firstElement ??= n.map((s) => this.stage.elementFor(s)).find((s) => s !== void 0), n;
  }
}
function Cu(t = new Hh()) {
  const e = (o) => {
    const { config: r } = Mn(o);
    return new Nt(t, {
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
  }, n = (o) => {
    const { onStart: r, onUpdate: a, onComplete: l, onRepeat: c, onReverseComplete: h, repeatRefresh: u, ...f } = o;
    return f;
  }, s = (o) => (o && t.collector?.track(o), o), i = {
    stage: t,
    ticker: t.ticker,
    utils: t.utils,
    getProperty: (o, r) => {
      const [a] = t.resolveTargets(o);
      if (a === void 0) return;
      const l = t.objectFor(a);
      return l ? l[r] : t.appliedValue(a, r) ?? ia(r);
    },
    scrollTrigger: (o) => s(ki(t, o)),
    scrollBatch: (o, r) => Hu(t, o, r).map((a) => s(a)),
    scrollTo: (o, r) => wo(i, t, o, r),
    refreshScroll: () => {
      Zn.refreshAll(), mo.refreshAll();
    },
    smoothScroll: (o = {}) => {
      const r = typeof o.scroller == "string" ? (t.collector?.scope ?? t.root).querySelector(o.scroller) : o.scroller;
      return s(new mo({ ...o, scroller: r }).start());
    },
    context: (o, r) => {
      const a = new ga(t, r);
      return o && a.add(() => o(a)), a;
    },
    matchMedia: (o) => new wu(t, o),
    customEase: Tu.create,
    customBounce: Eu.create,
    customWiggle: Au.create,
    pageTransition: (o) => xu(i, t, (r) => new Nt(t, r), o),
    imageSequence: (o, r) => {
      const a = typeof o == "string" ? (t.collector?.scope ?? t.root).querySelector(o) : o;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(o)}`);
      return s(new ku(a, r));
    },
    quickTo: (o, r, a = {}) => {
      const l = new Nt(t, { paused: !0 }), [c] = t.resolveTargets(o);
      return Object.assign((u) => {
        if (!c) return;
        const f = a.spring !== void 0 ? t.velocityOf(c, r) ?? 0 : 0;
        l.compat.reset(), l.compat.to(c, {
          [r]: u,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: Ou(a.spring, r, f) }
        }), l.timeline.stop(), l.timeline.play(), t.activate(l.timeline);
      }, { tween: l, kill: () => l.kill() });
    },
    timeline: (o) => new Nt(t, o),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (o, r) => {
      if (r.scrollTo !== void 0) {
        const { scrollTo: a, ...l } = r, c = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, h = typeof o != "string" && o !== window && o.nodeType === 1;
        return wo(i, t, a, {
          ...l,
          offsetX: c.offsetX,
          offsetY: c.offsetY,
          scroller: h ? o : void 0
        });
      }
      return e(r).to(o, n(r));
    },
    from: (o, r) => e(r).from(o, n(r)),
    fromTo: (o, r, a) => e(a).fromTo(o, r, n(a)),
    set: (o, r) => e(r).set(o, n(r)),
    delayedCall: (o, r, a) => new Nt(t).call(r, a, o),
    killTweensOf: (o, r) => {
      const a = t.resolveTargets(o), l = typeof r == "string" ? r.split(",").map((c) => c.trim()).filter(Boolean) : r;
      for (const c of [...t.liveTimelines]) c.killTweensOf(a, l);
    },
    convertToPath: (o) => Bh(o, t.root),
    splitText: (o, r) => {
      const a = t.collector?.scope ?? t.root, l = typeof o == "string" ? Array.from(a.querySelectorAll(o)) : "nodeType" in o ? [o] : Array.from(o);
      return s(zh(l, r));
    },
    draggable: (o, r) => s(Xh(i, t, o, r)),
    getFlipState: (o) => Ys(t, o),
    flipFrom: (o, r) => js(t, (a) => new Nt(t, a), o, r),
    flip: (o, r, a) => {
      const l = Ys(t, o);
      return r(), js(t, (c) => new Nt(t, c), l, { targets: o, ...a });
    }
  };
  return i;
}
const $t = /* @__PURE__ */ Cu();
function Ou(t, e, n) {
  return t === !0 ? { velocity: { [e]: n } } : typeof t == "string" ? { preset: t, velocity: { [e]: n } } : { ...t, velocity: { [e]: n } };
}
function Ru(t) {
  return t.morphSVG !== void 0 || t.drawSVG !== void 0 || t.text !== void 0 || t.scrambleText !== void 0 || ma(t);
}
function ma(t) {
  return Object.entries(t).some(([e, n]) => (typeof n == "function" || sa(n)) && !bi.has(e));
}
function ko(t, e, n, s, i) {
  if (!ma(t)) return t;
  const o = {};
  for (const [r, a] of Object.entries(t))
    bi.has(r) ? o[r] = a : typeof a == "function" ? o[r] = a(e, n, i) : sa(a) ? o[r] = s.resolveRandomString(a) : o[r] = a;
  return o;
}
function vo(t) {
  const e = t.map((s) => s?.getBoundingClientRect().top);
  if (e[0] === void 0) return t.length;
  let n = 0;
  for (const s of e) {
    if (s === void 0 || Math.abs(s - e[0]) > 1) break;
    n++;
  }
  return Math.max(1, n);
}
function So(t) {
  const e = t;
  if (typeof e?.getTotalLength == "function")
    return e.getTotalLength();
}
function Lu(t) {
  if (typeof t == "number" || typeof t == "string" || Array.isArray(t) && t.every((e) => typeof e == "number")) return t;
}
function Fu(t) {
  return typeof t == "string" ? `"${t}"` : String(t);
}
class xo {
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
function Wu(t, e, n, s, i) {
  const o = n - i;
  if (o < 0) {
    e.paused || e.pause(), e.currentTime = 0;
    return;
  }
  t.update(o, s);
}
class vi {
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
    this.options = n, this.adapter = new ie();
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
    this.options.speed !== void 0 && (n.speed = this.options.speed), this.options.loop !== void 0 && (n.loop = this.options.loop), this.options.alternate !== void 0 && (n.alternate = this.options.alternate), this.timeline = Ve({ ...e, config: n }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
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
    for (const o of e) {
      if (s.has(o.id)) throw new Error(`tinyfly: scenario id "${o.id}" is used more than once`);
      s.add(o.id);
    }
    const i = n.initial === void 0 ? e[0] : e.find((o) => o.id === n.initial);
    if (!i) throw new Error(`tinyfly: there is no scenario "${n.initial}"`);
    this.scenarioList = [...e], this.scenarioId = i.id, await this.loadSource(i.timeline);
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
    const s = this.isPlaying, i = this.currentTime >= this.duration - 0.5, o = this.currentMarker?.id;
    this.stopAnimationLoop(), this.stepping = !1, this.pausedByVisibility = !1, this.restoreAuthored(), this.scenarioId = e, this.useDefinition(n.timeline), this.lastMarkerId = null;
    let r = 0;
    return this.reducedMotion || i ? r = this.duration : o !== void 0 && (r = this.markers.find((a) => a.id === o)?.time ?? 0), this.seek(r), s && !this.reducedMotion ? (this.stepping = this.options.stepMode === !0, this.startPlaying()) : this.notify(), !0;
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
    const i = n ?? this.language(), o = (r) => r?.[i]?.[s.id] ?? r?.[i.split("-")[0]]?.[s.id];
    return o(this.options.captions) ?? o(this.timeline?.captions) ?? s.label;
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
      const s = n, i = Number(s.getAttribute("data-tinyfly-start") ?? "0") || 0, o = s.getAttribute("data-volume");
      o !== null && (s.volume = Math.max(0, Math.min(1, Number(o) || 0))), this.mediaTargets.push({ el: s, startTime: i, sync: new xo(s) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(e, n) {
    for (const s of this.mediaTargets)
      Wu(s.sync, s.el, e, n, s.startTime);
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
    const e = this.options.symbols;
    if (!e || e.length === 0) return;
    const n = new Map(e.map((s) => [s.id, s]));
    this.container.querySelectorAll("[data-tinyfly-symbol]").forEach((s) => {
      const i = s.getAttribute("data-tinyfly-symbol");
      if (!i) return;
      const o = n.get(i);
      if (!o || !o.timeline.tracks?.length) return;
      const r = new ie();
      s.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const l = a.getAttribute("data-tinyfly");
        l && r.registerTarget(l, a);
      }), this.symbolInstances.push({ adapter: r, timeline: Ve(o.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(e, n) {
    this.mediaSync = new xo(e, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
      const i = this.playhead;
      this.timeline.tick(s), this.stopAtMarker(i), this.applyState();
      const o = this.timeline.playbackState === "playing";
      this.mediaSync?.update(this.timeline.currentTime, o), this.syncAllMedia(this.timeline.currentTime, o), this.timeline.playbackState === "playing" ? this.animationFrameId = requestAnimationFrame(e) : (this.animationFrameId = void 0, this.notify());
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
    const i = this.markers;
    if (i.length === 0) return;
    const { crossings: o } = Kr(
      i.map((r) => r.time),
      e,
      s,
      { duration: n.duration, alternate: n.config.alternate === !0, holding: n.repeatDelayRemaining > 0 }
    );
    for (const r of o) {
      if (r.kind !== "event") continue;
      const a = i[r.index];
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
async function Yg(t, e, n = {}) {
  const s = new vi(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
function jg(t, e = {}) {
  return new vi(t, e);
}
const Bu = {
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
}, Mo = "tinyfly-controls-style", Du = `
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
let Nu = 0;
function Ku(t) {
  if (t.getElementById(Mo)) return;
  const e = t.createElement("style");
  e.id = Mo, e.textContent = Du, t.head.appendChild(e);
}
function Yu(t, e, n = {}) {
  const s = e.ownerDocument;
  Ku(s);
  const i = { ...Bu, ...n.labels }, o = n.speeds ?? [0.5, 1, 2], r = () => t.markers.length > 0, a = () => t.markers.some((j) => j.label !== void 0 || t.caption(j.id) !== void 0), l = s.createElement("div");
  l.className = "tf-ctl";
  const c = s.createElement("div");
  c.className = "tf-ctl-bar", c.setAttribute("role", "group");
  const h = (j, U, P, R = "") => {
    const D = s.createElement("button");
    return D.type = "button", D.className = `tf-ctl-btn ${R}`.trim(), D.setAttribute("aria-label", j), D.title = j, D.textContent = U, D.addEventListener("click", P), D;
  }, u = h(i.restart, "⟲", () => {
    t.pause(), t.seek(0);
  }), f = h(i.prev, "|◀", () => t.prev()), d = h(i.play, "▶", () => t.isPlaying ? t.pause() : p(), "tf-ctl-primary"), g = h(i.next, "▶|", () => t.next()), p = () => {
    t.currentTime >= t.duration - 0.5 && t.seek(0), t.play();
  }, m = s.createElement("input");
  m.type = "range", m.className = "tf-ctl-scrub", m.min = "0", m.max = "1000", m.step = "1", m.setAttribute("aria-label", i.scrub), m.addEventListener("input", () => {
    t.pause(), t.seek(Number(m.value) / 1e3 * t.duration);
  });
  const y = s.createElement("span");
  y.className = "tf-ctl-step";
  const b = s.createElement("select");
  b.className = "tf-ctl-speed", b.setAttribute("aria-label", i.speed);
  for (const j of o) {
    const U = s.createElement("option");
    U.value = String(j), U.textContent = `${j}×`, j === 1 && (U.selected = !0), b.appendChild(U);
  }
  b.addEventListener("change", () => t.setSpeed(Number(b.value))), c.append(u, f, d, g, m, y), o.length > 0 && c.append(b), l.append(c);
  const w = n.fullscreen ? Uu(e, s, i) : void 0;
  w && c.append(w.button);
  const M = s.createElement("p");
  M.className = "tf-ctl-caption", M.setAttribute("aria-live", "polite"), n.captions !== !1 && l.append(M);
  const x = s.createElement("div");
  x.className = "tf-ctl-question", x.hidden = !0;
  const v = s.createElement("span"), A = h(i.reveal, i.reveal, () => t.play(), "tf-ctl-primary");
  x.append(v, A), l.append(x);
  const C = ju(t, s, i.scenario, n.scenarioControl ?? "buttons");
  C && l.append(C.element);
  const T = n.mount;
  T ? T.appendChild(l) : e.insertAdjacentElement("afterend", l);
  const H = () => {
    const j = t.isPlaying;
    d.textContent = j ? "❚❚" : "▶", d.setAttribute("aria-label", j ? i.pause : i.play), d.title = j ? i.pause : i.play;
    const U = t.duration;
    s.activeElement !== m && (m.value = String(U > 0 ? Math.round(t.currentTime / U * 1e3) : 0));
    const P = t.markers;
    if (f.hidden = g.hidden = y.hidden = P.length === 0, P.length > 0) {
      const R = t.currentMarker, D = R ? P.indexOf(R) + 1 : 0;
      y.textContent = i.stepFormat.replace("{index}", String(D)).replace("{total}", String(P.length)), y.setAttribute("aria-label", `${i.step} ${D} ${i.of} ${P.length}`), f.disabled = t.currentTime <= 0.5, g.disabled = t.currentTime >= U - 0.5;
      const Y = t.caption() ?? "";
      M.textContent !== Y && (M.textContent = Y), M.hidden = !a();
      const k = !j && R?.question !== void 0 && Math.abs(t.currentTime - R.time) < 1;
      x.hidden = !k, k && v.textContent !== R.question && (v.textContent = R.question);
    } else
      x.hidden = !0, M.hidden = !0;
    C?.update();
  }, _ = t.subscribe(H);
  H();
  const O = n.keyboardScope ?? e;
  !O.hasAttribute("tabindex") && O.tabIndex < 0 && (O.tabIndex = 0);
  const L = /* @__PURE__ */ new WeakSet(), W = (j) => {
    if (L.has(j) || (L.add(j), j.defaultPrevented || j.altKey || j.ctrlKey || j.metaKey)) return;
    const U = j.target;
    if (!(U.tagName === "INPUT" || U.tagName === "SELECT") && !(j.key === " " && U.tagName === "BUTTON"))
      switch (j.key) {
        case " ":
          j.preventDefault(), t.isPlaying ? t.pause() : p();
          break;
        case "ArrowRight":
          if (!r()) return;
          j.preventDefault(), t.next();
          break;
        case "ArrowLeft":
          if (!r()) return;
          j.preventDefault(), t.prev();
          break;
        case "Home":
          j.preventDefault(), t.pause(), t.seek(0);
          break;
        case "f":
        case "F":
          if (!w) return;
          j.preventDefault(), w.active ? w.exit() : w.enter();
          break;
      }
  };
  return O.addEventListener("keydown", W), l.addEventListener("keydown", W), {
    element: l,
    fullscreen: w && {
      get active() {
        return w.active;
      },
      enter: w.enter,
      exit: w.exit
    },
    destroy() {
      w?.destroy(), _(), O.removeEventListener("keydown", W), l.removeEventListener("keydown", W), l.remove();
    }
  };
}
function ju(t, e, n, s) {
  const i = t.scenarios;
  if (i.length < 2) return;
  if (s === "slider") {
    const h = e.createElement("div");
    h.className = "tf-ctl-choice-slider";
    const u = e.createElement("span");
    u.textContent = n, u.setAttribute("aria-hidden", "true");
    const f = e.createElement("input");
    f.type = "range", f.min = "0", f.max = String(i.length - 1), f.step = "1", f.setAttribute("aria-label", n);
    const d = e.createElement("output");
    return d.setAttribute("aria-hidden", "true"), f.addEventListener("input", () => {
      const p = i[Number(f.value)];
      p && t.setScenario(p.id);
    }), h.append(u, f, d), { element: h, update: () => {
      const p = Math.max(0, i.findIndex((y) => y.id === t.scenario));
      e.activeElement !== f && (f.value = String(p));
      const m = i[p].label;
      d.textContent !== m && (d.textContent = m), f.setAttribute("aria-valuetext", m);
    } };
  }
  const o = e.createElement("fieldset");
  o.className = "tf-ctl-choices";
  const r = e.createElement("legend");
  r.textContent = n, o.append(r);
  const a = `tf-ctl-scenario-${++Nu}`, l = i.map((h) => {
    const u = e.createElement("label");
    u.className = "tf-ctl-choice";
    const f = e.createElement("input");
    f.type = "radio", f.name = a, f.value = h.id, f.addEventListener("change", () => {
      f.checked && t.setScenario(h.id);
    });
    const d = e.createElement("span");
    return d.textContent = h.label, u.append(f, d), o.append(u), f;
  });
  return { element: o, update: () => {
    for (const h of l) {
      const u = h.value === t.scenario;
      h.checked !== u && (h.checked = u);
    }
  } };
}
const Xu = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', qu = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function Uu(t, e, n) {
  const s = e, i = t, o = e.createElement("button");
  o.type = "button", o.className = "tf-ctl-btn tf-ctl-fullscreen";
  let r, a = "";
  const l = () => {
    const p = r !== void 0;
    o.innerHTML = p ? qu : Xu;
    const m = p ? n.exitFullscreen : n.fullscreen;
    o.setAttribute("aria-label", m), o.title = m, o.setAttribute("aria-pressed", String(p)), t.classList.toggle("tf-fullscreen", p), t.classList.toggle("tf-fullscreen-overlay", r === "overlay");
  }, c = () => s.fullscreenElement ?? s.webkitFullscreenElement ?? null, h = () => {
    c() === t ? r = "native" : r === "native" && (r = void 0), l();
  }, u = (p) => {
    p.key === "Escape" && g();
  }, f = () => {
    r = "overlay", a = e.documentElement.style.overflow, e.documentElement.style.overflow = "hidden", e.addEventListener("keydown", u), l();
  };
  async function d() {
    if (r) return;
    const p = i.requestFullscreen?.bind(i) ?? i.webkitRequestFullscreen?.bind(i), m = s.fullscreenEnabled ?? s.webkitFullscreenEnabled ?? !1;
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
  return o.addEventListener("click", () => {
    r ? g() : d();
  }), e.addEventListener("fullscreenchange", h), e.addEventListener("webkitfullscreenchange", h), l(), {
    button: o,
    get active() {
      return r !== void 0;
    },
    enter: d,
    exit: g,
    destroy() {
      g(), e.removeEventListener("fullscreenchange", h), e.removeEventListener("webkitfullscreenchange", h), o.remove();
    }
  };
}
const To = "tinyfly-choices-style", Vu = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function zu(t) {
  if (t.getElementById(To)) return;
  const e = t.createElement("style");
  e.id = To, e.textContent = Vu, t.head.appendChild(e);
}
function Gu(t, e) {
  const n = Array.from(e.querySelectorAll("[data-tinyfly-choose]"));
  if (n.length === 0) return () => {
  };
  zu(e.ownerDocument);
  const s = [], i = [];
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
    a.addEventListener("click", f), a.addEventListener("keydown", d), i.push(() => {
      a.removeEventListener("click", f), a.removeEventListener("keydown", d);
    });
  }
  const o = () => {
    for (const { element: a } of s)
      a.setAttribute("aria-pressed", String(a.getAttribute("data-tinyfly-choose") === t.scenario));
  }, r = t.subscribe(o);
  return o(), () => {
    r();
    for (const a of i) a();
    for (const { element: a, attributes: l } of s) for (const c of l) a.removeAttribute(c);
  };
}
const Ln = /* @__PURE__ */ new WeakMap(), Xs = /* @__PURE__ */ new WeakMap();
let Ju = 0;
function De(t, e, n) {
  if (t)
    try {
      return JSON.parse(t);
    } catch (s) {
      console.warn(`tinyfly: invalid ${e} JSON on`, n, s);
      return;
    }
}
async function Zu(t, e = {}) {
  const n = Ln.get(t);
  if (n) return n;
  const s = Array.from(t.querySelectorAll("script[data-tinyfly-timeline]")), i = s[0], o = t.getAttribute("data-src"), r = tf(t.getAttribute("data-markers")), a = s.length > 1 || i?.hasAttribute("data-scenario") ? Qu(s, r, t) : void 0;
  if (a && a.length === 0) return;
  let l = i && !a ? De(i.textContent, "timeline", t) : void 0;
  if (!l && o && r) {
    const d = await fetch(o);
    d.ok && (l = await d.json());
  }
  if (l && r && (l = ya(l, r)), !l && !o && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', t);
    return;
  }
  const c = De(t.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", t), h = {
    playWhenVisible: !0,
    ...e.player,
    ...c && { captions: c },
    ...De(t.getAttribute("data-options"), "data-options", t)
  };
  nf(t);
  const u = new vi(t, h), f = { element: t, player: u };
  if (Ln.set(t, f), t.setAttribute("data-tinyfly-mounted", ""), a) {
    const d = t.getAttribute("data-scenario") ?? void 0;
    await u.loadScenarios(a, { initial: a.some((g) => g.id === d) ? d : void 0 }), Xs.set(t, Gu(u, t));
  } else
    await u.load(l ?? o);
  if (t.getAttribute("data-controls") !== "false") {
    const d = De(t.getAttribute("data-labels"), "data-labels", t), g = t.querySelector("figcaption"), p = t.getAttribute("data-scenario-legend"), m = t.getAttribute("data-scenario-control");
    f.controls = Yu(u, t, {
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
function Qu(t, e, n) {
  const s = [];
  return t.forEach((i, o) => {
    const r = De(i.textContent, "timeline", n);
    if (!r) return;
    const a = i.getAttribute("data-scenario") || `scenario-${o + 1}`;
    if (s.some((c) => c.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, n);
      return;
    }
    const l = i.getAttribute("data-scenario-label") ?? void 0;
    s.push({ id: a, label: l, timeline: e ? ya(r, e) : r });
  }), s;
}
function ya(t, e) {
  return t.config.markers?.length ? t : { ...t, config: { ...t.config, markers: e.map((n, s) => ({ id: `step-${s + 1}`, time: n })) } };
}
function tf(t) {
  if (!t) return;
  const e = t.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((n, s) => n - s);
  return e.length > 0 ? e : void 0;
}
async function ef(t = document, e = {}) {
  const n = Array.from(t.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(n.map((i) => Zu(i, e)))).filter((i) => i !== void 0);
}
function Xg(t) {
  const e = Ln.get(t);
  e && (Xs.get(t)?.(), Xs.delete(t), e.controls?.destroy(), e.player.destroy(), Ln.delete(t), t.removeAttribute("data-tinyfly-mounted"));
}
function nf(t) {
  const e = t.querySelector("svg");
  if (!e || e.hasAttribute("role") || e.hasAttribute("aria-hidden")) return;
  const n = t.getAttribute("data-alt"), s = t.querySelector("figcaption");
  e.setAttribute("role", "img"), n ? e.setAttribute("aria-label", n) : s && (s.id ||= `tinyfly-caption-${++Ju}`, e.setAttribute("aria-labelledby", s.id));
}
function sf() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const e = () => {
    ef();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
class of {
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
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new ie(), this.adapterB = new ie();
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
      const i = this.timelineA.getStateAtTime(0);
      this.adapterA.applyState(i), this.applyNested(this.adapterA, 0);
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
    const i = document.createElement("div");
    i.style.cssText = "position:absolute;inset:0;transform-origin:center center", i.setAttribute("data-tinyfly", "Camera"), n.appendChild(i), s.registerTarget("Camera", i);
    for (const o of e.elements) {
      if (!o.html) continue;
      const r = document.createElement("div");
      r.innerHTML = o.html.trim();
      const a = r.firstElementChild;
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
  setupNested(e, n) {
    const s = [];
    e.querySelectorAll("[data-tinyfly-symbol]").forEach((i) => {
      const o = i.getAttribute("data-tinyfly-symbol");
      if (!o) return;
      const r = this.symbolDefs.get(o);
      if (!r) return;
      const a = new ie();
      i.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const c = l.getAttribute("data-tinyfly");
        c && a.registerTarget(c, l);
      }), s.push({ adapter: a, timeline: Ve(r) });
    }), s.length ? this.nestedByAdapter.set(n, s) : this.nestedByAdapter.delete(n);
  }
  /** Apply the nested symbol states for a slot at a given scene time. */
  applyNested(e, n) {
    const s = this.nestedByAdapter.get(e);
    if (s)
      for (const i of s) {
        const o = i.timeline.duration;
        i.adapter.applyState(i.timeline.getStateAtTime(o > 0 ? n % o : n));
      }
  }
  clearContainer(e) {
    e.innerHTML = "";
  }
  createTimeline(e) {
    return e.timeline ? Ve(e.timeline) : null;
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
    const s = `${n}ms`, i = "ease-in-out";
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
    switch (this.containerB.offsetHeight, this.containerA.style.transition = `opacity ${s} ${i}, transform ${s} ${i}`, this.containerB.style.transition = `opacity ${s} ${i}, transform ${s} ${i}`, e) {
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
        const i = this.timelineA.getStateAtTime(this.timelineA.currentTime);
        this.adapterA.applyState(i), this.applyNested(this.adapterA, this.timelineA.currentTime);
      }
      if (this._state === "transitioning" && this.timelineB && this.timelineB.playbackState === "playing") {
        this.timelineB.tick(s);
        const i = this.timelineB.getStateAtTime(this.timelineB.currentTime);
        this.adapterB.applyState(i), this.applyNested(this.adapterB, this.timelineB.currentTime);
      }
      this._isPlaying ? this.animationFrameId = requestAnimationFrame(e) : this.animationFrameId = void 0;
    };
    this.animationFrameId = requestAnimationFrame(e);
  }
  stopAnimationLoop() {
    this.animationFrameId !== void 0 && (cancelAnimationFrame(this.animationFrameId), this.animationFrameId = void 0);
  }
}
async function qg(t, e, n = {}) {
  const s = new of(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
const Ug = { type: "none", duration: 0 }, at = (t) => ({ description: t, unit: "degrees" }), it = (t, e = 0, n = 1) => ({ description: t, unit: `${e}..${n}`, min: e, max: n }), ba = {
  lean: at("Upper body tipped about the hips (+ toward the way it faces)"),
  bend: at("Line of action: the spine curved (+ curls forward, − arches back)"),
  headTilt: at("Head tilt"),
  leftShoulder: at("Left upper arm: 0 hangs down, 90 straight out to its side, 180 straight up; in profile, forward is negative for the left arm"),
  rightShoulder: at("Right upper arm: 0 hangs down, 90 straight out (forward, in profile), 180 straight up"),
  leftElbow: at("Left elbow bend, added to the upper arm"),
  rightElbow: at("Right elbow bend, added to the upper arm"),
  leftHip: at("Left thigh: 0 straight down; in profile negative is forward"),
  rightHip: at("Right thigh: 0 straight down; in profile positive is forward"),
  leftKnee: at("Left knee bend (negative folds the shin back)"),
  rightKnee: at("Right knee bend (positive folds the shin back)"),
  leftWrist: at("Left wrist bend, added to the forearm"),
  rightWrist: at("Right wrist bend, added to the forearm"),
  leftAnkle: at("Left ankle: + points the toe down (tiptoe), − onto the heel"),
  rightAnkle: at("Right ankle: + points the toe down (tiptoe), − onto the heel"),
  leftFootOut: it("Left foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in", -1, 1),
  rightFootOut: it("Right foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in", -1, 1),
  mouth: it("Mouth open: 0 closed, 1 wide open"),
  smile: it("−1 frown, 0 flat, 1 smile", -1, 1),
  mouthWidth: { description: "Mouth width: 1 normal, 0.5 pursed, 1.5 wide", unit: "factor", min: 0.3, max: 2 },
  blink: it("Eyes closed by a blink: 0 open, 1 shut"),
  leftEye: { description: "Left eye openness: 0 shut, 1 normal, 1.6 wide", unit: "factor", min: 0, max: 2 },
  rightEye: { description: "Right eye openness: 0 shut, 1 normal, 1.6 wide", unit: "factor", min: 0, max: 2 },
  leftBrow: it("Left eyebrow: −1 lowered, 0 rest, 1 raised", -1, 1),
  rightBrow: it("Right eyebrow: −1 lowered, 0 rest, 1 raised", -1, 1),
  browTilt: it("Eyebrow slant: −1 angry, 1 worried", -1, 1),
  lookX: it("Eyes look across: + the way it faces", -1, 1),
  lookY: it("Eyes look down (+) or up (−)", -1, 1),
  stretch: { description: "Squash and stretch: 1 normal, above taller (a jump), below squashed (a landing)", unit: "factor", min: 0.3, max: 3 },
  turn: it("0 front-on, 1 in profile, turned the way it faces"),
  sit: it("0 standing, 1 seated"),
  spin: at("Whole body turned about the hips: + rolls forward (a front flip), 360 a full turn"),
  rise: { description: "Lift off the ground, as a fraction of its height (the arc of a jump)", unit: "× height" }
}, wa = {
  walk: { description: "Walk-cycle phase, in strides: animate 0 → n for n strides", unit: "strides" },
  walking: it("How much of the walk cycle is applied (0 standing)"),
  gait: { description: "How it walks: a gait name (walk, bouncy, doubleBounce, sneak, strut, tired, run, shove); a string track switches it", kind: "string" },
  talk: it("How much the mouth chatters"),
  rubber: it("Limbs from jointed (0) to rubber hose (1)"),
  facing: { description: "Which way it faces: 1 right, −1 left (key the flip while turn is near 0)", unit: "±1", min: -1, max: 1 },
  beat: { description: "Beats into its dance (with a dance)", unit: "beats" },
  dancing: it("How much of the dance is applied")
}, ka = {
  "thumb.curl": it("Thumb curled in"),
  "thumb.across": it("Thumb across the palm"),
  "index.curl": it("Index finger curled"),
  "middle.curl": it("Middle finger curled"),
  "ring.curl": it("Ring finger curled"),
  "pinky.curl": it("Little finger curled"),
  spread: it("Fingers spread apart"),
  turn: at("Hand turned about the forearm"),
  bend: at("Hand bent at the wrist, palm-ward"),
  tilt: at("Hand tilted sideways"),
  roll: at("Hand rolled to show the back or the palm")
};
let va;
function rf(t) {
  va = t;
}
function af() {
  return va?.() ?? {};
}
function lf(t) {
  let e = 0;
  for (let n = 1; n < t.length; n++) e += Math.hypot(t[n].x - t[n - 1].x, t[n].y - t[n - 1].y);
  return e;
}
function Ze(t, e) {
  const n = Math.min(1, Math.max(0, e));
  if (t.length < 2 || n === 1) return t.slice();
  if (n === 0) return t.slice(0, 1);
  let s = lf(t) * n;
  const i = [t[0]];
  for (let o = 1; o < t.length; o++) {
    const r = t[o - 1], a = t[o], l = Math.hypot(a.x - r.x, a.y - r.y);
    if (l >= s) {
      const c = l === 0 ? 0 : s / l;
      return i.push({ x: r.x + (a.x - r.x) * c, y: r.y + (a.y - r.y) * c }), i;
    }
    i.push(a), s -= l;
  }
  return i;
}
function Si(t, e) {
  const n = Ze(t, e);
  return n[n.length - 1];
}
function Sa(t, e) {
  return e > 0 ? Math.floor(Math.max(0, t) * e / 1e3) : 0;
}
function qs(t, e, n) {
  const s = e.roughness ?? 2, i = Math.max(1, Math.round(e.passes ?? 2)), o = Sa(n, e.boil ?? 8);
  let r = 0;
  const a = () => {
    const f = r++;
    return (d) => Gn(rn(`${e.seed ?? 1}:${o}:${f}:${d}`));
  }, l = (f, d) => (f.next() * 2 - 1) * d, c = (f) => {
    const d = a(), g = t.lineWidth, p = t.globalAlpha;
    for (let m = 0; m < i; m++)
      t.lineWidth = m === 0 ? g : g * 0.55, t.globalAlpha = m === 0 ? p : p * 0.6, f(d(m));
    t.lineWidth = g, t.globalAlpha = p;
  }, h = (f, d = 1) => {
    if (f.length < 2) return;
    const g = f.slice(1).map((m, y) => Math.hypot(m.x - f[y].x, m.y - f[y].y)), p = g.reduce((m, y) => m + y, 0) * Math.min(1, Math.max(0, d));
    c((m) => {
      const y = [], b = [];
      if (f.forEach((M, x) => {
        y.push({ x: M.x + l(m, s * 0.5), y: M.y + l(m, s * 0.5) }), x > 0 && b.push([m.next() * 2 - 1, m.next() * 2 - 1]);
      }), p <= 0) return;
      t.beginPath(), t.moveTo(y[0].x, y[0].y);
      let w = 0;
      for (let M = 1; M < y.length; M++) {
        const x = cf(y[M - 1], y[M], s, b[M - 1]), v = g[M - 1];
        if (w + v <= p) {
          t.bezierCurveTo(x[1].x, x[1].y, x[2].x, x[2].y, x[3].x, x[3].y), w += v;
          continue;
        }
        const A = hf(x, v === 0 ? 1 : (p - w) / v);
        t.bezierCurveTo(A[1].x, A[1].y, A[2].x, A[2].y, A[3].x, A[3].y);
        break;
      }
      t.stroke();
    });
  }, u = (f, d, g, p, m = 1) => {
    c((y) => {
      const w = y.next() * Math.PI * 2, M = Math.PI * 2 + 0.15 + y.next() * 0.3, x = [];
      for (let A = 0; A <= 14; A++) {
        const C = w + M * A / 14, T = l(y, s * 0.6);
        x.push({ x: f + Math.cos(C) * (g + T), y: d + Math.sin(C) * (p + T) });
      }
      const v = Ze(x, m);
      v.length < 2 || (Eo(t, v), t.stroke());
    });
  };
  return {
    line: h,
    curve(f, d = 1) {
      if (f.length < 2) return;
      const g = f[0], p = f[f.length - 1], m = Math.hypot(p.x - g.x, p.y - g.y) || 1, y = -(p.y - g.y) / m, b = (p.x - g.x) / m;
      c((w) => {
        const M = { x: l(w, s * 0.5), y: l(w, s * 0.5) }, x = { x: l(w, s * 0.5), y: l(w, s * 0.5) }, v = l(w, s * Math.min(1.5, Math.max(0.3, m / 80))), A = f.map((T, H) => {
          const _ = H / (f.length - 1), O = Math.sin(Math.PI * _) * v;
          return {
            x: T.x + M.x + (x.x - M.x) * _ + y * O,
            y: T.y + M.y + (x.y - M.y) * _ + b * O
          };
        }), C = Ze(A, d);
        C.length < 2 || (Eo(t, C), t.stroke());
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
function cf(t, e, n, s) {
  const i = e.x - t.x, o = e.y - t.y, r = Math.hypot(i, o) || 1, a = n * Math.min(1.5, Math.max(0.3, r / 80)), l = -o / r, c = i / r;
  return [
    t,
    { x: t.x + i / 3 + l * s[0] * a, y: t.y + o / 3 + c * s[0] * a },
    { x: t.x + 2 * i / 3 + l * s[1] * a, y: t.y + 2 * o / 3 + c * s[1] * a },
    e
  ];
}
function hf([t, e, n, s], i) {
  const o = (u, f) => ({ x: u.x + (f.x - u.x) * i, y: u.y + (f.y - u.y) * i }), r = o(t, e), a = o(e, n), l = o(n, s), c = o(r, a), h = o(a, l);
  return [t, r, c, o(c, h)];
}
function Eo(t, e) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let s = 1; s < e.length - 1; s++) {
    const i = { x: (e[s].x + e[s + 1].x) / 2, y: (e[s].y + e[s + 1].y) / 2 };
    t.quadraticCurveTo(e[s].x, e[s].y, i.x, i.y);
  }
  const n = e[e.length - 1];
  t.lineTo(n.x, n.y);
}
function Tn(t, e, n) {
  const s = t.length;
  if (s < 2) return [];
  const i = [], o = [], r = (a) => e + (n - e) * a / (s - 1);
  return t.forEach((a, l) => {
    const c = t[Math.max(0, l - 1)], h = t[Math.min(s - 1, l + 1)], u = Math.hypot(h.x - c.x, h.y - c.y) || 1, f = r(l) / 2, d = -(h.y - c.y) / u * f, g = (h.x - c.x) / u * f;
    i.push({ x: a.x + d, y: a.y + g }), o.push({ x: a.x - d, y: a.y - g });
  }), [...i, ...o.reverse()];
}
function xi(t, e, n, s) {
  const i = e.length;
  if (i < 2) return;
  const o = Tn(e, n, s), r = (a) => n + (s - n) * a / (i - 1);
  t.beginPath(), t.moveTo(o[0].x, o[0].y);
  for (const a of o.slice(1)) t.lineTo(a.x, a.y);
  t.closePath(), t.fill(), e.forEach((a, l) => {
    l !== 0 && l !== i - 1 && i > 3 || (t.beginPath(), t.arc(a.x, a.y, r(l) / 2, 0, Math.PI * 2), t.fill());
  });
}
function Ee(t, e, n, s, i = 16) {
  const o = { x: 2 * e.x - (t.x + n.x) / 2, y: 2 * e.y - (t.y + n.y) / 2 }, r = [];
  for (let a = 0; a <= i; a++) {
    const l = a / i, c = l < 0.5 ? { x: t.x + (e.x - t.x) * 2 * l, y: t.y + (e.y - t.y) * 2 * l } : { x: e.x + (n.x - e.x) * (2 * l - 1), y: e.y + (n.y - e.y) * (2 * l - 1) }, h = 1 - l, u = {
      x: h * h * t.x + 2 * h * l * o.x + l * l * n.x,
      y: h * h * t.y + 2 * h * l * o.y + l * l * n.y
    };
    r.push({ x: c.x + (u.x - c.x) * s, y: c.y + (u.y - c.y) * s });
  }
  return r;
}
function Ao(t, e, n, s, i, o = 0, r = 1, a = 40) {
  const l = Math.cos(i), c = Math.sin(i);
  return Array.from({ length: a + 1 }, (h, u) => {
    const f = o + Math.PI * 2 * r * u / a, d = Math.cos(f) * n, g = Math.sin(f) * s;
    return { x: t + d * l - g * c, y: e + d * c + g * l };
  });
}
function xa(t, e) {
  return e.look === "pencil" ? pf(t, e) : uf(t, e.ink, e.look);
}
function Fn(t, e, n = !1) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (const s of e.slice(1)) t.lineTo(s.x, s.y);
  n && t.closePath();
}
function uf(t, e, n) {
  const s = n === "silhouette", i = s ? 1.25 : 1;
  return {
    look: n,
    ink: e,
    limb(o, r, a) {
      t.fillStyle = e, xi(t, o, r * i, a * i);
    },
    line(o, r) {
      o.length < 2 || (t.strokeStyle = e, t.lineWidth = r * i, t.lineCap = "round", t.lineJoin = "round", Fn(t, o), t.stroke());
    },
    shape(o, r, a) {
      Fn(t, o, !0), (r !== null || s) && (t.fillStyle = s ? e : r, t.fill()), !(a <= 0) && (t.strokeStyle = e, t.lineWidth = a * i, t.lineJoin = "round", t.stroke());
    },
    ellipse(o, r, a, l, c, h, u) {
      t.beginPath(), t.ellipse(o, r, a, l, c, 0, Math.PI * 2), (h !== null || s) && (t.fillStyle = s ? e : h, t.fill()), !(u <= 0) && (t.strokeStyle = e, t.lineWidth = u * i, t.stroke());
    },
    dot(o, r, a) {
      t.fillStyle = e, t.beginPath(), t.arc(o, r, a * i, 0, Math.PI * 2), t.fill();
    },
    guide() {
    },
    guideEllipse() {
    }
  };
}
function ff(t, e) {
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
  const i = t[t.length - 1], o = n[n.length - 1];
  return Math.hypot(i.x - o.x, i.y - o.y) > e * 0.25 ? n.push(i) : n[n.length - 1] = i, n;
}
function df(t, e) {
  const n = t.length;
  return t.map((s, i) => {
    const o = t[Math.max(0, i - 1)], r = t[Math.min(n - 1, i + 1)], a = Math.hypot(r.x - o.x, r.y - o.y) || 1, l = e(n === 1 ? 0 : i / (n - 1));
    return { x: s.x - (r.y - o.y) / a * l, y: s.y + (r.x - o.x) / a * l };
  });
}
function Po(t) {
  const e = [0.6, 1.4, 2.9].map((s) => ({
    frequency: s * (0.8 + t.next() * 0.4),
    phase: t.next() * Math.PI * 2,
    amount: 0.5 + t.next() * 0.5
  })), n = e.reduce((s, i) => s + i.amount, 0);
  return (s) => e.reduce((i, o) => i + o.amount * Math.sin(Math.PI * 2 * o.frequency * s + o.phase), 0) / n;
}
function pf(t, e) {
  const n = e.pencil ?? {}, s = e.ink, i = n.roughness ?? Math.max(1, e.lineWidth * 0.12), o = Math.max(1, Math.round(n.passes ?? 2)), r = Math.min(1, Math.max(0, n.pressure ?? 0.25)), a = Math.min(1, Math.max(0, n.rubbedOut ?? 0.15)), l = Sa(e.time, n.boil ?? 8);
  let c = 0;
  const h = (g, p, m = !1) => Gn(rn(`${e.seed}:${m ? "paper" : l}:${g}:${p}`)), u = (g, p, m, y, b, w = 0) => {
    if (g.length < 2) return;
    const M = g.slice(1).reduce((_, O, L) => _ + Math.hypot(O.x - g[L].x, O.y - g[L].y), 0);
    let x = ff(g, Math.max(1.5, Math.min(e.lineWidth * 0.8, M / 24)));
    if (w > 0 && x.length >= 2) {
      const [_, O] = [x[x.length - 2], x[x.length - 1]], L = Math.hypot(O.x - _.x, O.y - _.y) || 1;
      x = [...x, { x: O.x + (O.x - _.x) / L * w, y: O.y + (O.y - _.y) / L * w }];
    }
    const v = Po(m), A = Po(m), C = x.length, T = [], H = [];
    x.forEach((_, O) => {
      const L = C === 1 ? 0 : O / (C - 1), W = x[Math.max(0, O - 1)], j = x[Math.min(C - 1, O + 1)], U = Math.hypot(j.x - W.x, j.y - W.y) || 1, P = -(j.y - W.y) / U, R = (j.x - W.x) / U, D = v(L) * b, Y = Math.min(1, L / 0.08, (1 - L) / 0.08), k = (0.55 + 0.45 * Math.sqrt(Math.max(0, Y))) * (1 + r * A(L)), E = Math.max(0.3, p(L) * k / 2), S = _.x + P * D, $ = _.y + R * D;
      T.push({ x: S + P * E, y: $ + R * E }), H.push({ x: S - P * E, y: $ - R * E });
    }), t.save(), t.globalAlpha *= y, t.fillStyle = s, Fn(t, [...T, ...H.reverse()], !0), t.fill(), t.restore();
  }, f = (g, p) => {
    const m = c++, y = h(m, 99, !0);
    if (y.next() < a) {
      const x = (y.next() * 2 - 1) * e.lineWidth * 1.4, v = (y.next() * 2 - 1) * e.lineWidth * 1.4, A = g.map((C) => ({ x: C.x + x, y: C.y + v }));
      u(A, (C) => p(C) * 1.8, h(m, 98, !0), 0.035, i), u(A, (C) => p(C) * 0.45, h(m, 97, !0), 0.12, i * 1.5);
    }
    const b = g.slice(1).reduce((x, v, A) => x + Math.hypot(v.x - g[A].x, v.y - g[A].y), 0), w = p(0.5) > 4 && b > p(0.5) * 6, M = w ? [-0.3, 0.3, 0] : [0];
    for (let x = 0; x < o; x++) {
      const v = x === 0;
      M.forEach((A, C) => {
        const T = h(m, x * 10 + C), H = A === 0 ? g : df(g, (O) => p(O) * A * Math.sqrt(Math.sin(Math.PI * O))), _ = !v && A === 0 ? e.lineWidth * (0.3 + T.next() * 0.8) : 0;
        u(H, (O) => p(O) * (w ? 0.5 : 1) * (v ? 1 : 0.6), T, v ? 0.85 : 0.45, i * (v ? 0.6 : 1), _);
      });
    }
  }, d = (g, p, m, y, b, w) => {
    const x = h(c, 50).next() * Math.PI * 2;
    f(Ao(g, p, m, y, b, x, 1.08, 48), () => w);
  };
  return {
    look: "pencil",
    ink: s,
    limb(g, p, m) {
      f(g, (y) => p + (m - p) * y);
    },
    line(g, p) {
      f(g, () => p);
    },
    shape(g, p, m) {
      p !== null && (t.save(), t.globalAlpha *= 0.88, t.fillStyle = p, Fn(t, g, !0), t.fill(), t.restore()), m > 0 && f([...g, g[0]], () => m);
    },
    ellipse(g, p, m, y, b, w, M) {
      w !== null && (t.save(), t.globalAlpha *= 0.9, t.fillStyle = w, t.beginPath(), t.ellipse(g, p, m, y, b, 0, Math.PI * 2), t.fill(), t.restore()), d(g, p, m, y, b, M);
    },
    dot(g, p, m) {
      t.save(), t.globalAlpha *= 0.9, t.fillStyle = s, t.beginPath(), t.arc(g, p, m, 0, Math.PI * 2), t.fill(), t.restore();
    },
    guide(g) {
      if (n.construction === !1 || g.length < 2) return;
      const p = c++;
      u(g, () => Math.max(0.6, e.lineWidth * 0.18), h(p, 0), 0.28, i * 1.2, e.lineWidth);
    },
    guideEllipse(g, p, m, y, b) {
      if (n.construction === !1) return;
      const w = c++, M = h(w, 0), x = Ao(g, p, m, y, b, M.next() * Math.PI * 2, 1.12, 48);
      u(x, () => Math.max(0.6, e.lineWidth * 0.18), M, 0.28, i * 1.5);
    }
  };
}
const gf = ["thumb", "index", "middle", "ring", "pinky"], ft = {
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
function ut(t = {}) {
  return { ...ft, ...t };
}
const xt = (t, e, n, s, i) => ({
  "thumb.curl": t,
  "index.curl": e,
  "middle.curl": n,
  "ring.curl": s,
  "pinky.curl": i
}), mt = {
  relaxed: ft,
  open: ut({ ...xt(0, 0, 0, 0, 0), "thumb.across": 0, spread: 0.55 }),
  spread: ut({ ...xt(0, 0, 0, 0, 0), "thumb.across": 0, spread: 1 }),
  flat: ut({ ...xt(0, 0, 0, 0, 0), "thumb.across": 0.35, spread: 0 }),
  fist: ut({ ...xt(0.7, 1, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  point: ut({ ...xt(0.75, 0, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  /** The fist on its side, knuckles toward the viewer, the thumb up */
  thumbsUp: ut({ ...xt(0, 1, 1, 1, 1), "thumb.across": 0, spread: 0, roll: 70 }),
  peace: ut({ ...xt(0.75, 0, 0, 1, 1), "thumb.across": 0.9, spread: 1 }),
  ok: ut({ ...xt(0.12, 0.6, 0.1, 0.15, 0.2), "thumb.across": 0.55, spread: 0.6 }),
  pinch: ut({ ...xt(0.1, 0.65, 0.75, 0.85, 0.9), "thumb.across": 0.55, spread: 0 }),
  cupped: ut({ ...xt(0.25, 0.4, 0.4, 0.4, 0.4), "thumb.across": 0.4, spread: 0.05, turn: 2 }),
  wave: ut({ ...xt(0, 0.05, 0.05, 0.1, 0.12), "thumb.across": 0, spread: 0.7, turn: 2 }),
  /** Holding a pencil to write: thumb and middle finger pinch it, the index finger rests on top */
  pencilGrip: ut({ ...xt(0.1, 0.6, 0.72, 0.88, 0.95), "thumb.across": 0.5, spread: 0, turn: 0.8, bend: 10 }),
  /** Holding a handle, a cup or a bar: every finger wrapped round it */
  hold: ut({ ...xt(0.5, 0.7, 0.72, 0.74, 0.76), "thumb.across": 0.75, spread: 0, turn: 1 })
};
function Qe(t, e, n) {
  const s = { ...t };
  for (const [i, o] of Object.entries(e)) {
    const r = t[i] ?? o;
    s[i] = r + (o - r) * n;
  }
  return s;
}
const mf = {
  index: { knuckle: [-0.16, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.125, fan: -1 },
  middle: { knuckle: [-0.055, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.13, fan: -0.2 },
  ring: { knuckle: [0.05, 0.475, -0.02], bones: [0.2, 0.125, 0.1], width: 0.122, fan: 0.55 },
  pinky: { knuckle: [0.15, 0.43, -0.02], bones: [0.16, 0.1, 0.085], width: 0.108, fan: 1.25 }
}, yf = {
  index: { knuckle: [-0.14, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.15, fan: -1 },
  middle: { knuckle: [0, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.155, fan: 0 },
  pinky: { knuckle: [0.14, 0.45, -0.02], bones: [0.19, 0.115, 0.095], width: 0.145, fan: 1 }
}, Lt = {
  base: [-0.11, 0.1, -0.05],
  bones: [0.2, 0.15, 0.12],
  widths: [0.2, 0.145, 0.135],
  /** Where the thumb points with `across` 0 and 1 */
  out: [-0.7, 0.68, -0.22],
  across: [0.35, 0.5, -0.8]
}, bf = [82, 100, 62], wf = [48, 72], kf = 3, vf = 13, Sf = 0.035, xf = -0.075, Mf = [
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
], Ut = (t) => t * Math.PI / 180, Us = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], En = (t, e) => [t[0] * e, t[1] * e, t[2] * e], Vs = (t, e) => [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]], Ce = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function oe(t, e, n) {
  const s = Math.cos(n), i = Math.sin(n), o = Vs(e, t), r = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
  return [
    t[0] * s + o[0] * i + e[0] * r * (1 - s),
    t[1] * s + o[1] * i + e[1] * r * (1 - s),
    t[2] * s + o[2] * i + e[2] * r * (1 - s)
  ];
}
const $o = [1, 0, 0], _o = [0, 1, 0], Xe = [0, 0, 1];
function Tf(t, e, n) {
  const s = Ut(t.fan * (kf + vf * n)), i = [Math.sin(s), Math.cos(s), 0], o = [Math.cos(s), -Math.sin(s), 0], r = [t.knuckle];
  let a = 0;
  t.bones.forEach((h, u) => {
    a += Ut(bf[u] * e), r.push(Us(r[u], En(oe(i, o, -a), h)));
  });
  const l = oe(Xe, o, -a), c = r.map((h, u) => t.width * (1 - 0.14 * (u / (r.length - 1))));
  return { joints: r, back: l, widths: c };
}
function Ef(t, e, n = 1, s = 1) {
  const i = Math.min(1, Math.max(0, e)), o = Ce(Us(En(Ce(Lt.out), 1 - i), En(Ce(Lt.across), i))), r = Ce(Vs(Xe, o)), a = Ce(Vs(o, r)), l = [[Lt.base[0] * s, Lt.base[1], Lt.base[2]]];
  let c = 0;
  Lt.bones.forEach((f, d) => {
    d > 0 && (c += Ut(wf[d - 1] * t)), l.push(Us(l[d], En(oe(o, r, c), f)));
  });
  const h = oe(a, r, c), u = [...Lt.widths, Lt.widths[Lt.widths.length - 1] * 0.92].map((f) => f * n);
  return { joints: l, back: h, widths: u };
}
function zs(t, e = {}) {
  const n = { ...ft, ...t }, s = e.size ?? 100, i = e.side ?? "right", o = i === "left" ? -1 : 1, r = Ut(e.angle ?? 0), a = e.fingers === 4, l = Math.max(0.5, e.plump ?? 1), c = 1 + (l - 1) * 0.7, h = (O) => ({
    ...O,
    knuckle: [O.knuckle[0] * c, O.knuckle[1], O.knuckle[2]],
    width: O.width * l
  }), u = Ut(n.bend ?? 0), f = Ut(n.tilt ?? 0), d = Ut(90 * (n.turn ?? 0)), g = (O) => oe(oe(oe(O, $o, -u), Xe, -f), _o, d), p = Math.cos(r), m = Math.sin(r), y = Ut(n.roll ?? 0), b = Math.cos(y), w = Math.sin(y), M = (O) => {
    const L = O[0] * s, W = -O[1] * s, j = (L * b - W * w) * o, U = L * w + W * b;
    return { x: j * p - U * m, y: j * m + U * p };
  }, x = (O) => {
    const L = M(O), W = Math.hypot(L.x, L.y);
    return W > 1e-6 * s ? { x: L.x / W, y: L.y / W } : { x: 0, y: 0 };
  }, v = {
    thumb: Ef(n["thumb.curl"] ?? 0, n["thumb.across"] ?? 0, l, c)
  }, A = a ? yf : mf;
  for (const O of gf) {
    const L = A[O];
    L && (v[O] = Tf(h(L), n[`${O}.curl`] ?? 0, n.spread ?? 0));
  }
  const C = {};
  for (const [O, L] of Object.entries(v)) {
    const W = L.joints.map(g), j = g(L.back);
    C[O] = {
      points: W.map(M),
      depths: W.map((U) => U[2] * s),
      widths: L.widths.map((U) => U * s),
      nail: j[2],
      back: x(j)
    };
  }
  const T = Mf.flatMap(([O, L]) => [g([O * c, L, Sf]), g([O * c, L, xf])]), H = Pf(T.map(M)), _ = T.reduce((O, L) => O + L[2], 0) / T.length * s;
  return {
    size: s,
    side: i,
    wrist: { x: 0, y: 0 },
    palm: H,
    palmDepth: _,
    palmFacing: -g(Xe)[2],
    fingers: C,
    axes: { up: x(g(_o)), across: x(g($o)), out: x(g(Xe)) },
    curls: Object.fromEntries(Object.keys(C).map((O) => [O, n[`${O}.curl`] ?? 0]))
  };
}
function Af(t, e) {
  const n = (i) => ({ x: i.x + e.x - t.wrist.x, y: i.y + e.y - t.wrist.y }), s = {};
  for (const [i, o] of Object.entries(t.fingers))
    s[i] = { ...o, points: o.points.map(n) };
  return { ...t, wrist: n(t.wrist), palm: t.palm.map(n), fingers: s };
}
function Pf(t) {
  const e = [...t].sort((o, r) => o.x - r.x || o.y - r.y);
  if (e.length < 3) return e;
  const n = (o, r, a) => (r.x - o.x) * (a.y - o.y) - (r.y - o.y) * (a.x - o.x), s = [];
  for (const o of e) {
    for (; s.length >= 2 && n(s[s.length - 2], s[s.length - 1], o) <= 0; ) s.pop();
    s.push(o);
  }
  const i = [];
  for (const o of [...e].reverse()) {
    for (; i.length >= 2 && n(i[i.length - 2], i[i.length - 1], o) <= 0; ) i.pop();
    i.push(o);
  }
  return [...s.slice(0, -1), ...i.slice(0, -1)];
}
const $f = "#f1c9a5", _f = "#2f2f33";
function Mi(t, e, n, s = {}, i = 0) {
  const o = Af(zs(n, s), e), r = s.ink ?? _f, a = s.lineWidth ?? o.size * 0.035, l = s.pen ?? xa(t, {
    look: s.look ?? "clean",
    ink: r,
    lineWidth: a,
    seed: s.seed ?? 1,
    time: i,
    pencil: { construction: !1, ...s.pencil }
  }), c = s.skin ?? $f, h = s.nails ?? !0, u = [
    {
      depth: o.palmDepth,
      draw: () => If(l, o, c, a)
    }
  ];
  for (const f of Object.values(o.fingers)) {
    const d = f.depths.reduce((g, p) => g + p, 0) / f.depths.length;
    u.push({
      depth: d,
      draw: () => Hf(t, l, f, c, a, h)
    });
  }
  if (s.prop) {
    const f = s.prop;
    u.push({ depth: f.depth, draw: () => f.draw(l) });
  }
  t.save(), t.lineCap = "round", t.lineJoin = "round";
  for (const f of [...u].sort((d, g) => d.depth - g.depth)) f.draw();
  return t.restore(), o;
}
function If(t, e, n, s) {
  if (t.shape(e.palm, n, s), e.palmFacing < -0.3 && t.look !== "silhouette") {
    const { up: i } = e.axes;
    for (const [o, r] of Object.entries(e.fingers)) {
      const a = e.curls[o] ?? 0;
      if (o === "thumb" || a < 0.5) continue;
      const l = r.points[0], c = r.widths[0] * 0.42, h = { x: l.x - i.x * c * 0.2, y: l.y - i.y * c * 0.2 }, u = Math.atan2(i.y, i.x), f = Array.from({ length: 7 }, (d, g) => {
        const p = u - Math.PI / 2 + Math.PI * g / 6;
        return { x: h.x + Math.cos(p) * c, y: h.y + Math.sin(p) * c };
      });
      t.line(f, s * 0.6);
    }
  }
  if (e.palmFacing > 0.45 && t.look !== "silhouette") {
    const { up: i, across: o } = e.axes, r = e.size, a = e.wrist, l = (h, u) => ({
      x: a.x + (o.x * h + i.x * u) * r,
      y: a.y + (o.y * h + i.y * u) * r
    }), c = e.side === "left" ? -1 : 1;
    t.line([l(-0.15 * c, 0.36), l(-0.04 * c, 0.3), l(0.1 * c, 0.33)], s * 0.5);
  }
}
function Hf(t, e, n, s, i, o) {
  const { widths: r } = n, a = Cf(n.points, 2), l = n.points[0], c = a[a.length - 1], h = r[0], u = r[r.length - 1];
  if (t.save(), e.look !== "silhouette") {
    t.beginPath(), t.rect(l.x - 1e5, l.y - 1e5, 2e5, 2e5);
    const p = h / 2 + i * 1.6;
    t.moveTo(l.x + p, l.y), t.arc(l.x, l.y, p, 0, Math.PI * 2), t.clip("evenodd");
  }
  if (e.limb(a, h + 2 * i, u + 2 * i), t.restore(), e.look !== "silhouette" && (t.fillStyle = s, xi(t, a, h, u)), e.look === "silhouette" || !o || n.nail < 0.25) return;
  const f = a[a.length - 2], d = Of({ x: c.x - f.x, y: c.y - f.y }) ?? {
    x: 0,
    y: -1
  }, g = {
    x: c.x - d.x * u * 0.22 + n.back.x * u * 0.1,
    y: c.y - d.y * u * 0.22 + n.back.y * u * 0.1
  };
  e.ellipse(g.x, g.y, u * 0.24 * Math.max(0.35, n.nail), u * 0.19, Math.atan2(d.y, d.x), "#f8e3d3", i * 0.45);
}
function Cf(t, e) {
  let n = t;
  for (let s = 0; s < e; s++) {
    if (n.length < 3) return n;
    const i = [n[0]];
    for (let o = 0; o < n.length - 1; o++) {
      const r = n[o], a = n[o + 1];
      o > 0 && i.push({ x: r.x * 0.75 + a.x * 0.25, y: r.y * 0.75 + a.y * 0.25 }), o < n.length - 2 && i.push({ x: r.x * 0.25 + a.x * 0.75, y: r.y * 0.25 + a.y * 0.75 });
    }
    i.push(n[n.length - 1]), n = i;
  }
  return n;
}
const Of = (t) => {
  const e = Math.hypot(t.x, t.y);
  return e > 1e-6 ? { x: t.x / e, y: t.y / e } : null;
}, Ht = {
  walk: { swing: 24, knee: 30, arm: 22, elbow: 28, lean: 4 },
  bouncy: { swing: 26, knee: 45, arm: 34, elbow: 30, lean: 2, bend: -4, bounce: 0.035, squash: 0.06 },
  doubleBounce: { swing: 22, knee: 40, arm: 26, elbow: 24, lean: 3, bounce: 0.02, bounces: 2, squash: 0.04 },
  sneak: { swing: 28, knee: 70, arm: 6, elbow: 0, forearm: 110, shoulder: 55, lean: 16, bend: 14, headTilt: -8, crouch: 50, tiptoe: 25 },
  strut: { swing: 26, knee: 30, arm: 30, elbow: 20, lean: -4, bend: -10, headTilt: -6, sway: 4, bounce: 0.01 },
  tired: { swing: 14, knee: 14, arm: 6, elbow: 6, lean: 10, bend: 16, headTilt: 12 },
  run: { swing: 40, knee: 95, arm: 45, elbow: 0, forearm: 90, lean: 16, bend: 6, bounce: 0.05, squash: 0.06 },
  shove: { swing: 18, knee: 28, arm: 0, elbow: 0, lean: 0 }
}, Rf = 40;
function Qn(t) {
  return t === void 0 ? Ht.walk : typeof t == "string" ? Ht[t] ?? Ht.walk : t;
}
function Lf(t, e, n = z, s = 1) {
  const i = Qn(t);
  if (i === Ht.walk) return Wf(e, n, s);
  const o = e * Math.PI * 2, r = Math.sin(o) * s, a = Math.cos(o) * s, l = (y) => Math.abs(y) <= Rf, c = i.shoulder ?? 0, h = (y, b) => l(y) ? b * c + i.arm * r : y, u = i.forearm ?? 0, f = l(n.leftShoulder) ? n.leftElbow - u - i.elbow * Math.max(0, -r) : n.leftElbow, d = l(n.rightShoulder) ? n.rightElbow + u + i.elbow * Math.max(0, r) : n.rightElbow, g = i.bounces ?? 1, p = (1 + Math.cos(o * 2 * g)) / 2, m = i.crouch ?? 0;
  return {
    ...n,
    lean: n.lean + i.lean * s + (i.sway ?? 0) * Math.sin(o) * (1 - (n.turn ?? 0)),
    bend: (n.bend ?? 0) + (i.bend ?? 0),
    headTilt: n.headTilt - i.lean * 0.5 * s + (i.headTilt ?? 0),
    leftElbow: f,
    rightElbow: d,
    // A crouch brings both thighs forward and folds both shins back.
    leftHip: -i.swing * r - m * 0.5,
    rightHip: -i.swing * r + m * 0.5,
    // The leg swinging forward lifts its knee; a crouch keeps both bent. A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -i.knee * Math.max(0, a) - m,
    rightKnee: i.knee * Math.max(0, -a) + m,
    leftAnkle: (n.leftAnkle ?? 0) + (i.tiptoe ?? 0),
    rightAnkle: (n.rightAnkle ?? 0) + (i.tiptoe ?? 0),
    leftShoulder: h(n.leftShoulder, -1),
    rightShoulder: h(n.rightShoulder, 1),
    rise: (n.rise ?? 0) + (i.bounce ?? 0) * s * p,
    stretch: n.stretch * (1 + (i.squash ?? 0) * (p - 0.5))
  };
}
function Io(t, e, n = 1) {
  const s = Qn(t), i = Ht.walk.swing, o = (r) => Math.sin(r * Math.PI / 180);
  return Bf(e, n) * o(s.swing * n) / o(i * n);
}
const z = {
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
function bt(t) {
  return { ...z, ...t };
}
const Ma = {
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
}, gt = (t) => ({ ...Ma, ...t }), ot = {
  neutral: Ma,
  happy: gt({ smile: 0.9, leftBrow: 0.2, rightBrow: 0.2 }),
  joyful: gt({ mouth: 0.6, smile: 1, mouthWidth: 1.2, leftEye: 0, rightEye: 0, leftBrow: 0.4, rightBrow: 0.4 }),
  sad: gt({ smile: -0.8, leftEye: 0.8, rightEye: 0.8, browTilt: 0.9, leftBrow: -0.1, rightBrow: -0.1, lookY: 0.6 }),
  crying: gt({ mouth: 0.45, smile: -1, leftEye: 0, rightEye: 0, browTilt: 1, lookY: 0.4 }),
  surprised: gt({ mouth: 0.7, mouthWidth: 0.7, leftEye: 1.5, rightEye: 1.5, leftBrow: 1, rightBrow: 1 }),
  shocked: gt({ mouth: 1, mouthWidth: 0.8, leftEye: 1.6, rightEye: 1.6, leftBrow: 1, rightBrow: 1, browTilt: 0.4 }),
  angry: gt({ smile: -0.6, mouthWidth: 0.9, leftEye: 0.8, rightEye: 0.8, leftBrow: -0.6, rightBrow: -0.6, browTilt: -1 }),
  furious: gt({ mouth: 0.5, smile: -1, mouthWidth: 1.3, leftEye: 0.9, rightEye: 0.9, leftBrow: -0.9, rightBrow: -0.9, browTilt: -1 }),
  worried: gt({ smile: -0.3, mouthWidth: 0.8, leftEye: 1.1, rightEye: 1.1, leftBrow: 0.3, rightBrow: 0.3, browTilt: 0.8, lookX: -0.5 }),
  scared: gt({ mouth: 0.35, smile: -0.5, mouthWidth: 0.8, leftEye: 1.45, rightEye: 1.45, leftBrow: 0.8, rightBrow: 0.8, browTilt: 0.9 }),
  confused: gt({ smile: -0.2, mouthWidth: 0.8, leftEye: 0.9, rightEye: 1.15, leftBrow: -0.3, rightBrow: 0.8, lookX: 0.5, lookY: -0.4 }),
  skeptical: gt({ smile: -0.1, leftEye: 0.6, rightEye: 1, leftBrow: -0.4, rightBrow: 0.7, lookX: 0.4 }),
  thinking: gt({ smile: 0, mouthWidth: 0.7, leftBrow: 0.3, rightBrow: 0.5, lookX: 0.6, lookY: -0.8 }),
  sleepy: gt({ smile: 0.1, leftEye: 0.25, rightEye: 0.25, leftBrow: -0.3, rightBrow: -0.3, lookY: 0.5 }),
  disgusted: gt({ smile: -0.7, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.75, leftBrow: -0.5, rightBrow: -0.2, browTilt: -0.4, lookX: -0.6 }),
  smug: gt({ smile: 0.6, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.6, leftBrow: 0.1, rightBrow: 0.5, lookX: 0.5 }),
  wink: gt({ smile: 0.9, leftEye: 0, rightEye: 1, leftBrow: -0.2, rightBrow: 0.3 })
};
function qe(t, e) {
  return { ...t, ...typeof e == "string" ? ot[e] : e };
}
const Kt = {
  rest: z,
  wave: bt({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...ot.happy }),
  cheer: bt({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...ot.joyful }),
  shrug: bt({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...ot.confused, lookX: 0, lookY: 0 }),
  point: bt({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: bt({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...ot.thinking }),
  handsOnHips: bt({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: bt({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...ot.sad }),
  surprised: bt({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...ot.surprised }),
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: bt({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  // Seated, hands resting on the knees. Arm angles spread outward per side, so
  // reaching forward (+x, the way the figure faces) is negative for the left arm.
  sit: bt({ sit: 1, turn: 0.5, leftShoulder: -25, rightShoulder: 25, leftElbow: -55, rightElbow: 55 }),
  jump: bt({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...ot.joyful }),
  // Ducking: squashed low, bent over, arms over the head.
  duck: bt({ stretch: 0.62, bend: 28, headTilt: -8, leftShoulder: 150, rightShoulder: 150, leftElbow: 130, rightElbow: 130, leftHip: 25, rightHip: 25, ...ot.scared }),
  // Lying on its back on the floor (rolled back about the hips and lowered), hands behind the head.
  lie: bt({ spin: -90, rise: -0.42, leftShoulder: 165, rightShoulder: 165, leftElbow: 150, rightElbow: 150, ...ot.sleepy }),
  // Full splits: legs flat along the floor, so the planted feet bring the hips right down to it.
  // Side (straddle) split, seen front-on: each leg straight out to its side, toes pointed.
  sideSplit: bt({ leftHip: 90, rightHip: 90, leftAnkle: -45, rightAnkle: -45, leftShoulder: 120, rightShoulder: 120, leftElbow: 10, rightElbow: 10, ...ot.happy }),
  // Front split, in profile: the left leg forward (+x), the right leg back.
  frontSplit: bt({ turn: 1, leftHip: -90, rightHip: -90, leftAnkle: -45, rightAnkle: -45, leftShoulder: -150, rightShoulder: 150, leftElbow: 10, rightElbow: -10, ...ot.happy })
}, Ta = Object.keys(z);
function tn(t, e, n) {
  const s = { ...t };
  for (const i of Ta) s[i] = t[i] + (e[i] - t[i]) * n;
  return s;
}
const Gs = 24, Ho = 4, Co = 28, Ff = 40;
function Wf(t, e = z, n = 1) {
  const s = Math.sin(t * Math.PI * 2) * n, i = Math.cos(t * Math.PI * 2) * n, o = (c) => Math.abs(c) <= Ff, r = (c) => o(c) ? 22 * s : c, a = o(e.leftShoulder) ? e.leftElbow - Co * Math.max(0, -s) : e.leftElbow, l = o(e.rightShoulder) ? e.rightElbow + Co * Math.max(0, s) : e.rightElbow;
  return {
    ...e,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: e.lean + Ho * n,
    headTilt: e.headTilt - Ho * 0.5 * n,
    leftElbow: a,
    rightElbow: l,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -Gs * s,
    rightHip: -Gs * s,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, i),
    rightKnee: 30 * Math.max(0, -i),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: r(e.leftShoulder),
    rightShoulder: r(e.rightShoulder)
  };
}
function Bf(t, e = 1) {
  return 4 * ((Js + Wn) * t) * Math.sin(Gs * e * Math.PI / 180);
}
function Df(t) {
  const e = Math.abs(Math.sin(t / 65)), n = 0.55 + 0.45 * Math.sin(t / 310);
  return e * n;
}
const Ea = 0.12, Oo = 0.46, Nf = 1 - 2 * Ea, Kf = 0.1, Yf = 0.21, jf = 0.19, Js = 0.24, Wn = 0.22, Aa = 0.12, Xf = 0.14, Pa = 0.33, Ro = 0.7, Lo = 0.3, qf = 0.35, Uf = [1.7, 1.05], Vf = [1.3, 0.75], Fo = [1.45, 0.85], zf = [1.15, 0.75], Wo = 0.06, Gf = 0.7, Jf = 0.65, $a = 0.075, Zf = 0.3, Qf = 0.02, td = 0.012, ed = 12, nd = 0.25, un = 90, sd = 0.25, id = 0.04, _a = 0.01, ne = (t) => Math.min(1, Math.max(0, t ?? 0));
function Vg(t, e = 1) {
  return Wn * t * e;
}
const Zs = -0.12, Ia = 0.4, Pt = (t) => t * Math.PI / 180, od = (t, e) => ({ x: e * Math.sin(Pt(t)), y: Math.cos(Pt(t)) }), Ha = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), Ca = (t, e, n, s) => t - 0.3 * e - n * 0.14 * e - Math.max(0, s - 1) * 0.12 * e;
function rd(t, e, n, s, i, o) {
  const r = Math.max(1, Math.min(o * 0.6, Xf * n)), a = ne(e.turn), l = (Aa + Pa * a) * n, c = s + Zs * n, h = l + e.lookX * 0.08 * n, u = e.lookY * 0.07 * n, f = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * n * (1 - Ro * a), squeeze: 1 - Ro * a, open: e.leftEye, brow: e.leftBrow, side: -1 },
    { x: 0.34 * n * (1 - Lo * a), squeeze: 1 - Lo * a, open: e.rightEye, brow: e.rightBrow, side: 1 }
  ];
  t.fillStyle = i, t.strokeStyle = i, t.lineWidth = r;
  for (const y of f) {
    const b = Ha(y.open, e.blink);
    if (b < 0.2) {
      const v = e.smile > 0.5 ? -0.12 * n : 0.06 * n;
      t.beginPath(), t.moveTo(y.x + l - 0.12 * n, c), t.quadraticCurveTo(y.x + l, c + v, y.x + l + 0.12 * n, c), t.stroke();
    } else {
      if (b > 1.2) {
        const A = 0.13 * n * b;
        t.beginPath(), t.ellipse(y.x + l, c, A * 0.85, A, 0, 0, Math.PI * 2), t.fillStyle = "#ffffff", t.fill(), t.stroke(), t.fillStyle = i;
      }
      const v = b > 1.2 ? 0.075 * n : 0.1 * n;
      t.beginPath(), t.ellipse(y.x + h, c + u, v, v * 1.1 * Math.min(b, 1), 0, 0, Math.PI * 2), t.fill();
    }
    const w = Ca(c, n, y.brow, b), M = y.x + l - y.side * 0.13 * n * y.squeeze, x = y.x + l + y.side * 0.13 * n * y.squeeze;
    t.beginPath(), t.moveTo(x, w), t.lineTo(M, w - e.browTilt * 0.1 * n), t.stroke();
  }
  const d = s + Ia * n, g = 0.25 * n * Math.max(0.3, e.mouthWidth) * (1 - qf * a), p = Math.min(1, Math.max(0, e.mouth));
  if (t.beginPath(), p <= 0.05) {
    t.moveTo(l - g, d), t.quadraticCurveTo(l, d + e.smile * 0.25 * n, l + g, d), t.stroke();
    return;
  }
  const m = 0.3 * n * p;
  e.smile > 0.3 ? (t.moveTo(l - g, d - 0.05 * n), t.lineTo(l + g, d - 0.05 * n), t.quadraticCurveTo(l, d + m * 2, l - g, d - 0.05 * n)) : e.smile < -0.3 ? (t.moveTo(l - g, d + m * 0.6), t.lineTo(l + g, d + m * 0.6), t.quadraticCurveTo(l, d - m * 1.4, l - g, d + m * 0.6)) : t.ellipse(l, d, g * 0.8, m, 0, 0, Math.PI * 2), t.fill();
}
function Oa(t, e) {
  const n = e.height ?? 300, s = Math.min(3, Math.max(0.3, t.stretch ?? 1)), i = Math.sqrt(s), o = (e.headSize ?? 2 * Ea) / 2, r = e.headSize === void 0 ? Nf : 1 - 2 * o, a = o * n, l = ne(t.sit), c = t.leftHip + (-un - t.leftHip) * l, h = t.leftKnee + (-un - t.leftKnee) * l, u = t.rightHip + (un - t.rightHip) * l, f = t.rightKnee + (un - t.rightKnee) * l, d = e.classic === !0, g = ne(t.turn), p = (R, D, Y, k, E) => {
    const S = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.abs(Pt(D - Y) / 2) + Pt(k))), $ = Math.max(-1, Math.min(1, Gf + E)), I = g + (1 - g) * R * $;
    return d ? { x: 0, y: 0 } : { x: Math.cos(S) * Wo * I, y: Math.sin(S) * Wo };
  }, m = { left: t.leftAnkle ?? 0, right: t.rightAnkle ?? 0 }, y = { left: t.leftFootOut ?? 0, right: t.rightFootOut ?? 0 };
  let b = 0;
  if (l > 0 || !d) {
    const R = (E, S, $, I, F) => Js * Math.cos(Pt(S)) + Wn * Math.cos(Pt(S - $)) + Math.max(0, p(E, S, $, I, F).y), D = Math.max(
      R(-1, c, h, m.left, y.left),
      R(1, u, f, m.right, y.right)
    ), Y = 1 - ne((t.rise ?? 0) / id), k = (d ? Math.min(1, l / sd) : 1) * Y;
    b = (Oo - D) * k * n * s;
  }
  const w = -Oo * n * s + b, M = -r * n * s + b, x = d ? 0 : (Qf * ne(t.turn) + td * l) * n * s, v = Pt(t.bend ?? 0), A = { end: Do(w, M, v, 1), bend: v };
  let C;
  if (v !== 0) {
    C = [];
    for (let R = 0; R <= Bo; R++) {
      const D = R / Bo, Y = Do(w, M, v, D);
      C.push({ x: Y.x - x * Math.sin(Math.PI * D), y: Y.y });
    }
  } else
    C = x === 0 ? [{ x: 0, y: w }, { x: 0, y: M }] : Ee({ x: 0, y: w }, { x: -x, y: (w + M) / 2 }, { x: 0, y: M }, 1, 8);
  const T = M + Kf * n * s, H = (e.shoulderWidth ?? 0) * n * Math.cos(g * Math.PI / 2), _ = (R, D, Y, k, E) => {
    const S = od(Y, k);
    return { x: R + S.x * E * n, y: D + S.y * E * n };
  }, O = (R, D, Y) => {
    const k = _(0, w, D, R, Js * s);
    return { root: { x: 0, y: w }, joint: k, end: _(k.x, k.y, D - Y, R, Wn * s) };
  }, L = (R, D, Y) => {
    const k = { x: R * H, y: T }, E = _(k.x, k.y, D, R, Yf * i);
    return { root: k, joint: E, end: _(E.x, E.y, D + Y, R, jf * i) };
  }, W = { left: O(-1, c, h), right: O(1, u, f) }, j = (R, D, Y, k, E, S) => {
    const $ = p(R, Y, k, E, S);
    return { x: D.end.x + $.x * n * s, y: D.end.y + $.y * n * s };
  }, U = (R, D, Y, k, E) => _(D.end.x, D.end.y, Y + k + E, R, $a * i), P = {
    left: L(-1, t.leftShoulder, t.leftElbow),
    right: L(1, t.rightShoulder, t.rightElbow)
  };
  return {
    height: n,
    facing: (e.facing ?? 1) < 0 ? -1 : 1,
    stretch: s,
    lineWidth: e.lineWidth ?? n * 0.025,
    rubber: Math.min(1, Math.max(d ? 0 : Zf, e.rubber ?? 0)),
    r: a,
    // The head keeps its area: taller and narrower when stretched.
    headRx: a / Math.sqrt(s),
    headRy: a * Math.sqrt(s),
    hipY: w,
    neckY: M,
    drop: b,
    lean: d ? t.lean : t.lean + ed * Math.sin(Math.PI * l),
    classic: d,
    legs: W,
    toes: {
      left: j(-1, W.left, c, h, m.left, y.left),
      right: j(1, W.right, u, f, m.right, y.right)
    },
    spine: C,
    chest: A,
    arms: P,
    handTips: {
      left: U(-1, P.left, t.leftShoulder, t.leftElbow, t.leftWrist ?? 0),
      right: U(1, P.right, t.rightShoulder, t.rightElbow, t.rightWrist ?? 0)
    }
  };
}
const Bo = 10;
function Do(t, e, n, s) {
  const i = t - e, o = n * s;
  if (Math.abs(n) < 1e-9) return { x: 0, y: t - i * s };
  const r = i / n;
  return { x: r * (1 - Math.cos(o)), y: t - r * Math.sin(o) };
}
function ad(t, e) {
  if (t.chest.bend === 0) return e;
  const n = en(e, { x: 0, y: t.neckY }, t.chest.bend);
  return { x: n.x + t.chest.end.x, y: n.y + t.chest.end.y - t.neckY };
}
const Ne = (t, e) => e === 0 ? [t.root, t.joint, t.end] : Ee(t.root, t.joint, t.end, e);
function en(t, e, n) {
  const s = Math.cos(n), i = Math.sin(n), o = t.x - e.x, r = t.y - e.y;
  return { x: e.x + o * s - r * i, y: e.y + o * i + r * s };
}
function Ra(t, e, n = !0) {
  const s = cd(t, e), i = e.spin ?? 0, o = e.rise ?? 0;
  return n && (i !== 0 || o !== 0) ? ld(s, t, i, o) : s;
}
function La(t, e, n) {
  return { pivot: { x: 0, y: t.hipY }, angle: t.facing * Pt(e), lift: n * t.height };
}
function ld(t, e, n, s) {
  const { pivot: i, angle: o, lift: r } = La(e, n, s), a = (f) => {
    const d = en(f, i, o);
    return { x: d.x, y: d.y - r };
  }, l = (f) => ({ left: a(f.left), right: a(f.right) }), c = { left: Math.max(a(t.feet.left).y, a(t.toes.left).y), right: Math.max(a(t.feet.right).y, a(t.toes.right).y) }, h = Math.max(c.left, c.right), u = _a * e.height;
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
    handAngle: { left: t.handAngle.left + o, right: t.handAngle.right + o },
    limbs: {
      leftArm: t.limbs.leftArm.map(a),
      rightArm: t.limbs.rightArm.map(a),
      leftLeg: t.limbs.leftLeg.map(a),
      rightLeg: t.limbs.rightLeg.map(a),
      spine: t.limbs.spine.map(a)
    },
    head: { ...t.head, center: a(t.head.center), angle: t.head.angle + o }
  };
}
function cd(t, e) {
  const n = Pt(t.lean), s = Pt(e.headTilt), i = { x: 0, y: t.hipY }, o = (M) => ({ x: t.facing * M.x, y: M.y }), r = (M) => o(en(M, i, n)), a = (M) => r(ad(t, M)), l = (M) => a(en({ x: M.x, y: M.y + t.neckY }, { x: 0, y: t.neckY }, s)), c = Ne(t.arms.left, t.rubber).map(a), h = Ne(t.arms.right, t.rubber).map(a), u = (M, x) => Math.atan2(x.y - M.y, x.x - M.x), f = { left: a(t.handTips.left), right: a(t.handTips.right) }, d = (M, x) => {
    const [v, A] = M.slice(-2), C = t.arms[x], T = u(a(C.end), f[x]) - u(a(C.joint), a(C.end));
    return u(v, A) + T;
  };
  let g = 1 / 0;
  for (const [M, x] of [
    [e.leftBrow, e.leftEye],
    [e.rightBrow, e.rightEye]
  ]) {
    const v = Ca(Zs, 1, M, Ha(x, e.blink));
    g = Math.min(g, v, v - e.browTilt * 0.1);
  }
  const p = { left: o(t.legs.left.end), right: o(t.legs.right.end) }, m = { left: o(t.toes.left), right: o(t.toes.right) }, y = { left: Math.max(p.left.y, m.left.y), right: Math.max(p.right.y, m.right.y) }, b = Math.max(y.left, y.right), w = _a * t.height;
  return {
    facing: t.facing,
    height: t.height,
    stretch: t.stretch,
    lineWidth: t.lineWidth,
    hip: i,
    neck: a({ x: 0, y: t.neckY }),
    shoulders: { left: a(t.arms.left.root), right: a(t.arms.right.root) },
    elbows: { left: a(t.arms.left.joint), right: a(t.arms.right.joint) },
    hands: { left: a(t.arms.left.end), right: a(t.arms.right.end) },
    knees: { left: o(t.legs.left.joint), right: o(t.legs.right.joint) },
    feet: p,
    toes: m,
    feetY: b,
    grounded: { left: y.left >= b - w, right: y.right >= b - w },
    fingertips: f,
    handAngle: { left: d(c, "left"), right: d(h, "right") },
    limbs: {
      leftArm: c,
      rightArm: h,
      leftLeg: Ne(t.legs.left, t.rubber).map(o),
      rightLeg: Ne(t.legs.right, t.rubber).map(o),
      spine: t.spine.map(r)
    },
    head: {
      center: l({ x: 0, y: -t.headRy }),
      rx: t.headRx,
      ry: t.headRy,
      // Mirroring a turn reverses it.
      angle: t.facing * (n + t.chest.bend + s),
      eyeY: Zs,
      browTopY: g,
      mouthY: Ia,
      faceX: t.facing * (Aa + Pa * ne(e.turn))
    }
  };
}
function Zt(t, e = {}) {
  return Ra(Oa(t, e), t);
}
function zg(t, e, n) {
  return en({ x: t.center.x + e * t.rx, y: t.center.y + n * t.ry }, t.center, t.angle);
}
function hd(t, e, n) {
  const s = (o) => ({ x: o.x + e, y: o.y + n }), i = (o) => ({ left: s(o.left), right: s(o.right) });
  return {
    ...t,
    hip: s(t.hip),
    neck: s(t.neck),
    shoulders: i(t.shoulders),
    elbows: i(t.elbows),
    hands: i(t.hands),
    fingertips: i(t.fingertips),
    knees: i(t.knees),
    feet: i(t.feet),
    toes: i(t.toes),
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
function ud(t, e, n = {}, s = 0) {
  const i = Oa(e, n), o = n.color ?? "#1e293b", r = n.layers ?? {}, a = n.layers ? Ra(i, e, !1) : void 0, l = n.sketch ? qs(t, n.sketch, s) : void 0, c = n.sketch && n.layers ? qs(t, n.sketch, s) : void 0, h = (A) => {
    t.save(), A(), t.restore();
  }, u = (A) => {
    A && a && h(() => A(t, a, s, c));
  }, f = () => t.scale(i.facing, 1), d = () => {
    f(), t.translate(0, i.hipY), t.rotate(Pt(i.lean)), t.translate(0, -i.hipY);
  }, g = () => {
    d(), i.chest.bend !== 0 && (t.translate(i.chest.end.x, i.chest.end.y), t.rotate(i.chest.bend), t.translate(0, -i.neckY));
  }, p = (A, C, T) => {
    if (l) return C ? l.curve(A) : l.line(A);
    if (i.classic) {
      t.beginPath(), t.moveTo(A[0].x, A[0].y);
      for (const H of A.slice(1)) t.lineTo(H.x, H.y);
      t.stroke();
      return;
    }
    xi(t, A, T[0] * i.lineWidth, T[1] * i.lineWidth);
  }, m = (A, C) => p(Ne(A, i.rubber), i.rubber > 0, C), y = (A) => {
    i.classic || p([i.legs[A].end, i.toes[A]], !1, zf);
  }, b = (A) => {
    if (n.hands && !i.classic) return M(A);
    if (i.classic || l) return;
    const C = i.arms[A].end;
    t.beginPath(), t.arc(C.x, C.y, Jf * i.lineWidth, 0, Math.PI * 2), t.fill();
  };
  t.save(), t.strokeStyle = o, t.fillStyle = o, t.lineWidth = i.lineWidth, t.lineCap = "round", t.lineJoin = "round";
  const w = La(i, e.spin ?? 0, e.rise ?? 0);
  (w.angle !== 0 || w.lift !== 0) && (t.translate(0, -w.lift), t.translate(w.pivot.x, w.pivot.y), t.rotate(w.angle), t.translate(-w.pivot.x, -w.pivot.y));
  function M(A) {
    const C = n.hands ?? {}, T = i.arms[A].end, H = i.handTips[A], _ = n.headFill ?? "#ffffff";
    Mi(t, T, C[A] ?? ft, {
      side: A,
      // Degrees clockwise from straight up, in the frame the hand is drawn in.
      angle: Math.atan2(H.x - T.x, T.y - H.y) * 180 / Math.PI,
      size: (C.size ?? $a) * i.height * Math.sqrt(i.stretch),
      skin: C.skin ?? (_ === "none" ? void 0 : _),
      ink: o,
      lineWidth: i.lineWidth * 0.45,
      fingers: C.fingers,
      plump: C.plump,
      look: n.sketch ? "pencil" : "clean",
      seed: n.sketch?.seed
    }, s);
  }
  const x = (A) => {
    h(() => {
      g(), m(i.arms[A], Vf), b(A);
    });
    const C = r.sleeve;
    C && a && h(() => C(t, a, A, s, c));
  }, v = ne(e.turn) > nd;
  u(r.behind), h(() => {
    f(), m(i.legs.left, Fo), y("left"), m(i.legs.right, Fo), y("right");
  }), v && x("left"), h(() => {
    d(), p(i.spine, i.spine.length > 2, Uf);
  }), h(() => {
    g();
    const { left: A, right: C } = { left: i.arms.left.root, right: i.arms.right.root };
    if (A.x !== C.x)
      if (i.classic) p([A, C], !1, [1, 1]);
      else {
        const T = { x: (A.x + C.x) / 2, y: A.y - 0.3 * Math.abs(C.x - A.x) };
        p(Ee(A, T, C, 1, 8), !0, [1.1, 1.1]);
      }
  }), u(r.body), v || x("left"), x("right"), u(r.behindHead), h(() => {
    g(), t.translate(0, i.neckY), t.rotate(Pt(e.headTilt));
    const A = -i.headRy;
    t.beginPath(), t.ellipse(0, A, i.headRx, i.headRy, 0, 0, Math.PI * 2);
    const C = n.headFill ?? "#ffffff";
    if (C !== "none" && (t.fillStyle = C, t.fill()), l) {
      l.ellipse(0, A, i.headRx, i.headRy);
      const T = l.nudge();
      t.translate(T.x, T.y);
    } else
      t.stroke();
    t.translate(0, A), t.scale(i.headRx / i.r, i.headRy / i.r), rd(t, e, i.r, 0, o, i.lineWidth);
  }), u(r.overHead), u(r.front), t.restore(), n.label && (t.save(), t.fillStyle = o, t.font = n.labelFont ?? `700 ${Math.round(i.height * 0.11)}px sans-serif`, t.textAlign = "center", t.textBaseline = "bottom", t.fillText(n.label, 0, -i.height * i.stretch - 0.04 * i.height + i.drop), t.restore());
}
function Fa(t, e, n) {
  const s = { ...t };
  let i = t.walking > 0 ? tn(s, Lf(t.gait, t.walk, s), t.walking) : s, o = dd(t);
  const r = t.dancing ?? 0;
  if (n && r > 0) {
    const a = n(t.beat ?? 0);
    if (i = tn(i, a.pose, r), a.hands) {
      const l = (c, h) => h ? Qe(c ?? ft, h, r) : c;
      o = { left: l(o?.left, a.hands.left), right: l(o?.right, a.hands.right) };
    }
  }
  return t.talk > 0 && (i = { ...i, mouth: Math.max(i.mouth, t.talk * Df(e)) }), { pose: i, hands: o };
}
function fd(t, e, n) {
  return Fa(t, e, n).pose;
}
const Wa = (t, e) => (t.facing ?? e.facing ?? 1) < 0 ? -1 : 1, Bn = (t, e) => `hand.${t}.${e}`;
function dd(t) {
  const e = (i) => {
    if (typeof t[Bn(i, "spread")] == "number")
      return Object.fromEntries(Object.keys(ft).map((o) => [o, t[Bn(i, o)]]));
  }, n = e("left"), s = e("right");
  return n || s ? { left: n, right: s } : void 0;
}
function pd(t, e) {
  return !e || !t.hands ? t : { ...t, hands: { ...t.hands, left: e.left ?? t.hands.left, right: e.right ?? t.hands.right } };
}
function gd(t) {
  const e = t.style ?? {}, n = e.height ?? 300, s = n * 0.8, i = { ...bt(t.pose ?? {}), walk: 0, walking: 0, gait: "walk", facing: (e.facing ?? 1) < 0 ? -1 : 1, talk: 0, rubber: e.rubber ?? 0, beat: 0, dancing: 0 }, o = {};
  if (e.hands)
    for (const r of ["left", "right"]) {
      const a = e.hands[r] ?? ft;
      for (const l of Object.keys(ft)) o[Bn(r, l)] = a[l] ?? ft[l];
    }
  return {
    type: "custom",
    x: t.x - s / 2,
    y: t.y - n,
    width: s,
    height: n,
    props: { ...i, ...o },
    about: md(Object.keys(o)),
    figureStyle: e,
    figureDance: t.dance,
    draw(r, a, l) {
      const c = a.props, h = Fa(c, l, t.dance);
      r.translate(s / 2, n), ud(r, h.pose, pd({ ...e, rubber: c.rubber, facing: Wa(c, e) }, h.hands), l);
    }
  };
}
function md(t) {
  const e = { ...ba, ...wa };
  for (const n of t) {
    const [, s, ...i] = n.split("."), o = ka[i.join(".")];
    o && (e[n] = { ...o, description: `${s === "left" ? "Left" : "Right"} hand: ${o.description.toLowerCase()}` });
  }
  return {
    kind: "stick figure",
    summary: "A poseable stick figure: pose it with joint tracks, or give it beats (`scriptTracks`) that compile into acted tracks.",
    props: e,
    // Read when asked: the list is registered by the acting module (see figure-actions).
    get actions() {
      return af();
    }
  };
}
function Ba(t, e, n) {
  const s = t.figureStyle;
  if (!s) throw new Error("stickFigureAt: the target was not made by stickFigureTarget");
  const i = { ...t.props };
  let o = 0, r = 0;
  for (const [c, h] of e.state?.values.get(n) ?? [])
    c === "gait" && typeof h == "string" && (i.gait = h), typeof h == "number" && (c === "x" || c === "motionPathX" ? o = h : c === "y" || c === "motionPathY" ? r = h : c in i && (i[c] = h));
  const a = fd(i, e.time, t.figureDance), l = Zt(a, { ...s, rubber: i.rubber, facing: Wa(i, s) });
  return { pose: a, joints: hd(l, t.x + o + t.width / 2, t.y + r + t.height) };
}
function Da(t) {
  const e = [];
  return t.forEach((n, s) => {
    const i = s === 0 ? z : e[s - 1], o = typeof n.pose == "string" ? Kt[n.pose] : { ...i, ...n.pose };
    e.push(n.expression ? qe(o, n.expression) : o);
  }), e;
}
function Gg(t, e) {
  const n = Da(e);
  return Ta.filter((s) => n.some((i) => i[s] !== z[s])).map((s) => ({
    id: `${t}-${s}`,
    target: t,
    property: s,
    keyframes: e.map((i, o) => ({
      time: i.time,
      value: n[o][s],
      ...i.easing ? { easing: i.easing } : {}
    }))
  }));
}
const ms = 0.5, Qs = {
  /** Flag: fingers together and straight, thumb bent in */
  pataka: ut({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Pataka with the ring finger bent */
  tripataka: ut({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 1, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Lotus in bloom: fingers fanned, each a little more curled than the last */
  alapadma: ut({ "thumb.curl": 0.1, "thumb.across": 0, "index.curl": 0.05, "middle.curl": 0.15, "ring.curl": 0.25, "pinky.curl": 0.35, spread: 1, turn: 2 }),
  /** Fist */
  mushti: mt.fist,
  /** Fist, thumb up */
  shikhara: mt.thumbsUp,
  /** Swan's beak: thumb and index touch, the others fanned */
  hamsasya: ut({ "thumb.curl": 0.15, "thumb.across": 0.6, "index.curl": 0.6, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0.7, turn: 2 }),
  /** Bracelet: thumb, index and middle meet, ring and little finger out */
  katakamukha: ut({ "thumb.curl": 0.2, "thumb.across": 0.6, "index.curl": 0.65, "middle.curl": 0.7, "ring.curl": 0, "pinky.curl": 0, spread: 0.4, turn: 2 })
};
function Dn(t) {
  return typeof t != "string" ? t : t in Qs ? Qs[t] : mt[t];
}
function Na(t, e, n) {
  const s = [];
  for (const i of t.keys) {
    const o = s[s.length - 1], r = !o || i.reset ? { pose: e, ...n } : o;
    s.push({
      beat: i.beat,
      pose: { ...r.pose, ...i.pose },
      left: i.hands?.left ? Dn(i.hands.left) : r.left,
      right: i.hands?.right ? Dn(i.hands.right) : r.right,
      easing: i.easing ?? t.easing
    });
  }
  return s;
}
const Ti = (t, e) => (t % e + e) % e;
function yd(t, e, n, s) {
  const i = Na(t, n, s);
  if (i.length === 0) return { pose: n, hands: s };
  const o = Ti(e, t.beats);
  let r = i.length - 1;
  for (let d = 0; d < i.length; d++) i[d].beat <= o && (r = d);
  const a = i[r], l = i[(r + 1) % i.length], c = a.beat <= o ? a.beat : a.beat - t.beats, h = l.beat > c ? l.beat : l.beat + t.beats, u = h > c ? (o - c) / (h - c) : 0, f = Tt(l.easing ?? "ease-in-out")(Math.min(1, Math.max(0, u)));
  return {
    pose: tn(a.pose, l.pose, f),
    hands: { left: Qe(a.left, l.left, f), right: Qe(a.right, l.right, f) }
  };
}
const bd = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftWrist", "rightWrist"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
  ["leftAnkle", "rightAnkle"],
  ["leftFootOut", "rightFootOut"],
  ["leftEye", "rightEye"],
  ["leftBrow", "rightBrow"]
], wd = ["lean", "headTilt", "lookX", "spin"], kd = /* @__PURE__ */ new Set(["leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee"]);
function vd(t) {
  const e = { ...t }, n = (t.turn ?? 0) >= 0.5;
  for (const [s, i] of bd) {
    const o = n && kd.has(s) ? -1 : 1;
    e[s] = o * t[i], e[i] = o * t[s];
  }
  if (!n) for (const s of wd) e[s] = -t[s];
  return e;
}
const Sd = (t) => Math.min(1, Math.max(-1, (0.5 - t) * 4));
function xd(t, e, n) {
  const s = Ti(n, 1), i = (1 + Math.cos(2 * Math.PI * s)) / 2, o = e.bounce * (e.accent === "up" ? 1 - i : i), r = Math.min(1, Math.max(0, t.turn ?? 0)), a = Sd(r);
  return {
    ...t,
    leftHip: t.leftHip + a * o / 2,
    rightHip: t.rightHip + o / 2,
    leftKnee: t.leftKnee + a * o,
    rightKnee: t.rightKnee + o,
    lean: t.lean + (e.sway ?? 0) * (1 - r) * Math.sin(Math.PI * n)
  };
}
function ti(t) {
  const e = { ...z, ...t.stance };
  return t.expression ? qe(e, t.expression) : e;
}
function Ka(t) {
  return {
    left: t.hands?.left ? Dn(t.hands.left) : ft,
    right: t.hands?.right ? Dn(t.hands.right) : ft
  };
}
function ys(t, e, n) {
  const s = t.moves[e.move];
  if (!s) throw new Error(`dance: "${t.label}" has no move "${e.move}"`);
  const i = yd(s, n, ti(t), Ka(t));
  return e.mirror ? { pose: vd(i.pose), hands: { left: i.hands?.right, right: i.hands?.left } } : i;
}
function Ei(t, e, n = {}) {
  const s = typeof t == "string" ? he[t] : t;
  let i;
  if (n.move)
    i = ys(s, { move: n.move, mirror: n.mirror }, e);
  else {
    const o = s.routine, r = o.reduce((u, f) => u + f.beats, 0), a = Ti(e, r);
    let l = 0, c = 0;
    for (; c < o.length - 1 && a >= l + o[c].beats; ) l += o[c++].beats;
    const h = a - l;
    if (i = ys(s, o[c], h), h < ms && o.length > 1 && e >= ms) {
      const u = o[(c - 1 + o.length) % o.length], f = ys(s, u, u.beats + h), d = Tt("ease-in-out")(h / ms);
      i = {
        pose: tn(f.pose, i.pose, d),
        hands: { left: Qe(f.hands.left, i.hands.left, d), right: Qe(f.hands.right, i.hands.right, d) }
      };
    }
  }
  return { ...i, pose: xd(i.pose, s.groove, e) };
}
function Jg(t, e, n = {}) {
  return Ei(t, e, n).pose;
}
function Ai(t) {
  return (typeof t == "string" ? he[t] : t).routine.reduce((n, s) => n + s.beats, 0);
}
const Md = { leftToe: "rightToe", rightToe: "leftToe", leftHeel: "rightHeel", rightHeel: "leftHeel" };
function No(t, e, n, s, i, o, r) {
  for (let a = 0; a * t.beats < n; a++)
    for (const l of t.keys) {
      const c = a * t.beats + l.beat, h = e + c;
      if (!(c >= n || h < o || h >= r))
        for (const u of l.taps ?? []) i.push({ beat: h, tap: s ? Md[u] : u });
    }
}
function Zg(t, e, n, s = {}) {
  const i = typeof t == "string" ? he[t] : t, o = [];
  if (n <= e) return o;
  if (s.move) {
    const r = i.moves[s.move], a = Math.floor(e / r.beats) * r.beats;
    No(r, a, Math.ceil((n - a) / r.beats) * r.beats, s.mirror, o, e, n);
  } else {
    const r = Ai(i);
    for (let a = Math.floor(e / r) * r; a < n; a += r) {
      let l = a;
      for (const c of i.routine)
        No(i.moves[c.move], l, c.beats, c.mirror, o, e, n), l += c.beats;
    }
  }
  return o.sort((r, a) => r.beat - a.beat);
}
function Ko(t, e) {
  const n = t.moves[e.move];
  if (!n?.travel) return 0;
  const s = n.travel / n.beats;
  return e.mirror ? (Na(n, ti(t), Ka(t))[0]?.pose.turn ?? ti(t).turn ?? 0) >= 0.5 ? s : -s : s;
}
function Ya(t, e) {
  return e.move ? [{ move: e.move, beats: t.moves[e.move].beats, mirror: e.mirror }] : t.routine;
}
function bs(t, e, n = {}) {
  const s = typeof t == "string" ? he[t] : t, i = Ya(s, n), o = i.reduce((h, u) => h + u.beats, 0), r = i.reduce((h, u) => h + Ko(s, u) * u.beats, 0), a = Math.floor(e / o);
  let l = a * r, c = e - a * o;
  for (const h of i) {
    const u = Math.min(h.beats, c);
    if (l += Ko(s, h) * u, c -= u, c <= 0) break;
  }
  return l;
}
function Td(t, e, n) {
  const s = Ya(t, n), i = [0];
  let o = 0;
  for (let r = 0; o < e; r = (r + 1) % s.length)
    o += s[r].beats, i.push(Math.min(o, e));
  return i;
}
const Ed = 8;
function Ad(t, e, n) {
  const s = typeof e == "string" ? he[e] : e, i = n.bpm ?? s.bpm, o = n.beats ?? (n.move ? s.moves[n.move].beats : Ai(s)), r = Td(s, o, n);
  if (r.every((y) => bs(s, y, n) === 0)) return;
  const a = Math.min(n.fade ?? 1, o / 2), l = Tt("ease-in-out"), c = (y) => a <= 0 ? 1 : Math.min(l(Math.min(1, y / a)), l(Math.min(1, (o - y) / a))), h = Math.ceil(a * Ed), u = a <= 0 ? [] : Array.from({ length: h + 1 }, (y, b) => [b / h * a, o - b / h * a]).flat(), f = [.../* @__PURE__ */ new Set([...r, ...u])].sort((y, b) => y - b);
  let d = 0;
  const g = f.map((y, b) => {
    if (b > 0) {
      const w = f[b - 1], M = Math.max(1, Math.ceil((y - w) * 16));
      for (let x = 0; x < M; x++) {
        const v = w + (y - w) * x / M, A = w + (y - w) * (x + 1) / M;
        d += (bs(s, A, n) - bs(s, v, n)) * c((v + A) / 2);
      }
    }
    return { beat: y, travel: d };
  }), p = n.start ?? 0, m = n.x ?? 0;
  return {
    id: `${t}-x`,
    target: t,
    property: "x",
    keyframes: g.map((y) => ({ time: p + y.beat * 6e4 / i, value: m + n.height * y.travel, easing: "linear" }))
  };
}
function Qg(t, e, n = 0) {
  return (t - n) * e / 6e4;
}
function tm(t, e = {}) {
  return (n) => Ei(t, n, e);
}
function em(t, e) {
  const n = e.start ?? 0, s = 6e4 / e.bpm, i = n + e.beats * s, o = Math.min((e.fade ?? 1) * s, (i - n) / 2);
  return [
    {
      id: `${t}-beat`,
      target: t,
      property: "beat",
      keyframes: [
        { time: n, value: 0 },
        { time: i, value: e.beats, easing: "linear" }
      ]
    },
    {
      id: `${t}-dancing`,
      target: t,
      property: "dancing",
      keyframes: [
        { time: n, value: 0 },
        { time: n + o, value: 1, easing: "ease-in-out" },
        { time: i - o, value: 1 },
        { time: i, value: 0, easing: "ease-in-out" }
      ]
    }
  ];
}
function nm(t, e, n = {}) {
  const s = typeof e == "string" ? he[e] : e, i = n.bpm ?? s.bpm, o = n.beats ?? (n.move ? s.moves[n.move].beats : Ai(s)), r = n.samplesPerBeat ?? 4, a = n.start ?? 0, l = Math.round(o * r), c = Array.from({ length: l + 1 }, (p, m) => {
    const y = m / r;
    return { time: a + y * 6e4 / i, frame: Ei(s, y, n) };
  }), h = (p, m) => ({
    id: `${t}-${p}`,
    target: t,
    property: p,
    keyframes: c.map((y) => ({ time: y.time, value: m(y.frame) }))
  }), f = Object.keys(z).filter((p) => c.some((m) => m.frame.pose[p] !== c[0].frame.pose[p]) || c[0].frame.pose[p] !== z[p]).map((p) => h(p, (m) => m.pose[p])), d = n.height === void 0 ? void 0 : Ad(t, s, { ...n, bpm: i, beats: o, start: a, height: n.height, fade: 0 });
  if (d && f.push(d), n.hands === !1) return f;
  const g = [];
  for (const p of ["left", "right"])
    for (const m of Object.keys(ft)) {
      const y = (b) => b.hands?.[p]?.[m] ?? ft[m];
      c.some((b) => y(b.frame) !== ft[m]) && g.push(h(Bn(p, m), y));
    }
  return [...f, ...g];
}
const Ue = { type: "back", mode: "out", overshoot: 1.1 }, vt = "ease-out-cubic", Pd = {
  label: "Disco",
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 6, rightKnee: 6 },
  expression: { smile: 0.9, mouth: 0.15, leftBrow: 0.3, rightBrow: 0.3 },
  groove: { bounce: 10, accent: "down", sway: 2 },
  moves: {
    point: {
      label: "The point",
      beats: 2,
      easing: vt,
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
        { beat: 0, pose: { lean: -10, rightHip: 22, leftHip: 4, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: vt },
        { beat: 1, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: "flat", right: "flat" } },
        { beat: 2, pose: { lean: 10, rightHip: 4, leftHip: 22, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: vt },
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
}, $d = {
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
}, _d = {
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
        { beat: 0, pose: { rightHip: -24, rightKnee: 10, leftHip: 10, leftShoulder: 80, leftElbow: 40, rightShoulder: 55, rightElbow: -50, lean: 6, headTilt: -6 }, easing: vt },
        { beat: 1, reset: !0, pose: { leftHip: 18, rightHip: 18 } },
        { beat: 2, pose: { leftHip: -24, leftKnee: 10, rightHip: 10, rightShoulder: 80, rightElbow: 40, leftShoulder: 55, leftElbow: -50, lean: -6, headTilt: 6 }, easing: vt },
        { beat: 3, reset: !0, pose: { leftHip: 18, rightHip: 18 } }
      ]
    },
    kick: {
      label: "Kick out",
      beats: 2,
      keys: [
        { beat: 0, pose: { rightHip: 72, rightKnee: 4, rightAnkle: -20, leftHip: 4, lean: -12, leftShoulder: 100, leftElbow: 20 }, easing: vt },
        { beat: 1, reset: !0 }
      ]
    },
    freeze: {
      label: "B-boy stance",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 26, leftElbow: -122, rightShoulder: 22, rightElbow: -118, leftHip: 18, rightHip: 18, leftKnee: 6, rightKnee: 6, lean: -4, headTilt: 10, smile: 0.6, leftEye: 0.6, rightEye: 0.6 }, easing: Ue },
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
}, Id = {
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
        hands: e === 0 ? { left: { ...mt.spread, turn: 2 }, right: { ...mt.spread, turn: 2 } } : void 0
      }))
    },
    kickBallChange: {
      label: "Kick ball change",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 88, rightKnee: 0, rightAnkle: 55, leftHip: 4, lean: -12, leftShoulder: 112, rightShoulder: 112, leftWrist: 15, rightWrist: 15 }, hands: { left: "flat", right: "flat" }, easing: vt },
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
}, Hd = {
  label: "K-pop",
  bpm: 125,
  stance: { leftHip: 9, rightHip: 9, leftKnee: 4, rightKnee: 4 },
  expression: "happy",
  groove: { bounce: 5, accent: "down" },
  moves: {
    pointCombo: {
      label: "Point combo",
      beats: 4,
      easing: Ue,
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
        { beat: 0, reset: !0, pose: { leftShoulder: 165, rightShoulder: 165, leftElbow: 46, rightElbow: 46, headTilt: -8, lean: -4 }, hands: { left: "cupped", right: "cupped" }, easing: Ue },
        { beat: 1, pose: { headTilt: 8, lean: 4 } },
        { beat: 2, reset: !0, pose: { rightShoulder: 32, rightElbow: 112, rightWrist: 10, leftShoulder: 20, leftElbow: -30, headTilt: 10, leftEye: 0, smile: 1 }, hands: { right: "pinch", left: "relaxed" }, easing: Ue },
        { beat: 3, pose: { headTilt: 4 } }
      ]
    },
    isolations: {
      label: "Isolations",
      beats: 2,
      easing: vt,
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
}, Cd = {
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
        { beat: 0, reset: !0, pose: { rightShoulder: 160, rightElbow: 12, rightWrist: -15, leftShoulder: 40, leftElbow: -12, leftWrist: -45, lean: -4, rightHip: 16, lookX: 0.5, lookY: -0.6 }, hands: { right: { ...mt.cupped, roll: -30 }, left: { ...mt.flat, turn: 0 } } },
        { beat: 0.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...mt.cupped, roll: 30 } } },
        { beat: 1, pose: { rightWrist: -15, rightElbow: 12, leftWrist: -45, lean: -4, rightHip: 16, leftHip: 6 }, hands: { right: { ...mt.cupped, roll: -30 } } },
        { beat: 1.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...mt.cupped, roll: 30 } } }
      ]
    },
    thumka: {
      label: "Thumka",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { lean: -11, rightHip: 22, leftHip: 2, leftKnee: 14, rightShoulder: 45, rightElbow: -105, leftShoulder: 128, leftElbow: 18, leftWrist: 35, headTilt: 10, lookX: -0.5 }, hands: { right: "fist", left: { ...mt.open, turn: 2 } }, easing: vt },
        { beat: 0.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } },
        { beat: 1, pose: { lean: -11, rightHip: 22, headTilt: 10 }, easing: vt },
        { beat: 1.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } }
      ]
    },
    flick: {
      label: "Cross and flick",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26 }, hands: { left: "fist", right: "fist" } },
        { beat: 1, pose: { leftShoulder: 132, rightShoulder: 132, leftElbow: 0, rightElbow: 0, leftWrist: 30, rightWrist: 30, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10, stretch: 1.03 }, hands: { left: "spread", right: "spread" }, easing: vt },
        { beat: 2, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftWrist: 0, rightWrist: 0, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26, stretch: 1 }, hands: { left: "fist", right: "fist" } },
        { beat: 3, pose: { leftShoulder: 62, rightShoulder: 62, leftElbow: 0, rightElbow: 0, leftWrist: 35, rightWrist: 35, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10 }, hands: { left: "spread", right: "spread" }, easing: vt }
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
}, Od = {
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
}, Rd = { leftHip: 42, rightHip: 42, leftKnee: 82, rightKnee: 82, leftFootOut: 0.3, rightFootOut: 0.3 }, Ld = {
  label: "Bharatanatyam",
  bpm: 80,
  // Natyarambhe: arms out at shoulder height, hands raised in pataka.
  stance: { ...Rd, leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0, leftWrist: 75, rightWrist: 75 },
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
}, Fd = {
  label: "Charleston",
  bpm: 150,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 10, rightKnee: 10, leftShoulder: 30, rightShoulder: 30, leftElbow: 20, rightElbow: 20 },
  expression: { mouth: 0.4, smile: 1, leftBrow: 0.5, rightBrow: 0.5 },
  hands: { left: { ...mt.spread, turn: 2 }, right: { ...mt.spread, turn: 2 } },
  groove: { bounce: 8, accent: "down" },
  moves: {
    basic: {
      label: "Kick forward, kick back",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 48, rightKnee: 8, rightAnkle: 45, leftShoulder: 75, rightShoulder: 15, leftElbow: 30, rightElbow: -10, lean: -7, headTilt: -5 }, easing: vt },
        { beat: 1, reset: !0 },
        { beat: 2, reset: !0, pose: { leftHip: 18, leftKnee: 85, leftAnkle: 35, rightShoulder: 75, leftShoulder: 15, rightElbow: 30, leftElbow: -10, lean: 7, headTilt: 5 }, easing: vt },
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
}, Wd = {
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
        { beat: 1, pose: { rightShoulder: 135, leftShoulder: 125, leftElbow: 0, rightElbow: 0, leftWrist: 0, rightWrist: 30, rightKnee: 8, leftKnee: -8, rightHip: 4, leftHip: -4 }, hands: { left: { ...mt.spread, turn: 2 }, right: { ...mt.spread, turn: 2 } } },
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
}, Bd = {
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
          easing: Ue
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
}, he = {
  disco: Pd,
  hipHop: $d,
  breaking: _d,
  jazz: Id,
  kpop: Hd,
  bollywood: Cd,
  bhangra: Od,
  bharatanatyam: Ld,
  charleston: Fd,
  tap: Wd,
  popping: Bd
}, Nn = (t) => Math.min(1, Math.max(0, t));
function Dd(t) {
  const e = { ...z, turn: t.view }, n = [];
  for (const s of t.keys) {
    const i = n[n.length - 1], o = !i || s.reset ? e : i.pose;
    n.push({ at: s.at, pose: { ...o, ...s.pose }, easing: s.easing });
  }
  return n;
}
function Nd(t) {
  return t - Kd * Math.sin(2 * Math.PI * t) / (2 * Math.PI);
}
const Kd = 0.5;
function Yd(t, e) {
  if (!(e <= t.takeoff || e >= t.landing))
    return (e - t.takeoff) / (t.landing - t.takeoff);
}
function jd(t, e) {
  const n = typeof t == "string" ? ts[t] : t, s = Dd(n), i = Nn(e);
  let o = 0;
  for (let u = 0; u < s.length; u++) s[u].at <= i && (o = u);
  const r = s[o], a = s[Math.min(o + 1, s.length - 1)], l = a.at > r.at ? (i - r.at) / (a.at - r.at) : 0, c = tn(r.pose, a.pose, Tt(a.easing ?? "ease-in-out")(Nn(l))), h = Yd(n, i);
  return h === void 0 ? { ...c, spin: 0, rise: 0 } : {
    ...c,
    spin: n.spin * Nd(h),
    rise: 4 * n.height * h * (1 - h)
  };
}
function Xd(t, e, n) {
  const s = typeof t == "string" ? ts[t] : t, i = Nn(e), o = Nn((i - s.takeoff) / (s.landing - s.takeoff));
  return s.travel * n * o;
}
function sm(t, e, n = {}) {
  const s = typeof e == "string" ? ts[e] : e, i = n.start ?? 0, o = n.duration ?? s.duration, r = n.samples ?? 48, a = Array.from({ length: r + 1 }, (h, u) => {
    const f = u / r;
    return { time: i + f * o, progress: f, pose: jd(s, f) };
  }), c = Object.keys(z).filter((h) => a.some((u) => u.pose[h] !== z[h])).map((h) => ({
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
      keyframes: a.map((u) => ({ time: u.time, value: (n.x ?? 0) + h * Xd(s, u.progress, n.height) }))
    });
  }
  return c;
}
const qd = {
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
}, Ud = {
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
}, fn = {
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
}, Vd = {
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
}, zd = {
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
function fe(t, e, n, s, i, o = 1300) {
  return {
    label: t,
    view: 1,
    spin: e,
    height: n,
    travel: s,
    takeoff: 0.27,
    landing: 0.8,
    duration: o,
    keys: [
      { at: 0, reset: !0 },
      { at: 0.16, pose: qd },
      { at: 0.27, pose: Ud, easing: "ease-out-quad" },
      ...i,
      { at: 0.76, pose: Vd },
      { at: 0.86, pose: zd, easing: "ease-out-quad" },
      { at: 1, reset: !0 }
    ]
  };
}
const ts = {
  frontFlip: fe("Front flip (tuck)", 360, 0.56, 0.35, [
    { at: 0.38, pose: fn, easing: "ease-out-cubic" },
    { at: 0.64, pose: fn }
  ]),
  backFlip: fe("Back flip (tuck)", -360, 0.58, -0.15, [
    { at: 0.36, pose: { ...fn, lean: 18 }, easing: "ease-out-cubic" },
    { at: 0.64, pose: { ...fn, lean: 18 } }
  ]),
  layout: fe("Back layout (straight body)", -360, 0.66, -0.2, [
    // Arched, arms overhead, legs together and long.
    { at: 0.4, pose: { leftHip: 8, rightHip: -8, leftKnee: 0, rightKnee: 0, leftAnkle: 60, rightAnkle: 60, leftShoulder: -178, rightShoulder: 178, lean: -18, headTilt: -14 } },
    { at: 0.64, pose: { leftHip: -4, rightHip: 4, lean: -6, headTilt: -4, leftShoulder: -150, rightShoulder: 150 } }
  ], 1400),
  scissorFlip: fe("Scissor flip", 360, 0.6, 0.45, [
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
  splitLeap: fe("Split leap (grand jeté)", 0, 0.36, 0.9, [
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
  backHandspring: fe("Back handspring", -360, 0.16, -0.7, [
    // Arms reach back overhead to the ground, legs snap over.
    { at: 0.38, pose: { leftHip: 10, rightHip: -10, leftKnee: 0, rightKnee: 0, leftShoulder: -178, rightShoulder: 178, lean: -26, headTilt: -20 } },
    { at: 0.6, pose: { leftHip: -40, rightHip: 40, leftKnee: -20, rightKnee: 20, lean: 6, headTilt: 0 } }
  ], 1200)
}, ws = 0.215, ks = 0.205, Gd = 0.065, Yo = 0.035, Jd = 0.165, Zd = 0.155, Qd = 12, t0 = 0.3, e0 = 0.7, n0 = 0.35, s0 = (t) => t * Math.PI / 180, dt = {
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
  lookY: 0
};
function At(t = {}) {
  return { ...dt, ...t };
}
const i0 = /* @__PURE__ */ new Set(["turn", "side", "head.turn", "head.tilt", "roll", "lookX"]);
function im(t) {
  const e = {};
  for (const [n, s] of Object.entries(t)) {
    const i = n.replace(/(^|\.)(left|right)(\.|$)/, (o, r, a, l) => `${r}${a === "left" ? "right" : "left"}${l}`);
    e[i] = i0.has(n) ? -s : s;
  }
  return e;
}
function Et(t, e) {
  const n = {};
  for (const s of ["left", "right"]) for (const [i, o] of Object.entries(e)) n[`${t}.${s}.${i}`] = o;
  return n;
}
const ja = {
  rest: dt,
  wave: At({ "arm.right.spread": 115, "arm.right.bend": 55, "arm.right.elbow": 0, "head.tilt": -6, smile: 0.9 }),
  cheer: At({ ...Et("arm", { spread: 140, bend: 20, elbow: 0 }), mouth: 0.6, smile: 1, "eye.left": 0, "eye.right": 0 }),
  point: At({ "arm.right.spread": 88, "arm.right.elbow": 0, "arm.right.bend": 0, "head.turn": -20, smile: 0.4 }),
  handsOnHips: At({ ...Et("arm", { spread: 50, bend: -105, elbow: 0 }), ...Et("leg", { spread: 9 }), smile: 0.8 }),
  think: At({ "arm.right.spread": 22, "arm.right.bend": -150, "arm.right.elbow": 0, "head.tilt": 10, lookX: -0.5, lookY: -0.8, smile: 0 }),
  shrug: At({ ...Et("arm", { spread: 35, bend: 75, elbow: 0 }), "head.tilt": -10, smile: -0.2 }),
  sit: At({ ...Et("leg", { swing: 90, knee: 90, spread: 4 }), ...Et("arm", { swing: 25, elbow: 45, spread: 8 }) }),
  kneel: At({
    "leg.left.swing": 90,
    "leg.left.knee": 90,
    // The back thigh leans back a little so its knee meets the ground beside the
    // front foot; the shin slopes up from it and the foot points down to tucked toes.
    "leg.right.swing": -18,
    "leg.right.knee": 108,
    "leg.right.ankle": 16,
    ...Et("arm", { swing: 20, elbow: 30 })
  }),
  crouch: At({ ...Et("leg", { swing: 75, knee: 140, spread: 6 }), lean: 25, ...Et("arm", { swing: 50, elbow: 40 }), "head.nod": -15 }),
  // On hands and knees: the back nearly level, arms straight down, the toes
  // pointed back along the ground.
  crawl: At({ lean: 82, "head.nod": -35, ...Et("arm", { swing: 80, elbow: 0, spread: 4 }), ...Et("leg", { knee: 92, ankle: -88 }) }),
  lieDown: At({ roll: 90, ...Et("arm", { spread: 8 }), "head.nod": 0 })
};
function o0(t = {}) {
  const e = t.headSize ?? 0.3, n = t.shoulderWidth ?? 0.06, s = t.hipWidth ?? 0.022, i = Math.max(0.12, 1 - e - Yo - (ws + ks)), o = (l) => ({
    id: `arm.${l}`,
    parent: "spine",
    offset: [(l === "left" ? 1 : -1) * n, -0.035, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: Jd, width: [1.25, 0.9] },
      { length: Zd, width: [0.9, 0.75] }
    ]
  }), r = (l) => ({
    id: `leg.${l}`,
    parent: null,
    offset: [(l === "left" ? 1 : -1) * s, 0, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: ws, width: [1.45, 1.05] },
      { length: ks, width: [1.05, 0.85] },
      { length: Gd, width: [0.95, 0.7] }
    ]
  }), a = (l, c) => l[c] ?? dt[c] ?? 0;
  return {
    id: "human",
    hipHeight: ws + ks,
    // Tie order: legs, then the body, then the arms (in front of the chest unless turned away), then the head.
    chains: [
      r("left"),
      r("right"),
      {
        id: "spine",
        parent: null,
        rest: [0, 1, 0],
        bones: [
          { length: i / 2, width: [1.7, 1.4] },
          { length: i / 2, width: [1.4, 1.1] }
        ]
      },
      { id: "neck", parent: "spine", rest: [0, 1, 0], bones: [{ length: Yo, width: [1, 0.9] }] },
      o("left"),
      o("right")
    ],
    head: { on: "neck", size: e },
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
        const p = -a(l, "lean") / 2, m = a(l, "side") / 2, y = -a(l, "bend");
        return [
          { swing: p + y * t0, spread: m },
          { swing: p + y * e0, spread: m }
        ];
      }
      if (c.id === "neck") return [{ swing: -a(l, "bend") * n0, spread: 0 }];
      const [h, u] = c.id.split("."), f = (p) => a(l, `${h}.${u}.${p}`);
      if (h === "arm")
        return [
          { swing: f("swing"), spread: f("spread") },
          { swing: f("elbow"), spread: f("bend") }
        ];
      const d = (c.side ?? 1) * f("rotate"), g = 1 - Math.cos(s0(f("rotate")));
      return [
        { swing: f("swing"), spread: f("spread"), yaw: d },
        { swing: -f("knee"), spread: 0, yaw: d },
        // The foot points forward, square to the shin, turned out a little (more with `toeOut`).
        { swing: 90 + f("ankle") - g * (f("swing") - f("knee")), spread: 0, yaw: (Qd + f("toeOut")) * (c.side ?? 1) }
      ];
    },
    withAngles(l, c, h) {
      const [u, f] = c.id.split("."), d = (g) => `${u}.${f}.${g}`;
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
function om(t) {
  const e = t.split(".");
  if (e[0] === "hand" && e.length >= 3) {
    const s = `${e[1] === "left" ? "Left" : "Right"} hand`, i = { spread: "finger spread", turn: "wrist turn", bend: "wrist bend", tilt: "wrist tilt", roll: "roll" }, o = e.slice(2).join(".");
    return `${s} · ${i[o] ?? o.replace(".curl", " curl").replace(".across", " across")}`;
  }
  if (e.length === 3) {
    const [s, i, o] = e;
    return `${`${i === "left" ? "Left" : "Right"} ${s}`} · ${{
      swing: "forward / back",
      spread: "out / in",
      elbow: "elbow bend",
      bend: "forearm out / in",
      knee: "knee bend",
      ankle: "foot tilt",
      toeOut: "toes out / in",
      rotate: "turn out at the hip"
    }[o] ?? o}`;
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
    lookY: "Look up / down"
  }[t] ?? t;
}
const r0 = {
  leftEye: "eye.left",
  rightEye: "eye.right",
  leftBrow: "brow.left",
  rightBrow: "brow.right"
}, Xa = Object.fromEntries(
  Object.entries(ot).map(([t, e]) => [
    t,
    Object.fromEntries(Object.entries(e).map(([n, s]) => [r0[n] ?? n, s]))
  ])
);
function rm(t, e) {
  const n = Math.min(1, Math.max(0, t.turn ?? 0)), s = 1 - n, i = { ...dt, turn: n }, o = [
    { stick: "right", human: "left", s: 1 },
    { stick: "left", human: "right", s: -1 }
  ];
  for (const { stick: a, human: l, s: c } of o) {
    const h = t[`${a}Shoulder`], u = t[`${a}Elbow`];
    i[`arm.${l}.spread`] = h * s, i[`arm.${l}.swing`] = c * h * n, i[`arm.${l}.bend`] = u * s, i[`arm.${l}.elbow`] = c * u * n;
    const f = t[`${a}Hip`], d = t[`${a}Knee`], g = s + c * n;
    i[`leg.${l}.rotate`] = 90 * s, i[`leg.${l}.spread`] = 0, i[`leg.${l}.swing`] = f * g, i[`leg.${l}.knee`] = d * g, i[`leg.${l}.ankle`] = -(t[`${a}Ankle`] ?? 0), i[`leg.${l}.toeOut`] = (t[`${a}FootOut`] ?? 0) * a0, i[`eye.${l}`] = t[`${a}Eye`], i[`brow.${l}`] = t[`${a}Brow`], e && Object.assign(i, l0(l, e[a] ?? ft, t[`${a}Wrist`] ?? 0, n));
  }
  const r = t.bend ?? 0;
  i.lean = t.lean * n, i.bend = r * n, i.side = (t.lean + r * 0.5) * s, i["head.tilt"] = (t.headTilt + r * 0.5) * s, i["head.nod"] = t.headTilt * n;
  for (const a of ["mouth", "smile", "mouthWidth", "blink", "browTilt", "lookX", "lookY", "stretch"]) i[a] = t[a];
  return i.lift = t.rise ?? 0, i.roll = t.spin ?? 0, i;
}
const a0 = 70;
function l0(t, e, n, s) {
  const i = t === "right" ? 1 - s : 1 + s, o = {};
  for (const r of Object.keys(ft)) o[`hand.${t}.${r}`] = e[r] ?? ft[r];
  return o[`hand.${t}.turn`] = (e.turn ?? 0) - i, o[`hand.${t}.roll`] = (e.roll ?? 0) + n, o;
}
const It = (t) => t * Math.PI / 180;
function qa([t, e, n], s) {
  const i = Math.cos(s), o = Math.sin(s);
  return [t, e * i + n * o, -e * o + n * i];
}
function Pi([t, e, n], s) {
  const i = Math.cos(s), o = Math.sin(s);
  return [t * i - e * o, t * o + e * i, n];
}
function le([t, e, n], s) {
  const i = Math.cos(s), o = Math.sin(s);
  return [t * i + n * o, e, -t * o + n * i];
}
const Gt = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], Kn = (t, e) => [t[0] * e, t[1] * e, t[2] * e], An = (t, e) => Pi(qa(t, e.swing), e.spread);
function vs(t, e) {
  const n = le(t, e);
  return { point: { x: n[0], y: -n[1] }, depth: n[2] };
}
function $i(t, e, n) {
  const s = n, o = [0, t.hipHeight * s * (t.boneScale?.(e, null) ?? 1), 0], r = {};
  for (const p of t.chains) {
    const m = p.parent ? r[p.parent] : void 0;
    if (p.parent && !m) throw new Error(`body plan ${t.id}: chain ${p.id} comes before its parent ${p.parent}`);
    const y = p.at ?? (m ? m.joints3.length - 1 : 0), b = m ? m.joints3[y] : o, w = m ? m.frames[Math.max(0, y - 1)] : { swing: 0, spread: 0 }, M = p.offset ? Gt(b, An(Kn(p.offset, s), w)) : b, x = p.side ?? 1, v = t.boneScale?.(e, p) ?? 1, A = t.angles(e, p), C = [M], T = [];
    let H = w.swing, _ = w.spread;
    p.bones.forEach((O, L) => {
      const W = A[L] ?? { swing: 0, spread: 0 };
      H += It(W.swing), _ += It(W.spread) * x, T.push({ swing: H, spread: _ });
      const j = le(An(p.rest, { swing: H, spread: _ }), It(W.yaw ?? 0));
      C.push(Gt(C[L], Kn(j, O.length * s * v)));
    }), r[p.id] = { joints3: C, frames: T };
  }
  const a = r[t.head.on], l = t.headPose?.(e) ?? { yaw: 0, nod: 0, tilt: 0, sx: 1, sy: 1 }, c = a.frames[a.frames.length - 1], h = t.head.size / 2 * s, u = h * l.sx, f = h * l.sy, d = (p) => An(le(qa(Pi(p, -It(l.tilt)), -It(l.nod)), It(l.yaw)), c), g = Gt(a.joints3[a.joints3.length - 1], d([0, f, 0]));
  return { height: s, root: o, chains: r, head: { center: g, rx: u, ry: f, toBody: d } };
}
function _i(t, e, n) {
  const s = n.height, i = It(90 * (e.turn ?? 0)), o = $i(t, e, s), { root: r } = o, a = o.chains, { rx: l, ry: c } = o.head, h = o.head.toBody, u = o.head.center, f = {};
  for (const T of t.chains) {
    const { joints3: H, frames: _ } = a[T.id], O = H.map((L) => vs(L, i));
    f[T.id] = {
      id: T.id,
      joints3: H,
      frames: _,
      points: O.map((L) => L.point),
      depths: O.map((L) => L.depth)
    };
  }
  const d = vs(u, i), g = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((T) => le(h(T), i)), p = vs(r, i).point, m = It(e.roll ?? 0), y = (T) => {
    const H = T.x - p.x, _ = T.y - p.y;
    return { x: p.x + H * Math.cos(m) - _ * Math.sin(m), y: p.y + H * Math.sin(m) + _ * Math.cos(m) };
  }, b = ([T, H, _]) => [T * Math.cos(m) + H * Math.sin(m), -T * Math.sin(m) + H * Math.cos(m), _];
  for (const T of Object.values(f)) T.points = T.points.map(y);
  const w = {
    center: y(d.point),
    depth: d.depth,
    rx: l,
    ry: c,
    angle: 0,
    axes: g.map(b)
  }, M = w.axes[1];
  w.angle = Math.atan2(M[0], M[1]);
  const x = (T) => {
    if ("head" in T) return { x: w.center.x + M[0] * c, y: w.center.y - M[1] * c };
    const H = f[T.chain];
    return H.points[Math.min(T.joint, H.points.length - 1)];
  };
  let v = 0;
  (n.contact ?? "ground") === "ground" && (v = -Math.max(...t.contacts.map((T) => x(T).y))), v -= (e.lift ?? 0) * s;
  const A = (T) => ({ x: T.x, y: T.y + v });
  for (const T of Object.values(f)) T.points = T.points.map(A);
  w.center = A(w.center);
  const C = t.contacts.map((T) => ({ spec: T, point: x(T) }));
  return {
    height: s,
    view: i,
    chains: f,
    head: w,
    hip: A(y(p)),
    contacts: C,
    groundY: Math.max(...C.map((T) => T.point.y))
  };
}
const ei = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], Ua = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function Va(t, e, n) {
  const s = n.height, i = It(90 * (e.turn ?? 0)), o = It(e.roll ?? 0), r = $i(t, e, s), a = le(r.root, i), l = (m) => Gt(Pi(ei(le(m, i), a), -o), a), c = {};
  for (const m of t.chains) c[m.id] = r.chains[m.id].joints3.map(l);
  const h = l(r.head.center), u = (m) => Ua(ei(l(Gt(r.head.center, r.head.toBody(m))), h)), f = [u([1, 0, 0]), u([0, 1, 0]), u([0, 0, 1])], d = (m) => {
    if ("head" in m) return Gt(h, Kn(f[1], r.head.ry));
    const y = c[m.chain];
    return y[Math.min(m.joint, y.length - 1)];
  };
  let g = 0;
  (n.contact ?? "ground") === "ground" && (g = -Math.min(...t.contacts.map((m) => d(m)[1]))), g += (e.lift ?? 0) * s;
  const p = (m) => [m[0], m[1] + g, m[2]];
  return {
    height: s,
    hip: p(a),
    chains: Object.fromEntries(Object.entries(c).map(([m, y]) => [m, y.map(p)])),
    head: { center: p(h), rx: r.head.rx, ry: r.head.ry, axes: f }
  };
}
function za(t, e, n, s) {
  const i = n.height, o = It(90 * (e.turn ?? 0)), r = $i(t, e, i), a = Va(t, e, n), l = a.hip, c = a.chains, h = a.head.center, u = (T) => {
    if ("head" in T) return Gt(h, Kn(a.head.axes[1], a.head.ry));
    const H = c[T.chain];
    return H[Math.min(T.joint, H.length - 1)];
  }, f = s.toView(l), d = s.toScreen(f), g = s.toScreen([f[0] + 1, f[1], f[2]]), p = Math.hypot(g.x - d.x, g.y - d.y), m = (T) => {
    const H = s.toView(T);
    return { point: s.toScreen(H), depth: H[2] * p };
  }, y = {};
  for (const T of t.chains) {
    const H = c[T.id].map(m);
    y[T.id] = {
      id: T.id,
      joints3: r.chains[T.id].joints3,
      frames: r.chains[T.id].frames,
      points: H.map((_) => _.point),
      depths: H.map((_) => _.depth)
    };
  }
  const b = s.toView(h), w = s.toScreen(b), M = s.toScreen([b[0] + 1, b[1], b[2]]), x = Math.hypot(M.x - w.x, M.y - w.y), v = a.head.axes.map((T) => Ua(ei(s.toView(Gt(h, T)), b))), A = {
    center: w,
    depth: b[2] * p,
    rx: r.head.rx * x,
    ry: r.head.ry * x,
    angle: Math.atan2(v[1][0], v[1][1]),
    axes: v
  }, C = t.contacts.map((T) => ({ spec: T, point: m(u(T)).point }));
  return {
    height: i * p,
    view: o,
    chains: y,
    head: A,
    hip: d,
    contacts: C,
    groundY: Math.max(...C.map((T) => T.point.y))
  };
}
function Ga(t, [e, n, s]) {
  const [i, o, r] = t.axes, a = [
    i[0] * e * t.rx + o[0] * n * t.ry + r[0] * s * t.rx,
    i[1] * e * t.rx + o[1] * n * t.ry + r[1] * s * t.rx,
    i[2] * e * t.rx + o[2] * n * t.ry + r[2] * s * t.rx
  ], l = Math.hypot(e, n, s) || 1, c = (i[2] * e + o[2] * n + r[2] * s) / l;
  return { point: { x: t.center.x + a[0], y: t.center.y - a[1] }, depth: t.depth + a[2], facing: c };
}
class Ja {
  positions = [];
  normals = [];
  indices = [];
  /** Add a vertex; returns its index. */
  vertex(e, n, s, i, o, r) {
    const a = Math.hypot(i, o, r) || 1;
    return this.positions.push(e, n, s), this.normals.push(i / a, o / a, r / a), this.positions.length / 3 - 1;
  }
  /** Add a triangle, counter-clockwise seen from its front. */
  triangle(e, n, s) {
    this.indices.push(e, n, s);
  }
  /** Add a quad a-b-c-d (counter-clockwise) as two triangles. */
  quad(e, n, s, i) {
    this.indices.push(e, n, s, e, s, i);
  }
  build() {
    return { positions: this.positions, normals: this.normals, indices: this.indices };
  }
}
function c0(t) {
  const e = /* @__PURE__ */ new Map(), n = [];
  for (let i = 0; i < t.positions.length / 3; i++) {
    const o = [0, 1, 2].map((r) => Math.round(t.positions[i * 3 + r] * 1e6)).join(",");
    e.has(o) || e.set(o, i), n.push(e.get(o));
  }
  const s = /* @__PURE__ */ new Map();
  for (let i = 0; i < t.indices.length / 3; i++)
    for (let o = 0; o < 3; o++) {
      const r = n[t.indices[i * 3 + o]], a = n[t.indices[i * 3 + (o + 1) % 3]];
      if (r === a) continue;
      const l = r < a ? `${r}-${a}` : `${a}-${r}`, c = s.get(l);
      c ? c.faces.push(i) : s.set(l, { a: Math.min(r, a), b: Math.max(r, a), faces: [i] });
    }
  return [...s.values()];
}
const Ii = Math.PI * 2;
function h0(t, e = 16) {
  const n = new Ja(), s = Math.max(6, Math.round(e)), i = Math.max(3, Math.round(s / 2)), o = [];
  for (let r = 0; r <= i; r++) {
    const a = r / i * Math.PI, l = [];
    for (let c = 0; c <= s; c++) {
      const h = c / s * Ii, u = Math.sin(a) * Math.sin(h), f = Math.cos(a), d = Math.sin(a) * Math.cos(h);
      l.push(n.vertex(u * t, f * t, d * t, u, f, d));
    }
    o.push(l);
  }
  for (let r = 0; r < i; r++)
    for (let a = 0; a < s; a++) {
      const l = o[r][a], c = o[r + 1][a], h = o[r + 1][a + 1], u = o[r][a + 1];
      r > 0 && n.triangle(l, c, u), r < i - 1 && n.triangle(c, h, u);
    }
  return n.build();
}
function jo(t, e, n, s, i) {
  const o = t.vertex(0, n, 0, 0, s, 0), r = Array.from({ length: i }, (a, l) => {
    const c = l / i * Ii;
    return t.vertex(Math.sin(c) * e, n, Math.cos(c) * e, 0, s, 0);
  });
  for (let a = 0; a < i; a++) {
    const l = r[a], c = r[(a + 1) % i];
    s === 1 ? t.triangle(o, l, c) : t.triangle(o, c, l);
  }
}
function u0(t, e, n = 24) {
  const s = new Ja(), i = Math.max(6, Math.round(n)), o = e / 2, r = -e / 2, a = (h) => Array.from({ length: i + 1 }, (u, f) => {
    const d = f / i * Ii;
    return s.vertex(Math.sin(d) * t, h, Math.cos(d) * t, Math.sin(d), 0, Math.cos(d));
  }), l = a(r), c = a(o);
  for (let h = 0; h < i; h++) s.quad(l[h], l[h + 1], c[h + 1], c[h]);
  return jo(s, t, o, 1, i), jo(s, t, r, -1, i), s.build();
}
function Xo(t) {
  const e = Array.from({ length: t.indices.length / 3 }, () => []);
  for (const n of c0(t))
    for (const s of n.faces) {
      const i = n.faces.find((o) => o !== s) ?? -1;
      e[s].push({ a: n.a, b: n.b, across: i });
    }
  return { ...t, faceEdges: e };
}
const dn = (t) => t * 180 / Math.PI, de = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], Ss = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2], Ke = (t) => Math.hypot(t[0], t[1], t[2]), ni = (t) => {
  const e = Ke(t) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}, pn = (t) => Math.atan2(Math.sin(t), Math.cos(t));
function qo(t) {
  const [e, n, s] = ni(t);
  return { swing: Math.asin(Math.max(-1, Math.min(1, s))), spread: Math.atan2(e, -n) };
}
function f0(t, e, n, s, i) {
  const o = t.chains.find((H) => H.id === n);
  if (!o) throw new Error(`reach: no chain ${n} in ${t.id}`);
  if (o.bones.length < 2 || o.rest[1] > -0.99) throw new Error(`reach: ${n} is not a hanging limb of two bones or more`);
  if (!t.withAngles) throw new Error(`reach: the ${t.id} plan cannot set angles`);
  const r = _i(t, { ...e, turn: 0, roll: 0, lift: 0 }, { height: i.height, contact: "none" }), a = r.chains[n], l = a.joints3[0], c = Ke(de(a.joints3[1], a.joints3[0])), h = Ke(de(a.joints3[2], a.joints3[1])), u = o.parent ? r.chains[o.parent].frames[Math.max(0, (o.at ?? r.chains[o.parent].joints3.length - 1) - 1)] : { swing: 0, spread: 0 }, f = de(s, l), d = Math.min(c + h - 1e-6, Math.max(Math.abs(c - h) + 1e-6, Ke(f))), g = ni(f), p = o.parent !== null, m = An(o.pole ?? (p ? [0, -0.35, -1] : [0, 0, 1]), u);
  let y = de(m, [g[0] * Ss(m, g), g[1] * Ss(m, g), g[2] * Ss(m, g)]);
  Ke(y) < 1e-6 && (y = le([1, 0, 0], 0)), y = ni(y);
  const b = (c * c + d * d - h * h) / (2 * c * d), w = Math.sqrt(Math.max(0, 1 - b * b)), M = [
    l[0] + c * (b * g[0] + w * y[0]),
    l[1] + c * (b * g[1] + w * y[1]),
    l[2] + c * (b * g[2] + w * y[2])
  ], x = [l[0] + g[0] * d, l[1] + g[1] * d, l[2] + g[2] * d], v = o.side ?? 1, A = qo(de(M, l)), C = qo(de(x, M)), T = [
    { swing: dn(pn(A.swing - u.swing)), spread: dn(pn(A.spread - u.spread)) * v },
    { swing: dn(pn(C.swing - A.swing)), spread: dn(pn(C.spread - A.spread)) * v }
  ];
  return t.withAngles(e, o, T);
}
const d0 = 0.34, jt = 0.12, Ot = -0.4, Ft = (t, e, n) => t[e] ?? n, p0 = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), g0 = 0.45, m0 = 0.35, y0 = 0.7;
function Yn(t, e, n) {
  const s = (d) => Math.sqrt(Math.max(0, 1 - d.x * d.x - d.y * d.y)), i = Ga(t, [n.x, n.y, s(n)]).facing, o = t.axes[2], r = Math.atan2(o[0], o[2]), a = Math.cos(r), l = a >= 0 ? 1 : -1, c = l * Math.max(m0, Math.abs(a)), h = l * Math.max(y0, Math.abs(a)), u = Math.cos(t.angle), f = Math.sin(t.angle);
  return {
    facing: i,
    points: e.map((d) => {
      const g = g0 * Math.sin(r) + n.x * c + (d.x - n.x) * h, p = d.y + o[1] * s(d), m = g * t.rx, y = p * t.ry;
      return { x: t.center.x + m * u + y * f, y: t.center.y + m * f - y * u };
    })
  };
}
const gn = (t, e, n, s = 12) => Array.from({ length: s + 1 }, (i, o) => {
  const r = o / s, a = 1 - r;
  return { x: a * a * t.x + 2 * a * r * e.x + r * r * n.x, y: a * a * t.y + 2 * a * r * e.y + r * r * n.y };
}), xs = (t, e, n, s, i = 16) => Array.from({ length: i }, (o, r) => {
  const a = Math.PI * 2 * r / i;
  return { x: t + Math.cos(a) * n, y: e + Math.sin(a) * s };
}), Uo = 0.05;
function b0(t, e, n, s) {
  const i = Math.max(1, Math.min(s * 0.6, 0.14 * e.rx)), o = (y, b) => Yn(e, y, b).points, r = (y, b) => Yn(e, [], { x: y, y: b }).facing, a = Ft(n, "smile", 0), l = Ft(n, "blink", 0), c = Ft(n, "lookX", 0), h = Ft(n, "lookY", 0), u = Ft(n, "browTilt", 0);
  for (const y of [1, -1]) {
    const b = y === 1 ? "left" : "right", w = d0 * y;
    if (r(w, jt) < Uo) continue;
    const M = { x: w, y: jt }, x = p0(Ft(n, `eye.${b}`, 1), l);
    if (x < 0.2) {
      const T = a > 0.5 ? 0.12 : -0.06;
      t.line(o(gn({ x: w - 0.12, y: jt }, { x: w, y: jt + T }, { x: w + 0.12, y: jt }), M), i);
    } else {
      if (x > 1.2) {
        const O = 0.13 * x;
        t.shape(o(xs(w, jt, O * 0.85, O), M), "#ffffff", i);
      }
      const T = x > 1.2 ? 0.075 : 0.1, H = w + c * 0.08, _ = jt - h * 0.07;
      t.shape(o(xs(H, _, T, T * 1.1 * Math.min(x, 1)), M), t.ink, 0);
    }
    const v = jt + 0.3 + Ft(n, `brow.${b}`, 0) * 0.14 + Math.max(0, x - 1) * 0.12, A = { x: w + y * 0.13, y: v }, C = { x: w - y * 0.13, y: v + u * 0.1 };
    t.line(o([A, { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 }, C], { x: w, y: v }), i);
  }
  const f = { x: 0, y: Ot };
  if (r(0, Ot) < -Uo) return;
  const d = 0.25 * Math.max(0.3, Ft(n, "mouthWidth", 1)), g = Math.min(1, Math.max(0, Ft(n, "mouth", 0)));
  if (g <= 0.05) {
    t.line(o(gn({ x: -d, y: Ot }, { x: 0, y: Ot - a * 0.25 }, { x: d, y: Ot }), f), i);
    return;
  }
  const p = 0.3 * g;
  let m;
  if (a > 0.3) {
    const y = Ot + 0.05;
    m = [...gn({ x: d, y }, { x: 0, y: Ot - p * 2 }, { x: -d, y })];
  } else if (a < -0.3) {
    const y = Ot - p * 0.6;
    m = [...gn({ x: d, y }, { x: 0, y: Ot + p * 1.4 }, { x: -d, y })];
  } else
    m = xs(0, Ot, d * 0.8, p);
  t.shape(o(m, f), t.ink, 0);
}
function w0(t = {}) {
  const e = (t.proportions ?? "bold") === "bold", n = t.figure ?? "fluid", s = t.look ?? "clean", i = t.height ?? 300, o = n === "stick";
  return {
    plan: t.plan ?? o0({
      headSize: t.headSize ?? (e ? 0.3 : 0.24),
      shoulderWidth: o ? 0 : t.shoulderWidth ?? 0.06,
      hipWidth: o ? 0 : t.hipWidth ?? 0.022
    }),
    figure: n,
    look: s,
    height: i,
    lineWidth: t.lineWidth ?? i * (e ? 0.045 : 0.022),
    ink: t.ink ?? (s === "pencil" ? "#2f2f33" : "#1e293b"),
    skin: t.skin ?? (s === "pencil" ? "none" : "#ffffff"),
    seed: t.seed ?? 1,
    pencil: t.pencil ?? {},
    layers: t.layers ?? {},
    contact: t.contact ?? "ground",
    hands: t.hands ?? "dot",
    handStyle: t.handStyle ?? "glove",
    handSize: t.handSize ?? (t.handStyle === "natural" ? 0.14 : 0.17)
  };
}
function am(t, e, n, s) {
  const { point: i, facing: o } = Ga(t, [e, n, s]);
  return { point: i, facing: o };
}
const si = (t) => t.rest[1] < -0.5, k0 = 0.3;
function v0(t, e, n) {
  return t.figure === "stick" ? si(e) ? n.slice(0, 3) : n : si(e) && n.length >= 3 ? Ee(n[0], n[1], n[2], k0) : n.length === 3 ? Ee(n[0], n[1], n[2], 1) : n;
}
function Hi(t, e) {
  const n = t.plan.id === "human" ? { ...dt, ...e } : e;
  return Ci(t, n, _i(t.plan, n, { height: t.height, contact: t.contact }));
}
function Ci(t, e, n) {
  const s = {}, i = {}, o = {}, r = 0.01 * t.height;
  t.plan.chains.forEach((f) => {
    const d = n.chains[f.id];
    s[f.id] = d.points;
    const g = d.depths.reduce((b, w) => b + w, 0) / d.depths.length, p = f.parent ? n.chains[f.parent] : void 0, m = p ? p.depths[f.at ?? p.depths.length - 1] : 0, y = g - m;
    o[f.id] = Math.abs(y) < r ? 0 : y, i[f.id] = { points: v0(t, f, d.points), depth: g };
  }), i.head = { points: [n.head.center], depth: n.head.depth }, o.head = 0;
  const a = [...t.plan.chains.map((f) => f.id), "head"], l = [...a].sort((f, d) => o[f] - o[d] || a.indexOf(f) - a.indexOf(d)), c = { hip: n.hip };
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
    parts: i,
    head: n.head,
    groundY: n.groundY,
    grounded: h
  };
  return { skeleton: n, joints: u, order: l };
}
function S0(t, e) {
  return Hi(t, e).joints;
}
function x0(t, e, n) {
  const { head: s } = n;
  t.guideEllipse(s.center.x, s.center.y, s.rx * 1.03, s.ry * 1.03, s.angle);
  const i = Array.from({ length: 13 }, (l, c) => ({ x: 0, y: -0.95 + 1.9 * c / 12 })), o = Array.from({ length: 13 }, (l, c) => ({ x: -0.95 + 1.9 * c / 12, y: 0.12 })), r = Yn(s, i, { x: 0, y: 0 });
  r.facing > 0 && t.guide(r.points), t.guide(Yn(s, o, { x: 0, y: 0.12 }).points), t.guide(n.chains.spine ?? []);
  const a = e.lineWidth * 0.9;
  for (const l of ["shoulder.left", "shoulder.right", "elbow.left", "elbow.right", "hip.left", "hip.right", "knee.left", "knee.right"]) {
    const c = n.points[l];
    c && t.guideEllipse(c.x, c.y, a, a, 0);
  }
}
function M0(t, e, n, s, i, o) {
  const r = n.lineWidth;
  if (i === "head") {
    const { head: d } = s, g = n.skin === "none" ? null : n.skin;
    e.ellipse(d.center.x, d.center.y, d.rx, d.ry, d.angle, g, r), e.look !== "silhouette" && b0(e, d, o, r);
    return;
  }
  const a = n.plan.chains.find((d) => d.id === i), l = s.chains[i], c = s.parts[i].points;
  if (n.figure === "stick") {
    if (i === "neck") return;
    const d = i === "spine" ? [...l, ...s.chains.neck?.slice(1) ?? []] : c;
    e.line(d, r);
    return;
  }
  const h = (d, g) => [a.bones[d].width[0] * r, a.bones[g].width[1] * r];
  if (si(a)) {
    const [d, g] = h(0, 1);
    if (e.limb(c, d, g), a.bones.length >= 3)
      e.limb([l[2], l[3]], a.bones[2].width[0] * r, a.bones[2].width[1] * r);
    else if (n.hands === "cartoon" && i.startsWith("arm."))
      E0(t, e, n, l, i.endsWith(".left") ? "left" : "right", o);
    else {
      const p = l[l.length - 1];
      e.dot(p.x, p.y, r * 0.62);
    }
    return;
  }
  if (i === "spine") {
    const d = s.points["hip.left"], g = s.points["hip.right"];
    d && g && Math.hypot(d.x - g.x, d.y - g.y) > 0.5 && e.limb([d, g], r * 1.3, r * 1.3);
    const [p, m] = h(0, a.bones.length - 1);
    e.limb(c, p, m);
    const y = s.points["shoulder.left"], b = s.points["shoulder.right"];
    y && b && Math.hypot(y.x - b.x, y.y - b.y) > 0.5 && e.limb(Ee(y, l[l.length - 1], b, 1, 10), r * 1.15, r * 1.15);
    return;
  }
  const [u, f] = h(0, a.bones.length - 1);
  e.limb(c, u, f);
}
function T0(t, e) {
  const n = `hand.${e}.`, s = {};
  for (const [r, a] of Object.entries(t)) r.startsWith(n) && (s[r.slice(n.length)] = a);
  const i = t.turn ?? 0, o = e === "right" ? 1 - i : 1 + i;
  return { ...ft, ...s, turn: o + (s.turn ?? 0) };
}
function E0(t, e, n, s, i, o) {
  const r = s[s.length - 1], a = s[s.length - 2], l = Math.atan2(r.x - a.x, -(r.y - a.y)) * 180 / Math.PI;
  Mi(t, r, T0(o, i), {
    size: n.handSize * n.height,
    side: i,
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
function A0(t, e, n, s = 0) {
  const i = e.plan.id === "human" ? { ...dt, ...n } : n;
  Qa(t, e, i, Hi(e, i), s);
}
function Za(t, e) {
  const n = e / t.height;
  return { ...t, height: e, lineWidth: t.lineWidth * n };
}
function lm(t, e, n, s) {
  const i = t.plan.id === "human" ? { ...dt, ...e } : e, o = za(t.plan, i, { height: s.height, contact: t.contact }, n);
  return Ci(Za(t, o.height), i, o).joints;
}
function P0(t, e, n, s, i) {
  const o = e.plan.id === "human" ? { ...dt, ...n } : n, r = za(e.plan, o, { height: i.height, contact: e.contact }, s), a = Za(e, r.height);
  Qa(t, a, o, Ci(a, o, r), i.time ?? 0);
}
function Qa(t, e, n, s, i) {
  const { joints: o, order: r } = s, a = xa(t, {
    look: e.look,
    ink: e.ink,
    lineWidth: e.lineWidth,
    seed: e.seed,
    time: i,
    pencil: e.pencil
  }), l = (c) => {
    c && (t.save(), c(t, o, a, i), t.restore());
  };
  t.save(), t.lineCap = "round", t.lineJoin = "round", e.look === "pencil" && e.pencil.construction !== !1 && x0(a, e, o), l(e.layers.behind);
  for (const c of r) {
    const h = e.layers.parts?.[c];
    l(h?.under), M0(t, a, e, o, c, n), l(h?.over);
  }
  l(e.layers.front), t.restore();
}
function cm(t, e, n) {
  const s = { ...t };
  for (const [i, o] of Object.entries(e)) {
    const r = t[i] ?? o;
    s[i] = r + (o - r) * n;
  }
  return s;
}
function hm(t, e, n, s) {
  const i = t.plan.id === "human" ? { ...dt, ...e } : e;
  let o;
  if (Array.isArray(s))
    o = s;
  else {
    const { skeleton: r } = Hi(t, i), a = _i(t.plan, { ...i, roll: 0 }, { height: t.height, contact: "none" }), l = (i.roll ?? 0) * Math.PI / 180, c = s.x - r.hip.x, h = s.y - r.hip.y, u = a.hip.x + c * Math.cos(-l) - h * Math.sin(-l), f = a.hip.y + c * Math.sin(-l) + h * Math.cos(-l), d = Math.PI / 2 * (i.turn ?? 0), g = s.depth ?? r.chains[n].depths[r.chains[n].depths.length - 1], p = Math.cos(d), m = Math.sin(d);
    o = [u * p - g * m, -f, u * m + g * p];
  }
  return f0(t.plan, i, n, o, { height: t.height });
}
function um(t) {
  const { character: e } = t, n = e.height * 0.8, s = e.height, i = e.plan.id === "human" ? dt : {};
  return {
    type: "custom",
    x: t.x - n / 2,
    y: t.y - s,
    width: n,
    height: s,
    props: { ...i, ...t.pose },
    character: e,
    draw(o, r, a) {
      o.translate(n / 2, s), A0(o, e, r.props, a);
    }
  };
}
function $0(t, e, n) {
  const s = (o) => ({ x: o.x + e, y: o.y + n }), i = (o) => Object.fromEntries(Object.entries(o).map(([r, a]) => [r, a.map(s)]));
  return {
    ...t,
    points: Object.fromEntries(Object.entries(t.points).map(([o, r]) => [o, s(r)])),
    chains: i(t.chains),
    parts: Object.fromEntries(Object.entries(t.parts).map(([o, r]) => [o, { ...r, points: r.points.map(s) }])),
    head: { ...t.head, center: s(t.head.center) },
    groundY: t.groundY + n
  };
}
function fm(t, e, n) {
  const s = t.character;
  if (!s) throw new Error("characterAt: the target was not made by characterTarget");
  const i = { ...t.props };
  let o = 0, r = 0;
  for (const [l, c] of e.state?.values.get(n) ?? [])
    typeof c == "number" && (l === "x" || l === "motionPathX" ? o = c : l === "y" || l === "motionPathY" ? r = c : l in i && (i[l] = c));
  const a = S0(s, i);
  return { pose: i, joints: $0(a, t.x + o + t.width / 2, t.y + r + t.height) };
}
function tl(t, e = dt) {
  const n = [];
  return t.forEach((s, i) => {
    const o = i === 0 ? e : n[i - 1], r = typeof s.pose == "string" ? ja[s.pose] : void 0;
    n.push(r ? { ...r, turn: o.turn ?? 0 } : { ...o, ...s.pose });
  }), n;
}
function dm(t, e, n = dt) {
  const s = tl(e, n);
  return Object.keys(n).filter((o) => s.some((r) => (r[o] ?? n[o]) !== n[o])).map((o) => ({
    id: `${t}-${o}`,
    target: t,
    property: o,
    keyframes: e.map((r, a) => ({
      time: r.time,
      value: s[a][o] ?? n[o],
      ...r.easing ? { easing: r.easing } : {}
    }))
  }));
}
const _0 = /* @__PURE__ */ new Set([
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
]), I0 = 1.7;
function H0(t, e, n) {
  const s = Array.from({ length: 24 }, (i, o) => {
    const r = o / 24 * Math.PI * 2, a = e.toView([Math.cos(r) * n, 0, Math.sin(r) * n * 0.8]);
    return a[2] < -1e-3 ? e.toScreen(a) : null;
  });
  s.some((i) => i === null) || (t.beginPath(), s.forEach((i, o) => o === 0 ? t.moveTo(i.x, i.y) : t.lineTo(i.x, i.y)), t.closePath(), t.fillStyle = "rgba(0, 0, 0, 0.22)", t.fill());
}
function C0(t) {
  const e = je([0, 1, 0], t);
  if (e > 0.999999) return Jr();
  if (e < -0.999999) return Ge(ve([1, 0, 0], 180));
  const n = Hn([0, 1, 0], t);
  return Ge(ve(n, Math.acos(e) * 180 / Math.PI));
}
function O0(t, e, n, s, i) {
  const o = t.solid ?? {}, r = o.outline === !1 ? void 0 : o.outline ?? { width: 2, color: "#0f172a" }, a = { color: o.color ?? "#475569", shading: o.shading ?? "toon", outline: r }, l = { color: o.skin ?? "#f2c49b", shading: o.shading ?? "toon", outline: r }, c = { color: "#0f172a", shading: "unlit" }, h = s.height * 0.034, u = [], f = (w, M, x) => u.push({ mesh: w, world: Qt(i, M), material: x }), d = (w, M, x) => f(e.sphere, Qr(w, [0, 0, 0, 1], [M, M, M]), x);
  for (const w of n.chains) {
    const M = s.chains[w.id], x = w.id === "spine" ? 1.9 : 1;
    w.bones.forEach((v, A) => {
      const C = M[A], T = M[A + 1], H = zr(C, T), [_, O] = v.width ?? [1, 1], L = h * x * (_ + O) / 2;
      if (H > 1e-6) {
        const W = Gr(C, T, 0.5), j = C0(ze(Jn(T, C)));
        f(e.cylinder, Qt(Zr(W), Qt(j, xn([L, H, L]))), a);
      }
      d(C, h * x * _, a), d(T, h * x * O, a);
    }), w.id.startsWith("arm.") && d(M[M.length - 1], h * 1.5, l);
  }
  const { center: g, rx: p, ry: m, axes: y } = s.head, b = [...y[0], 0, ...y[1], 0, ...y[2], 0, ...g, 1];
  f(e.sphere, Qt(b, xn([p, m, p])), l);
  for (const w of [-1, 1]) {
    const M = ze([w * 0.36, 0.15, 0.92]), x = Sn(g, Sn(Sn(Ye(y[0], M[0] * p * 1.04), Ye(y[1], M[1] * m * 1.04)), Ye(y[2], M[2] * p * 1.04))), v = [...y[0], 0, ...y[1], 0, ...y[2], 0, ...x, 1];
    f(e.sphere, Qt(v, xn([p * 0.11, m * 0.14, p * 0.03])), c);
  }
  return u;
}
const pm = {
  kind: "character",
  validate(t) {
    const e = t;
    return e.height !== void 0 && !(e.height > 0) ? ["a character's height must be positive"] : [];
  },
  prepare(t) {
    return {
      who: w0({ ...t.character, height: 1 }),
      cylinder: Xo(u0(1, 1, 16)),
      sphere: Xo(h0(1, 20))
    };
  },
  resolve({ object: t, prepared: e, values: n, world: s, camera: i, toScreen: o }) {
    const r = t, a = e, l = a.who, c = { ...dt, ...r.pose };
    for (const [m, y] of n)
      typeof y == "number" && !_0.has(m) && (c[m] = y);
    const h = r.height ?? I0, u = Qt(i.view, s), f = {
      toView: (m) => ta(u, m),
      toScreen: (m) => o(m)
    }, g = -f.toView([0, h / 2, 0])[2];
    if (g <= i.near) return null;
    const p = r.shadow === !1 ? [] : [{ depth: g + h, draw: (m) => H0(m, f, h * 0.18) }];
    if (r.look === "solid") {
      const m = Va(l.plan, c, { height: h, contact: l.contact });
      return { meshes: O0(r, a, l.plan, m, s), drawables: p };
    }
    return {
      drawables: [
        ...p,
        {
          depth: g,
          draw(m, y) {
            m.lineCap = "round", m.lineJoin = "round", P0(m, l, c, f, { height: h, time: y.time });
          }
        }
      ]
    };
  }
}, R0 = { x: 0, y: 0, scale: 1, rotate: 0, shakeX: 0, shakeY: 0, shakeRotate: 0 };
function gm(t) {
  const e = (n) => {
    const s = t?.get(n);
    return typeof s == "number" ? s : R0[n];
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
function mm(t, e, n) {
  const s = n.width / 2, i = n.height / 2, r = 1 + 2 * Math.max(Math.abs(e.shakeX), Math.abs(e.shakeY)) / Math.max(1, Math.min(n.width, n.height));
  t.translate(s + e.x + e.shakeX, i + e.y + e.shakeY), t.rotate((e.rotate + e.shakeRotate) * Math.PI / 180), t.scale(e.scale * r, e.scale * r), t.translate(-s, -i);
}
function ym(t, e, n) {
  const s = e.width / 2, i = e.height / 2, o = (t.rotate + t.shakeRotate) * Math.PI / 180, r = (n.x - s) * t.scale, a = (n.y - i) * t.scale;
  return {
    x: s + t.x + t.shakeX + r * Math.cos(o) - a * Math.sin(o),
    y: i + t.y + t.shakeY + r * Math.sin(o) + a * Math.cos(o)
  };
}
function L0(t, e, n = {}, s) {
  const i = n.length ?? 240, o = 9, r = 28, a = i - 22;
  t.save(), t.translate(e.x, e.y), t.rotate((n.angle ?? -30) * Math.PI / 180), t.fillStyle = n.color ?? "#f4c542", t.fillRect(r, -o, a - r, 2 * o), t.fillStyle = "#e8b4a0", t.fillRect(a, -o, i - a, 2 * o), t.fillStyle = "#f1dcbf", t.beginPath(), t.moveTo(0, 0), t.lineTo(r, -o), t.lineTo(r, o), t.closePath(), t.fill(), t.fillStyle = n.outline ?? "#2f2f33", t.beginPath(), t.moveTo(0, 0), t.lineTo(r * 0.35, -o * 0.35), t.lineTo(r * 0.35, o * 0.35), t.closePath(), t.fill(), t.strokeStyle = n.outline ?? "#2f2f33", t.lineWidth = 3, t.lineJoin = "round", t.lineCap = "round";
  const l = [
    [{ x: 0, y: 0 }, { x: r, y: -o }, { x: i, y: -o }, { x: i, y: o }, { x: r, y: o }, { x: 0, y: 0 }],
    [{ x: r, y: -o }, { x: r, y: o }],
    [{ x: a, y: -o }, { x: a, y: o }]
  ];
  for (const c of l) il(t, c, s);
  t.restore();
}
function el(t, e, n = {}, s) {
  const i = n.length ?? 90, o = n.thickness ?? 34;
  t.save(), t.translate(e.x, e.y), t.rotate((n.angle ?? -35) * Math.PI / 180);
  const r = -o / 2;
  t.fillStyle = n.color ?? "#f4a7b9", t.fillRect(0, r, i, o), t.fillStyle = "#e9edf2", t.fillRect(i * 0.45, r, i * 0.55, o), t.strokeStyle = n.outline ?? "#2f2f33", t.lineWidth = 3, t.lineJoin = "round";
  const a = [
    { x: 0, y: r },
    { x: i, y: r },
    { x: i, y: -r },
    { x: 0, y: -r },
    { x: 0, y: r }
  ], l = [{ x: i * 0.45, y: r }, { x: i * 0.45, y: -r }];
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
const nl = 150, F0 = { pencil: 44, eraser: 30 };
function sl(t, e, n = {}, s) {
  const i = n.tool ?? "pencil", o = n.skin ?? "#f1c9a5", r = n.outline ?? "#2f2f33", a = n.scale ?? 1, l = Math.min(1, Math.max(0, n.lift ?? 0)), c = (n.angle ?? -30) * Math.PI / 180, h = s ? s.nudge(0.6) : { x: 0, y: 0 }, u = nl * a * (1 + 0.05 * l);
  l > 0 && (t.save(), t.fillStyle = r, t.globalAlpha = 0.15 * l, t.beginPath(), t.ellipse(e.x, e.y, 9 * a, 4 * a, 0, 0, Math.PI * 2), t.fill(), t.restore());
  const f = { x: e.x + h.x + 6 * l * a, y: e.y + h.y - 18 * l * a }, d = mt.pencilGrip, g = (A) => {
    const C = A.fingers.thumb, T = A.fingers.index, H = A.fingers.middle, _ = Vo([C.points[3], T.points[3], H.points[3]]), O = Vo([C.points[1], T.points[0]]), L = (C.depths[3] + T.depths[3] + H.depths[3]) / 3;
    return { pinch: _, direction: Math.atan2(O.y - _.y, O.x - _.x), depth: L };
  }, p = zs(d, { size: u }), m = c - g(p).direction, y = zs(d, { size: u, angle: m * 180 / Math.PI }), b = g(y), w = F0[i] * a, M = { x: b.pinch.x - Math.cos(c) * w, y: b.pinch.y - Math.sin(c) * w }, x = { x: f.x - M.x, y: f.y - M.y }, v = y.axes.up;
  W0(t, x, { x: -v.x, y: -v.y }, u, n.arm ?? 300 * a, o, n.sleeve ?? "#5b7db1", r), Mi(t, x, d, {
    size: u,
    angle: m * 180 / Math.PI,
    skin: o,
    ink: r,
    lineWidth: 3 * a,
    prop: {
      depth: b.depth,
      draw: () => {
        t.save(), t.translate(f.x, f.y), t.scale(a, a), i === "eraser" ? el(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, outline: r }, s) : L0(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, length: 190, outline: r }, s), t.restore();
      }
    }
  });
}
const Vo = (t) => ({
  x: t.reduce((e, n) => e + n.x, 0) / t.length,
  y: t.reduce((e, n) => e + n.y, 0) / t.length
});
function W0(t, e, n, s, i, o, r, a) {
  const l = { x: -n.y, y: n.x }, c = s * 0.15, h = (p, m, y) => ({
    x: e.x + n.x * p + l.x * m * y,
    y: e.y + n.y * p + l.y * m * y
  }), u = h(i, 0, 0), f = (p) => {
    const m = t.createLinearGradient(e.x, e.y, u.x, u.y);
    return m.addColorStop(0, p), m.addColorStop(0.6, p), m.addColorStop(1, B0(p)), m;
  }, d = Math.min(s * 0.55, i * 0.35);
  t.save(), t.lineJoin = "round", t.lineCap = "round", t.lineWidth = 3 * (s / nl), t.beginPath(), t.moveTo(h(-s * 0.1, -1, c).x, h(-s * 0.1, -1, c).y), t.lineTo(h(d + 4, -1, c * 1.1).x, h(d + 4, -1, c * 1.1).y), t.lineTo(h(d + 4, 1, c * 1.1).x, h(d + 4, 1, c * 1.1).y), t.lineTo(h(-s * 0.1, 1, c).x, h(-s * 0.1, 1, c).y), t.closePath(), t.fillStyle = o, t.fill(), t.strokeStyle = a, t.beginPath(), t.moveTo(h(0, -1, c).x, h(0, -1, c).y), t.lineTo(h(d, -1, c * 1.1).x, h(d, -1, c * 1.1).y), t.moveTo(h(0, 1, c).x, h(0, 1, c).y), t.lineTo(h(d, 1, c * 1.1).x, h(d, 1, c * 1.1).y), t.stroke();
  const g = [h(d, -1, c * 1.3), h(i, -1, c * 1.5), h(i, 1, c * 1.5), h(d, 1, c * 1.3)];
  t.beginPath(), g.forEach((p, m) => m ? t.lineTo(p.x, p.y) : t.moveTo(p.x, p.y)), t.closePath(), t.fillStyle = f(r), t.fill(), t.strokeStyle = f(a), t.beginPath(), t.moveTo(g[1].x, g[1].y), t.lineTo(g[0].x, g[0].y), t.lineTo(g[3].x, g[3].y), t.lineTo(g[2].x, g[2].y), t.stroke(), t.restore();
}
function bm(t, e, n = {}) {
  const s = n.offstage ?? { x: 2e3, y: 1400 }, i = n.enter ?? 450, o = n.exit ?? 450, r = n.linger ?? 1500, a = [...t].filter((p) => p.path.length > 0).sort((p, m) => p.start - m.start), l = (p) => p.tool ?? "pencil", c = (p) => {
    const m = Math.min(1, Math.max(0, p));
    return m * m * (3 - 2 * m);
  }, h = (p, m, y) => ({ x: p.x + (m.x - p.x) * y, y: p.y + (m.y - p.y) * y }), u = a.find((p) => e >= p.start && e <= p.end);
  if (u) {
    const p = u.end - u.start, m = p > 0 ? (e - u.start) / p : 1;
    return { at: Si(u.path, m), tool: l(u), lift: 0, drawing: !0 };
  }
  const f = [...a].reverse().find((p) => p.end < e), d = a.find((p) => p.start > e), g = (p) => p.path[p.path.length - 1];
  if (f && d && d.start - f.end <= r) {
    const p = (e - f.end) / (d.start - f.end), m = p < 0.5 ? l(f) : l(d);
    return { at: h(g(f), d.path[0], c(p)), tool: m, lift: Math.sin(Math.PI * p), drawing: !1 };
  }
  if (d && d.start - e <= i) {
    const p = 1 - (d.start - e) / i;
    return { at: h(s, d.path[0], c(p)), tool: l(d), lift: 1 - c(p), drawing: !1 };
  }
  if (f && e - f.end <= o) {
    const p = (e - f.end) / o;
    return { at: h(g(f), s, c(p)), tool: l(f), lift: c(p), drawing: !1 };
  }
  return null;
}
function wm(t, e, n, s = 0.08, i = 32) {
  const o = Math.PI * 2 * (1 + s), r = [];
  for (let a = 0; a <= i; a++) {
    const l = -Math.PI / 2 + o * a / i;
    r.push({ x: t + Math.cos(l) * n, y: e + Math.sin(l) * n });
  }
  return r;
}
function km(t) {
  const { path: e } = t, n = e.map((a) => a.x), s = e.map((a) => a.y), i = Math.min(...n), o = Math.min(...s), r = t.hand === !1 ? void 0 : t.hand === !0 || t.hand === void 0 ? {} : t.hand;
  return {
    type: "custom",
    x: i,
    y: o,
    width: Math.max(1, Math.max(...n) - i),
    height: Math.max(1, Math.max(...s) - o),
    props: { draw: 0 },
    draw(a, l, c) {
      const h = Math.min(1, Math.max(0, Number(l.props?.draw ?? 0)));
      a.translate(-i, -o), a.strokeStyle = t.color ?? "#2f2f33", a.lineWidth = t.lineWidth ?? 5, a.lineCap = "round", a.lineJoin = "round";
      const u = t.sketch ? qs(a, t.sketch, c) : void 0;
      h > 0 && (u ? t.smooth ? u.curve(e, h) : u.line(e, h) : il(a, Ze(e, h))), r && h > 0 && h < 1 && sl(a, Si(e, h), r, u);
    }
  };
}
function B0(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return "rgba(0, 0, 0, 0)";
  const n = e[1].length === 3 ? [...e[1]].map((r) => r + r).join("") : e[1], [s, i, o] = [0, 2, 4].map((r) => parseInt(n.slice(r, r + 2), 16));
  return `rgba(${s}, ${i}, ${o}, 0)`;
}
function il(t, e, n) {
  if (!(e.length < 2)) {
    if (n) return n.line(e);
    t.beginPath(), t.moveTo(e[0].x, e[0].y);
    for (const s of e.slice(1)) t.lineTo(s.x, s.y);
    t.stroke();
  }
}
const mn = 1e5;
function vm(t, e, n, s, i = 6) {
  const o = [], r = Math.max(1, Math.round(i));
  for (let a = 0; a <= r; a++)
    o.push({ x: a % 2 === 0 ? t : t + n, y: e + s * a / r });
  return o;
}
function ol(t, e, n, s) {
  if (s <= 0 || e.length === 0) return;
  const i = Ze(e, s), o = n / 2, r = (a) => {
    t.beginPath(), t.rect(-mn, -mn, 2 * mn, 2 * mn), a(), t.clip("evenodd");
  };
  for (const a of i)
    r(() => {
      t.moveTo(a.x + o, a.y), t.arc(a.x, a.y, o, 0, Math.PI * 2);
    });
  for (let a = 1; a < i.length; a++) {
    const l = i[a - 1], c = i[a], h = Math.hypot(c.x - l.x, c.y - l.y);
    if (h === 0) continue;
    const u = -(c.y - l.y) / h * o, f = (c.x - l.x) / h * o;
    r(() => {
      t.moveTo(l.x + u, l.y + f), t.lineTo(c.x + u, c.y + f), t.lineTo(c.x - u, c.y - f), t.lineTo(l.x - u, l.y - f), t.closePath();
    });
  }
}
function Sm(t, e, n, s, i) {
  t.save(), ol(t, e, n, s), i(), t.restore();
}
function xm(t, e) {
  const n = e.width ?? 40, s = e.hand === !0 ? {} : e.hand || void 0, i = e.eraser === !1 ? void 0 : e.eraser === !0 || e.eraser === void 0 ? {} : e.eraser;
  return {
    ...t,
    props: { ...t.props, erase: 0 },
    draw(o, r, a) {
      const l = Number(r.props?.erase ?? 0);
      if (o.save(), ol(o, e.path, n, l), t.draw(o, r, a), o.restore(), !i || l <= 0 || l >= 1) return;
      const c = Si(e.path, l);
      s ? sl(o, c, { ...s, tool: "eraser" }) : el(o, c, i);
    }
  };
}
const D0 = {
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
}, ii = ["wipe", "fly", "blur"], N0 = 16e-4, K0 = 0.6, Oe = 33, Y0 = 0.9, j0 = 8;
function Mm(t) {
  const e = { ...D0, ...t.theme }, n = t.code.replace(/\t/g, "    ").replace(/\n$/, "").split(`
`), s = t.fontSize ?? 16, i = (t.lineHeight ?? 1.6) * s, o = (t.charWidth ?? 0.6) * s, r = t.padding ?? 12, a = t.lineNumbers === !1 ? 0 : (String(n.length).length + 2) * o, l = Math.max(1, ...n.map((k) => k.length)), c = t.width ?? r * 2 + a + l * o, h = r * 2 + n.length * i, u = t.x + r + a, f = new Set(t.hidden ?? []), d = t.language ?? "plain";
  if (!oi.includes(d)) throw new Error(`codePanel: ${zt("language", d, oi)}`);
  const g = n.map((k) => z0(k, d).flatMap((E) => Array.from(E.text, () => e[E.kind]))), p = /* @__PURE__ */ new Map(), m = [], y = /* @__PURE__ */ new Map(), b = [], w = [], M = (k) => {
    if (!Number.isInteger(k) || k < 1 || k > n.length) throw new Error(`codePanel: no line ${k} (it has ${n.length})`);
  }, x = (k, ...E) => p.set(k, [...p.get(k) ?? [], ...E]), v = (k, E, S, $, I = 300) => x(k, { time: $.at, value: E }, { time: $.at + ($.duration ?? I), value: S, ...$.easing ? { easing: $.easing } : {} }), A = (k, E, S, $, I, F = 300) => {
    M(k), v(`line.${k}.${E}`, S, $, I, F);
  }, C = (k, E) => m.filter((S) => S.line < k && S.closed <= E).length, T = (k, E, S, $) => ({
    x: k + S / 2,
    y: E + $ / 2,
    left: k,
    right: k + S,
    top: E,
    bottom: E + $,
    width: S,
    height: $
  }), H = (k) => t.y + r + (k - 1) * i, _ = (k) => Array.isArray(k) ? k : [k], O = (k, E) => {
    const S = p.get(k);
    return S ? [...S].sort(($, I) => $.time - I.time)[S.length - 1].value : E;
  }, L = (k, E, S) => {
    let $ = -1;
    for (let I = 0; I < S; I++)
      if ($ = n[k - 1].indexOf(E, $ + 1), $ < 0) throw new Error(`codePanel: line ${k} has no ${S > 1 ? `${S}th ` : ""}"${E}"`);
    return $;
  }, W = {};
  n.forEach((k, E) => {
    const S = E + 1;
    W[`line.${S}.highlight`] = 0, W[`line.${S}.strike`] = 0, W[`line.${S}.wipe`] = 0, W[`line.${S}.reveal`] = f.has(S) ? 0 : 1, W[`line.${S}.shift`] = 0;
  });
  const j = {
    type: "custom",
    x: t.x,
    y: t.y,
    width: c,
    height: h,
    props: W,
    about: {
      kind: "code panel",
      summary: `${n.length} lines of ${d} code. Its lines and words are places in the scene (line(), token(), spot()); its edits are methods that record tracks (tracks()).`,
      // Pieces and inserts add props as they are made; these describe them by pattern.
      get props() {
        return q0(Object.keys(W));
      },
      actions: rl
    },
    draw(k, E) {
      const S = E.props ?? {}, $ = (B) => Number(S[B] ?? W[B]), I = r + a, F = (B) => r + (B - 1) * i - $(`line.${B}.shift`) * i;
      k.fillStyle = e.background, zo(k, 0, 0, c, h, 8), k.fill(), k.font = `${s}px ${e.font}`, k.textBaseline = "middle", k.textAlign = "left";
      const N = (B, K, G, Q, Z) => {
        const et = n[B - 1];
        for (let q = K; q < G; q++)
          et[q] !== " " && (k.fillStyle = g[B - 1][q], k.fillText(et[q], Q + (q - K) * o, Z));
      };
      k.save(), zo(k, 0, 0, c, h, 8), k.clip(), n.forEach((B, K) => {
        const G = K + 1, Q = $(`line.${G}.wipe`);
        if (Q >= 1) return;
        const Z = F(G), et = Z + i / 2, q = Math.max(1, B.length) * o, ct = Math.round($(`line.${G}.reveal`) * B.length), ht = y.get(G) ?? { style: "wipe", from: "left" };
        k.save(), Q > 0 && X0(k, ht, Q, { left: I - a, top: Z, width: a + q + o, height: i }, c);
        const yt = $(`line.${G}.highlight`);
        yt > 0 && (k.globalAlpha *= Math.min(1, yt), k.fillStyle = e.highlight, k.fillRect(I - o / 2, Z, q + o, i), k.globalAlpha /= Math.min(1, yt)), a > 0 && ct > 0 && (k.fillStyle = e.gutter, k.textAlign = "right", k.fillText(String(G), I - o, et), k.textAlign = "left");
        const Yt = [
          ...b.filter((X) => X.line === G).map((X) => ({ column: X.column, length: X.text.length, piece: X, insert: void 0 })),
          ...w.filter((X) => X.line === G).map((X) => ({ column: X.column, length: 0, piece: void 0, insert: X }))
        ].sort((X, nt) => X.column - nt.column || X.length - nt.length);
        let St = 0, V = I;
        for (const X of Yt) {
          N(G, St, Math.min(X.column, ct), V, et), V += (X.column - St) * o;
          let nt = X.length, rt = "";
          if (X.piece) {
            const lt = X.piece.written ?? "", wt = $(`piece.${X.piece.id}.write`);
            lt && wt > 0 ? (rt = lt.slice(0, Math.round(wt * lt.length)), nt = X.length + (lt.length - X.length) * Math.min(1, wt * 2)) : nt = X.length * (1 - $(`piece.${X.piece.id}.away`));
          } else X.insert && (nt = X.insert.chars * $(`insert.${X.insert.id}.open`), X.insert.text && (rt = X.insert.text.slice(0, Math.round($(`insert.${X.insert.id}.type`) * X.insert.text.length))));
          k.fillStyle = e.text;
          for (let lt = 0; lt < rt.length; lt++) rt[lt] !== " " && k.fillText(rt[lt], V + lt * o, et);
          V += nt * o, St = X.column + X.length;
        }
        N(G, St, Math.max(St, ct), V, et);
        const st = $(`line.${G}.strike`);
        st > 0 && (k.strokeStyle = e.strike, k.lineWidth = Math.max(1.5, s / 10), k.beginPath(), k.moveTo(I, et), k.lineTo(I + q * Math.min(1, st), et), k.stroke()), k.restore();
      });
      for (const B of b) {
        const K = $(`piece.${B.id}.opacity`);
        if (K <= 0 || $(`line.${B.line}.wipe`) >= 1) continue;
        const G = I + (B.column + B.text.length / 2) * o + $(`piece.${B.id}.x`), Q = F(B.line) + i / 2 + $(`piece.${B.id}.y`);
        k.save(), k.globalAlpha = Math.min(1, K), k.translate(G, Q), k.rotate($(`piece.${B.id}.rotate`) * Math.PI / 180), N(B.line, B.column, B.column + B.text.length, -B.text.length * o / 2, 0), k.restore();
      }
      k.restore();
    }
  }, U = (k, E) => ({
    x: k.home.x + Re(p.get(`piece.${k.id}.x`), E),
    y: k.home.y + Re(p.get(`piece.${k.id}.y`), E)
  }), P = (k, E) => {
    for (const S of ["x", "y", "rotate"]) {
      const $ = `piece.${k.id}.${S}`, I = (p.get($) ?? []).filter((F) => F.time <= E);
      p.set($, I);
    }
  }, R = {
    target: j,
    lines: n,
    box: T(t.x, t.y, c, h),
    line(k, E = 1 / 0) {
      return M(k), T(u, H(k) - C(k, E) * i, Math.max(1, n[k - 1].length) * o, i);
    },
    token(k, E, S = 1, $ = 1 / 0) {
      M(k);
      const I = L(k, E, S);
      return T(u + I * o, H(k) - C(k, $) * i, E.length * o, i);
    },
    highlight(k, E) {
      for (const S of _(k)) {
        const $ = O(`line.${S}.highlight`, 0);
        A(S, "highlight", $, E.on === !1 ? 0 : 1, E, 200);
      }
      return R;
    },
    strike(k, E) {
      for (const S of _(k)) A(S, "strike", O(`line.${S}.strike`, 0), 1, E);
      return R;
    },
    remove(k, E) {
      const S = _(k), $ = E.style ?? "wipe";
      if (!ii.includes($)) throw new Error(`codePanel.remove: ${zt("style", $, ii)}`);
      const I = $ === "wipe" ? 300 : 450, F = E.at + (E.duration ?? I), N = E.close ?? 250;
      for (const B of S)
        A(B, "wipe", 0, 1, { ...E, easing: E.easing ?? ($ === "fly" ? "ease-in" : void 0) }, I), y.set(B, { style: $, from: E.from ?? "left" }), m.push({ line: B, closed: F + N });
      for (let B = 1; B <= n.length; B++) {
        if (S.includes(B)) continue;
        const K = S.filter((Q) => Q < B).length;
        if (K === 0) continue;
        const G = O(`line.${B}.shift`, 0);
        A(B, "shift", G, G + K, { at: F, duration: N, easing: "ease-in-out" });
      }
      return R;
    },
    type(k, E) {
      return A(k, "reveal", 0, 1, { duration: n[k - 1].length * 45, ...E }), R;
    },
    piece(k, E, S = 1) {
      M(k);
      const $ = L(k, E, S), I = b.find((N) => N.line === k && N.column === $ && N.text === E);
      if (I) return I;
      if (b.some((N) => N.line === k && $ < N.column + N.text.length && N.column < $ + E.length))
        throw new Error(`codePanel: "${E}" on line ${k} overlaps another piece`);
      const F = { id: b.length + 1, line: k, column: $, text: E, home: R.token(k, E, S, 0) };
      b.push(F);
      for (const N of ["x", "y", "rotate", "write", "away"]) W[`piece.${F.id}.${N}`] = 0;
      return W[`piece.${F.id}.opacity`] = 1, F;
    },
    follow(k, E) {
      for (const S of E)
        x(`piece.${k.id}.x`, { time: S.time, value: S.x - k.home.x }), x(`piece.${k.id}.y`, { time: S.time, value: S.y - k.home.y });
      return R;
    },
    fling(k, E) {
      const S = U(k, E.at), $ = E.velocity ?? Y(k, E.at) ?? { x: 0.5, y: -0.6 }, I = E.gravity ?? N0, F = E.duration ?? 900, N = (E.spin ?? K0) * ($.x < 0 ? -1 : 1), B = Re(p.get(`piece.${k.id}.rotate`), E.at);
      P(k, E.at);
      for (let K = 0; K <= F; K += Oe) {
        const G = S.x + $.x * K, Q = S.y + $.y * K + 0.5 * I * K * K;
        x(`piece.${k.id}.x`, { time: E.at + K, value: G - k.home.x }), x(`piece.${k.id}.y`, { time: E.at + K, value: Q - k.home.y }), x(`piece.${k.id}.rotate`, { time: E.at + K, value: B + N * K });
      }
      return v(`piece.${k.id}.opacity`, 1, 0, { at: E.at + F * 0.6, duration: F * 0.4 }), R;
    },
    move(k, E) {
      const S = U(k, E.at);
      return v(`piece.${k.id}.x`, S.x - k.home.x, E.to.x - k.home.x, E, 400), v(`piece.${k.id}.y`, S.y - k.home.y, E.to.y - k.home.y, E, 400), R;
    },
    write(k, E, S) {
      return k.written = E, v(`piece.${k.id}.write`, 0, 1, { duration: Math.max(1, E.length) * 70, ...S }), R;
    },
    spot(k, E, S = 1, $ = 1 / 0) {
      M(k);
      const I = w.filter((F) => F.line === k && F.column <= E && F.at <= $).reduce((F, N) => F + N.chars, 0);
      return T(u + (E + I) * o, H(k) - C(k, $) * i, S * o, i);
    },
    insert(k, E, S, $) {
      M(k);
      const I = { id: w.length + 1, line: k, column: E, chars: S.length, text: S, at: $.at };
      w.push(I), W[`insert.${I.id}.open`] = 0, W[`insert.${I.id}.type`] = 0;
      const F = $.duration ?? S.length * 70;
      return v(`insert.${I.id}.open`, 0, 1, { at: $.at, duration: F * 0.6, easing: "ease-out" }), v(`insert.${I.id}.type`, 0, 1, { at: $.at, duration: F }), R;
    },
    drop(k, E, S, $) {
      M(E);
      const I = $.duration ?? 250, F = E === k.line, N = $.easing ?? (F ? "linear" : "ease-out"), B = R.landing(k, E, S, $.at), K = { id: w.length + 1, line: E, column: S, chars: k.text.length, at: $.at };
      return w.push(K), W[`insert.${K.id}.open`] = 0, v(`insert.${K.id}.open`, 0, 1, { at: $.at, duration: I, easing: F ? N : "ease-out" }), v(`piece.${k.id}.away`, O(`piece.${k.id}.away`, 0), 1, { at: $.at, duration: I, easing: F ? N : "ease-in-out" }), P(k, $.at), R.move(k, { at: $.at, duration: I, easing: N, to: { x: B.x, y: B.y } }), v(`piece.${k.id}.rotate`, Re(p.get(`piece.${k.id}.rotate`), $.at), 0, { at: $.at, duration: I }), R;
    },
    landing(k, E, S, $ = 1 / 0) {
      const I = R.spot(E, S, k.text.length, $), F = E === k.line && S > k.column ? k.text.length * o : 0;
      return T(I.left - F, I.top, I.width, I.height);
    },
    ride(k, E, S) {
      return D(k, E, S.ground, S.every ?? Oe);
    },
    tracks(k) {
      return [...p].filter(([, E]) => E.length > 0).map(([E, S]) => ({
        id: `${k}-${E}`,
        target: k,
        property: E,
        keyframes: U0(S)
      }));
    }
  };
  function D(k, E, S, $) {
    const I = n.map((V, st) => p.get(`line.${st + 1}.shift`) ?? []);
    if (I.every((V) => V.length === 0)) return k;
    const F = k.find((V) => V.target === E && V.property === "y"), N = new Ae({ id: `${E}-ride`, tracks: F ? [F] : [] }), B = (V) => F ? Number(N.getStateAtTime(V).values.get(E)?.get("y") ?? 0) : 0, K = (V) => {
      const st = S + B(V);
      return n.findIndex((X, nt) => Math.abs(H(nt + 1) - st) < 0.5);
    }, G = (F?.keyframes ?? []).map((V) => V.time), Q = (V) => {
      const st = (wt) => wt < 0 ? 0 : -Re(I[wt], V) * i, X = K(V);
      if (X >= 0) return st(X);
      if (Math.abs(B(V)) < 0.5) return 0;
      const nt = (wt) => K(wt) >= 0 || Math.abs(B(wt)) < 0.5, rt = [...G].reverse().find((wt) => wt <= V && nt(wt)), lt = G.find((wt) => wt >= V && nt(wt));
      return rt === void 0 && lt === void 0 ? 0 : rt === void 0 ? st(K(lt)) : lt === void 0 || lt === rt ? st(K(rt)) : st(K(rt)) + (st(K(lt)) - st(K(rt))) * (V - rt) / (lt - rt);
    }, Z = I.flatMap((V) => {
      const st = [...V].sort((X, nt) => X.time - nt.time);
      return st.slice(1).flatMap((X, nt) => X.value !== st[nt].value ? [{ start: st[nt].time, end: X.time }] : []);
    }), et = (V, st) => Z.some((X) => X.start < st && X.end > V) || Q(V) !== Q(st), q = F ? [...F.keyframes] : [{ time: 0, value: 0 }], ct = [{ ...q[0], value: q[0].value + Q(q[0].time) }], ht = (V, st) => {
      const X = /* @__PURE__ */ new Set([st]);
      for (let nt = V + $; nt < st; nt += $) X.add(nt);
      for (const nt of Z) for (const rt of [nt.start, nt.end]) rt > V && rt < st && X.add(rt);
      for (const nt of [...X].sort((rt, lt) => rt - lt)) ct.push({ time: nt, value: B(nt) + Q(nt) });
    };
    for (let V = 1; V < q.length; V++) {
      const st = q[V - 1].time, X = q[V].time;
      et(st, X) ? ht(st, X) : ct.push({ ...q[V], value: q[V].value + Q(X) });
    }
    const yt = q[q.length - 1].time, Yt = Math.max(yt, ...Z.map((V) => V.end));
    Yt > yt && ht(yt, Yt);
    const St = { id: F?.id ?? `${E}-y`, target: E, property: "y", keyframes: ct };
    return F ? k.map((V) => V === F ? St : V) : [...k, St];
  }
  function Y(k, E) {
    const S = p.get(`piece.${k.id}.x`);
    if (!S || S.length < 2) return;
    const $ = U(k, E - Oe), I = U(k, E);
    return { x: (I.x - $.x) / Oe, y: (I.y - $.y) / Oe };
  }
  return R;
}
function X0(t, e, n, s, i) {
  if (e.style === "wipe") {
    t.beginPath(), e.from === "right" ? t.rect(s.left, s.top, s.width * (1 - n), s.height) : t.rect(s.left + n * s.width, s.top, s.width * (1 - n), s.height), t.clip();
    return;
  }
  const o = j0 * n;
  if (o > 0.2 && "filter" in t && (t.filter = `blur(${o.toFixed(1)}px)`), t.globalAlpha *= 1 - n, e.style === "fly") {
    const r = e.from === "right" ? -1 : 1;
    t.translate(r * n * Y0 * i, 0), t.rotate(r * n * 0.08);
  } else {
    const r = 1 + 0.08 * n, a = s.left + s.width / 2, l = s.top + s.height / 2;
    t.translate(a, l), t.scale(r, r), t.translate(-a, -l);
  }
}
function Re(t, e) {
  if (!t || t.length === 0) return 0;
  const n = [...t].sort((s, i) => s.time - i.time);
  if (e <= n[0].time) return n[0].value;
  for (let s = 1; s < n.length; s++)
    if (e <= n[s].time) {
      const i = n[s - 1], o = n[s];
      return o.time === i.time ? o.value : i.value + (o.value - i.value) * (e - i.time) / (o.time - i.time);
    }
  return n[n.length - 1].value;
}
const rl = {
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
function q0(t) {
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
    const i = e.find(([o]) => o.test(s));
    i && (n[s] = i[1]);
  }
  return n;
}
function U0(t) {
  return [...t].sort((n, s) => n.time - s.time).map((n) => ({ time: n.time, value: n.value, ...n.easing ? { easing: n.easing } : {} }));
}
function zo(t, e, n, s, i, o) {
  t.beginPath(), t.moveTo(e + o, n), t.arcTo(e + s, n, e + s, n + i, o), t.arcTo(e + s, n + i, e, n + i, o), t.arcTo(e, n + i, e, n, o), t.arcTo(e, n, e + s, n, o), t.closePath();
}
const jn = {
  go: ["break", "case", "chan", "const", "continue", "default", "defer", "else", "fallthrough", "for", "func", "go", "goto", "if", "import", "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var", "nil", "true", "false"],
  rust: ["as", "async", "await", "break", "const", "continue", "crate", "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "self", "Self", "static", "struct", "super", "trait", "true", "type", "unsafe", "use", "where", "while", "Some", "None", "Ok", "Err"],
  csharp: ["abstract", "async", "await", "base", "bool", "break", "case", "catch", "class", "const", "continue", "default", "do", "else", "enum", "false", "finally", "for", "foreach", "if", "in", "int", "interface", "internal", "is", "namespace", "new", "null", "object", "out", "override", "private", "protected", "public", "readonly", "ref", "return", "sealed", "static", "string", "struct", "switch", "this", "throw", "true", "try", "using", "var", "virtual", "void", "while"],
  javascript: ["async", "await", "break", "case", "catch", "class", "const", "continue", "default", "delete", "do", "else", "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "let", "new", "null", "of", "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof", "undefined", "var", "void", "while", "yield"],
  typescript: [],
  python: ["and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "False", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass", "raise", "return", "True", "try", "while", "with", "yield"],
  plain: []
};
jn.typescript = [...jn.javascript, "enum", "interface", "type", "implements", "private", "public", "readonly", "keyof", "as", "declare", "namespace"];
const oi = Object.keys(jn), V0 = {
  go: "//",
  rust: "//",
  csharp: "//",
  javascript: "//",
  typescript: "//",
  python: "#",
  plain: null
};
function z0(t, e) {
  const n = new Set(jn[e]), s = V0[e], i = [], o = (a, l) => {
    const c = i[i.length - 1];
    c && c.kind === l ? c.text += a : i.push({ text: a, kind: l });
  };
  let r = 0;
  for (; r < t.length; ) {
    const a = t[r];
    if (e !== "plain" && s && t.startsWith(s, r)) {
      o(t.slice(r), "comment");
      break;
    }
    if (e !== "plain" && (a === '"' || a === "'" || a === "`")) {
      let h = r + 1;
      for (; h < t.length && t[h] !== a; ) h += t[h] === "\\" ? 2 : 1;
      o(t.slice(r, h + 1), "string"), r = h + 1;
      continue;
    }
    const l = /^[A-Za-z_][A-Za-z0-9_]*/.exec(t.slice(r));
    if (l) {
      o(l[0], n.has(l[0]) ? "keyword" : "text"), r += l[0].length;
      continue;
    }
    const c = /^\d[\d_.]*/.exec(t.slice(r));
    if (c && e !== "plain") {
      o(c[0], "number"), r += c[0].length;
      continue;
    }
    o(a, "text"), r++;
  }
  return i;
}
const Go = 40, G0 = 0.215 + 0.205, Mt = (t, e) => {
  const n = {};
  for (const s of ["left", "right"]) for (const [i, o] of Object.entries(e)) n[`${t}.${s}.${i}`] = o;
  return n;
}, J = (t, e) => t[e] ?? dt[e] ?? 0;
function Tm(t, e, n = dt, s = 1) {
  const i = Qn(t), o = e * Math.PI * 2, r = Math.sin(o) * s, a = Math.cos(o) * s, l = (1 + Math.cos(o * 2 * (i.bounces ?? 1))) / 2, c = i.crouch ?? 0, h = i.shoulder ?? 0, u = i.forearm ?? 0, f = { ...dt, ...n };
  f["leg.left.swing"] = i.swing * r + c * 0.6, f["leg.right.swing"] = -i.swing * r + c * 0.6, f["leg.left.knee"] = i.knee * Math.max(0, a) + c * 1.2, f["leg.right.knee"] = i.knee * Math.max(0, -a) + c * 1.2, f["leg.left.ankle"] = J(n, "leg.left.ankle") - (i.tiptoe ?? 0), f["leg.right.ankle"] = J(n, "leg.right.ankle") - (i.tiptoe ?? 0);
  for (const [d, g] of [["left", -1], ["right", 1]])
    J(n, `arm.${d}.spread`) > Go || J(n, `arm.${d}.swing`) > Go || (f[`arm.${d}.swing`] = h + g * i.arm * r, f[`arm.${d}.elbow`] = J(n, `arm.${d}.elbow`) + u + i.elbow * Math.max(0, g * r));
  return f.lean = J(n, "lean") + i.lean * s, f.bend = J(n, "bend") + (i.bend ?? 0), f["head.nod"] = J(n, "head.nod") - i.lean * 0.5 * s + (i.headTilt ?? 0), f.side = J(n, "side") + (i.sway ?? 0) * Math.sin(o), f.lift = J(n, "lift") + (i.bounce ?? 0) * s * l, f.stretch = J(n, "stretch") * (1 + (i.squash ?? 0) * (l - 0.5)), f;
}
function Em(t, e, n = 1) {
  const s = Qn(t);
  return 4 * G0 * e * Math.sin(s.swing * n * Math.PI / 180);
}
const pe = (t) => Xa[t], al = {
  /** Squash down in a squint, shoot up stretched with arms flung up, hang, land squashed, end surprised. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: J(t, "lean") - 4, ...Mt("arm", { spread: 6, swing: 0, elbow: 10 }), "eye.left": 0.35, "eye.right": 0.35, "brow.left": -0.6, "brow.right": -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { lift: 0.22, stretch: 1.35, bend: -14, ...Mt("arm", { spread: 150, bend: 35, swing: 0, elbow: 0 }), ...Mt("leg", { swing: 25, knee: 60 }), ...pe("shocked") }, easing: "ease-out-cubic" },
    { after: 720, pose: { lift: 0.25, stretch: 1.25, bend: -10, ...Mt("arm", { spread: 140 }) }, easing: "ease-in-out" },
    { after: 900, pose: { lift: 0, stretch: 0.74, bend: 12, ...Mt("arm", { spread: 70, bend: 0 }), ...Mt("leg", { swing: 30, knee: 60 }) }, easing: "ease-in-quad" },
    {
      after: 1060,
      pose: {
        stretch: 1.06,
        bend: -3,
        ...Mt("arm", { spread: 60 }),
        "leg.left.swing": J(t, "leg.left.swing"),
        "leg.right.swing": J(t, "leg.right.swing"),
        "leg.left.knee": J(t, "leg.left.knee"),
        "leg.right.knee": J(t, "leg.right.knee")
      },
      easing: "ease-out"
    },
    { after: 1260, pose: { stretch: J(t, "stretch"), bend: J(t, "bend"), ...pe("surprised"), ...Mt("arm", { spread: 55, bend: 60 }) }, easing: "ease-in-out" }
  ],
  /** Glance ahead, look away unbothered, then snap back in shock with a little hop. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0, "head.turn": 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, "head.turn": 30, "head.nod": J(t, "head.nod") - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { "head.turn": 0, "head.nod": J(t, "head.nod") - 10, bend: J(t, "bend") - 10, lift: 0.05, stretch: 1.18, ...pe("shocked"), lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { lift: 0, stretch: 0.88, "head.nod": J(t, "head.nod") - 4, bend: J(t, "bend") + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: J(t, "stretch"), "head.nod": J(t, "head.nod"), bend: J(t, "bend") }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
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
        ...pe("angry"),
        lookX: 1
      },
      easing: "ease-out"
    },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, "head.nod": 6, "arm.left.swing": -30, "arm.right.swing": 60, "leg.left.swing": -20, "leg.left.knee": 30, "leg.right.swing": 20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { lift: 0, stretch: 0.7, bend: 14, ...Mt("arm", { spread: 75 }), ...Mt("leg", { swing: 25, knee: 50 }) }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, "arm.left.spread": J(t, "arm.left.spread"), "arm.right.spread": J(t, "arm.right.spread") }, easing: "ease-out" },
    { after: 460, pose: { lift: 0, stretch: J(t, "stretch"), bend: J(t, "bend"), ...Mt("leg", { swing: 0, knee: 0 }) }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: paws up, fast small shakes side to side, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...pe("scared"), ...Mt("arm", { swing: 40, elbow: 110, spread: 14 }), stretch: 0.94, bend: J(t, "bend") + 8 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) {
      const s = n % 2 === 0 ? 1 : -1;
      e.push({ after: 80 + n * 45, pose: { side: J(t, "side") + 2.5 * s, "head.tilt": J(t, "head.tilt") - 2 * s } });
    }
    return e.push({ after: 755, pose: { side: J(t, "side"), "head.tilt": J(t, "head.tilt"), bend: J(t, "bend") } }), e;
  },
  /** A sigh: the body sags, the back curls, the head and arms drop. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, "head.nod": J(t, "head.nod") - 4, "brow.left": 0.3, "brow.right": 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...pe("sad"), bend: 18, stretch: 0.92, lean: J(t, "lean") + 5, "head.nod": 14, ...Mt("arm", { spread: 6, swing: 0, elbow: 4, bend: 0 }) }, easing: "ease-in-out" }
  ]
};
function Am(t, e) {
  const n = At(e.from ?? {}), s = e.speed ?? 1;
  let i = n;
  return [
    { time: e.at, pose: n },
    ...al[t](n).map((o) => (i = { ...i, ...o.pose }, { time: e.at + o.after * s, pose: i, act: !1, ...o.easing ? { easing: o.easing } : {} }))
  ];
}
const J0 = (t, e, n) => t.slice(Math.floor((t.length - 1) * e), Math.ceil((t.length - 1) * n) + 1);
function Pm(t = {}) {
  const e = t.shirt ?? "#e2493b", n = t.trousers ?? "#24476b", s = (a) => a.lineWidth * 0.45, i = (a, l, c) => {
    const h = a.parts[`leg.${c}`].points;
    l.shape(Tn(h, a.height * 0.08, a.height * 0.05), n, s(a));
  }, o = (a, l) => {
    const c = a.chains.spine, h = c[0], u = c[c.length - 1], f = { x: h.x - (u.x - h.x) * 0.25, y: h.y - (u.y - h.y) * 0.25 };
    l.shape(Tn([f, ...a.parts.spine.points], a.height * 0.15, a.height * 0.14), e, s(a));
  }, r = (a, l, c) => {
    const h = a.parts[`arm.${c}`].points, u = h[0], f = a.chains.spine[a.chains.spine.length - 1], g = [{ x: u.x + (f.x - u.x) * 0.45, y: u.y + (f.y - u.y) * 0.45 }, ...J0(h, 0, 0.45)], p = Tn(g, a.height * 0.085, a.height * 0.06), m = g.length, y = p.slice(0, m), b = p.slice(m).reverse();
    l.shape(p, e, 0);
    const w = (v) => Math.hypot(v[1].x - f.x, v[1].y - f.y), [M, x] = w(y) > w(b) ? [y, b] : [b, y];
    l.line(M.slice(1), s(a)), l.line(x.slice(Math.ceil(m * 0.45)), s(a)), l.line([y[m - 1], b[m - 1]], s(a));
  };
  return {
    parts: {
      "leg.left": { over: (a, l, c) => i(l, c, "left") },
      "leg.right": { over: (a, l, c) => i(l, c, "right") },
      spine: { over: (a, l, c) => o(l, c) },
      "arm.left": { over: (a, l, c) => r(l, c, "left") },
      "arm.right": { over: (a, l, c) => r(l, c, "right") }
    }
  };
}
const Pn = {
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
function Z0(t) {
  if (t === void 0) return Pn.full;
  if (typeof t == "string") return Pn[t];
  const { base: e, ...n } = t;
  return { ...Pn[e ?? "full"], ...n };
}
const ri = 160, Q0 = 120, tp = 700, Ms = 60, ep = 90, yn = 3200, Se = 1, se = 1e-6;
function ll(t, e, n = {}) {
  const s = Z0(n.style), i = n.seed ?? 1, o = {};
  if (t.length === 0) return o;
  const r = Object.keys(t[0].pose).filter((u) => t.some((f) => Math.abs(f.pose[u] - t[0].pose[u]) > se));
  for (const u of r) o[u] = np(u, t, e, s, i);
  const a = e.blink, l = a !== void 0 && r.includes(a);
  if (s.blinks && a !== void 0 && !l && a in t[0].pose) {
    const u = sp(t, e, s, i, t[0].pose[a]);
    u.length > 0 && (o[a] = u);
  }
  const { lift: c, stretch: h } = e;
  if (s.jumpSquash > 0 && c && h && r.includes(c) && !r.includes(h) && h in t[0].pose) {
    const u = ip(t, c, t[0].pose[h], s.jumpSquash);
    u.length > 0 && (o[h] = u);
  }
  return o;
}
function np(t, e, n, s, i) {
  const o = n.eyes.includes(t), r = n.limits[t], a = r !== void 0, l = o ? -s.eyeLead : (n.depth[t] ?? 1) * s.overlap, c = (d) => {
    const g = (e[d].time - e[d - 1].time) / 2;
    return Math.max(-g, Math.min(g, l));
  }, h = [{ time: e[0].time, value: e[0].pose[t] }], u = (d, g, p) => {
    const m = h[h.length - 1];
    if (d <= m.time + Se) {
      h[h.length - 1] = { ...m, value: g, ...p ? { easing: p } : {} };
      return;
    }
    h.push({ time: d, value: g, ...p ? { easing: p } : {} });
  };
  let f = e[0].pose[t];
  for (let d = 1; d < e.length; d++) {
    const g = e[d], p = e[d - 1].pose[t], m = g.pose[t], y = m - p, b = h[h.length - 1].time, w = g.act !== !1;
    if (Math.abs(y) <= se) {
      const _ = g.time + (w ? c(d) : 0);
      if (d === e.length - 1)
        Math.abs(f - m) > se && u(Math.max(_, b + ri), m, "ease-in-out"), f = m;
      else if (w && a && s.drift > 0 && n.drift.includes(t) && _ - b >= tp) {
        const O = rn(`${i}:${t}:${d}`) % 2 === 0 ? 1 : -1;
        f = m + O * s.drift * r, u(_, f, "ease-in-out");
      }
      continue;
    }
    if (!w) {
      u(e[d - 1].time, f), u(g.time, m, g.easing), f = m;
      continue;
    }
    const M = c(d), x = Math.max(e[d - 1].time + M, b);
    let v = g.time + M;
    o && s.eyeDart > 0 && (v = Math.min(v, x + s.eyeDart));
    const A = v - x;
    if (A <= Se) {
      u(g.time, m, g.easing), f = m;
      continue;
    }
    u(x, f);
    const C = Math.sign(y);
    if (a && s.anticipation > 0 && r > 0 && A >= ri) {
      const _ = f - C * Math.min(Math.abs(y) * s.anticipation, r), O = x + A * s.anticipationTime;
      u(O, _, "ease-in-out"), s.hold > 0 && u(O + A * s.hold, _);
    }
    const T = d + 1 < e.length ? e[d + 1].time - g.time : 1 / 0, H = Math.min(s.settle, T / 2);
    if (a && s.overshoot > 0 && r > 0 && A >= Q0 && H > Se) {
      const _ = Math.min(Math.abs(y) * s.overshoot, r);
      u(v, m + C * _, g.easing ?? s.actionEase), u(v + H, m, s.settleEase);
    } else
      u(v, m, g.easing ?? s.actionEase);
    f = m;
  }
  return h;
}
function sp(t, e, n, s, i) {
  const o = [], r = Ms + ep;
  for (let d = 1; d < t.length; d++) {
    const g = t[d - 1].pose, p = t[d].pose;
    Object.entries(e.headTurns).some(([y, b]) => Math.abs((p[y] ?? 0) - (g[y] ?? 0)) > b) && t[d].act !== !1 && o.push(Math.max(t[0].time, t[d - 1].time - n.eyeLead));
  }
  const a = t[0].time, l = t[t.length - 1].time, c = [...o];
  let h = a + yn * 0.6, u = 0;
  for (; h < l; ) {
    c.some((p) => Math.abs(p - h) < yn / 2) || o.push(h);
    const g = (rn(`${s}:blink:${u++}`) % 1e3 / 1e3 - 0.5) * (yn * 0.66);
    h += yn + g;
  }
  o.sort((d, g) => d - g);
  const f = [{ time: a, value: i }];
  for (const d of o) {
    const g = f[f.length - 1].time;
    d + Ms <= g + Se || (d > g + Se && f.push({ time: d, value: i }), f.push({ time: d + Ms, value: 1, easing: "ease-in" }), f.push({ time: d + r, value: i, easing: "ease-out" }));
  }
  return f.length > 1 ? f : [];
}
function ip(t, e, n, s) {
  const i = n * (1 - 0.18 * s), o = n * (1 + 0.14 * s), r = [{ time: t[0].time, value: n }], a = (l, c, h) => {
    const u = r[r.length - 1];
    l <= u.time + Se || r.push({ time: l, value: c, ...h ? { easing: h } : {} });
  };
  for (let l = 1; l < t.length; l++) {
    const c = t[l - 1].pose[e], h = t[l].pose[e], u = t[l - 1].time, f = t[l].time, d = f - u;
    if (!(d < ri || t[l].act === !1)) {
      if (c <= se && h > se)
        a(u, n), a(u + d * 0.2, i, "ease-out"), a(u + d * 0.45, o, "ease-out"), a(f, n, "ease-in-out");
      else if (c > se && h <= se) {
        const g = l + 1 < t.length ? t[l + 1].time - f : 400;
        a(u + d * 0.5, n), a(f - Math.min(60, d * 0.15), o, "ease-in"), a(f, i, "ease-out"), a(f + Math.min(260, g / 2), n, { type: "back", mode: "out", overshoot: 1.4 });
      }
    }
  }
  return r.length > 1 ? r : [];
}
const op = {
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
function rp(t) {
  return /^(turn|lean|bend|side|lift|roll|stretch)$/.test(t) ? { depth: 0, limit: { turn: 0.06, lean: 10, bend: 10, side: 8, lift: 0, roll: 25, stretch: 0.08 }[t] } : /^leg\.\w+\.(swing|spread|rotate)$/.test(t) ? { depth: 0, limit: 12 } : /^head\./.test(t) ? { depth: 1, limit: 12 } : /^arm\.\w+\.(swing|spread)$/.test(t) ? { depth: 1, limit: 20 } : /^leg\.\w+\.knee$/.test(t) ? { depth: 1, limit: 15 } : /^(brow\.|browTilt$)/.test(t) ? { depth: 1, limit: t === "browTilt" ? void 0 : 0.25 } : /^eye\./.test(t) ? { depth: 1, limit: 0.15 } : /^arm\.\w+\.(elbow|bend)$/.test(t) ? { depth: 2, limit: 18 } : /^leg\.\w+\.(ankle|toeOut)$/.test(t) ? { depth: 2, limit: 10 } : /^(mouth|smile|mouthWidth)$/.test(t) ? { depth: 2 } : /^hand\./.test(t) ? { depth: 3 } : { depth: 1 };
}
function ap() {
  const t = {}, e = {};
  for (const n of Object.keys(dt)) {
    const s = rp(n);
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
const lp = ap();
function cl(t, e) {
  return Object.entries(e).map(([n, s]) => ({ id: `${t}-${n}`, target: t, property: n, keyframes: s }));
}
function cp(t, e, n = {}) {
  const s = Da(e), i = e.map((o, r) => ({ time: o.time, pose: { ...s[r] }, easing: o.easing, act: o.act }));
  return cl(t, ll(i, n.rig ?? op, n));
}
function $m(t, e, n = {}) {
  const s = n.rest ?? dt, i = tl(e, s), o = e.map((r, a) => ({ time: r.time, pose: { ...s, ...i[a] }, easing: r.easing, act: r.act }));
  return cl(t, ll(o, n.rig ?? lp, n));
}
const Jo = ot.shocked, hp = ot.scared, ce = {
  /** The classic take: squash down in a squint, then shoot up stretched with eyes popping, hang, and land squashed. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: t.lean - 4, leftShoulder: 8, rightShoulder: 8, leftEye: 0.35, rightEye: 0.35, leftBrow: -0.6, rightBrow: -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { rise: 0.22, stretch: 1.35, bend: -14, leftShoulder: 150, rightShoulder: 150, leftElbow: 35, rightElbow: 35, leftHip: 22, rightHip: 22, leftKnee: 45, rightKnee: 45, ...Jo, headTilt: 0 }, easing: "ease-out-cubic" },
    { after: 720, pose: { rise: 0.25, stretch: 1.25, bend: -10, leftShoulder: 140, rightShoulder: 140 }, easing: "ease-in-out" },
    { after: 900, pose: { rise: 0, stretch: 0.74, bend: 12, leftShoulder: 70, rightShoulder: 70, leftHip: 18, rightHip: 18, leftKnee: 30, rightKnee: 30 }, easing: "ease-in-quad" },
    { after: 1060, pose: { stretch: 1.06, bend: -3, leftShoulder: 60, rightShoulder: 60, leftHip: t.leftHip, rightHip: t.rightHip, leftKnee: t.leftKnee, rightKnee: t.rightKnee }, easing: "ease-out" },
    { after: 1260, pose: { stretch: t.stretch, bend: t.bend, ...ot.surprised, leftShoulder: 70, rightShoulder: 70, leftElbow: 60, rightElbow: 60 }, easing: "ease-in-out" }
  ],
  /** Glance at something, look away unbothered, then snap back to it in shock. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, headTilt: t.headTilt - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { bend: t.bend - 10, headTilt: t.headTilt + 10, rise: 0.05, stretch: 1.18, ...Jo, lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { rise: 0, stretch: 0.88, bend: t.bend + 4, headTilt: t.headTilt + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: t.stretch, bend: t.bend, headTilt: t.headTilt }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
  ],
  /** Rear back for a zip-off: lean back, one knee up, arms cocked, hold, then pitch forward ready to run. */
  windUp: () => [
    { after: 220, pose: { lean: -18, bend: -16, headTilt: -6, leftShoulder: 70, leftElbow: -100, rightShoulder: 40, rightElbow: 100, leftHip: -45, leftKnee: -80, stretch: 0.92, ...ot.angry, lookX: 1 }, easing: "ease-out" },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, headTilt: 6, leftShoulder: 30, rightShoulder: 60, leftHip: 30, leftKnee: -30, rightHip: -20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down to the ground: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { rise: 0, stretch: 0.7, bend: 14, leftShoulder: 75, rightShoulder: 75, leftHip: 20, rightHip: 20, leftKnee: 35, rightKnee: 35 }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, leftShoulder: t.leftShoulder, rightShoulder: t.rightShoulder }, easing: "ease-out" },
    { after: 460, pose: { rise: 0, stretch: t.stretch, bend: t.bend, leftHip: z.leftHip, rightHip: z.rightHip, leftKnee: 0, rightKnee: 0 }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: small, fast shakes with wide eyes, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...hp, bend: t.bend + 8, leftShoulder: 40, rightShoulder: 40, leftElbow: 110, rightElbow: 110, stretch: 0.94 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) e.push({ after: 80 + n * 45, pose: { lean: t.lean + (n % 2 === 0 ? 2.5 : -2.5), headTilt: t.headTilt + (n % 2 === 0 ? -2 : 2) } });
    return e.push({ after: 755, pose: { lean: t.lean, headTilt: t.headTilt, bend: t.bend } }), e;
  },
  /** A sigh: the body sags, shoulders drop, head and eyes go down. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, headTilt: t.headTilt + 4, leftBrow: 0.3, rightBrow: 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...Kt.sad, bend: 18, stretch: 0.92, lean: t.lean + 5, turn: t.turn, sit: t.sit }, easing: "ease-in-out" }
  ]
};
function Zo(t, e) {
  const n = typeof e.from == "string" ? Kt[e.from] : e.from ?? z, s = e.speed ?? 1;
  let i = n;
  return [
    // The move onto the starting pose is acted like any other; the gag itself is not.
    { time: e.at, pose: n },
    ...ce[t](n).map((o) => (i = { ...i, ...o.pose }, { time: e.at + o.after * s, pose: i, act: !1, ...o.easing ? { easing: o.easing } : {} }))
  ];
}
function Xn(t, e = 1) {
  const n = ce[t](z);
  return n[n.length - 1].after * e;
}
function up(t, e, n = {}) {
  if (e.length < 2) return;
  const s = Math.max(1, Math.round(n.lines ?? 3)), i = n.spacing ?? 5, o = n.lineWidth ?? 2, r = n.opacity ?? 0.7;
  t.save(), t.strokeStyle = n.color ?? "#222", t.lineCap = "round";
  for (let a = 0; a < s; a++) {
    const l = (a - (s - 1) / 2) * i, c = Math.floor(Math.abs(l) / Math.max(i, 1) * (e.length / 6));
    for (let h = c + 1; h < e.length; h++) {
      const u = e[h - 1], f = e[h], d = f.x - u.x, g = f.y - u.y, p = Math.hypot(d, g) || 1, m = -g / p, y = d / p, b = 1 - h / (e.length - 1);
      t.globalAlpha = r * (1 - b), t.lineWidth = o * (1 - b * 0.7), t.beginPath(), t.moveTo(u.x + m * l, u.y + y * l), t.lineTo(f.x + m * l, f.y + y * l), t.stroke();
    }
  }
  t.restore();
}
const fp = {
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
function _m(t, e, n, s, i = {}) {
  const o = n.stateAt;
  if (!o) return;
  const r = i.length ?? 120, a = Math.max(2, Math.round(i.samples ?? 8)), l = Math.max(0, n.time - r);
  if (n.time - l < 1) return;
  const c = [];
  for (let d = 0; d < a; d++) {
    const g = l + (n.time - l) * d / (a - 1);
    c.push(Ba(e, { time: g, state: o(g) }, s).joints);
  }
  const h = c[c.length - 1].height, u = (i.threshold ?? 1.2) * h, f = (i.parts ?? ["hands", "toes", "head"]).flatMap((d) => fp[d]);
  for (const d of f) {
    const g = c.map(d.at);
    let p = 0;
    for (let b = 1; b < g.length; b++) p += Math.hypot(g[b].x - g[b - 1].x, g[b].y - g[b - 1].y);
    const m = p / ((n.time - l) / 1e3);
    if (m <= u) continue;
    const y = Math.min(1, (m - u) / (u * 0.5));
    up(t, g, { ...i, opacity: (i.opacity ?? 0.7) * y, spacing: i.spacing ?? h * 0.02 });
  }
}
function Im(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const i = s.size ?? 40, o = s.seed ?? 1, r = 0.45 + 0.55 * (1 - (1 - n) ** 3);
  t.save(), t.strokeStyle = s.color ?? "#555", t.lineWidth = Math.max(1, i * 0.03), t.globalAlpha = Math.min(1, n / 0.08) * (1 - n);
  for (let a = 0; a < 5; a++) {
    const l = rn(`${o}:puff:${a}`) % 1e3 / 1e3, c = a - 2, h = e.x + c * i * 0.3 * r, u = e.y - i * (0.06 + 0.12 * l) * r + Math.abs(c) * i * 0.03, f = i * (0.11 + 0.07 * l) * r;
    t.beginPath(), t.arc(h, u, f, Math.PI * 0.95, Math.PI * 2.05), t.stroke();
  }
  t.restore();
}
function Hm(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const i = s.size ?? 40, o = 5, r = 1 - (1 - n) ** 2;
  t.save(), t.strokeStyle = s.color ?? "#222", t.lineWidth = Math.max(1, i * 0.035), t.lineJoin = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  for (let a = 0; a < o; a++) {
    const l = -Math.PI / 2 + (a - (o - 1) / 2) * Math.PI / (o + 1), c = i * (0.3 + 0.7 * r), h = e.x + Math.cos(l) * c, u = e.y + Math.sin(l) * c;
    dp(t, h, u, i * 0.14, n * Math.PI + a), t.stroke();
  }
  t.restore();
}
function dp(t, e, n, s, i) {
  t.beginPath();
  for (let o = 0; o < 10; o++) {
    const r = o % 2 === 0 ? s : s * 0.45, a = i + o * Math.PI / 5 - Math.PI / 2, l = e + Math.cos(a) * r, c = n + Math.sin(a) * r;
    o === 0 ? t.moveTo(l, c) : t.lineTo(l, c);
  }
  t.closePath();
}
const te = {
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
}, Le = 1, bn = 0.55, Qo = 0.35, pp = 1.6, tr = { a: "a", e: "e", i: "i", y: "i", o: "o", u: "u" }, er = { m: "m", b: "m", p: "m", f: "f", v: "f", w: "u", q: "u", l: "l", n: "l", d: "l", t: "l" }, nr = {
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
}, sr = {
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
}, gp = { प: "m", फ: "m", ब: "m", भ: "m", म: "m", व: "u" }, mp = "्", ir = "़", yp = (t) => t >= "क" && t <= "ह", or = /* @__PURE__ */ new Set([".", ",", "!", "?", ";", ":", "…", "।", "॥", "—", "-"]);
function bp(t) {
  const e = [], n = Array.from(t.toLowerCase()), s = (i, o) => {
    const r = e[e.length - 1];
    r && r.viseme === i ? r.weight += o * 0.5 : e.push({ viseme: i, weight: o });
  };
  for (let i = 0; i < n.length; i++) {
    const o = n[i], r = n[i + 1];
    if (or.has(o)) s("rest", pp);
    else if (/\s/.test(o)) {
      const a = e[e.length - 1];
      a && a.viseme !== "rest" && e.push({ viseme: "c", weight: Qo });
    } else if ((o === "o" || o === "e") && r === o)
      s(o === "o" ? "u" : "i", Le), i++;
    else if (o in tr) s(tr[o], Le);
    else if (o in er) s(er[o], bn);
    else {
      if (o === "h") continue;
      if (/[a-z]/.test(o)) s("c", bn);
      else if (o in nr) s(nr[o], Le);
      else if (yp(o)) {
        const a = r === ir ? o === "फ" ? "f" : void 0 : gp[o];
        s(a ?? "c", bn);
        let l = i + 1;
        n[l] === ir && l++;
        const c = n[l];
        c === mp ? i = l : c && c in sr ? (s(sr[c], Le), i = l) : (!c || /\s/.test(c) || or.has(c) || s("a", Le * 0.6), i = l - 1);
      } else (o === "ं" || o === "ँ") && s("l", bn * 0.6);
    }
  }
  for (; e.length > 0 && (e[e.length - 1].viseme === "rest" || e[e.length - 1].weight === Qo); ) e.pop();
  return e;
}
function hl(t, e = {}) {
  const n = e.fields?.mouth ?? "mouth", s = e.fields?.mouthWidth ?? "mouthWidth", i = e.energy ?? 1, o = bp(t.text), r = [{ time: t.start, value: te.rest.mouth }], a = [{ time: t.start, value: te.rest.mouthWidth }], l = o.reduce((h, u) => h + u.weight, 0), c = t.end - t.start;
  if (l > 0 && c > 0) {
    let h = t.start;
    for (const u of o) {
      const f = c * u.weight / l, d = h + Math.min(f * 0.4, 60);
      if (d > r[r.length - 1].time) {
        const g = te[u.viseme];
        r.push({ time: d, value: g.mouth * i, easing: "ease-out" }), a.push({ time: d, value: 1 + (g.mouthWidth - 1) * Math.min(1.3, i), easing: "ease-out" });
      }
      h += f;
    }
  }
  return t.end > r[r.length - 1].time && (r.push({ time: t.end, value: te.rest.mouth, easing: "ease-in-out" }), a.push({ time: t.end, value: te.rest.mouthWidth, easing: "ease-in-out" })), { [n]: r, [s]: a };
}
function Cm(t, e, n = {}) {
  const s = {};
  for (const i of [...e].sort((o, r) => o.start - r.start))
    for (const [o, r] of Object.entries(hl(i, n))) {
      const a = s[o] ??= [], l = a.length > 0 ? a[a.length - 1].time : -1 / 0;
      a.push(...r.filter((c) => c.time > l));
    }
  return Object.entries(s).map(([i, o]) => ({ id: `${t}-${i}`, target: t, property: i, keyframes: o }));
}
function wp(t, e, n, s = {}) {
  if (n.length === 0) return e;
  const i = s.fields?.mouth ?? "mouth", o = s.fields?.mouthWidth ?? "mouthWidth", r = { [i]: te.rest.mouth, [o]: te.rest.mouthWidth, ...s.rest }, a = new Ae({ id: "before-speech", tracks: e }), l = (u, f) => a.getStateAtTime(f).values.get(t)?.get(u) ?? r[u], c = [i, o], h = e.filter((u) => u.target !== t || !c.includes(u.property));
  for (const u of c) {
    const f = e.find((g) => g.target === t && g.property === u);
    let d = f ? [...f.keyframes] : [{ time: 0, value: l(u, 0) }];
    for (const g of n) {
      const p = hl(g, s)[u];
      p[0] = { ...p[0], value: l(u, g.start) }, p[p.length - 1] = { ...p[p.length - 1], value: l(u, g.end) }, d = [...d.filter((m) => m.time < g.start || m.time > g.end), ...p], d.sort((m, y) => m.time - y.time);
    }
    h.push({ id: f?.id ?? `${t}-${u}`, target: t, property: u, keyframes: d });
  }
  return h;
}
const es = {
  look: { summary: "Turns the head and eyes toward a scene x, `viewer`, `ahead` or `back`.", uses: ["toward"] },
  face: { summary: "Turns the whole figure toward a scene x (turning round if needed), `viewer`, `ahead` or `back`.", uses: ["toward"] },
  say: { summary: "Lip-syncs the `say` line with small nods; the beat lasts as long as the line.", needs: ["say"] },
  hold: { summary: "Holds the pose (the acting pass drifts long holds)." },
  stand: { summary: "Back to the rest pose, keeping the way it is turned." },
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
function kp() {
  return [...Object.keys(Ht), ...Object.keys(Kt), ...Object.keys(ce), ...Object.keys(es)];
}
function vp() {
  const t = {};
  for (const e of Object.keys(Ht)) t[e] = `Walks to \`to\` in the ${e} gait, feet planted, turning round first if needed.`;
  for (const e of Object.keys(Kt)) t[e] = `Moves into the ${e} pose and holds it.`;
  for (const e of Object.keys(ce)) t[e] = `The ${e} gag, built on the current pose.`;
  for (const [e, n] of Object.entries(es)) t[e] = n.summary;
  return t;
}
const ai = ["do", "at", "for", "to", "toward", "mood", "say", "pose", "target", "onto"], Sp = {
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
}, wn = ["viewer", "ahead", "back"], Jt = (t) => typeof t == "number" && Number.isFinite(t);
function xp(t) {
  const e = [];
  if (!Array.isArray(t)) return [{ level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = kp(), s = Object.keys(ot), i = Object.keys(z);
  let o = -1 / 0;
  return t.forEach((r, a) => {
    const l = (d) => e.push({ level: "error", beat: a, message: d }), c = (d) => e.push({ level: "warning", beat: a, message: d });
    if (!r || typeof r != "object" || Array.isArray(r)) {
      l(`Each beat must be an object like { do: 'walk', to: 400 } (got ${JSON.stringify(r)}).`);
      return;
    }
    const h = r;
    for (const d of Object.keys(h))
      ai.includes(d) || l(zt("beat field", d, ai, Sp[d.toLowerCase()]));
    const u = h.do;
    if (u === void 0) {
      l(`A beat needs \`do\` (what happens). Actions: ${n.join(", ")}`);
      return;
    }
    if (typeof u != "string" || !n.includes(u)) {
      l(zt("action", u, n));
      return;
    }
    const f = es[u];
    for (const d of f?.needs ?? [])
      h[d] === void 0 && l(`\`${u}\` needs \`${d}\`.`);
    if (u in Ht && h.to === void 0 && c(`\`${u}\` without \`to\` walks nowhere.`), u === "leap" && h.to === void 0 && h.onto === void 0 && c("`leap` without `to` or `onto` jumps on the spot."), h.mood !== void 0 && (typeof h.mood != "string" || !s.includes(h.mood)) && l(zt("mood", h.mood, s)), h.pose !== void 0)
      if (!h.pose || typeof h.pose != "object" || Array.isArray(h.pose))
        l("`pose` is joints to change, an object like { rightShoulder: 90 } (for a named pose, use it as the action).");
      else
        for (const [d, g] of Object.entries(h.pose))
          i.includes(d) ? Jt(g) || l(`Pose joint \`${d}\` must be a number (got ${JSON.stringify(g)}).`) : l(zt("pose joint", d, i));
    for (const d of ["at", "for"]) {
      const g = h[d];
      g !== void 0 && !(Jt(g) && g >= 0) && l(`\`${d}\` is milliseconds, a number ≥ 0 (got ${JSON.stringify(g)}).`);
    }
    Jt(h.at) && (h.at < o && c(`\`at\` ${h.at} is before an earlier beat's \`at\` (${o}); beats run in order, so it starts when the one before ends.`), o = h.at);
    for (const d of ["to", "onto"]) {
      const g = h[d];
      g !== void 0 && !Jt(g) && l(`\`${d}\` is a scene ${d === "to" ? "x" : "y"} in px, a number (got ${JSON.stringify(g)}).`);
    }
    if (h.toward !== void 0 && !Jt(h.toward) && !wn.includes(h.toward) && l(`\`toward\` is a scene x or one of ${wn.join(", ")}${typeof h.toward == "string" && Bs(h.toward, wn) ? ` (did you mean "${Bs(h.toward, wn)}"?)` : ""} (got ${JSON.stringify(h.toward)}).`), h.say !== void 0 && typeof h.say != "string" && l(`\`say\` is the line spoken, a string (got ${JSON.stringify(h.say)}).`), h.target !== void 0) {
      const d = h.target;
      (!d || typeof d != "object" || !Jt(d.x) || !Jt(d.y)) && l("`target` is a point or box in scene px: { x, y } (a code panel’s line(), token() or spot() fits).");
    }
  }), e;
}
function Mp(t) {
  const e = xp(t).filter((n) => n.level === "error");
  if (e.length !== 0)
    throw new Error(`scriptTracks: ${e.length} problem(s) in the beats:
${e.map((n) => `  beat ${n.beat}: ${n.message}`).join(`
`)}`);
}
rf(vp);
const rr = {
  walk: 1e3,
  bouncy: 900,
  doubleBounce: 1100,
  sneak: 1600,
  strut: 1100,
  tired: 1500,
  shove: 1300,
  run: 560
}, Tp = 450, Ep = 2.4, Ap = 160, ar = 2.5, Pp = 200, $p = 340, _p = 1.1, lr = [380, 900], Ip = 0.35, kn = 300, Ts = 150, Hp = 260, Cp = 1.2, Es = 160, cr = 400, Fe = 300, Op = 450, hr = 500, As = 350, ur = 150, Rp = 120, Ps = 180, fr = 420, Lp = 300, dr = 300, Fp = 140, $s = 150, pr = 450, Wp = 450, _s = 150, gr = 350, mr = 400, Bp = 12, Dp = 600, yr = 90, br = 400, Np = 200, Kp = 0.09, wr = 350, Wt = 450, Is = 1200, Yp = 700, ge = 320, Bt = 220, jp = 65, Xp = 700, Hs = (t) => t in Ht, kr = (t) => t in ce, qp = (t) => t in Kt;
function Up(t) {
  return Math.max(Xp, Array.from(t).length * jp);
}
function Om(t, e, n = {}) {
  Mp(e);
  const s = n.from ?? 0, i = n.ground ?? 0, o = n.height ?? 300;
  let r = s, a = i, l = n.facing ?? 1, c = n.start ?? z, h = 0, u = 0;
  const f = [{ time: 0, pose: c }], d = [{ time: 0, value: 0 }], g = [{ time: 0, value: 0 }], p = [{ time: 0, value: 0 }], m = [{ time: 0, value: 0 }], y = [{ time: 0, value: "walk" }], b = [{ time: 0, value: l }], w = [], M = [], x = [], v = (P, R, D, Y) => {
    c = { ...c, ...R }, D && (c = qe(c, D)), f.push({ time: P, pose: c, ...Y === !1 ? { act: Y } : {} });
  }, A = (P, R, D) => (v(P + ge / 2, { turn: 0 }, D), b.push({ time: P + ge / 2, value: l }, { time: P + ge / 2 + 1, value: R }), l = R, v(P + ge, { turn: 1 }), P + ge), C = (P) => P < r ? -1 : 1, T = (P, R, D) => C(R) !== l ? A(P, C(R), D) : P, H = (P, R, D, Y = "arm") => {
    const k = Y === "arm", E = Zt({ ...P, ...k ? { rightShoulder: 0, rightElbow: 0 } : { rightHip: 0, rightKnee: 0 } }, { height: o, facing: l }), S = k ? E.shoulders.right : E.hip, $ = k ? E.elbows.right : E.knees.right, I = (B, K) => Math.atan2(l * B, K) * 180 / Math.PI, N = ((I(R - (r + S.x), D - (a + S.y)) - I($.x - S.x, $.y - S.y)) % 360 + 360) % 360;
    return N > 270 ? N - 360 : N;
  }, _ = (P, R, D, Y) => {
    const k = Y === "arm", E = Zt({ ...P, ...k ? { rightShoulder: 90, rightElbow: 0, rightWrist: 0 } : { rightHip: 90, rightKnee: 0 } }, { height: o, facing: l }), S = k ? E.shoulders.right : E.hip, $ = k ? { x: (E.hands.right.x + E.fingertips.right.x) / 2, y: (E.hands.right.y + E.fingertips.right.y) / 2 } : E.feet.right, I = Math.hypot($.x - S.x, $.y - S.y), F = D - (a + S.y), N = Math.abs(F) < I ? Math.sqrt(I * I - F * F) : I * 0.1;
    return R - S.x - l * N;
  }, O = (P) => {
    const R = Zt(P, { height: o, facing: l });
    return { x: r + (R.hands.right.x + R.fingertips.right.x) / 2, y: a + (R.hands.right.y + R.fingertips.right.y) / 2 };
  }, L = (P, R, D) => {
    const Y = { ...P, rightWrist: 0, rightElbow: 0, rightShoulder: H(P, R, D) }, k = Zt(Y, { height: o, facing: l }), E = { x: r + k.shoulders.right.x, y: a + k.shoulders.right.y }, S = { x: r + k.elbows.right.x, y: a + k.elbows.right.y }, $ = O(Y), I = Math.hypot(S.x - E.x, S.y - E.y), F = Math.hypot($.x - S.x, $.y - S.y), N = Math.min(I + F - 0.01, Math.max(Math.abs(I - F) + 0.01, Math.hypot(R - E.x, D - E.y))), B = (et) => et * 180 / Math.PI, K = B(Math.acos((I * I + N * N - F * F) / (2 * I * N))), G = 180 - B(Math.acos((I * I + F * F - N * N) / (2 * I * F)));
    let Q = { rightShoulder: Y.rightShoulder, rightElbow: 0 }, Z = 1 / 0;
    for (const et of [1, -1])
      for (const q of [1, -1]) {
        const ct = { rightShoulder: Y.rightShoulder + et * K, rightElbow: q * G }, ht = { ...P, rightWrist: 0, ...ct }, yt = O(ht), St = Math.hypot(yt.x - R, yt.y - D) - Zt(ht, { height: o, facing: l }).elbows.right.y * 1e-3;
        St < Z && (Z = St, Q = ct);
      }
    return Q;
  }, W = (P, R, D) => Math.abs(R - r) < 2 ? P : (d.push({ time: P, value: r - s }, { time: P + D, value: R - s, easing: "ease-in-out" }), r = R, P + D);
  for (const P of e) {
    const R = Math.max(P.at ?? u, u === 0 ? 0 : f[f.length - 1].time);
    let D = R, Y, k;
    const E = P.pose ?? {};
    if (Hs(P.do)) {
      const S = P.to ?? r, $ = S === r ? l : C(S);
      let I = R;
      $ !== l ? I = A(R, $, P.mood) : c.turn < 1 ? (I = R + Bt, v(I, { turn: 1, ...E }, P.mood)) : (P.mood || P.pose) && v(R + Bt, E, P.mood);
      const N = Math.abs(S - r) / Io(P.do, o), B = P.for ?? Math.max(Bt * 2, N * rr[P.do]), K = I + B;
      y.push({ time: I, value: P.do }), m.push({ time: I, value: 0 }, { time: I + Bt, value: 1, easing: "ease-out" }), m.push({ time: K - Bt, value: 1 }, { time: K, value: 0, easing: "ease-in" }), p.push({ time: I, value: h }, { time: K, value: h + N }), d.push({ time: I, value: r - s }, { time: K, value: S - s }), h += N, r = S, v(K, {}), D = K;
    } else if (P.do === "zip") {
      const S = P.to ?? r, $ = S === r ? l : C(S);
      let I = R;
      $ !== l ? I = A(R, $, P.mood) : c.turn < 1 && (I = R + Bt, v(I, { turn: 1 }, P.mood));
      const F = Zo("windUp", { at: I, from: P.mood ? qe(c, P.mood) : c });
      f.push(...F), c = F[F.length - 1].pose;
      const N = I + Xn("windUp"), B = N + Tp, K = B + Math.max(Ap, Math.abs(S - r) / Ep);
      y.push({ time: N, value: "run" }), m.push({ time: N, value: 0 }, { time: N + 80, value: 1, easing: "ease-out" }, { time: K, value: 1 }, { time: K + 120, value: 0 }), p.push({ time: N, value: h }, { time: B, value: h + ar, easing: "ease-in" }), h += ar + (K - B) / rr.run * 1.5, p.push({ time: K, value: h }), d.push({ time: B, value: r - s }, { time: K, value: S - s, easing: "ease-in" }), x.push({ kind: "dust", time: B, x: r, y: a, length: 900 }), r = S, v(K, {}), D = K;
    } else if (P.do === "leap") {
      const S = P.to ?? r, $ = P.onto ?? a;
      let I = S === r ? R : T(R, S, P.mood);
      c.turn < 1 && (I += Bt, v(I, { turn: 1 }, P.mood));
      const F = { leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50 };
      v(I + Pp, { stretch: 0.75, bend: 12, leftHip: 22, rightHip: 22, ...F }, P.mood, !1);
      const N = I + $p;
      v(N - 40, { stretch: 0.72 }, void 0, !1), v(N, { stretch: 1.2, bend: -6, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4 }, void 0, !1);
      const B = Math.hypot(S - r, $ - a), K = P.for ?? Math.min(lr[1], Math.max(lr[0], 300 + B * _p)), G = Math.min(a, $) - Ip * o, Q = Math.sqrt(a - G), Z = Math.sqrt($ - G), et = N + K * Q / (Q + Z), q = N + K;
      v(et, { stretch: 1, bend: 4, leftHip: -55, leftKnee: -80, rightHip: 55, rightKnee: 80, leftShoulder: 110, rightShoulder: 110 }, void 0, !1), v(q, { stretch: 0.72, bend: 12, leftShoulder: 75, rightShoulder: 75, leftElbow: 0, rightElbow: 0, leftHip: 18, rightHip: 18, leftKnee: 0, rightKnee: 0 }, void 0, !1), v(q + 180, { stretch: 1.05, bend: -3 }, void 0, !1), v(q + 340, { stretch: 1, bend: 0, leftHip: z.leftHip, rightHip: z.rightHip, leftShoulder: z.leftShoulder, rightShoulder: z.rightShoulder, leftElbow: z.leftElbow, rightElbow: z.rightElbow }, void 0, !1), d.push({ time: N, value: r - s }, { time: q, value: S - s }), g.push(
        { time: N, value: a - i },
        { time: et, value: G - i, easing: "ease-out-quad" },
        { time: q, value: $ - i, easing: "ease-in-quad" }
      ), r = S, a = $, x.push({ kind: "dust", time: q, x: r, y: a, length: 500 }), D = q + 340, Y = q;
    } else if (P.do === "point" && P.target) {
      const S = P.target, $ = T(R, S.x, P.mood), I = { ...c, ...P.mood ? ot[P.mood] : {}, turn: Math.max(c.turn, 0.6), rightElbow: 0, rightWrist: 0, ...E }, F = Zt(I, { height: o, facing: l }).head.center, N = Math.abs(S.x - (r + F.x)), B = S.y - (a + F.y), K = $ + Wt;
      v(K, { ...I, rightShoulder: H(I, S.x, S.y), lookX: 1, lookY: Vp(B / Math.max(1, Math.hypot(N, B))) * 0.8 }), D = K + (P.for ?? Is), Y = K, k = D;
    } else if (P.do === "swipe") {
      const S = P.target ?? { x: r + l * o * 0.5, y: a - o * 0.6 }, $ = C(S.x), I = T(R, S.x, P.mood), F = $ === 1 ? S.left ?? S.x : S.right ?? S.x, N = $ === 1 ? S.right ?? S.x : S.left ?? S.x, B = { ...c, turn: 1, lean: -10, bend: -8, rightElbow: 40, lookX: 1, ...E };
      v(I + kn, { ...B, rightShoulder: H(B, r - l * o * 0.3, a - o * 1.1) }, P.mood, !1);
      const K = { ...c, lean: 6, bend: 4, rightElbow: 0, rightWrist: 0 }, G = { ...c, lean: 14, bend: 12, rightElbow: 0, rightWrist: 0 };
      W(I, _(K, F, S.y, "arm"), kn + Ts), v(I + kn + Ts, { lean: -12 }, void 0, !1);
      const Q = I + kn + Ts + 80;
      v(Q, { ...K, rightShoulder: H(K, F, S.y) }, void 0, !1);
      const Z = Q + (P.for ?? Math.max(Hp, Math.abs(N - F) / Cp));
      d.push({ time: Q, value: r - s }), r = _(G, N, S.y, "arm"), d.push({ time: Z, value: r - s }), v(Z, { ...G, rightShoulder: H(G, N, S.y) }, void 0, !1), v(Z + Es, { lean: 16, bend: 14, rightShoulder: H(c, N + $ * o * 0.4, S.y + o * 0.25) }, void 0, !1), v(Z + Es + cr, { lean: 0, bend: 0, rightShoulder: z.rightShoulder, rightElbow: z.rightElbow }), D = Z + Es + cr, Y = Q, k = Z;
    } else if (P.do === "grab" && P.target) {
      const S = P.target, $ = T(R, S.x, P.mood), I = S.y > a - o * 0.5, F = {
        ...c,
        turn: 1,
        rightElbow: 0,
        bend: I ? 35 : 0,
        lean: I ? 12 : 0,
        stretch: I ? 0.75 : 1,
        lookX: 1,
        lookY: I ? 0.8 : 0,
        ...E
      }, B = W($, _(F, S.x, S.y, "arm"), Fe) + Op;
      v(B, { ...F, rightShoulder: H(F, S.x, S.y) }, P.mood, !1), v(B + 120, {}, void 0, !1), v(B + hr, { bend: 0, lean: -3, stretch: 1, rightShoulder: 165, rightElbow: 20, lookY: -0.6 }), D = B + hr + 150, Y = B;
    } else if (P.do === "throw") {
      const S = P.target?.x ?? P.to ?? r + l * o, $ = T(R, S, P.mood), I = { ...c, turn: 1, lean: -12, bend: -10, rightElbow: 60, stretch: 0.95, lookX: 1, lookY: -0.3, ...E };
      v($ + As, { ...I, rightShoulder: H(I, r - l * o * 0.4, a - o * 1.05) }, P.mood, !1), v($ + As + ur, { lean: -14 }, void 0, !1);
      const F = $ + As + ur + Rp, N = { ...c, lean: 14, bend: 12, rightElbow: 0, stretch: 1.04 };
      f.push({ time: F, pose: c = { ...N, rightShoulder: H(N, r + l * o, a - o * 1.1) }, easing: "ease-in", act: !1 }), v(F + Ps, { lean: 18, bend: 14, rightShoulder: 55, stretch: 1 }, void 0, !1), v(F + Ps + fr, { lean: 0, bend: 0, rightShoulder: z.rightShoulder, rightElbow: z.rightElbow, lookY: 0 }), D = F + Ps + fr, Y = F, k = F;
    } else if (P.do === "kick" && P.target) {
      const S = P.target, $ = T(R, S.x, P.mood), I = { ...c, turn: 1, lean: -12, bend: -6, rightKnee: 0, leftShoulder: 100, rightShoulder: 70 }, F = W($, _(I, S.x, S.y, "leg"), Lp), N = { leftShoulder: 70, rightShoulder: 50, leftElbow: -20, rightElbow: 20 };
      v(F + dr, { turn: 1, lean: 8, bend: 6, rightHip: -40, rightKnee: 80, lookX: 1, lookY: 0.7, ...N, ...E }, P.mood, !1);
      const B = F + dr + Fp, K = H(I, S.x, S.y, "leg");
      f.push({ time: B, pose: c = { ...c, ...I, rightHip: K }, easing: "ease-in", act: !1 }), v(B + $s, { lean: -15, rightHip: K + 20 }, void 0, !1), v(B + $s + pr, {
        lean: 0,
        bend: 0,
        rightHip: z.rightHip,
        rightKnee: 0,
        leftShoulder: z.leftShoulder,
        rightShoulder: z.rightShoulder,
        leftElbow: z.leftElbow,
        rightElbow: z.rightElbow,
        lookY: 0
      }), D = B + $s + pr, Y = B;
    } else if (P.do === "put" && P.target) {
      const S = P.target, $ = T(R, S.x, P.mood), I = S.y > a - o * 0.5, F = { ...c, turn: 1, rightElbow: 0, rightWrist: 0, bend: I ? 35 : 0, lean: I ? 12 : 0, stretch: I ? 0.75 : 1, lookX: 1, lookY: I ? 0.8 : 0, ...E }, B = W($, _(F, S.x, S.y, "arm"), Fe) + Wp;
      v(B, { ...F, rightShoulder: H(F, S.x, S.y) }, P.mood, !1), v(B + _s, {}, void 0, !1), v(B + _s + gr, { bend: 0, lean: 0, stretch: 1, rightShoulder: z.rightShoulder, rightElbow: z.rightElbow, lookY: 0 }), D = B + _s + gr, Y = B;
    } else if (P.do === "write" && P.target) {
      const S = P.target, $ = S.left ?? S.x, I = S.right ?? S.x, F = T(R, ($ + I) / 2, P.mood), N = { ...c, turn: 1, rightElbow: 0, rightWrist: 0, ...ot.thinking, lookX: 1, lookY: 0, ...E }, B = (ht) => _(N, ht, S.y, "arm") + l * o * 0.08, K = (ht) => {
        const yt = O({ ...N, ...L(N, ht, S.y), rightWrist: 0 });
        return Math.hypot(yt.x - ht, yt.y - S.y) < 2;
      }, G = l === 1 ? $ : I, Q = W(F, B(($ + I) / 2), Fe), Z = !K($) || !K(I), et = Z ? W(Q, B($), Fe) + mr : Q + mr;
      v(et, { ...N, ...L(N, Z ? $ : G, S.y) }, P.mood, !1);
      const q = P.for ?? Math.max(Dp, Math.abs(I - $) * Bp);
      Z && d.push({ time: et, value: r - s });
      for (let ht = yr, yt = 0; ht <= q; ht += yr, yt++) {
        const Yt = $ + (I - $) * Math.min(ht, q) / q;
        Z && (r = B(Yt), d.push({ time: et + ht, value: r - s }));
        const St = (yt % 2 === 0 ? -1 : 1) * o * 0.02;
        v(et + ht, L(N, Yt, S.y + St), void 0, !1);
      }
      const ct = et + q;
      v(ct, L(N, I, S.y), void 0, !1), v(ct + br, { rightShoulder: z.rightShoulder, rightElbow: z.rightElbow, ...ot.happy }), D = ct + br, Y = et, k = ct;
    } else if (P.do === "push" && P.target) {
      const S = P.target, $ = P.to ?? S.x, I = T(R, r + ($ >= S.x ? 1 : -1), P.mood), F = l === 1 ? S.left ?? S.x : S.right ?? S.x, N = { ...c, turn: 1, lean: 16, bend: 8, rightWrist: 0, leftWrist: 0, lookX: 1, ...E }, B = _(N, F, S.y, "arm"), K = W(I, B + l * o * 0.06, Fe), G = L(N, F, S.y), Q = { ...N, ...G, leftShoulder: -G.rightShoulder, leftElbow: -G.rightElbow }, Z = K + Np;
      v(Z, Q, P.mood, !1);
      const et = Math.abs($ - S.x), q = Z + (P.for ?? Math.max(600, et / Kp)), ct = et / Io("shove", o);
      y.push({ time: Z, value: "shove" }), m.push({ time: Z, value: 0 }, { time: Z + Bt, value: 1, easing: "ease-out" }, { time: q - Bt, value: 1 }, { time: q, value: 0, easing: "ease-in" }), p.push({ time: Z, value: h }, { time: q, value: h + ct }), h += ct, d.push({ time: Z, value: r - s }, { time: q, value: r + ($ - S.x) - s }), r += $ - S.x, v(q, {}, void 0, !1), v(q + wr, { lean: 0, bend: 0, rightShoulder: z.rightShoulder, leftShoulder: z.leftShoulder, rightElbow: z.rightElbow, leftElbow: z.leftElbow }), D = q + wr, Y = Z, k = q;
    } else if (kr(P.do)) {
      const S = Zo(P.do, { at: R, from: P.mood ? qe(c, P.mood) : c });
      f.push(...S), c = S[S.length - 1].pose, D = R + Xn(P.do), P.do === "take" && x.push({ kind: "dust", time: R + 900, x: r, y: a, length: 500 }), P.do === "land" && x.push({ kind: "dust", time: R + 120, x: r, y: a, length: 500 });
    } else if (P.do === "look" || P.do === "face") {
      const S = P.toward ?? "viewer", $ = P.for ?? Yp;
      if (S === "viewer") v(R + Wt, { turn: 0, lookX: 0, lookY: 0, ...E }, P.mood);
      else if (S === "ahead") v(R + Wt, { turn: P.do === "face" ? 1 : 0.6, lookX: 1, ...E }, P.mood);
      else if (S === "back") v(R + Wt, { turn: 0.2, lookX: -1, ...E }, P.mood);
      else {
        const I = C(S);
        I !== l && P.do === "face" ? (A(R, I, P.mood), v(R + ge + 1, { lookX: 1, ...E })) : I !== l ? v(R + Wt, { turn: 0.25, lookX: -1, ...E }, P.mood) : v(R + Wt, { turn: P.do === "face" ? 1 : 0.6, lookX: 1, ...E }, P.mood);
      }
      D = R + Math.max($, Wt);
    } else if (qp(P.do) || P.do === "stand") {
      const S = P.do === "stand" ? z : Kt[P.do], $ = S.turn !== z.turn ? S.turn : c.turn, I = P.mood ? ot[P.mood] : { lookX: c.lookX, lookY: c.lookY };
      v(R + Wt, { ...S, turn: $, ...I, ...E }), D = R + (P.for ?? Is);
    } else {
      const S = P.for ?? (P.say ? Up(P.say) : Is);
      (P.mood || P.pose) && v(R + Math.min(Wt, S / 2), E, P.mood), D = R + S;
    }
    if (P.say) {
      const S = Hs(P.do) || kr(P.do) ? R : R + Math.min(150, (D - R) / 4), $ = Hs(P.do) ? D : Math.max(S + 200, D - 100);
      w.push({ text: P.say, start: S, end: $ }), P.do === "say" && Jp(f, c, S, $);
    }
    P.onto !== void 0 && P.do !== "leap" && P.onto !== a && (g.push({ time: R, value: a - i }, { time: D, value: P.onto - i, easing: "ease-in-out" }), a = P.onto), D > f[f.length - 1].time && f.push({ time: D, pose: c }), M.push({ start: R, end: D, ...Y !== void 0 ? { contact: Y } : {}, ...k !== void 0 ? { release: k } : {} }), u = D;
  }
  const j = cp(t, Gp(f), n), U = [
    { id: `${t}-x`, target: t, property: "x", keyframes: d },
    { id: `${t}-y`, target: t, property: "y", keyframes: g },
    { id: `${t}-walk`, target: t, property: "walk", keyframes: p },
    { id: `${t}-walking`, target: t, property: "walking", keyframes: m },
    { id: `${t}-gait`, target: t, property: "gait", keyframes: y },
    { id: `${t}-facing`, target: t, property: "facing", keyframes: b }
  ].filter((P) => P.keyframes.length > 1 || P.property === "x");
  return {
    tracks: [...wp(t, j, w, { energy: n.energy }), ...U],
    duration: u,
    lines: w,
    keys: f,
    beats: M,
    effects: x
  };
}
const Vp = (t) => Math.max(-1, Math.min(1, t)), zp = 30;
function Gp(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && n.time - s.time < zp ? e[e.length - 1] = { ...n, time: s.time } : e.push(n);
  }
  return e;
}
function Jp(t, e, n, s) {
  const o = t.filter((l) => l.time > n), r = t.filter((l) => l.time <= n), a = [];
  for (let l = n + 520, c = 0; l < s - 520 / 2; l += 520, c++) {
    const h = c % 2 === 0 ? 3 : -2;
    a.push({ time: l, pose: { ...e, headTilt: e.headTilt + h, leftBrow: e.leftBrow + (c % 2 === 0 ? 0.25 : 0), rightBrow: e.rightBrow + (c % 2 === 0 ? 0.25 : 0) } });
  }
  a.length > 0 && a.push({ time: s, pose: e }), t.length = 0, t.push(...r, ...a.filter((l) => !o.some((c) => Math.abs(c.time - l.time) < 60)), ...o), t.sort((l, c) => l.time - c.time);
}
function Rm(t, e, n) {
  const s = new Ae({ id: `${t}-hand`, tracks: e.filter((l) => l.target === t) }), i = gd({ x: n.x, y: n.y, style: n.style }), o = n.side ?? "right", r = n.every ?? 33, a = [];
  for (let l = n.start; ; l = Math.min(n.end, l + r)) {
    const { joints: c } = Ba(i, { time: l, state: s.getStateAtTime(l) }, t), h = c.hands[o], u = c.fingertips[o];
    if (a.push({ time: l, x: (h.x + u.x) / 2, y: (h.y + u.y) / 2 }), l >= n.end) break;
  }
  return a;
}
const tt = ["rect", "circle", "text", "line", "path", "image", "custom"], Zp = ["rect", "circle", "line", "path"], Oi = {
  x: { description: "Moves it right by this much from where it was placed (an offset; the target’s own x is its place)", unit: "px", types: tt },
  y: { description: "Moves it down by this much from where it was placed (an offset)", unit: "px", types: tt },
  opacity: { description: "How opaque it is", unit: "0..1", min: 0, max: 1, types: tt },
  rotate: { description: "Turns it clockwise about its origin", unit: "degrees", types: tt },
  rotateX: { description: "Tips it about the horizontal axis (3D; shows with perspective)", unit: "degrees", types: tt },
  rotateY: { description: "Turns it about the vertical axis (3D; shows with perspective)", unit: "degrees", types: tt },
  z: { description: "Depth toward the viewer (shows with perspective)", unit: "px", types: tt },
  perspective: { description: "Distance from the viewer: nearer parts grow, further ones shrink", unit: "px", min: 1, types: tt },
  scale: { description: "Size, both ways", unit: "factor", types: tt },
  scaleX: { description: "Width factor", unit: "factor", types: tt },
  scaleY: { description: "Height factor", unit: "factor", types: tt },
  skewX: { description: "Slants it sideways", unit: "degrees", types: tt },
  skewY: { description: "Slants it up and down", unit: "degrees", types: tt },
  originX: { description: "Transform pivot across its box", unit: "% (0 left, 50 centre, 100 right)", min: 0, max: 100, types: tt },
  originY: { description: "Transform pivot down its box", unit: "% (0 top, 50 centre, 100 bottom)", min: 0, max: 100, types: tt },
  fill: { description: "Fill colour (also written fillStyle)", kind: "color", types: tt },
  stroke: { description: "Outline colour (also written strokeStyle)", kind: "color", types: tt },
  strokeWidth: { description: "Outline width (also written lineWidth)", unit: "px", min: 0, types: tt },
  clipTop: { description: "Hides this much from the top edge, for reveals", unit: "% of its height", min: 0, max: 100, types: tt },
  clipRight: { description: "Hides this much from the right edge", unit: "% of its width", min: 0, max: 100, types: tt },
  clipBottom: { description: "Hides this much from the bottom edge", unit: "% of its height", min: 0, max: 100, types: tt },
  clipLeft: { description: "Hides this much from the left edge", unit: "% of its width", min: 0, max: 100, types: tt },
  blur: { description: "Gaussian blur", unit: "px", min: 0, types: tt },
  brightness: { description: "Brightness factor (1 unchanged)", unit: "factor", min: 0, types: tt },
  glow: { description: "Soft glow around it, in glowColor", unit: "px", min: 0, types: tt },
  glowColor: { description: "Colour of the glow", kind: "color", types: tt },
  shadowX: { description: "Drop shadow offset right", unit: "px", types: tt },
  shadowY: { description: "Drop shadow offset down", unit: "px", types: tt },
  shadowBlur: { description: "Drop shadow softness", unit: "px", min: 0, types: tt },
  shadowColor: { description: "Drop shadow colour", kind: "color", types: tt },
  shine: { description: "A highlight sweeping across the fill", unit: "0..1 (progress)", min: 0, max: 1, types: tt },
  drawOn: { description: "How much of the outline is drawn, for drawing a shape on; the fill appears when it is complete", unit: "0..1", min: 0, max: 1, types: Zp },
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
  motionPath: { description: "Moves it along an SVG path (a motion-path track writes motionPathX/Y and, aligned, rotate)", kind: "string", types: tt },
  quaternion: { description: 'A rotation as [x, y, z, w] (a track with interpolation: "slerp")', kind: "list", types: tt }
}, li = { fillStyle: "fill", strokeStyle: "stroke", lineWidth: "strokeWidth", rotateZ: "rotate", motionPathX: "x", motionPathY: "y", motionPathRotate: "rotate" }, Qp = {
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
function tg(t) {
  const e = t, n = Object.entries(Oi).filter(([, i]) => i.types.includes(t.type)).map(([i, { types: o, ...r }]) => ({ name: i, ...r, ...e[i] !== void 0 && typeof e[i] != "object" ? { value: e[i] } : {} }));
  if (t.type !== "custom") return { type: t.type, properties: n };
  const s = t.about;
  for (const [i, o] of Object.entries(t.props ?? {}))
    n.push({ name: i, description: s?.props?.[i]?.description ?? "", ...s?.props?.[i], value: o });
  return { type: "custom", ...s ? { kind: s.kind, summary: s.summary } : {}, properties: n, ...s?.actions ? { actions: s.actions } : {} };
}
function eg(t) {
  const e = tg(t).properties.map((n) => n.name);
  return [...e, ...Object.keys(li).filter((n) => e.includes(li[n]))];
}
function Lm(t, e) {
  const n = [], s = Object.keys(e);
  for (const i of t) {
    const o = (f) => n.push({ level: "error", track: i.id, message: f }), r = e[i.target];
    if (!r) {
      o(zt("target", i.target, s));
      continue;
    }
    const a = eg(r), l = r.type === "custom" && r.acceptsProp?.(i.property);
    if (!a.includes(i.property) && !l) {
      o(`${i.target}: ${zt("property", i.property, a, Qp[i.property])}`);
      continue;
    }
    const c = i.keyframes ?? [];
    for (let f = 1; f < c.length; f++)
      c[f].time < c[f - 1].time && o(`${i.target}.${i.property}: keyframes out of time order (${c[f - 1].time} ms, then ${c[f].time} ms).`);
    const h = Oi[li[i.property] ?? i.property] ?? r.about?.props?.[i.property], u = h && (h.kind ?? "number") === "number";
    for (const f of c) {
      if (u && typeof f.value != "number") {
        o(`${i.target}.${i.property}: values are numbers${h.unit ? ` (${h.unit})` : ""} (got ${JSON.stringify(f.value)} at ${f.time} ms).`);
        break;
      }
      if (u && typeof f.value == "number" && (h.min !== void 0 && f.value < h.min || h.max !== void 0 && f.value > h.max)) {
        n.push({ level: "warning", track: i.id, message: `${i.target}.${i.property}: ${f.value} at ${f.time} ms is outside ${h.min ?? "−∞"}..${h.max ?? "∞"}${h.unit ? ` (${h.unit})` : ""}.` });
        break;
      }
    }
  }
  return n;
}
const ng = {
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
function sg(t) {
  const e = {};
  for (const n of Object.keys(Ht)) e[n] = { summary: `Walks to \`to\` in the ${n} gait.`, needs: ["to"] };
  for (const n of Object.keys(Kt)) e[n] = { summary: `Moves into the ${n} pose and holds it (\`for\` ms).` };
  for (const n of Object.keys(ce)) e[n] = { summary: `The ${n} gag (${Xn(n)} ms).` };
  for (const [n, s] of Object.entries(es)) e[n] = { ...s };
  return {
    ...t ? { version: t } : {},
    timing: "JSON timelines and tracks are in milliseconds; the GSAP-style API (live.to, tf.timeline) takes seconds. Scene x grows right, y grows down, in px.",
    easings: {
      named: Object.keys(ng),
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
    canvasProperties: Oi,
    stickFigure: {
      poseFields: ba,
      props: wa,
      handFields: ka,
      poses: Object.keys(Kt),
      expressions: Object.keys(ot),
      gags: Object.fromEntries(Object.keys(ce).map((n) => [n, Xn(n)])),
      gaits: Object.keys(Ht),
      actingStyles: Object.keys(Pn),
      beatFields: ai,
      actions: e,
      dances: Object.fromEntries(Object.entries(he).map(([n, s]) => [n, Object.keys(s.moves)])),
      flips: Object.fromEntries(Object.entries(ts).map(([n, s]) => [n, s.label])),
      handShapes: Object.keys(mt),
      mudras: Object.keys(Qs)
    },
    character: { poses: Object.keys(ja), expressions: Object.keys(Xa), gags: Object.keys(al) },
    codePanel: {
      languages: oi,
      removeStyles: ii,
      anchors: {
        "line(n, time?)": "line n’s text box { x, y, left, right, top, bottom, width, height }: stand on top, point at x, y",
        "token(n, text, occurrence?, time?)": "a word on a line",
        "spot(n, column, width?, time?)": "a place in a line, for put and write",
        "landing(piece, n, column)": "where a dropped piece will land",
        box: "the whole panel"
      },
      edits: rl
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
const kt = (t) => t.map((e) => `\`${e}\``).join(", "), vr = (t) => Object.entries(t).map(([e, n]) => `| \`${e}\` | ${n.unit ?? n.kind ?? ""} | ${n.description} |`).join(`
`);
function Fm(t) {
  const e = sg(t), n = e.stickFigure;
  return [
    `# tinyfly capabilities${e.version ? ` (v${e.version})` : ""}`,
    "",
    "Generated from the library itself: every name below is accepted, and names not listed are rejected (beat scripts, code panels and `checkTracks` say which name was probably meant).",
    "",
    `**Timing.** ${e.timing}`,
    "",
    "## Easings",
    "",
    `Named: ${kt(e.easings.named)}.`,
    "",
    ...Object.entries(e.easings.parametric).map(([i, o]) => `- ${i}: \`${o}\``),
    "",
    "## Track kinds",
    "",
    ...Object.entries(e.trackKinds).map(([i, o]) => `- **${i}**: ${o}`),
    "",
    "## Canvas targets",
    "",
    "Types: `rect`, `circle`, `text`, `line`, `path`, `image`, `custom`. `describeTarget(target)` lists what one can animate with its values; `checkTracks(tracks, targets)` checks tracks before playing them.",
    "",
    "| Property | Unit | What it does | Types |",
    "|---|---|---|---|",
    ...Object.entries(e.canvasProperties).map(
      ([i, o]) => `| \`${i}\` | ${o.unit ?? o.kind ?? ""} | ${o.description} | ${o.types.length === 7 ? "all" : o.types.join(", ")} |`
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
    vr(n.poseFields),
    "",
    "### Other props",
    "",
    "| Prop | Unit | What it does |",
    "|---|---|---|",
    vr(n.props),
    "",
    `With \`style.hands\`, each hand has \`hand.left.<field>\` / \`hand.right.<field>\` props: ${kt(Object.keys(n.handFields))}.`,
    "",
    `**Poses** (a beat's \`do\`, or a pose key): ${kt(n.poses)}.`,
    "",
    `**Expressions** (a beat's \`mood\`): ${kt(n.expressions)}.`,
    "",
    `**Gags** (ms): ${Object.entries(n.gags).map(([i, o]) => `\`${i}\` (${o})`).join(", ")}.`,
    "",
    `**Gaits**: ${kt(n.gaits)}. **Acting styles** (\`style\`): ${kt(n.actingStyles)}.`,
    "",
    "### Beat scripts",
    "",
    `\`scriptTracks(target, beats, { from, ground, height, facing, style })\`. A beat has these fields only: ${kt(n.beatFields)}. Times are ms; \`to\` and \`target\` are scene px; \`onto\` is a floor's scene y.`,
    "",
    "| `do` | Needs | What happens |",
    "|---|---|---|",
    ...Object.entries(n.actions).map(([i, o]) => `| \`${i}\` | ${(o.needs ?? []).map((r) => `\`${r}\``).join(", ")} | ${o.summary} |`),
    "",
    "Beats that touch something report `contact` (and `release`) times in `result.beats[i]`; key the thing they touch to those.",
    "",
    `**Dances** (\`dancer(style, { move })\`): ${Object.entries(n.dances).map(([i, o]) => `\`${i}\` (${o.join(", ")})`).join("; ")}.`,
    "",
    `**Flips**: ${Object.entries(n.flips).map(([i, o]) => `\`${i}\` (${o})`).join(", ")}.`,
    "",
    `**Hand shapes**: ${kt(n.handShapes)}. **Mudras**: ${kt(n.mudras)}.`,
    "",
    "## Character (v2 human)",
    "",
    `Poses: ${kt(e.character.poses)}. Expressions: ${kt(e.character.expressions)}. Gags: ${kt(e.character.gags)}.`,
    "",
    "## Code panel",
    "",
    `\`codePanel({ code, language, x, y, fontSize?, lineHeight?, width? })\`: a code listing as a scene object. Languages: ${kt(e.codePanel.languages)}. Remove styles: ${kt(e.codePanel.removeStyles)}.`,
    "",
    ...Object.entries(e.codePanel.anchors).map(([i, o]) => `- \`${i}\`: ${o}`),
    "",
    ...Object.values(e.codePanel.edits).map((i) => `- \`${i.split(":")[0]}\`:${i.split(":").slice(1).join(":")}`),
    "",
    "## Camera shots (`cameraTracks(shots, { stage })`)",
    "",
    ...Object.entries(e.cameraShots).map(([i, o]) => `- **${i}**: \`${o}\``),
    "",
    "## Teaching (`@algorisys/tinyfly/teach`)",
    "",
    ...Object.entries(e.teach).map(([i, o]) => `- \`${i}\`: ${o}`),
    "",
    "## Command line",
    "",
    ...Object.entries(e.cli).map(([i, o]) => `- \`${i}\`: ${o}`),
    ""
  ].join(`
`);
}
function Wm(t) {
  const { timeline: e } = t, n = new ie();
  for (const [c, h] of Object.entries(t.targets)) {
    const u = typeof h == "string" ? document.querySelector(h) : h;
    if (!u)
      throw new Error(`quickPlay: no element found for target "${c}" (${String(h)})`);
    n.registerTarget(c, u);
  }
  e.onUpdate = (c) => {
    n.applyState(c), t.onUpdate?.(c);
  }, t.onComplete && (e.onComplete = t.onComplete);
  let s = null, i = null, o = !1;
  const r = (c) => {
    if (o) return;
    const h = i === null ? 0 : c - i;
    i = c, h > 0 && e.tick(h), s = requestAnimationFrame(r);
  }, a = () => {
    s !== null || o || (i = null, s = requestAnimationFrame(r));
  }, l = () => {
    s !== null && cancelAnimationFrame(s), s = null, i = null;
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
      o = !0, l(), e.stop(), n.clearTargets();
    }
  };
}
const Bm = {
  timeline: gh,
  to(t, e, n) {
    const s = new ke(n);
    return s.to(t, e), s;
  },
  from(t, e, n) {
    const s = new ke(n);
    return s.from(t, e), s;
  },
  fromTo(t, e, n, s) {
    const i = new ke(s);
    return i.fromTo(t, e, n), i;
  },
  set(t, e, n) {
    const s = new ke(n);
    return s.set(t, e), s;
  }
};
function ul(t, e, n) {
  if (typeof OffscreenCanvas < "u") return new OffscreenCanvas(e, n);
  const s = t.canvas;
  if (s?.ownerDocument) {
    const i = s.ownerDocument.createElement("canvas");
    return i.width = e, i.height = n, i;
  }
  try {
    return s?.constructor ? new s.constructor(e, n) : null;
  } catch {
    return null;
  }
}
function ig(t, e) {
  const n = t.length / 4, s = new Float32Array(n * 3), i = Math.min(0.999, Math.max(0, e));
  for (let o = 0; o < n; o++) {
    const r = t[o * 4] / 255, a = t[o * 4 + 1] / 255, l = t[o * 4 + 2] / 255, c = t[o * 4 + 3] / 255, h = Math.max(r, a, l);
    if (h <= i) continue;
    const u = (h - i) / (1 - i) * c / h;
    s[o * 3] = r * u, s[o * 3 + 1] = a * u, s[o * 3 + 2] = l * u;
  }
  return s;
}
function Sr(t, e, n, s, i) {
  const o = new Float32Array(t.length), r = i ? n : e, a = i ? e : n, l = (h, u) => (i ? h * e + u : u * e + h) * 3, c = s * 2 + 1;
  for (let h = 0; h < r; h++)
    for (let u = 0; u < 3; u++) {
      let f = 0;
      for (let d = -s; d <= s; d++) f += t[l(h, Math.min(a - 1, Math.max(0, d))) + u];
      for (let d = 0; d < a; d++) {
        o[l(h, d) + u] = f / c;
        const g = t[l(h, Math.max(0, d - s)) + u], p = t[l(h, Math.min(a - 1, d + s + 1)) + u];
        f += p - g;
      }
    }
  return o;
}
function xr(t, e, n, s) {
  const i = Math.max(1, Math.round(s / Math.sqrt(3)));
  let o = t;
  for (let r = 0; r < 3; r++)
    o = Sr(o, e, n, i, !0), o = Sr(o, e, n, i, !1);
  return o;
}
function Dm(t, e = {}) {
  const n = t.canvas, s = n.width, i = n.height;
  if (!(s > 0 && i > 0)) return;
  const o = Math.max(1, Math.round(e.downsample ?? 4)), r = Math.max(1, Math.ceil(s / o)), a = Math.max(1, Math.ceil(i / o)), l = ul(t, r, a), c = l?.getContext("2d");
  if (!l || !c) return;
  c.imageSmoothingEnabled = !0, c.drawImage(t.canvas, 0, 0, r, a);
  const h = ig(c.getImageData(0, 0, r, a).data, e.threshold ?? 0.55), u = (e.radius ?? Math.max(s, i) * 0.02) / o, f = xr(h, r, a, u), d = xr(h, r, a, u * 3), g = e.halo ?? 0.6, p = c.createImageData(r, a);
  for (let m = 0; m < r * a; m++) {
    for (let y = 0; y < 3; y++) p.data[m * 4 + y] = Math.round(Math.min(1, f[m * 3 + y] + d[m * 3 + y] * g) * 255);
    p.data[m * 4 + 3] = 255;
  }
  c.putImageData(p, 0, 0), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalCompositeOperation = "lighter", t.globalAlpha = Math.max(0, e.strength ?? 0.9), t.imageSmoothingEnabled = !0, t.drawImage(l, 0, 0, s, i), t.restore();
}
function Nm(t, e, n) {
  const s = n.width ?? 6, i = n.taper ?? 1, o = n.fade ?? 1, r = n.opacity ?? 1, a = n.blend === "add";
  if (t.save(), e.length >= 2) {
    const c = rg(e, s, i, o, r);
    a ? (t.globalCompositeOperation = "lighter", ci(t, c, n.color)) : ag(t, c, n.color);
  }
  const l = e[e.length - 1];
  if (n.head && l && n.head.radius > 0) {
    a && (t.globalCompositeOperation = "lighter");
    const c = n.head.color ?? n.color, h = t.createRadialGradient(l.at.x, l.at.y, 0, l.at.x, l.at.y, n.head.radius);
    h.addColorStop(0, c), h.addColorStop(0.35, c), h.addColorStop(1, og(t, c)), t.globalAlpha = r, t.fillStyle = h, t.beginPath(), t.arc(l.at.x, l.at.y, n.head.radius, 0, Math.PI * 2), t.fill();
  }
  t.restore();
}
function og(t, e) {
  t.fillStyle = e;
  const n = String(t.fillStyle), s = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(n);
  if (s) return `rgba(${parseInt(s[1], 16)}, ${parseInt(s[2], 16)}, ${parseInt(s[3], 16)}, 0)`;
  const i = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(n);
  return i ? `rgba(${i[1]}, ${i[2]}, ${i[3]}, 0)` : "rgba(0, 0, 0, 0)";
}
function rg(t, e, n, s, i) {
  const o = t.map((c) => ({ x: c.at.x, y: c.at.y, width: e * (1 - n * c.age) })), r = Dc(o), a = Nc(o) ?? void 0, l = [];
  for (let c = 0; c + 1 < t.length; c++) {
    const h = (t[c].age + t[c + 1].age) / 2, u = i * (1 - s * h);
    if (u <= 0) continue;
    const f = c + 2 === t.length;
    l.push({ corners: [r.left[c], r.left[c + 1], r.right[c + 1], r.right[c]], alpha: u, ...f && a && { cap: a } });
  }
  return l;
}
function ci(t, e, n) {
  t.fillStyle = n;
  for (const s of e) {
    const [i, o, r, a] = s.corners;
    t.globalAlpha = Math.min(1, s.alpha), t.beginPath(), t.moveTo(i.x, i.y), t.lineTo(o.x, o.y), s.cap && t.arc(s.cap.x, s.cap.y, s.cap.radius, s.cap.start, s.cap.start - Math.PI, !0), t.lineTo(r.x, r.y), t.lineTo(a.x, a.y), t.closePath(), t.fill();
  }
}
function ag(t, e, n) {
  const s = typeof t.getTransform == "function" ? t.getTransform() : null, i = (p) => s ? { x: s.a * p.x + s.c * p.y + s.e, y: s.b * p.x + s.d * p.y + s.f } : p, o = s ? Math.sqrt(Math.abs(s.a * s.d - s.b * s.c)) : 1, r = e.map((p) => ({
    ...p,
    corners: p.corners.map(i),
    ...p.cap && { cap: { ...p.cap, ...i(p.cap), radius: p.cap.radius * o, start: p.cap.start + (s ? Math.atan2(s.b, s.a) : 0) } }
  }));
  let a = 1 / 0, l = 1 / 0, c = -1 / 0, h = -1 / 0;
  for (const p of r) {
    const m = p.cap ? [{ x: p.cap.x - p.cap.radius, y: p.cap.y - p.cap.radius }, { x: p.cap.x + p.cap.radius, y: p.cap.y + p.cap.radius }] : [];
    for (const y of [...p.corners, ...m])
      a = Math.min(a, y.x), l = Math.min(l, y.y), c = Math.max(c, y.x), h = Math.max(h, y.y);
  }
  if (!(c > a && h > l)) return;
  const u = Math.floor(a) - 1, f = Math.floor(l) - 1, d = s ? ul(t, Math.ceil(c) + 1 - u, Math.ceil(h) + 1 - f) : null, g = d?.getContext("2d");
  if (!d || !g) {
    ci(t, e, n);
    return;
  }
  g.translate(-u, -f), g.globalCompositeOperation = "lighter", ci(g, r, n), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalAlpha = 1, t.drawImage(d, u, f), t.restore();
}
const Km = $t.to, Ym = $t.from, jm = $t.fromTo, Xm = $t.set, qm = $t.timeline, Um = $t.ticker, Vm = $t.splitText, zm = $t.context, Gm = $t.matchMedia, Jm = $t.quickTo, Zm = $t.imageSequence, Qm = $t.pageTransition;
sf();
export {
  Pn as ACTING_STYLES,
  ai as BEAT_FIELDS,
  Oi as CANVAS_PROPERTIES,
  oi as CODE_LANGUAGES,
  rl as CODE_PANEL_EDITS,
  D0 as CODE_THEME,
  hg as Clock,
  ke as CompatTimeline,
  Eu as CustomBounce,
  Tu as CustomEase,
  Au as CustomWiggle,
  he as DANCE_STYLES,
  Lr as DEFAULT_BAKE_INTERVAL_MS,
  Li as DEFAULT_INERTIA_FRICTION,
  Bu as DEFAULT_LABELS,
  _t as DEFAULT_SPRING,
  Ug as DEFAULT_TRANSITION,
  ca as Draggable,
  ot as EXPRESSIONS,
  gf as FINGERS,
  ts as FLIPS,
  Ri as FORMAT_VERSION,
  ce as GAGS,
  Ht as GAITS,
  rr as GAIT_CYCLE_MS,
  ft as HAND_REST,
  mt as HAND_SHAPES,
  lp as HUMAN_ACTING_RIG,
  Xa as HUMAN_EXPRESSIONS,
  al as HUMAN_GAGS,
  ja as HUMAN_POSES,
  dt as HUMAN_REST,
  R0 as IDENTITY_CAMERA,
  bl as INERTIA_MAX_DURATION_MS,
  pc as InertiaTrackPlayer,
  Nt as LiveTimeline,
  yg as MORPH_SAMPLES,
  Qs as MUDRAS,
  cg as ManualClock,
  xo as MediaSync,
  Dh as Observer,
  Kt as POSES,
  ii as REMOVE_STYLES,
  z as REST_POSE,
  es as SCRIPT_ACTIONS,
  Pr as SPRING_MAX_DURATION_MS,
  ns as SPRING_PRESETS,
  We as SPRING_STEP_MS,
  op as STICK_ACTING_RIG,
  lu as ScrollAnimator,
  Zn as ScrollDriver,
  cu as ScrollMarkers,
  su as ScrollPin,
  mo as SmoothScroll,
  Un as SpringSampler,
  dc as SpringTrackPlayer,
  Hh as Stage,
  Ae as Timeline,
  vi as TinyflyPlayer,
  of as TinyflySequencer,
  as as TrackPlayer,
  te as VISEMES,
  Ag as ValueResolver,
  nu as VisibilityDriver,
  $m as actCharacterTracks,
  ll as actKeyframes,
  cp as actTracks,
  kp as actionNames,
  eg as animatableProperties,
  Dm as applyBloom,
  mm as applyCamera,
  xd as applyGroove,
  Mp as assertBeats,
  _l as backOut,
  nm as bakeDanceTracks,
  Dr as bakeEasing,
  Wr as bakeInertiaTrack,
  Fr as bakeSpringTrack,
  Pm as basicOutfit,
  Qg as beatAt,
  pi as beatAtTime,
  Vr as beatLength,
  di as beatTime,
  Cg as beatsBetween,
  Gu as bindChoiceHotspots,
  tn as blendPose,
  Sa as boilFrame,
  $l as bounceOut,
  gm as cameraFromValues,
  ym as cameraPoint,
  Rg as cameraTracks,
  sg as capabilities,
  Fm as capabilitiesMarkdown,
  w0 as character,
  fm as characterAt,
  T0 as characterHandPose,
  S0 as characterJoints,
  lm as characterJointsInView,
  pm as characterObjects,
  dm as characterPoseTracks,
  um as characterTarget,
  mc as charactersFor,
  xp as checkBeats,
  Lm as checkTracks,
  wm as circlePath,
  da as clamp01,
  bg as clearMorphCache,
  gg as clearPathCache,
  ol as clipErased,
  Bs as closestName,
  Mm as codePanel,
  z0 as codeTokens,
  fo as containerProgressAt,
  zm as context,
  jg as create,
  Yu as createControls,
  Al as createCubicBezier,
  Cu as createLive,
  xa as createPen,
  Gn as createRandom,
  Ws as createTrack,
  dg as criticalDamping,
  Ac as customBounce,
  Ec as customEase,
  Pc as customWiggle,
  Ei as danceFrame,
  Jg as dancePose,
  ti as danceStance,
  Zg as danceTaps,
  em as danceTracks,
  bs as danceTravel,
  Ad as danceTravelTrack,
  tm as dancer,
  tg as describeTarget,
  Ve as deserializeTimeline,
  vc as deserializeTrack,
  Og as detectTempo,
  Bg as draggable,
  Mi as drawCartoonHand,
  A0 as drawCharacter,
  P0 as drawCharacterInView,
  Im as drawDustPuff,
  el as drawEraser,
  sl as drawHand,
  Hm as drawImpactStars,
  L0 as drawPencil,
  up as drawSpeedLines,
  ud as drawStickFigure,
  _m as drawStickSmear,
  Nm as drawTrail,
  km as drawnPathTarget,
  xl as easeIn,
  $r as easeInCubic,
  Tl as easeInOut,
  zn as easeInOutCubic,
  Sl as easeInOutQuad,
  kl as easeInQuad,
  Ml as easeOut,
  _r as easeOutCubic,
  vl as easeOutQuad,
  Lc as editDistance,
  Pl as elasticOut,
  Ao as ellipsePoints,
  xm as erasable,
  uc as expandParametricEasings,
  jd as flipPose,
  sm as flipTracks,
  Xd as flipTravel,
  Mr as formatVersionFor,
  Ym as from,
  Mg as fromJSON,
  jm as fromTo,
  Zo as gag,
  Xn as gagDuration,
  Lf as gaitPose,
  Io as gaitStrideLength,
  Tt as getEasingFunction,
  In as getInterpolator,
  Nr as getMotionPathPoint,
  mg as getPathLength,
  Nl as getPointAtProgress,
  Kh as gridLinesFor,
  bm as handAt,
  zs as handJoints,
  Af as handJointsAt,
  Rm as handPath,
  ut as handPose,
  Bn as handProp,
  dl as hasKeyframes,
  rn as hashSeed,
  zg as headPoint,
  pl as heldTime,
  om as humanFieldLabel,
  Am as humanGag,
  Tm as humanGaitPose,
  Em as humanGaitStrideLength,
  o0 as humanPlan,
  At as humanPose,
  Zm as imageSequence,
  sn as inertiaDuration,
  nn as inertiaRest,
  Os as inertiaValueAt,
  pg as inertiaVelocityAt,
  lc as interpolateArray,
  ac as interpolateColor,
  Sg as interpolateMotionPath,
  Dt as interpolateNumber,
  hc as interpolatePathString,
  cc as interpolateQuaternion,
  Gi as interpolateString,
  fl as isCubicBezierEasing,
  re as isInertiaTrack,
  lg as isMotionPathPoint,
  Tr as isMotionPathTrack,
  $n as isParametricEasing,
  on as isPathData,
  ae as isSpringTrack,
  hi as isTextTrack,
  fg as isUnderdamped,
  Eg as isUnresolved,
  $0 as jointsInScene,
  hd as jointsToScene,
  Rs as linear,
  hl as lipSyncKeyframes,
  wp as lipSyncOver,
  Cm as lipSyncTracks,
  $t as live,
  Cn as mapEase,
  Wg as mat4,
  Gm as matchMedia,
  Ar as maxStaggerDistance,
  im as mirrorHumanPose,
  vd as mirrorPose,
  Qe as mixHandPoses,
  cm as mixPoses,
  Ql as morphPath,
  Zu as mount,
  ef as mountAll,
  $g as narrationMarkers,
  _g as narrationSceneAt,
  _n as naturalRest,
  Ig as nearestBeat,
  Hg as nextBeat,
  Qm as pageTransition,
  Hl as parametricEasing,
  uo as parseEdge,
  xe as parsePath,
  fa as parseTrigger,
  Ze as partialPath,
  lf as pathLength,
  Pg as planNarration,
  Yg as play,
  qg as playSequence,
  Ng as playWhenVisible,
  Kr as playheadCrossings,
  Si as pointAlong,
  Ir as pointAtDistance,
  am as pointOnHead,
  Fc as pointsToPath,
  bt as pose,
  Gg as poseTracks,
  wg as quat,
  Wm as quickPlay,
  Jm as quickTo,
  jr as randomBetween,
  Tg as randomChoice,
  xc as randomSnapped,
  hm as reachCharacter,
  Z0 as resolveActingStyle,
  tl as resolveCharacterPoseKeys,
  Qn as resolveGait,
  Da as resolvePoseKeys,
  Mc as resolveSequence,
  Fa as resolveStickFrame,
  fd as resolveStickPose,
  Ur as resolveValue,
  Dc as ribbon,
  Nc as ribbonHeadCap,
  oe as rotateAbout,
  Ai as routineBeats,
  Ee as rubberLimb,
  vp as scriptActionSummaries,
  Om as scriptTracks,
  Dg as scrollProgress,
  Kg as scrubOnScroll,
  vm as scrubPath,
  Vg as seatHeight,
  Sc as serializeTimeline,
  kc as serializeTrack,
  Xm as set,
  gi as shapeToPathData,
  fc as simplifyKeyframes,
  za as skeletonInView,
  qs as sketchPen,
  eu as smoothToward,
  Nh as snapAxis,
  ou as snapConfig,
  au as snapDuration,
  ru as snapProgress,
  $i as solvePlanSpace,
  bp as soundsOf,
  Up as speechDuration,
  Vm as splitText,
  gl as springDuration,
  ug as springValueAt,
  Va as stagePlanSpace,
  Er as staggerDistance,
  ui as staggerOffset,
  Cs as staggerOffsets,
  qn as staggerSpan,
  Il as stepsEasing,
  Ba as stickFigureAt,
  Zt as stickFigureJoints,
  gd as stickFigureTarget,
  rm as stickToHuman,
  Bf as strideLength,
  Wu as syncMediaElement,
  Df as talkingMouth,
  xi as taperedLine,
  Tn as taperedOutline,
  bc as textAt,
  Bm as tf,
  Um as ticker,
  qm as timeline,
  Km as to,
  xg as toJSON,
  kg as toKeyframedTrack,
  vg as toKeyframedTracks,
  ee as trackTargets,
  Lg as trailSamples,
  Je as triggerDistance,
  zt as unknownName,
  Xg as unmount,
  Fg as vec3,
  Wf as walkPose,
  Sm as withErased,
  qe as withExpression
};
