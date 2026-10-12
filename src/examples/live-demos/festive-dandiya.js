import { loadScene3D, drawScene3D } from '../../scene-3d';
import { character, characterObjects, danceCircleAt, humanDanceFrame, danceJoint, plantDanceFoot, meetDandiya, mixPoses, pointOnHead } from '../../characters';
const tinyfly = { loadScene3D, drawScene3D, character, characterObjects, danceCircleAt, humanDanceFrame, danceJoint, plantDanceFoot, meetDandiya, mixPoses, pointOnHead };
export const html = `<style>.fd-canvas { width: 100%; max-width: 560px; aspect-ratio: 4 / 3; border-radius: 12px; background: #31152a; }.fd-readout { color: #e9c778; font: 12px system-ui, sans-serif; text-align: center; }</style><canvas class="fd-canvas" width="960" height="720" aria-label="Festive garba and dandiya circle with half and full spins"></canvas><div class="fd-readout">Circle and partner strikes</div>`;
/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const { loadScene3D, drawScene3D, character, characterObjects, danceCircleAt, humanDanceFrame, danceJoint, plantDanceFoot, meetDandiya, mixPoses, pointOnHead } = tinyfly;
  const canvas = root.querySelector('.fd-canvas');
  const ctx = canvas.getContext('2d');
  const readout = root.querySelector('.fd-readout');
  const GOLD = '#f5cd72', TAU = Math.PI * 2, HEIGHT = 1.85, COUNT = 6, STICK = HEIGHT * .28;
  const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  const add = (a, b) => a.map((v, i) => v + b[i]), sub = (a, b) => a.map((v, i) => v - b[i]);
  const scale = (a, n) => a.map(v => v * n), unit = a => scale(a, 1 / (Math.hypot(...a) || 1));
  const lerp = (a, b, t) => add(scale(a, 1 - t), scale(b, t));
  function line(c, a, b, color = GOLD, width = 2) { c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
  function shape(c, points, color) { c.fillStyle = color; c.beginPath(); points.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.fill(); }
  function dot(c, p, r, color = GOLD) { c.fillStyle = color; c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.fill(); }
  function festiveLayers(female, color) {
    const skirt = (c, j) => {
      const hip = j.points.hip, ankles = ['left', 'right'].map(s => j.chains[`leg.${s}`][2]);
      const base = { x: (ankles[0].x + ankles[1].x) / 2, y: (ankles[0].y + ankles[1].y) / 2 - j.height * .03 };
      const w = j.height * .185, waist = j.height * .066;
      shape(c, [{ x: hip.x - waist, y: hip.y }, { x: hip.x + waist, y: hip.y }, { x: base.x + w, y: base.y }, { x: base.x, y: base.y + j.height * .015 }, { x: base.x - w, y: base.y }], color);
      line(c, { x: base.x - w, y: base.y }, { x: base.x + w, y: base.y }, GOLD, j.height * .014);
      for (let i = -4; i <= 4; i++) {
        const from = { x: hip.x + i * waist / 5, y: hip.y + j.height * .025 }, to = { x: base.x + i * w / 5, y: base.y - j.height * .018 };
        line(c, from, to, '#ffc864', j.height * .003);
        for (const t of [.3, .55, .8]) {
          const p = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
          dot(c, p, j.height * .008, '#fff5d6');
          dot(c, p, j.height * .003, color);
        }
      }
    };
    const parts = {
      spine: { over(c, j) {
          const hip = j.points.hip, neck = j.points.neck, w = j.height * .065;
          if (!female) {
            const hem = { x: hip.x, y: hip.y + j.height * .12 };
            shape(c, [{ x: hip.x - w, y: hip.y - j.height * .04 }, { x: hip.x + w, y: hip.y - j.height * .04 }, { x: hem.x + w * 1.5, y: hem.y }, { x: hem.x - w * 1.5, y: hem.y }], color);
            line(c, { x: hem.x - w * 1.5, y: hem.y }, { x: hem.x + w * 1.5, y: hem.y }, GOLD, j.height * .01);
          }
          for (let row = 1; row <= 3; row++)
            for (let col = -1; col <= 1; col++) {
              const t = row / 4;
              dot(c, { x: neck.x + (hip.x - neck.x) * t + col * w * .55, y: neck.y + (hip.y - neck.y) * t }, j.height * .008, '#fff0cf');
            }
          line(c, { x: hip.x - w, y: hip.y }, { x: hip.x + w, y: hip.y }, GOLD, j.height * .012);
          const shoulder = j.points['shoulder.right'];
          if (female) {
            const end = { x: hip.x - w * .7, y: hip.y + j.height * .1 }, bw = j.height * .018;
            shape(c, [{ x: shoulder.x - bw, y: shoulder.y }, { x: shoulder.x + bw, y: shoulder.y }, { x: end.x + bw, y: end.y }, { x: end.x - bw, y: end.y }], '#7833a1');
            line(c, shoulder, end, GOLD, j.height * .005);
          }
        } },
      head: { over(c, j) {
          const h = j.head;
          if (female) {
            const bindi = pointOnHead(h, 0, .33, 1);
            if (bindi.facing > .1)
              dot(c, bindi.point, j.height * .006, '#da244d');
            for (const side of [-1, 1]) {
              const ear = pointOnHead(h, side, -.28, 0);
              if (ear.facing > -.05) {
                dot(c, ear.point, j.height * .011);
                dot(c, { x: ear.point.x, y: ear.point.y + j.height * .02 }, j.height * .009);
              }
            }
            const flower = pointOnHead(h, 1, .15, 0);
            if (flower.facing > -.05)
              for (let i = 0; i < 6; i++)
                dot(c, { x: flower.point.x + Math.cos(i * TAU / 6) * j.height * .016, y: flower.point.y + Math.sin(i * TAU / 6) * j.height * .016 }, j.height * .009, '#fff3ca');
          }
          else {
            const x = h.center.x, y = h.center.y - h.ry * .65;
            shape(c, [{ x: x - h.rx * 1.1, y: y + 2 }, { x: x - h.rx * .75, y: y - h.ry * .38 }, { x: x + h.rx * .7, y: y - h.ry * .44 }, { x: x + h.rx * 1.12, y: y + 2 }], '#f38d26');
            line(c, { x: x - h.rx, y }, { x: x + h.rx, y }, GOLD, j.height * .009);
          }
        } },
    };
    for (const side of ['left', 'right']) {
      if (female)
        parts[`leg.${side}`] = { over(c, j) { const a = j.parts['leg.left'].depth, b = j.parts['leg.right'].depth; if ((a > b ? 'left' : 'right') === side)
            skirt(c, j); } };
      parts[`arm.${side}`] = { over(c, j) { const wrist = j.chains[`arm.${side}`][2], elbow = j.chains[`arm.${side}`][1], d = { x: elbow.x - wrist.x, y: elbow.y - wrist.y }, n = Math.hypot(d.x, d.y) || 1, w = j.height * .02; for (const t of [.03, .09]) {
          const p = { x: wrist.x + d.x * t, y: wrist.y + d.y * t };
          line(c, { x: p.x - d.y / n * w, y: p.y + d.x / n * w }, { x: p.x + d.y / n * w, y: p.y - d.x / n * w }, GOLD, j.height * .006);
        } } };
    }
    return { parts };
  }
  const colors = ['#ed387e', '#149c98', '#8d50c2', '#e96b25', '#e8a52c', '#286cac'];
  const people = colors.map((color, i) => ({ height: HEIGHT, look: 'clean', figure: 'fluid', skin: '#dfa675', ink: '#4a2636', hands: 'cartoon', handStyle: 'natural', headSize: .17, hair: { style: i % 2 ? 'short' : 'lowBun', color: '#281820' }, facialHair: i % 2 ? 'shortMoustache' : null, outfit: { shirt: i % 2 ? color : '#ec922f', trousers: i % 2 ? '#fff0c9' : color, bottom: i % 2 ? 'trousers' : 'skirt', sleeves: i % 2 ? 'long' : 'short' }, layers: festiveLayers(i % 2 === 0, color) }));
  const who = character(people[0]);
  const sticks = Array.from({ length: COUNT * 2 }, (_, i) => ({ id: `stick${i}`, kind: 'line', points: [[0, 0, 0], [0, 1, 0]], color: GOLD, width: .035 }));
  const bands = Array.from({ length: COUNT * 2 * 4 }, (_, i) => ({ id: `band${i}`, kind: 'line', points: [[0, 0, 0], [0, 1, 0]], color: i % 2 ? '#eb3983' : '#2bd8c5', width: .04 }));
  const rings = [1.35, 1.65, 1.95].map((r, i) => ({ id: `ring${i}`, kind: 'line', points: Array.from({ length: 90 }, (_, k) => [r * Math.sin(k * TAU / 90), .002, r * Math.cos(k * TAU / 90)]), closed: true, color: i === 1 ? '#cb8945' : '#835b59', width: .014 }));
  const scene = loadScene3D({ id: 'festival', camera: 'cam', materials: { floor: { color: '#3b1930', shading: 'flat' } }, objects: [
      { id: 'cam', kind: 'camera', projection: 'orthographic', height: 4.6, near: .1, far: 30, position: [0, 3.4, 7], lookAt: [0, .8, 0] },
      ...rings, ...people.map((options, i) => ({ id: `dancer${i}`, kind: 'character', height: HEIGHT, character: options })), ...sticks, ...bands,
    ] }, { kinds: [characterObjects] });
  /** Half-turns in four beats, full turns in eight; every 48 beats closes. */
  function spinDegrees(beat) {
    const block = Math.floor(beat / 24), t = ((beat % 24) + 24) % 24;
    return block * 720 + 180 * smooth((t - 8) / 4) + 180 * smooth((t - 12) / 4) + 360 * smooth((t - 16) / 8);
  }
  function place(beat) {
    const members = danceCircleAt(beat, { radius: 1.35, count: COUNT, beatsPerTurn: 48, style: 'dandiya', character: who, plantFeet: false });
    return members.map((m, i) => { const partner = members[i % 2 ? i - 1 : i + 1], d = sub(partner.position, m.position), heading = Math.atan2(d[0], d[2]) * 180 / Math.PI + spinDegrees(beat); return { ...m, pose: { ...m.pose, turn: heading / 90 }, heading }; });
  }
  function palm(member, side) { const wrist = danceJoint(member, `arm.${side}`, 2), elbow = danceJoint(member, `arm.${side}`, 1); return add(wrist, scale(unit(sub(wrist, elbow)), who.lineWidth * .5)); }
  function festiveFrame(time) {
    const beat = time / 500, members = place(beat), contact = humanDanceFrame('dandiya', beat).contact;
    const anchored = place(contact.start);
    for (let i = 0; i < COUNT; i++) {
      const target = danceJoint(anchored[i], `leg.${contact.side}`, 3), plant = plantDanceFoot(members[i], contact.side, target);
      if (plant.reached) {
        members[i].pose = mixPoses(members[i].pose, plant.pose, contact.weight);
        members[i].position[1] = plant.position[1] * contact.weight;
      }
    }
    const meetings = [];
    const normal = (((beat % 24) + 24) % 24) < 8;
    const strike = normal ? humanDanceFrame('dandiya', beat).strike : 0;
    for (let i = 0; i < COUNT; i += 2) {
      const meet = meetDandiya(members[i], members[i + 1], { length: STICK, sideA: 'right', sideB: 'right' });
      if (meet.reached) {
        members[i].pose = mixPoses(members[i].pose, meet.a, strike);
        members[i + 1].pose = mixPoses(members[i + 1].pose, meet.b, strike);
      }
      meetings.push(meet);
    }
    const values = new Map(members.map((m, i) => { const { turn, ...pose } = m.pose; return [`festival/dancer${i}`, new Map(Object.entries({ ...pose, position: m.position, rotateY: turn * 90 }))]; }));
    for (let i = 0; i < COUNT; i++)
      for (const [s, side] of ['left', 'right'].entries()) {
        const grip = palm(members[i], side), elbow = danceJoint(members[i], `arm.${side}`, 1), forward = unit(add(scale(unit(sub(grip, elbow)), .65), [0, .7, 0]));
        const meet = meetings[Math.floor(i / 2)], meetingDirection = unit(sub(meet.point, grip));
        const direction = side === 'right' && meet.reached ? unit(lerp(forward, meetingDirection, strike)) : forward;
        const tip = add(grip, scale(direction, STICK)), index = i * 2 + s;
        sticks[index].points = [grip, tip];
        for (let k = 0; k < 4; k++)
          bands[index * 4 + k].points = [lerp(grip, tip, .2 + k * .19), lerp(grip, tip, .25 + k * .19)];
      }
    return { values, members, meetings, strike };
  }
  function drawFestiveDandiya(ctx, time, { width = 1080, height = 830 } = {}) {
    const frame = festiveFrame(time);
    drawScene3D(ctx, scene, frame.values, { width, height, time });
  }
  const clock = { time: 0 };
  live.to(clock, { time: 24000, duration: 24, ease: 'none', repeat: -1 });
  const draw = () => {
    const beat = clock.time / 500;
    const phase = beat % 24;
    readout.textContent = `${phase < 8 ? 'Circle and partner strikes' : phase < 16 ? 'Half turns' : 'Full spin'} · beat ${beat.toFixed(1)}`;
    if (!ctx)
      return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#31152a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawFestiveDandiya(ctx, clock.time, { width: canvas.width, height: canvas.height });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5cd72';
    ctx.font = '28px Georgia, serif';
    ctx.fillText('Algorisys Technologies', canvas.width / 2, 45);
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Wishing everyone a Happy Navratri', canvas.width / 2, 77);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Circle · Partner strikes · Half & full spins', canvas.width / 2, canvas.height - 22);
  };
  draw();
  live.ticker.add(draw);
  // #endregion code
  return () => live.ticker.remove(draw);
}
/** @type {import('./types').LiveDemo} */
export const festiveDandiya = {
  id: 'live-festive-dandiya',
  name: 'Navratri: Festive Garba & Dandiya',
  description: 'Six dancers in mirror-work lehengas, kediyu-style tops, dupattas and turbans circle with planted feet, play larger banded dandiya sticks at shared partner strike points, and alternate half and full body spins. A looping Algorisys Navratri greeting, drawn by native character and 3D scene APIs.',
  category: '3d',
  alsoIn: ['showcase', 'products', 'video'],
  tags: ['garba', 'dandiya', 'navratri', 'festive', 'dance', 'circle', 'spinning', 'half turn', 'clothes', 'partner', 'Algorisys'],
  addons: ['scene-3d'],
  html,
  run,
};
