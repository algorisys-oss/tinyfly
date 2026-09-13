function Wt(e) {
  return typeof e == "object" && e !== null && e.type === "cubic-bezier";
}
function ct(e) {
  return e.property === "text" && "textConfig" in e;
}
function W(e) {
  return e.kind === "inertia" && "inertia" in e;
}
function z(e) {
  return e.kind === "spring" && "spring" in e;
}
function Be(e) {
  return e.property === "motionPath" && "motionPathConfig" in e;
}
function nr(e) {
  return typeof e == "object" && e !== null && "x" in e && "y" in e && "angle" in e;
}
function vn(e) {
  return "keyframes" in e;
}
class ir {
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
class sr {
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
function Ie(e, t, n = "start") {
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
function xn(e, t = "start") {
  if (e <= 1) return 0;
  let n = 0;
  for (let i = 0; i < e; i++)
    n = Math.max(n, Ie(i, e, t));
  return n;
}
function Le(e, t, n) {
  const i = n.from ?? "start", s = Ie(e, t, i);
  if (n.amount !== void 0) {
    const r = xn(t, i);
    return r === 0 ? 0 : n.amount * s / r;
  }
  return n.each !== void 0 ? n.each * s : 0;
}
function Mn(e, t) {
  return Array.from({ length: e }, (n, i) => Le(i, e, t));
}
function Mt(e, t) {
  return e <= 1 ? 0 : Math.max(...Mn(e, t));
}
const it = 1, Fe = 6e4, mt = Fe / it, R = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
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
    this.from = t.from, this.to = t.to, this.stiffness = t.stiffness ?? R.stiffness, this.damping = t.damping ?? R.damping, this.mass = t.mass ?? R.mass, this.restDelta = t.restDelta ?? R.restDelta, this.restSpeed = t.restSpeed ?? R.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = t.velocity ?? R.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = Math.floor(t / it);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const i = this.samples[Math.min(n, this.samples.length - 1)], s = this.samples[Math.min(n + 1, this.samples.length - 1)], r = t / it - n;
    return i + (s - i) * r;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(mt + 1), this.settledStep !== null ? this.settledStep * it : Fe;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(t) {
    if (this.settledStep !== null) return;
    const n = Math.min(t, mt + 1), i = it / 1e3;
    for (; this.samples.length < n; ) {
      const s = this.samples[this.samples.length - 1], r = s - this.to, a = -this.stiffness * r, c = -this.damping * this.velocity, l = (a + c) / this.mass;
      this.velocity += l * i;
      const o = s + this.velocity * i;
      if (this.samples.push(o), this.isAtRest(o)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > mt && (this.settledStep = mt);
  }
}
function rr(e, t) {
  return new St(e).valueAt(t);
}
function or(e) {
  return new St(e).settleTime();
}
function ar(e) {
  const t = e.stiffness ?? R.stiffness, n = e.damping ?? R.damping, i = e.mass ?? R.mass;
  return n < 2 * Math.sqrt(t * i);
}
function cr(e) {
  const t = e.stiffness ?? R.stiffness, n = e.mass ?? R.mass;
  return 2 * Math.sqrt(t * n);
}
const te = 4, Sn = 2e-3, An = 1e-4, kn = 6e4;
function At(e) {
  const t = e.friction ?? te;
  return t > 0 ? t : te;
}
function wt(e) {
  return e.from + e.velocity / At(e);
}
function En(e, t) {
  if (t === void 0) return e;
  if (typeof t == "number")
    return t > 0 ? Math.round(e / t) * t : e;
  if (t.length === 0) return e;
  let n = t[0];
  for (const i of t)
    Math.abs(i - e) < Math.abs(n - e) && (n = i);
  return n;
}
function lt(e) {
  let t = En(wt(e), e.end);
  return e.min !== void 0 && (t = Math.max(e.min, t)), e.max !== void 0 && (t = Math.min(e.max, t)), t;
}
function ht(e) {
  const t = Math.abs(lt(e) - e.from);
  if (t === 0) return 0;
  const n = e.restDelta ?? Math.max(An, t * Sn);
  if (n >= t) return 0;
  const i = Math.log(t / n) / At(e);
  return Math.min(kn, i * 1e3);
}
function Yt(e, t) {
  if (t <= 0) return e.from;
  const n = lt(e);
  if (t >= ht(e)) return n;
  const i = At(e);
  return e.from + (n - e.from) * (1 - Math.exp(-i * t / 1e3));
}
function lr(e, t) {
  const n = At(e), i = lt(e);
  return t >= ht(e) ? 0 : (i - e.from) * n * Math.exp(-n * Math.max(0, t) / 1e3);
}
const Re = (e) => e, Pn = (e) => e * e, _n = (e) => 1 - (1 - e) * (1 - e), Cn = (e) => e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2, De = (e) => e * e * e, Xe = (e) => 1 - Math.pow(1 - e, 3), Oe = (e) => e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2, $n = De, Bn = Xe, In = Oe, Ln = {
  linear: Re,
  "ease-in": $n,
  "ease-out": Bn,
  "ease-in-out": In,
  "ease-in-quad": Pn,
  "ease-out-quad": _n,
  "ease-in-out-quad": Cn,
  "ease-in-cubic": De,
  "ease-out-cubic": Xe,
  "ease-in-out-cubic": Oe
};
function Fn(e) {
  const [t, n, i, s] = e, r = 3 * t, a = 3 * (i - t) - r, c = 1 - r - a, l = 3 * n, o = 3 * (s - n) - l, u = 1 - l - o, f = (p) => ((c * p + a) * p + r) * p, h = (p) => ((u * p + o) * p + l) * p, d = (p) => (3 * c * p + 2 * a) * p + r, m = (p) => {
    let g = p;
    for (let T = 0; T < 8; T++) {
      const w = f(g) - p;
      if (Math.abs(w) < 1e-7)
        return g;
      const b = d(g);
      if (Math.abs(b) < 1e-7)
        break;
      g -= w / b;
    }
    let y = 0, v = 1;
    for (g = p; y < v; ) {
      const T = f(g);
      if (Math.abs(T - p) < 1e-7)
        return g;
      p > T ? y = g : v = g, g = (y + v) / 2;
    }
    return g;
  };
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    const g = m(p);
    return h(g);
  };
}
function Ye(e) {
  return e === void 0 ? Re : Wt(e) ? Fn(e.points) : Ln[e];
}
const ee = 32, Rn = 256, G = /* @__PURE__ */ new Map(), Dn = /[MmLlHhVvCcSsQqTtAaZz]/, Xn = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, On = {
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
function Yn(e) {
  const t = [];
  let n = 0, i = null;
  const s = () => {
    for (; n < e.length && /[\s,]/.test(e[n]); ) n++;
  };
  for (; n < e.length && (s(), !(n >= e.length)); ) {
    const r = e[n];
    if (Dn.test(r)) {
      i = { type: r, args: [] }, t.push(i), n++;
      continue;
    }
    if (!i) break;
    const a = i.type === "A" || i.type === "a", c = i.args.length % 7;
    if (a && (c === 3 || c === 4)) {
      if (r !== "0" && r !== "1") break;
      i.args.push(r === "1" ? 1 : 0), n++;
      continue;
    }
    const l = Xn.exec(e.slice(n));
    if (!l) break;
    i.args.push(parseFloat(l[0])), n += l[0].length;
  }
  return t;
}
function qn(e, t, n, i, s, r, a, c, l) {
  if (e === c && t === l) return [];
  let o = Math.abs(n), u = Math.abs(i);
  if (o === 0 || u === 0) return [[e, t, c, l, c, l]];
  const f = s * Math.PI / 180, h = Math.cos(f), d = Math.sin(f), m = (e - c) / 2, p = (t - l) / 2, g = h * m + d * p, y = -d * m + h * p, v = g * g / (o * o) + y * y / (u * u);
  if (v > 1) {
    const C = Math.sqrt(v);
    o *= C, u *= C;
  }
  const T = r === a ? -1 : 1, w = o * o * u * u - o * o * y * y - u * u * g * g, b = o * o * y * y + u * u * g * g, M = T * Math.sqrt(Math.max(0, w / b)), x = M * o * y / u, P = -M * u * g / o, A = h * x - d * P + (e + c) / 2, S = d * x + h * P + (t + l) / 2, k = (C, B, I, H) => {
    const kt = C * I + B * H, pt = Math.sqrt((C * C + B * B) * (I * I + H * H)), J = Math.acos(Math.max(-1, Math.min(1, kt / pt)));
    return C * H - B * I < 0 ? -J : J;
  }, E = k(1, 0, (g - x) / o, (y - P) / u);
  let _ = k((g - x) / o, (y - P) / u, (-g - x) / o, (-y - P) / u);
  !a && _ > 0 && (_ -= 2 * Math.PI), a && _ < 0 && (_ += 2 * Math.PI);
  const F = Math.max(1, Math.ceil(Math.abs(_) / (Math.PI / 2))), N = _ / F, dt = 4 / 3 * Math.tan(N / 4), Zt = (C) => {
    const B = o * Math.cos(C), I = u * Math.sin(C);
    return [h * B - d * I + A, d * B + h * I + S];
  }, Qt = (C) => {
    const B = -o * Math.sin(C), I = u * Math.cos(C);
    return [h * B - d * I, d * B + h * I];
  }, Jt = [];
  for (let C = 0; C < F; C++) {
    const B = E + C * N, I = B + N, [H, kt] = Zt(B), [pt, J] = C === F - 1 ? [c, l] : Zt(I), [yn, bn] = Qt(B), [Tn, wn] = Qt(I);
    Jt.push([H + dt * yn, kt + dt * bn, pt - dt * Tn, J - dt * wn, pt, J]);
  }
  return Jt;
}
function q(e, t, n, i, s) {
  const r = 1 - s;
  return r * r * r * e + 3 * r * r * s * t + 3 * r * s * s * n + s * s * s * i;
}
function ne(e, t, n, i, s) {
  const r = 1 - s;
  return 3 * r * r * (t - e) + 6 * r * s * (n - t) + 3 * s * s * (i - n);
}
function tt(e, t, n, i) {
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
function gt(e, t, n) {
  const [i, s, r, a, c, l] = n, o = [0];
  let u = e, f = t, h = 0;
  for (let d = 1; d <= ee; d++) {
    const m = d / ee, p = q(e, i, r, c, m), g = q(t, s, a, l, m);
    h += Math.hypot(p - u, g - f), o.push(h), u = p, f = g;
  }
  return {
    subpath: 0,
    type: "C",
    points: [i, s, r, a, c, l],
    startX: e,
    startY: t,
    endX: c,
    endY: l,
    length: h,
    lengths: o
  };
}
function st(e) {
  const t = G.get(e);
  if (t) return t;
  const n = [];
  let i = 0, s = 0, r = 0, a = 0, c = null, l = null, o = -1;
  const u = /* @__PURE__ */ new Set(), f = (p) => {
    o < 0 && (o = 0), p.subpath = o, n.push(p);
  };
  for (const { type: p, args: g } of Yn(e)) {
    const y = p.toUpperCase(), v = p !== y, T = On[y];
    if (y === "Z") {
      (i !== r || s !== a) && f(tt(i, s, r, a)), o >= 0 && u.add(o), i = r, s = a, c = l = null;
      continue;
    }
    for (let w = 0; w + T <= g.length; w += T) {
      const b = g.slice(w, w + T), M = v ? i : 0, x = v ? s : 0;
      let P = null, A = null;
      switch (y) {
        case "M":
          w === 0 ? (i = b[0] + M, s = b[1] + x, r = i, a = s, (o < 0 || n[n.length - 1]?.subpath === o) && o++) : (f(tt(i, s, b[0] + M, b[1] + x)), i = b[0] + M, s = b[1] + x);
          break;
        case "L":
          f(tt(i, s, b[0] + M, b[1] + x)), i = b[0] + M, s = b[1] + x;
          break;
        case "H":
          f(tt(i, s, b[0] + M, s)), i = b[0] + M;
          break;
        case "V":
          f(tt(i, s, i, b[0] + x)), s = b[0] + x;
          break;
        case "C": {
          const S = [b[0] + M, b[1] + x, b[2] + M, b[3] + x, b[4] + M, b[5] + x];
          f(gt(i, s, S)), P = [S[2], S[3]], i = S[4], s = S[5];
          break;
        }
        case "S": {
          const [S, k] = c ? [2 * i - c[0], 2 * s - c[1]] : [i, s], E = [S, k, b[0] + M, b[1] + x, b[2] + M, b[3] + x];
          f(gt(i, s, E)), P = [E[2], E[3]], i = E[4], s = E[5];
          break;
        }
        case "Q":
        case "T": {
          let S = i, k = s;
          y === "Q" ? (S = b[0] + M, k = b[1] + x) : l && (S = 2 * i - l[0], k = 2 * s - l[1]);
          const E = y === "Q" ? b[2] + M : b[0] + M, _ = y === "Q" ? b[3] + x : b[1] + x;
          f(
            gt(i, s, [
              i + 2 / 3 * (S - i),
              s + 2 / 3 * (k - s),
              E + 2 / 3 * (S - E),
              _ + 2 / 3 * (k - _),
              E,
              _
            ])
          ), A = [S, k], i = E, s = _;
          break;
        }
        case "A": {
          const S = b[5] + M, k = b[6] + x;
          let E = i, _ = s;
          for (const F of qn(i, s, b[0], b[1], b[2], b[3], b[4], S, k))
            f(gt(E, _, F)), E = F[4], _ = F[5];
          i = S, s = k;
          break;
        }
      }
      c = P, l = A;
    }
  }
  const h = n.reduce((p, g) => p + g.length, 0), d = [];
  for (let p = 0; p < n.length; ) {
    const g = n[p].subpath;
    let y = p, v = 0;
    for (; y < n.length && n[y].subpath === g; ) v += n[y++].length;
    const T = n[p], w = n[y - 1], b = u.has(g) || Math.abs(w.endX - T.startX) < 1e-9 && Math.abs(w.endY - T.startY) < 1e-9;
    d.push({ start: p, end: y, length: v, closed: b }), p = y;
  }
  const m = { segments: n, totalLength: h, subpaths: d };
  return G.size >= Rn && G.delete(G.keys().next().value), G.set(e, m), m;
}
function Nn(e, t) {
  const n = e.lengths;
  if (t <= 0) return 0;
  if (t >= e.length) return 1;
  let i = 0, s = n.length - 1;
  for (; i < s - 1; ) {
    const c = i + s >> 1;
    n[c] < t ? i = c : s = c;
  }
  const r = n[s] - n[i], a = r > 0 ? (t - n[i]) / r : 0;
  return (i + a) / (n.length - 1);
}
function Vn(e, t) {
  if (e.type === "L") {
    const f = e.length > 0 ? Math.max(0, Math.min(1, t / e.length)) : 0;
    return {
      x: e.startX + (e.endX - e.startX) * f,
      y: e.startY + (e.endY - e.startY) * f,
      angle: Math.atan2(e.endY - e.startY, e.endX - e.startX) * 180 / Math.PI
    };
  }
  const [n, i, s, r, a, c] = e.points, l = Nn(e, t);
  let o = ne(e.startX, n, s, a, l), u = ne(e.startY, i, r, c, l);
  if (Math.hypot(o, u) < 1e-9) {
    const f = l < 0.5 ? Math.min(1, l + 1e-3) : Math.max(0, l - 1e-3), h = q(e.startX, n, s, a, f), d = q(e.startY, i, r, c, f), m = q(e.startX, n, s, a, l), p = q(e.startY, i, r, c, l);
    o = l < 0.5 ? h - m : m - h, u = l < 0.5 ? d - p : p - d;
  }
  return {
    x: q(e.startX, n, s, a, l),
    y: q(e.startY, i, r, c, l),
    angle: Math.atan2(u, o) * 180 / Math.PI
  };
}
function qe(e, t, n = 0, i = e.length) {
  if (i <= n) return { x: 0, y: 0, angle: 0 };
  let s = 0;
  for (let r = n; r < i; r++) {
    const a = e[r];
    if (s + a.length >= t || r === i - 1)
      return Vn(a, t - s);
    s += a.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function Un(e, t) {
  const { segments: n, totalLength: i } = st(e);
  return qe(n, Math.max(0, Math.min(1, t)) * i);
}
function hr() {
  G.clear();
}
function ur(e) {
  return st(e).totalLength;
}
const Wn = 24, zn = 320, Hn = 2.5, et = 72, fr = 64, Gn = 128, j = /* @__PURE__ */ new Map(), ie = (e) => Math.round(e * 100) / 100;
function se(e, t) {
  const { segments: n, subpaths: i, totalLength: s } = st(e);
  if (n.length === 0) return [];
  if (t) {
    const r = i.every((a) => a.closed);
    return [{ segments: n, start: 0, end: n.length, length: s, closed: r }];
  }
  return i.filter((r) => r.length > 0).map((r) => ({ segments: n, start: r.start, end: r.end, length: r.length, closed: r.closed }));
}
function qt(e, t) {
  const n = e.closed ? (t % 1 + 1) % 1 : Math.max(0, Math.min(1, t)), i = qe(e.segments, n * e.length, e.start, e.end);
  return [i.x, i.y];
}
function re(e) {
  const t = [];
  let n = 0;
  for (let i = e.start; i < e.end; i++)
    n += e.segments[i].length, e.length > 0 && t.push(n / e.length);
  return t;
}
function oe(e, t) {
  const n = [];
  for (let i = 0; i < t; i++)
    n.push(qt(e, e.closed ? i / t : i / (t - 1)));
  return n;
}
function ae(e) {
  let t = 0, n = 0;
  for (const [i, s] of e)
    t += i, n += s;
  return t /= e.length, n /= e.length, e.map(([i, s]) => [i - t, s - n]);
}
function jn(e, t, n) {
  const i = e.closed && t.closed;
  if (n !== void 0)
    return { offset: i ? Math.abs(n) % et / et : 0, reversed: n < 0 };
  const s = ae(oe(e, et)), r = ae(oe(t, et)), a = et;
  let c = { offset: 0, reversed: !1 }, l = 1 / 0;
  for (const o of [!1, !0]) {
    const u = i ? a : 1;
    for (let f = 0; f < u; f++) {
      let h = 0;
      for (let d = 0; d < a && h < l; d++) {
        const m = i ? o ? (f - d + a) % a : (d + f) % a : o ? a - 1 - d : d, p = s[d][0] - r[m][0], g = s[d][1] - r[m][1];
        h += p * p + g * g;
      }
      h < l && (l = h, c = { offset: i ? f / a : 0, reversed: o });
    }
  }
  return c;
}
function Kn(e, t, n) {
  return n ? ((t.reversed ? t.offset - e : e + t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function Zn(e, t, n) {
  return n ? ((t.reversed ? t.offset - e : e - t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function Qn(e, t, n) {
  const i = e.closed && t.closed, s = jn(e, t, n.shapeIndex), r = Math.max(
    Wn,
    Math.min(zn, Math.ceil(Math.max(e.length, t.length) / Hn))
  ), a = /* @__PURE__ */ new Set(), c = (f) => a.add(Math.round(f * 1e7) / 1e7);
  for (let f = 0; f <= r; f++) c(f / r);
  for (const f of re(e)) c(f);
  for (const f of re(t)) c(Zn(f, s, i));
  let l = [...a].sort((f, h) => f - h);
  i && (l = l.filter((f) => f < 1));
  const o = [], u = [];
  for (const f of l)
    o.push(...qt(e, f)), u.push(...qt(t, Kn(f, s, i)));
  return { from: o, to: u, closed: i };
}
function Jn(e, t, n) {
  const i = `${n.shapeIndex ?? "auto"}|${e}|${t}`, s = j.get(i);
  if (s) return s;
  const r = st(e).subpaths.filter((o) => o.length > 0).length === st(t).subpaths.filter((o) => o.length > 0).length, a = se(e, !r), c = se(t, !r), l = {
    pairs: a.map((o, u) => Qn(o, c[u], n))
  };
  return j.size >= Gn && j.delete(j.keys().next().value), j.set(i, l), l;
}
function ti(e, t, n, i = {}) {
  if (!e) return t;
  if (!t) return e;
  const s = Math.max(0, Math.min(1, n));
  if (s === 0) return e;
  if (s === 1) return t;
  const r = Jn(e, t, i);
  if (r.pairs.length === 0) return s < 0.5 ? e : t;
  let a = "";
  for (const c of r.pairs) {
    for (let l = 0; l < c.from.length; l += 2) {
      const o = ie(c.from[l] + (c.to[l] - c.from[l]) * s), u = ie(c.from[l + 1] + (c.to[l + 1] - c.from[l + 1]) * s);
      a += `${l === 0 ? a ? " M" : "M" : " L"}${o} ${u}`;
    }
    c.closed && (a += " Z");
  }
  return a;
}
function dr() {
  j.clear();
}
function ut(e) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(e);
}
const Y = (e, t, n) => e + (t - e) * n, Ne = 512, Et = /* @__PURE__ */ new Map(), Pt = /* @__PURE__ */ new Map();
function ce(e) {
  const t = Et.get(e);
  if (t) return t;
  const n = e.replace("#", ""), i = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return Et.size < Ne && Et.set(e, i), i;
}
const le = (e) => e.charCodeAt(0) === 35, he = (e) => e.startsWith("rgb"), ue = (e) => e.startsWith("rgba"), ei = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, _t = (e) => Math.round(e).toString(16).padStart(2, "0");
function ni(e, t, n) {
  return `#${_t(e)}${_t(t)}${_t(n)}`;
}
function fe(e) {
  const t = Pt.get(e);
  if (t) return t;
  const n = e.match(ei);
  if (!n)
    throw new Error(`Invalid rgb color: ${e}`);
  const i = parseInt(n[1], 10), s = parseInt(n[2], 10), r = parseInt(n[3], 10), a = n[4] !== void 0 ? [i, s, r, parseFloat(n[4])] : [i, s, r];
  return Pt.size < Ne && Pt.set(e, a), a;
}
const ii = (e, t, n) => {
  if (le(e) && le(t)) {
    const [i, s, r] = ce(e), [a, c, l] = ce(t), o = Y(i, a, n), u = Y(s, c, n), f = Y(r, l, n);
    return ni(o, u, f);
  }
  if ((he(e) || ue(e)) && (he(t) || ue(t))) {
    const i = fe(e), s = fe(t), r = Math.round(Y(i[0], s[0], n)), a = Math.round(Y(i[1], s[1], n)), c = Math.round(Y(i[2], s[2], n));
    if (i.length === 4 || s.length === 4) {
      const l = i[3] ?? 1, o = s[3] ?? 1, u = Y(l, o, n);
      return `rgba(${r}, ${a}, ${c}, ${u})`;
    }
    return `rgb(${r}, ${a}, ${c})`;
  }
  return n < 1 ? e : t;
}, si = (e, t, n) => {
  const i = Math.min(e.length, t.length), s = [];
  for (let r = 0; r < i; r++)
    s.push(Y(e[r], t[r], n));
  return s;
}, de = (e, t, n) => n < 1 ? e : t, ri = (e, t, n) => ti(e, t, n);
function Ve(e) {
  return typeof e == "number" ? Y : Array.isArray(e) ? si : typeof e == "string" ? e.startsWith("#") || e.startsWith("rgb") ? ii : ut(e) ? ri : de : de;
}
const Ue = 1e3 / 60;
function We(e, t = {}) {
  if (!z(e))
    throw new Error(`bakeSpringTrack: track "${e.id}" is not a spring track`);
  const n = new St(e.spring);
  return He(e, (i) => n.valueAt(i), n.settleTime(), e.spring.from, e.spring.to, t);
}
function ze(e, t = {}) {
  if (!W(e))
    throw new Error(`bakeInertiaTrack: track "${e.id}" is not an inertia track`);
  const n = e.inertia;
  return He(
    e,
    (i) => Yt(n, i),
    ht(n),
    n.from,
    lt(n),
    t
  );
}
function He(e, t, n, i, s, r) {
  const a = r.intervalMs ?? Ue, c = r.tolerance ?? 0.01, l = e.delay ?? 0, o = [];
  for (let f = 0; f <= n; f += a)
    o.push({ time: f + l, value: t(f), easing: "linear" });
  const u = o[o.length - 1];
  return !u || u.time < n + l ? o.push({ time: n + l, value: s, easing: "linear" }) : u.value = s, l > 0 && o.unshift({ time: 0, value: i, easing: "linear" }), {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: c > 0 ? ai(o, c) : o,
    ...e.targets && { targets: [...e.targets] },
    ...e.stagger && { stagger: { ...e.stagger } }
  };
}
function oi(e, t, n, i = {}) {
  const s = i.intervalMs ?? Ue, r = typeof n == "function" ? n : Ye(n), a = Ve(e.value), c = t.time - e.time;
  if (c <= 0) return [t];
  const l = [];
  for (let o = s; o < c; o += s) {
    const u = o / c;
    l.push({
      time: e.time + o,
      value: a(e.value, t.value, r(u)),
      easing: "linear"
    });
  }
  return l.push({ ...t, easing: "linear" }), l;
}
function pr(e, t) {
  return z(e) ? We(e, t) : W(e) ? ze(e, t) : e;
}
function Ge(e, t) {
  return e.filter(vn).concat(
    e.filter(z).map((n) => We(n, t)),
    e.filter(W).map((n) => ze(n, t))
  );
}
function ai(e, t) {
  if (e.length <= 2) return e;
  const n = [e[0]];
  for (let i = 1; i < e.length - 1; i++) {
    const s = n[n.length - 1], r = e[i], a = e[i + 1], c = a.time - s.time;
    if (c <= 0) continue;
    const l = (r.time - s.time) / c, o = s.value + (a.value - s.value) * l;
    Math.abs(r.value - o) > t && n.push(r);
  }
  return n.push(e[e.length - 1]), n;
}
function Nt(e) {
  const t = [...e.keyframes].sort((n, i) => n.time - i.time);
  return {
    ...e,
    keyframes: t
  };
}
function V(e) {
  return e.targets && e.targets.length > 0 ? e.targets : [e.target];
}
function Q(e, t, n, i) {
  const s = n ?? 0;
  return !i || t <= 1 ? s : s + Le(e, t, i);
}
class Ct {
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
    return this.valueForOffset(t - Q(0, this.targets.length, this.track.delay, this.track.stagger));
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
      const r = Q(s, n, this.track.delay, this.track.stagger), a = this.valueForOffset(t - r);
      a !== void 0 && i.push({ target: this.targets[s], value: a, start: r + this.track.keyframes[0].time });
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
    const n = t[t.length - 1].time, i = this.track.stagger ? Mt(this.targets.length, this.track.stagger) : 0;
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
    const r = s.time - i.time, a = (t - i.time) / r, l = Ye(s.easing)(a);
    return Ve(i.value)(i.value, s.value, l);
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
class ci {
  track;
  targets;
  sampler;
  constructor(t) {
    this.track = t, this.targets = V(t), this.sampler = new St(t.spring);
  }
  getValueAtTime(t) {
    return this.sampler.valueAt(t - Q(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const n = this.targets.length, i = [];
    for (let s = 0; s < n; s++) {
      const r = Q(s, n, this.track.delay, this.track.stagger);
      i.push({ target: this.targets[s], value: this.sampler.valueAt(t - r), start: r });
    }
    return i;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? Mt(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
class li {
  track;
  targets;
  duration;
  constructor(t) {
    this.track = t, this.targets = V(t), this.duration = ht(t.inertia);
  }
  getValueAtTime(t) {
    return Yt(this.track.inertia, t - Q(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const n = this.targets.length, i = [];
    for (let s = 0; s < n; s++) {
      const r = Q(s, n, this.track.delay, this.track.stagger);
      i.push({ target: this.targets[s], value: Yt(this.track.inertia, t - r), start: r });
    }
    return i;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? Mt(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
function je(e, t) {
  const n = { ...Un(e.pathData, t) };
  if (e.matrix) {
    const [i, s, r, a, c, l] = e.matrix, { x: o, y: u } = n;
    n.x = i * o + r * u + c, n.y = s * o + a * u + l;
    const f = n.angle * Math.PI / 180, h = Math.cos(f), d = Math.sin(f);
    n.angle = Math.atan2(s * h + a * d, i * h + r * d) * 180 / Math.PI;
  }
  return e.autoRotate && e.rotateOffset && (n.angle += e.rotateOffset), n;
}
function mr(e, t, n, i) {
  const s = t + (n - t) * i;
  return je(e, s);
}
const $t = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, hi = 20;
function ui(e) {
  const t = $t[e ?? "upperCase"] ?? e ?? $t.upperCase, n = Array.from(t);
  return n.length > 0 ? n : Array.from($t.upperCase);
}
function fi(e, t, n) {
  let i = (e | 0) ^ Math.imul(t + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return i = Math.imul(i ^ i >>> 16, 2146121005), i = Math.imul(i ^ i >>> 15, 2221713035), (i ^ i >>> 16) >>> 0;
}
function di(e, t, n = 0) {
  const i = e.from ?? "", s = e.to, r = Math.max(0, Math.min(1, t));
  if (r <= 0) return i;
  if (r >= 1) return s;
  const a = Array.from(i), c = Array.from(s), l = e.rightToLeft ?? !1;
  if (e.mode === "type") {
    const v = Math.round(r * Math.max(a.length, c.length));
    return l ? a.slice(0, Math.max(0, a.length - v)).join("") + c.slice(Math.max(0, c.length - v)).join("") : c.slice(0, v).join("") + a.slice(v).join("");
  }
  const o = Math.max(0, Math.min(0.999, e.revealDelay ?? 0)), u = Math.max(0, (r - o) / (1 - o)), f = Math.floor(u * c.length), h = e.tweenLength === !1 ? c.length : Math.round(a.length + (c.length - a.length) * r), d = ui(e.chars), m = e.refreshRate ?? hi, p = m > 0 ? Math.floor(n * m / 1e3) : 0, g = e.seed ?? 1;
  let y = "";
  for (let v = 0; v < h; v++) {
    const T = l ? v >= h - f : v < f, w = l ? c[c.length - (h - v)] : c[v];
    T && w !== void 0 || w === " " || w === `
` ? y += w : y += d[fi(g, v, p) % d.length];
  }
  return y;
}
class Ke {
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
      const c = Math.min(this._repeatDelayRemaining, s);
      if (this._repeatDelayRemaining -= c, s -= c, this._repeatDelayRemaining > 0) {
        this.onUpdate?.(this.getStateAtTime(this._currentTime));
        return;
      }
      this._wrapAfterDelay && (this._wrapAfterDelay = !1, this._currentTime = 0);
    }
    const r = 1e3;
    for (let c = 0; c < r && s > 0 && this._playbackState === "playing"; c++)
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
    const a = this.getStateAtTime(this._currentTime);
    this.onUpdate?.(a);
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
        for (const { target: a, value: c, start: l } of s.getTargetValues(t))
          this._write(n, i, a, r, c, t - l);
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
      const a = r.getTrack().property;
      for (const { target: c, value: l, start: o } of r.getTargetValues(t)) {
        const u = `${c}\0${a}`, f = o <= t, h = i.get(u);
        (!h || (f !== h.started ? f : f ? o >= h.start : o <= h.start)) && i.set(u, { trackId: s, target: c, property: a, value: l, start: o, started: f });
      }
    }
    for (const { trackId: s, target: r, property: a, value: c, start: l } of i.values())
      this._write(n, s, r, a, c, t - l);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(t, n, i, s, r, a) {
    if (r === void 0) return;
    let c = t.get(i);
    c || (c = /* @__PURE__ */ new Map(), t.set(i, c));
    const l = this._textTracks.get(n);
    if (l && typeof r == "number") {
      c.set("text", di(l.textConfig, r, Math.max(0, a)));
      return;
    }
    const o = this._motionPathTracks.get(n);
    if (o && typeof r == "number") {
      const u = je(o.motionPathConfig, r);
      c.set("motionPathX", u.x), c.set("motionPathY", u.y), o.motionPathConfig.autoRotate && c.set("motionPathRotate", u.angle);
    } else
      c.set(s, r);
  }
  /** Cached: does any target+property have more than one track? */
  _sharedWrites = null;
  _hasSharedWrites() {
    if (this._sharedWrites === null) {
      const t = /* @__PURE__ */ new Set();
      this._sharedWrites = !1;
      t: for (const n of this._tracks)
        for (const i of V(n)) {
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
    if (this._tracks.push(t), this._sharedWrites = null, W(t)) {
      this._trackPlayers.set(t.id, new li(t));
      return;
    }
    if (z(t)) {
      this._trackPlayers.set(t.id, new ci(t)), this._springTracks.set(t.id, t);
      return;
    }
    if (ct(t))
      this._trackPlayers.set(t.id, new Ct(t)), this._textTracks.set(t.id, t);
    else if (Be(t)) {
      const n = {
        id: t.id,
        target: t.target,
        property: t.property,
        keyframes: t.keyframes,
        delay: t.delay,
        targets: t.targets,
        stagger: t.stagger
      };
      this._trackPlayers.set(t.id, new Ct(n)), this._motionPathTracks.set(t.id, t);
    } else
      this._trackPlayers.set(t.id, new Ct(t));
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
    if (z(i) || W(i))
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
          const a = this._tracks[r];
          if (a.property !== i.property) continue;
          const c = V(a).filter((f) => V(i).includes(f));
          if (c.length === 0) continue;
          const l = this.getTrackSpan(a.id);
          if (!l || !(l.from <= s.to && s.from <= l.to)) continue;
          const u = s.from >= l.from;
          for (const f of c)
            t.push({
              target: f,
              property: i.property,
              losingTrackId: u ? a.id : i.id,
              winningTrackId: u ? i.id : a.id
            });
        }
    }
    return t;
  }
  _matches(t, n) {
    if (n.id !== void 0 && t.id !== n.id || n.property !== void 0 && t.property !== n.property || n.target !== void 0 && !V(t).includes(n.target)) return !1;
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
function pi(e) {
  return W(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "inertia",
    inertia: Ze(e.inertia),
    ...O(e)
  } : z(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "spring",
    spring: { ...e.spring },
    ...O(e)
  } : ct(e) ? {
    id: e.id,
    target: e.target,
    property: "text",
    textConfig: { ...e.textConfig },
    keyframes: e.keyframes.map(Bt),
    ...O(e)
  } : Be(e) ? {
    id: e.id,
    target: e.target,
    property: "motionPath",
    motionPathConfig: { ...e.motionPathConfig },
    keyframes: e.keyframes.map(Bt),
    ...O(e)
  } : {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes.map(Bt),
    ...O(e)
  };
}
function Ze(e) {
  return { ...e, ...Array.isArray(e.end) && { end: [...e.end] } };
}
function Bt(e) {
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
function mi(e) {
  if (W(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "inertia",
      inertia: Ze(t.inertia),
      ...O(t)
    };
  }
  if (z(e)) {
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
  if (ct(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: "text",
      textConfig: { ...t.textConfig },
      keyframes: [...t.keyframes].sort((n, i) => n.time - i.time),
      ...O(t)
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
      ...O(t)
    };
  }
  return Nt({
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes,
    ...O(e)
  });
}
function gi(e) {
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
    tracks: e.tracks.map(pi)
  };
}
function rt(e) {
  return new Ke({
    id: e.id,
    name: e.name,
    config: e.config,
    tracks: e.tracks.map(mi)
  });
}
function gr(e) {
  return JSON.stringify(gi(e));
}
function yr(e) {
  const t = JSON.parse(e);
  return rt(t);
}
const yi = {
  linear: "linear",
  "ease-in": "ease-in",
  "ease-out": "ease-out",
  "ease-in-out": "ease-in-out",
  "ease-in-quad": "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
  "ease-out-quad": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  "ease-in-out-quad": "cubic-bezier(0.455, 0.03, 0.515, 0.955)",
  "ease-in-cubic": "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
  "ease-out-cubic": "cubic-bezier(0.215, 0.61, 0.355, 1)",
  "ease-in-out-cubic": "cubic-bezier(0.645, 0.045, 0.355, 1)"
};
function bi(e) {
  if (Wt(e)) {
    const [t, n, i, s] = e.points;
    return `cubic-bezier(${t}, ${n}, ${i}, ${s})`;
  }
  return yi[e];
}
const Ti = {
  x: "left",
  y: "top",
  width: "width",
  height: "height",
  opacity: "opacity",
  rotate: "rotate",
  scale: "scale",
  scaleX: "scaleX",
  scaleY: "scaleY",
  fill: "background-color",
  stroke: "border-color",
  strokeWidth: "border-width",
  borderRadius: "border-radius",
  fontSize: "font-size"
}, wi = /* @__PURE__ */ new Set(["x", "y", "rotate", "scale", "scaleX", "scaleY"]);
function vi(e, t) {
  return typeof t == "number" ? e === "opacity" || e === "scale" || e === "scaleX" || e === "scaleY" ? String(t) : e === "rotate" ? `${t}deg` : `${t}px` : String(t);
}
function xi(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) {
    const i = t.get(n.target) ?? [];
    i.push(n), t.set(n.target, i);
  }
  return t;
}
function Mi(e, t) {
  const n = /* @__PURE__ */ new Set();
  for (const i of e)
    for (const s of i.keyframes)
      n.add(s.time);
  return n.add(0), n.add(t), Array.from(n).sort((i, s) => i - s);
}
function Si(e, t) {
  const n = e.keyframes;
  if (n.length === 0) return null;
  let i = null, s = null;
  for (const r of n)
    r.time <= t && (i = r), r.time >= t && !s && (s = r);
  return i && i.time === t ? i.value : s && s.time === t ? s.value : i && !s ? i.value : !i && s ? s.value : i?.value ?? null;
}
function Ai(e) {
  return wi.has(e);
}
function ki(e, t, n, i) {
  const s = { ...Ti, ...i.propertyMap }, r = Mi(t, n), a = [], c = i.minify ? "" : "  ", l = i.minify ? "" : `
`, o = i.minify ? "" : " ";
  a.push(`@keyframes ${e}${o}{`);
  for (const u of r) {
    const f = n > 0 ? Math.round(u / n * 100) : 0, h = [], d = [];
    for (const m of t) {
      const p = Si(m, u);
      if (p === null) continue;
      const g = s[m.property] ?? m.property, y = vi(m.property, p);
      if (Ai(m.property))
        switch (m.property) {
          case "x":
            d.push(`translateX(${y})`);
            break;
          case "y":
            d.push(`translateY(${y})`);
            break;
          case "rotate":
            d.push(`rotate(${y})`);
            break;
          case "scale":
            d.push(`scale(${p})`);
            break;
          case "scaleX":
            d.push(`scaleX(${p})`);
            break;
          case "scaleY":
            d.push(`scaleY(${p})`);
            break;
        }
      else
        h.push(`${g}:${o}${y}`);
    }
    d.length > 0 && h.push(`transform:${o}${d.join(" ")}`), h.length > 0 && a.push(`${c}${f}%${o}{${o}${h.join(`;${o}`)}${o}}`);
  }
  return a.push("}"), a.join(l);
}
function Ei(e) {
  const t = /* @__PURE__ */ new Map();
  for (const s of e)
    for (const r of s.keyframes) {
      const a = r.easing ?? "linear";
      t.set(a, (t.get(a) ?? 0) + 1);
    }
  let n = 0, i = "linear";
  for (const [s, r] of t)
    r > n && (n = r, i = s);
  return i;
}
function Pi(e, t, n, i, s) {
  const r = s.minify ? "" : " ", a = (t / 1e3).toFixed(2), c = bi(Ei(n)), l = i.loop === -1 ? "infinite" : i.loop ? i.loop + 1 : 1, o = i.alternate ? "alternate" : "normal";
  return `animation:${r}${e} ${a}s ${c} ${l} ${o}`;
}
function br(e, t = {}) {
  const {
    classPrefix: n = "tinyfly",
    includeKeyframes: i = !0,
    includeAnimation: s = !0,
    minify: r = !1
  } = t, a = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = [], o = r ? "" : `
`, u = r ? "" : " ", f = e.duration, h = {
    loop: e._config.loop,
    alternate: e._config.alternate
  }, d = xi(Ge(e.tracks).filter((m) => !ct(m)));
  for (const [m, p] of d) {
    const g = `${n}-${m.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (i) {
      const y = ki(g, p, f, t);
      a.set(g, y), l.push(y);
    }
    if (s) {
      const y = Pi(g, f, p, h, t), T = `${`.${n}-${m.replace(/[^a-zA-Z0-9]/g, "-")}`}${u}{${o}${r ? "" : "  "}${y};${o}}`;
      c.set(m, T), l.push(T);
    }
  }
  return {
    css: l.join(o + o),
    keyframes: a,
    selectors: c
  };
}
function Qe(e) {
  const t = {
    i: { x: [0.833], y: [0.833] },
    o: { x: [0.167], y: [0.167] }
  };
  if (Wt(e)) {
    const [i, s, r, a] = e.points;
    return {
      i: { x: [i], y: [s] },
      o: { x: [r], y: [a] }
    };
  }
  return {
    linear: t,
    "ease-in": {
      i: { x: [0.42], y: [0] },
      o: { x: [1], y: [1] }
    },
    "ease-out": {
      i: { x: [0], y: [0] },
      o: { x: [0.58], y: [1] }
    },
    "ease-in-out": {
      i: { x: [0.42], y: [0] },
      o: { x: [0.58], y: [1] }
    },
    "ease-in-quad": {
      i: { x: [0.55], y: [0.085] },
      o: { x: [0.68], y: [0.53] }
    },
    "ease-out-quad": {
      i: { x: [0.25], y: [0.46] },
      o: { x: [0.45], y: [0.94] }
    },
    "ease-in-out-quad": {
      i: { x: [0.455], y: [0.03] },
      o: { x: [0.515], y: [0.955] }
    },
    "ease-in-cubic": {
      i: { x: [0.55], y: [0.055] },
      o: { x: [0.675], y: [0.19] }
    },
    "ease-out-cubic": {
      i: { x: [0.215], y: [0.61] },
      o: { x: [0.355], y: [1] }
    },
    "ease-in-out-cubic": {
      i: { x: [0.645], y: [0.045] },
      o: { x: [0.355], y: [1] }
    }
  }[e] ?? t;
}
function zt(e, t) {
  return Math.round(e / 1e3 * t);
}
function _i(e) {
  if (e.startsWith("#")) {
    const t = e.slice(1);
    if (t.length === 3) {
      const n = parseInt(t[0] + t[0], 16) / 255, i = parseInt(t[1] + t[1], 16) / 255, s = parseInt(t[2] + t[2], 16) / 255;
      return [n, i, s];
    }
    if (t.length === 6) {
      const n = parseInt(t.slice(0, 2), 16) / 255, i = parseInt(t.slice(2, 4), 16) / 255, s = parseInt(t.slice(4, 6), 16) / 255;
      return [n, i, s];
    }
  }
  return [0, 0, 0];
}
function It(e, t, n = !1) {
  if (e.length === 0)
    return n ? { a: 0, k: [0, 0] } : { a: 0, k: 0 };
  if (e.length === 1) {
    const s = e[0].value;
    return n && typeof s == "number" ? { a: 0, k: [s, s] } : { a: 0, k: s };
  }
  const i = [];
  for (let s = 0; s < e.length; s++) {
    const r = e[s], a = e[s + 1], c = zt(r.time, t), l = typeof r.value == "number" ? [r.value] : [0], o = {
      t: c,
      s: l
    };
    if (a) {
      const u = typeof a.value == "number" ? [a.value] : [0];
      o.e = u;
      const f = a.easing ?? "linear", h = Qe(f);
      o.i = h.i, o.o = h.o;
    }
    i.push(o);
  }
  return { a: 1, k: i };
}
function Ci(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) {
    const i = t.get(n.target) ?? [];
    i.push(n), t.set(n.target, i);
  }
  return t;
}
function $i(e, t) {
  const n = {
    o: { a: 0, k: 100 },
    // Default opacity
    r: { a: 0, k: 0 },
    // Default rotation
    p: { a: 0, k: [0, 0] },
    // Default position
    a: { a: 0, k: [0, 0] },
    // Default anchor
    s: { a: 0, k: [100, 100] }
    // Default scale
  };
  for (const r of e) {
    const a = r.keyframes;
    switch (r.property) {
      case "opacity":
        const c = a.map((o) => ({
          ...o,
          value: o.value * 100
        }));
        n.o = It(c, t);
        break;
      case "rotate":
      case "rotation":
        n.r = It(a, t);
        break;
      case "scale":
        const l = a.map((o) => ({
          ...o,
          value: o.value * 100
        }));
        n.s = It(l, t, !0);
        break;
    }
  }
  const i = e.find((r) => r.property === "x"), s = e.find((r) => r.property === "y");
  if (i || s) {
    const r = i?.keyframes ?? [{ time: 0, value: 0 }], a = s?.keyframes ?? [{ time: 0, value: 0 }], c = /* @__PURE__ */ new Set();
    r.forEach((o) => c.add(o.time)), a.forEach((o) => c.add(o.time));
    const l = Array.from(c).sort((o, u) => o - u);
    if (l.length === 1) {
      const o = r[0]?.value ?? 0, u = a[0]?.value ?? 0;
      n.p = { a: 0, k: [o, u] };
    } else {
      const o = [];
      for (let u = 0; u < l.length; u++) {
        const f = l[u], h = l[u + 1], d = yt(r, f), m = yt(a, f), p = {
          t: zt(f, t),
          s: [d, m]
        };
        if (h !== void 0) {
          const g = yt(r, h), y = yt(a, h);
          p.e = [g, y];
          const T = r.find((b) => b.time === h)?.easing ?? "linear", w = Qe(T);
          p.i = w.i, p.o = w.o;
        }
        o.push(p);
      }
      n.p = { a: 1, k: o };
    }
  }
  return n;
}
function yt(e, t) {
  if (e.length === 0) return 0;
  let n = e[0], i = e[e.length - 1];
  for (const r of e)
    if (r.time <= t && (n = r), r.time >= t) {
      i = r;
      break;
    }
  if (n.time === t) return n.value;
  if (i.time === t) return i.value;
  const s = (t - n.time) / (i.time - n.time);
  return typeof n.value == "number" && typeof i.value == "number" ? n.value + (i.value - n.value) * s : n.value;
}
function Bi(e, t, n) {
  const i = _i(n);
  return [
    {
      ty: "rc",
      // Rectangle
      d: 1,
      s: { a: 0, k: [e, t] },
      p: { a: 0, k: [0, 0] },
      r: { a: 0, k: 0 }
    },
    {
      ty: "fl",
      // Fill
      c: { a: 0, k: [...i, 1] },
      o: { a: 0, k: 100 },
      r: 1
    }
  ];
}
function Ii(e, t = {}) {
  const {
    name: n = e.name || "Animation",
    frameRate: i = 60,
    width: s = 512,
    height: r = 512
  } = t, a = e.duration, c = zt(a, i), l = Ci(Ge(e.tracks).filter((f) => !ct(f))), o = [];
  let u = 1;
  for (const [f, h] of l) {
    const d = $i(h, i), p = h.find((y) => y.property === "fill")?.keyframes[0]?.value, g = {
      ddd: 0,
      ind: u++,
      ty: 4,
      // Shape layer
      nm: f,
      sr: 1,
      ks: d,
      ao: 0,
      shapes: Bi(100, 100, p ?? "#4a9eff"),
      ip: 0,
      op: c,
      st: 0,
      bm: 0
    };
    o.push(g);
  }
  return {
    v: "5.7.4",
    nm: n,
    fr: i,
    ip: 0,
    op: c,
    w: s,
    h: r,
    ddd: 0,
    assets: [],
    layers: o
  };
}
function Tr(e, t = {}) {
  return JSON.stringify(Ii(e, t));
}
const vt = 5, K = 1 << vt * 3, Lt = 8 - vt;
function Je(e, t, n) {
  return e >> Lt << vt * 2 | t >> Lt << vt | n >> Lt;
}
function Li(e, t) {
  const n = new Uint32Array(K), i = new Uint32Array(K), s = new Uint32Array(K), r = new Uint32Array(K);
  for (let u = 0; u < e.length; u += 4) {
    if (e[u + 3] < 128) continue;
    const f = e[u], h = e[u + 1], d = e[u + 2], m = Je(f, h, d);
    n[m]++, i[m] += f, s[m] += h, r[m] += d;
  }
  const a = [];
  for (let u = 0; u < K; u++) {
    const f = n[u];
    f !== 0 && a.push({
      r: Math.round(i[u] / f),
      g: Math.round(s[u] / f),
      b: Math.round(r[u] / f),
      count: f
    });
  }
  if (a.length === 0)
    return { rgb: new Uint8Array(3), size: 1 };
  if (a.length <= t) {
    const u = new Uint8Array(a.length * 3);
    return a.forEach((f, h) => {
      u[h * 3] = f.r, u[h * 3 + 1] = f.g, u[h * 3 + 2] = f.b;
    }), { rgb: u, size: a.length };
  }
  const c = (u, f) => {
    let h = 0, d = 255, m = 0, p = 255, g = 0, y = 255, v = 0;
    for (let T = u; T <= f; T++) {
      const w = a[T];
      h += w.count, w.r < d && (d = w.r), w.r > m && (m = w.r), w.g < p && (p = w.g), w.g > g && (g = w.g), w.b < y && (y = w.b), w.b > v && (v = w.b);
    }
    return { from: u, to: f, count: h, rMin: d, rMax: m, gMin: p, gMax: g, bMin: y, bMax: v };
  }, l = [c(0, a.length - 1)];
  for (; l.length < t; ) {
    let u = -1, f = 0;
    for (let b = 0; b < l.length; b++) {
      const M = l[b];
      M.to <= M.from || M.count > f && (f = M.count, u = b);
    }
    if (u === -1) break;
    const h = l[u], d = h.rMax - h.rMin, m = h.gMax - h.gMin, p = h.bMax - h.bMin, g = d >= m && d >= p ? "r" : m >= p ? "g" : "b", y = a.slice(h.from, h.to + 1);
    y.sort((b, M) => b[g] - M[g]);
    for (let b = 0; b < y.length; b++) a[h.from + b] = y[b];
    const v = h.count / 2;
    let T = 0, w = h.from;
    for (let b = h.from; b < h.to && (T += a[b].count, w = b, !(T >= v)); b++)
      ;
    l[u] = c(h.from, w), l.push(c(w + 1, h.to));
  }
  const o = new Uint8Array(l.length * 3);
  return l.forEach((u, f) => {
    let h = 0, d = 0, m = 0, p = 0;
    for (let g = u.from; g <= u.to; g++) {
      const y = a[g];
      h += y.count, d += y.r * y.count, m += y.g * y.count, p += y.b * y.count;
    }
    h === 0 && (h = 1), o[f * 3] = Math.round(d / h), o[f * 3 + 1] = Math.round(m / h), o[f * 3 + 2] = Math.round(p / h);
  }), { rgb: o, size: l.length };
}
class Fi {
  cache = new Int16Array(K).fill(-1);
  palette;
  /** Palette index `n` is written as `n + offset` (GIF reserves index 0). */
  offset;
  constructor(t, n = 0) {
    this.palette = t, this.offset = n;
  }
  /** Index of the closest palette entry to the given colour. */
  nearest(t, n, i) {
    const s = Je(t, n, i), r = this.cache[s];
    if (r !== -1) return r;
    const { rgb: a, size: c } = this.palette;
    let l = 1 / 0, o = 0;
    for (let f = 0; f < c; f++) {
      const h = t - a[f * 3], d = n - a[f * 3 + 1], m = i - a[f * 3 + 2], p = h * h + d * d + m * m;
      if (p < l && (l = p, o = f, p === 0))
        break;
    }
    const u = o + this.offset;
    return this.cache[s] = u, u;
  }
  /** The colour actually stored at a palette index produced by `nearest`. */
  colorAt(t) {
    const n = (t - this.offset) * 3;
    return [this.palette.rgb[n], this.palette.rgb[n + 1], this.palette.rgb[n + 2]];
  }
}
function Ri(e, t, n, i, s = {}) {
  const { dither: r = !0, transparentIndex: a = 0 } = s, c = new Fi(i, a + 1), l = new Uint8Array(t * n);
  let o = !1;
  if (!r) {
    for (let h = 0; h < t * n; h++) {
      const d = h * 4;
      if (e[d + 3] < 128) {
        l[h] = a, o = !0;
        continue;
      }
      l[h] = c.nearest(e[d], e[d + 1], e[d + 2]);
    }
    return { indices: l, hasTransparency: o };
  }
  const u = new Float32Array(t * n * 3);
  for (let h = 0; h < t * n; h++)
    u[h * 3] = e[h * 4], u[h * 3 + 1] = e[h * 4 + 1], u[h * 3 + 2] = e[h * 4 + 2];
  const f = (h, d, m, p, g) => {
    u[h * 3] += d * g, u[h * 3 + 1] += m * g, u[h * 3 + 2] += p * g;
  };
  for (let h = 0; h < n; h++)
    for (let d = 0; d < t; d++) {
      const m = h * t + d;
      if (e[m * 4 + 3] < 128) {
        l[m] = a, o = !0;
        continue;
      }
      const p = Math.max(0, Math.min(255, u[m * 3])), g = Math.max(0, Math.min(255, u[m * 3 + 1])), y = Math.max(0, Math.min(255, u[m * 3 + 2])), v = c.nearest(p, g, y);
      l[m] = v;
      const [T, w, b] = c.colorAt(v), M = p - T, x = g - w, P = y - b;
      d + 1 < t && f(m + 1, M, x, P, 7 / 16), h + 1 < n && (d > 0 && f(m + t - 1, M, x, P, 3 / 16), f(m + t, M, x, P, 5 / 16), d + 1 < t && f(m + t + 1, M, x, P, 1 / 16));
    }
  return { indices: l, hasTransparency: o };
}
class ot {
  buf;
  len = 0;
  constructor(t = 1024) {
    this.buf = new Uint8Array(Math.max(16, t));
  }
  /** Bytes written so far — also the offset the next write lands at. */
  get length() {
    return this.len;
  }
  ensure(t) {
    if (this.len + t <= this.buf.length) return;
    let n = this.buf.length * 2;
    for (; n < this.len + t; ) n *= 2;
    const i = new Uint8Array(n);
    i.set(this.buf.subarray(0, this.len)), this.buf = i;
  }
  byte(t) {
    this.ensure(1), this.buf[this.len++] = t & 255;
  }
  bytes(t) {
    this.ensure(t.length), this.buf.set(t, this.len), this.len += t.length;
  }
  /** Each character's low byte, e.g. a FourCC or an MP4 box type. */
  ascii(t) {
    this.ensure(t.length);
    for (let n = 0; n < t.length; n++) this.buf[this.len++] = t.charCodeAt(n) & 255;
  }
  uint16LE(t) {
    this.byte(t), this.byte(t >> 8);
  }
  uint24LE(t) {
    this.byte(t), this.byte(t >> 8), this.byte(t >> 16);
  }
  uint32LE(t) {
    this.byte(t), this.byte(t >> 8), this.byte(t >> 16), this.byte(t >> 24);
  }
  uint16BE(t) {
    this.byte(t >> 8), this.byte(t);
  }
  uint24BE(t) {
    this.byte(t >> 16), this.byte(t >> 8), this.byte(t);
  }
  uint32BE(t) {
    this.byte(t >> 24), this.byte(t >> 16), this.byte(t >> 8), this.byte(t);
  }
  /** 64-bit big-endian, written as two 32-bit halves (safe up to 2^53). */
  uint64BE(t) {
    this.uint32BE(Math.floor(t / 2 ** 32)), this.uint32BE(t >>> 0);
  }
  /** Overwrite a previously written 32-bit big-endian value, e.g. a box size. */
  patchUint32BE(t, n) {
    this.buf[t] = n >>> 24 & 255, this.buf[t + 1] = n >>> 16 & 255, this.buf[t + 2] = n >>> 8 & 255, this.buf[t + 3] = n & 255;
  }
  /** Overwrite a previously written 32-bit little-endian value. */
  patchUint32LE(t, n) {
    this.buf[t] = n & 255, this.buf[t + 1] = n >>> 8 & 255, this.buf[t + 2] = n >>> 16 & 255, this.buf[t + 3] = n >>> 24 & 255;
  }
  /** A view over the written bytes. Not a copy — do not retain across writes. */
  toUint8Array() {
    return this.buf.subarray(0, this.len);
  }
  /** A standalone copy of the written bytes, safe to hand to a Blob. */
  toBytes() {
    return this.buf.slice(0, this.len);
  }
}
function Di(e, t) {
  const n = 1 << t, i = n + 1, s = new ot(), r = new Uint8Array(255);
  let a = 0, c = 0, l = 0;
  const o = () => {
    a !== 0 && (s.byte(a), s.bytes(r.subarray(0, a)), a = 0);
  }, u = (p, g) => {
    for (c |= p << l, l += g; l >= 8; )
      r[a++] = c & 255, c >>= 8, l -= 8, a === 255 && o();
  };
  let f = /* @__PURE__ */ new Map();
  const h = () => {
    f = /* @__PURE__ */ new Map();
  };
  let d = t + 1, m = i + 1;
  if (u(n, d), e.length > 0) {
    let p = e[0];
    for (let g = 1; g < e.length; g++) {
      const y = e[g], v = p << 8 | y, T = f.get(v);
      if (T !== void 0) {
        p = T;
        continue;
      }
      u(p, d), m < 4096 ? (f.set(v, m++), m >= 1 << d && d < 12 && d++) : (u(n, d), h(), d = t + 1, m = i + 1), p = y;
    }
    u(p, d);
  }
  return u(i, d), l > 0 && (r[a++] = c & 255), o(), s.byte(0), s.toUint8Array();
}
class tn {
  width;
  height;
  loops;
  dither;
  maxColors;
  /** Fully-encoded blocks (GCE + descriptor + palette + data) per frame. */
  frames = [];
  constructor(t, n, i = 0) {
    this.width = t, this.height = n;
    const s = typeof i == "number" ? { loops: i } : i;
    this.loops = s.loops ?? 0, this.dither = s.dither ?? !0, this.maxColors = Math.max(2, Math.min(255, s.maxColors ?? 255));
  }
  /** Number of frames added so far. */
  get frameCount() {
    return this.frames.length;
  }
  /**
   * Quantize and compress one frame.
   *
   * @param delay Frame delay in centiseconds (1/100s), as GIF stores it.
   */
  addFrame(t, n) {
    const { data: i } = t, s = t.width || this.width, r = t.height || this.height, a = Li(i, this.maxColors), { indices: c, hasTransparency: l } = Ri(i, s, r, a, {
      dither: this.dither,
      transparentIndex: 0
    }), o = new ot(), u = l ? 2 : 1;
    o.bytes([33, 249, 4]), o.byte(u << 2 | (l ? 1 : 0)), o.uint16LE(Math.max(0, Math.round(n))), o.byte(0), o.byte(0), o.byte(44), o.uint16LE(0), o.uint16LE(0), o.uint16LE(s), o.uint16LE(r), o.byte(135);
    const f = new Uint8Array(256 * 3);
    f.set(a.rgb.subarray(0, Math.min(a.size, 255) * 3), 3), o.bytes(f), o.byte(8), o.bytes(Di(c, 8)), this.frames.push(o.toUint8Array());
  }
  /** Assemble the full GIF byte stream. */
  encodeToBytes() {
    const t = new ot();
    t.bytes([71, 73, 70, 56, 57, 97]), t.uint16LE(this.width), t.uint16LE(this.height), t.byte(112), t.byte(0), t.byte(0), t.bytes([33, 255, 11]), t.bytes([78, 69, 84, 83, 67, 65, 80, 69]), t.bytes([50, 46, 48]), t.bytes([3, 1]), t.uint16LE(this.loops), t.byte(0);
    for (const n of this.frames) t.bytes(n);
    return t.byte(59), t.toUint8Array();
  }
  /** Encode and return the GIF as a Blob. */
  encode() {
    const t = this.encodeToBytes();
    return new Blob([t.slice()], { type: "image/gif" });
  }
}
const wr = tn;
function vr(e, t) {
  const { width: n, height: i, frameRate: s = 30, backgroundColor: r, renderFrame: a } = t, c = document.createElement("canvas");
  c.width = n, c.height = i;
  const l = c.getContext("2d");
  if (!l)
    throw new Error("Failed to get canvas 2D context");
  const o = e.duration, u = 1e3 / s, f = Math.ceil(o / u), h = [];
  for (let d = 0; d <= f; d++) {
    const m = Math.min(d * u, o);
    l.clearRect(0, 0, n, i), r && (l.fillStyle = r, l.fillRect(0, 0, n, i));
    const p = e.getStateAtTime(m);
    a?.(l, p.values, m), h.push({
      time: m,
      imageData: l.getImageData(0, 0, n, i),
      delay: Math.round(u / 10)
    });
  }
  return { frames: h, duration: o, frameCount: h.length };
}
async function xr(e, t) {
  const {
    width: n,
    height: i,
    frameRate: s = 30,
    loops: r = 0,
    backgroundColor: a,
    renderFrame: c,
    dither: l,
    maxColors: o,
    onProgress: u,
    signal: f
  } = t;
  if (typeof document > "u")
    throw new Error("GIF export requires a DOM environment");
  if (!c)
    throw new Error("renderFrame function is required for GIF export");
  const h = document.createElement("canvas");
  h.width = n, h.height = i;
  const d = h.getContext("2d", { willReadFrequently: !0 });
  if (!d)
    throw new Error("Failed to get canvas 2D context");
  const m = new tn(n, i, { loops: r, dither: l, maxColors: o }), p = e.duration, g = 1e3 / s, y = Math.max(1, Math.round(p / g)), v = Math.max(2, Math.round(g / 10));
  for (let T = 0; T < y; T++) {
    if (f?.aborted) throw new Error("Export aborted");
    const w = Math.min(T * g, p);
    d.clearRect(0, 0, n, i), a && (d.fillStyle = a, d.fillRect(0, 0, n, i));
    const b = e.getStateAtTime(w);
    await c(d, b.values, w), m.addFrame(d.getImageData(0, 0, n, i), v), u?.((T + 1) / y);
  }
  return m.encode();
}
function Mr(e, t = "animation.gif") {
  const n = URL.createObjectURL(e), i = document.createElement("a");
  i.href = n, i.download = t, document.body.appendChild(i), i.click(), document.body.removeChild(i), URL.revokeObjectURL(n);
}
const Vt = (e) => e + e % 2, en = 16, Xi = 2;
function Ft(e, t) {
  return String.fromCharCode(e[t], e[t + 1], e[t + 2], e[t + 3]);
}
function pe(e, t) {
  return (e[t] | e[t + 1] << 8 | e[t + 2] << 16 | e[t + 3] << 24) >>> 0;
}
function Oi(e) {
  if (e.length < 12 || Ft(e, 0) !== "RIFF" || Ft(e, 8) !== "WEBP")
    throw new Error("Not a WebP file — the browser may not support canvas WebP encoding");
  let t = null, n = null, i = 0, s = 0, r = !1, a = 12;
  for (; a + 8 <= e.length; ) {
    const c = Ft(e, a), l = pe(e, a + 4), o = e.subarray(a + 8, a + 8 + l), u = e.subarray(a, a + 8 + l);
    if (c === "VP8X")
      r = (o[0] & en) !== 0, i = (o[4] | o[5] << 8 | o[6] << 16) + 1, s = (o[7] | o[8] << 8 | o[9] << 16) + 1;
    else if (c === "ALPH")
      n = u, r = !0;
    else if (c === "VP8 ")
      t = u, !i && o.length >= 10 && (i = (o[6] | o[7] << 8) & 16383 || i, s = (o[8] | o[9] << 8) & 16383 || s);
    else if (c === "VP8L" && (t = u, !i && o.length >= 5)) {
      const f = pe(o, 1);
      i = (f & 16383) + 1, s = (f >> 14 & 16383) + 1, r = r || (f >> 28 & 1) === 1;
    }
    a += 8 + Vt(l);
  }
  if (!t) throw new Error("WebP file contained no VP8 or VP8L image data");
  return { image: t, alpha: n, width: i, height: s, hasAlpha: r };
}
class Yi {
  loops;
  background;
  frames = [];
  hasAlpha = !1;
  width;
  height;
  constructor(t, n, i = {}) {
    this.width = t, this.height = n, this.loops = i.loops ?? 0, this.background = i.background ?? [0, 0, 0, 0];
  }
  get frameCount() {
    return this.frames.length;
  }
  /**
   * Add one frame from the bytes of a still WebP image.
   *
   * @param durationMs How long the frame is shown, in milliseconds.
   */
  addFrame(t, n) {
    const i = Oi(t);
    i.hasAlpha && (this.hasAlpha = !0), this.frames.push({ bitstream: i, durationMs: n });
  }
  /** Assemble the animated WebP byte stream. */
  encodeToBytes() {
    if (this.frames.length === 0)
      throw new Error("Cannot encode an animated WebP with no frames");
    const t = new ot();
    t.ascii("RIFF");
    const n = t.length;
    t.uint32LE(0), t.ascii("WEBP"), t.ascii("VP8X"), t.uint32LE(10), t.byte(Xi | (this.hasAlpha ? en : 0)), t.uint24LE(0), t.uint24LE(this.width - 1), t.uint24LE(this.height - 1);
    const [i, s, r, a] = this.background;
    t.ascii("ANIM"), t.uint32LE(6), t.bytes([r, s, i, a]), t.uint16LE(this.loops);
    for (const { bitstream: c, durationMs: l } of this.frames) {
      const o = 16 + Vt(c.alpha ? c.alpha.length : 0) + Vt(c.image.length);
      t.ascii("ANMF"), t.uint32LE(o), t.uint24LE(0), t.uint24LE(0), t.uint24LE(this.width - 1), t.uint24LE(this.height - 1), t.uint24LE(Math.max(0, Math.round(l))), t.byte(3), c.alpha && (t.bytes(c.alpha), c.alpha.length % 2 && t.byte(0)), t.bytes(c.image), c.image.length % 2 && t.byte(0);
    }
    return t.patchUint32LE(n, t.length - n - 4), t.toUint8Array();
  }
  /** Encode and return the animated WebP as a Blob. */
  encode() {
    return new Blob([this.encodeToBytes().slice()], { type: "image/webp" });
  }
}
function qi() {
  if (typeof document > "u") return !1;
  try {
    const e = document.createElement("canvas");
    return e.width = 1, e.height = 1, e.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return !1;
  }
}
function Ni(e, t) {
  return new Promise((n, i) => {
    e.toBlob(
      (s) => {
        if (!s) return i(new Error("Canvas WebP encoding failed"));
        if (s.type !== "image/webp")
          return i(new Error("This browser cannot encode WebP from a canvas"));
        s.arrayBuffer().then((r) => n(new Uint8Array(r))).catch(i);
      },
      "image/webp",
      t
    );
  });
}
async function Sr(e, t) {
  const {
    width: n,
    height: i,
    frameRate: s = 30,
    loops: r = 0,
    quality: a = 0.8,
    backgroundColor: c,
    renderFrame: l,
    onProgress: o,
    signal: u
  } = t;
  if (typeof document > "u")
    throw new Error("WebP export requires a DOM environment");
  if (!qi())
    throw new Error("This browser cannot encode WebP from a canvas. Try Chrome, Edge, or Firefox.");
  const f = document.createElement("canvas");
  f.width = n, f.height = i;
  const h = f.getContext("2d");
  if (!h) throw new Error("Failed to get canvas 2D context");
  const d = new Yi(n, i, { loops: r }), m = e.duration, p = 1e3 / s, g = Math.max(1, Math.round(m / p));
  for (let y = 0; y < g; y++) {
    if (u?.aborted) throw new Error("Export aborted");
    const v = Math.min(y * p, m);
    h.clearRect(0, 0, n, i), c && (h.fillStyle = c, h.fillRect(0, 0, n, i));
    const T = e.getStateAtTime(v);
    await l(h, T.values, v), d.addFrame(await Ni(f, a), Math.round(p)), o?.((y + 1) / g);
  }
  return d.encode();
}
function Ar(e, t = "animation.webp") {
  const n = URL.createObjectURL(e), i = document.createElement("a");
  i.href = n, i.download = t, document.body.appendChild(i), i.click(), i.remove(), setTimeout(() => URL.revokeObjectURL(n), 1e3);
}
const Rt = (e) => Math.round(e * 65536), me = [65536, 0, 0, 0, 65536, 0, 0, 0, 1073741824];
function X(e, t, n) {
  const i = e.length;
  e.uint32BE(0), e.ascii(t), n(), e.patchUint32BE(i, e.length - i);
}
function L(e, t, n, i, s) {
  X(e, t, () => {
    e.byte(n), e.uint24BE(i), s();
  });
}
function Vi(e, t) {
  const { width: n, height: i, timescale: s, avcC: r } = t;
  if (e.length === 0)
    throw new Error("Cannot mux an MP4 with no samples");
  const a = e.reduce((d, m) => d + m.duration, 0), c = 1e3, l = Math.round(a / s * c), o = new ot(64 * 1024);
  X(o, "ftyp", () => {
    o.ascii("isom"), o.uint32BE(512), o.ascii("isom"), o.ascii("iso2"), o.ascii("avc1"), o.ascii("mp41");
  });
  const u = o.length;
  o.uint32BE(0), o.ascii("mdat");
  const f = o.length;
  for (const d of e) o.bytes(d.data);
  const h = o.length - u;
  if (h > 4294967295)
    throw new Error("Exported video exceeds the 4GB limit of a 32-bit mdat box");
  return o.patchUint32BE(u, h), X(o, "moov", () => {
    L(o, "mvhd", 0, 0, () => {
      o.uint32BE(0), o.uint32BE(0), o.uint32BE(c), o.uint32BE(l), o.uint32BE(Rt(1)), o.uint16BE(256), o.uint16BE(0), o.uint32BE(0), o.uint32BE(0);
      for (const d of me) o.uint32BE(d);
      for (let d = 0; d < 6; d++) o.uint32BE(0);
      o.uint32BE(2);
    }), X(o, "trak", () => {
      L(o, "tkhd", 0, 3, () => {
        o.uint32BE(0), o.uint32BE(0), o.uint32BE(1), o.uint32BE(0), o.uint32BE(l), o.uint32BE(0), o.uint32BE(0), o.uint16BE(0), o.uint16BE(0), o.uint16BE(0), o.uint16BE(0);
        for (const d of me) o.uint32BE(d);
        o.uint32BE(Rt(n)), o.uint32BE(Rt(i));
      }), X(o, "mdia", () => {
        L(o, "mdhd", 0, 0, () => {
          o.uint32BE(0), o.uint32BE(0), o.uint32BE(s), o.uint32BE(a), o.uint16BE(21956), o.uint16BE(0);
        }), L(o, "hdlr", 0, 0, () => {
          o.uint32BE(0), o.ascii("vide"), o.uint32BE(0), o.uint32BE(0), o.uint32BE(0), o.ascii("VideoHandler"), o.byte(0);
        }), X(o, "minf", () => {
          L(o, "vmhd", 0, 1, () => {
            o.uint16BE(0), o.uint16BE(0), o.uint16BE(0), o.uint16BE(0);
          }), X(o, "dinf", () => {
            L(o, "dref", 0, 0, () => {
              o.uint32BE(1), L(o, "url ", 0, 1, () => {
              });
            });
          }), X(o, "stbl", () => {
            L(o, "stsd", 0, 0, () => {
              o.uint32BE(1), X(o, "avc1", () => {
                o.uint32BE(0), o.uint16BE(0), o.uint16BE(1), o.uint16BE(0), o.uint16BE(0), o.uint32BE(0), o.uint32BE(0), o.uint32BE(0), o.uint16BE(n), o.uint16BE(i), o.uint32BE(4718592), o.uint32BE(4718592), o.uint32BE(0), o.uint16BE(1), o.byte(0);
                for (let p = 0; p < 31; p++) o.byte(0);
                o.uint16BE(24), o.uint16BE(65535), X(o, "avcC", () => {
                  o.bytes(r);
                });
              });
            });
            const d = [];
            for (const p of e) {
              const g = d[d.length - 1];
              g && g.delta === p.duration ? g.count++ : d.push({ count: 1, delta: p.duration });
            }
            L(o, "stts", 0, 0, () => {
              o.uint32BE(d.length);
              for (const p of d)
                o.uint32BE(p.count), o.uint32BE(p.delta);
            });
            const m = [];
            e.forEach((p, g) => {
              p.isKeyFrame && m.push(g + 1);
            }), m.length !== e.length && L(o, "stss", 0, 0, () => {
              o.uint32BE(m.length);
              for (const p of m) o.uint32BE(p);
            }), L(o, "stsc", 0, 0, () => {
              o.uint32BE(1), o.uint32BE(1), o.uint32BE(e.length), o.uint32BE(1);
            }), L(o, "stsz", 0, 0, () => {
              o.uint32BE(0), o.uint32BE(e.length);
              for (const p of e) o.uint32BE(p.data.length);
            }), L(o, "stco", 0, 0, () => {
              o.uint32BE(1), o.uint32BE(f);
            });
          });
        });
      });
    });
  }), o.toBytes();
}
const Ui = [
  "avc1.42001f",
  // Baseline 3.1
  "avc1.4d0028",
  // Main 4.0
  "avc1.640028",
  // High 4.0
  "avc1.42E01E"
  // Constrained Baseline 3.0
];
function at() {
  return typeof VideoEncoder < "u" && typeof VideoFrame < "u";
}
async function Wi(e, t, n, i) {
  if (!at()) return null;
  for (const s of Ui)
    try {
      if ((await VideoEncoder.isConfigSupported({
        codec: s,
        width: e,
        height: t,
        framerate: n,
        bitrate: i,
        avc: { format: "avc" }
      })).supported) return s;
    } catch {
    }
  return null;
}
async function zi(e) {
  const { durationMs: t, renderFrame: n, onProgress: i, signal: s } = e, r = e.fps ?? 30;
  if (typeof document > "u")
    throw new Error("MP4 export requires a DOM environment");
  if (!at())
    throw new Error("This browser has no WebCodecs VideoEncoder");
  const a = Math.max(2, Math.round(e.width / 2) * 2), c = Math.max(2, Math.round(e.height / 2) * 2), l = e.bitrate ?? Math.round(a * c * r * (e.bitsPerPixel ?? 0.25)), o = await Wi(a, c, r, l);
  if (!o)
    throw new Error("This browser cannot encode H.264 at the requested size");
  const u = document.createElement("canvas");
  u.width = a, u.height = c;
  const f = u.getContext("2d");
  if (!f) throw new Error("Failed to get canvas 2D context");
  const h = [];
  let d = null, m = null;
  const p = r * 1e3, g = 1e3, y = new VideoEncoder({
    output: (x, P) => {
      const A = P?.decoderConfig?.description;
      A && !d && (d = ArrayBuffer.isView(A) ? new Uint8Array(A.buffer, A.byteOffset, A.byteLength).slice() : new Uint8Array(A).slice());
      const S = new Uint8Array(x.byteLength);
      x.copyTo(S), h.push({
        data: S,
        duration: g,
        isKeyFrame: x.type === "key"
      });
    },
    error: (x) => {
      m = x instanceof Error ? x : new Error(String(x));
    }
  });
  y.configure({
    codec: o,
    width: a,
    height: c,
    framerate: r,
    bitrate: l,
    // 'avc' gives length-prefixed samples that match the avcC record; the
    // alternative, Annex-B, is not what an MP4 sample table expects.
    avc: { format: "avc" },
    // We are not streaming, so let the encoder spend time on quality.
    latencyMode: "quality"
  });
  const v = 1e6 / r, T = Math.max(1, Math.round(t / (1e3 / r))), w = e.keyFrameInterval ?? Math.max(1, Math.round(r * 2)), b = e.background === void 0 ? "#ffffff" : e.background;
  try {
    for (let x = 0; x < T; x++) {
      if (s?.aborted) throw new Error("Export aborted");
      if (m) throw m;
      const P = Math.min(t, x * (1e3 / r));
      f.clearRect(0, 0, a, c), b && (f.fillStyle = b, f.fillRect(0, 0, a, c)), await n(f, P);
      const A = new VideoFrame(u, {
        timestamp: Math.round(x * v),
        duration: Math.round(v)
      });
      for (y.encode(A, { keyFrame: x % w === 0 }), A.close(); y.encodeQueueSize > 8; )
        if (await new Promise((S) => setTimeout(S, 0)), m) throw m;
      i?.((x + 1) / T);
    }
    if (await y.flush(), m) throw m;
  } finally {
    y.state !== "closed" && y.close();
  }
  if (!d)
    throw new Error("Encoder produced no H.264 decoder configuration");
  const M = Vi(h, { width: a, height: c, timescale: p, avcC: d });
  return new Blob([M], { type: "video/mp4" });
}
const Hi = [
  { mimeType: "video/mp4;codecs=avc1.42E01E", extension: "mp4", label: "MP4 (H.264)" },
  { mimeType: "video/mp4", extension: "mp4", label: "MP4" },
  { mimeType: "video/webm;codecs=vp9", extension: "webm", label: "WebM (VP9)" },
  { mimeType: "video/webm;codecs=vp8", extension: "webm", label: "WebM (VP8)" },
  { mimeType: "video/webm", extension: "webm", label: "WebM" }
];
function Ht() {
  return typeof MediaRecorder > "u" || typeof MediaRecorder.isTypeSupported != "function" ? [] : Hi.filter((e) => MediaRecorder.isTypeSupported(e.mimeType));
}
function kr() {
  return typeof document > "u" ? !1 : at() || Ht().length > 0;
}
const nn = "mp4-webcodecs";
function Gi() {
  const e = [];
  at() && e.push({
    id: nn,
    label: "MP4 (H.264)",
    extension: "mp4",
    deterministic: !0
  });
  for (const t of Ht())
    t.extension === "mp4" && at() || e.push({
      id: t.mimeType,
      label: `${t.label} (real-time)`,
      extension: t.extension,
      deterministic: !1
    });
  return e;
}
async function ji(e) {
  const { width: t, height: n, durationMs: i, renderFrame: s } = e, r = e.fps ?? 30;
  if (typeof document > "u")
    throw new Error("Video export requires a DOM environment");
  const a = Ht(), c = e.mimeType ?? a[0]?.mimeType;
  if (!c)
    throw new Error("This browser cannot record video (MediaRecorder unavailable)");
  const l = document.createElement("canvas");
  l.width = t, l.height = n;
  const o = l.getContext("2d");
  if (!o) throw new Error("Failed to get canvas 2D context");
  const u = l.captureStream(0), f = u.getVideoTracks()[0], h = e.bitrate ?? Math.round(t * n * r * 0.25), d = new MediaRecorder(u, { mimeType: c, videoBitsPerSecond: h }), m = [];
  d.ondataavailable = (T) => {
    T.data && T.data.size > 0 && m.push(T.data);
  };
  const p = new Promise((T, w) => {
    d.onstop = () => T(), d.onerror = () => w(new Error("Recording failed"));
  });
  d.start();
  const g = 1e3 / r, y = Math.max(1, Math.round(i / g)), v = e.background === void 0 ? "#ffffff" : e.background;
  try {
    for (let T = 0; T <= y; T++) {
      if (e.signal?.aborted) throw new Error("Export aborted");
      const w = Math.min(i, T * g);
      o.clearRect(0, 0, t, n), v && (o.fillStyle = v, o.fillRect(0, 0, t, n)), await s(o, w), f?.requestFrame?.(), e.onProgress?.(T / y), await new Promise((b) => setTimeout(b, g));
    }
  } finally {
    d.state !== "inactive" && d.stop(), u.getTracks().forEach((T) => T.stop());
  }
  return await p, new Blob(m, { type: c });
}
async function Er(e) {
  const t = Gi();
  if (t.length === 0)
    throw new Error("This browser cannot export video");
  const n = t.find((s) => s.id === e.format) ?? t[0];
  return n.id === nn ? { blob: await zi({
    width: e.width,
    height: e.height,
    fps: e.fps,
    durationMs: e.durationMs,
    background: e.background,
    bitrate: e.bitrate,
    renderFrame: e.renderFrame,
    onProgress: e.onProgress,
    signal: e.signal
  }), extension: n.extension } : { blob: await ji({ ...e, mimeType: n.id }), extension: n.extension };
}
function Pr(e, t = "animation.webm") {
  const n = URL.createObjectURL(e), i = document.createElement("a");
  i.href = n, i.download = t, document.body.appendChild(i), i.click(), i.remove(), setTimeout(() => URL.revokeObjectURL(n), 1e3);
}
function _r(e, t, n, i = 8) {
  const s = Math.max(1, Math.floor(e)), r = Math.max(1, Math.min(Math.floor(i) || 1, s)), a = Math.ceil(s / r);
  return {
    frames: s,
    columns: r,
    rows: a,
    frameWidth: t,
    frameHeight: n,
    sheetWidth: r * t,
    sheetHeight: a * n
  };
}
function Cr(e, t) {
  const n = e % t.columns, i = Math.floor(e / t.columns);
  return { index: e, col: n, row: i, x: n * t.frameWidth, y: i * t.frameHeight };
}
function $r(e, t) {
  const n = Math.max(1, Math.floor(e)), i = [];
  for (let s = 0; s < n; s++) i.push(s / n * t);
  return i;
}
function Br(e, t, n) {
  return {
    frameWidth: e.frameWidth,
    frameHeight: e.frameHeight,
    columns: e.columns,
    rows: e.rows,
    frames: e.frames,
    fps: t,
    durationMs: n
  };
}
function Ir(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++)
    t ^= e.charCodeAt(n), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function Ki(e) {
  let t = e >>> 0 || 2654435769;
  return {
    seed: e >>> 0,
    next() {
      return t ^= t << 13, t >>>= 0, t ^= t >> 17, t ^= t << 5, t >>>= 0, t / 4294967296;
    }
  };
}
function sn(e, t, n) {
  return t + e.next() * (n - t);
}
function Zi(e, t, n, i) {
  if (i <= 0) return sn(e, t, n);
  const s = Math.floor((n - t) / i), r = Math.round(e.next() * s);
  return t + r * i;
}
function Lr(e, t) {
  if (t.length !== 0)
    return t[Math.floor(e.next() * t.length)];
}
const rn = /^([+\-*/])=\s*(-?[\d.]+)$/, on = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function Fr(e) {
  return typeof e != "string" ? !1 : rn.test(e.trim()) || on.test(e.trim());
}
function an(e, t = {}) {
  if (typeof e != "string") return e;
  const n = e.trim(), i = rn.exec(n);
  if (i) {
    const [, r, a] = i, c = t.base ?? 0, l = Number.parseFloat(a);
    switch (r) {
      case "+":
        return c + l;
      case "-":
        return c - l;
      case "*":
        return c * l;
      case "/":
        return l === 0 ? c : c / l;
    }
  }
  const s = on.exec(n);
  if (s) {
    if (!t.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const r = Number.parseFloat(s[1]), a = Number.parseFloat(s[2]), c = s[3] !== void 0 ? Number.parseFloat(s[3]) : void 0;
    return c !== void 0 ? Zi(t.random, r, a, c) : sn(t.random, r, a);
  }
  return e;
}
function Qi(e, t = 0, n) {
  const i = [];
  let s = t;
  for (const r of e) {
    const a = an(r, { base: s, random: n });
    i.push(a), typeof a == "number" && (s = a);
  }
  return i;
}
class Rr {
  random;
  constructor(t) {
    this.random = Ki(t);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(t, n = 0) {
    return an(t, { base: n, random: this.random });
  }
  resolveSequence(t, n = 0) {
    return Qi(t, n, this.random);
  }
}
const D = (e) => Math.round(e * 1e3) / 1e3;
function Ji(e, t = {}) {
  if (e.length === 0) return "";
  const n = t.curviness ?? 1, i = t.closed ?? !1, s = e.length;
  let r = `M${D(e[0].x)} ${D(e[0].y)}`;
  if (s === 1) return r;
  const a = (l) => i ? e[(l % s + s) % s] : e[Math.max(0, Math.min(s - 1, l))], c = i ? s : s - 1;
  for (let l = 0; l < c; l++) {
    const o = a(l - 1), u = a(l), f = a(l + 1), h = a(l + 2);
    if (n === 0) {
      r += ` L${D(f.x)} ${D(f.y)}`;
      continue;
    }
    const d = n / 6, m = u.x + (f.x - o.x) * d, p = u.y + (f.y - o.y) * d, g = f.x - (h.x - u.x) * d, y = f.y - (h.y - u.y) * d;
    r += ` C${D(m)} ${D(p)} ${D(g)} ${D(y)} ${D(f.x)} ${D(f.y)}`;
  }
  return i ? `${r} Z` : r;
}
const $ = (e, t = 0) => {
  const n = parseFloat(e ?? "");
  return Number.isFinite(n) ? n : t;
};
function ts(e) {
  const t = (e ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let i = 0; i + 1 < t.length; i += 2) n.push({ x: t[i], y: t[i + 1] });
  return n;
}
function Gt(e) {
  const t = e.attributes;
  switch (e.tag.toLowerCase()) {
    case "path":
      return t.d ?? null;
    case "circle":
    case "ellipse": {
      const n = $(t.cx), i = $(t.cy), s = e.tag.toLowerCase() === "circle" ? $(t.r) : $(t.rx), r = e.tag.toLowerCase() === "circle" ? $(t.r) : $(t.ry);
      return `M${n + s} ${i} A${s} ${r} 0 1 1 ${n - s} ${i} A${s} ${r} 0 1 1 ${n + s} ${i} Z`;
    }
    case "rect": {
      const n = $(t.x), i = $(t.y), s = $(t.width), r = $(t.height);
      let a = t.rx != null ? $(t.rx) : t.ry != null ? $(t.ry) : 0, c = t.ry != null ? $(t.ry) : a;
      return a = Math.min(a, s / 2), c = Math.min(c, r / 2), a === 0 || c === 0 ? `M${n} ${i} H${n + s} V${i + r} H${n} Z` : `M${n + a} ${i} H${n + s - a} A${a} ${c} 0 0 1 ${n + s} ${i + c} V${i + r - c} A${a} ${c} 0 0 1 ${n + s - a} ${i + r} H${n + a} A${a} ${c} 0 0 1 ${n} ${i + r - c} V${i + c} A${a} ${c} 0 0 1 ${n + a} ${i} Z`;
    }
    case "line":
      return `M${$(t.x1)} ${$(t.y1)} L${$(t.x2)} ${$(t.y2)}`;
    case "polyline":
    case "polygon": {
      const n = ts(t.points);
      if (n.length === 0) return null;
      const i = n.map((s, r) => `${r === 0 ? "M" : "L"}${s.x} ${s.y}`).join(" ");
      return e.tag.toLowerCase() === "polygon" ? `${i} Z` : i;
    }
    default:
      return null;
  }
}
const ge = {
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
}, ye = {
  none: "linear",
  linear: "linear",
  "linear.none": "linear",
  "power2.in": "ease-in-quad",
  "power2.out": "ease-out-quad",
  "power2.inout": "ease-in-out-quad",
  "power3.in": "ease-in-cubic",
  "power3.out": "ease-out-cubic",
  "power3.inout": "ease-in-out-cubic"
};
function es(e) {
  let t = e.trim().toLowerCase();
  return t = t.replace(/\.ease(in|out|inout)$/, ".$1"), !t.includes(".") && !t.startsWith("steps") && t !== "none" && t !== "linear" && (t = `${t}.out`), t;
}
function jt(e = 1, t = 0.3) {
  return (n) => {
    if (n === 0 || n === 1) return n;
    const i = t / (2 * Math.PI) * Math.asin(1 / Math.max(1, e));
    return e * Math.pow(2, -10 * n) * Math.sin((n - i) * (2 * Math.PI) / t) + 1;
  };
}
function cn(e = 1, t = 0.3) {
  const n = jt(e, t);
  return (i) => 1 - n(1 - i);
}
function ns(e = 1, t = 0.3) {
  const n = cn(e, t), i = jt(e, t);
  return (s) => s < 0.5 ? n(s * 2) / 2 : i(s * 2 - 1) / 2 + 0.5;
}
const Kt = (e) => {
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
}, ln = (e) => 1 - Kt(1 - e), is = (e) => e < 0.5 ? ln(e * 2) / 2 : Kt(e * 2 - 1) / 2 + 0.5;
function ss(e) {
  const t = Math.max(1, Math.floor(e));
  return (n) => Math.min(1, Math.floor(n * t) / (t - 1 || 1));
}
function be(e) {
  const t = es(e), n = /^steps\(\s*(\d+)\s*\)$/.exec(t);
  if (n)
    return { fn: ss(Number.parseInt(n[1], 10)), requiresBaking: "steps" };
  if (t.startsWith("elastic")) {
    const i = t.split(".")[1] ?? "out";
    return { fn: i === "in" ? cn() : i === "inout" ? ns() : jt(), requiresBaking: "elastic" };
  }
  if (t.startsWith("bounce")) {
    const i = t.split(".")[1] ?? "out";
    return { fn: i === "in" ? ln : i === "inout" ? is : Kt, requiresBaking: "bounce" };
  }
  return t in ye ? { easing: ye[t] } : t in ge ? { easing: { type: "cubic-bezier", points: ge[t] } } : { easing: "ease-out" };
}
const rs = /^([+-])=\s*(-?[\d.]+)$/, os = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function Dt(e, t) {
  const n = t.scale ?? 1, i = (o) => Number.parseFloat(o) * n;
  if (e === void 0) return t.cursor;
  if (typeof e == "number") return e * n;
  const s = e.trim();
  if (s === "") return t.cursor;
  const r = rs.exec(s);
  if (r) {
    const o = i(r[2]);
    return t.cursor + (r[1] === "-" ? -o : o);
  }
  const a = os.exec(s);
  if (a) {
    const o = a[1] === "<" ? t.previousStart : t.previousEnd;
    if (a[3] === void 0) return o;
    const u = i(a[3]);
    return o + (a[2] === "-" ? -u : u);
  }
  const c = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(s);
  if (c) {
    const o = t.labels.get(c[1].trim());
    if (o !== void 0) {
      const u = i(c[3]);
      return o + (c[2] === "-" ? -u : u);
    }
  }
  const l = t.labels.get(s);
  return l !== void 0 ? l : /^-?[\d.]+$/.test(s) ? i(s) : t.cursor;
}
const as = /* @__PURE__ */ new Set([
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
  "paused"
]);
function Tt(e) {
  const t = {}, n = {};
  for (const [i, s] of Object.entries(e))
    as.has(i) ? t[i] = s : n[i] = s;
  return { config: t, properties: n };
}
function Ut(e, t) {
  return e === void 0 ? t : e * 1e3;
}
function cs(e) {
  if (e !== void 0)
    return typeof e == "number" ? { each: e * 1e3 } : {
      ...e.each !== void 0 && { each: e.each * 1e3 },
      ...e.amount !== void 0 && { amount: e.amount * 1e3 },
      ...e.from !== void 0 && { from: e.from }
    };
}
const ls = {
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
function hs(e) {
  return ls[e];
}
function us(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : e;
  if (!t || typeof t.path != "string" && !Array.isArray(t.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(t.path))
    n = Ji(t.path, { curviness: t.curviness });
  else if (ut(t.path))
    n = t.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${t.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const i = { pathData: n };
  return t.autoRotate !== void 0 && t.autoRotate !== !1 && (i.autoRotate = !0, typeof t.autoRotate == "number" && (i.rotateOffset = t.autoRotate)), t.matrix && (i.matrix = t.matrix), { config: i, start: t.start ?? 0, end: t.end ?? 1 };
}
function fs(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : { ...e };
  return { ...t, start: t.end ?? 1, end: t.start ?? 0 };
}
function hn(e) {
  return typeof e == "object" && e !== null && "shape" in e ? e.shape : e;
}
function nt(e) {
  if (e.morphSVG === void 0) return e;
  const { morphSVG: t, ...n } = e, i = hn(t);
  if (typeof i != "string" || !ut(i))
    throw new Error(
      `gsap-compat: morphSVG "${String(i)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: i };
}
function ds(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++) t = Math.imul(t ^ e.charCodeAt(n), 16777619);
  return t >>> 0;
}
function ps(e, t, n) {
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
      seed: s.seed ?? ds(`${t}|${s.text}`)
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
function un(e) {
  return Math.max(0.1, e / 25);
}
function ms(e, t) {
  const n = typeof t == "number" ? { velocity: t } : t;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const i = n.friction ?? (n.resistance !== void 0 ? un(n.resistance) : void 0), s = {
    from: e,
    velocity: n.velocity,
    ...i !== void 0 && { friction: i },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? s.end = [n.end(wt(s))] : n.end !== void 0 && (s.end = Array.isArray(n.end) ? [...n.end] : n.end), s;
}
class Z {
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
    this.options = t, this.timeline = new Ke({
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
    return this.build(t, void 0, nt(n), i);
  }
  /** Animate from the given values to where the property already is. */
  from(t, n, i) {
    const { config: s, properties: r } = Tt(nt(n)), { motionPath: a, text: c, scrambleText: l, ...o } = r, u = this.targetsOf(t)[0], f = { ...s };
    for (const m of Object.keys(o))
      f[m] = this.resolveStart(u, m);
    a !== void 0 && (f.motionPath = fs(a));
    const h = {}, d = String(this.resolveStart(u, "text"));
    return c !== void 0 && (h.text = Xt(c), f.text = typeof c == "object" ? { ...c, value: d } : d), l !== void 0 && (h.text = Xt(l), f.scrambleText = typeof l == "object" ? { ...l, text: d } : d), this.build(t, { ...o, ...h }, f, i);
  }
  /** Animate between two explicit sets of values. */
  fromTo(t, n, i, s) {
    const { properties: r } = Tt(nt(n));
    return this.build(t, r, nt(i), s);
  }
  /** Set values instantly — a single held keyframe. */
  set(t, n, i) {
    return this.build(t, void 0, { ...nt(n), duration: 0 }, i);
  }
  // --- sequencing ---------------------------------------------------------
  /** Name a point in time, for use as a position parameter. */
  addLabel(t, n) {
    return this.labels.set(t, Dt(n, this.context())), this;
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
  add(t, n) {
    const i = Dt(n, this.context());
    for (const r of t.timeline.tracks) {
      if (!("keyframes" in r)) continue;
      const a = Nt({
        ...r,
        id: this.nextTrackId(`nested-${r.id}`),
        keyframes: r.keyframes.map((c) => ({ ...c, time: c.time + i }))
      });
      this.timeline.addTrack(a);
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
    const { config: r, properties: a } = Tt(i), { motionPath: c, text: l, scrambleText: o, inertia: u, ...f } = a, h = this.targetsOf(t), d = Dt(s, this.context()), m = Ut(r.delay, 0), p = Ut(r.duration, 500), g = cs(r.stagger), y = this.easingFor(r.ease), v = [];
    for (const [A, S] of Object.entries(f)) {
      const k = S;
      let E = n?.[A] !== void 0 ? n[A] : this.resolveStart(h[0], A);
      typeof E != typeof k && (this.warn(
        `no usable start value for "${A}" on "${h[0]}" — it will snap to ${String(k)}. Use fromTo() to animate it.`
      ), E = k);
      const _ = this.keyframesFor(E, k, p, y, r.ease), F = this.nextTrackId(`${h[0]}-${A}`);
      this.timeline.addTrack(
        Nt({
          id: F,
          target: h[0],
          ...h.length > 1 && { targets: h },
          ...g && h.length > 1 && { stagger: g },
          property: A,
          delay: d + m,
          keyframes: _
        })
      ), v.push(F);
      for (const N of h) this.lastValues.set(`${N}|${A}`, k);
    }
    const T = ps({ text: l, scrambleText: o }, h[0], p);
    if (T) {
      const A = n?.text ?? n?.scrambleText, S = A !== void 0 ? Xt(A) : this.resolveStart(h[0], "text"), k = this.nextTrackId(`${h[0]}-text`), E = {
        id: k,
        target: h[0],
        ...h.length > 1 && { targets: h },
        ...g && h.length > 1 && { stagger: g },
        property: "text",
        textConfig: { from: typeof S == "string" ? S : String(S ?? ""), ...T },
        delay: d + m,
        keyframes: this.keyframesFor(0, 1, p, y, r.ease)
      };
      this.timeline.addTrack(E), v.push(k);
      for (const _ of h) this.lastValues.set(`${_}|text`, T.to);
    }
    if (c !== void 0) {
      const { config: A, start: S, end: k } = us(c), E = this.nextTrackId(`${h[0]}-motionPath`), _ = {
        id: E,
        target: h[0],
        ...h.length > 1 && { targets: h },
        ...g && h.length > 1 && { stagger: g },
        property: "motionPath",
        motionPathConfig: A,
        delay: d + m,
        keyframes: this.keyframesFor(S, k, p, y, r.ease)
      };
      this.timeline.addTrack(_), v.push(E);
    }
    let w = 0;
    if (u !== void 0)
      for (const [A, S] of Object.entries(u)) {
        const k = this.resolveStart(h[0], A);
        if (typeof k != "number") {
          this.warn(`inertia on "${A}" needs a numeric start value; skipped`);
          continue;
        }
        const E = ms(k, S), _ = this.nextTrackId(`${h[0]}-${A}-inertia`), F = {
          id: _,
          target: h[0],
          ...h.length > 1 && { targets: h },
          ...g && h.length > 1 && { stagger: g },
          property: A,
          kind: "inertia",
          inertia: E,
          delay: d + m
        };
        this.timeline.addTrack(F), v.push(_), w = Math.max(w, ht(E));
        for (const N of h) this.lastValues.set(`${N}|${A}`, lt(E));
      }
    const x = (u !== void 0 && Object.keys(f).length === 0 && !T && c === void 0 ? w : Math.max(p, w)) + (g && h.length > 1 ? Mt(h.length, g) : 0), P = d + m + x;
    return this.previousStart = d + m, this.previousEnd = P, this.cursor = Math.max(this.cursor, P), {
      trackIds: v,
      start: d + m,
      end: P,
      kill: () => {
        for (const A of v) this.timeline.removeTrack(A);
      }
    };
  }
  /**
   * Two keyframes, or a baked sequence when the ease has no closed form.
   */
  keyframesFor(t, n, i, s, r) {
    const a = { time: 0, value: t };
    if (i <= 0)
      return [{ time: 0, value: n }];
    const c = typeof r == "string" ? be(r) : void 0;
    return c?.requiresBaking && this.options.bakeEases && c.fn ? [
      a,
      ...oi(a, { time: i, value: n }, c.fn, {
        intervalMs: this.options.bakeIntervalMs
      })
    ] : (c?.requiresBaking && !this.options.bakeEases && this.warn(
      `ease "${r}" cannot be represented as a cubic-bezier; falling back to a smooth curve. Pass { bakeEases: true } to sample it into keyframes.`
    ), [a, { time: i, value: n, ...s && { easing: s } }]);
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
    if (n === "d")
      throw new Error(
        `gsap-compat: no starting shape for "${t}". Use fromTo({ d: … }, { morphSVG: … }), or live.to(), which reads the element's current shape.`
      );
    const a = hs(n);
    return a !== void 0 ? (this.warn(
      `no start value for "${n}" on "${t}" — using the static default ${a}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), a) : (this.warn(`no start value or default for "${n}" on "${t}" — using 0`), 0);
  }
  easingFor(t) {
    if (t !== void 0) {
      if (typeof t == "string") return be(t).easing;
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
function Xt(e) {
  if (typeof e == "string") return e;
  if (e && typeof e == "object") {
    const t = e;
    return String(t.value ?? t.text ?? "");
  }
  return String(e ?? "");
}
function gs(e) {
  return new Z(e);
}
const ys = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), bs = "#ffffff", Ts = "rgba(0, 0, 0, 0.5)";
function ws(e) {
  const t = [];
  if (e.blur !== void 0 && t.push(`blur(${Math.max(0, e.blur)}px)`), e.brightness !== void 0 && t.push(`brightness(${Math.max(0, e.brightness)})`), e.glow !== void 0 && t.push(`drop-shadow(0 0 ${Math.max(0, e.glow)}px ${e.glowColor ?? bs})`), e.shadowX !== void 0 || e.shadowY !== void 0 || e.shadowBlur !== void 0) {
    const n = e.shadowX ?? 0, i = e.shadowY ?? 0, s = Math.max(0, e.shadowBlur ?? 0);
    t.push(`drop-shadow(${n}px ${i}px ${s}px ${e.shadowColor ?? Ts})`);
  }
  return t.length > 0 ? t.join(" ") : null;
}
function vs(e, t) {
  const n = e.childNodes.length === 1 ? e.firstChild : null;
  if (n && n.nodeType === 3) {
    const i = n;
    i.data !== t && (i.data = t);
    return;
  }
  e.textContent !== t && (e.textContent = t);
}
function xs(e) {
  if (!("ownerSVGElement" in e)) return;
  const t = e.style;
  !t || t.transformBox || (t.transformBox = "fill-box", t.transformOrigin || (t.transformOrigin = "50% 50%"));
}
const Te = /* @__PURE__ */ new Set([
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
]), Ms = /* @__PURE__ */ new Set([
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
]), Ss = /* @__PURE__ */ new Set(["originX", "originY"]), As = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), ks = {
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
    const i = [];
    let s = null, r = null, a = null;
    const c = n.has("motionPathX"), l = n.has("motionPathY"), o = n.has("motionPathRotate");
    for (const [h, d] of n)
      if (!(h === "x" && c) && !(h === "y" && l) && !((h === "rotate" || h === "rotateZ") && o)) {
        if (Ms.has(h)) {
          const m = this.buildTransformPart(h, d);
          m && i.push(m);
        } else if (Ss.has(h))
          typeof d == "number" && ((s ??= {})[h] = d);
        else if (As.has(h))
          typeof d == "number" && ((r ??= {})[h] = d);
        else if (ys.has(h))
          (a ??= {})[h] = d;
        else if (h !== "perspective") {
          if (h !== "shine") if (h === "text" && typeof d == "string")
            vs(t, d);
          else if (h === "d" && typeof d == "string") {
            const m = t;
            (m.tagName?.toLowerCase() === "path" ? m : m.querySelector?.("path"))?.setAttribute?.("d", d);
          } else
            this.applyStyleProperty(t, h, d);
        }
      }
    const u = n.get("shine");
    typeof u == "number" && this.applyShine(t, u);
    const f = n.get("perspective");
    if (typeof f == "number" && i.unshift(`perspective(${f}px)`), i.length > 0 && (t.style.transform = i.join(" "), xs(t)), s) {
      const h = s.originX ?? 50, d = s.originY ?? 50;
      t.style.transformOrigin = `${h}% ${d}%`;
    }
    if (r) {
      const h = r.clipTop ?? 0, d = r.clipRight ?? 0, m = r.clipBottom ?? 0, p = r.clipLeft ?? 0;
      t.style.clipPath = `inset(${h}% ${d}% ${m}% ${p}%)`;
    }
    if (a) {
      const h = ws(a);
      h && (t.style.filter = h);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(t, n) {
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
    n === "fill" && t.dataset.elementType === "text" ? s = "color" : s = ks[n] ?? n;
    let r;
    typeof i == "number" ? Te.has(n) || Te.has(s) ? r = `${i}px` : r = String(i) : Array.isArray(i) ? r = i.join(", ") : r = i, t.style[s] = r;
  }
}
const Es = {
  request: (e) => requestAnimationFrame(e),
  cancel: (e) => cancelAnimationFrame(e)
};
class Ps {
  adapter = new U();
  scheduler;
  rootOption;
  /** Element → engine target name. The engine only ever sees names. */
  names = /* @__PURE__ */ new WeakMap();
  elements = /* @__PURE__ */ new Map();
  nameCounter = 0;
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
    this.scheduler = t.scheduler ?? Es, this.rootOption = t.root;
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
   * Resolve selectors, elements and lists of either to engine target names,
   * registering each element with the adapter the first time it is seen.
   * Returns an empty array when nothing matches.
   */
  resolveTargets(t) {
    const n = [];
    for (const i of this.elementsOf(t))
      n.push(this.nameFor(i));
    return n;
  }
  /** Find one element the way selector targets are found: within the stage's root. */
  query(t) {
    return this.root.querySelector(t);
  }
  /** The element registered under a target name. */
  elementFor(t) {
    return this.elements.get(t);
  }
  /** Last value the stage applied to a target's property, if any. */
  appliedValue(t, n) {
    return this.applied.get(t)?.get(n);
  }
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
    this.active.delete(t), this.active.size === 0 && this.stopLoop();
  }
  /**
   * Stop everything on this stage and release its elements. Animations that
   * are still running stop where they are; elements keep the styles last
   * applied. A destroyed stage ignores later playback, so a timeline whose
   * autoplay was already queued cannot restart the loop.
   */
  destroy() {
    this.destroyed = !0;
    for (const t of this.active.keys()) t.stop();
    this.active.clear(), this.stopLoop(), this.adapter.clearTargets(), this.elements.clear(), this.names = /* @__PURE__ */ new WeakMap(), this.applied.clear(), this.dirty.clear();
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
    for (const [n, i] of [...this.active])
      n.duration <= 0 ? (this.write(n.getStateAtTime(0)), n.stop()) : n.tick(t), i.onUpdate?.(), n.playbackState !== "playing" && this.active.delete(n);
    this.flush(), this.active.size === 0 && this.stopLoop();
  }
  // --- internals ----------------------------------------------------------
  write(t) {
    for (const [n, i] of t.values) {
      let s = this.applied.get(n);
      s || (s = /* @__PURE__ */ new Map(), this.applied.set(n, s));
      for (const [r, a] of i) s.set(r, a);
      this.dirty.add(n);
    }
  }
  flush() {
    if (this.dirty.size === 0) return;
    const t = /* @__PURE__ */ new Map();
    for (const n of this.dirty) t.set(n, this.applied.get(n));
    this.dirty.clear(), this.adapter.applyState({
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
    this.lastTimestamp = t, n > 0 && this.tick(n), this.active.size > 0 && this.frameId === null && (this.frameId = this.scheduler.request(this.frame));
  };
  startLoop() {
    this.frameId === null && (this.lastTimestamp = null, this.frameId = this.scheduler.request(this.frame));
  }
  stopLoop() {
    this.frameId !== null && this.scheduler.cancel(this.frameId), this.frameId = null, this.lastTimestamp = null;
  }
  elementsOf(t) {
    if (typeof t == "string")
      return Array.from(this.root.querySelectorAll(t));
    if (_s(t)) return [t];
    const n = [];
    for (const i of Array.from(t))
      n.push(...this.elementsOf(i));
    return n;
  }
  nameFor(t) {
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
function _s(e) {
  return typeof e == "object" && e !== null && e.nodeType === 1;
}
function xt(e) {
  const t = e.style;
  if (!t) return e.getBoundingClientRect();
  const n = t.transform;
  t.transform = "none";
  const i = e.getBoundingClientRect();
  return t.transform = n, i;
}
const we = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function Cs(e) {
  const t = {};
  for (const n of Array.from(e.attributes)) t[n.name] = n.value;
  return t;
}
function $s(e) {
  const t = e.getScreenCTM?.();
  if (t) return [t.a, t.b, t.c, t.d, t.e, t.f];
  const n = e.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function Bs(e, t) {
  const n = typeof e == "string" || Array.isArray(e) || we(e) ? { path: e } : e, { align: i, alignOrigin: s, path: r, ...a } = n, c = (M) => {
    const x = we(M) ? M : t.query(M);
    return x || t.warn(`gsap-compat: motionPath could not find "${String(M)}"`), x;
  };
  let l = null, o = "";
  if (Array.isArray(r) || typeof r == "string" && ut(r))
    o = r;
  else {
    l = c(r);
    const M = l && Gt({ tag: l.localName, attributes: Cs(l) });
    l && !M && t.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), o = M ?? "";
  }
  const u = { ...a, path: o };
  if (i === void 0 || i === !1) return u;
  const f = i === !0 ? l : c(i);
  if (!f)
    return i === !0 && t.warn("gsap-compat: motionPath align: true needs the path to be an element"), u;
  const h = t.targets[0];
  if (!h) return u;
  const [d, m, p, g, y, v] = $s(f), T = xt(h), [w, b] = s ?? [0.5, 0.5];
  for (const M of t.targets.slice(1)) {
    const x = xt(M);
    if (Math.abs(x.left - T.left) > 0.5 || Math.abs(x.top - T.top) > 0.5) {
      t.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return u.matrix = [d, m, p, g, y - T.left - w * T.width, v - T.top - b * T.height], u;
}
const fn = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function dn(e) {
  const t = {};
  for (const n of Array.from(e.attributes)) t[n.name] = n.value;
  return t;
}
function pn(e) {
  if (!e) return null;
  const t = Gt({ tag: e.localName, attributes: dn(e) });
  return t || (e.querySelector("path")?.getAttribute("d") ?? null);
}
function Is(e, t, n) {
  const i = hn(e);
  if (typeof i == "string" && ut(i)) return i;
  const s = fn(i) ? i : typeof i == "string" ? t(i) : null, r = pn(s);
  return r || (n(`gsap-compat: morphSVG could not find a shape for "${String(i)}"`), "");
}
const Ls = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function Fs(e, t = document) {
  return (typeof e == "string" ? Array.from(t.querySelectorAll(e)) : fn(e) ? [e] : Array.from(e)).map((i) => {
    if (i.localName === "path") return i;
    const s = Gt({ tag: i.localName, attributes: dn(i) });
    if (!s || !i.parentNode) return i;
    const r = i.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const a of Array.from(i.attributes))
      Ls.has(a.name) || r.setAttribute(a.name, a.value);
    return r.setAttribute("d", s), i.parentNode.replaceChild(r, i), r;
  });
}
const ve = 0.3;
class Rs {
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
    this.dragging = !0, this.passedTolerance = !1, this.startX = t, this.startY = n, this.lastX = t, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = xe(), this.options.onPress?.(this.stateFrom(0, 0, i));
  }
  move(t, n, i) {
    if (!this.dragging) return;
    const s = t - this.lastX, r = n - this.lastY;
    this.lastX = t, this.lastY = n;
    const a = t - this.startX, c = n - this.startY, l = this.options.tolerance ?? 3;
    if (!this.passedTolerance) {
      if (Math.hypot(a, c) < l) return;
      this.passedTolerance = !0;
    }
    this.updateVelocity(s, r), this.options.preventDefault !== !1 && i.cancelable && i.preventDefault(), this.options.onMove?.(this.stateFrom(s, r, i));
  }
  end(t) {
    this.dragging && (this.dragging = !1, this.options.onRelease?.(this.stateFrom(0, 0, t)));
  }
  updateVelocity(t, n) {
    const i = xe(), s = Math.max(1, i - this.lastTime);
    this.lastTime = i;
    const r = t / s * 1e3, a = n / s * 1e3;
    this.velocityX += (r - this.velocityX) * ve, this.velocityY += (a - this.velocityY) * ve;
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
function xe() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function Ds(e, t, n) {
  let i = { delta: 0, line: null }, s = n;
  for (const r of e)
    for (const a of t) {
      const c = Math.abs(a - r);
      c <= s && (s = c, i = { delta: a - r, line: a });
    }
  return i;
}
function Xs(e, t) {
  return t <= 0 ? [] : e.map((n) => Math.round(n / t) * t);
}
class mn {
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
    this.options = t, this.x = t.initialX ?? 0, this.y = t.initialY ?? 0, this.observer = new Rs({
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
    const s = (this.options.axis ?? "both") === "y" ? this.y : this.x, r = Os(s / i);
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
      ...Xs([i], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], r = Ds([i], s, this.snapThreshold());
    i += r.delta, n === "x" ? this.snappedX = r.line : this.snappedY = r.line;
    const a = this.options.bounds;
    if (a) {
      const c = n === "x" ? a.minX : a.minY, l = n === "x" ? a.maxX : a.maxY;
      c !== void 0 && (i = Math.max(c, i)), l !== void 0 && (i = Math.min(l, i));
    }
    return i;
  }
}
function Os(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e;
}
function Dr(e) {
  const t = new mn(e);
  return t.start(), t;
}
const Ys = { x: "x", y: "y", "x,y": "both" }, Me = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function Se(e, t) {
  const n = xt(e), i = t.getBoundingClientRect();
  return {
    minX: i.left - n.left,
    maxX: i.right - n.right,
    minY: i.top - n.top,
    maxY: i.bottom - n.bottom
  };
}
function Ae(e) {
  return Array.isArray(e) ? [...e] : e;
}
function qs(e, t, n, i = {}) {
  const [s] = t.resolveTargets(n), r = s ? t.elementFor(s) : void 0;
  if (!s || !r)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  const a = Ys[i.type ?? "x,y"], c = () => {
    const p = t.appliedValue(s, "x"), g = t.appliedValue(s, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof g == "number" ? g : 0 };
  }, l = typeof i.bounds == "string" ? t.query(i.bounds) : Me(i.bounds) ? i.bounds : null, u = { bounds: (!l && i.bounds && !Me(i.bounds) ? i.bounds : void 0) ?? (l ? Se(r, l) : void 0) };
  let f = null;
  const h = () => {
    f?.kill(), f = null;
  }, d = (p) => {
    const g = i.inertia === !0 ? {} : i.inertia, y = g.friction ?? (g.resistance !== void 0 ? un(g.resistance) : 4), v = c(), T = u.bounds ?? {};
    let w, b;
    const M = g.end;
    if (Array.isArray(M)) {
      const P = wt({ from: v.x, velocity: a === "y" ? 0 : p.x, friction: y }), A = wt({ from: v.y, velocity: a === "x" ? 0 : p.y, friction: y });
      let S = M[0];
      for (const k of M)
        Math.hypot(k.x - P, k.y - A) < Math.hypot(S.x - P, S.y - A) && (S = k);
      S && (w = [S.x], b = [S.y]);
    } else typeof M == "number" ? (w = M, b = M) : M && (w = Ae(M.x), b = Ae(M.y));
    const x = {};
    a !== "y" && (x.x = { velocity: p.x, friction: y, min: T.minX, max: T.maxX, end: w }), a !== "x" && (x.y = { velocity: p.y, friction: y, min: T.minY, max: T.maxY, end: b }), f = e.to(r, { inertia: x, onComplete: () => i.onThrowComplete?.() });
  }, m = new mn({
    target: r,
    axis: a,
    snap: i.snap,
    get bounds() {
      return u.bounds;
    },
    getPosition: c,
    onPress: () => {
      h(), l && (u.bounds = Se(r, l)), i.onPress?.();
    },
    onDrag: (p) => {
      t.apply(s, a === "x" ? { x: p.x } : a === "y" ? { y: p.y } : { x: p.x, y: p.y }), i.onDrag?.(p);
    },
    onRelease: () => {
      const p = m.velocity;
      i.onRelease?.(p), i.inertia && d(p);
    }
  });
  return m.start(), {
    draggable: m,
    get position() {
      return c();
    },
    destroy() {
      h(), m.destroy();
    }
  };
}
const Ns = { opacity: 0, scale: 0.6 };
function Vs(e) {
  const t = e.getBoundingClientRect();
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function Us(e) {
  const t = xt(e);
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function ke(e, t) {
  const i = e.resolveTargets(t).map((r) => e.elementFor(r)).filter((r) => !!r), s = /* @__PURE__ */ new Map();
  for (const r of i) s.set(r, Vs(r));
  return { elements: i, boxes: s };
}
const Ot = /* @__PURE__ */ new WeakMap();
function Ee(e, t, n, i = {}) {
  const s = i.duration ?? 0.6, r = i.ease ?? "power2.inOut", a = i.stagger ?? 0, c = i.scale !== !1, l = i.enter === void 0 ? Ns : i.enter, o = new Set(n.elements);
  if (i.targets !== void 0)
    for (const d of e.resolveTargets(i.targets)) {
      const m = e.elementFor(d);
      m && o.add(m);
    }
  const u = [...o].sort(
    (d, m) => d === m ? 0 : d.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), f = t({ onComplete: i.onComplete });
  let h = 0;
  for (const d of u) {
    const m = n.boxes.get(d) ?? null, p = Us(d);
    if (!p) continue;
    const [g] = e.resolveTargets(d);
    Ot.get(d)?.timeline.removeTracks({ target: g });
    const y = h * a;
    if (!m) {
      if (l === !1) continue;
      f.fromTo(d, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...Ws(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: s, ease: r, delay: y }, 0), Ot.set(d, f), h++;
      continue;
    }
    const v = m.cx - p.cx, T = m.cy - p.cy, w = c ? m.width / p.width : 1, b = c ? m.height / p.height : 1;
    if (!(Math.abs(v) > 0.5 || Math.abs(T) > 0.5 || Math.abs(w - 1) > 1e-3 || Math.abs(b - 1) > 1e-3)) {
      const x = (P, A) => {
        const S = e.appliedValue(g, P);
        return typeof S == "number" && Math.abs(S - A) > 1e-6;
      };
      (x("x", 0) || x("y", 0) || x("scaleX", 1) || x("scaleY", 1)) && f.set(d, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    f.fromTo(
      d,
      { x: v, y: T, scaleX: w, scaleY: b },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: s, ease: r, delay: y },
      0
    ), Ot.set(d, f), h++;
  }
  return f;
}
function Ws(e) {
  const t = {};
  for (const n of Object.keys(e))
    t[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return t;
}
class bt {
  /** The compiled compat timeline. */
  compat;
  stage;
  options;
  /** Cleared once playback has been started or explicitly controlled. */
  autoplayPending;
  started = !1;
  constructor(t, n = {}) {
    this.stage = t, this.options = n, this.compat = new Z({
      ...n,
      startValue: (i, s) => {
        const r = t.appliedValue(i, s);
        if (r !== void 0) return r;
        if (s === "d") return pn(t.elementFor(i)) ?? void 0;
        if (s === "text") return t.elementFor(i)?.textContent ?? void 0;
      }
    }), this.compat.timeline.onComplete = () => n.onComplete?.(), this.autoplayPending = !n.paused, this.autoplayPending && queueMicrotask(() => {
      this.autoplayPending && this.play();
    });
  }
  /** The engine timeline. */
  get timeline() {
    return this.compat.timeline;
  }
  // --- building -----------------------------------------------------------
  to(t, n, i) {
    const s = this.resolve(t);
    return s && this.perElementStarts(s, n, i, (r, a, c) => this.compat.to(r, a, c)), this;
  }
  from(t, n, i) {
    const s = this.resolve(t);
    return s && this.perElementStarts(s, n, i, (r, a, c) => this.compat.from(r, a, c)), this;
  }
  fromTo(t, n, i, s) {
    const r = this.resolve(t);
    return r && this.compat.fromTo(r, this.prepare(n, r), this.prepare(i, r), s), this;
  }
  set(t, n, i) {
    const s = this.resolve(t);
    return s && this.compat.set(s, this.prepare(n, s), i), this;
  }
  addLabel(t, n) {
    return this.compat.addLabel(t, n), this;
  }
  /** Merge another timeline in at a position (flattened, as in `tf`). */
  add(t, n) {
    return t.autoplayPending = !1, t.timeline.stop(), t.stage.deactivate(t.timeline), this.compat.add(t.compat, n), this;
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
  /** Jump to a time in seconds, or to a label, and apply it immediately. */
  seek(t) {
    return this.autoplayPending = !1, this.compat.seek(t), this.stage.render(this.timeline), this;
  }
  /** Read or set progress, 0..1. Setting applies immediately. */
  progress(t) {
    if (t === void 0) return this.compat.progress();
    this.autoplayPending = !1;
    const n = this.compat.progress(t);
    return this.stage.render(this.timeline), n;
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
  /** Stop and remove every tween. Elements keep the values last applied. */
  kill() {
    return this.autoplayPending = !1, this.timeline.stop(), this.stage.deactivate(this.timeline), this.compat.kill(), this;
  }
  /** The compiled animation, as plain JSON. */
  toDefinition() {
    return this.compat.toDefinition();
  }
  /**
   * A track has one start value, but each element starts from its own shape or
   * text. So a morph or text tween over several elements builds one tween per
   * element, all at the same position, with any stagger turned into delays.
   */
  perElementStarts(t, n, i, s) {
    if (!(n.morphSVG !== void 0 || n.text !== void 0 || n.scrambleText !== void 0) || t.length === 1) {
      s(t, this.prepare(n, t), i);
      return;
    }
    const { stagger: a, ...c } = n, l = typeof a == "number" ? a : a?.each ?? 0;
    t.forEach((o, u) => {
      const f = Ut(c.delay, 0) / 1e3 + u * l;
      s([o], this.prepare({ ...c, delay: f }, [o]), u === 0 ? i : "<");
    });
  }
  /**
   * Resolve the parts of vars that refer to the page — today, a motion path
   * given as a selector or element, and its `align` — into plain data.
   */
  prepare(t, n) {
    const i = (a) => this.options.onWarning?.(a), s = (a) => this.stage.query(a);
    let r = t;
    if (t.motionPath !== void 0) {
      const a = Bs(t.motionPath, {
        query: s,
        targets: n.map((c) => this.stage.elementFor(c)).filter((c) => !!c),
        warn: i
      });
      r = { ...r, motionPath: a };
    }
    if (t.morphSVG !== void 0) {
      const a = Is(t.morphSVG, s, i), { morphSVG: c, ...l } = r;
      r = a ? { ...r, morphSVG: a } : l;
    }
    return r;
  }
  resolve(t) {
    const n = this.stage.resolveTargets(t);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${Hs(t)}`);
      return;
    }
    return n;
  }
}
function zs(e = new Ps()) {
  const t = (i) => {
    const { config: s } = Tt(i);
    return new bt(e, {
      repeat: s.repeat,
      yoyo: s.yoyo,
      repeatDelay: s.repeatDelay,
      paused: s.paused,
      onStart: s.onStart,
      onUpdate: s.onUpdate,
      onComplete: s.onComplete
    });
  }, n = {
    stage: e,
    timeline: (i) => new bt(e, i),
    to: (i, s) => t(s).to(i, s),
    from: (i, s) => t(s).from(i, s),
    fromTo: (i, s, r) => t(r).fromTo(i, s, r),
    set: (i, s) => t(s).set(i, s),
    convertToPath: (i) => Fs(i, e.root),
    draggable: (i, s) => qs(n, e, i, s),
    getFlipState: (i) => ke(e, i),
    flipFrom: (i, s) => Ee(e, (r) => new bt(e, r), i, s),
    flip: (i, s, r) => {
      const a = ke(e, i);
      return s(), Ee(e, (c) => new bt(e, c), a, { targets: i, ...r });
    }
  };
  return n;
}
const ft = /* @__PURE__ */ zs();
function Hs(e) {
  return typeof e == "string" ? `"${e}"` : String(e);
}
class Pe {
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
function Gs(e, t, n, i, s) {
  const r = n - s;
  if (r < 0) {
    t.paused || t.pause(), t.currentTime = 0;
    return;
  }
  e.update(r, i);
}
class gn {
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
  constructor(t, n = {}) {
    if (typeof t == "string") {
      const i = document.querySelector(t);
      if (!i)
        throw new Error(`Container not found: ${t}`);
      this.container = i;
    } else
      this.container = t;
    this.options = n, this.adapter = new U();
  }
  /**
   * Load animation from a URL or JSON object.
   */
  async load(t) {
    let n;
    if (typeof t == "string") {
      const i = await fetch(t);
      if (!i.ok)
        throw new Error(`Failed to load animation: ${i.statusText}`);
      n = await i.json();
    } else
      n = t;
    this.options.speed !== void 0 && (n.config = { ...n.config, speed: this.options.speed }), this.options.loop !== void 0 && (n.config = { ...n.config, loop: this.options.loop }), this.options.alternate !== void 0 && (n.config = { ...n.config, alternate: this.options.alternate }), this.timeline = rt(n), this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia(), this.options.autoplay && this.play();
  }
  /**
   * Find embedded media elements (`[data-tinyfly-media]`) in the container and
   * bind each to the timeline. Emitted by the editor's export for audio/video
   * scene elements; the `data-tinyfly-start` attribute sets when each begins.
   */
  scanMedia() {
    this.mediaTargets = [], this.container.querySelectorAll("[data-tinyfly-media]").forEach((n) => {
      const i = n, s = Number(i.getAttribute("data-tinyfly-start") ?? "0") || 0, r = i.getAttribute("data-volume");
      r !== null && (i.volume = Math.max(0, Math.min(1, Number(r) || 0))), this.mediaTargets.push({ el: i, startTime: s, sync: new Pe(i) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(t, n) {
    for (const i of this.mediaTargets)
      Gs(i.sync, i.el, t, n, i.startTime);
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
      i && (this.targets[t] = i, this.adapter.registerTarget(t, i));
    } else
      this.targets[t] = n, this.adapter.registerTarget(t, n);
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
      const a = new U();
      i.querySelectorAll("[data-tinyfly]").forEach((c) => {
        const l = c.getAttribute("data-tinyfly");
        l && a.registerTarget(l, c);
      }), this.symbolInstances.push({ adapter: a, timeline: rt(r.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(t, n) {
    this.mediaSync = new Pe(t, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const t = (n) => {
      if (this.isDestroyed || !this.timeline) return;
      const i = n - (this.lastTime ?? n);
      this.lastTime = n, this.timeline.tick(i), this.applyState();
      const s = this.timeline.playbackState === "playing";
      this.mediaSync?.update(this.timeline.currentTime, s), this.syncAllMedia(this.timeline.currentTime, s), this.timeline.playbackState === "playing" ? this.animationFrameId = requestAnimationFrame(t) : this.animationFrameId = void 0;
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
    for (const n of this.symbolInstances) {
      const i = n.timeline.duration;
      n.adapter.applyState(n.timeline.getStateAtTime(i > 0 ? t % i : t));
    }
  }
}
async function Xr(e, t, n = {}) {
  const i = new gn(e, { ...n, autoplay: !0 });
  return await i.load(t), i;
}
function Or(e, t = {}) {
  return new gn(e, t);
}
class js {
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
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new U(), this.adapterB = new U();
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
      const a = document.createElement("div");
      a.innerHTML = r.html.trim();
      const c = a.firstElementChild;
      if (c) {
        s.appendChild(c);
        const l = c.getAttribute("data-tinyfly");
        l && i.registerTarget(l, c);
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
      const a = this.symbolDefs.get(r);
      if (!a) return;
      const c = new U();
      s.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const o = l.getAttribute("data-tinyfly");
        o && c.registerTarget(o, l);
      }), i.push({ adapter: c, timeline: rt(a) });
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
    return t.timeline ? rt(t.timeline) : null;
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
async function Yr(e, t, n = {}) {
  const i = new js(e, { ...n, autoplay: !0 });
  return await i.load(t), i;
}
const qr = { type: "none", duration: 0 }, _e = {
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
function Ce(e) {
  const t = e.trim().toLowerCase();
  if (t in _e) return _e[t];
  if (t.endsWith("%")) {
    const n = Number.parseFloat(t.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function Ks(e) {
  if (typeof e == "number")
    return { elementFraction: 0, viewportFraction: 0, offsetPx: 0, absolutePx: e };
  let t = 0;
  const i = e.replace(/([+-])=\s*(-?[\d.]+)/g, (a, c, l) => (t += (c === "-" ? -1 : 1) * Number.parseFloat(l), "")).trim().split(/\s+/).filter(Boolean);
  if (i.length === 1 && /^-?[\d.]+$/.test(i[0]))
    return {
      elementFraction: 0,
      viewportFraction: 0,
      offsetPx: 0,
      absolutePx: Number.parseFloat(i[0]) + t
    };
  const s = i[0] !== void 0 ? Ce(i[0]) : void 0, r = i[1] !== void 0 ? Ce(i[1]) : void 0;
  return {
    elementFraction: s ?? 0,
    viewportFraction: r ?? 0,
    offsetPx: t
  };
}
function $e(e, t, n) {
  const i = Ks(n), s = i.absolutePx !== void 0 ? e.top + i.absolutePx : e.top + e.height * i.elementFraction, r = t * i.viewportFraction;
  return s - r + i.offsetPx;
}
function Zs(e, t, n, i) {
  const s = $e(e, t, n), a = $e(e, t, i) - s;
  return a <= 0 ? s <= 0 ? 1 : 0 : Qs(-s / a);
}
function Qs(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e === 0 ? 0 : e;
}
function Js(e, t, n, i) {
  if (n <= 0) return t;
  const s = 1 - Math.exp(-(i / 1e3) / n);
  return e + (t - e) * s;
}
class tr {
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
function Nr(e) {
  const t = new tr(e);
  return t.start(), t;
}
class er {
  timeline;
  options;
  running = !1;
  /** Progress the page is actually at */
  targetProgress = 0;
  /** Progress the playhead is showing (differs from target only while smoothing) */
  displayProgress = 0;
  /** Whether we were inside [start, end] on the previous sample */
  wasActive = !1;
  rafId = null;
  lastFrameTime = null;
  onScroll = () => this.sample();
  constructor(t) {
    this.timeline = t.timeline, this.options = t;
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline.pause(), (this.options.scroller ?? (typeof window < "u" ? window : null))?.addEventListener("scroll", this.onScroll, { passive: !0 }), typeof window < "u" && window.addEventListener("resize", this.onScroll, { passive: !0 }), this.sample(), this.smoothing() > 0 && this.startSmoothing();
  }
  stop() {
    if (!this.running) return;
    this.running = !1, (this.options.scroller ?? (typeof window < "u" ? window : null))?.removeEventListener("scroll", this.onScroll), typeof window < "u" && window.removeEventListener("resize", this.onScroll), this.stopSmoothing();
  }
  destroy() {
    this.stop();
  }
  /** Current scroll progress, 0..1. */
  get progress() {
    return this.targetProgress;
  }
  /**
   * Read the page and update progress. Exposed so a host can force a sample
   * after it changes layout itself.
   */
  sample() {
    const t = this.triggerRect();
    if (!t) return;
    const n = this.viewportHeight(), i = this.targetProgress;
    this.targetProgress = Zs(
      t,
      n,
      this.options.start ?? "top bottom",
      this.options.end ?? "bottom top"
    ), this.fireBoundaryCallbacks(i, this.targetProgress), this.smoothing() <= 0 && (this.displayProgress = this.targetProgress, this.applyProgress());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const t = this.options.scrub;
    return typeof t == "number" ? Math.max(0, t) : 0;
  }
  applyProgress() {
    const t = this.timeline.duration;
    t > 0 && this.timeline.seek(this.displayProgress * t), this.options.onUpdate?.(this.displayProgress);
  }
  /**
   * Emit enter/leave callbacks on the edges of the active range.
   *
   * "Active" is 0 < progress < 1; crossing into it from below is an enter, from
   * above an enterBack, and the reverse for leaves.
   */
  fireBoundaryCallbacks(t, n) {
    const i = n > 0 && n < 1;
    i && !this.wasActive ? n >= t ? this.options.onEnter?.() : this.options.onEnterBack?.() : !i && this.wasActive && (n >= t ? this.options.onLeave?.() : this.options.onLeaveBack?.()), this.wasActive = i;
  }
  startSmoothing() {
    if (typeof requestAnimationFrame > "u") return;
    const t = (n) => {
      if (!this.running) return;
      const i = this.lastFrameTime === null ? 16.67 : n - this.lastFrameTime;
      this.lastFrameTime = n, this.displayProgress = Js(
        this.displayProgress,
        this.targetProgress,
        this.smoothing(),
        i
      ), this.applyProgress(), this.rafId = requestAnimationFrame(t);
    };
    this.rafId = requestAnimationFrame(t);
  }
  stopSmoothing() {
    this.rafId !== null && typeof cancelAnimationFrame < "u" && cancelAnimationFrame(this.rafId), this.rafId = null, this.lastFrameTime = null;
  }
  triggerRect() {
    const t = this.options.trigger;
    if (typeof t?.getBoundingClientRect != "function") return null;
    const n = t.getBoundingClientRect(), i = this.options.scroller;
    if (i && typeof i.getBoundingClientRect == "function") {
      const s = i.getBoundingClientRect();
      return { top: n.top - s.top, bottom: n.bottom - s.top, height: n.height };
    }
    return { top: n.top, bottom: n.bottom, height: n.height };
  }
  viewportHeight() {
    const t = this.options.scroller;
    return t ? t.clientHeight : typeof window < "u" ? window.innerHeight : 0;
  }
}
function Vr(e) {
  const t = new er(e);
  return t.start(), t;
}
function Ur(e) {
  const { timeline: t } = e, n = new U();
  for (const [o, u] of Object.entries(e.targets)) {
    const f = typeof u == "string" ? document.querySelector(u) : u;
    if (!f)
      throw new Error(`quickPlay: no element found for target "${o}" (${String(u)})`);
    n.registerTarget(o, f);
  }
  t.onUpdate = (o) => {
    n.applyState(o), e.onUpdate?.(o);
  }, e.onComplete && (t.onComplete = e.onComplete);
  let i = null, s = null, r = !1;
  const a = (o) => {
    if (r) return;
    const u = s === null ? 0 : o - s;
    s = o, u > 0 && t.tick(u), i = requestAnimationFrame(a);
  }, c = () => {
    i !== null || r || (s = null, i = requestAnimationFrame(a));
  }, l = () => {
    i !== null && cancelAnimationFrame(i), i = null, s = null;
  };
  return n.applyState(t.getStateAtTime(t.currentTime)), e.autoplay !== !1 && (t.play(), c()), {
    timeline: t,
    adapter: n,
    play() {
      t.play(), c();
    },
    pause() {
      t.pause(), l();
    },
    restart() {
      t.stop(), t.play(), c();
    },
    seek(o) {
      t.seek(o * 1e3), n.applyState(t.getStateAtTime(t.currentTime));
    },
    destroy() {
      r = !0, l(), t.stop(), n.clearTargets();
    }
  };
}
const Wr = {
  timeline: gs,
  to(e, t, n) {
    const i = new Z(n);
    return i.to(e, t), i;
  },
  from(e, t, n) {
    const i = new Z(n);
    return i.from(e, t), i;
  },
  fromTo(e, t, n, i) {
    const s = new Z(i);
    return s.fromTo(e, t, n), s;
  },
  set(e, t, n) {
    const i = new Z(n);
    return i.set(e, t), i;
  }
}, zr = ft.to, Hr = ft.from, Gr = ft.fromTo, jr = ft.set, Kr = ft.timeline;
export {
  ot as ByteWriter,
  sr as Clock,
  Z as CompatTimeline,
  Ue as DEFAULT_BAKE_INTERVAL_MS,
  te as DEFAULT_INERTIA_FRICTION,
  R as DEFAULT_SPRING,
  qr as DEFAULT_TRANSITION,
  mn as Draggable,
  tn as GIFEncoder,
  kn as INERTIA_MAX_DURATION_MS,
  li as InertiaTrackPlayer,
  bt as LiveTimeline,
  fr as MORPH_SAMPLES,
  nn as MP4_WEBCODECS,
  ir as ManualClock,
  Pe as MediaSync,
  Rs as Observer,
  Fi as PaletteMatcher,
  Fe as SPRING_MAX_DURATION_MS,
  it as SPRING_STEP_MS,
  er as ScrollDriver,
  wr as SimpleGIFEncoder,
  St as SpringSampler,
  ci as SpringTrackPlayer,
  Ps as Stage,
  Ke as Timeline,
  gn as TinyflyPlayer,
  js as TinyflySequencer,
  Ct as TrackPlayer,
  Rr as ValueResolver,
  tr as VisibilityDriver,
  Yi as WebPEncoder,
  oi as bakeEasing,
  ze as bakeInertiaTrack,
  We as bakeSpringTrack,
  Li as buildPalette,
  ui as charactersFor,
  Qs as clamp01,
  dr as clearMorphCache,
  hr as clearPathCache,
  Or as create,
  Fn as createCubicBezier,
  zs as createLive,
  Ki as createRandom,
  Nt as createTrack,
  cr as criticalDamping,
  rt as deserializeTimeline,
  mi as deserializeTrack,
  Mr as downloadGIF,
  Pr as downloadVideo,
  Ar as downloadWebP,
  Dr as draggable,
  $n as easeIn,
  De as easeInCubic,
  In as easeInOut,
  Oe as easeInOutCubic,
  Cn as easeInOutQuad,
  Pn as easeInQuad,
  Bn as easeOut,
  Xe as easeOutCubic,
  _n as easeOutQuad,
  br as exportToCSS,
  xr as exportToGIF,
  Ii as exportToLottie,
  Tr as exportToLottieJSON,
  zi as exportToMP4,
  ji as exportToVideo,
  Sr as exportToWebP,
  Er as exportVideo,
  vr as extractFrames,
  Cr as frameCell,
  Hr as from,
  yr as fromJSON,
  Gr as fromTo,
  Ye as getEasingFunction,
  Ve as getInterpolator,
  je as getMotionPathPoint,
  ur as getPathLength,
  Un as getPointAtProgress,
  Ht as getSupportedVideoCodecs,
  Gi as getVideoExportFormats,
  Xs as gridLinesFor,
  vn as hasKeyframes,
  Ir as hashSeed,
  ht as inertiaDuration,
  lt as inertiaRest,
  Yt as inertiaValueAt,
  lr as inertiaVelocityAt,
  si as interpolateArray,
  ii as interpolateColor,
  mr as interpolateMotionPath,
  Y as interpolateNumber,
  ri as interpolatePathString,
  de as interpolateString,
  Wt as isCubicBezierEasing,
  W as isInertiaTrack,
  nr as isMotionPathPoint,
  Be as isMotionPathTrack,
  ut as isPathData,
  z as isSpringTrack,
  ct as isTextTrack,
  ar as isUnderdamped,
  Fr as isUnresolved,
  kr as isVideoExportSupported,
  at as isWebCodecsMP4Supported,
  qi as isWebPExportSupported,
  Re as linear,
  ft as live,
  Di as lzwEncode,
  be as mapEase,
  xn as maxStaggerDistance,
  ti as morphPath,
  Vi as muxMP4,
  wt as naturalRest,
  Ce as parseEdge,
  st as parsePath,
  Ks as parseTrigger,
  Oi as parseWebPBitstream,
  Wi as pickAVCCodec,
  Xr as play,
  Yr as playSequence,
  Nr as playWhenVisible,
  qe as pointAtDistance,
  Ji as pointsToPath,
  Ri as quantizeImage,
  Ur as quickPlay,
  sn as randomBetween,
  Lr as randomChoice,
  Zi as randomSnapped,
  Qi as resolveSequence,
  an as resolveValue,
  Zs as scrollProgress,
  Vr as scrubOnScroll,
  gi as serializeTimeline,
  pi as serializeTrack,
  jr as set,
  Gt as shapeToPathData,
  ai as simplifyKeyframes,
  Js as smoothToward,
  Ds as snapAxis,
  or as springDuration,
  rr as springValueAt,
  $r as spriteFrameTimes,
  _r as spriteSheetLayout,
  Br as spriteSheetMeta,
  Ie as staggerDistance,
  Le as staggerOffset,
  Mn as staggerOffsets,
  Mt as staggerSpan,
  Gs as syncMediaElement,
  di as textAt,
  Wr as tf,
  Kr as timeline,
  zr as to,
  gr as toJSON,
  pr as toKeyframedTrack,
  Ge as toKeyframedTracks,
  V as trackTargets,
  $e as triggerDistance
};
