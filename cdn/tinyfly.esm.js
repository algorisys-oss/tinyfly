function Mo(e) {
  return typeof e == "object" && e !== null && e.type === "cubic-bezier";
}
function Re(e) {
  return typeof e == "object" && e !== null && e.type !== "cubic-bezier";
}
const xi = 2;
function Bs(e) {
  return e.some((t) => t.interpolation !== void 0) ? 2 : 1;
}
function Zn(e) {
  return e.property === "text" && "textConfig" in e;
}
function Tt(e) {
  return e.kind === "inertia" && "inertia" in e;
}
function xt(e) {
  return e.kind === "spring" && "spring" in e;
}
function Ds(e) {
  return e.property === "motionPath" && "motionPathConfig" in e;
}
function sd(e) {
  return typeof e == "object" && e !== null && "x" in e && "y" in e && "angle" in e;
}
function To(e) {
  return "keyframes" in e;
}
class rd {
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
class od {
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
function ad(e, t) {
  if (!(t > 0)) return e;
  const n = 1e3 / t;
  return Math.floor(e / n + 1e-9) * n;
}
function Ws(e, t, n = "start") {
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
function Ns(e, t = "start") {
  if (e <= 1) return 0;
  let n = 0;
  for (let i = 0; i < e; i++)
    n = Math.max(n, Ws(i, e, t));
  return n;
}
function Qn(e, t, n) {
  if (n.offsets) return n.offsets[e] ?? 0;
  const i = n.from ?? "start", s = Ws(e, t, i);
  if (n.amount !== void 0) {
    const r = Ns(t, i);
    return r === 0 ? 0 : n.amount * s / r;
  }
  return n.each !== void 0 ? n.each * s : 0;
}
function An(e, t) {
  return Array.from({ length: e }, (n, i) => Qn(i, e, t));
}
function Ge(e, t) {
  return e <= 1 ? 0 : Math.max(...An(e, t));
}
const jt = 1, Ks = 6e4, ge = Ks / jt, et = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, nn = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class Je {
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
    this.from = t.from, this.to = t.to, this.stiffness = t.stiffness ?? et.stiffness, this.damping = t.damping ?? et.damping, this.mass = t.mass ?? et.mass, this.restDelta = t.restDelta ?? et.restDelta, this.restSpeed = t.restSpeed ?? et.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = t.velocity ?? et.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = Math.floor(t / jt);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const i = this.samples[Math.min(n, this.samples.length - 1)], s = this.samples[Math.min(n + 1, this.samples.length - 1)], r = t / jt - n;
    return i + (s - i) * r;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(ge + 1), this.settledStep !== null ? this.settledStep * jt : Ks;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(t) {
    if (this.settledStep !== null) return;
    const n = Math.min(t, ge + 1), i = jt / 1e3;
    for (; this.samples.length < n; ) {
      const s = this.samples[this.samples.length - 1], r = s - this.to, o = -this.stiffness * r, a = -this.damping * this.velocity, l = (o + a) / this.mass;
      this.velocity += l * i;
      const h = s + this.velocity * i;
      if (this.samples.push(h), this.isAtRest(h)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > ge && (this.settledStep = ge);
  }
}
function ld(e, t) {
  return new Je(e).valueAt(t);
}
function xo(e) {
  return new Je(e).settleTime();
}
function hd(e) {
  const t = e.stiffness ?? et.stiffness, n = e.damping ?? et.damping, i = e.mass ?? et.mass;
  return n < 2 * Math.sqrt(t * i);
}
function cd(e) {
  const t = e.stiffness ?? et.stiffness, n = e.mass ?? et.mass;
  return 2 * Math.sqrt(t * n);
}
const Ei = 4, Eo = 2e-3, Ao = 1e-4, Po = 6e4;
function Ze(e) {
  const t = e.friction ?? Ei;
  return t > 0 ? t : Ei;
}
function Le(e) {
  return e.from + e.velocity / Ze(e);
}
function _o(e, t) {
  if (t === void 0) return e;
  if (typeof t == "number")
    return t > 0 ? Math.round(e / t) * t : e;
  if (t.length === 0) return e;
  let n = t[0];
  for (const i of t)
    Math.abs(i - e) < Math.abs(n - e) && (n = i);
  return n;
}
function ue(e) {
  let t = _o(Le(e), e.end);
  return e.min !== void 0 && (t = Math.max(e.min, t)), e.max !== void 0 && (t = Math.min(e.max, t)), t;
}
function fe(e) {
  const t = Math.abs(ue(e) - e.from);
  if (t === 0) return 0;
  const n = e.restDelta ?? Math.max(Ao, t * Eo);
  if (n >= t) return 0;
  const i = Math.log(t / n) / Ze(e);
  return Math.min(Po, i * 1e3);
}
function Pn(e, t) {
  if (t <= 0) return e.from;
  const n = ue(e);
  if (t >= fe(e)) return n;
  const i = Ze(e);
  return e.from + (n - e.from) * (1 - Math.exp(-i * t / 1e3));
}
function ud(e, t) {
  const n = Ze(e), i = ue(e);
  return t >= fe(e) ? 0 : (i - e.from) * n * Math.exp(-n * Math.max(0, t) / 1e3);
}
const _n = (e) => e, Ho = (e) => e * e, Io = (e) => 1 - (1 - e) * (1 - e), Co = (e) => e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2, Ys = (e) => e * e * e, qs = (e) => 1 - Math.pow(1 - e, 3), Qe = (e) => e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2, $o = Ys, Ro = qs, Lo = Qe, Oo = {
  linear: _n,
  "ease-in": $o,
  "ease-out": Ro,
  "ease-in-out": Lo,
  "ease-in-quad": Ho,
  "ease-out-quad": Io,
  "ease-in-out-quad": Co,
  "ease-in-cubic": Ys,
  "ease-out-cubic": qs,
  "ease-in-out-cubic": Qe
};
function Fo(e) {
  const [t, n, i, s] = e, r = 3 * t, o = 3 * (i - t) - r, a = 1 - r - o, l = 3 * n, h = 3 * (s - n) - l, c = 1 - l - h, f = (d) => ((a * d + o) * d + r) * d, u = (d) => ((c * d + h) * d + l) * d, p = (d) => (3 * a * d + 2 * o) * d + r, m = (d) => {
    let g = d;
    for (let w = 0; w < 8; w++) {
      const S = f(g) - d;
      if (Math.abs(S) < 1e-7)
        return g;
      const v = p(g);
      if (Math.abs(v) < 1e-7)
        break;
      g -= S / v;
    }
    let y = 0, b = 1;
    for (g = d; y < b; ) {
      const w = f(g);
      if (Math.abs(w - d) < 1e-7)
        return g;
      d > w ? y = g : b = g, g = (y + b) / 2;
    }
    return g;
  };
  return (d) => {
    if (d <= 0) return 0;
    if (d >= 1) return 1;
    const g = m(d);
    return u(g);
  };
}
function sn(e, t = "out") {
  if (t === "out") return e;
  const n = (i) => 1 - e(1 - i);
  return t === "in" ? n : (i) => i < 0.5 ? n(i * 2) / 2 : e(i * 2 - 1) / 2 + 0.5;
}
function Bo(e = 1, t = 0.3) {
  const n = Math.max(1, e), i = t / (2 * Math.PI) * Math.asin(1 / n);
  return (s) => s <= 0 ? 0 : s >= 1 ? 1 : n * Math.pow(2, -10 * s) * Math.sin((s - i) * (2 * Math.PI) / t) + 1;
}
const Do = (e) => {
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
function Wo(e = 1.70158) {
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const n = t - 1;
    return n * n * ((e + 1) * n + e) + 1;
  };
}
function No(e, t = "end") {
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
function Ko(e) {
  switch (e.type) {
    case "steps":
      return No(e.count, e.position);
    case "elastic":
      return sn(Bo(e.amplitude, e.period), e.mode);
    case "bounce":
      return sn(Do, e.mode);
    case "back":
      return sn(Wo(e.overshoot), e.mode);
  }
}
function J(e) {
  return e === void 0 ? _n : Mo(e) ? Fo(e.points) : Re(e) ? Ko(e) : Oo[e] ?? _n;
}
const Ai = 32, Yo = 256, Ht = /* @__PURE__ */ new Map(), qo = /[MmLlHhVvCcSsQqTtAaZz]/, Xo = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, Vo = {
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
function Uo(e) {
  const t = [];
  let n = 0, i = null;
  const s = () => {
    for (; n < e.length && /[\s,]/.test(e[n]); ) n++;
  };
  for (; n < e.length && (s(), !(n >= e.length)); ) {
    const r = e[n];
    if (qo.test(r)) {
      i = { type: r, args: [] }, t.push(i), n++;
      continue;
    }
    if (!i) break;
    const o = i.type === "A" || i.type === "a", a = i.args.length % 7;
    if (o && (a === 3 || a === 4)) {
      if (r !== "0" && r !== "1") break;
      i.args.push(r === "1" ? 1 : 0), n++;
      continue;
    }
    const l = Xo.exec(e.slice(n));
    if (!l) break;
    i.args.push(parseFloat(l[0])), n += l[0].length;
  }
  return t;
}
function zo(e, t, n, i, s, r, o, a, l) {
  if (e === a && t === l) return [];
  let h = Math.abs(n), c = Math.abs(i);
  if (h === 0 || c === 0) return [[e, t, a, l, a, l]];
  const f = s * Math.PI / 180, u = Math.cos(f), p = Math.sin(f), m = (e - a) / 2, d = (t - l) / 2, g = u * m + p * d, y = -p * m + u * d, b = g * g / (h * h) + y * y / (c * c);
  if (b > 1) {
    const $ = Math.sqrt(b);
    h *= $, c *= $;
  }
  const w = r === o ? -1 : 1, S = h * h * c * c - h * h * y * y - c * c * g * g, v = h * h * y * y + c * c * g * g, k = w * Math.sqrt(Math.max(0, S / v)), T = k * h * y / c, P = -k * c * g / h, M = u * T - p * P + (e + a) / 2, A = p * T + u * P + (t + l) / 2, x = ($, F, B, j) => {
    const ut = $ * B + F * j, me = Math.sqrt(($ * $ + F * F) * (B * B + j * j)), Kt = Math.acos(Math.max(-1, Math.min(1, ut / me)));
    return $ * j - F * B < 0 ? -Kt : Kt;
  }, E = x(1, 0, (g - T) / h, (y - P) / c);
  let _ = x((g - T) / h, (y - P) / c, (-g - T) / h, (-y - P) / c);
  !o && _ > 0 && (_ -= 2 * Math.PI), o && _ < 0 && (_ += 2 * Math.PI);
  const H = Math.max(1, Math.ceil(Math.abs(_) / (Math.PI / 2))), I = _ / H, C = 4 / 3 * Math.tan(I / 4), R = ($) => {
    const F = h * Math.cos($), B = c * Math.sin($);
    return [u * F - p * B + M, p * F + u * B + A];
  }, O = ($) => {
    const F = -h * Math.sin($), B = c * Math.cos($);
    return [u * F - p * B, p * F + u * B];
  }, L = [];
  for (let $ = 0; $ < H; $++) {
    const F = E + $ * I, B = F + I, [j, ut] = R(F), [me, Kt] = $ === H - 1 ? [a, l] : R(B), [wo, vo] = O(F), [ko, So] = O(B);
    L.push([j + C * wo, ut + C * vo, me - C * ko, Kt - C * So, me, Kt]);
  }
  return L;
}
function pt(e, t, n, i, s) {
  const r = 1 - s;
  return r * r * r * e + 3 * r * r * s * t + 3 * r * s * s * n + s * s * s * i;
}
function Pi(e, t, n, i, s) {
  const r = 1 - s;
  return 3 * r * r * (t - e) + 6 * r * s * (n - t) + 3 * s * s * (i - n);
}
function Yt(e, t, n, i) {
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
function ye(e, t, n) {
  const [i, s, r, o, a, l] = n, h = [0];
  let c = e, f = t, u = 0;
  for (let p = 1; p <= Ai; p++) {
    const m = p / Ai, d = pt(e, i, r, a, m), g = pt(t, s, o, l, m);
    u += Math.hypot(d - c, g - f), h.push(u), c = d, f = g;
  }
  return {
    subpath: 0,
    type: "C",
    points: [i, s, r, o, a, l],
    startX: e,
    startY: t,
    endX: a,
    endY: l,
    length: u,
    lengths: h
  };
}
function Ft(e) {
  const t = Ht.get(e);
  if (t) return t;
  const n = [];
  let i = 0, s = 0, r = 0, o = 0, a = null, l = null, h = -1;
  const c = /* @__PURE__ */ new Set(), f = (d) => {
    h < 0 && (h = 0), d.subpath = h, n.push(d);
  };
  for (const { type: d, args: g } of Uo(e)) {
    const y = d.toUpperCase(), b = d !== y, w = Vo[y];
    if (y === "Z") {
      (i !== r || s !== o) && f(Yt(i, s, r, o)), h >= 0 && c.add(h), i = r, s = o, a = l = null;
      continue;
    }
    for (let S = 0; S + w <= g.length; S += w) {
      const v = g.slice(S, S + w), k = b ? i : 0, T = b ? s : 0;
      let P = null, M = null;
      switch (y) {
        case "M":
          S === 0 ? (i = v[0] + k, s = v[1] + T, r = i, o = s, (h < 0 || n[n.length - 1]?.subpath === h) && h++) : (f(Yt(i, s, v[0] + k, v[1] + T)), i = v[0] + k, s = v[1] + T);
          break;
        case "L":
          f(Yt(i, s, v[0] + k, v[1] + T)), i = v[0] + k, s = v[1] + T;
          break;
        case "H":
          f(Yt(i, s, v[0] + k, s)), i = v[0] + k;
          break;
        case "V":
          f(Yt(i, s, i, v[0] + T)), s = v[0] + T;
          break;
        case "C": {
          const A = [v[0] + k, v[1] + T, v[2] + k, v[3] + T, v[4] + k, v[5] + T];
          f(ye(i, s, A)), P = [A[2], A[3]], i = A[4], s = A[5];
          break;
        }
        case "S": {
          const [A, x] = a ? [2 * i - a[0], 2 * s - a[1]] : [i, s], E = [A, x, v[0] + k, v[1] + T, v[2] + k, v[3] + T];
          f(ye(i, s, E)), P = [E[2], E[3]], i = E[4], s = E[5];
          break;
        }
        case "Q":
        case "T": {
          let A = i, x = s;
          y === "Q" ? (A = v[0] + k, x = v[1] + T) : l && (A = 2 * i - l[0], x = 2 * s - l[1]);
          const E = y === "Q" ? v[2] + k : v[0] + k, _ = y === "Q" ? v[3] + T : v[1] + T;
          f(
            ye(i, s, [
              i + 2 / 3 * (A - i),
              s + 2 / 3 * (x - s),
              E + 2 / 3 * (A - E),
              _ + 2 / 3 * (x - _),
              E,
              _
            ])
          ), M = [A, x], i = E, s = _;
          break;
        }
        case "A": {
          const A = v[5] + k, x = v[6] + T;
          let E = i, _ = s;
          for (const H of zo(i, s, v[0], v[1], v[2], v[3], v[4], A, x))
            f(ye(E, _, H)), E = H[4], _ = H[5];
          i = A, s = x;
          break;
        }
      }
      a = P, l = M;
    }
  }
  const u = n.reduce((d, g) => d + g.length, 0), p = [];
  for (let d = 0; d < n.length; ) {
    const g = n[d].subpath;
    let y = d, b = 0;
    for (; y < n.length && n[y].subpath === g; ) b += n[y++].length;
    const w = n[d], S = n[y - 1], v = c.has(g) || Math.abs(S.endX - w.startX) < 1e-9 && Math.abs(S.endY - w.startY) < 1e-9;
    p.push({ start: d, end: y, length: b, closed: v }), d = y;
  }
  const m = { segments: n, totalLength: u, subpaths: p };
  return Ht.size >= Yo && Ht.delete(Ht.keys().next().value), Ht.set(e, m), m;
}
function jo(e, t) {
  const n = e.lengths;
  if (t <= 0) return 0;
  if (t >= e.length) return 1;
  let i = 0, s = n.length - 1;
  for (; i < s - 1; ) {
    const a = i + s >> 1;
    n[a] < t ? i = a : s = a;
  }
  const r = n[s] - n[i], o = r > 0 ? (t - n[i]) / r : 0;
  return (i + o) / (n.length - 1);
}
function Go(e, t) {
  if (e.type === "L") {
    const f = e.length > 0 ? Math.max(0, Math.min(1, t / e.length)) : 0;
    return {
      x: e.startX + (e.endX - e.startX) * f,
      y: e.startY + (e.endY - e.startY) * f,
      angle: Math.atan2(e.endY - e.startY, e.endX - e.startX) * 180 / Math.PI
    };
  }
  const [n, i, s, r, o, a] = e.points, l = jo(e, t);
  let h = Pi(e.startX, n, s, o, l), c = Pi(e.startY, i, r, a, l);
  if (Math.hypot(h, c) < 1e-9) {
    const f = l < 0.5 ? Math.min(1, l + 1e-3) : Math.max(0, l - 1e-3), u = pt(e.startX, n, s, o, f), p = pt(e.startY, i, r, a, f), m = pt(e.startX, n, s, o, l), d = pt(e.startY, i, r, a, l);
    h = l < 0.5 ? u - m : m - u, c = l < 0.5 ? p - d : d - p;
  }
  return {
    x: pt(e.startX, n, s, o, l),
    y: pt(e.startY, i, r, a, l),
    angle: Math.atan2(c, h) * 180 / Math.PI
  };
}
function Xs(e, t, n = 0, i = e.length) {
  if (i <= n) return { x: 0, y: 0, angle: 0 };
  let s = 0;
  for (let r = n; r < i; r++) {
    const o = e[r];
    if (s + o.length >= t || r === i - 1)
      return Go(o, t - s);
    s += o.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function Jo(e, t) {
  const { segments: n, totalLength: i } = Ft(e);
  return Xs(n, Math.max(0, Math.min(1, t)) * i);
}
function fd() {
  Ht.clear();
}
function dd(e) {
  return Ft(e).totalLength;
}
const Zo = 24, Qo = 320, ta = 2.5, qt = 72, pd = 64, ea = 0.2, na = 128, Gt = /* @__PURE__ */ new Map();
let Ae = 0, dt;
const _i = (e) => Math.round(e * 100) / 100;
function Hi(e, t) {
  const { segments: n, subpaths: i, totalLength: s } = Ft(e);
  if (n.length === 0) return [];
  if (t) {
    const r = i.every((o) => o.closed);
    return [{ segments: n, start: 0, end: n.length, length: s, closed: r }];
  }
  return i.filter((r) => r.length > 0).map((r) => ({ segments: n, start: r.start, end: r.end, length: r.length, closed: r.closed }));
}
function Hn(e, t) {
  const n = e.closed ? (t % 1 + 1) % 1 : Math.max(0, Math.min(1, t)), i = Xs(e.segments, n * e.length, e.start, e.end);
  return [i.x, i.y];
}
function Ii(e) {
  const t = [];
  let n = 0;
  for (let i = e.start; i < e.end; i++)
    n += e.segments[i].length, e.length > 0 && t.push(n / e.length);
  return t;
}
function Ci(e, t) {
  const n = [];
  for (let i = 0; i < t; i++)
    n.push(Hn(e, e.closed ? i / t : i / (t - 1)));
  return n;
}
function $i(e) {
  let t = 0, n = 0;
  for (const [i, s] of e)
    t += i, n += s;
  return t /= e.length, n /= e.length, e.map(([i, s]) => [i - t, s - n]);
}
function ia(e, t, n) {
  const i = e.closed && t.closed;
  if (n !== void 0)
    return { offset: i ? Math.abs(n) % qt / qt : 0, reversed: n < 0 };
  const s = $i(Ci(e, qt)), r = $i(Ci(t, qt)), o = qt;
  let a = { offset: 0, reversed: !1 }, l = 1 / 0;
  for (const h of [!1, !0]) {
    const c = i ? o : 1;
    for (let f = 0; f < c; f++) {
      let u = 0;
      for (let p = 0; p < o && u < l; p++) {
        const m = i ? h ? (f - p + o) % o : (p + f) % o : h ? o - 1 - p : p, d = s[p][0] - r[m][0], g = s[p][1] - r[m][1];
        u += d * d + g * g;
      }
      u < l && (l = u, a = { offset: i ? f / o : 0, reversed: h });
    }
  }
  return a;
}
function sa(e, t, n) {
  return n ? ((t.reversed ? t.offset - e : e + t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function ra(e, t, n) {
  return n ? ((t.reversed ? t.offset - e : e - t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function oa(e, t, n) {
  const i = e.closed && t.closed, s = ia(e, t, n.shapeIndex), r = Math.max(
    Zo,
    Math.min(Qo, Math.ceil(Math.max(e.length, t.length) / ta))
  ), o = /* @__PURE__ */ new Set(), a = (f) => o.add(Math.round(f * 1e7) / 1e7);
  for (let f = 0; f <= r; f++) a(f / r);
  for (const f of Ii(e)) a(f);
  for (const f of Ii(t)) a(ra(f, s, i));
  let l = [...o].sort((f, u) => f - u);
  i && (l = l.filter((f) => f < 1));
  const h = [], c = [];
  for (const f of l)
    h.push(...Hn(e, f)), c.push(...Hn(t, sa(f, s, i)));
  return aa({ from: h, to: c, closed: i });
}
function aa(e) {
  const t = e.from.length / 2;
  if (t <= 3) return e;
  const n = new Uint8Array(t);
  n[0] = 1, n[t - 1] = 1;
  const i = [[0, t - 1]];
  for (; i.length > 0; ) {
    const [o, a] = i.pop();
    let l = -1, h = ea;
    for (let c = o + 1; c < a; c++) {
      const f = Math.max(Ri(e.from, o, a, c), Ri(e.to, o, a, c));
      f > h && (h = f, l = c);
    }
    l !== -1 && (n[l] = 1, i.push([o, l], [l, a]));
  }
  const s = [], r = [];
  for (let o = 0; o < t; o++)
    n[o] && (s.push(e.from[o * 2], e.from[o * 2 + 1]), r.push(e.to[o * 2], e.to[o * 2 + 1]));
  return { from: s, to: r, closed: e.closed };
}
function Ri(e, t, n, i) {
  const s = e[t * 2], r = e[t * 2 + 1], o = e[n * 2] - s, a = e[n * 2 + 1] - r, l = e[i * 2] - s, h = e[i * 2 + 1] - r, c = o * o + a * a, f = c === 0 ? 0 : Math.max(0, Math.min(1, (l * o + h * a) / c));
  return Math.hypot(l - f * o, h - f * a);
}
function la(e, t, n) {
  const i = n.shapeIndex;
  if (dt && dt.from === e && dt.to === t && dt.shapeIndex === i) return dt.plan;
  const r = Gt.get(String(i ?? "auto"))?.get(e)?.get(t);
  if (r)
    return dt = { from: e, to: t, shapeIndex: i, plan: r }, r;
  const o = Ft(e).subpaths.filter((p) => p.length > 0).length === Ft(t).subpaths.filter((p) => p.length > 0).length, a = Hi(e, !o), l = Hi(t, !o), h = {
    pairs: a.map((p, m) => oa(p, l[m], n))
  };
  Ae >= na && (Gt.clear(), Ae = 0);
  const c = String(i ?? "auto"), f = Gt.get(c) ?? /* @__PURE__ */ new Map();
  Gt.set(c, f);
  const u = f.get(e) ?? /* @__PURE__ */ new Map();
  return f.set(e, u), u.set(t, h), Ae++, dt = { from: e, to: t, shapeIndex: i, plan: h }, h;
}
function ha(e, t, n, i = {}) {
  if (!e) return t;
  if (!t) return e;
  const s = Math.max(0, Math.min(1, n));
  if (s === 0) return e;
  if (s === 1) return t;
  const r = la(e, t, i);
  if (r.pairs.length === 0) return s < 0.5 ? e : t;
  let o = "";
  for (const a of r.pairs) {
    for (let l = 0; l < a.from.length; l += 2) {
      const h = _i(a.from[l] + (a.to[l] - a.from[l]) * s), c = _i(a.from[l + 1] + (a.to[l + 1] - a.from[l + 1]) * s);
      o += `${l === 0 ? o ? " M" : "M" : " L"}${h} ${c}`;
    }
    a.closed && (o += " Z");
  }
  return o;
}
function md() {
  Gt.clear(), Ae = 0, dt = void 0;
}
function de(e) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(e);
}
const It = Math.PI / 180, ca = 0.9995;
function ti() {
  return [0, 0, 0, 1];
}
function Lt(e, t) {
  const n = Math.hypot(e[0], e[1], e[2]);
  if (n === 0) return ti();
  const i = t * It / 2, s = Math.sin(i) / n;
  return [e[0] * s, e[1] * s, e[2] * s, Math.cos(i)];
}
function ua(e, t, n) {
  return In(In(Lt([0, 1, 0], t), Lt([1, 0, 0], e)), Lt([0, 0, 1], n));
}
function fa(e) {
  const [t, n, i, s] = gt(e), r = 2 * (t * i + n * s), o = 2 * (t * n + i * s), a = 1 - 2 * (t * t + i * i), l = 2 * (n * i - t * s), h = 1 - 2 * (n * n + i * i), c = 2 * (t * i - n * s), f = 1 - 2 * (t * t + n * n), u = Math.asin(Math.max(-1, Math.min(1, -l)));
  return Math.abs(l) < 0.9999999 ? [u / It, Math.atan2(r, f) / It, Math.atan2(o, a) / It] : [u / It, Math.atan2(-c, h) / It, 0];
}
function In(e, t) {
  const [n, i, s, r] = e, [o, a, l, h] = t;
  return [
    r * o + n * h + i * l - s * a,
    r * a - n * l + i * h + s * o,
    r * l + n * a - i * o + s * h,
    r * h - n * o - i * a - s * l
  ];
}
function Vs(e, t) {
  return e[0] * t[0] + e[1] * t[1] + e[2] * t[2] + e[3] * t[3];
}
function Us(e) {
  return Math.hypot(e[0], e[1], e[2], e[3]);
}
function gt(e) {
  const t = Us(e);
  return t === 0 ? ti() : [e[0] / t, e[1] / t, e[2] / t, e[3] / t];
}
function da(e) {
  return [-e[0], -e[1], -e[2], e[3]];
}
function zs(e, t, n) {
  const i = gt(e);
  let s = gt(t), r = Vs(i, s);
  if (r < 0 && (s = [-s[0], -s[1], -s[2], -s[3]], r = -r), r > ca)
    return gt([
      i[0] + (s[0] - i[0]) * n,
      i[1] + (s[1] - i[1]) * n,
      i[2] + (s[2] - i[2]) * n,
      i[3] + (s[3] - i[3]) * n
    ]);
  const o = Math.acos(r), a = Math.sin(o), l = Math.sin((1 - n) * o) / a, h = Math.sin(n * o) / a;
  return gt([
    i[0] * l + s[0] * h,
    i[1] * l + s[1] * h,
    i[2] * l + s[2] * h,
    i[3] * l + s[3] * h
  ]);
}
function pa(e, t) {
  const [n, i, s, r] = gt(e), o = 2 * (i * t[2] - s * t[1]), a = 2 * (s * t[0] - n * t[2]), l = 2 * (n * t[1] - i * t[0]);
  return [t[0] + r * o + (i * l - s * a), t[1] + r * a + (s * o - n * l), t[2] + r * l + (n * a - i * o)];
}
const gd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  conjugate: da,
  dot: Vs,
  fromAxisAngle: Lt,
  fromEuler: ua,
  identity: ti,
  length: Us,
  multiply: In,
  normalize: gt,
  rotateVec3: pa,
  slerp: zs,
  toEuler: fa
}, Symbol.toStringTag, { value: "Module" })), ht = (e, t, n) => e + (t - e) * n, js = 512, rn = /* @__PURE__ */ new Map(), on = /* @__PURE__ */ new Map();
function Li(e) {
  const t = rn.get(e);
  if (t) return t;
  const n = e.replace("#", ""), i = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return rn.size < js && rn.set(e, i), i;
}
const Oi = (e) => e.charCodeAt(0) === 35, Fi = (e) => e.startsWith("rgb"), Bi = (e) => e.startsWith("rgba"), ma = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, an = (e) => Math.round(e).toString(16).padStart(2, "0");
function ga(e, t, n) {
  return `#${an(e)}${an(t)}${an(n)}`;
}
function Di(e) {
  const t = on.get(e);
  if (t) return t;
  const n = e.match(ma);
  if (!n)
    throw new Error(`Invalid rgb color: ${e}`);
  const i = parseInt(n[1], 10), s = parseInt(n[2], 10), r = parseInt(n[3], 10), o = n[4] !== void 0 ? [i, s, r, parseFloat(n[4])] : [i, s, r];
  return on.size < js && on.set(e, o), o;
}
const ya = (e, t, n) => {
  if (Oi(e) && Oi(t)) {
    const [i, s, r] = Li(e), [o, a, l] = Li(t), h = ht(i, o, n), c = ht(s, a, n), f = ht(r, l, n);
    return ga(h, c, f);
  }
  if ((Fi(e) || Bi(e)) && (Fi(t) || Bi(t))) {
    const i = Di(e), s = Di(t), r = Math.round(ht(i[0], s[0], n)), o = Math.round(ht(i[1], s[1], n)), a = Math.round(ht(i[2], s[2], n));
    if (i.length === 4 || s.length === 4) {
      const l = i[3] ?? 1, h = s[3] ?? 1, c = ht(l, h, n);
      return `rgba(${r}, ${o}, ${a}, ${c})`;
    }
    return `rgb(${r}, ${o}, ${a})`;
  }
  return n < 1 ? e : t;
}, ba = (e, t, n) => {
  const i = Math.min(e.length, t.length), s = [];
  for (let r = 0; r < i; r++)
    s.push(ht(e[r], t[r], n));
  return s;
}, wa = (e, t, n) => zs(e, t, n), Wi = (e, t, n) => n < 1 ? e : t, va = (e, t, n) => ha(e, t, n);
function Oe(e, t) {
  return t === "slerp" ? wa : typeof e == "number" ? ht : Array.isArray(e) ? ba : typeof e == "string" ? e.startsWith("#") || e.startsWith("rgb") ? ya : de(e) ? va : Wi : Wi;
}
const Gs = 1e3 / 60;
function Js(e, t = {}) {
  if (!xt(e))
    throw new Error(`bakeSpringTrack: track "${e.id}" is not a spring track`);
  const n = new Je(e.spring);
  return Qs(e, (i) => n.valueAt(i), n.settleTime(), e.spring.from, e.spring.to, t);
}
function Zs(e, t = {}) {
  if (!Tt(e))
    throw new Error(`bakeInertiaTrack: track "${e.id}" is not an inertia track`);
  const n = e.inertia;
  return Qs(
    e,
    (i) => Pn(n, i),
    fe(n),
    n.from,
    ue(n),
    t
  );
}
function Qs(e, t, n, i, s, r) {
  const o = r.intervalMs ?? Gs, a = r.tolerance ?? 0.01, l = e.delay ?? 0, h = [];
  for (let f = 0; f <= n; f += o)
    h.push({ time: f + l, value: t(f), easing: "linear" });
  const c = h[h.length - 1];
  return !c || c.time < n + l ? h.push({ time: n + l, value: s, easing: "linear" }) : c.value = s, l > 0 && h.unshift({ time: 0, value: i, easing: "linear" }), {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: a > 0 ? Sa(h, a) : h,
    ...e.targets && { targets: [...e.targets] },
    ...e.stagger && { stagger: { ...e.stagger } }
  };
}
function tr(e, t, n, i = {}) {
  const s = i.intervalMs ?? Gs, r = typeof n == "function" ? n : J(n), o = Oe(e.value, i.interpolation), a = t.time - e.time;
  if (a <= 0) return [t];
  const l = [];
  for (let c = s; c < a; c += s) {
    const f = c / a;
    l.push({
      time: e.time + c,
      value: o(e.value, t.value, r(f)),
      easing: "linear"
    });
  }
  const h = r(1);
  return l.push({ ...t, ...h !== 1 && { value: o(e.value, t.value, h) }, easing: "linear" }), l;
}
function yd(e, t) {
  return xt(e) ? Js(e, t) : Tt(e) ? Zs(e, t) : e;
}
function ka(e, t = {}) {
  const n = e.keyframes;
  if (!n.some((r) => Re(r.easing))) return e;
  const i = n.length > 0 ? [n[0]] : [], s = { ...t, interpolation: e.interpolation ?? t.interpolation };
  for (let r = 1; r < n.length; r++) {
    const o = n[r];
    Re(o.easing) ? i.push(...tr(n[r - 1], o, o.easing, s)) : i.push(o);
  }
  return { ...e, keyframes: i };
}
function bd(e, t) {
  return e.filter(To).map((n) => ka(n, t)).concat(
    e.filter(xt).map((n) => Js(n, t)),
    e.filter(Tt).map((n) => Zs(n, t))
  );
}
function Sa(e, t) {
  if (e.length <= 2) return e;
  const n = [e[0]];
  for (let i = 1; i < e.length - 1; i++) {
    const s = n[n.length - 1], r = e[i], o = e[i + 1], a = o.time - s.time;
    if (a <= 0) continue;
    const l = (r.time - s.time) / a, h = s.value + (o.value - s.value) * l;
    Math.abs(r.value - h) > t && n.push(r);
  }
  return n.push(e[e.length - 1]), n;
}
function Cn(e) {
  const t = [...e.keyframes].sort((n, i) => n.time - i.time);
  return {
    ...e,
    keyframes: t
  };
}
function wt(e) {
  return e.targets && e.targets.length > 0 ? e.targets : [e.target];
}
function Bt(e, t, n, i) {
  const s = n ?? 0;
  return !i || t <= 1 ? s : s + Qn(e, t, i);
}
class ln {
  track;
  targets;
  constructor(t) {
    this.track = t, this.targets = wt(t);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(t) {
    return this.valueForOffset(t - Bt(0, this.targets.length, this.track.delay, this.track.stagger));
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
      const r = Bt(s, n, this.track.delay, this.track.stagger), o = this.valueForOffset(t - r);
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
    const n = t[t.length - 1].time, i = this.track.stagger ? Ge(this.targets.length, this.track.stagger) : 0;
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
    const r = s.time - i.time, o = (t - i.time) / r, l = J(s.easing)(o);
    return Oe(i.value, this.track.interpolation)(i.value, s.value, l);
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
class Ma {
  track;
  targets;
  sampler;
  constructor(t) {
    this.track = t, this.targets = wt(t), this.sampler = new Je(t.spring);
  }
  getValueAtTime(t) {
    return this.sampler.valueAt(t - Bt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const n = this.targets.length, i = [];
    for (let s = 0; s < n; s++) {
      const r = Bt(s, n, this.track.delay, this.track.stagger);
      i.push({ target: this.targets[s], value: this.sampler.valueAt(t - r), start: r });
    }
    return i;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? Ge(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
class Ta {
  track;
  targets;
  duration;
  constructor(t) {
    this.track = t, this.targets = wt(t), this.duration = fe(t.inertia);
  }
  getValueAtTime(t) {
    return Pn(this.track.inertia, t - Bt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const n = this.targets.length, i = [];
    for (let s = 0; s < n; s++) {
      const r = Bt(s, n, this.track.delay, this.track.stagger);
      i.push({ target: this.targets[s], value: Pn(this.track.inertia, t - r), start: r });
    }
    return i;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? Ge(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
function er(e, t) {
  const n = { ...Jo(e.pathData, t) };
  if (e.matrix) {
    const [i, s, r, o, a, l] = e.matrix, { x: h, y: c } = n;
    n.x = i * h + r * c + a, n.y = s * h + o * c + l;
    const f = n.angle * Math.PI / 180, u = Math.cos(f), p = Math.sin(f);
    n.angle = Math.atan2(s * u + o * p, i * u + r * p) * 180 / Math.PI;
  }
  return e.autoRotate && e.rotateOffset && (n.angle += e.rotateOffset), n;
}
function wd(e, t, n, i) {
  const s = t + (n - t) * i;
  return er(e, s);
}
const hn = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, xa = 20;
function Ea(e) {
  const t = hn[e ?? "upperCase"] ?? e ?? hn.upperCase, n = Array.from(t);
  return n.length > 0 ? n : Array.from(hn.upperCase);
}
function Aa(e, t, n) {
  let i = (e | 0) ^ Math.imul(t + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return i = Math.imul(i ^ i >>> 16, 2146121005), i = Math.imul(i ^ i >>> 15, 2221713035), (i ^ i >>> 16) >>> 0;
}
function Pa(e, t, n = 0) {
  const i = e.from ?? "", s = e.to, r = Math.max(0, Math.min(1, t));
  if (r <= 0) return i;
  if (r >= 1) return s;
  const o = Array.from(i), a = Array.from(s), l = e.rightToLeft ?? !1;
  if (e.mode === "type") {
    const b = Math.round(r * Math.max(o.length, a.length));
    return l ? o.slice(0, Math.max(0, o.length - b)).join("") + a.slice(Math.max(0, a.length - b)).join("") : a.slice(0, b).join("") + o.slice(b).join("");
  }
  const h = Math.max(0, Math.min(0.999, e.revealDelay ?? 0)), c = Math.max(0, (r - h) / (1 - h)), f = Math.floor(c * a.length), u = e.tweenLength === !1 ? a.length : Math.round(o.length + (a.length - o.length) * r), p = Ea(e.chars), m = e.refreshRate ?? xa, d = m > 0 ? Math.floor(n * m / 1e3) : 0, g = e.seed ?? 1;
  let y = "";
  for (let b = 0; b < u; b++) {
    const w = l ? b >= u - f : b < f, S = l ? a[a.length - (u - b)] : a[b];
    w && S !== void 0 || S === " " || S === `
` ? y += S : y += p[Aa(g, b, d) % p.length];
  }
  return y;
}
class nr {
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
        const l = n - this._currentTime;
        if (s >= l) {
          if (s -= l, this._currentTime = n, !this._handleEndReached())
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
    const n = /* @__PURE__ */ new Map();
    if (this._hasSharedWrites())
      this._resolveShared(t, n);
    else
      for (const [i, s] of this._trackPlayers) {
        const r = s.getTrack().property;
        for (const { target: o, value: a, start: l } of s.getTargetValues(t))
          this._write(n, i, o, r, a, t - l);
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
      for (const { target: a, value: l, start: h } of r.getTargetValues(t)) {
        const c = `${a}\0${o}`, f = h <= t, u = i.get(c);
        (!u || (f !== u.started ? f : f ? h >= u.start : h <= u.start)) && i.set(c, { trackId: s, target: a, property: o, value: l, start: h, started: f });
      }
    }
    for (const { trackId: s, target: r, property: o, value: a, start: l } of i.values())
      this._write(n, s, r, o, a, t - l);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(t, n, i, s, r, o) {
    if (r === void 0) return;
    let a = t.get(i);
    a || (a = /* @__PURE__ */ new Map(), t.set(i, a));
    const l = this._textTracks.get(n);
    if (l && typeof r == "number") {
      a.set("text", Pa(l.textConfig, r, Math.max(0, o)));
      return;
    }
    const h = this._motionPathTracks.get(n);
    if (h && typeof r == "number") {
      const c = er(h.motionPathConfig, r);
      a.set("motionPathX", c.x), a.set("motionPathY", c.y), h.motionPathConfig.autoRotate && a.set("motionPathRotate", c.angle);
    } else
      a.set(s, r);
  }
  /** Cached: does any target+property have more than one track? */
  _sharedWrites = null;
  _hasSharedWrites() {
    if (this._sharedWrites === null) {
      const t = /* @__PURE__ */ new Set();
      this._sharedWrites = !1;
      t: for (const n of this._tracks)
        for (const i of wt(n)) {
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
    if (this._tracks.push(t), this._sharedWrites = null, Tt(t)) {
      this._trackPlayers.set(t.id, new Ta(t));
      return;
    }
    if (xt(t)) {
      this._trackPlayers.set(t.id, new Ma(t)), this._springTracks.set(t.id, t);
      return;
    }
    if (Zn(t))
      this._trackPlayers.set(t.id, new ln(t)), this._textTracks.set(t.id, t);
    else if (Ds(t)) {
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
      this._trackPlayers.set(t.id, new ln(n)), this._motionPathTracks.set(t.id, t);
    } else
      this._trackPlayers.set(t.id, new ln(t));
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
    if (xt(i) || Tt(i))
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
          const a = wt(o).filter((f) => wt(i).includes(f));
          if (a.length === 0) continue;
          const l = this.getTrackSpan(o.id);
          if (!l || !(l.from <= s.to && s.from <= l.to)) continue;
          const c = s.from >= l.from;
          for (const f of a)
            t.push({
              target: f,
              property: i.property,
              losingTrackId: c ? o.id : i.id,
              winningTrackId: c ? i.id : o.id
            });
        }
    }
    return t;
  }
  _matches(t, n) {
    if (n.id !== void 0 && t.id !== n.id || n.property !== void 0 && t.property !== n.property || n.target !== void 0 && !wt(t).includes(n.target)) return !1;
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
      formatVersion: Bs(this._tracks),
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
const _a = 100;
function ir(e, t, n, i) {
  const s = [], r = [], { duration: o, alternate: a } = i, l = (p, m, d, g) => {
    r.push([p, m]);
    const y = [];
    e.forEach((b, w) => {
      (d === "forward" ? (g ? b >= p : b > p) && b <= m : (g ? b <= p : b < p) && b >= m) && y.push(w);
    }), y.sort((b, w) => (d === "forward" ? e[b] - e[w] : e[w] - e[b]) || b - w);
    for (const b of y) s.push({ kind: "event", index: b, direction: d });
  };
  let h = t.time, c = t.direction, f = t.fresh === !0;
  const u = Math.min(_a, Math.max(0, n.iteration - t.iteration));
  for (let p = 0; p < u; p++) {
    const m = c === "forward" ? o : 0;
    l(h, m, c, f), s.push({ kind: "repeat" }), a ? (c = c === "forward" ? "reverse" : "forward", h = m, f = !1) : (h = c === "forward" ? 0 : o, f = !0);
  }
  return u > 0 && i.holding && !a ? { crossings: s, passes: r } : (l(h, n.time, c, f), { crossings: s, passes: r });
}
function Ha(e) {
  return Tt(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "inertia",
    inertia: sr(e.inertia),
    ...ot(e)
  } : xt(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "spring",
    spring: { ...e.spring },
    ...ot(e)
  } : Zn(e) ? {
    id: e.id,
    target: e.target,
    property: "text",
    textConfig: { ...e.textConfig },
    keyframes: e.keyframes.map(cn),
    ...ot(e)
  } : Ds(e) ? {
    id: e.id,
    target: e.target,
    property: "motionPath",
    motionPathConfig: { ...e.motionPathConfig },
    keyframes: e.keyframes.map(cn),
    ...ot(e)
  } : {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes.map(cn),
    ...e.interpolation !== void 0 && { interpolation: e.interpolation },
    ...ot(e)
  };
}
function sr(e) {
  return { ...e, ...Array.isArray(e.end) && { end: [...e.end] } };
}
function cn(e) {
  return {
    time: e.time,
    value: e.value,
    ...e.easing && { easing: e.easing }
  };
}
function ot(e) {
  const t = e.endDelay;
  return {
    ...e.delay !== void 0 && { delay: e.delay },
    ...t !== void 0 && { endDelay: t },
    ...e.targets !== void 0 && { targets: [...e.targets] },
    ...e.stagger !== void 0 && { stagger: { ...e.stagger } }
  };
}
function Ia(e) {
  if (Tt(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "inertia",
      inertia: sr(t.inertia),
      ...ot(t)
    };
  }
  if (xt(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "spring",
      spring: { ...t.spring },
      ...ot(t)
    };
  }
  if (Zn(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: "text",
      textConfig: { ...t.textConfig },
      keyframes: [...t.keyframes].sort((n, i) => n.time - i.time),
      ...ot(t)
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
      ...ot(t)
    };
  }
  return Cn({
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes,
    ...e.interpolation !== void 0 && { interpolation: e.interpolation },
    ...ot(e)
  });
}
function Ca(e) {
  const t = e._config.markers;
  return {
    formatVersion: Bs(e.tracks),
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
    tracks: e.tracks.map(Ha),
    ...e.captions && { captions: JSON.parse(JSON.stringify(e.captions)) }
  };
}
function se(e) {
  const t = e.formatVersion ?? 1;
  if (t > xi)
    throw new Error(
      `tinyfly: this animation uses format version ${t}, but this tinyfly reads up to version ${xi}. Update tinyfly to play it.`
    );
  return new nr({
    id: e.id,
    name: e.name,
    config: e.config,
    tracks: e.tracks.map(Ia),
    captions: e.captions
  });
}
function vd(e) {
  return JSON.stringify(Ca(e));
}
function kd(e) {
  const t = JSON.parse(e);
  return se(t);
}
function pe(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++)
    t ^= e.charCodeAt(n), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function ei(e) {
  let t = e >>> 0 || 2654435769;
  return {
    seed: e >>> 0,
    next() {
      return t ^= t << 13, t >>>= 0, t ^= t >> 17, t ^= t << 5, t >>>= 0, t / 4294967296;
    }
  };
}
function rr(e, t, n) {
  return t + e.next() * (n - t);
}
function $a(e, t, n, i) {
  if (i <= 0) return rr(e, t, n);
  const s = Math.floor((n - t) / i), r = Math.round(e.next() * s);
  return t + r * i;
}
function Sd(e, t) {
  if (t.length !== 0)
    return t[Math.floor(e.next() * t.length)];
}
const or = /^([+\-*/])=\s*(-?[\d.]+)$/, ar = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function Md(e) {
  return typeof e != "string" ? !1 : or.test(e.trim()) || ar.test(e.trim());
}
function lr(e, t = {}) {
  if (typeof e != "string") return e;
  const n = e.trim(), i = or.exec(n);
  if (i) {
    const [, r, o] = i, a = t.base ?? 0, l = Number.parseFloat(o);
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
  const s = ar.exec(n);
  if (s) {
    if (!t.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const r = Number.parseFloat(s[1]), o = Number.parseFloat(s[2]), a = s[3] !== void 0 ? Number.parseFloat(s[3]) : void 0;
    return a !== void 0 ? $a(t.random, r, o, a) : rr(t.random, r, o);
  }
  return e;
}
function Ra(e, t = 0, n) {
  const i = [];
  let s = t;
  for (const r of e) {
    const o = lr(r, { base: s, random: n });
    i.push(o), typeof o == "number" && (s = o);
  }
  return i;
}
class Td {
  random;
  constructor(t) {
    this.random = ei(t);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(t, n = 0) {
    return lr(t, { base: n, random: this.random });
  }
  resolveSequence(t, n = 0) {
    return Ra(t, n, this.random);
  }
}
const La = 600;
function Oa(e) {
  if (Array.isArray(e)) {
    const [u, p, m, d] = e;
    return { fn: Ni(u, p, m, d), bezier: [u, p, m, d] };
  }
  const { segments: t } = Ft(e);
  if (t.length === 0) throw new Error(`customEase: no curve in "${e}"`);
  const n = t[0].startX, i = t[0].startY, s = t[t.length - 1], r = s.endX - n, o = s.endY - i;
  if (r === 0 || o === 0) throw new Error(`customEase: "${e}" must move along both axes`);
  const a = (u) => (u - n) / r, l = (u) => (u - i) / o;
  if (t.length === 1 && s.type === "C") {
    const [u, p, m, d] = s.points, g = [a(u), l(p), a(m), l(d)];
    return { fn: Ni(...g), bezier: g };
  }
  const h = [], c = [], f = Math.max(8, Math.ceil(La / t.length));
  for (const u of t)
    for (let p = h.length === 0 ? 0 : 1; p <= f; p++) {
      const [m, d] = Da(u, p / f);
      h.push(a(m)), c.push(l(d));
    }
  return { fn: Wa(h, c) };
}
function Fa(e = {}) {
  const n = 0.1 + Math.max(0, Math.min(1, e.strength ?? 0.7)) * 0.7, i = [1];
  for (let r = n; r > 2e-3; r *= n) i.push(2 * Math.sqrt(r));
  const s = i.reduce((r, o) => r + o, 0);
  return (r) => {
    if (r <= 0) return 0;
    if (r >= 1) return 1;
    let o = r * s;
    for (let a = 0; a < i.length; a++) {
      if (o <= i[a]) {
        if (a === 0) return (o / i[0]) ** 2;
        const l = i[a] / 2, h = l * l, c = o - l;
        return 1 - (h - c * c);
      }
      o -= i[a];
    }
    return 1;
  };
}
function Ba(e = {}) {
  const t = Math.max(1, e.wiggles ?? 10), n = e.type ?? "easeOut", i = (s) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * s) : (1 - s) ** 2;
  return (s) => s <= 0 || s >= 1 ? 0 : Math.sin(s * t * Math.PI * 2) * i(s);
}
function Da(e, t) {
  if (e.type === "L") {
    const [h, c] = e.points;
    return [e.startX + (h - e.startX) * t, e.startY + (c - e.startY) * t];
  }
  const [n, i, s, r, o, a] = e.points, l = 1 - t;
  return [
    l * l * l * e.startX + 3 * l * l * t * n + 3 * l * t * t * s + t * t * t * o,
    l * l * l * e.startY + 3 * l * l * t * i + 3 * l * t * t * r + t * t * t * a
  ];
}
function Wa(e, t) {
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
function Ni(e, t, n, i) {
  const s = (o, a, l) => 3 * (1 - o) * (1 - o) * o * a + 3 * (1 - o) * o * o * l + o * o * o, r = (o, a, l) => 3 * (1 - o) * (1 - o) * a + 6 * (1 - o) * o * (l - a) + 3 * o * o * (1 - l);
  return (o) => {
    if (o <= 0) return 0;
    if (o >= 1) return 1;
    let a = o;
    for (let c = 0; c < 8; c++) {
      const f = s(a, e, n) - o, u = r(a, e, n);
      if (Math.abs(f) < 1e-6) return s(a, t, i);
      if (Math.abs(u) < 1e-6) break;
      a -= f / u;
    }
    let l = 0, h = 1;
    a = o;
    for (let c = 0; c < 40; c++)
      s(a, e, n) < o ? l = a : h = a, a = (l + h) / 2;
    return s(a, t, i);
  };
}
const Na = 350, Ka = 300, Ya = 550;
function xd(e, t = {}) {
  const n = t.lead ?? Na, i = t.gap ?? Ka, s = t.tail ?? Ya, r = [];
  let o = 0;
  return e.forEach((a, l) => {
    const h = [];
    let c = o + n;
    a.lines.forEach((u, p) => {
      if (!(u.duration >= 0))
        throw new Error(`narration: scene ${l} line ${p} has an invalid duration (${u.duration})`);
      p > 0 && (c += i), h.push({
        id: u.id ?? `s${l}-l${p}`,
        scene: l,
        line: p,
        start: c,
        end: c + u.duration,
        text: u.text
      }), c += u.duration;
    });
    const f = c + s + (a.tail ?? 0);
    r.push({ id: a.id ?? `s${l}`, start: o, duration: f - o, cues: h }), o = f;
  }), { duration: o, scenes: r, cues: r.flatMap((a) => a.cues) };
}
function Ed(e) {
  return e.cues.map((t) => ({ id: t.id, time: t.start, label: t.text }));
}
function Ad(e, t) {
  let n = e.scenes[0];
  for (const i of e.scenes)
    if (t >= i.start) n = i;
    else break;
  return n;
}
const hr = (e) => 6e4 / e.bpm;
function ni(e, t) {
  return e.offset + t * hr(e);
}
function ii(e, t) {
  return (t - e.offset) / hr(e);
}
function Pd(e, t) {
  return ni(e, Math.round(ii(e, t)));
}
function _d(e, t) {
  return ni(e, Math.ceil(ii(e, t) - 1e-9));
}
function Hd(e, t, n) {
  const i = Math.max(1, Math.round(e.beatsPerBar ?? 4)), s = [];
  if (!(e.bpm > 0) || n < t) return s;
  for (let r = Math.ceil(ii(e, t) - 1e-9); ; r++) {
    const o = ni(e, r);
    if (o > n + 1e-9) break;
    s.push({ time: o, bar: (r % i + i) % i === 0, n: r });
  }
  return s;
}
const At = 100;
function Id(e, t, n = {}) {
  const i = n.minBpm ?? 70, s = n.maxBpm ?? 180, r = Math.max(1, Math.round(t / At)), o = Math.min(e.length, Math.round((n.maxSeconds ?? 60) * t)), a = Math.floor(o / r);
  if (a < 4) return { bpm: 120, offset: 0, confidence: 0 };
  const l = new Float64Array(a);
  for (let M = 0; M < a; M++) {
    let A = 0;
    for (let x = M * r; x < (M + 1) * r; x++) A += e[x] * e[x];
    l[M] = Math.log(1e-6 + A / r);
  }
  const h = new Float64Array(a);
  for (let M = 1; M < a; M++) h[M] = Math.max(0, l[M] - l[M - 1]);
  const c = h.reduce((M, A) => M + A, 0) / a;
  for (let M = 0; M < a; M++) h[M] = Math.max(0, h[M] - c);
  const f = Math.max(1, Math.floor(60 * At / s)), u = Math.min(a - 1, Math.ceil(60 * At / i)), p = (M) => {
    let A = 0;
    for (let x = M; x < a; x++) A += h[x] * h[x - M];
    return A / (a - M);
  };
  let m = 0;
  for (let M = 0; M < a; M++) m += h[M] * h[M];
  m /= a;
  let d = f, g = -1 / 0;
  for (let M = f; M <= u; M++) {
    const A = 60 * At / M, x = Math.exp(-0.5 * (Math.log2(A / 120) / 0.9) ** 2), E = p(M) * x;
    E > g && (g = E, d = M);
  }
  const y = (M) => {
    const A = Math.floor(M);
    return A < 0 || A + 1 >= a ? 0 : h[A] + (h[A + 1] - h[A]) * (M - A);
  }, b = (M, A) => {
    let x = 0;
    for (let E = A; E < a; E += M) x += y(E);
    return x;
  };
  let w = d, S = 0, v = -1 / 0;
  for (let M = d - 0.6; M <= d + 0.6 + 1e-9; M += 0.02) {
    if (M < 1) continue;
    const A = Math.max(1, Math.round(M * 4));
    for (let x = 0; x < A; x++) {
      const E = x / A * M, _ = b(M, E);
      _ > v && (v = _, S = E, w = M);
    }
  }
  const k = 60 * At / w, T = m > 0 ? Math.max(0, Math.min(1, p(d) / m)) : 0, P = (S + 0.5) * 1e3 / At;
  return { bpm: Math.round(k * 100) / 100, offset: Math.round(P % (6e4 / k)), confidence: T };
}
const st = (e) => Math.round(e * 1e3) / 1e3;
function qa(e, t = {}) {
  if (e.length === 0) return "";
  const n = t.curviness ?? 1, i = t.closed ?? !1, s = e.length;
  let r = `M${st(e[0].x)} ${st(e[0].y)}`;
  if (s === 1) return r;
  const o = (l) => i ? e[(l % s + s) % s] : e[Math.max(0, Math.min(s - 1, l))], a = i ? s : s - 1;
  for (let l = 0; l < a; l++) {
    const h = o(l - 1), c = o(l), f = o(l + 1), u = o(l + 2);
    if (n === 0) {
      r += ` L${st(f.x)} ${st(f.y)}`;
      continue;
    }
    const p = n / 6, m = c.x + (f.x - h.x) * p, d = c.y + (f.y - h.y) * p, g = f.x - (u.x - c.x) * p, y = f.y - (u.y - c.y) * p;
    r += ` C${st(m)} ${st(d)} ${st(g)} ${st(y)} ${st(f.x)} ${st(f.y)}`;
  }
  return i ? `${r} Z` : r;
}
const N = (e, t = 0) => {
  const n = parseFloat(e ?? "");
  return Number.isFinite(n) ? n : t;
};
function Xa(e) {
  const t = (e ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let i = 0; i + 1 < t.length; i += 2) n.push({ x: t[i], y: t[i + 1] });
  return n;
}
function si(e) {
  const t = e.attributes;
  switch (e.tag.toLowerCase()) {
    case "path":
      return t.d ?? null;
    case "circle":
    case "ellipse": {
      const n = N(t.cx), i = N(t.cy), s = e.tag.toLowerCase() === "circle" ? N(t.r) : N(t.rx), r = e.tag.toLowerCase() === "circle" ? N(t.r) : N(t.ry);
      return `M${n + s} ${i} A${s} ${r} 0 1 1 ${n - s} ${i} A${s} ${r} 0 1 1 ${n + s} ${i} Z`;
    }
    case "rect": {
      const n = N(t.x), i = N(t.y), s = N(t.width), r = N(t.height);
      let o = t.rx != null ? N(t.rx) : t.ry != null ? N(t.ry) : 0, a = t.ry != null ? N(t.ry) : o;
      return o = Math.min(o, s / 2), a = Math.min(a, r / 2), o === 0 || a === 0 ? `M${n} ${i} H${n + s} V${i + r} H${n} Z` : `M${n + o} ${i} H${n + s - o} A${o} ${a} 0 0 1 ${n + s} ${i + a} V${i + r - a} A${o} ${a} 0 0 1 ${n + s - o} ${i + r} H${n + o} A${o} ${a} 0 0 1 ${n} ${i + r - a} V${i + a} A${o} ${a} 0 0 1 ${n + o} ${i} Z`;
    }
    case "line":
      return `M${N(t.x1)} ${N(t.y1)} L${N(t.x2)} ${N(t.y2)}`;
    case "polyline":
    case "polygon": {
      const n = Xa(t.points);
      if (n.length === 0) return null;
      const i = n.map((s, r) => `${r === 0 ? "M" : "L"}${s.x} ${s.y}`).join(" ");
      return e.tag.toLowerCase() === "polygon" ? `${i} Z` : i;
    }
    default:
      return null;
  }
}
function Cd(e, t, n) {
  const i = Math.max(2, Math.round(n.samples ?? 32)), s = Math.max(0, n.length), r = n.since !== void 0 ? Math.max(t - s, n.since) : t - s;
  if (r >= t) return [];
  const o = n.period, a = [];
  for (let l = 0; l < i; l++) {
    const h = r + (t - r) * l / (i - 1), c = o && o > 0 && l < i - 1 ? (h % o + o) % o : h;
    a.push({ at: e(c), time: h, age: s > 0 ? (t - h) / s : 0 });
  }
  return a;
}
const Va = 2.5;
function Ua(e) {
  const t = [], n = [], i = e.length, s = (r, o) => {
    for (let a = r + o; a >= 0 && a < i; a += o) {
      const l = (e[a].x - e[r].x) * o, h = (e[a].y - e[r].y) * o, c = Math.hypot(l, h);
      if (c > 1e-9) return [l / c, h / c];
    }
    return null;
  };
  for (let r = 0; r < i; r++) {
    const o = e[r], a = s(r, -1), l = s(r, 1), h = a ?? l ?? [1, 0], c = l ?? a ?? [1, 0];
    let f = h[0] + c[0], u = h[1] + c[1];
    const p = Math.hypot(f, u);
    p < 1e-9 ? (f = h[0], u = h[1]) : (f /= p, u /= p);
    const m = f * h[0] + u * h[1], d = Math.min(Va, 1 / Math.max(m, 1e-6)), g = o.width / 2 * d;
    t.push({ x: o.x - u * g, y: o.y + f * g }), n.push({ x: o.x + u * g, y: o.y - f * g });
  }
  return { left: t, right: n };
}
function za(e) {
  const t = e.length;
  if (t < 2) return null;
  const n = e[t - 1];
  for (let i = t - 2; i >= 0; i--) {
    const s = n.x - e[i].x, r = n.y - e[i].y, o = Math.hypot(s, r);
    if (o > 1e-9)
      return { x: n.x, y: n.y, radius: n.width / 2, start: Math.atan2(s / o, -r / o) };
  }
  return null;
}
function Pe(e, t) {
  return [e[0] + t[0], e[1] + t[1], e[2] + t[2]];
}
function tn(e, t) {
  return [e[0] - t[0], e[1] - t[1], e[2] - t[2]];
}
function te(e, t) {
  return [e[0] * t, e[1] * t, e[2] * t];
}
function ee(e, t) {
  return e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
}
function Fe(e, t) {
  return [e[1] * t[2] - e[2] * t[1], e[2] * t[0] - e[0] * t[2], e[0] * t[1] - e[1] * t[0]];
}
function ri(e) {
  return Math.hypot(e[0], e[1], e[2]);
}
function cr(e, t) {
  return ri(tn(e, t));
}
function re(e) {
  const t = ri(e);
  return t === 0 ? [0, 0, 0] : te(e, 1 / t);
}
function ur(e, t, n) {
  return [e[0] + (t[0] - e[0]) * n, e[1] + (t[1] - e[1]) * n, e[2] + (t[2] - e[2]) * n];
}
const $d = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Pe,
  cross: Fe,
  distance: cr,
  dot: ee,
  length: ri,
  lerp: ur,
  normalize: re,
  scale: te,
  subtract: tn
}, Symbol.toStringTag, { value: "Module" })), ja = Math.PI / 180;
function fr() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function bt(e, t) {
  const n = new Array(16);
  for (let i = 0; i < 4; i++)
    for (let s = 0; s < 4; s++) {
      let r = 0;
      for (let o = 0; o < 4; o++) r += e[o * 4 + s] * t[i * 4 + o];
      n[i * 4 + s] = r;
    }
  return n;
}
function dr(e) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, e[0], e[1], e[2], 1];
}
function _e(e) {
  return [e[0], 0, 0, 0, 0, e[1], 0, 0, 0, 0, e[2], 0, 0, 0, 0, 1];
}
function oe(e) {
  const [t, n, i, s] = e;
  return [
    1 - 2 * (n * n + i * i),
    2 * (t * n + i * s),
    2 * (t * i - n * s),
    0,
    2 * (t * n - i * s),
    1 - 2 * (t * t + i * i),
    2 * (n * i + t * s),
    0,
    2 * (t * i + n * s),
    2 * (n * i - t * s),
    1 - 2 * (t * t + n * n),
    0,
    0,
    0,
    0,
    1
  ];
}
function pr(e, t, n) {
  const i = oe(t);
  for (let s = 0; s < 3; s++)
    i[s] *= n[0], i[4 + s] *= n[1], i[8 + s] *= n[2];
  return i[12] = e[0], i[13] = e[1], i[14] = e[2], i;
}
function Ga(e) {
  const t = new Array(16);
  for (let n = 0; n < 4; n++) for (let i = 0; i < 4; i++) t[i * 4 + n] = e[n * 4 + i];
  return t;
}
function Ja(e) {
  const [t, n, i, s, r, o, a, l, h, c, f, u, p, m, d, g] = e, y = t * o - n * r, b = t * a - i * r, w = t * l - s * r, S = n * a - i * o, v = n * l - s * o, k = i * l - s * a, T = h * m - c * p, P = h * d - f * p, M = h * g - u * p, A = c * d - f * m, x = c * g - u * m, E = f * g - u * d, _ = y * E - b * x + w * A + S * M - v * P + k * T;
  if (Math.abs(_) < 1e-12) return null;
  const H = 1 / _;
  return [
    (o * E - a * x + l * A) * H,
    (i * x - n * E - s * A) * H,
    (m * k - d * v + g * S) * H,
    (f * v - c * k - u * S) * H,
    (a * M - r * E - l * P) * H,
    (t * E - i * M + s * P) * H,
    (d * w - p * k - g * b) * H,
    (h * k - f * w + u * b) * H,
    (r * x - o * M + l * T) * H,
    (n * M - t * x - s * T) * H,
    (p * v - m * w + g * y) * H,
    (c * w - h * v - u * y) * H,
    (o * P - r * A - a * T) * H,
    (t * A - n * P + i * T) * H,
    (m * b - p * S - d * y) * H,
    (h * S - c * b + f * y) * H
  ];
}
function Za(e, t, n, i) {
  const s = 1 / Math.tan(e * ja / 2), r = 1 / (n - i);
  return [s / t, 0, 0, 0, 0, s, 0, 0, 0, 0, (i + n) * r, -1, 0, 0, 2 * i * n * r, 0];
}
function Qa(e, t, n, i, s, r) {
  const o = 1 / (t - e), a = 1 / (i - n), l = 1 / (r - s);
  return [2 * o, 0, 0, 0, 0, 2 * a, 0, 0, 0, 0, -2 * l, 0, -(t + e) * o, -(i + n) * a, -(r + s) * l, 1];
}
function tl(e, t, n = [0, 1, 0]) {
  const i = re(tn(e, t)), s = re(Fe(n, i)), r = Fe(i, s);
  return [
    s[0],
    r[0],
    i[0],
    0,
    s[1],
    r[1],
    i[1],
    0,
    s[2],
    r[2],
    i[2],
    0,
    -ee(s, e),
    -ee(r, e),
    -ee(i, e),
    1
  ];
}
function mr(e, t) {
  const n = e[0] * t[0] + e[4] * t[1] + e[8] * t[2] + e[12], i = e[1] * t[0] + e[5] * t[1] + e[9] * t[2] + e[13], s = e[2] * t[0] + e[6] * t[1] + e[10] * t[2] + e[14], r = e[3] * t[0] + e[7] * t[1] + e[11] * t[2] + e[15];
  return r === 1 || r === 0 ? [n, i, s] : [n / r, i / r, s / r];
}
const Rd = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  compose: pr,
  fromQuat: oe,
  identity: fr,
  invert: Ja,
  lookAt: tl,
  multiply: bt,
  orthographic: Qa,
  perspective: Za,
  scaling: _e,
  transformPoint: mr,
  translation: dr,
  transpose: Ga
}, Symbol.toStringTag, { value: "Module" })), be = {
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
}, Ki = {
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
function el(e) {
  let t = e.trim().toLowerCase();
  t = t.replace(/\.ease(in|out|inout)$/, ".$1");
  const n = /^([a-z]+\d?)(\(.*\))?$/.exec(t);
  return n && n[1] !== "steps" && t !== "none" && t !== "linear" && (t = `${n[1]}.out${n[2] ?? ""}`), t;
}
J({ type: "bounce", mode: "in" });
J({ type: "bounce", mode: "in-out" });
function Be(e) {
  const t = gr.get(e.trim().toLowerCase());
  if (t) return t;
  const n = el(e), i = /^steps\(\s*(\d+)\s*\)$/.exec(n);
  if (i) {
    const o = { type: "steps", count: Math.max(1, Number.parseInt(i[1], 10)) + 1, position: "none" };
    return { easing: o, fn: J(o) };
  }
  const s = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(n);
  if (s) {
    const [, r, o, a] = s, l = (a ?? "").split(",").map((f) => Number.parseFloat(f)).filter((f) => Number.isFinite(f)), h = o === "inout" ? "in-out" : o;
    if (r === "back" && l.length === 0 && n in be)
      return { easing: { type: "cubic-bezier", points: be[n] } };
    const c = r === "elastic" ? { type: "elastic", mode: h, ...l[0] !== void 0 && { amplitude: l[0] }, ...l[1] !== void 0 && { period: l[1] } } : r === "bounce" ? { type: "bounce", mode: h } : { type: "back", mode: h, ...l[0] !== void 0 && { overshoot: l[0] } };
    return { easing: c, fn: J(c) };
  }
  return n in Ki ? { easing: Ki[n] } : n in be ? { easing: { type: "cubic-bezier", points: be[n] } } : { easing: "ease-out" };
}
const gr = /* @__PURE__ */ new Map();
function oi(e, t) {
  return gr.set(
    e.trim().toLowerCase(),
    t.bezier ? { easing: { type: "cubic-bezier", points: t.bezier }, fn: t.fn } : { fn: t.fn, requiresBaking: "custom" }
  ), e;
}
function $n(e) {
  let t = e >>> 0;
  return () => {
    t = t + 1831565813 >>> 0;
    let n = t;
    return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const yr = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function br(e) {
  return typeof e == "string" && yr.test(e);
}
function nl(e = 1) {
  let t = $n(e);
  const n = (l, h) => ((...c) => c.length >= l ? h(...c) : (f) => h(...c, f)), i = (l, h, c) => Math.min(Math.max(c, Math.min(l, h)), Math.max(l, h)), s = (l, h, c, f, u) => h === l ? c : c + (u - l) / (h - l) * (f - c), r = (l, h) => {
    if (typeof l == "number") return l === 0 ? h : Math.round(h / l) * l;
    if (Array.isArray(l)) return Yi(l, h, 1 / 0);
    if ("values" in l) return Yi(l.values, h, l.radius ?? 1 / 0);
    const c = Math.round(h / l.increment) * l.increment;
    return Math.abs(c - h) <= (l.radius ?? 1 / 0) ? c : h;
  }, o = (l, h, c) => {
    const f = l + t() * (h - l);
    return c ? Math.round(f / c) * c : f;
  };
  return {
    clamp: n(3, i),
    mapRange: n(5, s),
    normalize: n(3, (l, h, c) => s(l, h, 0, 1, c)),
    interpolate: n(3, (l, h, c) => {
      if (typeof l == "object" && !Array.isArray(l)) {
        const f = {};
        for (const u of Object.keys(l))
          f[u] = Oe(l[u])(l[u], h[u], c);
        return f;
      }
      return Oe(l)(l, h, c);
    }),
    wrap: ((l, h, c) => {
      if (Array.isArray(l)) {
        const d = l, g = (y) => d[(Math.round(y) % d.length + d.length) % d.length];
        return h === void 0 ? g : g(h);
      }
      const f = l, p = h - f, m = (d) => p === 0 ? f : ((d - f) % p + p) % p + f;
      return c === void 0 ? m : m(c);
    }),
    wrapYoyo: n(3, (l, h, c) => {
      const f = h - l;
      if (f === 0) return l;
      const u = ((c - l) % (f * 2) + f * 2) % (f * 2);
      return l + (u > f ? f * 2 - u : u);
    }),
    snap: n(2, r),
    random: ((l, h, c, f) => {
      if (Array.isArray(l)) {
        const p = () => l[Math.floor(t() * l.length)];
        return h === !0 ? p : p();
      }
      const u = () => o(l, h, c);
      return f ? u : u();
    }),
    shuffle: (l) => {
      for (let h = l.length - 1; h > 0; h--) {
        const c = Math.floor(t() * (h + 1));
        [l[h], l[c]] = [l[c], l[h]];
      }
      return l;
    },
    distribute: ({ base: l = 0, amount: h, each: c, from: f = "start", ease: u }) => (p, m, d) => {
      const g = d.length, b = Qn(p, g, { ...h !== void 0 ? { amount: h } : { each: c ?? 1 }, from: f }), w = h !== void 0 ? h : (c ?? 1) * Ns(g, f), S = u && w > 0 ? u(b / w) * w : b;
      return l + S;
    },
    pipe: (...l) => (h) => l.reduce((c, f) => f(c), h),
    splitColor: (l) => il(l),
    getUnit: (l) => typeof l == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(l.trim())?.[1] ?? "",
    seed: (l) => {
      t = $n(l);
    },
    resolveRandomString: (l) => {
      const h = yr.exec(l)?.[1] ?? "";
      if (h.startsWith("[")) {
        const m = h.slice(1, -1).split(",").map((d) => d.trim()).filter(Boolean).map((d) => Number.isFinite(Number(d)) ? Number(d) : d.replace(/^['"]|['"]$/g, ""));
        return m[Math.floor(t() * m.length)];
      }
      const [c, f, u] = h.split(",").map((p) => Number.parseFloat(p));
      return o(c, f, Number.isFinite(u) ? u : void 0);
    }
  };
}
function Yi(e, t, n) {
  let i = t, s = 1 / 0;
  for (const r of e) {
    const o = Math.abs(r - t);
    o < s && (s = o, i = r);
  }
  return s <= n ? i : t;
}
function il(e) {
  const t = e.trim(), n = /^#([0-9a-f]{3,8})$/i.exec(t)?.[1];
  if (n) {
    const r = (n.length <= 4 ? [...n].map((o) => o + o).join("") : n).match(/../g).map((o) => Number.parseInt(o, 16));
    return r.length >= 4 ? [r[0], r[1], r[2], Math.round(r[3] / 255 * 1e3) / 1e3] : [r[0], r[1], r[2]];
  }
  const i = (/rgba?\(([^)]+)\)/i.exec(t)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((s) => Number.parseFloat(s));
  return i.length >= 4 ? [i[0], i[1], i[2], i[3]] : [i[0] ?? 0, i[1] ?? 0, i[2] ?? 0];
}
const sl = /^([+-])=\s*(-?[\d.]+)$/, rl = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function Xt(e, t) {
  const n = t.scale ?? 1, i = (h) => Number.parseFloat(h) * n;
  if (e === void 0) return t.cursor;
  if (typeof e == "number") return e * n;
  const s = e.trim();
  if (s === "") return t.cursor;
  const r = sl.exec(s);
  if (r) {
    const h = i(r[2]);
    return t.cursor + (r[1] === "-" ? -h : h);
  }
  const o = rl.exec(s);
  if (o) {
    const h = o[1] === "<" ? t.previousStart : t.previousEnd;
    if (o[3] === void 0) return h;
    const c = i(o[3]);
    return h + (o[2] === "-" ? -c : c);
  }
  const a = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(s);
  if (a) {
    const h = t.labels.get(a[1].trim());
    if (h !== void 0) {
      const c = i(a[3]);
      return h + (a[2] === "-" ? -c : c);
    }
  }
  const l = t.labels.get(s);
  return l !== void 0 ? l : /^-?[\d.]+$/.test(s) ? i(s) : t.cursor;
}
function ol(e) {
  if (typeof e != "object" || e === null) return !1;
  const t = e;
  return t.grid !== void 0 || t.from === "random" || Array.isArray(t.from) || t.ease !== void 0 || t.axis !== void 0;
}
function al(e, t, n = {}) {
  if (e === 0) return [];
  const i = t.grid === "auto" ? Math.max(1, Math.min(e, n.columnsFromLayout?.() ?? e)) : Array.isArray(t.grid) ? Math.max(1, t.grid[1]) : e, s = Array.isArray(t.grid) ? Math.max(1, t.grid[0]) : Math.ceil(e / i), r = (m) => ({ x: m % i, y: Math.floor(m / i) }), o = t.from ?? "start", a = Array.isArray(o) ? { x: o[0] * (i - 1), y: o[1] * (s - 1) } : typeof o == "number" ? r(Math.max(0, Math.min(e - 1, o))) : o === "end" ? r(e - 1) : o === "center" || o === "edges" ? { x: (i - 1) / 2, y: (s - 1) / 2 } : { x: 0, y: 0 }, l = (m) => {
    const { x: d, y: g } = r(m), y = Math.abs(d - a.x), b = Math.abs(g - a.y);
    return t.axis === "x" ? y : t.axis === "y" ? b : Math.hypot(y, b);
  };
  let h = Array.from({ length: e }, (m, d) => l(d));
  const c = Math.max(...h);
  if (o === "edges" && (h = h.map((m) => c - m)), o === "random") {
    const m = n.random ?? Math.random;
    h = h.map(() => m() * c);
  }
  const f = t.amount !== void 0 ? t.amount : (t.each ?? 0) * c, u = t.ease ? Be(t.ease) : void 0, p = u ? u.fn ?? J(u.easing) : void 0;
  return h.map((m) => {
    const d = c === 0 ? 0 : m / c;
    return (p ? p(d) : d) * f;
  });
}
const ai = /* @__PURE__ */ new Set([
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
]), ll = {
  rotation: "rotate",
  rotationZ: "rotate",
  rotationX: "rotateX",
  rotationY: "rotateY",
  transformPerspective: "perspective",
  perspective: "childPerspective"
};
function He(e) {
  const t = {}, n = {};
  for (const [i, s] of Object.entries(e))
    ai.has(i) ? t[i] = s : n[ll[i] ?? i] = s;
  return { config: t, properties: n };
}
function De(e, t) {
  return e === void 0 ? t : e * 1e3;
}
function Rn(e, t) {
  if (e !== void 0)
    return typeof e == "number" ? { each: e * 1e3 } : ol(e) ? { offsets: al(t?.count ?? 0, e, t ?? {}).map((i) => i * 1e3) } : {
      ...e.each !== void 0 && { each: e.each * 1e3 },
      ...e.amount !== void 0 && { amount: e.amount * 1e3 },
      ...e.from !== void 0 && { from: e.from }
    };
}
const hl = {
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
function wr(e) {
  return hl[e];
}
function cl(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : e;
  if (!t || typeof t.path != "string" && !Array.isArray(t.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(t.path))
    n = qa(t.path, { curviness: t.curviness });
  else if (de(t.path))
    n = t.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${t.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const i = { pathData: n };
  return t.autoRotate !== void 0 && t.autoRotate !== !1 && (i.autoRotate = !0, typeof t.autoRotate == "number" && (i.rotateOffset = t.autoRotate)), t.matrix && (i.matrix = t.matrix), { config: i, start: t.start ?? 0, end: t.end ?? 1 };
}
function ul(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : { ...e };
  return { ...t, start: t.end ?? 1, end: t.start ?? 0 };
}
function vr(e) {
  return typeof e == "object" && e !== null && "shape" in e ? e.shape : e;
}
function fl(e) {
  if (e.morphSVG === void 0) return e;
  const { morphSVG: t, ...n } = e, i = vr(t);
  if (typeof i != "string" || !de(i))
    throw new Error(
      `gsap-compat: morphSVG "${String(i)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: i };
}
function dl(e, t) {
  if (e === !0) return [0, t];
  if (e === !1) return [0, 0];
  if (typeof e == "number") return [0, qi(e, t)];
  const n = e.trim().split(/[\s,]+/).filter(Boolean), i = (o) => {
    const a = Number.parseFloat(o);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${e}" is not a length or percentage`);
    return qi(o.endsWith("%") ? t * a / 100 : a, t);
  };
  if (n.length === 0) return [0, t];
  if (n.length === 1) return [0, i(n[0])];
  const s = i(n[0]), r = i(n[1]);
  return s <= r ? [s, r] : [r, s];
}
function pl(e, t) {
  const [n, i] = dl(e, t);
  return { strokeDasharray: [i - n, t], strokeDashoffset: -n };
}
function ml(e, t) {
  if (e.drawSVG === void 0) return e;
  const { drawSVG: n, ...i } = e;
  return { ...i, ...pl(n, t) };
}
function gl(e) {
  if (e.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return e;
}
function qi(e, t) {
  return Math.max(0, Math.min(t, e));
}
function yl(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++) t = Math.imul(t ^ e.charCodeAt(n), 16777619);
  return t >>> 0;
}
function bl(e, t, n) {
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
      seed: s.seed ?? yl(`${t}|${s.text}`)
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
function li(e) {
  return Math.max(0.1, e / 25);
}
function wl(e, t) {
  const n = typeof t == "number" ? { velocity: t } : t;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const i = n.friction ?? (n.resistance !== void 0 ? li(n.resistance) : void 0), s = {
    from: e,
    velocity: n.velocity,
    ...i !== void 0 && { friction: i },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? s.end = [n.end(Le(s))] : n.end !== void 0 && (s.end = Array.isArray(n.end) ? [...n.end] : n.end), s;
}
function vl(e) {
  const t = e === !0 ? {} : typeof e == "string" ? { preset: e } : e;
  if (t.preset !== void 0 && !(t.preset in nn))
    throw new Error(
      `gsap-compat: unknown spring preset "${t.preset}" — use one of ${Object.keys(nn).join(", ")}`
    );
  return {
    ...t.preset ? nn[t.preset] : {},
    ...t.stiffness !== void 0 && { stiffness: t.stiffness },
    ...t.damping !== void 0 && { damping: t.damping },
    ...t.mass !== void 0 && { mass: t.mass },
    ...t.restDelta !== void 0 && { restDelta: t.restDelta }
  };
}
function kl(e, t) {
  if (e === !0 || typeof e == "string") return;
  const n = e.velocity;
  return typeof n == "number" ? n : n?.[t];
}
class Rt {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = $n(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(t = {}) {
    this.options = t, this.timeline = new nr({
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
    return this.build(t, void 0, Vt(n), i);
  }
  /** Animate from the given values to where the property already is. */
  from(t, n, i) {
    const { config: s, properties: r } = He(Vt(n)), { motionPath: o, text: a, scrambleText: l, ...h } = r, c = this.targetsOf(t)[0], f = { ...s };
    for (const m of Object.keys(h))
      f[m] = this.resolveStart(c, m);
    o !== void 0 && (f.motionPath = ul(o));
    const u = {}, p = String(this.resolveStart(c, "text"));
    return a !== void 0 && (u.text = un(a), f.text = typeof a == "object" ? { ...a, value: p } : p), l !== void 0 && (u.text = un(l), f.scrambleText = typeof l == "object" ? { ...l, text: p } : p), this.build(t, { ...h, ...u }, f, i);
  }
  /** Animate between two explicit sets of values. */
  fromTo(t, n, i, s) {
    const { properties: r } = He(Vt(n));
    return this.build(t, r, Vt(i), s);
  }
  /** Set values instantly — a single held keyframe. */
  set(t, n, i) {
    return this.build(t, void 0, { ...Vt(n), duration: 0 }, i);
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
    const n = Math.max(0, Xt(t, this.context()));
    return this.previousStart = n, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), n;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(t) {
    return Xt(t, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(t, n) {
    return this.labels.set(t, Xt(n, this.context())), this;
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
    const i = Xt(n, this.context());
    for (const r of t.timeline.tracks) {
      if (!("keyframes" in r)) continue;
      const o = Cn({
        ...r,
        id: this.nextTrackId(`nested-${r.id}`),
        keyframes: r.keyframes.map((a) => ({ ...a, time: a.time + i }))
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
    const { config: r, properties: o } = He(i), { motionPath: a, text: l, scrambleText: h, inertia: c, ...f } = o, u = this.targetsOf(t), p = Xt(s, this.context()), m = De(r.delay, 0), d = De(r.duration, 500), g = Rn(r.stagger, {
      count: u.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(u) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), y = this.easingFor(r.ease), b = [], w = r.spring;
    let S = 0, v = !1;
    for (const [x, E] of Object.entries(f)) {
      const _ = E;
      let H = n?.[x] !== void 0 ? n[x] : this.resolveStart(u[0], x);
      if (typeof H != typeof _ && (this.warn(
        `no usable start value for "${x}" on "${u[0]}" — it will snap to ${String(_)}. Use fromTo() to animate it.`
      ), H = _), w !== void 0 && (typeof H != "number" || typeof _ != "number") && this.warn(`spring works on numbers, so "${x}" on "${u[0]}" eases instead`), w !== void 0 && typeof H == "number" && typeof _ == "number") {
        const R = {
          ...vl(w),
          from: H,
          to: _,
          velocity: kl(w, x) ?? this.options.startVelocity?.(u[0], x) ?? 0
        }, O = this.nextTrackId(`${u[0]}-${x}-spring`), L = {
          id: O,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: x,
          kind: "spring",
          spring: R,
          delay: p + m
        };
        this.timeline.addTrack(L), b.push(O), S = Math.max(S, xo(R));
        for (const $ of u) this.lastValues.set(`${$}|${x}`, _);
        continue;
      }
      v = !0;
      const I = this.keyframesFor(H, _, d, y, r.ease), C = this.nextTrackId(`${u[0]}-${x}`);
      this.timeline.addTrack(
        Cn({
          id: C,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: x,
          delay: p + m,
          keyframes: I,
          // A quaternion is a rotation: it turns the short way round (see Track.interpolation).
          ...x === "quaternion" && { interpolation: "slerp" }
        })
      ), b.push(C);
      for (const R of u) this.lastValues.set(`${R}|${x}`, _);
    }
    const k = bl({ text: l, scrambleText: h }, u[0], d);
    if (k) {
      const x = n?.text ?? n?.scrambleText, E = x !== void 0 ? un(x) : this.resolveStart(u[0], "text"), _ = this.nextTrackId(`${u[0]}-text`), H = {
        id: _,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...g && u.length > 1 && { stagger: g },
        property: "text",
        textConfig: { from: typeof E == "string" ? E : String(E ?? ""), ...k },
        delay: p + m,
        keyframes: this.keyframesFor(0, 1, d, y, r.ease)
      };
      this.timeline.addTrack(H), b.push(_);
      for (const I of u) this.lastValues.set(`${I}|text`, k.to);
    }
    if (a !== void 0) {
      const { config: x, start: E, end: _ } = cl(a), H = this.nextTrackId(`${u[0]}-motionPath`), I = {
        id: H,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...g && u.length > 1 && { stagger: g },
        property: "motionPath",
        motionPathConfig: x,
        delay: p + m,
        keyframes: this.keyframesFor(E, _, d, y, r.ease)
      };
      this.timeline.addTrack(I), b.push(H);
    }
    if (c !== void 0)
      for (const [x, E] of Object.entries(c)) {
        const _ = this.resolveStart(u[0], x);
        if (typeof _ != "number") {
          this.warn(`inertia on "${x}" needs a numeric start value; skipped`);
          continue;
        }
        const H = wl(_, E), I = this.nextTrackId(`${u[0]}-${x}-inertia`), C = {
          id: I,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: x,
          kind: "inertia",
          inertia: H,
          delay: p + m
        };
        this.timeline.addTrack(C), b.push(I), S = Math.max(S, fe(H));
        for (const R of u) this.lastValues.set(`${R}|${x}`, ue(H));
      }
    const M = ((c !== void 0 || w !== void 0) && !v && !k && a === void 0 ? S : Math.max(d, S)) + (g && u.length > 1 ? Ge(u.length, g) : 0), A = p + m + M;
    return this.previousStart = p + m, this.previousEnd = A, this.cursor = Math.max(this.cursor, A), {
      trackIds: b,
      start: p + m,
      end: A,
      kill: () => {
        for (const x of b) this.timeline.removeTrack(x);
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
    const a = typeof r == "string" ? Be(r) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && Re(s)) {
      const h = a?.fn ?? J(s);
      return [o, ...tr(o, { time: i, value: n }, h, { intervalMs: this.options.bakeIntervalMs })];
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
    if (n === "quaternion") return [0, 0, 0, 1];
    if (n === "d")
      throw new Error(
        `gsap-compat: no starting shape for "${t}". Use fromTo({ d: … }, { morphSVG: … }), or live.to(), which reads the element's current shape.`
      );
    const o = wr(n);
    return o !== void 0 ? (this.warn(
      `no start value for "${n}" on "${t}" — using the static default ${o}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), o) : (this.warn(`no start value or default for "${n}" on "${t}" — using 0`), 0);
  }
  easingFor(t) {
    if (t !== void 0) {
      if (typeof t == "string") return Be(t).easing;
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
function un(e) {
  if (typeof e == "string") return e;
  if (e && typeof e == "object") {
    const t = e;
    return String(t.value ?? t.text ?? "");
  }
  return String(e ?? "");
}
function Sl(e) {
  return new Rt(e);
}
function Vt(e) {
  return gl(fl(e));
}
function Ml(e) {
  return !Array.isArray(e) || e.length !== 4 ? null : `matrix3d(${oe(gt(e)).map((n) => Math.round(n * 1e6) / 1e6 + 0).join(", ")})`;
}
const Tl = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), xl = "#ffffff", El = "rgba(0, 0, 0, 0.5)";
function Al(e) {
  const t = [];
  if (e.blur !== void 0 && t.push(`blur(${Math.max(0, e.blur)}px)`), e.brightness !== void 0 && t.push(`brightness(${Math.max(0, e.brightness)})`), e.glow !== void 0 && t.push(`drop-shadow(0 0 ${Math.max(0, e.glow)}px ${e.glowColor ?? xl})`), e.shadowX !== void 0 || e.shadowY !== void 0 || e.shadowBlur !== void 0) {
    const n = e.shadowX ?? 0, i = e.shadowY ?? 0, s = Math.max(0, e.shadowBlur ?? 0);
    t.push(`drop-shadow(${n}px ${i}px ${s}px ${e.shadowColor ?? El})`);
  }
  return t.length > 0 ? t.join(" ") : null;
}
function Pl(e, t) {
  const n = e.childNodes.length === 1 ? e.firstChild : null;
  if (n && n.nodeType === 3) {
    const i = n;
    i.data !== t && (i.data = t);
    return;
  }
  e.textContent !== t && (e.textContent = t);
}
function _l(e) {
  if (!("ownerSVGElement" in e)) return;
  const t = e.style;
  !t || t.transformBox || (t.transformBox = "fill-box", t.transformOrigin || (t.transformOrigin = "50% 50%"));
}
const Xi = /* @__PURE__ */ new Set([
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
]), Hl = /* @__PURE__ */ new Set([
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
]), Il = [
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
], Cl = /* @__PURE__ */ new Set(["childPerspective", "perspectiveOriginX", "perspectiveOriginY"]), $l = /* @__PURE__ */ new Set(["originX", "originY"]), Rl = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), Ll = /* @__PURE__ */ new Set(["drawOn"]), Ol = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, Vi = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, Fl = "http://www.w3.org/2000/svg";
class St {
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
    let i = null, s = null, r = null, o = null, a = null;
    const l = n.has("motionPathX"), h = n.has("motionPathY"), c = n.has("motionPathRotate");
    for (const [m, d] of n)
      if (!(m === "x" && l) && !(m === "y" && h) && !((m === "rotate" || m === "rotateZ") && c) && !Ll.has(m)) {
        if (Hl.has(m))
          (i ??= {})[m] = d;
        else if (Cl.has(m))
          typeof d == "number" && ((s ??= {})[m] = d);
        else if ($l.has(m))
          typeof d == "number" && ((r ??= {})[m] = d);
        else if (Rl.has(m))
          typeof d == "number" && ((o ??= {})[m] = d);
        else if (Tl.has(m))
          (a ??= {})[m] = d;
        else if (m !== "perspective") {
          if (m !== "shine") if (m === "text" && typeof d == "string")
            Pl(t, d);
          else if (m === "d" && typeof d == "string") {
            const g = t;
            (g.tagName?.toLowerCase() === "path" ? g : g.querySelector?.("path"))?.setAttribute?.("d", d);
          } else
            this.applyStyleProperty(t, m, d);
        }
      }
    const f = n.get("shine");
    typeof f == "number" && this.applyShine(t, f);
    const u = [], p = n.get("perspective");
    if (typeof p == "number" && p > 0 && u.push(`perspective(${p}px)`), i)
      for (const m of Il) {
        const d = i[m];
        if (d === void 0) continue;
        const g = this.buildTransformPart(m, d);
        g && u.push(g);
      }
    if (u.length > 0 && (t.style.transform = u.join(" "), _l(t)), s && (s.childPerspective !== void 0 && (t.style.perspective = `${s.childPerspective}px`), (s.perspectiveOriginX !== void 0 || s.perspectiveOriginY !== void 0) && (t.style.perspectiveOrigin = `${s.perspectiveOriginX ?? 50}% ${s.perspectiveOriginY ?? 50}%`)), r) {
      const m = r.originX ?? 50, d = r.originY ?? 50;
      t.style.transformOrigin = `${m}% ${d}%`;
    }
    if (o) {
      const m = o.clipTop ?? 0, d = o.clipRight ?? 0, g = o.clipBottom ?? 0, y = o.clipLeft ?? 0;
      t.style.clipPath = `inset(${m}% ${d}% ${g}% ${y}%)`;
    }
    if (a) {
      const m = Al(a);
      m && (t.style.filter = m);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(t, n) {
    if (t === "quaternion") return Ml(n);
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
    if (t.namespaceURI === Fl && n in Vi) {
      const a = Array.isArray(i) ? i.join(", ") : String(i);
      t.style[Vi[n]] = a;
      return;
    } else n === "fill" && t.dataset?.elementType === "text" ? s = "color" : s = Ol[n] ?? n;
    let o;
    typeof i == "number" ? Xi.has(n) || Xi.has(s) ? o = `${i}px` : o = String(i) : Array.isArray(i) ? o = i.join(", ") : o = i, t.style[s] = o;
  }
}
const Bl = {
  request: (e) => requestAnimationFrame(e),
  cancel: (e) => cancelAnimationFrame(e)
};
class Dl {
  adapter = new St();
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
  utils = nl();
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
    this.scheduler = t.scheduler ?? Bl, this.rootOption = t.root, this.onWarning = t.onWarning;
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
      fn(i) && this.currentCollector?.touch(i, s), n.push(s);
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
      const o = s.getStateAtTime(r).values.get(t)?.get(n), a = s.getStateAtTime(r - 4).values.get(t)?.get(n);
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
    if (fn(t)) return [t];
    if (!Wl(t)) return [t];
    const n = [];
    for (const i of Array.from(t))
      n.push(...this.targetsOf(i));
    return n;
  }
  nameFor(t) {
    return fn(t) ? this.elementName(t) : this.objectName(t);
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
function fn(e) {
  return typeof e == "object" && e !== null && e.nodeType === 1;
}
function Wl(e) {
  if (Array.isArray(e)) return !0;
  const t = e;
  return typeof t.length == "number" && typeof t.item == "function";
}
function We(e) {
  const t = e.style;
  if (!t) return e.getBoundingClientRect();
  const n = t.transform;
  t.transform = "none";
  const i = e.getBoundingClientRect();
  return t.transform = n, i;
}
const Ui = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function Nl(e) {
  const t = {};
  for (const n of Array.from(e.attributes)) t[n.name] = n.value;
  return t;
}
function Kl(e) {
  const t = e.getScreenCTM?.();
  if (t) return [t.a, t.b, t.c, t.d, t.e, t.f];
  const n = e.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function Yl(e, t) {
  const n = typeof e == "string" || Array.isArray(e) || Ui(e) ? { path: e } : e, { align: i, alignOrigin: s, path: r, ...o } = n, a = (k) => {
    const T = Ui(k) ? k : t.query(k);
    return T || t.warn(`gsap-compat: motionPath could not find "${String(k)}"`), T;
  };
  let l = null, h = "";
  if (Array.isArray(r) || typeof r == "string" && de(r))
    h = r;
  else {
    l = a(r);
    const k = l && si({ tag: l.localName, attributes: Nl(l) });
    l && !k && t.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), h = k ?? "";
  }
  const c = { ...o, path: h };
  if (i === void 0 || i === !1) return c;
  const f = i === !0 ? l : a(i);
  if (!f)
    return i === !0 && t.warn("gsap-compat: motionPath align: true needs the path to be an element"), c;
  const u = t.targets[0];
  if (!u) return c;
  const [p, m, d, g, y, b] = Kl(f), w = We(u), [S, v] = s ?? [0.5, 0.5];
  for (const k of t.targets.slice(1)) {
    const T = We(k);
    if (Math.abs(T.left - w.left) > 0.5 || Math.abs(T.top - w.top) > 0.5) {
      t.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return c.matrix = [p, m, d, g, y - w.left - S * w.width, b - w.top - v * w.height], c;
}
const kr = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function Sr(e) {
  const t = {};
  for (const n of Array.from(e.attributes)) t[n.name] = n.value;
  return t;
}
function Mr(e) {
  if (!e) return null;
  const t = si({ tag: e.localName, attributes: Sr(e) });
  return t || (e.querySelector("path")?.getAttribute("d") ?? null);
}
function ql(e, t, n) {
  const i = vr(e);
  if (typeof i == "string" && de(i)) return i;
  const s = kr(i) ? i : typeof i == "string" ? t(i) : null, r = Mr(s);
  return r || (n(`gsap-compat: morphSVG could not find a shape for "${String(i)}"`), "");
}
const Xl = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function Vl(e, t = document) {
  return (typeof e == "string" ? Array.from(t.querySelectorAll(e)) : kr(e) ? [e] : Array.from(e)).map((i) => {
    if (i.localName === "path") return i;
    const s = si({ tag: i.localName, attributes: Sr(i) });
    if (!s || !i.parentNode) return i;
    const r = i.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const o of Array.from(i.attributes))
      Xl.has(o.name) || r.setAttribute(o.name, o.value);
    return r.setAttribute("d", s), i.parentNode.replaceChild(r, i), r;
  });
}
const zi = 0.3;
class Ul {
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
    this.dragging = !0, this.passedTolerance = !1, this.startX = t, this.startY = n, this.lastX = t, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = ji(), this.options.onPress?.(this.stateFrom(0, 0, i));
  }
  move(t, n, i) {
    if (!this.dragging) return;
    const s = t - this.lastX, r = n - this.lastY;
    this.lastX = t, this.lastY = n;
    const o = t - this.startX, a = n - this.startY, l = this.options.tolerance ?? 3;
    if (!this.passedTolerance) {
      if (Math.hypot(o, a) < l) return;
      this.passedTolerance = !0;
    }
    this.updateVelocity(s, r), this.options.preventDefault !== !1 && i.cancelable && i.preventDefault(), this.options.onMove?.(this.stateFrom(s, r, i));
  }
  end(t) {
    this.dragging && (this.dragging = !1, this.options.onRelease?.(this.stateFrom(0, 0, t)));
  }
  updateVelocity(t, n) {
    const i = ji(), s = Math.max(1, i - this.lastTime);
    this.lastTime = i;
    const r = t / s * 1e3, o = n / s * 1e3;
    this.velocityX += (r - this.velocityX) * zi, this.velocityY += (o - this.velocityY) * zi;
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
function ji() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function zl(e, t, n) {
  let i = { delta: 0, line: null }, s = n;
  for (const r of e)
    for (const o of t) {
      const a = Math.abs(o - r);
      a <= s && (s = a, i = { delta: o - r, line: o });
    }
  return i;
}
function jl(e, t) {
  return t <= 0 ? [] : e.map((n) => Math.round(n / t) * t);
}
class Tr {
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
    this.options = t, this.x = t.initialX ?? 0, this.y = t.initialY ?? 0, this.observer = new Ul({
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
    const s = (this.options.axis ?? "both") === "y" ? this.y : this.x, r = Gl(s / i);
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
      ...jl([i], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], r = zl([i], s, this.snapThreshold());
    i += r.delta, n === "x" ? this.snappedX = r.line : this.snappedY = r.line;
    const o = this.options.bounds;
    if (o) {
      const a = n === "x" ? o.minX : o.minY, l = n === "x" ? o.maxX : o.maxY;
      a !== void 0 && (i = Math.max(a, i)), l !== void 0 && (i = Math.min(l, i));
    }
    return i;
  }
}
function Gl(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e;
}
function Ld(e) {
  const t = new Tr(e);
  return t.start(), t;
}
const Jl = { x: "x", y: "y", "x,y": "both" }, Ln = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function Gi(e, t) {
  const n = We(e), i = t.getBoundingClientRect();
  return {
    minX: i.left - n.left,
    maxX: i.right - n.right,
    minY: i.top - n.top,
    maxY: i.bottom - n.bottom
  };
}
function Ji(e) {
  return Array.isArray(e) ? [...e] : e;
}
function Zl(e, t, n, i = {}) {
  const [s] = t.resolveTargets(n), r = s ? t.elementFor(s) : void 0;
  if (!s || !r)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  if (i.type === "rotation") return Ql(e, t, s, r, i);
  const o = Jl[i.type ?? "x,y"], a = () => {
    const d = t.appliedValue(s, "x"), g = t.appliedValue(s, "y");
    return { x: typeof d == "number" ? d : 0, y: typeof g == "number" ? g : 0 };
  }, l = typeof i.bounds == "string" ? t.query(i.bounds) : Ln(i.bounds) ? i.bounds : null, c = { bounds: (!l && i.bounds && !Ln(i.bounds) ? i.bounds : void 0) ?? (l ? Gi(r, l) : void 0) };
  let f = null;
  const u = () => {
    f?.kill(), f = null;
  }, p = (d) => {
    const g = i.inertia === !0 ? {} : i.inertia, y = g.friction ?? (g.resistance !== void 0 ? li(g.resistance) : 4), b = a(), w = c.bounds ?? {};
    let S, v;
    const k = g.end;
    if (Array.isArray(k)) {
      const P = Le({ from: b.x, velocity: o === "y" ? 0 : d.x, friction: y }), M = Le({ from: b.y, velocity: o === "x" ? 0 : d.y, friction: y });
      let A = k[0];
      for (const x of k)
        Math.hypot(x.x - P, x.y - M) < Math.hypot(A.x - P, A.y - M) && (A = x);
      A && (S = [A.x], v = [A.y]);
    } else typeof k == "number" ? (S = k, v = k) : k && (S = Ji(k.x), v = Ji(k.y));
    const T = {};
    o !== "y" && (T.x = { velocity: d.x, friction: y, min: w.minX, max: w.maxX, end: S }), o !== "x" && (T.y = { velocity: d.y, friction: y, min: w.minY, max: w.maxY, end: v }), f = e.to(r, { inertia: T, onComplete: () => i.onThrowComplete?.() });
  }, m = new Tr({
    target: r,
    axis: o,
    snap: i.snap,
    get bounds() {
      return c.bounds;
    },
    getPosition: a,
    onPress: () => {
      u(), l && (c.bounds = Gi(r, l)), i.onPress?.();
    },
    onDrag: (d) => {
      t.apply(s, o === "x" ? { x: d.x } : o === "y" ? { y: d.y } : { x: d.x, y: d.y }), i.onDrag?.(d);
    },
    onRelease: () => {
      const d = m.velocity;
      i.onRelease?.(d), i.inertia && p(d);
    }
  });
  return m.start(), {
    draggable: m,
    get position() {
      return a();
    },
    get rotation() {
      const d = t.appliedValue(s, "rotate");
      return typeof d == "number" ? d : 0;
    },
    destroy() {
      u(), m.destroy();
    }
  };
}
function Ql(e, t, n, i, s) {
  const r = typeof s.bounds == "object" && s.bounds !== null && !Ln(s.bounds) ? s.bounds : {}, o = () => {
    const w = t.appliedValue(n, "rotate");
    return typeof w == "number" ? w : 0;
  }, a = (w) => Math.min(r.maxRotation ?? 1 / 0, Math.max(r.minRotation ?? -1 / 0, w));
  let l = null, h = !1, c, f = { x: 0, y: 0 }, u = 0, p = 0, m = [];
  const d = (w) => Math.atan2(w.clientY - f.y, w.clientX - f.x) * 180 / Math.PI, g = (w) => {
    if (h) return;
    l?.kill(), l = null, h = !0, c = w.pointerId, i.setPointerCapture?.(w.pointerId);
    const S = i.getBoundingClientRect();
    f = { x: S.left + S.width / 2, y: S.top + S.height / 2 }, u = d(w), p = o(), m = [{ time: performance.now(), rotation: p }], s.onPress?.();
  }, y = (w) => {
    if (!h || w.pointerId !== c) return;
    const S = d(w);
    let v = S - u;
    v > 180 && (v -= 360), v < -180 && (v += 360), u = S, p += v;
    let k = a(p);
    s.snap && (k = a(Math.round(k / s.snap) * s.snap)), t.apply(n, { rotate: k });
    const T = performance.now();
    for (m.push({ time: T, rotation: k }); m.length > 2 && T - m[0].time > 100; ) m.shift();
    const P = { x: 0, y: 0 };
    s.onDrag?.(P);
  }, b = (w) => {
    if (!h || w.pointerId !== c) return;
    h = !1;
    const S = m[0], v = m[m.length - 1], k = S && v ? (v.time - S.time) / 1e3 : 0, T = k > 0 ? (v.rotation - S.rotation) / k : 0;
    if (s.onRelease?.({ x: T, y: 0 }), !s.inertia) return;
    const P = s.inertia === !0 ? {} : s.inertia, M = P.friction ?? (P.resistance !== void 0 ? li(P.resistance) : 4), A = typeof P.end == "number" || Array.isArray(P.end) ? P.end : void 0;
    l = e.to(i, {
      inertia: {
        rotate: {
          velocity: T,
          friction: M,
          min: r.minRotation,
          max: r.maxRotation,
          end: Array.isArray(A) ? A.filter((x) => typeof x == "number") : A
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
      l?.kill(), i.removeEventListener("pointerdown", g), i.removeEventListener("pointermove", y), i.removeEventListener("pointerup", b), i.removeEventListener("pointercancel", b);
    }
  };
}
const th = { opacity: 0, scale: 0.6 };
function eh(e) {
  const t = e.getBoundingClientRect();
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function Zi(e) {
  const t = We(e);
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function On(e, t) {
  const i = e.resolveTargets(t).map((o) => e.elementFor(o)).filter((o) => !!o), s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of i) {
    const a = eh(o);
    s.set(o, a);
    const l = xr(o);
    a && l !== void 0 && !r.has(l) && r.set(l, { element: o, box: a });
  }
  return { elements: i, boxes: s, ids: r };
}
const dn = /* @__PURE__ */ new WeakMap();
function Fn(e, t, n, i = {}) {
  const s = i.duration ?? 0.6, r = i.ease ?? "power2.inOut", o = i.stagger ?? 0, a = i.scale !== !1, l = i.enter === void 0 ? th : i.enter, h = new Set(n.elements);
  if (i.targets !== void 0)
    for (const p of e.resolveTargets(i.targets)) {
      const m = e.elementFor(p);
      m && h.add(m);
    }
  const c = [...h].sort(
    (p, m) => p === m ? 0 : p.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), f = t({ onComplete: i.onComplete });
  let u = 0;
  for (const p of c) {
    const m = Zi(p);
    if (!m) continue;
    let d = n.boxes.get(p) ?? null, g;
    const y = xr(p), b = !d && y !== void 0 ? n.ids.get(y) : void 0;
    b && b.element !== p && (d = b.box, g = b.element);
    const [w] = e.resolveTargets(p);
    dn.get(p)?.timeline.removeTracks({ target: w });
    const S = u * o;
    if (!d) {
      if (l === !1) continue;
      f.fromTo(p, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...Er(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: s, ease: r, delay: S }, 0), dn.set(p, f), u++;
      continue;
    }
    const v = d.cx - m.cx, k = d.cy - m.cy, T = a ? d.width / m.width : 1, P = a ? d.height / m.height : 1;
    if (!(Math.abs(v) > 0.5 || Math.abs(k) > 0.5 || Math.abs(T - 1) > 1e-3 || Math.abs(P - 1) > 1e-3)) {
      const x = (E, _) => {
        const H = e.appliedValue(w, E);
        return typeof H == "number" && Math.abs(H - _) > 1e-6;
      };
      (x("x", 0) || x("y", 0) || x("scaleX", 1) || x("scaleY", 1)) && f.set(p, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const A = i.fade === !0 && g !== void 0;
    f.fromTo(
      p,
      { x: v, y: k, scaleX: T, scaleY: P, ...A && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...A && { opacity: 1 }, duration: s, ease: r, delay: S },
      0
    ), A && g && Zi(g) && f.fromTo(g, { opacity: 1 }, { opacity: 0, duration: s, ease: r, delay: S }, 0), dn.set(p, f), u++;
  }
  return f;
}
function xr(e) {
  return e.dataset?.flipId;
}
function Er(e) {
  const t = {};
  for (const n of Object.keys(e))
    t[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return t;
}
function nh(e, t = {}) {
  const n = new Set((t.type ?? "chars,words,lines").split(",").map((d) => d.trim())), i = {
    chars: t.charsClass ?? "char",
    words: t.wordsClass ?? "word",
    lines: t.linesClass ?? "line"
  }, s = t.aria !== !1, r = e.map((d) => ({
    element: d,
    html: d.innerHTML,
    ariaLabel: d.getAttribute("aria-label")
  }));
  let o = { chars: [], words: [], lines: [], masks: [] }, a, l, h = !1;
  const c = () => {
    for (const { element: d, html: g, ariaLabel: y } of r)
      d.innerHTML = g, y === null ? d.removeAttribute("aria-label") : d.setAttribute("aria-label", y);
  }, f = () => {
    a && (a.revert ? a.revert() : a.kill?.(), a = void 0);
  }, u = () => {
    const d = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: g } of r) {
      const y = (g.textContent ?? "").replace(/\s+/g, " ").trim(), b = ih(g, i.words), w = n.has("chars") ? b.flatMap((k) => sh(k, i.chars)) : [], S = n.has("lines") ? oh(g, b, i.lines) : [];
      if (s) {
        !g.hasAttribute("aria-label") && y && g.setAttribute("aria-label", y);
        for (const k of b) k.setAttribute("aria-hidden", "true");
      }
      if (n.has("words")) d.words.push(...b);
      else for (const k of b) k.removeAttribute("class");
      d.chars.push(...w), d.lines.push(...S);
      const v = t.mask === "lines" ? S : t.mask === "words" ? b : t.mask === "chars" ? w : [];
      for (const k of v) d.masks.push(ah(k, `${i[t.mask]}-mask`));
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
      h || (f(), c(), u(), a = t.onSplit?.(p));
    },
    revert() {
      h = !0, l?.disconnect(), f(), c();
    }
  };
  u(), a = t.onSplit?.(p), t.autoSplit && m();
  function m() {
    const d = /* @__PURE__ */ new Map();
    let g = !1;
    const y = () => {
      if (g) return;
      g = !0;
      const w = () => {
        g = !1, p.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(w) : setTimeout(w, 0);
    };
    if (typeof ResizeObserver == "function") {
      l = new ResizeObserver((w) => {
        let S = !1;
        for (const v of w) {
          const k = Math.round(v.contentRect.width), T = d.get(v.target);
          d.set(v.target, k), T !== void 0 && T !== k && (S = !0);
        }
        S && y();
      });
      for (const w of e) l.observe(w);
    }
    const b = e[0]?.ownerDocument?.fonts;
    b && b.status !== "loaded" && b.ready.then(() => y());
  }
  return p;
}
function ih(e, t) {
  const n = e.ownerDocument, i = [], s = n.createTreeWalker(
    e,
    4
    /* NodeFilter.SHOW_TEXT */
  ), r = [];
  for (let o = s.nextNode(); o; o = s.nextNode()) r.push(o);
  for (const o of r) {
    const a = o.data.match(/\s+|\S+/g) ?? [];
    if (a.length === 0) continue;
    const l = n.createDocumentFragment();
    for (const h of a) {
      if (/^\s/.test(h)) {
        l.appendChild(n.createTextNode(h));
        continue;
      }
      const c = n.createElement("span");
      c.className = t, c.style.display = "inline-block", c.textContent = h, l.appendChild(c), i.push(c);
    }
    o.replaceWith(l);
  }
  return i;
}
function sh(e, t) {
  const n = e.ownerDocument, i = rh(e.textContent ?? "").map((s) => {
    const r = n.createElement("span");
    return r.className = t, r.style.display = "inline-block", r.textContent = s, r;
  });
  return e.replaceChildren(...i), i;
}
function rh(e) {
  const t = Intl.Segmenter;
  return t ? Array.from(new t(void 0, { granularity: "grapheme" }).segment(e), (n) => n.segment) : Array.from(e);
}
function oh(e, t, n) {
  const i = e.ownerDocument, s = new Map(t.map((m) => [m, m.getBoundingClientRect()])), r = [], o = (m) => {
    for (const d of Array.from(m.childNodes))
      d.nodeType === 3 || s.has(d) || d.tagName === "BR" ? r.push(d) : o(d);
  };
  o(e);
  const a = [];
  let l = null, h = 0, c = 0, f = !1, u = [];
  const p = () => {
    l = i.createElement("span"), l.className = n, l.style.display = "block", a.push(l), u = [];
  };
  for (const m of r) {
    if (m.tagName === "BR") {
      f = !0;
      continue;
    }
    const d = s.get(m);
    if (d && (!l || f || d.top > h + c) && (p(), h = d.top, c = d.height / 2, f = !1), !l) continue;
    const g = [];
    for (let w = m.parentNode; w && w !== e; w = w.parentNode) g.unshift(w);
    let y = 0;
    for (; y < u.length && y < g.length && u[y].original === g[y]; ) y++;
    u.length = y;
    let b = y === 0 ? l : u[y - 1].clone;
    for (const w of g.slice(y)) {
      const S = w.cloneNode(!1);
      b.appendChild(S), u.push({ original: w, clone: S }), b = S;
    }
    b.appendChild(m);
  }
  return e.replaceChildren(...a), a;
}
function ah(e, t) {
  const n = e.ownerDocument.createElement("span");
  return n.className = t, n.style.display = e.style.display === "block" ? "block" : "inline-block", n.style.overflow = "clip", n.style.paddingBottom = "0.12em", n.style.marginBottom = "-0.12em", e.replaceWith(n), n.appendChild(e), n;
}
const Qi = {
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
function ts(e) {
  const t = e.trim().toLowerCase();
  if (t in Qi) return Qi[t];
  if (t.endsWith("%")) {
    const n = Number.parseFloat(t.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function Ar(e) {
  if (typeof e == "number")
    return { elementFraction: 0, viewportFraction: 0, offsetPx: 0, absolutePx: e };
  let t = 0;
  const i = e.replace(/([+-])=\s*(-?[\d.]+)/g, (o, a, l) => (t += (a === "-" ? -1 : 1) * Number.parseFloat(l), "")).trim().split(/\s+/).filter(Boolean);
  if (i.length === 1 && /^-?[\d.]+$/.test(i[0]))
    return {
      elementFraction: 0,
      viewportFraction: 0,
      offsetPx: 0,
      absolutePx: Number.parseFloat(i[0]) + t
    };
  const s = i[0] !== void 0 ? ts(i[0]) : void 0, r = i[1] !== void 0 ? ts(i[1]) : void 0;
  return {
    elementFraction: s ?? 0,
    viewportFraction: r ?? 0,
    offsetPx: t
  };
}
function ae(e, t, n) {
  const i = Ar(n), s = i.absolutePx !== void 0 ? e.top + i.absolutePx : e.top + e.height * i.elementFraction, r = t * i.viewportFraction;
  return s - r + i.offsetPx;
}
function Od(e, t, n, i) {
  const s = ae(e, t, n), o = ae(e, t, i) - s;
  return o <= 0 ? s <= 0 ? 1 : 0 : Pr(-s / o);
}
function Pr(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e === 0 ? 0 : e;
}
function lh(e, t, n, i) {
  if (n <= 0) return t;
  const s = 1 - Math.exp(-(i / 1e3) / n);
  return e + (t - e) * s;
}
function es(e, t, n, i, s) {
  const r = (c) => ae({ top: e + s(c), bottom: e + s(c) + t, height: t }, n, i), o = r(0), a = r(1);
  if (Math.sign(o) === Math.sign(a) || o === 0 || a === 0)
    return o === 0 ? 0 : a === 0 ? 1 : Math.abs(o) < Math.abs(a) ? 0 : 1;
  let l = 0, h = 1;
  for (let c = 0; c < 40; c++) {
    const f = (l + h) / 2;
    Math.sign(r(f)) === Math.sign(o) ? l = f : h = f;
  }
  return (l + h) / 2;
}
class hh {
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
function Fd(e) {
  const t = new hh(e);
  return t.start(), t;
}
class ch {
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
const uh = 0.15;
function fh(e) {
  return typeof e == "object" && !Array.isArray(e) ? e : { snapTo: e };
}
function dh(e, t, n) {
  const i = we(e + t * uh);
  if (typeof n == "function") return we(n(i));
  if (typeof n == "number")
    return n <= 0 ? e : we(Math.round(i / n) * n);
  if (n.length === 0) return e;
  let s = n[0];
  for (const r of n)
    Math.abs(r - i) < Math.abs(s - i) && (s = r);
  return we(s);
}
function ph(e, t, n) {
  const i = e.duration ?? { min: 0.2, max: 0.8 };
  if (typeof i == "number") return i;
  const s = Math.min(1, Math.abs(t) / Math.max(1, n));
  return i.min + (i.max - i.min) * s;
}
class mh {
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
  animate(t, n, i, s = Qe, r) {
    if (this.cancel(), typeof requestAnimationFrame > "u" || i <= 0) {
      this.write(n), r?.();
      return;
    }
    for (const l of this.cancelEvents) this.eventTarget?.addEventListener(l, this.onInterrupt, { passive: !0 });
    let o = null;
    const a = (l) => {
      o ??= l;
      const h = Math.min(1, (l - o) / (i * 1e3));
      this.write(t + (n - t) * s(h)), h < 1 ? this.rafId = requestAnimationFrame(a) : (this.rafId = null, this.detach(), r?.());
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
function we(e) {
  return Math.max(0, Math.min(1, e));
}
class gh {
  options;
  scroller;
  nodes = [];
  scrollerStart;
  scrollerEnd;
  start;
  end;
  constructor(t, n, i) {
    this.options = i === !0 ? {} : i, this.scroller = n;
    const { startColor: s = "#3ecf7a", endColor: r = "#ff5a5a", id: o } = this.options, a = o ? `${o} ` : "", l = (h, c, f) => {
      const u = t.createElement("div");
      return u.textContent = `${a}${h}`, u.setAttribute("aria-hidden", "true"), u.className = "scroll-marker", Object.assign(u.style, {
        position: f ? "fixed" : "absolute",
        right: `${this.options.indent ?? 0}px`,
        zIndex: "2147483646",
        pointerEvents: "none",
        borderTop: `1px solid ${c}`,
        color: c,
        font: `${this.options.fontSize ?? "11px"} ui-monospace, monospace`,
        padding: "2px 6px",
        whiteSpace: "nowrap",
        background: "rgba(0, 0, 0, 0.35)"
      }), (n ?? t.body).appendChild(u), this.nodes.push(u), u;
    };
    this.scrollerStart = l("scroller-start", s, !n), this.scrollerEnd = l("scroller-end", r, !n), this.start = l("start", s, !1), this.end = l("end", r, !1), n && getComputedStyle(n).position === "static" && (n.style.position = "relative");
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
const yh = 120, Ct = [], Dt = /* @__PURE__ */ new Set();
let pn = !1;
const bh = () => {
  pn || Dt.size === 0 || (pn = !0, queueMicrotask(() => {
    pn = !1;
    for (const e of Dt) e.afterRefresh();
  }));
}, _r = () => {
  for (const e of Dt) e.beforeRefresh();
  for (const e of Ct) e.refresh();
  for (const e of Dt) e.afterRefresh();
};
let $t = { width: 0, height: 0 };
const ns = () => {
  const e = window.innerWidth, t = window.innerHeight, n = e === $t.width && t !== $t.height, i = Math.abs(t - $t.height) < $t.height * 0.25, s = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  n && i && s || ($t = { width: e, height: t }, _r());
};
class en {
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
    this.timeline = t.timeline, this.options = t, this.snapper = new mh((n) => this.scrollTo(n), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const t = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    t && !this.options.container && (this.pin = new ch(t, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new gh(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), Ct.length === 0 && typeof window < "u" && ($t = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", ns, { passive: !0 })), Ct.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), Ct.splice(Ct.indexOf(this), 1), Ct.length === 0 && typeof window < "u" && window.removeEventListener("resize", ns), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    _r();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(t) {
    return Dt.add(t), () => Dt.delete(t);
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
      if (this.startPx = t + ae(n, i, Ut(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(n, i, t), this.pin) {
        const s = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(s.top - (this.startPx - t), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(i) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, t), this.lastScroll = null, this.updateFrom(t, !this.measured), this.measured = !0, bh();
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
    this.targetProgress = i > 0 ? Pr((t - this.startPx) / i) : t >= this.startPx ? 1 : 0, this.zone = i > 0 ? t <= this.startPx ? "before" : t >= this.endPx ? "after" : "active" : t >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(s, this.zone), n || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const t = this.options.scrub;
    return typeof t == "number" ? Math.max(0, t) : 0;
  }
  resolveEnd(t, n, i) {
    const s = Ut(this.options.end) ?? "bottom top", r = typeof s == "string" ? s.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (r) {
      const o = Number.parseFloat(r[1]);
      return this.startPx + (r[2] === "%" ? n * o / 100 : o);
    }
    return i + ae(t, n, s);
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
    }, yh));
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
    const n = fh(t), i = () => {
      this.snapTimer = null;
      const s = this.endPx - this.startPx, r = this.scrollPosition();
      if (!this.running || s <= 0 || r <= this.startPx || r >= this.endPx) return;
      const o = (r - this.startPx) / s, a = this.startPx + dh(o, this.releaseVelocity / s, n.snapTo) * s;
      Math.abs(a - r) < 1 || this.snapper.animate(r, a, ph(n, a - r, this.viewportHeight()), n.ease);
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
    const i = n.getBoundingClientRect(), s = this.options.scroller?.getBoundingClientRect?.().left ?? 0, r = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, o = i.left - s - t.shiftAt(t.progress()), { start: a, end: l } = t.range(), h = (p) => a + p * (l - a), c = es(o, i.width, r, Ut(this.options.start) ?? "left right", t.shiftAt);
    this.startPx = h(c);
    const f = Ut(this.options.end) ?? "right left", u = typeof f == "string" ? f.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = u ? this.startPx + Number.parseFloat(u[1]) : h(es(o, i.width, r, f, t.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(t) {
    const n = (r, o) => {
      const a = Ut(r) ?? o;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const l = Ar(a);
      return t * l.viewportFraction - l.offsetPx;
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
      this.lastFrameTime = n, this.displayProgress = lh(this.displayProgress, this.targetProgress, this.smoothing(), i);
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
      const a = o.getBoundingClientRect(), l = n ? a.left : a.top;
      return { top: i - l, bottom: s - l, height: r };
    }
    return { top: i, bottom: s, height: r };
  }
  /** The viewport's size along the scroll axis. */
  viewportHeight() {
    const t = this.options.scroller, n = this.options.horizontal;
    return t ? n ? t.clientWidth : t.clientHeight : typeof window < "u" ? n ? window.innerWidth : window.innerHeight : 0;
  }
}
function Ut(e) {
  return typeof e == "function" ? e() : e;
}
function Bd(e) {
  const t = new en(e);
  return t.start(), t;
}
const mn = /* @__PURE__ */ new Set(), wh = 16, is = 0.5, vh = 2;
class ss {
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
    return t.addEventListener("wheel", this.onWheel, { passive: !1 }), t.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), mn.add(this), this.stopListening = en.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const t of mn) t.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const t = this.options.scroller ?? window;
    return t.removeEventListener("wheel", this.onWheel), t.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), mn.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const t of this.effects) gn(t.element, t.saved);
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
    this.target = i, this.journey = { from: this.current, to: i, ms: r * 1e3, ease: n.ease ?? Qe, elapsed: 0 }, this.requestFrame();
  }
  /** Re-measure the scrollable length and every effect element (resizes do this). */
  refresh() {
    if (!this.running) return;
    this.rest(), this.effects = [];
    const t = this.options.effects === !0 ? "[data-speed], [data-lag]" : this.options.effects || "";
    if (t && !this.reduced) {
      const n = this.options.scroller ?? document, i = this.position(), s = this.viewportHeight(), r = this.options.scroller?.getBoundingClientRect().top ?? 0;
      for (const o of n.querySelectorAll(t)) {
        const a = Number.parseFloat(o.dataset.speed ?? ""), l = Number.parseFloat(o.dataset.lag ?? ""), h = o.getBoundingClientRect(), c = h.top - r + i;
        this.effects.push({
          element: o,
          speed: Number.isFinite(a) ? a : void 0,
          lag: Number.isFinite(l) && l > 0 ? l : void 0,
          centre: c + h.height / 2 - s / 2,
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
    for (const t of this.effects) gn(t.element, t.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(t) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || t.ctrlKey || Math.abs(t.deltaX) > Math.abs(t.deltaY) || this.nestedScrollerTakes(t)) return;
    const n = t.deltaMode === 1 ? wh : t.deltaMode === 2 ? this.viewportHeight() : 1, i = t.deltaY * n * (this.options.wheelMultiplier ?? 1), s = this.clamp(this.target + i);
    s === this.target && s === this.current || (t.preventDefault(), this.journey = null, this.target = s, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const t = this.position();
    this.written !== null && Math.abs(t - this.written) <= vh || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = t, this.requestFrame());
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
      this.current += (this.target - this.current) * (1 - Math.exp(-n / r)), Math.abs(this.target - this.current) < is && (this.current = this.target);
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
        s.lagged = t === 0 ? i : s.lagged + (i - s.lagged) * (1 - Math.exp(-t / o)), Math.abs(i - s.lagged) < is ? s.lagged = i : n = !0, r += i - s.lagged;
      }
      gn(s.element, r === 0 ? s.saved : `0 ${kh(r)}px`), s.shift = r;
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
function gn(e, t) {
  t ? e.style.setProperty("translate", t) : e.style.removeProperty("translate");
}
function kh(e) {
  return Math.round(e * 100) / 100;
}
function Sh(e, t) {
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
function hi(e, t, n, i, s = () => {
}) {
  const r = (p) => typeof p == "string" ? e.query(p) ?? void 0 : p, o = r(t.trigger) ?? i;
  if (!o) {
    s(`gsap-compat: scrollTrigger has no trigger element${typeof t.trigger == "string" ? ` for "${t.trigger}"` : ""}`);
    return;
  }
  const a = t.scrub === void 0 || t.scrub === !1 ? !1 : t.scrub, l = (t.toggleActions ?? "play none none none").trim().split(/\s+/);
  let h = 0, c;
  const f = (p, m) => () => {
    m?.(), n && !a && Sh(n, l[p] ?? "none"), t.once && p === 0 && queueMicrotask(() => c.destroy());
  }, u = t.containerAnimation ? xh(e, t.containerAnimation, o, s) : void 0;
  return c = new en({
    trigger: o,
    start: t.start,
    end: t.end,
    scrub: a === !1 ? void 0 : a,
    pin: t.pin === !0 ? !0 : r(t.pin),
    scroller: r(t.scroller),
    horizontal: t.horizontal,
    pinSpacing: t.pinSpacing,
    onRefresh: t.invalidateOnRefresh && n?.invalidate ? () => n.invalidate() : void 0,
    snap: t.snap === void 0 ? void 0 : Mh(t.snap, n),
    markers: t.markers,
    container: u,
    onUpdate: (p, m) => {
      if (n && a !== !1 && n.progress(p), t.onUpdate) {
        const d = p < h || m < 0 ? -1 : 1;
        t.onUpdate({ progress: p, velocity: m, direction: d });
      }
      h = p;
    },
    onEnter: f(0, t.onEnter),
    onLeave: f(1, t.onLeave),
    onEnterBack: f(2, t.onEnterBack),
    onLeaveBack: f(3, t.onLeaveBack)
  }), n && a === !1 && n.progress(0), c.start(), e.own(c);
}
function Mh(e, t) {
  const n = (s) => s === "labels" ? (r) => Th(r, t?.labelProgresses?.() ?? []) : s;
  if (typeof e != "object" || Array.isArray(e)) return n(e);
  const i = e.ease ? Be(e.ease) : void 0;
  return {
    snapTo: n(e.snapTo),
    duration: e.duration,
    delay: e.delay,
    ease: i ? i.fn ?? J(i.easing) : void 0
  };
}
function Th(e, t) {
  return t.reduce((n, i) => Math.abs(i - e) < Math.abs(n - e) ? i : n, t[0] ?? e);
}
function xh(e, t, n, i) {
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
      let a = 0;
      for (const l of s()) {
        const h = o.values.get(l)?.get("x");
        typeof h == "number" && (a += h);
      }
      return a;
    }
  };
}
class Hr {
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
class Eh {
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
        const a = window.matchMedia(o);
        i.queries.set(r, a);
        const l = () => this.scheduleUpdate();
        a.addEventListener("change", l), this.listeners.push(() => a.removeEventListener("change", l));
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
    for (const [o, a] of t.queries) n[o] = a.matches;
    const i = Object.values(n).some(Boolean), s = i ? JSON.stringify(n) : void 0;
    if (s === t.key || (t.context?.revert(), t.context = void 0, t.key = s, !i)) return;
    const r = new Hr(this.host, this.scope);
    r.conditions = n, r.add(() => t.setup(r)), t.context = r;
  }
}
class Ah {
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
    const i = this.images[n], { width: s, height: r } = this.canvas, o = (this.options.fit ?? "cover") === "cover" ? Math.max(s / i.naturalWidth, r / i.naturalHeight) : Math.min(s / i.naturalWidth, r / i.naturalHeight), a = i.naturalWidth * o, l = i.naturalHeight * o;
    this.context.clearRect(0, 0, s, r), this.context.drawImage(i, (s - a) / 2, (r - l) / 2, a, l), this.drawn = n, this.pump();
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
const Ph = { opacity: 0, y: -16 }, _h = { opacity: 0, y: 16 };
async function Hh(e, t, n, i) {
  const s = t.collector?.scope ?? t.root, r = s.ownerDocument ?? s, o = () => i.shared ? [...s.querySelectorAll(i.shared)] : [];
  if (i.native && typeof r.startViewTransition == "function")
    return Ih(r, i, o);
  const a = i.duration ?? 0.35, l = i.ease ?? "power2.inOut", h = (g) => new Promise((y) => {
    g(y) || y();
  }), c = o(), f = c.length ? On(t, c) : void 0, u = i.from !== void 0 ? rs(t, i.from, i.shared) : [];
  if (u.length && i.leave !== !1) {
    const g = i.leave ?? Ph;
    await h((y) => e.to(u, { ...g, duration: a, ease: l, onComplete: y }));
  }
  await i.update();
  const p = [], m = typeof i.to == "function" ? i.to() : i.to, d = m !== void 0 ? rs(t, m, i.shared) : [];
  if (d.length && i.enter !== !1) {
    const g = i.enter ?? _h;
    p.push(h((y) => e.fromTo(d, g, { ...Er(g), duration: a, ease: l, onComplete: y })));
  }
  if (f) {
    const g = o().filter((y) => !c.includes(y));
    g.length && p.push(
      h(
        (y) => Fn(t, n, f, {
          targets: g,
          duration: a * 1.4,
          ease: l,
          enter: !1,
          onComplete: y
        })
      )
    );
  }
  await Promise.all(p);
}
function rs(e, t, n) {
  const i = e.resolveTargets(t).map((s) => e.elementFor(s)).filter((s) => !!s);
  return n ? i.flatMap((s) => !s.querySelector(n) && !s.matches(n) ? [s] : [...s.children].filter((r) => !r.matches(n) && !r.querySelector(n))) : i;
}
async function Ih(e, t, n) {
  const i = (a, l) => {
    const h = a.dataset?.flipId;
    h && a.style.setProperty("view-transition-name", l ? `tf-${h.replace(/[^\w-]/g, "-")}` : "");
  }, s = n();
  s.forEach((a) => i(a, !0));
  let r = [];
  await e.startViewTransition(async () => {
    s.forEach((a) => i(a, !1)), await t.update(), r = n(), r.forEach((a) => i(a, !0));
  }).finished, r.forEach((a) => i(a, !1));
}
const Ch = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (e, t) => oi(e, Oa(t))
}, $h = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (e, t) => oi(e, { fn: Fa(t) })
}, Rh = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (e, t) => oi(e, { fn: Ba(t) })
}, Lh = /* @__PURE__ */ new Set([
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
]), os = 0.5, Oh = "power1.inOut";
function Fh(e) {
  return e.keyframes !== void 0 && e.keyframes !== null;
}
function Bh(e) {
  const t = e.keyframes, n = {};
  for (const [h, c] of Object.entries(e)) Lh.has(h) || (n[h] = c);
  if (Array.isArray(t))
    return t.map((h) => ({
      ...n,
      ...h,
      duration: h.duration ?? e.duration ?? os
    }));
  const i = Object.entries(t), s = e.duration ?? os, r = t.easeEach ?? e.easeEach ?? Oh;
  if (i.length > 0 && i.every(([h]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(h) || h === "easeEach")) {
    const h = i.filter(([u]) => u !== "easeEach").map(([u, p]) => ({ at: Number.parseFloat(u) / 100, step: p })).sort((u, p) => u.at - p.at), c = [];
    let f = 0;
    for (const { at: u, step: p } of h) {
      const m = Math.max(0, u - f);
      c.push({ ...n, ease: r, ...p, duration: m * s }), f = u;
    }
    return c;
  }
  const o = i.filter(([h, c]) => h !== "easeEach" && Array.isArray(c)), a = Math.max(0, ...o.map(([, h]) => h.length)), l = [];
  for (let h = 0; h < a; h++) {
    const c = { ...n, ease: r, duration: s / a };
    for (const [f, u] of o)
      h < u.length && (c[f] = u[h]);
    l.push(c);
  }
  return l;
}
function as(e, t, n, i = {}) {
  const s = t.collector?.scope ?? t.root, r = typeof i.scroller == "string" ? s.querySelector(i.scroller) : i.scroller ?? null, o = {
    x: r ? r.scrollLeft : window.scrollX,
    y: r ? r.scrollTop : window.scrollY
  }, a = {
    x: r ? r.scrollWidth - r.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: r ? r.scrollHeight - r.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, l = (b, w) => {
    if (w === void 0) return o[b];
    if (typeof w == "number") return w;
    if (w === "max") return a[b];
    const S = typeof w == "string" ? s.querySelector(w) : w;
    if (!S) return o[b];
    const v = S.getBoundingClientRect(), k = r?.getBoundingClientRect(), T = (b === "x" ? i.offsetX : i.offsetY) ?? i.offset ?? 0;
    return b === "x" ? v.left - (k?.left ?? 0) + o.x - T : v.top - (k?.top ?? 0) + o.y - T;
  }, h = typeof n == "object" && n !== null && !("nodeType" in n) ? { x: l("x", n.x), y: l("y", n.y) } : { x: o.x, y: l("y", n) }, c = { x: Math.max(0, Math.min(a.x, h.x)), y: Math.max(0, Math.min(a.y, h.y)) }, f = { ...o }, u = () => {
    r ? (r.scrollLeft = f.x, r.scrollTop = f.y) : window.scrollTo({ left: f.x, top: f.y, behavior: "instant" });
  }, p = ["wheel", "touchstart", "keydown"], m = r ?? window, d = () => {
    y.kill(), g();
  }, g = () => {
    for (const b of p) m.removeEventListener(b, d);
  }, y = e.to(f, {
    x: c.x,
    y: c.y,
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
  if (i.autoKill !== !1) for (const b of p) m.addEventListener(b, d, { passive: !0 });
  return y;
}
function Dh(e, t, n) {
  const i = e.collector?.scope ?? e.root, s = typeof t == "string" ? [...i.querySelectorAll(t)] : "nodeType" in t ? [t] : Array.from(t), { interval: r = 0.1, batchMax: o, onEnter: a, onLeave: l, onEnterBack: h, onLeaveBack: c, ...f } = n, u = { onEnter: a, onLeave: l, onEnterBack: h, onLeaveBack: c }, p = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, m = {}, d = (y) => {
    m[y] !== void 0 && clearTimeout(m[y]), m[y] = void 0;
    const b = p[y].splice(0);
    b.length > 0 && u[y]?.(b);
  }, g = (y, b) => {
    if (u[y]) {
      if (p[y].push(b), o !== void 0 && p[y].length >= o) return d(y);
      m[y] === void 0 && (m[y] = setTimeout(() => d(y), r * 1e3));
    }
  };
  return s.map(
    (y) => hi(e, {
      ...f,
      trigger: y,
      onEnter: () => g("onEnter", y),
      onLeave: () => g("onLeave", y),
      onEnterBack: () => g("onEnterBack", y),
      onLeaveBack: () => g("onLeaveBack", y)
    })
  ).filter((y) => y !== void 0);
}
class ct {
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
    if (this.options = i, this.compat = new Rt({
      ...i,
      startValue: (s, r) => {
        const o = t.objectFor(s);
        if (o) return Yh(o[r]);
        const a = t.appliedValue(s, r);
        if (a !== void 0) return a;
        if (r === "d") return Mr(t.elementFor(s)) ?? void 0;
        if (r === "text") return t.elementFor(s)?.textContent ?? void 0;
        if (r === "strokeDasharray" || r === "strokeDashoffset") {
          const l = cs(t.elementFor(s));
          if (l !== void 0) return r === "strokeDasharray" ? [l, l] : 0;
        }
      },
      startVelocity: (s, r) => t.velocityOf(s, r),
      layoutColumns: (s) => hs(s.map((r) => t.elementFor(r))),
      random: () => t.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, t.collector?.track(this), t.liveTimelines.add(this), this.autoplayPending = !i.paused && !i.scrollTrigger, i.scrollTrigger) {
      const s = i.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = hi(t, s, this, this.firstElement, (r) => i.onWarning?.(r)));
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
    return Fh(n) ? this.record(() => this.keyframed(t, n, i)) : this.record(() => this.tween(t, [n], i, ([s], r, o) => this.compat.to(r, s, o)));
  }
  from(t, n, i) {
    return this.record(() => this.tween(t, [n], i, ([s], r, o) => this.compat.from(r, s, o)));
  }
  fromTo(t, n, i, s) {
    return this.record(
      () => this.tween(t, [n, i], s, ([r, o], a, l) => this.compat.fromTo(a, r, o, l))
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
    const s = this.timeline.currentTime, r = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(n))), o = { time: s }, a = i.duration ?? Math.abs(r - s) / 1e3 / (this.timeScale() || 1), l = new ct(this.stage, { onStart: i.onStart, onComplete: i.onComplete });
    return l.to(o, {
      time: r,
      duration: a,
      ease: i.ease ?? "none",
      onUpdate: () => {
        this.moveTo(o.time), i.onUpdate?.();
      }
    }), l;
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
      const a = t.currentTime === 0 && t.direction === "reverse";
      !this.scrollDriver && !r && this.stage.liveTimelines.delete(this), a && this.backwards ? this.options.onReverseComplete?.() : this.options.onComplete?.();
    }
    this.finishedThisFrame = !1;
  }
  /** Fire events and repeats between two playheads. Returns true if a pause stopped it. */
  runCrossings(t, n, i) {
    if (this.events.length === 0 && this.ranges.length === 0 && !this.options.onRepeat && !this.options.repeatRefresh) return !1;
    const s = this.events, { crossings: r, passes: o } = ir(
      s.map((a) => a.time),
      t,
      n,
      { duration: this.timeline.duration, alternate: this.options.yoyo === !0, holding: i }
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
      o.some(([h, c]) => h !== c && Math.max(h, c) >= a.start && Math.min(h, c) <= a.end) && a.run();
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
    const { onStart: o, onUpdate: a, onComplete: l } = n[n.length - 1];
    if (o || a || l) {
      let h = 1 / 0, c = -1 / 0;
      const f = (u, p, m) => {
        s(u, p, m), h = Math.min(h, this.compat.lastStart), c = Math.max(c, this.compat.lastEnd);
      };
      if (this.buildTween(r, n, i, f), h === 1 / 0) return;
      o && this.events.push({ time: h, direction: "forward", run: o }), a && this.ranges.push({ start: h, end: c, run: a }), l && this.events.push({ time: c, direction: "forward", run: l });
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
    const r = Bh(n);
    if (r.length === 0) return;
    const o = s.length > 1 ? Rn(n.stagger, this.staggerContext(s)) : void 0, a = s.map((g) => this.targetFor(g)).filter((g) => g !== void 0), l = o ? a.map((g) => [g]) : [a], h = o ? An(s.length, o).map((g) => g / 1e3) : [0], c = this.compat.timeOf(i) / 1e3 + De(n.delay, 0) / 1e3;
    let f = 1 / 0, u = -1 / 0;
    if (l.forEach((g, y) => {
      r.forEach((b, w) => {
        const S = w === 0 ? c + h[y] : ">";
        this.tween(g, [b], S, ([v], k, T) => this.compat.to(k, v, T)), f = Math.min(f, this.compat.lastStart), u = Math.max(u, this.compat.lastEnd);
      });
    }), f === 1 / 0) return;
    const { onStart: p, onUpdate: m, onComplete: d } = n;
    p && this.events.push({ time: f, direction: "forward", run: p }), m && this.ranges.push({ start: f, end: u, run: m }), d && this.events.push({ time: u, direction: "forward", run: d });
  }
  staggerContext(t) {
    return {
      count: t.length,
      columnsFromLayout: () => hs(t.map((n) => this.stage.elementFor(n))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(t, n, i, s) {
    const r = t.map((u) => this.targetFor(u));
    if (!(t.length > 1 && (n.some(Kh) || t.some((u) => this.stage.objectFor(u) !== void 0)))) {
      const u = this.targetFor(t[0]);
      s(n.map((p) => this.prepare(ls(p, 0, u, this.stage.utils, r), t)), t, i);
      return;
    }
    const a = n.length - 1, { stagger: l, ...h } = n[a], c = Rn(l, this.staggerContext(t)), f = c ? An(t.length, c).map((u) => u / 1e3) : t.map(() => 0);
    t.forEach((u, p) => {
      const m = p === 0 ? De(h.delay, 0) / 1e3 + f[0] : 0, d = p === 0 ? 0 : f[p] - f[p - 1], g = p === 0 ? i : `<${d < 0 ? "-" : "+"}${Math.abs(d).toFixed(6)}`, b = n.map((w, S) => S === a ? { ...h, delay: m } : w).map((w) => this.prepare(ls(w, p, this.targetFor(u), this.stage.utils, r), [u]));
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
      const o = Yl(t.motionPath, {
        query: s,
        targets: n.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: i
      });
      r = { ...r, motionPath: o };
    }
    if (t.morphSVG !== void 0) {
      const o = ql(t.morphSVG, s, i), { morphSVG: a, ...l } = r;
      r = o ? { ...r, morphSVG: o } : l;
    }
    if (t.drawSVG !== void 0) {
      const o = cs(this.stage.elementFor(n[0]));
      if (o === void 0) {
        i("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...l } = r;
        r = l;
      } else
        r = ml(r, o);
    }
    return r;
  }
  resolve(t) {
    const n = this.stage.resolveTargets(t);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${qh(t)}`);
      return;
    }
    return this.firstElement ??= n.map((i) => this.stage.elementFor(i)).find((i) => i !== void 0), n;
  }
}
function Wh(e = new Dl()) {
  const t = (r) => {
    const { config: o } = He(r);
    return new ct(e, {
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
    const { onStart: o, onUpdate: a, onComplete: l, onRepeat: h, onReverseComplete: c, repeatRefresh: f, ...u } = r;
    return u;
  }, i = (r) => (r && e.collector?.track(r), r), s = {
    stage: e,
    ticker: e.ticker,
    utils: e.utils,
    getProperty: (r, o) => {
      const [a] = e.resolveTargets(r);
      if (a === void 0) return;
      const l = e.objectFor(a);
      return l ? l[o] : e.appliedValue(a, o) ?? wr(o);
    },
    scrollTrigger: (r) => i(hi(e, r)),
    scrollBatch: (r, o) => Dh(e, r, o).map((a) => i(a)),
    scrollTo: (r, o) => as(s, e, r, o),
    refreshScroll: () => {
      en.refreshAll(), ss.refreshAll();
    },
    smoothScroll: (r = {}) => {
      const o = typeof r.scroller == "string" ? (e.collector?.scope ?? e.root).querySelector(r.scroller) : r.scroller;
      return i(new ss({ ...r, scroller: o }).start());
    },
    context: (r, o) => {
      const a = new Hr(e, o);
      return r && a.add(() => r(a)), a;
    },
    matchMedia: (r) => new Eh(e, r),
    customEase: Ch.create,
    customBounce: $h.create,
    customWiggle: Rh.create,
    pageTransition: (r) => Hh(s, e, (o) => new ct(e, o), r),
    imageSequence: (r, o) => {
      const a = typeof r == "string" ? (e.collector?.scope ?? e.root).querySelector(r) : r;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(r)}`);
      return i(new Ah(a, o));
    },
    quickTo: (r, o, a = {}) => {
      const l = new ct(e, { paused: !0 }), [h] = e.resolveTargets(r);
      return Object.assign((f) => {
        if (!h) return;
        const u = a.spring !== void 0 ? e.velocityOf(h, o) ?? 0 : 0;
        l.compat.reset(), l.compat.to(h, {
          [o]: f,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: Nh(a.spring, o, u) }
        }), l.timeline.stop(), l.timeline.play(), e.activate(l.timeline);
      }, { tween: l, kill: () => l.kill() });
    },
    timeline: (r) => new ct(e, r),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (r, o) => {
      if (o.scrollTo !== void 0) {
        const { scrollTo: a, ...l } = o, h = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, c = typeof r != "string" && r !== window && r.nodeType === 1;
        return as(s, e, a, {
          ...l,
          offsetX: h.offsetX,
          offsetY: h.offsetY,
          scroller: c ? r : void 0
        });
      }
      return t(o).to(r, n(o));
    },
    from: (r, o) => t(o).from(r, n(o)),
    fromTo: (r, o, a) => t(a).fromTo(r, o, n(a)),
    set: (r, o) => t(o).set(r, n(o)),
    delayedCall: (r, o, a) => new ct(e).call(o, a, r),
    killTweensOf: (r, o) => {
      const a = e.resolveTargets(r), l = typeof o == "string" ? o.split(",").map((h) => h.trim()).filter(Boolean) : o;
      for (const h of [...e.liveTimelines]) h.killTweensOf(a, l);
    },
    convertToPath: (r) => Vl(r, e.root),
    splitText: (r, o) => {
      const a = e.collector?.scope ?? e.root, l = typeof r == "string" ? Array.from(a.querySelectorAll(r)) : "nodeType" in r ? [r] : Array.from(r);
      return i(nh(l, o));
    },
    draggable: (r, o) => i(Zl(s, e, r, o)),
    getFlipState: (r) => On(e, r),
    flipFrom: (r, o) => Fn(e, (a) => new ct(e, a), r, o),
    flip: (r, o, a) => {
      const l = On(e, r);
      return o(), Fn(e, (h) => new ct(e, h), l, { targets: r, ...a });
    }
  };
  return s;
}
const Q = /* @__PURE__ */ Wh();
function Nh(e, t, n) {
  return e === !0 ? { velocity: { [t]: n } } : typeof e == "string" ? { preset: e, velocity: { [t]: n } } : { ...e, velocity: { [t]: n } };
}
function Kh(e) {
  return e.morphSVG !== void 0 || e.drawSVG !== void 0 || e.text !== void 0 || e.scrambleText !== void 0 || Ir(e);
}
function Ir(e) {
  return Object.entries(e).some(([t, n]) => (typeof n == "function" || br(n)) && !ai.has(t));
}
function ls(e, t, n, i, s) {
  if (!Ir(e)) return e;
  const r = {};
  for (const [o, a] of Object.entries(e))
    ai.has(o) ? r[o] = a : typeof a == "function" ? r[o] = a(t, n, s) : br(a) ? r[o] = i.resolveRandomString(a) : r[o] = a;
  return r;
}
function hs(e) {
  const t = e.map((i) => i?.getBoundingClientRect().top);
  if (t[0] === void 0) return e.length;
  let n = 0;
  for (const i of t) {
    if (i === void 0 || Math.abs(i - t[0]) > 1) break;
    n++;
  }
  return Math.max(1, n);
}
function cs(e) {
  const t = e;
  if (typeof t?.getTotalLength == "function")
    return t.getTotalLength();
}
function Yh(e) {
  if (typeof e == "number" || typeof e == "string" || Array.isArray(e) && e.every((t) => typeof t == "number")) return e;
}
function qh(e) {
  return typeof e == "string" ? `"${e}"` : String(e);
}
class us {
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
function Xh(e, t, n, i, s) {
  const r = n - s;
  if (r < 0) {
    t.paused || t.pause(), t.currentTime = 0;
    return;
  }
  e.update(r, i);
}
class ci {
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
    this.options = n, this.adapter = new St();
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
    this.options.speed !== void 0 && (n.speed = this.options.speed), this.options.loop !== void 0 && (n.loop = this.options.loop), this.options.alternate !== void 0 && (n.alternate = this.options.alternate), this.timeline = se({ ...t, config: n }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
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
    const n = this.scenarioList.find((a) => a.id === t);
    if (!n || !this.timeline) return !1;
    if (t === this.scenarioId) return !0;
    const i = this.isPlaying, s = this.currentTime >= this.duration - 0.5, r = this.currentMarker?.id;
    this.stopAnimationLoop(), this.stepping = !1, this.pausedByVisibility = !1, this.restoreAuthored(), this.scenarioId = t, this.useDefinition(n.timeline), this.lastMarkerId = null;
    let o = 0;
    return this.reducedMotion || s ? o = this.duration : r !== void 0 && (o = this.markers.find((a) => a.id === r)?.time ?? 0), this.seek(o), i && !this.reducedMotion ? (this.stepping = this.options.stepMode === !0, this.startPlaying()) : this.notify(), !0;
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
      r !== null && (i.volume = Math.max(0, Math.min(1, Number(r) || 0))), this.mediaTargets.push({ el: i, startTime: s, sync: new us(i) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(t, n) {
    for (const i of this.mediaTargets)
      Xh(i.sync, i.el, t, n, i.startTime);
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
      const o = new St();
      i.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const l = a.getAttribute("data-tinyfly");
        l && o.registerTarget(l, a);
      }), this.symbolInstances.push({ adapter: o, timeline: se(r.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(t, n) {
    this.mediaSync = new us(t, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const { crossings: r } = ir(
      s.map((o) => o.time),
      t,
      i,
      { duration: n.duration, alternate: n.config.alternate === !0, holding: n.repeatDelayRemaining > 0 }
    );
    for (const o of r) {
      if (o.kind !== "event") continue;
      const a = s[o.index];
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
      const i = n.timeline.duration;
      n.adapter.applyState(n.timeline.getStateAtTime(i > 0 ? t % i : t));
    }
  }
}
async function Dd(e, t, n = {}) {
  const i = new ci(e, { ...n, autoplay: !0 });
  return await i.load(t), i;
}
function Wd(e, t = {}) {
  return new ci(e, t);
}
const Vh = {
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
}, fs = "tinyfly-controls-style", Uh = `
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
let zh = 0;
function jh(e) {
  if (e.getElementById(fs)) return;
  const t = e.createElement("style");
  t.id = fs, t.textContent = Uh, e.head.appendChild(t);
}
function Gh(e, t, n = {}) {
  const i = t.ownerDocument;
  jh(i);
  const s = { ...Vh, ...n.labels }, r = n.speeds ?? [0.5, 1, 2], o = () => e.markers.length > 0, a = () => e.markers.some((I) => I.label !== void 0 || e.caption(I.id) !== void 0), l = i.createElement("div");
  l.className = "tf-ctl";
  const h = i.createElement("div");
  h.className = "tf-ctl-bar", h.setAttribute("role", "group");
  const c = (I, C, R, O = "") => {
    const L = i.createElement("button");
    return L.type = "button", L.className = `tf-ctl-btn ${O}`.trim(), L.setAttribute("aria-label", I), L.title = I, L.textContent = C, L.addEventListener("click", R), L;
  }, f = c(s.restart, "⟲", () => {
    e.pause(), e.seek(0);
  }), u = c(s.prev, "|◀", () => e.prev()), p = c(s.play, "▶", () => e.isPlaying ? e.pause() : d(), "tf-ctl-primary"), m = c(s.next, "▶|", () => e.next()), d = () => {
    e.currentTime >= e.duration - 0.5 && e.seek(0), e.play();
  }, g = i.createElement("input");
  g.type = "range", g.className = "tf-ctl-scrub", g.min = "0", g.max = "1000", g.step = "1", g.setAttribute("aria-label", s.scrub), g.addEventListener("input", () => {
    e.pause(), e.seek(Number(g.value) / 1e3 * e.duration);
  });
  const y = i.createElement("span");
  y.className = "tf-ctl-step";
  const b = i.createElement("select");
  b.className = "tf-ctl-speed", b.setAttribute("aria-label", s.speed);
  for (const I of r) {
    const C = i.createElement("option");
    C.value = String(I), C.textContent = `${I}×`, I === 1 && (C.selected = !0), b.appendChild(C);
  }
  b.addEventListener("change", () => e.setSpeed(Number(b.value))), h.append(f, u, p, m, g, y), r.length > 0 && h.append(b), l.append(h);
  const w = n.fullscreen ? tc(t, i, s) : void 0;
  w && h.append(w.button);
  const S = i.createElement("p");
  S.className = "tf-ctl-caption", S.setAttribute("aria-live", "polite"), n.captions !== !1 && l.append(S);
  const v = i.createElement("div");
  v.className = "tf-ctl-question", v.hidden = !0;
  const k = i.createElement("span"), T = c(s.reveal, s.reveal, () => e.play(), "tf-ctl-primary");
  v.append(k, T), l.append(v);
  const P = Jh(e, i, s.scenario, n.scenarioControl ?? "buttons");
  P && l.append(P.element);
  const M = n.mount;
  M ? M.appendChild(l) : t.insertAdjacentElement("afterend", l);
  const A = () => {
    const I = e.isPlaying;
    p.textContent = I ? "❚❚" : "▶", p.setAttribute("aria-label", I ? s.pause : s.play), p.title = I ? s.pause : s.play;
    const C = e.duration;
    i.activeElement !== g && (g.value = String(C > 0 ? Math.round(e.currentTime / C * 1e3) : 0));
    const R = e.markers;
    if (u.hidden = m.hidden = y.hidden = R.length === 0, R.length > 0) {
      const O = e.currentMarker, L = O ? R.indexOf(O) + 1 : 0;
      y.textContent = s.stepFormat.replace("{index}", String(L)).replace("{total}", String(R.length)), y.setAttribute("aria-label", `${s.step} ${L} ${s.of} ${R.length}`), u.disabled = e.currentTime <= 0.5, m.disabled = e.currentTime >= C - 0.5;
      const $ = e.caption() ?? "";
      S.textContent !== $ && (S.textContent = $), S.hidden = !a();
      const F = !I && O?.question !== void 0 && Math.abs(e.currentTime - O.time) < 1;
      v.hidden = !F, F && k.textContent !== O.question && (k.textContent = O.question);
    } else
      v.hidden = !0, S.hidden = !0;
    P?.update();
  }, x = e.subscribe(A);
  A();
  const E = n.keyboardScope ?? t;
  !E.hasAttribute("tabindex") && E.tabIndex < 0 && (E.tabIndex = 0);
  const _ = /* @__PURE__ */ new WeakSet(), H = (I) => {
    if (_.has(I) || (_.add(I), I.defaultPrevented || I.altKey || I.ctrlKey || I.metaKey)) return;
    const C = I.target;
    if (!(C.tagName === "INPUT" || C.tagName === "SELECT") && !(I.key === " " && C.tagName === "BUTTON"))
      switch (I.key) {
        case " ":
          I.preventDefault(), e.isPlaying ? e.pause() : d();
          break;
        case "ArrowRight":
          if (!o()) return;
          I.preventDefault(), e.next();
          break;
        case "ArrowLeft":
          if (!o()) return;
          I.preventDefault(), e.prev();
          break;
        case "Home":
          I.preventDefault(), e.pause(), e.seek(0);
          break;
        case "f":
        case "F":
          if (!w) return;
          I.preventDefault(), w.active ? w.exit() : w.enter();
          break;
      }
  };
  return E.addEventListener("keydown", H), l.addEventListener("keydown", H), {
    element: l,
    fullscreen: w && {
      get active() {
        return w.active;
      },
      enter: w.enter,
      exit: w.exit
    },
    destroy() {
      w?.destroy(), x(), E.removeEventListener("keydown", H), l.removeEventListener("keydown", H), l.remove();
    }
  };
}
function Jh(e, t, n, i) {
  const s = e.scenarios;
  if (s.length < 2) return;
  if (i === "slider") {
    const c = t.createElement("div");
    c.className = "tf-ctl-choice-slider";
    const f = t.createElement("span");
    f.textContent = n, f.setAttribute("aria-hidden", "true");
    const u = t.createElement("input");
    u.type = "range", u.min = "0", u.max = String(s.length - 1), u.step = "1", u.setAttribute("aria-label", n);
    const p = t.createElement("output");
    return p.setAttribute("aria-hidden", "true"), u.addEventListener("input", () => {
      const d = s[Number(u.value)];
      d && e.setScenario(d.id);
    }), c.append(f, u, p), { element: c, update: () => {
      const d = Math.max(0, s.findIndex((y) => y.id === e.scenario));
      t.activeElement !== u && (u.value = String(d));
      const g = s[d].label;
      p.textContent !== g && (p.textContent = g), u.setAttribute("aria-valuetext", g);
    } };
  }
  const r = t.createElement("fieldset");
  r.className = "tf-ctl-choices";
  const o = t.createElement("legend");
  o.textContent = n, r.append(o);
  const a = `tf-ctl-scenario-${++zh}`, l = s.map((c) => {
    const f = t.createElement("label");
    f.className = "tf-ctl-choice";
    const u = t.createElement("input");
    u.type = "radio", u.name = a, u.value = c.id, u.addEventListener("change", () => {
      u.checked && e.setScenario(c.id);
    });
    const p = t.createElement("span");
    return p.textContent = c.label, f.append(u, p), r.append(f), u;
  });
  return { element: r, update: () => {
    for (const c of l) {
      const f = c.value === e.scenario;
      c.checked !== f && (c.checked = f);
    }
  } };
}
const Zh = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', Qh = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function tc(e, t, n) {
  const i = t, s = e, r = t.createElement("button");
  r.type = "button", r.className = "tf-ctl-btn tf-ctl-fullscreen";
  let o, a = "";
  const l = () => {
    const d = o !== void 0;
    r.innerHTML = d ? Qh : Zh;
    const g = d ? n.exitFullscreen : n.fullscreen;
    r.setAttribute("aria-label", g), r.title = g, r.setAttribute("aria-pressed", String(d)), e.classList.toggle("tf-fullscreen", d), e.classList.toggle("tf-fullscreen-overlay", o === "overlay");
  }, h = () => i.fullscreenElement ?? i.webkitFullscreenElement ?? null, c = () => {
    h() === e ? o = "native" : o === "native" && (o = void 0), l();
  }, f = (d) => {
    d.key === "Escape" && m();
  }, u = () => {
    o = "overlay", a = t.documentElement.style.overflow, t.documentElement.style.overflow = "hidden", t.addEventListener("keydown", f), l();
  };
  async function p() {
    if (o) return;
    const d = s.requestFullscreen?.bind(s) ?? s.webkitRequestFullscreen?.bind(s), g = i.fullscreenEnabled ?? i.webkitFullscreenEnabled ?? !1;
    if (d && g)
      try {
        if (await d(), h() === e) {
          o = "native", l();
          return;
        }
      } catch {
      }
    u();
  }
  async function m() {
    if (o === "overlay")
      t.removeEventListener("keydown", f), t.documentElement.style.overflow = a, o = void 0, l();
    else if (o === "native") {
      o = void 0, l();
      const d = i.exitFullscreen?.bind(i) ?? i.webkitExitFullscreen?.bind(i);
      h() === e && d && await d();
    }
  }
  return r.addEventListener("click", () => {
    o ? m() : p();
  }), t.addEventListener("fullscreenchange", c), t.addEventListener("webkitfullscreenchange", c), l(), {
    button: r,
    get active() {
      return o !== void 0;
    },
    enter: p,
    exit: m,
    destroy() {
      m(), t.removeEventListener("fullscreenchange", c), t.removeEventListener("webkitfullscreenchange", c), r.remove();
    }
  };
}
const ds = "tinyfly-choices-style", ec = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function nc(e) {
  if (e.getElementById(ds)) return;
  const t = e.createElement("style");
  t.id = ds, t.textContent = ec, e.head.appendChild(t);
}
function ic(e, t) {
  const n = Array.from(t.querySelectorAll("[data-tinyfly-choose]"));
  if (n.length === 0) return () => {
  };
  nc(t.ownerDocument);
  const i = [], s = [];
  for (const a of n) {
    const l = a.getAttribute("data-tinyfly-choose") ?? "", h = [], c = (m, d) => {
      a.hasAttribute(m) || (a.setAttribute(m, d), h.push(m));
    };
    c("role", "button"), c("tabindex", "0");
    const f = e.scenarios.find((m) => m.id === l)?.label;
    f !== void 0 && c("aria-label", f), a.setAttribute("aria-pressed", "false"), h.push("aria-pressed"), i.push({ element: a, attributes: h });
    const u = () => e.setScenario(l), p = (m) => {
      const d = m.key;
      d !== "Enter" && d !== " " || (m.preventDefault(), u());
    };
    a.addEventListener("click", u), a.addEventListener("keydown", p), s.push(() => {
      a.removeEventListener("click", u), a.removeEventListener("keydown", p);
    });
  }
  const r = () => {
    for (const { element: a } of i)
      a.setAttribute("aria-pressed", String(a.getAttribute("data-tinyfly-choose") === e.scenario));
  }, o = e.subscribe(r);
  return r(), () => {
    o();
    for (const a of s) a();
    for (const { element: a, attributes: l } of i) for (const h of l) a.removeAttribute(h);
  };
}
const Ne = /* @__PURE__ */ new WeakMap(), Bn = /* @__PURE__ */ new WeakMap();
let sc = 0;
function Jt(e, t, n) {
  if (e)
    try {
      return JSON.parse(e);
    } catch (i) {
      console.warn(`tinyfly: invalid ${t} JSON on`, n, i);
      return;
    }
}
async function rc(e, t = {}) {
  const n = Ne.get(e);
  if (n) return n;
  const i = Array.from(e.querySelectorAll("script[data-tinyfly-timeline]")), s = i[0], r = e.getAttribute("data-src"), o = ac(e.getAttribute("data-markers")), a = i.length > 1 || s?.hasAttribute("data-scenario") ? oc(i, o, e) : void 0;
  if (a && a.length === 0) return;
  let l = s && !a ? Jt(s.textContent, "timeline", e) : void 0;
  if (!l && r && o) {
    const p = await fetch(r);
    p.ok && (l = await p.json());
  }
  if (l && o && (l = Cr(l, o)), !l && !r && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', e);
    return;
  }
  const h = Jt(e.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", e), c = {
    playWhenVisible: !0,
    ...t.player,
    ...h && { captions: h },
    ...Jt(e.getAttribute("data-options"), "data-options", e)
  };
  hc(e);
  const f = new ci(e, c), u = { element: e, player: f };
  if (Ne.set(e, u), e.setAttribute("data-tinyfly-mounted", ""), a) {
    const p = e.getAttribute("data-scenario") ?? void 0;
    await f.loadScenarios(a, { initial: a.some((m) => m.id === p) ? p : void 0 }), Bn.set(e, ic(f, e));
  } else
    await f.load(l ?? r);
  if (e.getAttribute("data-controls") !== "false") {
    const p = Jt(e.getAttribute("data-labels"), "data-labels", e), m = e.querySelector("figcaption"), d = e.getAttribute("data-scenario-legend"), g = e.getAttribute("data-scenario-control");
    u.controls = Gh(f, e, {
      ...t.controls,
      ...e.getAttribute("data-fullscreen") === "true" ? { fullscreen: !0 } : {},
      ...g === "slider" || g === "buttons" ? { scenarioControl: g } : {},
      labels: { ...t.controls?.labels, ...p, ...d ? { scenario: d } : {} },
      // Inside the figure, before its figcaption, so the caption stays last.
      mount: void 0
    }), m ? e.insertBefore(u.controls.element, m) : e.appendChild(u.controls.element);
  }
  return u;
}
function oc(e, t, n) {
  const i = [];
  return e.forEach((s, r) => {
    const o = Jt(s.textContent, "timeline", n);
    if (!o) return;
    const a = s.getAttribute("data-scenario") || `scenario-${r + 1}`;
    if (i.some((h) => h.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, n);
      return;
    }
    const l = s.getAttribute("data-scenario-label") ?? void 0;
    i.push({ id: a, label: l, timeline: t ? Cr(o, t) : o });
  }), i;
}
function Cr(e, t) {
  return e.config.markers?.length ? e : { ...e, config: { ...e.config, markers: t.map((n, i) => ({ id: `step-${i + 1}`, time: n })) } };
}
function ac(e) {
  if (!e) return;
  const t = e.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((n, i) => n - i);
  return t.length > 0 ? t : void 0;
}
async function lc(e = document, t = {}) {
  const n = Array.from(e.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(n.map((s) => rc(s, t)))).filter((s) => s !== void 0);
}
function Nd(e) {
  const t = Ne.get(e);
  t && (Bn.get(e)?.(), Bn.delete(e), t.controls?.destroy(), t.player.destroy(), Ne.delete(e), e.removeAttribute("data-tinyfly-mounted"));
}
function hc(e) {
  const t = e.querySelector("svg");
  if (!t || t.hasAttribute("role") || t.hasAttribute("aria-hidden")) return;
  const n = e.getAttribute("data-alt"), i = e.querySelector("figcaption");
  t.setAttribute("role", "img"), n ? t.setAttribute("aria-label", n) : i && (i.id ||= `tinyfly-caption-${++sc}`, t.setAttribute("aria-labelledby", i.id));
}
function cc() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const t = () => {
    lc();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", t, { once: !0 }) : t();
}
class uc {
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
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new St(), this.adapterB = new St();
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
      const a = o.firstElementChild;
      if (a) {
        s.appendChild(a);
        const l = a.getAttribute("data-tinyfly");
        l && i.registerTarget(l, a);
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
      const a = new St();
      s.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const h = l.getAttribute("data-tinyfly");
        h && a.registerTarget(h, l);
      }), i.push({ adapter: a, timeline: se(o) });
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
    return t.timeline ? se(t.timeline) : null;
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
async function Kd(e, t, n = {}) {
  const i = new uc(e, { ...n, autoplay: !0 });
  return await i.load(t), i;
}
const Yd = { type: "none", duration: 0 };
function fc(e) {
  let t = 0;
  for (let n = 1; n < e.length; n++) t += Math.hypot(e[n].x - e[n - 1].x, e[n].y - e[n - 1].y);
  return t;
}
function le(e, t) {
  const n = Math.min(1, Math.max(0, t));
  if (e.length < 2 || n === 1) return e.slice();
  if (n === 0) return e.slice(0, 1);
  let i = fc(e) * n;
  const s = [e[0]];
  for (let r = 1; r < e.length; r++) {
    const o = e[r - 1], a = e[r], l = Math.hypot(a.x - o.x, a.y - o.y);
    if (l >= i) {
      const h = l === 0 ? 0 : i / l;
      return s.push({ x: o.x + (a.x - o.x) * h, y: o.y + (a.y - o.y) * h }), s;
    }
    s.push(a), i -= l;
  }
  return s;
}
function ui(e, t) {
  const n = le(e, t);
  return n[n.length - 1];
}
function $r(e, t) {
  return t > 0 ? Math.floor(Math.max(0, e) * t / 1e3) : 0;
}
function Dn(e, t, n) {
  const i = t.roughness ?? 2, s = Math.max(1, Math.round(t.passes ?? 2)), r = $r(n, t.boil ?? 8);
  let o = 0;
  const a = () => {
    const u = o++;
    return (p) => ei(pe(`${t.seed ?? 1}:${r}:${u}:${p}`));
  }, l = (u, p) => (u.next() * 2 - 1) * p, h = (u) => {
    const p = a(), m = e.lineWidth, d = e.globalAlpha;
    for (let g = 0; g < s; g++)
      e.lineWidth = g === 0 ? m : m * 0.55, e.globalAlpha = g === 0 ? d : d * 0.6, u(p(g));
    e.lineWidth = m, e.globalAlpha = d;
  }, c = (u, p = 1) => {
    if (u.length < 2) return;
    const m = u.slice(1).map((g, y) => Math.hypot(g.x - u[y].x, g.y - u[y].y)), d = m.reduce((g, y) => g + y, 0) * Math.min(1, Math.max(0, p));
    h((g) => {
      const y = [], b = [];
      if (u.forEach((S, v) => {
        y.push({ x: S.x + l(g, i * 0.5), y: S.y + l(g, i * 0.5) }), v > 0 && b.push([g.next() * 2 - 1, g.next() * 2 - 1]);
      }), d <= 0) return;
      e.beginPath(), e.moveTo(y[0].x, y[0].y);
      let w = 0;
      for (let S = 1; S < y.length; S++) {
        const v = dc(y[S - 1], y[S], i, b[S - 1]), k = m[S - 1];
        if (w + k <= d) {
          e.bezierCurveTo(v[1].x, v[1].y, v[2].x, v[2].y, v[3].x, v[3].y), w += k;
          continue;
        }
        const T = pc(v, k === 0 ? 1 : (d - w) / k);
        e.bezierCurveTo(T[1].x, T[1].y, T[2].x, T[2].y, T[3].x, T[3].y);
        break;
      }
      e.stroke();
    });
  }, f = (u, p, m, d, g = 1) => {
    h((y) => {
      const w = y.next() * Math.PI * 2, S = Math.PI * 2 + 0.15 + y.next() * 0.3, v = [];
      for (let T = 0; T <= 14; T++) {
        const P = w + S * T / 14, M = l(y, i * 0.6);
        v.push({ x: u + Math.cos(P) * (m + M), y: p + Math.sin(P) * (d + M) });
      }
      const k = le(v, g);
      k.length < 2 || (ps(e, k), e.stroke());
    });
  };
  return {
    line: c,
    curve(u, p = 1) {
      if (u.length < 2) return;
      const m = u[0], d = u[u.length - 1], g = Math.hypot(d.x - m.x, d.y - m.y) || 1, y = -(d.y - m.y) / g, b = (d.x - m.x) / g;
      h((w) => {
        const S = { x: l(w, i * 0.5), y: l(w, i * 0.5) }, v = { x: l(w, i * 0.5), y: l(w, i * 0.5) }, k = l(w, i * Math.min(1.5, Math.max(0.3, g / 80))), T = u.map((M, A) => {
          const x = A / (u.length - 1), E = Math.sin(Math.PI * x) * k;
          return {
            x: M.x + S.x + (v.x - S.x) * x + y * E,
            y: M.y + S.y + (v.y - S.y) * x + b * E
          };
        }), P = le(T, p);
        P.length < 2 || (ps(e, P), e.stroke());
      });
    },
    circle(u, p, m, d = 1) {
      f(u, p, m, m, d);
    },
    ellipse: f,
    nudge(u = 0.5) {
      const p = a()(0);
      return { x: l(p, i * u), y: l(p, i * u) };
    }
  };
}
function dc(e, t, n, i) {
  const s = t.x - e.x, r = t.y - e.y, o = Math.hypot(s, r) || 1, a = n * Math.min(1.5, Math.max(0.3, o / 80)), l = -r / o, h = s / o;
  return [
    e,
    { x: e.x + s / 3 + l * i[0] * a, y: e.y + r / 3 + h * i[0] * a },
    { x: e.x + 2 * s / 3 + l * i[1] * a, y: e.y + 2 * r / 3 + h * i[1] * a },
    t
  ];
}
function pc([e, t, n, i], s) {
  const r = (f, u) => ({ x: f.x + (u.x - f.x) * s, y: f.y + (u.y - f.y) * s }), o = r(e, t), a = r(t, n), l = r(n, i), h = r(o, a), c = r(a, l);
  return [e, o, h, r(h, c)];
}
function ps(e, t) {
  e.beginPath(), e.moveTo(t[0].x, t[0].y);
  for (let i = 1; i < t.length - 1; i++) {
    const s = { x: (t[i].x + t[i + 1].x) / 2, y: (t[i].y + t[i + 1].y) / 2 };
    e.quadraticCurveTo(t[i].x, t[i].y, s.x, s.y);
  }
  const n = t[t.length - 1];
  e.lineTo(n.x, n.y);
}
function Ie(e, t, n) {
  const i = e.length;
  if (i < 2) return [];
  const s = [], r = [], o = (a) => t + (n - t) * a / (i - 1);
  return e.forEach((a, l) => {
    const h = e[Math.max(0, l - 1)], c = e[Math.min(i - 1, l + 1)], f = Math.hypot(c.x - h.x, c.y - h.y) || 1, u = o(l) / 2, p = -(c.y - h.y) / f * u, m = (c.x - h.x) / f * u;
    s.push({ x: a.x + p, y: a.y + m }), r.push({ x: a.x - p, y: a.y - m });
  }), [...s, ...r.reverse()];
}
function fi(e, t, n, i) {
  const s = t.length;
  if (s < 2) return;
  const r = Ie(t, n, i), o = (a) => n + (i - n) * a / (s - 1);
  e.beginPath(), e.moveTo(r[0].x, r[0].y);
  for (const a of r.slice(1)) e.lineTo(a.x, a.y);
  e.closePath(), e.fill(), t.forEach((a, l) => {
    l !== 0 && l !== s - 1 && s > 3 || (e.beginPath(), e.arc(a.x, a.y, o(l) / 2, 0, Math.PI * 2), e.fill());
  });
}
function Wt(e, t, n, i, s = 16) {
  const r = { x: 2 * t.x - (e.x + n.x) / 2, y: 2 * t.y - (e.y + n.y) / 2 }, o = [];
  for (let a = 0; a <= s; a++) {
    const l = a / s, h = l < 0.5 ? { x: e.x + (t.x - e.x) * 2 * l, y: e.y + (t.y - e.y) * 2 * l } : { x: t.x + (n.x - t.x) * (2 * l - 1), y: t.y + (n.y - t.y) * (2 * l - 1) }, c = 1 - l, f = {
      x: c * c * e.x + 2 * c * l * r.x + l * l * n.x,
      y: c * c * e.y + 2 * c * l * r.y + l * l * n.y
    };
    o.push({ x: h.x + (f.x - h.x) * i, y: h.y + (f.y - h.y) * i });
  }
  return o;
}
function ms(e, t, n, i, s, r = 0, o = 1, a = 40) {
  const l = Math.cos(s), h = Math.sin(s);
  return Array.from({ length: a + 1 }, (c, f) => {
    const u = r + Math.PI * 2 * o * f / a, p = Math.cos(u) * n, m = Math.sin(u) * i;
    return { x: e + p * l - m * h, y: t + p * h + m * l };
  });
}
function Rr(e, t) {
  return t.look === "pencil" ? bc(e, t) : mc(e, t.ink, t.look);
}
function Ke(e, t, n = !1) {
  e.beginPath(), e.moveTo(t[0].x, t[0].y);
  for (const i of t.slice(1)) e.lineTo(i.x, i.y);
  n && e.closePath();
}
function mc(e, t, n) {
  const i = n === "silhouette", s = i ? 1.25 : 1;
  return {
    look: n,
    ink: t,
    limb(r, o, a) {
      e.fillStyle = t, fi(e, r, o * s, a * s);
    },
    line(r, o) {
      r.length < 2 || (e.strokeStyle = t, e.lineWidth = o * s, e.lineCap = "round", e.lineJoin = "round", Ke(e, r), e.stroke());
    },
    shape(r, o, a) {
      Ke(e, r, !0), (o !== null || i) && (e.fillStyle = i ? t : o, e.fill()), !(a <= 0) && (e.strokeStyle = t, e.lineWidth = a * s, e.lineJoin = "round", e.stroke());
    },
    ellipse(r, o, a, l, h, c, f) {
      e.beginPath(), e.ellipse(r, o, a, l, h, 0, Math.PI * 2), (c !== null || i) && (e.fillStyle = i ? t : c, e.fill()), !(f <= 0) && (e.strokeStyle = t, e.lineWidth = f * s, e.stroke());
    },
    dot(r, o, a) {
      e.fillStyle = t, e.beginPath(), e.arc(r, o, a * s, 0, Math.PI * 2), e.fill();
    },
    guide() {
    },
    guideEllipse() {
    }
  };
}
function gc(e, t) {
  const n = [e[0]];
  let i = 0;
  for (let o = 1; o < e.length; o++) {
    const a = e[o - 1], l = e[o], h = Math.hypot(l.x - a.x, l.y - a.y);
    let c = t - i;
    for (; c < h; ) {
      const f = c / h;
      n.push({ x: a.x + (l.x - a.x) * f, y: a.y + (l.y - a.y) * f }), c += t;
    }
    i = h - (c - t);
  }
  const s = e[e.length - 1], r = n[n.length - 1];
  return Math.hypot(s.x - r.x, s.y - r.y) > t * 0.25 ? n.push(s) : n[n.length - 1] = s, n;
}
function yc(e, t) {
  const n = e.length;
  return e.map((i, s) => {
    const r = e[Math.max(0, s - 1)], o = e[Math.min(n - 1, s + 1)], a = Math.hypot(o.x - r.x, o.y - r.y) || 1, l = t(n === 1 ? 0 : s / (n - 1));
    return { x: i.x - (o.y - r.y) / a * l, y: i.y + (o.x - r.x) / a * l };
  });
}
function gs(e) {
  const t = [0.6, 1.4, 2.9].map((i) => ({
    frequency: i * (0.8 + e.next() * 0.4),
    phase: e.next() * Math.PI * 2,
    amount: 0.5 + e.next() * 0.5
  })), n = t.reduce((i, s) => i + s.amount, 0);
  return (i) => t.reduce((s, r) => s + r.amount * Math.sin(Math.PI * 2 * r.frequency * i + r.phase), 0) / n;
}
function bc(e, t) {
  const n = t.pencil ?? {}, i = t.ink, s = n.roughness ?? Math.max(1, t.lineWidth * 0.12), r = Math.max(1, Math.round(n.passes ?? 2)), o = Math.min(1, Math.max(0, n.pressure ?? 0.25)), a = Math.min(1, Math.max(0, n.rubbedOut ?? 0.15)), l = $r(t.time, n.boil ?? 8);
  let h = 0;
  const c = (m, d, g = !1) => ei(pe(`${t.seed}:${g ? "paper" : l}:${m}:${d}`)), f = (m, d, g, y, b, w = 0) => {
    if (m.length < 2) return;
    const S = m.slice(1).reduce((x, E, _) => x + Math.hypot(E.x - m[_].x, E.y - m[_].y), 0);
    let v = gc(m, Math.max(1.5, Math.min(t.lineWidth * 0.8, S / 24)));
    if (w > 0 && v.length >= 2) {
      const [x, E] = [v[v.length - 2], v[v.length - 1]], _ = Math.hypot(E.x - x.x, E.y - x.y) || 1;
      v = [...v, { x: E.x + (E.x - x.x) / _ * w, y: E.y + (E.y - x.y) / _ * w }];
    }
    const k = gs(g), T = gs(g), P = v.length, M = [], A = [];
    v.forEach((x, E) => {
      const _ = P === 1 ? 0 : E / (P - 1), H = v[Math.max(0, E - 1)], I = v[Math.min(P - 1, E + 1)], C = Math.hypot(I.x - H.x, I.y - H.y) || 1, R = -(I.y - H.y) / C, O = (I.x - H.x) / C, L = k(_) * b, $ = Math.min(1, _ / 0.08, (1 - _) / 0.08), F = (0.55 + 0.45 * Math.sqrt(Math.max(0, $))) * (1 + o * T(_)), B = Math.max(0.3, d(_) * F / 2), j = x.x + R * L, ut = x.y + O * L;
      M.push({ x: j + R * B, y: ut + O * B }), A.push({ x: j - R * B, y: ut - O * B });
    }), e.save(), e.globalAlpha *= y, e.fillStyle = i, Ke(e, [...M, ...A.reverse()], !0), e.fill(), e.restore();
  }, u = (m, d) => {
    const g = h++, y = c(g, 99, !0);
    if (y.next() < a) {
      const v = (y.next() * 2 - 1) * t.lineWidth * 1.4, k = (y.next() * 2 - 1) * t.lineWidth * 1.4, T = m.map((P) => ({ x: P.x + v, y: P.y + k }));
      f(T, (P) => d(P) * 1.8, c(g, 98, !0), 0.035, s), f(T, (P) => d(P) * 0.45, c(g, 97, !0), 0.12, s * 1.5);
    }
    const b = m.slice(1).reduce((v, k, T) => v + Math.hypot(k.x - m[T].x, k.y - m[T].y), 0), w = d(0.5) > 4 && b > d(0.5) * 6, S = w ? [-0.3, 0.3, 0] : [0];
    for (let v = 0; v < r; v++) {
      const k = v === 0;
      S.forEach((T, P) => {
        const M = c(g, v * 10 + P), A = T === 0 ? m : yc(m, (E) => d(E) * T * Math.sqrt(Math.sin(Math.PI * E))), x = !k && T === 0 ? t.lineWidth * (0.3 + M.next() * 0.8) : 0;
        f(A, (E) => d(E) * (w ? 0.5 : 1) * (k ? 1 : 0.6), M, k ? 0.85 : 0.45, s * (k ? 0.6 : 1), x);
      });
    }
  }, p = (m, d, g, y, b, w) => {
    const v = c(h, 50).next() * Math.PI * 2;
    u(ms(m, d, g, y, b, v, 1.08, 48), () => w);
  };
  return {
    look: "pencil",
    ink: i,
    limb(m, d, g) {
      u(m, (y) => d + (g - d) * y);
    },
    line(m, d) {
      u(m, () => d);
    },
    shape(m, d, g) {
      d !== null && (e.save(), e.globalAlpha *= 0.88, e.fillStyle = d, Ke(e, m, !0), e.fill(), e.restore()), g > 0 && u([...m, m[0]], () => g);
    },
    ellipse(m, d, g, y, b, w, S) {
      w !== null && (e.save(), e.globalAlpha *= 0.9, e.fillStyle = w, e.beginPath(), e.ellipse(m, d, g, y, b, 0, Math.PI * 2), e.fill(), e.restore()), p(m, d, g, y, b, S);
    },
    dot(m, d, g) {
      e.save(), e.globalAlpha *= 0.9, e.fillStyle = i, e.beginPath(), e.arc(m, d, g, 0, Math.PI * 2), e.fill(), e.restore();
    },
    guide(m) {
      if (n.construction === !1 || m.length < 2) return;
      const d = h++;
      f(m, () => Math.max(0.6, t.lineWidth * 0.18), c(d, 0), 0.28, s * 1.2, t.lineWidth);
    },
    guideEllipse(m, d, g, y, b) {
      if (n.construction === !1) return;
      const w = h++, S = c(w, 0), v = ms(m, d, g, y, b, S.next() * Math.PI * 2, 1.12, 48);
      f(v, () => Math.max(0.6, t.lineWidth * 0.18), S, 0.28, s * 1.5);
    }
  };
}
const wc = ["thumb", "index", "middle", "ring", "pinky"], W = {
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
function D(e = {}) {
  return { ...W, ...e };
}
const G = (e, t, n, i, s) => ({
  "thumb.curl": e,
  "index.curl": t,
  "middle.curl": n,
  "ring.curl": i,
  "pinky.curl": s
}), Y = {
  relaxed: W,
  open: D({ ...G(0, 0, 0, 0, 0), "thumb.across": 0, spread: 0.55 }),
  spread: D({ ...G(0, 0, 0, 0, 0), "thumb.across": 0, spread: 1 }),
  flat: D({ ...G(0, 0, 0, 0, 0), "thumb.across": 0.35, spread: 0 }),
  fist: D({ ...G(0.7, 1, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  point: D({ ...G(0.75, 0, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  /** The fist on its side, knuckles toward the viewer, the thumb up */
  thumbsUp: D({ ...G(0, 1, 1, 1, 1), "thumb.across": 0, spread: 0, roll: 70 }),
  peace: D({ ...G(0.75, 0, 0, 1, 1), "thumb.across": 0.9, spread: 1 }),
  ok: D({ ...G(0.12, 0.6, 0.1, 0.15, 0.2), "thumb.across": 0.55, spread: 0.6 }),
  pinch: D({ ...G(0.1, 0.65, 0.75, 0.85, 0.9), "thumb.across": 0.55, spread: 0 }),
  cupped: D({ ...G(0.25, 0.4, 0.4, 0.4, 0.4), "thumb.across": 0.4, spread: 0.05, turn: 2 }),
  wave: D({ ...G(0, 0.05, 0.05, 0.1, 0.12), "thumb.across": 0, spread: 0.7, turn: 2 }),
  /** Holding a pencil to write: thumb and middle finger pinch it, the index finger rests on top */
  pencilGrip: D({ ...G(0.1, 0.6, 0.72, 0.88, 0.95), "thumb.across": 0.5, spread: 0, turn: 0.8, bend: 10 }),
  /** Holding a handle, a cup or a bar: every finger wrapped round it */
  hold: D({ ...G(0.5, 0.7, 0.72, 0.74, 0.76), "thumb.across": 0.75, spread: 0, turn: 1 })
};
function he(e, t, n) {
  const i = { ...e };
  for (const [s, r] of Object.entries(t)) {
    const o = e[s] ?? r;
    i[s] = o + (r - o) * n;
  }
  return i;
}
const vc = {
  index: { knuckle: [-0.16, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.125, fan: -1 },
  middle: { knuckle: [-0.055, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.13, fan: -0.2 },
  ring: { knuckle: [0.05, 0.475, -0.02], bones: [0.2, 0.125, 0.1], width: 0.122, fan: 0.55 },
  pinky: { knuckle: [0.15, 0.43, -0.02], bones: [0.16, 0.1, 0.085], width: 0.108, fan: 1.25 }
}, kc = {
  index: { knuckle: [-0.14, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.15, fan: -1 },
  middle: { knuckle: [0, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.155, fan: 0 },
  pinky: { knuckle: [0.14, 0.45, -0.02], bones: [0.19, 0.115, 0.095], width: 0.145, fan: 1 }
}, at = {
  base: [-0.11, 0.1, -0.05],
  bones: [0.2, 0.15, 0.12],
  widths: [0.2, 0.145, 0.135],
  /** Where the thumb points with `across` 0 and 1 */
  out: [-0.7, 0.68, -0.22],
  across: [0.35, 0.5, -0.8]
}, Sc = [82, 100, 62], Mc = [48, 72], Tc = 3, xc = 13, Ec = 0.035, Ac = -0.075, Pc = [
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
], mt = (e) => e * Math.PI / 180, Wn = (e, t) => [e[0] + t[0], e[1] + t[1], e[2] + t[2]], Ce = (e, t) => [e[0] * t, e[1] * t, e[2] * t], Nn = (e, t) => [e[1] * t[2] - e[2] * t[1], e[2] * t[0] - e[0] * t[2], e[0] * t[1] - e[1] * t[0]], zt = (e) => {
  const t = Math.hypot(e[0], e[1], e[2]) || 1;
  return [e[0] / t, e[1] / t, e[2] / t];
};
function Mt(e, t, n) {
  const i = Math.cos(n), s = Math.sin(n), r = Nn(t, e), o = t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
  return [
    e[0] * i + r[0] * s + t[0] * o * (1 - i),
    e[1] * i + r[1] * s + t[1] * o * (1 - i),
    e[2] * i + r[2] * s + t[2] * o * (1 - i)
  ];
}
const ys = [1, 0, 0], bs = [0, 1, 0], ne = [0, 0, 1];
function _c(e, t, n) {
  const i = mt(e.fan * (Tc + xc * n)), s = [Math.sin(i), Math.cos(i), 0], r = [Math.cos(i), -Math.sin(i), 0], o = [e.knuckle];
  let a = 0;
  e.bones.forEach((c, f) => {
    a += mt(Sc[f] * t), o.push(Wn(o[f], Ce(Mt(s, r, -a), c)));
  });
  const l = Mt(ne, r, -a), h = o.map((c, f) => e.width * (1 - 0.14 * (f / (o.length - 1))));
  return { joints: o, back: l, widths: h };
}
function Hc(e, t, n = 1, i = 1) {
  const s = Math.min(1, Math.max(0, t)), r = zt(Wn(Ce(zt(at.out), 1 - s), Ce(zt(at.across), s))), o = zt(Nn(ne, r)), a = zt(Nn(r, o)), l = [[at.base[0] * i, at.base[1], at.base[2]]];
  let h = 0;
  at.bones.forEach((u, p) => {
    p > 0 && (h += mt(Mc[p - 1] * e)), l.push(Wn(l[p], Ce(Mt(r, o, h), u)));
  });
  const c = Mt(a, o, h), f = [...at.widths, at.widths[at.widths.length - 1] * 0.92].map((u) => u * n);
  return { joints: l, back: c, widths: f };
}
function Kn(e, t = {}) {
  const n = { ...W, ...e }, i = t.size ?? 100, s = t.side ?? "right", r = s === "left" ? -1 : 1, o = mt(t.angle ?? 0), a = t.fingers === 4, l = Math.max(0.5, t.plump ?? 1), h = 1 + (l - 1) * 0.7, c = (E) => ({
    ...E,
    knuckle: [E.knuckle[0] * h, E.knuckle[1], E.knuckle[2]],
    width: E.width * l
  }), f = mt(n.bend ?? 0), u = mt(n.tilt ?? 0), p = mt(90 * (n.turn ?? 0)), m = (E) => Mt(Mt(Mt(E, ys, -f), ne, -u), bs, p), d = Math.cos(o), g = Math.sin(o), y = mt(n.roll ?? 0), b = Math.cos(y), w = Math.sin(y), S = (E) => {
    const _ = E[0] * i, H = -E[1] * i, I = (_ * b - H * w) * r, C = _ * w + H * b;
    return { x: I * d - C * g, y: I * g + C * d };
  }, v = (E) => {
    const _ = S(E), H = Math.hypot(_.x, _.y);
    return H > 1e-6 * i ? { x: _.x / H, y: _.y / H } : { x: 0, y: 0 };
  }, k = {
    thumb: Hc(n["thumb.curl"] ?? 0, n["thumb.across"] ?? 0, l, h)
  }, T = a ? kc : vc;
  for (const E of wc) {
    const _ = T[E];
    _ && (k[E] = _c(c(_), n[`${E}.curl`] ?? 0, n.spread ?? 0));
  }
  const P = {};
  for (const [E, _] of Object.entries(k)) {
    const H = _.joints.map(m), I = m(_.back);
    P[E] = {
      points: H.map(S),
      depths: H.map((C) => C[2] * i),
      widths: _.widths.map((C) => C * i),
      nail: I[2],
      back: v(I)
    };
  }
  const M = Pc.flatMap(([E, _]) => [m([E * h, _, Ec]), m([E * h, _, Ac])]), A = Cc(M.map(S)), x = M.reduce((E, _) => E + _[2], 0) / M.length * i;
  return {
    size: i,
    side: s,
    wrist: { x: 0, y: 0 },
    palm: A,
    palmDepth: x,
    palmFacing: -m(ne)[2],
    fingers: P,
    axes: { up: v(m(bs)), across: v(m(ys)), out: v(m(ne)) },
    curls: Object.fromEntries(Object.keys(P).map((E) => [E, n[`${E}.curl`] ?? 0]))
  };
}
function Ic(e, t) {
  const n = (s) => ({ x: s.x + t.x - e.wrist.x, y: s.y + t.y - e.wrist.y }), i = {};
  for (const [s, r] of Object.entries(e.fingers))
    i[s] = { ...r, points: r.points.map(n) };
  return { ...e, wrist: n(e.wrist), palm: e.palm.map(n), fingers: i };
}
function Cc(e) {
  const t = [...e].sort((r, o) => r.x - o.x || r.y - o.y);
  if (t.length < 3) return t;
  const n = (r, o, a) => (o.x - r.x) * (a.y - r.y) - (o.y - r.y) * (a.x - r.x), i = [];
  for (const r of t) {
    for (; i.length >= 2 && n(i[i.length - 2], i[i.length - 1], r) <= 0; ) i.pop();
    i.push(r);
  }
  const s = [];
  for (const r of [...t].reverse()) {
    for (; s.length >= 2 && n(s[s.length - 2], s[s.length - 1], r) <= 0; ) s.pop();
    s.push(r);
  }
  return [...i.slice(0, -1), ...s.slice(0, -1)];
}
const $c = "#f1c9a5", Rc = "#2f2f33";
function di(e, t, n, i = {}, s = 0) {
  const r = Ic(Kn(n, i), t), o = i.ink ?? Rc, a = i.lineWidth ?? r.size * 0.035, l = i.pen ?? Rr(e, {
    look: i.look ?? "clean",
    ink: o,
    lineWidth: a,
    seed: i.seed ?? 1,
    time: s,
    pencil: { construction: !1, ...i.pencil }
  }), h = i.skin ?? $c, c = i.nails ?? !0, f = [
    {
      depth: r.palmDepth,
      draw: () => Lc(l, r, h, a)
    }
  ];
  for (const u of Object.values(r.fingers)) {
    const p = u.depths.reduce((m, d) => m + d, 0) / u.depths.length;
    f.push({
      depth: p,
      draw: () => Oc(e, l, u, h, a, c)
    });
  }
  if (i.prop) {
    const u = i.prop;
    f.push({ depth: u.depth, draw: () => u.draw(l) });
  }
  e.save(), e.lineCap = "round", e.lineJoin = "round";
  for (const u of [...f].sort((p, m) => p.depth - m.depth)) u.draw();
  return e.restore(), r;
}
function Lc(e, t, n, i) {
  if (e.shape(t.palm, n, i), t.palmFacing < -0.3 && e.look !== "silhouette") {
    const { up: s } = t.axes;
    for (const [r, o] of Object.entries(t.fingers)) {
      const a = t.curls[r] ?? 0;
      if (r === "thumb" || a < 0.5) continue;
      const l = o.points[0], h = o.widths[0] * 0.42, c = { x: l.x - s.x * h * 0.2, y: l.y - s.y * h * 0.2 }, f = Math.atan2(s.y, s.x), u = Array.from({ length: 7 }, (p, m) => {
        const d = f - Math.PI / 2 + Math.PI * m / 6;
        return { x: c.x + Math.cos(d) * h, y: c.y + Math.sin(d) * h };
      });
      e.line(u, i * 0.6);
    }
  }
  if (t.palmFacing > 0.45 && e.look !== "silhouette") {
    const { up: s, across: r } = t.axes, o = t.size, a = t.wrist, l = (c, f) => ({
      x: a.x + (r.x * c + s.x * f) * o,
      y: a.y + (r.y * c + s.y * f) * o
    }), h = t.side === "left" ? -1 : 1;
    e.line([l(-0.15 * h, 0.36), l(-0.04 * h, 0.3), l(0.1 * h, 0.33)], i * 0.5);
  }
}
function Oc(e, t, n, i, s, r) {
  const { widths: o } = n, a = Fc(n.points, 2), l = n.points[0], h = a[a.length - 1], c = o[0], f = o[o.length - 1];
  if (e.save(), t.look !== "silhouette") {
    e.beginPath(), e.rect(l.x - 1e5, l.y - 1e5, 2e5, 2e5);
    const d = c / 2 + s * 1.6;
    e.moveTo(l.x + d, l.y), e.arc(l.x, l.y, d, 0, Math.PI * 2), e.clip("evenodd");
  }
  if (t.limb(a, c + 2 * s, f + 2 * s), e.restore(), t.look !== "silhouette" && (e.fillStyle = i, fi(e, a, c, f)), t.look === "silhouette" || !r || n.nail < 0.25) return;
  const u = a[a.length - 2], p = Bc({ x: h.x - u.x, y: h.y - u.y }) ?? {
    x: 0,
    y: -1
  }, m = {
    x: h.x - p.x * f * 0.22 + n.back.x * f * 0.1,
    y: h.y - p.y * f * 0.22 + n.back.y * f * 0.1
  };
  t.ellipse(m.x, m.y, f * 0.24 * Math.max(0.35, n.nail), f * 0.19, Math.atan2(p.y, p.x), "#f8e3d3", s * 0.45);
}
function Fc(e, t) {
  let n = e;
  for (let i = 0; i < t; i++) {
    if (n.length < 3) return n;
    const s = [n[0]];
    for (let r = 0; r < n.length - 1; r++) {
      const o = n[r], a = n[r + 1];
      r > 0 && s.push({ x: o.x * 0.75 + a.x * 0.25, y: o.y * 0.75 + a.y * 0.25 }), r < n.length - 2 && s.push({ x: o.x * 0.25 + a.x * 0.75, y: o.y * 0.25 + a.y * 0.75 });
    }
    s.push(n[n.length - 1]), n = s;
  }
  return n;
}
const Bc = (e) => {
  const t = Math.hypot(e.x, e.y);
  return t > 1e-6 ? { x: e.x / t, y: e.y / t } : null;
}, q = {
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
function U(e) {
  return { ...q, ...e };
}
const Lr = {
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
}, K = (e) => ({ ...Lr, ...e }), X = {
  neutral: Lr,
  happy: K({ smile: 0.9, leftBrow: 0.2, rightBrow: 0.2 }),
  joyful: K({ mouth: 0.6, smile: 1, mouthWidth: 1.2, leftEye: 0, rightEye: 0, leftBrow: 0.4, rightBrow: 0.4 }),
  sad: K({ smile: -0.8, leftEye: 0.8, rightEye: 0.8, browTilt: 0.9, leftBrow: -0.1, rightBrow: -0.1, lookY: 0.6 }),
  crying: K({ mouth: 0.45, smile: -1, leftEye: 0, rightEye: 0, browTilt: 1, lookY: 0.4 }),
  surprised: K({ mouth: 0.7, mouthWidth: 0.7, leftEye: 1.5, rightEye: 1.5, leftBrow: 1, rightBrow: 1 }),
  shocked: K({ mouth: 1, mouthWidth: 0.8, leftEye: 1.6, rightEye: 1.6, leftBrow: 1, rightBrow: 1, browTilt: 0.4 }),
  angry: K({ smile: -0.6, mouthWidth: 0.9, leftEye: 0.8, rightEye: 0.8, leftBrow: -0.6, rightBrow: -0.6, browTilt: -1 }),
  furious: K({ mouth: 0.5, smile: -1, mouthWidth: 1.3, leftEye: 0.9, rightEye: 0.9, leftBrow: -0.9, rightBrow: -0.9, browTilt: -1 }),
  worried: K({ smile: -0.3, mouthWidth: 0.8, leftEye: 1.1, rightEye: 1.1, leftBrow: 0.3, rightBrow: 0.3, browTilt: 0.8, lookX: -0.5 }),
  scared: K({ mouth: 0.35, smile: -0.5, mouthWidth: 0.8, leftEye: 1.45, rightEye: 1.45, leftBrow: 0.8, rightBrow: 0.8, browTilt: 0.9 }),
  confused: K({ smile: -0.2, mouthWidth: 0.8, leftEye: 0.9, rightEye: 1.15, leftBrow: -0.3, rightBrow: 0.8, lookX: 0.5, lookY: -0.4 }),
  skeptical: K({ smile: -0.1, leftEye: 0.6, rightEye: 1, leftBrow: -0.4, rightBrow: 0.7, lookX: 0.4 }),
  thinking: K({ smile: 0, mouthWidth: 0.7, leftBrow: 0.3, rightBrow: 0.5, lookX: 0.6, lookY: -0.8 }),
  sleepy: K({ smile: 0.1, leftEye: 0.25, rightEye: 0.25, leftBrow: -0.3, rightBrow: -0.3, lookY: 0.5 }),
  disgusted: K({ smile: -0.7, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.75, leftBrow: -0.5, rightBrow: -0.2, browTilt: -0.4, lookX: -0.6 }),
  smug: K({ smile: 0.6, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.6, leftBrow: 0.1, rightBrow: 0.5, lookX: 0.5 }),
  wink: K({ smile: 0.9, leftEye: 0, rightEye: 1, leftBrow: -0.2, rightBrow: 0.3 })
};
function Or(e, t) {
  return { ...e, ...typeof t == "string" ? X[t] : t };
}
const pi = {
  rest: q,
  wave: U({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...X.happy }),
  cheer: U({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...X.joyful }),
  shrug: U({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...X.confused, lookX: 0, lookY: 0 }),
  point: U({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: U({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...X.thinking }),
  handsOnHips: U({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: U({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...X.sad }),
  surprised: U({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...X.surprised }),
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: U({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  // Seated, hands resting on the knees. Arm angles spread outward per side, so
  // reaching forward (+x, the way the figure faces) is negative for the left arm.
  sit: U({ sit: 1, turn: 0.5, leftShoulder: -25, rightShoulder: 25, leftElbow: -55, rightElbow: 55 }),
  jump: U({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...X.joyful }),
  // Full splits: legs flat along the floor, so the planted feet bring the hips right down to it.
  // Side (straddle) split, seen front-on: each leg straight out to its side, toes pointed.
  sideSplit: U({ leftHip: 90, rightHip: 90, leftAnkle: -45, rightAnkle: -45, leftShoulder: 120, rightShoulder: 120, leftElbow: 10, rightElbow: 10, ...X.happy }),
  // Front split, in profile: the left leg forward (+x), the right leg back.
  frontSplit: U({ turn: 1, leftHip: -90, rightHip: -90, leftAnkle: -45, rightAnkle: -45, leftShoulder: -150, rightShoulder: 150, leftElbow: 10, rightElbow: -10, ...X.happy })
}, Fr = Object.keys(q);
function ce(e, t, n) {
  const i = { ...e };
  for (const s of Fr) i[s] = e[s] + (t[s] - e[s]) * n;
  return i;
}
const Yn = 24, ws = 4, vs = 28, Dc = 40;
function Wc(e, t = q, n = 1) {
  const i = Math.sin(e * Math.PI * 2) * n, s = Math.cos(e * Math.PI * 2) * n, r = (h) => h <= Dc, o = (h) => r(h) ? 22 * i : h, a = r(t.leftShoulder) ? t.leftElbow - vs * Math.max(0, -i) : t.leftElbow, l = r(t.rightShoulder) ? t.rightElbow + vs * Math.max(0, i) : t.rightElbow;
  return {
    ...t,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: t.lean + ws * n,
    headTilt: t.headTilt - ws * 0.5 * n,
    leftElbow: a,
    rightElbow: l,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -Yn * i,
    rightHip: -Yn * i,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, s),
    rightKnee: 30 * Math.max(0, -s),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: o(t.leftShoulder),
    rightShoulder: o(t.rightShoulder)
  };
}
function qd(e, t = 1) {
  return 4 * ((qn + Ye) * e) * Math.sin(Yn * t * Math.PI / 180);
}
function Nc(e) {
  const t = Math.abs(Math.sin(e / 65)), n = 0.55 + 0.45 * Math.sin(e / 310);
  return t * n;
}
const Br = 0.12, ks = 0.46, Kc = 1 - 2 * Br, Yc = 0.1, qc = 0.21, Xc = 0.19, qn = 0.24, Ye = 0.22, Dr = 0.12, Vc = 0.14, Wr = 0.33, Ss = 0.7, Ms = 0.3, Uc = 0.35, zc = [1.7, 1.05], jc = [1.3, 0.75], Ts = [1.45, 0.85], Gc = [1.15, 0.75], xs = 0.06, Jc = 0.7, Zc = 0.65, Nr = 0.075, Qc = 0.3, tu = 0.02, eu = 0.012, nu = 12, iu = 0.25, ve = 90, su = 0.25, ru = 0.04, Kr = 0.01, vt = (e) => Math.min(1, Math.max(0, e ?? 0));
function Xd(e, t = 1) {
  return Ye * e * t;
}
const Xn = -0.12, Yr = 0.4, it = (e) => e * Math.PI / 180, ou = (e, t) => ({ x: t * Math.sin(it(e)), y: Math.cos(it(e)) }), qr = (e, t) => Math.max(0, e) * (1 - Math.min(1, Math.max(0, t))), Xr = (e, t, n, i) => e - 0.3 * t - n * 0.14 * t - Math.max(0, i - 1) * 0.12 * t;
function au(e, t, n, i, s, r) {
  const o = Math.max(1, Math.min(r * 0.6, Vc * n)), a = vt(t.turn), l = (Dr + Wr * a) * n, h = i + Xn * n, c = l + t.lookX * 0.08 * n, f = t.lookY * 0.07 * n, u = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * n * (1 - Ss * a), squeeze: 1 - Ss * a, open: t.leftEye, brow: t.leftBrow, side: -1 },
    { x: 0.34 * n * (1 - Ms * a), squeeze: 1 - Ms * a, open: t.rightEye, brow: t.rightBrow, side: 1 }
  ];
  e.fillStyle = s, e.strokeStyle = s, e.lineWidth = o;
  for (const y of u) {
    const b = qr(y.open, t.blink);
    if (b < 0.2) {
      const k = t.smile > 0.5 ? -0.12 * n : 0.06 * n;
      e.beginPath(), e.moveTo(y.x + l - 0.12 * n, h), e.quadraticCurveTo(y.x + l, h + k, y.x + l + 0.12 * n, h), e.stroke();
    } else {
      if (b > 1.2) {
        const T = 0.13 * n * b;
        e.beginPath(), e.ellipse(y.x + l, h, T * 0.85, T, 0, 0, Math.PI * 2), e.fillStyle = "#ffffff", e.fill(), e.stroke(), e.fillStyle = s;
      }
      const k = b > 1.2 ? 0.075 * n : 0.1 * n;
      e.beginPath(), e.ellipse(y.x + c, h + f, k, k * 1.1 * Math.min(b, 1), 0, 0, Math.PI * 2), e.fill();
    }
    const w = Xr(h, n, y.brow, b), S = y.x + l - y.side * 0.13 * n * y.squeeze, v = y.x + l + y.side * 0.13 * n * y.squeeze;
    e.beginPath(), e.moveTo(v, w), e.lineTo(S, w - t.browTilt * 0.1 * n), e.stroke();
  }
  const p = i + Yr * n, m = 0.25 * n * Math.max(0.3, t.mouthWidth) * (1 - Uc * a), d = Math.min(1, Math.max(0, t.mouth));
  if (e.beginPath(), d <= 0.05) {
    e.moveTo(l - m, p), e.quadraticCurveTo(l, p + t.smile * 0.25 * n, l + m, p), e.stroke();
    return;
  }
  const g = 0.3 * n * d;
  t.smile > 0.3 ? (e.moveTo(l - m, p - 0.05 * n), e.lineTo(l + m, p - 0.05 * n), e.quadraticCurveTo(l, p + g * 2, l - m, p - 0.05 * n)) : t.smile < -0.3 ? (e.moveTo(l - m, p + g * 0.6), e.lineTo(l + m, p + g * 0.6), e.quadraticCurveTo(l, p - g * 1.4, l - m, p + g * 0.6)) : e.ellipse(l, p, m * 0.8, g, 0, 0, Math.PI * 2), e.fill();
}
function Vr(e, t) {
  const n = t.height ?? 300, i = Math.min(3, Math.max(0.3, e.stretch ?? 1)), s = Math.sqrt(i), r = (t.headSize ?? 2 * Br) / 2, o = t.headSize === void 0 ? Kc : 1 - 2 * r, a = r * n, l = vt(e.sit), h = e.leftHip + (-ve - e.leftHip) * l, c = e.leftKnee + (-ve - e.leftKnee) * l, f = e.rightHip + (ve - e.rightHip) * l, u = e.rightKnee + (ve - e.rightKnee) * l, p = t.classic === !0, m = vt(e.turn), d = (C, R, O, L, $) => {
    const F = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.abs(it(R - O) / 2) + it(L))), B = Math.max(-1, Math.min(1, Jc + $)), j = m + (1 - m) * C * B;
    return p ? { x: 0, y: 0 } : { x: Math.cos(F) * xs * j, y: Math.sin(F) * xs };
  }, g = { left: e.leftAnkle ?? 0, right: e.rightAnkle ?? 0 }, y = { left: e.leftFootOut ?? 0, right: e.rightFootOut ?? 0 };
  let b = 0;
  if (l > 0 || !p) {
    const C = ($, F, B, j, ut) => qn * Math.cos(it(F)) + Ye * Math.cos(it(F - B)) + Math.max(0, d($, F, B, j, ut).y), R = Math.max(
      C(-1, h, c, g.left, y.left),
      C(1, f, u, g.right, y.right)
    ), O = 1 - vt((e.rise ?? 0) / ru), L = (p ? Math.min(1, l / su) : 1) * O;
    b = (ks - R) * L * n * i;
  }
  const w = -ks * n * i + b, S = -o * n * i + b, v = p ? 0 : (tu * vt(e.turn) + eu * l) * n * i, k = v === 0 ? [{ x: 0, y: w }, { x: 0, y: S }] : Wt({ x: 0, y: w }, { x: -v, y: (w + S) / 2 }, { x: 0, y: S }, 1, 8), T = S + Yc * n * i, P = (t.shoulderWidth ?? 0) * n * Math.cos(m * Math.PI / 2), M = (C, R, O, L, $) => {
    const F = ou(O, L);
    return { x: C + F.x * $ * n, y: R + F.y * $ * n };
  }, A = (C, R, O) => {
    const L = M(0, w, R, C, qn * i);
    return { root: { x: 0, y: w }, joint: L, end: M(L.x, L.y, R - O, C, Ye * i) };
  }, x = (C, R, O) => {
    const L = { x: C * P, y: T }, $ = M(L.x, L.y, R, C, qc * s);
    return { root: L, joint: $, end: M($.x, $.y, R + O, C, Xc * s) };
  }, E = { left: A(-1, h, c), right: A(1, f, u) }, _ = (C, R, O, L, $, F) => {
    const B = d(C, O, L, $, F);
    return { x: R.end.x + B.x * n * i, y: R.end.y + B.y * n * i };
  }, H = (C, R, O, L, $) => M(R.end.x, R.end.y, O + L + $, C, Nr * s), I = {
    left: x(-1, e.leftShoulder, e.leftElbow),
    right: x(1, e.rightShoulder, e.rightElbow)
  };
  return {
    height: n,
    facing: (t.facing ?? 1) < 0 ? -1 : 1,
    stretch: i,
    lineWidth: t.lineWidth ?? n * 0.025,
    rubber: Math.min(1, Math.max(p ? 0 : Qc, t.rubber ?? 0)),
    r: a,
    // The head keeps its area: taller and narrower when stretched.
    headRx: a / Math.sqrt(i),
    headRy: a * Math.sqrt(i),
    hipY: w,
    neckY: S,
    drop: b,
    lean: p ? e.lean : e.lean + nu * Math.sin(Math.PI * l),
    classic: p,
    legs: E,
    toes: {
      left: _(-1, E.left, h, c, g.left, y.left),
      right: _(1, E.right, f, u, g.right, y.right)
    },
    spine: k,
    arms: I,
    handTips: {
      left: H(-1, I.left, e.leftShoulder, e.leftElbow, e.leftWrist ?? 0),
      right: H(1, I.right, e.rightShoulder, e.rightElbow, e.rightWrist ?? 0)
    }
  };
}
const Zt = (e, t) => t === 0 ? [e.root, e.joint, e.end] : Wt(e.root, e.joint, e.end, t);
function qe(e, t, n) {
  const i = Math.cos(n), s = Math.sin(n), r = e.x - t.x, o = e.y - t.y;
  return { x: t.x + r * i - o * s, y: t.y + r * s + o * i };
}
function Ur(e, t, n = !0) {
  const i = hu(e, t), s = t.spin ?? 0, r = t.rise ?? 0;
  return n && (s !== 0 || r !== 0) ? lu(i, e, s, r) : i;
}
function zr(e, t, n) {
  return { pivot: { x: 0, y: e.hipY }, angle: e.facing * it(t), lift: n * e.height };
}
function lu(e, t, n, i) {
  const { pivot: s, angle: r, lift: o } = zr(t, n, i), a = (u) => {
    const p = qe(u, s, r);
    return { x: p.x, y: p.y - o };
  }, l = (u) => ({ left: a(u.left), right: a(u.right) }), h = { left: Math.max(a(e.feet.left).y, a(e.toes.left).y), right: Math.max(a(e.feet.right).y, a(e.toes.right).y) }, c = Math.max(h.left, h.right), f = Kr * t.height;
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
    feetY: c,
    grounded: { left: h.left >= c - f, right: h.right >= c - f },
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
function hu(e, t) {
  const n = it(e.lean), i = it(t.headTilt), s = { x: 0, y: e.hipY }, r = (w) => ({ x: e.facing * w.x, y: w.y }), o = (w) => r(qe(w, s, n)), a = (w) => o(qe({ x: w.x, y: w.y + e.neckY }, { x: 0, y: e.neckY }, i)), l = Zt(e.arms.left, e.rubber).map(o), h = Zt(e.arms.right, e.rubber).map(o), c = (w, S) => Math.atan2(S.y - w.y, S.x - w.x), f = { left: o(e.handTips.left), right: o(e.handTips.right) }, u = (w, S) => {
    const [v, k] = w.slice(-2), T = e.arms[S], P = c(o(T.end), f[S]) - c(o(T.joint), o(T.end));
    return c(v, k) + P;
  };
  let p = 1 / 0;
  for (const [w, S] of [
    [t.leftBrow, t.leftEye],
    [t.rightBrow, t.rightEye]
  ]) {
    const v = Xr(Xn, 1, w, qr(S, t.blink));
    p = Math.min(p, v, v - t.browTilt * 0.1);
  }
  const m = { left: r(e.legs.left.end), right: r(e.legs.right.end) }, d = { left: r(e.toes.left), right: r(e.toes.right) }, g = { left: Math.max(m.left.y, d.left.y), right: Math.max(m.right.y, d.right.y) }, y = Math.max(g.left, g.right), b = Kr * e.height;
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
    feet: m,
    toes: d,
    feetY: y,
    grounded: { left: g.left >= y - b, right: g.right >= y - b },
    fingertips: f,
    handAngle: { left: u(l, "left"), right: u(h, "right") },
    limbs: {
      leftArm: l,
      rightArm: h,
      leftLeg: Zt(e.legs.left, e.rubber).map(r),
      rightLeg: Zt(e.legs.right, e.rubber).map(r),
      spine: e.spine.map(o)
    },
    head: {
      center: a({ x: 0, y: -e.headRy }),
      rx: e.headRx,
      ry: e.headRy,
      // Mirroring a turn reverses it.
      angle: e.facing * (n + i),
      eyeY: Xn,
      browTopY: p,
      mouthY: Yr,
      faceX: e.facing * (Dr + Wr * vt(t.turn))
    }
  };
}
function cu(e, t = {}) {
  return Ur(Vr(e, t), e);
}
function Vd(e, t, n) {
  return qe({ x: e.center.x + t * e.rx, y: e.center.y + n * e.ry }, e.center, e.angle);
}
function uu(e, t, n) {
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
function fu(e, t, n = {}, i = 0) {
  const s = Vr(t, n), r = n.color ?? "#1e293b", o = n.layers ?? {}, a = n.layers ? Ur(s, t, !1) : void 0, l = n.sketch ? Dn(e, n.sketch, i) : void 0, h = n.sketch && n.layers ? Dn(e, n.sketch, i) : void 0, c = (k) => {
    e.save(), k(), e.restore();
  }, f = (k) => {
    k && a && c(() => k(e, a, i, h));
  }, u = () => e.scale(s.facing, 1), p = () => {
    u(), e.translate(0, s.hipY), e.rotate(it(s.lean)), e.translate(0, -s.hipY);
  }, m = (k, T, P) => {
    if (l) return T ? l.curve(k) : l.line(k);
    if (s.classic) {
      e.beginPath(), e.moveTo(k[0].x, k[0].y);
      for (const M of k.slice(1)) e.lineTo(M.x, M.y);
      e.stroke();
      return;
    }
    fi(e, k, P[0] * s.lineWidth, P[1] * s.lineWidth);
  }, d = (k, T) => m(Zt(k, s.rubber), s.rubber > 0, T), g = (k) => {
    s.classic || m([s.legs[k].end, s.toes[k]], !1, Gc);
  }, y = (k) => {
    if (n.hands && !s.classic) return w(k);
    if (s.classic || l) return;
    const T = s.arms[k].end;
    e.beginPath(), e.arc(T.x, T.y, Zc * s.lineWidth, 0, Math.PI * 2), e.fill();
  };
  e.save(), e.strokeStyle = r, e.fillStyle = r, e.lineWidth = s.lineWidth, e.lineCap = "round", e.lineJoin = "round";
  const b = zr(s, t.spin ?? 0, t.rise ?? 0);
  (b.angle !== 0 || b.lift !== 0) && (e.translate(0, -b.lift), e.translate(b.pivot.x, b.pivot.y), e.rotate(b.angle), e.translate(-b.pivot.x, -b.pivot.y));
  function w(k) {
    const T = n.hands ?? {}, P = s.arms[k].end, M = s.handTips[k], A = n.headFill ?? "#ffffff";
    di(e, P, T[k] ?? W, {
      side: k,
      // Degrees clockwise from straight up, in the frame the hand is drawn in.
      angle: Math.atan2(M.x - P.x, P.y - M.y) * 180 / Math.PI,
      size: (T.size ?? Nr) * s.height * Math.sqrt(s.stretch),
      skin: T.skin ?? (A === "none" ? void 0 : A),
      ink: r,
      lineWidth: s.lineWidth * 0.45,
      fingers: T.fingers,
      plump: T.plump,
      look: n.sketch ? "pencil" : "clean",
      seed: n.sketch?.seed
    }, i);
  }
  const S = (k) => {
    c(() => {
      p(), d(s.arms[k], jc), y(k);
    });
    const T = o.sleeve;
    T && a && c(() => T(e, a, k, i, h));
  }, v = vt(t.turn) > iu;
  f(o.behind), c(() => {
    u(), d(s.legs.left, Ts), g("left"), d(s.legs.right, Ts), g("right");
  }), v && S("left"), c(() => {
    p(), m(s.spine, s.spine.length > 2, zc);
    const { left: k, right: T } = { left: s.arms.left.root, right: s.arms.right.root };
    if (k.x !== T.x)
      if (s.classic) m([k, T], !1, [1, 1]);
      else {
        const P = { x: (k.x + T.x) / 2, y: k.y - 0.3 * Math.abs(T.x - k.x) };
        m(Wt(k, P, T, 1, 8), !0, [1.1, 1.1]);
      }
  }), f(o.body), v || S("left"), S("right"), f(o.behindHead), c(() => {
    p(), e.translate(0, s.neckY), e.rotate(it(t.headTilt));
    const k = -s.headRy;
    e.beginPath(), e.ellipse(0, k, s.headRx, s.headRy, 0, 0, Math.PI * 2);
    const T = n.headFill ?? "#ffffff";
    if (T !== "none" && (e.fillStyle = T, e.fill()), l) {
      l.ellipse(0, k, s.headRx, s.headRy);
      const P = l.nudge();
      e.translate(P.x, P.y);
    } else
      e.stroke();
    e.translate(0, k), e.scale(s.headRx / s.r, s.headRy / s.r), au(e, t, s.r, 0, r, s.lineWidth);
  }), f(o.overHead), f(o.front), e.restore(), n.label && (e.save(), e.fillStyle = r, e.font = n.labelFont ?? `700 ${Math.round(s.height * 0.11)}px sans-serif`, e.textAlign = "center", e.textBaseline = "bottom", e.fillText(n.label, 0, -s.height * s.stretch - 0.04 * s.height + s.drop), e.restore());
}
function jr(e, t, n) {
  const i = { ...e };
  let s = e.walking > 0 ? ce(i, Wc(e.walk, i), e.walking) : i, r = pu(e);
  const o = e.dancing ?? 0;
  if (n && o > 0) {
    const a = n(e.beat ?? 0);
    if (s = ce(s, a.pose, o), a.hands) {
      const l = (h, c) => c ? he(h ?? W, c, o) : h;
      r = { left: l(r?.left, a.hands.left), right: l(r?.right, a.hands.right) };
    }
  }
  return e.talk > 0 && (s = { ...s, mouth: Math.max(s.mouth, e.talk * Nc(t)) }), { pose: s, hands: r };
}
function du(e, t, n) {
  return jr(e, t, n).pose;
}
const Xe = (e, t) => `hand.${e}.${t}`;
function pu(e) {
  const t = (s) => {
    if (typeof e[Xe(s, "spread")] == "number")
      return Object.fromEntries(Object.keys(W).map((r) => [r, e[Xe(s, r)]]));
  }, n = t("left"), i = t("right");
  return n || i ? { left: n, right: i } : void 0;
}
function mu(e, t) {
  return !t || !e.hands ? e : { ...e, hands: { ...e.hands, left: t.left ?? e.hands.left, right: t.right ?? e.hands.right } };
}
function Ud(e) {
  const t = e.style ?? {}, n = t.height ?? 300, i = n * 0.8, s = { ...U(e.pose ?? {}), walk: 0, walking: 0, talk: 0, rubber: t.rubber ?? 0, beat: 0, dancing: 0 }, r = {};
  if (t.hands)
    for (const o of ["left", "right"]) {
      const a = t.hands[o] ?? W;
      for (const l of Object.keys(W)) r[Xe(o, l)] = a[l] ?? W[l];
    }
  return {
    type: "custom",
    x: e.x - i / 2,
    y: e.y - n,
    width: i,
    height: n,
    props: { ...s, ...r },
    figureStyle: t,
    figureDance: e.dance,
    draw(o, a, l) {
      const h = a.props, c = jr(h, l, e.dance);
      o.translate(i / 2, n), fu(o, c.pose, mu({ ...t, rubber: h.rubber }, c.hands), l);
    }
  };
}
function gu(e, t, n) {
  const i = e.figureStyle;
  if (!i) throw new Error("stickFigureAt: the target was not made by stickFigureTarget");
  const s = { ...e.props };
  let r = 0, o = 0;
  for (const [h, c] of t.state?.values.get(n) ?? [])
    typeof c == "number" && (h === "x" || h === "motionPathX" ? r = c : h === "y" || h === "motionPathY" ? o = c : h in s && (s[h] = c));
  const a = du(s, t.time, e.figureDance), l = cu(a, { ...i, rubber: s.rubber });
  return { pose: a, joints: uu(l, e.x + r + e.width / 2, e.y + o + e.height) };
}
function Gr(e) {
  const t = [];
  return e.forEach((n, i) => {
    const s = i === 0 ? q : t[i - 1], r = typeof n.pose == "string" ? pi[n.pose] : { ...s, ...n.pose };
    t.push(n.expression ? Or(r, n.expression) : r);
  }), t;
}
function zd(e, t) {
  const n = Gr(t);
  return Fr.filter((i) => n.some((s) => s[i] !== q[i])).map((i) => ({
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
const yn = 0.5, Es = {
  /** Flag: fingers together and straight, thumb bent in */
  pataka: D({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Pataka with the ring finger bent */
  tripataka: D({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 1, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Lotus in bloom: fingers fanned, each a little more curled than the last */
  alapadma: D({ "thumb.curl": 0.1, "thumb.across": 0, "index.curl": 0.05, "middle.curl": 0.15, "ring.curl": 0.25, "pinky.curl": 0.35, spread: 1, turn: 2 }),
  /** Fist */
  mushti: Y.fist,
  /** Fist, thumb up */
  shikhara: Y.thumbsUp,
  /** Swan's beak: thumb and index touch, the others fanned */
  hamsasya: D({ "thumb.curl": 0.15, "thumb.across": 0.6, "index.curl": 0.6, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0.7, turn: 2 }),
  /** Bracelet: thumb, index and middle meet, ring and little finger out */
  katakamukha: D({ "thumb.curl": 0.2, "thumb.across": 0.6, "index.curl": 0.65, "middle.curl": 0.7, "ring.curl": 0, "pinky.curl": 0, spread: 0.4, turn: 2 })
};
function Ve(e) {
  return typeof e != "string" ? e : e in Es ? Es[e] : Y[e];
}
function Jr(e, t, n) {
  const i = [];
  for (const s of e.keys) {
    const r = i[i.length - 1], o = !r || s.reset ? { pose: t, ...n } : r;
    i.push({
      beat: s.beat,
      pose: { ...o.pose, ...s.pose },
      left: s.hands?.left ? Ve(s.hands.left) : o.left,
      right: s.hands?.right ? Ve(s.hands.right) : o.right,
      easing: s.easing ?? e.easing
    });
  }
  return i;
}
const mi = (e, t) => (e % t + t) % t;
function yu(e, t, n, i) {
  const s = Jr(e, n, i);
  if (s.length === 0) return { pose: n, hands: i };
  const r = mi(t, e.beats);
  let o = s.length - 1;
  for (let p = 0; p < s.length; p++) s[p].beat <= r && (o = p);
  const a = s[o], l = s[(o + 1) % s.length], h = a.beat <= r ? a.beat : a.beat - e.beats, c = l.beat > h ? l.beat : l.beat + e.beats, f = c > h ? (r - h) / (c - h) : 0, u = J(l.easing ?? "ease-in-out")(Math.min(1, Math.max(0, f)));
  return {
    pose: ce(a.pose, l.pose, u),
    hands: { left: he(a.left, l.left, u), right: he(a.right, l.right, u) }
  };
}
const bu = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftWrist", "rightWrist"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
  ["leftAnkle", "rightAnkle"],
  ["leftFootOut", "rightFootOut"],
  ["leftEye", "rightEye"],
  ["leftBrow", "rightBrow"]
], wu = ["lean", "headTilt", "lookX", "spin"], vu = /* @__PURE__ */ new Set(["leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee"]);
function ku(e) {
  const t = { ...e }, n = (e.turn ?? 0) >= 0.5;
  for (const [i, s] of bu) {
    const r = n && vu.has(i) ? -1 : 1;
    t[i] = r * e[s], t[s] = r * e[i];
  }
  if (!n) for (const i of wu) t[i] = -e[i];
  return t;
}
const Su = (e) => Math.min(1, Math.max(-1, (0.5 - e) * 4));
function Mu(e, t, n) {
  const i = mi(n, 1), s = (1 + Math.cos(2 * Math.PI * i)) / 2, r = t.bounce * (t.accent === "up" ? 1 - s : s), o = Math.min(1, Math.max(0, e.turn ?? 0)), a = Su(o);
  return {
    ...e,
    leftHip: e.leftHip + a * r / 2,
    rightHip: e.rightHip + r / 2,
    leftKnee: e.leftKnee + a * r,
    rightKnee: e.rightKnee + r,
    lean: e.lean + (t.sway ?? 0) * (1 - o) * Math.sin(Math.PI * n)
  };
}
function Vn(e) {
  const t = { ...q, ...e.stance };
  return e.expression ? Or(t, e.expression) : t;
}
function Zr(e) {
  return {
    left: e.hands?.left ? Ve(e.hands.left) : W,
    right: e.hands?.right ? Ve(e.hands.right) : W
  };
}
function bn(e, t, n) {
  const i = e.moves[t.move];
  if (!i) throw new Error(`dance: "${e.label}" has no move "${t.move}"`);
  const s = yu(i, n, Vn(e), Zr(e));
  return t.mirror ? { pose: ku(s.pose), hands: { left: s.hands?.right, right: s.hands?.left } } : s;
}
function gi(e, t, n = {}) {
  const i = typeof e == "string" ? Nt[e] : e;
  let s;
  if (n.move)
    s = bn(i, { move: n.move, mirror: n.mirror }, t);
  else {
    const r = i.routine, o = r.reduce((f, u) => f + u.beats, 0), a = mi(t, o);
    let l = 0, h = 0;
    for (; h < r.length - 1 && a >= l + r[h].beats; ) l += r[h++].beats;
    const c = a - l;
    if (s = bn(i, r[h], c), c < yn && r.length > 1 && t >= yn) {
      const f = r[(h - 1 + r.length) % r.length], u = bn(i, f, f.beats + c), p = J("ease-in-out")(c / yn);
      s = {
        pose: ce(u.pose, s.pose, p),
        hands: { left: he(u.hands.left, s.hands.left, p), right: he(u.hands.right, s.hands.right, p) }
      };
    }
  }
  return { ...s, pose: Mu(s.pose, i.groove, t) };
}
function jd(e, t, n = {}) {
  return gi(e, t, n).pose;
}
function yi(e) {
  return (typeof e == "string" ? Nt[e] : e).routine.reduce((n, i) => n + i.beats, 0);
}
const Tu = { leftToe: "rightToe", rightToe: "leftToe", leftHeel: "rightHeel", rightHeel: "leftHeel" };
function As(e, t, n, i, s, r, o) {
  for (let a = 0; a * e.beats < n; a++)
    for (const l of e.keys) {
      const h = a * e.beats + l.beat, c = t + h;
      if (!(h >= n || c < r || c >= o))
        for (const f of l.taps ?? []) s.push({ beat: c, tap: i ? Tu[f] : f });
    }
}
function Gd(e, t, n, i = {}) {
  const s = typeof e == "string" ? Nt[e] : e, r = [];
  if (n <= t) return r;
  if (i.move) {
    const o = s.moves[i.move], a = Math.floor(t / o.beats) * o.beats;
    As(o, a, Math.ceil((n - a) / o.beats) * o.beats, i.mirror, r, t, n);
  } else {
    const o = yi(s);
    for (let a = Math.floor(t / o) * o; a < n; a += o) {
      let l = a;
      for (const h of s.routine)
        As(s.moves[h.move], l, h.beats, h.mirror, r, t, n), l += h.beats;
    }
  }
  return r.sort((o, a) => o.beat - a.beat);
}
function Ps(e, t) {
  const n = e.moves[t.move];
  if (!n?.travel) return 0;
  const i = n.travel / n.beats;
  return t.mirror ? (Jr(n, Vn(e), Zr(e))[0]?.pose.turn ?? Vn(e).turn ?? 0) >= 0.5 ? i : -i : i;
}
function Qr(e, t) {
  return t.move ? [{ move: t.move, beats: e.moves[t.move].beats, mirror: t.mirror }] : e.routine;
}
function wn(e, t, n = {}) {
  const i = typeof e == "string" ? Nt[e] : e, s = Qr(i, n), r = s.reduce((c, f) => c + f.beats, 0), o = s.reduce((c, f) => c + Ps(i, f) * f.beats, 0), a = Math.floor(t / r);
  let l = a * o, h = t - a * r;
  for (const c of s) {
    const f = Math.min(c.beats, h);
    if (l += Ps(i, c) * f, h -= f, h <= 0) break;
  }
  return l;
}
function xu(e, t, n) {
  const i = Qr(e, n), s = [0];
  let r = 0;
  for (let o = 0; r < t; o = (o + 1) % i.length)
    r += i[o].beats, s.push(Math.min(r, t));
  return s;
}
const Eu = 8;
function Au(e, t, n) {
  const i = typeof t == "string" ? Nt[t] : t, s = n.bpm ?? i.bpm, r = n.beats ?? (n.move ? i.moves[n.move].beats : yi(i)), o = xu(i, r, n);
  if (o.every((y) => wn(i, y, n) === 0)) return;
  const a = Math.min(n.fade ?? 1, r / 2), l = J("ease-in-out"), h = (y) => a <= 0 ? 1 : Math.min(l(Math.min(1, y / a)), l(Math.min(1, (r - y) / a))), c = Math.ceil(a * Eu), f = a <= 0 ? [] : Array.from({ length: c + 1 }, (y, b) => [b / c * a, r - b / c * a]).flat(), u = [.../* @__PURE__ */ new Set([...o, ...f])].sort((y, b) => y - b);
  let p = 0;
  const m = u.map((y, b) => {
    if (b > 0) {
      const w = u[b - 1], S = Math.max(1, Math.ceil((y - w) * 16));
      for (let v = 0; v < S; v++) {
        const k = w + (y - w) * v / S, T = w + (y - w) * (v + 1) / S;
        p += (wn(i, T, n) - wn(i, k, n)) * h((k + T) / 2);
      }
    }
    return { beat: y, travel: p };
  }), d = n.start ?? 0, g = n.x ?? 0;
  return {
    id: `${e}-x`,
    target: e,
    property: "x",
    keyframes: m.map((y) => ({ time: d + y.beat * 6e4 / s, value: g + n.height * y.travel, easing: "linear" }))
  };
}
function Jd(e, t, n = 0) {
  return (e - n) * t / 6e4;
}
function Zd(e, t = {}) {
  return (n) => gi(e, n, t);
}
function Qd(e, t) {
  const n = t.start ?? 0, i = 6e4 / t.bpm, s = n + t.beats * i, r = Math.min((t.fade ?? 1) * i, (s - n) / 2);
  return [
    {
      id: `${e}-beat`,
      target: e,
      property: "beat",
      keyframes: [
        { time: n, value: 0 },
        { time: s, value: t.beats, easing: "linear" }
      ]
    },
    {
      id: `${e}-dancing`,
      target: e,
      property: "dancing",
      keyframes: [
        { time: n, value: 0 },
        { time: n + r, value: 1, easing: "ease-in-out" },
        { time: s - r, value: 1 },
        { time: s, value: 0, easing: "ease-in-out" }
      ]
    }
  ];
}
function t0(e, t, n = {}) {
  const i = typeof t == "string" ? Nt[t] : t, s = n.bpm ?? i.bpm, r = n.beats ?? (n.move ? i.moves[n.move].beats : yi(i)), o = n.samplesPerBeat ?? 4, a = n.start ?? 0, l = Math.round(r * o), h = Array.from({ length: l + 1 }, (d, g) => {
    const y = g / o;
    return { time: a + y * 6e4 / s, frame: gi(i, y, n) };
  }), c = (d, g) => ({
    id: `${e}-${d}`,
    target: e,
    property: d,
    keyframes: h.map((y) => ({ time: y.time, value: g(y.frame) }))
  }), u = Object.keys(q).filter((d) => h.some((g) => g.frame.pose[d] !== h[0].frame.pose[d]) || h[0].frame.pose[d] !== q[d]).map((d) => c(d, (g) => g.pose[d])), p = n.height === void 0 ? void 0 : Au(e, i, { ...n, bpm: s, beats: r, start: a, height: n.height, fade: 0 });
  if (p && u.push(p), n.hands === !1) return u;
  const m = [];
  for (const d of ["left", "right"])
    for (const g of Object.keys(W)) {
      const y = (b) => b.hands?.[d]?.[g] ?? W[g];
      h.some((b) => y(b.frame) !== W[g]) && m.push(c(Xe(d, g), y));
    }
  return [...u, ...m];
}
const ie = { type: "back", mode: "out", overshoot: 1.1 }, z = "ease-out-cubic", Pu = {
  label: "Disco",
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 6, rightKnee: 6 },
  expression: { smile: 0.9, mouth: 0.15, leftBrow: 0.3, rightBrow: 0.3 },
  groove: { bounce: 10, accent: "down", sway: 2 },
  moves: {
    point: {
      label: "The point",
      beats: 2,
      easing: z,
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
        { beat: 0, pose: { lean: -10, rightHip: 22, leftHip: 4, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: z },
        { beat: 1, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: "flat", right: "flat" } },
        { beat: 2, pose: { lean: 10, rightHip: 4, leftHip: 22, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: z },
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
}, _u = {
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
}, Hu = {
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
        { beat: 0, pose: { rightHip: -24, rightKnee: 10, leftHip: 10, leftShoulder: 80, leftElbow: 40, rightShoulder: 55, rightElbow: -50, lean: 6, headTilt: -6 }, easing: z },
        { beat: 1, reset: !0, pose: { leftHip: 18, rightHip: 18 } },
        { beat: 2, pose: { leftHip: -24, leftKnee: 10, rightHip: 10, rightShoulder: 80, rightElbow: 40, leftShoulder: 55, leftElbow: -50, lean: -6, headTilt: 6 }, easing: z },
        { beat: 3, reset: !0, pose: { leftHip: 18, rightHip: 18 } }
      ]
    },
    kick: {
      label: "Kick out",
      beats: 2,
      keys: [
        { beat: 0, pose: { rightHip: 72, rightKnee: 4, rightAnkle: -20, leftHip: 4, lean: -12, leftShoulder: 100, leftElbow: 20 }, easing: z },
        { beat: 1, reset: !0 }
      ]
    },
    freeze: {
      label: "B-boy stance",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 26, leftElbow: -122, rightShoulder: 22, rightElbow: -118, leftHip: 18, rightHip: 18, leftKnee: 6, rightKnee: 6, lean: -4, headTilt: 10, smile: 0.6, leftEye: 0.6, rightEye: 0.6 }, easing: ie },
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
}, Iu = {
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
        hands: t === 0 ? { left: { ...Y.spread, turn: 2 }, right: { ...Y.spread, turn: 2 } } : void 0
      }))
    },
    kickBallChange: {
      label: "Kick ball change",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 88, rightKnee: 0, rightAnkle: 55, leftHip: 4, lean: -12, leftShoulder: 112, rightShoulder: 112, leftWrist: 15, rightWrist: 15 }, hands: { left: "flat", right: "flat" }, easing: z },
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
}, Cu = {
  label: "K-pop",
  bpm: 125,
  stance: { leftHip: 9, rightHip: 9, leftKnee: 4, rightKnee: 4 },
  expression: "happy",
  groove: { bounce: 5, accent: "down" },
  moves: {
    pointCombo: {
      label: "Point combo",
      beats: 4,
      easing: ie,
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
        { beat: 0, reset: !0, pose: { leftShoulder: 165, rightShoulder: 165, leftElbow: 46, rightElbow: 46, headTilt: -8, lean: -4 }, hands: { left: "cupped", right: "cupped" }, easing: ie },
        { beat: 1, pose: { headTilt: 8, lean: 4 } },
        { beat: 2, reset: !0, pose: { rightShoulder: 32, rightElbow: 112, rightWrist: 10, leftShoulder: 20, leftElbow: -30, headTilt: 10, leftEye: 0, smile: 1 }, hands: { right: "pinch", left: "relaxed" }, easing: ie },
        { beat: 3, pose: { headTilt: 4 } }
      ]
    },
    isolations: {
      label: "Isolations",
      beats: 2,
      easing: z,
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
}, $u = {
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
        { beat: 0, reset: !0, pose: { rightShoulder: 160, rightElbow: 12, rightWrist: -15, leftShoulder: 40, leftElbow: -12, leftWrist: -45, lean: -4, rightHip: 16, lookX: 0.5, lookY: -0.6 }, hands: { right: { ...Y.cupped, roll: -30 }, left: { ...Y.flat, turn: 0 } } },
        { beat: 0.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...Y.cupped, roll: 30 } } },
        { beat: 1, pose: { rightWrist: -15, rightElbow: 12, leftWrist: -45, lean: -4, rightHip: 16, leftHip: 6 }, hands: { right: { ...Y.cupped, roll: -30 } } },
        { beat: 1.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...Y.cupped, roll: 30 } } }
      ]
    },
    thumka: {
      label: "Thumka",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { lean: -11, rightHip: 22, leftHip: 2, leftKnee: 14, rightShoulder: 45, rightElbow: -105, leftShoulder: 128, leftElbow: 18, leftWrist: 35, headTilt: 10, lookX: -0.5 }, hands: { right: "fist", left: { ...Y.open, turn: 2 } }, easing: z },
        { beat: 0.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } },
        { beat: 1, pose: { lean: -11, rightHip: 22, headTilt: 10 }, easing: z },
        { beat: 1.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } }
      ]
    },
    flick: {
      label: "Cross and flick",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26 }, hands: { left: "fist", right: "fist" } },
        { beat: 1, pose: { leftShoulder: 132, rightShoulder: 132, leftElbow: 0, rightElbow: 0, leftWrist: 30, rightWrist: 30, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10, stretch: 1.03 }, hands: { left: "spread", right: "spread" }, easing: z },
        { beat: 2, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftWrist: 0, rightWrist: 0, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26, stretch: 1 }, hands: { left: "fist", right: "fist" } },
        { beat: 3, pose: { leftShoulder: 62, rightShoulder: 62, leftElbow: 0, rightElbow: 0, leftWrist: 35, rightWrist: 35, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10 }, hands: { left: "spread", right: "spread" }, easing: z }
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
}, Ru = {
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
}, Lu = { leftHip: 42, rightHip: 42, leftKnee: 82, rightKnee: 82, leftFootOut: 0.3, rightFootOut: 0.3 }, Ou = {
  label: "Bharatanatyam",
  bpm: 80,
  // Natyarambhe: arms out at shoulder height, hands raised in pataka.
  stance: { ...Lu, leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0, leftWrist: 75, rightWrist: 75 },
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
}, Fu = {
  label: "Charleston",
  bpm: 150,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 10, rightKnee: 10, leftShoulder: 30, rightShoulder: 30, leftElbow: 20, rightElbow: 20 },
  expression: { mouth: 0.4, smile: 1, leftBrow: 0.5, rightBrow: 0.5 },
  hands: { left: { ...Y.spread, turn: 2 }, right: { ...Y.spread, turn: 2 } },
  groove: { bounce: 8, accent: "down" },
  moves: {
    basic: {
      label: "Kick forward, kick back",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 48, rightKnee: 8, rightAnkle: 45, leftShoulder: 75, rightShoulder: 15, leftElbow: 30, rightElbow: -10, lean: -7, headTilt: -5 }, easing: z },
        { beat: 1, reset: !0 },
        { beat: 2, reset: !0, pose: { leftHip: 18, leftKnee: 85, leftAnkle: 35, rightShoulder: 75, leftShoulder: 15, rightElbow: 30, leftElbow: -10, lean: 7, headTilt: 5 }, easing: z },
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
}, Bu = {
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
        { beat: 1, pose: { rightShoulder: 135, leftShoulder: 125, leftElbow: 0, rightElbow: 0, leftWrist: 0, rightWrist: 30, rightKnee: 8, leftKnee: -8, rightHip: 4, leftHip: -4 }, hands: { left: { ...Y.spread, turn: 2 }, right: { ...Y.spread, turn: 2 } } },
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
}, Du = {
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
          easing: ie
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
}, Nt = {
  disco: Pu,
  hipHop: _u,
  breaking: Hu,
  jazz: Iu,
  kpop: Cu,
  bollywood: $u,
  bhangra: Ru,
  bharatanatyam: Ou,
  charleston: Fu,
  tap: Bu,
  popping: Du
}, Ue = (e) => Math.min(1, Math.max(0, e));
function Wu(e) {
  const t = { ...q, turn: e.view }, n = [];
  for (const i of e.keys) {
    const s = n[n.length - 1], r = !s || i.reset ? t : s.pose;
    n.push({ at: i.at, pose: { ...r, ...i.pose }, easing: i.easing });
  }
  return n;
}
function Nu(e) {
  return e - Ku * Math.sin(2 * Math.PI * e) / (2 * Math.PI);
}
const Ku = 0.5;
function Yu(e, t) {
  if (!(t <= e.takeoff || t >= e.landing))
    return (t - e.takeoff) / (e.landing - e.takeoff);
}
function qu(e, t) {
  const n = typeof e == "string" ? bi[e] : e, i = Wu(n), s = Ue(t);
  let r = 0;
  for (let f = 0; f < i.length; f++) i[f].at <= s && (r = f);
  const o = i[r], a = i[Math.min(r + 1, i.length - 1)], l = a.at > o.at ? (s - o.at) / (a.at - o.at) : 0, h = ce(o.pose, a.pose, J(a.easing ?? "ease-in-out")(Ue(l))), c = Yu(n, s);
  return c === void 0 ? { ...h, spin: 0, rise: 0 } : {
    ...h,
    spin: n.spin * Nu(c),
    rise: 4 * n.height * c * (1 - c)
  };
}
function Xu(e, t, n) {
  const i = typeof e == "string" ? bi[e] : e, s = Ue(t), r = Ue((s - i.takeoff) / (i.landing - i.takeoff));
  return i.travel * n * r;
}
function e0(e, t, n = {}) {
  const i = typeof t == "string" ? bi[t] : t, s = n.start ?? 0, r = n.duration ?? i.duration, o = n.samples ?? 48, a = Array.from({ length: o + 1 }, (c, f) => {
    const u = f / o;
    return { time: s + u * r, progress: u, pose: qu(i, u) };
  }), h = Object.keys(q).filter((c) => a.some((f) => f.pose[c] !== q[c])).map((c) => ({
    id: `${e}-${c}`,
    target: e,
    property: c,
    keyframes: a.map((f) => ({ time: f.time, value: f.pose[c] }))
  }));
  if (n.height !== void 0 && i.travel !== 0) {
    const c = (n.facing ?? 1) < 0 ? -1 : 1;
    h.push({
      id: `${e}-x`,
      target: e,
      property: "x",
      keyframes: a.map((f) => ({ time: f.time, value: (n.x ?? 0) + c * Xu(i, f.progress, n.height) }))
    });
  }
  return h;
}
const Vu = {
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
}, Uu = {
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
}, ke = {
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
}, zu = {
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
}, ju = {
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
function Pt(e, t, n, i, s, r = 1300) {
  return {
    label: e,
    view: 1,
    spin: t,
    height: n,
    travel: i,
    takeoff: 0.27,
    landing: 0.8,
    duration: r,
    keys: [
      { at: 0, reset: !0 },
      { at: 0.16, pose: Vu },
      { at: 0.27, pose: Uu, easing: "ease-out-quad" },
      ...s,
      { at: 0.76, pose: zu },
      { at: 0.86, pose: ju, easing: "ease-out-quad" },
      { at: 1, reset: !0 }
    ]
  };
}
const bi = {
  frontFlip: Pt("Front flip (tuck)", 360, 0.56, 0.35, [
    { at: 0.38, pose: ke, easing: "ease-out-cubic" },
    { at: 0.64, pose: ke }
  ]),
  backFlip: Pt("Back flip (tuck)", -360, 0.58, -0.15, [
    { at: 0.36, pose: { ...ke, lean: 18 }, easing: "ease-out-cubic" },
    { at: 0.64, pose: { ...ke, lean: 18 } }
  ]),
  layout: Pt("Back layout (straight body)", -360, 0.66, -0.2, [
    // Arched, arms overhead, legs together and long.
    { at: 0.4, pose: { leftHip: 8, rightHip: -8, leftKnee: 0, rightKnee: 0, leftAnkle: 60, rightAnkle: 60, leftShoulder: -178, rightShoulder: 178, lean: -18, headTilt: -14 } },
    { at: 0.64, pose: { leftHip: -4, rightHip: 4, lean: -6, headTilt: -4, leftShoulder: -150, rightShoulder: 150 } }
  ], 1400),
  scissorFlip: Pt("Scissor flip", 360, 0.6, 0.45, [
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
  splitLeap: Pt("Split leap (grand jeté)", 0, 0.36, 0.9, [
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
  backHandspring: Pt("Back handspring", -360, 0.16, -0.7, [
    // Arms reach back overhead to the ground, legs snap over.
    { at: 0.38, pose: { leftHip: 10, rightHip: -10, leftKnee: 0, rightKnee: 0, leftShoulder: -178, rightShoulder: 178, lean: -26, headTilt: -20 } },
    { at: 0.6, pose: { leftHip: -40, rightHip: 40, leftKnee: -20, rightKnee: 20, lean: 6, headTilt: 0 } }
  ], 1200)
}, vn = 0.215, kn = 0.205, Gu = 0.065, _s = 0.035, Ju = 0.165, Zu = 0.155, Qu = 12, tf = (e) => e * Math.PI / 180, V = {
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
function tt(e = {}) {
  return { ...V, ...e };
}
const ef = /* @__PURE__ */ new Set(["turn", "side", "head.turn", "head.tilt", "roll", "lookX"]);
function n0(e) {
  const t = {};
  for (const [n, i] of Object.entries(e)) {
    const s = n.replace(/(^|\.)(left|right)(\.|$)/, (r, o, a, l) => `${o}${a === "left" ? "right" : "left"}${l}`);
    t[s] = ef.has(n) ? -i : i;
  }
  return t;
}
function Z(e, t) {
  const n = {};
  for (const i of ["left", "right"]) for (const [s, r] of Object.entries(t)) n[`${e}.${i}.${s}`] = r;
  return n;
}
const nf = {
  rest: V,
  wave: tt({ "arm.right.spread": 115, "arm.right.bend": 55, "arm.right.elbow": 0, "head.tilt": -6, smile: 0.9 }),
  cheer: tt({ ...Z("arm", { spread: 140, bend: 20, elbow: 0 }), mouth: 0.6, smile: 1, "eye.left": 0, "eye.right": 0 }),
  point: tt({ "arm.right.spread": 88, "arm.right.elbow": 0, "arm.right.bend": 0, "head.turn": -20, smile: 0.4 }),
  handsOnHips: tt({ ...Z("arm", { spread: 50, bend: -105, elbow: 0 }), ...Z("leg", { spread: 9 }), smile: 0.8 }),
  think: tt({ "arm.right.spread": 22, "arm.right.bend": -150, "arm.right.elbow": 0, "head.tilt": 10, lookX: -0.5, lookY: -0.8, smile: 0 }),
  shrug: tt({ ...Z("arm", { spread: 35, bend: 75, elbow: 0 }), "head.tilt": -10, smile: -0.2 }),
  sit: tt({ ...Z("leg", { swing: 90, knee: 90, spread: 4 }), ...Z("arm", { swing: 25, elbow: 45, spread: 8 }) }),
  kneel: tt({
    "leg.left.swing": 90,
    "leg.left.knee": 90,
    // The back thigh leans back a little so its knee meets the ground beside the
    // front foot; the shin slopes up from it and the foot points down to tucked toes.
    "leg.right.swing": -18,
    "leg.right.knee": 108,
    "leg.right.ankle": 16,
    ...Z("arm", { swing: 20, elbow: 30 })
  }),
  crouch: tt({ ...Z("leg", { swing: 75, knee: 140, spread: 6 }), lean: 25, ...Z("arm", { swing: 50, elbow: 40 }), "head.nod": -15 }),
  // On hands and knees: the back nearly level, arms straight down, the toes
  // pointed back along the ground.
  crawl: tt({ lean: 82, "head.nod": -35, ...Z("arm", { swing: 80, elbow: 0, spread: 4 }), ...Z("leg", { knee: 92, ankle: -88 }) }),
  lieDown: tt({ roll: 90, ...Z("arm", { spread: 8 }), "head.nod": 0 })
};
function sf(e = {}) {
  const t = e.headSize ?? 0.3, n = e.shoulderWidth ?? 0.06, i = e.hipWidth ?? 0.022, s = Math.max(0.12, 1 - t - _s - (vn + kn)), r = (l) => ({
    id: `arm.${l}`,
    parent: "spine",
    offset: [(l === "left" ? 1 : -1) * n, -0.035, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: Ju, width: [1.25, 0.9] },
      { length: Zu, width: [0.9, 0.75] }
    ]
  }), o = (l) => ({
    id: `leg.${l}`,
    parent: null,
    offset: [(l === "left" ? 1 : -1) * i, 0, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: vn, width: [1.45, 1.05] },
      { length: kn, width: [1.05, 0.85] },
      { length: Gu, width: [0.95, 0.7] }
    ]
  }), a = (l, h) => l[h] ?? V[h] ?? 0;
  return {
    id: "human",
    hipHeight: vn + kn,
    // Tie order: legs, then the body, then the arms (in front of the chest unless turned away), then the head.
    chains: [
      o("left"),
      o("right"),
      {
        id: "spine",
        parent: null,
        rest: [0, 1, 0],
        bones: [
          { length: s / 2, width: [1.7, 1.4] },
          { length: s / 2, width: [1.4, 1.1] }
        ]
      },
      { id: "neck", parent: "spine", rest: [0, 1, 0], bones: [{ length: _s, width: [1, 0.9] }] },
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
    angles(l, h) {
      if (h.id === "spine") {
        const d = -a(l, "lean") / 2, g = a(l, "side") / 2;
        return [
          { swing: d, spread: g },
          { swing: d, spread: g }
        ];
      }
      if (h.id === "neck") return [{ swing: 0, spread: 0 }];
      const [c, f] = h.id.split("."), u = (d) => a(l, `${c}.${f}.${d}`);
      if (c === "arm")
        return [
          { swing: u("swing"), spread: u("spread") },
          { swing: u("elbow"), spread: u("bend") }
        ];
      const p = (h.side ?? 1) * u("rotate"), m = 1 - Math.cos(tf(u("rotate")));
      return [
        { swing: u("swing"), spread: u("spread"), yaw: p },
        { swing: -u("knee"), spread: 0, yaw: p },
        // The foot points forward, square to the shin, turned out a little (more with `toeOut`).
        { swing: 90 + u("ankle") - m * (u("swing") - u("knee")), spread: 0, yaw: (Qu + u("toeOut")) * (h.side ?? 1) }
      ];
    },
    withAngles(l, h, c) {
      const [f, u] = h.id.split("."), p = (m) => `${f}.${u}.${m}`;
      return f === "arm" ? {
        ...l,
        [p("swing")]: c[0].swing,
        [p("spread")]: c[0].spread,
        [p("elbow")]: c[1].swing,
        [p("bend")]: c[1].spread
      } : f === "leg" ? { ...l, [p("swing")]: c[0].swing, [p("spread")]: c[0].spread, [p("knee")]: -c[1].swing } : l;
    },
    boneScale(l, h) {
      const c = Math.min(3, Math.max(0.3, a(l, "stretch")));
      return h?.id.startsWith("arm.") ? Math.sqrt(c) : c;
    },
    headPose(l) {
      const h = Math.min(3, Math.max(0.3, a(l, "stretch")));
      return {
        yaw: a(l, "head.turn"),
        nod: a(l, "head.nod"),
        tilt: a(l, "head.tilt"),
        // The head keeps its area: taller and narrower when stretched.
        sx: 1 / Math.sqrt(h),
        sy: Math.sqrt(h)
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
function i0(e) {
  const t = e.split(".");
  if (t[0] === "hand" && t.length >= 3) {
    const i = `${t[1] === "left" ? "Left" : "Right"} hand`, s = { spread: "finger spread", turn: "wrist turn", bend: "wrist bend", tilt: "wrist tilt", roll: "roll" }, r = t.slice(2).join(".");
    return `${i} · ${s[r] ?? r.replace(".curl", " curl").replace(".across", " across")}`;
  }
  if (t.length === 3) {
    const [i, s, r] = t;
    return `${`${s === "left" ? "Left" : "Right"} ${i}`} · ${{
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
const rf = {
  leftEye: "eye.left",
  rightEye: "eye.right",
  leftBrow: "brow.left",
  rightBrow: "brow.right"
}, s0 = Object.fromEntries(
  Object.entries(X).map(([e, t]) => [
    e,
    Object.fromEntries(Object.entries(t).map(([n, i]) => [rf[n] ?? n, i]))
  ])
);
function r0(e, t) {
  const n = Math.min(1, Math.max(0, e.turn ?? 0)), i = 1 - n, s = { ...V, turn: n }, r = [
    { stick: "right", human: "left", s: 1 },
    { stick: "left", human: "right", s: -1 }
  ];
  for (const { stick: o, human: a, s: l } of r) {
    const h = e[`${o}Shoulder`], c = e[`${o}Elbow`];
    s[`arm.${a}.spread`] = h * i, s[`arm.${a}.swing`] = l * h * n, s[`arm.${a}.bend`] = c * i, s[`arm.${a}.elbow`] = l * c * n;
    const f = e[`${o}Hip`], u = e[`${o}Knee`], p = i + l * n;
    s[`leg.${a}.rotate`] = 90 * i, s[`leg.${a}.spread`] = 0, s[`leg.${a}.swing`] = f * p, s[`leg.${a}.knee`] = u * p, s[`leg.${a}.ankle`] = -(e[`${o}Ankle`] ?? 0), s[`leg.${a}.toeOut`] = (e[`${o}FootOut`] ?? 0) * of, s[`eye.${a}`] = e[`${o}Eye`], s[`brow.${a}`] = e[`${o}Brow`], t && Object.assign(s, af(a, t[o] ?? W, e[`${o}Wrist`] ?? 0, n));
  }
  s.lean = e.lean * n, s.side = e.lean * i, s["head.tilt"] = e.headTilt * i, s["head.nod"] = e.headTilt * n;
  for (const o of ["mouth", "smile", "mouthWidth", "blink", "browTilt", "lookX", "lookY", "stretch"]) s[o] = e[o];
  return s.lift = e.rise ?? 0, s.roll = e.spin ?? 0, s;
}
const of = 70;
function af(e, t, n, i) {
  const s = e === "right" ? 1 - i : 1 + i, r = {};
  for (const o of Object.keys(W)) r[`hand.${e}.${o}`] = t[o] ?? W[o];
  return r[`hand.${e}.turn`] = (t.turn ?? 0) - s, r[`hand.${e}.roll`] = (t.roll ?? 0) + n, r;
}
const nt = (e) => e * Math.PI / 180;
function to([e, t, n], i) {
  const s = Math.cos(i), r = Math.sin(i);
  return [e, t * s + n * r, -t * r + n * s];
}
function wi([e, t, n], i) {
  const s = Math.cos(i), r = Math.sin(i);
  return [e * s - t * r, e * r + t * s, n];
}
function Et([e, t, n], i) {
  const s = Math.cos(i), r = Math.sin(i);
  return [e * s + n * r, t, -e * r + n * s];
}
const yt = (e, t) => [e[0] + t[0], e[1] + t[1], e[2] + t[2]], ze = (e, t) => [e[0] * t, e[1] * t, e[2] * t], $e = (e, t) => wi(to(e, t.swing), t.spread);
function Sn(e, t) {
  const n = Et(e, t);
  return { point: { x: n[0], y: -n[1] }, depth: n[2] };
}
function vi(e, t, n) {
  const i = n, r = [0, e.hipHeight * i * (e.boneScale?.(t, null) ?? 1), 0], o = {};
  for (const d of e.chains) {
    const g = d.parent ? o[d.parent] : void 0;
    if (d.parent && !g) throw new Error(`body plan ${e.id}: chain ${d.id} comes before its parent ${d.parent}`);
    const y = d.at ?? (g ? g.joints3.length - 1 : 0), b = g ? g.joints3[y] : r, w = g ? g.frames[Math.max(0, y - 1)] : { swing: 0, spread: 0 }, S = d.offset ? yt(b, $e(ze(d.offset, i), w)) : b, v = d.side ?? 1, k = e.boneScale?.(t, d) ?? 1, T = e.angles(t, d), P = [S], M = [];
    let A = w.swing, x = w.spread;
    d.bones.forEach((E, _) => {
      const H = T[_] ?? { swing: 0, spread: 0 };
      A += nt(H.swing), x += nt(H.spread) * v, M.push({ swing: A, spread: x });
      const I = Et($e(d.rest, { swing: A, spread: x }), nt(H.yaw ?? 0));
      P.push(yt(P[_], ze(I, E.length * i * k)));
    }), o[d.id] = { joints3: P, frames: M };
  }
  const a = o[e.head.on], l = e.headPose?.(t) ?? { yaw: 0, nod: 0, tilt: 0, sx: 1, sy: 1 }, h = a.frames[a.frames.length - 1], c = e.head.size / 2 * i, f = c * l.sx, u = c * l.sy, p = (d) => $e(Et(to(wi(d, -nt(l.tilt)), -nt(l.nod)), nt(l.yaw)), h), m = yt(a.joints3[a.joints3.length - 1], p([0, u, 0]));
  return { height: i, root: r, chains: o, head: { center: m, rx: f, ry: u, toBody: p } };
}
function ki(e, t, n) {
  const i = n.height, s = nt(90 * (t.turn ?? 0)), r = vi(e, t, i), { root: o } = r, a = r.chains, { rx: l, ry: h } = r.head, c = r.head.toBody, f = r.head.center, u = {};
  for (const M of e.chains) {
    const { joints3: A, frames: x } = a[M.id], E = A.map((_) => Sn(_, s));
    u[M.id] = {
      id: M.id,
      joints3: A,
      frames: x,
      points: E.map((_) => _.point),
      depths: E.map((_) => _.depth)
    };
  }
  const p = Sn(f, s), m = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((M) => Et(c(M), s)), d = Sn(o, s).point, g = nt(t.roll ?? 0), y = (M) => {
    const A = M.x - d.x, x = M.y - d.y;
    return { x: d.x + A * Math.cos(g) - x * Math.sin(g), y: d.y + A * Math.sin(g) + x * Math.cos(g) };
  }, b = ([M, A, x]) => [M * Math.cos(g) + A * Math.sin(g), -M * Math.sin(g) + A * Math.cos(g), x];
  for (const M of Object.values(u)) M.points = M.points.map(y);
  const w = {
    center: y(p.point),
    depth: p.depth,
    rx: l,
    ry: h,
    angle: 0,
    axes: m.map(b)
  }, S = w.axes[1];
  w.angle = Math.atan2(S[0], S[1]);
  const v = (M) => {
    if ("head" in M) return { x: w.center.x + S[0] * h, y: w.center.y - S[1] * h };
    const A = u[M.chain];
    return A.points[Math.min(M.joint, A.points.length - 1)];
  };
  let k = 0;
  (n.contact ?? "ground") === "ground" && (k = -Math.max(...e.contacts.map((M) => v(M).y))), k -= (t.lift ?? 0) * i;
  const T = (M) => ({ x: M.x, y: M.y + k });
  for (const M of Object.values(u)) M.points = M.points.map(T);
  w.center = T(w.center);
  const P = e.contacts.map((M) => ({ spec: M, point: v(M) }));
  return {
    height: i,
    view: s,
    chains: u,
    head: w,
    hip: T(y(d)),
    contacts: P,
    groundY: Math.max(...P.map((M) => M.point.y))
  };
}
const Un = (e, t) => [e[0] - t[0], e[1] - t[1], e[2] - t[2]], eo = (e) => {
  const t = Math.hypot(e[0], e[1], e[2]) || 1;
  return [e[0] / t, e[1] / t, e[2] / t];
};
function no(e, t, n) {
  const i = n.height, s = nt(90 * (t.turn ?? 0)), r = nt(t.roll ?? 0), o = vi(e, t, i), a = Et(o.root, s), l = (g) => yt(wi(Un(Et(g, s), a), -r), a), h = {};
  for (const g of e.chains) h[g.id] = o.chains[g.id].joints3.map(l);
  const c = l(o.head.center), f = (g) => eo(Un(l(yt(o.head.center, o.head.toBody(g))), c)), u = [f([1, 0, 0]), f([0, 1, 0]), f([0, 0, 1])], p = (g) => {
    if ("head" in g) return yt(c, ze(u[1], o.head.ry));
    const y = h[g.chain];
    return y[Math.min(g.joint, y.length - 1)];
  };
  let m = 0;
  (n.contact ?? "ground") === "ground" && (m = -Math.min(...e.contacts.map((g) => p(g)[1]))), m += (t.lift ?? 0) * i;
  const d = (g) => [g[0], g[1] + m, g[2]];
  return {
    height: i,
    hip: d(a),
    chains: Object.fromEntries(Object.entries(h).map(([g, y]) => [g, y.map(d)])),
    head: { center: d(c), rx: o.head.rx, ry: o.head.ry, axes: u }
  };
}
function io(e, t, n, i) {
  const s = n.height, r = nt(90 * (t.turn ?? 0)), o = vi(e, t, s), a = no(e, t, n), l = a.hip, h = a.chains, c = a.head.center, f = (M) => {
    if ("head" in M) return yt(c, ze(a.head.axes[1], a.head.ry));
    const A = h[M.chain];
    return A[Math.min(M.joint, A.length - 1)];
  }, u = i.toView(l), p = i.toScreen(u), m = i.toScreen([u[0] + 1, u[1], u[2]]), d = Math.hypot(m.x - p.x, m.y - p.y), g = (M) => {
    const A = i.toView(M);
    return { point: i.toScreen(A), depth: A[2] * d };
  }, y = {};
  for (const M of e.chains) {
    const A = h[M.id].map(g);
    y[M.id] = {
      id: M.id,
      joints3: o.chains[M.id].joints3,
      frames: o.chains[M.id].frames,
      points: A.map((x) => x.point),
      depths: A.map((x) => x.depth)
    };
  }
  const b = i.toView(c), w = i.toScreen(b), S = i.toScreen([b[0] + 1, b[1], b[2]]), v = Math.hypot(S.x - w.x, S.y - w.y), k = a.head.axes.map((M) => eo(Un(i.toView(yt(c, M)), b))), T = {
    center: w,
    depth: b[2] * d,
    rx: o.head.rx * v,
    ry: o.head.ry * v,
    angle: Math.atan2(k[1][0], k[1][1]),
    axes: k
  }, P = e.contacts.map((M) => ({ spec: M, point: g(f(M)).point }));
  return {
    height: s * d,
    view: r,
    chains: y,
    head: T,
    hip: p,
    contacts: P,
    groundY: Math.max(...P.map((M) => M.point.y))
  };
}
function so(e, [t, n, i]) {
  const [s, r, o] = e.axes, a = [
    s[0] * t * e.rx + r[0] * n * e.ry + o[0] * i * e.rx,
    s[1] * t * e.rx + r[1] * n * e.ry + o[1] * i * e.rx,
    s[2] * t * e.rx + r[2] * n * e.ry + o[2] * i * e.rx
  ], l = Math.hypot(t, n, i) || 1, h = (s[2] * t + r[2] * n + o[2] * i) / l;
  return { point: { x: e.center.x + a[0], y: e.center.y - a[1] }, depth: e.depth + a[2], facing: h };
}
class ro {
  positions = [];
  normals = [];
  indices = [];
  /** Add a vertex; returns its index. */
  vertex(t, n, i, s, r, o) {
    const a = Math.hypot(s, r, o) || 1;
    return this.positions.push(t, n, i), this.normals.push(s / a, r / a, o / a), this.positions.length / 3 - 1;
  }
  /** Add a triangle, counter-clockwise seen from its front. */
  triangle(t, n, i) {
    this.indices.push(t, n, i);
  }
  /** Add a quad a-b-c-d (counter-clockwise) as two triangles. */
  quad(t, n, i, s) {
    this.indices.push(t, n, i, t, i, s);
  }
  build() {
    return { positions: this.positions, normals: this.normals, indices: this.indices };
  }
}
function lf(e) {
  const t = /* @__PURE__ */ new Map(), n = [];
  for (let s = 0; s < e.positions.length / 3; s++) {
    const r = [0, 1, 2].map((o) => Math.round(e.positions[s * 3 + o] * 1e6)).join(",");
    t.has(r) || t.set(r, s), n.push(t.get(r));
  }
  const i = /* @__PURE__ */ new Map();
  for (let s = 0; s < e.indices.length / 3; s++)
    for (let r = 0; r < 3; r++) {
      const o = n[e.indices[s * 3 + r]], a = n[e.indices[s * 3 + (r + 1) % 3]];
      if (o === a) continue;
      const l = o < a ? `${o}-${a}` : `${a}-${o}`, h = i.get(l);
      h ? h.faces.push(s) : i.set(l, { a: Math.min(o, a), b: Math.max(o, a), faces: [s] });
    }
  return [...i.values()];
}
const Si = Math.PI * 2;
function hf(e, t = 16) {
  const n = new ro(), i = Math.max(6, Math.round(t)), s = Math.max(3, Math.round(i / 2)), r = [];
  for (let o = 0; o <= s; o++) {
    const a = o / s * Math.PI, l = [];
    for (let h = 0; h <= i; h++) {
      const c = h / i * Si, f = Math.sin(a) * Math.sin(c), u = Math.cos(a), p = Math.sin(a) * Math.cos(c);
      l.push(n.vertex(f * e, u * e, p * e, f, u, p));
    }
    r.push(l);
  }
  for (let o = 0; o < s; o++)
    for (let a = 0; a < i; a++) {
      const l = r[o][a], h = r[o + 1][a], c = r[o + 1][a + 1], f = r[o][a + 1];
      o > 0 && n.triangle(l, h, f), o < s - 1 && n.triangle(h, c, f);
    }
  return n.build();
}
function Hs(e, t, n, i, s) {
  const r = e.vertex(0, n, 0, 0, i, 0), o = Array.from({ length: s }, (a, l) => {
    const h = l / s * Si;
    return e.vertex(Math.sin(h) * t, n, Math.cos(h) * t, 0, i, 0);
  });
  for (let a = 0; a < s; a++) {
    const l = o[a], h = o[(a + 1) % s];
    i === 1 ? e.triangle(r, l, h) : e.triangle(r, h, l);
  }
}
function cf(e, t, n = 24) {
  const i = new ro(), s = Math.max(6, Math.round(n)), r = t / 2, o = -t / 2, a = (c) => Array.from({ length: s + 1 }, (f, u) => {
    const p = u / s * Si;
    return i.vertex(Math.sin(p) * e, c, Math.cos(p) * e, Math.sin(p), 0, Math.cos(p));
  }), l = a(o), h = a(r);
  for (let c = 0; c < s; c++) i.quad(l[c], l[c + 1], h[c + 1], h[c]);
  return Hs(i, e, r, 1, s), Hs(i, e, o, -1, s), i.build();
}
function Is(e) {
  const t = Array.from({ length: e.indices.length / 3 }, () => []);
  for (const n of lf(e))
    for (const i of n.faces) {
      const s = n.faces.find((r) => r !== i) ?? -1;
      t[i].push({ a: n.a, b: n.b, across: s });
    }
  return { ...e, faceEdges: t };
}
const Se = (e) => e * 180 / Math.PI, _t = (e, t) => [e[0] - t[0], e[1] - t[1], e[2] - t[2]], Mn = (e, t) => e[0] * t[0] + e[1] * t[1] + e[2] * t[2], Qt = (e) => Math.hypot(e[0], e[1], e[2]), zn = (e) => {
  const t = Qt(e) || 1;
  return [e[0] / t, e[1] / t, e[2] / t];
}, Me = (e) => Math.atan2(Math.sin(e), Math.cos(e));
function Cs(e) {
  const [t, n, i] = zn(e);
  return { swing: Math.asin(Math.max(-1, Math.min(1, i))), spread: Math.atan2(t, -n) };
}
function uf(e, t, n, i, s) {
  const r = e.chains.find((A) => A.id === n);
  if (!r) throw new Error(`reach: no chain ${n} in ${e.id}`);
  if (r.bones.length < 2 || r.rest[1] > -0.99) throw new Error(`reach: ${n} is not a hanging limb of two bones or more`);
  if (!e.withAngles) throw new Error(`reach: the ${e.id} plan cannot set angles`);
  const o = ki(e, { ...t, turn: 0, roll: 0, lift: 0 }, { height: s.height, contact: "none" }), a = o.chains[n], l = a.joints3[0], h = Qt(_t(a.joints3[1], a.joints3[0])), c = Qt(_t(a.joints3[2], a.joints3[1])), f = r.parent ? o.chains[r.parent].frames[Math.max(0, (r.at ?? o.chains[r.parent].joints3.length - 1) - 1)] : { swing: 0, spread: 0 }, u = _t(i, l), p = Math.min(h + c - 1e-6, Math.max(Math.abs(h - c) + 1e-6, Qt(u))), m = zn(u), d = r.parent !== null, g = $e(r.pole ?? (d ? [0, -0.35, -1] : [0, 0, 1]), f);
  let y = _t(g, [m[0] * Mn(g, m), m[1] * Mn(g, m), m[2] * Mn(g, m)]);
  Qt(y) < 1e-6 && (y = Et([1, 0, 0], 0)), y = zn(y);
  const b = (h * h + p * p - c * c) / (2 * h * p), w = Math.sqrt(Math.max(0, 1 - b * b)), S = [
    l[0] + h * (b * m[0] + w * y[0]),
    l[1] + h * (b * m[1] + w * y[1]),
    l[2] + h * (b * m[2] + w * y[2])
  ], v = [l[0] + m[0] * p, l[1] + m[1] * p, l[2] + m[2] * p], k = r.side ?? 1, T = Cs(_t(S, l)), P = Cs(_t(v, S)), M = [
    { swing: Se(Me(T.swing - f.swing)), spread: Se(Me(T.spread - f.spread)) * k },
    { swing: Se(Me(P.swing - T.swing)), spread: Se(Me(P.spread - T.spread)) * k }
  ];
  return e.withAngles(t, r, M);
}
const ff = 0.34, ft = 0.12, rt = -0.4, lt = (e, t, n) => e[t] ?? n, df = (e, t) => Math.max(0, e) * (1 - Math.min(1, Math.max(0, t))), pf = 0.45, mf = 0.35, gf = 0.7;
function je(e, t, n) {
  const i = (p) => Math.sqrt(Math.max(0, 1 - p.x * p.x - p.y * p.y)), s = so(e, [n.x, n.y, i(n)]).facing, r = e.axes[2], o = Math.atan2(r[0], r[2]), a = Math.cos(o), l = a >= 0 ? 1 : -1, h = l * Math.max(mf, Math.abs(a)), c = l * Math.max(gf, Math.abs(a)), f = Math.cos(e.angle), u = Math.sin(e.angle);
  return {
    facing: s,
    points: t.map((p) => {
      const m = pf * Math.sin(o) + n.x * h + (p.x - n.x) * c, d = p.y + r[1] * i(p), g = m * e.rx, y = d * e.ry;
      return { x: e.center.x + g * f + y * u, y: e.center.y + g * u - y * f };
    })
  };
}
const Te = (e, t, n, i = 12) => Array.from({ length: i + 1 }, (s, r) => {
  const o = r / i, a = 1 - o;
  return { x: a * a * e.x + 2 * a * o * t.x + o * o * n.x, y: a * a * e.y + 2 * a * o * t.y + o * o * n.y };
}), Tn = (e, t, n, i, s = 16) => Array.from({ length: s }, (r, o) => {
  const a = Math.PI * 2 * o / s;
  return { x: e + Math.cos(a) * n, y: t + Math.sin(a) * i };
}), $s = 0.05;
function yf(e, t, n, i) {
  const s = Math.max(1, Math.min(i * 0.6, 0.14 * t.rx)), r = (y, b) => je(t, y, b).points, o = (y, b) => je(t, [], { x: y, y: b }).facing, a = lt(n, "smile", 0), l = lt(n, "blink", 0), h = lt(n, "lookX", 0), c = lt(n, "lookY", 0), f = lt(n, "browTilt", 0);
  for (const y of [1, -1]) {
    const b = y === 1 ? "left" : "right", w = ff * y;
    if (o(w, ft) < $s) continue;
    const S = { x: w, y: ft }, v = df(lt(n, `eye.${b}`, 1), l);
    if (v < 0.2) {
      const M = a > 0.5 ? 0.12 : -0.06;
      e.line(r(Te({ x: w - 0.12, y: ft }, { x: w, y: ft + M }, { x: w + 0.12, y: ft }), S), s);
    } else {
      if (v > 1.2) {
        const E = 0.13 * v;
        e.shape(r(Tn(w, ft, E * 0.85, E), S), "#ffffff", s);
      }
      const M = v > 1.2 ? 0.075 : 0.1, A = w + h * 0.08, x = ft - c * 0.07;
      e.shape(r(Tn(A, x, M, M * 1.1 * Math.min(v, 1)), S), e.ink, 0);
    }
    const k = ft + 0.3 + lt(n, `brow.${b}`, 0) * 0.14 + Math.max(0, v - 1) * 0.12, T = { x: w + y * 0.13, y: k }, P = { x: w - y * 0.13, y: k + f * 0.1 };
    e.line(r([T, { x: (T.x + P.x) / 2, y: (T.y + P.y) / 2 }, P], { x: w, y: k }), s);
  }
  const u = { x: 0, y: rt };
  if (o(0, rt) < -$s) return;
  const p = 0.25 * Math.max(0.3, lt(n, "mouthWidth", 1)), m = Math.min(1, Math.max(0, lt(n, "mouth", 0)));
  if (m <= 0.05) {
    e.line(r(Te({ x: -p, y: rt }, { x: 0, y: rt - a * 0.25 }, { x: p, y: rt }), u), s);
    return;
  }
  const d = 0.3 * m;
  let g;
  if (a > 0.3) {
    const y = rt + 0.05;
    g = [...Te({ x: p, y }, { x: 0, y: rt - d * 2 }, { x: -p, y })];
  } else if (a < -0.3) {
    const y = rt - d * 0.6;
    g = [...Te({ x: p, y }, { x: 0, y: rt + d * 1.4 }, { x: -p, y })];
  } else
    g = Tn(0, rt, p * 0.8, d);
  e.shape(r(g, u), e.ink, 0);
}
function bf(e = {}) {
  const t = (e.proportions ?? "bold") === "bold", n = e.figure ?? "fluid", i = e.look ?? "clean", s = e.height ?? 300, r = n === "stick";
  return {
    plan: e.plan ?? sf({
      headSize: e.headSize ?? (t ? 0.3 : 0.24),
      shoulderWidth: r ? 0 : e.shoulderWidth ?? 0.06,
      hipWidth: r ? 0 : e.hipWidth ?? 0.022
    }),
    figure: n,
    look: i,
    height: s,
    lineWidth: e.lineWidth ?? s * (t ? 0.045 : 0.022),
    ink: e.ink ?? (i === "pencil" ? "#2f2f33" : "#1e293b"),
    skin: e.skin ?? (i === "pencil" ? "none" : "#ffffff"),
    seed: e.seed ?? 1,
    pencil: e.pencil ?? {},
    layers: e.layers ?? {},
    contact: e.contact ?? "ground",
    hands: e.hands ?? "dot",
    handStyle: e.handStyle ?? "glove",
    handSize: e.handSize ?? (e.handStyle === "natural" ? 0.14 : 0.17)
  };
}
function o0(e, t, n, i) {
  const { point: s, facing: r } = so(e, [t, n, i]);
  return { point: s, facing: r };
}
const jn = (e) => e.rest[1] < -0.5, wf = 0.3;
function vf(e, t, n) {
  return e.figure === "stick" ? jn(t) ? n.slice(0, 3) : n : jn(t) && n.length >= 3 ? Wt(n[0], n[1], n[2], wf) : n.length === 3 ? Wt(n[0], n[1], n[2], 1) : n;
}
function Mi(e, t) {
  const n = e.plan.id === "human" ? { ...V, ...t } : t;
  return Ti(e, n, ki(e.plan, n, { height: e.height, contact: e.contact }));
}
function Ti(e, t, n) {
  const i = {}, s = {}, r = {}, o = 0.01 * e.height;
  e.plan.chains.forEach((u) => {
    const p = n.chains[u.id];
    i[u.id] = p.points;
    const m = p.depths.reduce((b, w) => b + w, 0) / p.depths.length, d = u.parent ? n.chains[u.parent] : void 0, g = d ? d.depths[u.at ?? d.depths.length - 1] : 0, y = m - g;
    r[u.id] = Math.abs(y) < o ? 0 : y, s[u.id] = { points: vf(e, u, p.points), depth: m };
  }), s.head = { points: [n.head.center], depth: n.head.depth }, r.head = 0;
  const a = [...e.plan.chains.map((u) => u.id), "head"], l = [...a].sort((u, p) => r[u] - r[p] || a.indexOf(u) - a.indexOf(p)), h = { hip: n.hip };
  for (const [u, [p, m]] of Object.entries(e.plan.landmarks ?? {})) {
    const d = n.chains[p]?.points;
    d && (h[u] = d[Math.min(m, d.length - 1)]);
  }
  const c = {};
  for (const [u, p] of Object.entries(h)) c[u] = p.y >= n.groundY - 0.01 * e.height;
  const f = {
    height: e.height,
    lineWidth: e.lineWidth,
    turn: t.turn ?? 0,
    points: h,
    chains: i,
    parts: s,
    head: n.head,
    groundY: n.groundY,
    grounded: c
  };
  return { skeleton: n, joints: f, order: l };
}
function kf(e, t) {
  return Mi(e, t).joints;
}
function Sf(e, t, n) {
  const { head: i } = n;
  e.guideEllipse(i.center.x, i.center.y, i.rx * 1.03, i.ry * 1.03, i.angle);
  const s = Array.from({ length: 13 }, (l, h) => ({ x: 0, y: -0.95 + 1.9 * h / 12 })), r = Array.from({ length: 13 }, (l, h) => ({ x: -0.95 + 1.9 * h / 12, y: 0.12 })), o = je(i, s, { x: 0, y: 0 });
  o.facing > 0 && e.guide(o.points), e.guide(je(i, r, { x: 0, y: 0.12 }).points), e.guide(n.chains.spine ?? []);
  const a = t.lineWidth * 0.9;
  for (const l of ["shoulder.left", "shoulder.right", "elbow.left", "elbow.right", "hip.left", "hip.right", "knee.left", "knee.right"]) {
    const h = n.points[l];
    h && e.guideEllipse(h.x, h.y, a, a, 0);
  }
}
function Mf(e, t, n, i, s, r) {
  const o = n.lineWidth;
  if (s === "head") {
    const { head: p } = i, m = n.skin === "none" ? null : n.skin;
    t.ellipse(p.center.x, p.center.y, p.rx, p.ry, p.angle, m, o), t.look !== "silhouette" && yf(t, p, r, o);
    return;
  }
  const a = n.plan.chains.find((p) => p.id === s), l = i.chains[s], h = i.parts[s].points;
  if (n.figure === "stick") {
    if (s === "neck") return;
    const p = s === "spine" ? [...l, ...i.chains.neck?.slice(1) ?? []] : h;
    t.line(p, o);
    return;
  }
  const c = (p, m) => [a.bones[p].width[0] * o, a.bones[m].width[1] * o];
  if (jn(a)) {
    const [p, m] = c(0, 1);
    if (t.limb(h, p, m), a.bones.length >= 3)
      t.limb([l[2], l[3]], a.bones[2].width[0] * o, a.bones[2].width[1] * o);
    else if (n.hands === "cartoon" && s.startsWith("arm."))
      xf(e, t, n, l, s.endsWith(".left") ? "left" : "right", r);
    else {
      const d = l[l.length - 1];
      t.dot(d.x, d.y, o * 0.62);
    }
    return;
  }
  if (s === "spine") {
    const p = i.points["hip.left"], m = i.points["hip.right"];
    p && m && Math.hypot(p.x - m.x, p.y - m.y) > 0.5 && t.limb([p, m], o * 1.3, o * 1.3);
    const [d, g] = c(0, a.bones.length - 1);
    t.limb(h, d, g);
    const y = i.points["shoulder.left"], b = i.points["shoulder.right"];
    y && b && Math.hypot(y.x - b.x, y.y - b.y) > 0.5 && t.limb(Wt(y, l[l.length - 1], b, 1, 10), o * 1.15, o * 1.15);
    return;
  }
  const [f, u] = c(0, a.bones.length - 1);
  t.limb(h, f, u);
}
function Tf(e, t) {
  const n = `hand.${t}.`, i = {};
  for (const [o, a] of Object.entries(e)) o.startsWith(n) && (i[o.slice(n.length)] = a);
  const s = e.turn ?? 0, r = t === "right" ? 1 - s : 1 + s;
  return { ...W, ...i, turn: r + (i.turn ?? 0) };
}
function xf(e, t, n, i, s, r) {
  const o = i[i.length - 1], a = i[i.length - 2], l = Math.atan2(o.x - a.x, -(o.y - a.y)) * 180 / Math.PI;
  di(e, o, Tf(r, s), {
    size: n.handSize * n.height,
    side: s,
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
function Ef(e, t, n, i = 0) {
  const s = t.plan.id === "human" ? { ...V, ...n } : n;
  ao(e, t, s, Mi(t, s), i);
}
function oo(e, t) {
  const n = t / e.height;
  return { ...e, height: t, lineWidth: e.lineWidth * n };
}
function a0(e, t, n, i) {
  const s = e.plan.id === "human" ? { ...V, ...t } : t, r = io(e.plan, s, { height: i.height, contact: e.contact }, n);
  return Ti(oo(e, r.height), s, r).joints;
}
function Af(e, t, n, i, s) {
  const r = t.plan.id === "human" ? { ...V, ...n } : n, o = io(t.plan, r, { height: s.height, contact: t.contact }, i), a = oo(t, o.height);
  ao(e, a, r, Ti(a, r, o), s.time ?? 0);
}
function ao(e, t, n, i, s) {
  const { joints: r, order: o } = i, a = Rr(e, {
    look: t.look,
    ink: t.ink,
    lineWidth: t.lineWidth,
    seed: t.seed,
    time: s,
    pencil: t.pencil
  }), l = (h) => {
    h && (e.save(), h(e, r, a, s), e.restore());
  };
  e.save(), e.lineCap = "round", e.lineJoin = "round", t.look === "pencil" && t.pencil.construction !== !1 && Sf(a, t, r), l(t.layers.behind);
  for (const h of o) {
    const c = t.layers.parts?.[h];
    l(c?.under), Mf(e, a, t, r, h, n), l(c?.over);
  }
  l(t.layers.front), e.restore();
}
function l0(e, t, n) {
  const i = { ...e };
  for (const [s, r] of Object.entries(t)) {
    const o = e[s] ?? r;
    i[s] = o + (r - o) * n;
  }
  return i;
}
function h0(e, t, n, i) {
  const s = e.plan.id === "human" ? { ...V, ...t } : t;
  let r;
  if (Array.isArray(i))
    r = i;
  else {
    const { skeleton: o } = Mi(e, s), a = ki(e.plan, { ...s, roll: 0 }, { height: e.height, contact: "none" }), l = (s.roll ?? 0) * Math.PI / 180, h = i.x - o.hip.x, c = i.y - o.hip.y, f = a.hip.x + h * Math.cos(-l) - c * Math.sin(-l), u = a.hip.y + h * Math.sin(-l) + c * Math.cos(-l), p = Math.PI / 2 * (s.turn ?? 0), m = i.depth ?? o.chains[n].depths[o.chains[n].depths.length - 1], d = Math.cos(p), g = Math.sin(p);
    r = [f * d - m * g, -u, f * g + m * d];
  }
  return uf(e.plan, s, n, r, { height: e.height });
}
function c0(e) {
  const { character: t } = e, n = t.height * 0.8, i = t.height, s = t.plan.id === "human" ? V : {};
  return {
    type: "custom",
    x: e.x - n / 2,
    y: e.y - i,
    width: n,
    height: i,
    props: { ...s, ...e.pose },
    character: t,
    draw(r, o, a) {
      r.translate(n / 2, i), Ef(r, t, o.props, a);
    }
  };
}
function Pf(e, t, n) {
  const i = (r) => ({ x: r.x + t, y: r.y + n }), s = (r) => Object.fromEntries(Object.entries(r).map(([o, a]) => [o, a.map(i)]));
  return {
    ...e,
    points: Object.fromEntries(Object.entries(e.points).map(([r, o]) => [r, i(o)])),
    chains: s(e.chains),
    parts: Object.fromEntries(Object.entries(e.parts).map(([r, o]) => [r, { ...o, points: o.points.map(i) }])),
    head: { ...e.head, center: i(e.head.center) },
    groundY: e.groundY + n
  };
}
function u0(e, t, n) {
  const i = e.character;
  if (!i) throw new Error("characterAt: the target was not made by characterTarget");
  const s = { ...e.props };
  let r = 0, o = 0;
  for (const [l, h] of t.state?.values.get(n) ?? [])
    typeof h == "number" && (l === "x" || l === "motionPathX" ? r = h : l === "y" || l === "motionPathY" ? o = h : l in s && (s[l] = h));
  const a = kf(i, s);
  return { pose: s, joints: Pf(a, e.x + r + e.width / 2, e.y + o + e.height) };
}
function lo(e, t = V) {
  const n = [];
  return e.forEach((i, s) => {
    const r = s === 0 ? t : n[s - 1], o = typeof i.pose == "string" ? nf[i.pose] : void 0;
    n.push(o ? { ...o, turn: r.turn ?? 0 } : { ...r, ...i.pose });
  }), n;
}
function f0(e, t, n = V) {
  const i = lo(t, n);
  return Object.keys(n).filter((r) => i.some((o) => (o[r] ?? n[r]) !== n[r])).map((r) => ({
    id: `${e}-${r}`,
    target: e,
    property: r,
    keyframes: t.map((o, a) => ({
      time: o.time,
      value: i[a][r] ?? n[r],
      ...o.easing ? { easing: o.easing } : {}
    }))
  }));
}
const _f = /* @__PURE__ */ new Set([
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
]), Hf = 1.7;
function If(e, t, n) {
  const i = Array.from({ length: 24 }, (s, r) => {
    const o = r / 24 * Math.PI * 2, a = t.toView([Math.cos(o) * n, 0, Math.sin(o) * n * 0.8]);
    return a[2] < -1e-3 ? t.toScreen(a) : null;
  });
  i.some((s) => s === null) || (e.beginPath(), i.forEach((s, r) => r === 0 ? e.moveTo(s.x, s.y) : e.lineTo(s.x, s.y)), e.closePath(), e.fillStyle = "rgba(0, 0, 0, 0.22)", e.fill());
}
function Cf(e) {
  const t = ee([0, 1, 0], e);
  if (t > 0.999999) return fr();
  if (t < -0.999999) return oe(Lt([1, 0, 0], 180));
  const n = Fe([0, 1, 0], e);
  return oe(Lt(n, Math.acos(t) * 180 / Math.PI));
}
function $f(e, t, n, i, s) {
  const r = e.solid ?? {}, o = r.outline === !1 ? void 0 : r.outline ?? { width: 2, color: "#0f172a" }, a = { color: r.color ?? "#475569", shading: r.shading ?? "toon", outline: o }, l = { color: r.skin ?? "#f2c49b", shading: r.shading ?? "toon", outline: o }, h = { color: "#0f172a", shading: "unlit" }, c = i.height * 0.034, f = [], u = (w, S, v) => f.push({ mesh: w, world: bt(s, S), material: v }), p = (w, S, v) => u(t.sphere, pr(w, [0, 0, 0, 1], [S, S, S]), v);
  for (const w of n.chains) {
    const S = i.chains[w.id], v = w.id === "spine" ? 1.9 : 1;
    w.bones.forEach((k, T) => {
      const P = S[T], M = S[T + 1], A = cr(P, M), [x, E] = k.width ?? [1, 1], _ = c * v * (x + E) / 2;
      if (A > 1e-6) {
        const H = ur(P, M, 0.5), I = Cf(re(tn(M, P)));
        u(t.cylinder, bt(dr(H), bt(I, _e([_, A, _]))), a);
      }
      p(P, c * v * x, a), p(M, c * v * E, a);
    }), w.id.startsWith("arm.") && p(S[S.length - 1], c * 1.5, l);
  }
  const { center: m, rx: d, ry: g, axes: y } = i.head, b = [...y[0], 0, ...y[1], 0, ...y[2], 0, ...m, 1];
  u(t.sphere, bt(b, _e([d, g, d])), l);
  for (const w of [-1, 1]) {
    const S = re([w * 0.36, 0.15, 0.92]), v = Pe(m, Pe(Pe(te(y[0], S[0] * d * 1.04), te(y[1], S[1] * g * 1.04)), te(y[2], S[2] * d * 1.04))), k = [...y[0], 0, ...y[1], 0, ...y[2], 0, ...v, 1];
    u(t.sphere, bt(k, _e([d * 0.11, g * 0.14, d * 0.03])), h);
  }
  return f;
}
const d0 = {
  kind: "character",
  validate(e) {
    const t = e;
    return t.height !== void 0 && !(t.height > 0) ? ["a character's height must be positive"] : [];
  },
  prepare(e) {
    return {
      who: bf({ ...e.character, height: 1 }),
      cylinder: Is(cf(1, 1, 16)),
      sphere: Is(hf(1, 20))
    };
  },
  resolve({ object: e, prepared: t, values: n, world: i, camera: s, toScreen: r }) {
    const o = e, a = t, l = a.who, h = { ...V, ...o.pose };
    for (const [g, y] of n)
      typeof y == "number" && !_f.has(g) && (h[g] = y);
    const c = o.height ?? Hf, f = bt(s.view, i), u = {
      toView: (g) => mr(f, g),
      toScreen: (g) => r(g)
    }, m = -u.toView([0, c / 2, 0])[2];
    if (m <= s.near) return null;
    const d = o.shadow === !1 ? [] : [{ depth: m + c, draw: (g) => If(g, u, c * 0.18) }];
    if (o.look === "solid") {
      const g = no(l.plan, h, { height: c, contact: l.contact });
      return { meshes: $f(o, a, l.plan, g, i), drawables: d };
    }
    return {
      drawables: [
        ...d,
        {
          depth: m,
          draw(g, y) {
            g.lineCap = "round", g.lineJoin = "round", Af(g, l, h, u, { height: c, time: y.time });
          }
        }
      ]
    };
  }
};
function Rf(e, t, n = {}, i) {
  const s = n.length ?? 240, r = 9, o = 28, a = s - 22;
  e.save(), e.translate(t.x, t.y), e.rotate((n.angle ?? -30) * Math.PI / 180), e.fillStyle = n.color ?? "#f4c542", e.fillRect(o, -r, a - o, 2 * r), e.fillStyle = "#e8b4a0", e.fillRect(a, -r, s - a, 2 * r), e.fillStyle = "#f1dcbf", e.beginPath(), e.moveTo(0, 0), e.lineTo(o, -r), e.lineTo(o, r), e.closePath(), e.fill(), e.fillStyle = n.outline ?? "#2f2f33", e.beginPath(), e.moveTo(0, 0), e.lineTo(o * 0.35, -r * 0.35), e.lineTo(o * 0.35, r * 0.35), e.closePath(), e.fill(), e.strokeStyle = n.outline ?? "#2f2f33", e.lineWidth = 3, e.lineJoin = "round", e.lineCap = "round";
  const l = [
    [{ x: 0, y: 0 }, { x: o, y: -r }, { x: s, y: -r }, { x: s, y: r }, { x: o, y: r }, { x: 0, y: 0 }],
    [{ x: o, y: -r }, { x: o, y: r }],
    [{ x: a, y: -r }, { x: a, y: r }]
  ];
  for (const h of l) fo(e, h, i);
  e.restore();
}
function ho(e, t, n = {}, i) {
  const s = n.length ?? 90, r = n.thickness ?? 34;
  e.save(), e.translate(t.x, t.y), e.rotate((n.angle ?? -35) * Math.PI / 180);
  const o = -r / 2;
  e.fillStyle = n.color ?? "#f4a7b9", e.fillRect(0, o, s, r), e.fillStyle = "#e9edf2", e.fillRect(s * 0.45, o, s * 0.55, r), e.strokeStyle = n.outline ?? "#2f2f33", e.lineWidth = 3, e.lineJoin = "round";
  const a = [
    { x: 0, y: o },
    { x: s, y: o },
    { x: s, y: -o },
    { x: 0, y: -o },
    { x: 0, y: o }
  ], l = [{ x: s * 0.45, y: o }, { x: s * 0.45, y: -o }];
  if (i)
    i.line(a), i.line(l);
  else
    for (const h of [a, l]) {
      e.beginPath(), e.moveTo(h[0].x, h[0].y);
      for (const c of h.slice(1)) e.lineTo(c.x, c.y);
      e.stroke();
    }
  e.restore();
}
const co = 150, Lf = { pencil: 44, eraser: 30 };
function uo(e, t, n = {}, i) {
  const s = n.tool ?? "pencil", r = n.skin ?? "#f1c9a5", o = n.outline ?? "#2f2f33", a = n.scale ?? 1, l = Math.min(1, Math.max(0, n.lift ?? 0)), h = (n.angle ?? -30) * Math.PI / 180, c = i ? i.nudge(0.6) : { x: 0, y: 0 }, f = co * a * (1 + 0.05 * l);
  l > 0 && (e.save(), e.fillStyle = o, e.globalAlpha = 0.15 * l, e.beginPath(), e.ellipse(t.x, t.y, 9 * a, 4 * a, 0, 0, Math.PI * 2), e.fill(), e.restore());
  const u = { x: t.x + c.x + 6 * l * a, y: t.y + c.y - 18 * l * a }, p = Y.pencilGrip, m = (T) => {
    const P = T.fingers.thumb, M = T.fingers.index, A = T.fingers.middle, x = Rs([P.points[3], M.points[3], A.points[3]]), E = Rs([P.points[1], M.points[0]]), _ = (P.depths[3] + M.depths[3] + A.depths[3]) / 3;
    return { pinch: x, direction: Math.atan2(E.y - x.y, E.x - x.x), depth: _ };
  }, d = Kn(p, { size: f }), g = h - m(d).direction, y = Kn(p, { size: f, angle: g * 180 / Math.PI }), b = m(y), w = Lf[s] * a, S = { x: b.pinch.x - Math.cos(h) * w, y: b.pinch.y - Math.sin(h) * w }, v = { x: u.x - S.x, y: u.y - S.y }, k = y.axes.up;
  Of(e, v, { x: -k.x, y: -k.y }, f, n.arm ?? 300 * a, r, n.sleeve ?? "#5b7db1", o), di(e, v, p, {
    size: f,
    angle: g * 180 / Math.PI,
    skin: r,
    ink: o,
    lineWidth: 3 * a,
    prop: {
      depth: b.depth,
      draw: () => {
        e.save(), e.translate(u.x, u.y), e.scale(a, a), s === "eraser" ? ho(e, { x: 0, y: 0 }, { angle: h * 180 / Math.PI, outline: o }, i) : Rf(e, { x: 0, y: 0 }, { angle: h * 180 / Math.PI, length: 190, outline: o }, i), e.restore();
      }
    }
  });
}
const Rs = (e) => ({
  x: e.reduce((t, n) => t + n.x, 0) / e.length,
  y: e.reduce((t, n) => t + n.y, 0) / e.length
});
function Of(e, t, n, i, s, r, o, a) {
  const l = { x: -n.y, y: n.x }, h = i * 0.15, c = (d, g, y) => ({
    x: t.x + n.x * d + l.x * g * y,
    y: t.y + n.y * d + l.y * g * y
  }), f = c(s, 0, 0), u = (d) => {
    const g = e.createLinearGradient(t.x, t.y, f.x, f.y);
    return g.addColorStop(0, d), g.addColorStop(0.6, d), g.addColorStop(1, Ff(d)), g;
  }, p = Math.min(i * 0.55, s * 0.35);
  e.save(), e.lineJoin = "round", e.lineCap = "round", e.lineWidth = 3 * (i / co), e.beginPath(), e.moveTo(c(-i * 0.1, -1, h).x, c(-i * 0.1, -1, h).y), e.lineTo(c(p + 4, -1, h * 1.1).x, c(p + 4, -1, h * 1.1).y), e.lineTo(c(p + 4, 1, h * 1.1).x, c(p + 4, 1, h * 1.1).y), e.lineTo(c(-i * 0.1, 1, h).x, c(-i * 0.1, 1, h).y), e.closePath(), e.fillStyle = r, e.fill(), e.strokeStyle = a, e.beginPath(), e.moveTo(c(0, -1, h).x, c(0, -1, h).y), e.lineTo(c(p, -1, h * 1.1).x, c(p, -1, h * 1.1).y), e.moveTo(c(0, 1, h).x, c(0, 1, h).y), e.lineTo(c(p, 1, h * 1.1).x, c(p, 1, h * 1.1).y), e.stroke();
  const m = [c(p, -1, h * 1.3), c(s, -1, h * 1.5), c(s, 1, h * 1.5), c(p, 1, h * 1.3)];
  e.beginPath(), m.forEach((d, g) => g ? e.lineTo(d.x, d.y) : e.moveTo(d.x, d.y)), e.closePath(), e.fillStyle = u(o), e.fill(), e.strokeStyle = u(a), e.beginPath(), e.moveTo(m[1].x, m[1].y), e.lineTo(m[0].x, m[0].y), e.lineTo(m[3].x, m[3].y), e.lineTo(m[2].x, m[2].y), e.stroke(), e.restore();
}
function p0(e, t, n = {}) {
  const i = n.offstage ?? { x: 2e3, y: 1400 }, s = n.enter ?? 450, r = n.exit ?? 450, o = n.linger ?? 1500, a = [...e].filter((d) => d.path.length > 0).sort((d, g) => d.start - g.start), l = (d) => d.tool ?? "pencil", h = (d) => {
    const g = Math.min(1, Math.max(0, d));
    return g * g * (3 - 2 * g);
  }, c = (d, g, y) => ({ x: d.x + (g.x - d.x) * y, y: d.y + (g.y - d.y) * y }), f = a.find((d) => t >= d.start && t <= d.end);
  if (f) {
    const d = f.end - f.start, g = d > 0 ? (t - f.start) / d : 1;
    return { at: ui(f.path, g), tool: l(f), lift: 0, drawing: !0 };
  }
  const u = [...a].reverse().find((d) => d.end < t), p = a.find((d) => d.start > t), m = (d) => d.path[d.path.length - 1];
  if (u && p && p.start - u.end <= o) {
    const d = (t - u.end) / (p.start - u.end), g = d < 0.5 ? l(u) : l(p);
    return { at: c(m(u), p.path[0], h(d)), tool: g, lift: Math.sin(Math.PI * d), drawing: !1 };
  }
  if (p && p.start - t <= s) {
    const d = 1 - (p.start - t) / s;
    return { at: c(i, p.path[0], h(d)), tool: l(p), lift: 1 - h(d), drawing: !1 };
  }
  if (u && t - u.end <= r) {
    const d = (t - u.end) / r;
    return { at: c(m(u), i, h(d)), tool: l(u), lift: h(d), drawing: !1 };
  }
  return null;
}
function m0(e, t, n, i = 0.08, s = 32) {
  const r = Math.PI * 2 * (1 + i), o = [];
  for (let a = 0; a <= s; a++) {
    const l = -Math.PI / 2 + r * a / s;
    o.push({ x: e + Math.cos(l) * n, y: t + Math.sin(l) * n });
  }
  return o;
}
function g0(e) {
  const { path: t } = e, n = t.map((a) => a.x), i = t.map((a) => a.y), s = Math.min(...n), r = Math.min(...i), o = e.hand === !1 ? void 0 : e.hand === !0 || e.hand === void 0 ? {} : e.hand;
  return {
    type: "custom",
    x: s,
    y: r,
    width: Math.max(1, Math.max(...n) - s),
    height: Math.max(1, Math.max(...i) - r),
    props: { draw: 0 },
    draw(a, l, h) {
      const c = Math.min(1, Math.max(0, Number(l.props?.draw ?? 0)));
      a.translate(-s, -r), a.strokeStyle = e.color ?? "#2f2f33", a.lineWidth = e.lineWidth ?? 5, a.lineCap = "round", a.lineJoin = "round";
      const f = e.sketch ? Dn(a, e.sketch, h) : void 0;
      c > 0 && (f ? e.smooth ? f.curve(t, c) : f.line(t, c) : fo(a, le(t, c))), o && c > 0 && c < 1 && uo(a, ui(t, c), o, f);
    }
  };
}
function Ff(e) {
  const t = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(e.trim());
  if (!t) return "rgba(0, 0, 0, 0)";
  const n = t[1].length === 3 ? [...t[1]].map((o) => o + o).join("") : t[1], [i, s, r] = [0, 2, 4].map((o) => parseInt(n.slice(o, o + 2), 16));
  return `rgba(${i}, ${s}, ${r}, 0)`;
}
function fo(e, t, n) {
  if (!(t.length < 2)) {
    if (n) return n.line(t);
    e.beginPath(), e.moveTo(t[0].x, t[0].y);
    for (const i of t.slice(1)) e.lineTo(i.x, i.y);
    e.stroke();
  }
}
const xe = 1e5;
function y0(e, t, n, i, s = 6) {
  const r = [], o = Math.max(1, Math.round(s));
  for (let a = 0; a <= o; a++)
    r.push({ x: a % 2 === 0 ? e : e + n, y: t + i * a / o });
  return r;
}
function po(e, t, n, i) {
  if (i <= 0 || t.length === 0) return;
  const s = le(t, i), r = n / 2, o = (a) => {
    e.beginPath(), e.rect(-xe, -xe, 2 * xe, 2 * xe), a(), e.clip("evenodd");
  };
  for (const a of s)
    o(() => {
      e.moveTo(a.x + r, a.y), e.arc(a.x, a.y, r, 0, Math.PI * 2);
    });
  for (let a = 1; a < s.length; a++) {
    const l = s[a - 1], h = s[a], c = Math.hypot(h.x - l.x, h.y - l.y);
    if (c === 0) continue;
    const f = -(h.y - l.y) / c * r, u = (h.x - l.x) / c * r;
    o(() => {
      e.moveTo(l.x + f, l.y + u), e.lineTo(h.x + f, h.y + u), e.lineTo(h.x - f, h.y - u), e.lineTo(l.x - f, l.y - u), e.closePath();
    });
  }
}
function b0(e, t, n, i, s) {
  e.save(), po(e, t, n, i), s(), e.restore();
}
function w0(e, t) {
  const n = t.width ?? 40, i = t.hand === !0 ? {} : t.hand || void 0, s = t.eraser === !1 ? void 0 : t.eraser === !0 || t.eraser === void 0 ? {} : t.eraser;
  return {
    ...e,
    props: { ...e.props, erase: 0 },
    draw(r, o, a) {
      const l = Number(o.props?.erase ?? 0);
      if (r.save(), po(r, t.path, n, l), e.draw(r, o, a), r.restore(), !s || l <= 0 || l >= 1) return;
      const h = ui(t.path, l);
      i ? uo(r, h, { ...i, tool: "eraser" }) : ho(r, h, s);
    }
  };
}
const Bf = (e, t, n) => e.slice(Math.floor((e.length - 1) * t), Math.ceil((e.length - 1) * n) + 1);
function v0(e = {}) {
  const t = e.shirt ?? "#e2493b", n = e.trousers ?? "#24476b", i = (a) => a.lineWidth * 0.45, s = (a, l, h) => {
    const c = a.parts[`leg.${h}`].points;
    l.shape(Ie(c, a.height * 0.08, a.height * 0.05), n, i(a));
  }, r = (a, l) => {
    const h = a.chains.spine, c = h[0], f = h[h.length - 1], u = { x: c.x - (f.x - c.x) * 0.25, y: c.y - (f.y - c.y) * 0.25 };
    l.shape(Ie([u, ...a.parts.spine.points], a.height * 0.15, a.height * 0.14), t, i(a));
  }, o = (a, l, h) => {
    const c = a.parts[`arm.${h}`].points, f = c[0], u = a.chains.spine[a.chains.spine.length - 1], m = [{ x: f.x + (u.x - f.x) * 0.45, y: f.y + (u.y - f.y) * 0.45 }, ...Bf(c, 0, 0.45)], d = Ie(m, a.height * 0.085, a.height * 0.06), g = m.length, y = d.slice(0, g), b = d.slice(g).reverse();
    l.shape(d, t, 0);
    const w = (k) => Math.hypot(k[1].x - u.x, k[1].y - u.y), [S, v] = w(y) > w(b) ? [y, b] : [b, y];
    l.line(S.slice(1), i(a)), l.line(v.slice(Math.ceil(g * 0.45)), i(a)), l.line([y[g - 1], b[g - 1]], i(a));
  };
  return {
    parts: {
      "leg.left": { over: (a, l, h) => s(l, h, "left") },
      "leg.right": { over: (a, l, h) => s(l, h, "right") },
      spine: { over: (a, l, h) => r(l, h) },
      "arm.left": { over: (a, l, h) => o(l, h, "left") },
      "arm.right": { over: (a, l, h) => o(l, h, "right") }
    }
  };
}
const xn = {
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
function Df(e) {
  if (e === void 0) return xn.full;
  if (typeof e == "string") return xn[e];
  const { base: t, ...n } = e;
  return { ...xn[t ?? "full"], ...n };
}
const Gn = 160, Wf = 120, Nf = 700, En = 60, Kf = 90, Ee = 3200, Ot = 1, kt = 1e-6;
function mo(e, t, n = {}) {
  const i = Df(n.style), s = n.seed ?? 1, r = {};
  if (e.length === 0) return r;
  const o = Object.keys(e[0].pose).filter((u) => e.some((p) => Math.abs(p.pose[u] - e[0].pose[u]) > kt)), a = Math.min(1 / 0, ...e.slice(1).map((u, p) => u.time - e[p].time));
  for (const u of o) r[u] = Yf(u, e, t, i, s, a);
  const l = t.blink, h = l !== void 0 && o.includes(l);
  if (i.blinks && l !== void 0 && !h && l in e[0].pose) {
    const u = qf(e, t, i, s, e[0].pose[l]);
    u.length > 0 && (r[l] = u);
  }
  const { lift: c, stretch: f } = t;
  if (i.jumpSquash > 0 && c && f && o.includes(c) && !o.includes(f) && f in e[0].pose) {
    const u = Xf(e, c, e[0].pose[f], i.jumpSquash);
    u.length > 0 && (r[f] = u);
  }
  return r;
}
function Yf(e, t, n, i, s, r) {
  const o = n.eyes.includes(e), a = n.limits[e], l = a !== void 0, h = Number.isFinite(r) ? r / 4 : 0, c = o ? -i.eyeLead : (n.depth[e] ?? 1) * i.overlap, f = Math.max(-h, Math.min(h, c)), u = [{ time: t[0].time, value: t[0].pose[e] }], p = (d, g, y) => {
    const b = u[u.length - 1];
    if (d <= b.time + Ot) {
      u[u.length - 1] = { ...b, value: g, ...y ? { easing: y } : {} };
      return;
    }
    u.push({ time: d, value: g, ...y ? { easing: y } : {} });
  };
  let m = t[0].pose[e];
  for (let d = 1; d < t.length; d++) {
    const g = t[d], y = t[d - 1].pose[e], b = g.pose[e], w = b - y, S = u[u.length - 1].time, v = g.act !== !1;
    if (Math.abs(w) <= kt) {
      const E = g.time + (v ? f : 0);
      if (d === t.length - 1)
        Math.abs(m - b) > kt && p(Math.max(E, S + Gn), b, "ease-in-out"), m = b;
      else if (v && l && i.drift > 0 && n.drift.includes(e) && E - S >= Nf) {
        const _ = pe(`${s}:${e}:${d}`) % 2 === 0 ? 1 : -1;
        m = b + _ * i.drift * a, p(E, m, "ease-in-out");
      }
      continue;
    }
    if (!v) {
      p(t[d - 1].time, m), p(g.time, b, g.easing), m = b;
      continue;
    }
    const k = Math.max(t[d - 1].time + f, S);
    let T = g.time + f;
    o && i.eyeDart > 0 && (T = Math.min(T, k + i.eyeDart));
    const P = T - k;
    if (P <= Ot) {
      p(g.time, b, g.easing), m = b;
      continue;
    }
    p(k, m);
    const M = Math.sign(w);
    if (l && i.anticipation > 0 && a > 0 && P >= Gn) {
      const E = m - M * Math.min(Math.abs(w) * i.anticipation, a), _ = k + P * i.anticipationTime;
      p(_, E, "ease-in-out"), i.hold > 0 && p(_ + P * i.hold, E);
    }
    const A = d + 1 < t.length ? t[d + 1].time - g.time : 1 / 0, x = Math.min(i.settle, A / 2);
    if (l && i.overshoot > 0 && a > 0 && P >= Wf && x > Ot) {
      const E = Math.min(Math.abs(w) * i.overshoot, a);
      p(T, b + M * E, g.easing ?? i.actionEase), p(T + x, b, i.settleEase);
    } else
      p(T, b, g.easing ?? i.actionEase);
    m = b;
  }
  return u;
}
function qf(e, t, n, i, s) {
  const r = [], o = En + Kf;
  for (let p = 1; p < e.length; p++) {
    const m = e[p - 1].pose, d = e[p].pose;
    Object.entries(t.headTurns).some(([y, b]) => Math.abs((d[y] ?? 0) - (m[y] ?? 0)) > b) && e[p].act !== !1 && r.push(Math.max(e[0].time, e[p - 1].time - n.eyeLead));
  }
  const a = e[0].time, l = e[e.length - 1].time, h = [...r];
  let c = a + Ee * 0.6, f = 0;
  for (; c < l; ) {
    h.some((d) => Math.abs(d - c) < Ee / 2) || r.push(c);
    const m = (pe(`${i}:blink:${f++}`) % 1e3 / 1e3 - 0.5) * (Ee * 0.66);
    c += Ee + m;
  }
  r.sort((p, m) => p - m);
  const u = [{ time: a, value: s }];
  for (const p of r) {
    const m = u[u.length - 1].time;
    p + En <= m + Ot || (p > m + Ot && u.push({ time: p, value: s }), u.push({ time: p + En, value: 1, easing: "ease-in" }), u.push({ time: p + o, value: s, easing: "ease-out" }));
  }
  return u.length > 1 ? u : [];
}
function Xf(e, t, n, i) {
  const s = n * (1 - 0.18 * i), r = n * (1 + 0.14 * i), o = [{ time: e[0].time, value: n }], a = (l, h, c) => {
    const f = o[o.length - 1];
    l <= f.time + Ot || o.push({ time: l, value: h, ...c ? { easing: c } : {} });
  };
  for (let l = 1; l < e.length; l++) {
    const h = e[l - 1].pose[t], c = e[l].pose[t], f = e[l - 1].time, u = e[l].time, p = u - f;
    if (!(p < Gn || e[l].act === !1)) {
      if (h <= kt && c > kt)
        a(f, n), a(f + p * 0.2, s, "ease-out"), a(f + p * 0.45, r, "ease-out"), a(u, n, "ease-in-out");
      else if (h > kt && c <= kt) {
        const m = l + 1 < e.length ? e[l + 1].time - u : 400;
        a(f + p * 0.5, n), a(u - Math.min(60, p * 0.15), r, "ease-in"), a(u, s, "ease-out"), a(u + Math.min(260, m / 2), n, { type: "back", mode: "out", overshoot: 1.4 });
      }
    }
  }
  return o.length > 1 ? o : [];
}
const Vf = {
  depth: {
    lean: 0,
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
  drift: ["lean", "headTilt", "leftShoulder", "rightShoulder", "leftElbow", "rightElbow"],
  lift: "rise",
  stretch: "stretch"
};
function Uf(e) {
  return /^(turn|lean|side|lift|roll|stretch)$/.test(e) ? { depth: 0, limit: { turn: 0.06, lean: 10, side: 8, lift: 0, roll: 25, stretch: 0.08 }[e] } : /^leg\.\w+\.(swing|spread|rotate)$/.test(e) ? { depth: 0, limit: 12 } : /^head\./.test(e) ? { depth: 1, limit: 12 } : /^arm\.\w+\.(swing|spread)$/.test(e) ? { depth: 1, limit: 20 } : /^leg\.\w+\.knee$/.test(e) ? { depth: 1, limit: 15 } : /^(brow\.|browTilt$)/.test(e) ? { depth: 1, limit: e === "browTilt" ? void 0 : 0.25 } : /^eye\./.test(e) ? { depth: 1, limit: 0.15 } : /^arm\.\w+\.(elbow|bend)$/.test(e) ? { depth: 2, limit: 18 } : /^leg\.\w+\.(ankle|toeOut)$/.test(e) ? { depth: 2, limit: 10 } : /^(mouth|smile|mouthWidth)$/.test(e) ? { depth: 2 } : /^hand\./.test(e) ? { depth: 3 } : { depth: 1 };
}
function zf() {
  const e = {}, t = {};
  for (const n of Object.keys(V)) {
    const i = Uf(n);
    e[n] = i.depth, i.limit !== void 0 && (t[n] = i.limit);
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
const jf = zf();
function go(e, t) {
  return Object.entries(t).map(([n, i]) => ({ id: `${e}-${n}`, target: e, property: n, keyframes: i }));
}
function k0(e, t, n = {}) {
  const i = Gr(t), s = t.map((r, o) => ({ time: r.time, pose: { ...i[o] }, easing: r.easing, act: r.act }));
  return go(e, mo(s, n.rig ?? Vf, n));
}
function S0(e, t, n = {}) {
  const i = n.rest ?? V, s = lo(t, i), r = t.map((o, a) => ({ time: o.time, pose: { ...i, ...s[a] }, easing: o.easing, act: o.act }));
  return go(e, mo(r, n.rig ?? jf, n));
}
const Ls = X.shocked, Gf = X.scared, yo = {
  /** The classic take: squash down in a squint, then shoot up stretched with eyes popping, hang, and land squashed. */
  take: (e) => [
    { after: 140, pose: { stretch: 0.8, lean: e.lean - 4, leftShoulder: 8, rightShoulder: 8, leftEye: 0.35, rightEye: 0.35, leftBrow: -0.6, rightBrow: -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { rise: 0.22, stretch: 1.35, leftShoulder: 150, rightShoulder: 150, leftElbow: 35, rightElbow: 35, leftHip: 22, rightHip: 22, leftKnee: 45, rightKnee: 45, ...Ls, headTilt: 0 }, easing: "ease-out-cubic" },
    { after: 720, pose: { rise: 0.25, stretch: 1.25, leftShoulder: 140, rightShoulder: 140 }, easing: "ease-in-out" },
    { after: 900, pose: { rise: 0, stretch: 0.74, leftShoulder: 70, rightShoulder: 70, leftHip: 18, rightHip: 18, leftKnee: 30, rightKnee: 30 }, easing: "ease-in-quad" },
    { after: 1060, pose: { stretch: 1.06, leftShoulder: 60, rightShoulder: 60, leftHip: e.leftHip, rightHip: e.rightHip, leftKnee: e.leftKnee, rightKnee: e.rightKnee }, easing: "ease-out" },
    { after: 1260, pose: { stretch: e.stretch, ...X.surprised, leftShoulder: 70, rightShoulder: 70, leftElbow: 60, rightElbow: 60 }, easing: "ease-in-out" }
  ],
  /** Glance at something, look away unbothered, then snap back to it in shock. */
  doubleTake: (e) => [
    { after: 160, pose: { lookX: 1, lookY: 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, headTilt: e.headTilt - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { headTilt: e.headTilt + 10, rise: 0.05, stretch: 1.18, ...Ls, lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { rise: 0, stretch: 0.88, headTilt: e.headTilt + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: e.stretch, headTilt: e.headTilt }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
  ],
  /** Rear back for a zip-off: lean back, one knee up, arms cocked, hold, then pitch forward ready to run. */
  windUp: () => [
    { after: 220, pose: { lean: -18, headTilt: -6, leftShoulder: 70, leftElbow: -100, rightShoulder: 40, rightElbow: 100, leftHip: -45, leftKnee: -80, stretch: 0.92, ...X.angry, lookX: 1 }, easing: "ease-out" },
    { after: 620, pose: { lean: -20, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, headTilt: 6, leftShoulder: 30, rightShoulder: 60, leftHip: 30, leftKnee: -30, rightHip: -20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down to the ground: stretched in the fall, squashed on contact, a spring back up. */
  land: (e) => [
    { after: 120, pose: { rise: 0, stretch: 0.7, leftShoulder: 75, rightShoulder: 75, leftHip: 20, rightHip: 20, leftKnee: 35, rightKnee: 35 }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, leftShoulder: e.leftShoulder, rightShoulder: e.rightShoulder }, easing: "ease-out" },
    { after: 460, pose: { rise: 0, stretch: e.stretch, leftHip: q.leftHip, rightHip: q.rightHip, leftKnee: 0, rightKnee: 0 }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: small, fast shakes with wide eyes, then still. */
  tremble: (e) => {
    const t = [{ after: 80, pose: { ...Gf, leftShoulder: 40, rightShoulder: 40, leftElbow: 110, rightElbow: 110, stretch: 0.94 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) t.push({ after: 80 + n * 45, pose: { lean: e.lean + (n % 2 === 0 ? 2.5 : -2.5), headTilt: e.headTilt + (n % 2 === 0 ? -2 : 2) } });
    return t.push({ after: 755, pose: { lean: e.lean, headTilt: e.headTilt } }), t;
  },
  /** A sigh: the body sags, shoulders drop, head and eyes go down. */
  deflate: (e) => [
    { after: 260, pose: { stretch: 1.04, headTilt: e.headTilt + 4, leftBrow: 0.3, rightBrow: 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...pi.sad, stretch: 0.92, lean: e.lean + 5, turn: e.turn, sit: e.sit }, easing: "ease-in-out" }
  ]
};
function M0(e, t) {
  const n = typeof t.from == "string" ? pi[t.from] : t.from ?? q, i = t.speed ?? 1;
  let s = n;
  return [
    // The move onto the starting pose is acted like any other; the gag itself is not.
    { time: t.at, pose: n },
    ...yo[e](n).map((r) => (s = { ...s, ...r.pose }, { time: t.at + r.after * i, pose: s, act: !1, ...r.easing ? { easing: r.easing } : {} }))
  ];
}
function T0(e, t = 1) {
  const n = yo[e](q);
  return n[n.length - 1].after * t;
}
function Jf(e, t, n = {}) {
  if (t.length < 2) return;
  const i = Math.max(1, Math.round(n.lines ?? 3)), s = n.spacing ?? 5, r = n.lineWidth ?? 2, o = n.opacity ?? 0.7;
  e.save(), e.strokeStyle = n.color ?? "#222", e.lineCap = "round";
  for (let a = 0; a < i; a++) {
    const l = (a - (i - 1) / 2) * s, h = Math.floor(Math.abs(l) / Math.max(s, 1) * (t.length / 6));
    for (let c = h + 1; c < t.length; c++) {
      const f = t[c - 1], u = t[c], p = u.x - f.x, m = u.y - f.y, d = Math.hypot(p, m) || 1, g = -m / d, y = p / d, b = 1 - c / (t.length - 1);
      e.globalAlpha = o * (1 - b), e.lineWidth = r * (1 - b * 0.7), e.beginPath(), e.moveTo(f.x + g * l, f.y + y * l), e.lineTo(u.x + g * l, u.y + y * l), e.stroke();
    }
  }
  e.restore();
}
const Zf = {
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
function x0(e, t, n, i, s = {}) {
  const r = n.stateAt;
  if (!r) return;
  const o = s.length ?? 120, a = Math.max(2, Math.round(s.samples ?? 8)), l = Math.max(0, n.time - o);
  if (n.time - l < 1) return;
  const h = [];
  for (let p = 0; p < a; p++) {
    const m = l + (n.time - l) * p / (a - 1);
    h.push(gu(t, { time: m, state: r(m) }, i).joints);
  }
  const c = h[h.length - 1].height, f = (s.threshold ?? 1.2) * c, u = (s.parts ?? ["hands", "toes", "head"]).flatMap((p) => Zf[p]);
  for (const p of u) {
    const m = h.map(p.at);
    let d = 0;
    for (let b = 1; b < m.length; b++) d += Math.hypot(m[b].x - m[b - 1].x, m[b].y - m[b - 1].y);
    const g = d / ((n.time - l) / 1e3);
    if (g <= f) continue;
    const y = Math.min(1, (g - f) / (f * 0.5));
    Jf(e, m, { ...s, opacity: (s.opacity ?? 0.7) * y, spacing: s.spacing ?? c * 0.02 });
  }
}
function E0(e, t, n, i = {}) {
  if (n <= 0 || n >= 1) return;
  const s = i.size ?? 40, r = i.seed ?? 1, o = 0.45 + 0.55 * (1 - (1 - n) ** 3);
  e.save(), e.strokeStyle = i.color ?? "#555", e.lineWidth = Math.max(1, s * 0.03), e.globalAlpha = Math.min(1, n / 0.08) * (1 - n);
  for (let a = 0; a < 5; a++) {
    const l = pe(`${r}:puff:${a}`) % 1e3 / 1e3, h = a - 2, c = t.x + h * s * 0.3 * o, f = t.y - s * (0.06 + 0.12 * l) * o + Math.abs(h) * s * 0.03, u = s * (0.11 + 0.07 * l) * o;
    e.beginPath(), e.arc(c, f, u, Math.PI * 0.95, Math.PI * 2.05), e.stroke();
  }
  e.restore();
}
function A0(e, t, n, i = {}) {
  if (n <= 0 || n >= 1) return;
  const s = i.size ?? 40, r = 5, o = 1 - (1 - n) ** 2;
  e.save(), e.strokeStyle = i.color ?? "#222", e.lineWidth = Math.max(1, s * 0.035), e.lineJoin = "round", e.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  for (let a = 0; a < r; a++) {
    const l = -Math.PI / 2 + (a - (r - 1) / 2) * Math.PI / (r + 1), h = s * (0.3 + 0.7 * o), c = t.x + Math.cos(l) * h, f = t.y + Math.sin(l) * h;
    Qf(e, c, f, s * 0.14, n * Math.PI + a), e.stroke();
  }
  e.restore();
}
function Qf(e, t, n, i, s) {
  e.beginPath();
  for (let r = 0; r < 10; r++) {
    const o = r % 2 === 0 ? i : i * 0.45, a = s + r * Math.PI / 5 - Math.PI / 2, l = t + Math.cos(a) * o, h = n + Math.sin(a) * o;
    r === 0 ? e.moveTo(l, h) : e.lineTo(l, h);
  }
  e.closePath();
}
function P0(e) {
  const { timeline: t } = e, n = new St();
  for (const [h, c] of Object.entries(e.targets)) {
    const f = typeof c == "string" ? document.querySelector(c) : c;
    if (!f)
      throw new Error(`quickPlay: no element found for target "${h}" (${String(c)})`);
    n.registerTarget(h, f);
  }
  t.onUpdate = (h) => {
    n.applyState(h), e.onUpdate?.(h);
  }, e.onComplete && (t.onComplete = e.onComplete);
  let i = null, s = null, r = !1;
  const o = (h) => {
    if (r) return;
    const c = s === null ? 0 : h - s;
    s = h, c > 0 && t.tick(c), i = requestAnimationFrame(o);
  }, a = () => {
    i !== null || r || (s = null, i = requestAnimationFrame(o));
  }, l = () => {
    i !== null && cancelAnimationFrame(i), i = null, s = null;
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
    seek(h) {
      t.seek(h * 1e3), n.applyState(t.getStateAtTime(t.currentTime));
    },
    destroy() {
      r = !0, l(), t.stop(), n.clearTargets();
    }
  };
}
const _0 = {
  timeline: Sl,
  to(e, t, n) {
    const i = new Rt(n);
    return i.to(e, t), i;
  },
  from(e, t, n) {
    const i = new Rt(n);
    return i.from(e, t), i;
  },
  fromTo(e, t, n, i) {
    const s = new Rt(i);
    return s.fromTo(e, t, n), s;
  },
  set(e, t, n) {
    const i = new Rt(n);
    return i.set(e, t), i;
  }
};
function bo(e, t, n) {
  if (typeof OffscreenCanvas < "u") return new OffscreenCanvas(t, n);
  const i = e.canvas;
  if (i?.ownerDocument) {
    const s = i.ownerDocument.createElement("canvas");
    return s.width = t, s.height = n, s;
  }
  try {
    return i?.constructor ? new i.constructor(t, n) : null;
  } catch {
    return null;
  }
}
function td(e, t) {
  const n = e.length / 4, i = new Float32Array(n * 3), s = Math.min(0.999, Math.max(0, t));
  for (let r = 0; r < n; r++) {
    const o = e[r * 4] / 255, a = e[r * 4 + 1] / 255, l = e[r * 4 + 2] / 255, h = e[r * 4 + 3] / 255, c = Math.max(o, a, l);
    if (c <= s) continue;
    const f = (c - s) / (1 - s) * h / c;
    i[r * 3] = o * f, i[r * 3 + 1] = a * f, i[r * 3 + 2] = l * f;
  }
  return i;
}
function Os(e, t, n, i, s) {
  const r = new Float32Array(e.length), o = s ? n : t, a = s ? t : n, l = (c, f) => (s ? c * t + f : f * t + c) * 3, h = i * 2 + 1;
  for (let c = 0; c < o; c++)
    for (let f = 0; f < 3; f++) {
      let u = 0;
      for (let p = -i; p <= i; p++) u += e[l(c, Math.min(a - 1, Math.max(0, p))) + f];
      for (let p = 0; p < a; p++) {
        r[l(c, p) + f] = u / h;
        const m = e[l(c, Math.max(0, p - i)) + f], d = e[l(c, Math.min(a - 1, p + i + 1)) + f];
        u += d - m;
      }
    }
  return r;
}
function Fs(e, t, n, i) {
  const s = Math.max(1, Math.round(i / Math.sqrt(3)));
  let r = e;
  for (let o = 0; o < 3; o++)
    r = Os(r, t, n, s, !0), r = Os(r, t, n, s, !1);
  return r;
}
function H0(e, t = {}) {
  const n = e.canvas, i = n.width, s = n.height;
  if (!(i > 0 && s > 0)) return;
  const r = Math.max(1, Math.round(t.downsample ?? 4)), o = Math.max(1, Math.ceil(i / r)), a = Math.max(1, Math.ceil(s / r)), l = bo(e, o, a), h = l?.getContext("2d");
  if (!l || !h) return;
  h.imageSmoothingEnabled = !0, h.drawImage(e.canvas, 0, 0, o, a);
  const c = td(h.getImageData(0, 0, o, a).data, t.threshold ?? 0.55), f = (t.radius ?? Math.max(i, s) * 0.02) / r, u = Fs(c, o, a, f), p = Fs(c, o, a, f * 3), m = t.halo ?? 0.6, d = h.createImageData(o, a);
  for (let g = 0; g < o * a; g++) {
    for (let y = 0; y < 3; y++) d.data[g * 4 + y] = Math.round(Math.min(1, u[g * 3 + y] + p[g * 3 + y] * m) * 255);
    d.data[g * 4 + 3] = 255;
  }
  h.putImageData(d, 0, 0), e.save(), e.setTransform(1, 0, 0, 1, 0, 0), e.globalCompositeOperation = "lighter", e.globalAlpha = Math.max(0, t.strength ?? 0.9), e.imageSmoothingEnabled = !0, e.drawImage(l, 0, 0, i, s), e.restore();
}
function I0(e, t, n) {
  const i = n.width ?? 6, s = n.taper ?? 1, r = n.fade ?? 1, o = n.opacity ?? 1, a = n.blend === "add";
  if (e.save(), t.length >= 2) {
    const h = nd(t, i, s, r, o);
    a ? (e.globalCompositeOperation = "lighter", Jn(e, h, n.color)) : id(e, h, n.color);
  }
  const l = t[t.length - 1];
  if (n.head && l && n.head.radius > 0) {
    a && (e.globalCompositeOperation = "lighter");
    const h = n.head.color ?? n.color, c = e.createRadialGradient(l.at.x, l.at.y, 0, l.at.x, l.at.y, n.head.radius);
    c.addColorStop(0, h), c.addColorStop(0.35, h), c.addColorStop(1, ed(e, h)), e.globalAlpha = o, e.fillStyle = c, e.beginPath(), e.arc(l.at.x, l.at.y, n.head.radius, 0, Math.PI * 2), e.fill();
  }
  e.restore();
}
function ed(e, t) {
  e.fillStyle = t;
  const n = String(e.fillStyle), i = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(n);
  if (i) return `rgba(${parseInt(i[1], 16)}, ${parseInt(i[2], 16)}, ${parseInt(i[3], 16)}, 0)`;
  const s = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(n);
  return s ? `rgba(${s[1]}, ${s[2]}, ${s[3]}, 0)` : "rgba(0, 0, 0, 0)";
}
function nd(e, t, n, i, s) {
  const r = e.map((h) => ({ x: h.at.x, y: h.at.y, width: t * (1 - n * h.age) })), o = Ua(r), a = za(r) ?? void 0, l = [];
  for (let h = 0; h + 1 < e.length; h++) {
    const c = (e[h].age + e[h + 1].age) / 2, f = s * (1 - i * c);
    if (f <= 0) continue;
    const u = h + 2 === e.length;
    l.push({ corners: [o.left[h], o.left[h + 1], o.right[h + 1], o.right[h]], alpha: f, ...u && a && { cap: a } });
  }
  return l;
}
function Jn(e, t, n) {
  e.fillStyle = n;
  for (const i of t) {
    const [s, r, o, a] = i.corners;
    e.globalAlpha = Math.min(1, i.alpha), e.beginPath(), e.moveTo(s.x, s.y), e.lineTo(r.x, r.y), i.cap && e.arc(i.cap.x, i.cap.y, i.cap.radius, i.cap.start, i.cap.start - Math.PI, !0), e.lineTo(o.x, o.y), e.lineTo(a.x, a.y), e.closePath(), e.fill();
  }
}
function id(e, t, n) {
  const i = typeof e.getTransform == "function" ? e.getTransform() : null, s = (d) => i ? { x: i.a * d.x + i.c * d.y + i.e, y: i.b * d.x + i.d * d.y + i.f } : d, r = i ? Math.sqrt(Math.abs(i.a * i.d - i.b * i.c)) : 1, o = t.map((d) => ({
    ...d,
    corners: d.corners.map(s),
    ...d.cap && { cap: { ...d.cap, ...s(d.cap), radius: d.cap.radius * r, start: d.cap.start + (i ? Math.atan2(i.b, i.a) : 0) } }
  }));
  let a = 1 / 0, l = 1 / 0, h = -1 / 0, c = -1 / 0;
  for (const d of o) {
    const g = d.cap ? [{ x: d.cap.x - d.cap.radius, y: d.cap.y - d.cap.radius }, { x: d.cap.x + d.cap.radius, y: d.cap.y + d.cap.radius }] : [];
    for (const y of [...d.corners, ...g])
      a = Math.min(a, y.x), l = Math.min(l, y.y), h = Math.max(h, y.x), c = Math.max(c, y.y);
  }
  if (!(h > a && c > l)) return;
  const f = Math.floor(a) - 1, u = Math.floor(l) - 1, p = i ? bo(e, Math.ceil(h) + 1 - f, Math.ceil(c) + 1 - u) : null, m = p?.getContext("2d");
  if (!p || !m) {
    Jn(e, t, n);
    return;
  }
  m.translate(-f, -u), m.globalCompositeOperation = "lighter", Jn(m, o, n), e.save(), e.setTransform(1, 0, 0, 1, 0, 0), e.globalAlpha = 1, e.drawImage(p, f, u), e.restore();
}
const C0 = Q.to, $0 = Q.from, R0 = Q.fromTo, L0 = Q.set, O0 = Q.timeline, F0 = Q.ticker, B0 = Q.splitText, D0 = Q.context, W0 = Q.matchMedia, N0 = Q.quickTo, K0 = Q.imageSequence, Y0 = Q.pageTransition;
cc();
export {
  xn as ACTING_STYLES,
  od as Clock,
  Rt as CompatTimeline,
  $h as CustomBounce,
  Ch as CustomEase,
  Rh as CustomWiggle,
  Nt as DANCE_STYLES,
  Gs as DEFAULT_BAKE_INTERVAL_MS,
  Ei as DEFAULT_INERTIA_FRICTION,
  Vh as DEFAULT_LABELS,
  et as DEFAULT_SPRING,
  Yd as DEFAULT_TRANSITION,
  Tr as Draggable,
  X as EXPRESSIONS,
  wc as FINGERS,
  bi as FLIPS,
  xi as FORMAT_VERSION,
  yo as GAGS,
  W as HAND_REST,
  Y as HAND_SHAPES,
  jf as HUMAN_ACTING_RIG,
  s0 as HUMAN_EXPRESSIONS,
  nf as HUMAN_POSES,
  V as HUMAN_REST,
  Po as INERTIA_MAX_DURATION_MS,
  Ta as InertiaTrackPlayer,
  ct as LiveTimeline,
  pd as MORPH_SAMPLES,
  Es as MUDRAS,
  rd as ManualClock,
  us as MediaSync,
  Ul as Observer,
  pi as POSES,
  q as REST_POSE,
  Ks as SPRING_MAX_DURATION_MS,
  nn as SPRING_PRESETS,
  jt as SPRING_STEP_MS,
  Vf as STICK_ACTING_RIG,
  mh as ScrollAnimator,
  en as ScrollDriver,
  gh as ScrollMarkers,
  ch as ScrollPin,
  ss as SmoothScroll,
  Je as SpringSampler,
  Ma as SpringTrackPlayer,
  Dl as Stage,
  nr as Timeline,
  ci as TinyflyPlayer,
  uc as TinyflySequencer,
  ln as TrackPlayer,
  Td as ValueResolver,
  hh as VisibilityDriver,
  S0 as actCharacterTracks,
  mo as actKeyframes,
  k0 as actTracks,
  H0 as applyBloom,
  Mu as applyGroove,
  Wo as backOut,
  t0 as bakeDanceTracks,
  tr as bakeEasing,
  Zs as bakeInertiaTrack,
  Js as bakeSpringTrack,
  v0 as basicOutfit,
  Jd as beatAt,
  ii as beatAtTime,
  hr as beatLength,
  ni as beatTime,
  Hd as beatsBetween,
  ic as bindChoiceHotspots,
  ce as blendPose,
  $r as boilFrame,
  Do as bounceOut,
  bf as character,
  u0 as characterAt,
  Tf as characterHandPose,
  kf as characterJoints,
  a0 as characterJointsInView,
  d0 as characterObjects,
  f0 as characterPoseTracks,
  c0 as characterTarget,
  Ea as charactersFor,
  m0 as circlePath,
  Pr as clamp01,
  md as clearMorphCache,
  fd as clearPathCache,
  po as clipErased,
  es as containerProgressAt,
  D0 as context,
  Wd as create,
  Gh as createControls,
  Fo as createCubicBezier,
  Wh as createLive,
  Rr as createPen,
  ei as createRandom,
  Cn as createTrack,
  cd as criticalDamping,
  Fa as customBounce,
  Oa as customEase,
  Ba as customWiggle,
  gi as danceFrame,
  jd as dancePose,
  Vn as danceStance,
  Gd as danceTaps,
  Qd as danceTracks,
  wn as danceTravel,
  Au as danceTravelTrack,
  Zd as dancer,
  se as deserializeTimeline,
  Ia as deserializeTrack,
  Id as detectTempo,
  Ld as draggable,
  di as drawCartoonHand,
  Ef as drawCharacter,
  Af as drawCharacterInView,
  E0 as drawDustPuff,
  ho as drawEraser,
  uo as drawHand,
  A0 as drawImpactStars,
  Rf as drawPencil,
  Jf as drawSpeedLines,
  fu as drawStickFigure,
  x0 as drawStickSmear,
  I0 as drawTrail,
  g0 as drawnPathTarget,
  $o as easeIn,
  Ys as easeInCubic,
  Lo as easeInOut,
  Qe as easeInOutCubic,
  Co as easeInOutQuad,
  Ho as easeInQuad,
  Ro as easeOut,
  qs as easeOutCubic,
  Io as easeOutQuad,
  Bo as elasticOut,
  ms as ellipsePoints,
  w0 as erasable,
  ka as expandParametricEasings,
  qu as flipPose,
  e0 as flipTracks,
  Xu as flipTravel,
  Bs as formatVersionFor,
  $0 as from,
  kd as fromJSON,
  R0 as fromTo,
  M0 as gag,
  T0 as gagDuration,
  J as getEasingFunction,
  Oe as getInterpolator,
  er as getMotionPathPoint,
  dd as getPathLength,
  Jo as getPointAtProgress,
  jl as gridLinesFor,
  p0 as handAt,
  Kn as handJoints,
  Ic as handJointsAt,
  D as handPose,
  Xe as handProp,
  To as hasKeyframes,
  pe as hashSeed,
  Vd as headPoint,
  ad as heldTime,
  i0 as humanFieldLabel,
  sf as humanPlan,
  tt as humanPose,
  K0 as imageSequence,
  fe as inertiaDuration,
  ue as inertiaRest,
  Pn as inertiaValueAt,
  ud as inertiaVelocityAt,
  ba as interpolateArray,
  ya as interpolateColor,
  wd as interpolateMotionPath,
  ht as interpolateNumber,
  va as interpolatePathString,
  wa as interpolateQuaternion,
  Wi as interpolateString,
  Mo as isCubicBezierEasing,
  Tt as isInertiaTrack,
  sd as isMotionPathPoint,
  Ds as isMotionPathTrack,
  Re as isParametricEasing,
  de as isPathData,
  xt as isSpringTrack,
  Zn as isTextTrack,
  hd as isUnderdamped,
  Md as isUnresolved,
  Pf as jointsInScene,
  uu as jointsToScene,
  _n as linear,
  Q as live,
  Be as mapEase,
  Rd as mat4,
  W0 as matchMedia,
  Ns as maxStaggerDistance,
  n0 as mirrorHumanPose,
  ku as mirrorPose,
  he as mixHandPoses,
  l0 as mixPoses,
  ha as morphPath,
  rc as mount,
  lc as mountAll,
  Ed as narrationMarkers,
  Ad as narrationSceneAt,
  Le as naturalRest,
  Pd as nearestBeat,
  _d as nextBeat,
  Y0 as pageTransition,
  Ko as parametricEasing,
  ts as parseEdge,
  Ft as parsePath,
  Ar as parseTrigger,
  le as partialPath,
  fc as pathLength,
  xd as planNarration,
  Dd as play,
  Kd as playSequence,
  Fd as playWhenVisible,
  ir as playheadCrossings,
  ui as pointAlong,
  Xs as pointAtDistance,
  o0 as pointOnHead,
  qa as pointsToPath,
  U as pose,
  zd as poseTracks,
  gd as quat,
  P0 as quickPlay,
  N0 as quickTo,
  rr as randomBetween,
  Sd as randomChoice,
  $a as randomSnapped,
  h0 as reachCharacter,
  Df as resolveActingStyle,
  lo as resolveCharacterPoseKeys,
  Gr as resolvePoseKeys,
  Ra as resolveSequence,
  jr as resolveStickFrame,
  du as resolveStickPose,
  lr as resolveValue,
  Ua as ribbon,
  za as ribbonHeadCap,
  Mt as rotateAbout,
  yi as routineBeats,
  Wt as rubberLimb,
  Od as scrollProgress,
  Bd as scrubOnScroll,
  y0 as scrubPath,
  Xd as seatHeight,
  Ca as serializeTimeline,
  Ha as serializeTrack,
  L0 as set,
  si as shapeToPathData,
  Sa as simplifyKeyframes,
  io as skeletonInView,
  Dn as sketchPen,
  lh as smoothToward,
  zl as snapAxis,
  fh as snapConfig,
  ph as snapDuration,
  dh as snapProgress,
  vi as solvePlanSpace,
  B0 as splitText,
  xo as springDuration,
  ld as springValueAt,
  no as stagePlanSpace,
  Ws as staggerDistance,
  Qn as staggerOffset,
  An as staggerOffsets,
  Ge as staggerSpan,
  No as stepsEasing,
  gu as stickFigureAt,
  cu as stickFigureJoints,
  Ud as stickFigureTarget,
  r0 as stickToHuman,
  qd as strideLength,
  Xh as syncMediaElement,
  Nc as talkingMouth,
  fi as taperedLine,
  Ie as taperedOutline,
  Pa as textAt,
  _0 as tf,
  F0 as ticker,
  O0 as timeline,
  C0 as to,
  vd as toJSON,
  yd as toKeyframedTrack,
  bd as toKeyframedTracks,
  wt as trackTargets,
  Cd as trailSamples,
  ae as triggerDistance,
  Nd as unmount,
  $d as vec3,
  Wc as walkPose,
  b0 as withErased,
  Or as withExpression
};
