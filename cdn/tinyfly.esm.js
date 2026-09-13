function rt(i) {
  return typeof i == "object" && i !== null && i.type === "cubic-bezier";
}
function C(i) {
  return i.kind === "spring" && "spring" in i;
}
function Rt(i) {
  return i.property === "motionPath" && "motionPathConfig" in i;
}
function ln(i) {
  return typeof i == "object" && i !== null && "x" in i && "y" in i && "angle" in i;
}
function he(i) {
  return "keyframes" in i;
}
class hn {
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
class un {
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
function $t(i, t, e = "start") {
  if (t <= 1) return 0;
  if (typeof e == "number") {
    const n = Math.max(0, Math.min(t - 1, e));
    return Math.abs(i - n);
  }
  switch (e) {
    case "end":
      return t - 1 - i;
    case "center":
      return Math.abs(i - (t - 1) / 2);
    case "edges":
      return (t - 1) / 2 - Math.abs(i - (t - 1) / 2);
    default:
      return i;
  }
}
function ue(i, t = "start") {
  if (i <= 1) return 0;
  let e = 0;
  for (let n = 0; n < i; n++)
    e = Math.max(e, $t(n, i, t));
  return e;
}
function Dt(i, t, e) {
  const n = e.from ?? "start", s = $t(i, t, n);
  if (e.amount !== void 0) {
    const o = ue(t, n);
    return o === 0 ? 0 : e.amount * s / o;
  }
  return e.each !== void 0 ? e.each * s : 0;
}
function fe(i, t) {
  return Array.from({ length: i }, (e, n) => Dt(n, i, t));
}
function ot(i, t) {
  return i <= 1 ? 0 : Math.max(...fe(i, t));
}
const R = 1, Xt = 6e4, U = Xt / R, k = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
};
class H {
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
    this.from = t.from, this.to = t.to, this.stiffness = t.stiffness ?? k.stiffness, this.damping = t.damping ?? k.damping, this.mass = t.mass ?? k.mass, this.restDelta = t.restDelta ?? k.restDelta, this.restSpeed = t.restSpeed ?? k.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = t.velocity ?? k.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const e = Math.floor(t / R);
    if (this.simulateTo(e + 1), this.settledStep !== null && e >= this.settledStep)
      return this.to;
    const n = this.samples[Math.min(e, this.samples.length - 1)], s = this.samples[Math.min(e + 1, this.samples.length - 1)], o = t / R - e;
    return n + (s - n) * o;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(U + 1), this.settledStep !== null ? this.settledStep * R : Xt;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(t) {
    if (this.settledStep !== null) return;
    const e = Math.min(t, U + 1), n = R / 1e3;
    for (; this.samples.length < e; ) {
      const s = this.samples[this.samples.length - 1], o = s - this.to, a = -this.stiffness * o, c = -this.damping * this.velocity, l = (a + c) / this.mass;
      this.velocity += l * n;
      const r = s + this.velocity * n;
      if (this.samples.push(r), this.isAtRest(r)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > U && (this.settledStep = U);
  }
}
function fn(i, t) {
  return new H(i).valueAt(t);
}
function dn(i) {
  return new H(i).settleTime();
}
function pn(i) {
  const t = i.stiffness ?? k.stiffness, e = i.damping ?? k.damping, n = i.mass ?? k.mass;
  return e < 2 * Math.sqrt(t * n);
}
function mn(i) {
  const t = i.stiffness ?? k.stiffness, e = i.mass ?? k.mass;
  return 2 * Math.sqrt(t * e);
}
const Yt = (i) => i, de = (i) => i * i, pe = (i) => 1 - (1 - i) * (1 - i), me = (i) => i < 0.5 ? 2 * i * i : 1 - Math.pow(-2 * i + 2, 2) / 2, qt = (i) => i * i * i, Ot = (i) => 1 - Math.pow(1 - i, 3), Ut = (i) => i < 0.5 ? 4 * i * i * i : 1 - Math.pow(-2 * i + 2, 3) / 2, ge = qt, ye = Ot, be = Ut, we = {
  linear: Yt,
  "ease-in": ge,
  "ease-out": ye,
  "ease-in-out": be,
  "ease-in-quad": de,
  "ease-out-quad": pe,
  "ease-in-out-quad": me,
  "ease-in-cubic": qt,
  "ease-out-cubic": Ot,
  "ease-in-out-cubic": Ut
};
function Te(i) {
  const [t, e, n, s] = i, o = 3 * t, a = 3 * (n - t) - o, c = 1 - o - a, l = 3 * e, r = 3 * (s - e) - l, f = 1 - l - r, m = (u) => ((c * u + a) * u + o) * u, h = (u) => ((f * u + r) * u + l) * u, p = (u) => (3 * c * u + 2 * a) * u + o, d = (u) => {
    let g = u;
    for (let b = 0; b < 8; b++) {
      const w = m(g) - u;
      if (Math.abs(w) < 1e-7)
        return g;
      const v = p(g);
      if (Math.abs(v) < 1e-7)
        break;
      g -= w / v;
    }
    let y = 0, T = 1;
    for (g = u; y < T; ) {
      const b = m(g);
      if (Math.abs(b - u) < 1e-7)
        return g;
      u > b ? y = g : T = g, g = (y + T) / 2;
    }
    return g;
  };
  return (u) => {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    const g = d(u);
    return h(g);
  };
}
function Vt(i) {
  return i === void 0 ? Yt : rt(i) ? Te(i.points) : we[i];
}
const ut = /* @__PURE__ */ new Map();
function ve(i) {
  const t = ut.get(i);
  if (t) return t;
  const e = [];
  let n = 0, s = 0, o = 0, a = 0;
  const c = i.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
  for (const f of c) {
    const m = f[0], h = m === m.toLowerCase(), p = m.toUpperCase(), d = f.slice(1).trim().split(/[\s,]+/).filter((u) => u.length > 0).map(parseFloat);
    switch (p) {
      case "M": {
        h ? (n += d[0], s += d[1]) : (n = d[0], s = d[1]), o = n, a = s;
        break;
      }
      case "L": {
        const u = h ? n + d[0] : d[0], g = h ? s + d[1] : d[1], y = Math.sqrt(
          Math.pow(u - n, 2) + Math.pow(g - s, 2)
        );
        e.push({
          type: "L",
          points: [u, g],
          startX: n,
          startY: s,
          endX: u,
          endY: g,
          length: y
        }), n = u, s = g;
        break;
      }
      case "H": {
        const u = h ? n + d[0] : d[0], g = Math.abs(u - n);
        e.push({
          type: "L",
          points: [u, s],
          startX: n,
          startY: s,
          endX: u,
          endY: s,
          length: g
        }), n = u;
        break;
      }
      case "V": {
        const u = h ? s + d[0] : d[0], g = Math.abs(u - s);
        e.push({
          type: "L",
          points: [n, u],
          startX: n,
          startY: s,
          endX: n,
          endY: u,
          length: g
        }), s = u;
        break;
      }
      case "C": {
        let u = 0;
        for (; u + 5 < d.length || u === 0; ) {
          const g = h ? n + d[u] : d[u], y = h ? s + d[u + 1] : d[u + 1], T = h ? n + d[u + 2] : d[u + 2], b = h ? s + d[u + 3] : d[u + 3], w = h ? n + d[u + 4] : d[u + 4], v = h ? s + d[u + 5] : d[u + 5], S = ke(
            n,
            s,
            g,
            y,
            T,
            b,
            w,
            v
          );
          e.push({
            type: "C",
            points: [g, y, T, b, w, v],
            startX: n,
            startY: s,
            endX: w,
            endY: v,
            length: S
          }), n = w, s = v, u += 6;
        }
        break;
      }
      case "Q": {
        let u = 0;
        for (; u + 3 < d.length || u === 0; ) {
          const g = h ? n + d[u] : d[u], y = h ? s + d[u + 1] : d[u + 1], T = h ? n + d[u + 2] : d[u + 2], b = h ? s + d[u + 3] : d[u + 3], w = Ae(
            n,
            s,
            g,
            y,
            T,
            b
          );
          e.push({
            type: "Q",
            points: [g, y, T, b],
            startX: n,
            startY: s,
            endX: T,
            endY: b,
            length: w
          }), n = T, s = b, u += 4;
        }
        break;
      }
      case "A": {
        const u = d[0], g = d[1], y = d[2], T = d[3], b = d[4], w = h ? n + d[5] : d[5], v = h ? s + d[6] : d[6], S = xe(
          n,
          s,
          u,
          g,
          y,
          T,
          b,
          w,
          v
        );
        e.push({
          type: "A",
          points: [u, g, y, T, b, w, v],
          startX: n,
          startY: s,
          endX: w,
          endY: v,
          length: S
        }), n = w, s = v;
        break;
      }
      case "Z": {
        const u = Math.sqrt(
          Math.pow(o - n, 2) + Math.pow(a - s, 2)
        );
        u > 0 && e.push({
          type: "L",
          points: [o, a],
          startX: n,
          startY: s,
          endX: o,
          endY: a,
          length: u
        }), n = o, s = a;
        break;
      }
      case "S":
      case "T":
        if (p === "S" && d.length >= 4) {
          const u = h ? n + d[2] : d[2], g = h ? s + d[3] : d[3], y = Math.sqrt(
            Math.pow(u - n, 2) + Math.pow(g - s, 2)
          );
          e.push({
            type: "L",
            points: [u, g],
            startX: n,
            startY: s,
            endX: u,
            endY: g,
            length: y
          }), n = u, s = g;
        } else if (p === "T" && d.length >= 2) {
          const u = h ? n + d[0] : d[0], g = h ? s + d[1] : d[1], y = Math.sqrt(
            Math.pow(u - n, 2) + Math.pow(g - s, 2)
          );
          e.push({
            type: "L",
            points: [u, g],
            startX: n,
            startY: s,
            endX: u,
            endY: g,
            length: y
          }), n = u, s = g;
        }
        break;
    }
  }
  const l = e.reduce((f, m) => f + m.length, 0), r = { segments: e, totalLength: l };
  return ut.set(i, r), r;
}
function it(i, t) {
  const e = ve(i);
  if (e.segments.length === 0)
    return { x: 0, y: 0, angle: 0 };
  const s = Math.max(0, Math.min(1, t)) * e.totalLength;
  let o = 0;
  for (const c of e.segments) {
    if (o + c.length >= s || c === e.segments[e.segments.length - 1]) {
      const l = c.length > 0 ? (s - o) / c.length : 0;
      return Se(c, Math.max(0, Math.min(1, l)));
    }
    o += c.length;
  }
  const a = e.segments[e.segments.length - 1];
  return { x: a.endX, y: a.endY, angle: 0 };
}
function Se(i, t) {
  switch (i.type) {
    case "L": {
      const e = i.startX + (i.endX - i.startX) * t, n = i.startY + (i.endY - i.startY) * t, s = Math.atan2(
        i.endY - i.startY,
        i.endX - i.startX
      ) * (180 / Math.PI);
      return { x: e, y: n, angle: s };
    }
    case "C": {
      const [e, n, s, o, a, c] = i.points, l = Nt(
        i.startX,
        i.startY,
        e,
        n,
        s,
        o,
        a,
        c,
        t
      ), r = Me(
        i.startX,
        i.startY,
        e,
        n,
        s,
        o,
        a,
        c,
        t
      ), f = Math.atan2(r.y, r.x) * (180 / Math.PI);
      return { x: l.x, y: l.y, angle: f };
    }
    case "Q": {
      const [e, n, s, o] = i.points, a = zt(
        i.startX,
        i.startY,
        e,
        n,
        s,
        o,
        t
      ), c = Ee(
        i.startX,
        i.startY,
        e,
        n,
        s,
        o,
        t
      ), l = Math.atan2(c.y, c.x) * (180 / Math.PI);
      return { x: a.x, y: a.y, angle: l };
    }
    case "A": {
      const e = i.startX + (i.endX - i.startX) * t, n = i.startY + (i.endY - i.startY) * t, s = Math.atan2(
        i.endY - i.startY,
        i.endX - i.startX
      ) * (180 / Math.PI);
      return { x: e, y: n, angle: s };
    }
    default:
      return { x: i.endX, y: i.endY, angle: 0 };
  }
}
function Nt(i, t, e, n, s, o, a, c, l) {
  const r = 1 - l, f = r * r, m = f * r, h = l * l, p = h * l;
  return {
    x: m * i + 3 * f * l * e + 3 * r * h * s + p * a,
    y: m * t + 3 * f * l * n + 3 * r * h * o + p * c
  };
}
function Me(i, t, e, n, s, o, a, c, l) {
  const r = 1 - l, f = r * r, m = l * l;
  return {
    x: 3 * f * (e - i) + 6 * r * l * (s - e) + 3 * m * (a - s),
    y: 3 * f * (n - t) + 6 * r * l * (o - n) + 3 * m * (c - o)
  };
}
function zt(i, t, e, n, s, o, a) {
  const c = 1 - a, l = c * c, r = a * a;
  return {
    x: l * i + 2 * c * a * e + r * s,
    y: l * t + 2 * c * a * n + r * o
  };
}
function Ee(i, t, e, n, s, o, a) {
  const c = 1 - a;
  return {
    x: 2 * c * (e - i) + 2 * a * (s - e),
    y: 2 * c * (n - t) + 2 * a * (o - n)
  };
}
function ke(i, t, e, n, s, o, a, c, l = 20) {
  let r = 0, f = i, m = t;
  for (let h = 1; h <= l; h++) {
    const p = h / l, d = Nt(i, t, e, n, s, o, a, c, p);
    r += Math.sqrt(
      Math.pow(d.x - f, 2) + Math.pow(d.y - m, 2)
    ), f = d.x, m = d.y;
  }
  return r;
}
function Ae(i, t, e, n, s, o, a = 20) {
  let c = 0, l = i, r = t;
  for (let f = 1; f <= a; f++) {
    const m = f / a, h = zt(i, t, e, n, s, o, m);
    c += Math.sqrt(
      Math.pow(h.x - l, 2) + Math.pow(h.y - r, 2)
    ), l = h.x, r = h.y;
  }
  return c;
}
function xe(i, t, e, n, s, o, a, c, l) {
  const r = Math.sqrt(Math.pow(c - i, 2) + Math.pow(l - t, 2)), f = (e + n) / 2;
  return Math.max(r, f * Math.PI * 0.5);
}
const Pe = 64, ft = (i) => Math.round(i * 100) / 100;
function _e(i, t, e, n = Pe) {
  const s = Math.max(0, Math.min(1, e));
  if (!i) return t;
  if (!t) return i;
  let o = "";
  for (let a = 0; a <= n; a++) {
    const c = a / n, l = it(i, c), r = it(t, c), f = ft(l.x + (r.x - l.x) * s), m = ft(l.y + (r.y - l.y) * s);
    o += a === 0 ? `M ${f} ${m}` : ` L ${f} ${m}`;
  }
  return o + " Z";
}
function Be(i) {
  return /^\s*[Mm]\s*-?\d/.test(i);
}
const P = (i, t, e) => i + (t - i) * e, Wt = 512, K = /* @__PURE__ */ new Map(), G = /* @__PURE__ */ new Map();
function dt(i) {
  const t = K.get(i);
  if (t) return t;
  const e = i.replace("#", ""), n = [
    parseInt(e.slice(0, 2), 16),
    parseInt(e.slice(2, 4), 16),
    parseInt(e.slice(4, 6), 16)
  ];
  return K.size < Wt && K.set(i, n), n;
}
const pt = (i) => i.charCodeAt(0) === 35, mt = (i) => i.startsWith("rgb"), gt = (i) => i.startsWith("rgba"), Ce = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, j = (i) => Math.round(i).toString(16).padStart(2, "0");
function Ie(i, t, e) {
  return `#${j(i)}${j(t)}${j(e)}`;
}
function yt(i) {
  const t = G.get(i);
  if (t) return t;
  const e = i.match(Ce);
  if (!e)
    throw new Error(`Invalid rgb color: ${i}`);
  const n = parseInt(e[1], 10), s = parseInt(e[2], 10), o = parseInt(e[3], 10), a = e[4] !== void 0 ? [n, s, o, parseFloat(e[4])] : [n, s, o];
  return G.size < Wt && G.set(i, a), a;
}
const Le = (i, t, e) => {
  if (pt(i) && pt(t)) {
    const [n, s, o] = dt(i), [a, c, l] = dt(t), r = P(n, a, e), f = P(s, c, e), m = P(o, l, e);
    return Ie(r, f, m);
  }
  if ((mt(i) || gt(i)) && (mt(t) || gt(t))) {
    const n = yt(i), s = yt(t), o = Math.round(P(n[0], s[0], e)), a = Math.round(P(n[1], s[1], e)), c = Math.round(P(n[2], s[2], e));
    if (n.length === 4 || s.length === 4) {
      const l = n[3] ?? 1, r = s[3] ?? 1, f = P(l, r, e);
      return `rgba(${o}, ${a}, ${c}, ${f})`;
    }
    return `rgb(${o}, ${a}, ${c})`;
  }
  return e < 1 ? i : t;
}, Fe = (i, t, e) => {
  const n = Math.min(i.length, t.length), s = [];
  for (let o = 0; o < n; o++)
    s.push(P(i[o], t[o], e));
  return s;
}, bt = (i, t, e) => e < 1 ? i : t, Re = (i, t, e) => _e(i, t, e);
function Ht(i) {
  return typeof i == "number" ? P : Array.isArray(i) ? Fe : typeof i == "string" ? i.startsWith("#") || i.startsWith("rgb") ? Le : Be(i) ? Re : bt : bt;
}
const Kt = 1e3 / 60;
function Gt(i, t = {}) {
  if (!C(i))
    throw new Error(`bakeSpringTrack: track "${i.id}" is not a spring track`);
  const e = t.intervalMs ?? Kt, n = t.tolerance ?? 0.01, s = new H(i.spring), o = s.settleTime(), a = i.delay ?? 0, c = [];
  for (let r = 0; r <= o; r += e)
    c.push({ time: r + a, value: s.valueAt(r), easing: "linear" });
  const l = c[c.length - 1];
  return !l || l.time < o + a ? c.push({ time: o + a, value: i.spring.to, easing: "linear" }) : l.value = i.spring.to, a > 0 && c.unshift({ time: 0, value: i.spring.from, easing: "linear" }), {
    id: i.id,
    target: i.target,
    property: i.property,
    keyframes: n > 0 ? De(c, n) : c,
    ...i.targets && { targets: [...i.targets] },
    ...i.stagger && { stagger: { ...i.stagger } }
  };
}
function $e(i, t, e, n = {}) {
  const s = n.intervalMs ?? Kt, o = typeof e == "function" ? e : Vt(e), a = Ht(i.value), c = t.time - i.time;
  if (c <= 0) return [t];
  const l = [];
  for (let r = s; r < c; r += s) {
    const f = r / c;
    l.push({
      time: i.time + r,
      value: a(i.value, t.value, o(f)),
      easing: "linear"
    });
  }
  return l.push({ ...t, easing: "linear" }), l;
}
function gn(i, t) {
  return C(i) ? Gt(i, t) : i;
}
function jt(i, t) {
  return i.filter(he).concat(
    i.filter(C).map((e) => Gt(e, t))
  );
}
function De(i, t) {
  if (i.length <= 2) return i;
  const e = [i[0]];
  for (let n = 1; n < i.length - 1; n++) {
    const s = e[e.length - 1], o = i[n], a = i[n + 1], c = a.time - s.time;
    if (c <= 0) continue;
    const l = (o.time - s.time) / c, r = s.value + (a.value - s.value) * l;
    Math.abs(o.value - r) > t && e.push(o);
  }
  return e.push(i[i.length - 1]), e;
}
function nt(i) {
  const t = [...i.keyframes].sort((e, n) => e.time - n.time);
  return {
    ...i,
    keyframes: t
  };
}
function $(i) {
  return i.targets && i.targets.length > 0 ? i.targets : [i.target];
}
function z(i, t, e, n) {
  const s = e ?? 0;
  return !n || t <= 1 ? s : s + Dt(i, t, n);
}
class wt {
  track;
  targets;
  constructor(t) {
    this.track = t, this.targets = $(t);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(t) {
    return this.valueForOffset(t - z(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  /**
   * Every target's value at a specific time, in target order.
   *
   * Single-target tracks yield one entry; staggered tracks yield one per target,
   * each sampled at its own offset time.
   */
  getTargetValues(t) {
    const e = this.targets.length, n = [];
    for (let s = 0; s < e; s++) {
      const o = z(s, e, this.track.delay, this.track.stagger), a = this.valueForOffset(t - o);
      a !== void 0 && n.push({ target: this.targets[s], value: a });
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
    const e = t[t.length - 1].time, n = this.track.stagger ? ot(this.targets.length, this.track.stagger) : 0;
    return e + (this.track.delay ?? 0) + n + (this.track.endDelay ?? 0);
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
    const { from: n, to: s } = this.findSurroundingKeyframes(t);
    if (!n || !s)
      return;
    if (n.time === t)
      return n.value;
    const o = s.time - n.time, a = (t - n.time) / o, l = Vt(s.easing)(a);
    return Ht(n.value)(n.value, s.value, l);
  }
  /**
   * Find the keyframes surrounding a given time.
   */
  findSurroundingKeyframes(t) {
    const { keyframes: e } = this.track;
    for (let n = 0; n < e.length - 1; n++)
      if (t >= e[n].time && t <= e[n + 1].time)
        return { from: e[n], to: e[n + 1] };
    return { from: null, to: null };
  }
}
class Xe {
  track;
  targets;
  sampler;
  constructor(t) {
    this.track = t, this.targets = $(t), this.sampler = new H(t.spring);
  }
  getValueAtTime(t) {
    return this.sampler.valueAt(t - z(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const e = this.targets.length, n = [];
    for (let s = 0; s < e; s++) {
      const o = z(s, e, this.track.delay, this.track.stagger);
      n.push({ target: this.targets[s], value: this.sampler.valueAt(t - o) });
    }
    return n;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? ot(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
function Ye(i, t) {
  const e = it(i.pathData, t);
  return i.autoRotate && i.rotateOffset && (e.angle += i.rotateOffset), e;
}
class Zt {
  id;
  name;
  _tracks = [];
  _trackPlayers = /* @__PURE__ */ new Map();
  _motionPathTracks = /* @__PURE__ */ new Map();
  _springTracks = /* @__PURE__ */ new Map();
  _config;
  _currentTime = 0;
  _playbackState = "idle";
  _direction = "forward";
  _loopIteration = 0;
  _explicitDuration;
  /** Milliseconds still to wait at a loop boundary before the next iteration */
  _repeatDelayRemaining = 0;
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
    this._playbackState = "idle", this._repeatDelayRemaining = 0, this._currentTime = 0, this._loopIteration = 0, this._direction = "forward";
  }
  /**
   * Seek to a specific time.
   */
  seek(t) {
    const e = this.duration > 0 ? this.duration : 1 / 0;
    this._currentTime = Math.max(0, Math.min(t, e)), this._repeatDelayRemaining = 0;
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
    let s = t * this.speed;
    if (this._repeatDelayRemaining > 0) {
      const c = Math.min(this._repeatDelayRemaining, s);
      if (this._repeatDelayRemaining -= c, s -= c, this._repeatDelayRemaining > 0) {
        this.onUpdate?.(this.getStateAtTime(this._currentTime));
        return;
      }
    }
    const o = 1e3;
    for (let c = 0; c < o && s > 0 && this._playbackState === "playing"; c++)
      if (this._direction === "forward") {
        const l = e - this._currentTime;
        if (s >= l) {
          if (s -= l, this._currentTime = e, !this._handleEndReached())
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
    const e = /* @__PURE__ */ new Map();
    for (const [n, s] of this._trackPlayers) {
      const o = s.getTrack();
      for (const { target: a, value: c } of s.getTargetValues(t)) {
        if (c === void 0) continue;
        e.has(a) || e.set(a, /* @__PURE__ */ new Map());
        const l = e.get(a), r = this._motionPathTracks.get(n);
        if (r && typeof c == "number") {
          const f = Ye(r.motionPathConfig, c);
          l.set("motionPathX", f.x), l.set("motionPathY", f.y), r.motionPathConfig.autoRotate && l.set("motionPathRotate", f.angle);
        } else
          l.set(o.property, c);
      }
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
   * Add a track to the timeline.
   */
  addTrack(t) {
    if (this._tracks.push(t), C(t)) {
      this._trackPlayers.set(t.id, new Xe(t)), this._springTracks.set(t.id, t);
      return;
    }
    if (Rt(t)) {
      const e = {
        id: t.id,
        target: t.target,
        property: t.property,
        keyframes: t.keyframes,
        delay: t.delay,
        targets: t.targets,
        stagger: t.stagger
      };
      this._trackPlayers.set(t.id, new wt(e)), this._motionPathTracks.set(t.id, t);
    } else
      this._trackPlayers.set(t.id, new wt(t));
  }
  /**
   * Remove a track by its ID.
   */
  removeTrack(t) {
    this._tracks = this._tracks.filter((e) => e.id !== t), this._trackPlayers.delete(t), this._motionPathTracks.delete(t), this._springTracks.delete(t);
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
    const e = this.getTracks(t).map((n) => n.id);
    for (const n of e)
      this.removeTrack(n);
    return e;
  }
  /**
   * The time span a track is active over: [start, end] in milliseconds.
   */
  getTrackSpan(t) {
    const e = this._trackPlayers.get(t);
    if (!e) return;
    const n = e.getTrack(), s = n.delay ?? 0;
    if (C(n))
      return { from: s, to: e.getDuration() };
    const o = n.keyframes;
    if (!(!o || o.length === 0))
      return { from: o[0].time + s, to: e.getDuration() };
  }
  /**
   * Overlapping writes to the same target+property.
   *
   * The engine resolves these as last-added-wins (see `getStateAtTime`), which
   * is predictable but silent — an authoring tool should call this and warn,
   * because a silently discarded track looks like a bug in the animation.
   */
  findConflicts() {
    const t = [];
    for (let e = 0; e < this._tracks.length; e++) {
      const n = this._tracks[e], s = this.getTrackSpan(n.id);
      if (s)
        for (let o = 0; o < e; o++) {
          const a = this._tracks[o];
          if (a.property !== n.property) continue;
          const c = $(a).filter((f) => $(n).includes(f));
          if (c.length === 0) continue;
          const l = this.getTrackSpan(a.id);
          if (!(!l || !(l.from <= s.to && s.from <= l.to)))
            for (const f of c)
              t.push({
                target: f,
                property: n.property,
                losingTrackId: a.id,
                winningTrackId: n.id
              });
        }
    }
    return t;
  }
  _matches(t, e) {
    if (e.id !== void 0 && t.id !== e.id || e.property !== void 0 && t.property !== e.property || e.target !== void 0 && !$(t).includes(e.target)) return !1;
    if (e.timeRange) {
      const n = this.getTrackSpan(t.id);
      if (!n || n.to < e.timeRange.from || n.from > e.timeRange.to) return !1;
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
    return t === -1 || this._loopIteration < t ? (this._loopIteration++, this._armRepeatDelay(), this._config.alternate ? this._direction = "reverse" : this._currentTime = 0, this._repeatDelayRemaining === 0) : (this._playbackState = "idle", this.onComplete?.(), !1);
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
function qe(i) {
  return C(i) ? {
    id: i.id,
    target: i.target,
    property: i.property,
    kind: "spring",
    spring: { ...i.spring },
    ...F(i)
  } : Rt(i) ? {
    id: i.id,
    target: i.target,
    property: "motionPath",
    motionPathConfig: { ...i.motionPathConfig },
    keyframes: i.keyframes.map(Tt),
    ...F(i)
  } : {
    id: i.id,
    target: i.target,
    property: i.property,
    keyframes: i.keyframes.map(Tt),
    ...F(i)
  };
}
function Tt(i) {
  return {
    time: i.time,
    value: i.value,
    ...i.easing && { easing: i.easing }
  };
}
function F(i) {
  const t = i.endDelay;
  return {
    ...i.delay !== void 0 && { delay: i.delay },
    ...t !== void 0 && { endDelay: t },
    ...i.targets !== void 0 && { targets: [...i.targets] },
    ...i.stagger !== void 0 && { stagger: { ...i.stagger } }
  };
}
function Oe(i) {
  if (C(i)) {
    const t = i;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "spring",
      spring: { ...t.spring },
      ...F(t)
    };
  }
  if (i.property === "motionPath" && "motionPathConfig" in i) {
    const t = i, e = [...t.keyframes].sort((n, s) => n.time - s.time);
    return {
      id: t.id,
      target: t.target,
      property: "motionPath",
      motionPathConfig: { ...t.motionPathConfig },
      keyframes: e,
      ...F(t)
    };
  }
  return nt({
    id: i.id,
    target: i.target,
    property: i.property,
    keyframes: i.keyframes,
    ...F(i)
  });
}
function Ue(i) {
  return {
    id: i.id,
    name: i.name,
    config: {
      duration: i.duration > 0 ? i.duration : void 0,
      loop: i._config.loop,
      speed: i._config.speed,
      alternate: i._config.alternate,
      repeatDelay: i._config.repeatDelay
    },
    tracks: i.tracks.map(qe)
  };
}
function D(i) {
  return new Zt({
    id: i.id,
    name: i.name,
    config: i.config,
    tracks: i.tracks.map(Oe)
  });
}
function yn(i) {
  return JSON.stringify(Ue(i));
}
function bn(i) {
  const t = JSON.parse(i);
  return D(t);
}
const Ve = {
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
function Ne(i) {
  if (rt(i)) {
    const [t, e, n, s] = i.points;
    return `cubic-bezier(${t}, ${e}, ${n}, ${s})`;
  }
  return Ve[i];
}
const ze = {
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
}, We = /* @__PURE__ */ new Set(["x", "y", "rotate", "scale", "scaleX", "scaleY"]);
function He(i, t) {
  return typeof t == "number" ? i === "opacity" || i === "scale" || i === "scaleX" || i === "scaleY" ? String(t) : i === "rotate" ? `${t}deg` : `${t}px` : String(t);
}
function Ke(i) {
  const t = /* @__PURE__ */ new Map();
  for (const e of i) {
    const n = t.get(e.target) ?? [];
    n.push(e), t.set(e.target, n);
  }
  return t;
}
function Ge(i, t) {
  const e = /* @__PURE__ */ new Set();
  for (const n of i)
    for (const s of n.keyframes)
      e.add(s.time);
  return e.add(0), e.add(t), Array.from(e).sort((n, s) => n - s);
}
function je(i, t) {
  const e = i.keyframes;
  if (e.length === 0) return null;
  let n = null, s = null;
  for (const o of e)
    o.time <= t && (n = o), o.time >= t && !s && (s = o);
  return n && n.time === t ? n.value : s && s.time === t ? s.value : n && !s ? n.value : !n && s ? s.value : n?.value ?? null;
}
function Ze(i) {
  return We.has(i);
}
function Qe(i, t, e, n) {
  const s = { ...ze, ...n.propertyMap }, o = Ge(t, e), a = [], c = n.minify ? "" : "  ", l = n.minify ? "" : `
`, r = n.minify ? "" : " ";
  a.push(`@keyframes ${i}${r}{`);
  for (const f of o) {
    const m = e > 0 ? Math.round(f / e * 100) : 0, h = [], p = [];
    for (const d of t) {
      const u = je(d, f);
      if (u === null) continue;
      const g = s[d.property] ?? d.property, y = He(d.property, u);
      if (Ze(d.property))
        switch (d.property) {
          case "x":
            p.push(`translateX(${y})`);
            break;
          case "y":
            p.push(`translateY(${y})`);
            break;
          case "rotate":
            p.push(`rotate(${y})`);
            break;
          case "scale":
            p.push(`scale(${u})`);
            break;
          case "scaleX":
            p.push(`scaleX(${u})`);
            break;
          case "scaleY":
            p.push(`scaleY(${u})`);
            break;
        }
      else
        h.push(`${g}:${r}${y}`);
    }
    p.length > 0 && h.push(`transform:${r}${p.join(" ")}`), h.length > 0 && a.push(`${c}${m}%${r}{${r}${h.join(`;${r}`)}${r}}`);
  }
  return a.push("}"), a.join(l);
}
function Je(i) {
  const t = /* @__PURE__ */ new Map();
  for (const s of i)
    for (const o of s.keyframes) {
      const a = o.easing ?? "linear";
      t.set(a, (t.get(a) ?? 0) + 1);
    }
  let e = 0, n = "linear";
  for (const [s, o] of t)
    o > e && (e = o, n = s);
  return n;
}
function ti(i, t, e, n, s) {
  const o = s.minify ? "" : " ", a = (t / 1e3).toFixed(2), c = Ne(Je(e)), l = n.loop === -1 ? "infinite" : n.loop ? n.loop + 1 : 1, r = n.alternate ? "alternate" : "normal";
  return `animation:${o}${i} ${a}s ${c} ${l} ${r}`;
}
function wn(i, t = {}) {
  const {
    classPrefix: e = "tinyfly",
    includeKeyframes: n = !0,
    includeAnimation: s = !0,
    minify: o = !1
  } = t, a = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = [], r = o ? "" : `
`, f = o ? "" : " ", m = i.duration, h = {
    loop: i._config.loop,
    alternate: i._config.alternate
  }, p = Ke(jt(i.tracks));
  for (const [d, u] of p) {
    const g = `${e}-${d.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (n) {
      const y = Qe(g, u, m, t);
      a.set(g, y), l.push(y);
    }
    if (s) {
      const y = ti(g, m, u, h, t), b = `${`.${e}-${d.replace(/[^a-zA-Z0-9]/g, "-")}`}${f}{${r}${o ? "" : "  "}${y};${r}}`;
      c.set(d, b), l.push(b);
    }
  }
  return {
    css: l.join(r + r),
    keyframes: a,
    selectors: c
  };
}
function Qt(i) {
  const t = {
    i: { x: [0.833], y: [0.833] },
    o: { x: [0.167], y: [0.167] }
  };
  if (rt(i)) {
    const [n, s, o, a] = i.points;
    return {
      i: { x: [n], y: [s] },
      o: { x: [o], y: [a] }
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
  }[i] ?? t;
}
function at(i, t) {
  return Math.round(i / 1e3 * t);
}
function ei(i) {
  if (i.startsWith("#")) {
    const t = i.slice(1);
    if (t.length === 3) {
      const e = parseInt(t[0] + t[0], 16) / 255, n = parseInt(t[1] + t[1], 16) / 255, s = parseInt(t[2] + t[2], 16) / 255;
      return [e, n, s];
    }
    if (t.length === 6) {
      const e = parseInt(t.slice(0, 2), 16) / 255, n = parseInt(t.slice(2, 4), 16) / 255, s = parseInt(t.slice(4, 6), 16) / 255;
      return [e, n, s];
    }
  }
  return [0, 0, 0];
}
function Z(i, t, e = !1) {
  if (i.length === 0)
    return e ? { a: 0, k: [0, 0] } : { a: 0, k: 0 };
  if (i.length === 1) {
    const s = i[0].value;
    return e && typeof s == "number" ? { a: 0, k: [s, s] } : { a: 0, k: s };
  }
  const n = [];
  for (let s = 0; s < i.length; s++) {
    const o = i[s], a = i[s + 1], c = at(o.time, t), l = typeof o.value == "number" ? [o.value] : [0], r = {
      t: c,
      s: l
    };
    if (a) {
      const f = typeof a.value == "number" ? [a.value] : [0];
      r.e = f;
      const m = a.easing ?? "linear", h = Qt(m);
      r.i = h.i, r.o = h.o;
    }
    n.push(r);
  }
  return { a: 1, k: n };
}
function ii(i) {
  const t = /* @__PURE__ */ new Map();
  for (const e of i) {
    const n = t.get(e.target) ?? [];
    n.push(e), t.set(e.target, n);
  }
  return t;
}
function ni(i, t) {
  const e = {
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
  for (const o of i) {
    const a = o.keyframes;
    switch (o.property) {
      case "opacity":
        const c = a.map((r) => ({
          ...r,
          value: r.value * 100
        }));
        e.o = Z(c, t);
        break;
      case "rotate":
      case "rotation":
        e.r = Z(a, t);
        break;
      case "scale":
        const l = a.map((r) => ({
          ...r,
          value: r.value * 100
        }));
        e.s = Z(l, t, !0);
        break;
    }
  }
  const n = i.find((o) => o.property === "x"), s = i.find((o) => o.property === "y");
  if (n || s) {
    const o = n?.keyframes ?? [{ time: 0, value: 0 }], a = s?.keyframes ?? [{ time: 0, value: 0 }], c = /* @__PURE__ */ new Set();
    o.forEach((r) => c.add(r.time)), a.forEach((r) => c.add(r.time));
    const l = Array.from(c).sort((r, f) => r - f);
    if (l.length === 1) {
      const r = o[0]?.value ?? 0, f = a[0]?.value ?? 0;
      e.p = { a: 0, k: [r, f] };
    } else {
      const r = [];
      for (let f = 0; f < l.length; f++) {
        const m = l[f], h = l[f + 1], p = V(o, m), d = V(a, m), u = {
          t: at(m, t),
          s: [p, d]
        };
        if (h !== void 0) {
          const g = V(o, h), y = V(a, h);
          u.e = [g, y];
          const b = o.find((v) => v.time === h)?.easing ?? "linear", w = Qt(b);
          u.i = w.i, u.o = w.o;
        }
        r.push(u);
      }
      e.p = { a: 1, k: r };
    }
  }
  return e;
}
function V(i, t) {
  if (i.length === 0) return 0;
  let e = i[0], n = i[i.length - 1];
  for (const o of i)
    if (o.time <= t && (e = o), o.time >= t) {
      n = o;
      break;
    }
  if (e.time === t) return e.value;
  if (n.time === t) return n.value;
  const s = (t - e.time) / (n.time - e.time);
  return typeof e.value == "number" && typeof n.value == "number" ? e.value + (n.value - e.value) * s : e.value;
}
function si(i, t, e) {
  const n = ei(e);
  return [
    {
      ty: "rc",
      // Rectangle
      d: 1,
      s: { a: 0, k: [i, t] },
      p: { a: 0, k: [0, 0] },
      r: { a: 0, k: 0 }
    },
    {
      ty: "fl",
      // Fill
      c: { a: 0, k: [...n, 1] },
      o: { a: 0, k: 100 },
      r: 1
    }
  ];
}
function ri(i, t = {}) {
  const {
    name: e = i.name || "Animation",
    frameRate: n = 60,
    width: s = 512,
    height: o = 512
  } = t, a = i.duration, c = at(a, n), l = ii(jt(i.tracks)), r = [];
  let f = 1;
  for (const [m, h] of l) {
    const p = ni(h, n), u = h.find((y) => y.property === "fill")?.keyframes[0]?.value, g = {
      ddd: 0,
      ind: f++,
      ty: 4,
      // Shape layer
      nm: m,
      sr: 1,
      ks: p,
      ao: 0,
      shapes: si(100, 100, u ?? "#4a9eff"),
      ip: 0,
      op: c,
      st: 0,
      bm: 0
    };
    r.push(g);
  }
  return {
    v: "5.7.4",
    nm: e,
    fr: n,
    ip: 0,
    op: c,
    w: s,
    h: o,
    ddd: 0,
    assets: [],
    layers: r
  };
}
function Tn(i, t = {}) {
  return JSON.stringify(ri(i, t));
}
const W = 5, I = 1 << W * 3, Q = 8 - W;
function Jt(i, t, e) {
  return i >> Q << W * 2 | t >> Q << W | e >> Q;
}
function oi(i, t) {
  const e = new Uint32Array(I), n = new Uint32Array(I), s = new Uint32Array(I), o = new Uint32Array(I);
  for (let f = 0; f < i.length; f += 4) {
    if (i[f + 3] < 128) continue;
    const m = i[f], h = i[f + 1], p = i[f + 2], d = Jt(m, h, p);
    e[d]++, n[d] += m, s[d] += h, o[d] += p;
  }
  const a = [];
  for (let f = 0; f < I; f++) {
    const m = e[f];
    m !== 0 && a.push({
      r: Math.round(n[f] / m),
      g: Math.round(s[f] / m),
      b: Math.round(o[f] / m),
      count: m
    });
  }
  if (a.length === 0)
    return { rgb: new Uint8Array(3), size: 1 };
  if (a.length <= t) {
    const f = new Uint8Array(a.length * 3);
    return a.forEach((m, h) => {
      f[h * 3] = m.r, f[h * 3 + 1] = m.g, f[h * 3 + 2] = m.b;
    }), { rgb: f, size: a.length };
  }
  const c = (f, m) => {
    let h = 0, p = 255, d = 0, u = 255, g = 0, y = 255, T = 0;
    for (let b = f; b <= m; b++) {
      const w = a[b];
      h += w.count, w.r < p && (p = w.r), w.r > d && (d = w.r), w.g < u && (u = w.g), w.g > g && (g = w.g), w.b < y && (y = w.b), w.b > T && (T = w.b);
    }
    return { from: f, to: m, count: h, rMin: p, rMax: d, gMin: u, gMax: g, bMin: y, bMax: T };
  }, l = [c(0, a.length - 1)];
  for (; l.length < t; ) {
    let f = -1, m = 0;
    for (let v = 0; v < l.length; v++) {
      const S = l[v];
      S.to <= S.from || S.count > m && (m = S.count, f = v);
    }
    if (f === -1) break;
    const h = l[f], p = h.rMax - h.rMin, d = h.gMax - h.gMin, u = h.bMax - h.bMin, g = p >= d && p >= u ? "r" : d >= u ? "g" : "b", y = a.slice(h.from, h.to + 1);
    y.sort((v, S) => v[g] - S[g]);
    for (let v = 0; v < y.length; v++) a[h.from + v] = y[v];
    const T = h.count / 2;
    let b = 0, w = h.from;
    for (let v = h.from; v < h.to && (b += a[v].count, w = v, !(b >= T)); v++)
      ;
    l[f] = c(h.from, w), l.push(c(w + 1, h.to));
  }
  const r = new Uint8Array(l.length * 3);
  return l.forEach((f, m) => {
    let h = 0, p = 0, d = 0, u = 0;
    for (let g = f.from; g <= f.to; g++) {
      const y = a[g];
      h += y.count, p += y.r * y.count, d += y.g * y.count, u += y.b * y.count;
    }
    h === 0 && (h = 1), r[m * 3] = Math.round(p / h), r[m * 3 + 1] = Math.round(d / h), r[m * 3 + 2] = Math.round(u / h);
  }), { rgb: r, size: l.length };
}
class ai {
  cache = new Int16Array(I).fill(-1);
  palette;
  /** Palette index `n` is written as `n + offset` (GIF reserves index 0). */
  offset;
  constructor(t, e = 0) {
    this.palette = t, this.offset = e;
  }
  /** Index of the closest palette entry to the given colour. */
  nearest(t, e, n) {
    const s = Jt(t, e, n), o = this.cache[s];
    if (o !== -1) return o;
    const { rgb: a, size: c } = this.palette;
    let l = 1 / 0, r = 0;
    for (let m = 0; m < c; m++) {
      const h = t - a[m * 3], p = e - a[m * 3 + 1], d = n - a[m * 3 + 2], u = h * h + p * p + d * d;
      if (u < l && (l = u, r = m, u === 0))
        break;
    }
    const f = r + this.offset;
    return this.cache[s] = f, f;
  }
  /** The colour actually stored at a palette index produced by `nearest`. */
  colorAt(t) {
    const e = (t - this.offset) * 3;
    return [this.palette.rgb[e], this.palette.rgb[e + 1], this.palette.rgb[e + 2]];
  }
}
function ci(i, t, e, n, s = {}) {
  const { dither: o = !0, transparentIndex: a = 0 } = s, c = new ai(n, a + 1), l = new Uint8Array(t * e);
  let r = !1;
  if (!o) {
    for (let h = 0; h < t * e; h++) {
      const p = h * 4;
      if (i[p + 3] < 128) {
        l[h] = a, r = !0;
        continue;
      }
      l[h] = c.nearest(i[p], i[p + 1], i[p + 2]);
    }
    return { indices: l, hasTransparency: r };
  }
  const f = new Float32Array(t * e * 3);
  for (let h = 0; h < t * e; h++)
    f[h * 3] = i[h * 4], f[h * 3 + 1] = i[h * 4 + 1], f[h * 3 + 2] = i[h * 4 + 2];
  const m = (h, p, d, u, g) => {
    f[h * 3] += p * g, f[h * 3 + 1] += d * g, f[h * 3 + 2] += u * g;
  };
  for (let h = 0; h < e; h++)
    for (let p = 0; p < t; p++) {
      const d = h * t + p;
      if (i[d * 4 + 3] < 128) {
        l[d] = a, r = !0;
        continue;
      }
      const u = Math.max(0, Math.min(255, f[d * 3])), g = Math.max(0, Math.min(255, f[d * 3 + 1])), y = Math.max(0, Math.min(255, f[d * 3 + 2])), T = c.nearest(u, g, y);
      l[d] = T;
      const [b, w, v] = c.colorAt(T), S = u - b, M = g - w, _ = y - v;
      p + 1 < t && m(d + 1, S, M, _, 7 / 16), h + 1 < e && (p > 0 && m(d + t - 1, S, M, _, 3 / 16), m(d + t, S, M, _, 5 / 16), p + 1 < t && m(d + t + 1, S, M, _, 1 / 16));
    }
  return { indices: l, hasTransparency: r };
}
class X {
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
    let e = this.buf.length * 2;
    for (; e < this.len + t; ) e *= 2;
    const n = new Uint8Array(e);
    n.set(this.buf.subarray(0, this.len)), this.buf = n;
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
    for (let e = 0; e < t.length; e++) this.buf[this.len++] = t.charCodeAt(e) & 255;
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
  patchUint32BE(t, e) {
    this.buf[t] = e >>> 24 & 255, this.buf[t + 1] = e >>> 16 & 255, this.buf[t + 2] = e >>> 8 & 255, this.buf[t + 3] = e & 255;
  }
  /** Overwrite a previously written 32-bit little-endian value. */
  patchUint32LE(t, e) {
    this.buf[t] = e & 255, this.buf[t + 1] = e >>> 8 & 255, this.buf[t + 2] = e >>> 16 & 255, this.buf[t + 3] = e >>> 24 & 255;
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
function li(i, t) {
  const e = 1 << t, n = e + 1, s = new X(), o = new Uint8Array(255);
  let a = 0, c = 0, l = 0;
  const r = () => {
    a !== 0 && (s.byte(a), s.bytes(o.subarray(0, a)), a = 0);
  }, f = (u, g) => {
    for (c |= u << l, l += g; l >= 8; )
      o[a++] = c & 255, c >>= 8, l -= 8, a === 255 && r();
  };
  let m = /* @__PURE__ */ new Map();
  const h = () => {
    m = /* @__PURE__ */ new Map();
  };
  let p = t + 1, d = n + 1;
  if (f(e, p), i.length > 0) {
    let u = i[0];
    for (let g = 1; g < i.length; g++) {
      const y = i[g], T = u << 8 | y, b = m.get(T);
      if (b !== void 0) {
        u = b;
        continue;
      }
      f(u, p), d < 4096 ? (m.set(T, d++), d >= 1 << p && p < 12 && p++) : (f(e, p), h(), p = t + 1, d = n + 1), u = y;
    }
    f(u, p);
  }
  return f(n, p), l > 0 && (o[a++] = c & 255), r(), s.byte(0), s.toUint8Array();
}
class te {
  width;
  height;
  loops;
  dither;
  maxColors;
  /** Fully-encoded blocks (GCE + descriptor + palette + data) per frame. */
  frames = [];
  constructor(t, e, n = 0) {
    this.width = t, this.height = e;
    const s = typeof n == "number" ? { loops: n } : n;
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
  addFrame(t, e) {
    const { data: n } = t, s = t.width || this.width, o = t.height || this.height, a = oi(n, this.maxColors), { indices: c, hasTransparency: l } = ci(n, s, o, a, {
      dither: this.dither,
      transparentIndex: 0
    }), r = new X(), f = l ? 2 : 1;
    r.bytes([33, 249, 4]), r.byte(f << 2 | (l ? 1 : 0)), r.uint16LE(Math.max(0, Math.round(e))), r.byte(0), r.byte(0), r.byte(44), r.uint16LE(0), r.uint16LE(0), r.uint16LE(s), r.uint16LE(o), r.byte(135);
    const m = new Uint8Array(256 * 3);
    m.set(a.rgb.subarray(0, Math.min(a.size, 255) * 3), 3), r.bytes(m), r.byte(8), r.bytes(li(c, 8)), this.frames.push(r.toUint8Array());
  }
  /** Assemble the full GIF byte stream. */
  encodeToBytes() {
    const t = new X();
    t.bytes([71, 73, 70, 56, 57, 97]), t.uint16LE(this.width), t.uint16LE(this.height), t.byte(112), t.byte(0), t.byte(0), t.bytes([33, 255, 11]), t.bytes([78, 69, 84, 83, 67, 65, 80, 69]), t.bytes([50, 46, 48]), t.bytes([3, 1]), t.uint16LE(this.loops), t.byte(0);
    for (const e of this.frames) t.bytes(e);
    return t.byte(59), t.toUint8Array();
  }
  /** Encode and return the GIF as a Blob. */
  encode() {
    const t = this.encodeToBytes();
    return new Blob([t.slice()], { type: "image/gif" });
  }
}
const vn = te;
function Sn(i, t) {
  const { width: e, height: n, frameRate: s = 30, backgroundColor: o, renderFrame: a } = t, c = document.createElement("canvas");
  c.width = e, c.height = n;
  const l = c.getContext("2d");
  if (!l)
    throw new Error("Failed to get canvas 2D context");
  const r = i.duration, f = 1e3 / s, m = Math.ceil(r / f), h = [];
  for (let p = 0; p <= m; p++) {
    const d = Math.min(p * f, r);
    l.clearRect(0, 0, e, n), o && (l.fillStyle = o, l.fillRect(0, 0, e, n));
    const u = i.getStateAtTime(d);
    a?.(l, u.values, d), h.push({
      time: d,
      imageData: l.getImageData(0, 0, e, n),
      delay: Math.round(f / 10)
    });
  }
  return { frames: h, duration: r, frameCount: h.length };
}
async function Mn(i, t) {
  const {
    width: e,
    height: n,
    frameRate: s = 30,
    loops: o = 0,
    backgroundColor: a,
    renderFrame: c,
    dither: l,
    maxColors: r,
    onProgress: f,
    signal: m
  } = t;
  if (typeof document > "u")
    throw new Error("GIF export requires a DOM environment");
  if (!c)
    throw new Error("renderFrame function is required for GIF export");
  const h = document.createElement("canvas");
  h.width = e, h.height = n;
  const p = h.getContext("2d", { willReadFrequently: !0 });
  if (!p)
    throw new Error("Failed to get canvas 2D context");
  const d = new te(e, n, { loops: o, dither: l, maxColors: r }), u = i.duration, g = 1e3 / s, y = Math.max(1, Math.round(u / g)), T = Math.max(2, Math.round(g / 10));
  for (let b = 0; b < y; b++) {
    if (m?.aborted) throw new Error("Export aborted");
    const w = Math.min(b * g, u);
    p.clearRect(0, 0, e, n), a && (p.fillStyle = a, p.fillRect(0, 0, e, n));
    const v = i.getStateAtTime(w);
    await c(p, v.values, w), d.addFrame(p.getImageData(0, 0, e, n), T), f?.((b + 1) / y);
  }
  return d.encode();
}
function En(i, t = "animation.gif") {
  const e = URL.createObjectURL(i), n = document.createElement("a");
  n.href = e, n.download = t, document.body.appendChild(n), n.click(), document.body.removeChild(n), URL.revokeObjectURL(e);
}
const st = (i) => i + i % 2, ee = 16, hi = 2;
function J(i, t) {
  return String.fromCharCode(i[t], i[t + 1], i[t + 2], i[t + 3]);
}
function vt(i, t) {
  return (i[t] | i[t + 1] << 8 | i[t + 2] << 16 | i[t + 3] << 24) >>> 0;
}
function ui(i) {
  if (i.length < 12 || J(i, 0) !== "RIFF" || J(i, 8) !== "WEBP")
    throw new Error("Not a WebP file — the browser may not support canvas WebP encoding");
  let t = null, e = null, n = 0, s = 0, o = !1, a = 12;
  for (; a + 8 <= i.length; ) {
    const c = J(i, a), l = vt(i, a + 4), r = i.subarray(a + 8, a + 8 + l), f = i.subarray(a, a + 8 + l);
    if (c === "VP8X")
      o = (r[0] & ee) !== 0, n = (r[4] | r[5] << 8 | r[6] << 16) + 1, s = (r[7] | r[8] << 8 | r[9] << 16) + 1;
    else if (c === "ALPH")
      e = f, o = !0;
    else if (c === "VP8 ")
      t = f, !n && r.length >= 10 && (n = (r[6] | r[7] << 8) & 16383 || n, s = (r[8] | r[9] << 8) & 16383 || s);
    else if (c === "VP8L" && (t = f, !n && r.length >= 5)) {
      const m = vt(r, 1);
      n = (m & 16383) + 1, s = (m >> 14 & 16383) + 1, o = o || (m >> 28 & 1) === 1;
    }
    a += 8 + st(l);
  }
  if (!t) throw new Error("WebP file contained no VP8 or VP8L image data");
  return { image: t, alpha: e, width: n, height: s, hasAlpha: o };
}
class fi {
  loops;
  background;
  frames = [];
  hasAlpha = !1;
  width;
  height;
  constructor(t, e, n = {}) {
    this.width = t, this.height = e, this.loops = n.loops ?? 0, this.background = n.background ?? [0, 0, 0, 0];
  }
  get frameCount() {
    return this.frames.length;
  }
  /**
   * Add one frame from the bytes of a still WebP image.
   *
   * @param durationMs How long the frame is shown, in milliseconds.
   */
  addFrame(t, e) {
    const n = ui(t);
    n.hasAlpha && (this.hasAlpha = !0), this.frames.push({ bitstream: n, durationMs: e });
  }
  /** Assemble the animated WebP byte stream. */
  encodeToBytes() {
    if (this.frames.length === 0)
      throw new Error("Cannot encode an animated WebP with no frames");
    const t = new X();
    t.ascii("RIFF");
    const e = t.length;
    t.uint32LE(0), t.ascii("WEBP"), t.ascii("VP8X"), t.uint32LE(10), t.byte(hi | (this.hasAlpha ? ee : 0)), t.uint24LE(0), t.uint24LE(this.width - 1), t.uint24LE(this.height - 1);
    const [n, s, o, a] = this.background;
    t.ascii("ANIM"), t.uint32LE(6), t.bytes([o, s, n, a]), t.uint16LE(this.loops);
    for (const { bitstream: c, durationMs: l } of this.frames) {
      const r = 16 + st(c.alpha ? c.alpha.length : 0) + st(c.image.length);
      t.ascii("ANMF"), t.uint32LE(r), t.uint24LE(0), t.uint24LE(0), t.uint24LE(this.width - 1), t.uint24LE(this.height - 1), t.uint24LE(Math.max(0, Math.round(l))), t.byte(3), c.alpha && (t.bytes(c.alpha), c.alpha.length % 2 && t.byte(0)), t.bytes(c.image), c.image.length % 2 && t.byte(0);
    }
    return t.patchUint32LE(e, t.length - e - 4), t.toUint8Array();
  }
  /** Encode and return the animated WebP as a Blob. */
  encode() {
    return new Blob([this.encodeToBytes().slice()], { type: "image/webp" });
  }
}
function di() {
  if (typeof document > "u") return !1;
  try {
    const i = document.createElement("canvas");
    return i.width = 1, i.height = 1, i.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return !1;
  }
}
function pi(i, t) {
  return new Promise((e, n) => {
    i.toBlob(
      (s) => {
        if (!s) return n(new Error("Canvas WebP encoding failed"));
        if (s.type !== "image/webp")
          return n(new Error("This browser cannot encode WebP from a canvas"));
        s.arrayBuffer().then((o) => e(new Uint8Array(o))).catch(n);
      },
      "image/webp",
      t
    );
  });
}
async function kn(i, t) {
  const {
    width: e,
    height: n,
    frameRate: s = 30,
    loops: o = 0,
    quality: a = 0.8,
    backgroundColor: c,
    renderFrame: l,
    onProgress: r,
    signal: f
  } = t;
  if (typeof document > "u")
    throw new Error("WebP export requires a DOM environment");
  if (!di())
    throw new Error("This browser cannot encode WebP from a canvas. Try Chrome, Edge, or Firefox.");
  const m = document.createElement("canvas");
  m.width = e, m.height = n;
  const h = m.getContext("2d");
  if (!h) throw new Error("Failed to get canvas 2D context");
  const p = new fi(e, n, { loops: o }), d = i.duration, u = 1e3 / s, g = Math.max(1, Math.round(d / u));
  for (let y = 0; y < g; y++) {
    if (f?.aborted) throw new Error("Export aborted");
    const T = Math.min(y * u, d);
    h.clearRect(0, 0, e, n), c && (h.fillStyle = c, h.fillRect(0, 0, e, n));
    const b = i.getStateAtTime(T);
    await l(h, b.values, T), p.addFrame(await pi(m, a), Math.round(u)), r?.((y + 1) / g);
  }
  return p.encode();
}
function An(i, t = "animation.webp") {
  const e = URL.createObjectURL(i), n = document.createElement("a");
  n.href = e, n.download = t, document.body.appendChild(n), n.click(), n.remove(), setTimeout(() => URL.revokeObjectURL(e), 1e3);
}
const tt = (i) => Math.round(i * 65536), St = [65536, 0, 0, 0, 65536, 0, 0, 0, 1073741824];
function A(i, t, e) {
  const n = i.length;
  i.uint32BE(0), i.ascii(t), e(), i.patchUint32BE(n, i.length - n);
}
function E(i, t, e, n, s) {
  A(i, t, () => {
    i.byte(e), i.uint24BE(n), s();
  });
}
function mi(i, t) {
  const { width: e, height: n, timescale: s, avcC: o } = t;
  if (i.length === 0)
    throw new Error("Cannot mux an MP4 with no samples");
  const a = i.reduce((p, d) => p + d.duration, 0), c = 1e3, l = Math.round(a / s * c), r = new X(64 * 1024);
  A(r, "ftyp", () => {
    r.ascii("isom"), r.uint32BE(512), r.ascii("isom"), r.ascii("iso2"), r.ascii("avc1"), r.ascii("mp41");
  });
  const f = r.length;
  r.uint32BE(0), r.ascii("mdat");
  const m = r.length;
  for (const p of i) r.bytes(p.data);
  const h = r.length - f;
  if (h > 4294967295)
    throw new Error("Exported video exceeds the 4GB limit of a 32-bit mdat box");
  return r.patchUint32BE(f, h), A(r, "moov", () => {
    E(r, "mvhd", 0, 0, () => {
      r.uint32BE(0), r.uint32BE(0), r.uint32BE(c), r.uint32BE(l), r.uint32BE(tt(1)), r.uint16BE(256), r.uint16BE(0), r.uint32BE(0), r.uint32BE(0);
      for (const p of St) r.uint32BE(p);
      for (let p = 0; p < 6; p++) r.uint32BE(0);
      r.uint32BE(2);
    }), A(r, "trak", () => {
      E(r, "tkhd", 0, 3, () => {
        r.uint32BE(0), r.uint32BE(0), r.uint32BE(1), r.uint32BE(0), r.uint32BE(l), r.uint32BE(0), r.uint32BE(0), r.uint16BE(0), r.uint16BE(0), r.uint16BE(0), r.uint16BE(0);
        for (const p of St) r.uint32BE(p);
        r.uint32BE(tt(e)), r.uint32BE(tt(n));
      }), A(r, "mdia", () => {
        E(r, "mdhd", 0, 0, () => {
          r.uint32BE(0), r.uint32BE(0), r.uint32BE(s), r.uint32BE(a), r.uint16BE(21956), r.uint16BE(0);
        }), E(r, "hdlr", 0, 0, () => {
          r.uint32BE(0), r.ascii("vide"), r.uint32BE(0), r.uint32BE(0), r.uint32BE(0), r.ascii("VideoHandler"), r.byte(0);
        }), A(r, "minf", () => {
          E(r, "vmhd", 0, 1, () => {
            r.uint16BE(0), r.uint16BE(0), r.uint16BE(0), r.uint16BE(0);
          }), A(r, "dinf", () => {
            E(r, "dref", 0, 0, () => {
              r.uint32BE(1), E(r, "url ", 0, 1, () => {
              });
            });
          }), A(r, "stbl", () => {
            E(r, "stsd", 0, 0, () => {
              r.uint32BE(1), A(r, "avc1", () => {
                r.uint32BE(0), r.uint16BE(0), r.uint16BE(1), r.uint16BE(0), r.uint16BE(0), r.uint32BE(0), r.uint32BE(0), r.uint32BE(0), r.uint16BE(e), r.uint16BE(n), r.uint32BE(4718592), r.uint32BE(4718592), r.uint32BE(0), r.uint16BE(1), r.byte(0);
                for (let u = 0; u < 31; u++) r.byte(0);
                r.uint16BE(24), r.uint16BE(65535), A(r, "avcC", () => {
                  r.bytes(o);
                });
              });
            });
            const p = [];
            for (const u of i) {
              const g = p[p.length - 1];
              g && g.delta === u.duration ? g.count++ : p.push({ count: 1, delta: u.duration });
            }
            E(r, "stts", 0, 0, () => {
              r.uint32BE(p.length);
              for (const u of p)
                r.uint32BE(u.count), r.uint32BE(u.delta);
            });
            const d = [];
            i.forEach((u, g) => {
              u.isKeyFrame && d.push(g + 1);
            }), d.length !== i.length && E(r, "stss", 0, 0, () => {
              r.uint32BE(d.length);
              for (const u of d) r.uint32BE(u);
            }), E(r, "stsc", 0, 0, () => {
              r.uint32BE(1), r.uint32BE(1), r.uint32BE(i.length), r.uint32BE(1);
            }), E(r, "stsz", 0, 0, () => {
              r.uint32BE(0), r.uint32BE(i.length);
              for (const u of i) r.uint32BE(u.data.length);
            }), E(r, "stco", 0, 0, () => {
              r.uint32BE(1), r.uint32BE(m);
            });
          });
        });
      });
    });
  }), r.toBytes();
}
const gi = [
  "avc1.42001f",
  // Baseline 3.1
  "avc1.4d0028",
  // Main 4.0
  "avc1.640028",
  // High 4.0
  "avc1.42E01E"
  // Constrained Baseline 3.0
];
function Y() {
  return typeof VideoEncoder < "u" && typeof VideoFrame < "u";
}
async function yi(i, t, e, n) {
  if (!Y()) return null;
  for (const s of gi)
    try {
      if ((await VideoEncoder.isConfigSupported({
        codec: s,
        width: i,
        height: t,
        framerate: e,
        bitrate: n,
        avc: { format: "avc" }
      })).supported) return s;
    } catch {
    }
  return null;
}
async function bi(i) {
  const { durationMs: t, renderFrame: e, onProgress: n, signal: s } = i, o = i.fps ?? 30;
  if (typeof document > "u")
    throw new Error("MP4 export requires a DOM environment");
  if (!Y())
    throw new Error("This browser has no WebCodecs VideoEncoder");
  const a = Math.max(2, Math.round(i.width / 2) * 2), c = Math.max(2, Math.round(i.height / 2) * 2), l = i.bitrate ?? Math.round(a * c * o * (i.bitsPerPixel ?? 0.25)), r = await yi(a, c, o, l);
  if (!r)
    throw new Error("This browser cannot encode H.264 at the requested size");
  const f = document.createElement("canvas");
  f.width = a, f.height = c;
  const m = f.getContext("2d");
  if (!m) throw new Error("Failed to get canvas 2D context");
  const h = [];
  let p = null, d = null;
  const u = o * 1e3, g = 1e3, y = new VideoEncoder({
    output: (M, _) => {
      const x = _?.decoderConfig?.description;
      x && !p && (p = ArrayBuffer.isView(x) ? new Uint8Array(x.buffer, x.byteOffset, x.byteLength).slice() : new Uint8Array(x).slice());
      const O = new Uint8Array(M.byteLength);
      M.copyTo(O), h.push({
        data: O,
        duration: g,
        isKeyFrame: M.type === "key"
      });
    },
    error: (M) => {
      d = M instanceof Error ? M : new Error(String(M));
    }
  });
  y.configure({
    codec: r,
    width: a,
    height: c,
    framerate: o,
    bitrate: l,
    // 'avc' gives length-prefixed samples that match the avcC record; the
    // alternative, Annex-B, is not what an MP4 sample table expects.
    avc: { format: "avc" },
    // We are not streaming, so let the encoder spend time on quality.
    latencyMode: "quality"
  });
  const T = 1e6 / o, b = Math.max(1, Math.round(t / (1e3 / o))), w = i.keyFrameInterval ?? Math.max(1, Math.round(o * 2)), v = i.background === void 0 ? "#ffffff" : i.background;
  try {
    for (let M = 0; M < b; M++) {
      if (s?.aborted) throw new Error("Export aborted");
      if (d) throw d;
      const _ = Math.min(t, M * (1e3 / o));
      m.clearRect(0, 0, a, c), v && (m.fillStyle = v, m.fillRect(0, 0, a, c)), await e(m, _);
      const x = new VideoFrame(f, {
        timestamp: Math.round(M * T),
        duration: Math.round(T)
      });
      for (y.encode(x, { keyFrame: M % w === 0 }), x.close(); y.encodeQueueSize > 8; )
        if (await new Promise((O) => setTimeout(O, 0)), d) throw d;
      n?.((M + 1) / b);
    }
    if (await y.flush(), d) throw d;
  } finally {
    y.state !== "closed" && y.close();
  }
  if (!p)
    throw new Error("Encoder produced no H.264 decoder configuration");
  const S = mi(h, { width: a, height: c, timescale: u, avcC: p });
  return new Blob([S], { type: "video/mp4" });
}
const wi = [
  { mimeType: "video/mp4;codecs=avc1.42E01E", extension: "mp4", label: "MP4 (H.264)" },
  { mimeType: "video/mp4", extension: "mp4", label: "MP4" },
  { mimeType: "video/webm;codecs=vp9", extension: "webm", label: "WebM (VP9)" },
  { mimeType: "video/webm;codecs=vp8", extension: "webm", label: "WebM (VP8)" },
  { mimeType: "video/webm", extension: "webm", label: "WebM" }
];
function ct() {
  return typeof MediaRecorder > "u" || typeof MediaRecorder.isTypeSupported != "function" ? [] : wi.filter((i) => MediaRecorder.isTypeSupported(i.mimeType));
}
function xn() {
  return typeof document > "u" ? !1 : Y() || ct().length > 0;
}
const ie = "mp4-webcodecs";
function Ti() {
  const i = [];
  Y() && i.push({
    id: ie,
    label: "MP4 (H.264)",
    extension: "mp4",
    deterministic: !0
  });
  for (const t of ct())
    t.extension === "mp4" && Y() || i.push({
      id: t.mimeType,
      label: `${t.label} (real-time)`,
      extension: t.extension,
      deterministic: !1
    });
  return i;
}
async function vi(i) {
  const { width: t, height: e, durationMs: n, renderFrame: s } = i, o = i.fps ?? 30;
  if (typeof document > "u")
    throw new Error("Video export requires a DOM environment");
  const a = ct(), c = i.mimeType ?? a[0]?.mimeType;
  if (!c)
    throw new Error("This browser cannot record video (MediaRecorder unavailable)");
  const l = document.createElement("canvas");
  l.width = t, l.height = e;
  const r = l.getContext("2d");
  if (!r) throw new Error("Failed to get canvas 2D context");
  const f = l.captureStream(0), m = f.getVideoTracks()[0], h = i.bitrate ?? Math.round(t * e * o * 0.25), p = new MediaRecorder(f, { mimeType: c, videoBitsPerSecond: h }), d = [];
  p.ondataavailable = (b) => {
    b.data && b.data.size > 0 && d.push(b.data);
  };
  const u = new Promise((b, w) => {
    p.onstop = () => b(), p.onerror = () => w(new Error("Recording failed"));
  });
  p.start();
  const g = 1e3 / o, y = Math.max(1, Math.round(n / g)), T = i.background === void 0 ? "#ffffff" : i.background;
  try {
    for (let b = 0; b <= y; b++) {
      if (i.signal?.aborted) throw new Error("Export aborted");
      const w = Math.min(n, b * g);
      r.clearRect(0, 0, t, e), T && (r.fillStyle = T, r.fillRect(0, 0, t, e)), await s(r, w), m?.requestFrame?.(), i.onProgress?.(b / y), await new Promise((v) => setTimeout(v, g));
    }
  } finally {
    p.state !== "inactive" && p.stop(), f.getTracks().forEach((b) => b.stop());
  }
  return await u, new Blob(d, { type: c });
}
async function Pn(i) {
  const t = Ti();
  if (t.length === 0)
    throw new Error("This browser cannot export video");
  const e = t.find((s) => s.id === i.format) ?? t[0];
  return e.id === ie ? { blob: await bi({
    width: i.width,
    height: i.height,
    fps: i.fps,
    durationMs: i.durationMs,
    background: i.background,
    bitrate: i.bitrate,
    renderFrame: i.renderFrame,
    onProgress: i.onProgress,
    signal: i.signal
  }), extension: e.extension } : { blob: await vi({ ...i, mimeType: e.id }), extension: e.extension };
}
function _n(i, t = "animation.webm") {
  const e = URL.createObjectURL(i), n = document.createElement("a");
  n.href = e, n.download = t, document.body.appendChild(n), n.click(), n.remove(), setTimeout(() => URL.revokeObjectURL(e), 1e3);
}
function Bn(i, t, e, n = 8) {
  const s = Math.max(1, Math.floor(i)), o = Math.max(1, Math.min(Math.floor(n) || 1, s)), a = Math.ceil(s / o);
  return {
    frames: s,
    columns: o,
    rows: a,
    frameWidth: t,
    frameHeight: e,
    sheetWidth: o * t,
    sheetHeight: a * e
  };
}
function Cn(i, t) {
  const e = i % t.columns, n = Math.floor(i / t.columns);
  return { index: i, col: e, row: n, x: e * t.frameWidth, y: n * t.frameHeight };
}
function In(i, t) {
  const e = Math.max(1, Math.floor(i)), n = [];
  for (let s = 0; s < e; s++) n.push(s / e * t);
  return n;
}
function Ln(i, t, e) {
  return {
    frameWidth: i.frameWidth,
    frameHeight: i.frameHeight,
    columns: i.columns,
    rows: i.rows,
    frames: i.frames,
    fps: t,
    durationMs: e
  };
}
function Fn(i) {
  let t = 2166136261;
  for (let e = 0; e < i.length; e++)
    t ^= i.charCodeAt(e), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function Si(i) {
  let t = i >>> 0 || 2654435769;
  return {
    seed: i >>> 0,
    next() {
      return t ^= t << 13, t >>>= 0, t ^= t >> 17, t ^= t << 5, t >>>= 0, t / 4294967296;
    }
  };
}
function ne(i, t, e) {
  return t + i.next() * (e - t);
}
function Mi(i, t, e, n) {
  if (n <= 0) return ne(i, t, e);
  const s = Math.floor((e - t) / n), o = Math.round(i.next() * s);
  return t + o * n;
}
function Rn(i, t) {
  if (t.length !== 0)
    return t[Math.floor(i.next() * t.length)];
}
const se = /^([+\-*/])=\s*(-?[\d.]+)$/, re = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function $n(i) {
  return typeof i != "string" ? !1 : se.test(i.trim()) || re.test(i.trim());
}
function oe(i, t = {}) {
  if (typeof i != "string") return i;
  const e = i.trim(), n = se.exec(e);
  if (n) {
    const [, o, a] = n, c = t.base ?? 0, l = Number.parseFloat(a);
    switch (o) {
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
  const s = re.exec(e);
  if (s) {
    if (!t.random)
      throw new Error(
        `resolveValue: "${e}" needs a random source — pass one via context.random`
      );
    const o = Number.parseFloat(s[1]), a = Number.parseFloat(s[2]), c = s[3] !== void 0 ? Number.parseFloat(s[3]) : void 0;
    return c !== void 0 ? Mi(t.random, o, a, c) : ne(t.random, o, a);
  }
  return i;
}
function Ei(i, t = 0, e) {
  const n = [];
  let s = t;
  for (const o of i) {
    const a = oe(o, { base: s, random: e });
    n.push(a), typeof a == "number" && (s = a);
  }
  return n;
}
class Dn {
  random;
  constructor(t) {
    this.random = Si(t);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(t, e = 0) {
    return oe(t, { base: e, random: this.random });
  }
  resolveSequence(t, e = 0) {
    return Ei(t, e, this.random);
  }
}
const Mt = {
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
}, Et = {
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
function ki(i) {
  let t = i.trim().toLowerCase();
  return t = t.replace(/\.ease(in|out|inout)$/, ".$1"), !t.includes(".") && !t.startsWith("steps") && t !== "none" && t !== "linear" && (t = `${t}.out`), t;
}
function lt(i = 1, t = 0.3) {
  return (e) => {
    if (e === 0 || e === 1) return e;
    const n = t / (2 * Math.PI) * Math.asin(1 / Math.max(1, i));
    return i * Math.pow(2, -10 * e) * Math.sin((e - n) * (2 * Math.PI) / t) + 1;
  };
}
function ae(i = 1, t = 0.3) {
  const e = lt(i, t);
  return (n) => 1 - e(1 - n);
}
function Ai(i = 1, t = 0.3) {
  const e = ae(i, t), n = lt(i, t);
  return (s) => s < 0.5 ? e(s * 2) / 2 : n(s * 2 - 1) / 2 + 0.5;
}
const ht = (i) => {
  if (i < 1 / 2.75) return 7.5625 * i * i;
  if (i < 2 / 2.75) {
    const s = i - 0.5454545454545454;
    return 7.5625 * s * s + 0.75;
  }
  if (i < 2.5 / 2.75) {
    const s = i - 0.8181818181818182;
    return 7.5625 * s * s + 0.9375;
  }
  const n = i - 2.625 / 2.75;
  return 7.5625 * n * n + 0.984375;
}, ce = (i) => 1 - ht(1 - i), xi = (i) => i < 0.5 ? ce(i * 2) / 2 : ht(i * 2 - 1) / 2 + 0.5;
function Pi(i) {
  const t = Math.max(1, Math.floor(i));
  return (e) => Math.min(1, Math.floor(e * t) / (t - 1 || 1));
}
function kt(i) {
  const t = ki(i), e = /^steps\(\s*(\d+)\s*\)$/.exec(t);
  if (e)
    return { fn: Pi(Number.parseInt(e[1], 10)), requiresBaking: "steps" };
  if (t.startsWith("elastic")) {
    const n = t.split(".")[1] ?? "out";
    return { fn: n === "in" ? ae() : n === "inout" ? Ai() : lt(), requiresBaking: "elastic" };
  }
  if (t.startsWith("bounce")) {
    const n = t.split(".")[1] ?? "out";
    return { fn: n === "in" ? ce : n === "inout" ? xi : ht, requiresBaking: "bounce" };
  }
  return t in Et ? { easing: Et[t] } : t in Mt ? { easing: { type: "cubic-bezier", points: Mt[t] } } : { easing: "ease-out" };
}
const _i = /^([+-])=\s*(-?[\d.]+)$/, Bi = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function et(i, t) {
  const e = t.scale ?? 1, n = (r) => Number.parseFloat(r) * e;
  if (i === void 0) return t.cursor;
  if (typeof i == "number") return i * e;
  const s = i.trim();
  if (s === "") return t.cursor;
  const o = _i.exec(s);
  if (o) {
    const r = n(o[2]);
    return t.cursor + (o[1] === "-" ? -r : r);
  }
  const a = Bi.exec(s);
  if (a) {
    const r = a[1] === "<" ? t.previousStart : t.previousEnd;
    if (a[3] === void 0) return r;
    const f = n(a[3]);
    return r + (a[2] === "-" ? -f : f);
  }
  const c = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(s);
  if (c) {
    const r = t.labels.get(c[1].trim());
    if (r !== void 0) {
      const f = n(c[3]);
      return r + (c[2] === "-" ? -f : f);
    }
  }
  const l = t.labels.get(s);
  return l !== void 0 ? l : /^-?[\d.]+$/.test(s) ? n(s) : t.cursor;
}
const Ci = /* @__PURE__ */ new Set([
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
function N(i) {
  const t = {}, e = {};
  for (const [n, s] of Object.entries(i))
    Ci.has(n) ? t[n] = s : e[n] = s;
  return { config: t, properties: e };
}
function At(i, t) {
  return i === void 0 ? t : i * 1e3;
}
function Ii(i) {
  if (i !== void 0)
    return typeof i == "number" ? { each: i * 1e3 } : {
      ...i.each !== void 0 && { each: i.each * 1e3 },
      ...i.amount !== void 0 && { amount: i.amount * 1e3 },
      ...i.from !== void 0 && { from: i.from }
    };
}
const Li = {
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
function Fi(i) {
  return Li[i];
}
class L {
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
    this.options = t, this.timeline = new Zt({
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
  to(t, e, n) {
    return this.build(t, void 0, e, n);
  }
  /** Animate from the given values to where the property already is. */
  from(t, e, n) {
    const { config: s, properties: o } = N(e), a = { ...s };
    for (const c of Object.keys(o))
      a[c] = this.resolveStart(this.targetsOf(t)[0], c);
    return this.build(t, o, a, n);
  }
  /** Animate between two explicit sets of values. */
  fromTo(t, e, n, s) {
    const { properties: o } = N(e);
    return this.build(t, o, n, s);
  }
  /** Set values instantly — a single held keyframe. */
  set(t, e, n) {
    return this.build(t, void 0, { ...e, duration: 0 }, n);
  }
  // --- sequencing ---------------------------------------------------------
  /** Name a point in time, for use as a position parameter. */
  addLabel(t, e) {
    return this.labels.set(t, et(e, this.context())), this;
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
  add(t, e) {
    const n = et(e, this.context());
    for (const o of t.timeline.tracks) {
      if (!("keyframes" in o)) continue;
      const a = nt({
        ...o,
        id: this.nextTrackId(`nested-${o.id}`),
        keyframes: o.keyframes.map((c) => ({ ...c, time: c.time + n }))
      });
      this.timeline.addTrack(a);
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
  build(t, e, n, s) {
    const { config: o, properties: a } = N(n), c = this.targetsOf(t), l = et(s, this.context()), r = At(o.delay, 0), f = At(o.duration, 500), m = Ii(o.stagger), h = this.easingFor(o.ease), p = [];
    for (const [g, y] of Object.entries(a)) {
      const T = y, b = e?.[g] !== void 0 ? e[g] : this.resolveStart(c[0], g), w = this.keyframesFor(b, T, f, h, o.ease), v = this.nextTrackId(`${c[0]}-${g}`);
      if (this.timeline.addTrack(
        nt({
          id: v,
          target: c[0],
          ...c.length > 1 && { targets: c },
          ...m && c.length > 1 && { stagger: m },
          property: g,
          delay: l + r,
          keyframes: w
        })
      ), p.push(v), typeof T == "number")
        for (const S of c) this.lastValues.set(`${S}|${g}`, T);
    }
    const d = f + (m && c.length > 1 ? ot(c.length, m) : 0), u = l + r + d;
    return this.previousStart = l + r, this.previousEnd = u, this.cursor = Math.max(this.cursor, u), {
      trackIds: p,
      start: l + r,
      end: u,
      kill: () => {
        for (const g of p) this.timeline.removeTrack(g);
      }
    };
  }
  /**
   * Two keyframes, or a baked sequence when the ease has no closed form.
   */
  keyframesFor(t, e, n, s, o) {
    const a = { time: 0, value: t };
    if (n <= 0)
      return [{ time: 0, value: e }];
    const c = typeof o == "string" ? kt(o) : void 0;
    return c?.requiresBaking && this.options.bakeEases && c.fn ? [
      a,
      ...$e(a, { time: n, value: e }, c.fn, {
        intervalMs: this.options.bakeIntervalMs
      })
    ] : (c?.requiresBaking && !this.options.bakeEases && this.warn(
      `ease "${o}" cannot be represented as a cubic-bezier; falling back to a smooth curve. Pass { bakeEases: true } to sample it into keyframes.`
    ), [a, { time: n, value: e, ...s && { easing: s } }]);
  }
  /** Resolve a start value through the documented chain. */
  resolveStart(t, e) {
    const n = this.lastValues.get(`${t}|${e}`);
    if (n !== void 0) return n;
    const s = this.options.startValue?.(t, e);
    if (s !== void 0) return s;
    const o = this.options.defaults?.[e];
    if (o !== void 0) return o;
    const a = Fi(e);
    return a !== void 0 ? (this.warn(
      `no start value for "${e}" on "${t}" — using the static default ${a}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), a) : (this.warn(`no start value or default for "${e}" on "${t}" — using 0`), 0);
  }
  easingFor(t) {
    if (t !== void 0) {
      if (typeof t == "string") return kt(t).easing;
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
function Ri(i) {
  return new L(i);
}
const $i = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), Di = "#ffffff", Xi = "rgba(0, 0, 0, 0.5)";
function Yi(i) {
  const t = [];
  if (i.blur !== void 0 && t.push(`blur(${Math.max(0, i.blur)}px)`), i.brightness !== void 0 && t.push(`brightness(${Math.max(0, i.brightness)})`), i.glow !== void 0 && t.push(`drop-shadow(0 0 ${Math.max(0, i.glow)}px ${i.glowColor ?? Di})`), i.shadowX !== void 0 || i.shadowY !== void 0 || i.shadowBlur !== void 0) {
    const e = i.shadowX ?? 0, n = i.shadowY ?? 0, s = Math.max(0, i.shadowBlur ?? 0);
    t.push(`drop-shadow(${e}px ${n}px ${s}px ${i.shadowColor ?? Xi})`);
  }
  return t.length > 0 ? t.join(" ") : null;
}
const xt = /* @__PURE__ */ new Set([
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
]), qi = /* @__PURE__ */ new Set([
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
]), Oi = /* @__PURE__ */ new Set(["originX", "originY"]), Ui = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), Vi = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
};
class B {
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
    for (const [e, n] of t.values) {
      const s = this.targets.get(e);
      s && this.applyProperties(s, n);
    }
  }
  /**
   * Apply properties to a single element.
   */
  applyProperties(t, e) {
    const n = [];
    let s = null, o = null, a = null;
    const c = e.has("motionPathX"), l = e.has("motionPathY"), r = e.has("motionPathRotate");
    for (const [h, p] of e)
      if (!(h === "x" && c) && !(h === "y" && l) && !((h === "rotate" || h === "rotateZ") && r)) {
        if (qi.has(h)) {
          const d = this.buildTransformPart(h, p);
          d && n.push(d);
        } else if (Oi.has(h))
          typeof p == "number" && ((s ??= {})[h] = p);
        else if (Ui.has(h))
          typeof p == "number" && ((o ??= {})[h] = p);
        else if ($i.has(h))
          (a ??= {})[h] = p;
        else if (h !== "perspective") {
          if (h !== "shine") if (h === "d" && typeof p == "string") {
            const d = t;
            (d.tagName?.toLowerCase() === "path" ? d : d.querySelector?.("path"))?.setAttribute?.("d", p);
          } else
            this.applyStyleProperty(t, h, p);
        }
      }
    const f = e.get("shine");
    typeof f == "number" && this.applyShine(t, f);
    const m = e.get("perspective");
    if (typeof m == "number" && n.unshift(`perspective(${m}px)`), n.length > 0 && (t.style.transform = n.join(" ")), s) {
      const h = s.originX ?? 50, p = s.originY ?? 50;
      t.style.transformOrigin = `${h}% ${p}%`;
    }
    if (o) {
      const h = o.clipTop ?? 0, p = o.clipRight ?? 0, d = o.clipBottom ?? 0, u = o.clipLeft ?? 0;
      t.style.clipPath = `inset(${h}% ${p}% ${d}% ${u}%)`;
    }
    if (a) {
      const h = Yi(a);
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
    const n = t.dataset.shineBase, s = -20 + e * 140, o = t.style;
    o.color = "transparent", o.backgroundImage = `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.9) 50%, transparent 60%), linear-gradient(${n}, ${n})`, o.backgroundSize = "250% 100%, 100% 100%", o.backgroundPosition = `${s}% 0, 0 0`, o.backgroundRepeat = "no-repeat", o.webkitBackgroundClip = "text", o.backgroundClip = "text";
  }
  /**
   * Apply a single style property to an element.
   */
  applyStyleProperty(t, e, n) {
    let s;
    e === "fill" && t.dataset.elementType === "text" ? s = "color" : s = Vi[e] ?? e;
    let o;
    typeof n == "number" ? xt.has(e) || xt.has(s) ? o = `${n}px` : o = String(n) : Array.isArray(n) ? o = n.join(", ") : o = n, t.style[s] = o;
  }
}
const Ni = {
  request: (i) => requestAnimationFrame(i),
  cancel: (i) => cancelAnimationFrame(i)
};
class zi {
  adapter = new B();
  scheduler;
  root;
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
    this.scheduler = t.scheduler ?? Ni, this.root = t.root;
  }
  // --- targets ------------------------------------------------------------
  /**
   * Resolve selectors, elements and lists of either to engine target names,
   * registering each element with the adapter the first time it is seen.
   * Returns an empty array when nothing matches.
   */
  resolveTargets(t) {
    const e = [];
    for (const n of this.elementsOf(t))
      e.push(this.nameFor(n));
    return e;
  }
  /** The element registered under a target name. */
  elementFor(t) {
    return this.elements.get(t);
  }
  /** Last numeric value the stage applied to a target's property, if any. */
  appliedValue(t, e) {
    const n = this.applied.get(t)?.get(e);
    return typeof n == "number" ? n : void 0;
  }
  // --- playback -----------------------------------------------------------
  /**
   * Add a timeline to the running set and make sure the loop is going. The
   * timeline must already be playing; activating an already active timeline
   * moves it to the end of the order, so it wins merges.
   */
  activate(t, e = {}) {
    this.destroyed || (t.onUpdate = (n) => this.write(n), this.active.delete(t), this.active.set(t, e), this.startLoop());
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
    for (const [e, n] of [...this.active])
      e.duration <= 0 ? (this.write(e.getStateAtTime(0)), e.stop()) : e.tick(t), n.onUpdate?.(), e.playbackState !== "playing" && this.active.delete(e);
    this.flush(), this.active.size === 0 && this.stopLoop();
  }
  // --- internals ----------------------------------------------------------
  write(t) {
    for (const [e, n] of t.values) {
      let s = this.applied.get(e);
      s || (s = /* @__PURE__ */ new Map(), this.applied.set(e, s));
      for (const [o, a] of n) s.set(o, a);
      this.dirty.add(e);
    }
  }
  flush() {
    if (this.dirty.size === 0) return;
    const t = /* @__PURE__ */ new Map();
    for (const e of this.dirty) t.set(e, this.applied.get(e));
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
    const e = this.lastTimestamp === null ? 0 : t - this.lastTimestamp;
    this.lastTimestamp = t, e > 0 && this.tick(e), this.active.size > 0 && this.frameId === null && (this.frameId = this.scheduler.request(this.frame));
  };
  startLoop() {
    this.frameId === null && (this.lastTimestamp = null, this.frameId = this.scheduler.request(this.frame));
  }
  stopLoop() {
    this.frameId !== null && this.scheduler.cancel(this.frameId), this.frameId = null, this.lastTimestamp = null;
  }
  elementsOf(t) {
    if (typeof t == "string") {
      const n = this.root ?? document;
      return Array.from(n.querySelectorAll(t));
    }
    if (Wi(t)) return [t];
    const e = [];
    for (const n of Array.from(t))
      e.push(...this.elementsOf(n));
    return e;
  }
  nameFor(t) {
    const e = this.names.get(t);
    if (e) return e;
    let n = t.id ? `#${t.id}` : "";
    if (!n || this.elements.has(n))
      do
        this.nameCounter += 1, n = `el-${this.nameCounter}`;
      while (this.elements.has(n));
    return this.names.set(t, n), this.elements.set(n, t), this.adapter.registerTarget(n, t), n;
  }
}
function Wi(i) {
  return typeof i == "object" && i !== null && i.nodeType === 1;
}
class Pt {
  /** The compiled compat timeline. */
  compat;
  stage;
  options;
  /** Cleared once playback has been started or explicitly controlled. */
  autoplayPending;
  started = !1;
  constructor(t, e = {}) {
    this.stage = t, this.options = e, this.compat = new L({
      ...e,
      startValue: (n, s) => t.appliedValue(n, s)
    }), this.compat.timeline.onComplete = () => e.onComplete?.(), this.autoplayPending = !e.paused, this.autoplayPending && queueMicrotask(() => {
      this.autoplayPending && this.play();
    });
  }
  /** The engine timeline. */
  get timeline() {
    return this.compat.timeline;
  }
  // --- building -----------------------------------------------------------
  to(t, e, n) {
    const s = this.resolve(t);
    return s && this.compat.to(s, e, n), this;
  }
  from(t, e, n) {
    const s = this.resolve(t);
    return s && this.compat.from(s, e, n), this;
  }
  fromTo(t, e, n, s) {
    const o = this.resolve(t);
    return o && this.compat.fromTo(o, e, n, s), this;
  }
  set(t, e, n) {
    const s = this.resolve(t);
    return s && this.compat.set(s, e, n), this;
  }
  addLabel(t, e) {
    return this.compat.addLabel(t, e), this;
  }
  /** Merge another timeline in at a position (flattened, as in `tf`). */
  add(t, e) {
    return t.autoplayPending = !1, t.timeline.stop(), t.stage.deactivate(t.timeline), this.compat.add(t.compat, e), this;
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
    const e = this.compat.progress(t);
    return this.stage.render(this.timeline), e;
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
  resolve(t) {
    const e = this.stage.resolveTargets(t);
    if (e.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${Ki(t)}`);
      return;
    }
    return e;
  }
}
function Hi(i = new zi()) {
  const t = (e) => {
    const { config: n } = N(e);
    return new Pt(i, {
      repeat: n.repeat,
      yoyo: n.yoyo,
      repeatDelay: n.repeatDelay,
      paused: n.paused,
      onStart: n.onStart,
      onUpdate: n.onUpdate,
      onComplete: n.onComplete
    });
  };
  return {
    stage: i,
    timeline: (e) => new Pt(i, e),
    to: (e, n) => t(n).to(e, n),
    from: (e, n) => t(n).from(e, n),
    fromTo: (e, n, s) => t(s).fromTo(e, n, s),
    set: (e, n) => t(n).set(e, n)
  };
}
const q = /* @__PURE__ */ Hi();
function Ki(i) {
  return typeof i == "string" ? `"${i}"` : String(i);
}
class _t {
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
    const n = this.targetTime(t);
    e ? (this.media.paused && this.safePlay(), Math.abs(this.media.currentTime - n) > this.driftTolerance && (this.media.currentTime = n)) : (this.media.paused || this.media.pause(), this.media.currentTime !== n && (this.media.currentTime = n));
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
function Gi(i, t, e, n, s) {
  const o = e - s;
  if (o < 0) {
    t.paused || t.pause(), t.currentTime = 0;
    return;
  }
  i.update(o, n);
}
class le {
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
      const n = document.querySelector(t);
      if (!n)
        throw new Error(`Container not found: ${t}`);
      this.container = n;
    } else
      this.container = t;
    this.options = e, this.adapter = new B();
  }
  /**
   * Load animation from a URL or JSON object.
   */
  async load(t) {
    let e;
    if (typeof t == "string") {
      const n = await fetch(t);
      if (!n.ok)
        throw new Error(`Failed to load animation: ${n.statusText}`);
      e = await n.json();
    } else
      e = t;
    this.options.speed !== void 0 && (e.config = { ...e.config, speed: this.options.speed }), this.options.loop !== void 0 && (e.config = { ...e.config, loop: this.options.loop }), this.options.alternate !== void 0 && (e.config = { ...e.config, alternate: this.options.alternate }), this.timeline = D(e), this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia(), this.options.autoplay && this.play();
  }
  /**
   * Find embedded media elements (`[data-tinyfly-media]`) in the container and
   * bind each to the timeline. Emitted by the editor's export for audio/video
   * scene elements; the `data-tinyfly-start` attribute sets when each begins.
   */
  scanMedia() {
    this.mediaTargets = [], this.container.querySelectorAll("[data-tinyfly-media]").forEach((e) => {
      const n = e, s = Number(n.getAttribute("data-tinyfly-start") ?? "0") || 0, o = n.getAttribute("data-volume");
      o !== null && (n.volume = Math.max(0, Math.min(1, Number(o) || 0))), this.mediaTargets.push({ el: n, startTime: s, sync: new _t(n) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(t, e) {
    for (const n of this.mediaTargets)
      Gi(n.sync, n.el, t, e, n.startTime);
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
      const n = this.container.querySelector(e);
      n && (this.targets[t] = n, this.adapter.registerTarget(t, n));
    } else
      this.targets[t] = e, this.adapter.registerTarget(t, e);
  }
  /**
   * Auto-register targets using data-tinyfly attribute.
   */
  autoRegisterTargets() {
    this.container.querySelectorAll("[data-tinyfly]").forEach((e) => {
      const n = e.closest("[data-tinyfly-symbol]");
      if (n && n !== e) return;
      const s = e.getAttribute("data-tinyfly");
      s && this.registerTarget(s, e);
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
    const e = new Map(t.map((n) => [n.id, n]));
    this.container.querySelectorAll("[data-tinyfly-symbol]").forEach((n) => {
      const s = n.getAttribute("data-tinyfly-symbol");
      if (!s) return;
      const o = e.get(s);
      if (!o || !o.timeline.tracks?.length) return;
      const a = new B();
      n.querySelectorAll("[data-tinyfly]").forEach((c) => {
        const l = c.getAttribute("data-tinyfly");
        l && a.registerTarget(l, c);
      }), this.symbolInstances.push({ adapter: a, timeline: D(o.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(t, e) {
    this.mediaSync = new _t(t, e), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
      const n = e - (this.lastTime ?? e);
      this.lastTime = e, this.timeline.tick(n), this.applyState();
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
    for (const e of this.symbolInstances) {
      const n = e.timeline.duration;
      e.adapter.applyState(e.timeline.getStateAtTime(n > 0 ? t % n : t));
    }
  }
}
async function Xn(i, t, e = {}) {
  const n = new le(i, { ...e, autoplay: !0 });
  return await n.load(t), n;
}
function Yn(i, t = {}) {
  return new le(i, t);
}
class ji {
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
      const n = document.querySelector(t);
      if (!n) throw new Error(`Container not found: ${t}`);
      this.container = n;
    } else
      this.container = t;
    this.options = e, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new B(), this.adapterB = new B();
  }
  /**
   * Load a sequence from a URL or inline definition.
   */
  async load(t) {
    let e;
    if (typeof t == "string") {
      const n = await fetch(t);
      if (!n.ok)
        throw new Error(`Failed to load sequence: ${n.statusText}`);
      e = await n.json();
    } else
      e = t;
    this.sequence = e, this.symbolDefs.clear();
    for (const n of e.symbols ?? [])
      n.timeline?.tracks?.length && this.symbolDefs.set(n.id, n.timeline);
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
    const n = this.sequence.scenes[t];
    if (this.renderScene(n, this.containerA, this.adapterA), this.timelineA = this.createTimeline(n), this.options.onSceneChange?.(t), e)
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
  renderScene(t, e, n) {
    e.innerHTML = "", n.clearTargets();
    const s = document.createElement("div");
    s.style.cssText = "position:absolute;inset:0;transform-origin:center center", s.setAttribute("data-tinyfly", "Camera"), e.appendChild(s), n.registerTarget("Camera", s);
    for (const o of t.elements) {
      if (!o.html) continue;
      const a = document.createElement("div");
      a.innerHTML = o.html.trim();
      const c = a.firstElementChild;
      if (c) {
        s.appendChild(c);
        const l = c.getAttribute("data-tinyfly");
        l && n.registerTarget(l, c);
      }
    }
    this.setupNested(s, n);
  }
  /**
   * For each symbol instance container (`[data-tinyfly-symbol]`) in a scene slot,
   * bind its inner elements to a private adapter driven by the symbol's timeline.
   */
  setupNested(t, e) {
    const n = [];
    t.querySelectorAll("[data-tinyfly-symbol]").forEach((s) => {
      const o = s.getAttribute("data-tinyfly-symbol");
      if (!o) return;
      const a = this.symbolDefs.get(o);
      if (!a) return;
      const c = new B();
      s.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const r = l.getAttribute("data-tinyfly");
        r && c.registerTarget(r, l);
      }), n.push({ adapter: c, timeline: D(a) });
    }), n.length ? this.nestedByAdapter.set(e, n) : this.nestedByAdapter.delete(e);
  }
  /** Apply the nested symbol states for a slot at a given scene time. */
  applyNested(t, e) {
    const n = this.nestedByAdapter.get(t);
    if (n)
      for (const s of n) {
        const o = s.timeline.duration;
        s.adapter.applyState(s.timeline.getStateAtTime(o > 0 ? e % o : e));
      }
  }
  clearContainer(t) {
    t.innerHTML = "";
  }
  createTimeline(t) {
    return t.timeline ? D(t.timeline) : null;
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
    const e = this.sequence.scenes[t], n = e.transition;
    if (n.type === "none" || n.duration <= 0) {
      this.switchToScene(t);
      return;
    }
    this._state = "transitioning", this.containerB.style.visibility = "visible", this.renderScene(e, this.containerB, this.adapterB), this.timelineB = this.createTimeline(e), this.timelineB && this.timelineB.play(), this.applyTransition(n.type, n.duration), this.transitionTimer = window.setTimeout(() => {
      this.finishTransition(t);
    }, n.duration);
  }
  applyTransition(t, e) {
    const n = `${e}ms`, s = "ease-in-out";
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
    const e = this.containerA;
    this.containerA = this.containerB, this.containerB = e;
    const n = this.adapterA;
    this.adapterA = this.adapterB, this.adapterB = n, this.timelineA = this.timelineB, this.timelineB = null, this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB), this._currentSceneIndex = t, this._state = "playing-scene", this.options.onSceneChange?.(t), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.playbackState !== "playing" && this.timelineA.play()) : this.onSceneComplete();
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
      const n = e - (this.lastTime ?? e);
      if (this.lastTime = e, this.timelineA && this.timelineA.playbackState === "playing") {
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
async function qn(i, t, e = {}) {
  const n = new ji(i, { ...e, autoplay: !0 });
  return await n.load(t), n;
}
const On = { type: "none", duration: 0 }, Bt = {
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
function Ct(i) {
  const t = i.trim().toLowerCase();
  if (t in Bt) return Bt[t];
  if (t.endsWith("%")) {
    const e = Number.parseFloat(t.slice(0, -1));
    return Number.isNaN(e) ? void 0 : e / 100;
  }
}
function Zi(i) {
  if (typeof i == "number")
    return { elementFraction: 0, viewportFraction: 0, offsetPx: 0, absolutePx: i };
  let t = 0;
  const n = i.replace(/([+-])=\s*(-?[\d.]+)/g, (a, c, l) => (t += (c === "-" ? -1 : 1) * Number.parseFloat(l), "")).trim().split(/\s+/).filter(Boolean);
  if (n.length === 1 && /^-?[\d.]+$/.test(n[0]))
    return {
      elementFraction: 0,
      viewportFraction: 0,
      offsetPx: 0,
      absolutePx: Number.parseFloat(n[0]) + t
    };
  const s = n[0] !== void 0 ? Ct(n[0]) : void 0, o = n[1] !== void 0 ? Ct(n[1]) : void 0;
  return {
    elementFraction: s ?? 0,
    viewportFraction: o ?? 0,
    offsetPx: t
  };
}
function It(i, t, e) {
  const n = Zi(e), s = n.absolutePx !== void 0 ? i.top + n.absolutePx : i.top + i.height * n.elementFraction, o = t * n.viewportFraction;
  return s - o + n.offsetPx;
}
function Qi(i, t, e, n) {
  const s = It(i, t, e), a = It(i, t, n) - s;
  return a <= 0 ? s <= 0 ? 1 : 0 : Ji(-s / a);
}
function Ji(i) {
  return i < 0 ? 0 : i > 1 ? 1 : i === 0 ? 0 : i;
}
function tn(i, t, e, n) {
  if (e <= 0) return t;
  const s = 1 - Math.exp(-(n / 1e3) / e);
  return i + (t - i) * s;
}
class en {
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
function Un(i) {
  const t = new en(i);
  return t.start(), t;
}
class nn {
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
    const e = this.viewportHeight(), n = this.targetProgress;
    this.targetProgress = Qi(
      t,
      e,
      this.options.start ?? "top bottom",
      this.options.end ?? "bottom top"
    ), this.fireBoundaryCallbacks(n, this.targetProgress), this.smoothing() <= 0 && (this.displayProgress = this.targetProgress, this.applyProgress());
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
  fireBoundaryCallbacks(t, e) {
    const n = e > 0 && e < 1;
    n && !this.wasActive ? e >= t ? this.options.onEnter?.() : this.options.onEnterBack?.() : !n && this.wasActive && (e >= t ? this.options.onLeave?.() : this.options.onLeaveBack?.()), this.wasActive = n;
  }
  startSmoothing() {
    if (typeof requestAnimationFrame > "u") return;
    const t = (e) => {
      if (!this.running) return;
      const n = this.lastFrameTime === null ? 16.67 : e - this.lastFrameTime;
      this.lastFrameTime = e, this.displayProgress = tn(
        this.displayProgress,
        this.targetProgress,
        this.smoothing(),
        n
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
    const e = t.getBoundingClientRect(), n = this.options.scroller;
    if (n && typeof n.getBoundingClientRect == "function") {
      const s = n.getBoundingClientRect();
      return { top: e.top - s.top, bottom: e.bottom - s.top, height: e.height };
    }
    return { top: e.top, bottom: e.bottom, height: e.height };
  }
  viewportHeight() {
    const t = this.options.scroller;
    return t ? t.clientHeight : typeof window < "u" ? window.innerHeight : 0;
  }
}
function Vn(i) {
  const t = new nn(i);
  return t.start(), t;
}
const Lt = 0.3;
class sn {
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
  begin(t, e, n) {
    this.dragging = !0, this.passedTolerance = !1, this.startX = t, this.startY = e, this.lastX = t, this.lastY = e, this.velocityX = 0, this.velocityY = 0, this.lastTime = Ft(), this.options.onPress?.(this.stateFrom(0, 0, n));
  }
  move(t, e, n) {
    if (!this.dragging) return;
    const s = t - this.lastX, o = e - this.lastY;
    this.lastX = t, this.lastY = e;
    const a = t - this.startX, c = e - this.startY, l = this.options.tolerance ?? 3;
    if (!this.passedTolerance) {
      if (Math.hypot(a, c) < l) return;
      this.passedTolerance = !0;
    }
    this.updateVelocity(s, o), this.options.preventDefault !== !1 && n.cancelable && n.preventDefault(), this.options.onMove?.(this.stateFrom(s, o, n));
  }
  end(t) {
    this.dragging && (this.dragging = !1, this.options.onRelease?.(this.stateFrom(0, 0, t)));
  }
  updateVelocity(t, e) {
    const n = Ft(), s = Math.max(1, n - this.lastTime);
    this.lastTime = n;
    const o = t / s * 1e3, a = e / s * 1e3;
    this.velocityX += (o - this.velocityX) * Lt, this.velocityY += (a - this.velocityY) * Lt;
  }
  stateFrom(t, e, n) {
    return {
      deltaX: t,
      deltaY: e,
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
    const e = t;
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
function Ft() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function rn(i, t, e) {
  let n = { delta: 0, line: null }, s = e;
  for (const o of i)
    for (const a of t) {
      const c = Math.abs(a - o);
      c <= s && (s = c, n = { delta: a - o, line: a });
    }
  return n;
}
function on(i, t) {
  return t <= 0 ? [] : i.map((e) => Math.round(e / t) * t);
}
class an {
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
    this.options = t, this.x = t.initialX ?? 0, this.y = t.initialY ?? 0, this.observer = new sn({
      target: t.target,
      onPress: (e) => {
        this.originX = this.x, this.originY = this.y, t.onPress?.(e);
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
    const n = this.options.axis ?? "both";
    this.x = n === "y" ? this.x : this.applyConstraints(t, "x"), this.y = n === "x" ? this.y : this.applyConstraints(e, "y");
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
    const n = this.options.scrubDistance ?? 500;
    if (n === 0) return;
    const s = (this.options.axis ?? "both") === "y" ? this.y : this.x, o = cn(s / n);
    t.pause(), t.seek(o * e);
  }
  /**
   * Apply snapping, then bounds. Snapping uses the shared `snapAxis` helper —
   * the same one the editor stage snaps with — rather than a private rounding
   * rule, so grid and edge snapping behave identically in both places.
   *
   * Bounds are applied last so a snap can never push the target out of range.
   */
  applyConstraints(t, e) {
    let n = t;
    const s = [
      ...on([n], this.options.snap ?? 0),
      ...(e === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], o = rn([n], s, this.snapThreshold());
    n += o.delta, e === "x" ? this.snappedX = o.line : this.snappedY = o.line;
    const a = this.options.bounds;
    if (a) {
      const c = e === "x" ? a.minX : a.minY, l = e === "x" ? a.maxX : a.maxY;
      c !== void 0 && (n = Math.max(c, n)), l !== void 0 && (n = Math.min(l, n));
    }
    return n;
  }
}
function cn(i) {
  return i < 0 ? 0 : i > 1 ? 1 : i;
}
function Nn(i) {
  const t = new an(i);
  return t.start(), t;
}
function zn(i) {
  const { timeline: t } = i, e = new B();
  for (const [r, f] of Object.entries(i.targets)) {
    const m = typeof f == "string" ? document.querySelector(f) : f;
    if (!m)
      throw new Error(`quickPlay: no element found for target "${r}" (${String(f)})`);
    e.registerTarget(r, m);
  }
  t.onUpdate = (r) => {
    e.applyState(r), i.onUpdate?.(r);
  }, i.onComplete && (t.onComplete = i.onComplete);
  let n = null, s = null, o = !1;
  const a = (r) => {
    if (o) return;
    const f = s === null ? 0 : r - s;
    s = r, f > 0 && t.tick(f), n = requestAnimationFrame(a);
  }, c = () => {
    n !== null || o || (s = null, n = requestAnimationFrame(a));
  }, l = () => {
    n !== null && cancelAnimationFrame(n), n = null, s = null;
  };
  return e.applyState(t.getStateAtTime(t.currentTime)), i.autoplay !== !1 && (t.play(), c()), {
    timeline: t,
    adapter: e,
    play() {
      t.play(), c();
    },
    pause() {
      t.pause(), l();
    },
    restart() {
      t.stop(), t.play(), c();
    },
    seek(r) {
      t.seek(r * 1e3), e.applyState(t.getStateAtTime(t.currentTime));
    },
    destroy() {
      o = !0, l(), t.stop(), e.clearTargets();
    }
  };
}
const Wn = {
  timeline: Ri,
  to(i, t, e) {
    const n = new L(e);
    return n.to(i, t), n;
  },
  from(i, t, e) {
    const n = new L(e);
    return n.from(i, t), n;
  },
  fromTo(i, t, e, n) {
    const s = new L(n);
    return s.fromTo(i, t, e), s;
  },
  set(i, t, e) {
    const n = new L(e);
    return n.set(i, t), n;
  }
}, Hn = q.to, Kn = q.from, Gn = q.fromTo, jn = q.set, Zn = q.timeline;
export {
  X as ByteWriter,
  un as Clock,
  L as CompatTimeline,
  Kt as DEFAULT_BAKE_INTERVAL_MS,
  k as DEFAULT_SPRING,
  On as DEFAULT_TRANSITION,
  an as Draggable,
  te as GIFEncoder,
  Pt as LiveTimeline,
  ie as MP4_WEBCODECS,
  hn as ManualClock,
  _t as MediaSync,
  sn as Observer,
  ai as PaletteMatcher,
  Xt as SPRING_MAX_DURATION_MS,
  R as SPRING_STEP_MS,
  nn as ScrollDriver,
  vn as SimpleGIFEncoder,
  H as SpringSampler,
  Xe as SpringTrackPlayer,
  zi as Stage,
  Zt as Timeline,
  le as TinyflyPlayer,
  ji as TinyflySequencer,
  wt as TrackPlayer,
  Dn as ValueResolver,
  en as VisibilityDriver,
  fi as WebPEncoder,
  $e as bakeEasing,
  Gt as bakeSpringTrack,
  oi as buildPalette,
  Ji as clamp01,
  Yn as create,
  Te as createCubicBezier,
  Hi as createLive,
  Si as createRandom,
  nt as createTrack,
  mn as criticalDamping,
  D as deserializeTimeline,
  Oe as deserializeTrack,
  En as downloadGIF,
  _n as downloadVideo,
  An as downloadWebP,
  Nn as draggable,
  ge as easeIn,
  qt as easeInCubic,
  be as easeInOut,
  Ut as easeInOutCubic,
  me as easeInOutQuad,
  de as easeInQuad,
  ye as easeOut,
  Ot as easeOutCubic,
  pe as easeOutQuad,
  wn as exportToCSS,
  Mn as exportToGIF,
  ri as exportToLottie,
  Tn as exportToLottieJSON,
  bi as exportToMP4,
  vi as exportToVideo,
  kn as exportToWebP,
  Pn as exportVideo,
  Sn as extractFrames,
  Cn as frameCell,
  Kn as from,
  bn as fromJSON,
  Gn as fromTo,
  Vt as getEasingFunction,
  Ht as getInterpolator,
  ct as getSupportedVideoCodecs,
  Ti as getVideoExportFormats,
  on as gridLinesFor,
  he as hasKeyframes,
  Fn as hashSeed,
  Fe as interpolateArray,
  Le as interpolateColor,
  P as interpolateNumber,
  Re as interpolatePathString,
  bt as interpolateString,
  rt as isCubicBezierEasing,
  ln as isMotionPathPoint,
  Rt as isMotionPathTrack,
  C as isSpringTrack,
  pn as isUnderdamped,
  $n as isUnresolved,
  xn as isVideoExportSupported,
  Y as isWebCodecsMP4Supported,
  di as isWebPExportSupported,
  Yt as linear,
  q as live,
  li as lzwEncode,
  kt as mapEase,
  ue as maxStaggerDistance,
  mi as muxMP4,
  Ct as parseEdge,
  Zi as parseTrigger,
  ui as parseWebPBitstream,
  yi as pickAVCCodec,
  Xn as play,
  qn as playSequence,
  Un as playWhenVisible,
  ci as quantizeImage,
  zn as quickPlay,
  ne as randomBetween,
  Rn as randomChoice,
  Mi as randomSnapped,
  Ei as resolveSequence,
  oe as resolveValue,
  Qi as scrollProgress,
  Vn as scrubOnScroll,
  Ue as serializeTimeline,
  qe as serializeTrack,
  jn as set,
  De as simplifyKeyframes,
  tn as smoothToward,
  rn as snapAxis,
  dn as springDuration,
  fn as springValueAt,
  In as spriteFrameTimes,
  Bn as spriteSheetLayout,
  Ln as spriteSheetMeta,
  $t as staggerDistance,
  Dt as staggerOffset,
  fe as staggerOffsets,
  ot as staggerSpan,
  Gi as syncMediaElement,
  Wn as tf,
  Zn as timeline,
  Hn as to,
  yn as toJSON,
  gn as toKeyframedTrack,
  jt as toKeyframedTracks,
  $ as trackTargets,
  It as triggerDistance
};
