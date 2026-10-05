import { Timeline, quat, mat4 } from '../../engine'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { Timeline, quat, mat4 }

const faces = ['front', 'back', 'right', 'left', 'top', 'bottom']
  .map((face, i) => `<div class="qc-face qc-${face}">${i + 1}</div>`)
  .join('')

export const html = `<style>
  .qc-row { display: flex; gap: 40px; justify-content: center; align-items: flex-start; }
  .qc-col { display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .qc-scene { width: 64px; height: 64px; perspective: 360px; }
  .qc-cube { position: relative; width: 64px; height: 64px; transform-style: preserve-3d; }
  .qc-face { position: absolute; inset: 0; display: grid; place-items: center; border-radius: 6px;
    font: 700 20px system-ui, sans-serif; color: #fff; border: 1px solid rgba(255, 255, 255, 0.35); }
  .qc-front { background: #4a9eff; transform: translateZ(32px); }
  .qc-back { background: #9b59b6; transform: rotateY(180deg) translateZ(32px); }
  .qc-right { background: #2ecc71; transform: rotateY(90deg) translateZ(32px); }
  .qc-left { background: #e67e22; transform: rotateY(-90deg) translateZ(32px); }
  .qc-top { background: #e74c3c; transform: rotateX(90deg) translateZ(32px); }
  .qc-bottom { background: #f1c40f; transform: rotateX(-90deg) translateZ(32px); }
  .qc-label { font: 12px system-ui, sans-serif; color: #cbd5e1; text-align: center; max-width: 150px; }
</style>
<div class="qc-row">
  <div class="qc-col"><div class="qc-scene"><div class="qc-cube qc-euler">${faces}</div></div>
    <div class="qc-label">Euler angles<br>rotateY 0→180, rotateZ 0→180</div></div>
  <div class="qc-col"><div class="qc-scene"><div class="qc-cube qc-quat">${faces}</div></div>
    <div class="qc-label">Quaternion, slerp<br>one turn, the short way</div></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const eulerCube = root.querySelector('.qc-euler')
  const quatCube = root.querySelector('.qc-quat')

  // Both cubes go from the same start to the same end: yaw 180° then roll 180°
  // is the same orientation as a 180° flip about x. Turning each Euler angle on
  // its own tumbles about two axes; slerp turns once, about one axis.
  const end = tinyfly.quat.fromEuler(0, 180, 180)
  const timeline = new tinyfly.Timeline({
    id: 'quaternion-cube',
    tracks: [
      { id: 'yaw', target: 'euler', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: 180, easing: 'ease-in-out' }] },
      { id: 'roll', target: 'euler', property: 'rotateZ', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: 180, easing: 'ease-in-out' }] },
      {
        id: 'turn',
        target: 'quat',
        property: 'quaternion',
        interpolation: 'slerp', // the values are rotations: turn the short way, at a steady speed
        keyframes: [{ time: 0, value: tinyfly.quat.identity() }, { time: 2000, value: end, easing: 'ease-in-out' }],
      },
    ],
  })

  // There and back with a pause at each end, from one clock (ms).
  const clock = { time: 0 }
  live.to(clock, { time: 600000, duration: 600, ease: 'none', repeat: -1 })
  const draw = () => {
    const phase = clock.time % 5000
    const time = phase < 2500 ? Math.min(2000, phase) : Math.max(0, 4500 - phase)
    const state = timeline.getStateAtTime(time)
    const euler = state.values.get('euler')
    eulerCube.style.transform = `rotateY(${euler.get('rotateY')}deg) rotateZ(${euler.get('rotateZ')}deg)`
    // A quaternion is drawn as its rotation matrix: CSS matrix3d is column-major, as mat4 is.
    const matrix = tinyfly.mat4.fromQuat(state.values.get('quat').get('quaternion'))
    quatCube.style.transform = `matrix3d(${matrix.join(', ')})`
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const quaternionCube = {
  id: 'live-quaternion-cube',
  name: 'Quaternion vs Euler (3D rotation)',
  description:
    'Two cubes go from the same start to the same end. The left one animates Euler angles, each on its own, and tumbles about two axes; the right one animates a quaternion with interpolation: "slerp" and turns once, the short way, at a steady speed. tinyfly.quat and tinyfly.mat4 are the engine\'s small 3D math, and a slerp track is plain JSON.',
  category: '3d',
  tags: ['3d', 'quaternion', 'slerp', 'rotation', 'css 3d', 'matrix3d'],
  html,
  run,
}
