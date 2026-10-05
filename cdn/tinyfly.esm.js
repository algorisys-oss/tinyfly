function ro(e) {
  return typeof e == "object" && e !== null && e.type === "cubic-bezier";
}
function Ce(e) {
  return typeof e == "object" && e !== null && e.type !== "cubic-bezier";
}
const gi = 2;
function Es(e) {
  return e.some((t) => t.interpolation !== void 0) ? 2 : 1;
}
function qn(e) {
  return e.property === "text" && "textConfig" in e;
}
function xt(e) {
  return e.kind === "inertia" && "inertia" in e;
}
function Mt(e) {
  return e.kind === "spring" && "spring" in e;
}
function As(e) {
  return e.property === "motionPath" && "motionPathConfig" in e;
}
function wf(e) {
  return typeof e == "object" && e !== null && "x" in e && "y" in e && "angle" in e;
}
function oo(e) {
  return "keyframes" in e;
}
class vf {
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
class kf {
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
function Ps(e, t, n = "start") {
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
function _s(e, t = "start") {
  if (e <= 1) return 0;
  let n = 0;
  for (let i = 0; i < e; i++)
    n = Math.max(n, Ps(i, e, t));
  return n;
}
function Xn(e, t, n) {
  if (n.offsets) return n.offsets[e] ?? 0;
  const i = n.from ?? "start", s = Ps(e, t, i);
  if (n.amount !== void 0) {
    const r = _s(t, i);
    return r === 0 ? 0 : n.amount * s / r;
  }
  return n.each !== void 0 ? n.each * s : 0;
}
function kn(e, t) {
  return Array.from({ length: e }, (n, i) => Xn(i, e, t));
}
function Ve(e, t) {
  return e <= 1 ? 0 : Math.max(...kn(e, t));
}
const Ut = 1, Cs = 6e4, de = Cs / Ut, et = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, Je = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class Ue {
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
    const n = Math.floor(t / Ut);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const i = this.samples[Math.min(n, this.samples.length - 1)], s = this.samples[Math.min(n + 1, this.samples.length - 1)], r = t / Ut - n;
    return i + (s - i) * r;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(de + 1), this.settledStep !== null ? this.settledStep * Ut : Cs;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(t) {
    if (this.settledStep !== null) return;
    const n = Math.min(t, de + 1), i = Ut / 1e3;
    for (; this.samples.length < n; ) {
      const s = this.samples[this.samples.length - 1], r = s - this.to, o = -this.stiffness * r, a = -this.damping * this.velocity, l = (o + a) / this.mass;
      this.velocity += l * i;
      const h = s + this.velocity * i;
      if (this.samples.push(h), this.isAtRest(h)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > de && (this.settledStep = de);
  }
}
function Sf(e, t) {
  return new Ue(e).valueAt(t);
}
function ao(e) {
  return new Ue(e).settleTime();
}
function xf(e) {
  const t = e.stiffness ?? et.stiffness, n = e.damping ?? et.damping, i = e.mass ?? et.mass;
  return n < 2 * Math.sqrt(t * i);
}
function Mf(e) {
  const t = e.stiffness ?? et.stiffness, n = e.mass ?? et.mass;
  return 2 * Math.sqrt(t * n);
}
const yi = 4, lo = 2e-3, ho = 1e-4, co = 6e4;
function ze(e) {
  const t = e.friction ?? yi;
  return t > 0 ? t : yi;
}
function He(e) {
  return e.from + e.velocity / ze(e);
}
function uo(e, t) {
  if (t === void 0) return e;
  if (typeof t == "number")
    return t > 0 ? Math.round(e / t) * t : e;
  if (t.length === 0) return e;
  let n = t[0];
  for (const i of t)
    Math.abs(i - e) < Math.abs(n - e) && (n = i);
  return n;
}
function he(e) {
  let t = uo(He(e), e.end);
  return e.min !== void 0 && (t = Math.max(e.min, t)), e.max !== void 0 && (t = Math.min(e.max, t)), t;
}
function ce(e) {
  const t = Math.abs(he(e) - e.from);
  if (t === 0) return 0;
  const n = e.restDelta ?? Math.max(ho, t * lo);
  if (n >= t) return 0;
  const i = Math.log(t / n) / ze(e);
  return Math.min(co, i * 1e3);
}
function Sn(e, t) {
  if (t <= 0) return e.from;
  const n = he(e);
  if (t >= ce(e)) return n;
  const i = ze(e);
  return e.from + (n - e.from) * (1 - Math.exp(-i * t / 1e3));
}
function Tf(e, t) {
  const n = ze(e), i = he(e);
  return t >= ce(e) ? 0 : (i - e.from) * n * Math.exp(-n * Math.max(0, t) / 1e3);
}
const xn = (e) => e, fo = (e) => e * e, po = (e) => 1 - (1 - e) * (1 - e), mo = (e) => e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2, Hs = (e) => e * e * e, $s = (e) => 1 - Math.pow(1 - e, 3), je = (e) => e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2, go = Hs, yo = $s, bo = je, wo = {
  linear: xn,
  "ease-in": go,
  "ease-out": yo,
  "ease-in-out": bo,
  "ease-in-quad": fo,
  "ease-out-quad": po,
  "ease-in-out-quad": mo,
  "ease-in-cubic": Hs,
  "ease-out-cubic": $s,
  "ease-in-out-cubic": je
};
function vo(e) {
  const [t, n, i, s] = e, r = 3 * t, o = 3 * (i - t) - r, a = 1 - r - o, l = 3 * n, h = 3 * (s - n) - l, c = 1 - l - h, f = (d) => ((a * d + o) * d + r) * d, u = (d) => ((c * d + h) * d + l) * d, p = (d) => (3 * a * d + 2 * o) * d + r, m = (d) => {
    let g = d;
    for (let b = 0; b < 8; b++) {
      const S = f(g) - d;
      if (Math.abs(S) < 1e-7)
        return g;
      const v = p(g);
      if (Math.abs(v) < 1e-7)
        break;
      g -= S / v;
    }
    let y = 0, w = 1;
    for (g = d; y < w; ) {
      const b = f(g);
      if (Math.abs(b - d) < 1e-7)
        return g;
      d > b ? y = g : w = g, g = (y + w) / 2;
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
function Qe(e, t = "out") {
  if (t === "out") return e;
  const n = (i) => 1 - e(1 - i);
  return t === "in" ? n : (i) => i < 0.5 ? n(i * 2) / 2 : e(i * 2 - 1) / 2 + 0.5;
}
function ko(e = 1, t = 0.3) {
  const n = Math.max(1, e), i = t / (2 * Math.PI) * Math.asin(1 / n);
  return (s) => s <= 0 ? 0 : s >= 1 ? 1 : n * Math.pow(2, -10 * s) * Math.sin((s - i) * (2 * Math.PI) / t) + 1;
}
const So = (e) => {
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
function xo(e = 1.70158) {
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const n = t - 1;
    return n * n * ((e + 1) * n + e) + 1;
  };
}
function Mo(e, t = "end") {
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
function To(e) {
  switch (e.type) {
    case "steps":
      return Mo(e.count, e.position);
    case "elastic":
      return Qe(ko(e.amplitude, e.period), e.mode);
    case "bounce":
      return Qe(So, e.mode);
    case "back":
      return Qe(xo(e.overshoot), e.mode);
  }
}
function z(e) {
  return e === void 0 ? xn : ro(e) ? vo(e.points) : Ce(e) ? To(e) : wo[e] ?? xn;
}
const bi = 32, Eo = 256, _t = /* @__PURE__ */ new Map(), Ao = /[MmLlHhVvCcSsQqTtAaZz]/, Po = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, _o = {
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
function Co(e) {
  const t = [];
  let n = 0, i = null;
  const s = () => {
    for (; n < e.length && /[\s,]/.test(e[n]); ) n++;
  };
  for (; n < e.length && (s(), !(n >= e.length)); ) {
    const r = e[n];
    if (Ao.test(r)) {
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
    const l = Po.exec(e.slice(n));
    if (!l) break;
    i.args.push(parseFloat(l[0])), n += l[0].length;
  }
  return t;
}
function Ho(e, t, n, i, s, r, o, a, l) {
  if (e === a && t === l) return [];
  let h = Math.abs(n), c = Math.abs(i);
  if (h === 0 || c === 0) return [[e, t, a, l, a, l]];
  const f = s * Math.PI / 180, u = Math.cos(f), p = Math.sin(f), m = (e - a) / 2, d = (t - l) / 2, g = u * m + p * d, y = -p * m + u * d, w = g * g / (h * h) + y * y / (c * c);
  if (w > 1) {
    const I = Math.sqrt(w);
    h *= I, c *= I;
  }
  const b = r === o ? -1 : 1, S = h * h * c * c - h * h * y * y - c * c * g * g, v = h * h * y * y + c * c * g * g, k = b * Math.sqrt(Math.max(0, S / v)), M = k * h * y / c, P = -k * c * g / h, x = u * M - p * P + (e + a) / 2, E = p * M + u * P + (t + l) / 2, T = (I, O, B, V) => {
    const ut = I * B + O * V, fe = Math.sqrt((I * I + O * O) * (B * B + V * V)), Wt = Math.acos(Math.max(-1, Math.min(1, ut / fe)));
    return I * V - O * B < 0 ? -Wt : Wt;
  }, A = T(1, 0, (g - M) / h, (y - P) / c);
  let _ = T((g - M) / h, (y - P) / c, (-g - M) / h, (-y - P) / c);
  !o && _ > 0 && (_ -= 2 * Math.PI), o && _ < 0 && (_ += 2 * Math.PI);
  const C = Math.max(1, Math.ceil(Math.abs(_) / (Math.PI / 2))), H = _ / C, $ = 4 / 3 * Math.tan(H / 4), R = (I) => {
    const O = h * Math.cos(I), B = c * Math.sin(I);
    return [u * O - p * B + x, p * O + u * B + E];
  }, L = (I) => {
    const O = -h * Math.sin(I), B = c * Math.cos(I);
    return [u * O - p * B, p * O + u * B];
  }, F = [];
  for (let I = 0; I < C; I++) {
    const O = A + I * H, B = O + H, [V, ut] = R(O), [fe, Wt] = I === C - 1 ? [a, l] : R(B), [eo, no] = L(O), [io, so] = L(B);
    F.push([V + $ * eo, ut + $ * no, fe - $ * io, Wt - $ * so, fe, Wt]);
  }
  return F;
}
function pt(e, t, n, i, s) {
  const r = 1 - s;
  return r * r * r * e + 3 * r * r * s * t + 3 * r * s * s * n + s * s * s * i;
}
function wi(e, t, n, i, s) {
  const r = 1 - s;
  return 3 * r * r * (t - e) + 6 * r * s * (n - t) + 3 * s * s * (i - n);
}
function Nt(e, t, n, i) {
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
function pe(e, t, n) {
  const [i, s, r, o, a, l] = n, h = [0];
  let c = e, f = t, u = 0;
  for (let p = 1; p <= bi; p++) {
    const m = p / bi, d = pt(e, i, r, a, m), g = pt(t, s, o, l, m);
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
  const t = _t.get(e);
  if (t) return t;
  const n = [];
  let i = 0, s = 0, r = 0, o = 0, a = null, l = null, h = -1;
  const c = /* @__PURE__ */ new Set(), f = (d) => {
    h < 0 && (h = 0), d.subpath = h, n.push(d);
  };
  for (const { type: d, args: g } of Co(e)) {
    const y = d.toUpperCase(), w = d !== y, b = _o[y];
    if (y === "Z") {
      (i !== r || s !== o) && f(Nt(i, s, r, o)), h >= 0 && c.add(h), i = r, s = o, a = l = null;
      continue;
    }
    for (let S = 0; S + b <= g.length; S += b) {
      const v = g.slice(S, S + b), k = w ? i : 0, M = w ? s : 0;
      let P = null, x = null;
      switch (y) {
        case "M":
          S === 0 ? (i = v[0] + k, s = v[1] + M, r = i, o = s, (h < 0 || n[n.length - 1]?.subpath === h) && h++) : (f(Nt(i, s, v[0] + k, v[1] + M)), i = v[0] + k, s = v[1] + M);
          break;
        case "L":
          f(Nt(i, s, v[0] + k, v[1] + M)), i = v[0] + k, s = v[1] + M;
          break;
        case "H":
          f(Nt(i, s, v[0] + k, s)), i = v[0] + k;
          break;
        case "V":
          f(Nt(i, s, i, v[0] + M)), s = v[0] + M;
          break;
        case "C": {
          const E = [v[0] + k, v[1] + M, v[2] + k, v[3] + M, v[4] + k, v[5] + M];
          f(pe(i, s, E)), P = [E[2], E[3]], i = E[4], s = E[5];
          break;
        }
        case "S": {
          const [E, T] = a ? [2 * i - a[0], 2 * s - a[1]] : [i, s], A = [E, T, v[0] + k, v[1] + M, v[2] + k, v[3] + M];
          f(pe(i, s, A)), P = [A[2], A[3]], i = A[4], s = A[5];
          break;
        }
        case "Q":
        case "T": {
          let E = i, T = s;
          y === "Q" ? (E = v[0] + k, T = v[1] + M) : l && (E = 2 * i - l[0], T = 2 * s - l[1]);
          const A = y === "Q" ? v[2] + k : v[0] + k, _ = y === "Q" ? v[3] + M : v[1] + M;
          f(
            pe(i, s, [
              i + 2 / 3 * (E - i),
              s + 2 / 3 * (T - s),
              A + 2 / 3 * (E - A),
              _ + 2 / 3 * (T - _),
              A,
              _
            ])
          ), x = [E, T], i = A, s = _;
          break;
        }
        case "A": {
          const E = v[5] + k, T = v[6] + M;
          let A = i, _ = s;
          for (const C of Ho(i, s, v[0], v[1], v[2], v[3], v[4], E, T))
            f(pe(A, _, C)), A = C[4], _ = C[5];
          i = E, s = T;
          break;
        }
      }
      a = P, l = x;
    }
  }
  const u = n.reduce((d, g) => d + g.length, 0), p = [];
  for (let d = 0; d < n.length; ) {
    const g = n[d].subpath;
    let y = d, w = 0;
    for (; y < n.length && n[y].subpath === g; ) w += n[y++].length;
    const b = n[d], S = n[y - 1], v = c.has(g) || Math.abs(S.endX - b.startX) < 1e-9 && Math.abs(S.endY - b.startY) < 1e-9;
    p.push({ start: d, end: y, length: w, closed: v }), d = y;
  }
  const m = { segments: n, totalLength: u, subpaths: p };
  return _t.size >= Eo && _t.delete(_t.keys().next().value), _t.set(e, m), m;
}
function $o(e, t) {
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
function Io(e, t) {
  if (e.type === "L") {
    const f = e.length > 0 ? Math.max(0, Math.min(1, t / e.length)) : 0;
    return {
      x: e.startX + (e.endX - e.startX) * f,
      y: e.startY + (e.endY - e.startY) * f,
      angle: Math.atan2(e.endY - e.startY, e.endX - e.startX) * 180 / Math.PI
    };
  }
  const [n, i, s, r, o, a] = e.points, l = $o(e, t);
  let h = wi(e.startX, n, s, o, l), c = wi(e.startY, i, r, a, l);
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
function Is(e, t, n = 0, i = e.length) {
  if (i <= n) return { x: 0, y: 0, angle: 0 };
  let s = 0;
  for (let r = n; r < i; r++) {
    const o = e[r];
    if (s + o.length >= t || r === i - 1)
      return Io(o, t - s);
    s += o.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function Ro(e, t) {
  const { segments: n, totalLength: i } = Ft(e);
  return Is(n, Math.max(0, Math.min(1, t)) * i);
}
function Ef() {
  _t.clear();
}
function Af(e) {
  return Ft(e).totalLength;
}
const Fo = 24, Lo = 320, Oo = 2.5, Yt = 72, Pf = 64, Bo = 0.2, Do = 128, zt = /* @__PURE__ */ new Map();
let xe = 0, dt;
const vi = (e) => Math.round(e * 100) / 100;
function ki(e, t) {
  const { segments: n, subpaths: i, totalLength: s } = Ft(e);
  if (n.length === 0) return [];
  if (t) {
    const r = i.every((o) => o.closed);
    return [{ segments: n, start: 0, end: n.length, length: s, closed: r }];
  }
  return i.filter((r) => r.length > 0).map((r) => ({ segments: n, start: r.start, end: r.end, length: r.length, closed: r.closed }));
}
function Mn(e, t) {
  const n = e.closed ? (t % 1 + 1) % 1 : Math.max(0, Math.min(1, t)), i = Is(e.segments, n * e.length, e.start, e.end);
  return [i.x, i.y];
}
function Si(e) {
  const t = [];
  let n = 0;
  for (let i = e.start; i < e.end; i++)
    n += e.segments[i].length, e.length > 0 && t.push(n / e.length);
  return t;
}
function xi(e, t) {
  const n = [];
  for (let i = 0; i < t; i++)
    n.push(Mn(e, e.closed ? i / t : i / (t - 1)));
  return n;
}
function Mi(e) {
  let t = 0, n = 0;
  for (const [i, s] of e)
    t += i, n += s;
  return t /= e.length, n /= e.length, e.map(([i, s]) => [i - t, s - n]);
}
function Wo(e, t, n) {
  const i = e.closed && t.closed;
  if (n !== void 0)
    return { offset: i ? Math.abs(n) % Yt / Yt : 0, reversed: n < 0 };
  const s = Mi(xi(e, Yt)), r = Mi(xi(t, Yt)), o = Yt;
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
function No(e, t, n) {
  return n ? ((t.reversed ? t.offset - e : e + t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function Yo(e, t, n) {
  return n ? ((t.reversed ? t.offset - e : e - t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function Ko(e, t, n) {
  const i = e.closed && t.closed, s = Wo(e, t, n.shapeIndex), r = Math.max(
    Fo,
    Math.min(Lo, Math.ceil(Math.max(e.length, t.length) / Oo))
  ), o = /* @__PURE__ */ new Set(), a = (f) => o.add(Math.round(f * 1e7) / 1e7);
  for (let f = 0; f <= r; f++) a(f / r);
  for (const f of Si(e)) a(f);
  for (const f of Si(t)) a(Yo(f, s, i));
  let l = [...o].sort((f, u) => f - u);
  i && (l = l.filter((f) => f < 1));
  const h = [], c = [];
  for (const f of l)
    h.push(...Mn(e, f)), c.push(...Mn(t, No(f, s, i)));
  return qo({ from: h, to: c, closed: i });
}
function qo(e) {
  const t = e.from.length / 2;
  if (t <= 3) return e;
  const n = new Uint8Array(t);
  n[0] = 1, n[t - 1] = 1;
  const i = [[0, t - 1]];
  for (; i.length > 0; ) {
    const [o, a] = i.pop();
    let l = -1, h = Bo;
    for (let c = o + 1; c < a; c++) {
      const f = Math.max(Ti(e.from, o, a, c), Ti(e.to, o, a, c));
      f > h && (h = f, l = c);
    }
    l !== -1 && (n[l] = 1, i.push([o, l], [l, a]));
  }
  const s = [], r = [];
  for (let o = 0; o < t; o++)
    n[o] && (s.push(e.from[o * 2], e.from[o * 2 + 1]), r.push(e.to[o * 2], e.to[o * 2 + 1]));
  return { from: s, to: r, closed: e.closed };
}
function Ti(e, t, n, i) {
  const s = e[t * 2], r = e[t * 2 + 1], o = e[n * 2] - s, a = e[n * 2 + 1] - r, l = e[i * 2] - s, h = e[i * 2 + 1] - r, c = o * o + a * a, f = c === 0 ? 0 : Math.max(0, Math.min(1, (l * o + h * a) / c));
  return Math.hypot(l - f * o, h - f * a);
}
function Xo(e, t, n) {
  const i = n.shapeIndex;
  if (dt && dt.from === e && dt.to === t && dt.shapeIndex === i) return dt.plan;
  const r = zt.get(String(i ?? "auto"))?.get(e)?.get(t);
  if (r)
    return dt = { from: e, to: t, shapeIndex: i, plan: r }, r;
  const o = Ft(e).subpaths.filter((p) => p.length > 0).length === Ft(t).subpaths.filter((p) => p.length > 0).length, a = ki(e, !o), l = ki(t, !o), h = {
    pairs: a.map((p, m) => Ko(p, l[m], n))
  };
  xe >= Do && (zt.clear(), xe = 0);
  const c = String(i ?? "auto"), f = zt.get(c) ?? /* @__PURE__ */ new Map();
  zt.set(c, f);
  const u = f.get(e) ?? /* @__PURE__ */ new Map();
  return f.set(e, u), u.set(t, h), xe++, dt = { from: e, to: t, shapeIndex: i, plan: h }, h;
}
function Vo(e, t, n, i = {}) {
  if (!e) return t;
  if (!t) return e;
  const s = Math.max(0, Math.min(1, n));
  if (s === 0) return e;
  if (s === 1) return t;
  const r = Xo(e, t, i);
  if (r.pairs.length === 0) return s < 0.5 ? e : t;
  let o = "";
  for (const a of r.pairs) {
    for (let l = 0; l < a.from.length; l += 2) {
      const h = vi(a.from[l] + (a.to[l] - a.from[l]) * s), c = vi(a.from[l + 1] + (a.to[l + 1] - a.from[l + 1]) * s);
      o += `${l === 0 ? o ? " M" : "M" : " L"}${h} ${c}`;
    }
    a.closed && (o += " Z");
  }
  return o;
}
function _f() {
  zt.clear(), xe = 0, dt = void 0;
}
function ue(e) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(e);
}
const Ct = Math.PI / 180, Uo = 0.9995;
function Vn() {
  return [0, 0, 0, 1];
}
function Rt(e, t) {
  const n = Math.hypot(e[0], e[1], e[2]);
  if (n === 0) return Vn();
  const i = t * Ct / 2, s = Math.sin(i) / n;
  return [e[0] * s, e[1] * s, e[2] * s, Math.cos(i)];
}
function zo(e, t, n) {
  return Tn(Tn(Rt([0, 1, 0], t), Rt([1, 0, 0], e)), Rt([0, 0, 1], n));
}
function jo(e) {
  const [t, n, i, s] = gt(e), r = 2 * (t * i + n * s), o = 2 * (t * n + i * s), a = 1 - 2 * (t * t + i * i), l = 2 * (n * i - t * s), h = 1 - 2 * (n * n + i * i), c = 2 * (t * i - n * s), f = 1 - 2 * (t * t + n * n), u = Math.asin(Math.max(-1, Math.min(1, -l)));
  return Math.abs(l) < 0.9999999 ? [u / Ct, Math.atan2(r, f) / Ct, Math.atan2(o, a) / Ct] : [u / Ct, Math.atan2(-c, h) / Ct, 0];
}
function Tn(e, t) {
  const [n, i, s, r] = e, [o, a, l, h] = t;
  return [
    r * o + n * h + i * l - s * a,
    r * a - n * l + i * h + s * o,
    r * l + n * a - i * o + s * h,
    r * h - n * o - i * a - s * l
  ];
}
function Rs(e, t) {
  return e[0] * t[0] + e[1] * t[1] + e[2] * t[2] + e[3] * t[3];
}
function Fs(e) {
  return Math.hypot(e[0], e[1], e[2], e[3]);
}
function gt(e) {
  const t = Fs(e);
  return t === 0 ? Vn() : [e[0] / t, e[1] / t, e[2] / t, e[3] / t];
}
function Go(e) {
  return [-e[0], -e[1], -e[2], e[3]];
}
function Ls(e, t, n) {
  const i = gt(e);
  let s = gt(t), r = Rs(i, s);
  if (r < 0 && (s = [-s[0], -s[1], -s[2], -s[3]], r = -r), r > Uo)
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
function Zo(e, t) {
  const [n, i, s, r] = gt(e), o = 2 * (i * t[2] - s * t[1]), a = 2 * (s * t[0] - n * t[2]), l = 2 * (n * t[1] - i * t[0]);
  return [t[0] + r * o + (i * l - s * a), t[1] + r * a + (s * o - n * l), t[2] + r * l + (n * a - i * o)];
}
const Cf = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  conjugate: Go,
  dot: Rs,
  fromAxisAngle: Rt,
  fromEuler: zo,
  identity: Vn,
  length: Fs,
  multiply: Tn,
  normalize: gt,
  rotateVec3: Zo,
  slerp: Ls,
  toEuler: jo
}, Symbol.toStringTag, { value: "Module" })), ht = (e, t, n) => e + (t - e) * n, Os = 512, tn = /* @__PURE__ */ new Map(), en = /* @__PURE__ */ new Map();
function Ei(e) {
  const t = tn.get(e);
  if (t) return t;
  const n = e.replace("#", ""), i = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return tn.size < Os && tn.set(e, i), i;
}
const Ai = (e) => e.charCodeAt(0) === 35, Pi = (e) => e.startsWith("rgb"), _i = (e) => e.startsWith("rgba"), Jo = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, nn = (e) => Math.round(e).toString(16).padStart(2, "0");
function Qo(e, t, n) {
  return `#${nn(e)}${nn(t)}${nn(n)}`;
}
function Ci(e) {
  const t = en.get(e);
  if (t) return t;
  const n = e.match(Jo);
  if (!n)
    throw new Error(`Invalid rgb color: ${e}`);
  const i = parseInt(n[1], 10), s = parseInt(n[2], 10), r = parseInt(n[3], 10), o = n[4] !== void 0 ? [i, s, r, parseFloat(n[4])] : [i, s, r];
  return en.size < Os && en.set(e, o), o;
}
const ta = (e, t, n) => {
  if (Ai(e) && Ai(t)) {
    const [i, s, r] = Ei(e), [o, a, l] = Ei(t), h = ht(i, o, n), c = ht(s, a, n), f = ht(r, l, n);
    return Qo(h, c, f);
  }
  if ((Pi(e) || _i(e)) && (Pi(t) || _i(t))) {
    const i = Ci(e), s = Ci(t), r = Math.round(ht(i[0], s[0], n)), o = Math.round(ht(i[1], s[1], n)), a = Math.round(ht(i[2], s[2], n));
    if (i.length === 4 || s.length === 4) {
      const l = i[3] ?? 1, h = s[3] ?? 1, c = ht(l, h, n);
      return `rgba(${r}, ${o}, ${a}, ${c})`;
    }
    return `rgb(${r}, ${o}, ${a})`;
  }
  return n < 1 ? e : t;
}, ea = (e, t, n) => {
  const i = Math.min(e.length, t.length), s = [];
  for (let r = 0; r < i; r++)
    s.push(ht(e[r], t[r], n));
  return s;
}, na = (e, t, n) => Ls(e, t, n), Hi = (e, t, n) => n < 1 ? e : t, ia = (e, t, n) => Vo(e, t, n);
function $e(e, t) {
  return t === "slerp" ? na : typeof e == "number" ? ht : Array.isArray(e) ? ea : typeof e == "string" ? e.startsWith("#") || e.startsWith("rgb") ? ta : ue(e) ? ia : Hi : Hi;
}
const Bs = 1e3 / 60;
function Ds(e, t = {}) {
  if (!Mt(e))
    throw new Error(`bakeSpringTrack: track "${e.id}" is not a spring track`);
  const n = new Ue(e.spring);
  return Ns(e, (i) => n.valueAt(i), n.settleTime(), e.spring.from, e.spring.to, t);
}
function Ws(e, t = {}) {
  if (!xt(e))
    throw new Error(`bakeInertiaTrack: track "${e.id}" is not an inertia track`);
  const n = e.inertia;
  return Ns(
    e,
    (i) => Sn(n, i),
    ce(n),
    n.from,
    he(n),
    t
  );
}
function Ns(e, t, n, i, s, r) {
  const o = r.intervalMs ?? Bs, a = r.tolerance ?? 0.01, l = e.delay ?? 0, h = [];
  for (let f = 0; f <= n; f += o)
    h.push({ time: f + l, value: t(f), easing: "linear" });
  const c = h[h.length - 1];
  return !c || c.time < n + l ? h.push({ time: n + l, value: s, easing: "linear" }) : c.value = s, l > 0 && h.unshift({ time: 0, value: i, easing: "linear" }), {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: a > 0 ? ra(h, a) : h,
    ...e.targets && { targets: [...e.targets] },
    ...e.stagger && { stagger: { ...e.stagger } }
  };
}
function Ys(e, t, n, i = {}) {
  const s = i.intervalMs ?? Bs, r = typeof n == "function" ? n : z(n), o = $e(e.value, i.interpolation), a = t.time - e.time;
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
function Hf(e, t) {
  return Mt(e) ? Ds(e, t) : xt(e) ? Ws(e, t) : e;
}
function sa(e, t = {}) {
  const n = e.keyframes;
  if (!n.some((r) => Ce(r.easing))) return e;
  const i = n.length > 0 ? [n[0]] : [], s = { ...t, interpolation: e.interpolation ?? t.interpolation };
  for (let r = 1; r < n.length; r++) {
    const o = n[r];
    Ce(o.easing) ? i.push(...Ys(n[r - 1], o, o.easing, s)) : i.push(o);
  }
  return { ...e, keyframes: i };
}
function $f(e, t) {
  return e.filter(oo).map((n) => sa(n, t)).concat(
    e.filter(Mt).map((n) => Ds(n, t)),
    e.filter(xt).map((n) => Ws(n, t))
  );
}
function ra(e, t) {
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
function En(e) {
  const t = [...e.keyframes].sort((n, i) => n.time - i.time);
  return {
    ...e,
    keyframes: t
  };
}
function wt(e) {
  return e.targets && e.targets.length > 0 ? e.targets : [e.target];
}
function Lt(e, t, n, i) {
  const s = n ?? 0;
  return !i || t <= 1 ? s : s + Xn(e, t, i);
}
class sn {
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
    return this.valueForOffset(t - Lt(0, this.targets.length, this.track.delay, this.track.stagger));
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
      const r = Lt(s, n, this.track.delay, this.track.stagger), o = this.valueForOffset(t - r);
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
    const n = t[t.length - 1].time, i = this.track.stagger ? Ve(this.targets.length, this.track.stagger) : 0;
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
    const r = s.time - i.time, o = (t - i.time) / r, l = z(s.easing)(o);
    return $e(i.value, this.track.interpolation)(i.value, s.value, l);
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
class oa {
  track;
  targets;
  sampler;
  constructor(t) {
    this.track = t, this.targets = wt(t), this.sampler = new Ue(t.spring);
  }
  getValueAtTime(t) {
    return this.sampler.valueAt(t - Lt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const n = this.targets.length, i = [];
    for (let s = 0; s < n; s++) {
      const r = Lt(s, n, this.track.delay, this.track.stagger);
      i.push({ target: this.targets[s], value: this.sampler.valueAt(t - r), start: r });
    }
    return i;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? Ve(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
class aa {
  track;
  targets;
  duration;
  constructor(t) {
    this.track = t, this.targets = wt(t), this.duration = ce(t.inertia);
  }
  getValueAtTime(t) {
    return Sn(this.track.inertia, t - Lt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const n = this.targets.length, i = [];
    for (let s = 0; s < n; s++) {
      const r = Lt(s, n, this.track.delay, this.track.stagger);
      i.push({ target: this.targets[s], value: Sn(this.track.inertia, t - r), start: r });
    }
    return i;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? Ve(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
function Ks(e, t) {
  const n = { ...Ro(e.pathData, t) };
  if (e.matrix) {
    const [i, s, r, o, a, l] = e.matrix, { x: h, y: c } = n;
    n.x = i * h + r * c + a, n.y = s * h + o * c + l;
    const f = n.angle * Math.PI / 180, u = Math.cos(f), p = Math.sin(f);
    n.angle = Math.atan2(s * u + o * p, i * u + r * p) * 180 / Math.PI;
  }
  return e.autoRotate && e.rotateOffset && (n.angle += e.rotateOffset), n;
}
function If(e, t, n, i) {
  const s = t + (n - t) * i;
  return Ks(e, s);
}
const rn = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, la = 20;
function ha(e) {
  const t = rn[e ?? "upperCase"] ?? e ?? rn.upperCase, n = Array.from(t);
  return n.length > 0 ? n : Array.from(rn.upperCase);
}
function ca(e, t, n) {
  let i = (e | 0) ^ Math.imul(t + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return i = Math.imul(i ^ i >>> 16, 2146121005), i = Math.imul(i ^ i >>> 15, 2221713035), (i ^ i >>> 16) >>> 0;
}
function ua(e, t, n = 0) {
  const i = e.from ?? "", s = e.to, r = Math.max(0, Math.min(1, t));
  if (r <= 0) return i;
  if (r >= 1) return s;
  const o = Array.from(i), a = Array.from(s), l = e.rightToLeft ?? !1;
  if (e.mode === "type") {
    const w = Math.round(r * Math.max(o.length, a.length));
    return l ? o.slice(0, Math.max(0, o.length - w)).join("") + a.slice(Math.max(0, a.length - w)).join("") : a.slice(0, w).join("") + o.slice(w).join("");
  }
  const h = Math.max(0, Math.min(0.999, e.revealDelay ?? 0)), c = Math.max(0, (r - h) / (1 - h)), f = Math.floor(c * a.length), u = e.tweenLength === !1 ? a.length : Math.round(o.length + (a.length - o.length) * r), p = ha(e.chars), m = e.refreshRate ?? la, d = m > 0 ? Math.floor(n * m / 1e3) : 0, g = e.seed ?? 1;
  let y = "";
  for (let w = 0; w < u; w++) {
    const b = l ? w >= u - f : w < f, S = l ? a[a.length - (u - w)] : a[w];
    b && S !== void 0 || S === " " || S === `
` ? y += S : y += p[ca(g, w, d) % p.length];
  }
  return y;
}
class qs {
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
      a.set("text", ua(l.textConfig, r, Math.max(0, o)));
      return;
    }
    const h = this._motionPathTracks.get(n);
    if (h && typeof r == "number") {
      const c = Ks(h.motionPathConfig, r);
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
    if (this._tracks.push(t), this._sharedWrites = null, xt(t)) {
      this._trackPlayers.set(t.id, new aa(t));
      return;
    }
    if (Mt(t)) {
      this._trackPlayers.set(t.id, new oa(t)), this._springTracks.set(t.id, t);
      return;
    }
    if (qn(t))
      this._trackPlayers.set(t.id, new sn(t)), this._textTracks.set(t.id, t);
    else if (As(t)) {
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
      this._trackPlayers.set(t.id, new sn(n)), this._motionPathTracks.set(t.id, t);
    } else
      this._trackPlayers.set(t.id, new sn(t));
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
    if (Mt(i) || xt(i))
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
      formatVersion: Es(this._tracks),
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
const fa = 100;
function Xs(e, t, n, i) {
  const s = [], r = [], { duration: o, alternate: a } = i, l = (p, m, d, g) => {
    r.push([p, m]);
    const y = [];
    e.forEach((w, b) => {
      (d === "forward" ? (g ? w >= p : w > p) && w <= m : (g ? w <= p : w < p) && w >= m) && y.push(b);
    }), y.sort((w, b) => (d === "forward" ? e[w] - e[b] : e[b] - e[w]) || w - b);
    for (const w of y) s.push({ kind: "event", index: w, direction: d });
  };
  let h = t.time, c = t.direction, f = t.fresh === !0;
  const u = Math.min(fa, Math.max(0, n.iteration - t.iteration));
  for (let p = 0; p < u; p++) {
    const m = c === "forward" ? o : 0;
    l(h, m, c, f), s.push({ kind: "repeat" }), a ? (c = c === "forward" ? "reverse" : "forward", h = m, f = !1) : (h = c === "forward" ? 0 : o, f = !0);
  }
  return u > 0 && i.holding && !a ? { crossings: s, passes: r } : (l(h, n.time, c, f), { crossings: s, passes: r });
}
function da(e) {
  return xt(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "inertia",
    inertia: Vs(e.inertia),
    ...ot(e)
  } : Mt(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "spring",
    spring: { ...e.spring },
    ...ot(e)
  } : qn(e) ? {
    id: e.id,
    target: e.target,
    property: "text",
    textConfig: { ...e.textConfig },
    keyframes: e.keyframes.map(on),
    ...ot(e)
  } : As(e) ? {
    id: e.id,
    target: e.target,
    property: "motionPath",
    motionPathConfig: { ...e.motionPathConfig },
    keyframes: e.keyframes.map(on),
    ...ot(e)
  } : {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes.map(on),
    ...e.interpolation !== void 0 && { interpolation: e.interpolation },
    ...ot(e)
  };
}
function Vs(e) {
  return { ...e, ...Array.isArray(e.end) && { end: [...e.end] } };
}
function on(e) {
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
function pa(e) {
  if (xt(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "inertia",
      inertia: Vs(t.inertia),
      ...ot(t)
    };
  }
  if (Mt(e)) {
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
  if (qn(e)) {
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
  return En({
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes,
    ...e.interpolation !== void 0 && { interpolation: e.interpolation },
    ...ot(e)
  });
}
function ma(e) {
  const t = e._config.markers;
  return {
    formatVersion: Es(e.tracks),
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
    tracks: e.tracks.map(da),
    ...e.captions && { captions: JSON.parse(JSON.stringify(e.captions)) }
  };
}
function ne(e) {
  const t = e.formatVersion ?? 1;
  if (t > gi)
    throw new Error(
      `tinyfly: this animation uses format version ${t}, but this tinyfly reads up to version ${gi}. Update tinyfly to play it.`
    );
  return new qs({
    id: e.id,
    name: e.name,
    config: e.config,
    tracks: e.tracks.map(pa),
    captions: e.captions
  });
}
function Rf(e) {
  return JSON.stringify(ma(e));
}
function Ff(e) {
  const t = JSON.parse(e);
  return ne(t);
}
function Us(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++)
    t ^= e.charCodeAt(n), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function Un(e) {
  let t = e >>> 0 || 2654435769;
  return {
    seed: e >>> 0,
    next() {
      return t ^= t << 13, t >>>= 0, t ^= t >> 17, t ^= t << 5, t >>>= 0, t / 4294967296;
    }
  };
}
function zs(e, t, n) {
  return t + e.next() * (n - t);
}
function ga(e, t, n, i) {
  if (i <= 0) return zs(e, t, n);
  const s = Math.floor((n - t) / i), r = Math.round(e.next() * s);
  return t + r * i;
}
function Lf(e, t) {
  if (t.length !== 0)
    return t[Math.floor(e.next() * t.length)];
}
const js = /^([+\-*/])=\s*(-?[\d.]+)$/, Gs = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function Of(e) {
  return typeof e != "string" ? !1 : js.test(e.trim()) || Gs.test(e.trim());
}
function Zs(e, t = {}) {
  if (typeof e != "string") return e;
  const n = e.trim(), i = js.exec(n);
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
  const s = Gs.exec(n);
  if (s) {
    if (!t.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const r = Number.parseFloat(s[1]), o = Number.parseFloat(s[2]), a = s[3] !== void 0 ? Number.parseFloat(s[3]) : void 0;
    return a !== void 0 ? ga(t.random, r, o, a) : zs(t.random, r, o);
  }
  return e;
}
function ya(e, t = 0, n) {
  const i = [];
  let s = t;
  for (const r of e) {
    const o = Zs(r, { base: s, random: n });
    i.push(o), typeof o == "number" && (s = o);
  }
  return i;
}
class Bf {
  random;
  constructor(t) {
    this.random = Un(t);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(t, n = 0) {
    return Zs(t, { base: n, random: this.random });
  }
  resolveSequence(t, n = 0) {
    return ya(t, n, this.random);
  }
}
const ba = 600;
function wa(e) {
  if (Array.isArray(e)) {
    const [u, p, m, d] = e;
    return { fn: $i(u, p, m, d), bezier: [u, p, m, d] };
  }
  const { segments: t } = Ft(e);
  if (t.length === 0) throw new Error(`customEase: no curve in "${e}"`);
  const n = t[0].startX, i = t[0].startY, s = t[t.length - 1], r = s.endX - n, o = s.endY - i;
  if (r === 0 || o === 0) throw new Error(`customEase: "${e}" must move along both axes`);
  const a = (u) => (u - n) / r, l = (u) => (u - i) / o;
  if (t.length === 1 && s.type === "C") {
    const [u, p, m, d] = s.points, g = [a(u), l(p), a(m), l(d)];
    return { fn: $i(...g), bezier: g };
  }
  const h = [], c = [], f = Math.max(8, Math.ceil(ba / t.length));
  for (const u of t)
    for (let p = h.length === 0 ? 0 : 1; p <= f; p++) {
      const [m, d] = Sa(u, p / f);
      h.push(a(m)), c.push(l(d));
    }
  return { fn: xa(h, c) };
}
function va(e = {}) {
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
function ka(e = {}) {
  const t = Math.max(1, e.wiggles ?? 10), n = e.type ?? "easeOut", i = (s) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * s) : (1 - s) ** 2;
  return (s) => s <= 0 || s >= 1 ? 0 : Math.sin(s * t * Math.PI * 2) * i(s);
}
function Sa(e, t) {
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
function xa(e, t) {
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
function $i(e, t, n, i) {
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
const Ma = 350, Ta = 300, Ea = 550;
function Df(e, t = {}) {
  const n = t.lead ?? Ma, i = t.gap ?? Ta, s = t.tail ?? Ea, r = [];
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
function Wf(e) {
  return e.cues.map((t) => ({ id: t.id, time: t.start, label: t.text }));
}
function Nf(e, t) {
  let n = e.scenes[0];
  for (const i of e.scenes)
    if (t >= i.start) n = i;
    else break;
  return n;
}
const Js = (e) => 6e4 / e.bpm;
function zn(e, t) {
  return e.offset + t * Js(e);
}
function jn(e, t) {
  return (t - e.offset) / Js(e);
}
function Yf(e, t) {
  return zn(e, Math.round(jn(e, t)));
}
function Kf(e, t) {
  return zn(e, Math.ceil(jn(e, t) - 1e-9));
}
function qf(e, t, n) {
  const i = Math.max(1, Math.round(e.beatsPerBar ?? 4)), s = [];
  if (!(e.bpm > 0) || n < t) return s;
  for (let r = Math.ceil(jn(e, t) - 1e-9); ; r++) {
    const o = zn(e, r);
    if (o > n + 1e-9) break;
    s.push({ time: o, bar: (r % i + i) % i === 0, n: r });
  }
  return s;
}
const Et = 100;
function Xf(e, t, n = {}) {
  const i = n.minBpm ?? 70, s = n.maxBpm ?? 180, r = Math.max(1, Math.round(t / Et)), o = Math.min(e.length, Math.round((n.maxSeconds ?? 60) * t)), a = Math.floor(o / r);
  if (a < 4) return { bpm: 120, offset: 0, confidence: 0 };
  const l = new Float64Array(a);
  for (let x = 0; x < a; x++) {
    let E = 0;
    for (let T = x * r; T < (x + 1) * r; T++) E += e[T] * e[T];
    l[x] = Math.log(1e-6 + E / r);
  }
  const h = new Float64Array(a);
  for (let x = 1; x < a; x++) h[x] = Math.max(0, l[x] - l[x - 1]);
  const c = h.reduce((x, E) => x + E, 0) / a;
  for (let x = 0; x < a; x++) h[x] = Math.max(0, h[x] - c);
  const f = Math.max(1, Math.floor(60 * Et / s)), u = Math.min(a - 1, Math.ceil(60 * Et / i)), p = (x) => {
    let E = 0;
    for (let T = x; T < a; T++) E += h[T] * h[T - x];
    return E / (a - x);
  };
  let m = 0;
  for (let x = 0; x < a; x++) m += h[x] * h[x];
  m /= a;
  let d = f, g = -1 / 0;
  for (let x = f; x <= u; x++) {
    const E = 60 * Et / x, T = Math.exp(-0.5 * (Math.log2(E / 120) / 0.9) ** 2), A = p(x) * T;
    A > g && (g = A, d = x);
  }
  const y = (x) => {
    const E = Math.floor(x);
    return E < 0 || E + 1 >= a ? 0 : h[E] + (h[E + 1] - h[E]) * (x - E);
  }, w = (x, E) => {
    let T = 0;
    for (let A = E; A < a; A += x) T += y(A);
    return T;
  };
  let b = d, S = 0, v = -1 / 0;
  for (let x = d - 0.6; x <= d + 0.6 + 1e-9; x += 0.02) {
    if (x < 1) continue;
    const E = Math.max(1, Math.round(x * 4));
    for (let T = 0; T < E; T++) {
      const A = T / E * x, _ = w(x, A);
      _ > v && (v = _, S = A, b = x);
    }
  }
  const k = 60 * Et / b, M = m > 0 ? Math.max(0, Math.min(1, p(d) / m)) : 0, P = (S + 0.5) * 1e3 / Et;
  return { bpm: Math.round(k * 100) / 100, offset: Math.round(P % (6e4 / k)), confidence: M };
}
const st = (e) => Math.round(e * 1e3) / 1e3;
function Aa(e, t = {}) {
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
function Pa(e) {
  const t = (e ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let i = 0; i + 1 < t.length; i += 2) n.push({ x: t[i], y: t[i + 1] });
  return n;
}
function Gn(e) {
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
      const n = Pa(t.points);
      if (n.length === 0) return null;
      const i = n.map((s, r) => `${r === 0 ? "M" : "L"}${s.x} ${s.y}`).join(" ");
      return e.tag.toLowerCase() === "polygon" ? `${i} Z` : i;
    }
    default:
      return null;
  }
}
function Me(e, t) {
  return [e[0] + t[0], e[1] + t[1], e[2] + t[2]];
}
function Ge(e, t) {
  return [e[0] - t[0], e[1] - t[1], e[2] - t[2]];
}
function Jt(e, t) {
  return [e[0] * t, e[1] * t, e[2] * t];
}
function Qt(e, t) {
  return e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
}
function Ie(e, t) {
  return [e[1] * t[2] - e[2] * t[1], e[2] * t[0] - e[0] * t[2], e[0] * t[1] - e[1] * t[0]];
}
function Zn(e) {
  return Math.hypot(e[0], e[1], e[2]);
}
function Qs(e, t) {
  return Zn(Ge(e, t));
}
function ie(e) {
  const t = Zn(e);
  return t === 0 ? [0, 0, 0] : Jt(e, 1 / t);
}
function tr(e, t, n) {
  return [e[0] + (t[0] - e[0]) * n, e[1] + (t[1] - e[1]) * n, e[2] + (t[2] - e[2]) * n];
}
const Vf = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Me,
  cross: Ie,
  distance: Qs,
  dot: Qt,
  length: Zn,
  lerp: tr,
  normalize: ie,
  scale: Jt,
  subtract: Ge
}, Symbol.toStringTag, { value: "Module" })), _a = Math.PI / 180;
function er() {
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
function nr(e) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, e[0], e[1], e[2], 1];
}
function Te(e) {
  return [e[0], 0, 0, 0, 0, e[1], 0, 0, 0, 0, e[2], 0, 0, 0, 0, 1];
}
function se(e) {
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
function ir(e, t, n) {
  const i = se(t);
  for (let s = 0; s < 3; s++)
    i[s] *= n[0], i[4 + s] *= n[1], i[8 + s] *= n[2];
  return i[12] = e[0], i[13] = e[1], i[14] = e[2], i;
}
function Ca(e) {
  const t = new Array(16);
  for (let n = 0; n < 4; n++) for (let i = 0; i < 4; i++) t[i * 4 + n] = e[n * 4 + i];
  return t;
}
function Ha(e) {
  const [t, n, i, s, r, o, a, l, h, c, f, u, p, m, d, g] = e, y = t * o - n * r, w = t * a - i * r, b = t * l - s * r, S = n * a - i * o, v = n * l - s * o, k = i * l - s * a, M = h * m - c * p, P = h * d - f * p, x = h * g - u * p, E = c * d - f * m, T = c * g - u * m, A = f * g - u * d, _ = y * A - w * T + b * E + S * x - v * P + k * M;
  if (Math.abs(_) < 1e-12) return null;
  const C = 1 / _;
  return [
    (o * A - a * T + l * E) * C,
    (i * T - n * A - s * E) * C,
    (m * k - d * v + g * S) * C,
    (f * v - c * k - u * S) * C,
    (a * x - r * A - l * P) * C,
    (t * A - i * x + s * P) * C,
    (d * b - p * k - g * w) * C,
    (h * k - f * b + u * w) * C,
    (r * T - o * x + l * M) * C,
    (n * x - t * T - s * M) * C,
    (p * v - m * b + g * y) * C,
    (c * b - h * v - u * y) * C,
    (o * P - r * E - a * M) * C,
    (t * E - n * P + i * M) * C,
    (m * w - p * S - d * y) * C,
    (h * S - c * w + f * y) * C
  ];
}
function $a(e, t, n, i) {
  const s = 1 / Math.tan(e * _a / 2), r = 1 / (n - i);
  return [s / t, 0, 0, 0, 0, s, 0, 0, 0, 0, (i + n) * r, -1, 0, 0, 2 * i * n * r, 0];
}
function Ia(e, t, n, i, s, r) {
  const o = 1 / (t - e), a = 1 / (i - n), l = 1 / (r - s);
  return [2 * o, 0, 0, 0, 0, 2 * a, 0, 0, 0, 0, -2 * l, 0, -(t + e) * o, -(i + n) * a, -(r + s) * l, 1];
}
function Ra(e, t, n = [0, 1, 0]) {
  const i = ie(Ge(e, t)), s = ie(Ie(n, i)), r = Ie(i, s);
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
    -Qt(s, e),
    -Qt(r, e),
    -Qt(i, e),
    1
  ];
}
function sr(e, t) {
  const n = e[0] * t[0] + e[4] * t[1] + e[8] * t[2] + e[12], i = e[1] * t[0] + e[5] * t[1] + e[9] * t[2] + e[13], s = e[2] * t[0] + e[6] * t[1] + e[10] * t[2] + e[14], r = e[3] * t[0] + e[7] * t[1] + e[11] * t[2] + e[15];
  return r === 1 || r === 0 ? [n, i, s] : [n / r, i / r, s / r];
}
const Uf = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  compose: ir,
  fromQuat: se,
  identity: er,
  invert: Ha,
  lookAt: Ra,
  multiply: bt,
  orthographic: Ia,
  perspective: $a,
  scaling: Te,
  transformPoint: sr,
  translation: nr,
  transpose: Ca
}, Symbol.toStringTag, { value: "Module" })), me = {
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
}, Ii = {
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
function Fa(e) {
  let t = e.trim().toLowerCase();
  t = t.replace(/\.ease(in|out|inout)$/, ".$1");
  const n = /^([a-z]+\d?)(\(.*\))?$/.exec(t);
  return n && n[1] !== "steps" && t !== "none" && t !== "linear" && (t = `${n[1]}.out${n[2] ?? ""}`), t;
}
z({ type: "bounce", mode: "in" });
z({ type: "bounce", mode: "in-out" });
function Re(e) {
  const t = rr.get(e.trim().toLowerCase());
  if (t) return t;
  const n = Fa(e), i = /^steps\(\s*(\d+)\s*\)$/.exec(n);
  if (i) {
    const o = { type: "steps", count: Math.max(1, Number.parseInt(i[1], 10)) + 1, position: "none" };
    return { easing: o, fn: z(o) };
  }
  const s = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(n);
  if (s) {
    const [, r, o, a] = s, l = (a ?? "").split(",").map((f) => Number.parseFloat(f)).filter((f) => Number.isFinite(f)), h = o === "inout" ? "in-out" : o;
    if (r === "back" && l.length === 0 && n in me)
      return { easing: { type: "cubic-bezier", points: me[n] } };
    const c = r === "elastic" ? { type: "elastic", mode: h, ...l[0] !== void 0 && { amplitude: l[0] }, ...l[1] !== void 0 && { period: l[1] } } : r === "bounce" ? { type: "bounce", mode: h } : { type: "back", mode: h, ...l[0] !== void 0 && { overshoot: l[0] } };
    return { easing: c, fn: z(c) };
  }
  return n in Ii ? { easing: Ii[n] } : n in me ? { easing: { type: "cubic-bezier", points: me[n] } } : { easing: "ease-out" };
}
const rr = /* @__PURE__ */ new Map();
function Jn(e, t) {
  return rr.set(
    e.trim().toLowerCase(),
    t.bezier ? { easing: { type: "cubic-bezier", points: t.bezier }, fn: t.fn } : { fn: t.fn, requiresBaking: "custom" }
  ), e;
}
function An(e) {
  let t = e >>> 0;
  return () => {
    t = t + 1831565813 >>> 0;
    let n = t;
    return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const or = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function ar(e) {
  return typeof e == "string" && or.test(e);
}
function La(e = 1) {
  let t = An(e);
  const n = (l, h) => ((...c) => c.length >= l ? h(...c) : (f) => h(...c, f)), i = (l, h, c) => Math.min(Math.max(c, Math.min(l, h)), Math.max(l, h)), s = (l, h, c, f, u) => h === l ? c : c + (u - l) / (h - l) * (f - c), r = (l, h) => {
    if (typeof l == "number") return l === 0 ? h : Math.round(h / l) * l;
    if (Array.isArray(l)) return Ri(l, h, 1 / 0);
    if ("values" in l) return Ri(l.values, h, l.radius ?? 1 / 0);
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
          f[u] = $e(l[u])(l[u], h[u], c);
        return f;
      }
      return $e(l)(l, h, c);
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
      const g = d.length, w = Xn(p, g, { ...h !== void 0 ? { amount: h } : { each: c ?? 1 }, from: f }), b = h !== void 0 ? h : (c ?? 1) * _s(g, f), S = u && b > 0 ? u(w / b) * b : w;
      return l + S;
    },
    pipe: (...l) => (h) => l.reduce((c, f) => f(c), h),
    splitColor: (l) => Oa(l),
    getUnit: (l) => typeof l == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(l.trim())?.[1] ?? "",
    seed: (l) => {
      t = An(l);
    },
    resolveRandomString: (l) => {
      const h = or.exec(l)?.[1] ?? "";
      if (h.startsWith("[")) {
        const m = h.slice(1, -1).split(",").map((d) => d.trim()).filter(Boolean).map((d) => Number.isFinite(Number(d)) ? Number(d) : d.replace(/^['"]|['"]$/g, ""));
        return m[Math.floor(t() * m.length)];
      }
      const [c, f, u] = h.split(",").map((p) => Number.parseFloat(p));
      return o(c, f, Number.isFinite(u) ? u : void 0);
    }
  };
}
function Ri(e, t, n) {
  let i = t, s = 1 / 0;
  for (const r of e) {
    const o = Math.abs(r - t);
    o < s && (s = o, i = r);
  }
  return s <= n ? i : t;
}
function Oa(e) {
  const t = e.trim(), n = /^#([0-9a-f]{3,8})$/i.exec(t)?.[1];
  if (n) {
    const r = (n.length <= 4 ? [...n].map((o) => o + o).join("") : n).match(/../g).map((o) => Number.parseInt(o, 16));
    return r.length >= 4 ? [r[0], r[1], r[2], Math.round(r[3] / 255 * 1e3) / 1e3] : [r[0], r[1], r[2]];
  }
  const i = (/rgba?\(([^)]+)\)/i.exec(t)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((s) => Number.parseFloat(s));
  return i.length >= 4 ? [i[0], i[1], i[2], i[3]] : [i[0] ?? 0, i[1] ?? 0, i[2] ?? 0];
}
const Ba = /^([+-])=\s*(-?[\d.]+)$/, Da = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function Kt(e, t) {
  const n = t.scale ?? 1, i = (h) => Number.parseFloat(h) * n;
  if (e === void 0) return t.cursor;
  if (typeof e == "number") return e * n;
  const s = e.trim();
  if (s === "") return t.cursor;
  const r = Ba.exec(s);
  if (r) {
    const h = i(r[2]);
    return t.cursor + (r[1] === "-" ? -h : h);
  }
  const o = Da.exec(s);
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
function Wa(e) {
  if (typeof e != "object" || e === null) return !1;
  const t = e;
  return t.grid !== void 0 || t.from === "random" || Array.isArray(t.from) || t.ease !== void 0 || t.axis !== void 0;
}
function Na(e, t, n = {}) {
  if (e === 0) return [];
  const i = t.grid === "auto" ? Math.max(1, Math.min(e, n.columnsFromLayout?.() ?? e)) : Array.isArray(t.grid) ? Math.max(1, t.grid[1]) : e, s = Array.isArray(t.grid) ? Math.max(1, t.grid[0]) : Math.ceil(e / i), r = (m) => ({ x: m % i, y: Math.floor(m / i) }), o = t.from ?? "start", a = Array.isArray(o) ? { x: o[0] * (i - 1), y: o[1] * (s - 1) } : typeof o == "number" ? r(Math.max(0, Math.min(e - 1, o))) : o === "end" ? r(e - 1) : o === "center" || o === "edges" ? { x: (i - 1) / 2, y: (s - 1) / 2 } : { x: 0, y: 0 }, l = (m) => {
    const { x: d, y: g } = r(m), y = Math.abs(d - a.x), w = Math.abs(g - a.y);
    return t.axis === "x" ? y : t.axis === "y" ? w : Math.hypot(y, w);
  };
  let h = Array.from({ length: e }, (m, d) => l(d));
  const c = Math.max(...h);
  if (o === "edges" && (h = h.map((m) => c - m)), o === "random") {
    const m = n.random ?? Math.random;
    h = h.map(() => m() * c);
  }
  const f = t.amount !== void 0 ? t.amount : (t.each ?? 0) * c, u = t.ease ? Re(t.ease) : void 0, p = u ? u.fn ?? z(u.easing) : void 0;
  return h.map((m) => {
    const d = c === 0 ? 0 : m / c;
    return (p ? p(d) : d) * f;
  });
}
const Qn = /* @__PURE__ */ new Set([
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
]), Ya = {
  rotation: "rotate",
  rotationZ: "rotate",
  rotationX: "rotateX",
  rotationY: "rotateY",
  transformPerspective: "perspective",
  perspective: "childPerspective"
};
function Ee(e) {
  const t = {}, n = {};
  for (const [i, s] of Object.entries(e))
    Qn.has(i) ? t[i] = s : n[Ya[i] ?? i] = s;
  return { config: t, properties: n };
}
function Fe(e, t) {
  return e === void 0 ? t : e * 1e3;
}
function Pn(e, t) {
  if (e !== void 0)
    return typeof e == "number" ? { each: e * 1e3 } : Wa(e) ? { offsets: Na(t?.count ?? 0, e, t ?? {}).map((i) => i * 1e3) } : {
      ...e.each !== void 0 && { each: e.each * 1e3 },
      ...e.amount !== void 0 && { amount: e.amount * 1e3 },
      ...e.from !== void 0 && { from: e.from }
    };
}
const Ka = {
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
function lr(e) {
  return Ka[e];
}
function qa(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : e;
  if (!t || typeof t.path != "string" && !Array.isArray(t.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(t.path))
    n = Aa(t.path, { curviness: t.curviness });
  else if (ue(t.path))
    n = t.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${t.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const i = { pathData: n };
  return t.autoRotate !== void 0 && t.autoRotate !== !1 && (i.autoRotate = !0, typeof t.autoRotate == "number" && (i.rotateOffset = t.autoRotate)), t.matrix && (i.matrix = t.matrix), { config: i, start: t.start ?? 0, end: t.end ?? 1 };
}
function Xa(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : { ...e };
  return { ...t, start: t.end ?? 1, end: t.start ?? 0 };
}
function hr(e) {
  return typeof e == "object" && e !== null && "shape" in e ? e.shape : e;
}
function Va(e) {
  if (e.morphSVG === void 0) return e;
  const { morphSVG: t, ...n } = e, i = hr(t);
  if (typeof i != "string" || !ue(i))
    throw new Error(
      `gsap-compat: morphSVG "${String(i)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: i };
}
function Ua(e, t) {
  if (e === !0) return [0, t];
  if (e === !1) return [0, 0];
  if (typeof e == "number") return [0, Fi(e, t)];
  const n = e.trim().split(/[\s,]+/).filter(Boolean), i = (o) => {
    const a = Number.parseFloat(o);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${e}" is not a length or percentage`);
    return Fi(o.endsWith("%") ? t * a / 100 : a, t);
  };
  if (n.length === 0) return [0, t];
  if (n.length === 1) return [0, i(n[0])];
  const s = i(n[0]), r = i(n[1]);
  return s <= r ? [s, r] : [r, s];
}
function za(e, t) {
  const [n, i] = Ua(e, t);
  return { strokeDasharray: [i - n, t], strokeDashoffset: -n };
}
function ja(e, t) {
  if (e.drawSVG === void 0) return e;
  const { drawSVG: n, ...i } = e;
  return { ...i, ...za(n, t) };
}
function Ga(e) {
  if (e.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return e;
}
function Fi(e, t) {
  return Math.max(0, Math.min(t, e));
}
function Za(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++) t = Math.imul(t ^ e.charCodeAt(n), 16777619);
  return t >>> 0;
}
function Ja(e, t, n) {
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
      seed: s.seed ?? Za(`${t}|${s.text}`)
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
function ti(e) {
  return Math.max(0.1, e / 25);
}
function Qa(e, t) {
  const n = typeof t == "number" ? { velocity: t } : t;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const i = n.friction ?? (n.resistance !== void 0 ? ti(n.resistance) : void 0), s = {
    from: e,
    velocity: n.velocity,
    ...i !== void 0 && { friction: i },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? s.end = [n.end(He(s))] : n.end !== void 0 && (s.end = Array.isArray(n.end) ? [...n.end] : n.end), s;
}
function tl(e) {
  const t = e === !0 ? {} : typeof e == "string" ? { preset: e } : e;
  if (t.preset !== void 0 && !(t.preset in Je))
    throw new Error(
      `gsap-compat: unknown spring preset "${t.preset}" — use one of ${Object.keys(Je).join(", ")}`
    );
  return {
    ...t.preset ? Je[t.preset] : {},
    ...t.stiffness !== void 0 && { stiffness: t.stiffness },
    ...t.damping !== void 0 && { damping: t.damping },
    ...t.mass !== void 0 && { mass: t.mass },
    ...t.restDelta !== void 0 && { restDelta: t.restDelta }
  };
}
function el(e, t) {
  if (e === !0 || typeof e == "string") return;
  const n = e.velocity;
  return typeof n == "number" ? n : n?.[t];
}
class It {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = An(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(t = {}) {
    this.options = t, this.timeline = new qs({
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
    return this.build(t, void 0, qt(n), i);
  }
  /** Animate from the given values to where the property already is. */
  from(t, n, i) {
    const { config: s, properties: r } = Ee(qt(n)), { motionPath: o, text: a, scrambleText: l, ...h } = r, c = this.targetsOf(t)[0], f = { ...s };
    for (const m of Object.keys(h))
      f[m] = this.resolveStart(c, m);
    o !== void 0 && (f.motionPath = Xa(o));
    const u = {}, p = String(this.resolveStart(c, "text"));
    return a !== void 0 && (u.text = an(a), f.text = typeof a == "object" ? { ...a, value: p } : p), l !== void 0 && (u.text = an(l), f.scrambleText = typeof l == "object" ? { ...l, text: p } : p), this.build(t, { ...h, ...u }, f, i);
  }
  /** Animate between two explicit sets of values. */
  fromTo(t, n, i, s) {
    const { properties: r } = Ee(qt(n));
    return this.build(t, r, qt(i), s);
  }
  /** Set values instantly — a single held keyframe. */
  set(t, n, i) {
    return this.build(t, void 0, { ...qt(n), duration: 0 }, i);
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
    const n = Math.max(0, Kt(t, this.context()));
    return this.previousStart = n, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), n;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(t) {
    return Kt(t, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(t, n) {
    return this.labels.set(t, Kt(n, this.context())), this;
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
    const i = Kt(n, this.context());
    for (const r of t.timeline.tracks) {
      if (!("keyframes" in r)) continue;
      const o = En({
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
    const { config: r, properties: o } = Ee(i), { motionPath: a, text: l, scrambleText: h, inertia: c, ...f } = o, u = this.targetsOf(t), p = Kt(s, this.context()), m = Fe(r.delay, 0), d = Fe(r.duration, 500), g = Pn(r.stagger, {
      count: u.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(u) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), y = this.easingFor(r.ease), w = [], b = r.spring;
    let S = 0, v = !1;
    for (const [T, A] of Object.entries(f)) {
      const _ = A;
      let C = n?.[T] !== void 0 ? n[T] : this.resolveStart(u[0], T);
      if (typeof C != typeof _ && (this.warn(
        `no usable start value for "${T}" on "${u[0]}" — it will snap to ${String(_)}. Use fromTo() to animate it.`
      ), C = _), b !== void 0 && (typeof C != "number" || typeof _ != "number") && this.warn(`spring works on numbers, so "${T}" on "${u[0]}" eases instead`), b !== void 0 && typeof C == "number" && typeof _ == "number") {
        const R = {
          ...tl(b),
          from: C,
          to: _,
          velocity: el(b, T) ?? this.options.startVelocity?.(u[0], T) ?? 0
        }, L = this.nextTrackId(`${u[0]}-${T}-spring`), F = {
          id: L,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: T,
          kind: "spring",
          spring: R,
          delay: p + m
        };
        this.timeline.addTrack(F), w.push(L), S = Math.max(S, ao(R));
        for (const I of u) this.lastValues.set(`${I}|${T}`, _);
        continue;
      }
      v = !0;
      const H = this.keyframesFor(C, _, d, y, r.ease), $ = this.nextTrackId(`${u[0]}-${T}`);
      this.timeline.addTrack(
        En({
          id: $,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: T,
          delay: p + m,
          keyframes: H,
          // A quaternion is a rotation: it turns the short way round (see Track.interpolation).
          ...T === "quaternion" && { interpolation: "slerp" }
        })
      ), w.push($);
      for (const R of u) this.lastValues.set(`${R}|${T}`, _);
    }
    const k = Ja({ text: l, scrambleText: h }, u[0], d);
    if (k) {
      const T = n?.text ?? n?.scrambleText, A = T !== void 0 ? an(T) : this.resolveStart(u[0], "text"), _ = this.nextTrackId(`${u[0]}-text`), C = {
        id: _,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...g && u.length > 1 && { stagger: g },
        property: "text",
        textConfig: { from: typeof A == "string" ? A : String(A ?? ""), ...k },
        delay: p + m,
        keyframes: this.keyframesFor(0, 1, d, y, r.ease)
      };
      this.timeline.addTrack(C), w.push(_);
      for (const H of u) this.lastValues.set(`${H}|text`, k.to);
    }
    if (a !== void 0) {
      const { config: T, start: A, end: _ } = qa(a), C = this.nextTrackId(`${u[0]}-motionPath`), H = {
        id: C,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...g && u.length > 1 && { stagger: g },
        property: "motionPath",
        motionPathConfig: T,
        delay: p + m,
        keyframes: this.keyframesFor(A, _, d, y, r.ease)
      };
      this.timeline.addTrack(H), w.push(C);
    }
    if (c !== void 0)
      for (const [T, A] of Object.entries(c)) {
        const _ = this.resolveStart(u[0], T);
        if (typeof _ != "number") {
          this.warn(`inertia on "${T}" needs a numeric start value; skipped`);
          continue;
        }
        const C = Qa(_, A), H = this.nextTrackId(`${u[0]}-${T}-inertia`), $ = {
          id: H,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: T,
          kind: "inertia",
          inertia: C,
          delay: p + m
        };
        this.timeline.addTrack($), w.push(H), S = Math.max(S, ce(C));
        for (const R of u) this.lastValues.set(`${R}|${T}`, he(C));
      }
    const x = ((c !== void 0 || b !== void 0) && !v && !k && a === void 0 ? S : Math.max(d, S)) + (g && u.length > 1 ? Ve(u.length, g) : 0), E = p + m + x;
    return this.previousStart = p + m, this.previousEnd = E, this.cursor = Math.max(this.cursor, E), {
      trackIds: w,
      start: p + m,
      end: E,
      kill: () => {
        for (const T of w) this.timeline.removeTrack(T);
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
    const a = typeof r == "string" ? Re(r) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && Ce(s)) {
      const h = a?.fn ?? z(s);
      return [o, ...Ys(o, { time: i, value: n }, h, { intervalMs: this.options.bakeIntervalMs })];
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
    const o = lr(n);
    return o !== void 0 ? (this.warn(
      `no start value for "${n}" on "${t}" — using the static default ${o}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), o) : (this.warn(`no start value or default for "${n}" on "${t}" — using 0`), 0);
  }
  easingFor(t) {
    if (t !== void 0) {
      if (typeof t == "string") return Re(t).easing;
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
function an(e) {
  if (typeof e == "string") return e;
  if (e && typeof e == "object") {
    const t = e;
    return String(t.value ?? t.text ?? "");
  }
  return String(e ?? "");
}
function nl(e) {
  return new It(e);
}
function qt(e) {
  return Ga(Va(e));
}
function il(e) {
  return !Array.isArray(e) || e.length !== 4 ? null : `matrix3d(${se(gt(e)).map((n) => Math.round(n * 1e6) / 1e6 + 0).join(", ")})`;
}
const sl = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), rl = "#ffffff", ol = "rgba(0, 0, 0, 0.5)";
function al(e) {
  const t = [];
  if (e.blur !== void 0 && t.push(`blur(${Math.max(0, e.blur)}px)`), e.brightness !== void 0 && t.push(`brightness(${Math.max(0, e.brightness)})`), e.glow !== void 0 && t.push(`drop-shadow(0 0 ${Math.max(0, e.glow)}px ${e.glowColor ?? rl})`), e.shadowX !== void 0 || e.shadowY !== void 0 || e.shadowBlur !== void 0) {
    const n = e.shadowX ?? 0, i = e.shadowY ?? 0, s = Math.max(0, e.shadowBlur ?? 0);
    t.push(`drop-shadow(${n}px ${i}px ${s}px ${e.shadowColor ?? ol})`);
  }
  return t.length > 0 ? t.join(" ") : null;
}
function ll(e, t) {
  const n = e.childNodes.length === 1 ? e.firstChild : null;
  if (n && n.nodeType === 3) {
    const i = n;
    i.data !== t && (i.data = t);
    return;
  }
  e.textContent !== t && (e.textContent = t);
}
function hl(e) {
  if (!("ownerSVGElement" in e)) return;
  const t = e.style;
  !t || t.transformBox || (t.transformBox = "fill-box", t.transformOrigin || (t.transformOrigin = "50% 50%"));
}
const Li = /* @__PURE__ */ new Set([
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
]), cl = /* @__PURE__ */ new Set([
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
]), ul = [
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
], fl = /* @__PURE__ */ new Set(["childPerspective", "perspectiveOriginX", "perspectiveOriginY"]), dl = /* @__PURE__ */ new Set(["originX", "originY"]), pl = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), ml = /* @__PURE__ */ new Set(["drawOn"]), gl = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, Oi = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, yl = "http://www.w3.org/2000/svg";
class kt {
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
      if (!(m === "x" && l) && !(m === "y" && h) && !((m === "rotate" || m === "rotateZ") && c) && !ml.has(m)) {
        if (cl.has(m))
          (i ??= {})[m] = d;
        else if (fl.has(m))
          typeof d == "number" && ((s ??= {})[m] = d);
        else if (dl.has(m))
          typeof d == "number" && ((r ??= {})[m] = d);
        else if (pl.has(m))
          typeof d == "number" && ((o ??= {})[m] = d);
        else if (sl.has(m))
          (a ??= {})[m] = d;
        else if (m !== "perspective") {
          if (m !== "shine") if (m === "text" && typeof d == "string")
            ll(t, d);
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
      for (const m of ul) {
        const d = i[m];
        if (d === void 0) continue;
        const g = this.buildTransformPart(m, d);
        g && u.push(g);
      }
    if (u.length > 0 && (t.style.transform = u.join(" "), hl(t)), s && (s.childPerspective !== void 0 && (t.style.perspective = `${s.childPerspective}px`), (s.perspectiveOriginX !== void 0 || s.perspectiveOriginY !== void 0) && (t.style.perspectiveOrigin = `${s.perspectiveOriginX ?? 50}% ${s.perspectiveOriginY ?? 50}%`)), r) {
      const m = r.originX ?? 50, d = r.originY ?? 50;
      t.style.transformOrigin = `${m}% ${d}%`;
    }
    if (o) {
      const m = o.clipTop ?? 0, d = o.clipRight ?? 0, g = o.clipBottom ?? 0, y = o.clipLeft ?? 0;
      t.style.clipPath = `inset(${m}% ${d}% ${g}% ${y}%)`;
    }
    if (a) {
      const m = al(a);
      m && (t.style.filter = m);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(t, n) {
    if (t === "quaternion") return il(n);
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
    if (t.namespaceURI === yl && n in Oi) {
      const a = Array.isArray(i) ? i.join(", ") : String(i);
      t.style[Oi[n]] = a;
      return;
    } else n === "fill" && t.dataset?.elementType === "text" ? s = "color" : s = gl[n] ?? n;
    let o;
    typeof i == "number" ? Li.has(n) || Li.has(s) ? o = `${i}px` : o = String(i) : Array.isArray(i) ? o = i.join(", ") : o = i, t.style[s] = o;
  }
}
const bl = {
  request: (e) => requestAnimationFrame(e),
  cancel: (e) => cancelAnimationFrame(e)
};
class wl {
  adapter = new kt();
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
  utils = La();
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
    this.scheduler = t.scheduler ?? bl, this.rootOption = t.root, this.onWarning = t.onWarning;
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
      ln(i) && this.currentCollector?.touch(i, s), n.push(s);
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
    if (ln(t)) return [t];
    if (!vl(t)) return [t];
    const n = [];
    for (const i of Array.from(t))
      n.push(...this.targetsOf(i));
    return n;
  }
  nameFor(t) {
    return ln(t) ? this.elementName(t) : this.objectName(t);
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
function ln(e) {
  return typeof e == "object" && e !== null && e.nodeType === 1;
}
function vl(e) {
  if (Array.isArray(e)) return !0;
  const t = e;
  return typeof t.length == "number" && typeof t.item == "function";
}
function Le(e) {
  const t = e.style;
  if (!t) return e.getBoundingClientRect();
  const n = t.transform;
  t.transform = "none";
  const i = e.getBoundingClientRect();
  return t.transform = n, i;
}
const Bi = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function kl(e) {
  const t = {};
  for (const n of Array.from(e.attributes)) t[n.name] = n.value;
  return t;
}
function Sl(e) {
  const t = e.getScreenCTM?.();
  if (t) return [t.a, t.b, t.c, t.d, t.e, t.f];
  const n = e.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function xl(e, t) {
  const n = typeof e == "string" || Array.isArray(e) || Bi(e) ? { path: e } : e, { align: i, alignOrigin: s, path: r, ...o } = n, a = (k) => {
    const M = Bi(k) ? k : t.query(k);
    return M || t.warn(`gsap-compat: motionPath could not find "${String(k)}"`), M;
  };
  let l = null, h = "";
  if (Array.isArray(r) || typeof r == "string" && ue(r))
    h = r;
  else {
    l = a(r);
    const k = l && Gn({ tag: l.localName, attributes: kl(l) });
    l && !k && t.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), h = k ?? "";
  }
  const c = { ...o, path: h };
  if (i === void 0 || i === !1) return c;
  const f = i === !0 ? l : a(i);
  if (!f)
    return i === !0 && t.warn("gsap-compat: motionPath align: true needs the path to be an element"), c;
  const u = t.targets[0];
  if (!u) return c;
  const [p, m, d, g, y, w] = Sl(f), b = Le(u), [S, v] = s ?? [0.5, 0.5];
  for (const k of t.targets.slice(1)) {
    const M = Le(k);
    if (Math.abs(M.left - b.left) > 0.5 || Math.abs(M.top - b.top) > 0.5) {
      t.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return c.matrix = [p, m, d, g, y - b.left - S * b.width, w - b.top - v * b.height], c;
}
const cr = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function ur(e) {
  const t = {};
  for (const n of Array.from(e.attributes)) t[n.name] = n.value;
  return t;
}
function fr(e) {
  if (!e) return null;
  const t = Gn({ tag: e.localName, attributes: ur(e) });
  return t || (e.querySelector("path")?.getAttribute("d") ?? null);
}
function Ml(e, t, n) {
  const i = hr(e);
  if (typeof i == "string" && ue(i)) return i;
  const s = cr(i) ? i : typeof i == "string" ? t(i) : null, r = fr(s);
  return r || (n(`gsap-compat: morphSVG could not find a shape for "${String(i)}"`), "");
}
const Tl = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function El(e, t = document) {
  return (typeof e == "string" ? Array.from(t.querySelectorAll(e)) : cr(e) ? [e] : Array.from(e)).map((i) => {
    if (i.localName === "path") return i;
    const s = Gn({ tag: i.localName, attributes: ur(i) });
    if (!s || !i.parentNode) return i;
    const r = i.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const o of Array.from(i.attributes))
      Tl.has(o.name) || r.setAttribute(o.name, o.value);
    return r.setAttribute("d", s), i.parentNode.replaceChild(r, i), r;
  });
}
const Di = 0.3;
class Al {
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
    this.dragging = !0, this.passedTolerance = !1, this.startX = t, this.startY = n, this.lastX = t, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = Wi(), this.options.onPress?.(this.stateFrom(0, 0, i));
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
    const i = Wi(), s = Math.max(1, i - this.lastTime);
    this.lastTime = i;
    const r = t / s * 1e3, o = n / s * 1e3;
    this.velocityX += (r - this.velocityX) * Di, this.velocityY += (o - this.velocityY) * Di;
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
function Wi() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function Pl(e, t, n) {
  let i = { delta: 0, line: null }, s = n;
  for (const r of e)
    for (const o of t) {
      const a = Math.abs(o - r);
      a <= s && (s = a, i = { delta: o - r, line: o });
    }
  return i;
}
function _l(e, t) {
  return t <= 0 ? [] : e.map((n) => Math.round(n / t) * t);
}
class dr {
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
    this.options = t, this.x = t.initialX ?? 0, this.y = t.initialY ?? 0, this.observer = new Al({
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
    const s = (this.options.axis ?? "both") === "y" ? this.y : this.x, r = Cl(s / i);
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
      ..._l([i], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], r = Pl([i], s, this.snapThreshold());
    i += r.delta, n === "x" ? this.snappedX = r.line : this.snappedY = r.line;
    const o = this.options.bounds;
    if (o) {
      const a = n === "x" ? o.minX : o.minY, l = n === "x" ? o.maxX : o.maxY;
      a !== void 0 && (i = Math.max(a, i)), l !== void 0 && (i = Math.min(l, i));
    }
    return i;
  }
}
function Cl(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e;
}
function zf(e) {
  const t = new dr(e);
  return t.start(), t;
}
const Hl = { x: "x", y: "y", "x,y": "both" }, _n = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function Ni(e, t) {
  const n = Le(e), i = t.getBoundingClientRect();
  return {
    minX: i.left - n.left,
    maxX: i.right - n.right,
    minY: i.top - n.top,
    maxY: i.bottom - n.bottom
  };
}
function Yi(e) {
  return Array.isArray(e) ? [...e] : e;
}
function $l(e, t, n, i = {}) {
  const [s] = t.resolveTargets(n), r = s ? t.elementFor(s) : void 0;
  if (!s || !r)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  if (i.type === "rotation") return Il(e, t, s, r, i);
  const o = Hl[i.type ?? "x,y"], a = () => {
    const d = t.appliedValue(s, "x"), g = t.appliedValue(s, "y");
    return { x: typeof d == "number" ? d : 0, y: typeof g == "number" ? g : 0 };
  }, l = typeof i.bounds == "string" ? t.query(i.bounds) : _n(i.bounds) ? i.bounds : null, c = { bounds: (!l && i.bounds && !_n(i.bounds) ? i.bounds : void 0) ?? (l ? Ni(r, l) : void 0) };
  let f = null;
  const u = () => {
    f?.kill(), f = null;
  }, p = (d) => {
    const g = i.inertia === !0 ? {} : i.inertia, y = g.friction ?? (g.resistance !== void 0 ? ti(g.resistance) : 4), w = a(), b = c.bounds ?? {};
    let S, v;
    const k = g.end;
    if (Array.isArray(k)) {
      const P = He({ from: w.x, velocity: o === "y" ? 0 : d.x, friction: y }), x = He({ from: w.y, velocity: o === "x" ? 0 : d.y, friction: y });
      let E = k[0];
      for (const T of k)
        Math.hypot(T.x - P, T.y - x) < Math.hypot(E.x - P, E.y - x) && (E = T);
      E && (S = [E.x], v = [E.y]);
    } else typeof k == "number" ? (S = k, v = k) : k && (S = Yi(k.x), v = Yi(k.y));
    const M = {};
    o !== "y" && (M.x = { velocity: d.x, friction: y, min: b.minX, max: b.maxX, end: S }), o !== "x" && (M.y = { velocity: d.y, friction: y, min: b.minY, max: b.maxY, end: v }), f = e.to(r, { inertia: M, onComplete: () => i.onThrowComplete?.() });
  }, m = new dr({
    target: r,
    axis: o,
    snap: i.snap,
    get bounds() {
      return c.bounds;
    },
    getPosition: a,
    onPress: () => {
      u(), l && (c.bounds = Ni(r, l)), i.onPress?.();
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
function Il(e, t, n, i, s) {
  const r = typeof s.bounds == "object" && s.bounds !== null && !_n(s.bounds) ? s.bounds : {}, o = () => {
    const b = t.appliedValue(n, "rotate");
    return typeof b == "number" ? b : 0;
  }, a = (b) => Math.min(r.maxRotation ?? 1 / 0, Math.max(r.minRotation ?? -1 / 0, b));
  let l = null, h = !1, c, f = { x: 0, y: 0 }, u = 0, p = 0, m = [];
  const d = (b) => Math.atan2(b.clientY - f.y, b.clientX - f.x) * 180 / Math.PI, g = (b) => {
    if (h) return;
    l?.kill(), l = null, h = !0, c = b.pointerId, i.setPointerCapture?.(b.pointerId);
    const S = i.getBoundingClientRect();
    f = { x: S.left + S.width / 2, y: S.top + S.height / 2 }, u = d(b), p = o(), m = [{ time: performance.now(), rotation: p }], s.onPress?.();
  }, y = (b) => {
    if (!h || b.pointerId !== c) return;
    const S = d(b);
    let v = S - u;
    v > 180 && (v -= 360), v < -180 && (v += 360), u = S, p += v;
    let k = a(p);
    s.snap && (k = a(Math.round(k / s.snap) * s.snap)), t.apply(n, { rotate: k });
    const M = performance.now();
    for (m.push({ time: M, rotation: k }); m.length > 2 && M - m[0].time > 100; ) m.shift();
    const P = { x: 0, y: 0 };
    s.onDrag?.(P);
  }, w = (b) => {
    if (!h || b.pointerId !== c) return;
    h = !1;
    const S = m[0], v = m[m.length - 1], k = S && v ? (v.time - S.time) / 1e3 : 0, M = k > 0 ? (v.rotation - S.rotation) / k : 0;
    if (s.onRelease?.({ x: M, y: 0 }), !s.inertia) return;
    const P = s.inertia === !0 ? {} : s.inertia, x = P.friction ?? (P.resistance !== void 0 ? ti(P.resistance) : 4), E = typeof P.end == "number" || Array.isArray(P.end) ? P.end : void 0;
    l = e.to(i, {
      inertia: {
        rotate: {
          velocity: M,
          friction: x,
          min: r.minRotation,
          max: r.maxRotation,
          end: Array.isArray(E) ? E.filter((T) => typeof T == "number") : E
        }
      },
      onComplete: () => s.onThrowComplete?.()
    });
  };
  return i.addEventListener("pointerdown", g), i.addEventListener("pointermove", y), i.addEventListener("pointerup", w), i.addEventListener("pointercancel", w), i.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return o();
    },
    destroy() {
      l?.kill(), i.removeEventListener("pointerdown", g), i.removeEventListener("pointermove", y), i.removeEventListener("pointerup", w), i.removeEventListener("pointercancel", w);
    }
  };
}
const Rl = { opacity: 0, scale: 0.6 };
function Fl(e) {
  const t = e.getBoundingClientRect();
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function Ki(e) {
  const t = Le(e);
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function Cn(e, t) {
  const i = e.resolveTargets(t).map((o) => e.elementFor(o)).filter((o) => !!o), s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of i) {
    const a = Fl(o);
    s.set(o, a);
    const l = pr(o);
    a && l !== void 0 && !r.has(l) && r.set(l, { element: o, box: a });
  }
  return { elements: i, boxes: s, ids: r };
}
const hn = /* @__PURE__ */ new WeakMap();
function Hn(e, t, n, i = {}) {
  const s = i.duration ?? 0.6, r = i.ease ?? "power2.inOut", o = i.stagger ?? 0, a = i.scale !== !1, l = i.enter === void 0 ? Rl : i.enter, h = new Set(n.elements);
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
    const m = Ki(p);
    if (!m) continue;
    let d = n.boxes.get(p) ?? null, g;
    const y = pr(p), w = !d && y !== void 0 ? n.ids.get(y) : void 0;
    w && w.element !== p && (d = w.box, g = w.element);
    const [b] = e.resolveTargets(p);
    hn.get(p)?.timeline.removeTracks({ target: b });
    const S = u * o;
    if (!d) {
      if (l === !1) continue;
      f.fromTo(p, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...mr(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: s, ease: r, delay: S }, 0), hn.set(p, f), u++;
      continue;
    }
    const v = d.cx - m.cx, k = d.cy - m.cy, M = a ? d.width / m.width : 1, P = a ? d.height / m.height : 1;
    if (!(Math.abs(v) > 0.5 || Math.abs(k) > 0.5 || Math.abs(M - 1) > 1e-3 || Math.abs(P - 1) > 1e-3)) {
      const T = (A, _) => {
        const C = e.appliedValue(b, A);
        return typeof C == "number" && Math.abs(C - _) > 1e-6;
      };
      (T("x", 0) || T("y", 0) || T("scaleX", 1) || T("scaleY", 1)) && f.set(p, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const E = i.fade === !0 && g !== void 0;
    f.fromTo(
      p,
      { x: v, y: k, scaleX: M, scaleY: P, ...E && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...E && { opacity: 1 }, duration: s, ease: r, delay: S },
      0
    ), E && g && Ki(g) && f.fromTo(g, { opacity: 1 }, { opacity: 0, duration: s, ease: r, delay: S }, 0), hn.set(p, f), u++;
  }
  return f;
}
function pr(e) {
  return e.dataset?.flipId;
}
function mr(e) {
  const t = {};
  for (const n of Object.keys(e))
    t[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return t;
}
function Ll(e, t = {}) {
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
      const y = (g.textContent ?? "").replace(/\s+/g, " ").trim(), w = Ol(g, i.words), b = n.has("chars") ? w.flatMap((k) => Bl(k, i.chars)) : [], S = n.has("lines") ? Wl(g, w, i.lines) : [];
      if (s) {
        !g.hasAttribute("aria-label") && y && g.setAttribute("aria-label", y);
        for (const k of w) k.setAttribute("aria-hidden", "true");
      }
      if (n.has("words")) d.words.push(...w);
      else for (const k of w) k.removeAttribute("class");
      d.chars.push(...b), d.lines.push(...S);
      const v = t.mask === "lines" ? S : t.mask === "words" ? w : t.mask === "chars" ? b : [];
      for (const k of v) d.masks.push(Nl(k, `${i[t.mask]}-mask`));
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
      const b = () => {
        g = !1, p.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(b) : setTimeout(b, 0);
    };
    if (typeof ResizeObserver == "function") {
      l = new ResizeObserver((b) => {
        let S = !1;
        for (const v of b) {
          const k = Math.round(v.contentRect.width), M = d.get(v.target);
          d.set(v.target, k), M !== void 0 && M !== k && (S = !0);
        }
        S && y();
      });
      for (const b of e) l.observe(b);
    }
    const w = e[0]?.ownerDocument?.fonts;
    w && w.status !== "loaded" && w.ready.then(() => y());
  }
  return p;
}
function Ol(e, t) {
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
function Bl(e, t) {
  const n = e.ownerDocument, i = Dl(e.textContent ?? "").map((s) => {
    const r = n.createElement("span");
    return r.className = t, r.style.display = "inline-block", r.textContent = s, r;
  });
  return e.replaceChildren(...i), i;
}
function Dl(e) {
  const t = Intl.Segmenter;
  return t ? Array.from(new t(void 0, { granularity: "grapheme" }).segment(e), (n) => n.segment) : Array.from(e);
}
function Wl(e, t, n) {
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
    for (let b = m.parentNode; b && b !== e; b = b.parentNode) g.unshift(b);
    let y = 0;
    for (; y < u.length && y < g.length && u[y].original === g[y]; ) y++;
    u.length = y;
    let w = y === 0 ? l : u[y - 1].clone;
    for (const b of g.slice(y)) {
      const S = b.cloneNode(!1);
      w.appendChild(S), u.push({ original: b, clone: S }), w = S;
    }
    w.appendChild(m);
  }
  return e.replaceChildren(...a), a;
}
function Nl(e, t) {
  const n = e.ownerDocument.createElement("span");
  return n.className = t, n.style.display = e.style.display === "block" ? "block" : "inline-block", n.style.overflow = "clip", n.style.paddingBottom = "0.12em", n.style.marginBottom = "-0.12em", e.replaceWith(n), n.appendChild(e), n;
}
const qi = {
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
function Xi(e) {
  const t = e.trim().toLowerCase();
  if (t in qi) return qi[t];
  if (t.endsWith("%")) {
    const n = Number.parseFloat(t.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function gr(e) {
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
  const s = i[0] !== void 0 ? Xi(i[0]) : void 0, r = i[1] !== void 0 ? Xi(i[1]) : void 0;
  return {
    elementFraction: s ?? 0,
    viewportFraction: r ?? 0,
    offsetPx: t
  };
}
function re(e, t, n) {
  const i = gr(n), s = i.absolutePx !== void 0 ? e.top + i.absolutePx : e.top + e.height * i.elementFraction, r = t * i.viewportFraction;
  return s - r + i.offsetPx;
}
function jf(e, t, n, i) {
  const s = re(e, t, n), o = re(e, t, i) - s;
  return o <= 0 ? s <= 0 ? 1 : 0 : yr(-s / o);
}
function yr(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e === 0 ? 0 : e;
}
function Yl(e, t, n, i) {
  if (n <= 0) return t;
  const s = 1 - Math.exp(-(i / 1e3) / n);
  return e + (t - e) * s;
}
function Vi(e, t, n, i, s) {
  const r = (c) => re({ top: e + s(c), bottom: e + s(c) + t, height: t }, n, i), o = r(0), a = r(1);
  if (Math.sign(o) === Math.sign(a) || o === 0 || a === 0)
    return o === 0 ? 0 : a === 0 ? 1 : Math.abs(o) < Math.abs(a) ? 0 : 1;
  let l = 0, h = 1;
  for (let c = 0; c < 40; c++) {
    const f = (l + h) / 2;
    Math.sign(r(f)) === Math.sign(o) ? l = f : h = f;
  }
  return (l + h) / 2;
}
class Kl {
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
function Gf(e) {
  const t = new Kl(e);
  return t.start(), t;
}
class ql {
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
const Xl = 0.15;
function Vl(e) {
  return typeof e == "object" && !Array.isArray(e) ? e : { snapTo: e };
}
function Ul(e, t, n) {
  const i = ge(e + t * Xl);
  if (typeof n == "function") return ge(n(i));
  if (typeof n == "number")
    return n <= 0 ? e : ge(Math.round(i / n) * n);
  if (n.length === 0) return e;
  let s = n[0];
  for (const r of n)
    Math.abs(r - i) < Math.abs(s - i) && (s = r);
  return ge(s);
}
function zl(e, t, n) {
  const i = e.duration ?? { min: 0.2, max: 0.8 };
  if (typeof i == "number") return i;
  const s = Math.min(1, Math.abs(t) / Math.max(1, n));
  return i.min + (i.max - i.min) * s;
}
class jl {
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
  animate(t, n, i, s = je, r) {
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
function ge(e) {
  return Math.max(0, Math.min(1, e));
}
class Gl {
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
const Zl = 120, Ht = [], Ot = /* @__PURE__ */ new Set();
let cn = !1;
const Jl = () => {
  cn || Ot.size === 0 || (cn = !0, queueMicrotask(() => {
    cn = !1;
    for (const e of Ot) e.afterRefresh();
  }));
}, br = () => {
  for (const e of Ot) e.beforeRefresh();
  for (const e of Ht) e.refresh();
  for (const e of Ot) e.afterRefresh();
};
let $t = { width: 0, height: 0 };
const Ui = () => {
  const e = window.innerWidth, t = window.innerHeight, n = e === $t.width && t !== $t.height, i = Math.abs(t - $t.height) < $t.height * 0.25, s = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  n && i && s || ($t = { width: e, height: t }, br());
};
class Ze {
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
    this.timeline = t.timeline, this.options = t, this.snapper = new jl((n) => this.scrollTo(n), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const t = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    t && !this.options.container && (this.pin = new ql(t, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new Gl(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), Ht.length === 0 && typeof window < "u" && ($t = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", Ui, { passive: !0 })), Ht.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), Ht.splice(Ht.indexOf(this), 1), Ht.length === 0 && typeof window < "u" && window.removeEventListener("resize", Ui), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    br();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(t) {
    return Ot.add(t), () => Ot.delete(t);
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
      if (this.startPx = t + re(n, i, Xt(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(n, i, t), this.pin) {
        const s = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(s.top - (this.startPx - t), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(i) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, t), this.lastScroll = null, this.updateFrom(t, !this.measured), this.measured = !0, Jl();
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
    this.targetProgress = i > 0 ? yr((t - this.startPx) / i) : t >= this.startPx ? 1 : 0, this.zone = i > 0 ? t <= this.startPx ? "before" : t >= this.endPx ? "after" : "active" : t >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(s, this.zone), n || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const t = this.options.scrub;
    return typeof t == "number" ? Math.max(0, t) : 0;
  }
  resolveEnd(t, n, i) {
    const s = Xt(this.options.end) ?? "bottom top", r = typeof s == "string" ? s.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (r) {
      const o = Number.parseFloat(r[1]);
      return this.startPx + (r[2] === "%" ? n * o / 100 : o);
    }
    return i + re(t, n, s);
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
    }, Zl));
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
    const n = Vl(t), i = () => {
      this.snapTimer = null;
      const s = this.endPx - this.startPx, r = this.scrollPosition();
      if (!this.running || s <= 0 || r <= this.startPx || r >= this.endPx) return;
      const o = (r - this.startPx) / s, a = this.startPx + Ul(o, this.releaseVelocity / s, n.snapTo) * s;
      Math.abs(a - r) < 1 || this.snapper.animate(r, a, zl(n, a - r, this.viewportHeight()), n.ease);
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
    const i = n.getBoundingClientRect(), s = this.options.scroller?.getBoundingClientRect?.().left ?? 0, r = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, o = i.left - s - t.shiftAt(t.progress()), { start: a, end: l } = t.range(), h = (p) => a + p * (l - a), c = Vi(o, i.width, r, Xt(this.options.start) ?? "left right", t.shiftAt);
    this.startPx = h(c);
    const f = Xt(this.options.end) ?? "right left", u = typeof f == "string" ? f.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = u ? this.startPx + Number.parseFloat(u[1]) : h(Vi(o, i.width, r, f, t.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(t) {
    const n = (r, o) => {
      const a = Xt(r) ?? o;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const l = gr(a);
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
      this.lastFrameTime = n, this.displayProgress = Yl(this.displayProgress, this.targetProgress, this.smoothing(), i);
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
function Xt(e) {
  return typeof e == "function" ? e() : e;
}
function Zf(e) {
  const t = new Ze(e);
  return t.start(), t;
}
const un = /* @__PURE__ */ new Set(), Ql = 16, zi = 0.5, th = 2;
class ji {
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
    return t.addEventListener("wheel", this.onWheel, { passive: !1 }), t.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), un.add(this), this.stopListening = Ze.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const t of un) t.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const t = this.options.scroller ?? window;
    return t.removeEventListener("wheel", this.onWheel), t.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), un.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const t of this.effects) fn(t.element, t.saved);
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
    this.target = i, this.journey = { from: this.current, to: i, ms: r * 1e3, ease: n.ease ?? je, elapsed: 0 }, this.requestFrame();
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
    for (const t of this.effects) fn(t.element, t.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(t) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || t.ctrlKey || Math.abs(t.deltaX) > Math.abs(t.deltaY) || this.nestedScrollerTakes(t)) return;
    const n = t.deltaMode === 1 ? Ql : t.deltaMode === 2 ? this.viewportHeight() : 1, i = t.deltaY * n * (this.options.wheelMultiplier ?? 1), s = this.clamp(this.target + i);
    s === this.target && s === this.current || (t.preventDefault(), this.journey = null, this.target = s, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const t = this.position();
    this.written !== null && Math.abs(t - this.written) <= th || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = t, this.requestFrame());
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
      this.current += (this.target - this.current) * (1 - Math.exp(-n / r)), Math.abs(this.target - this.current) < zi && (this.current = this.target);
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
        s.lagged = t === 0 ? i : s.lagged + (i - s.lagged) * (1 - Math.exp(-t / o)), Math.abs(i - s.lagged) < zi ? s.lagged = i : n = !0, r += i - s.lagged;
      }
      fn(s.element, r === 0 ? s.saved : `0 ${eh(r)}px`), s.shift = r;
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
function fn(e, t) {
  t ? e.style.setProperty("translate", t) : e.style.removeProperty("translate");
}
function eh(e) {
  return Math.round(e * 100) / 100;
}
function nh(e, t) {
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
function ei(e, t, n, i, s = () => {
}) {
  const r = (p) => typeof p == "string" ? e.query(p) ?? void 0 : p, o = r(t.trigger) ?? i;
  if (!o) {
    s(`gsap-compat: scrollTrigger has no trigger element${typeof t.trigger == "string" ? ` for "${t.trigger}"` : ""}`);
    return;
  }
  const a = t.scrub === void 0 || t.scrub === !1 ? !1 : t.scrub, l = (t.toggleActions ?? "play none none none").trim().split(/\s+/);
  let h = 0, c;
  const f = (p, m) => () => {
    m?.(), n && !a && nh(n, l[p] ?? "none"), t.once && p === 0 && queueMicrotask(() => c.destroy());
  }, u = t.containerAnimation ? rh(e, t.containerAnimation, o, s) : void 0;
  return c = new Ze({
    trigger: o,
    start: t.start,
    end: t.end,
    scrub: a === !1 ? void 0 : a,
    pin: t.pin === !0 ? !0 : r(t.pin),
    scroller: r(t.scroller),
    horizontal: t.horizontal,
    pinSpacing: t.pinSpacing,
    onRefresh: t.invalidateOnRefresh && n?.invalidate ? () => n.invalidate() : void 0,
    snap: t.snap === void 0 ? void 0 : ih(t.snap, n),
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
function ih(e, t) {
  const n = (s) => s === "labels" ? (r) => sh(r, t?.labelProgresses?.() ?? []) : s;
  if (typeof e != "object" || Array.isArray(e)) return n(e);
  const i = e.ease ? Re(e.ease) : void 0;
  return {
    snapTo: n(e.snapTo),
    duration: e.duration,
    delay: e.delay,
    ease: i ? i.fn ?? z(i.easing) : void 0
  };
}
function sh(e, t) {
  return t.reduce((n, i) => Math.abs(i - e) < Math.abs(n - e) ? i : n, t[0] ?? e);
}
function rh(e, t, n, i) {
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
class wr {
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
class oh {
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
    const r = new wr(this.host, this.scope);
    r.conditions = n, r.add(() => t.setup(r)), t.context = r;
  }
}
class ah {
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
const lh = { opacity: 0, y: -16 }, hh = { opacity: 0, y: 16 };
async function ch(e, t, n, i) {
  const s = t.collector?.scope ?? t.root, r = s.ownerDocument ?? s, o = () => i.shared ? [...s.querySelectorAll(i.shared)] : [];
  if (i.native && typeof r.startViewTransition == "function")
    return uh(r, i, o);
  const a = i.duration ?? 0.35, l = i.ease ?? "power2.inOut", h = (g) => new Promise((y) => {
    g(y) || y();
  }), c = o(), f = c.length ? Cn(t, c) : void 0, u = i.from !== void 0 ? Gi(t, i.from, i.shared) : [];
  if (u.length && i.leave !== !1) {
    const g = i.leave ?? lh;
    await h((y) => e.to(u, { ...g, duration: a, ease: l, onComplete: y }));
  }
  await i.update();
  const p = [], m = typeof i.to == "function" ? i.to() : i.to, d = m !== void 0 ? Gi(t, m, i.shared) : [];
  if (d.length && i.enter !== !1) {
    const g = i.enter ?? hh;
    p.push(h((y) => e.fromTo(d, g, { ...mr(g), duration: a, ease: l, onComplete: y })));
  }
  if (f) {
    const g = o().filter((y) => !c.includes(y));
    g.length && p.push(
      h(
        (y) => Hn(t, n, f, {
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
function Gi(e, t, n) {
  const i = e.resolveTargets(t).map((s) => e.elementFor(s)).filter((s) => !!s);
  return n ? i.flatMap((s) => !s.querySelector(n) && !s.matches(n) ? [s] : [...s.children].filter((r) => !r.matches(n) && !r.querySelector(n))) : i;
}
async function uh(e, t, n) {
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
const fh = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (e, t) => Jn(e, wa(t))
}, dh = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (e, t) => Jn(e, { fn: va(t) })
}, ph = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (e, t) => Jn(e, { fn: ka(t) })
}, mh = /* @__PURE__ */ new Set([
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
]), Zi = 0.5, gh = "power1.inOut";
function yh(e) {
  return e.keyframes !== void 0 && e.keyframes !== null;
}
function bh(e) {
  const t = e.keyframes, n = {};
  for (const [h, c] of Object.entries(e)) mh.has(h) || (n[h] = c);
  if (Array.isArray(t))
    return t.map((h) => ({
      ...n,
      ...h,
      duration: h.duration ?? e.duration ?? Zi
    }));
  const i = Object.entries(t), s = e.duration ?? Zi, r = t.easeEach ?? e.easeEach ?? gh;
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
function Ji(e, t, n, i = {}) {
  const s = t.collector?.scope ?? t.root, r = typeof i.scroller == "string" ? s.querySelector(i.scroller) : i.scroller ?? null, o = {
    x: r ? r.scrollLeft : window.scrollX,
    y: r ? r.scrollTop : window.scrollY
  }, a = {
    x: r ? r.scrollWidth - r.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: r ? r.scrollHeight - r.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, l = (w, b) => {
    if (b === void 0) return o[w];
    if (typeof b == "number") return b;
    if (b === "max") return a[w];
    const S = typeof b == "string" ? s.querySelector(b) : b;
    if (!S) return o[w];
    const v = S.getBoundingClientRect(), k = r?.getBoundingClientRect(), M = (w === "x" ? i.offsetX : i.offsetY) ?? i.offset ?? 0;
    return w === "x" ? v.left - (k?.left ?? 0) + o.x - M : v.top - (k?.top ?? 0) + o.y - M;
  }, h = typeof n == "object" && n !== null && !("nodeType" in n) ? { x: l("x", n.x), y: l("y", n.y) } : { x: o.x, y: l("y", n) }, c = { x: Math.max(0, Math.min(a.x, h.x)), y: Math.max(0, Math.min(a.y, h.y)) }, f = { ...o }, u = () => {
    r ? (r.scrollLeft = f.x, r.scrollTop = f.y) : window.scrollTo({ left: f.x, top: f.y, behavior: "instant" });
  }, p = ["wheel", "touchstart", "keydown"], m = r ?? window, d = () => {
    y.kill(), g();
  }, g = () => {
    for (const w of p) m.removeEventListener(w, d);
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
  if (i.autoKill !== !1) for (const w of p) m.addEventListener(w, d, { passive: !0 });
  return y;
}
function wh(e, t, n) {
  const i = e.collector?.scope ?? e.root, s = typeof t == "string" ? [...i.querySelectorAll(t)] : "nodeType" in t ? [t] : Array.from(t), { interval: r = 0.1, batchMax: o, onEnter: a, onLeave: l, onEnterBack: h, onLeaveBack: c, ...f } = n, u = { onEnter: a, onLeave: l, onEnterBack: h, onLeaveBack: c }, p = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, m = {}, d = (y) => {
    m[y] !== void 0 && clearTimeout(m[y]), m[y] = void 0;
    const w = p[y].splice(0);
    w.length > 0 && u[y]?.(w);
  }, g = (y, w) => {
    if (u[y]) {
      if (p[y].push(w), o !== void 0 && p[y].length >= o) return d(y);
      m[y] === void 0 && (m[y] = setTimeout(() => d(y), r * 1e3));
    }
  };
  return s.map(
    (y) => ei(e, {
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
    if (this.options = i, this.compat = new It({
      ...i,
      startValue: (s, r) => {
        const o = t.objectFor(s);
        if (o) return xh(o[r]);
        const a = t.appliedValue(s, r);
        if (a !== void 0) return a;
        if (r === "d") return fr(t.elementFor(s)) ?? void 0;
        if (r === "text") return t.elementFor(s)?.textContent ?? void 0;
        if (r === "strokeDasharray" || r === "strokeDashoffset") {
          const l = es(t.elementFor(s));
          if (l !== void 0) return r === "strokeDasharray" ? [l, l] : 0;
        }
      },
      startVelocity: (s, r) => t.velocityOf(s, r),
      layoutColumns: (s) => ts(s.map((r) => t.elementFor(r))),
      random: () => t.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, t.collector?.track(this), t.liveTimelines.add(this), this.autoplayPending = !i.paused && !i.scrollTrigger, i.scrollTrigger) {
      const s = i.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = ei(t, s, this, this.firstElement, (r) => i.onWarning?.(r)));
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
    return yh(n) ? this.record(() => this.keyframed(t, n, i)) : this.record(() => this.tween(t, [n], i, ([s], r, o) => this.compat.to(r, s, o)));
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
    const s = this.events, { crossings: r, passes: o } = Xs(
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
    const r = bh(n);
    if (r.length === 0) return;
    const o = s.length > 1 ? Pn(n.stagger, this.staggerContext(s)) : void 0, a = s.map((g) => this.targetFor(g)).filter((g) => g !== void 0), l = o ? a.map((g) => [g]) : [a], h = o ? kn(s.length, o).map((g) => g / 1e3) : [0], c = this.compat.timeOf(i) / 1e3 + Fe(n.delay, 0) / 1e3;
    let f = 1 / 0, u = -1 / 0;
    if (l.forEach((g, y) => {
      r.forEach((w, b) => {
        const S = b === 0 ? c + h[y] : ">";
        this.tween(g, [w], S, ([v], k, M) => this.compat.to(k, v, M)), f = Math.min(f, this.compat.lastStart), u = Math.max(u, this.compat.lastEnd);
      });
    }), f === 1 / 0) return;
    const { onStart: p, onUpdate: m, onComplete: d } = n;
    p && this.events.push({ time: f, direction: "forward", run: p }), m && this.ranges.push({ start: f, end: u, run: m }), d && this.events.push({ time: u, direction: "forward", run: d });
  }
  staggerContext(t) {
    return {
      count: t.length,
      columnsFromLayout: () => ts(t.map((n) => this.stage.elementFor(n))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(t, n, i, s) {
    const r = t.map((u) => this.targetFor(u));
    if (!(t.length > 1 && (n.some(Sh) || t.some((u) => this.stage.objectFor(u) !== void 0)))) {
      const u = this.targetFor(t[0]);
      s(n.map((p) => this.prepare(Qi(p, 0, u, this.stage.utils, r), t)), t, i);
      return;
    }
    const a = n.length - 1, { stagger: l, ...h } = n[a], c = Pn(l, this.staggerContext(t)), f = c ? kn(t.length, c).map((u) => u / 1e3) : t.map(() => 0);
    t.forEach((u, p) => {
      const m = p === 0 ? Fe(h.delay, 0) / 1e3 + f[0] : 0, d = p === 0 ? 0 : f[p] - f[p - 1], g = p === 0 ? i : `<${d < 0 ? "-" : "+"}${Math.abs(d).toFixed(6)}`, w = n.map((b, S) => S === a ? { ...h, delay: m } : b).map((b) => this.prepare(Qi(b, p, this.targetFor(u), this.stage.utils, r), [u]));
      s(w, [u], g);
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
      const o = xl(t.motionPath, {
        query: s,
        targets: n.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: i
      });
      r = { ...r, motionPath: o };
    }
    if (t.morphSVG !== void 0) {
      const o = Ml(t.morphSVG, s, i), { morphSVG: a, ...l } = r;
      r = o ? { ...r, morphSVG: o } : l;
    }
    if (t.drawSVG !== void 0) {
      const o = es(this.stage.elementFor(n[0]));
      if (o === void 0) {
        i("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...l } = r;
        r = l;
      } else
        r = ja(r, o);
    }
    return r;
  }
  resolve(t) {
    const n = this.stage.resolveTargets(t);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${Mh(t)}`);
      return;
    }
    return this.firstElement ??= n.map((i) => this.stage.elementFor(i)).find((i) => i !== void 0), n;
  }
}
function vh(e = new wl()) {
  const t = (r) => {
    const { config: o } = Ee(r);
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
      return l ? l[o] : e.appliedValue(a, o) ?? lr(o);
    },
    scrollTrigger: (r) => i(ei(e, r)),
    scrollBatch: (r, o) => wh(e, r, o).map((a) => i(a)),
    scrollTo: (r, o) => Ji(s, e, r, o),
    refreshScroll: () => {
      Ze.refreshAll(), ji.refreshAll();
    },
    smoothScroll: (r = {}) => {
      const o = typeof r.scroller == "string" ? (e.collector?.scope ?? e.root).querySelector(r.scroller) : r.scroller;
      return i(new ji({ ...r, scroller: o }).start());
    },
    context: (r, o) => {
      const a = new wr(e, o);
      return r && a.add(() => r(a)), a;
    },
    matchMedia: (r) => new oh(e, r),
    customEase: fh.create,
    customBounce: dh.create,
    customWiggle: ph.create,
    pageTransition: (r) => ch(s, e, (o) => new ct(e, o), r),
    imageSequence: (r, o) => {
      const a = typeof r == "string" ? (e.collector?.scope ?? e.root).querySelector(r) : r;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(r)}`);
      return i(new ah(a, o));
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
          ...a.spring !== void 0 && { spring: kh(a.spring, o, u) }
        }), l.timeline.stop(), l.timeline.play(), e.activate(l.timeline);
      }, { tween: l, kill: () => l.kill() });
    },
    timeline: (r) => new ct(e, r),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (r, o) => {
      if (o.scrollTo !== void 0) {
        const { scrollTo: a, ...l } = o, h = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, c = typeof r != "string" && r !== window && r.nodeType === 1;
        return Ji(s, e, a, {
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
    convertToPath: (r) => El(r, e.root),
    splitText: (r, o) => {
      const a = e.collector?.scope ?? e.root, l = typeof r == "string" ? Array.from(a.querySelectorAll(r)) : "nodeType" in r ? [r] : Array.from(r);
      return i(Ll(l, o));
    },
    draggable: (r, o) => i($l(s, e, r, o)),
    getFlipState: (r) => Cn(e, r),
    flipFrom: (r, o) => Hn(e, (a) => new ct(e, a), r, o),
    flip: (r, o, a) => {
      const l = Cn(e, r);
      return o(), Hn(e, (h) => new ct(e, h), l, { targets: r, ...a });
    }
  };
  return s;
}
const Z = /* @__PURE__ */ vh();
function kh(e, t, n) {
  return e === !0 ? { velocity: { [t]: n } } : typeof e == "string" ? { preset: e, velocity: { [t]: n } } : { ...e, velocity: { [t]: n } };
}
function Sh(e) {
  return e.morphSVG !== void 0 || e.drawSVG !== void 0 || e.text !== void 0 || e.scrambleText !== void 0 || vr(e);
}
function vr(e) {
  return Object.entries(e).some(([t, n]) => (typeof n == "function" || ar(n)) && !Qn.has(t));
}
function Qi(e, t, n, i, s) {
  if (!vr(e)) return e;
  const r = {};
  for (const [o, a] of Object.entries(e))
    Qn.has(o) ? r[o] = a : typeof a == "function" ? r[o] = a(t, n, s) : ar(a) ? r[o] = i.resolveRandomString(a) : r[o] = a;
  return r;
}
function ts(e) {
  const t = e.map((i) => i?.getBoundingClientRect().top);
  if (t[0] === void 0) return e.length;
  let n = 0;
  for (const i of t) {
    if (i === void 0 || Math.abs(i - t[0]) > 1) break;
    n++;
  }
  return Math.max(1, n);
}
function es(e) {
  const t = e;
  if (typeof t?.getTotalLength == "function")
    return t.getTotalLength();
}
function xh(e) {
  if (typeof e == "number" || typeof e == "string" || Array.isArray(e) && e.every((t) => typeof t == "number")) return e;
}
function Mh(e) {
  return typeof e == "string" ? `"${e}"` : String(e);
}
class ns {
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
function Th(e, t, n, i, s) {
  const r = n - s;
  if (r < 0) {
    t.paused || t.pause(), t.currentTime = 0;
    return;
  }
  e.update(r, i);
}
class ni {
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
    this.options = n, this.adapter = new kt();
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
    this.options.speed !== void 0 && (n.speed = this.options.speed), this.options.loop !== void 0 && (n.loop = this.options.loop), this.options.alternate !== void 0 && (n.alternate = this.options.alternate), this.timeline = ne({ ...t, config: n }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
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
      r !== null && (i.volume = Math.max(0, Math.min(1, Number(r) || 0))), this.mediaTargets.push({ el: i, startTime: s, sync: new ns(i) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(t, n) {
    for (const i of this.mediaTargets)
      Th(i.sync, i.el, t, n, i.startTime);
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
      const o = new kt();
      i.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const l = a.getAttribute("data-tinyfly");
        l && o.registerTarget(l, a);
      }), this.symbolInstances.push({ adapter: o, timeline: ne(r.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(t, n) {
    this.mediaSync = new ns(t, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const { crossings: r } = Xs(
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
async function Jf(e, t, n = {}) {
  const i = new ni(e, { ...n, autoplay: !0 });
  return await i.load(t), i;
}
function Qf(e, t = {}) {
  return new ni(e, t);
}
const Eh = {
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
}, is = "tinyfly-controls-style", Ah = `
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
let Ph = 0;
function _h(e) {
  if (e.getElementById(is)) return;
  const t = e.createElement("style");
  t.id = is, t.textContent = Ah, e.head.appendChild(t);
}
function Ch(e, t, n = {}) {
  const i = t.ownerDocument;
  _h(i);
  const s = { ...Eh, ...n.labels }, r = n.speeds ?? [0.5, 1, 2], o = () => e.markers.length > 0, a = () => e.markers.some((H) => H.label !== void 0 || e.caption(H.id) !== void 0), l = i.createElement("div");
  l.className = "tf-ctl";
  const h = i.createElement("div");
  h.className = "tf-ctl-bar", h.setAttribute("role", "group");
  const c = (H, $, R, L = "") => {
    const F = i.createElement("button");
    return F.type = "button", F.className = `tf-ctl-btn ${L}`.trim(), F.setAttribute("aria-label", H), F.title = H, F.textContent = $, F.addEventListener("click", R), F;
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
  const w = i.createElement("select");
  w.className = "tf-ctl-speed", w.setAttribute("aria-label", s.speed);
  for (const H of r) {
    const $ = i.createElement("option");
    $.value = String(H), $.textContent = `${H}×`, H === 1 && ($.selected = !0), w.appendChild($);
  }
  w.addEventListener("change", () => e.setSpeed(Number(w.value))), h.append(f, u, p, m, g, y), r.length > 0 && h.append(w), l.append(h);
  const b = n.fullscreen ? Rh(t, i, s) : void 0;
  b && h.append(b.button);
  const S = i.createElement("p");
  S.className = "tf-ctl-caption", S.setAttribute("aria-live", "polite"), n.captions !== !1 && l.append(S);
  const v = i.createElement("div");
  v.className = "tf-ctl-question", v.hidden = !0;
  const k = i.createElement("span"), M = c(s.reveal, s.reveal, () => e.play(), "tf-ctl-primary");
  v.append(k, M), l.append(v);
  const P = Hh(e, i, s.scenario, n.scenarioControl ?? "buttons");
  P && l.append(P.element);
  const x = n.mount;
  x ? x.appendChild(l) : t.insertAdjacentElement("afterend", l);
  const E = () => {
    const H = e.isPlaying;
    p.textContent = H ? "❚❚" : "▶", p.setAttribute("aria-label", H ? s.pause : s.play), p.title = H ? s.pause : s.play;
    const $ = e.duration;
    i.activeElement !== g && (g.value = String($ > 0 ? Math.round(e.currentTime / $ * 1e3) : 0));
    const R = e.markers;
    if (u.hidden = m.hidden = y.hidden = R.length === 0, R.length > 0) {
      const L = e.currentMarker, F = L ? R.indexOf(L) + 1 : 0;
      y.textContent = s.stepFormat.replace("{index}", String(F)).replace("{total}", String(R.length)), y.setAttribute("aria-label", `${s.step} ${F} ${s.of} ${R.length}`), u.disabled = e.currentTime <= 0.5, m.disabled = e.currentTime >= $ - 0.5;
      const I = e.caption() ?? "";
      S.textContent !== I && (S.textContent = I), S.hidden = !a();
      const O = !H && L?.question !== void 0 && Math.abs(e.currentTime - L.time) < 1;
      v.hidden = !O, O && k.textContent !== L.question && (k.textContent = L.question);
    } else
      v.hidden = !0, S.hidden = !0;
    P?.update();
  }, T = e.subscribe(E);
  E();
  const A = n.keyboardScope ?? t;
  !A.hasAttribute("tabindex") && A.tabIndex < 0 && (A.tabIndex = 0);
  const _ = /* @__PURE__ */ new WeakSet(), C = (H) => {
    if (_.has(H) || (_.add(H), H.defaultPrevented || H.altKey || H.ctrlKey || H.metaKey)) return;
    const $ = H.target;
    if (!($.tagName === "INPUT" || $.tagName === "SELECT") && !(H.key === " " && $.tagName === "BUTTON"))
      switch (H.key) {
        case " ":
          H.preventDefault(), e.isPlaying ? e.pause() : d();
          break;
        case "ArrowRight":
          if (!o()) return;
          H.preventDefault(), e.next();
          break;
        case "ArrowLeft":
          if (!o()) return;
          H.preventDefault(), e.prev();
          break;
        case "Home":
          H.preventDefault(), e.pause(), e.seek(0);
          break;
        case "f":
        case "F":
          if (!b) return;
          H.preventDefault(), b.active ? b.exit() : b.enter();
          break;
      }
  };
  return A.addEventListener("keydown", C), l.addEventListener("keydown", C), {
    element: l,
    fullscreen: b && {
      get active() {
        return b.active;
      },
      enter: b.enter,
      exit: b.exit
    },
    destroy() {
      b?.destroy(), T(), A.removeEventListener("keydown", C), l.removeEventListener("keydown", C), l.remove();
    }
  };
}
function Hh(e, t, n, i) {
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
  const a = `tf-ctl-scenario-${++Ph}`, l = s.map((c) => {
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
const $h = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', Ih = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function Rh(e, t, n) {
  const i = t, s = e, r = t.createElement("button");
  r.type = "button", r.className = "tf-ctl-btn tf-ctl-fullscreen";
  let o, a = "";
  const l = () => {
    const d = o !== void 0;
    r.innerHTML = d ? Ih : $h;
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
const ss = "tinyfly-choices-style", Fh = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function Lh(e) {
  if (e.getElementById(ss)) return;
  const t = e.createElement("style");
  t.id = ss, t.textContent = Fh, e.head.appendChild(t);
}
function Oh(e, t) {
  const n = Array.from(t.querySelectorAll("[data-tinyfly-choose]"));
  if (n.length === 0) return () => {
  };
  Lh(t.ownerDocument);
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
const Oe = /* @__PURE__ */ new WeakMap(), $n = /* @__PURE__ */ new WeakMap();
let Bh = 0;
function jt(e, t, n) {
  if (e)
    try {
      return JSON.parse(e);
    } catch (i) {
      console.warn(`tinyfly: invalid ${t} JSON on`, n, i);
      return;
    }
}
async function Dh(e, t = {}) {
  const n = Oe.get(e);
  if (n) return n;
  const i = Array.from(e.querySelectorAll("script[data-tinyfly-timeline]")), s = i[0], r = e.getAttribute("data-src"), o = Nh(e.getAttribute("data-markers")), a = i.length > 1 || s?.hasAttribute("data-scenario") ? Wh(i, o, e) : void 0;
  if (a && a.length === 0) return;
  let l = s && !a ? jt(s.textContent, "timeline", e) : void 0;
  if (!l && r && o) {
    const p = await fetch(r);
    p.ok && (l = await p.json());
  }
  if (l && o && (l = kr(l, o)), !l && !r && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', e);
    return;
  }
  const h = jt(e.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", e), c = {
    playWhenVisible: !0,
    ...t.player,
    ...h && { captions: h },
    ...jt(e.getAttribute("data-options"), "data-options", e)
  };
  Kh(e);
  const f = new ni(e, c), u = { element: e, player: f };
  if (Oe.set(e, u), e.setAttribute("data-tinyfly-mounted", ""), a) {
    const p = e.getAttribute("data-scenario") ?? void 0;
    await f.loadScenarios(a, { initial: a.some((m) => m.id === p) ? p : void 0 }), $n.set(e, Oh(f, e));
  } else
    await f.load(l ?? r);
  if (e.getAttribute("data-controls") !== "false") {
    const p = jt(e.getAttribute("data-labels"), "data-labels", e), m = e.querySelector("figcaption"), d = e.getAttribute("data-scenario-legend"), g = e.getAttribute("data-scenario-control");
    u.controls = Ch(f, e, {
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
function Wh(e, t, n) {
  const i = [];
  return e.forEach((s, r) => {
    const o = jt(s.textContent, "timeline", n);
    if (!o) return;
    const a = s.getAttribute("data-scenario") || `scenario-${r + 1}`;
    if (i.some((h) => h.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, n);
      return;
    }
    const l = s.getAttribute("data-scenario-label") ?? void 0;
    i.push({ id: a, label: l, timeline: t ? kr(o, t) : o });
  }), i;
}
function kr(e, t) {
  return e.config.markers?.length ? e : { ...e, config: { ...e.config, markers: t.map((n, i) => ({ id: `step-${i + 1}`, time: n })) } };
}
function Nh(e) {
  if (!e) return;
  const t = e.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((n, i) => n - i);
  return t.length > 0 ? t : void 0;
}
async function Yh(e = document, t = {}) {
  const n = Array.from(e.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(n.map((s) => Dh(s, t)))).filter((s) => s !== void 0);
}
function td(e) {
  const t = Oe.get(e);
  t && ($n.get(e)?.(), $n.delete(e), t.controls?.destroy(), t.player.destroy(), Oe.delete(e), e.removeAttribute("data-tinyfly-mounted"));
}
function Kh(e) {
  const t = e.querySelector("svg");
  if (!t || t.hasAttribute("role") || t.hasAttribute("aria-hidden")) return;
  const n = e.getAttribute("data-alt"), i = e.querySelector("figcaption");
  t.setAttribute("role", "img"), n ? t.setAttribute("aria-label", n) : i && (i.id ||= `tinyfly-caption-${++Bh}`, t.setAttribute("aria-labelledby", i.id));
}
function qh() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const t = () => {
    Yh();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", t, { once: !0 }) : t();
}
class Xh {
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
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new kt(), this.adapterB = new kt();
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
      const a = new kt();
      s.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const h = l.getAttribute("data-tinyfly");
        h && a.registerTarget(h, l);
      }), i.push({ adapter: a, timeline: ne(o) });
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
    return t.timeline ? ne(t.timeline) : null;
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
async function ed(e, t, n = {}) {
  const i = new Xh(e, { ...n, autoplay: !0 });
  return await i.load(t), i;
}
const nd = { type: "none", duration: 0 };
function Vh(e) {
  let t = 0;
  for (let n = 1; n < e.length; n++) t += Math.hypot(e[n].x - e[n - 1].x, e[n].y - e[n - 1].y);
  return t;
}
function oe(e, t) {
  const n = Math.min(1, Math.max(0, t));
  if (e.length < 2 || n === 1) return e.slice();
  if (n === 0) return e.slice(0, 1);
  let i = Vh(e) * n;
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
function ii(e, t) {
  const n = oe(e, t);
  return n[n.length - 1];
}
function Sr(e, t) {
  return t > 0 ? Math.floor(Math.max(0, e) * t / 1e3) : 0;
}
function In(e, t, n) {
  const i = t.roughness ?? 2, s = Math.max(1, Math.round(t.passes ?? 2)), r = Sr(n, t.boil ?? 8);
  let o = 0;
  const a = () => {
    const u = o++;
    return (p) => Un(Us(`${t.seed ?? 1}:${r}:${u}:${p}`));
  }, l = (u, p) => (u.next() * 2 - 1) * p, h = (u) => {
    const p = a(), m = e.lineWidth, d = e.globalAlpha;
    for (let g = 0; g < s; g++)
      e.lineWidth = g === 0 ? m : m * 0.55, e.globalAlpha = g === 0 ? d : d * 0.6, u(p(g));
    e.lineWidth = m, e.globalAlpha = d;
  }, c = (u, p = 1) => {
    if (u.length < 2) return;
    const m = u.slice(1).map((g, y) => Math.hypot(g.x - u[y].x, g.y - u[y].y)), d = m.reduce((g, y) => g + y, 0) * Math.min(1, Math.max(0, p));
    h((g) => {
      const y = [], w = [];
      if (u.forEach((S, v) => {
        y.push({ x: S.x + l(g, i * 0.5), y: S.y + l(g, i * 0.5) }), v > 0 && w.push([g.next() * 2 - 1, g.next() * 2 - 1]);
      }), d <= 0) return;
      e.beginPath(), e.moveTo(y[0].x, y[0].y);
      let b = 0;
      for (let S = 1; S < y.length; S++) {
        const v = Uh(y[S - 1], y[S], i, w[S - 1]), k = m[S - 1];
        if (b + k <= d) {
          e.bezierCurveTo(v[1].x, v[1].y, v[2].x, v[2].y, v[3].x, v[3].y), b += k;
          continue;
        }
        const M = zh(v, k === 0 ? 1 : (d - b) / k);
        e.bezierCurveTo(M[1].x, M[1].y, M[2].x, M[2].y, M[3].x, M[3].y);
        break;
      }
      e.stroke();
    });
  }, f = (u, p, m, d, g = 1) => {
    h((y) => {
      const b = y.next() * Math.PI * 2, S = Math.PI * 2 + 0.15 + y.next() * 0.3, v = [];
      for (let M = 0; M <= 14; M++) {
        const P = b + S * M / 14, x = l(y, i * 0.6);
        v.push({ x: u + Math.cos(P) * (m + x), y: p + Math.sin(P) * (d + x) });
      }
      const k = oe(v, g);
      k.length < 2 || (rs(e, k), e.stroke());
    });
  };
  return {
    line: c,
    curve(u, p = 1) {
      if (u.length < 2) return;
      const m = u[0], d = u[u.length - 1], g = Math.hypot(d.x - m.x, d.y - m.y) || 1, y = -(d.y - m.y) / g, w = (d.x - m.x) / g;
      h((b) => {
        const S = { x: l(b, i * 0.5), y: l(b, i * 0.5) }, v = { x: l(b, i * 0.5), y: l(b, i * 0.5) }, k = l(b, i * Math.min(1.5, Math.max(0.3, g / 80))), M = u.map((x, E) => {
          const T = E / (u.length - 1), A = Math.sin(Math.PI * T) * k;
          return {
            x: x.x + S.x + (v.x - S.x) * T + y * A,
            y: x.y + S.y + (v.y - S.y) * T + w * A
          };
        }), P = oe(M, p);
        P.length < 2 || (rs(e, P), e.stroke());
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
function Uh(e, t, n, i) {
  const s = t.x - e.x, r = t.y - e.y, o = Math.hypot(s, r) || 1, a = n * Math.min(1.5, Math.max(0.3, o / 80)), l = -r / o, h = s / o;
  return [
    e,
    { x: e.x + s / 3 + l * i[0] * a, y: e.y + r / 3 + h * i[0] * a },
    { x: e.x + 2 * s / 3 + l * i[1] * a, y: e.y + 2 * r / 3 + h * i[1] * a },
    t
  ];
}
function zh([e, t, n, i], s) {
  const r = (f, u) => ({ x: f.x + (u.x - f.x) * s, y: f.y + (u.y - f.y) * s }), o = r(e, t), a = r(t, n), l = r(n, i), h = r(o, a), c = r(a, l);
  return [e, o, h, r(h, c)];
}
function rs(e, t) {
  e.beginPath(), e.moveTo(t[0].x, t[0].y);
  for (let i = 1; i < t.length - 1; i++) {
    const s = { x: (t[i].x + t[i + 1].x) / 2, y: (t[i].y + t[i + 1].y) / 2 };
    e.quadraticCurveTo(t[i].x, t[i].y, s.x, s.y);
  }
  const n = t[t.length - 1];
  e.lineTo(n.x, n.y);
}
function Ae(e, t, n) {
  const i = e.length;
  if (i < 2) return [];
  const s = [], r = [], o = (a) => t + (n - t) * a / (i - 1);
  return e.forEach((a, l) => {
    const h = e[Math.max(0, l - 1)], c = e[Math.min(i - 1, l + 1)], f = Math.hypot(c.x - h.x, c.y - h.y) || 1, u = o(l) / 2, p = -(c.y - h.y) / f * u, m = (c.x - h.x) / f * u;
    s.push({ x: a.x + p, y: a.y + m }), r.push({ x: a.x - p, y: a.y - m });
  }), [...s, ...r.reverse()];
}
function si(e, t, n, i) {
  const s = t.length;
  if (s < 2) return;
  const r = Ae(t, n, i), o = (a) => n + (i - n) * a / (s - 1);
  e.beginPath(), e.moveTo(r[0].x, r[0].y);
  for (const a of r.slice(1)) e.lineTo(a.x, a.y);
  e.closePath(), e.fill(), t.forEach((a, l) => {
    l !== 0 && l !== s - 1 && s > 3 || (e.beginPath(), e.arc(a.x, a.y, o(l) / 2, 0, Math.PI * 2), e.fill());
  });
}
function Bt(e, t, n, i, s = 16) {
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
function os(e, t, n, i, s, r = 0, o = 1, a = 40) {
  const l = Math.cos(s), h = Math.sin(s);
  return Array.from({ length: a + 1 }, (c, f) => {
    const u = r + Math.PI * 2 * o * f / a, p = Math.cos(u) * n, m = Math.sin(u) * i;
    return { x: e + p * l - m * h, y: t + p * h + m * l };
  });
}
function xr(e, t) {
  return t.look === "pencil" ? Jh(e, t) : jh(e, t.ink, t.look);
}
function Be(e, t, n = !1) {
  e.beginPath(), e.moveTo(t[0].x, t[0].y);
  for (const i of t.slice(1)) e.lineTo(i.x, i.y);
  n && e.closePath();
}
function jh(e, t, n) {
  const i = n === "silhouette", s = i ? 1.25 : 1;
  return {
    look: n,
    ink: t,
    limb(r, o, a) {
      e.fillStyle = t, si(e, r, o * s, a * s);
    },
    line(r, o) {
      r.length < 2 || (e.strokeStyle = t, e.lineWidth = o * s, e.lineCap = "round", e.lineJoin = "round", Be(e, r), e.stroke());
    },
    shape(r, o, a) {
      Be(e, r, !0), (o !== null || i) && (e.fillStyle = i ? t : o, e.fill()), !(a <= 0) && (e.strokeStyle = t, e.lineWidth = a * s, e.lineJoin = "round", e.stroke());
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
function Gh(e, t) {
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
function Zh(e, t) {
  const n = e.length;
  return e.map((i, s) => {
    const r = e[Math.max(0, s - 1)], o = e[Math.min(n - 1, s + 1)], a = Math.hypot(o.x - r.x, o.y - r.y) || 1, l = t(n === 1 ? 0 : s / (n - 1));
    return { x: i.x - (o.y - r.y) / a * l, y: i.y + (o.x - r.x) / a * l };
  });
}
function as(e) {
  const t = [0.6, 1.4, 2.9].map((i) => ({
    frequency: i * (0.8 + e.next() * 0.4),
    phase: e.next() * Math.PI * 2,
    amount: 0.5 + e.next() * 0.5
  })), n = t.reduce((i, s) => i + s.amount, 0);
  return (i) => t.reduce((s, r) => s + r.amount * Math.sin(Math.PI * 2 * r.frequency * i + r.phase), 0) / n;
}
function Jh(e, t) {
  const n = t.pencil ?? {}, i = t.ink, s = n.roughness ?? Math.max(1, t.lineWidth * 0.12), r = Math.max(1, Math.round(n.passes ?? 2)), o = Math.min(1, Math.max(0, n.pressure ?? 0.25)), a = Math.min(1, Math.max(0, n.rubbedOut ?? 0.15)), l = Sr(t.time, n.boil ?? 8);
  let h = 0;
  const c = (m, d, g = !1) => Un(Us(`${t.seed}:${g ? "paper" : l}:${m}:${d}`)), f = (m, d, g, y, w, b = 0) => {
    if (m.length < 2) return;
    const S = m.slice(1).reduce((T, A, _) => T + Math.hypot(A.x - m[_].x, A.y - m[_].y), 0);
    let v = Gh(m, Math.max(1.5, Math.min(t.lineWidth * 0.8, S / 24)));
    if (b > 0 && v.length >= 2) {
      const [T, A] = [v[v.length - 2], v[v.length - 1]], _ = Math.hypot(A.x - T.x, A.y - T.y) || 1;
      v = [...v, { x: A.x + (A.x - T.x) / _ * b, y: A.y + (A.y - T.y) / _ * b }];
    }
    const k = as(g), M = as(g), P = v.length, x = [], E = [];
    v.forEach((T, A) => {
      const _ = P === 1 ? 0 : A / (P - 1), C = v[Math.max(0, A - 1)], H = v[Math.min(P - 1, A + 1)], $ = Math.hypot(H.x - C.x, H.y - C.y) || 1, R = -(H.y - C.y) / $, L = (H.x - C.x) / $, F = k(_) * w, I = Math.min(1, _ / 0.08, (1 - _) / 0.08), O = (0.55 + 0.45 * Math.sqrt(Math.max(0, I))) * (1 + o * M(_)), B = Math.max(0.3, d(_) * O / 2), V = T.x + R * F, ut = T.y + L * F;
      x.push({ x: V + R * B, y: ut + L * B }), E.push({ x: V - R * B, y: ut - L * B });
    }), e.save(), e.globalAlpha *= y, e.fillStyle = i, Be(e, [...x, ...E.reverse()], !0), e.fill(), e.restore();
  }, u = (m, d) => {
    const g = h++, y = c(g, 99, !0);
    if (y.next() < a) {
      const v = (y.next() * 2 - 1) * t.lineWidth * 1.4, k = (y.next() * 2 - 1) * t.lineWidth * 1.4, M = m.map((P) => ({ x: P.x + v, y: P.y + k }));
      f(M, (P) => d(P) * 1.8, c(g, 98, !0), 0.035, s), f(M, (P) => d(P) * 0.45, c(g, 97, !0), 0.12, s * 1.5);
    }
    const w = m.slice(1).reduce((v, k, M) => v + Math.hypot(k.x - m[M].x, k.y - m[M].y), 0), b = d(0.5) > 4 && w > d(0.5) * 6, S = b ? [-0.3, 0.3, 0] : [0];
    for (let v = 0; v < r; v++) {
      const k = v === 0;
      S.forEach((M, P) => {
        const x = c(g, v * 10 + P), E = M === 0 ? m : Zh(m, (A) => d(A) * M * Math.sqrt(Math.sin(Math.PI * A))), T = !k && M === 0 ? t.lineWidth * (0.3 + x.next() * 0.8) : 0;
        f(E, (A) => d(A) * (b ? 0.5 : 1) * (k ? 1 : 0.6), x, k ? 0.85 : 0.45, s * (k ? 0.6 : 1), T);
      });
    }
  }, p = (m, d, g, y, w, b) => {
    const v = c(h, 50).next() * Math.PI * 2;
    u(os(m, d, g, y, w, v, 1.08, 48), () => b);
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
      d !== null && (e.save(), e.globalAlpha *= 0.88, e.fillStyle = d, Be(e, m, !0), e.fill(), e.restore()), g > 0 && u([...m, m[0]], () => g);
    },
    ellipse(m, d, g, y, w, b, S) {
      b !== null && (e.save(), e.globalAlpha *= 0.9, e.fillStyle = b, e.beginPath(), e.ellipse(m, d, g, y, w, 0, Math.PI * 2), e.fill(), e.restore()), p(m, d, g, y, w, S);
    },
    dot(m, d, g) {
      e.save(), e.globalAlpha *= 0.9, e.fillStyle = i, e.beginPath(), e.arc(m, d, g, 0, Math.PI * 2), e.fill(), e.restore();
    },
    guide(m) {
      if (n.construction === !1 || m.length < 2) return;
      const d = h++;
      f(m, () => Math.max(0.6, t.lineWidth * 0.18), c(d, 0), 0.28, s * 1.2, t.lineWidth);
    },
    guideEllipse(m, d, g, y, w) {
      if (n.construction === !1) return;
      const b = h++, S = c(b, 0), v = os(m, d, g, y, w, S.next() * Math.PI * 2, 1.12, 48);
      f(v, () => Math.max(0.6, t.lineWidth * 0.18), S, 0.28, s * 1.5);
    }
  };
}
const Qh = ["thumb", "index", "middle", "ring", "pinky"], W = {
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
const U = (e, t, n, i, s) => ({
  "thumb.curl": e,
  "index.curl": t,
  "middle.curl": n,
  "ring.curl": i,
  "pinky.curl": s
}), K = {
  relaxed: W,
  open: D({ ...U(0, 0, 0, 0, 0), "thumb.across": 0, spread: 0.55 }),
  spread: D({ ...U(0, 0, 0, 0, 0), "thumb.across": 0, spread: 1 }),
  flat: D({ ...U(0, 0, 0, 0, 0), "thumb.across": 0.35, spread: 0 }),
  fist: D({ ...U(0.7, 1, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  point: D({ ...U(0.75, 0, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  /** The fist on its side, knuckles toward the viewer, the thumb up */
  thumbsUp: D({ ...U(0, 1, 1, 1, 1), "thumb.across": 0, spread: 0, roll: 70 }),
  peace: D({ ...U(0.75, 0, 0, 1, 1), "thumb.across": 0.9, spread: 1 }),
  ok: D({ ...U(0.12, 0.6, 0.1, 0.15, 0.2), "thumb.across": 0.55, spread: 0.6 }),
  pinch: D({ ...U(0.1, 0.65, 0.75, 0.85, 0.9), "thumb.across": 0.55, spread: 0 }),
  cupped: D({ ...U(0.25, 0.4, 0.4, 0.4, 0.4), "thumb.across": 0.4, spread: 0.05, turn: 2 }),
  wave: D({ ...U(0, 0.05, 0.05, 0.1, 0.12), "thumb.across": 0, spread: 0.7, turn: 2 }),
  /** Holding a pencil to write: thumb and middle finger pinch it, the index finger rests on top */
  pencilGrip: D({ ...U(0.1, 0.6, 0.72, 0.88, 0.95), "thumb.across": 0.5, spread: 0, turn: 0.8, bend: 10 }),
  /** Holding a handle, a cup or a bar: every finger wrapped round it */
  hold: D({ ...U(0.5, 0.7, 0.72, 0.74, 0.76), "thumb.across": 0.75, spread: 0, turn: 1 })
};
function ae(e, t, n) {
  const i = { ...e };
  for (const [s, r] of Object.entries(t)) {
    const o = e[s] ?? r;
    i[s] = o + (r - o) * n;
  }
  return i;
}
const tc = {
  index: { knuckle: [-0.16, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.125, fan: -1 },
  middle: { knuckle: [-0.055, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.13, fan: -0.2 },
  ring: { knuckle: [0.05, 0.475, -0.02], bones: [0.2, 0.125, 0.1], width: 0.122, fan: 0.55 },
  pinky: { knuckle: [0.15, 0.43, -0.02], bones: [0.16, 0.1, 0.085], width: 0.108, fan: 1.25 }
}, ec = {
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
}, nc = [82, 100, 62], ic = [48, 72], sc = 3, rc = 13, oc = 0.035, ac = -0.075, lc = [
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
], mt = (e) => e * Math.PI / 180, Rn = (e, t) => [e[0] + t[0], e[1] + t[1], e[2] + t[2]], Pe = (e, t) => [e[0] * t, e[1] * t, e[2] * t], Fn = (e, t) => [e[1] * t[2] - e[2] * t[1], e[2] * t[0] - e[0] * t[2], e[0] * t[1] - e[1] * t[0]], Vt = (e) => {
  const t = Math.hypot(e[0], e[1], e[2]) || 1;
  return [e[0] / t, e[1] / t, e[2] / t];
};
function St(e, t, n) {
  const i = Math.cos(n), s = Math.sin(n), r = Fn(t, e), o = t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
  return [
    e[0] * i + r[0] * s + t[0] * o * (1 - i),
    e[1] * i + r[1] * s + t[1] * o * (1 - i),
    e[2] * i + r[2] * s + t[2] * o * (1 - i)
  ];
}
const ls = [1, 0, 0], hs = [0, 1, 0], te = [0, 0, 1];
function hc(e, t, n) {
  const i = mt(e.fan * (sc + rc * n)), s = [Math.sin(i), Math.cos(i), 0], r = [Math.cos(i), -Math.sin(i), 0], o = [e.knuckle];
  let a = 0;
  e.bones.forEach((c, f) => {
    a += mt(nc[f] * t), o.push(Rn(o[f], Pe(St(s, r, -a), c)));
  });
  const l = St(te, r, -a), h = o.map((c, f) => e.width * (1 - 0.14 * (f / (o.length - 1))));
  return { joints: o, back: l, widths: h };
}
function cc(e, t, n = 1, i = 1) {
  const s = Math.min(1, Math.max(0, t)), r = Vt(Rn(Pe(Vt(at.out), 1 - s), Pe(Vt(at.across), s))), o = Vt(Fn(te, r)), a = Vt(Fn(r, o)), l = [[at.base[0] * i, at.base[1], at.base[2]]];
  let h = 0;
  at.bones.forEach((u, p) => {
    p > 0 && (h += mt(ic[p - 1] * e)), l.push(Rn(l[p], Pe(St(r, o, h), u)));
  });
  const c = St(a, o, h), f = [...at.widths, at.widths[at.widths.length - 1] * 0.92].map((u) => u * n);
  return { joints: l, back: c, widths: f };
}
function Ln(e, t = {}) {
  const n = { ...W, ...e }, i = t.size ?? 100, s = t.side ?? "right", r = s === "left" ? -1 : 1, o = mt(t.angle ?? 0), a = t.fingers === 4, l = Math.max(0.5, t.plump ?? 1), h = 1 + (l - 1) * 0.7, c = (A) => ({
    ...A,
    knuckle: [A.knuckle[0] * h, A.knuckle[1], A.knuckle[2]],
    width: A.width * l
  }), f = mt(n.bend ?? 0), u = mt(n.tilt ?? 0), p = mt(90 * (n.turn ?? 0)), m = (A) => St(St(St(A, ls, -f), te, -u), hs, p), d = Math.cos(o), g = Math.sin(o), y = mt(n.roll ?? 0), w = Math.cos(y), b = Math.sin(y), S = (A) => {
    const _ = A[0] * i, C = -A[1] * i, H = (_ * w - C * b) * r, $ = _ * b + C * w;
    return { x: H * d - $ * g, y: H * g + $ * d };
  }, v = (A) => {
    const _ = S(A), C = Math.hypot(_.x, _.y);
    return C > 1e-6 * i ? { x: _.x / C, y: _.y / C } : { x: 0, y: 0 };
  }, k = {
    thumb: cc(n["thumb.curl"] ?? 0, n["thumb.across"] ?? 0, l, h)
  }, M = a ? ec : tc;
  for (const A of Qh) {
    const _ = M[A];
    _ && (k[A] = hc(c(_), n[`${A}.curl`] ?? 0, n.spread ?? 0));
  }
  const P = {};
  for (const [A, _] of Object.entries(k)) {
    const C = _.joints.map(m), H = m(_.back);
    P[A] = {
      points: C.map(S),
      depths: C.map(($) => $[2] * i),
      widths: _.widths.map(($) => $ * i),
      nail: H[2],
      back: v(H)
    };
  }
  const x = lc.flatMap(([A, _]) => [m([A * h, _, oc]), m([A * h, _, ac])]), E = fc(x.map(S)), T = x.reduce((A, _) => A + _[2], 0) / x.length * i;
  return {
    size: i,
    side: s,
    wrist: { x: 0, y: 0 },
    palm: E,
    palmDepth: T,
    palmFacing: -m(te)[2],
    fingers: P,
    axes: { up: v(m(hs)), across: v(m(ls)), out: v(m(te)) },
    curls: Object.fromEntries(Object.keys(P).map((A) => [A, n[`${A}.curl`] ?? 0]))
  };
}
function uc(e, t) {
  const n = (s) => ({ x: s.x + t.x - e.wrist.x, y: s.y + t.y - e.wrist.y }), i = {};
  for (const [s, r] of Object.entries(e.fingers))
    i[s] = { ...r, points: r.points.map(n) };
  return { ...e, wrist: n(e.wrist), palm: e.palm.map(n), fingers: i };
}
function fc(e) {
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
const dc = "#f1c9a5", pc = "#2f2f33";
function ri(e, t, n, i = {}, s = 0) {
  const r = uc(Ln(n, i), t), o = i.ink ?? pc, a = i.lineWidth ?? r.size * 0.035, l = i.pen ?? xr(e, {
    look: i.look ?? "clean",
    ink: o,
    lineWidth: a,
    seed: i.seed ?? 1,
    time: s,
    pencil: { construction: !1, ...i.pencil }
  }), h = i.skin ?? dc, c = i.nails ?? !0, f = [
    {
      depth: r.palmDepth,
      draw: () => mc(l, r, h, a)
    }
  ];
  for (const u of Object.values(r.fingers)) {
    const p = u.depths.reduce((m, d) => m + d, 0) / u.depths.length;
    f.push({
      depth: p,
      draw: () => gc(e, l, u, h, a, c)
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
function mc(e, t, n, i) {
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
function gc(e, t, n, i, s, r) {
  const { widths: o } = n, a = yc(n.points, 2), l = n.points[0], h = a[a.length - 1], c = o[0], f = o[o.length - 1];
  if (e.save(), t.look !== "silhouette") {
    e.beginPath(), e.rect(l.x - 1e5, l.y - 1e5, 2e5, 2e5);
    const d = c / 2 + s * 1.6;
    e.moveTo(l.x + d, l.y), e.arc(l.x, l.y, d, 0, Math.PI * 2), e.clip("evenodd");
  }
  if (t.limb(a, c + 2 * s, f + 2 * s), e.restore(), t.look !== "silhouette" && (e.fillStyle = i, si(e, a, c, f)), t.look === "silhouette" || !r || n.nail < 0.25) return;
  const u = a[a.length - 2], p = bc({ x: h.x - u.x, y: h.y - u.y }) ?? {
    x: 0,
    y: -1
  }, m = {
    x: h.x - p.x * f * 0.22 + n.back.x * f * 0.1,
    y: h.y - p.y * f * 0.22 + n.back.y * f * 0.1
  };
  t.ellipse(m.x, m.y, f * 0.24 * Math.max(0.35, n.nail), f * 0.19, Math.atan2(p.y, p.x), "#f8e3d3", s * 0.45);
}
function yc(e, t) {
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
const bc = (e) => {
  const t = Math.hypot(e.x, e.y);
  return t > 1e-6 ? { x: e.x / t, y: e.y / t } : null;
}, G = {
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
function q(e) {
  return { ...G, ...e };
}
const Mr = {
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
}, Y = (e) => ({ ...Mr, ...e }), tt = {
  neutral: Mr,
  happy: Y({ smile: 0.9, leftBrow: 0.2, rightBrow: 0.2 }),
  joyful: Y({ mouth: 0.6, smile: 1, mouthWidth: 1.2, leftEye: 0, rightEye: 0, leftBrow: 0.4, rightBrow: 0.4 }),
  sad: Y({ smile: -0.8, leftEye: 0.8, rightEye: 0.8, browTilt: 0.9, leftBrow: -0.1, rightBrow: -0.1, lookY: 0.6 }),
  crying: Y({ mouth: 0.45, smile: -1, leftEye: 0, rightEye: 0, browTilt: 1, lookY: 0.4 }),
  surprised: Y({ mouth: 0.7, mouthWidth: 0.7, leftEye: 1.5, rightEye: 1.5, leftBrow: 1, rightBrow: 1 }),
  shocked: Y({ mouth: 1, mouthWidth: 0.8, leftEye: 1.6, rightEye: 1.6, leftBrow: 1, rightBrow: 1, browTilt: 0.4 }),
  angry: Y({ smile: -0.6, mouthWidth: 0.9, leftEye: 0.8, rightEye: 0.8, leftBrow: -0.6, rightBrow: -0.6, browTilt: -1 }),
  furious: Y({ mouth: 0.5, smile: -1, mouthWidth: 1.3, leftEye: 0.9, rightEye: 0.9, leftBrow: -0.9, rightBrow: -0.9, browTilt: -1 }),
  worried: Y({ smile: -0.3, mouthWidth: 0.8, leftEye: 1.1, rightEye: 1.1, leftBrow: 0.3, rightBrow: 0.3, browTilt: 0.8, lookX: -0.5 }),
  scared: Y({ mouth: 0.35, smile: -0.5, mouthWidth: 0.8, leftEye: 1.45, rightEye: 1.45, leftBrow: 0.8, rightBrow: 0.8, browTilt: 0.9 }),
  confused: Y({ smile: -0.2, mouthWidth: 0.8, leftEye: 0.9, rightEye: 1.15, leftBrow: -0.3, rightBrow: 0.8, lookX: 0.5, lookY: -0.4 }),
  skeptical: Y({ smile: -0.1, leftEye: 0.6, rightEye: 1, leftBrow: -0.4, rightBrow: 0.7, lookX: 0.4 }),
  thinking: Y({ smile: 0, mouthWidth: 0.7, leftBrow: 0.3, rightBrow: 0.5, lookX: 0.6, lookY: -0.8 }),
  sleepy: Y({ smile: 0.1, leftEye: 0.25, rightEye: 0.25, leftBrow: -0.3, rightBrow: -0.3, lookY: 0.5 }),
  disgusted: Y({ smile: -0.7, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.75, leftBrow: -0.5, rightBrow: -0.2, browTilt: -0.4, lookX: -0.6 }),
  smug: Y({ smile: 0.6, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.6, leftBrow: 0.1, rightBrow: 0.5, lookX: 0.5 }),
  wink: Y({ smile: 0.9, leftEye: 0, rightEye: 1, leftBrow: -0.2, rightBrow: 0.3 })
};
function Tr(e, t) {
  return { ...e, ...typeof t == "string" ? tt[t] : t };
}
const wc = {
  rest: G,
  wave: q({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...tt.happy }),
  cheer: q({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...tt.joyful }),
  shrug: q({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...tt.confused, lookX: 0, lookY: 0 }),
  point: q({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: q({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...tt.thinking }),
  handsOnHips: q({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: q({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...tt.sad }),
  surprised: q({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...tt.surprised }),
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: q({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  // Seated, hands resting on the knees. Arm angles spread outward per side, so
  // reaching forward (+x, the way the figure faces) is negative for the left arm.
  sit: q({ sit: 1, turn: 0.5, leftShoulder: -25, rightShoulder: 25, leftElbow: -55, rightElbow: 55 }),
  jump: q({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...tt.joyful }),
  // Full splits: legs flat along the floor, so the planted feet bring the hips right down to it.
  // Side (straddle) split, seen front-on: each leg straight out to its side, toes pointed.
  sideSplit: q({ leftHip: 90, rightHip: 90, leftAnkle: -45, rightAnkle: -45, leftShoulder: 120, rightShoulder: 120, leftElbow: 10, rightElbow: 10, ...tt.happy }),
  // Front split, in profile: the left leg forward (+x), the right leg back.
  frontSplit: q({ turn: 1, leftHip: -90, rightHip: -90, leftAnkle: -45, rightAnkle: -45, leftShoulder: -150, rightShoulder: 150, leftElbow: 10, rightElbow: -10, ...tt.happy })
}, Er = Object.keys(G);
function le(e, t, n) {
  const i = { ...e };
  for (const s of Er) i[s] = e[s] + (t[s] - e[s]) * n;
  return i;
}
const On = 24, cs = 4, us = 28, vc = 40;
function kc(e, t = G, n = 1) {
  const i = Math.sin(e * Math.PI * 2) * n, s = Math.cos(e * Math.PI * 2) * n, r = (h) => h <= vc, o = (h) => r(h) ? 22 * i : h, a = r(t.leftShoulder) ? t.leftElbow - us * Math.max(0, -i) : t.leftElbow, l = r(t.rightShoulder) ? t.rightElbow + us * Math.max(0, i) : t.rightElbow;
  return {
    ...t,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: t.lean + cs * n,
    headTilt: t.headTilt - cs * 0.5 * n,
    leftElbow: a,
    rightElbow: l,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -On * i,
    rightHip: -On * i,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, s),
    rightKnee: 30 * Math.max(0, -s),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: o(t.leftShoulder),
    rightShoulder: o(t.rightShoulder)
  };
}
function id(e, t = 1) {
  return 4 * ((Bn + De) * e) * Math.sin(On * t * Math.PI / 180);
}
function Sc(e) {
  const t = Math.abs(Math.sin(e / 65)), n = 0.55 + 0.45 * Math.sin(e / 310);
  return t * n;
}
const Ar = 0.12, fs = 0.46, xc = 1 - 2 * Ar, Mc = 0.1, Tc = 0.21, Ec = 0.19, Bn = 0.24, De = 0.22, Pr = 0.12, Ac = 0.14, _r = 0.33, ds = 0.7, ps = 0.3, Pc = 0.35, _c = [1.7, 1.05], Cc = [1.3, 0.75], ms = [1.45, 0.85], Hc = [1.15, 0.75], gs = 0.06, $c = 0.7, Ic = 0.65, Cr = 0.075, Rc = 0.3, Fc = 0.02, Lc = 0.012, Oc = 12, Bc = 0.25, ye = 90, Dc = 0.25, Wc = 0.04, Hr = 0.01, vt = (e) => Math.min(1, Math.max(0, e ?? 0));
function sd(e, t = 1) {
  return De * e * t;
}
const Dn = -0.12, $r = 0.4, it = (e) => e * Math.PI / 180, Nc = (e, t) => ({ x: t * Math.sin(it(e)), y: Math.cos(it(e)) }), Ir = (e, t) => Math.max(0, e) * (1 - Math.min(1, Math.max(0, t))), Rr = (e, t, n, i) => e - 0.3 * t - n * 0.14 * t - Math.max(0, i - 1) * 0.12 * t;
function Yc(e, t, n, i, s, r) {
  const o = Math.max(1, Math.min(r * 0.6, Ac * n)), a = vt(t.turn), l = (Pr + _r * a) * n, h = i + Dn * n, c = l + t.lookX * 0.08 * n, f = t.lookY * 0.07 * n, u = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * n * (1 - ds * a), squeeze: 1 - ds * a, open: t.leftEye, brow: t.leftBrow, side: -1 },
    { x: 0.34 * n * (1 - ps * a), squeeze: 1 - ps * a, open: t.rightEye, brow: t.rightBrow, side: 1 }
  ];
  e.fillStyle = s, e.strokeStyle = s, e.lineWidth = o;
  for (const y of u) {
    const w = Ir(y.open, t.blink);
    if (w < 0.2) {
      const k = t.smile > 0.5 ? -0.12 * n : 0.06 * n;
      e.beginPath(), e.moveTo(y.x + l - 0.12 * n, h), e.quadraticCurveTo(y.x + l, h + k, y.x + l + 0.12 * n, h), e.stroke();
    } else {
      if (w > 1.2) {
        const M = 0.13 * n * w;
        e.beginPath(), e.ellipse(y.x + l, h, M * 0.85, M, 0, 0, Math.PI * 2), e.fillStyle = "#ffffff", e.fill(), e.stroke(), e.fillStyle = s;
      }
      const k = w > 1.2 ? 0.075 * n : 0.1 * n;
      e.beginPath(), e.ellipse(y.x + c, h + f, k, k * 1.1 * Math.min(w, 1), 0, 0, Math.PI * 2), e.fill();
    }
    const b = Rr(h, n, y.brow, w), S = y.x + l - y.side * 0.13 * n * y.squeeze, v = y.x + l + y.side * 0.13 * n * y.squeeze;
    e.beginPath(), e.moveTo(v, b), e.lineTo(S, b - t.browTilt * 0.1 * n), e.stroke();
  }
  const p = i + $r * n, m = 0.25 * n * Math.max(0.3, t.mouthWidth) * (1 - Pc * a), d = Math.min(1, Math.max(0, t.mouth));
  if (e.beginPath(), d <= 0.05) {
    e.moveTo(l - m, p), e.quadraticCurveTo(l, p + t.smile * 0.25 * n, l + m, p), e.stroke();
    return;
  }
  const g = 0.3 * n * d;
  t.smile > 0.3 ? (e.moveTo(l - m, p - 0.05 * n), e.lineTo(l + m, p - 0.05 * n), e.quadraticCurveTo(l, p + g * 2, l - m, p - 0.05 * n)) : t.smile < -0.3 ? (e.moveTo(l - m, p + g * 0.6), e.lineTo(l + m, p + g * 0.6), e.quadraticCurveTo(l, p - g * 1.4, l - m, p + g * 0.6)) : e.ellipse(l, p, m * 0.8, g, 0, 0, Math.PI * 2), e.fill();
}
function Fr(e, t) {
  const n = t.height ?? 300, i = Math.min(3, Math.max(0.3, e.stretch ?? 1)), s = Math.sqrt(i), r = (t.headSize ?? 2 * Ar) / 2, o = t.headSize === void 0 ? xc : 1 - 2 * r, a = r * n, l = vt(e.sit), h = e.leftHip + (-ye - e.leftHip) * l, c = e.leftKnee + (-ye - e.leftKnee) * l, f = e.rightHip + (ye - e.rightHip) * l, u = e.rightKnee + (ye - e.rightKnee) * l, p = t.classic === !0, m = vt(e.turn), d = ($, R, L, F, I) => {
    const O = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.abs(it(R - L) / 2) + it(F))), B = Math.max(-1, Math.min(1, $c + I)), V = m + (1 - m) * $ * B;
    return p ? { x: 0, y: 0 } : { x: Math.cos(O) * gs * V, y: Math.sin(O) * gs };
  }, g = { left: e.leftAnkle ?? 0, right: e.rightAnkle ?? 0 }, y = { left: e.leftFootOut ?? 0, right: e.rightFootOut ?? 0 };
  let w = 0;
  if (l > 0 || !p) {
    const $ = (I, O, B, V, ut) => Bn * Math.cos(it(O)) + De * Math.cos(it(O - B)) + Math.max(0, d(I, O, B, V, ut).y), R = Math.max(
      $(-1, h, c, g.left, y.left),
      $(1, f, u, g.right, y.right)
    ), L = 1 - vt((e.rise ?? 0) / Wc), F = (p ? Math.min(1, l / Dc) : 1) * L;
    w = (fs - R) * F * n * i;
  }
  const b = -fs * n * i + w, S = -o * n * i + w, v = p ? 0 : (Fc * vt(e.turn) + Lc * l) * n * i, k = v === 0 ? [{ x: 0, y: b }, { x: 0, y: S }] : Bt({ x: 0, y: b }, { x: -v, y: (b + S) / 2 }, { x: 0, y: S }, 1, 8), M = S + Mc * n * i, P = (t.shoulderWidth ?? 0) * n * Math.cos(m * Math.PI / 2), x = ($, R, L, F, I) => {
    const O = Nc(L, F);
    return { x: $ + O.x * I * n, y: R + O.y * I * n };
  }, E = ($, R, L) => {
    const F = x(0, b, R, $, Bn * i);
    return { root: { x: 0, y: b }, joint: F, end: x(F.x, F.y, R - L, $, De * i) };
  }, T = ($, R, L) => {
    const F = { x: $ * P, y: M }, I = x(F.x, F.y, R, $, Tc * s);
    return { root: F, joint: I, end: x(I.x, I.y, R + L, $, Ec * s) };
  }, A = { left: E(-1, h, c), right: E(1, f, u) }, _ = ($, R, L, F, I, O) => {
    const B = d($, L, F, I, O);
    return { x: R.end.x + B.x * n * i, y: R.end.y + B.y * n * i };
  }, C = ($, R, L, F, I) => x(R.end.x, R.end.y, L + F + I, $, Cr * s), H = {
    left: T(-1, e.leftShoulder, e.leftElbow),
    right: T(1, e.rightShoulder, e.rightElbow)
  };
  return {
    height: n,
    facing: (t.facing ?? 1) < 0 ? -1 : 1,
    stretch: i,
    lineWidth: t.lineWidth ?? n * 0.025,
    rubber: Math.min(1, Math.max(p ? 0 : Rc, t.rubber ?? 0)),
    r: a,
    // The head keeps its area: taller and narrower when stretched.
    headRx: a / Math.sqrt(i),
    headRy: a * Math.sqrt(i),
    hipY: b,
    neckY: S,
    drop: w,
    lean: p ? e.lean : e.lean + Oc * Math.sin(Math.PI * l),
    classic: p,
    legs: A,
    toes: {
      left: _(-1, A.left, h, c, g.left, y.left),
      right: _(1, A.right, f, u, g.right, y.right)
    },
    spine: k,
    arms: H,
    handTips: {
      left: C(-1, H.left, e.leftShoulder, e.leftElbow, e.leftWrist ?? 0),
      right: C(1, H.right, e.rightShoulder, e.rightElbow, e.rightWrist ?? 0)
    }
  };
}
const Gt = (e, t) => t === 0 ? [e.root, e.joint, e.end] : Bt(e.root, e.joint, e.end, t);
function We(e, t, n) {
  const i = Math.cos(n), s = Math.sin(n), r = e.x - t.x, o = e.y - t.y;
  return { x: t.x + r * i - o * s, y: t.y + r * s + o * i };
}
function Lr(e, t, n = !0) {
  const i = qc(e, t), s = t.spin ?? 0, r = t.rise ?? 0;
  return n && (s !== 0 || r !== 0) ? Kc(i, e, s, r) : i;
}
function Or(e, t, n) {
  return { pivot: { x: 0, y: e.hipY }, angle: e.facing * it(t), lift: n * e.height };
}
function Kc(e, t, n, i) {
  const { pivot: s, angle: r, lift: o } = Or(t, n, i), a = (u) => {
    const p = We(u, s, r);
    return { x: p.x, y: p.y - o };
  }, l = (u) => ({ left: a(u.left), right: a(u.right) }), h = { left: Math.max(a(e.feet.left).y, a(e.toes.left).y), right: Math.max(a(e.feet.right).y, a(e.toes.right).y) }, c = Math.max(h.left, h.right), f = Hr * t.height;
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
function qc(e, t) {
  const n = it(e.lean), i = it(t.headTilt), s = { x: 0, y: e.hipY }, r = (b) => ({ x: e.facing * b.x, y: b.y }), o = (b) => r(We(b, s, n)), a = (b) => o(We({ x: b.x, y: b.y + e.neckY }, { x: 0, y: e.neckY }, i)), l = Gt(e.arms.left, e.rubber).map(o), h = Gt(e.arms.right, e.rubber).map(o), c = (b, S) => Math.atan2(S.y - b.y, S.x - b.x), f = { left: o(e.handTips.left), right: o(e.handTips.right) }, u = (b, S) => {
    const [v, k] = b.slice(-2), M = e.arms[S], P = c(o(M.end), f[S]) - c(o(M.joint), o(M.end));
    return c(v, k) + P;
  };
  let p = 1 / 0;
  for (const [b, S] of [
    [t.leftBrow, t.leftEye],
    [t.rightBrow, t.rightEye]
  ]) {
    const v = Rr(Dn, 1, b, Ir(S, t.blink));
    p = Math.min(p, v, v - t.browTilt * 0.1);
  }
  const m = { left: r(e.legs.left.end), right: r(e.legs.right.end) }, d = { left: r(e.toes.left), right: r(e.toes.right) }, g = { left: Math.max(m.left.y, d.left.y), right: Math.max(m.right.y, d.right.y) }, y = Math.max(g.left, g.right), w = Hr * e.height;
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
    grounded: { left: g.left >= y - w, right: g.right >= y - w },
    fingertips: f,
    handAngle: { left: u(l, "left"), right: u(h, "right") },
    limbs: {
      leftArm: l,
      rightArm: h,
      leftLeg: Gt(e.legs.left, e.rubber).map(r),
      rightLeg: Gt(e.legs.right, e.rubber).map(r),
      spine: e.spine.map(o)
    },
    head: {
      center: a({ x: 0, y: -e.headRy }),
      rx: e.headRx,
      ry: e.headRy,
      // Mirroring a turn reverses it.
      angle: e.facing * (n + i),
      eyeY: Dn,
      browTopY: p,
      mouthY: $r,
      faceX: e.facing * (Pr + _r * vt(t.turn))
    }
  };
}
function Xc(e, t = {}) {
  return Lr(Fr(e, t), e);
}
function rd(e, t, n) {
  return We({ x: e.center.x + t * e.rx, y: e.center.y + n * e.ry }, e.center, e.angle);
}
function Vc(e, t, n) {
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
function Uc(e, t, n = {}, i = 0) {
  const s = Fr(t, n), r = n.color ?? "#1e293b", o = n.layers ?? {}, a = n.layers ? Lr(s, t, !1) : void 0, l = n.sketch ? In(e, n.sketch, i) : void 0, h = n.sketch && n.layers ? In(e, n.sketch, i) : void 0, c = (k) => {
    e.save(), k(), e.restore();
  }, f = (k) => {
    k && a && c(() => k(e, a, i, h));
  }, u = () => e.scale(s.facing, 1), p = () => {
    u(), e.translate(0, s.hipY), e.rotate(it(s.lean)), e.translate(0, -s.hipY);
  }, m = (k, M, P) => {
    if (l) return M ? l.curve(k) : l.line(k);
    if (s.classic) {
      e.beginPath(), e.moveTo(k[0].x, k[0].y);
      for (const x of k.slice(1)) e.lineTo(x.x, x.y);
      e.stroke();
      return;
    }
    si(e, k, P[0] * s.lineWidth, P[1] * s.lineWidth);
  }, d = (k, M) => m(Gt(k, s.rubber), s.rubber > 0, M), g = (k) => {
    s.classic || m([s.legs[k].end, s.toes[k]], !1, Hc);
  }, y = (k) => {
    if (n.hands && !s.classic) return b(k);
    if (s.classic || l) return;
    const M = s.arms[k].end;
    e.beginPath(), e.arc(M.x, M.y, Ic * s.lineWidth, 0, Math.PI * 2), e.fill();
  };
  e.save(), e.strokeStyle = r, e.fillStyle = r, e.lineWidth = s.lineWidth, e.lineCap = "round", e.lineJoin = "round";
  const w = Or(s, t.spin ?? 0, t.rise ?? 0);
  (w.angle !== 0 || w.lift !== 0) && (e.translate(0, -w.lift), e.translate(w.pivot.x, w.pivot.y), e.rotate(w.angle), e.translate(-w.pivot.x, -w.pivot.y));
  function b(k) {
    const M = n.hands ?? {}, P = s.arms[k].end, x = s.handTips[k], E = n.headFill ?? "#ffffff";
    ri(e, P, M[k] ?? W, {
      side: k,
      // Degrees clockwise from straight up, in the frame the hand is drawn in.
      angle: Math.atan2(x.x - P.x, P.y - x.y) * 180 / Math.PI,
      size: (M.size ?? Cr) * s.height * Math.sqrt(s.stretch),
      skin: M.skin ?? (E === "none" ? void 0 : E),
      ink: r,
      lineWidth: s.lineWidth * 0.45,
      fingers: M.fingers,
      plump: M.plump,
      look: n.sketch ? "pencil" : "clean",
      seed: n.sketch?.seed
    }, i);
  }
  const S = (k) => {
    c(() => {
      p(), d(s.arms[k], Cc), y(k);
    });
    const M = o.sleeve;
    M && a && c(() => M(e, a, k, i, h));
  }, v = vt(t.turn) > Bc;
  f(o.behind), c(() => {
    u(), d(s.legs.left, ms), g("left"), d(s.legs.right, ms), g("right");
  }), v && S("left"), c(() => {
    p(), m(s.spine, s.spine.length > 2, _c);
    const { left: k, right: M } = { left: s.arms.left.root, right: s.arms.right.root };
    if (k.x !== M.x)
      if (s.classic) m([k, M], !1, [1, 1]);
      else {
        const P = { x: (k.x + M.x) / 2, y: k.y - 0.3 * Math.abs(M.x - k.x) };
        m(Bt(k, P, M, 1, 8), !0, [1.1, 1.1]);
      }
  }), f(o.body), v || S("left"), S("right"), f(o.behindHead), c(() => {
    p(), e.translate(0, s.neckY), e.rotate(it(t.headTilt));
    const k = -s.headRy;
    e.beginPath(), e.ellipse(0, k, s.headRx, s.headRy, 0, 0, Math.PI * 2);
    const M = n.headFill ?? "#ffffff";
    if (M !== "none" && (e.fillStyle = M, e.fill()), l) {
      l.ellipse(0, k, s.headRx, s.headRy);
      const P = l.nudge();
      e.translate(P.x, P.y);
    } else
      e.stroke();
    e.translate(0, k), e.scale(s.headRx / s.r, s.headRy / s.r), Yc(e, t, s.r, 0, r, s.lineWidth);
  }), f(o.overHead), f(o.front), e.restore(), n.label && (e.save(), e.fillStyle = r, e.font = n.labelFont ?? `700 ${Math.round(s.height * 0.11)}px sans-serif`, e.textAlign = "center", e.textBaseline = "bottom", e.fillText(n.label, 0, -s.height * s.stretch - 0.04 * s.height + s.drop), e.restore());
}
function Br(e, t, n) {
  const i = { ...e };
  let s = e.walking > 0 ? le(i, kc(e.walk, i), e.walking) : i, r = jc(e);
  const o = e.dancing ?? 0;
  if (n && o > 0) {
    const a = n(e.beat ?? 0);
    if (s = le(s, a.pose, o), a.hands) {
      const l = (h, c) => c ? ae(h ?? W, c, o) : h;
      r = { left: l(r?.left, a.hands.left), right: l(r?.right, a.hands.right) };
    }
  }
  return e.talk > 0 && (s = { ...s, mouth: Math.max(s.mouth, e.talk * Sc(t)) }), { pose: s, hands: r };
}
function zc(e, t, n) {
  return Br(e, t, n).pose;
}
const Ne = (e, t) => `hand.${e}.${t}`;
function jc(e) {
  const t = (s) => {
    if (typeof e[Ne(s, "spread")] == "number")
      return Object.fromEntries(Object.keys(W).map((r) => [r, e[Ne(s, r)]]));
  }, n = t("left"), i = t("right");
  return n || i ? { left: n, right: i } : void 0;
}
function Gc(e, t) {
  return !t || !e.hands ? e : { ...e, hands: { ...e.hands, left: t.left ?? e.hands.left, right: t.right ?? e.hands.right } };
}
function od(e) {
  const t = e.style ?? {}, n = t.height ?? 300, i = n * 0.8, s = { ...q(e.pose ?? {}), walk: 0, walking: 0, talk: 0, rubber: t.rubber ?? 0, beat: 0, dancing: 0 }, r = {};
  if (t.hands)
    for (const o of ["left", "right"]) {
      const a = t.hands[o] ?? W;
      for (const l of Object.keys(W)) r[Ne(o, l)] = a[l] ?? W[l];
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
      const h = a.props, c = Br(h, l, e.dance);
      o.translate(i / 2, n), Uc(o, c.pose, Gc({ ...t, rubber: h.rubber }, c.hands), l);
    }
  };
}
function ad(e, t, n) {
  const i = e.figureStyle;
  if (!i) throw new Error("stickFigureAt: the target was not made by stickFigureTarget");
  const s = { ...e.props };
  let r = 0, o = 0;
  for (const [h, c] of t.state?.values.get(n) ?? [])
    typeof c == "number" && (h === "x" || h === "motionPathX" ? r = c : h === "y" || h === "motionPathY" ? o = c : h in s && (s[h] = c));
  const a = zc(s, t.time, e.figureDance), l = Xc(a, { ...i, rubber: s.rubber });
  return { pose: a, joints: Vc(l, e.x + r + e.width / 2, e.y + o + e.height) };
}
function ld(e, t) {
  const n = [];
  return t.forEach((i, s) => {
    const r = s === 0 ? G : n[s - 1], o = typeof i.pose == "string" ? wc[i.pose] : { ...r, ...i.pose };
    n.push(i.expression ? Tr(o, i.expression) : o);
  }), Er.filter((i) => n.some((s) => s[i] !== G[i])).map((i) => ({
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
const dn = 0.5, ys = {
  /** Flag: fingers together and straight, thumb bent in */
  pataka: D({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Pataka with the ring finger bent */
  tripataka: D({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 1, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Lotus in bloom: fingers fanned, each a little more curled than the last */
  alapadma: D({ "thumb.curl": 0.1, "thumb.across": 0, "index.curl": 0.05, "middle.curl": 0.15, "ring.curl": 0.25, "pinky.curl": 0.35, spread: 1, turn: 2 }),
  /** Fist */
  mushti: K.fist,
  /** Fist, thumb up */
  shikhara: K.thumbsUp,
  /** Swan's beak: thumb and index touch, the others fanned */
  hamsasya: D({ "thumb.curl": 0.15, "thumb.across": 0.6, "index.curl": 0.6, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0.7, turn: 2 }),
  /** Bracelet: thumb, index and middle meet, ring and little finger out */
  katakamukha: D({ "thumb.curl": 0.2, "thumb.across": 0.6, "index.curl": 0.65, "middle.curl": 0.7, "ring.curl": 0, "pinky.curl": 0, spread: 0.4, turn: 2 })
};
function Ye(e) {
  return typeof e != "string" ? e : e in ys ? ys[e] : K[e];
}
function Dr(e, t, n) {
  const i = [];
  for (const s of e.keys) {
    const r = i[i.length - 1], o = !r || s.reset ? { pose: t, ...n } : r;
    i.push({
      beat: s.beat,
      pose: { ...o.pose, ...s.pose },
      left: s.hands?.left ? Ye(s.hands.left) : o.left,
      right: s.hands?.right ? Ye(s.hands.right) : o.right,
      easing: s.easing ?? e.easing
    });
  }
  return i;
}
const oi = (e, t) => (e % t + t) % t;
function Zc(e, t, n, i) {
  const s = Dr(e, n, i);
  if (s.length === 0) return { pose: n, hands: i };
  const r = oi(t, e.beats);
  let o = s.length - 1;
  for (let p = 0; p < s.length; p++) s[p].beat <= r && (o = p);
  const a = s[o], l = s[(o + 1) % s.length], h = a.beat <= r ? a.beat : a.beat - e.beats, c = l.beat > h ? l.beat : l.beat + e.beats, f = c > h ? (r - h) / (c - h) : 0, u = z(l.easing ?? "ease-in-out")(Math.min(1, Math.max(0, f)));
  return {
    pose: le(a.pose, l.pose, u),
    hands: { left: ae(a.left, l.left, u), right: ae(a.right, l.right, u) }
  };
}
const Jc = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftWrist", "rightWrist"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
  ["leftAnkle", "rightAnkle"],
  ["leftFootOut", "rightFootOut"],
  ["leftEye", "rightEye"],
  ["leftBrow", "rightBrow"]
], Qc = ["lean", "headTilt", "lookX", "spin"], tu = /* @__PURE__ */ new Set(["leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee"]);
function eu(e) {
  const t = { ...e }, n = (e.turn ?? 0) >= 0.5;
  for (const [i, s] of Jc) {
    const r = n && tu.has(i) ? -1 : 1;
    t[i] = r * e[s], t[s] = r * e[i];
  }
  if (!n) for (const i of Qc) t[i] = -e[i];
  return t;
}
const nu = (e) => Math.min(1, Math.max(-1, (0.5 - e) * 4));
function iu(e, t, n) {
  const i = oi(n, 1), s = (1 + Math.cos(2 * Math.PI * i)) / 2, r = t.bounce * (t.accent === "up" ? 1 - s : s), o = Math.min(1, Math.max(0, e.turn ?? 0)), a = nu(o);
  return {
    ...e,
    leftHip: e.leftHip + a * r / 2,
    rightHip: e.rightHip + r / 2,
    leftKnee: e.leftKnee + a * r,
    rightKnee: e.rightKnee + r,
    lean: e.lean + (t.sway ?? 0) * (1 - o) * Math.sin(Math.PI * n)
  };
}
function Wn(e) {
  const t = { ...G, ...e.stance };
  return e.expression ? Tr(t, e.expression) : t;
}
function Wr(e) {
  return {
    left: e.hands?.left ? Ye(e.hands.left) : W,
    right: e.hands?.right ? Ye(e.hands.right) : W
  };
}
function pn(e, t, n) {
  const i = e.moves[t.move];
  if (!i) throw new Error(`dance: "${e.label}" has no move "${t.move}"`);
  const s = Zc(i, n, Wn(e), Wr(e));
  return t.mirror ? { pose: eu(s.pose), hands: { left: s.hands?.right, right: s.hands?.left } } : s;
}
function ai(e, t, n = {}) {
  const i = typeof e == "string" ? Dt[e] : e;
  let s;
  if (n.move)
    s = pn(i, { move: n.move, mirror: n.mirror }, t);
  else {
    const r = i.routine, o = r.reduce((f, u) => f + u.beats, 0), a = oi(t, o);
    let l = 0, h = 0;
    for (; h < r.length - 1 && a >= l + r[h].beats; ) l += r[h++].beats;
    const c = a - l;
    if (s = pn(i, r[h], c), c < dn && r.length > 1 && t >= dn) {
      const f = r[(h - 1 + r.length) % r.length], u = pn(i, f, f.beats + c), p = z("ease-in-out")(c / dn);
      s = {
        pose: le(u.pose, s.pose, p),
        hands: { left: ae(u.hands.left, s.hands.left, p), right: ae(u.hands.right, s.hands.right, p) }
      };
    }
  }
  return { ...s, pose: iu(s.pose, i.groove, t) };
}
function hd(e, t, n = {}) {
  return ai(e, t, n).pose;
}
function li(e) {
  return (typeof e == "string" ? Dt[e] : e).routine.reduce((n, i) => n + i.beats, 0);
}
const su = { leftToe: "rightToe", rightToe: "leftToe", leftHeel: "rightHeel", rightHeel: "leftHeel" };
function bs(e, t, n, i, s, r, o) {
  for (let a = 0; a * e.beats < n; a++)
    for (const l of e.keys) {
      const h = a * e.beats + l.beat, c = t + h;
      if (!(h >= n || c < r || c >= o))
        for (const f of l.taps ?? []) s.push({ beat: c, tap: i ? su[f] : f });
    }
}
function cd(e, t, n, i = {}) {
  const s = typeof e == "string" ? Dt[e] : e, r = [];
  if (n <= t) return r;
  if (i.move) {
    const o = s.moves[i.move], a = Math.floor(t / o.beats) * o.beats;
    bs(o, a, Math.ceil((n - a) / o.beats) * o.beats, i.mirror, r, t, n);
  } else {
    const o = li(s);
    for (let a = Math.floor(t / o) * o; a < n; a += o) {
      let l = a;
      for (const h of s.routine)
        bs(s.moves[h.move], l, h.beats, h.mirror, r, t, n), l += h.beats;
    }
  }
  return r.sort((o, a) => o.beat - a.beat);
}
function ws(e, t) {
  const n = e.moves[t.move];
  if (!n?.travel) return 0;
  const i = n.travel / n.beats;
  return t.mirror ? (Dr(n, Wn(e), Wr(e))[0]?.pose.turn ?? Wn(e).turn ?? 0) >= 0.5 ? i : -i : i;
}
function Nr(e, t) {
  return t.move ? [{ move: t.move, beats: e.moves[t.move].beats, mirror: t.mirror }] : e.routine;
}
function mn(e, t, n = {}) {
  const i = typeof e == "string" ? Dt[e] : e, s = Nr(i, n), r = s.reduce((c, f) => c + f.beats, 0), o = s.reduce((c, f) => c + ws(i, f) * f.beats, 0), a = Math.floor(t / r);
  let l = a * o, h = t - a * r;
  for (const c of s) {
    const f = Math.min(c.beats, h);
    if (l += ws(i, c) * f, h -= f, h <= 0) break;
  }
  return l;
}
function ru(e, t, n) {
  const i = Nr(e, n), s = [0];
  let r = 0;
  for (let o = 0; r < t; o = (o + 1) % i.length)
    r += i[o].beats, s.push(Math.min(r, t));
  return s;
}
const ou = 8;
function au(e, t, n) {
  const i = typeof t == "string" ? Dt[t] : t, s = n.bpm ?? i.bpm, r = n.beats ?? (n.move ? i.moves[n.move].beats : li(i)), o = ru(i, r, n);
  if (o.every((y) => mn(i, y, n) === 0)) return;
  const a = Math.min(n.fade ?? 1, r / 2), l = z("ease-in-out"), h = (y) => a <= 0 ? 1 : Math.min(l(Math.min(1, y / a)), l(Math.min(1, (r - y) / a))), c = Math.ceil(a * ou), f = a <= 0 ? [] : Array.from({ length: c + 1 }, (y, w) => [w / c * a, r - w / c * a]).flat(), u = [.../* @__PURE__ */ new Set([...o, ...f])].sort((y, w) => y - w);
  let p = 0;
  const m = u.map((y, w) => {
    if (w > 0) {
      const b = u[w - 1], S = Math.max(1, Math.ceil((y - b) * 16));
      for (let v = 0; v < S; v++) {
        const k = b + (y - b) * v / S, M = b + (y - b) * (v + 1) / S;
        p += (mn(i, M, n) - mn(i, k, n)) * h((k + M) / 2);
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
function ud(e, t, n = 0) {
  return (e - n) * t / 6e4;
}
function fd(e, t = {}) {
  return (n) => ai(e, n, t);
}
function dd(e, t) {
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
function pd(e, t, n = {}) {
  const i = typeof t == "string" ? Dt[t] : t, s = n.bpm ?? i.bpm, r = n.beats ?? (n.move ? i.moves[n.move].beats : li(i)), o = n.samplesPerBeat ?? 4, a = n.start ?? 0, l = Math.round(r * o), h = Array.from({ length: l + 1 }, (d, g) => {
    const y = g / o;
    return { time: a + y * 6e4 / s, frame: ai(i, y, n) };
  }), c = (d, g) => ({
    id: `${e}-${d}`,
    target: e,
    property: d,
    keyframes: h.map((y) => ({ time: y.time, value: g(y.frame) }))
  }), u = Object.keys(G).filter((d) => h.some((g) => g.frame.pose[d] !== h[0].frame.pose[d]) || h[0].frame.pose[d] !== G[d]).map((d) => c(d, (g) => g.pose[d])), p = n.height === void 0 ? void 0 : au(e, i, { ...n, bpm: s, beats: r, start: a, height: n.height, fade: 0 });
  if (p && u.push(p), n.hands === !1) return u;
  const m = [];
  for (const d of ["left", "right"])
    for (const g of Object.keys(W)) {
      const y = (w) => w.hands?.[d]?.[g] ?? W[g];
      h.some((w) => y(w.frame) !== W[g]) && m.push(c(Ne(d, g), y));
    }
  return [...u, ...m];
}
const ee = { type: "back", mode: "out", overshoot: 1.1 }, X = "ease-out-cubic", lu = {
  label: "Disco",
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 6, rightKnee: 6 },
  expression: { smile: 0.9, mouth: 0.15, leftBrow: 0.3, rightBrow: 0.3 },
  groove: { bounce: 10, accent: "down", sway: 2 },
  moves: {
    point: {
      label: "The point",
      beats: 2,
      easing: X,
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
        { beat: 0, pose: { lean: -10, rightHip: 22, leftHip: 4, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: X },
        { beat: 1, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: "flat", right: "flat" } },
        { beat: 2, pose: { lean: 10, rightHip: 4, leftHip: 22, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: X },
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
}, hu = {
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
}, cu = {
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
        { beat: 0, pose: { rightHip: -24, rightKnee: 10, leftHip: 10, leftShoulder: 80, leftElbow: 40, rightShoulder: 55, rightElbow: -50, lean: 6, headTilt: -6 }, easing: X },
        { beat: 1, reset: !0, pose: { leftHip: 18, rightHip: 18 } },
        { beat: 2, pose: { leftHip: -24, leftKnee: 10, rightHip: 10, rightShoulder: 80, rightElbow: 40, leftShoulder: 55, leftElbow: -50, lean: -6, headTilt: 6 }, easing: X },
        { beat: 3, reset: !0, pose: { leftHip: 18, rightHip: 18 } }
      ]
    },
    kick: {
      label: "Kick out",
      beats: 2,
      keys: [
        { beat: 0, pose: { rightHip: 72, rightKnee: 4, rightAnkle: -20, leftHip: 4, lean: -12, leftShoulder: 100, leftElbow: 20 }, easing: X },
        { beat: 1, reset: !0 }
      ]
    },
    freeze: {
      label: "B-boy stance",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 26, leftElbow: -122, rightShoulder: 22, rightElbow: -118, leftHip: 18, rightHip: 18, leftKnee: 6, rightKnee: 6, lean: -4, headTilt: 10, smile: 0.6, leftEye: 0.6, rightEye: 0.6 }, easing: ee },
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
}, uu = {
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
        hands: t === 0 ? { left: { ...K.spread, turn: 2 }, right: { ...K.spread, turn: 2 } } : void 0
      }))
    },
    kickBallChange: {
      label: "Kick ball change",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 88, rightKnee: 0, rightAnkle: 55, leftHip: 4, lean: -12, leftShoulder: 112, rightShoulder: 112, leftWrist: 15, rightWrist: 15 }, hands: { left: "flat", right: "flat" }, easing: X },
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
}, fu = {
  label: "K-pop",
  bpm: 125,
  stance: { leftHip: 9, rightHip: 9, leftKnee: 4, rightKnee: 4 },
  expression: "happy",
  groove: { bounce: 5, accent: "down" },
  moves: {
    pointCombo: {
      label: "Point combo",
      beats: 4,
      easing: ee,
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
        { beat: 0, reset: !0, pose: { leftShoulder: 165, rightShoulder: 165, leftElbow: 46, rightElbow: 46, headTilt: -8, lean: -4 }, hands: { left: "cupped", right: "cupped" }, easing: ee },
        { beat: 1, pose: { headTilt: 8, lean: 4 } },
        { beat: 2, reset: !0, pose: { rightShoulder: 32, rightElbow: 112, rightWrist: 10, leftShoulder: 20, leftElbow: -30, headTilt: 10, leftEye: 0, smile: 1 }, hands: { right: "pinch", left: "relaxed" }, easing: ee },
        { beat: 3, pose: { headTilt: 4 } }
      ]
    },
    isolations: {
      label: "Isolations",
      beats: 2,
      easing: X,
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
}, du = {
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
        { beat: 0, reset: !0, pose: { rightShoulder: 160, rightElbow: 12, rightWrist: -15, leftShoulder: 40, leftElbow: -12, leftWrist: -45, lean: -4, rightHip: 16, lookX: 0.5, lookY: -0.6 }, hands: { right: { ...K.cupped, roll: -30 }, left: { ...K.flat, turn: 0 } } },
        { beat: 0.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...K.cupped, roll: 30 } } },
        { beat: 1, pose: { rightWrist: -15, rightElbow: 12, leftWrist: -45, lean: -4, rightHip: 16, leftHip: 6 }, hands: { right: { ...K.cupped, roll: -30 } } },
        { beat: 1.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...K.cupped, roll: 30 } } }
      ]
    },
    thumka: {
      label: "Thumka",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { lean: -11, rightHip: 22, leftHip: 2, leftKnee: 14, rightShoulder: 45, rightElbow: -105, leftShoulder: 128, leftElbow: 18, leftWrist: 35, headTilt: 10, lookX: -0.5 }, hands: { right: "fist", left: { ...K.open, turn: 2 } }, easing: X },
        { beat: 0.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } },
        { beat: 1, pose: { lean: -11, rightHip: 22, headTilt: 10 }, easing: X },
        { beat: 1.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } }
      ]
    },
    flick: {
      label: "Cross and flick",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26 }, hands: { left: "fist", right: "fist" } },
        { beat: 1, pose: { leftShoulder: 132, rightShoulder: 132, leftElbow: 0, rightElbow: 0, leftWrist: 30, rightWrist: 30, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10, stretch: 1.03 }, hands: { left: "spread", right: "spread" }, easing: X },
        { beat: 2, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftWrist: 0, rightWrist: 0, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26, stretch: 1 }, hands: { left: "fist", right: "fist" } },
        { beat: 3, pose: { leftShoulder: 62, rightShoulder: 62, leftElbow: 0, rightElbow: 0, leftWrist: 35, rightWrist: 35, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10 }, hands: { left: "spread", right: "spread" }, easing: X }
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
}, pu = {
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
}, mu = { leftHip: 42, rightHip: 42, leftKnee: 82, rightKnee: 82, leftFootOut: 0.3, rightFootOut: 0.3 }, gu = {
  label: "Bharatanatyam",
  bpm: 80,
  // Natyarambhe: arms out at shoulder height, hands raised in pataka.
  stance: { ...mu, leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0, leftWrist: 75, rightWrist: 75 },
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
}, yu = {
  label: "Charleston",
  bpm: 150,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 10, rightKnee: 10, leftShoulder: 30, rightShoulder: 30, leftElbow: 20, rightElbow: 20 },
  expression: { mouth: 0.4, smile: 1, leftBrow: 0.5, rightBrow: 0.5 },
  hands: { left: { ...K.spread, turn: 2 }, right: { ...K.spread, turn: 2 } },
  groove: { bounce: 8, accent: "down" },
  moves: {
    basic: {
      label: "Kick forward, kick back",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 48, rightKnee: 8, rightAnkle: 45, leftShoulder: 75, rightShoulder: 15, leftElbow: 30, rightElbow: -10, lean: -7, headTilt: -5 }, easing: X },
        { beat: 1, reset: !0 },
        { beat: 2, reset: !0, pose: { leftHip: 18, leftKnee: 85, leftAnkle: 35, rightShoulder: 75, leftShoulder: 15, rightElbow: 30, leftElbow: -10, lean: 7, headTilt: 5 }, easing: X },
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
}, bu = {
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
        { beat: 1, pose: { rightShoulder: 135, leftShoulder: 125, leftElbow: 0, rightElbow: 0, leftWrist: 0, rightWrist: 30, rightKnee: 8, leftKnee: -8, rightHip: 4, leftHip: -4 }, hands: { left: { ...K.spread, turn: 2 }, right: { ...K.spread, turn: 2 } } },
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
}, wu = {
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
          easing: ee
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
}, Dt = {
  disco: lu,
  hipHop: hu,
  breaking: cu,
  jazz: uu,
  kpop: fu,
  bollywood: du,
  bhangra: pu,
  bharatanatyam: gu,
  charleston: yu,
  tap: bu,
  popping: wu
}, Ke = (e) => Math.min(1, Math.max(0, e));
function vu(e) {
  const t = { ...G, turn: e.view }, n = [];
  for (const i of e.keys) {
    const s = n[n.length - 1], r = !s || i.reset ? t : s.pose;
    n.push({ at: i.at, pose: { ...r, ...i.pose }, easing: i.easing });
  }
  return n;
}
function ku(e) {
  return e - Su * Math.sin(2 * Math.PI * e) / (2 * Math.PI);
}
const Su = 0.5;
function xu(e, t) {
  if (!(t <= e.takeoff || t >= e.landing))
    return (t - e.takeoff) / (e.landing - e.takeoff);
}
function Mu(e, t) {
  const n = typeof e == "string" ? hi[e] : e, i = vu(n), s = Ke(t);
  let r = 0;
  for (let f = 0; f < i.length; f++) i[f].at <= s && (r = f);
  const o = i[r], a = i[Math.min(r + 1, i.length - 1)], l = a.at > o.at ? (s - o.at) / (a.at - o.at) : 0, h = le(o.pose, a.pose, z(a.easing ?? "ease-in-out")(Ke(l))), c = xu(n, s);
  return c === void 0 ? { ...h, spin: 0, rise: 0 } : {
    ...h,
    spin: n.spin * ku(c),
    rise: 4 * n.height * c * (1 - c)
  };
}
function Tu(e, t, n) {
  const i = typeof e == "string" ? hi[e] : e, s = Ke(t), r = Ke((s - i.takeoff) / (i.landing - i.takeoff));
  return i.travel * n * r;
}
function md(e, t, n = {}) {
  const i = typeof t == "string" ? hi[t] : t, s = n.start ?? 0, r = n.duration ?? i.duration, o = n.samples ?? 48, a = Array.from({ length: o + 1 }, (c, f) => {
    const u = f / o;
    return { time: s + u * r, progress: u, pose: Mu(i, u) };
  }), h = Object.keys(G).filter((c) => a.some((f) => f.pose[c] !== G[c])).map((c) => ({
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
      keyframes: a.map((f) => ({ time: f.time, value: (n.x ?? 0) + c * Tu(i, f.progress, n.height) }))
    });
  }
  return h;
}
const Eu = {
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
}, Au = {
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
}, be = {
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
}, Pu = {
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
}, _u = {
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
function At(e, t, n, i, s, r = 1300) {
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
      { at: 0.16, pose: Eu },
      { at: 0.27, pose: Au, easing: "ease-out-quad" },
      ...s,
      { at: 0.76, pose: Pu },
      { at: 0.86, pose: _u, easing: "ease-out-quad" },
      { at: 1, reset: !0 }
    ]
  };
}
const hi = {
  frontFlip: At("Front flip (tuck)", 360, 0.56, 0.35, [
    { at: 0.38, pose: be, easing: "ease-out-cubic" },
    { at: 0.64, pose: be }
  ]),
  backFlip: At("Back flip (tuck)", -360, 0.58, -0.15, [
    { at: 0.36, pose: { ...be, lean: 18 }, easing: "ease-out-cubic" },
    { at: 0.64, pose: { ...be, lean: 18 } }
  ]),
  layout: At("Back layout (straight body)", -360, 0.66, -0.2, [
    // Arched, arms overhead, legs together and long.
    { at: 0.4, pose: { leftHip: 8, rightHip: -8, leftKnee: 0, rightKnee: 0, leftAnkle: 60, rightAnkle: 60, leftShoulder: -178, rightShoulder: 178, lean: -18, headTilt: -14 } },
    { at: 0.64, pose: { leftHip: -4, rightHip: 4, lean: -6, headTilt: -4, leftShoulder: -150, rightShoulder: 150 } }
  ], 1400),
  scissorFlip: At("Scissor flip", 360, 0.6, 0.45, [
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
  splitLeap: At("Split leap (grand jeté)", 0, 0.36, 0.9, [
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
  backHandspring: At("Back handspring", -360, 0.16, -0.7, [
    // Arms reach back overhead to the ground, legs snap over.
    { at: 0.38, pose: { leftHip: 10, rightHip: -10, leftKnee: 0, rightKnee: 0, leftShoulder: -178, rightShoulder: 178, lean: -26, headTilt: -20 } },
    { at: 0.6, pose: { leftHip: -40, rightHip: 40, leftKnee: -20, rightKnee: 20, lean: 6, headTilt: 0 } }
  ], 1200)
}, gn = 0.215, yn = 0.205, Cu = 0.065, vs = 0.035, Hu = 0.165, $u = 0.155, Iu = 12, Ru = (e) => e * Math.PI / 180, J = {
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
function Q(e = {}) {
  return { ...J, ...e };
}
const Fu = /* @__PURE__ */ new Set(["turn", "side", "head.turn", "head.tilt", "roll", "lookX"]);
function gd(e) {
  const t = {};
  for (const [n, i] of Object.entries(e)) {
    const s = n.replace(/(^|\.)(left|right)(\.|$)/, (r, o, a, l) => `${o}${a === "left" ? "right" : "left"}${l}`);
    t[s] = Fu.has(n) ? -i : i;
  }
  return t;
}
function j(e, t) {
  const n = {};
  for (const i of ["left", "right"]) for (const [s, r] of Object.entries(t)) n[`${e}.${i}.${s}`] = r;
  return n;
}
const Lu = {
  rest: J,
  wave: Q({ "arm.right.spread": 115, "arm.right.bend": 55, "arm.right.elbow": 0, "head.tilt": -6, smile: 0.9 }),
  cheer: Q({ ...j("arm", { spread: 140, bend: 20, elbow: 0 }), mouth: 0.6, smile: 1, "eye.left": 0, "eye.right": 0 }),
  point: Q({ "arm.right.spread": 88, "arm.right.elbow": 0, "arm.right.bend": 0, "head.turn": -20, smile: 0.4 }),
  handsOnHips: Q({ ...j("arm", { spread: 50, bend: -105, elbow: 0 }), ...j("leg", { spread: 9 }), smile: 0.8 }),
  think: Q({ "arm.right.spread": 22, "arm.right.bend": -150, "arm.right.elbow": 0, "head.tilt": 10, lookX: -0.5, lookY: -0.8, smile: 0 }),
  shrug: Q({ ...j("arm", { spread: 35, bend: 75, elbow: 0 }), "head.tilt": -10, smile: -0.2 }),
  sit: Q({ ...j("leg", { swing: 90, knee: 90, spread: 4 }), ...j("arm", { swing: 25, elbow: 45, spread: 8 }) }),
  kneel: Q({
    "leg.left.swing": 90,
    "leg.left.knee": 90,
    // The back thigh leans back a little so its knee meets the ground beside the
    // front foot; the shin slopes up from it and the foot points down to tucked toes.
    "leg.right.swing": -18,
    "leg.right.knee": 108,
    "leg.right.ankle": 16,
    ...j("arm", { swing: 20, elbow: 30 })
  }),
  crouch: Q({ ...j("leg", { swing: 75, knee: 140, spread: 6 }), lean: 25, ...j("arm", { swing: 50, elbow: 40 }), "head.nod": -15 }),
  // On hands and knees: the back nearly level, arms straight down, the toes
  // pointed back along the ground.
  crawl: Q({ lean: 82, "head.nod": -35, ...j("arm", { swing: 80, elbow: 0, spread: 4 }), ...j("leg", { knee: 92, ankle: -88 }) }),
  lieDown: Q({ roll: 90, ...j("arm", { spread: 8 }), "head.nod": 0 })
};
function Ou(e = {}) {
  const t = e.headSize ?? 0.3, n = e.shoulderWidth ?? 0.06, i = e.hipWidth ?? 0.022, s = Math.max(0.12, 1 - t - vs - (gn + yn)), r = (l) => ({
    id: `arm.${l}`,
    parent: "spine",
    offset: [(l === "left" ? 1 : -1) * n, -0.035, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: Hu, width: [1.25, 0.9] },
      { length: $u, width: [0.9, 0.75] }
    ]
  }), o = (l) => ({
    id: `leg.${l}`,
    parent: null,
    offset: [(l === "left" ? 1 : -1) * i, 0, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: gn, width: [1.45, 1.05] },
      { length: yn, width: [1.05, 0.85] },
      { length: Cu, width: [0.95, 0.7] }
    ]
  }), a = (l, h) => l[h] ?? J[h] ?? 0;
  return {
    id: "human",
    hipHeight: gn + yn,
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
      { id: "neck", parent: "spine", rest: [0, 1, 0], bones: [{ length: vs, width: [1, 0.9] }] },
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
      const p = (h.side ?? 1) * u("rotate"), m = 1 - Math.cos(Ru(u("rotate")));
      return [
        { swing: u("swing"), spread: u("spread"), yaw: p },
        { swing: -u("knee"), spread: 0, yaw: p },
        // The foot points forward, square to the shin, turned out a little (more with `toeOut`).
        { swing: 90 + u("ankle") - m * (u("swing") - u("knee")), spread: 0, yaw: (Iu + u("toeOut")) * (h.side ?? 1) }
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
function yd(e) {
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
const Bu = {
  leftEye: "eye.left",
  rightEye: "eye.right",
  leftBrow: "brow.left",
  rightBrow: "brow.right"
}, bd = Object.fromEntries(
  Object.entries(tt).map(([e, t]) => [
    e,
    Object.fromEntries(Object.entries(t).map(([n, i]) => [Bu[n] ?? n, i]))
  ])
);
function wd(e, t) {
  const n = Math.min(1, Math.max(0, e.turn ?? 0)), i = 1 - n, s = { ...J, turn: n }, r = [
    { stick: "right", human: "left", s: 1 },
    { stick: "left", human: "right", s: -1 }
  ];
  for (const { stick: o, human: a, s: l } of r) {
    const h = e[`${o}Shoulder`], c = e[`${o}Elbow`];
    s[`arm.${a}.spread`] = h * i, s[`arm.${a}.swing`] = l * h * n, s[`arm.${a}.bend`] = c * i, s[`arm.${a}.elbow`] = l * c * n;
    const f = e[`${o}Hip`], u = e[`${o}Knee`], p = i + l * n;
    s[`leg.${a}.rotate`] = 90 * i, s[`leg.${a}.spread`] = 0, s[`leg.${a}.swing`] = f * p, s[`leg.${a}.knee`] = u * p, s[`leg.${a}.ankle`] = -(e[`${o}Ankle`] ?? 0), s[`leg.${a}.toeOut`] = (e[`${o}FootOut`] ?? 0) * Du, s[`eye.${a}`] = e[`${o}Eye`], s[`brow.${a}`] = e[`${o}Brow`], t && Object.assign(s, Wu(a, t[o] ?? W, e[`${o}Wrist`] ?? 0, n));
  }
  s.lean = e.lean * n, s.side = e.lean * i, s["head.tilt"] = e.headTilt * i, s["head.nod"] = e.headTilt * n;
  for (const o of ["mouth", "smile", "mouthWidth", "blink", "browTilt", "lookX", "lookY", "stretch"]) s[o] = e[o];
  return s.lift = e.rise ?? 0, s.roll = e.spin ?? 0, s;
}
const Du = 70;
function Wu(e, t, n, i) {
  const s = e === "right" ? 1 - i : 1 + i, r = {};
  for (const o of Object.keys(W)) r[`hand.${e}.${o}`] = t[o] ?? W[o];
  return r[`hand.${e}.turn`] = (t.turn ?? 0) - s, r[`hand.${e}.roll`] = (t.roll ?? 0) + n, r;
}
const nt = (e) => e * Math.PI / 180;
function Yr([e, t, n], i) {
  const s = Math.cos(i), r = Math.sin(i);
  return [e, t * s + n * r, -t * r + n * s];
}
function ci([e, t, n], i) {
  const s = Math.cos(i), r = Math.sin(i);
  return [e * s - t * r, e * r + t * s, n];
}
function Tt([e, t, n], i) {
  const s = Math.cos(i), r = Math.sin(i);
  return [e * s + n * r, t, -e * r + n * s];
}
const yt = (e, t) => [e[0] + t[0], e[1] + t[1], e[2] + t[2]], qe = (e, t) => [e[0] * t, e[1] * t, e[2] * t], _e = (e, t) => ci(Yr(e, t.swing), t.spread);
function bn(e, t) {
  const n = Tt(e, t);
  return { point: { x: n[0], y: -n[1] }, depth: n[2] };
}
function ui(e, t, n) {
  const i = n, r = [0, e.hipHeight * i * (e.boneScale?.(t, null) ?? 1), 0], o = {};
  for (const d of e.chains) {
    const g = d.parent ? o[d.parent] : void 0;
    if (d.parent && !g) throw new Error(`body plan ${e.id}: chain ${d.id} comes before its parent ${d.parent}`);
    const y = d.at ?? (g ? g.joints3.length - 1 : 0), w = g ? g.joints3[y] : r, b = g ? g.frames[Math.max(0, y - 1)] : { swing: 0, spread: 0 }, S = d.offset ? yt(w, _e(qe(d.offset, i), b)) : w, v = d.side ?? 1, k = e.boneScale?.(t, d) ?? 1, M = e.angles(t, d), P = [S], x = [];
    let E = b.swing, T = b.spread;
    d.bones.forEach((A, _) => {
      const C = M[_] ?? { swing: 0, spread: 0 };
      E += nt(C.swing), T += nt(C.spread) * v, x.push({ swing: E, spread: T });
      const H = Tt(_e(d.rest, { swing: E, spread: T }), nt(C.yaw ?? 0));
      P.push(yt(P[_], qe(H, A.length * i * k)));
    }), o[d.id] = { joints3: P, frames: x };
  }
  const a = o[e.head.on], l = e.headPose?.(t) ?? { yaw: 0, nod: 0, tilt: 0, sx: 1, sy: 1 }, h = a.frames[a.frames.length - 1], c = e.head.size / 2 * i, f = c * l.sx, u = c * l.sy, p = (d) => _e(Tt(Yr(ci(d, -nt(l.tilt)), -nt(l.nod)), nt(l.yaw)), h), m = yt(a.joints3[a.joints3.length - 1], p([0, u, 0]));
  return { height: i, root: r, chains: o, head: { center: m, rx: f, ry: u, toBody: p } };
}
function fi(e, t, n) {
  const i = n.height, s = nt(90 * (t.turn ?? 0)), r = ui(e, t, i), { root: o } = r, a = r.chains, { rx: l, ry: h } = r.head, c = r.head.toBody, f = r.head.center, u = {};
  for (const x of e.chains) {
    const { joints3: E, frames: T } = a[x.id], A = E.map((_) => bn(_, s));
    u[x.id] = {
      id: x.id,
      joints3: E,
      frames: T,
      points: A.map((_) => _.point),
      depths: A.map((_) => _.depth)
    };
  }
  const p = bn(f, s), m = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((x) => Tt(c(x), s)), d = bn(o, s).point, g = nt(t.roll ?? 0), y = (x) => {
    const E = x.x - d.x, T = x.y - d.y;
    return { x: d.x + E * Math.cos(g) - T * Math.sin(g), y: d.y + E * Math.sin(g) + T * Math.cos(g) };
  }, w = ([x, E, T]) => [x * Math.cos(g) + E * Math.sin(g), -x * Math.sin(g) + E * Math.cos(g), T];
  for (const x of Object.values(u)) x.points = x.points.map(y);
  const b = {
    center: y(p.point),
    depth: p.depth,
    rx: l,
    ry: h,
    angle: 0,
    axes: m.map(w)
  }, S = b.axes[1];
  b.angle = Math.atan2(S[0], S[1]);
  const v = (x) => {
    if ("head" in x) return { x: b.center.x + S[0] * h, y: b.center.y - S[1] * h };
    const E = u[x.chain];
    return E.points[Math.min(x.joint, E.points.length - 1)];
  };
  let k = 0;
  (n.contact ?? "ground") === "ground" && (k = -Math.max(...e.contacts.map((x) => v(x).y))), k -= (t.lift ?? 0) * i;
  const M = (x) => ({ x: x.x, y: x.y + k });
  for (const x of Object.values(u)) x.points = x.points.map(M);
  b.center = M(b.center);
  const P = e.contacts.map((x) => ({ spec: x, point: v(x) }));
  return {
    height: i,
    view: s,
    chains: u,
    head: b,
    hip: M(y(d)),
    contacts: P,
    groundY: Math.max(...P.map((x) => x.point.y))
  };
}
const Nn = (e, t) => [e[0] - t[0], e[1] - t[1], e[2] - t[2]], Kr = (e) => {
  const t = Math.hypot(e[0], e[1], e[2]) || 1;
  return [e[0] / t, e[1] / t, e[2] / t];
};
function qr(e, t, n) {
  const i = n.height, s = nt(90 * (t.turn ?? 0)), r = nt(t.roll ?? 0), o = ui(e, t, i), a = Tt(o.root, s), l = (g) => yt(ci(Nn(Tt(g, s), a), -r), a), h = {};
  for (const g of e.chains) h[g.id] = o.chains[g.id].joints3.map(l);
  const c = l(o.head.center), f = (g) => Kr(Nn(l(yt(o.head.center, o.head.toBody(g))), c)), u = [f([1, 0, 0]), f([0, 1, 0]), f([0, 0, 1])], p = (g) => {
    if ("head" in g) return yt(c, qe(u[1], o.head.ry));
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
function Xr(e, t, n, i) {
  const s = n.height, r = nt(90 * (t.turn ?? 0)), o = ui(e, t, s), a = qr(e, t, n), l = a.hip, h = a.chains, c = a.head.center, f = (x) => {
    if ("head" in x) return yt(c, qe(a.head.axes[1], a.head.ry));
    const E = h[x.chain];
    return E[Math.min(x.joint, E.length - 1)];
  }, u = i.toView(l), p = i.toScreen(u), m = i.toScreen([u[0] + 1, u[1], u[2]]), d = Math.hypot(m.x - p.x, m.y - p.y), g = (x) => {
    const E = i.toView(x);
    return { point: i.toScreen(E), depth: E[2] * d };
  }, y = {};
  for (const x of e.chains) {
    const E = h[x.id].map(g);
    y[x.id] = {
      id: x.id,
      joints3: o.chains[x.id].joints3,
      frames: o.chains[x.id].frames,
      points: E.map((T) => T.point),
      depths: E.map((T) => T.depth)
    };
  }
  const w = i.toView(c), b = i.toScreen(w), S = i.toScreen([w[0] + 1, w[1], w[2]]), v = Math.hypot(S.x - b.x, S.y - b.y), k = a.head.axes.map((x) => Kr(Nn(i.toView(yt(c, x)), w))), M = {
    center: b,
    depth: w[2] * d,
    rx: o.head.rx * v,
    ry: o.head.ry * v,
    angle: Math.atan2(k[1][0], k[1][1]),
    axes: k
  }, P = e.contacts.map((x) => ({ spec: x, point: g(f(x)).point }));
  return {
    height: s * d,
    view: r,
    chains: y,
    head: M,
    hip: p,
    contacts: P,
    groundY: Math.max(...P.map((x) => x.point.y))
  };
}
function Vr(e, [t, n, i]) {
  const [s, r, o] = e.axes, a = [
    s[0] * t * e.rx + r[0] * n * e.ry + o[0] * i * e.rx,
    s[1] * t * e.rx + r[1] * n * e.ry + o[1] * i * e.rx,
    s[2] * t * e.rx + r[2] * n * e.ry + o[2] * i * e.rx
  ], l = Math.hypot(t, n, i) || 1, h = (s[2] * t + r[2] * n + o[2] * i) / l;
  return { point: { x: e.center.x + a[0], y: e.center.y - a[1] }, depth: e.depth + a[2], facing: h };
}
class Ur {
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
function Nu(e) {
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
const di = Math.PI * 2;
function Yu(e, t = 16) {
  const n = new Ur(), i = Math.max(6, Math.round(t)), s = Math.max(3, Math.round(i / 2)), r = [];
  for (let o = 0; o <= s; o++) {
    const a = o / s * Math.PI, l = [];
    for (let h = 0; h <= i; h++) {
      const c = h / i * di, f = Math.sin(a) * Math.sin(c), u = Math.cos(a), p = Math.sin(a) * Math.cos(c);
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
function ks(e, t, n, i, s) {
  const r = e.vertex(0, n, 0, 0, i, 0), o = Array.from({ length: s }, (a, l) => {
    const h = l / s * di;
    return e.vertex(Math.sin(h) * t, n, Math.cos(h) * t, 0, i, 0);
  });
  for (let a = 0; a < s; a++) {
    const l = o[a], h = o[(a + 1) % s];
    i === 1 ? e.triangle(r, l, h) : e.triangle(r, h, l);
  }
}
function Ku(e, t, n = 24) {
  const i = new Ur(), s = Math.max(6, Math.round(n)), r = t / 2, o = -t / 2, a = (c) => Array.from({ length: s + 1 }, (f, u) => {
    const p = u / s * di;
    return i.vertex(Math.sin(p) * e, c, Math.cos(p) * e, Math.sin(p), 0, Math.cos(p));
  }), l = a(o), h = a(r);
  for (let c = 0; c < s; c++) i.quad(l[c], l[c + 1], h[c + 1], h[c]);
  return ks(i, e, r, 1, s), ks(i, e, o, -1, s), i.build();
}
function Ss(e) {
  const t = Array.from({ length: e.indices.length / 3 }, () => []);
  for (const n of Nu(e))
    for (const i of n.faces) {
      const s = n.faces.find((r) => r !== i) ?? -1;
      t[i].push({ a: n.a, b: n.b, across: s });
    }
  return { ...e, faceEdges: t };
}
const we = (e) => e * 180 / Math.PI, Pt = (e, t) => [e[0] - t[0], e[1] - t[1], e[2] - t[2]], wn = (e, t) => e[0] * t[0] + e[1] * t[1] + e[2] * t[2], Zt = (e) => Math.hypot(e[0], e[1], e[2]), Yn = (e) => {
  const t = Zt(e) || 1;
  return [e[0] / t, e[1] / t, e[2] / t];
}, ve = (e) => Math.atan2(Math.sin(e), Math.cos(e));
function xs(e) {
  const [t, n, i] = Yn(e);
  return { swing: Math.asin(Math.max(-1, Math.min(1, i))), spread: Math.atan2(t, -n) };
}
function qu(e, t, n, i, s) {
  const r = e.chains.find((E) => E.id === n);
  if (!r) throw new Error(`reach: no chain ${n} in ${e.id}`);
  if (r.bones.length < 2 || r.rest[1] > -0.99) throw new Error(`reach: ${n} is not a hanging limb of two bones or more`);
  if (!e.withAngles) throw new Error(`reach: the ${e.id} plan cannot set angles`);
  const o = fi(e, { ...t, turn: 0, roll: 0, lift: 0 }, { height: s.height, contact: "none" }), a = o.chains[n], l = a.joints3[0], h = Zt(Pt(a.joints3[1], a.joints3[0])), c = Zt(Pt(a.joints3[2], a.joints3[1])), f = r.parent ? o.chains[r.parent].frames[Math.max(0, (r.at ?? o.chains[r.parent].joints3.length - 1) - 1)] : { swing: 0, spread: 0 }, u = Pt(i, l), p = Math.min(h + c - 1e-6, Math.max(Math.abs(h - c) + 1e-6, Zt(u))), m = Yn(u), d = r.parent !== null, g = _e(r.pole ?? (d ? [0, -0.35, -1] : [0, 0, 1]), f);
  let y = Pt(g, [m[0] * wn(g, m), m[1] * wn(g, m), m[2] * wn(g, m)]);
  Zt(y) < 1e-6 && (y = Tt([1, 0, 0], 0)), y = Yn(y);
  const w = (h * h + p * p - c * c) / (2 * h * p), b = Math.sqrt(Math.max(0, 1 - w * w)), S = [
    l[0] + h * (w * m[0] + b * y[0]),
    l[1] + h * (w * m[1] + b * y[1]),
    l[2] + h * (w * m[2] + b * y[2])
  ], v = [l[0] + m[0] * p, l[1] + m[1] * p, l[2] + m[2] * p], k = r.side ?? 1, M = xs(Pt(S, l)), P = xs(Pt(v, S)), x = [
    { swing: we(ve(M.swing - f.swing)), spread: we(ve(M.spread - f.spread)) * k },
    { swing: we(ve(P.swing - M.swing)), spread: we(ve(P.spread - M.spread)) * k }
  ];
  return e.withAngles(t, r, x);
}
const Xu = 0.34, ft = 0.12, rt = -0.4, lt = (e, t, n) => e[t] ?? n, Vu = (e, t) => Math.max(0, e) * (1 - Math.min(1, Math.max(0, t))), Uu = 0.45, zu = 0.35, ju = 0.7;
function Xe(e, t, n) {
  const i = (p) => Math.sqrt(Math.max(0, 1 - p.x * p.x - p.y * p.y)), s = Vr(e, [n.x, n.y, i(n)]).facing, r = e.axes[2], o = Math.atan2(r[0], r[2]), a = Math.cos(o), l = a >= 0 ? 1 : -1, h = l * Math.max(zu, Math.abs(a)), c = l * Math.max(ju, Math.abs(a)), f = Math.cos(e.angle), u = Math.sin(e.angle);
  return {
    facing: s,
    points: t.map((p) => {
      const m = Uu * Math.sin(o) + n.x * h + (p.x - n.x) * c, d = p.y + r[1] * i(p), g = m * e.rx, y = d * e.ry;
      return { x: e.center.x + g * f + y * u, y: e.center.y + g * u - y * f };
    })
  };
}
const ke = (e, t, n, i = 12) => Array.from({ length: i + 1 }, (s, r) => {
  const o = r / i, a = 1 - o;
  return { x: a * a * e.x + 2 * a * o * t.x + o * o * n.x, y: a * a * e.y + 2 * a * o * t.y + o * o * n.y };
}), vn = (e, t, n, i, s = 16) => Array.from({ length: s }, (r, o) => {
  const a = Math.PI * 2 * o / s;
  return { x: e + Math.cos(a) * n, y: t + Math.sin(a) * i };
}), Ms = 0.05;
function Gu(e, t, n, i) {
  const s = Math.max(1, Math.min(i * 0.6, 0.14 * t.rx)), r = (y, w) => Xe(t, y, w).points, o = (y, w) => Xe(t, [], { x: y, y: w }).facing, a = lt(n, "smile", 0), l = lt(n, "blink", 0), h = lt(n, "lookX", 0), c = lt(n, "lookY", 0), f = lt(n, "browTilt", 0);
  for (const y of [1, -1]) {
    const w = y === 1 ? "left" : "right", b = Xu * y;
    if (o(b, ft) < Ms) continue;
    const S = { x: b, y: ft }, v = Vu(lt(n, `eye.${w}`, 1), l);
    if (v < 0.2) {
      const x = a > 0.5 ? 0.12 : -0.06;
      e.line(r(ke({ x: b - 0.12, y: ft }, { x: b, y: ft + x }, { x: b + 0.12, y: ft }), S), s);
    } else {
      if (v > 1.2) {
        const A = 0.13 * v;
        e.shape(r(vn(b, ft, A * 0.85, A), S), "#ffffff", s);
      }
      const x = v > 1.2 ? 0.075 : 0.1, E = b + h * 0.08, T = ft - c * 0.07;
      e.shape(r(vn(E, T, x, x * 1.1 * Math.min(v, 1)), S), e.ink, 0);
    }
    const k = ft + 0.3 + lt(n, `brow.${w}`, 0) * 0.14 + Math.max(0, v - 1) * 0.12, M = { x: b + y * 0.13, y: k }, P = { x: b - y * 0.13, y: k + f * 0.1 };
    e.line(r([M, { x: (M.x + P.x) / 2, y: (M.y + P.y) / 2 }, P], { x: b, y: k }), s);
  }
  const u = { x: 0, y: rt };
  if (o(0, rt) < -Ms) return;
  const p = 0.25 * Math.max(0.3, lt(n, "mouthWidth", 1)), m = Math.min(1, Math.max(0, lt(n, "mouth", 0)));
  if (m <= 0.05) {
    e.line(r(ke({ x: -p, y: rt }, { x: 0, y: rt - a * 0.25 }, { x: p, y: rt }), u), s);
    return;
  }
  const d = 0.3 * m;
  let g;
  if (a > 0.3) {
    const y = rt + 0.05;
    g = [...ke({ x: p, y }, { x: 0, y: rt - d * 2 }, { x: -p, y })];
  } else if (a < -0.3) {
    const y = rt - d * 0.6;
    g = [...ke({ x: p, y }, { x: 0, y: rt + d * 1.4 }, { x: -p, y })];
  } else
    g = vn(0, rt, p * 0.8, d);
  e.shape(r(g, u), e.ink, 0);
}
function Zu(e = {}) {
  const t = (e.proportions ?? "bold") === "bold", n = e.figure ?? "fluid", i = e.look ?? "clean", s = e.height ?? 300, r = n === "stick";
  return {
    plan: e.plan ?? Ou({
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
function vd(e, t, n, i) {
  const { point: s, facing: r } = Vr(e, [t, n, i]);
  return { point: s, facing: r };
}
const Kn = (e) => e.rest[1] < -0.5, Ju = 0.3;
function Qu(e, t, n) {
  return e.figure === "stick" ? Kn(t) ? n.slice(0, 3) : n : Kn(t) && n.length >= 3 ? Bt(n[0], n[1], n[2], Ju) : n.length === 3 ? Bt(n[0], n[1], n[2], 1) : n;
}
function pi(e, t) {
  const n = e.plan.id === "human" ? { ...J, ...t } : t;
  return mi(e, n, fi(e.plan, n, { height: e.height, contact: e.contact }));
}
function mi(e, t, n) {
  const i = {}, s = {}, r = {}, o = 0.01 * e.height;
  e.plan.chains.forEach((u) => {
    const p = n.chains[u.id];
    i[u.id] = p.points;
    const m = p.depths.reduce((w, b) => w + b, 0) / p.depths.length, d = u.parent ? n.chains[u.parent] : void 0, g = d ? d.depths[u.at ?? d.depths.length - 1] : 0, y = m - g;
    r[u.id] = Math.abs(y) < o ? 0 : y, s[u.id] = { points: Qu(e, u, p.points), depth: m };
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
function tf(e, t) {
  return pi(e, t).joints;
}
function ef(e, t, n) {
  const { head: i } = n;
  e.guideEllipse(i.center.x, i.center.y, i.rx * 1.03, i.ry * 1.03, i.angle);
  const s = Array.from({ length: 13 }, (l, h) => ({ x: 0, y: -0.95 + 1.9 * h / 12 })), r = Array.from({ length: 13 }, (l, h) => ({ x: -0.95 + 1.9 * h / 12, y: 0.12 })), o = Xe(i, s, { x: 0, y: 0 });
  o.facing > 0 && e.guide(o.points), e.guide(Xe(i, r, { x: 0, y: 0.12 }).points), e.guide(n.chains.spine ?? []);
  const a = t.lineWidth * 0.9;
  for (const l of ["shoulder.left", "shoulder.right", "elbow.left", "elbow.right", "hip.left", "hip.right", "knee.left", "knee.right"]) {
    const h = n.points[l];
    h && e.guideEllipse(h.x, h.y, a, a, 0);
  }
}
function nf(e, t, n, i, s, r) {
  const o = n.lineWidth;
  if (s === "head") {
    const { head: p } = i, m = n.skin === "none" ? null : n.skin;
    t.ellipse(p.center.x, p.center.y, p.rx, p.ry, p.angle, m, o), t.look !== "silhouette" && Gu(t, p, r, o);
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
  if (Kn(a)) {
    const [p, m] = c(0, 1);
    if (t.limb(h, p, m), a.bones.length >= 3)
      t.limb([l[2], l[3]], a.bones[2].width[0] * o, a.bones[2].width[1] * o);
    else if (n.hands === "cartoon" && s.startsWith("arm."))
      rf(e, t, n, l, s.endsWith(".left") ? "left" : "right", r);
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
    const y = i.points["shoulder.left"], w = i.points["shoulder.right"];
    y && w && Math.hypot(y.x - w.x, y.y - w.y) > 0.5 && t.limb(Bt(y, l[l.length - 1], w, 1, 10), o * 1.15, o * 1.15);
    return;
  }
  const [f, u] = c(0, a.bones.length - 1);
  t.limb(h, f, u);
}
function sf(e, t) {
  const n = `hand.${t}.`, i = {};
  for (const [o, a] of Object.entries(e)) o.startsWith(n) && (i[o.slice(n.length)] = a);
  const s = e.turn ?? 0, r = t === "right" ? 1 - s : 1 + s;
  return { ...W, ...i, turn: r + (i.turn ?? 0) };
}
function rf(e, t, n, i, s, r) {
  const o = i[i.length - 1], a = i[i.length - 2], l = Math.atan2(o.x - a.x, -(o.y - a.y)) * 180 / Math.PI;
  ri(e, o, sf(r, s), {
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
function of(e, t, n, i = 0) {
  const s = t.plan.id === "human" ? { ...J, ...n } : n;
  jr(e, t, s, pi(t, s), i);
}
function zr(e, t) {
  const n = t / e.height;
  return { ...e, height: t, lineWidth: e.lineWidth * n };
}
function kd(e, t, n, i) {
  const s = e.plan.id === "human" ? { ...J, ...t } : t, r = Xr(e.plan, s, { height: i.height, contact: e.contact }, n);
  return mi(zr(e, r.height), s, r).joints;
}
function af(e, t, n, i, s) {
  const r = t.plan.id === "human" ? { ...J, ...n } : n, o = Xr(t.plan, r, { height: s.height, contact: t.contact }, i), a = zr(t, o.height);
  jr(e, a, r, mi(a, r, o), s.time ?? 0);
}
function jr(e, t, n, i, s) {
  const { joints: r, order: o } = i, a = xr(e, {
    look: t.look,
    ink: t.ink,
    lineWidth: t.lineWidth,
    seed: t.seed,
    time: s,
    pencil: t.pencil
  }), l = (h) => {
    h && (e.save(), h(e, r, a, s), e.restore());
  };
  e.save(), e.lineCap = "round", e.lineJoin = "round", t.look === "pencil" && t.pencil.construction !== !1 && ef(a, t, r), l(t.layers.behind);
  for (const h of o) {
    const c = t.layers.parts?.[h];
    l(c?.under), nf(e, a, t, r, h, n), l(c?.over);
  }
  l(t.layers.front), e.restore();
}
function Sd(e, t, n) {
  const i = { ...e };
  for (const [s, r] of Object.entries(t)) {
    const o = e[s] ?? r;
    i[s] = o + (r - o) * n;
  }
  return i;
}
function xd(e, t, n, i) {
  const s = e.plan.id === "human" ? { ...J, ...t } : t;
  let r;
  if (Array.isArray(i))
    r = i;
  else {
    const { skeleton: o } = pi(e, s), a = fi(e.plan, { ...s, roll: 0 }, { height: e.height, contact: "none" }), l = (s.roll ?? 0) * Math.PI / 180, h = i.x - o.hip.x, c = i.y - o.hip.y, f = a.hip.x + h * Math.cos(-l) - c * Math.sin(-l), u = a.hip.y + h * Math.sin(-l) + c * Math.cos(-l), p = Math.PI / 2 * (s.turn ?? 0), m = i.depth ?? o.chains[n].depths[o.chains[n].depths.length - 1], d = Math.cos(p), g = Math.sin(p);
    r = [f * d - m * g, -u, f * g + m * d];
  }
  return qu(e.plan, s, n, r, { height: e.height });
}
function Md(e) {
  const { character: t } = e, n = t.height * 0.8, i = t.height, s = t.plan.id === "human" ? J : {};
  return {
    type: "custom",
    x: e.x - n / 2,
    y: e.y - i,
    width: n,
    height: i,
    props: { ...s, ...e.pose },
    character: t,
    draw(r, o, a) {
      r.translate(n / 2, i), of(r, t, o.props, a);
    }
  };
}
function lf(e, t, n) {
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
function Td(e, t, n) {
  const i = e.character;
  if (!i) throw new Error("characterAt: the target was not made by characterTarget");
  const s = { ...e.props };
  let r = 0, o = 0;
  for (const [l, h] of t.state?.values.get(n) ?? [])
    typeof h == "number" && (l === "x" || l === "motionPathX" ? r = h : l === "y" || l === "motionPathY" ? o = h : l in s && (s[l] = h));
  const a = tf(i, s);
  return { pose: s, joints: lf(a, e.x + r + e.width / 2, e.y + o + e.height) };
}
function Ed(e, t, n = J) {
  const i = [];
  return t.forEach((r, o) => {
    const a = o === 0 ? n : i[o - 1], l = typeof r.pose == "string" ? Lu[r.pose] : void 0;
    i.push(l ? { ...l, turn: a.turn ?? 0 } : { ...a, ...r.pose });
  }), Object.keys(n).filter((r) => i.some((o) => (o[r] ?? n[r]) !== n[r])).map((r) => ({
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
const hf = /* @__PURE__ */ new Set([
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
]), cf = 1.7;
function uf(e, t, n) {
  const i = Array.from({ length: 24 }, (s, r) => {
    const o = r / 24 * Math.PI * 2, a = t.toView([Math.cos(o) * n, 0, Math.sin(o) * n * 0.8]);
    return a[2] < -1e-3 ? t.toScreen(a) : null;
  });
  i.some((s) => s === null) || (e.beginPath(), i.forEach((s, r) => r === 0 ? e.moveTo(s.x, s.y) : e.lineTo(s.x, s.y)), e.closePath(), e.fillStyle = "rgba(0, 0, 0, 0.22)", e.fill());
}
function ff(e) {
  const t = Qt([0, 1, 0], e);
  if (t > 0.999999) return er();
  if (t < -0.999999) return se(Rt([1, 0, 0], 180));
  const n = Ie([0, 1, 0], e);
  return se(Rt(n, Math.acos(t) * 180 / Math.PI));
}
function df(e, t, n, i, s) {
  const r = e.solid ?? {}, o = r.outline === !1 ? void 0 : r.outline ?? { width: 2, color: "#0f172a" }, a = { color: r.color ?? "#475569", shading: r.shading ?? "toon", outline: o }, l = { color: r.skin ?? "#f2c49b", shading: r.shading ?? "toon", outline: o }, h = { color: "#0f172a", shading: "unlit" }, c = i.height * 0.034, f = [], u = (b, S, v) => f.push({ mesh: b, world: bt(s, S), material: v }), p = (b, S, v) => u(t.sphere, ir(b, [0, 0, 0, 1], [S, S, S]), v);
  for (const b of n.chains) {
    const S = i.chains[b.id], v = b.id === "spine" ? 1.9 : 1;
    b.bones.forEach((k, M) => {
      const P = S[M], x = S[M + 1], E = Qs(P, x), [T, A] = k.width ?? [1, 1], _ = c * v * (T + A) / 2;
      if (E > 1e-6) {
        const C = tr(P, x, 0.5), H = ff(ie(Ge(x, P)));
        u(t.cylinder, bt(nr(C), bt(H, Te([_, E, _]))), a);
      }
      p(P, c * v * T, a), p(x, c * v * A, a);
    }), b.id.startsWith("arm.") && p(S[S.length - 1], c * 1.5, l);
  }
  const { center: m, rx: d, ry: g, axes: y } = i.head, w = [...y[0], 0, ...y[1], 0, ...y[2], 0, ...m, 1];
  u(t.sphere, bt(w, Te([d, g, d])), l);
  for (const b of [-1, 1]) {
    const S = ie([b * 0.36, 0.15, 0.92]), v = Me(m, Me(Me(Jt(y[0], S[0] * d * 1.04), Jt(y[1], S[1] * g * 1.04)), Jt(y[2], S[2] * d * 1.04))), k = [...y[0], 0, ...y[1], 0, ...y[2], 0, ...v, 1];
    u(t.sphere, bt(k, Te([d * 0.11, g * 0.14, d * 0.03])), h);
  }
  return f;
}
const Ad = {
  kind: "character",
  validate(e) {
    const t = e;
    return t.height !== void 0 && !(t.height > 0) ? ["a character's height must be positive"] : [];
  },
  prepare(e) {
    return {
      who: Zu({ ...e.character, height: 1 }),
      cylinder: Ss(Ku(1, 1, 16)),
      sphere: Ss(Yu(1, 20))
    };
  },
  resolve({ object: e, prepared: t, values: n, world: i, camera: s, toScreen: r }) {
    const o = e, a = t, l = a.who, h = { ...J, ...o.pose };
    for (const [g, y] of n)
      typeof y == "number" && !hf.has(g) && (h[g] = y);
    const c = o.height ?? cf, f = bt(s.view, i), u = {
      toView: (g) => sr(f, g),
      toScreen: (g) => r(g)
    }, m = -u.toView([0, c / 2, 0])[2];
    if (m <= s.near) return null;
    const d = o.shadow === !1 ? [] : [{ depth: m + c, draw: (g) => uf(g, u, c * 0.18) }];
    if (o.look === "solid") {
      const g = qr(l.plan, h, { height: c, contact: l.contact });
      return { meshes: df(o, a, l.plan, g, i), drawables: d };
    }
    return {
      drawables: [
        ...d,
        {
          depth: m,
          draw(g, y) {
            g.lineCap = "round", g.lineJoin = "round", af(g, l, h, u, { height: c, time: y.time });
          }
        }
      ]
    };
  }
};
function pf(e, t, n = {}, i) {
  const s = n.length ?? 240, r = 9, o = 28, a = s - 22;
  e.save(), e.translate(t.x, t.y), e.rotate((n.angle ?? -30) * Math.PI / 180), e.fillStyle = n.color ?? "#f4c542", e.fillRect(o, -r, a - o, 2 * r), e.fillStyle = "#e8b4a0", e.fillRect(a, -r, s - a, 2 * r), e.fillStyle = "#f1dcbf", e.beginPath(), e.moveTo(0, 0), e.lineTo(o, -r), e.lineTo(o, r), e.closePath(), e.fill(), e.fillStyle = n.outline ?? "#2f2f33", e.beginPath(), e.moveTo(0, 0), e.lineTo(o * 0.35, -r * 0.35), e.lineTo(o * 0.35, r * 0.35), e.closePath(), e.fill(), e.strokeStyle = n.outline ?? "#2f2f33", e.lineWidth = 3, e.lineJoin = "round", e.lineCap = "round";
  const l = [
    [{ x: 0, y: 0 }, { x: o, y: -r }, { x: s, y: -r }, { x: s, y: r }, { x: o, y: r }, { x: 0, y: 0 }],
    [{ x: o, y: -r }, { x: o, y: r }],
    [{ x: a, y: -r }, { x: a, y: r }]
  ];
  for (const h of l) Qr(e, h, i);
  e.restore();
}
function Gr(e, t, n = {}, i) {
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
const Zr = 150, mf = { pencil: 44, eraser: 30 };
function Jr(e, t, n = {}, i) {
  const s = n.tool ?? "pencil", r = n.skin ?? "#f1c9a5", o = n.outline ?? "#2f2f33", a = n.scale ?? 1, l = Math.min(1, Math.max(0, n.lift ?? 0)), h = (n.angle ?? -30) * Math.PI / 180, c = i ? i.nudge(0.6) : { x: 0, y: 0 }, f = Zr * a * (1 + 0.05 * l);
  l > 0 && (e.save(), e.fillStyle = o, e.globalAlpha = 0.15 * l, e.beginPath(), e.ellipse(t.x, t.y, 9 * a, 4 * a, 0, 0, Math.PI * 2), e.fill(), e.restore());
  const u = { x: t.x + c.x + 6 * l * a, y: t.y + c.y - 18 * l * a }, p = K.pencilGrip, m = (M) => {
    const P = M.fingers.thumb, x = M.fingers.index, E = M.fingers.middle, T = Ts([P.points[3], x.points[3], E.points[3]]), A = Ts([P.points[1], x.points[0]]), _ = (P.depths[3] + x.depths[3] + E.depths[3]) / 3;
    return { pinch: T, direction: Math.atan2(A.y - T.y, A.x - T.x), depth: _ };
  }, d = Ln(p, { size: f }), g = h - m(d).direction, y = Ln(p, { size: f, angle: g * 180 / Math.PI }), w = m(y), b = mf[s] * a, S = { x: w.pinch.x - Math.cos(h) * b, y: w.pinch.y - Math.sin(h) * b }, v = { x: u.x - S.x, y: u.y - S.y }, k = y.axes.up;
  gf(e, v, { x: -k.x, y: -k.y }, f, n.arm ?? 300 * a, r, n.sleeve ?? "#5b7db1", o), ri(e, v, p, {
    size: f,
    angle: g * 180 / Math.PI,
    skin: r,
    ink: o,
    lineWidth: 3 * a,
    prop: {
      depth: w.depth,
      draw: () => {
        e.save(), e.translate(u.x, u.y), e.scale(a, a), s === "eraser" ? Gr(e, { x: 0, y: 0 }, { angle: h * 180 / Math.PI, outline: o }, i) : pf(e, { x: 0, y: 0 }, { angle: h * 180 / Math.PI, length: 190, outline: o }, i), e.restore();
      }
    }
  });
}
const Ts = (e) => ({
  x: e.reduce((t, n) => t + n.x, 0) / e.length,
  y: e.reduce((t, n) => t + n.y, 0) / e.length
});
function gf(e, t, n, i, s, r, o, a) {
  const l = { x: -n.y, y: n.x }, h = i * 0.15, c = (d, g, y) => ({
    x: t.x + n.x * d + l.x * g * y,
    y: t.y + n.y * d + l.y * g * y
  }), f = c(s, 0, 0), u = (d) => {
    const g = e.createLinearGradient(t.x, t.y, f.x, f.y);
    return g.addColorStop(0, d), g.addColorStop(0.6, d), g.addColorStop(1, yf(d)), g;
  }, p = Math.min(i * 0.55, s * 0.35);
  e.save(), e.lineJoin = "round", e.lineCap = "round", e.lineWidth = 3 * (i / Zr), e.beginPath(), e.moveTo(c(-i * 0.1, -1, h).x, c(-i * 0.1, -1, h).y), e.lineTo(c(p + 4, -1, h * 1.1).x, c(p + 4, -1, h * 1.1).y), e.lineTo(c(p + 4, 1, h * 1.1).x, c(p + 4, 1, h * 1.1).y), e.lineTo(c(-i * 0.1, 1, h).x, c(-i * 0.1, 1, h).y), e.closePath(), e.fillStyle = r, e.fill(), e.strokeStyle = a, e.beginPath(), e.moveTo(c(0, -1, h).x, c(0, -1, h).y), e.lineTo(c(p, -1, h * 1.1).x, c(p, -1, h * 1.1).y), e.moveTo(c(0, 1, h).x, c(0, 1, h).y), e.lineTo(c(p, 1, h * 1.1).x, c(p, 1, h * 1.1).y), e.stroke();
  const m = [c(p, -1, h * 1.3), c(s, -1, h * 1.5), c(s, 1, h * 1.5), c(p, 1, h * 1.3)];
  e.beginPath(), m.forEach((d, g) => g ? e.lineTo(d.x, d.y) : e.moveTo(d.x, d.y)), e.closePath(), e.fillStyle = u(o), e.fill(), e.strokeStyle = u(a), e.beginPath(), e.moveTo(m[1].x, m[1].y), e.lineTo(m[0].x, m[0].y), e.lineTo(m[3].x, m[3].y), e.lineTo(m[2].x, m[2].y), e.stroke(), e.restore();
}
function Pd(e, t, n = {}) {
  const i = n.offstage ?? { x: 2e3, y: 1400 }, s = n.enter ?? 450, r = n.exit ?? 450, o = n.linger ?? 1500, a = [...e].filter((d) => d.path.length > 0).sort((d, g) => d.start - g.start), l = (d) => d.tool ?? "pencil", h = (d) => {
    const g = Math.min(1, Math.max(0, d));
    return g * g * (3 - 2 * g);
  }, c = (d, g, y) => ({ x: d.x + (g.x - d.x) * y, y: d.y + (g.y - d.y) * y }), f = a.find((d) => t >= d.start && t <= d.end);
  if (f) {
    const d = f.end - f.start, g = d > 0 ? (t - f.start) / d : 1;
    return { at: ii(f.path, g), tool: l(f), lift: 0, drawing: !0 };
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
function _d(e, t, n, i = 0.08, s = 32) {
  const r = Math.PI * 2 * (1 + i), o = [];
  for (let a = 0; a <= s; a++) {
    const l = -Math.PI / 2 + r * a / s;
    o.push({ x: e + Math.cos(l) * n, y: t + Math.sin(l) * n });
  }
  return o;
}
function Cd(e) {
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
      const f = e.sketch ? In(a, e.sketch, h) : void 0;
      c > 0 && (f ? e.smooth ? f.curve(t, c) : f.line(t, c) : Qr(a, oe(t, c))), o && c > 0 && c < 1 && Jr(a, ii(t, c), o, f);
    }
  };
}
function yf(e) {
  const t = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(e.trim());
  if (!t) return "rgba(0, 0, 0, 0)";
  const n = t[1].length === 3 ? [...t[1]].map((o) => o + o).join("") : t[1], [i, s, r] = [0, 2, 4].map((o) => parseInt(n.slice(o, o + 2), 16));
  return `rgba(${i}, ${s}, ${r}, 0)`;
}
function Qr(e, t, n) {
  if (!(t.length < 2)) {
    if (n) return n.line(t);
    e.beginPath(), e.moveTo(t[0].x, t[0].y);
    for (const i of t.slice(1)) e.lineTo(i.x, i.y);
    e.stroke();
  }
}
const Se = 1e5;
function Hd(e, t, n, i, s = 6) {
  const r = [], o = Math.max(1, Math.round(s));
  for (let a = 0; a <= o; a++)
    r.push({ x: a % 2 === 0 ? e : e + n, y: t + i * a / o });
  return r;
}
function to(e, t, n, i) {
  if (i <= 0 || t.length === 0) return;
  const s = oe(t, i), r = n / 2, o = (a) => {
    e.beginPath(), e.rect(-Se, -Se, 2 * Se, 2 * Se), a(), e.clip("evenodd");
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
function $d(e, t, n, i, s) {
  e.save(), to(e, t, n, i), s(), e.restore();
}
function Id(e, t) {
  const n = t.width ?? 40, i = t.hand === !0 ? {} : t.hand || void 0, s = t.eraser === !1 ? void 0 : t.eraser === !0 || t.eraser === void 0 ? {} : t.eraser;
  return {
    ...e,
    props: { ...e.props, erase: 0 },
    draw(r, o, a) {
      const l = Number(o.props?.erase ?? 0);
      if (r.save(), to(r, t.path, n, l), e.draw(r, o, a), r.restore(), !s || l <= 0 || l >= 1) return;
      const h = ii(t.path, l);
      i ? Jr(r, h, { ...i, tool: "eraser" }) : Gr(r, h, s);
    }
  };
}
const bf = (e, t, n) => e.slice(Math.floor((e.length - 1) * t), Math.ceil((e.length - 1) * n) + 1);
function Rd(e = {}) {
  const t = e.shirt ?? "#e2493b", n = e.trousers ?? "#24476b", i = (a) => a.lineWidth * 0.45, s = (a, l, h) => {
    const c = a.parts[`leg.${h}`].points;
    l.shape(Ae(c, a.height * 0.08, a.height * 0.05), n, i(a));
  }, r = (a, l) => {
    const h = a.chains.spine, c = h[0], f = h[h.length - 1], u = { x: c.x - (f.x - c.x) * 0.25, y: c.y - (f.y - c.y) * 0.25 };
    l.shape(Ae([u, ...a.parts.spine.points], a.height * 0.15, a.height * 0.14), t, i(a));
  }, o = (a, l, h) => {
    const c = a.parts[`arm.${h}`].points, f = c[0], u = a.chains.spine[a.chains.spine.length - 1], m = [{ x: f.x + (u.x - f.x) * 0.45, y: f.y + (u.y - f.y) * 0.45 }, ...bf(c, 0, 0.45)], d = Ae(m, a.height * 0.085, a.height * 0.06), g = m.length, y = d.slice(0, g), w = d.slice(g).reverse();
    l.shape(d, t, 0);
    const b = (k) => Math.hypot(k[1].x - u.x, k[1].y - u.y), [S, v] = b(y) > b(w) ? [y, w] : [w, y];
    l.line(S.slice(1), i(a)), l.line(v.slice(Math.ceil(g * 0.45)), i(a)), l.line([y[g - 1], w[g - 1]], i(a));
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
function Fd(e) {
  const { timeline: t } = e, n = new kt();
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
const Ld = {
  timeline: nl,
  to(e, t, n) {
    const i = new It(n);
    return i.to(e, t), i;
  },
  from(e, t, n) {
    const i = new It(n);
    return i.from(e, t), i;
  },
  fromTo(e, t, n, i) {
    const s = new It(i);
    return s.fromTo(e, t, n), s;
  },
  set(e, t, n) {
    const i = new It(n);
    return i.set(e, t), i;
  }
}, Od = Z.to, Bd = Z.from, Dd = Z.fromTo, Wd = Z.set, Nd = Z.timeline, Yd = Z.ticker, Kd = Z.splitText, qd = Z.context, Xd = Z.matchMedia, Vd = Z.quickTo, Ud = Z.imageSequence, zd = Z.pageTransition;
qh();
export {
  kf as Clock,
  It as CompatTimeline,
  dh as CustomBounce,
  fh as CustomEase,
  ph as CustomWiggle,
  Dt as DANCE_STYLES,
  Bs as DEFAULT_BAKE_INTERVAL_MS,
  yi as DEFAULT_INERTIA_FRICTION,
  Eh as DEFAULT_LABELS,
  et as DEFAULT_SPRING,
  nd as DEFAULT_TRANSITION,
  dr as Draggable,
  tt as EXPRESSIONS,
  Qh as FINGERS,
  hi as FLIPS,
  gi as FORMAT_VERSION,
  W as HAND_REST,
  K as HAND_SHAPES,
  bd as HUMAN_EXPRESSIONS,
  Lu as HUMAN_POSES,
  J as HUMAN_REST,
  co as INERTIA_MAX_DURATION_MS,
  aa as InertiaTrackPlayer,
  ct as LiveTimeline,
  Pf as MORPH_SAMPLES,
  ys as MUDRAS,
  vf as ManualClock,
  ns as MediaSync,
  Al as Observer,
  wc as POSES,
  G as REST_POSE,
  Cs as SPRING_MAX_DURATION_MS,
  Je as SPRING_PRESETS,
  Ut as SPRING_STEP_MS,
  jl as ScrollAnimator,
  Ze as ScrollDriver,
  Gl as ScrollMarkers,
  ql as ScrollPin,
  ji as SmoothScroll,
  Ue as SpringSampler,
  oa as SpringTrackPlayer,
  wl as Stage,
  qs as Timeline,
  ni as TinyflyPlayer,
  Xh as TinyflySequencer,
  sn as TrackPlayer,
  Bf as ValueResolver,
  Kl as VisibilityDriver,
  iu as applyGroove,
  xo as backOut,
  pd as bakeDanceTracks,
  Ys as bakeEasing,
  Ws as bakeInertiaTrack,
  Ds as bakeSpringTrack,
  Rd as basicOutfit,
  ud as beatAt,
  jn as beatAtTime,
  Js as beatLength,
  zn as beatTime,
  qf as beatsBetween,
  Oh as bindChoiceHotspots,
  le as blendPose,
  Sr as boilFrame,
  So as bounceOut,
  Zu as character,
  Td as characterAt,
  sf as characterHandPose,
  tf as characterJoints,
  kd as characterJointsInView,
  Ad as characterObjects,
  Ed as characterPoseTracks,
  Md as characterTarget,
  ha as charactersFor,
  _d as circlePath,
  yr as clamp01,
  _f as clearMorphCache,
  Ef as clearPathCache,
  to as clipErased,
  Vi as containerProgressAt,
  qd as context,
  Qf as create,
  Ch as createControls,
  vo as createCubicBezier,
  vh as createLive,
  xr as createPen,
  Un as createRandom,
  En as createTrack,
  Mf as criticalDamping,
  va as customBounce,
  wa as customEase,
  ka as customWiggle,
  ai as danceFrame,
  hd as dancePose,
  Wn as danceStance,
  cd as danceTaps,
  dd as danceTracks,
  mn as danceTravel,
  au as danceTravelTrack,
  fd as dancer,
  ne as deserializeTimeline,
  pa as deserializeTrack,
  Xf as detectTempo,
  zf as draggable,
  ri as drawCartoonHand,
  of as drawCharacter,
  af as drawCharacterInView,
  Gr as drawEraser,
  Jr as drawHand,
  pf as drawPencil,
  Uc as drawStickFigure,
  Cd as drawnPathTarget,
  go as easeIn,
  Hs as easeInCubic,
  bo as easeInOut,
  je as easeInOutCubic,
  mo as easeInOutQuad,
  fo as easeInQuad,
  yo as easeOut,
  $s as easeOutCubic,
  po as easeOutQuad,
  ko as elasticOut,
  os as ellipsePoints,
  Id as erasable,
  sa as expandParametricEasings,
  Mu as flipPose,
  md as flipTracks,
  Tu as flipTravel,
  Es as formatVersionFor,
  Bd as from,
  Ff as fromJSON,
  Dd as fromTo,
  z as getEasingFunction,
  $e as getInterpolator,
  Ks as getMotionPathPoint,
  Af as getPathLength,
  Ro as getPointAtProgress,
  _l as gridLinesFor,
  Pd as handAt,
  Ln as handJoints,
  uc as handJointsAt,
  D as handPose,
  Ne as handProp,
  oo as hasKeyframes,
  Us as hashSeed,
  rd as headPoint,
  yd as humanFieldLabel,
  Ou as humanPlan,
  Q as humanPose,
  Ud as imageSequence,
  ce as inertiaDuration,
  he as inertiaRest,
  Sn as inertiaValueAt,
  Tf as inertiaVelocityAt,
  ea as interpolateArray,
  ta as interpolateColor,
  If as interpolateMotionPath,
  ht as interpolateNumber,
  ia as interpolatePathString,
  na as interpolateQuaternion,
  Hi as interpolateString,
  ro as isCubicBezierEasing,
  xt as isInertiaTrack,
  wf as isMotionPathPoint,
  As as isMotionPathTrack,
  Ce as isParametricEasing,
  ue as isPathData,
  Mt as isSpringTrack,
  qn as isTextTrack,
  xf as isUnderdamped,
  Of as isUnresolved,
  lf as jointsInScene,
  Vc as jointsToScene,
  xn as linear,
  Z as live,
  Re as mapEase,
  Uf as mat4,
  Xd as matchMedia,
  _s as maxStaggerDistance,
  gd as mirrorHumanPose,
  eu as mirrorPose,
  ae as mixHandPoses,
  Sd as mixPoses,
  Vo as morphPath,
  Dh as mount,
  Yh as mountAll,
  Wf as narrationMarkers,
  Nf as narrationSceneAt,
  He as naturalRest,
  Yf as nearestBeat,
  Kf as nextBeat,
  zd as pageTransition,
  To as parametricEasing,
  Xi as parseEdge,
  Ft as parsePath,
  gr as parseTrigger,
  oe as partialPath,
  Vh as pathLength,
  Df as planNarration,
  Jf as play,
  ed as playSequence,
  Gf as playWhenVisible,
  Xs as playheadCrossings,
  ii as pointAlong,
  Is as pointAtDistance,
  vd as pointOnHead,
  Aa as pointsToPath,
  q as pose,
  ld as poseTracks,
  Cf as quat,
  Fd as quickPlay,
  Vd as quickTo,
  zs as randomBetween,
  Lf as randomChoice,
  ga as randomSnapped,
  xd as reachCharacter,
  ya as resolveSequence,
  Br as resolveStickFrame,
  zc as resolveStickPose,
  Zs as resolveValue,
  St as rotateAbout,
  li as routineBeats,
  Bt as rubberLimb,
  jf as scrollProgress,
  Zf as scrubOnScroll,
  Hd as scrubPath,
  sd as seatHeight,
  ma as serializeTimeline,
  da as serializeTrack,
  Wd as set,
  Gn as shapeToPathData,
  ra as simplifyKeyframes,
  Xr as skeletonInView,
  In as sketchPen,
  Yl as smoothToward,
  Pl as snapAxis,
  Vl as snapConfig,
  zl as snapDuration,
  Ul as snapProgress,
  ui as solvePlanSpace,
  Kd as splitText,
  ao as springDuration,
  Sf as springValueAt,
  qr as stagePlanSpace,
  Ps as staggerDistance,
  Xn as staggerOffset,
  kn as staggerOffsets,
  Ve as staggerSpan,
  Mo as stepsEasing,
  ad as stickFigureAt,
  Xc as stickFigureJoints,
  od as stickFigureTarget,
  wd as stickToHuman,
  id as strideLength,
  Th as syncMediaElement,
  Sc as talkingMouth,
  si as taperedLine,
  Ae as taperedOutline,
  ua as textAt,
  Ld as tf,
  Yd as ticker,
  Nd as timeline,
  Od as to,
  Rf as toJSON,
  Hf as toKeyframedTrack,
  $f as toKeyframedTracks,
  wt as trackTargets,
  re as triggerDistance,
  td as unmount,
  Vf as vec3,
  kc as walkPose,
  $d as withErased,
  Tr as withExpression
};
