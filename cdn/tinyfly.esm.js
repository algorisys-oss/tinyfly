function Si(e) {
  return typeof e == "object" && e !== null && e.type === "cubic-bezier";
}
function se(e) {
  return typeof e == "object" && e !== null && e.type !== "cubic-bezier";
}
const ie = 1;
function rn(e) {
  return e.property === "text" && "textConfig" in e;
}
function ft(e) {
  return e.kind === "inertia" && "inertia" in e;
}
function dt(e) {
  return e.kind === "spring" && "spring" in e;
}
function bs(e) {
  return e.property === "motionPath" && "motionPathConfig" in e;
}
function nc(e) {
  return typeof e == "object" && e !== null && "x" in e && "y" in e && "angle" in e;
}
function Ai(e) {
  return "keyframes" in e;
}
class sc {
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
class ic {
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
function ws(e, t, n = "start") {
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
function vs(e, t = "start") {
  if (e <= 1) return 0;
  let n = 0;
  for (let s = 0; s < e; s++)
    n = Math.max(n, ws(s, e, t));
  return n;
}
function on(e, t, n) {
  if (n.offsets) return n.offsets[e] ?? 0;
  const s = n.from ?? "start", i = ws(e, t, s);
  if (n.amount !== void 0) {
    const r = vs(t, s);
    return r === 0 ? 0 : n.amount * i / r;
  }
  return n.each !== void 0 ? n.each * i : 0;
}
function Ye(e, t) {
  return Array.from({ length: e }, (n, s) => on(s, e, t));
}
function pe(e, t) {
  return e <= 1 ? 0 : Math.max(...Ye(e, t));
}
const It = 1, xs = 6e4, Ht = xs / It, U = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, ve = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class me {
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
    this.from = t.from, this.to = t.to, this.stiffness = t.stiffness ?? U.stiffness, this.damping = t.damping ?? U.damping, this.mass = t.mass ?? U.mass, this.restDelta = t.restDelta ?? U.restDelta, this.restSpeed = t.restSpeed ?? U.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = t.velocity ?? U.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = Math.floor(t / It);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const s = this.samples[Math.min(n, this.samples.length - 1)], i = this.samples[Math.min(n + 1, this.samples.length - 1)], r = t / It - n;
    return s + (i - s) * r;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(Ht + 1), this.settledStep !== null ? this.settledStep * It : xs;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(t) {
    if (this.settledStep !== null) return;
    const n = Math.min(t, Ht + 1), s = It / 1e3;
    for (; this.samples.length < n; ) {
      const i = this.samples[this.samples.length - 1], r = i - this.to, o = -this.stiffness * r, a = -this.damping * this.velocity, l = (o + a) / this.mass;
      this.velocity += l * s;
      const c = i + this.velocity * s;
      if (this.samples.push(c), this.isAtRest(c)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > Ht && (this.settledStep = Ht);
  }
}
function rc(e, t) {
  return new me(e).valueAt(t);
}
function Ei(e) {
  return new me(e).settleTime();
}
function oc(e) {
  const t = e.stiffness ?? U.stiffness, n = e.damping ?? U.damping, s = e.mass ?? U.mass;
  return n < 2 * Math.sqrt(t * s);
}
function ac(e) {
  const t = e.stiffness ?? U.stiffness, n = e.mass ?? U.mass;
  return 2 * Math.sqrt(t * n);
}
const gn = 4, Pi = 2e-3, _i = 1e-4, Ci = 6e4;
function ge(e) {
  const t = e.friction ?? gn;
  return t > 0 ? t : gn;
}
function re(e) {
  return e.from + e.velocity / ge(e);
}
function Ii(e, t) {
  if (t === void 0) return e;
  if (typeof t == "number")
    return t > 0 ? Math.round(e / t) * t : e;
  if (t.length === 0) return e;
  let n = t[0];
  for (const s of t)
    Math.abs(s - e) < Math.abs(n - e) && (n = s);
  return n;
}
function Yt(e) {
  let t = Ii(re(e), e.end);
  return e.min !== void 0 && (t = Math.max(e.min, t)), e.max !== void 0 && (t = Math.min(e.max, t)), t;
}
function Wt(e) {
  const t = Math.abs(Yt(e) - e.from);
  if (t === 0) return 0;
  const n = e.restDelta ?? Math.max(_i, t * Pi);
  if (n >= t) return 0;
  const s = Math.log(t / n) / ge(e);
  return Math.min(Ci, s * 1e3);
}
function We(e, t) {
  if (t <= 0) return e.from;
  const n = Yt(e);
  if (t >= Wt(e)) return n;
  const s = ge(e);
  return e.from + (n - e.from) * (1 - Math.exp(-s * t / 1e3));
}
function lc(e, t) {
  const n = ge(e), s = Yt(e);
  return t >= Wt(e) ? 0 : (s - e.from) * n * Math.exp(-n * Math.max(0, t) / 1e3);
}
const qe = (e) => e, $i = (e) => e * e, Ri = (e) => 1 - (1 - e) * (1 - e), Li = (e) => e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2, Ts = (e) => e * e * e, Ms = (e) => 1 - Math.pow(1 - e, 3), ye = (e) => e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2, Fi = Ts, Oi = Ms, Di = ye, Bi = {
  linear: qe,
  "ease-in": Fi,
  "ease-out": Oi,
  "ease-in-out": Di,
  "ease-in-quad": $i,
  "ease-out-quad": Ri,
  "ease-in-out-quad": Li,
  "ease-in-cubic": Ts,
  "ease-out-cubic": Ms,
  "ease-in-out-cubic": ye
};
function Ni(e) {
  const [t, n, s, i] = e, r = 3 * t, o = 3 * (s - t) - r, a = 1 - r - o, l = 3 * n, c = 3 * (i - n) - l, h = 1 - l - c, d = (m) => ((a * m + o) * m + r) * m, u = (m) => ((h * m + c) * m + l) * m, f = (m) => (3 * a * m + 2 * o) * m + r, p = (m) => {
    let g = m;
    for (let b = 0; b < 8; b++) {
      const x = d(g) - m;
      if (Math.abs(x) < 1e-7)
        return g;
      const v = f(g);
      if (Math.abs(v) < 1e-7)
        break;
      g -= x / v;
    }
    let y = 0, w = 1;
    for (g = m; y < w; ) {
      const b = d(g);
      if (Math.abs(b - m) < 1e-7)
        return g;
      m > b ? y = g : w = g, g = (y + w) / 2;
    }
    return g;
  };
  return (m) => {
    if (m <= 0) return 0;
    if (m >= 1) return 1;
    const g = p(m);
    return u(g);
  };
}
function xe(e, t = "out") {
  if (t === "out") return e;
  const n = (s) => 1 - e(1 - s);
  return t === "in" ? n : (s) => s < 0.5 ? n(s * 2) / 2 : e(s * 2 - 1) / 2 + 0.5;
}
function Yi(e = 1, t = 0.3) {
  const n = Math.max(1, e), s = t / (2 * Math.PI) * Math.asin(1 / n);
  return (i) => i <= 0 ? 0 : i >= 1 ? 1 : n * Math.pow(2, -10 * i) * Math.sin((i - s) * (2 * Math.PI) / t) + 1;
}
const Wi = (e) => {
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
function qi(e = 1.70158) {
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const n = t - 1;
    return n * n * ((e + 1) * n + e) + 1;
  };
}
function Xi(e, t = "end") {
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
function Hi(e) {
  switch (e.type) {
    case "steps":
      return Xi(e.count, e.position);
    case "elastic":
      return xe(Yi(e.amplitude, e.period), e.mode);
    case "bounce":
      return xe(Wi, e.mode);
    case "back":
      return xe(qi(e.overshoot), e.mode);
  }
}
function nt(e) {
  return e === void 0 ? qe : Si(e) ? Ni(e.points) : se(e) ? Hi(e) : Bi[e] ?? qe;
}
const yn = 32, Vi = 256, mt = /* @__PURE__ */ new Map(), Ui = /[MmLlHhVvCcSsQqTtAaZz]/, ji = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, zi = {
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
function Gi(e) {
  const t = [];
  let n = 0, s = null;
  const i = () => {
    for (; n < e.length && /[\s,]/.test(e[n]); ) n++;
  };
  for (; n < e.length && (i(), !(n >= e.length)); ) {
    const r = e[n];
    if (Ui.test(r)) {
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
    const l = ji.exec(e.slice(n));
    if (!l) break;
    s.args.push(parseFloat(l[0])), n += l[0].length;
  }
  return t;
}
function Ki(e, t, n, s, i, r, o, a, l) {
  if (e === a && t === l) return [];
  let c = Math.abs(n), h = Math.abs(s);
  if (c === 0 || h === 0) return [[e, t, a, l, a, l]];
  const d = i * Math.PI / 180, u = Math.cos(d), f = Math.sin(d), p = (e - a) / 2, m = (t - l) / 2, g = u * p + f * m, y = -f * p + u * m, w = g * g / (c * c) + y * y / (h * h);
  if (w > 1) {
    const L = Math.sqrt(w);
    c *= L, h *= L;
  }
  const b = r === o ? -1 : 1, x = c * c * h * h - c * c * y * y - h * h * g * g, v = c * c * y * y + h * h * g * g, T = b * Math.sqrt(Math.max(0, x / v)), k = T * c * y / h, _ = -T * h * g / c, $ = u * k - f * _ + (e + a) / 2, C = f * k + u * _ + (t + l) / 2, S = (L, O, F, W) => {
    const j = L * F + O * W, st = Math.sqrt((L * L + O * O) * (F * F + W * W)), ct = Math.acos(Math.max(-1, Math.min(1, j / st)));
    return L * W - O * F < 0 ? -ct : ct;
  }, A = S(1, 0, (g - k) / c, (y - _) / h);
  let M = S((g - k) / c, (y - _) / h, (-g - k) / c, (-y - _) / h);
  !o && M > 0 && (M -= 2 * Math.PI), o && M < 0 && (M += 2 * Math.PI);
  const P = Math.max(1, Math.ceil(Math.abs(M) / (Math.PI / 2))), E = M / P, I = 4 / 3 * Math.tan(E / 4), R = (L) => {
    const O = c * Math.cos(L), F = h * Math.sin(L);
    return [u * O - f * F + $, f * O + u * F + C];
  }, D = (L) => {
    const O = -c * Math.sin(L), F = h * Math.cos(L);
    return [u * O - f * F, f * O + u * F];
  }, B = [];
  for (let L = 0; L < P; L++) {
    const O = A + L * E, F = O + E, [W, j] = R(O), [st, ct] = L === P - 1 ? [a, l] : R(F), [Xt, St] = D(O), [we, ki] = D(F);
    B.push([W + I * Xt, j + I * St, st - I * we, ct - I * ki, st, ct]);
  }
  return B;
}
function at(e, t, n, s, i) {
  const r = 1 - i;
  return r * r * r * e + 3 * r * r * i * t + 3 * r * i * i * n + i * i * i * s;
}
function bn(e, t, n, s, i) {
  const r = 1 - i;
  return 3 * r * r * (t - e) + 6 * r * i * (n - t) + 3 * i * i * (s - n);
}
function At(e, t, n, s) {
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
function Vt(e, t, n) {
  const [s, i, r, o, a, l] = n, c = [0];
  let h = e, d = t, u = 0;
  for (let f = 1; f <= yn; f++) {
    const p = f / yn, m = at(e, s, r, a, p), g = at(t, i, o, l, p);
    u += Math.hypot(m - h, g - d), c.push(u), h = m, d = g;
  }
  return {
    subpath: 0,
    type: "C",
    points: [s, i, r, o, a, l],
    startX: e,
    startY: t,
    endX: a,
    endY: l,
    length: u,
    lengths: c
  };
}
function vt(e) {
  const t = mt.get(e);
  if (t) return t;
  const n = [];
  let s = 0, i = 0, r = 0, o = 0, a = null, l = null, c = -1;
  const h = /* @__PURE__ */ new Set(), d = (m) => {
    c < 0 && (c = 0), m.subpath = c, n.push(m);
  };
  for (const { type: m, args: g } of Gi(e)) {
    const y = m.toUpperCase(), w = m !== y, b = zi[y];
    if (y === "Z") {
      (s !== r || i !== o) && d(At(s, i, r, o)), c >= 0 && h.add(c), s = r, i = o, a = l = null;
      continue;
    }
    for (let x = 0; x + b <= g.length; x += b) {
      const v = g.slice(x, x + b), T = w ? s : 0, k = w ? i : 0;
      let _ = null, $ = null;
      switch (y) {
        case "M":
          x === 0 ? (s = v[0] + T, i = v[1] + k, r = s, o = i, (c < 0 || n[n.length - 1]?.subpath === c) && c++) : (d(At(s, i, v[0] + T, v[1] + k)), s = v[0] + T, i = v[1] + k);
          break;
        case "L":
          d(At(s, i, v[0] + T, v[1] + k)), s = v[0] + T, i = v[1] + k;
          break;
        case "H":
          d(At(s, i, v[0] + T, i)), s = v[0] + T;
          break;
        case "V":
          d(At(s, i, s, v[0] + k)), i = v[0] + k;
          break;
        case "C": {
          const C = [v[0] + T, v[1] + k, v[2] + T, v[3] + k, v[4] + T, v[5] + k];
          d(Vt(s, i, C)), _ = [C[2], C[3]], s = C[4], i = C[5];
          break;
        }
        case "S": {
          const [C, S] = a ? [2 * s - a[0], 2 * i - a[1]] : [s, i], A = [C, S, v[0] + T, v[1] + k, v[2] + T, v[3] + k];
          d(Vt(s, i, A)), _ = [A[2], A[3]], s = A[4], i = A[5];
          break;
        }
        case "Q":
        case "T": {
          let C = s, S = i;
          y === "Q" ? (C = v[0] + T, S = v[1] + k) : l && (C = 2 * s - l[0], S = 2 * i - l[1]);
          const A = y === "Q" ? v[2] + T : v[0] + T, M = y === "Q" ? v[3] + k : v[1] + k;
          d(
            Vt(s, i, [
              s + 2 / 3 * (C - s),
              i + 2 / 3 * (S - i),
              A + 2 / 3 * (C - A),
              M + 2 / 3 * (S - M),
              A,
              M
            ])
          ), $ = [C, S], s = A, i = M;
          break;
        }
        case "A": {
          const C = v[5] + T, S = v[6] + k;
          let A = s, M = i;
          for (const P of Ki(s, i, v[0], v[1], v[2], v[3], v[4], C, S))
            d(Vt(A, M, P)), A = P[4], M = P[5];
          s = C, i = S;
          break;
        }
      }
      a = _, l = $;
    }
  }
  const u = n.reduce((m, g) => m + g.length, 0), f = [];
  for (let m = 0; m < n.length; ) {
    const g = n[m].subpath;
    let y = m, w = 0;
    for (; y < n.length && n[y].subpath === g; ) w += n[y++].length;
    const b = n[m], x = n[y - 1], v = h.has(g) || Math.abs(x.endX - b.startX) < 1e-9 && Math.abs(x.endY - b.startY) < 1e-9;
    f.push({ start: m, end: y, length: w, closed: v }), m = y;
  }
  const p = { segments: n, totalLength: u, subpaths: f };
  return mt.size >= Vi && mt.delete(mt.keys().next().value), mt.set(e, p), p;
}
function Zi(e, t) {
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
function Ji(e, t) {
  if (e.type === "L") {
    const d = e.length > 0 ? Math.max(0, Math.min(1, t / e.length)) : 0;
    return {
      x: e.startX + (e.endX - e.startX) * d,
      y: e.startY + (e.endY - e.startY) * d,
      angle: Math.atan2(e.endY - e.startY, e.endX - e.startX) * 180 / Math.PI
    };
  }
  const [n, s, i, r, o, a] = e.points, l = Zi(e, t);
  let c = bn(e.startX, n, i, o, l), h = bn(e.startY, s, r, a, l);
  if (Math.hypot(c, h) < 1e-9) {
    const d = l < 0.5 ? Math.min(1, l + 1e-3) : Math.max(0, l - 1e-3), u = at(e.startX, n, i, o, d), f = at(e.startY, s, r, a, d), p = at(e.startX, n, i, o, l), m = at(e.startY, s, r, a, l);
    c = l < 0.5 ? u - p : p - u, h = l < 0.5 ? f - m : m - f;
  }
  return {
    x: at(e.startX, n, i, o, l),
    y: at(e.startY, s, r, a, l),
    angle: Math.atan2(h, c) * 180 / Math.PI
  };
}
function ks(e, t, n = 0, s = e.length) {
  if (s <= n) return { x: 0, y: 0, angle: 0 };
  let i = 0;
  for (let r = n; r < s; r++) {
    const o = e[r];
    if (i + o.length >= t || r === s - 1)
      return Ji(o, t - i);
    i += o.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function Qi(e, t) {
  const { segments: n, totalLength: s } = vt(e);
  return ks(n, Math.max(0, Math.min(1, t)) * s);
}
function cc() {
  mt.clear();
}
function hc(e) {
  return vt(e).totalLength;
}
const tr = 24, er = 320, nr = 2.5, Et = 72, uc = 64, sr = 0.2, ir = 128, $t = /* @__PURE__ */ new Map();
let Qt = 0, ot;
const wn = (e) => Math.round(e * 100) / 100;
function vn(e, t) {
  const { segments: n, subpaths: s, totalLength: i } = vt(e);
  if (n.length === 0) return [];
  if (t) {
    const r = s.every((o) => o.closed);
    return [{ segments: n, start: 0, end: n.length, length: i, closed: r }];
  }
  return s.filter((r) => r.length > 0).map((r) => ({ segments: n, start: r.start, end: r.end, length: r.length, closed: r.closed }));
}
function Xe(e, t) {
  const n = e.closed ? (t % 1 + 1) % 1 : Math.max(0, Math.min(1, t)), s = ks(e.segments, n * e.length, e.start, e.end);
  return [s.x, s.y];
}
function xn(e) {
  const t = [];
  let n = 0;
  for (let s = e.start; s < e.end; s++)
    n += e.segments[s].length, e.length > 0 && t.push(n / e.length);
  return t;
}
function Tn(e, t) {
  const n = [];
  for (let s = 0; s < t; s++)
    n.push(Xe(e, e.closed ? s / t : s / (t - 1)));
  return n;
}
function Mn(e) {
  let t = 0, n = 0;
  for (const [s, i] of e)
    t += s, n += i;
  return t /= e.length, n /= e.length, e.map(([s, i]) => [s - t, i - n]);
}
function rr(e, t, n) {
  const s = e.closed && t.closed;
  if (n !== void 0)
    return { offset: s ? Math.abs(n) % Et / Et : 0, reversed: n < 0 };
  const i = Mn(Tn(e, Et)), r = Mn(Tn(t, Et)), o = Et;
  let a = { offset: 0, reversed: !1 }, l = 1 / 0;
  for (const c of [!1, !0]) {
    const h = s ? o : 1;
    for (let d = 0; d < h; d++) {
      let u = 0;
      for (let f = 0; f < o && u < l; f++) {
        const p = s ? c ? (d - f + o) % o : (f + d) % o : c ? o - 1 - f : f, m = i[f][0] - r[p][0], g = i[f][1] - r[p][1];
        u += m * m + g * g;
      }
      u < l && (l = u, a = { offset: s ? d / o : 0, reversed: c });
    }
  }
  return a;
}
function or(e, t, n) {
  return n ? ((t.reversed ? t.offset - e : e + t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function ar(e, t, n) {
  return n ? ((t.reversed ? t.offset - e : e - t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function lr(e, t, n) {
  const s = e.closed && t.closed, i = rr(e, t, n.shapeIndex), r = Math.max(
    tr,
    Math.min(er, Math.ceil(Math.max(e.length, t.length) / nr))
  ), o = /* @__PURE__ */ new Set(), a = (d) => o.add(Math.round(d * 1e7) / 1e7);
  for (let d = 0; d <= r; d++) a(d / r);
  for (const d of xn(e)) a(d);
  for (const d of xn(t)) a(ar(d, i, s));
  let l = [...o].sort((d, u) => d - u);
  s && (l = l.filter((d) => d < 1));
  const c = [], h = [];
  for (const d of l)
    c.push(...Xe(e, d)), h.push(...Xe(t, or(d, i, s)));
  return cr({ from: c, to: h, closed: s });
}
function cr(e) {
  const t = e.from.length / 2;
  if (t <= 3) return e;
  const n = new Uint8Array(t);
  n[0] = 1, n[t - 1] = 1;
  const s = [[0, t - 1]];
  for (; s.length > 0; ) {
    const [o, a] = s.pop();
    let l = -1, c = sr;
    for (let h = o + 1; h < a; h++) {
      const d = Math.max(kn(e.from, o, a, h), kn(e.to, o, a, h));
      d > c && (c = d, l = h);
    }
    l !== -1 && (n[l] = 1, s.push([o, l], [l, a]));
  }
  const i = [], r = [];
  for (let o = 0; o < t; o++)
    n[o] && (i.push(e.from[o * 2], e.from[o * 2 + 1]), r.push(e.to[o * 2], e.to[o * 2 + 1]));
  return { from: i, to: r, closed: e.closed };
}
function kn(e, t, n, s) {
  const i = e[t * 2], r = e[t * 2 + 1], o = e[n * 2] - i, a = e[n * 2 + 1] - r, l = e[s * 2] - i, c = e[s * 2 + 1] - r, h = o * o + a * a, d = h === 0 ? 0 : Math.max(0, Math.min(1, (l * o + c * a) / h));
  return Math.hypot(l - d * o, c - d * a);
}
function hr(e, t, n) {
  const s = n.shapeIndex;
  if (ot && ot.from === e && ot.to === t && ot.shapeIndex === s) return ot.plan;
  const r = $t.get(String(s ?? "auto"))?.get(e)?.get(t);
  if (r)
    return ot = { from: e, to: t, shapeIndex: s, plan: r }, r;
  const o = vt(e).subpaths.filter((f) => f.length > 0).length === vt(t).subpaths.filter((f) => f.length > 0).length, a = vn(e, !o), l = vn(t, !o), c = {
    pairs: a.map((f, p) => lr(f, l[p], n))
  };
  Qt >= ir && ($t.clear(), Qt = 0);
  const h = String(s ?? "auto"), d = $t.get(h) ?? /* @__PURE__ */ new Map();
  $t.set(h, d);
  const u = d.get(e) ?? /* @__PURE__ */ new Map();
  return d.set(e, u), u.set(t, c), Qt++, ot = { from: e, to: t, shapeIndex: s, plan: c }, c;
}
function ur(e, t, n, s = {}) {
  if (!e) return t;
  if (!t) return e;
  const i = Math.max(0, Math.min(1, n));
  if (i === 0) return e;
  if (i === 1) return t;
  const r = hr(e, t, s);
  if (r.pairs.length === 0) return i < 0.5 ? e : t;
  let o = "";
  for (const a of r.pairs) {
    for (let l = 0; l < a.from.length; l += 2) {
      const c = wn(a.from[l] + (a.to[l] - a.from[l]) * i), h = wn(a.from[l + 1] + (a.to[l + 1] - a.from[l + 1]) * i);
      o += `${l === 0 ? o ? " M" : "M" : " L"}${c} ${h}`;
    }
    a.closed && (o += " Z");
  }
  return o;
}
function fc() {
  $t.clear(), Qt = 0, ot = void 0;
}
function qt(e) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(e);
}
const J = (e, t, n) => e + (t - e) * n, Ss = 512, Te = /* @__PURE__ */ new Map(), Me = /* @__PURE__ */ new Map();
function Sn(e) {
  const t = Te.get(e);
  if (t) return t;
  const n = e.replace("#", ""), s = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return Te.size < Ss && Te.set(e, s), s;
}
const An = (e) => e.charCodeAt(0) === 35, En = (e) => e.startsWith("rgb"), Pn = (e) => e.startsWith("rgba"), fr = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, ke = (e) => Math.round(e).toString(16).padStart(2, "0");
function dr(e, t, n) {
  return `#${ke(e)}${ke(t)}${ke(n)}`;
}
function _n(e) {
  const t = Me.get(e);
  if (t) return t;
  const n = e.match(fr);
  if (!n)
    throw new Error(`Invalid rgb color: ${e}`);
  const s = parseInt(n[1], 10), i = parseInt(n[2], 10), r = parseInt(n[3], 10), o = n[4] !== void 0 ? [s, i, r, parseFloat(n[4])] : [s, i, r];
  return Me.size < Ss && Me.set(e, o), o;
}
const pr = (e, t, n) => {
  if (An(e) && An(t)) {
    const [s, i, r] = Sn(e), [o, a, l] = Sn(t), c = J(s, o, n), h = J(i, a, n), d = J(r, l, n);
    return dr(c, h, d);
  }
  if ((En(e) || Pn(e)) && (En(t) || Pn(t))) {
    const s = _n(e), i = _n(t), r = Math.round(J(s[0], i[0], n)), o = Math.round(J(s[1], i[1], n)), a = Math.round(J(s[2], i[2], n));
    if (s.length === 4 || i.length === 4) {
      const l = s[3] ?? 1, c = i[3] ?? 1, h = J(l, c, n);
      return `rgba(${r}, ${o}, ${a}, ${h})`;
    }
    return `rgb(${r}, ${o}, ${a})`;
  }
  return n < 1 ? e : t;
}, mr = (e, t, n) => {
  const s = Math.min(e.length, t.length), i = [];
  for (let r = 0; r < s; r++)
    i.push(J(e[r], t[r], n));
  return i;
}, Cn = (e, t, n) => n < 1 ? e : t, gr = (e, t, n) => ur(e, t, n);
function oe(e) {
  return typeof e == "number" ? J : Array.isArray(e) ? mr : typeof e == "string" ? e.startsWith("#") || e.startsWith("rgb") ? pr : qt(e) ? gr : Cn : Cn;
}
const As = 1e3 / 60;
function Es(e, t = {}) {
  if (!dt(e))
    throw new Error(`bakeSpringTrack: track "${e.id}" is not a spring track`);
  const n = new me(e.spring);
  return _s(e, (s) => n.valueAt(s), n.settleTime(), e.spring.from, e.spring.to, t);
}
function Ps(e, t = {}) {
  if (!ft(e))
    throw new Error(`bakeInertiaTrack: track "${e.id}" is not an inertia track`);
  const n = e.inertia;
  return _s(
    e,
    (s) => We(n, s),
    Wt(n),
    n.from,
    Yt(n),
    t
  );
}
function _s(e, t, n, s, i, r) {
  const o = r.intervalMs ?? As, a = r.tolerance ?? 0.01, l = e.delay ?? 0, c = [];
  for (let d = 0; d <= n; d += o)
    c.push({ time: d + l, value: t(d), easing: "linear" });
  const h = c[c.length - 1];
  return !h || h.time < n + l ? c.push({ time: n + l, value: i, easing: "linear" }) : h.value = i, l > 0 && c.unshift({ time: 0, value: s, easing: "linear" }), {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: a > 0 ? br(c, a) : c,
    ...e.targets && { targets: [...e.targets] },
    ...e.stagger && { stagger: { ...e.stagger } }
  };
}
function Cs(e, t, n, s = {}) {
  const i = s.intervalMs ?? As, r = typeof n == "function" ? n : nt(n), o = oe(e.value), a = t.time - e.time;
  if (a <= 0) return [t];
  const l = [];
  for (let h = i; h < a; h += i) {
    const d = h / a;
    l.push({
      time: e.time + h,
      value: o(e.value, t.value, r(d)),
      easing: "linear"
    });
  }
  const c = r(1);
  return l.push({ ...t, ...c !== 1 && { value: o(e.value, t.value, c) }, easing: "linear" }), l;
}
function dc(e, t) {
  return dt(e) ? Es(e, t) : ft(e) ? Ps(e, t) : e;
}
function yr(e, t = {}) {
  const n = e.keyframes;
  if (!n.some((i) => se(i.easing))) return e;
  const s = n.length > 0 ? [n[0]] : [];
  for (let i = 1; i < n.length; i++) {
    const r = n[i];
    se(r.easing) ? s.push(...Cs(n[i - 1], r, r.easing, t)) : s.push(r);
  }
  return { ...e, keyframes: s };
}
function pc(e, t) {
  return e.filter(Ai).map((n) => yr(n, t)).concat(
    e.filter(dt).map((n) => Es(n, t)),
    e.filter(ft).map((n) => Ps(n, t))
  );
}
function br(e, t) {
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
function He(e) {
  const t = [...e.keyframes].sort((n, s) => n.time - s.time);
  return {
    ...e,
    keyframes: t
  };
}
function ht(e) {
  return e.targets && e.targets.length > 0 ? e.targets : [e.target];
}
function xt(e, t, n, s) {
  const i = n ?? 0;
  return !s || t <= 1 ? i : i + on(e, t, s);
}
class Se {
  track;
  targets;
  constructor(t) {
    this.track = t, this.targets = ht(t);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(t) {
    return this.valueForOffset(t - xt(0, this.targets.length, this.track.delay, this.track.stagger));
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
      const r = xt(i, n, this.track.delay, this.track.stagger), o = this.valueForOffset(t - r);
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
    const n = t[t.length - 1].time, s = this.track.stagger ? pe(this.targets.length, this.track.stagger) : 0;
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
    const r = i.time - s.time, o = (t - s.time) / r, l = nt(i.easing)(o);
    return oe(s.value)(s.value, i.value, l);
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
class wr {
  track;
  targets;
  sampler;
  constructor(t) {
    this.track = t, this.targets = ht(t), this.sampler = new me(t.spring);
  }
  getValueAtTime(t) {
    return this.sampler.valueAt(t - xt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const r = xt(i, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[i], value: this.sampler.valueAt(t - r), start: r });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? pe(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
class vr {
  track;
  targets;
  duration;
  constructor(t) {
    this.track = t, this.targets = ht(t), this.duration = Wt(t.inertia);
  }
  getValueAtTime(t) {
    return We(this.track.inertia, t - xt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const r = xt(i, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[i], value: We(this.track.inertia, t - r), start: r });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? pe(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
function Is(e, t) {
  const n = { ...Qi(e.pathData, t) };
  if (e.matrix) {
    const [s, i, r, o, a, l] = e.matrix, { x: c, y: h } = n;
    n.x = s * c + r * h + a, n.y = i * c + o * h + l;
    const d = n.angle * Math.PI / 180, u = Math.cos(d), f = Math.sin(d);
    n.angle = Math.atan2(i * u + o * f, s * u + r * f) * 180 / Math.PI;
  }
  return e.autoRotate && e.rotateOffset && (n.angle += e.rotateOffset), n;
}
function mc(e, t, n, s) {
  const i = t + (n - t) * s;
  return Is(e, i);
}
const Ae = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, xr = 20;
function Tr(e) {
  const t = Ae[e ?? "upperCase"] ?? e ?? Ae.upperCase, n = Array.from(t);
  return n.length > 0 ? n : Array.from(Ae.upperCase);
}
function Mr(e, t, n) {
  let s = (e | 0) ^ Math.imul(t + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return s = Math.imul(s ^ s >>> 16, 2146121005), s = Math.imul(s ^ s >>> 15, 2221713035), (s ^ s >>> 16) >>> 0;
}
function kr(e, t, n = 0) {
  const s = e.from ?? "", i = e.to, r = Math.max(0, Math.min(1, t));
  if (r <= 0) return s;
  if (r >= 1) return i;
  const o = Array.from(s), a = Array.from(i), l = e.rightToLeft ?? !1;
  if (e.mode === "type") {
    const w = Math.round(r * Math.max(o.length, a.length));
    return l ? o.slice(0, Math.max(0, o.length - w)).join("") + a.slice(Math.max(0, a.length - w)).join("") : a.slice(0, w).join("") + o.slice(w).join("");
  }
  const c = Math.max(0, Math.min(0.999, e.revealDelay ?? 0)), h = Math.max(0, (r - c) / (1 - c)), d = Math.floor(h * a.length), u = e.tweenLength === !1 ? a.length : Math.round(o.length + (a.length - o.length) * r), f = Tr(e.chars), p = e.refreshRate ?? xr, m = p > 0 ? Math.floor(n * p / 1e3) : 0, g = e.seed ?? 1;
  let y = "";
  for (let w = 0; w < u; w++) {
    const b = l ? w >= u - d : w < d, x = l ? a[a.length - (u - w)] : a[w];
    b && x !== void 0 || x === " " || x === `
` ? y += x : y += f[Mr(g, w, m) % f.length];
  }
  return y;
}
class $s {
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
        const h = `${a}\0${o}`, d = c <= t, u = s.get(h);
        (!u || (d !== u.started ? d : d ? c >= u.start : c <= u.start)) && s.set(h, { trackId: i, target: a, property: o, value: l, start: c, started: d });
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
      a.set("text", kr(l.textConfig, r, Math.max(0, o)));
      return;
    }
    const c = this._motionPathTracks.get(n);
    if (c && typeof r == "number") {
      const h = Is(c.motionPathConfig, r);
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
        for (const s of ht(n)) {
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
    if (this._tracks.push(t), this._sharedWrites = null, ft(t)) {
      this._trackPlayers.set(t.id, new vr(t));
      return;
    }
    if (dt(t)) {
      this._trackPlayers.set(t.id, new wr(t)), this._springTracks.set(t.id, t);
      return;
    }
    if (rn(t))
      this._trackPlayers.set(t.id, new Se(t)), this._textTracks.set(t.id, t);
    else if (bs(t)) {
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
      this._trackPlayers.set(t.id, new Se(n)), this._motionPathTracks.set(t.id, t);
    } else
      this._trackPlayers.set(t.id, new Se(t));
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
    if (dt(s) || ft(s))
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
          const a = ht(o).filter((d) => ht(s).includes(d));
          if (a.length === 0) continue;
          const l = this.getTrackSpan(o.id);
          if (!l || !(l.from <= i.to && i.from <= l.to)) continue;
          const h = i.from >= l.from;
          for (const d of a)
            t.push({
              target: d,
              property: s.property,
              losingTrackId: h ? o.id : s.id,
              winningTrackId: h ? s.id : o.id
            });
        }
    }
    return t;
  }
  _matches(t, n) {
    if (n.id !== void 0 && t.id !== n.id || n.property !== void 0 && t.property !== n.property || n.target !== void 0 && !ht(t).includes(n.target)) return !1;
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
      formatVersion: ie,
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
const Sr = 100;
function Rs(e, t, n, s) {
  const i = [], r = [], { duration: o, alternate: a } = s, l = (f, p, m, g) => {
    r.push([f, p]);
    const y = [];
    e.forEach((w, b) => {
      (m === "forward" ? (g ? w >= f : w > f) && w <= p : (g ? w <= f : w < f) && w >= p) && y.push(b);
    }), y.sort((w, b) => (m === "forward" ? e[w] - e[b] : e[b] - e[w]) || w - b);
    for (const w of y) i.push({ kind: "event", index: w, direction: m });
  };
  let c = t.time, h = t.direction, d = t.fresh === !0;
  const u = Math.min(Sr, Math.max(0, n.iteration - t.iteration));
  for (let f = 0; f < u; f++) {
    const p = h === "forward" ? o : 0;
    l(c, p, h, d), i.push({ kind: "repeat" }), a ? (h = h === "forward" ? "reverse" : "forward", c = p, d = !1) : (c = h === "forward" ? 0 : o, d = !0);
  }
  return u > 0 && s.holding && !a ? { crossings: i, passes: r } : (l(c, n.time, h, d), { crossings: i, passes: r });
}
function Ar(e) {
  return ft(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "inertia",
    inertia: Ls(e.inertia),
    ...K(e)
  } : dt(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "spring",
    spring: { ...e.spring },
    ...K(e)
  } : rn(e) ? {
    id: e.id,
    target: e.target,
    property: "text",
    textConfig: { ...e.textConfig },
    keyframes: e.keyframes.map(Ee),
    ...K(e)
  } : bs(e) ? {
    id: e.id,
    target: e.target,
    property: "motionPath",
    motionPathConfig: { ...e.motionPathConfig },
    keyframes: e.keyframes.map(Ee),
    ...K(e)
  } : {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes.map(Ee),
    ...K(e)
  };
}
function Ls(e) {
  return { ...e, ...Array.isArray(e.end) && { end: [...e.end] } };
}
function Ee(e) {
  return {
    time: e.time,
    value: e.value,
    ...e.easing && { easing: e.easing }
  };
}
function K(e) {
  const t = e.endDelay;
  return {
    ...e.delay !== void 0 && { delay: e.delay },
    ...t !== void 0 && { endDelay: t },
    ...e.targets !== void 0 && { targets: [...e.targets] },
    ...e.stagger !== void 0 && { stagger: { ...e.stagger } }
  };
}
function Er(e) {
  if (ft(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "inertia",
      inertia: Ls(t.inertia),
      ...K(t)
    };
  }
  if (dt(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "spring",
      spring: { ...t.spring },
      ...K(t)
    };
  }
  if (rn(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: "text",
      textConfig: { ...t.textConfig },
      keyframes: [...t.keyframes].sort((n, s) => n.time - s.time),
      ...K(t)
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
      ...K(t)
    };
  }
  return He({
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes,
    ...K(e)
  });
}
function Pr(e) {
  const t = e._config.markers;
  return {
    formatVersion: ie,
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
    tracks: e.tracks.map(Ar),
    ...e.captions && { captions: JSON.parse(JSON.stringify(e.captions)) }
  };
}
function Dt(e) {
  const t = e.formatVersion ?? 1;
  if (t > ie)
    throw new Error(
      `tinyfly: this animation uses format version ${t}, but this tinyfly reads up to version ${ie}. Update tinyfly to play it.`
    );
  return new $s({
    id: e.id,
    name: e.name,
    config: e.config,
    tracks: e.tracks.map(Er),
    captions: e.captions
  });
}
function gc(e) {
  return JSON.stringify(Pr(e));
}
function yc(e) {
  const t = JSON.parse(e);
  return Dt(t);
}
function Fs(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++)
    t ^= e.charCodeAt(n), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function an(e) {
  let t = e >>> 0 || 2654435769;
  return {
    seed: e >>> 0,
    next() {
      return t ^= t << 13, t >>>= 0, t ^= t >> 17, t ^= t << 5, t >>>= 0, t / 4294967296;
    }
  };
}
function Os(e, t, n) {
  return t + e.next() * (n - t);
}
function _r(e, t, n, s) {
  if (s <= 0) return Os(e, t, n);
  const i = Math.floor((n - t) / s), r = Math.round(e.next() * i);
  return t + r * s;
}
function bc(e, t) {
  if (t.length !== 0)
    return t[Math.floor(e.next() * t.length)];
}
const Ds = /^([+\-*/])=\s*(-?[\d.]+)$/, Bs = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function wc(e) {
  return typeof e != "string" ? !1 : Ds.test(e.trim()) || Bs.test(e.trim());
}
function Ns(e, t = {}) {
  if (typeof e != "string") return e;
  const n = e.trim(), s = Ds.exec(n);
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
  const i = Bs.exec(n);
  if (i) {
    if (!t.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const r = Number.parseFloat(i[1]), o = Number.parseFloat(i[2]), a = i[3] !== void 0 ? Number.parseFloat(i[3]) : void 0;
    return a !== void 0 ? _r(t.random, r, o, a) : Os(t.random, r, o);
  }
  return e;
}
function Cr(e, t = 0, n) {
  const s = [];
  let i = t;
  for (const r of e) {
    const o = Ns(r, { base: i, random: n });
    s.push(o), typeof o == "number" && (i = o);
  }
  return s;
}
class vc {
  random;
  constructor(t) {
    this.random = an(t);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(t, n = 0) {
    return Ns(t, { base: n, random: this.random });
  }
  resolveSequence(t, n = 0) {
    return Cr(t, n, this.random);
  }
}
const Ir = 600;
function $r(e) {
  if (Array.isArray(e)) {
    const [u, f, p, m] = e;
    return { fn: In(u, f, p, m), bezier: [u, f, p, m] };
  }
  const { segments: t } = vt(e);
  if (t.length === 0) throw new Error(`customEase: no curve in "${e}"`);
  const n = t[0].startX, s = t[0].startY, i = t[t.length - 1], r = i.endX - n, o = i.endY - s;
  if (r === 0 || o === 0) throw new Error(`customEase: "${e}" must move along both axes`);
  const a = (u) => (u - n) / r, l = (u) => (u - s) / o;
  if (t.length === 1 && i.type === "C") {
    const [u, f, p, m] = i.points, g = [a(u), l(f), a(p), l(m)];
    return { fn: In(...g), bezier: g };
  }
  const c = [], h = [], d = Math.max(8, Math.ceil(Ir / t.length));
  for (const u of t)
    for (let f = c.length === 0 ? 0 : 1; f <= d; f++) {
      const [p, m] = Fr(u, f / d);
      c.push(a(p)), h.push(l(m));
    }
  return { fn: Or(c, h) };
}
function Rr(e = {}) {
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
function Lr(e = {}) {
  const t = Math.max(1, e.wiggles ?? 10), n = e.type ?? "easeOut", s = (i) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * i) : (1 - i) ** 2;
  return (i) => i <= 0 || i >= 1 ? 0 : Math.sin(i * t * Math.PI * 2) * s(i);
}
function Fr(e, t) {
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
function Or(e, t) {
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
function In(e, t, n, s) {
  const i = (o, a, l) => 3 * (1 - o) * (1 - o) * o * a + 3 * (1 - o) * o * o * l + o * o * o, r = (o, a, l) => 3 * (1 - o) * (1 - o) * a + 6 * (1 - o) * o * (l - a) + 3 * o * o * (1 - l);
  return (o) => {
    if (o <= 0) return 0;
    if (o >= 1) return 1;
    let a = o;
    for (let h = 0; h < 8; h++) {
      const d = i(a, e, n) - o, u = r(a, e, n);
      if (Math.abs(d) < 1e-6) return i(a, t, s);
      if (Math.abs(u) < 1e-6) break;
      a -= d / u;
    }
    let l = 0, c = 1;
    a = o;
    for (let h = 0; h < 40; h++)
      i(a, e, n) < o ? l = a : c = a, a = (l + c) / 2;
    return i(a, t, s);
  };
}
const Dr = 350, Br = 300, Nr = 550;
function xc(e, t = {}) {
  const n = t.lead ?? Dr, s = t.gap ?? Br, i = t.tail ?? Nr, r = [];
  let o = 0;
  return e.forEach((a, l) => {
    const c = [];
    let h = o + n;
    a.lines.forEach((u, f) => {
      if (!(u.duration >= 0))
        throw new Error(`narration: scene ${l} line ${f} has an invalid duration (${u.duration})`);
      f > 0 && (h += s), c.push({
        id: u.id ?? `s${l}-l${f}`,
        scene: l,
        line: f,
        start: h,
        end: h + u.duration,
        text: u.text
      }), h += u.duration;
    });
    const d = h + i + (a.tail ?? 0);
    r.push({ id: a.id ?? `s${l}`, start: o, duration: d - o, cues: c }), o = d;
  }), { duration: o, scenes: r, cues: r.flatMap((a) => a.cues) };
}
function Tc(e) {
  return e.cues.map((t) => ({ id: t.id, time: t.start, label: t.text }));
}
function Mc(e, t) {
  let n = e.scenes[0];
  for (const s of e.scenes)
    if (t >= s.start) n = s;
    else break;
  return n;
}
const z = (e) => Math.round(e * 1e3) / 1e3;
function Yr(e, t = {}) {
  if (e.length === 0) return "";
  const n = t.curviness ?? 1, s = t.closed ?? !1, i = e.length;
  let r = `M${z(e[0].x)} ${z(e[0].y)}`;
  if (i === 1) return r;
  const o = (l) => s ? e[(l % i + i) % i] : e[Math.max(0, Math.min(i - 1, l))], a = s ? i : i - 1;
  for (let l = 0; l < a; l++) {
    const c = o(l - 1), h = o(l), d = o(l + 1), u = o(l + 2);
    if (n === 0) {
      r += ` L${z(d.x)} ${z(d.y)}`;
      continue;
    }
    const f = n / 6, p = h.x + (d.x - c.x) * f, m = h.y + (d.y - c.y) * f, g = d.x - (u.x - h.x) * f, y = d.y - (u.y - h.y) * f;
    r += ` C${z(p)} ${z(m)} ${z(g)} ${z(y)} ${z(d.x)} ${z(d.y)}`;
  }
  return s ? `${r} Z` : r;
}
const N = (e, t = 0) => {
  const n = parseFloat(e ?? "");
  return Number.isFinite(n) ? n : t;
};
function Wr(e) {
  const t = (e ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let s = 0; s + 1 < t.length; s += 2) n.push({ x: t[s], y: t[s + 1] });
  return n;
}
function ln(e) {
  const t = e.attributes;
  switch (e.tag.toLowerCase()) {
    case "path":
      return t.d ?? null;
    case "circle":
    case "ellipse": {
      const n = N(t.cx), s = N(t.cy), i = e.tag.toLowerCase() === "circle" ? N(t.r) : N(t.rx), r = e.tag.toLowerCase() === "circle" ? N(t.r) : N(t.ry);
      return `M${n + i} ${s} A${i} ${r} 0 1 1 ${n - i} ${s} A${i} ${r} 0 1 1 ${n + i} ${s} Z`;
    }
    case "rect": {
      const n = N(t.x), s = N(t.y), i = N(t.width), r = N(t.height);
      let o = t.rx != null ? N(t.rx) : t.ry != null ? N(t.ry) : 0, a = t.ry != null ? N(t.ry) : o;
      return o = Math.min(o, i / 2), a = Math.min(a, r / 2), o === 0 || a === 0 ? `M${n} ${s} H${n + i} V${s + r} H${n} Z` : `M${n + o} ${s} H${n + i - o} A${o} ${a} 0 0 1 ${n + i} ${s + a} V${s + r - a} A${o} ${a} 0 0 1 ${n + i - o} ${s + r} H${n + o} A${o} ${a} 0 0 1 ${n} ${s + r - a} V${s + a} A${o} ${a} 0 0 1 ${n + o} ${s} Z`;
    }
    case "line":
      return `M${N(t.x1)} ${N(t.y1)} L${N(t.x2)} ${N(t.y2)}`;
    case "polyline":
    case "polygon": {
      const n = Wr(t.points);
      if (n.length === 0) return null;
      const s = n.map((i, r) => `${r === 0 ? "M" : "L"}${i.x} ${i.y}`).join(" ");
      return e.tag.toLowerCase() === "polygon" ? `${s} Z` : s;
    }
    default:
      return null;
  }
}
const Ut = {
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
}, $n = {
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
function qr(e) {
  let t = e.trim().toLowerCase();
  t = t.replace(/\.ease(in|out|inout)$/, ".$1");
  const n = /^([a-z]+\d?)(\(.*\))?$/.exec(t);
  return n && n[1] !== "steps" && t !== "none" && t !== "linear" && (t = `${n[1]}.out${n[2] ?? ""}`), t;
}
nt({ type: "bounce", mode: "in" });
nt({ type: "bounce", mode: "in-out" });
function ae(e) {
  const t = Ys.get(e.trim().toLowerCase());
  if (t) return t;
  const n = qr(e), s = /^steps\(\s*(\d+)\s*\)$/.exec(n);
  if (s) {
    const o = { type: "steps", count: Math.max(1, Number.parseInt(s[1], 10)) + 1, position: "none" };
    return { easing: o, fn: nt(o) };
  }
  const i = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(n);
  if (i) {
    const [, r, o, a] = i, l = (a ?? "").split(",").map((d) => Number.parseFloat(d)).filter((d) => Number.isFinite(d)), c = o === "inout" ? "in-out" : o;
    if (r === "back" && l.length === 0 && n in Ut)
      return { easing: { type: "cubic-bezier", points: Ut[n] } };
    const h = r === "elastic" ? { type: "elastic", mode: c, ...l[0] !== void 0 && { amplitude: l[0] }, ...l[1] !== void 0 && { period: l[1] } } : r === "bounce" ? { type: "bounce", mode: c } : { type: "back", mode: c, ...l[0] !== void 0 && { overshoot: l[0] } };
    return { easing: h, fn: nt(h) };
  }
  return n in $n ? { easing: $n[n] } : n in Ut ? { easing: { type: "cubic-bezier", points: Ut[n] } } : { easing: "ease-out" };
}
const Ys = /* @__PURE__ */ new Map();
function cn(e, t) {
  return Ys.set(
    e.trim().toLowerCase(),
    t.bezier ? { easing: { type: "cubic-bezier", points: t.bezier }, fn: t.fn } : { fn: t.fn, requiresBaking: "custom" }
  ), e;
}
function Ve(e) {
  let t = e >>> 0;
  return () => {
    t = t + 1831565813 >>> 0;
    let n = t;
    return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const Ws = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function qs(e) {
  return typeof e == "string" && Ws.test(e);
}
function Xr(e = 1) {
  let t = Ve(e);
  const n = (l, c) => ((...h) => h.length >= l ? c(...h) : (d) => c(...h, d)), s = (l, c, h) => Math.min(Math.max(h, Math.min(l, c)), Math.max(l, c)), i = (l, c, h, d, u) => c === l ? h : h + (u - l) / (c - l) * (d - h), r = (l, c) => {
    if (typeof l == "number") return l === 0 ? c : Math.round(c / l) * l;
    if (Array.isArray(l)) return Rn(l, c, 1 / 0);
    if ("values" in l) return Rn(l.values, c, l.radius ?? 1 / 0);
    const h = Math.round(c / l.increment) * l.increment;
    return Math.abs(h - c) <= (l.radius ?? 1 / 0) ? h : c;
  }, o = (l, c, h) => {
    const d = l + t() * (c - l);
    return h ? Math.round(d / h) * h : d;
  };
  return {
    clamp: n(3, s),
    mapRange: n(5, i),
    normalize: n(3, (l, c, h) => i(l, c, 0, 1, h)),
    interpolate: n(3, (l, c, h) => {
      if (typeof l == "object" && !Array.isArray(l)) {
        const d = {};
        for (const u of Object.keys(l))
          d[u] = oe(l[u])(l[u], c[u], h);
        return d;
      }
      return oe(l)(l, c, h);
    }),
    wrap: ((l, c, h) => {
      if (Array.isArray(l)) {
        const m = l, g = (y) => m[(Math.round(y) % m.length + m.length) % m.length];
        return c === void 0 ? g : g(c);
      }
      const d = l, f = c - d, p = (m) => f === 0 ? d : ((m - d) % f + f) % f + d;
      return h === void 0 ? p : p(h);
    }),
    wrapYoyo: n(3, (l, c, h) => {
      const d = c - l;
      if (d === 0) return l;
      const u = ((h - l) % (d * 2) + d * 2) % (d * 2);
      return l + (u > d ? d * 2 - u : u);
    }),
    snap: n(2, r),
    random: ((l, c, h, d) => {
      if (Array.isArray(l)) {
        const f = () => l[Math.floor(t() * l.length)];
        return c === !0 ? f : f();
      }
      const u = () => o(l, c, h);
      return d ? u : u();
    }),
    shuffle: (l) => {
      for (let c = l.length - 1; c > 0; c--) {
        const h = Math.floor(t() * (c + 1));
        [l[c], l[h]] = [l[h], l[c]];
      }
      return l;
    },
    distribute: ({ base: l = 0, amount: c, each: h, from: d = "start", ease: u }) => (f, p, m) => {
      const g = m.length, w = on(f, g, { ...c !== void 0 ? { amount: c } : { each: h ?? 1 }, from: d }), b = c !== void 0 ? c : (h ?? 1) * vs(g, d), x = u && b > 0 ? u(w / b) * b : w;
      return l + x;
    },
    pipe: (...l) => (c) => l.reduce((h, d) => d(h), c),
    splitColor: (l) => Hr(l),
    getUnit: (l) => typeof l == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(l.trim())?.[1] ?? "",
    seed: (l) => {
      t = Ve(l);
    },
    resolveRandomString: (l) => {
      const c = Ws.exec(l)?.[1] ?? "";
      if (c.startsWith("[")) {
        const p = c.slice(1, -1).split(",").map((m) => m.trim()).filter(Boolean).map((m) => Number.isFinite(Number(m)) ? Number(m) : m.replace(/^['"]|['"]$/g, ""));
        return p[Math.floor(t() * p.length)];
      }
      const [h, d, u] = c.split(",").map((f) => Number.parseFloat(f));
      return o(h, d, Number.isFinite(u) ? u : void 0);
    }
  };
}
function Rn(e, t, n) {
  let s = t, i = 1 / 0;
  for (const r of e) {
    const o = Math.abs(r - t);
    o < i && (i = o, s = r);
  }
  return i <= n ? s : t;
}
function Hr(e) {
  const t = e.trim(), n = /^#([0-9a-f]{3,8})$/i.exec(t)?.[1];
  if (n) {
    const r = (n.length <= 4 ? [...n].map((o) => o + o).join("") : n).match(/../g).map((o) => Number.parseInt(o, 16));
    return r.length >= 4 ? [r[0], r[1], r[2], Math.round(r[3] / 255 * 1e3) / 1e3] : [r[0], r[1], r[2]];
  }
  const s = (/rgba?\(([^)]+)\)/i.exec(t)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((i) => Number.parseFloat(i));
  return s.length >= 4 ? [s[0], s[1], s[2], s[3]] : [s[0] ?? 0, s[1] ?? 0, s[2] ?? 0];
}
const Vr = /^([+-])=\s*(-?[\d.]+)$/, Ur = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function Pt(e, t) {
  const n = t.scale ?? 1, s = (c) => Number.parseFloat(c) * n;
  if (e === void 0) return t.cursor;
  if (typeof e == "number") return e * n;
  const i = e.trim();
  if (i === "") return t.cursor;
  const r = Vr.exec(i);
  if (r) {
    const c = s(r[2]);
    return t.cursor + (r[1] === "-" ? -c : c);
  }
  const o = Ur.exec(i);
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
function jr(e) {
  if (typeof e != "object" || e === null) return !1;
  const t = e;
  return t.grid !== void 0 || t.from === "random" || Array.isArray(t.from) || t.ease !== void 0 || t.axis !== void 0;
}
function zr(e, t, n = {}) {
  if (e === 0) return [];
  const s = t.grid === "auto" ? Math.max(1, Math.min(e, n.columnsFromLayout?.() ?? e)) : Array.isArray(t.grid) ? Math.max(1, t.grid[1]) : e, i = Array.isArray(t.grid) ? Math.max(1, t.grid[0]) : Math.ceil(e / s), r = (p) => ({ x: p % s, y: Math.floor(p / s) }), o = t.from ?? "start", a = Array.isArray(o) ? { x: o[0] * (s - 1), y: o[1] * (i - 1) } : typeof o == "number" ? r(Math.max(0, Math.min(e - 1, o))) : o === "end" ? r(e - 1) : o === "center" || o === "edges" ? { x: (s - 1) / 2, y: (i - 1) / 2 } : { x: 0, y: 0 }, l = (p) => {
    const { x: m, y: g } = r(p), y = Math.abs(m - a.x), w = Math.abs(g - a.y);
    return t.axis === "x" ? y : t.axis === "y" ? w : Math.hypot(y, w);
  };
  let c = Array.from({ length: e }, (p, m) => l(m));
  const h = Math.max(...c);
  if (o === "edges" && (c = c.map((p) => h - p)), o === "random") {
    const p = n.random ?? Math.random;
    c = c.map(() => p() * h);
  }
  const d = t.amount !== void 0 ? t.amount : (t.each ?? 0) * h, u = t.ease ? ae(t.ease) : void 0, f = u ? u.fn ?? nt(u.easing) : void 0;
  return c.map((p) => {
    const m = h === 0 ? 0 : p / h;
    return (f ? f(m) : m) * d;
  });
}
const hn = /* @__PURE__ */ new Set([
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
function te(e) {
  const t = {}, n = {};
  for (const [s, i] of Object.entries(e))
    hn.has(s) ? t[s] = i : n[s] = i;
  return { config: t, properties: n };
}
function le(e, t) {
  return e === void 0 ? t : e * 1e3;
}
function Ue(e, t) {
  if (e !== void 0)
    return typeof e == "number" ? { each: e * 1e3 } : jr(e) ? { offsets: zr(t?.count ?? 0, e, t ?? {}).map((s) => s * 1e3) } : {
      ...e.each !== void 0 && { each: e.each * 1e3 },
      ...e.amount !== void 0 && { amount: e.amount * 1e3 },
      ...e.from !== void 0 && { from: e.from }
    };
}
const Gr = {
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
function Xs(e) {
  return Gr[e];
}
function Kr(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : e;
  if (!t || typeof t.path != "string" && !Array.isArray(t.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(t.path))
    n = Yr(t.path, { curviness: t.curviness });
  else if (qt(t.path))
    n = t.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${t.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const s = { pathData: n };
  return t.autoRotate !== void 0 && t.autoRotate !== !1 && (s.autoRotate = !0, typeof t.autoRotate == "number" && (s.rotateOffset = t.autoRotate)), t.matrix && (s.matrix = t.matrix), { config: s, start: t.start ?? 0, end: t.end ?? 1 };
}
function Zr(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : { ...e };
  return { ...t, start: t.end ?? 1, end: t.start ?? 0 };
}
function Hs(e) {
  return typeof e == "object" && e !== null && "shape" in e ? e.shape : e;
}
function Jr(e) {
  if (e.morphSVG === void 0) return e;
  const { morphSVG: t, ...n } = e, s = Hs(t);
  if (typeof s != "string" || !qt(s))
    throw new Error(
      `gsap-compat: morphSVG "${String(s)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: s };
}
function Qr(e, t) {
  if (e === !0) return [0, t];
  if (e === !1) return [0, 0];
  if (typeof e == "number") return [0, Ln(e, t)];
  const n = e.trim().split(/[\s,]+/).filter(Boolean), s = (o) => {
    const a = Number.parseFloat(o);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${e}" is not a length or percentage`);
    return Ln(o.endsWith("%") ? t * a / 100 : a, t);
  };
  if (n.length === 0) return [0, t];
  if (n.length === 1) return [0, s(n[0])];
  const i = s(n[0]), r = s(n[1]);
  return i <= r ? [i, r] : [r, i];
}
function to(e, t) {
  const [n, s] = Qr(e, t);
  return { strokeDasharray: [s - n, t], strokeDashoffset: -n };
}
function eo(e, t) {
  if (e.drawSVG === void 0) return e;
  const { drawSVG: n, ...s } = e;
  return { ...s, ...to(n, t) };
}
function no(e) {
  if (e.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return e;
}
function Ln(e, t) {
  return Math.max(0, Math.min(t, e));
}
function so(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++) t = Math.imul(t ^ e.charCodeAt(n), 16777619);
  return t >>> 0;
}
function io(e, t, n) {
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
      seed: i.seed ?? so(`${t}|${i.text}`)
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
function un(e) {
  return Math.max(0.1, e / 25);
}
function ro(e, t) {
  const n = typeof t == "number" ? { velocity: t } : t;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const s = n.friction ?? (n.resistance !== void 0 ? un(n.resistance) : void 0), i = {
    from: e,
    velocity: n.velocity,
    ...s !== void 0 && { friction: s },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? i.end = [n.end(re(i))] : n.end !== void 0 && (i.end = Array.isArray(n.end) ? [...n.end] : n.end), i;
}
function oo(e) {
  const t = e === !0 ? {} : typeof e == "string" ? { preset: e } : e;
  if (t.preset !== void 0 && !(t.preset in ve))
    throw new Error(
      `gsap-compat: unknown spring preset "${t.preset}" — use one of ${Object.keys(ve).join(", ")}`
    );
  return {
    ...t.preset ? ve[t.preset] : {},
    ...t.stiffness !== void 0 && { stiffness: t.stiffness },
    ...t.damping !== void 0 && { damping: t.damping },
    ...t.mass !== void 0 && { mass: t.mass },
    ...t.restDelta !== void 0 && { restDelta: t.restDelta }
  };
}
function ao(e, t) {
  if (e === !0 || typeof e == "string") return;
  const n = e.velocity;
  return typeof n == "number" ? n : n?.[t];
}
class bt {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = Ve(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(t = {}) {
    this.options = t, this.timeline = new $s({
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
    return this.build(t, void 0, _t(n), s);
  }
  /** Animate from the given values to where the property already is. */
  from(t, n, s) {
    const { config: i, properties: r } = te(_t(n)), { motionPath: o, text: a, scrambleText: l, ...c } = r, h = this.targetsOf(t)[0], d = { ...i };
    for (const p of Object.keys(c))
      d[p] = this.resolveStart(h, p);
    o !== void 0 && (d.motionPath = Zr(o));
    const u = {}, f = String(this.resolveStart(h, "text"));
    return a !== void 0 && (u.text = Pe(a), d.text = typeof a == "object" ? { ...a, value: f } : f), l !== void 0 && (u.text = Pe(l), d.scrambleText = typeof l == "object" ? { ...l, text: f } : f), this.build(t, { ...c, ...u }, d, s);
  }
  /** Animate between two explicit sets of values. */
  fromTo(t, n, s, i) {
    const { properties: r } = te(_t(n));
    return this.build(t, r, _t(s), i);
  }
  /** Set values instantly — a single held keyframe. */
  set(t, n, s) {
    return this.build(t, void 0, { ..._t(n), duration: 0 }, s);
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
    const n = Math.max(0, Pt(t, this.context()));
    return this.previousStart = n, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), n;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(t) {
    return Pt(t, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(t, n) {
    return this.labels.set(t, Pt(n, this.context())), this;
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
    const s = Pt(n, this.context());
    for (const r of t.timeline.tracks) {
      if (!("keyframes" in r)) continue;
      const o = He({
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
    const { config: r, properties: o } = te(s), { motionPath: a, text: l, scrambleText: c, inertia: h, ...d } = o, u = this.targetsOf(t), f = Pt(i, this.context()), p = le(r.delay, 0), m = le(r.duration, 500), g = Ue(r.stagger, {
      count: u.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(u) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), y = this.easingFor(r.ease), w = [], b = r.spring;
    let x = 0, v = !1;
    for (const [S, A] of Object.entries(d)) {
      const M = A;
      let P = n?.[S] !== void 0 ? n[S] : this.resolveStart(u[0], S);
      if (typeof P != typeof M && (this.warn(
        `no usable start value for "${S}" on "${u[0]}" — it will snap to ${String(M)}. Use fromTo() to animate it.`
      ), P = M), b !== void 0 && (typeof P != "number" || typeof M != "number") && this.warn(`spring works on numbers, so "${S}" on "${u[0]}" eases instead`), b !== void 0 && typeof P == "number" && typeof M == "number") {
        const R = {
          ...oo(b),
          from: P,
          to: M,
          velocity: ao(b, S) ?? this.options.startVelocity?.(u[0], S) ?? 0
        }, D = this.nextTrackId(`${u[0]}-${S}-spring`), B = {
          id: D,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: S,
          kind: "spring",
          spring: R,
          delay: f + p
        };
        this.timeline.addTrack(B), w.push(D), x = Math.max(x, Ei(R));
        for (const L of u) this.lastValues.set(`${L}|${S}`, M);
        continue;
      }
      v = !0;
      const E = this.keyframesFor(P, M, m, y, r.ease), I = this.nextTrackId(`${u[0]}-${S}`);
      this.timeline.addTrack(
        He({
          id: I,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: S,
          delay: f + p,
          keyframes: E
        })
      ), w.push(I);
      for (const R of u) this.lastValues.set(`${R}|${S}`, M);
    }
    const T = io({ text: l, scrambleText: c }, u[0], m);
    if (T) {
      const S = n?.text ?? n?.scrambleText, A = S !== void 0 ? Pe(S) : this.resolveStart(u[0], "text"), M = this.nextTrackId(`${u[0]}-text`), P = {
        id: M,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...g && u.length > 1 && { stagger: g },
        property: "text",
        textConfig: { from: typeof A == "string" ? A : String(A ?? ""), ...T },
        delay: f + p,
        keyframes: this.keyframesFor(0, 1, m, y, r.ease)
      };
      this.timeline.addTrack(P), w.push(M);
      for (const E of u) this.lastValues.set(`${E}|text`, T.to);
    }
    if (a !== void 0) {
      const { config: S, start: A, end: M } = Kr(a), P = this.nextTrackId(`${u[0]}-motionPath`), E = {
        id: P,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...g && u.length > 1 && { stagger: g },
        property: "motionPath",
        motionPathConfig: S,
        delay: f + p,
        keyframes: this.keyframesFor(A, M, m, y, r.ease)
      };
      this.timeline.addTrack(E), w.push(P);
    }
    if (h !== void 0)
      for (const [S, A] of Object.entries(h)) {
        const M = this.resolveStart(u[0], S);
        if (typeof M != "number") {
          this.warn(`inertia on "${S}" needs a numeric start value; skipped`);
          continue;
        }
        const P = ro(M, A), E = this.nextTrackId(`${u[0]}-${S}-inertia`), I = {
          id: E,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: S,
          kind: "inertia",
          inertia: P,
          delay: f + p
        };
        this.timeline.addTrack(I), w.push(E), x = Math.max(x, Wt(P));
        for (const R of u) this.lastValues.set(`${R}|${S}`, Yt(P));
      }
    const $ = ((h !== void 0 || b !== void 0) && !v && !T && a === void 0 ? x : Math.max(m, x)) + (g && u.length > 1 ? pe(u.length, g) : 0), C = f + p + $;
    return this.previousStart = f + p, this.previousEnd = C, this.cursor = Math.max(this.cursor, C), {
      trackIds: w,
      start: f + p,
      end: C,
      kill: () => {
        for (const S of w) this.timeline.removeTrack(S);
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
    const a = typeof r == "string" ? ae(r) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && se(i)) {
      const c = a?.fn ?? nt(i);
      return [o, ...Cs(o, { time: s, value: n }, c, { intervalMs: this.options.bakeIntervalMs })];
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
    if (n === "d")
      throw new Error(
        `gsap-compat: no starting shape for "${t}". Use fromTo({ d: … }, { morphSVG: … }), or live.to(), which reads the element's current shape.`
      );
    const o = Xs(n);
    return o !== void 0 ? (this.warn(
      `no start value for "${n}" on "${t}" — using the static default ${o}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), o) : (this.warn(`no start value or default for "${n}" on "${t}" — using 0`), 0);
  }
  easingFor(t) {
    if (t !== void 0) {
      if (typeof t == "string") return ae(t).easing;
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
function Pe(e) {
  if (typeof e == "string") return e;
  if (e && typeof e == "object") {
    const t = e;
    return String(t.value ?? t.text ?? "");
  }
  return String(e ?? "");
}
function lo(e) {
  return new bt(e);
}
function _t(e) {
  return no(Jr(e));
}
const co = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), ho = "#ffffff", uo = "rgba(0, 0, 0, 0.5)";
function fo(e) {
  const t = [];
  if (e.blur !== void 0 && t.push(`blur(${Math.max(0, e.blur)}px)`), e.brightness !== void 0 && t.push(`brightness(${Math.max(0, e.brightness)})`), e.glow !== void 0 && t.push(`drop-shadow(0 0 ${Math.max(0, e.glow)}px ${e.glowColor ?? ho})`), e.shadowX !== void 0 || e.shadowY !== void 0 || e.shadowBlur !== void 0) {
    const n = e.shadowX ?? 0, s = e.shadowY ?? 0, i = Math.max(0, e.shadowBlur ?? 0);
    t.push(`drop-shadow(${n}px ${s}px ${i}px ${e.shadowColor ?? uo})`);
  }
  return t.length > 0 ? t.join(" ") : null;
}
function po(e, t) {
  const n = e.childNodes.length === 1 ? e.firstChild : null;
  if (n && n.nodeType === 3) {
    const s = n;
    s.data !== t && (s.data = t);
    return;
  }
  e.textContent !== t && (e.textContent = t);
}
function mo(e) {
  if (!("ownerSVGElement" in e)) return;
  const t = e.style;
  !t || t.transformBox || (t.transformBox = "fill-box", t.transformOrigin || (t.transformOrigin = "50% 50%"));
}
const Fn = /* @__PURE__ */ new Set([
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
]), go = /* @__PURE__ */ new Set([
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
]), yo = /* @__PURE__ */ new Set(["originX", "originY"]), bo = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), wo = /* @__PURE__ */ new Set(["drawOn"]), vo = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, On = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, xo = "http://www.w3.org/2000/svg";
class ut {
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
    const s = [];
    let i = null, r = null, o = null;
    const a = n.has("motionPathX"), l = n.has("motionPathY"), c = n.has("motionPathRotate");
    for (const [u, f] of n)
      if (!(u === "x" && a) && !(u === "y" && l) && !((u === "rotate" || u === "rotateZ") && c) && !wo.has(u)) {
        if (go.has(u)) {
          const p = this.buildTransformPart(u, f);
          p && s.push(p);
        } else if (yo.has(u))
          typeof f == "number" && ((i ??= {})[u] = f);
        else if (bo.has(u))
          typeof f == "number" && ((r ??= {})[u] = f);
        else if (co.has(u))
          (o ??= {})[u] = f;
        else if (u !== "perspective") {
          if (u !== "shine") if (u === "text" && typeof f == "string")
            po(t, f);
          else if (u === "d" && typeof f == "string") {
            const p = t;
            (p.tagName?.toLowerCase() === "path" ? p : p.querySelector?.("path"))?.setAttribute?.("d", f);
          } else
            this.applyStyleProperty(t, u, f);
        }
      }
    const h = n.get("shine");
    typeof h == "number" && this.applyShine(t, h);
    const d = n.get("perspective");
    if (typeof d == "number" && s.unshift(`perspective(${d}px)`), s.length > 0 && (t.style.transform = s.join(" "), mo(t)), i) {
      const u = i.originX ?? 50, f = i.originY ?? 50;
      t.style.transformOrigin = `${u}% ${f}%`;
    }
    if (r) {
      const u = r.clipTop ?? 0, f = r.clipRight ?? 0, p = r.clipBottom ?? 0, m = r.clipLeft ?? 0;
      t.style.clipPath = `inset(${u}% ${f}% ${p}% ${m}%)`;
    }
    if (o) {
      const u = fo(o);
      u && (t.style.filter = u);
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
    const s = t.dataset.shineBase, i = -20 + n * 140, r = t.style;
    r.color = "transparent", r.backgroundImage = `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.9) 50%, transparent 60%), linear-gradient(${s}, ${s})`, r.backgroundSize = "250% 100%, 100% 100%", r.backgroundPosition = `${i}% 0, 0 0`, r.backgroundRepeat = "no-repeat", r.webkitBackgroundClip = "text", r.backgroundClip = "text";
  }
  /**
   * Apply a single style property to an element.
   */
  applyStyleProperty(t, n, s) {
    let i;
    if (t.namespaceURI === xo && n in On) {
      const a = Array.isArray(s) ? s.join(", ") : String(s);
      t.style[On[n]] = a;
      return;
    } else n === "fill" && t.dataset?.elementType === "text" ? i = "color" : i = vo[n] ?? n;
    let o;
    typeof s == "number" ? Fn.has(n) || Fn.has(i) ? o = `${s}px` : o = String(s) : Array.isArray(s) ? o = s.join(", ") : o = s, t.style[i] = o;
  }
}
const To = {
  request: (e) => requestAnimationFrame(e),
  cancel: (e) => cancelAnimationFrame(e)
};
class Mo {
  adapter = new ut();
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
  utils = Xr();
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
    this.scheduler = t.scheduler ?? To, this.rootOption = t.root, this.onWarning = t.onWarning;
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
      _e(s) && this.currentCollector?.touch(s, i), n.push(i);
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
    if (_e(t)) return [t];
    if (!ko(t)) return [t];
    const n = [];
    for (const s of Array.from(t))
      n.push(...this.targetsOf(s));
    return n;
  }
  nameFor(t) {
    return _e(t) ? this.elementName(t) : this.objectName(t);
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
function _e(e) {
  return typeof e == "object" && e !== null && e.nodeType === 1;
}
function ko(e) {
  if (Array.isArray(e)) return !0;
  const t = e;
  return typeof t.length == "number" && typeof t.item == "function";
}
function ce(e) {
  const t = e.style;
  if (!t) return e.getBoundingClientRect();
  const n = t.transform;
  t.transform = "none";
  const s = e.getBoundingClientRect();
  return t.transform = n, s;
}
const Dn = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function So(e) {
  const t = {};
  for (const n of Array.from(e.attributes)) t[n.name] = n.value;
  return t;
}
function Ao(e) {
  const t = e.getScreenCTM?.();
  if (t) return [t.a, t.b, t.c, t.d, t.e, t.f];
  const n = e.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function Eo(e, t) {
  const n = typeof e == "string" || Array.isArray(e) || Dn(e) ? { path: e } : e, { align: s, alignOrigin: i, path: r, ...o } = n, a = (T) => {
    const k = Dn(T) ? T : t.query(T);
    return k || t.warn(`gsap-compat: motionPath could not find "${String(T)}"`), k;
  };
  let l = null, c = "";
  if (Array.isArray(r) || typeof r == "string" && qt(r))
    c = r;
  else {
    l = a(r);
    const T = l && ln({ tag: l.localName, attributes: So(l) });
    l && !T && t.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), c = T ?? "";
  }
  const h = { ...o, path: c };
  if (s === void 0 || s === !1) return h;
  const d = s === !0 ? l : a(s);
  if (!d)
    return s === !0 && t.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const u = t.targets[0];
  if (!u) return h;
  const [f, p, m, g, y, w] = Ao(d), b = ce(u), [x, v] = i ?? [0.5, 0.5];
  for (const T of t.targets.slice(1)) {
    const k = ce(T);
    if (Math.abs(k.left - b.left) > 0.5 || Math.abs(k.top - b.top) > 0.5) {
      t.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [f, p, m, g, y - b.left - x * b.width, w - b.top - v * b.height], h;
}
const Vs = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function Us(e) {
  const t = {};
  for (const n of Array.from(e.attributes)) t[n.name] = n.value;
  return t;
}
function js(e) {
  if (!e) return null;
  const t = ln({ tag: e.localName, attributes: Us(e) });
  return t || (e.querySelector("path")?.getAttribute("d") ?? null);
}
function Po(e, t, n) {
  const s = Hs(e);
  if (typeof s == "string" && qt(s)) return s;
  const i = Vs(s) ? s : typeof s == "string" ? t(s) : null, r = js(i);
  return r || (n(`gsap-compat: morphSVG could not find a shape for "${String(s)}"`), "");
}
const _o = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function Co(e, t = document) {
  return (typeof e == "string" ? Array.from(t.querySelectorAll(e)) : Vs(e) ? [e] : Array.from(e)).map((s) => {
    if (s.localName === "path") return s;
    const i = ln({ tag: s.localName, attributes: Us(s) });
    if (!i || !s.parentNode) return s;
    const r = s.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const o of Array.from(s.attributes))
      _o.has(o.name) || r.setAttribute(o.name, o.value);
    return r.setAttribute("d", i), s.parentNode.replaceChild(r, s), r;
  });
}
const Bn = 0.3;
class Io {
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
    this.dragging = !0, this.passedTolerance = !1, this.startX = t, this.startY = n, this.lastX = t, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = Nn(), this.options.onPress?.(this.stateFrom(0, 0, s));
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
    const s = Nn(), i = Math.max(1, s - this.lastTime);
    this.lastTime = s;
    const r = t / i * 1e3, o = n / i * 1e3;
    this.velocityX += (r - this.velocityX) * Bn, this.velocityY += (o - this.velocityY) * Bn;
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
function Nn() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function $o(e, t, n) {
  let s = { delta: 0, line: null }, i = n;
  for (const r of e)
    for (const o of t) {
      const a = Math.abs(o - r);
      a <= i && (i = a, s = { delta: o - r, line: o });
    }
  return s;
}
function Ro(e, t) {
  return t <= 0 ? [] : e.map((n) => Math.round(n / t) * t);
}
class zs {
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
    this.options = t, this.x = t.initialX ?? 0, this.y = t.initialY ?? 0, this.observer = new Io({
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
    const i = (this.options.axis ?? "both") === "y" ? this.y : this.x, r = Lo(i / s);
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
      ...Ro([s], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], r = $o([s], i, this.snapThreshold());
    s += r.delta, n === "x" ? this.snappedX = r.line : this.snappedY = r.line;
    const o = this.options.bounds;
    if (o) {
      const a = n === "x" ? o.minX : o.minY, l = n === "x" ? o.maxX : o.maxY;
      a !== void 0 && (s = Math.max(a, s)), l !== void 0 && (s = Math.min(l, s));
    }
    return s;
  }
}
function Lo(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e;
}
function kc(e) {
  const t = new zs(e);
  return t.start(), t;
}
const Fo = { x: "x", y: "y", "x,y": "both" }, je = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function Yn(e, t) {
  const n = ce(e), s = t.getBoundingClientRect();
  return {
    minX: s.left - n.left,
    maxX: s.right - n.right,
    minY: s.top - n.top,
    maxY: s.bottom - n.bottom
  };
}
function Wn(e) {
  return Array.isArray(e) ? [...e] : e;
}
function Oo(e, t, n, s = {}) {
  const [i] = t.resolveTargets(n), r = i ? t.elementFor(i) : void 0;
  if (!i || !r)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  if (s.type === "rotation") return Do(e, t, i, r, s);
  const o = Fo[s.type ?? "x,y"], a = () => {
    const m = t.appliedValue(i, "x"), g = t.appliedValue(i, "y");
    return { x: typeof m == "number" ? m : 0, y: typeof g == "number" ? g : 0 };
  }, l = typeof s.bounds == "string" ? t.query(s.bounds) : je(s.bounds) ? s.bounds : null, h = { bounds: (!l && s.bounds && !je(s.bounds) ? s.bounds : void 0) ?? (l ? Yn(r, l) : void 0) };
  let d = null;
  const u = () => {
    d?.kill(), d = null;
  }, f = (m) => {
    const g = s.inertia === !0 ? {} : s.inertia, y = g.friction ?? (g.resistance !== void 0 ? un(g.resistance) : 4), w = a(), b = h.bounds ?? {};
    let x, v;
    const T = g.end;
    if (Array.isArray(T)) {
      const _ = re({ from: w.x, velocity: o === "y" ? 0 : m.x, friction: y }), $ = re({ from: w.y, velocity: o === "x" ? 0 : m.y, friction: y });
      let C = T[0];
      for (const S of T)
        Math.hypot(S.x - _, S.y - $) < Math.hypot(C.x - _, C.y - $) && (C = S);
      C && (x = [C.x], v = [C.y]);
    } else typeof T == "number" ? (x = T, v = T) : T && (x = Wn(T.x), v = Wn(T.y));
    const k = {};
    o !== "y" && (k.x = { velocity: m.x, friction: y, min: b.minX, max: b.maxX, end: x }), o !== "x" && (k.y = { velocity: m.y, friction: y, min: b.minY, max: b.maxY, end: v }), d = e.to(r, { inertia: k, onComplete: () => s.onThrowComplete?.() });
  }, p = new zs({
    target: r,
    axis: o,
    snap: s.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: a,
    onPress: () => {
      u(), l && (h.bounds = Yn(r, l)), s.onPress?.();
    },
    onDrag: (m) => {
      t.apply(i, o === "x" ? { x: m.x } : o === "y" ? { y: m.y } : { x: m.x, y: m.y }), s.onDrag?.(m);
    },
    onRelease: () => {
      const m = p.velocity;
      s.onRelease?.(m), s.inertia && f(m);
    }
  });
  return p.start(), {
    draggable: p,
    get position() {
      return a();
    },
    get rotation() {
      const m = t.appliedValue(i, "rotate");
      return typeof m == "number" ? m : 0;
    },
    destroy() {
      u(), p.destroy();
    }
  };
}
function Do(e, t, n, s, i) {
  const r = typeof i.bounds == "object" && i.bounds !== null && !je(i.bounds) ? i.bounds : {}, o = () => {
    const b = t.appliedValue(n, "rotate");
    return typeof b == "number" ? b : 0;
  }, a = (b) => Math.min(r.maxRotation ?? 1 / 0, Math.max(r.minRotation ?? -1 / 0, b));
  let l = null, c = !1, h, d = { x: 0, y: 0 }, u = 0, f = 0, p = [];
  const m = (b) => Math.atan2(b.clientY - d.y, b.clientX - d.x) * 180 / Math.PI, g = (b) => {
    if (c) return;
    l?.kill(), l = null, c = !0, h = b.pointerId, s.setPointerCapture?.(b.pointerId);
    const x = s.getBoundingClientRect();
    d = { x: x.left + x.width / 2, y: x.top + x.height / 2 }, u = m(b), f = o(), p = [{ time: performance.now(), rotation: f }], i.onPress?.();
  }, y = (b) => {
    if (!c || b.pointerId !== h) return;
    const x = m(b);
    let v = x - u;
    v > 180 && (v -= 360), v < -180 && (v += 360), u = x, f += v;
    let T = a(f);
    i.snap && (T = a(Math.round(T / i.snap) * i.snap)), t.apply(n, { rotate: T });
    const k = performance.now();
    for (p.push({ time: k, rotation: T }); p.length > 2 && k - p[0].time > 100; ) p.shift();
    const _ = { x: 0, y: 0 };
    i.onDrag?.(_);
  }, w = (b) => {
    if (!c || b.pointerId !== h) return;
    c = !1;
    const x = p[0], v = p[p.length - 1], T = x && v ? (v.time - x.time) / 1e3 : 0, k = T > 0 ? (v.rotation - x.rotation) / T : 0;
    if (i.onRelease?.({ x: k, y: 0 }), !i.inertia) return;
    const _ = i.inertia === !0 ? {} : i.inertia, $ = _.friction ?? (_.resistance !== void 0 ? un(_.resistance) : 4), C = typeof _.end == "number" || Array.isArray(_.end) ? _.end : void 0;
    l = e.to(s, {
      inertia: {
        rotate: {
          velocity: k,
          friction: $,
          min: r.minRotation,
          max: r.maxRotation,
          end: Array.isArray(C) ? C.filter((S) => typeof S == "number") : C
        }
      },
      onComplete: () => i.onThrowComplete?.()
    });
  };
  return s.addEventListener("pointerdown", g), s.addEventListener("pointermove", y), s.addEventListener("pointerup", w), s.addEventListener("pointercancel", w), s.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return o();
    },
    destroy() {
      l?.kill(), s.removeEventListener("pointerdown", g), s.removeEventListener("pointermove", y), s.removeEventListener("pointerup", w), s.removeEventListener("pointercancel", w);
    }
  };
}
const Bo = { opacity: 0, scale: 0.6 };
function No(e) {
  const t = e.getBoundingClientRect();
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function qn(e) {
  const t = ce(e);
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function ze(e, t) {
  const s = e.resolveTargets(t).map((o) => e.elementFor(o)).filter((o) => !!o), i = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of s) {
    const a = No(o);
    i.set(o, a);
    const l = Gs(o);
    a && l !== void 0 && !r.has(l) && r.set(l, { element: o, box: a });
  }
  return { elements: s, boxes: i, ids: r };
}
const Ce = /* @__PURE__ */ new WeakMap();
function Ge(e, t, n, s = {}) {
  const i = s.duration ?? 0.6, r = s.ease ?? "power2.inOut", o = s.stagger ?? 0, a = s.scale !== !1, l = s.enter === void 0 ? Bo : s.enter, c = new Set(n.elements);
  if (s.targets !== void 0)
    for (const f of e.resolveTargets(s.targets)) {
      const p = e.elementFor(f);
      p && c.add(p);
    }
  const h = [...c].sort(
    (f, p) => f === p ? 0 : f.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), d = t({ onComplete: s.onComplete });
  let u = 0;
  for (const f of h) {
    const p = qn(f);
    if (!p) continue;
    let m = n.boxes.get(f) ?? null, g;
    const y = Gs(f), w = !m && y !== void 0 ? n.ids.get(y) : void 0;
    w && w.element !== f && (m = w.box, g = w.element);
    const [b] = e.resolveTargets(f);
    Ce.get(f)?.timeline.removeTracks({ target: b });
    const x = u * o;
    if (!m) {
      if (l === !1) continue;
      d.fromTo(f, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...Ks(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: i, ease: r, delay: x }, 0), Ce.set(f, d), u++;
      continue;
    }
    const v = m.cx - p.cx, T = m.cy - p.cy, k = a ? m.width / p.width : 1, _ = a ? m.height / p.height : 1;
    if (!(Math.abs(v) > 0.5 || Math.abs(T) > 0.5 || Math.abs(k - 1) > 1e-3 || Math.abs(_ - 1) > 1e-3)) {
      const S = (A, M) => {
        const P = e.appliedValue(b, A);
        return typeof P == "number" && Math.abs(P - M) > 1e-6;
      };
      (S("x", 0) || S("y", 0) || S("scaleX", 1) || S("scaleY", 1)) && d.set(f, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const C = s.fade === !0 && g !== void 0;
    d.fromTo(
      f,
      { x: v, y: T, scaleX: k, scaleY: _, ...C && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...C && { opacity: 1 }, duration: i, ease: r, delay: x },
      0
    ), C && g && qn(g) && d.fromTo(g, { opacity: 1 }, { opacity: 0, duration: i, ease: r, delay: x }, 0), Ce.set(f, d), u++;
  }
  return d;
}
function Gs(e) {
  return e.dataset?.flipId;
}
function Ks(e) {
  const t = {};
  for (const n of Object.keys(e))
    t[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return t;
}
function Yo(e, t = {}) {
  const n = new Set((t.type ?? "chars,words,lines").split(",").map((m) => m.trim())), s = {
    chars: t.charsClass ?? "char",
    words: t.wordsClass ?? "word",
    lines: t.linesClass ?? "line"
  }, i = t.aria !== !1, r = e.map((m) => ({
    element: m,
    html: m.innerHTML,
    ariaLabel: m.getAttribute("aria-label")
  }));
  let o = { chars: [], words: [], lines: [], masks: [] }, a, l, c = !1;
  const h = () => {
    for (const { element: m, html: g, ariaLabel: y } of r)
      m.innerHTML = g, y === null ? m.removeAttribute("aria-label") : m.setAttribute("aria-label", y);
  }, d = () => {
    a && (a.revert ? a.revert() : a.kill?.(), a = void 0);
  }, u = () => {
    const m = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: g } of r) {
      const y = (g.textContent ?? "").replace(/\s+/g, " ").trim(), w = Wo(g, s.words), b = n.has("chars") ? w.flatMap((T) => qo(T, s.chars)) : [], x = n.has("lines") ? Ho(g, w, s.lines) : [];
      if (i) {
        !g.hasAttribute("aria-label") && y && g.setAttribute("aria-label", y);
        for (const T of w) T.setAttribute("aria-hidden", "true");
      }
      if (n.has("words")) m.words.push(...w);
      else for (const T of w) T.removeAttribute("class");
      m.chars.push(...b), m.lines.push(...x);
      const v = t.mask === "lines" ? x : t.mask === "words" ? w : t.mask === "chars" ? b : [];
      for (const T of v) m.masks.push(Vo(T, `${s[t.mask]}-mask`));
    }
    o = m;
  }, f = {
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
      c || (d(), h(), u(), a = t.onSplit?.(f));
    },
    revert() {
      c = !0, l?.disconnect(), d(), h();
    }
  };
  u(), a = t.onSplit?.(f), t.autoSplit && p();
  function p() {
    const m = /* @__PURE__ */ new Map();
    let g = !1;
    const y = () => {
      if (g) return;
      g = !0;
      const b = () => {
        g = !1, f.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(b) : setTimeout(b, 0);
    };
    if (typeof ResizeObserver == "function") {
      l = new ResizeObserver((b) => {
        let x = !1;
        for (const v of b) {
          const T = Math.round(v.contentRect.width), k = m.get(v.target);
          m.set(v.target, T), k !== void 0 && k !== T && (x = !0);
        }
        x && y();
      });
      for (const b of e) l.observe(b);
    }
    const w = e[0]?.ownerDocument?.fonts;
    w && w.status !== "loaded" && w.ready.then(() => y());
  }
  return f;
}
function Wo(e, t) {
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
function qo(e, t) {
  const n = e.ownerDocument, s = Xo(e.textContent ?? "").map((i) => {
    const r = n.createElement("span");
    return r.className = t, r.style.display = "inline-block", r.textContent = i, r;
  });
  return e.replaceChildren(...s), s;
}
function Xo(e) {
  const t = Intl.Segmenter;
  return t ? Array.from(new t(void 0, { granularity: "grapheme" }).segment(e), (n) => n.segment) : Array.from(e);
}
function Ho(e, t, n) {
  const s = e.ownerDocument, i = new Map(t.map((p) => [p, p.getBoundingClientRect()])), r = [], o = (p) => {
    for (const m of Array.from(p.childNodes))
      m.nodeType === 3 || i.has(m) || m.tagName === "BR" ? r.push(m) : o(m);
  };
  o(e);
  const a = [];
  let l = null, c = 0, h = 0, d = !1, u = [];
  const f = () => {
    l = s.createElement("span"), l.className = n, l.style.display = "block", a.push(l), u = [];
  };
  for (const p of r) {
    if (p.tagName === "BR") {
      d = !0;
      continue;
    }
    const m = i.get(p);
    if (m && (!l || d || m.top > c + h) && (f(), c = m.top, h = m.height / 2, d = !1), !l) continue;
    const g = [];
    for (let b = p.parentNode; b && b !== e; b = b.parentNode) g.unshift(b);
    let y = 0;
    for (; y < u.length && y < g.length && u[y].original === g[y]; ) y++;
    u.length = y;
    let w = y === 0 ? l : u[y - 1].clone;
    for (const b of g.slice(y)) {
      const x = b.cloneNode(!1);
      w.appendChild(x), u.push({ original: b, clone: x }), w = x;
    }
    w.appendChild(p);
  }
  return e.replaceChildren(...a), a;
}
function Vo(e, t) {
  const n = e.ownerDocument.createElement("span");
  return n.className = t, n.style.display = e.style.display === "block" ? "block" : "inline-block", n.style.overflow = "clip", n.style.paddingBottom = "0.12em", n.style.marginBottom = "-0.12em", e.replaceWith(n), n.appendChild(e), n;
}
const Xn = {
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
function Hn(e) {
  const t = e.trim().toLowerCase();
  if (t in Xn) return Xn[t];
  if (t.endsWith("%")) {
    const n = Number.parseFloat(t.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function Zs(e) {
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
  const i = s[0] !== void 0 ? Hn(s[0]) : void 0, r = s[1] !== void 0 ? Hn(s[1]) : void 0;
  return {
    elementFraction: i ?? 0,
    viewportFraction: r ?? 0,
    offsetPx: t
  };
}
function Bt(e, t, n) {
  const s = Zs(n), i = s.absolutePx !== void 0 ? e.top + s.absolutePx : e.top + e.height * s.elementFraction, r = t * s.viewportFraction;
  return i - r + s.offsetPx;
}
function Sc(e, t, n, s) {
  const i = Bt(e, t, n), o = Bt(e, t, s) - i;
  return o <= 0 ? i <= 0 ? 1 : 0 : Js(-i / o);
}
function Js(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e === 0 ? 0 : e;
}
function Uo(e, t, n, s) {
  if (n <= 0) return t;
  const i = 1 - Math.exp(-(s / 1e3) / n);
  return e + (t - e) * i;
}
function Vn(e, t, n, s, i) {
  const r = (h) => Bt({ top: e + i(h), bottom: e + i(h) + t, height: t }, n, s), o = r(0), a = r(1);
  if (Math.sign(o) === Math.sign(a) || o === 0 || a === 0)
    return o === 0 ? 0 : a === 0 ? 1 : Math.abs(o) < Math.abs(a) ? 0 : 1;
  let l = 0, c = 1;
  for (let h = 0; h < 40; h++) {
    const d = (l + c) / 2;
    Math.sign(r(d)) === Math.sign(o) ? l = d : c = d;
  }
  return (l + c) / 2;
}
class jo {
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
function Ac(e) {
  const t = new jo(e);
  return t.start(), t;
}
class zo {
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
const Go = 0.15;
function Ko(e) {
  return typeof e == "object" && !Array.isArray(e) ? e : { snapTo: e };
}
function Zo(e, t, n) {
  const s = jt(e + t * Go);
  if (typeof n == "function") return jt(n(s));
  if (typeof n == "number")
    return n <= 0 ? e : jt(Math.round(s / n) * n);
  if (n.length === 0) return e;
  let i = n[0];
  for (const r of n)
    Math.abs(r - s) < Math.abs(i - s) && (i = r);
  return jt(i);
}
function Jo(e, t, n) {
  const s = e.duration ?? { min: 0.2, max: 0.8 };
  if (typeof s == "number") return s;
  const i = Math.min(1, Math.abs(t) / Math.max(1, n));
  return s.min + (s.max - s.min) * i;
}
class Qo {
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
  animate(t, n, s, i = ye, r) {
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
function jt(e) {
  return Math.max(0, Math.min(1, e));
}
class ta {
  options;
  scroller;
  nodes = [];
  scrollerStart;
  scrollerEnd;
  start;
  end;
  constructor(t, n, s) {
    this.options = s === !0 ? {} : s, this.scroller = n;
    const { startColor: i = "#3ecf7a", endColor: r = "#ff5a5a", id: o } = this.options, a = o ? `${o} ` : "", l = (c, h, d) => {
      const u = t.createElement("div");
      return u.textContent = `${a}${c}`, u.setAttribute("aria-hidden", "true"), u.className = "scroll-marker", Object.assign(u.style, {
        position: d ? "fixed" : "absolute",
        right: `${this.options.indent ?? 0}px`,
        zIndex: "2147483646",
        pointerEvents: "none",
        borderTop: `1px solid ${h}`,
        color: h,
        font: `${this.options.fontSize ?? "11px"} ui-monospace, monospace`,
        padding: "2px 6px",
        whiteSpace: "nowrap",
        background: "rgba(0, 0, 0, 0.35)"
      }), (n ?? t.body).appendChild(u), this.nodes.push(u), u;
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
const ea = 120, gt = [], Tt = /* @__PURE__ */ new Set();
let Ie = !1;
const na = () => {
  Ie || Tt.size === 0 || (Ie = !0, queueMicrotask(() => {
    Ie = !1;
    for (const e of Tt) e.afterRefresh();
  }));
}, Qs = () => {
  for (const e of Tt) e.beforeRefresh();
  for (const e of gt) e.refresh();
  for (const e of Tt) e.afterRefresh();
};
let yt = { width: 0, height: 0 };
const Un = () => {
  const e = window.innerWidth, t = window.innerHeight, n = e === yt.width && t !== yt.height, s = Math.abs(t - yt.height) < yt.height * 0.25, i = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  n && s && i || (yt = { width: e, height: t }, Qs());
};
class be {
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
    this.timeline = t.timeline, this.options = t, this.snapper = new Qo((n) => this.scrollTo(n), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const t = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    t && !this.options.container && (this.pin = new zo(t, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new ta(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), gt.length === 0 && typeof window < "u" && (yt = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", Un, { passive: !0 })), gt.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), gt.splice(gt.indexOf(this), 1), gt.length === 0 && typeof window < "u" && window.removeEventListener("resize", Un), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    Qs();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(t) {
    return Tt.add(t), () => Tt.delete(t);
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
      if (this.startPx = t + Bt(n, s, Ct(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(n, s, t), this.pin) {
        const i = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(i.top - (this.startPx - t), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(s) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, t), this.lastScroll = null, this.updateFrom(t, !this.measured), this.measured = !0, na();
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
    this.targetProgress = s > 0 ? Js((t - this.startPx) / s) : t >= this.startPx ? 1 : 0, this.zone = s > 0 ? t <= this.startPx ? "before" : t >= this.endPx ? "after" : "active" : t >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(i, this.zone), n || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const t = this.options.scrub;
    return typeof t == "number" ? Math.max(0, t) : 0;
  }
  resolveEnd(t, n, s) {
    const i = Ct(this.options.end) ?? "bottom top", r = typeof i == "string" ? i.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (r) {
      const o = Number.parseFloat(r[1]);
      return this.startPx + (r[2] === "%" ? n * o / 100 : o);
    }
    return s + Bt(t, n, i);
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
    }, ea));
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
    const n = Ko(t), s = () => {
      this.snapTimer = null;
      const i = this.endPx - this.startPx, r = this.scrollPosition();
      if (!this.running || i <= 0 || r <= this.startPx || r >= this.endPx) return;
      const o = (r - this.startPx) / i, a = this.startPx + Zo(o, this.releaseVelocity / i, n.snapTo) * i;
      Math.abs(a - r) < 1 || this.snapper.animate(r, a, Jo(n, a - r, this.viewportHeight()), n.ease);
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
    const s = n.getBoundingClientRect(), i = this.options.scroller?.getBoundingClientRect?.().left ?? 0, r = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, o = s.left - i - t.shiftAt(t.progress()), { start: a, end: l } = t.range(), c = (f) => a + f * (l - a), h = Vn(o, s.width, r, Ct(this.options.start) ?? "left right", t.shiftAt);
    this.startPx = c(h);
    const d = Ct(this.options.end) ?? "right left", u = typeof d == "string" ? d.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = u ? this.startPx + Number.parseFloat(u[1]) : c(Vn(o, s.width, r, d, t.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(t) {
    const n = (r, o) => {
      const a = Ct(r) ?? o;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const l = Zs(a);
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
      this.lastFrameTime = n, this.displayProgress = Uo(this.displayProgress, this.targetProgress, this.smoothing(), s);
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
function Ct(e) {
  return typeof e == "function" ? e() : e;
}
function Ec(e) {
  const t = new be(e);
  return t.start(), t;
}
const $e = /* @__PURE__ */ new Set(), sa = 16, jn = 0.5, ia = 2;
class zn {
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
    return t.addEventListener("wheel", this.onWheel, { passive: !1 }), t.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), $e.add(this), this.stopListening = be.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const t of $e) t.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const t = this.options.scroller ?? window;
    return t.removeEventListener("wheel", this.onWheel), t.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), $e.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const t of this.effects) Re(t.element, t.saved);
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
    this.target = s, this.journey = { from: this.current, to: s, ms: r * 1e3, ease: n.ease ?? ye, elapsed: 0 }, this.requestFrame();
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
    for (const t of this.effects) Re(t.element, t.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(t) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || t.ctrlKey || Math.abs(t.deltaX) > Math.abs(t.deltaY) || this.nestedScrollerTakes(t)) return;
    const n = t.deltaMode === 1 ? sa : t.deltaMode === 2 ? this.viewportHeight() : 1, s = t.deltaY * n * (this.options.wheelMultiplier ?? 1), i = this.clamp(this.target + s);
    i === this.target && i === this.current || (t.preventDefault(), this.journey = null, this.target = i, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const t = this.position();
    this.written !== null && Math.abs(t - this.written) <= ia || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = t, this.requestFrame());
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
      this.current += (this.target - this.current) * (1 - Math.exp(-n / r)), Math.abs(this.target - this.current) < jn && (this.current = this.target);
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
        i.lagged = t === 0 ? s : i.lagged + (s - i.lagged) * (1 - Math.exp(-t / o)), Math.abs(s - i.lagged) < jn ? i.lagged = s : n = !0, r += s - i.lagged;
      }
      Re(i.element, r === 0 ? i.saved : `0 ${ra(r)}px`), i.shift = r;
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
function Re(e, t) {
  t ? e.style.setProperty("translate", t) : e.style.removeProperty("translate");
}
function ra(e) {
  return Math.round(e * 100) / 100;
}
function oa(e, t) {
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
function fn(e, t, n, s, i = () => {
}) {
  const r = (f) => typeof f == "string" ? e.query(f) ?? void 0 : f, o = r(t.trigger) ?? s;
  if (!o) {
    i(`gsap-compat: scrollTrigger has no trigger element${typeof t.trigger == "string" ? ` for "${t.trigger}"` : ""}`);
    return;
  }
  const a = t.scrub === void 0 || t.scrub === !1 ? !1 : t.scrub, l = (t.toggleActions ?? "play none none none").trim().split(/\s+/);
  let c = 0, h;
  const d = (f, p) => () => {
    p?.(), n && !a && oa(n, l[f] ?? "none"), t.once && f === 0 && queueMicrotask(() => h.destroy());
  }, u = t.containerAnimation ? ca(e, t.containerAnimation, o, i) : void 0;
  return h = new be({
    trigger: o,
    start: t.start,
    end: t.end,
    scrub: a === !1 ? void 0 : a,
    pin: t.pin === !0 ? !0 : r(t.pin),
    scroller: r(t.scroller),
    horizontal: t.horizontal,
    pinSpacing: t.pinSpacing,
    onRefresh: t.invalidateOnRefresh && n?.invalidate ? () => n.invalidate() : void 0,
    snap: t.snap === void 0 ? void 0 : aa(t.snap, n),
    markers: t.markers,
    container: u,
    onUpdate: (f, p) => {
      if (n && a !== !1 && n.progress(f), t.onUpdate) {
        const m = f < c || p < 0 ? -1 : 1;
        t.onUpdate({ progress: f, velocity: p, direction: m });
      }
      c = f;
    },
    onEnter: d(0, t.onEnter),
    onLeave: d(1, t.onLeave),
    onEnterBack: d(2, t.onEnterBack),
    onLeaveBack: d(3, t.onLeaveBack)
  }), n && a === !1 && n.progress(0), h.start(), e.own(h);
}
function aa(e, t) {
  const n = (i) => i === "labels" ? (r) => la(r, t?.labelProgresses?.() ?? []) : i;
  if (typeof e != "object" || Array.isArray(e)) return n(e);
  const s = e.ease ? ae(e.ease) : void 0;
  return {
    snapTo: n(e.snapTo),
    duration: e.duration,
    delay: e.delay,
    ease: s ? s.fn ?? nt(s.easing) : void 0
  };
}
function la(e, t) {
  return t.reduce((n, s) => Math.abs(s - e) < Math.abs(n - e) ? s : n, t[0] ?? e);
}
function ca(e, t, n, s) {
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
class ti {
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
class ha {
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
    const r = new ti(this.host, this.scope);
    r.conditions = n, r.add(() => t.setup(r)), t.context = r;
  }
}
class ua {
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
const fa = { opacity: 0, y: -16 }, da = { opacity: 0, y: 16 };
async function pa(e, t, n, s) {
  const i = t.collector?.scope ?? t.root, r = i.ownerDocument ?? i, o = () => s.shared ? [...i.querySelectorAll(s.shared)] : [];
  if (s.native && typeof r.startViewTransition == "function")
    return ma(r, s, o);
  const a = s.duration ?? 0.35, l = s.ease ?? "power2.inOut", c = (g) => new Promise((y) => {
    g(y) || y();
  }), h = o(), d = h.length ? ze(t, h) : void 0, u = s.from !== void 0 ? Gn(t, s.from, s.shared) : [];
  if (u.length && s.leave !== !1) {
    const g = s.leave ?? fa;
    await c((y) => e.to(u, { ...g, duration: a, ease: l, onComplete: y }));
  }
  await s.update();
  const f = [], p = typeof s.to == "function" ? s.to() : s.to, m = p !== void 0 ? Gn(t, p, s.shared) : [];
  if (m.length && s.enter !== !1) {
    const g = s.enter ?? da;
    f.push(c((y) => e.fromTo(m, g, { ...Ks(g), duration: a, ease: l, onComplete: y })));
  }
  if (d) {
    const g = o().filter((y) => !h.includes(y));
    g.length && f.push(
      c(
        (y) => Ge(t, n, d, {
          targets: g,
          duration: a * 1.4,
          ease: l,
          enter: !1,
          onComplete: y
        })
      )
    );
  }
  await Promise.all(f);
}
function Gn(e, t, n) {
  const s = e.resolveTargets(t).map((i) => e.elementFor(i)).filter((i) => !!i);
  return n ? s.flatMap((i) => !i.querySelector(n) && !i.matches(n) ? [i] : [...i.children].filter((r) => !r.matches(n) && !r.querySelector(n))) : s;
}
async function ma(e, t, n) {
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
const ga = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (e, t) => cn(e, $r(t))
}, ya = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (e, t) => cn(e, { fn: Rr(t) })
}, ba = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (e, t) => cn(e, { fn: Lr(t) })
}, wa = /* @__PURE__ */ new Set([
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
]), Kn = 0.5, va = "power1.inOut";
function xa(e) {
  return e.keyframes !== void 0 && e.keyframes !== null;
}
function Ta(e) {
  const t = e.keyframes, n = {};
  for (const [c, h] of Object.entries(e)) wa.has(c) || (n[c] = h);
  if (Array.isArray(t))
    return t.map((c) => ({
      ...n,
      ...c,
      duration: c.duration ?? e.duration ?? Kn
    }));
  const s = Object.entries(t), i = e.duration ?? Kn, r = t.easeEach ?? e.easeEach ?? va;
  if (s.length > 0 && s.every(([c]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(c) || c === "easeEach")) {
    const c = s.filter(([u]) => u !== "easeEach").map(([u, f]) => ({ at: Number.parseFloat(u) / 100, step: f })).sort((u, f) => u.at - f.at), h = [];
    let d = 0;
    for (const { at: u, step: f } of c) {
      const p = Math.max(0, u - d);
      h.push({ ...n, ease: r, ...f, duration: p * i }), d = u;
    }
    return h;
  }
  const o = s.filter(([c, h]) => c !== "easeEach" && Array.isArray(h)), a = Math.max(0, ...o.map(([, c]) => c.length)), l = [];
  for (let c = 0; c < a; c++) {
    const h = { ...n, ease: r, duration: i / a };
    for (const [d, u] of o)
      c < u.length && (h[d] = u[c]);
    l.push(h);
  }
  return l;
}
function Zn(e, t, n, s = {}) {
  const i = t.collector?.scope ?? t.root, r = typeof s.scroller == "string" ? i.querySelector(s.scroller) : s.scroller ?? null, o = {
    x: r ? r.scrollLeft : window.scrollX,
    y: r ? r.scrollTop : window.scrollY
  }, a = {
    x: r ? r.scrollWidth - r.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: r ? r.scrollHeight - r.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, l = (w, b) => {
    if (b === void 0) return o[w];
    if (typeof b == "number") return b;
    if (b === "max") return a[w];
    const x = typeof b == "string" ? i.querySelector(b) : b;
    if (!x) return o[w];
    const v = x.getBoundingClientRect(), T = r?.getBoundingClientRect(), k = (w === "x" ? s.offsetX : s.offsetY) ?? s.offset ?? 0;
    return w === "x" ? v.left - (T?.left ?? 0) + o.x - k : v.top - (T?.top ?? 0) + o.y - k;
  }, c = typeof n == "object" && n !== null && !("nodeType" in n) ? { x: l("x", n.x), y: l("y", n.y) } : { x: o.x, y: l("y", n) }, h = { x: Math.max(0, Math.min(a.x, c.x)), y: Math.max(0, Math.min(a.y, c.y)) }, d = { ...o }, u = () => {
    r ? (r.scrollLeft = d.x, r.scrollTop = d.y) : window.scrollTo({ left: d.x, top: d.y, behavior: "instant" });
  }, f = ["wheel", "touchstart", "keydown"], p = r ?? window, m = () => {
    y.kill(), g();
  }, g = () => {
    for (const w of f) p.removeEventListener(w, m);
  }, y = e.to(d, {
    x: h.x,
    y: h.y,
    duration: s.duration ?? 1,
    ease: s.ease ?? "power2.inOut",
    onStart: s.onStart,
    onUpdate: () => {
      u(), s.onUpdate?.();
    },
    onComplete: () => {
      g(), s.onComplete?.();
    }
  });
  if (s.autoKill !== !1) for (const w of f) p.addEventListener(w, m, { passive: !0 });
  return y;
}
function Ma(e, t, n) {
  const s = e.collector?.scope ?? e.root, i = typeof t == "string" ? [...s.querySelectorAll(t)] : "nodeType" in t ? [t] : Array.from(t), { interval: r = 0.1, batchMax: o, onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h, ...d } = n, u = { onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h }, f = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, p = {}, m = (y) => {
    p[y] !== void 0 && clearTimeout(p[y]), p[y] = void 0;
    const w = f[y].splice(0);
    w.length > 0 && u[y]?.(w);
  }, g = (y, w) => {
    if (u[y]) {
      if (f[y].push(w), o !== void 0 && f[y].length >= o) return m(y);
      p[y] === void 0 && (p[y] = setTimeout(() => m(y), r * 1e3));
    }
  };
  return i.map(
    (y) => fn(e, {
      ...d,
      trigger: y,
      onEnter: () => g("onEnter", y),
      onLeave: () => g("onLeave", y),
      onEnterBack: () => g("onEnterBack", y),
      onLeaveBack: () => g("onLeaveBack", y)
    })
  ).filter((y) => y !== void 0);
}
class Q {
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
    if (this.options = s, this.compat = new bt({
      ...s,
      startValue: (i, r) => {
        const o = t.objectFor(i);
        if (o) return Ea(o[r]);
        const a = t.appliedValue(i, r);
        if (a !== void 0) return a;
        if (r === "d") return js(t.elementFor(i)) ?? void 0;
        if (r === "text") return t.elementFor(i)?.textContent ?? void 0;
        if (r === "strokeDasharray" || r === "strokeDashoffset") {
          const l = ts(t.elementFor(i));
          if (l !== void 0) return r === "strokeDasharray" ? [l, l] : 0;
        }
      },
      startVelocity: (i, r) => t.velocityOf(i, r),
      layoutColumns: (i) => Qn(i.map((r) => t.elementFor(r))),
      random: () => t.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, t.collector?.track(this), t.liveTimelines.add(this), this.autoplayPending = !s.paused && !s.scrollTrigger, s.scrollTrigger) {
      const i = s.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = fn(t, i, this, this.firstElement, (r) => s.onWarning?.(r)));
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
    return xa(n) ? this.record(() => this.keyframed(t, n, s)) : this.record(() => this.tween(t, [n], s, ([i], r, o) => this.compat.to(r, i, o)));
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
    const i = this.timeline.currentTime, r = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(n))), o = { time: i }, a = s.duration ?? Math.abs(r - i) / 1e3 / (this.timeScale() || 1), l = new Q(this.stage, { onStart: s.onStart, onComplete: s.onComplete });
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
    const i = this.events, { crossings: r, passes: o } = Rs(
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
      const d = (u, f, p) => {
        i(u, f, p), c = Math.min(c, this.compat.lastStart), h = Math.max(h, this.compat.lastEnd);
      };
      if (this.buildTween(r, n, s, d), c === 1 / 0) return;
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
    const r = Ta(n);
    if (r.length === 0) return;
    const o = i.length > 1 ? Ue(n.stagger, this.staggerContext(i)) : void 0, a = i.map((g) => this.targetFor(g)).filter((g) => g !== void 0), l = o ? a.map((g) => [g]) : [a], c = o ? Ye(i.length, o).map((g) => g / 1e3) : [0], h = this.compat.timeOf(s) / 1e3 + le(n.delay, 0) / 1e3;
    let d = 1 / 0, u = -1 / 0;
    if (l.forEach((g, y) => {
      r.forEach((w, b) => {
        const x = b === 0 ? h + c[y] : ">";
        this.tween(g, [w], x, ([v], T, k) => this.compat.to(T, v, k)), d = Math.min(d, this.compat.lastStart), u = Math.max(u, this.compat.lastEnd);
      });
    }), d === 1 / 0) return;
    const { onStart: f, onUpdate: p, onComplete: m } = n;
    f && this.events.push({ time: d, direction: "forward", run: f }), p && this.ranges.push({ start: d, end: u, run: p }), m && this.events.push({ time: u, direction: "forward", run: m });
  }
  staggerContext(t) {
    return {
      count: t.length,
      columnsFromLayout: () => Qn(t.map((n) => this.stage.elementFor(n))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(t, n, s, i) {
    const r = t.map((u) => this.targetFor(u));
    if (!(t.length > 1 && (n.some(Aa) || t.some((u) => this.stage.objectFor(u) !== void 0)))) {
      const u = this.targetFor(t[0]);
      i(n.map((f) => this.prepare(Jn(f, 0, u, this.stage.utils, r), t)), t, s);
      return;
    }
    const a = n.length - 1, { stagger: l, ...c } = n[a], h = Ue(l, this.staggerContext(t)), d = h ? Ye(t.length, h).map((u) => u / 1e3) : t.map(() => 0);
    t.forEach((u, f) => {
      const p = f === 0 ? le(c.delay, 0) / 1e3 + d[0] : 0, m = f === 0 ? 0 : d[f] - d[f - 1], g = f === 0 ? s : `<${m < 0 ? "-" : "+"}${Math.abs(m).toFixed(6)}`, w = n.map((b, x) => x === a ? { ...c, delay: p } : b).map((b) => this.prepare(Jn(b, f, this.targetFor(u), this.stage.utils, r), [u]));
      i(w, [u], g);
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
      const o = Eo(t.motionPath, {
        query: i,
        targets: n.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: s
      });
      r = { ...r, motionPath: o };
    }
    if (t.morphSVG !== void 0) {
      const o = Po(t.morphSVG, i, s), { morphSVG: a, ...l } = r;
      r = o ? { ...r, morphSVG: o } : l;
    }
    if (t.drawSVG !== void 0) {
      const o = ts(this.stage.elementFor(n[0]));
      if (o === void 0) {
        s("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...l } = r;
        r = l;
      } else
        r = eo(r, o);
    }
    return r;
  }
  resolve(t) {
    const n = this.stage.resolveTargets(t);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${Pa(t)}`);
      return;
    }
    return this.firstElement ??= n.map((s) => this.stage.elementFor(s)).find((s) => s !== void 0), n;
  }
}
function ka(e = new Mo()) {
  const t = (r) => {
    const { config: o } = te(r);
    return new Q(e, {
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
    const { onStart: o, onUpdate: a, onComplete: l, onRepeat: c, onReverseComplete: h, repeatRefresh: d, ...u } = r;
    return u;
  }, s = (r) => (r && e.collector?.track(r), r), i = {
    stage: e,
    ticker: e.ticker,
    utils: e.utils,
    getProperty: (r, o) => {
      const [a] = e.resolveTargets(r);
      if (a === void 0) return;
      const l = e.objectFor(a);
      return l ? l[o] : e.appliedValue(a, o) ?? Xs(o);
    },
    scrollTrigger: (r) => s(fn(e, r)),
    scrollBatch: (r, o) => Ma(e, r, o).map((a) => s(a)),
    scrollTo: (r, o) => Zn(i, e, r, o),
    refreshScroll: () => {
      be.refreshAll(), zn.refreshAll();
    },
    smoothScroll: (r = {}) => {
      const o = typeof r.scroller == "string" ? (e.collector?.scope ?? e.root).querySelector(r.scroller) : r.scroller;
      return s(new zn({ ...r, scroller: o }).start());
    },
    context: (r, o) => {
      const a = new ti(e, o);
      return r && a.add(() => r(a)), a;
    },
    matchMedia: (r) => new ha(e, r),
    customEase: ga.create,
    customBounce: ya.create,
    customWiggle: ba.create,
    pageTransition: (r) => pa(i, e, (o) => new Q(e, o), r),
    imageSequence: (r, o) => {
      const a = typeof r == "string" ? (e.collector?.scope ?? e.root).querySelector(r) : r;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(r)}`);
      return s(new ua(a, o));
    },
    quickTo: (r, o, a = {}) => {
      const l = new Q(e, { paused: !0 }), [c] = e.resolveTargets(r);
      return Object.assign((d) => {
        if (!c) return;
        const u = a.spring !== void 0 ? e.velocityOf(c, o) ?? 0 : 0;
        l.compat.reset(), l.compat.to(c, {
          [o]: d,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: Sa(a.spring, o, u) }
        }), l.timeline.stop(), l.timeline.play(), e.activate(l.timeline);
      }, { tween: l, kill: () => l.kill() });
    },
    timeline: (r) => new Q(e, r),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (r, o) => {
      if (o.scrollTo !== void 0) {
        const { scrollTo: a, ...l } = o, c = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, h = typeof r != "string" && r !== window && r.nodeType === 1;
        return Zn(i, e, a, {
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
    delayedCall: (r, o, a) => new Q(e).call(o, a, r),
    killTweensOf: (r, o) => {
      const a = e.resolveTargets(r), l = typeof o == "string" ? o.split(",").map((c) => c.trim()).filter(Boolean) : o;
      for (const c of [...e.liveTimelines]) c.killTweensOf(a, l);
    },
    convertToPath: (r) => Co(r, e.root),
    splitText: (r, o) => {
      const a = e.collector?.scope ?? e.root, l = typeof r == "string" ? Array.from(a.querySelectorAll(r)) : "nodeType" in r ? [r] : Array.from(r);
      return s(Yo(l, o));
    },
    draggable: (r, o) => s(Oo(i, e, r, o)),
    getFlipState: (r) => ze(e, r),
    flipFrom: (r, o) => Ge(e, (a) => new Q(e, a), r, o),
    flip: (r, o, a) => {
      const l = ze(e, r);
      return o(), Ge(e, (c) => new Q(e, c), l, { targets: r, ...a });
    }
  };
  return i;
}
const H = /* @__PURE__ */ ka();
function Sa(e, t, n) {
  return e === !0 ? { velocity: { [t]: n } } : typeof e == "string" ? { preset: e, velocity: { [t]: n } } : { ...e, velocity: { [t]: n } };
}
function Aa(e) {
  return e.morphSVG !== void 0 || e.drawSVG !== void 0 || e.text !== void 0 || e.scrambleText !== void 0 || ei(e);
}
function ei(e) {
  return Object.entries(e).some(([t, n]) => (typeof n == "function" || qs(n)) && !hn.has(t));
}
function Jn(e, t, n, s, i) {
  if (!ei(e)) return e;
  const r = {};
  for (const [o, a] of Object.entries(e))
    hn.has(o) ? r[o] = a : typeof a == "function" ? r[o] = a(t, n, i) : qs(a) ? r[o] = s.resolveRandomString(a) : r[o] = a;
  return r;
}
function Qn(e) {
  const t = e.map((s) => s?.getBoundingClientRect().top);
  if (t[0] === void 0) return e.length;
  let n = 0;
  for (const s of t) {
    if (s === void 0 || Math.abs(s - t[0]) > 1) break;
    n++;
  }
  return Math.max(1, n);
}
function ts(e) {
  const t = e;
  if (typeof t?.getTotalLength == "function")
    return t.getTotalLength();
}
function Ea(e) {
  if (typeof e == "number" || typeof e == "string" || Array.isArray(e) && e.every((t) => typeof t == "number")) return e;
}
function Pa(e) {
  return typeof e == "string" ? `"${e}"` : String(e);
}
class es {
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
function _a(e, t, n, s, i) {
  const r = n - i;
  if (r < 0) {
    t.paused || t.pause(), t.currentTime = 0;
    return;
  }
  e.update(r, s);
}
class dn {
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
    this.options = n, this.adapter = new ut();
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
    this.options.speed !== void 0 && (n.speed = this.options.speed), this.options.loop !== void 0 && (n.loop = this.options.loop), this.options.alternate !== void 0 && (n.alternate = this.options.alternate), this.timeline = Dt({ ...t, config: n }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
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
      r !== null && (s.volume = Math.max(0, Math.min(1, Number(r) || 0))), this.mediaTargets.push({ el: s, startTime: i, sync: new es(s) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(t, n) {
    for (const s of this.mediaTargets)
      _a(s.sync, s.el, t, n, s.startTime);
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
      const o = new ut();
      s.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const l = a.getAttribute("data-tinyfly");
        l && o.registerTarget(l, a);
      }), this.symbolInstances.push({ adapter: o, timeline: Dt(r.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(t, n) {
    this.mediaSync = new es(t, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const { crossings: r } = Rs(
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
async function Pc(e, t, n = {}) {
  const s = new dn(e, { ...n, autoplay: !0 });
  return await s.load(t), s;
}
function _c(e, t = {}) {
  return new dn(e, t);
}
const Ca = {
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
}, ns = "tinyfly-controls-style", Ia = `
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
let $a = 0;
function Ra(e) {
  if (e.getElementById(ns)) return;
  const t = e.createElement("style");
  t.id = ns, t.textContent = Ia, e.head.appendChild(t);
}
function La(e, t, n = {}) {
  const s = t.ownerDocument;
  Ra(s);
  const i = { ...Ca, ...n.labels }, r = n.speeds ?? [0.5, 1, 2], o = () => e.markers.length > 0, a = () => e.markers.some((E) => E.label !== void 0 || e.caption(E.id) !== void 0), l = s.createElement("div");
  l.className = "tf-ctl";
  const c = s.createElement("div");
  c.className = "tf-ctl-bar", c.setAttribute("role", "group");
  const h = (E, I, R, D = "") => {
    const B = s.createElement("button");
    return B.type = "button", B.className = `tf-ctl-btn ${D}`.trim(), B.setAttribute("aria-label", E), B.title = E, B.textContent = I, B.addEventListener("click", R), B;
  }, d = h(i.restart, "⟲", () => {
    e.pause(), e.seek(0);
  }), u = h(i.prev, "|◀", () => e.prev()), f = h(i.play, "▶", () => e.isPlaying ? e.pause() : m(), "tf-ctl-primary"), p = h(i.next, "▶|", () => e.next()), m = () => {
    e.currentTime >= e.duration - 0.5 && e.seek(0), e.play();
  }, g = s.createElement("input");
  g.type = "range", g.className = "tf-ctl-scrub", g.min = "0", g.max = "1000", g.step = "1", g.setAttribute("aria-label", i.scrub), g.addEventListener("input", () => {
    e.pause(), e.seek(Number(g.value) / 1e3 * e.duration);
  });
  const y = s.createElement("span");
  y.className = "tf-ctl-step";
  const w = s.createElement("select");
  w.className = "tf-ctl-speed", w.setAttribute("aria-label", i.speed);
  for (const E of r) {
    const I = s.createElement("option");
    I.value = String(E), I.textContent = `${E}×`, E === 1 && (I.selected = !0), w.appendChild(I);
  }
  w.addEventListener("change", () => e.setSpeed(Number(w.value))), c.append(d, u, f, p, g, y), r.length > 0 && c.append(w), l.append(c);
  const b = n.fullscreen ? Ba(t, s, i) : void 0;
  b && c.append(b.button);
  const x = s.createElement("p");
  x.className = "tf-ctl-caption", x.setAttribute("aria-live", "polite"), n.captions !== !1 && l.append(x);
  const v = s.createElement("div");
  v.className = "tf-ctl-question", v.hidden = !0;
  const T = s.createElement("span"), k = h(i.reveal, i.reveal, () => e.play(), "tf-ctl-primary");
  v.append(T, k), l.append(v);
  const _ = Fa(e, s, i.scenario, n.scenarioControl ?? "buttons");
  _ && l.append(_.element);
  const $ = n.mount;
  $ ? $.appendChild(l) : t.insertAdjacentElement("afterend", l);
  const C = () => {
    const E = e.isPlaying;
    f.textContent = E ? "❚❚" : "▶", f.setAttribute("aria-label", E ? i.pause : i.play), f.title = E ? i.pause : i.play;
    const I = e.duration;
    s.activeElement !== g && (g.value = String(I > 0 ? Math.round(e.currentTime / I * 1e3) : 0));
    const R = e.markers;
    if (u.hidden = p.hidden = y.hidden = R.length === 0, R.length > 0) {
      const D = e.currentMarker, B = D ? R.indexOf(D) + 1 : 0;
      y.textContent = i.stepFormat.replace("{index}", String(B)).replace("{total}", String(R.length)), y.setAttribute("aria-label", `${i.step} ${B} ${i.of} ${R.length}`), u.disabled = e.currentTime <= 0.5, p.disabled = e.currentTime >= I - 0.5;
      const L = e.caption() ?? "";
      x.textContent !== L && (x.textContent = L), x.hidden = !a();
      const O = !E && D?.question !== void 0 && Math.abs(e.currentTime - D.time) < 1;
      v.hidden = !O, O && T.textContent !== D.question && (T.textContent = D.question);
    } else
      v.hidden = !0, x.hidden = !0;
    _?.update();
  }, S = e.subscribe(C);
  C();
  const A = n.keyboardScope ?? t;
  !A.hasAttribute("tabindex") && A.tabIndex < 0 && (A.tabIndex = 0);
  const M = /* @__PURE__ */ new WeakSet(), P = (E) => {
    if (M.has(E) || (M.add(E), E.defaultPrevented || E.altKey || E.ctrlKey || E.metaKey)) return;
    const I = E.target;
    if (!(I.tagName === "INPUT" || I.tagName === "SELECT") && !(E.key === " " && I.tagName === "BUTTON"))
      switch (E.key) {
        case " ":
          E.preventDefault(), e.isPlaying ? e.pause() : m();
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
  return A.addEventListener("keydown", P), l.addEventListener("keydown", P), {
    element: l,
    fullscreen: b && {
      get active() {
        return b.active;
      },
      enter: b.enter,
      exit: b.exit
    },
    destroy() {
      b?.destroy(), S(), A.removeEventListener("keydown", P), l.removeEventListener("keydown", P), l.remove();
    }
  };
}
function Fa(e, t, n, s) {
  const i = e.scenarios;
  if (i.length < 2) return;
  if (s === "slider") {
    const h = t.createElement("div");
    h.className = "tf-ctl-choice-slider";
    const d = t.createElement("span");
    d.textContent = n, d.setAttribute("aria-hidden", "true");
    const u = t.createElement("input");
    u.type = "range", u.min = "0", u.max = String(i.length - 1), u.step = "1", u.setAttribute("aria-label", n);
    const f = t.createElement("output");
    return f.setAttribute("aria-hidden", "true"), u.addEventListener("input", () => {
      const m = i[Number(u.value)];
      m && e.setScenario(m.id);
    }), h.append(d, u, f), { element: h, update: () => {
      const m = Math.max(0, i.findIndex((y) => y.id === e.scenario));
      t.activeElement !== u && (u.value = String(m));
      const g = i[m].label;
      f.textContent !== g && (f.textContent = g), u.setAttribute("aria-valuetext", g);
    } };
  }
  const r = t.createElement("fieldset");
  r.className = "tf-ctl-choices";
  const o = t.createElement("legend");
  o.textContent = n, r.append(o);
  const a = `tf-ctl-scenario-${++$a}`, l = i.map((h) => {
    const d = t.createElement("label");
    d.className = "tf-ctl-choice";
    const u = t.createElement("input");
    u.type = "radio", u.name = a, u.value = h.id, u.addEventListener("change", () => {
      u.checked && e.setScenario(h.id);
    });
    const f = t.createElement("span");
    return f.textContent = h.label, d.append(u, f), r.append(d), u;
  });
  return { element: r, update: () => {
    for (const h of l) {
      const d = h.value === e.scenario;
      h.checked !== d && (h.checked = d);
    }
  } };
}
const Oa = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', Da = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function Ba(e, t, n) {
  const s = t, i = e, r = t.createElement("button");
  r.type = "button", r.className = "tf-ctl-btn tf-ctl-fullscreen";
  let o, a = "";
  const l = () => {
    const m = o !== void 0;
    r.innerHTML = m ? Da : Oa;
    const g = m ? n.exitFullscreen : n.fullscreen;
    r.setAttribute("aria-label", g), r.title = g, r.setAttribute("aria-pressed", String(m)), e.classList.toggle("tf-fullscreen", m), e.classList.toggle("tf-fullscreen-overlay", o === "overlay");
  }, c = () => s.fullscreenElement ?? s.webkitFullscreenElement ?? null, h = () => {
    c() === e ? o = "native" : o === "native" && (o = void 0), l();
  }, d = (m) => {
    m.key === "Escape" && p();
  }, u = () => {
    o = "overlay", a = t.documentElement.style.overflow, t.documentElement.style.overflow = "hidden", t.addEventListener("keydown", d), l();
  };
  async function f() {
    if (o) return;
    const m = i.requestFullscreen?.bind(i) ?? i.webkitRequestFullscreen?.bind(i), g = s.fullscreenEnabled ?? s.webkitFullscreenEnabled ?? !1;
    if (m && g)
      try {
        if (await m(), c() === e) {
          o = "native", l();
          return;
        }
      } catch {
      }
    u();
  }
  async function p() {
    if (o === "overlay")
      t.removeEventListener("keydown", d), t.documentElement.style.overflow = a, o = void 0, l();
    else if (o === "native") {
      o = void 0, l();
      const m = s.exitFullscreen?.bind(s) ?? s.webkitExitFullscreen?.bind(s);
      c() === e && m && await m();
    }
  }
  return r.addEventListener("click", () => {
    o ? p() : f();
  }), t.addEventListener("fullscreenchange", h), t.addEventListener("webkitfullscreenchange", h), l(), {
    button: r,
    get active() {
      return o !== void 0;
    },
    enter: f,
    exit: p,
    destroy() {
      p(), t.removeEventListener("fullscreenchange", h), t.removeEventListener("webkitfullscreenchange", h), r.remove();
    }
  };
}
const ss = "tinyfly-choices-style", Na = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function Ya(e) {
  if (e.getElementById(ss)) return;
  const t = e.createElement("style");
  t.id = ss, t.textContent = Na, e.head.appendChild(t);
}
function Wa(e, t) {
  const n = Array.from(t.querySelectorAll("[data-tinyfly-choose]"));
  if (n.length === 0) return () => {
  };
  Ya(t.ownerDocument);
  const s = [], i = [];
  for (const a of n) {
    const l = a.getAttribute("data-tinyfly-choose") ?? "", c = [], h = (p, m) => {
      a.hasAttribute(p) || (a.setAttribute(p, m), c.push(p));
    };
    h("role", "button"), h("tabindex", "0");
    const d = e.scenarios.find((p) => p.id === l)?.label;
    d !== void 0 && h("aria-label", d), a.setAttribute("aria-pressed", "false"), c.push("aria-pressed"), s.push({ element: a, attributes: c });
    const u = () => e.setScenario(l), f = (p) => {
      const m = p.key;
      m !== "Enter" && m !== " " || (p.preventDefault(), u());
    };
    a.addEventListener("click", u), a.addEventListener("keydown", f), i.push(() => {
      a.removeEventListener("click", u), a.removeEventListener("keydown", f);
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
const he = /* @__PURE__ */ new WeakMap(), Ke = /* @__PURE__ */ new WeakMap();
let qa = 0;
function Rt(e, t, n) {
  if (e)
    try {
      return JSON.parse(e);
    } catch (s) {
      console.warn(`tinyfly: invalid ${t} JSON on`, n, s);
      return;
    }
}
async function Xa(e, t = {}) {
  const n = he.get(e);
  if (n) return n;
  const s = Array.from(e.querySelectorAll("script[data-tinyfly-timeline]")), i = s[0], r = e.getAttribute("data-src"), o = Va(e.getAttribute("data-markers")), a = s.length > 1 || i?.hasAttribute("data-scenario") ? Ha(s, o, e) : void 0;
  if (a && a.length === 0) return;
  let l = i && !a ? Rt(i.textContent, "timeline", e) : void 0;
  if (!l && r && o) {
    const f = await fetch(r);
    f.ok && (l = await f.json());
  }
  if (l && o && (l = ni(l, o)), !l && !r && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', e);
    return;
  }
  const c = Rt(e.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", e), h = {
    playWhenVisible: !0,
    ...t.player,
    ...c && { captions: c },
    ...Rt(e.getAttribute("data-options"), "data-options", e)
  };
  ja(e);
  const d = new dn(e, h), u = { element: e, player: d };
  if (he.set(e, u), e.setAttribute("data-tinyfly-mounted", ""), a) {
    const f = e.getAttribute("data-scenario") ?? void 0;
    await d.loadScenarios(a, { initial: a.some((p) => p.id === f) ? f : void 0 }), Ke.set(e, Wa(d, e));
  } else
    await d.load(l ?? r);
  if (e.getAttribute("data-controls") !== "false") {
    const f = Rt(e.getAttribute("data-labels"), "data-labels", e), p = e.querySelector("figcaption"), m = e.getAttribute("data-scenario-legend"), g = e.getAttribute("data-scenario-control");
    u.controls = La(d, e, {
      ...t.controls,
      ...e.getAttribute("data-fullscreen") === "true" ? { fullscreen: !0 } : {},
      ...g === "slider" || g === "buttons" ? { scenarioControl: g } : {},
      labels: { ...t.controls?.labels, ...f, ...m ? { scenario: m } : {} },
      // Inside the figure, before its figcaption, so the caption stays last.
      mount: void 0
    }), p ? e.insertBefore(u.controls.element, p) : e.appendChild(u.controls.element);
  }
  return u;
}
function Ha(e, t, n) {
  const s = [];
  return e.forEach((i, r) => {
    const o = Rt(i.textContent, "timeline", n);
    if (!o) return;
    const a = i.getAttribute("data-scenario") || `scenario-${r + 1}`;
    if (s.some((c) => c.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, n);
      return;
    }
    const l = i.getAttribute("data-scenario-label") ?? void 0;
    s.push({ id: a, label: l, timeline: t ? ni(o, t) : o });
  }), s;
}
function ni(e, t) {
  return e.config.markers?.length ? e : { ...e, config: { ...e.config, markers: t.map((n, s) => ({ id: `step-${s + 1}`, time: n })) } };
}
function Va(e) {
  if (!e) return;
  const t = e.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((n, s) => n - s);
  return t.length > 0 ? t : void 0;
}
async function Ua(e = document, t = {}) {
  const n = Array.from(e.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(n.map((i) => Xa(i, t)))).filter((i) => i !== void 0);
}
function Cc(e) {
  const t = he.get(e);
  t && (Ke.get(e)?.(), Ke.delete(e), t.controls?.destroy(), t.player.destroy(), he.delete(e), e.removeAttribute("data-tinyfly-mounted"));
}
function ja(e) {
  const t = e.querySelector("svg");
  if (!t || t.hasAttribute("role") || t.hasAttribute("aria-hidden")) return;
  const n = e.getAttribute("data-alt"), s = e.querySelector("figcaption");
  t.setAttribute("role", "img"), n ? t.setAttribute("aria-label", n) : s && (s.id ||= `tinyfly-caption-${++qa}`, t.setAttribute("aria-labelledby", s.id));
}
function za() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const t = () => {
    Ua();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", t, { once: !0 }) : t();
}
class Ga {
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
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new ut(), this.adapterB = new ut();
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
      const a = new ut();
      i.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const c = l.getAttribute("data-tinyfly");
        c && a.registerTarget(c, l);
      }), s.push({ adapter: a, timeline: Dt(o) });
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
    return t.timeline ? Dt(t.timeline) : null;
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
async function Ic(e, t, n = {}) {
  const s = new Ga(e, { ...n, autoplay: !0 });
  return await s.load(t), s;
}
const $c = { type: "none", duration: 0 };
function Ka(e) {
  let t = 0;
  for (let n = 1; n < e.length; n++) t += Math.hypot(e[n].x - e[n - 1].x, e[n].y - e[n - 1].y);
  return t;
}
function Nt(e, t) {
  const n = Math.min(1, Math.max(0, t));
  if (e.length < 2 || n === 1) return e.slice();
  if (n === 0) return e.slice(0, 1);
  let s = Ka(e) * n;
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
function si(e, t) {
  const n = Nt(e, t);
  return n[n.length - 1];
}
function ii(e, t) {
  return t > 0 ? Math.floor(Math.max(0, e) * t / 1e3) : 0;
}
function Ze(e, t, n) {
  const s = t.roughness ?? 2, i = Math.max(1, Math.round(t.passes ?? 2)), r = ii(n, t.boil ?? 8);
  let o = 0;
  const a = () => {
    const u = o++;
    return (f) => an(Fs(`${t.seed ?? 1}:${r}:${u}:${f}`));
  }, l = (u, f) => (u.next() * 2 - 1) * f, c = (u) => {
    const f = a(), p = e.lineWidth, m = e.globalAlpha;
    for (let g = 0; g < i; g++)
      e.lineWidth = g === 0 ? p : p * 0.55, e.globalAlpha = g === 0 ? m : m * 0.6, u(f(g));
    e.lineWidth = p, e.globalAlpha = m;
  }, h = (u, f = 1) => {
    if (u.length < 2) return;
    const p = u.slice(1).map((g, y) => Math.hypot(g.x - u[y].x, g.y - u[y].y)), m = p.reduce((g, y) => g + y, 0) * Math.min(1, Math.max(0, f));
    c((g) => {
      const y = [], w = [];
      if (u.forEach((x, v) => {
        y.push({ x: x.x + l(g, s * 0.5), y: x.y + l(g, s * 0.5) }), v > 0 && w.push([g.next() * 2 - 1, g.next() * 2 - 1]);
      }), m <= 0) return;
      e.beginPath(), e.moveTo(y[0].x, y[0].y);
      let b = 0;
      for (let x = 1; x < y.length; x++) {
        const v = Za(y[x - 1], y[x], s, w[x - 1]), T = p[x - 1];
        if (b + T <= m) {
          e.bezierCurveTo(v[1].x, v[1].y, v[2].x, v[2].y, v[3].x, v[3].y), b += T;
          continue;
        }
        const k = Ja(v, T === 0 ? 1 : (m - b) / T);
        e.bezierCurveTo(k[1].x, k[1].y, k[2].x, k[2].y, k[3].x, k[3].y);
        break;
      }
      e.stroke();
    });
  }, d = (u, f, p, m, g = 1) => {
    c((y) => {
      const b = y.next() * Math.PI * 2, x = Math.PI * 2 + 0.15 + y.next() * 0.3, v = [];
      for (let k = 0; k <= 14; k++) {
        const _ = b + x * k / 14, $ = l(y, s * 0.6);
        v.push({ x: u + Math.cos(_) * (p + $), y: f + Math.sin(_) * (m + $) });
      }
      const T = Nt(v, g);
      T.length < 2 || (is(e, T), e.stroke());
    });
  };
  return {
    line: h,
    curve(u, f = 1) {
      if (u.length < 2) return;
      const p = u[0], m = u[u.length - 1], g = Math.hypot(m.x - p.x, m.y - p.y) || 1, y = -(m.y - p.y) / g, w = (m.x - p.x) / g;
      c((b) => {
        const x = { x: l(b, s * 0.5), y: l(b, s * 0.5) }, v = { x: l(b, s * 0.5), y: l(b, s * 0.5) }, T = l(b, s * Math.min(1.5, Math.max(0.3, g / 80))), k = u.map(($, C) => {
          const S = C / (u.length - 1), A = Math.sin(Math.PI * S) * T;
          return {
            x: $.x + x.x + (v.x - x.x) * S + y * A,
            y: $.y + x.y + (v.y - x.y) * S + w * A
          };
        }), _ = Nt(k, f);
        _.length < 2 || (is(e, _), e.stroke());
      });
    },
    circle(u, f, p, m = 1) {
      d(u, f, p, p, m);
    },
    ellipse: d,
    nudge(u = 0.5) {
      const f = a()(0);
      return { x: l(f, s * u), y: l(f, s * u) };
    }
  };
}
function Za(e, t, n, s) {
  const i = t.x - e.x, r = t.y - e.y, o = Math.hypot(i, r) || 1, a = n * Math.min(1.5, Math.max(0.3, o / 80)), l = -r / o, c = i / o;
  return [
    e,
    { x: e.x + i / 3 + l * s[0] * a, y: e.y + r / 3 + c * s[0] * a },
    { x: e.x + 2 * i / 3 + l * s[1] * a, y: e.y + 2 * r / 3 + c * s[1] * a },
    t
  ];
}
function Ja([e, t, n, s], i) {
  const r = (d, u) => ({ x: d.x + (u.x - d.x) * i, y: d.y + (u.y - d.y) * i }), o = r(e, t), a = r(t, n), l = r(n, s), c = r(o, a), h = r(a, l);
  return [e, o, c, r(c, h)];
}
function is(e, t) {
  e.beginPath(), e.moveTo(t[0].x, t[0].y);
  for (let s = 1; s < t.length - 1; s++) {
    const i = { x: (t[s].x + t[s + 1].x) / 2, y: (t[s].y + t[s + 1].y) / 2 };
    e.quadraticCurveTo(t[s].x, t[s].y, i.x, i.y);
  }
  const n = t[t.length - 1];
  e.lineTo(n.x, n.y);
}
function ee(e, t, n) {
  const s = e.length;
  if (s < 2) return [];
  const i = [], r = [], o = (a) => t + (n - t) * a / (s - 1);
  return e.forEach((a, l) => {
    const c = e[Math.max(0, l - 1)], h = e[Math.min(s - 1, l + 1)], d = Math.hypot(h.x - c.x, h.y - c.y) || 1, u = o(l) / 2, f = -(h.y - c.y) / d * u, p = (h.x - c.x) / d * u;
    i.push({ x: a.x + f, y: a.y + p }), r.push({ x: a.x - f, y: a.y - p });
  }), [...i, ...r.reverse()];
}
function ri(e, t, n, s) {
  const i = t.length;
  if (i < 2) return;
  const r = ee(t, n, s), o = (a) => n + (s - n) * a / (i - 1);
  e.beginPath(), e.moveTo(r[0].x, r[0].y);
  for (const a of r.slice(1)) e.lineTo(a.x, a.y);
  e.closePath(), e.fill(), t.forEach((a, l) => {
    l !== 0 && l !== i - 1 && i > 3 || (e.beginPath(), e.arc(a.x, a.y, o(l) / 2, 0, Math.PI * 2), e.fill());
  });
}
function Mt(e, t, n, s, i = 16) {
  const r = { x: 2 * t.x - (e.x + n.x) / 2, y: 2 * t.y - (e.y + n.y) / 2 }, o = [];
  for (let a = 0; a <= i; a++) {
    const l = a / i, c = l < 0.5 ? { x: e.x + (t.x - e.x) * 2 * l, y: e.y + (t.y - e.y) * 2 * l } : { x: t.x + (n.x - t.x) * (2 * l - 1), y: t.y + (n.y - t.y) * (2 * l - 1) }, h = 1 - l, d = {
      x: h * h * e.x + 2 * h * l * r.x + l * l * n.x,
      y: h * h * e.y + 2 * h * l * r.y + l * l * n.y
    };
    o.push({ x: c.x + (d.x - c.x) * s, y: c.y + (d.y - c.y) * s });
  }
  return o;
}
const kt = {
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
  stretch: 1,
  turn: 0,
  sit: 0
};
function X(e) {
  return { ...kt, ...e };
}
const oi = {
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
}, Y = (e) => ({ ...oi, ...e }), tt = {
  neutral: oi,
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
function Qa(e, t) {
  return { ...e, ...typeof t == "string" ? tt[t] : t };
}
const tl = {
  rest: kt,
  wave: X({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...tt.happy }),
  cheer: X({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...tt.joyful }),
  shrug: X({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...tt.confused, lookX: 0, lookY: 0 }),
  point: X({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: X({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...tt.thinking }),
  handsOnHips: X({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: X({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...tt.sad }),
  surprised: X({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...tt.surprised }),
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: X({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  // Seated, hands resting on the knees. Arm angles spread outward per side, so
  // reaching forward (+x, the way the figure faces) is negative for the left arm.
  sit: X({ sit: 1, turn: 0.5, leftShoulder: -25, rightShoulder: 25, leftElbow: -55, rightElbow: 55 }),
  jump: X({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...tt.joyful })
}, ai = Object.keys(kt);
function el(e, t, n) {
  const s = { ...e };
  for (const i of ai) s[i] = e[i] + (t[i] - e[i]) * n;
  return s;
}
const Je = 24, rs = 4, os = 28, nl = 40;
function sl(e, t = kt, n = 1) {
  const s = Math.sin(e * Math.PI * 2) * n, i = Math.cos(e * Math.PI * 2) * n, r = (c) => c <= nl, o = (c) => r(c) ? 22 * s : c, a = r(t.leftShoulder) ? t.leftElbow - os * Math.max(0, -s) : t.leftElbow, l = r(t.rightShoulder) ? t.rightElbow + os * Math.max(0, s) : t.rightElbow;
  return {
    ...t,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: t.lean + rs * n,
    headTilt: t.headTilt - rs * 0.5 * n,
    leftElbow: a,
    rightElbow: l,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -Je * s,
    rightHip: -Je * s,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, i),
    rightKnee: 30 * Math.max(0, -i),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: o(t.leftShoulder),
    rightShoulder: o(t.rightShoulder)
  };
}
function Rc(e, t = 1) {
  return 4 * ((Qe + ue) * e) * Math.sin(Je * t * Math.PI / 180);
}
function il(e) {
  const t = Math.abs(Math.sin(e / 65)), n = 0.55 + 0.45 * Math.sin(e / 310);
  return t * n;
}
const li = 0.12, as = 0.46, rl = 1 - 2 * li, ol = 0.1, al = 0.21, ll = 0.19, Qe = 0.24, ue = 0.22, ci = 0.12, cl = 0.14, hi = 0.33, ls = 0.7, cs = 0.3, hl = 0.35, ul = [1.7, 1.05], fl = [1.3, 0.75], hs = [1.45, 0.85], dl = [1.15, 0.75], us = 0.06, pl = 0.7, ml = 0.65, gl = 0.3, yl = 0.02, bl = 0.012, wl = 12, vl = 0.25, zt = 90, xl = 0.25, Tl = 0.01, wt = (e) => Math.min(1, Math.max(0, e ?? 0));
function Lc(e, t = 1) {
  return ue * e * t;
}
const tn = -0.12, ui = 0.4, et = (e) => e * Math.PI / 180, Ml = (e, t) => ({ x: t * Math.sin(et(e)), y: Math.cos(et(e)) }), fi = (e, t) => Math.max(0, e) * (1 - Math.min(1, Math.max(0, t))), di = (e, t, n, s) => e - 0.3 * t - n * 0.14 * t - Math.max(0, s - 1) * 0.12 * t;
function kl(e, t, n, s, i, r) {
  const o = Math.max(1, Math.min(r * 0.6, cl * n)), a = wt(t.turn), l = (ci + hi * a) * n, c = s + tn * n, h = l + t.lookX * 0.08 * n, d = t.lookY * 0.07 * n, u = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * n * (1 - ls * a), squeeze: 1 - ls * a, open: t.leftEye, brow: t.leftBrow, side: -1 },
    { x: 0.34 * n * (1 - cs * a), squeeze: 1 - cs * a, open: t.rightEye, brow: t.rightBrow, side: 1 }
  ];
  e.fillStyle = i, e.strokeStyle = i, e.lineWidth = o;
  for (const y of u) {
    const w = fi(y.open, t.blink);
    if (w < 0.2) {
      const T = t.smile > 0.5 ? -0.12 * n : 0.06 * n;
      e.beginPath(), e.moveTo(y.x + l - 0.12 * n, c), e.quadraticCurveTo(y.x + l, c + T, y.x + l + 0.12 * n, c), e.stroke();
    } else {
      if (w > 1.2) {
        const k = 0.13 * n * w;
        e.beginPath(), e.ellipse(y.x + l, c, k * 0.85, k, 0, 0, Math.PI * 2), e.fillStyle = "#ffffff", e.fill(), e.stroke(), e.fillStyle = i;
      }
      const T = w > 1.2 ? 0.075 * n : 0.1 * n;
      e.beginPath(), e.ellipse(y.x + h, c + d, T, T * 1.1 * Math.min(w, 1), 0, 0, Math.PI * 2), e.fill();
    }
    const b = di(c, n, y.brow, w), x = y.x + l - y.side * 0.13 * n * y.squeeze, v = y.x + l + y.side * 0.13 * n * y.squeeze;
    e.beginPath(), e.moveTo(v, b), e.lineTo(x, b - t.browTilt * 0.1 * n), e.stroke();
  }
  const f = s + ui * n, p = 0.25 * n * Math.max(0.3, t.mouthWidth) * (1 - hl * a), m = Math.min(1, Math.max(0, t.mouth));
  if (e.beginPath(), m <= 0.05) {
    e.moveTo(l - p, f), e.quadraticCurveTo(l, f + t.smile * 0.25 * n, l + p, f), e.stroke();
    return;
  }
  const g = 0.3 * n * m;
  t.smile > 0.3 ? (e.moveTo(l - p, f - 0.05 * n), e.lineTo(l + p, f - 0.05 * n), e.quadraticCurveTo(l, f + g * 2, l - p, f - 0.05 * n)) : t.smile < -0.3 ? (e.moveTo(l - p, f + g * 0.6), e.lineTo(l + p, f + g * 0.6), e.quadraticCurveTo(l, f - g * 1.4, l - p, f + g * 0.6)) : e.ellipse(l, f, p * 0.8, g, 0, 0, Math.PI * 2), e.fill();
}
function pi(e, t) {
  const n = t.height ?? 300, s = Math.min(3, Math.max(0.3, e.stretch ?? 1)), i = Math.sqrt(s), r = (t.headSize ?? 2 * li) / 2, o = t.headSize === void 0 ? rl : 1 - 2 * r, a = r * n, l = wt(e.sit), c = e.leftHip + (-zt - e.leftHip) * l, h = e.leftKnee + (-zt - e.leftKnee) * l, d = e.rightHip + (zt - e.rightHip) * l, u = e.rightKnee + (zt - e.rightKnee) * l, f = t.classic === !0, p = wt(e.turn), m = (A, M, P) => {
    const E = et(M - P) / 2, I = p + (1 - p) * A * pl;
    return f ? { x: 0, y: 0 } : { x: Math.cos(E) * us * I, y: Math.abs(Math.sin(E)) * us };
  };
  let g = 0;
  if (l > 0 || !f) {
    const A = (E, I, R) => Qe * Math.cos(et(I)) + ue * Math.cos(et(I - R)) + m(E, I, R).y, M = Math.max(A(-1, c, h), A(1, d, u)), P = f ? Math.min(1, l / xl) : 1;
    g = (as - M) * P * n * s;
  }
  const y = -as * n * s + g, w = -o * n * s + g, b = f ? 0 : (yl * wt(e.turn) + bl * l) * n * s, x = b === 0 ? [{ x: 0, y }, { x: 0, y: w }] : Mt({ x: 0, y }, { x: -b, y: (y + w) / 2 }, { x: 0, y: w }, 1, 8), v = w + ol * n * s, T = (t.shoulderWidth ?? 0) * n * Math.cos(p * Math.PI / 2), k = (A, M, P, E, I) => {
    const R = Ml(P, E);
    return { x: A + R.x * I * n, y: M + R.y * I * n };
  }, _ = (A, M, P) => {
    const E = k(0, y, M, A, Qe * s);
    return { root: { x: 0, y }, joint: E, end: k(E.x, E.y, M - P, A, ue * s) };
  }, $ = (A, M, P) => {
    const E = { x: A * T, y: v }, I = k(E.x, E.y, M, A, al * i);
    return { root: E, joint: I, end: k(I.x, I.y, M + P, A, ll * i) };
  }, C = { left: _(-1, c, h), right: _(1, d, u) }, S = (A, M, P, E) => {
    const I = m(A, P, E);
    return { x: M.end.x + I.x * n * s, y: M.end.y + I.y * n * s };
  };
  return {
    height: n,
    facing: (t.facing ?? 1) < 0 ? -1 : 1,
    stretch: s,
    lineWidth: t.lineWidth ?? n * 0.025,
    rubber: Math.min(1, Math.max(f ? 0 : gl, t.rubber ?? 0)),
    r: a,
    // The head keeps its area: taller and narrower when stretched.
    headRx: a / Math.sqrt(s),
    headRy: a * Math.sqrt(s),
    hipY: y,
    neckY: w,
    drop: g,
    lean: f ? e.lean : e.lean + wl * Math.sin(Math.PI * l),
    classic: f,
    legs: C,
    toes: { left: S(-1, C.left, c, h), right: S(1, C.right, d, u) },
    spine: x,
    arms: {
      left: $(-1, e.leftShoulder, e.leftElbow),
      right: $(1, e.rightShoulder, e.rightElbow)
    }
  };
}
const Lt = (e, t) => t === 0 ? [e.root, e.joint, e.end] : Mt(e.root, e.joint, e.end, t);
function en(e, t, n) {
  const s = Math.cos(n), i = Math.sin(n), r = e.x - t.x, o = e.y - t.y;
  return { x: t.x + r * s - o * i, y: t.y + r * i + o * s };
}
function mi(e, t) {
  const n = et(e.lean), s = et(t.headTilt), i = { x: 0, y: e.hipY }, r = (y) => ({ x: e.facing * y.x, y: y.y }), o = (y) => r(en(y, i, n)), a = (y) => o(en({ x: y.x, y: y.y + e.neckY }, { x: 0, y: e.neckY }, s)), l = Lt(e.arms.left, e.rubber).map(o), c = Lt(e.arms.right, e.rubber).map(o), h = (y) => {
    const [w, b] = y.slice(-2);
    return Math.atan2(b.y - w.y, b.x - w.x);
  };
  let d = 1 / 0;
  for (const [y, w] of [
    [t.leftBrow, t.leftEye],
    [t.rightBrow, t.rightEye]
  ]) {
    const b = di(tn, 1, y, fi(w, t.blink));
    d = Math.min(d, b, b - t.browTilt * 0.1);
  }
  const u = { left: r(e.legs.left.end), right: r(e.legs.right.end) }, f = { left: r(e.toes.left), right: r(e.toes.right) }, p = { left: Math.max(u.left.y, f.left.y), right: Math.max(u.right.y, f.right.y) }, m = Math.max(p.left, p.right), g = Tl * e.height;
  return {
    facing: e.facing,
    height: e.height,
    stretch: e.stretch,
    lineWidth: e.lineWidth,
    hip: i,
    neck: o({ x: 0, y: e.neckY }),
    shoulders: { left: o(e.arms.left.root), right: o(e.arms.right.root) },
    elbows: { left: o(e.arms.left.joint), right: o(e.arms.right.joint) },
    hands: { left: o(e.arms.left.end), right: o(e.arms.right.end) },
    knees: { left: r(e.legs.left.joint), right: r(e.legs.right.joint) },
    feet: u,
    toes: f,
    feetY: m,
    grounded: { left: p.left >= m - g, right: p.right >= m - g },
    handAngle: { left: h(l), right: h(c) },
    limbs: {
      leftArm: l,
      rightArm: c,
      leftLeg: Lt(e.legs.left, e.rubber).map(r),
      rightLeg: Lt(e.legs.right, e.rubber).map(r),
      spine: e.spine.map(o)
    },
    head: {
      center: a({ x: 0, y: -e.headRy }),
      rx: e.headRx,
      ry: e.headRy,
      // Mirroring a turn reverses it.
      angle: e.facing * (n + s),
      eyeY: tn,
      browTopY: d,
      mouthY: ui,
      faceX: e.facing * (ci + hi * wt(t.turn))
    }
  };
}
function Sl(e, t = {}) {
  return mi(pi(e, t), e);
}
function Fc(e, t, n) {
  return en({ x: e.center.x + t * e.rx, y: e.center.y + n * e.ry }, e.center, e.angle);
}
function Al(e, t, n) {
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
function El(e, t, n = {}, s = 0) {
  const i = pi(t, n), r = n.color ?? "#1e293b", o = n.layers ?? {}, a = n.layers ? mi(i, t) : void 0, l = n.sketch ? Ze(e, n.sketch, s) : void 0, c = n.sketch && n.layers ? Ze(e, n.sketch, s) : void 0, h = (x) => {
    e.save(), x(), e.restore();
  }, d = (x) => {
    x && a && h(() => x(e, a, s, c));
  }, u = () => e.scale(i.facing, 1), f = () => {
    u(), e.translate(0, i.hipY), e.rotate(et(i.lean)), e.translate(0, -i.hipY);
  }, p = (x, v, T) => {
    if (l) return v ? l.curve(x) : l.line(x);
    if (i.classic) {
      e.beginPath(), e.moveTo(x[0].x, x[0].y);
      for (const k of x.slice(1)) e.lineTo(k.x, k.y);
      e.stroke();
      return;
    }
    ri(e, x, T[0] * i.lineWidth, T[1] * i.lineWidth);
  }, m = (x, v) => p(Lt(x, i.rubber), i.rubber > 0, v), g = (x) => {
    i.classic || p([i.legs[x].end, i.toes[x]], !1, dl);
  }, y = (x) => {
    if (i.classic || l) return;
    const v = i.arms[x].end;
    e.beginPath(), e.arc(v.x, v.y, ml * i.lineWidth, 0, Math.PI * 2), e.fill();
  };
  e.save(), e.strokeStyle = r, e.fillStyle = r, e.lineWidth = i.lineWidth, e.lineCap = "round", e.lineJoin = "round";
  const w = (x) => {
    h(() => {
      f(), m(i.arms[x], fl), y(x);
    });
    const v = o.sleeve;
    v && a && h(() => v(e, a, x, s, c));
  }, b = wt(t.turn) > vl;
  d(o.behind), h(() => {
    u(), m(i.legs.left, hs), g("left"), m(i.legs.right, hs), g("right");
  }), b && w("left"), h(() => {
    f(), p(i.spine, i.spine.length > 2, ul);
    const { left: x, right: v } = { left: i.arms.left.root, right: i.arms.right.root };
    if (x.x !== v.x)
      if (i.classic) p([x, v], !1, [1, 1]);
      else {
        const T = { x: (x.x + v.x) / 2, y: x.y - 0.3 * Math.abs(v.x - x.x) };
        p(Mt(x, T, v, 1, 8), !0, [1.1, 1.1]);
      }
  }), d(o.body), b || w("left"), w("right"), d(o.behindHead), h(() => {
    f(), e.translate(0, i.neckY), e.rotate(et(t.headTilt));
    const x = -i.headRy;
    e.beginPath(), e.ellipse(0, x, i.headRx, i.headRy, 0, 0, Math.PI * 2);
    const v = n.headFill ?? "#ffffff";
    if (v !== "none" && (e.fillStyle = v, e.fill()), l) {
      l.ellipse(0, x, i.headRx, i.headRy);
      const T = l.nudge();
      e.translate(T.x, T.y);
    } else
      e.stroke();
    e.translate(0, x), e.scale(i.headRx / i.r, i.headRy / i.r), kl(e, t, i.r, 0, r, i.lineWidth);
  }), d(o.overHead), d(o.front), e.restore(), n.label && (e.save(), e.fillStyle = r, e.font = n.labelFont ?? `700 ${Math.round(i.height * 0.11)}px sans-serif`, e.textAlign = "center", e.textBaseline = "bottom", e.fillText(n.label, 0, -i.height * i.stretch - 0.04 * i.height + i.drop), e.restore());
}
function gi(e, t) {
  const n = { ...e };
  let s = e.walking > 0 ? el(n, sl(e.walk, n), e.walking) : n;
  return e.talk > 0 && (s = { ...s, mouth: Math.max(s.mouth, e.talk * il(t)) }), s;
}
function Oc(e) {
  const t = e.style ?? {}, n = t.height ?? 300, s = n * 0.8, i = { ...X(e.pose ?? {}), walk: 0, walking: 0, talk: 0, rubber: t.rubber ?? 0 };
  return {
    type: "custom",
    x: e.x - s / 2,
    y: e.y - n,
    width: s,
    height: n,
    props: { ...i },
    figureStyle: t,
    draw(r, o, a) {
      const l = o.props;
      r.translate(s / 2, n), El(r, gi(l, a), { ...t, rubber: l.rubber }, a);
    }
  };
}
function Dc(e, t, n) {
  const s = e.figureStyle;
  if (!s) throw new Error("stickFigureAt: the target was not made by stickFigureTarget");
  const i = { ...e.props };
  let r = 0, o = 0;
  for (const [c, h] of t.state?.values.get(n) ?? [])
    typeof h == "number" && (c === "x" || c === "motionPathX" ? r = h : c === "y" || c === "motionPathY" ? o = h : c in i && (i[c] = h));
  const a = gi(i, t.time), l = Sl(a, { ...s, rubber: i.rubber });
  return { pose: a, joints: Al(l, e.x + r + e.width / 2, e.y + o + e.height) };
}
function Bc(e, t) {
  const n = [];
  return t.forEach((s, i) => {
    const r = i === 0 ? kt : n[i - 1], o = typeof s.pose == "string" ? tl[s.pose] : { ...r, ...s.pose };
    n.push(s.expression ? Qa(o, s.expression) : o);
  }), ai.filter((s) => n.some((i) => i[s] !== kt[s])).map((s) => ({
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
function Pl(e, t, n = {}, s) {
  const i = n.length ?? 240, r = 9, o = 28, a = i - 22;
  e.save(), e.translate(t.x, t.y), e.rotate((n.angle ?? -30) * Math.PI / 180), e.fillStyle = n.color ?? "#f4c542", e.fillRect(o, -r, a - o, 2 * r), e.fillStyle = "#e8b4a0", e.fillRect(a, -r, i - a, 2 * r), e.fillStyle = "#f1dcbf", e.beginPath(), e.moveTo(0, 0), e.lineTo(o, -r), e.lineTo(o, r), e.closePath(), e.fill(), e.fillStyle = n.outline ?? "#2f2f33", e.beginPath(), e.moveTo(0, 0), e.lineTo(o * 0.35, -r * 0.35), e.lineTo(o * 0.35, r * 0.35), e.closePath(), e.fill(), e.strokeStyle = n.outline ?? "#2f2f33", e.lineWidth = 3, e.lineJoin = "round", e.lineCap = "round";
  const l = [
    [{ x: 0, y: 0 }, { x: o, y: -r }, { x: i, y: -r }, { x: i, y: r }, { x: o, y: r }, { x: 0, y: 0 }],
    [{ x: o, y: -r }, { x: o, y: r }],
    [{ x: a, y: -r }, { x: a, y: r }]
  ];
  for (const c of l) wi(e, c, s);
  e.restore();
}
function yi(e, t, n = {}, s) {
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
function bi(e, t, n = {}, s) {
  const i = n.tool ?? "pencil", r = n.skin ?? "#f1c9a5", o = n.outline ?? "#2f2f33", a = i === "eraser" ? 17 : 9, l = i === "eraser" ? -40 : 0, c = s ? s.nudge(0.6) : { x: 0, y: 0 };
  e.save(), e.translate(t.x + c.x, t.y + c.y), e.rotate((n.angle ?? -30) * Math.PI / 180), e.scale(n.scale ?? 1, n.scale ?? 1), e.lineCap = "round", e.lineJoin = "round";
  const h = (f, p, m, g) => {
    for (const [y, w] of [
      [o, m + 6],
      [g, m]
    ])
      e.strokeStyle = y, e.lineWidth = w, e.beginPath(), e.moveTo(f.x, f.y), e.lineTo(p.x, p.y), e.stroke();
  };
  e.save(), e.translate(l, 0);
  const d = { x: 165, y: -a - 26 }, u = (f) => ({ x: d.x + f * 0.8, y: d.y + f * 0.6 });
  h(d, u(2e3), 64, r), h(u(110), u(2e3), 92, n.sleeve ?? "#5b7db1"), e.fillStyle = r, e.strokeStyle = o, e.lineWidth = 3, e.beginPath(), e.ellipse(d.x, d.y, 54, 40, 0.25, 0, Math.PI * 2), e.fill(), e.stroke(), e.restore(), i === "eraser" ? yi(e, { x: 0, y: 0 }, { angle: 0, outline: o }, s) : Pl(e, { x: 0, y: 0 }, { angle: 0, outline: o }, s), e.translate(l, 0), h({ x: 150, y: a + 8 }, { x: 92, y: a + 12 }, 22, r), h({ x: 140, y: -a - 18 }, { x: 58, y: -a - 6 }, 20, r), h({ x: 150, y: -a - 30 }, { x: 112, y: -a + 2 }, 20, r), h({ x: 172, y: -a - 30 }, { x: 140, y: -a + 4 }, 20, r), e.restore();
}
function Nc(e, t, n, s = 0.08, i = 32) {
  const r = Math.PI * 2 * (1 + s), o = [];
  for (let a = 0; a <= i; a++) {
    const l = -Math.PI / 2 + r * a / i;
    o.push({ x: e + Math.cos(l) * n, y: t + Math.sin(l) * n });
  }
  return o;
}
function Yc(e) {
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
      const d = e.sketch ? Ze(a, e.sketch, c) : void 0;
      h > 0 && (d ? e.smooth ? d.curve(t, h) : d.line(t, h) : wi(a, Nt(t, h))), o && h > 0 && h < 1 && bi(a, si(t, h), o, d);
    }
  };
}
function wi(e, t, n) {
  if (!(t.length < 2)) {
    if (n) return n.line(t);
    e.beginPath(), e.moveTo(t[0].x, t[0].y);
    for (const s of t.slice(1)) e.lineTo(s.x, s.y);
    e.stroke();
  }
}
const Gt = 1e5;
function Wc(e, t, n, s, i = 6) {
  const r = [], o = Math.max(1, Math.round(i));
  for (let a = 0; a <= o; a++)
    r.push({ x: a % 2 === 0 ? e : e + n, y: t + s * a / o });
  return r;
}
function vi(e, t, n, s) {
  if (s <= 0 || t.length === 0) return;
  const i = Nt(t, s), r = n / 2, o = (a) => {
    e.beginPath(), e.rect(-Gt, -Gt, 2 * Gt, 2 * Gt), a(), e.clip("evenodd");
  };
  for (const a of i)
    o(() => {
      e.moveTo(a.x + r, a.y), e.arc(a.x, a.y, r, 0, Math.PI * 2);
    });
  for (let a = 1; a < i.length; a++) {
    const l = i[a - 1], c = i[a], h = Math.hypot(c.x - l.x, c.y - l.y);
    if (h === 0) continue;
    const d = -(c.y - l.y) / h * r, u = (c.x - l.x) / h * r;
    o(() => {
      e.moveTo(l.x + d, l.y + u), e.lineTo(c.x + d, c.y + u), e.lineTo(c.x - d, c.y - u), e.lineTo(l.x - d, l.y - u), e.closePath();
    });
  }
}
function qc(e, t, n, s, i) {
  e.save(), vi(e, t, n, s), i(), e.restore();
}
function Xc(e, t) {
  const n = t.width ?? 40, s = t.hand === !0 ? {} : t.hand || void 0, i = t.eraser === !1 ? void 0 : t.eraser === !0 || t.eraser === void 0 ? {} : t.eraser;
  return {
    ...e,
    props: { ...e.props, erase: 0 },
    draw(r, o, a) {
      const l = Number(o.props?.erase ?? 0);
      if (r.save(), vi(r, t.path, n, l), e.draw(r, o, a), r.restore(), !i || l <= 0 || l >= 1) return;
      const c = si(t.path, l);
      s ? bi(r, c, { ...s, tool: "eraser" }) : yi(r, c, i);
    }
  };
}
const it = (e) => e * Math.PI / 180;
function xi([e, t, n], s) {
  const i = Math.cos(s), r = Math.sin(s);
  return [e, t * i + n * r, -t * r + n * i];
}
function Ti([e, t, n], s) {
  const i = Math.cos(s), r = Math.sin(s);
  return [e * i - t * r, e * r + t * i, n];
}
function Ot([e, t, n], s) {
  const i = Math.cos(s), r = Math.sin(s);
  return [e * i + n * r, t, -e * r + n * i];
}
const Le = (e, t) => [e[0] + t[0], e[1] + t[1], e[2] + t[2]], fs = (e, t) => [e[0] * t, e[1] * t, e[2] * t], ne = (e, t) => Ti(xi(e, t.swing), t.spread);
function Fe(e, t) {
  const n = Ot(e, t);
  return { point: { x: n[0], y: -n[1] }, depth: n[2] };
}
function pn(e, t, n) {
  const s = n.height, i = it(90 * (t.turn ?? 0)), o = [0, e.hipHeight * s * (e.boneScale?.(t, null) ?? 1), 0], a = {};
  for (const M of e.chains) {
    const P = M.parent ? a[M.parent] : void 0;
    if (M.parent && !P) throw new Error(`body plan ${e.id}: chain ${M.id} comes before its parent ${M.parent}`);
    const E = M.at ?? (P ? P.joints3.length - 1 : 0), I = P ? P.joints3[E] : o, R = P ? P.frames[Math.max(0, E - 1)] : { swing: 0, spread: 0 }, D = M.offset ? Le(I, ne(fs(M.offset, s), R)) : I, B = M.side ?? 1, L = e.boneScale?.(t, M) ?? 1, O = e.angles(t, M), F = [D], W = [];
    let j = R.swing, st = R.spread;
    M.bones.forEach((ct, Xt) => {
      const St = O[Xt] ?? { swing: 0, spread: 0 };
      j += it(St.swing), st += it(St.spread) * B, W.push({ swing: j, spread: st });
      const we = Ot(ne(M.rest, { swing: j, spread: st }), it(St.yaw ?? 0));
      F.push(Le(F[Xt], fs(we, ct.length * s * L)));
    }), a[M.id] = { joints3: F, frames: W };
  }
  const l = a[e.head.on], c = e.headPose?.(t) ?? { yaw: 0, nod: 0, tilt: 0, sx: 1, sy: 1 }, h = l.frames[l.frames.length - 1], d = e.head.size / 2 * s, u = d * c.sx, f = d * c.sy, p = (M) => ne(Ot(xi(Ti(M, -it(c.tilt)), -it(c.nod)), it(c.yaw)), h), m = Le(l.joints3[l.joints3.length - 1], p([0, f, 0])), g = {};
  for (const M of e.chains) {
    const { joints3: P, frames: E } = a[M.id], I = P.map((R) => Fe(R, i));
    g[M.id] = {
      id: M.id,
      joints3: P,
      frames: E,
      points: I.map((R) => R.point),
      depths: I.map((R) => R.depth)
    };
  }
  const y = Fe(m, i), w = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((M) => Ot(p(M), i)), b = Fe(o, i).point, x = it(t.roll ?? 0), v = (M) => {
    const P = M.x - b.x, E = M.y - b.y;
    return { x: b.x + P * Math.cos(x) - E * Math.sin(x), y: b.y + P * Math.sin(x) + E * Math.cos(x) };
  }, T = ([M, P, E]) => [M * Math.cos(x) + P * Math.sin(x), -M * Math.sin(x) + P * Math.cos(x), E];
  for (const M of Object.values(g)) M.points = M.points.map(v);
  const k = {
    center: v(y.point),
    depth: y.depth,
    rx: u,
    ry: f,
    angle: 0,
    axes: w.map(T)
  }, _ = k.axes[1];
  k.angle = Math.atan2(_[0], _[1]);
  const $ = (M) => {
    if ("head" in M) return { x: k.center.x + _[0] * f, y: k.center.y - _[1] * f };
    const P = g[M.chain];
    return P.points[Math.min(M.joint, P.points.length - 1)];
  };
  let C = 0;
  (n.contact ?? "ground") === "ground" && (C = -Math.max(...e.contacts.map((M) => $(M).y))), C -= (t.lift ?? 0) * s;
  const S = (M) => ({ x: M.x, y: M.y + C });
  for (const M of Object.values(g)) M.points = M.points.map(S);
  k.center = S(k.center);
  const A = e.contacts.map((M) => ({ spec: M, point: $(M) }));
  return {
    height: s,
    view: i,
    chains: g,
    head: k,
    hip: S(v(b)),
    contacts: A,
    groundY: Math.max(...A.map((M) => M.point.y))
  };
}
function Mi(e, [t, n, s]) {
  const [i, r, o] = e.axes, a = [
    i[0] * t * e.rx + r[0] * n * e.ry + o[0] * s * e.rx,
    i[1] * t * e.rx + r[1] * n * e.ry + o[1] * s * e.rx,
    i[2] * t * e.rx + r[2] * n * e.ry + o[2] * s * e.rx
  ], l = Math.hypot(t, n, s) || 1, c = (i[2] * t + r[2] * n + o[2] * s) / l;
  return { point: { x: e.center.x + a[0], y: e.center.y - a[1] }, depth: e.depth + a[2], facing: c };
}
const Kt = (e) => e * 180 / Math.PI, pt = (e, t) => [e[0] - t[0], e[1] - t[1], e[2] - t[2]], Oe = (e, t) => e[0] * t[0] + e[1] * t[1] + e[2] * t[2], Ft = (e) => Math.hypot(e[0], e[1], e[2]), nn = (e) => {
  const t = Ft(e) || 1;
  return [e[0] / t, e[1] / t, e[2] / t];
}, Zt = (e) => Math.atan2(Math.sin(e), Math.cos(e));
function ds(e) {
  const [t, n, s] = nn(e);
  return { swing: Math.asin(Math.max(-1, Math.min(1, s))), spread: Math.atan2(t, -n) };
}
function _l(e, t, n, s, i) {
  const r = e.chains.find((C) => C.id === n);
  if (!r) throw new Error(`reach: no chain ${n} in ${e.id}`);
  if (r.bones.length < 2 || r.rest[1] > -0.99) throw new Error(`reach: ${n} is not a hanging limb of two bones or more`);
  if (!e.withAngles) throw new Error(`reach: the ${e.id} plan cannot set angles`);
  const o = pn(e, { ...t, turn: 0, roll: 0, lift: 0 }, { height: i.height, contact: "none" }), a = o.chains[n], l = a.joints3[0], c = Ft(pt(a.joints3[1], a.joints3[0])), h = Ft(pt(a.joints3[2], a.joints3[1])), d = r.parent ? o.chains[r.parent].frames[Math.max(0, (r.at ?? o.chains[r.parent].joints3.length - 1) - 1)] : { swing: 0, spread: 0 }, u = pt(s, l), f = Math.min(c + h - 1e-6, Math.max(Math.abs(c - h) + 1e-6, Ft(u))), p = nn(u), m = r.parent !== null, g = ne(r.pole ?? (m ? [0, -0.35, -1] : [0, 0, 1]), d);
  let y = pt(g, [p[0] * Oe(g, p), p[1] * Oe(g, p), p[2] * Oe(g, p)]);
  Ft(y) < 1e-6 && (y = Ot([1, 0, 0], 0)), y = nn(y);
  const w = (c * c + f * f - h * h) / (2 * c * f), b = Math.sqrt(Math.max(0, 1 - w * w)), x = [
    l[0] + c * (w * p[0] + b * y[0]),
    l[1] + c * (w * p[1] + b * y[1]),
    l[2] + c * (w * p[2] + b * y[2])
  ], v = [l[0] + p[0] * f, l[1] + p[1] * f, l[2] + p[2] * f], T = r.side ?? 1, k = ds(pt(x, l)), _ = ds(pt(v, x)), $ = [
    { swing: Kt(Zt(k.swing - d.swing)), spread: Kt(Zt(k.spread - d.spread)) * T },
    { swing: Kt(Zt(_.swing - k.swing)), spread: Kt(Zt(_.spread - k.spread)) * T }
  ];
  return e.withAngles(t, r, $);
}
function ps(e, t, n, s, i, r = 0, o = 1, a = 40) {
  const l = Math.cos(i), c = Math.sin(i);
  return Array.from({ length: a + 1 }, (h, d) => {
    const u = r + Math.PI * 2 * o * d / a, f = Math.cos(u) * n, p = Math.sin(u) * s;
    return { x: e + f * l - p * c, y: t + f * c + p * l };
  });
}
function Cl(e, t) {
  return t.look === "pencil" ? Ll(e, t) : Il(e, t.ink, t.look);
}
function fe(e, t, n = !1) {
  e.beginPath(), e.moveTo(t[0].x, t[0].y);
  for (const s of t.slice(1)) e.lineTo(s.x, s.y);
  n && e.closePath();
}
function Il(e, t, n) {
  const s = n === "silhouette", i = s ? 1.25 : 1;
  return {
    look: n,
    ink: t,
    limb(r, o, a) {
      e.fillStyle = t, ri(e, r, o * i, a * i);
    },
    line(r, o) {
      r.length < 2 || (e.strokeStyle = t, e.lineWidth = o * i, e.lineCap = "round", e.lineJoin = "round", fe(e, r), e.stroke());
    },
    shape(r, o, a) {
      fe(e, r, !0), (o !== null || s) && (e.fillStyle = s ? t : o, e.fill()), !(a <= 0) && (e.strokeStyle = t, e.lineWidth = a * i, e.lineJoin = "round", e.stroke());
    },
    ellipse(r, o, a, l, c, h, d) {
      e.beginPath(), e.ellipse(r, o, a, l, c, 0, Math.PI * 2), (h !== null || s) && (e.fillStyle = s ? t : h, e.fill()), !(d <= 0) && (e.strokeStyle = t, e.lineWidth = d * i, e.stroke());
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
function $l(e, t) {
  const n = [e[0]];
  let s = 0;
  for (let o = 1; o < e.length; o++) {
    const a = e[o - 1], l = e[o], c = Math.hypot(l.x - a.x, l.y - a.y);
    let h = t - s;
    for (; h < c; ) {
      const d = h / c;
      n.push({ x: a.x + (l.x - a.x) * d, y: a.y + (l.y - a.y) * d }), h += t;
    }
    s = c - (h - t);
  }
  const i = e[e.length - 1], r = n[n.length - 1];
  return Math.hypot(i.x - r.x, i.y - r.y) > t * 0.25 ? n.push(i) : n[n.length - 1] = i, n;
}
function Rl(e, t) {
  const n = e.length;
  return e.map((s, i) => {
    const r = e[Math.max(0, i - 1)], o = e[Math.min(n - 1, i + 1)], a = Math.hypot(o.x - r.x, o.y - r.y) || 1, l = t(n === 1 ? 0 : i / (n - 1));
    return { x: s.x - (o.y - r.y) / a * l, y: s.y + (o.x - r.x) / a * l };
  });
}
function ms(e) {
  const t = [0.6, 1.4, 2.9].map((s) => ({
    frequency: s * (0.8 + e.next() * 0.4),
    phase: e.next() * Math.PI * 2,
    amount: 0.5 + e.next() * 0.5
  })), n = t.reduce((s, i) => s + i.amount, 0);
  return (s) => t.reduce((i, r) => i + r.amount * Math.sin(Math.PI * 2 * r.frequency * s + r.phase), 0) / n;
}
function Ll(e, t) {
  const n = t.pencil ?? {}, s = t.ink, i = n.roughness ?? Math.max(1, t.lineWidth * 0.12), r = Math.max(1, Math.round(n.passes ?? 2)), o = Math.min(1, Math.max(0, n.pressure ?? 0.25)), a = Math.min(1, Math.max(0, n.rubbedOut ?? 0.15)), l = ii(t.time, n.boil ?? 8);
  let c = 0;
  const h = (p, m, g = !1) => an(Fs(`${t.seed}:${g ? "paper" : l}:${p}:${m}`)), d = (p, m, g, y, w, b = 0) => {
    if (p.length < 2) return;
    const x = p.slice(1).reduce((S, A, M) => S + Math.hypot(A.x - p[M].x, A.y - p[M].y), 0);
    let v = $l(p, Math.max(1.5, Math.min(t.lineWidth * 0.8, x / 24)));
    if (b > 0 && v.length >= 2) {
      const [S, A] = [v[v.length - 2], v[v.length - 1]], M = Math.hypot(A.x - S.x, A.y - S.y) || 1;
      v = [...v, { x: A.x + (A.x - S.x) / M * b, y: A.y + (A.y - S.y) / M * b }];
    }
    const T = ms(g), k = ms(g), _ = v.length, $ = [], C = [];
    v.forEach((S, A) => {
      const M = _ === 1 ? 0 : A / (_ - 1), P = v[Math.max(0, A - 1)], E = v[Math.min(_ - 1, A + 1)], I = Math.hypot(E.x - P.x, E.y - P.y) || 1, R = -(E.y - P.y) / I, D = (E.x - P.x) / I, B = T(M) * w, L = Math.min(1, M / 0.08, (1 - M) / 0.08), O = (0.55 + 0.45 * Math.sqrt(Math.max(0, L))) * (1 + o * k(M)), F = Math.max(0.3, m(M) * O / 2), W = S.x + R * B, j = S.y + D * B;
      $.push({ x: W + R * F, y: j + D * F }), C.push({ x: W - R * F, y: j - D * F });
    }), e.save(), e.globalAlpha *= y, e.fillStyle = s, fe(e, [...$, ...C.reverse()], !0), e.fill(), e.restore();
  }, u = (p, m) => {
    const g = c++, y = h(g, 99, !0);
    if (y.next() < a) {
      const v = (y.next() * 2 - 1) * t.lineWidth * 1.4, T = (y.next() * 2 - 1) * t.lineWidth * 1.4, k = p.map((_) => ({ x: _.x + v, y: _.y + T }));
      d(k, (_) => m(_) * 1.8, h(g, 98, !0), 0.035, i), d(k, (_) => m(_) * 0.45, h(g, 97, !0), 0.12, i * 1.5);
    }
    const w = p.slice(1).reduce((v, T, k) => v + Math.hypot(T.x - p[k].x, T.y - p[k].y), 0), b = m(0.5) > 4 && w > m(0.5) * 6, x = b ? [-0.3, 0.3, 0] : [0];
    for (let v = 0; v < r; v++) {
      const T = v === 0;
      x.forEach((k, _) => {
        const $ = h(g, v * 10 + _), C = k === 0 ? p : Rl(p, (A) => m(A) * k * Math.sqrt(Math.sin(Math.PI * A))), S = !T && k === 0 ? t.lineWidth * (0.3 + $.next() * 0.8) : 0;
        d(C, (A) => m(A) * (b ? 0.5 : 1) * (T ? 1 : 0.6), $, T ? 0.85 : 0.45, i * (T ? 0.6 : 1), S);
      });
    }
  }, f = (p, m, g, y, w, b) => {
    const v = h(c, 50).next() * Math.PI * 2;
    u(ps(p, m, g, y, w, v, 1.08, 48), () => b);
  };
  return {
    look: "pencil",
    ink: s,
    limb(p, m, g) {
      u(p, (y) => m + (g - m) * y);
    },
    line(p, m) {
      u(p, () => m);
    },
    shape(p, m, g) {
      m !== null && (e.save(), e.globalAlpha *= 0.88, e.fillStyle = m, fe(e, p, !0), e.fill(), e.restore()), g > 0 && u([...p, p[0]], () => g);
    },
    ellipse(p, m, g, y, w, b, x) {
      b !== null && (e.save(), e.globalAlpha *= 0.9, e.fillStyle = b, e.beginPath(), e.ellipse(p, m, g, y, w, 0, Math.PI * 2), e.fill(), e.restore()), f(p, m, g, y, w, x);
    },
    dot(p, m, g) {
      e.save(), e.globalAlpha *= 0.9, e.fillStyle = s, e.beginPath(), e.arc(p, m, g, 0, Math.PI * 2), e.fill(), e.restore();
    },
    guide(p) {
      if (n.construction === !1 || p.length < 2) return;
      const m = c++;
      d(p, () => Math.max(0.6, t.lineWidth * 0.18), h(m, 0), 0.28, i * 1.2, t.lineWidth);
    },
    guideEllipse(p, m, g, y, w) {
      if (n.construction === !1) return;
      const b = c++, x = h(b, 0), v = ps(p, m, g, y, w, x.next() * Math.PI * 2, 1.12, 48);
      d(v, () => Math.max(0.6, t.lineWidth * 0.18), x, 0.28, i * 1.5);
    }
  };
}
const Fl = 0.34, rt = 0.12, G = -0.4, Z = (e, t, n) => e[t] ?? n, Ol = (e, t) => Math.max(0, e) * (1 - Math.min(1, Math.max(0, t))), Dl = 0.45, Bl = 0.35, Nl = 0.7;
function de(e, t, n) {
  const s = (f) => Math.sqrt(Math.max(0, 1 - f.x * f.x - f.y * f.y)), i = Mi(e, [n.x, n.y, s(n)]).facing, r = e.axes[2], o = Math.atan2(r[0], r[2]), a = Math.cos(o), l = a >= 0 ? 1 : -1, c = l * Math.max(Bl, Math.abs(a)), h = l * Math.max(Nl, Math.abs(a)), d = Math.cos(e.angle), u = Math.sin(e.angle);
  return {
    facing: i,
    points: t.map((f) => {
      const p = Dl * Math.sin(o) + n.x * c + (f.x - n.x) * h, m = f.y + r[1] * s(f), g = p * e.rx, y = m * e.ry;
      return { x: e.center.x + g * d + y * u, y: e.center.y + g * u - y * d };
    })
  };
}
const Jt = (e, t, n, s = 12) => Array.from({ length: s + 1 }, (i, r) => {
  const o = r / s, a = 1 - o;
  return { x: a * a * e.x + 2 * a * o * t.x + o * o * n.x, y: a * a * e.y + 2 * a * o * t.y + o * o * n.y };
}), De = (e, t, n, s, i = 16) => Array.from({ length: i }, (r, o) => {
  const a = Math.PI * 2 * o / i;
  return { x: e + Math.cos(a) * n, y: t + Math.sin(a) * s };
}), gs = 0.05;
function Yl(e, t, n, s) {
  const i = Math.max(1, Math.min(s * 0.6, 0.14 * t.rx)), r = (y, w) => de(t, y, w).points, o = (y, w) => de(t, [], { x: y, y: w }).facing, a = Z(n, "smile", 0), l = Z(n, "blink", 0), c = Z(n, "lookX", 0), h = Z(n, "lookY", 0), d = Z(n, "browTilt", 0);
  for (const y of [1, -1]) {
    const w = y === 1 ? "left" : "right", b = Fl * y;
    if (o(b, rt) < gs) continue;
    const x = { x: b, y: rt }, v = Ol(Z(n, `eye.${w}`, 1), l);
    if (v < 0.2) {
      const $ = a > 0.5 ? 0.12 : -0.06;
      e.line(r(Jt({ x: b - 0.12, y: rt }, { x: b, y: rt + $ }, { x: b + 0.12, y: rt }), x), i);
    } else {
      if (v > 1.2) {
        const A = 0.13 * v;
        e.shape(r(De(b, rt, A * 0.85, A), x), "#ffffff", i);
      }
      const $ = v > 1.2 ? 0.075 : 0.1, C = b + c * 0.08, S = rt - h * 0.07;
      e.shape(r(De(C, S, $, $ * 1.1 * Math.min(v, 1)), x), e.ink, 0);
    }
    const T = rt + 0.3 + Z(n, `brow.${w}`, 0) * 0.14 + Math.max(0, v - 1) * 0.12, k = { x: b + y * 0.13, y: T }, _ = { x: b - y * 0.13, y: T + d * 0.1 };
    e.line(r([k, { x: (k.x + _.x) / 2, y: (k.y + _.y) / 2 }, _], { x: b, y: T }), i);
  }
  const u = { x: 0, y: G };
  if (o(0, G) < -gs) return;
  const f = 0.25 * Math.max(0.3, Z(n, "mouthWidth", 1)), p = Math.min(1, Math.max(0, Z(n, "mouth", 0)));
  if (p <= 0.05) {
    e.line(r(Jt({ x: -f, y: G }, { x: 0, y: G - a * 0.25 }, { x: f, y: G }), u), i);
    return;
  }
  const m = 0.3 * p;
  let g;
  if (a > 0.3) {
    const y = G + 0.05;
    g = [...Jt({ x: f, y }, { x: 0, y: G - m * 2 }, { x: -f, y })];
  } else if (a < -0.3) {
    const y = G - m * 0.6;
    g = [...Jt({ x: f, y }, { x: 0, y: G + m * 1.4 }, { x: -f, y })];
  } else
    g = De(0, G, f * 0.8, m);
  e.shape(r(g, u), e.ink, 0);
}
const Be = 0.215, Ne = 0.205, Wl = 0.065, ys = 0.035, ql = 0.165, Xl = 0.155, Hl = 12, lt = {
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
  "leg.right.swing": 0,
  "leg.right.spread": 3,
  "leg.right.knee": 0,
  "leg.right.ankle": 0,
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
function V(e = {}) {
  return { ...lt, ...e };
}
function q(e, t) {
  const n = {};
  for (const s of ["left", "right"]) for (const [i, r] of Object.entries(t)) n[`${e}.${s}.${i}`] = r;
  return n;
}
const Vl = {
  rest: lt,
  wave: V({ "arm.right.spread": 115, "arm.right.bend": 55, "arm.right.elbow": 0, "head.tilt": -6, smile: 0.9 }),
  cheer: V({ ...q("arm", { spread: 140, bend: 20, elbow: 0 }), mouth: 0.6, smile: 1, "eye.left": 0, "eye.right": 0 }),
  point: V({ "arm.right.spread": 88, "arm.right.elbow": 0, "arm.right.bend": 0, "head.turn": -20, smile: 0.4 }),
  handsOnHips: V({ ...q("arm", { spread: 50, bend: -105, elbow: 0 }), ...q("leg", { spread: 9 }), smile: 0.8 }),
  think: V({ "arm.right.spread": 22, "arm.right.bend": -150, "arm.right.elbow": 0, "head.tilt": 10, lookX: -0.5, lookY: -0.8, smile: 0 }),
  shrug: V({ ...q("arm", { spread: 35, bend: 75, elbow: 0 }), "head.tilt": -10, smile: -0.2 }),
  sit: V({ ...q("leg", { swing: 90, knee: 90, spread: 4 }), ...q("arm", { swing: 25, elbow: 45, spread: 8 }) }),
  kneel: V({
    "leg.left.swing": 90,
    "leg.left.knee": 90,
    // The back thigh leans back a little so its knee meets the ground beside the
    // front foot; the shin slopes up from it and the foot points down to tucked toes.
    "leg.right.swing": -18,
    "leg.right.knee": 108,
    "leg.right.ankle": 16,
    ...q("arm", { swing: 20, elbow: 30 })
  }),
  crouch: V({ ...q("leg", { swing: 75, knee: 140, spread: 6 }), lean: 25, ...q("arm", { swing: 50, elbow: 40 }), "head.nod": -15 }),
  // On hands and knees: the back nearly level, arms straight down, the toes
  // pointed back along the ground.
  crawl: V({ lean: 82, "head.nod": -35, ...q("arm", { swing: 80, elbow: 0, spread: 4 }), ...q("leg", { knee: 92, ankle: -88 }) }),
  lieDown: V({ roll: 90, ...q("arm", { spread: 8 }), "head.nod": 0 })
};
function Ul(e = {}) {
  const t = e.headSize ?? 0.3, n = e.shoulderWidth ?? 0.06, s = e.hipWidth ?? 0.022, i = Math.max(0.12, 1 - t - ys - (Be + Ne)), r = (l) => ({
    id: `arm.${l}`,
    parent: "spine",
    offset: [(l === "left" ? 1 : -1) * n, -0.035, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: ql, width: [1.25, 0.9] },
      { length: Xl, width: [0.9, 0.75] }
    ]
  }), o = (l) => ({
    id: `leg.${l}`,
    parent: null,
    offset: [(l === "left" ? 1 : -1) * s, 0, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: Be, width: [1.45, 1.05] },
      { length: Ne, width: [1.05, 0.85] },
      { length: Wl, width: [0.95, 0.7] }
    ]
  }), a = (l, c) => l[c] ?? lt[c] ?? 0;
  return {
    id: "human",
    hipHeight: Be + Ne,
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
      { id: "neck", parent: "spine", rest: [0, 1, 0], bones: [{ length: ys, width: [1, 0.9] }] },
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
        const f = -a(l, "lean") / 2, p = a(l, "side") / 2;
        return [
          { swing: f, spread: p },
          { swing: f, spread: p }
        ];
      }
      if (c.id === "neck") return [{ swing: 0, spread: 0 }];
      const [h, d] = c.id.split("."), u = (f) => a(l, `${h}.${d}.${f}`);
      return h === "arm" ? [
        { swing: u("swing"), spread: u("spread") },
        { swing: u("elbow"), spread: u("bend") }
      ] : [
        { swing: u("swing"), spread: u("spread") },
        { swing: -u("knee"), spread: 0 },
        // The foot points forward, square to the shin, turned out a little.
        { swing: 90 + u("ankle"), spread: 0, yaw: Hl * (c.side ?? 1) }
      ];
    },
    withAngles(l, c, h) {
      const [d, u] = c.id.split("."), f = (p) => `${d}.${u}.${p}`;
      return d === "arm" ? {
        ...l,
        [f("swing")]: h[0].swing,
        [f("spread")]: h[0].spread,
        [f("elbow")]: h[1].swing,
        [f("bend")]: h[1].spread
      } : d === "leg" ? { ...l, [f("swing")]: h[0].swing, [f("spread")]: h[0].spread, [f("knee")]: -h[1].swing } : l;
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
function Hc(e) {
  const t = e.split(".");
  if (t.length === 3) {
    const [s, i, r] = t;
    return `${`${i === "left" ? "Left" : "Right"} ${s}`} · ${{
      swing: "forward / back",
      spread: "out / in",
      elbow: "elbow bend",
      bend: "forearm out / in",
      knee: "knee bend",
      ankle: "foot tilt"
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
const jl = {
  leftEye: "eye.left",
  rightEye: "eye.right",
  leftBrow: "brow.left",
  rightBrow: "brow.right"
}, Vc = Object.fromEntries(
  Object.entries(tt).map(([e, t]) => [
    e,
    Object.fromEntries(Object.entries(t).map(([n, s]) => [jl[n] ?? n, s]))
  ])
);
function Uc(e = {}) {
  const t = (e.proportions ?? "bold") === "bold", n = e.figure ?? "fluid", s = e.look ?? "clean", i = e.height ?? 300, r = n === "stick";
  return {
    plan: e.plan ?? Ul({
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
    contact: e.contact ?? "ground"
  };
}
function jc(e, t, n, s) {
  const { point: i, facing: r } = Mi(e, [t, n, s]);
  return { point: i, facing: r };
}
const sn = (e) => e.rest[1] < -0.5, zl = 0.3;
function Gl(e, t, n) {
  return e.figure === "stick" ? sn(t) ? n.slice(0, 3) : n : sn(t) && n.length >= 3 ? Mt(n[0], n[1], n[2], zl) : n.length === 3 ? Mt(n[0], n[1], n[2], 1) : n;
}
function mn(e, t) {
  const n = e.plan.id === "human" ? { ...lt, ...t } : t, s = pn(e.plan, n, { height: e.height, contact: e.contact }), i = {}, r = {}, o = {}, a = 0.01 * e.height;
  e.plan.chains.forEach((f) => {
    const p = s.chains[f.id];
    i[f.id] = p.points;
    const m = p.depths.reduce((b, x) => b + x, 0) / p.depths.length, g = f.parent ? s.chains[f.parent] : void 0, y = g ? g.depths[f.at ?? g.depths.length - 1] : 0, w = m - y;
    o[f.id] = Math.abs(w) < a ? 0 : w, r[f.id] = { points: Gl(e, f, p.points), depth: m };
  }), r.head = { points: [s.head.center], depth: s.head.depth }, o.head = 0;
  const l = [...e.plan.chains.map((f) => f.id), "head"], c = [...l].sort((f, p) => o[f] - o[p] || l.indexOf(f) - l.indexOf(p)), h = { hip: s.hip };
  for (const [f, [p, m]] of Object.entries(e.plan.landmarks ?? {})) {
    const g = s.chains[p]?.points;
    g && (h[f] = g[Math.min(m, g.length - 1)]);
  }
  const d = {};
  for (const [f, p] of Object.entries(h)) d[f] = p.y >= s.groundY - 0.01 * e.height;
  const u = {
    height: e.height,
    lineWidth: e.lineWidth,
    turn: n.turn ?? 0,
    points: h,
    chains: i,
    parts: r,
    head: s.head,
    groundY: s.groundY,
    grounded: d
  };
  return { skeleton: s, joints: u, order: c };
}
function Kl(e, t) {
  return mn(e, t).joints;
}
function Zl(e, t, n) {
  const { head: s } = n;
  e.guideEllipse(s.center.x, s.center.y, s.rx * 1.03, s.ry * 1.03, s.angle);
  const i = Array.from({ length: 13 }, (l, c) => ({ x: 0, y: -0.95 + 1.9 * c / 12 })), r = Array.from({ length: 13 }, (l, c) => ({ x: -0.95 + 1.9 * c / 12, y: 0.12 })), o = de(s, i, { x: 0, y: 0 });
  o.facing > 0 && e.guide(o.points), e.guide(de(s, r, { x: 0, y: 0.12 }).points), e.guide(n.chains.spine ?? []);
  const a = t.lineWidth * 0.9;
  for (const l of ["shoulder.left", "shoulder.right", "elbow.left", "elbow.right", "hip.left", "hip.right", "knee.left", "knee.right"]) {
    const c = n.points[l];
    c && e.guideEllipse(c.x, c.y, a, a, 0);
  }
}
function Jl(e, t, n, s, i) {
  const r = t.lineWidth;
  if (s === "head") {
    const { head: u } = n, f = t.skin === "none" ? null : t.skin;
    e.ellipse(u.center.x, u.center.y, u.rx, u.ry, u.angle, f, r), e.look !== "silhouette" && Yl(e, u, i, r);
    return;
  }
  const o = t.plan.chains.find((u) => u.id === s), a = n.chains[s], l = n.parts[s].points;
  if (t.figure === "stick") {
    if (s === "neck") return;
    const u = s === "spine" ? [...a, ...n.chains.neck?.slice(1) ?? []] : l;
    e.line(u, r);
    return;
  }
  const c = (u, f) => [o.bones[u].width[0] * r, o.bones[f].width[1] * r];
  if (sn(o)) {
    const [u, f] = c(0, 1);
    if (e.limb(l, u, f), o.bones.length >= 3)
      e.limb([a[2], a[3]], o.bones[2].width[0] * r, o.bones[2].width[1] * r);
    else {
      const p = a[a.length - 1];
      e.dot(p.x, p.y, r * 0.62);
    }
    return;
  }
  if (s === "spine") {
    const u = n.points["hip.left"], f = n.points["hip.right"];
    u && f && Math.hypot(u.x - f.x, u.y - f.y) > 0.5 && e.limb([u, f], r * 1.3, r * 1.3);
    const [p, m] = c(0, o.bones.length - 1);
    e.limb(l, p, m);
    const g = n.points["shoulder.left"], y = n.points["shoulder.right"];
    g && y && Math.hypot(g.x - y.x, g.y - y.y) > 0.5 && e.limb(Mt(g, a[a.length - 1], y, 1, 10), r * 1.15, r * 1.15);
    return;
  }
  const [h, d] = c(0, o.bones.length - 1);
  e.limb(l, h, d);
}
function Ql(e, t, n, s = 0) {
  const i = t.plan.id === "human" ? { ...lt, ...n } : n, { joints: r, order: o } = mn(t, i), a = Cl(e, {
    look: t.look,
    ink: t.ink,
    lineWidth: t.lineWidth,
    seed: t.seed,
    time: s,
    pencil: t.pencil
  }), l = (c) => {
    c && (e.save(), c(e, r, a, s), e.restore());
  };
  e.save(), e.lineCap = "round", e.lineJoin = "round", t.look === "pencil" && t.pencil.construction !== !1 && Zl(a, t, r), l(t.layers.behind);
  for (const c of o) {
    const h = t.layers.parts?.[c];
    l(h?.under), Jl(a, t, r, c, i), l(h?.over);
  }
  l(t.layers.front), e.restore();
}
function zc(e, t, n) {
  const s = { ...e };
  for (const [i, r] of Object.entries(t)) {
    const o = e[i] ?? r;
    s[i] = o + (r - o) * n;
  }
  return s;
}
function Gc(e, t, n, s) {
  const i = e.plan.id === "human" ? { ...lt, ...t } : t;
  let r;
  if (Array.isArray(s))
    r = s;
  else {
    const { skeleton: o } = mn(e, i), a = pn(e.plan, { ...i, roll: 0 }, { height: e.height, contact: "none" }), l = (i.roll ?? 0) * Math.PI / 180, c = s.x - o.hip.x, h = s.y - o.hip.y, d = a.hip.x + c * Math.cos(-l) - h * Math.sin(-l), u = a.hip.y + c * Math.sin(-l) + h * Math.cos(-l), f = Math.PI / 2 * (i.turn ?? 0), p = s.depth ?? o.chains[n].depths[o.chains[n].depths.length - 1], m = Math.cos(f), g = Math.sin(f);
    r = [d * m - p * g, -u, d * g + p * m];
  }
  return _l(e.plan, i, n, r, { height: e.height });
}
function Kc(e) {
  const { character: t } = e, n = t.height * 0.8, s = t.height, i = t.plan.id === "human" ? lt : {};
  return {
    type: "custom",
    x: e.x - n / 2,
    y: e.y - s,
    width: n,
    height: s,
    props: { ...i, ...e.pose },
    character: t,
    draw(r, o, a) {
      r.translate(n / 2, s), Ql(r, t, o.props, a);
    }
  };
}
function tc(e, t, n) {
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
function Zc(e, t, n) {
  const s = e.character;
  if (!s) throw new Error("characterAt: the target was not made by characterTarget");
  const i = { ...e.props };
  let r = 0, o = 0;
  for (const [l, c] of t.state?.values.get(n) ?? [])
    typeof c == "number" && (l === "x" || l === "motionPathX" ? r = c : l === "y" || l === "motionPathY" ? o = c : l in i && (i[l] = c));
  const a = Kl(s, i);
  return { pose: i, joints: tc(a, e.x + r + e.width / 2, e.y + o + e.height) };
}
function Jc(e, t, n = lt) {
  const s = [];
  return t.forEach((r, o) => {
    const a = o === 0 ? n : s[o - 1], l = typeof r.pose == "string" ? Vl[r.pose] : void 0;
    s.push(l ? { ...l, turn: a.turn ?? 0 } : { ...a, ...r.pose });
  }), Object.keys(n).filter((r) => s.some((o) => (o[r] ?? n[r]) !== n[r])).map((r) => ({
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
const ec = (e, t, n) => e.slice(Math.floor((e.length - 1) * t), Math.ceil((e.length - 1) * n) + 1);
function Qc(e = {}) {
  const t = e.shirt ?? "#e2493b", n = e.trousers ?? "#24476b", s = (a) => a.lineWidth * 0.45, i = (a, l, c) => {
    const h = a.parts[`leg.${c}`].points;
    l.shape(ee(h, a.height * 0.08, a.height * 0.05), n, s(a));
  }, r = (a, l) => {
    const c = a.chains.spine, h = c[0], d = c[c.length - 1], u = { x: h.x - (d.x - h.x) * 0.25, y: h.y - (d.y - h.y) * 0.25 };
    l.shape(ee([u, ...a.parts.spine.points], a.height * 0.15, a.height * 0.14), t, s(a));
  }, o = (a, l, c) => {
    const h = a.parts[`arm.${c}`].points, d = h[0], u = a.chains.spine[a.chains.spine.length - 1], p = [{ x: d.x + (u.x - d.x) * 0.45, y: d.y + (u.y - d.y) * 0.45 }, ...ec(h, 0, 0.45)], m = ee(p, a.height * 0.085, a.height * 0.06), g = p.length, y = m.slice(0, g), w = m.slice(g).reverse();
    l.shape(m, t, 0);
    const b = (T) => Math.hypot(T[1].x - u.x, T[1].y - u.y), [x, v] = b(y) > b(w) ? [y, w] : [w, y];
    l.line(x.slice(1), s(a)), l.line(v.slice(Math.ceil(g * 0.45)), s(a)), l.line([y[g - 1], w[g - 1]], s(a));
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
function th(e) {
  const { timeline: t } = e, n = new ut();
  for (const [c, h] of Object.entries(e.targets)) {
    const d = typeof h == "string" ? document.querySelector(h) : h;
    if (!d)
      throw new Error(`quickPlay: no element found for target "${c}" (${String(h)})`);
    n.registerTarget(c, d);
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
const eh = {
  timeline: lo,
  to(e, t, n) {
    const s = new bt(n);
    return s.to(e, t), s;
  },
  from(e, t, n) {
    const s = new bt(n);
    return s.from(e, t), s;
  },
  fromTo(e, t, n, s) {
    const i = new bt(s);
    return i.fromTo(e, t, n), i;
  },
  set(e, t, n) {
    const s = new bt(n);
    return s.set(e, t), s;
  }
}, nh = H.to, sh = H.from, ih = H.fromTo, rh = H.set, oh = H.timeline, ah = H.ticker, lh = H.splitText, ch = H.context, hh = H.matchMedia, uh = H.quickTo, fh = H.imageSequence, dh = H.pageTransition;
za();
export {
  ic as Clock,
  bt as CompatTimeline,
  ya as CustomBounce,
  ga as CustomEase,
  ba as CustomWiggle,
  As as DEFAULT_BAKE_INTERVAL_MS,
  gn as DEFAULT_INERTIA_FRICTION,
  Ca as DEFAULT_LABELS,
  U as DEFAULT_SPRING,
  $c as DEFAULT_TRANSITION,
  zs as Draggable,
  tt as EXPRESSIONS,
  ie as FORMAT_VERSION,
  Vc as HUMAN_EXPRESSIONS,
  Vl as HUMAN_POSES,
  lt as HUMAN_REST,
  Ci as INERTIA_MAX_DURATION_MS,
  vr as InertiaTrackPlayer,
  Q as LiveTimeline,
  uc as MORPH_SAMPLES,
  sc as ManualClock,
  es as MediaSync,
  Io as Observer,
  tl as POSES,
  kt as REST_POSE,
  xs as SPRING_MAX_DURATION_MS,
  ve as SPRING_PRESETS,
  It as SPRING_STEP_MS,
  Qo as ScrollAnimator,
  be as ScrollDriver,
  ta as ScrollMarkers,
  zo as ScrollPin,
  zn as SmoothScroll,
  me as SpringSampler,
  wr as SpringTrackPlayer,
  Mo as Stage,
  $s as Timeline,
  dn as TinyflyPlayer,
  Ga as TinyflySequencer,
  Se as TrackPlayer,
  vc as ValueResolver,
  jo as VisibilityDriver,
  qi as backOut,
  Cs as bakeEasing,
  Ps as bakeInertiaTrack,
  Es as bakeSpringTrack,
  Qc as basicOutfit,
  Wa as bindChoiceHotspots,
  el as blendPose,
  ii as boilFrame,
  Wi as bounceOut,
  Uc as character,
  Zc as characterAt,
  Kl as characterJoints,
  Jc as characterPoseTracks,
  Kc as characterTarget,
  Tr as charactersFor,
  Nc as circlePath,
  Js as clamp01,
  fc as clearMorphCache,
  cc as clearPathCache,
  vi as clipErased,
  Vn as containerProgressAt,
  ch as context,
  _c as create,
  La as createControls,
  Ni as createCubicBezier,
  ka as createLive,
  Cl as createPen,
  an as createRandom,
  He as createTrack,
  ac as criticalDamping,
  Rr as customBounce,
  $r as customEase,
  Lr as customWiggle,
  Dt as deserializeTimeline,
  Er as deserializeTrack,
  kc as draggable,
  Ql as drawCharacter,
  yi as drawEraser,
  bi as drawHand,
  Pl as drawPencil,
  El as drawStickFigure,
  Yc as drawnPathTarget,
  Fi as easeIn,
  Ts as easeInCubic,
  Di as easeInOut,
  ye as easeInOutCubic,
  Li as easeInOutQuad,
  $i as easeInQuad,
  Oi as easeOut,
  Ms as easeOutCubic,
  Ri as easeOutQuad,
  Yi as elasticOut,
  ps as ellipsePoints,
  Xc as erasable,
  yr as expandParametricEasings,
  sh as from,
  yc as fromJSON,
  ih as fromTo,
  nt as getEasingFunction,
  oe as getInterpolator,
  Is as getMotionPathPoint,
  hc as getPathLength,
  Qi as getPointAtProgress,
  Ro as gridLinesFor,
  Ai as hasKeyframes,
  Fs as hashSeed,
  Fc as headPoint,
  Hc as humanFieldLabel,
  Ul as humanPlan,
  V as humanPose,
  fh as imageSequence,
  Wt as inertiaDuration,
  Yt as inertiaRest,
  We as inertiaValueAt,
  lc as inertiaVelocityAt,
  mr as interpolateArray,
  pr as interpolateColor,
  mc as interpolateMotionPath,
  J as interpolateNumber,
  gr as interpolatePathString,
  Cn as interpolateString,
  Si as isCubicBezierEasing,
  ft as isInertiaTrack,
  nc as isMotionPathPoint,
  bs as isMotionPathTrack,
  se as isParametricEasing,
  qt as isPathData,
  dt as isSpringTrack,
  rn as isTextTrack,
  oc as isUnderdamped,
  wc as isUnresolved,
  tc as jointsInScene,
  Al as jointsToScene,
  qe as linear,
  H as live,
  ae as mapEase,
  hh as matchMedia,
  vs as maxStaggerDistance,
  zc as mixPoses,
  ur as morphPath,
  Xa as mount,
  Ua as mountAll,
  Tc as narrationMarkers,
  Mc as narrationSceneAt,
  re as naturalRest,
  dh as pageTransition,
  Hi as parametricEasing,
  Hn as parseEdge,
  vt as parsePath,
  Zs as parseTrigger,
  Nt as partialPath,
  Ka as pathLength,
  xc as planNarration,
  Pc as play,
  Ic as playSequence,
  Ac as playWhenVisible,
  Rs as playheadCrossings,
  si as pointAlong,
  ks as pointAtDistance,
  jc as pointOnHead,
  Yr as pointsToPath,
  X as pose,
  Bc as poseTracks,
  th as quickPlay,
  uh as quickTo,
  Os as randomBetween,
  bc as randomChoice,
  _r as randomSnapped,
  Gc as reachCharacter,
  Cr as resolveSequence,
  gi as resolveStickPose,
  Ns as resolveValue,
  Mt as rubberLimb,
  Sc as scrollProgress,
  Ec as scrubOnScroll,
  Wc as scrubPath,
  Lc as seatHeight,
  Pr as serializeTimeline,
  Ar as serializeTrack,
  rh as set,
  ln as shapeToPathData,
  br as simplifyKeyframes,
  Ze as sketchPen,
  Uo as smoothToward,
  $o as snapAxis,
  Ko as snapConfig,
  Jo as snapDuration,
  Zo as snapProgress,
  lh as splitText,
  Ei as springDuration,
  rc as springValueAt,
  ws as staggerDistance,
  on as staggerOffset,
  Ye as staggerOffsets,
  pe as staggerSpan,
  Xi as stepsEasing,
  Dc as stickFigureAt,
  Sl as stickFigureJoints,
  Oc as stickFigureTarget,
  Rc as strideLength,
  _a as syncMediaElement,
  il as talkingMouth,
  ri as taperedLine,
  ee as taperedOutline,
  kr as textAt,
  eh as tf,
  ah as ticker,
  oh as timeline,
  nh as to,
  gc as toJSON,
  dc as toKeyframedTrack,
  pc as toKeyframedTracks,
  ht as trackTargets,
  Bt as triggerDistance,
  Cc as unmount,
  sl as walkPose,
  qc as withErased,
  Qa as withExpression
};
