import type { SceneElement } from '../stores/scene-store'
import type { Track, MotionPathTrack } from '../../engine/types'

/** Track without ID for sample definitions */
type SampleTrack = Omit<Track, 'id'> | Omit<MotionPathTrack, 'id'>

/**
 * Sample animation definition
 */
export interface SampleDefinition {
  /** Unique identifier */
  id: string
  /** Display name */
  name: string
  /** Short description */
  description: string
  /** Category for organization */
  category: 'basic' | 'motion' | 'text' | 'ui' | 'effects' | 'showcase'
  /** Preview thumbnail (emoji for now, could be image URL) */
  thumbnail: string
  /** Animation duration in ms */
  duration: number
  /** Scene elements to create */
  elements: Partial<SceneElement>[]
  /** Animation tracks (regular or motion path) */
  tracks: SampleTrack[]
}

/**
 * All available sample animations
 */
export const sampleDefinitions: SampleDefinition[] = [
  // === BASIC ===
  {
    id: 'fade-in-out',
    name: 'Fade In/Out',
    description: 'Simple opacity animation',
    category: 'basic',
    thumbnail: '🌗',
    duration: 2000,
    elements: [
      {
        type: 'rect',
        name: 'Box',
        x: 120,
        y: 70,
        width: 60,
        height: 60,
        fill: '#4a9eff',
        borderRadius: 8,
      },
    ],
    tracks: [
      {
        target: 'Box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 500, value: 1, easing: 'ease-out' },
          { time: 1500, value: 1 },
          { time: 2000, value: 0, easing: 'ease-in' },
        ],
      },
    ],
  },

  {
    id: 'scale-pulse',
    name: 'Scale Pulse',
    description: 'Pulsing scale animation',
    category: 'basic',
    thumbnail: '💗',
    duration: 1500,
    elements: [
      {
        type: 'circle',
        name: 'Circle',
        x: 120,
        y: 70,
        width: 60,
        height: 60,
        fill: '#e74c3c',
      },
    ],
    tracks: [
      {
        target: 'Circle',
        property: 'scale',
        keyframes: [
          { time: 0, value: 1 },
          { time: 375, value: 1.3, easing: 'ease-out' },
          { time: 750, value: 1, easing: 'ease-in' },
          { time: 1125, value: 1.3, easing: 'ease-out' },
          { time: 1500, value: 1, easing: 'ease-in' },
        ],
      },
    ],
  },

  {
    id: 'rotation',
    name: 'Rotation',
    description: 'Continuous rotation',
    category: 'basic',
    thumbnail: '🔄',
    duration: 2000,
    elements: [
      {
        type: 'rect',
        name: 'Square',
        x: 120,
        y: 70,
        width: 50,
        height: 50,
        fill: '#9b59b6',
        borderRadius: 4,
      },
    ],
    tracks: [
      {
        target: 'Square',
        property: 'rotate',
        keyframes: [
          { time: 0, value: 0 },
          { time: 2000, value: 360, easing: 'linear' },
        ],
      },
    ],
  },

  {
    id: 'morph',
    name: 'Shape Morph',
    description: 'Rectangle to circle transform',
    category: 'basic',
    thumbnail: '🔷',
    duration: 2000,
    elements: [
      {
        type: 'rect',
        name: 'Shape',
        x: 110,
        y: 60,
        width: 80,
        height: 80,
        fill: '#e74c3c',
        borderRadius: 0,
      },
    ],
    tracks: [
      {
        target: 'Shape',
        property: 'borderRadius',
        keyframes: [
          { time: 0, value: 0 },
          { time: 500, value: 40, easing: 'ease-in-out' },
          { time: 1500, value: 40 },
          { time: 2000, value: 0, easing: 'ease-in-out' },
        ],
      },
      {
        target: 'Shape',
        property: 'rotate',
        keyframes: [
          { time: 0, value: 0 },
          { time: 1000, value: 180, easing: 'ease-in-out' },
          { time: 2000, value: 360, easing: 'ease-in-out' },
        ],
      },
      {
        target: 'Shape',
        property: 'fill',
        keyframes: [
          { time: 0, value: '#e74c3c' },
          { time: 1000, value: '#9b59b6', easing: 'ease-in-out' },
          { time: 2000, value: '#e74c3c', easing: 'ease-in-out' },
        ],
      },
    ],
  },

  // === MOTION ===
  {
    id: 'bounce',
    name: 'Bouncing Ball',
    description: 'Ball bouncing with squash',
    category: 'motion',
    thumbnail: '⚽',
    duration: 2000,
    elements: [
      {
        type: 'circle',
        name: 'Ball',
        x: 130,
        y: 30,
        width: 40,
        height: 40,
        fill: '#f39c12',
      },
      {
        type: 'rect',
        name: 'Ground',
        x: 50,
        y: 160,
        width: 200,
        height: 4,
        fill: '#95a5a6',
        borderRadius: 2,
      },
    ],
    tracks: [
      {
        target: 'Ball',
        property: 'y',
        keyframes: [
          { time: 0, value: 0 },
          { time: 400, value: 90, easing: 'ease-in' },
          { time: 500, value: 90 },
          { time: 600, value: 90, easing: 'ease-out' },
          { time: 1000, value: 0, easing: 'ease-out' },
          { time: 1400, value: 90, easing: 'ease-in' },
          { time: 1500, value: 90 },
          { time: 1600, value: 90, easing: 'ease-out' },
          { time: 2000, value: 0, easing: 'ease-out' },
        ],
      },
      {
        target: 'Ball',
        property: 'scaleY',
        keyframes: [
          { time: 0, value: 1 },
          { time: 400, value: 1 },
          { time: 500, value: 0.7, easing: 'ease-out' },
          { time: 600, value: 1, easing: 'ease-out' },
          { time: 1400, value: 1 },
          { time: 1500, value: 0.7, easing: 'ease-out' },
          { time: 1600, value: 1, easing: 'ease-out' },
        ],
      },
      {
        target: 'Ball',
        property: 'scaleX',
        keyframes: [
          { time: 0, value: 1 },
          { time: 400, value: 1 },
          { time: 500, value: 1.2, easing: 'ease-out' },
          { time: 600, value: 1, easing: 'ease-out' },
          { time: 1400, value: 1 },
          { time: 1500, value: 1.2, easing: 'ease-out' },
          { time: 1600, value: 1, easing: 'ease-out' },
        ],
      },
    ],
  },

  {
    id: 'slide-in',
    name: 'Slide In',
    description: 'Element sliding from left',
    category: 'motion',
    thumbnail: '➡️',
    duration: 1500,
    elements: [
      {
        type: 'rect',
        name: 'Card',
        x: 100,
        y: 60,
        width: 100,
        height: 80,
        fill: '#3498db',
        borderRadius: 8,
      },
    ],
    tracks: [
      {
        target: 'Card',
        property: 'x',
        keyframes: [
          { time: 0, value: -120 },
          { time: 800, value: 0, easing: 'ease-out-cubic' },
          { time: 1500, value: 0 },
        ],
      },
      {
        target: 'Card',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 400, value: 1, easing: 'ease-out' },
        ],
      },
    ],
  },

  {
    id: 'orbit',
    name: 'Orbital Motion',
    description: 'Circle orbiting a center',
    category: 'motion',
    thumbnail: '🪐',
    duration: 3000,
    elements: [
      {
        type: 'circle',
        name: 'Center',
        x: 125,
        y: 75,
        width: 30,
        height: 30,
        fill: '#f1c40f',
      },
      {
        type: 'circle',
        name: 'Orbiter',
        x: 125,
        y: 25,
        width: 20,
        height: 20,
        fill: '#3498db',
      },
    ],
    tracks: [
      {
        target: 'Orbiter',
        property: 'x',
        keyframes: [
          { time: 0, value: 0 },
          { time: 750, value: 50, easing: 'ease-in-out' },
          { time: 1500, value: 0, easing: 'ease-in-out' },
          { time: 2250, value: -50, easing: 'ease-in-out' },
          { time: 3000, value: 0, easing: 'ease-in-out' },
        ],
      },
      {
        target: 'Orbiter',
        property: 'y',
        keyframes: [
          { time: 0, value: 0 },
          { time: 750, value: 50, easing: 'ease-in-out' },
          { time: 1500, value: 100, easing: 'ease-in-out' },
          { time: 2250, value: 50, easing: 'ease-in-out' },
          { time: 3000, value: 0, easing: 'ease-in-out' },
        ],
      },
      {
        target: 'Orbiter',
        property: 'scale',
        keyframes: [
          { time: 0, value: 1 },
          { time: 1500, value: 0.6, easing: 'ease-in-out' },
          { time: 3000, value: 1, easing: 'ease-in-out' },
        ],
      },
    ],
  },

  {
    id: 'pendulum',
    name: 'Pendulum',
    description: 'Swinging pendulum motion',
    category: 'motion',
    thumbnail: '🕰️',
    duration: 2000,
    elements: [
      { type: 'circle', name: 'Pivot', x: 145, y: 20, width: 10, height: 10, fill: '#95a5a6' },
      { type: 'line', name: 'Arm', x: 150, y: 25, x2: 150, y2: 120, stroke: '#95a5a6', strokeWidth: 3 },
      { type: 'circle', name: 'Bob', x: 125, y: 95, width: 50, height: 50, fill: '#e74c3c' },
    ],
    tracks: [
      // Arm swings from pivot - animate rotation around top
      { target: 'Arm', property: 'rotate', keyframes: [
        { time: 0, value: -30 },
        { time: 500, value: 0, easing: 'ease-in' },
        { time: 1000, value: 30, easing: 'ease-out' },
        { time: 1500, value: 0, easing: 'ease-in' },
        { time: 2000, value: -30, easing: 'ease-out' },
      ]},
      // Bob follows pendulum motion
      { target: 'Bob', property: 'x', keyframes: [
        { time: 0, value: -50 },
        { time: 500, value: 0, easing: 'ease-in' },
        { time: 1000, value: 50, easing: 'ease-out' },
        { time: 1500, value: 0, easing: 'ease-in' },
        { time: 2000, value: -50, easing: 'ease-out' },
      ]},
      { target: 'Bob', property: 'y', keyframes: [
        { time: 0, value: -20 },
        { time: 500, value: 0, easing: 'ease-in' },
        { time: 1000, value: -20, easing: 'ease-out' },
        { time: 1500, value: 0, easing: 'ease-in' },
        { time: 2000, value: -20, easing: 'ease-out' },
      ]},
    ],
  },

  {
    id: 'wave',
    name: 'Wave',
    description: 'Animated wave pattern',
    category: 'motion',
    thumbnail: '🌊',
    duration: 2000,
    elements: [
      { type: 'circle', name: 'D1', x: 40, y: 90, width: 20, height: 20, fill: '#3498db' },
      { type: 'circle', name: 'D2', x: 70, y: 90, width: 20, height: 20, fill: '#3498db' },
      { type: 'circle', name: 'D3', x: 100, y: 90, width: 20, height: 20, fill: '#3498db' },
      { type: 'circle', name: 'D4', x: 130, y: 90, width: 20, height: 20, fill: '#3498db' },
      { type: 'circle', name: 'D5', x: 160, y: 90, width: 20, height: 20, fill: '#3498db' },
      { type: 'circle', name: 'D6', x: 190, y: 90, width: 20, height: 20, fill: '#3498db' },
      { type: 'circle', name: 'D7', x: 220, y: 90, width: 20, height: 20, fill: '#3498db' },
    ],
    tracks: [
      // Each dot moves up and down with phase offset
      { target: 'D1', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 500, value: -40, easing: 'ease-in-out' }, { time: 1000, value: 0, easing: 'ease-in-out' }, { time: 1500, value: 40, easing: 'ease-in-out' }, { time: 2000, value: 0, easing: 'ease-in-out' }] },
      { target: 'D2', property: 'y', keyframes: [{ time: 0, value: -20 }, { time: 250, value: -40, easing: 'ease-in-out' }, { time: 750, value: 0, easing: 'ease-in-out' }, { time: 1250, value: 40, easing: 'ease-in-out' }, { time: 1750, value: 0, easing: 'ease-in-out' }, { time: 2000, value: -20, easing: 'ease-in-out' }] },
      { target: 'D3', property: 'y', keyframes: [{ time: 0, value: -40 }, { time: 500, value: 0, easing: 'ease-in-out' }, { time: 1000, value: 40, easing: 'ease-in-out' }, { time: 1500, value: 0, easing: 'ease-in-out' }, { time: 2000, value: -40, easing: 'ease-in-out' }] },
      { target: 'D4', property: 'y', keyframes: [{ time: 0, value: -20 }, { time: 250, value: 0, easing: 'ease-in-out' }, { time: 750, value: 40, easing: 'ease-in-out' }, { time: 1250, value: 0, easing: 'ease-in-out' }, { time: 1750, value: -40, easing: 'ease-in-out' }, { time: 2000, value: -20, easing: 'ease-in-out' }] },
      { target: 'D5', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 40, easing: 'ease-in-out' }, { time: 1000, value: 0, easing: 'ease-in-out' }, { time: 1500, value: -40, easing: 'ease-in-out' }, { time: 2000, value: 0, easing: 'ease-in-out' }] },
      { target: 'D6', property: 'y', keyframes: [{ time: 0, value: 20 }, { time: 250, value: 40, easing: 'ease-in-out' }, { time: 750, value: 0, easing: 'ease-in-out' }, { time: 1250, value: -40, easing: 'ease-in-out' }, { time: 1750, value: 0, easing: 'ease-in-out' }, { time: 2000, value: 20, easing: 'ease-in-out' }] },
      { target: 'D7', property: 'y', keyframes: [{ time: 0, value: 40 }, { time: 500, value: 0, easing: 'ease-in-out' }, { time: 1000, value: -40, easing: 'ease-in-out' }, { time: 1500, value: 0, easing: 'ease-in-out' }, { time: 2000, value: 40, easing: 'ease-in-out' }] },
    ],
  },

  {
    id: 'zigzag',
    name: 'Zigzag Path',
    description: 'Element following zigzag path',
    category: 'motion',
    thumbnail: '⚡',
    duration: 2500,
    elements: [
      { type: 'line', name: 'Path', x: 30, y: 40, x2: 270, y2: 40, stroke: '#333', strokeWidth: 1 },
      { type: 'circle', name: 'Dot', x: 30, y: 30, width: 20, height: 20, fill: '#f39c12' },
    ],
    tracks: [
      { target: 'Dot', property: 'x', keyframes: [
        { time: 0, value: 0 },
        { time: 500, value: 60, easing: 'linear' },
        { time: 1000, value: 120, easing: 'linear' },
        { time: 1500, value: 180, easing: 'linear' },
        { time: 2000, value: 240, easing: 'linear' },
        { time: 2500, value: 240 },
      ]},
      { target: 'Dot', property: 'y', keyframes: [
        { time: 0, value: 0 },
        { time: 500, value: 100, easing: 'ease-in-out' },
        { time: 1000, value: 0, easing: 'ease-in-out' },
        { time: 1500, value: 100, easing: 'ease-in-out' },
        { time: 2000, value: 0, easing: 'ease-in-out' },
        { time: 2500, value: 0 },
      ]},
      { target: 'Dot', property: 'scale', keyframes: [
        { time: 0, value: 1 },
        { time: 250, value: 1.2, easing: 'ease-out' },
        { time: 500, value: 1, easing: 'ease-in' },
        { time: 750, value: 1.2, easing: 'ease-out' },
        { time: 1000, value: 1, easing: 'ease-in' },
        { time: 1250, value: 1.2, easing: 'ease-out' },
        { time: 1500, value: 1, easing: 'ease-in' },
        { time: 1750, value: 1.2, easing: 'ease-out' },
        { time: 2000, value: 1, easing: 'ease-in' },
      ]},
    ],
  },

  {
    id: 'motion-path',
    name: 'Motion Path',
    description: 'Element following SVG path curve',
    category: 'motion',
    thumbnail: '🛤️',
    duration: 3000,
    elements: [
      // The path that will be followed (visible guide)
      { type: 'path', name: 'GuidePath', x: 0, y: 0, width: 300, height: 200, d: 'M 30 100 Q 100 20 150 100 Q 200 180 270 100', fill: 'transparent', stroke: '#3a3a3a', strokeWidth: 2 },
      // The element that follows the path - offset by half its size so center follows the path
      { type: 'circle', name: 'Ball', x: -12, y: -12, width: 24, height: 24, fill: '#e74c3c' },
    ],
    tracks: [
      // Motion path track - animates the Ball along the GuidePath
      {
        target: 'Ball',
        property: 'motionPath',
        motionPathConfig: {
          pathData: 'M 30 100 Q 100 20 150 100 Q 200 180 270 100',
          autoRotate: true,
          rotateOffset: 0,
        },
        keyframes: [
          { time: 0, value: 0 },
          { time: 3000, value: 1, easing: 'ease-in-out' },
        ],
      } as Omit<MotionPathTrack, 'id'>,
      // Ball scale pulse
      { target: 'Ball', property: 'scale', keyframes: [
        { time: 0, value: 1 },
        { time: 750, value: 1.2, easing: 'ease-out' },
        { time: 1500, value: 1, easing: 'ease-in' },
        { time: 2250, value: 1.2, easing: 'ease-out' },
        { time: 3000, value: 1, easing: 'ease-in' },
      ]},
    ],
  },

  // === TEXT ===
  {
    id: 'text-fade-in',
    name: 'Text Fade In',
    description: 'Simple text fade in animation',
    category: 'text',
    thumbnail: '📝',
    duration: 1500,
    elements: [
      { type: 'text', name: 'Title', x: 50, y: 80, width: 200, height: 40, text: 'Hello World', fontSize: 32, fontWeight: 700, fill: '#ffffff', textAlign: 'center' },
    ],
    tracks: [
      { target: 'Title', property: 'opacity', keyframes: [
        { time: 0, value: 0 },
        { time: 800, value: 1, easing: 'ease-out' },
        { time: 1500, value: 1 },
      ]},
    ],
  },

  {
    id: 'text-slide-up',
    name: 'Text Slide Up',
    description: 'Text slides up while fading in',
    category: 'text',
    thumbnail: '⬆️',
    duration: 1200,
    elements: [
      { type: 'text', name: 'Text', x: 50, y: 90, width: 200, height: 40, text: 'Slide Up', fontSize: 28, fontWeight: 600, fill: '#4a9eff', textAlign: 'center' },
    ],
    tracks: [
      { target: 'Text', property: 'y', keyframes: [
        { time: 0, value: 40 },
        { time: 800, value: 0, easing: 'ease-out-cubic' },
      ]},
      { target: 'Text', property: 'opacity', keyframes: [
        { time: 0, value: 0 },
        { time: 600, value: 1, easing: 'ease-out' },
      ]},
    ],
  },

  {
    id: 'text-scale-in',
    name: 'Text Scale In',
    description: 'Text scales from small to normal',
    category: 'text',
    thumbnail: '🔍',
    duration: 1000,
    elements: [
      { type: 'text', name: 'Text', x: 50, y: 85, width: 200, height: 40, text: 'Scale In', fontSize: 32, fontWeight: 700, fill: '#2ecc71', textAlign: 'center' },
    ],
    tracks: [
      { target: 'Text', property: 'scale', keyframes: [
        { time: 0, value: 0 },
        { time: 600, value: 1.1, easing: 'ease-out' },
        { time: 1000, value: 1, easing: 'ease-in-out' },
      ]},
      { target: 'Text', property: 'opacity', keyframes: [
        { time: 0, value: 0 },
        { time: 400, value: 1, easing: 'ease-out' },
      ]},
    ],
  },

  {
    id: 'text-bounce-in',
    name: 'Text Bounce In',
    description: 'Text bounces in from above',
    category: 'text',
    thumbnail: '🏀',
    duration: 1500,
    elements: [
      { type: 'text', name: 'Text', x: 50, y: 90, width: 200, height: 40, text: 'Bounce!', fontSize: 36, fontWeight: 800, fill: '#f39c12', textAlign: 'center' },
    ],
    tracks: [
      { target: 'Text', property: 'y', keyframes: [
        { time: 0, value: -80 },
        { time: 400, value: 0, easing: 'ease-in' },
        { time: 550, value: -20, easing: 'ease-out' },
        { time: 700, value: 0, easing: 'ease-in' },
        { time: 800, value: -8, easing: 'ease-out' },
        { time: 900, value: 0, easing: 'ease-in' },
        { time: 1500, value: 0 },
      ]},
      { target: 'Text', property: 'scaleY', keyframes: [
        { time: 350, value: 1 },
        { time: 400, value: 0.8, easing: 'ease-out' },
        { time: 500, value: 1, easing: 'ease-out' },
        { time: 700, value: 0.9, easing: 'ease-out' },
        { time: 800, value: 1, easing: 'ease-out' },
      ]},
      { target: 'Text', property: 'opacity', keyframes: [
        { time: 0, value: 0 },
        { time: 200, value: 1, easing: 'ease-out' },
      ]},
    ],
  },

  {
    id: 'text-typewriter',
    name: 'Typewriter',
    description: 'Letters appear one by one',
    category: 'text',
    thumbnail: '⌨️',
    duration: 2500,
    elements: [
      { type: 'text', name: 'L1', x: 60, y: 90, width: 20, height: 30, text: 'T', fontSize: 24, fontWeight: 500, fill: '#ffffff', textAlign: 'left' },
      { type: 'text', name: 'L2', x: 75, y: 90, width: 20, height: 30, text: 'y', fontSize: 24, fontWeight: 500, fill: '#ffffff', textAlign: 'left' },
      { type: 'text', name: 'L3', x: 88, y: 90, width: 20, height: 30, text: 'p', fontSize: 24, fontWeight: 500, fill: '#ffffff', textAlign: 'left' },
      { type: 'text', name: 'L4', x: 102, y: 90, width: 20, height: 30, text: 'e', fontSize: 24, fontWeight: 500, fill: '#ffffff', textAlign: 'left' },
      { type: 'text', name: 'L5', x: 116, y: 90, width: 20, height: 30, text: 'w', fontSize: 24, fontWeight: 500, fill: '#ffffff', textAlign: 'left' },
      { type: 'text', name: 'L6', x: 134, y: 90, width: 20, height: 30, text: 'r', fontSize: 24, fontWeight: 500, fill: '#ffffff', textAlign: 'left' },
      { type: 'text', name: 'L7', x: 146, y: 90, width: 20, height: 30, text: 'i', fontSize: 24, fontWeight: 500, fill: '#ffffff', textAlign: 'left' },
      { type: 'text', name: 'L8', x: 154, y: 90, width: 20, height: 30, text: 't', fontSize: 24, fontWeight: 500, fill: '#ffffff', textAlign: 'left' },
      { type: 'text', name: 'L9', x: 166, y: 90, width: 20, height: 30, text: 'e', fontSize: 24, fontWeight: 500, fill: '#ffffff', textAlign: 'left' },
      { type: 'text', name: 'L10', x: 180, y: 90, width: 20, height: 30, text: 'r', fontSize: 24, fontWeight: 500, fill: '#ffffff', textAlign: 'left' },
      { type: 'rect', name: 'Cursor', x: 192, y: 88, width: 2, height: 28, fill: '#4a9eff' },
    ],
    tracks: [
      // Each letter fades in with stagger
      { target: 'L1', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 100, value: 0 }, { time: 150, value: 1 }] },
      { target: 'L2', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 0 }, { time: 250, value: 1 }] },
      { target: 'L3', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 300, value: 0 }, { time: 350, value: 1 }] },
      { target: 'L4', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 0 }, { time: 450, value: 1 }] },
      { target: 'L5', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 0 }, { time: 550, value: 1 }] },
      { target: 'L6', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 600, value: 0 }, { time: 650, value: 1 }] },
      { target: 'L7', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 700, value: 0 }, { time: 750, value: 1 }] },
      { target: 'L8', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 800, value: 0 }, { time: 850, value: 1 }] },
      { target: 'L9', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 900, value: 0 }, { time: 950, value: 1 }] },
      { target: 'L10', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 0 }, { time: 1050, value: 1 }] },
      // Cursor moves with each letter
      { target: 'Cursor', property: 'x', keyframes: [
        { time: 0, value: -132 }, { time: 150, value: -117 }, { time: 250, value: -104 }, { time: 350, value: -90 },
        { time: 450, value: -76 }, { time: 550, value: -58 }, { time: 650, value: -46 }, { time: 750, value: -38 },
        { time: 850, value: -26 }, { time: 950, value: -12 }, { time: 1050, value: 0 },
      ]},
      // Cursor blinks
      { target: 'Cursor', property: 'opacity', keyframes: [
        { time: 1200, value: 1 }, { time: 1400, value: 0 }, { time: 1600, value: 1 }, { time: 1800, value: 0 },
        { time: 2000, value: 1 }, { time: 2200, value: 0 }, { time: 2400, value: 1 },
      ]},
    ],
  },

  {
    id: 'text-wave',
    name: 'Text Wave',
    description: 'Letters move in a wave pattern',
    category: 'text',
    thumbnail: '🌊',
    duration: 2000,
    elements: [
      { type: 'text', name: 'W1', x: 70, y: 90, width: 25, height: 30, text: 'W', fontSize: 28, fontWeight: 700, fill: '#3498db', textAlign: 'center' },
      { type: 'text', name: 'W2', x: 95, y: 90, width: 25, height: 30, text: 'A', fontSize: 28, fontWeight: 700, fill: '#3498db', textAlign: 'center' },
      { type: 'text', name: 'W3', x: 120, y: 90, width: 25, height: 30, text: 'V', fontSize: 28, fontWeight: 700, fill: '#3498db', textAlign: 'center' },
      { type: 'text', name: 'W4', x: 145, y: 90, width: 25, height: 30, text: 'E', fontSize: 28, fontWeight: 700, fill: '#3498db', textAlign: 'center' },
      { type: 'text', name: 'W5', x: 170, y: 90, width: 25, height: 30, text: '!', fontSize: 28, fontWeight: 700, fill: '#3498db', textAlign: 'center' },
    ],
    tracks: [
      // Each letter waves with phase offset
      { target: 'W1', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 250, value: -20, easing: 'ease-out' }, { time: 500, value: 0, easing: 'ease-in' }, { time: 750, value: -20, easing: 'ease-out' }, { time: 1000, value: 0, easing: 'ease-in' }, { time: 1250, value: -20, easing: 'ease-out' }, { time: 1500, value: 0, easing: 'ease-in' }, { time: 2000, value: 0 }] },
      { target: 'W2', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 100, value: 0 }, { time: 350, value: -20, easing: 'ease-out' }, { time: 600, value: 0, easing: 'ease-in' }, { time: 850, value: -20, easing: 'ease-out' }, { time: 1100, value: 0, easing: 'ease-in' }, { time: 1350, value: -20, easing: 'ease-out' }, { time: 1600, value: 0, easing: 'ease-in' }, { time: 2000, value: 0 }] },
      { target: 'W3', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 0 }, { time: 450, value: -20, easing: 'ease-out' }, { time: 700, value: 0, easing: 'ease-in' }, { time: 950, value: -20, easing: 'ease-out' }, { time: 1200, value: 0, easing: 'ease-in' }, { time: 1450, value: -20, easing: 'ease-out' }, { time: 1700, value: 0, easing: 'ease-in' }, { time: 2000, value: 0 }] },
      { target: 'W4', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 300, value: 0 }, { time: 550, value: -20, easing: 'ease-out' }, { time: 800, value: 0, easing: 'ease-in' }, { time: 1050, value: -20, easing: 'ease-out' }, { time: 1300, value: 0, easing: 'ease-in' }, { time: 1550, value: -20, easing: 'ease-out' }, { time: 1800, value: 0, easing: 'ease-in' }, { time: 2000, value: 0 }] },
      { target: 'W5', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 0 }, { time: 650, value: -20, easing: 'ease-out' }, { time: 900, value: 0, easing: 'ease-in' }, { time: 1150, value: -20, easing: 'ease-out' }, { time: 1400, value: 0, easing: 'ease-in' }, { time: 1650, value: -20, easing: 'ease-out' }, { time: 1900, value: 0, easing: 'ease-in' }, { time: 2000, value: 0 }] },
    ],
  },

  {
    id: 'text-rotate-in',
    name: 'Text Rotate In',
    description: 'Text rotates while appearing',
    category: 'text',
    thumbnail: '🔄',
    duration: 1200,
    elements: [
      { type: 'text', name: 'Text', x: 50, y: 85, width: 200, height: 40, text: 'Rotate In', fontSize: 32, fontWeight: 700, fill: '#9b59b6', textAlign: 'center' },
    ],
    tracks: [
      { target: 'Text', property: 'rotate', keyframes: [
        { time: 0, value: -180 },
        { time: 800, value: 10, easing: 'ease-out' },
        { time: 1200, value: 0, easing: 'ease-in-out' },
      ]},
      { target: 'Text', property: 'scale', keyframes: [
        { time: 0, value: 0 },
        { time: 800, value: 1, easing: 'ease-out' },
      ]},
      { target: 'Text', property: 'opacity', keyframes: [
        { time: 0, value: 0 },
        { time: 400, value: 1, easing: 'ease-out' },
      ]},
    ],
  },

  {
    id: 'text-glitch',
    name: 'Text Glitch',
    description: 'Text with glitch effect',
    category: 'text',
    thumbnail: '⚡',
    duration: 2000,
    elements: [
      { type: 'text', name: 'Text', x: 50, y: 80, width: 200, height: 40, text: 'GLITCH', fontSize: 36, fontWeight: 800, fill: '#e74c3c', textAlign: 'center' },
      { type: 'text', name: 'Shadow1', x: 50, y: 80, width: 200, height: 40, text: 'GLITCH', fontSize: 36, fontWeight: 800, fill: '#00ffff', textAlign: 'center' },
      { type: 'text', name: 'Shadow2', x: 50, y: 80, width: 200, height: 40, text: 'GLITCH', fontSize: 36, fontWeight: 800, fill: '#ff00ff', textAlign: 'center' },
    ],
    tracks: [
      // Cyan shadow glitches left
      { target: 'Shadow1', property: 'x', keyframes: [
        { time: 0, value: 0 }, { time: 100, value: -4 }, { time: 150, value: 0 }, { time: 500, value: 0 },
        { time: 550, value: -6 }, { time: 600, value: 0 }, { time: 1000, value: 0 },
        { time: 1050, value: -3 }, { time: 1100, value: 0 }, { time: 1500, value: 0 },
        { time: 1550, value: -5 }, { time: 1600, value: 0 }, { time: 2000, value: 0 },
      ]},
      { target: 'Shadow1', property: 'opacity', keyframes: [
        { time: 0, value: 0.5 }, { time: 100, value: 0.8 }, { time: 150, value: 0.5 },
        { time: 500, value: 0.5 }, { time: 550, value: 0.8 }, { time: 600, value: 0.5 },
      ]},
      // Magenta shadow glitches right
      { target: 'Shadow2', property: 'x', keyframes: [
        { time: 0, value: 0 }, { time: 100, value: 4 }, { time: 150, value: 0 }, { time: 500, value: 0 },
        { time: 550, value: 6 }, { time: 600, value: 0 }, { time: 1000, value: 0 },
        { time: 1050, value: 3 }, { time: 1100, value: 0 }, { time: 1500, value: 0 },
        { time: 1550, value: 5 }, { time: 1600, value: 0 }, { time: 2000, value: 0 },
      ]},
      { target: 'Shadow2', property: 'opacity', keyframes: [
        { time: 0, value: 0.5 }, { time: 100, value: 0.8 }, { time: 150, value: 0.5 },
        { time: 500, value: 0.5 }, { time: 550, value: 0.8 }, { time: 600, value: 0.5 },
      ]},
      // Main text slight shake
      { target: 'Text', property: 'x', keyframes: [
        { time: 0, value: 0 }, { time: 100, value: 2 }, { time: 150, value: -1 }, { time: 200, value: 0 },
        { time: 500, value: 0 }, { time: 550, value: -2 }, { time: 600, value: 1 }, { time: 650, value: 0 },
      ]},
    ],
  },

  {
    id: 'text-highlight',
    name: 'Text Highlight',
    description: 'Text with animated highlight',
    category: 'text',
    thumbnail: '✨',
    duration: 2000,
    elements: [
      { type: 'rect', name: 'Highlight', x: 60, y: 82, width: 0, height: 30, fill: '#f39c12', borderRadius: 4 },
      { type: 'text', name: 'Text', x: 50, y: 85, width: 200, height: 40, text: 'Highlight Me', fontSize: 24, fontWeight: 600, fill: '#ffffff', textAlign: 'center' },
    ],
    tracks: [
      // Highlight expands behind text
      { target: 'Highlight', property: 'width', keyframes: [
        { time: 0, value: 0 },
        { time: 800, value: 180, easing: 'ease-out' },
        { time: 2000, value: 180 },
      ]},
      { target: 'Highlight', property: 'x', keyframes: [
        { time: 0, value: 0 },
        { time: 800, value: 0, easing: 'ease-out' },
      ]},
      { target: 'Highlight', property: 'opacity', keyframes: [
        { time: 0, value: 0 },
        { time: 200, value: 0.8, easing: 'ease-out' },
        { time: 1500, value: 0.8 },
        { time: 2000, value: 0, easing: 'ease-in' },
      ]},
      // Text fades in
      { target: 'Text', property: 'opacity', keyframes: [
        { time: 0, value: 0 },
        { time: 400, value: 1, easing: 'ease-out' },
      ]},
    ],
  },

  {
    id: 'text-zoom-blur',
    name: 'Text Zoom Out',
    description: 'Text zooms out and fades',
    category: 'text',
    thumbnail: '🔭',
    duration: 1500,
    elements: [
      { type: 'text', name: 'Text', x: 50, y: 85, width: 200, height: 40, text: 'ZOOM', fontSize: 48, fontWeight: 900, fill: '#1abc9c', textAlign: 'center' },
    ],
    tracks: [
      { target: 'Text', property: 'scale', keyframes: [
        { time: 0, value: 3 },
        { time: 600, value: 1, easing: 'ease-out' },
        { time: 1000, value: 1 },
        { time: 1500, value: 0.8, easing: 'ease-in' },
      ]},
      { target: 'Text', property: 'opacity', keyframes: [
        { time: 0, value: 0 },
        { time: 400, value: 1, easing: 'ease-out' },
        { time: 1000, value: 1 },
        { time: 1500, value: 0, easing: 'ease-in' },
      ]},
    ],
  },

  {
    id: 'text-color-cycle',
    name: 'Color Cycle Text',
    description: 'Text cycles through colors',
    category: 'text',
    thumbnail: '🌈',
    duration: 3000,
    elements: [
      { type: 'text', name: 'Text', x: 50, y: 80, width: 200, height: 40, text: 'COLORFUL', fontSize: 32, fontWeight: 800, fill: '#e74c3c', textAlign: 'center' },
    ],
    tracks: [
      { target: 'Text', property: 'fill', keyframes: [
        { time: 0, value: '#e74c3c' },
        { time: 500, value: '#f39c12', easing: 'ease-in-out' },
        { time: 1000, value: '#2ecc71', easing: 'ease-in-out' },
        { time: 1500, value: '#3498db', easing: 'ease-in-out' },
        { time: 2000, value: '#9b59b6', easing: 'ease-in-out' },
        { time: 2500, value: '#e91e63', easing: 'ease-in-out' },
        { time: 3000, value: '#e74c3c', easing: 'ease-in-out' },
      ]},
      { target: 'Text', property: 'scale', keyframes: [
        { time: 0, value: 1 },
        { time: 750, value: 1.1, easing: 'ease-in-out' },
        { time: 1500, value: 1, easing: 'ease-in-out' },
        { time: 2250, value: 1.1, easing: 'ease-in-out' },
        { time: 3000, value: 1, easing: 'ease-in-out' },
      ]},
    ],
  },

  {
    id: 'text-stagger-in',
    name: 'Stagger In',
    description: 'Words appear one by one',
    category: 'text',
    thumbnail: '📚',
    duration: 2000,
    elements: [
      { type: 'text', name: 'Word1', x: 30, y: 85, width: 80, height: 30, text: 'Ready', fontSize: 24, fontWeight: 600, fill: '#e74c3c', textAlign: 'center' },
      { type: 'text', name: 'Word2', x: 110, y: 85, width: 80, height: 30, text: 'Set', fontSize: 24, fontWeight: 600, fill: '#f39c12', textAlign: 'center' },
      { type: 'text', name: 'Word3', x: 190, y: 85, width: 80, height: 30, text: 'Go!', fontSize: 24, fontWeight: 600, fill: '#2ecc71', textAlign: 'center' },
    ],
    tracks: [
      // Word 1 - slides in from left
      { target: 'Word1', property: 'x', keyframes: [{ time: 0, value: -50 }, { time: 400, value: 0, easing: 'ease-out-cubic' }] },
      { target: 'Word1', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 300, value: 1, easing: 'ease-out' }] },
      // Word 2 - scales in
      { target: 'Word2', property: 'scale', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 0 }, { time: 800, value: 1.2, easing: 'ease-out' }, { time: 1000, value: 1, easing: 'ease-in-out' }] },
      { target: 'Word2', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 0 }, { time: 600, value: 1, easing: 'ease-out' }] },
      // Word 3 - bounces in
      { target: 'Word3', property: 'y', keyframes: [{ time: 0, value: -60 }, { time: 800, value: -60 }, { time: 1200, value: 0, easing: 'ease-in' }, { time: 1350, value: -15, easing: 'ease-out' }, { time: 1500, value: 0, easing: 'ease-in' }] },
      { target: 'Word3', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 800, value: 0 }, { time: 1000, value: 1, easing: 'ease-out' }] },
      { target: 'Word3', property: 'scale', keyframes: [{ time: 1150, value: 1 }, { time: 1200, value: 1.3, easing: 'ease-out' }, { time: 1400, value: 1, easing: 'ease-in-out' }] },
    ],
  },

  // === UI ===
  {
    id: 'loading-spinner',
    name: 'Loading Spinner',
    description: 'Rotating loading indicator',
    category: 'ui',
    thumbnail: '⏳',
    duration: 1000,
    elements: [
      {
        type: 'circle',
        name: 'Spinner',
        x: 120,
        y: 70,
        width: 50,
        height: 50,
        fill: 'transparent',
        stroke: '#4a9eff',
        strokeWidth: 4,
      },
      {
        type: 'circle',
        name: 'Dot',
        x: 120,
        y: 50,
        width: 12,
        height: 12,
        fill: '#4a9eff',
      },
    ],
    tracks: [
      // Orbit the Dot around the Spinner center (120, 70) with radius 20
      // Using 8 keyframes for smooth circular motion
      {
        target: 'Dot',
        property: 'x',
        keyframes: [
          { time: 0, value: 0 },
          { time: 125, value: 14, easing: 'linear' },
          { time: 250, value: 20, easing: 'linear' },
          { time: 375, value: 14, easing: 'linear' },
          { time: 500, value: 0, easing: 'linear' },
          { time: 625, value: -14, easing: 'linear' },
          { time: 750, value: -20, easing: 'linear' },
          { time: 875, value: -14, easing: 'linear' },
          { time: 1000, value: 0, easing: 'linear' },
        ],
      },
      {
        target: 'Dot',
        property: 'y',
        keyframes: [
          { time: 0, value: 0 },
          { time: 125, value: 6, easing: 'linear' },
          { time: 250, value: 20, easing: 'linear' },
          { time: 375, value: 34, easing: 'linear' },
          { time: 500, value: 40, easing: 'linear' },
          { time: 625, value: 34, easing: 'linear' },
          { time: 750, value: 20, easing: 'linear' },
          { time: 875, value: 6, easing: 'linear' },
          { time: 1000, value: 0, easing: 'linear' },
        ],
      },
    ],
  },

  {
    id: 'button-press',
    name: 'Button Press',
    description: 'Button click feedback',
    category: 'ui',
    thumbnail: '🔘',
    duration: 500,
    elements: [
      {
        type: 'rect',
        name: 'Button',
        x: 100,
        y: 70,
        width: 100,
        height: 40,
        fill: '#2ecc71',
        borderRadius: 8,
      },
      {
        type: 'text',
        name: 'Label',
        x: 100,
        y: 75,
        width: 100,
        height: 30,
        text: 'Click',
        fontSize: 16,
        fontWeight: 600,
        fill: '#ffffff',
        textAlign: 'center',
      },
    ],
    tracks: [
      {
        target: 'Button',
        property: 'scale',
        keyframes: [
          { time: 0, value: 1 },
          { time: 150, value: 0.95, easing: 'ease-out' },
          { time: 500, value: 1, easing: 'ease-out' },
        ],
      },
      {
        target: 'Label',
        property: 'scale',
        keyframes: [
          { time: 0, value: 1 },
          { time: 150, value: 0.95, easing: 'ease-out' },
          { time: 500, value: 1, easing: 'ease-out' },
        ],
      },
    ],
  },

  {
    id: 'notification',
    name: 'Notification',
    description: 'Toast notification appear',
    category: 'ui',
    thumbnail: '🔔',
    duration: 3000,
    elements: [
      {
        type: 'rect',
        name: 'Toast',
        x: 75,
        y: 140,
        width: 150,
        height: 40,
        fill: '#34495e',
        borderRadius: 8,
      },
      {
        type: 'text',
        name: 'Message',
        x: 75,
        y: 150,
        width: 150,
        height: 20,
        text: 'Notification!',
        fontSize: 14,
        fill: '#ffffff',
        textAlign: 'center',
      },
    ],
    tracks: [
      {
        target: 'Toast',
        property: 'y',
        keyframes: [
          { time: 0, value: 60 },
          { time: 300, value: 0, easing: 'ease-out-cubic' },
          { time: 2700, value: 0 },
          { time: 3000, value: 60, easing: 'ease-in' },
        ],
      },
      {
        target: 'Message',
        property: 'y',
        keyframes: [
          { time: 0, value: 60 },
          { time: 300, value: 0, easing: 'ease-out-cubic' },
          { time: 2700, value: 0 },
          { time: 3000, value: 60, easing: 'ease-in' },
        ],
      },
      {
        target: 'Toast',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 300, value: 1, easing: 'ease-out' },
          { time: 2700, value: 1 },
          { time: 3000, value: 0, easing: 'ease-in' },
        ],
      },
      {
        target: 'Message',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 300, value: 1, easing: 'ease-out' },
          { time: 2700, value: 1 },
          { time: 3000, value: 0, easing: 'ease-in' },
        ],
      },
    ],
  },

  {
    id: 'toggle-switch',
    name: 'Toggle Switch',
    description: 'On/off toggle animation',
    category: 'ui',
    thumbnail: '🔘',
    duration: 1500,
    elements: [
      { type: 'rect', name: 'Track', x: 100, y: 80, width: 80, height: 40, fill: '#95a5a6', borderRadius: 20 },
      { type: 'circle', name: 'Knob', x: 105, y: 85, width: 30, height: 30, fill: '#ffffff' },
    ],
    tracks: [
      { target: 'Track', property: 'fill', keyframes: [
        { time: 0, value: '#95a5a6' },
        { time: 400, value: '#2ecc71', easing: 'ease-out' },
        { time: 1100, value: '#2ecc71' },
        { time: 1500, value: '#95a5a6', easing: 'ease-out' },
      ]},
      { target: 'Knob', property: 'x', keyframes: [
        { time: 0, value: 0 },
        { time: 400, value: 45, easing: 'ease-out' },
        { time: 1100, value: 45 },
        { time: 1500, value: 0, easing: 'ease-out' },
      ]},
      { target: 'Knob', property: 'scale', keyframes: [
        { time: 0, value: 1 },
        { time: 200, value: 0.9, easing: 'ease-out' },
        { time: 400, value: 1, easing: 'ease-out' },
        { time: 1100, value: 1 },
        { time: 1300, value: 0.9, easing: 'ease-out' },
        { time: 1500, value: 1, easing: 'ease-out' },
      ]},
    ],
  },

  {
    id: 'progress-bar',
    name: 'Progress Bar',
    description: 'Loading progress animation',
    category: 'ui',
    thumbnail: '📊',
    duration: 2000,
    elements: [
      { type: 'text', name: 'Label', x: 100, y: 55, width: 100, height: 30, text: 'Loading...', fontSize: 14, fontWeight: 500, fill: '#95a5a6', textAlign: 'center' },
      { type: 'rect', name: 'Background', x: 50, y: 90, width: 200, height: 20, fill: '#2c3e50', borderRadius: 10 },
      { type: 'rect', name: 'Fill', x: 50, y: 90, width: 10, height: 20, fill: '#3498db', borderRadius: 10 },
    ],
    tracks: [
      { target: 'Fill', property: 'width', keyframes: [
        { time: 0, value: 10 },
        { time: 500, value: 60, easing: 'ease-out' },
        { time: 1000, value: 120, easing: 'ease-out' },
        { time: 1500, value: 160, easing: 'ease-out' },
        { time: 2000, value: 200, easing: 'ease-out' },
      ]},
      { target: 'Fill', property: 'fill', keyframes: [
        { time: 0, value: '#3498db' },
        { time: 1500, value: '#2ecc71', easing: 'ease-in-out' },
      ]},
      // Label fades out when complete
      { target: 'Label', property: 'opacity', keyframes: [
        { time: 0, value: 1 },
        { time: 1800, value: 1 },
        { time: 2000, value: 0, easing: 'ease-out' },
      ]},
    ],
  },

  {
    id: 'skeleton-loader',
    name: 'Skeleton Loader',
    description: 'Content placeholder shimmer',
    category: 'ui',
    thumbnail: '💀',
    duration: 1500,
    elements: [
      { type: 'rect', name: 'Avatar', x: 30, y: 40, width: 50, height: 50, fill: '#3a3a3a', borderRadius: 25 },
      { type: 'rect', name: 'Line1', x: 90, y: 45, width: 150, height: 14, fill: '#3a3a3a', borderRadius: 4 },
      { type: 'rect', name: 'Line2', x: 90, y: 65, width: 100, height: 14, fill: '#3a3a3a', borderRadius: 4 },
      { type: 'rect', name: 'Content', x: 30, y: 110, width: 240, height: 60, fill: '#3a3a3a', borderRadius: 8 },
    ],
    tracks: [
      // Shimmer effect via opacity pulse
      { target: 'Avatar', property: 'opacity', keyframes: [{ time: 0, value: 0.5 }, { time: 750, value: 1, easing: 'ease-in-out' }, { time: 1500, value: 0.5, easing: 'ease-in-out' }] },
      { target: 'Line1', property: 'opacity', keyframes: [{ time: 0, value: 0.5 }, { time: 750, value: 1, easing: 'ease-in-out' }, { time: 1500, value: 0.5, easing: 'ease-in-out' }] },
      { target: 'Line2', property: 'opacity', keyframes: [{ time: 0, value: 0.5 }, { time: 750, value: 1, easing: 'ease-in-out' }, { time: 1500, value: 0.5, easing: 'ease-in-out' }] },
      { target: 'Content', property: 'opacity', keyframes: [{ time: 0, value: 0.5 }, { time: 750, value: 1, easing: 'ease-in-out' }, { time: 1500, value: 0.5, easing: 'ease-in-out' }] },
    ],
  },

  {
    id: 'typing-indicator',
    name: 'Typing Indicator',
    description: 'Chat typing dots animation',
    category: 'ui',
    thumbnail: '💬',
    duration: 1200,
    elements: [
      { type: 'rect', name: 'Bubble', x: 100, y: 70, width: 80, height: 50, fill: '#34495e', borderRadius: 25 },
      { type: 'circle', name: 'Dot1', x: 115, y: 85, width: 12, height: 12, fill: '#95a5a6' },
      { type: 'circle', name: 'Dot2', x: 135, y: 85, width: 12, height: 12, fill: '#95a5a6' },
      { type: 'circle', name: 'Dot3', x: 155, y: 85, width: 12, height: 12, fill: '#95a5a6' },
    ],
    tracks: [
      { target: 'Dot1', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 200, value: -10, easing: 'ease-out' }, { time: 400, value: 0, easing: 'ease-in' }, { time: 1200, value: 0 }] },
      { target: 'Dot1', property: 'opacity', keyframes: [{ time: 0, value: 0.5 }, { time: 200, value: 1, easing: 'ease-out' }, { time: 400, value: 0.5, easing: 'ease-in' }] },
      { target: 'Dot2', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 0 }, { time: 400, value: -10, easing: 'ease-out' }, { time: 600, value: 0, easing: 'ease-in' }, { time: 1200, value: 0 }] },
      { target: 'Dot2', property: 'opacity', keyframes: [{ time: 200, value: 0.5 }, { time: 400, value: 1, easing: 'ease-out' }, { time: 600, value: 0.5, easing: 'ease-in' }] },
      { target: 'Dot3', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 0 }, { time: 600, value: -10, easing: 'ease-out' }, { time: 800, value: 0, easing: 'ease-in' }, { time: 1200, value: 0 }] },
      { target: 'Dot3', property: 'opacity', keyframes: [{ time: 400, value: 0.5 }, { time: 600, value: 1, easing: 'ease-out' }, { time: 800, value: 0.5, easing: 'ease-in' }] },
    ],
  },

  // === EFFECTS ===
  {
    id: 'color-morph',
    name: 'Color Morph',
    description: 'Smooth color transition',
    category: 'effects',
    thumbnail: '🎨',
    duration: 3000,
    elements: [
      {
        type: 'circle',
        name: 'Blob',
        x: 110,
        y: 60,
        width: 80,
        height: 80,
        fill: '#e74c3c',
      },
    ],
    tracks: [
      {
        target: 'Blob',
        property: 'fill',
        keyframes: [
          { time: 0, value: '#e74c3c' },
          { time: 750, value: '#f39c12', easing: 'ease-in-out' },
          { time: 1500, value: '#2ecc71', easing: 'ease-in-out' },
          { time: 2250, value: '#3498db', easing: 'ease-in-out' },
          { time: 3000, value: '#e74c3c', easing: 'ease-in-out' },
        ],
      },
    ],
  },

  {
    id: 'particle-burst',
    name: 'Particle Burst',
    description: 'Particles exploding outward',
    category: 'effects',
    thumbnail: '💥',
    duration: 1500,
    elements: [
      { type: 'circle', name: 'P1', x: 140, y: 90, width: 12, height: 12, fill: '#e74c3c' },
      { type: 'circle', name: 'P2', x: 140, y: 90, width: 12, height: 12, fill: '#f39c12' },
      { type: 'circle', name: 'P3', x: 140, y: 90, width: 12, height: 12, fill: '#2ecc71' },
      { type: 'circle', name: 'P4', x: 140, y: 90, width: 12, height: 12, fill: '#3498db' },
      { type: 'circle', name: 'P5', x: 140, y: 90, width: 12, height: 12, fill: '#9b59b6' },
      { type: 'circle', name: 'P6', x: 140, y: 90, width: 12, height: 12, fill: '#1abc9c' },
    ],
    tracks: [
      // P1 - up
      { target: 'P1', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 500, value: -70, easing: 'ease-out' }, { time: 1500, value: -70 }] },
      { target: 'P1', property: 'opacity', keyframes: [{ time: 0, value: 1 }, { time: 1000, value: 1 }, { time: 1500, value: 0, easing: 'ease-in' }] },
      { target: 'P1', property: 'scale', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 1, easing: 'ease-out' }, { time: 1500, value: 0.5 }] },
      // P2 - up-right
      { target: 'P2', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 50, easing: 'ease-out' }] },
      { target: 'P2', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 500, value: -50, easing: 'ease-out' }] },
      { target: 'P2', property: 'opacity', keyframes: [{ time: 0, value: 1 }, { time: 1000, value: 1 }, { time: 1500, value: 0 }] },
      { target: 'P2', property: 'scale', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 1, easing: 'ease-out' }] },
      // P3 - right
      { target: 'P3', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 70, easing: 'ease-out' }] },
      { target: 'P3', property: 'opacity', keyframes: [{ time: 0, value: 1 }, { time: 1000, value: 1 }, { time: 1500, value: 0 }] },
      { target: 'P3', property: 'scale', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 1, easing: 'ease-out' }] },
      // P4 - down-right
      { target: 'P4', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 50, easing: 'ease-out' }] },
      { target: 'P4', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 50, easing: 'ease-out' }] },
      { target: 'P4', property: 'opacity', keyframes: [{ time: 0, value: 1 }, { time: 1000, value: 1 }, { time: 1500, value: 0 }] },
      { target: 'P4', property: 'scale', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 1, easing: 'ease-out' }] },
      // P5 - down
      { target: 'P5', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 70, easing: 'ease-out' }] },
      { target: 'P5', property: 'opacity', keyframes: [{ time: 0, value: 1 }, { time: 1000, value: 1 }, { time: 1500, value: 0 }] },
      { target: 'P5', property: 'scale', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 1, easing: 'ease-out' }] },
      // P6 - left
      { target: 'P6', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 500, value: -70, easing: 'ease-out' }] },
      { target: 'P6', property: 'opacity', keyframes: [{ time: 0, value: 1 }, { time: 1000, value: 1 }, { time: 1500, value: 0 }] },
      { target: 'P6', property: 'scale', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 1, easing: 'ease-out' }] },
    ],
  },

  {
    id: 'ripple',
    name: 'Ripple Effect',
    description: 'Expanding ripple circles',
    category: 'effects',
    thumbnail: '🔵',
    duration: 2000,
    elements: [
      { type: 'circle', name: 'R1', x: 125, y: 75, width: 10, height: 10, fill: 'transparent', stroke: '#3498db', strokeWidth: 3 },
      { type: 'circle', name: 'R2', x: 125, y: 75, width: 10, height: 10, fill: 'transparent', stroke: '#3498db', strokeWidth: 3 },
      { type: 'circle', name: 'R3', x: 125, y: 75, width: 10, height: 10, fill: 'transparent', stroke: '#3498db', strokeWidth: 3 },
      { type: 'circle', name: 'Center', x: 135, y: 85, width: 30, height: 30, fill: '#3498db' },
    ],
    tracks: [
      // Ring 1
      { target: 'R1', property: 'scale', keyframes: [{ time: 0, value: 1 }, { time: 1500, value: 8, easing: 'ease-out' }, { time: 2000, value: 8 }] },
      { target: 'R1', property: 'opacity', keyframes: [{ time: 0, value: 1 }, { time: 1500, value: 0, easing: 'ease-out' }] },
      // Ring 2 (delayed)
      { target: 'R2', property: 'scale', keyframes: [{ time: 0, value: 1 }, { time: 300, value: 1 }, { time: 1800, value: 8, easing: 'ease-out' }, { time: 2000, value: 8 }] },
      { target: 'R2', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 300, value: 1 }, { time: 1800, value: 0, easing: 'ease-out' }] },
      // Ring 3 (more delayed)
      { target: 'R3', property: 'scale', keyframes: [{ time: 0, value: 1 }, { time: 600, value: 1 }, { time: 2000, value: 7, easing: 'ease-out' }] },
      { target: 'R3', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 600, value: 1 }, { time: 2000, value: 0, easing: 'ease-out' }] },
      // Center pulse
      { target: 'Center', property: 'scale', keyframes: [{ time: 0, value: 1 }, { time: 100, value: 0.8, easing: 'ease-out' }, { time: 300, value: 1, easing: 'ease-out' }] },
    ],
  },

  {
    id: 'confetti',
    name: 'Confetti',
    description: 'Celebration confetti burst',
    category: 'effects',
    thumbnail: '🎊',
    duration: 2000,
    elements: [
      { type: 'rect', name: 'C1', x: 140, y: 80, width: 10, height: 10, fill: '#e74c3c', borderRadius: 2 },
      { type: 'rect', name: 'C2', x: 140, y: 80, width: 10, height: 10, fill: '#f39c12', borderRadius: 2 },
      { type: 'rect', name: 'C3', x: 140, y: 80, width: 10, height: 10, fill: '#2ecc71', borderRadius: 2 },
      { type: 'rect', name: 'C4', x: 140, y: 80, width: 10, height: 10, fill: '#3498db', borderRadius: 2 },
      { type: 'rect', name: 'C5', x: 140, y: 80, width: 10, height: 10, fill: '#9b59b6', borderRadius: 2 },
      { type: 'rect', name: 'C6', x: 140, y: 80, width: 10, height: 10, fill: '#1abc9c', borderRadius: 2 },
      { type: 'rect', name: 'C7', x: 140, y: 80, width: 10, height: 10, fill: '#e91e63', borderRadius: 2 },
      { type: 'rect', name: 'C8', x: 140, y: 80, width: 10, height: 10, fill: '#00bcd4', borderRadius: 2 },
    ],
    tracks: [
      // C1 - up left
      { target: 'C1', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 600, value: -80, easing: 'ease-out' }, { time: 2000, value: -80 }] },
      { target: 'C1', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 400, value: -60, easing: 'ease-out' }, { time: 2000, value: 100, easing: 'ease-in' }] },
      { target: 'C1', property: 'rotate', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: 720, easing: 'linear' }] },
      { target: 'C1', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 100, value: 1 }, { time: 1500, value: 1 }, { time: 2000, value: 0 }] },
      // C2 - up
      { target: 'C2', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 500, value: -80, easing: 'ease-out' }, { time: 2000, value: 80, easing: 'ease-in' }] },
      { target: 'C2', property: 'rotate', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: -540, easing: 'linear' }] },
      { target: 'C2', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 100, value: 1 }, { time: 1500, value: 1 }, { time: 2000, value: 0 }] },
      // C3 - up right
      { target: 'C3', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 600, value: 80, easing: 'ease-out' }, { time: 2000, value: 80 }] },
      { target: 'C3', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 400, value: -70, easing: 'ease-out' }, { time: 2000, value: 90, easing: 'ease-in' }] },
      { target: 'C3', property: 'rotate', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: 600, easing: 'linear' }] },
      { target: 'C3', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 100, value: 1 }, { time: 1500, value: 1 }, { time: 2000, value: 0 }] },
      // C4 - left
      { target: 'C4', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 700, value: -100, easing: 'ease-out' }, { time: 2000, value: -100 }] },
      { target: 'C4', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 300, value: -20, easing: 'ease-out' }, { time: 2000, value: 70, easing: 'ease-in' }] },
      { target: 'C4', property: 'rotate', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: -480, easing: 'linear' }] },
      { target: 'C4', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 100, value: 1 }, { time: 1500, value: 1 }, { time: 2000, value: 0 }] },
      // C5 - right
      { target: 'C5', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 700, value: 100, easing: 'ease-out' }, { time: 2000, value: 100 }] },
      { target: 'C5', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 300, value: -30, easing: 'ease-out' }, { time: 2000, value: 60, easing: 'ease-in' }] },
      { target: 'C5', property: 'rotate', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: 540, easing: 'linear' }] },
      { target: 'C5', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 100, value: 1 }, { time: 1500, value: 1 }, { time: 2000, value: 0 }] },
      // C6 - diagonal left
      { target: 'C6', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 600, value: -60, easing: 'ease-out' }, { time: 2000, value: -60 }] },
      { target: 'C6', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 350, value: -50, easing: 'ease-out' }, { time: 2000, value: 85, easing: 'ease-in' }] },
      { target: 'C6', property: 'rotate', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: -660, easing: 'linear' }] },
      { target: 'C6', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 100, value: 1 }, { time: 1500, value: 1 }, { time: 2000, value: 0 }] },
      // C7 - diagonal right
      { target: 'C7', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 600, value: 60, easing: 'ease-out' }, { time: 2000, value: 60 }] },
      { target: 'C7', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 350, value: -55, easing: 'ease-out' }, { time: 2000, value: 75, easing: 'ease-in' }] },
      { target: 'C7', property: 'rotate', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: 580, easing: 'linear' }] },
      { target: 'C7', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 100, value: 1 }, { time: 1500, value: 1 }, { time: 2000, value: 0 }] },
      // C8 - slight up
      { target: 'C8', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 600, value: 20, easing: 'ease-out' }, { time: 2000, value: 20 }] },
      { target: 'C8', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 450, value: -90, easing: 'ease-out' }, { time: 2000, value: 60, easing: 'ease-in' }] },
      { target: 'C8', property: 'rotate', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: -500, easing: 'linear' }] },
      { target: 'C8', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 100, value: 1 }, { time: 1500, value: 1 }, { time: 2000, value: 0 }] },
    ],
  },

  {
    id: 'starburst',
    name: 'Starburst',
    description: 'Radiating star lines',
    category: 'effects',
    thumbnail: '⭐',
    duration: 1500,
    elements: [
      { type: 'line', name: 'Ray1', x: 150, y: 100, x2: 150, y2: 100, stroke: '#f1c40f', strokeWidth: 3 },
      { type: 'line', name: 'Ray2', x: 150, y: 100, x2: 150, y2: 100, stroke: '#f1c40f', strokeWidth: 3 },
      { type: 'line', name: 'Ray3', x: 150, y: 100, x2: 150, y2: 100, stroke: '#f1c40f', strokeWidth: 3 },
      { type: 'line', name: 'Ray4', x: 150, y: 100, x2: 150, y2: 100, stroke: '#f1c40f', strokeWidth: 3 },
      { type: 'line', name: 'Ray5', x: 150, y: 100, x2: 150, y2: 100, stroke: '#f1c40f', strokeWidth: 3 },
      { type: 'line', name: 'Ray6', x: 150, y: 100, x2: 150, y2: 100, stroke: '#f1c40f', strokeWidth: 3 },
      { type: 'circle', name: 'Core', x: 135, y: 85, width: 30, height: 30, fill: '#f1c40f' },
    ],
    tracks: [
      // Ray animations - extend outward then fade
      // Ray1 - up
      { target: 'Ray1', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 500, value: -60, easing: 'ease-out' }, { time: 1500, value: -60 }] },
      { target: 'Ray1', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 1, easing: 'ease-out' }, { time: 1000, value: 1 }, { time: 1500, value: 0, easing: 'ease-in' }] },
      // Ray2 - up-right
      { target: 'Ray2', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 42, easing: 'ease-out' }] },
      { target: 'Ray2', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 500, value: -42, easing: 'ease-out' }] },
      { target: 'Ray2', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 1, easing: 'ease-out' }, { time: 1000, value: 1 }, { time: 1500, value: 0, easing: 'ease-in' }] },
      // Ray3 - right
      { target: 'Ray3', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 60, easing: 'ease-out' }] },
      { target: 'Ray3', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 1, easing: 'ease-out' }, { time: 1000, value: 1 }, { time: 1500, value: 0, easing: 'ease-in' }] },
      // Ray4 - down-right
      { target: 'Ray4', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 42, easing: 'ease-out' }] },
      { target: 'Ray4', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 42, easing: 'ease-out' }] },
      { target: 'Ray4', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 1, easing: 'ease-out' }, { time: 1000, value: 1 }, { time: 1500, value: 0, easing: 'ease-in' }] },
      // Ray5 - down
      { target: 'Ray5', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 60, easing: 'ease-out' }] },
      { target: 'Ray5', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 1, easing: 'ease-out' }, { time: 1000, value: 1 }, { time: 1500, value: 0, easing: 'ease-in' }] },
      // Ray6 - left
      { target: 'Ray6', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 500, value: -60, easing: 'ease-out' }] },
      { target: 'Ray6', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 1, easing: 'ease-out' }, { time: 1000, value: 1 }, { time: 1500, value: 0, easing: 'ease-in' }] },
      // Core pulse
      { target: 'Core', property: 'scale', keyframes: [{ time: 0, value: 0 }, { time: 300, value: 1.2, easing: 'ease-out' }, { time: 600, value: 1, easing: 'ease-in-out' }, { time: 1500, value: 1 }] },
      { target: 'Core', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 300, value: 1, easing: 'ease-out' }, { time: 1200, value: 1 }, { time: 1500, value: 0, easing: 'ease-in' }] },
    ],
  },

  // === SHOWCASE ===
  {
    id: 'tinyfly-demo',
    name: 'Tinyfly Demo',
    description: 'Full-featured demo animation',
    category: 'showcase',
    thumbnail: '✨',
    duration: 3000,
    elements: [
      { type: 'rect', name: 'Box', x: 120, y: 70, width: 60, height: 60, fill: '#4a9eff', borderRadius: 8 },
      { type: 'circle', name: 'Orb', x: 30, y: 70, width: 50, height: 50, fill: '#2ecc71' },
      { type: 'text', name: 'Title', x: 75, y: 10, width: 150, height: 40, text: 'tinyfly', fontSize: 24, fontWeight: 700, fill: '#ffffff', textAlign: 'center' },
      { type: 'line', name: 'Underline', x: 100, y: 170, x2: 200, y2: 170, stroke: '#e74c3c', strokeWidth: 3 },
      { type: 'arrow', name: 'Pointer', x: 220, y: 90, x2: 190, y2: 90, stroke: '#f39c12', strokeWidth: 2, headSize: 10 },
    ],
    tracks: [
      // Box animations
      { target: 'Box', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 750, value: 100, easing: 'ease-out' }, { time: 1500, value: 0, easing: 'ease-in-out' }, { time: 2250, value: -100, easing: 'ease-out' }, { time: 3000, value: 0, easing: 'ease-in' }] },
      { target: 'Box', property: 'rotate', keyframes: [{ time: 0, value: 0 }, { time: 1500, value: 180, easing: 'ease-in-out' }, { time: 3000, value: 360, easing: 'ease-in-out' }] },
      { target: 'Box', property: 'scale', keyframes: [{ time: 0, value: 1 }, { time: 750, value: 1.2, easing: 'ease-out' }, { time: 1500, value: 1, easing: 'ease-in' }, { time: 2250, value: 1.2, easing: 'ease-out' }, { time: 3000, value: 1, easing: 'ease-in' }] },
      // Orb animations
      { target: 'Orb', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 60, easing: 'ease-in' }, { time: 1000, value: 0, easing: 'ease-out' }, { time: 1500, value: 60, easing: 'ease-in' }, { time: 2000, value: 0, easing: 'ease-out' }, { time: 2500, value: 60, easing: 'ease-in' }, { time: 3000, value: 0, easing: 'ease-out' }] },
      { target: 'Orb', property: 'scale', keyframes: [{ time: 0, value: 1 }, { time: 500, value: 0.8, easing: 'ease-in' }, { time: 1000, value: 1.1, easing: 'ease-out' }, { time: 1500, value: 0.8, easing: 'ease-in' }, { time: 2000, value: 1.1, easing: 'ease-out' }, { time: 2500, value: 0.8, easing: 'ease-in' }, { time: 3000, value: 1, easing: 'ease-out' }] },
      { target: 'Orb', property: 'fill', keyframes: [{ time: 0, value: '#2ecc71' }, { time: 1000, value: '#3498db', easing: 'ease-in-out' }, { time: 2000, value: '#9b59b6', easing: 'ease-in-out' }, { time: 3000, value: '#2ecc71', easing: 'ease-in-out' }] },
      // Title animations
      { target: 'Title', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 1, easing: 'ease-out' }, { time: 2500, value: 1 }, { time: 3000, value: 0, easing: 'ease-in' }] },
      { target: 'Title', property: 'scale', keyframes: [{ time: 0, value: 0.5 }, { time: 500, value: 1, easing: 'ease-out-cubic' }, { time: 1500, value: 1.1, easing: 'ease-in-out' }, { time: 2500, value: 1, easing: 'ease-in-out' }, { time: 3000, value: 0.5, easing: 'ease-in' }] },
      // Underline animations
      { target: 'Underline', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 750, value: 50, easing: 'ease-out' }, { time: 1500, value: 0, easing: 'ease-in-out' }, { time: 2250, value: -50, easing: 'ease-out' }, { time: 3000, value: 0, easing: 'ease-in' }] },
      { target: 'Underline', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 1, easing: 'ease-out' }, { time: 2500, value: 1 }, { time: 3000, value: 0, easing: 'ease-in' }] },
      // Pointer animations
      { target: 'Pointer', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 500, value: -10, easing: 'ease-out' }, { time: 1000, value: 0, easing: 'ease-in' }, { time: 1500, value: -10, easing: 'ease-out' }, { time: 2000, value: 0, easing: 'ease-in' }, { time: 2500, value: -10, easing: 'ease-out' }, { time: 3000, value: 0, easing: 'ease-in' }] },
      { target: 'Pointer', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 300, value: 1, easing: 'ease-out' }, { time: 2700, value: 1 }, { time: 3000, value: 0, easing: 'ease-in' }] },
    ],
  },

  {
    id: 'logo-intro',
    name: 'Logo Intro',
    description: 'Animated logo reveal',
    category: 'showcase',
    thumbnail: '🎬',
    duration: 2500,
    elements: [
      { type: 'rect', name: 'BG', x: 0, y: 0, width: 300, height: 200, fill: '#1a1a2e' },
      { type: 'text', name: 'Logo', x: 75, y: 80, width: 150, height: 40, text: 'BRAND', fontSize: 32, fontWeight: 800, fill: '#4a9eff', textAlign: 'center' },
      { type: 'line', name: 'LineL', x: 30, y: 100, x2: 60, y2: 100, stroke: '#4a9eff', strokeWidth: 2 },
      { type: 'line', name: 'LineR', x: 240, y: 100, x2: 270, y2: 100, stroke: '#4a9eff', strokeWidth: 2 },
    ],
    tracks: [
      { target: 'Logo', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 0 }, { time: 1000, value: 1, easing: 'ease-out' }] },
      { target: 'Logo', property: 'y', keyframes: [{ time: 0, value: 20 }, { time: 500, value: 20 }, { time: 1000, value: 0, easing: 'ease-out-cubic' }] },
      { target: 'Logo', property: 'scale', keyframes: [{ time: 0, value: 0.8 }, { time: 500, value: 0.8 }, { time: 1000, value: 1, easing: 'ease-out' }, { time: 2500, value: 1 }] },
      { target: 'LineL', property: 'x', keyframes: [{ time: 0, value: 120 }, { time: 1500, value: 0, easing: 'ease-out-cubic' }] },
      { target: 'LineL', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 300, value: 1, easing: 'ease-out' }] },
      { target: 'LineR', property: 'x', keyframes: [{ time: 0, value: -120 }, { time: 1500, value: 0, easing: 'ease-out-cubic' }] },
      { target: 'LineR', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 300, value: 1, easing: 'ease-out' }] },
    ],
  },

  {
    id: 'bar-chart',
    name: 'Bar Chart',
    description: 'Animated data chart',
    category: 'showcase',
    thumbnail: '📈',
    duration: 2000,
    elements: [
      { type: 'rect', name: 'Bar1', x: 40, y: 150, width: 30, height: 10, fill: '#3498db', borderRadius: 4 },
      { type: 'rect', name: 'Bar2', x: 80, y: 150, width: 30, height: 10, fill: '#2ecc71', borderRadius: 4 },
      { type: 'rect', name: 'Bar3', x: 120, y: 150, width: 30, height: 10, fill: '#e74c3c', borderRadius: 4 },
      { type: 'rect', name: 'Bar4', x: 160, y: 150, width: 30, height: 10, fill: '#f39c12', borderRadius: 4 },
      { type: 'rect', name: 'Bar5', x: 200, y: 150, width: 30, height: 10, fill: '#9b59b6', borderRadius: 4 },
      { type: 'line', name: 'Baseline', x: 30, y: 160, x2: 240, y2: 160, stroke: '#95a5a6', strokeWidth: 2 },
      { type: 'text', name: 'Title', x: 75, y: 15, width: 150, height: 30, text: 'Sales Data', fontSize: 18, fontWeight: 600, fill: '#ffffff', textAlign: 'center' },
    ],
    tracks: [
      // Bars grow from bottom with stagger
      { target: 'Bar1', property: 'height', keyframes: [{ time: 0, value: 0 }, { time: 600, value: 80, easing: 'ease-out' }] },
      { target: 'Bar1', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 600, value: -70, easing: 'ease-out' }] },
      { target: 'Bar2', property: 'height', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 0 }, { time: 800, value: 120, easing: 'ease-out' }] },
      { target: 'Bar2', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 200, value: 0 }, { time: 800, value: -110, easing: 'ease-out' }] },
      { target: 'Bar3', property: 'height', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 0 }, { time: 1000, value: 60, easing: 'ease-out' }] },
      { target: 'Bar3', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 0 }, { time: 1000, value: -50, easing: 'ease-out' }] },
      { target: 'Bar4', property: 'height', keyframes: [{ time: 0, value: 0 }, { time: 600, value: 0 }, { time: 1200, value: 100, easing: 'ease-out' }] },
      { target: 'Bar4', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 600, value: 0 }, { time: 1200, value: -90, easing: 'ease-out' }] },
      { target: 'Bar5', property: 'height', keyframes: [{ time: 0, value: 0 }, { time: 800, value: 0 }, { time: 1400, value: 90, easing: 'ease-out' }] },
      { target: 'Bar5', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 800, value: 0 }, { time: 1400, value: -80, easing: 'ease-out' }] },
      // Title fade in
      { target: 'Title', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 1, easing: 'ease-out' }] },
      { target: 'Title', property: 'y', keyframes: [{ time: 0, value: -10 }, { time: 500, value: 0, easing: 'ease-out' }] },
    ],
  },

  {
    id: 'social-card',
    name: 'Social Card',
    description: 'Card with like animation',
    category: 'showcase',
    thumbnail: '❤️',
    duration: 2000,
    elements: [
      { type: 'rect', name: 'Card', x: 50, y: 30, width: 200, height: 140, fill: '#2c3e50', borderRadius: 12 },
      { type: 'rect', name: 'Image', x: 60, y: 40, width: 180, height: 80, fill: '#34495e', borderRadius: 8 },
      { type: 'text', name: 'Title', x: 60, y: 125, width: 120, height: 20, text: 'Great post!', fontSize: 14, fontWeight: 600, fill: '#ffffff', textAlign: 'left' },
      { type: 'circle', name: 'Heart', x: 210, y: 128, width: 24, height: 24, fill: '#95a5a6' },
      { type: 'text', name: 'Count', x: 195, y: 153, width: 40, height: 16, text: '42', fontSize: 12, fill: '#95a5a6', textAlign: 'center' },
    ],
    tracks: [
      // Card slides in
      { target: 'Card', property: 'x', keyframes: [{ time: 0, value: -100 }, { time: 400, value: 0, easing: 'ease-out-cubic' }] },
      { target: 'Card', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 1, easing: 'ease-out' }] },
      { target: 'Image', property: 'x', keyframes: [{ time: 0, value: -100 }, { time: 400, value: 0, easing: 'ease-out-cubic' }] },
      { target: 'Image', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 1, easing: 'ease-out' }] },
      { target: 'Title', property: 'x', keyframes: [{ time: 0, value: -100 }, { time: 400, value: 0, easing: 'ease-out-cubic' }] },
      { target: 'Title', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 1, easing: 'ease-out' }] },
      { target: 'Heart', property: 'x', keyframes: [{ time: 0, value: -100 }, { time: 400, value: 0, easing: 'ease-out-cubic' }] },
      { target: 'Count', property: 'x', keyframes: [{ time: 0, value: -100 }, { time: 400, value: 0, easing: 'ease-out-cubic' }] },
      // Heart like animation
      { target: 'Heart', property: 'fill', keyframes: [{ time: 0, value: '#95a5a6' }, { time: 800, value: '#95a5a6' }, { time: 1000, value: '#e74c3c', easing: 'ease-out' }] },
      { target: 'Heart', property: 'scale', keyframes: [{ time: 800, value: 1 }, { time: 900, value: 1.4, easing: 'ease-out' }, { time: 1100, value: 1, easing: 'ease-in-out' }] },
      { target: 'Count', property: 'fill', keyframes: [{ time: 0, value: '#95a5a6' }, { time: 1000, value: '#e74c3c', easing: 'ease-out' }] },
    ],
  },

  {
    id: 'menu-animation',
    name: 'Menu Animation',
    description: 'Hamburger to X transition',
    category: 'showcase',
    thumbnail: '☰',
    duration: 1500,
    elements: [
      { type: 'rect', name: 'Line1', x: 115, y: 70, width: 50, height: 6, fill: '#ffffff', borderRadius: 3 },
      { type: 'rect', name: 'Line2', x: 115, y: 90, width: 50, height: 6, fill: '#ffffff', borderRadius: 3 },
      { type: 'rect', name: 'Line3', x: 115, y: 110, width: 50, height: 6, fill: '#ffffff', borderRadius: 3 },
    ],
    tracks: [
      // Top line rotates down to form X
      { target: 'Line1', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 20, easing: 'ease-in-out' }, { time: 1100, value: 20 }, { time: 1500, value: 0, easing: 'ease-in-out' }] },
      { target: 'Line1', property: 'rotate', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 0 }, { time: 700, value: 45, easing: 'ease-in-out' }, { time: 1100, value: 45 }, { time: 1500, value: 0, easing: 'ease-in-out' }] },
      // Middle line fades out
      { target: 'Line2', property: 'opacity', keyframes: [{ time: 0, value: 1 }, { time: 300, value: 0, easing: 'ease-out' }, { time: 1200, value: 0 }, { time: 1500, value: 1, easing: 'ease-out' }] },
      { target: 'Line2', property: 'scale', keyframes: [{ time: 0, value: 1 }, { time: 300, value: 0.5, easing: 'ease-out' }, { time: 1200, value: 0.5 }, { time: 1500, value: 1, easing: 'ease-out' }] },
      // Bottom line rotates up to form X
      { target: 'Line3', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 400, value: -20, easing: 'ease-in-out' }, { time: 1100, value: -20 }, { time: 1500, value: 0, easing: 'ease-in-out' }] },
      { target: 'Line3', property: 'rotate', keyframes: [{ time: 0, value: 0 }, { time: 400, value: 0 }, { time: 700, value: -45, easing: 'ease-in-out' }, { time: 1100, value: -45 }, { time: 1500, value: 0, easing: 'ease-in-out' }] },
    ],
  },
]

/**
 * Get samples by category
 */
export function getSamplesByCategory(category: SampleDefinition['category']): SampleDefinition[] {
  return sampleDefinitions.filter((s) => s.category === category)
}

/**
 * Get a sample by ID
 */
export function getSampleById(id: string): SampleDefinition | undefined {
  return sampleDefinitions.find((s) => s.id === id)
}

/**
 * Get all unique categories
 */
export function getCategories(): SampleDefinition['category'][] {
  return ['basic', 'motion', 'text', 'ui', 'effects', 'showcase']
}

/**
 * Category display names
 */
export const categoryNames: Record<SampleDefinition['category'], string> = {
  basic: 'Basic',
  motion: 'Motion',
  text: 'Text',
  ui: 'UI Elements',
  effects: 'Effects',
  showcase: 'Showcase',
}
