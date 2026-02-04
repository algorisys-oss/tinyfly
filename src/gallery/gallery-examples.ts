import type { TimelineDefinition } from '../engine'
import type { CanvasTarget } from '../adapters/canvas'

/** Canvas target with a name property for gallery examples */
export type GalleryCanvasTarget = CanvasTarget & { name: string }

export type GalleryCategory = 'UI Components' | 'Text Effects' | 'Loaders' | 'Micro-interactions' | 'Data Visualization' | 'Creative'

export interface GalleryExample {
  id: string
  name: string
  description: string
  category: GalleryCategory
  tags: string[]
  timeline: TimelineDefinition
  domHtml: string
  canvasTargets?: GalleryCanvasTarget[]
}

/** Get all examples by category */
export function getExamplesByCategory(category: GalleryCategory): GalleryExample[] {
  return galleryExamples.filter(ex => ex.category === category)
}

export const galleryExamples: GalleryExample[] = [
  // UI Components
  {
    id: 'slide-in-notification',
    name: 'Slide-in Notification',
    description: 'A notification card that slides in from the right with a smooth ease-out animation.',
    category: 'UI Components',
    tags: ['notification', 'slide', 'entrance'],
    timeline: {
      id: 'slide-notification',
      name: 'Slide Notification',
      config: { duration: 2500, loop: -1 },
      tracks: [
        {
          id: 'notification-x',
          target: 'notification',
          property: 'x',
          keyframes: [
            { time: 0, value: 100 },
            { time: 500, value: 0, easing: 'ease-out-cubic' },
            { time: 2000, value: 0 },
            { time: 2500, value: 100, easing: 'ease-in-cubic' },
          ],
        },
        {
          id: 'notification-opacity',
          target: 'notification',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0 },
            { time: 500, value: 1, easing: 'ease-out' },
            { time: 2000, value: 1 },
            { time: 2500, value: 0, easing: 'ease-in' },
          ],
        },
      ],
    },
    domHtml: `
      <div class="notification-card" data-tinyfly="notification">
        <p class="notification-title">New Message</p>
        <p class="notification-message">You have a new notification</p>
      </div>
    `,
    canvasTargets: [
      {
        name: 'notification',
        type: 'rect',
        x: 180,
        y: 60,
        width: 180,
        height: 60,
        fillStyle: '#2a2a2a',
        borderRadius: 8,
        opacity: 0,
      },
    ],
  },

  {
    id: 'button-hover-effect',
    name: 'Button Hover Effect',
    description: 'A pulsing button animation that draws attention and indicates interactivity.',
    category: 'UI Components',
    tags: ['button', 'pulse', 'hover', 'CTA'],
    timeline: {
      id: 'button-pulse',
      name: 'Button Pulse',
      config: { duration: 1500, loop: -1, alternate: true },
      tracks: [
        {
          id: 'btn-scale',
          target: 'button',
          property: 'scale',
          keyframes: [
            { time: 0, value: 1 },
            { time: 750, value: 1.05, easing: 'ease-in-out' },
            { time: 1500, value: 1, easing: 'ease-in-out' },
          ],
        },
        {
          id: 'btn-shadow',
          target: 'button',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 1 },
            { time: 750, value: 0.9, easing: 'ease-in-out' },
            { time: 1500, value: 1, easing: 'ease-in-out' },
          ],
        },
      ],
    },
    domHtml: `<div class="button" data-tinyfly="button">Get Started</div>`,
    canvasTargets: [
      {
        name: 'button',
        type: 'rect',
        x: 90,
        y: 70,
        width: 100,
        height: 40,
        fillStyle: '#4a9eff',
        borderRadius: 8,
      },
    ],
  },

  {
    id: 'card-flip',
    name: 'Card Stack Animation',
    description: 'Animated card stack with staggered entrance for card-based UIs.',
    category: 'UI Components',
    tags: ['cards', 'stack', 'stagger', 'entrance'],
    timeline: {
      id: 'card-stack',
      name: 'Card Stack',
      config: { duration: 2000, loop: -1 },
      tracks: [
        {
          id: 'card1-y',
          target: 'card1',
          property: 'y',
          keyframes: [
            { time: 0, value: 50 },
            { time: 400, value: 0, easing: 'ease-out-cubic' },
            { time: 1600, value: 0 },
            { time: 2000, value: 50, easing: 'ease-in' },
          ],
        },
        {
          id: 'card1-opacity',
          target: 'card1',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0 },
            { time: 400, value: 1, easing: 'ease-out' },
            { time: 1600, value: 1 },
            { time: 2000, value: 0 },
          ],
        },
        {
          id: 'card2-y',
          target: 'card2',
          property: 'y',
          keyframes: [
            { time: 100, value: 50 },
            { time: 500, value: 0, easing: 'ease-out-cubic' },
            { time: 1600, value: 0 },
            { time: 2000, value: 50, easing: 'ease-in' },
          ],
        },
        {
          id: 'card2-opacity',
          target: 'card2',
          property: 'opacity',
          keyframes: [
            { time: 100, value: 0 },
            { time: 500, value: 1, easing: 'ease-out' },
            { time: 1600, value: 1 },
            { time: 2000, value: 0 },
          ],
        },
        {
          id: 'card3-y',
          target: 'card3',
          property: 'y',
          keyframes: [
            { time: 200, value: 50 },
            { time: 600, value: 0, easing: 'ease-out-cubic' },
            { time: 1600, value: 0 },
            { time: 2000, value: 50, easing: 'ease-in' },
          ],
        },
        {
          id: 'card3-opacity',
          target: 'card3',
          property: 'opacity',
          keyframes: [
            { time: 200, value: 0 },
            { time: 600, value: 1, easing: 'ease-out' },
            { time: 1600, value: 1 },
            { time: 2000, value: 0 },
          ],
        },
      ],
    },
    domHtml: `
      <div class="card-stack">
        <div class="stack-card" data-tinyfly="card1"></div>
        <div class="stack-card" data-tinyfly="card2"></div>
        <div class="stack-card" data-tinyfly="card3"></div>
      </div>
    `,
    canvasTargets: [
      { name: 'card1', type: 'rect', x: 80, y: 50, width: 100, height: 70, fillStyle: '#4a9eff', borderRadius: 8, opacity: 0 },
      { name: 'card2', type: 'rect', x: 90, y: 40, width: 100, height: 70, fillStyle: '#8b5cf6', borderRadius: 8, opacity: 0 },
      { name: 'card3', type: 'rect', x: 100, y: 30, width: 100, height: 70, fillStyle: '#ec4899', borderRadius: 8, opacity: 0 },
    ],
  },

  // Loaders
  {
    id: 'loading-bar',
    name: 'Progress Bar',
    description: 'A smooth loading progress bar with gradient fill animation.',
    category: 'Loaders',
    tags: ['loading', 'progress', 'bar'],
    timeline: {
      id: 'loading-bar',
      name: 'Loading Bar',
      config: { duration: 2000, loop: -1 },
      tracks: [
        {
          id: 'bar-width',
          target: 'bar-fill',
          property: 'scaleX',
          keyframes: [
            { time: 0, value: 0 },
            { time: 1800, value: 1, easing: 'ease-out-cubic' },
            { time: 2000, value: 0 },
          ],
        },
        {
          id: 'bar-opacity',
          target: 'bar-fill',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 1 },
            { time: 1800, value: 1 },
            { time: 1900, value: 0, easing: 'ease-out' },
            { time: 2000, value: 1 },
          ],
        },
      ],
    },
    domHtml: `
      <div class="loading-bar">
        <div class="loading-bar-fill" data-tinyfly="bar-fill" style="transform-origin: left center;"></div>
      </div>
    `,
    canvasTargets: [
      { name: 'bar-bg', type: 'rect', x: 40, y: 85, width: 200, height: 10, fillStyle: '#333', borderRadius: 5 },
      { name: 'bar-fill', type: 'rect', x: 40, y: 85, width: 200, height: 10, fillStyle: '#4a9eff', borderRadius: 5 },
    ],
  },

  {
    id: 'spinner-dots',
    name: 'Dot Spinner',
    description: 'Three dots pulsing in sequence for a modern loading indicator.',
    category: 'Loaders',
    tags: ['loading', 'spinner', 'dots'],
    timeline: {
      id: 'dot-spinner',
      name: 'Dot Spinner',
      config: { duration: 1200, loop: -1 },
      tracks: [
        {
          id: 'dot1-scale',
          target: 'dot1',
          property: 'scale',
          keyframes: [
            { time: 0, value: 1 },
            { time: 200, value: 1.5, easing: 'ease-out' },
            { time: 400, value: 1, easing: 'ease-in' },
          ],
        },
        {
          id: 'dot1-opacity',
          target: 'dot1',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0.4 },
            { time: 200, value: 1, easing: 'ease-out' },
            { time: 400, value: 0.4, easing: 'ease-in' },
          ],
        },
        {
          id: 'dot2-scale',
          target: 'dot2',
          property: 'scale',
          keyframes: [
            { time: 200, value: 1 },
            { time: 400, value: 1.5, easing: 'ease-out' },
            { time: 600, value: 1, easing: 'ease-in' },
          ],
        },
        {
          id: 'dot2-opacity',
          target: 'dot2',
          property: 'opacity',
          keyframes: [
            { time: 200, value: 0.4 },
            { time: 400, value: 1, easing: 'ease-out' },
            { time: 600, value: 0.4, easing: 'ease-in' },
          ],
        },
        {
          id: 'dot3-scale',
          target: 'dot3',
          property: 'scale',
          keyframes: [
            { time: 400, value: 1 },
            { time: 600, value: 1.5, easing: 'ease-out' },
            { time: 800, value: 1, easing: 'ease-in' },
          ],
        },
        {
          id: 'dot3-opacity',
          target: 'dot3',
          property: 'opacity',
          keyframes: [
            { time: 400, value: 0.4 },
            { time: 600, value: 1, easing: 'ease-out' },
            { time: 800, value: 0.4, easing: 'ease-in' },
          ],
        },
      ],
    },
    domHtml: `
      <div style="display: flex; gap: 12px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        <div data-tinyfly="dot1" style="width: 16px; height: 16px; background: #4a9eff; border-radius: 50%; opacity: 0.4;"></div>
        <div data-tinyfly="dot2" style="width: 16px; height: 16px; background: #4a9eff; border-radius: 50%; opacity: 0.4;"></div>
        <div data-tinyfly="dot3" style="width: 16px; height: 16px; background: #4a9eff; border-radius: 50%; opacity: 0.4;"></div>
      </div>
    `,
    canvasTargets: [
      { name: 'dot1', type: 'circle', x: 100, y: 85, radius: 8, fillStyle: '#4a9eff', opacity: 0.4 },
      { name: 'dot2', type: 'circle', x: 140, y: 85, radius: 8, fillStyle: '#4a9eff', opacity: 0.4 },
      { name: 'dot3', type: 'circle', x: 180, y: 85, radius: 8, fillStyle: '#4a9eff', opacity: 0.4 },
    ],
  },

  {
    id: 'orbit-loader',
    name: 'Orbit Loader',
    description: 'A dot orbiting around a center point for a space-themed loader.',
    category: 'Loaders',
    tags: ['loading', 'orbit', 'rotation'],
    timeline: {
      id: 'orbit-loader',
      name: 'Orbit Loader',
      config: { duration: 2000, loop: -1 },
      tracks: [
        {
          id: 'orbit-rotate',
          target: 'orbit-dot',
          property: 'rotate',
          keyframes: [
            { time: 0, value: 0 },
            { time: 2000, value: 360, easing: 'linear' },
          ],
        },
        {
          id: 'center-pulse',
          target: 'orbit-center',
          property: 'scale',
          keyframes: [
            { time: 0, value: 1 },
            { time: 1000, value: 1.1, easing: 'ease-in-out' },
            { time: 2000, value: 1, easing: 'ease-in-out' },
          ],
        },
      ],
    },
    domHtml: `
      <div class="orbit-container">
        <div class="orbit-center" data-tinyfly="orbit-center"></div>
        <div class="orbit-dot" data-tinyfly="orbit-dot" style="transform-origin: center 60px;"></div>
      </div>
    `,
    canvasTargets: [
      { name: 'orbit-center', type: 'circle', x: 125, y: 75, radius: 15, fillStyle: '#4a9eff' },
      { name: 'orbit-dot', type: 'circle', x: 132, y: 25, radius: 6, fillStyle: '#8b5cf6', rotate: 0 },
    ],
  },

  // Text Effects
  {
    id: 'typewriter',
    name: 'Typing Cursor',
    description: 'A blinking cursor effect for typewriter-style text animations.',
    category: 'Text Effects',
    tags: ['text', 'cursor', 'typing', 'blink'],
    timeline: {
      id: 'typing-cursor',
      name: 'Typing Cursor',
      config: { duration: 1000, loop: -1 },
      tracks: [
        {
          id: 'cursor-opacity',
          target: 'cursor',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 1 },
            { time: 500, value: 0, easing: 'linear' },
            { time: 501, value: 0 },
            { time: 1000, value: 1, easing: 'linear' },
          ],
        },
      ],
    },
    domHtml: `
      <div style="display: flex; align-items: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        <span style="font-size: 24px; color: #fff;">Hello World</span>
        <div class="typing-cursor" data-tinyfly="cursor" style="margin-left: 2px;"></div>
      </div>
    `,
    canvasTargets: [
      { name: 'cursor', type: 'rect', x: 185, y: 78, width: 2, height: 24, fillStyle: '#4a9eff' },
    ],
  },

  {
    id: 'text-reveal',
    name: 'Text Reveal',
    description: 'Text that fades and slides up into view with elegant timing.',
    category: 'Text Effects',
    tags: ['text', 'reveal', 'fade', 'slide'],
    timeline: {
      id: 'text-reveal',
      name: 'Text Reveal',
      config: { duration: 2000, loop: -1 },
      tracks: [
        {
          id: 'text-y',
          target: 'text',
          property: 'y',
          keyframes: [
            { time: 0, value: 30 },
            { time: 600, value: 0, easing: 'ease-out-cubic' },
            { time: 1400, value: 0 },
            { time: 2000, value: -30, easing: 'ease-in-cubic' },
          ],
        },
        {
          id: 'text-opacity',
          target: 'text',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0 },
            { time: 600, value: 1, easing: 'ease-out' },
            { time: 1400, value: 1 },
            { time: 2000, value: 0, easing: 'ease-in' },
          ],
        },
      ],
    },
    domHtml: `
      <div class="animated-text" data-tinyfly="text">Welcome</div>
    `,
    canvasTargets: [
      { name: 'text', type: 'text', x: 140, y: 100, text: 'Welcome', fontSize: 28, fontFamily: 'Arial', fontWeight: 700, fillStyle: '#fff', opacity: 0 },
    ],
  },

  // Micro-interactions
  {
    id: 'like-heart',
    name: 'Heart Like Animation',
    description: 'A satisfying heart animation for like buttons and reactions.',
    category: 'Micro-interactions',
    tags: ['like', 'heart', 'feedback', 'social'],
    timeline: {
      id: 'heart-like',
      name: 'Heart Like',
      config: { duration: 800, loop: -1 },
      tracks: [
        {
          id: 'heart-scale',
          target: 'heart',
          property: 'scale',
          keyframes: [
            { time: 0, value: 0 },
            { time: 200, value: 1.3, easing: 'ease-out' },
            { time: 400, value: 0.9, easing: 'ease-in-out' },
            { time: 500, value: 1, easing: 'ease-out' },
            { time: 800, value: 1 },
          ],
        },
        {
          id: 'heart-opacity',
          target: 'heart',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0 },
            { time: 100, value: 1, easing: 'ease-out' },
          ],
        },
      ],
    },
    domHtml: `
      <div data-tinyfly="heart" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 48px;">
        ❤️
      </div>
    `,
    canvasTargets: [
      { name: 'heart', type: 'circle', x: 125, y: 75, radius: 25, fillStyle: '#ef4444', scale: 0 },
    ],
  },

  {
    id: 'success-check',
    name: 'Success Checkmark',
    description: 'An animated checkmark for form submissions and confirmations.',
    category: 'Micro-interactions',
    tags: ['success', 'check', 'confirmation', 'form'],
    timeline: {
      id: 'success-check',
      name: 'Success Check',
      config: { duration: 1500, loop: -1 },
      tracks: [
        {
          id: 'circle-scale',
          target: 'check-circle',
          property: 'scale',
          keyframes: [
            { time: 0, value: 0 },
            { time: 400, value: 1.1, easing: 'ease-out-cubic' },
            { time: 500, value: 1, easing: 'ease-in-out' },
            { time: 1200, value: 1 },
            { time: 1500, value: 0, easing: 'ease-in' },
          ],
        },
        {
          id: 'check-opacity',
          target: 'checkmark',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0 },
            { time: 300, value: 0 },
            { time: 500, value: 1, easing: 'ease-out' },
            { time: 1200, value: 1 },
            { time: 1500, value: 0 },
          ],
        },
      ],
    },
    domHtml: `
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        <div data-tinyfly="check-circle" style="width: 60px; height: 60px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <span data-tinyfly="checkmark" style="color: #fff; font-size: 32px; opacity: 0;">✓</span>
        </div>
      </div>
    `,
    canvasTargets: [
      { name: 'check-circle', type: 'circle', x: 140, y: 90, radius: 30, fillStyle: '#22c55e', scale: 0 },
      { name: 'checkmark', type: 'text', x: 140, y: 102, text: '✓', fontSize: 32, fontFamily: 'Arial', fillStyle: '#fff', opacity: 0 },
    ],
  },

  // Data Visualization
  {
    id: 'bar-chart',
    name: 'Animated Bar Chart',
    description: 'Bars animating up with staggered timing for data visualization.',
    category: 'Data Visualization',
    tags: ['chart', 'bars', 'data', 'statistics'],
    timeline: {
      id: 'bar-chart',
      name: 'Bar Chart',
      config: { duration: 2500, loop: -1 },
      tracks: [
        {
          id: 'bar1-scale',
          target: 'bar1',
          property: 'scaleY',
          keyframes: [
            { time: 0, value: 0 },
            { time: 400, value: 0.7, easing: 'ease-out-cubic' },
            { time: 2000, value: 0.7 },
            { time: 2500, value: 0, easing: 'ease-in' },
          ],
        },
        {
          id: 'bar2-scale',
          target: 'bar2',
          property: 'scaleY',
          keyframes: [
            { time: 100, value: 0 },
            { time: 500, value: 1, easing: 'ease-out-cubic' },
            { time: 2000, value: 1 },
            { time: 2500, value: 0, easing: 'ease-in' },
          ],
        },
        {
          id: 'bar3-scale',
          target: 'bar3',
          property: 'scaleY',
          keyframes: [
            { time: 200, value: 0 },
            { time: 600, value: 0.5, easing: 'ease-out-cubic' },
            { time: 2000, value: 0.5 },
            { time: 2500, value: 0, easing: 'ease-in' },
          ],
        },
        {
          id: 'bar4-scale',
          target: 'bar4',
          property: 'scaleY',
          keyframes: [
            { time: 300, value: 0 },
            { time: 700, value: 0.85, easing: 'ease-out-cubic' },
            { time: 2000, value: 0.85 },
            { time: 2500, value: 0, easing: 'ease-in' },
          ],
        },
      ],
    },
    domHtml: `
      <div style="display: flex; gap: 16px; align-items: flex-end; height: 120px; position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);">
        <div data-tinyfly="bar1" style="width: 40px; height: 100px; background: linear-gradient(180deg, #4a9eff, #3a8eef); border-radius: 4px 4px 0 0; transform-origin: bottom;"></div>
        <div data-tinyfly="bar2" style="width: 40px; height: 100px; background: linear-gradient(180deg, #8b5cf6, #7c3aed); border-radius: 4px 4px 0 0; transform-origin: bottom;"></div>
        <div data-tinyfly="bar3" style="width: 40px; height: 100px; background: linear-gradient(180deg, #22c55e, #16a34a); border-radius: 4px 4px 0 0; transform-origin: bottom;"></div>
        <div data-tinyfly="bar4" style="width: 40px; height: 100px; background: linear-gradient(180deg, #f59e0b, #d97706); border-radius: 4px 4px 0 0; transform-origin: bottom;"></div>
      </div>
    `,
    canvasTargets: [
      { name: 'bar1', type: 'rect', x: 50, y: 50, width: 40, height: 100, fillStyle: '#4a9eff', scaleY: 0 },
      { name: 'bar2', type: 'rect', x: 100, y: 50, width: 40, height: 100, fillStyle: '#8b5cf6', scaleY: 0 },
      { name: 'bar3', type: 'rect', x: 150, y: 50, width: 40, height: 100, fillStyle: '#22c55e', scaleY: 0 },
      { name: 'bar4', type: 'rect', x: 200, y: 50, width: 40, height: 100, fillStyle: '#f59e0b', scaleY: 0 },
    ],
  },

  {
    id: 'counter',
    name: 'Number Counter',
    description: 'An animated counter that increments from 0 to a target value.',
    category: 'Data Visualization',
    tags: ['counter', 'number', 'statistics', 'value'],
    timeline: {
      id: 'counter',
      name: 'Counter',
      config: { duration: 3000, loop: -1 },
      tracks: [
        {
          id: 'counter-value',
          target: 'counter',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 1 },
            { time: 2500, value: 1 },
            { time: 2800, value: 0, easing: 'ease-in' },
            { time: 3000, value: 1, easing: 'ease-out' },
          ],
        },
        {
          id: 'counter-scale',
          target: 'counter',
          property: 'scale',
          keyframes: [
            { time: 0, value: 0.8 },
            { time: 500, value: 1, easing: 'ease-out' },
            { time: 2500, value: 1 },
            { time: 3000, value: 0.8 },
          ],
        },
      ],
    },
    domHtml: `
      <div class="counter" data-tinyfly="counter">1,234</div>
    `,
    canvasTargets: [
      { name: 'counter', type: 'text', x: 140, y: 105, text: '1,234', fontSize: 42, fontFamily: 'monospace', fontWeight: 700, fillStyle: '#4a9eff', scale: 0.8 },
    ],
  },

  // Creative
  {
    id: 'floating-shapes',
    name: 'Floating Shapes',
    description: 'Abstract shapes floating and rotating for decorative backgrounds.',
    category: 'Creative',
    tags: ['abstract', 'shapes', 'decorative', 'background'],
    timeline: {
      id: 'floating-shapes',
      name: 'Floating Shapes',
      config: { duration: 4000, loop: -1 },
      tracks: [
        {
          id: 'shape1-y',
          target: 'shape1',
          property: 'y',
          keyframes: [
            { time: 0, value: 0 },
            { time: 2000, value: -20, easing: 'ease-in-out' },
            { time: 4000, value: 0, easing: 'ease-in-out' },
          ],
        },
        {
          id: 'shape1-rotate',
          target: 'shape1',
          property: 'rotate',
          keyframes: [
            { time: 0, value: 0 },
            { time: 4000, value: 360, easing: 'linear' },
          ],
        },
        {
          id: 'shape2-y',
          target: 'shape2',
          property: 'y',
          keyframes: [
            { time: 0, value: 0 },
            { time: 2000, value: 15, easing: 'ease-in-out' },
            { time: 4000, value: 0, easing: 'ease-in-out' },
          ],
        },
        {
          id: 'shape2-rotate',
          target: 'shape2',
          property: 'rotate',
          keyframes: [
            { time: 0, value: 0 },
            { time: 4000, value: -180, easing: 'linear' },
          ],
        },
        {
          id: 'shape3-y',
          target: 'shape3',
          property: 'y',
          keyframes: [
            { time: 0, value: 0 },
            { time: 2000, value: -10, easing: 'ease-in-out' },
            { time: 4000, value: 0, easing: 'ease-in-out' },
          ],
        },
        {
          id: 'shape3-scale',
          target: 'shape3',
          property: 'scale',
          keyframes: [
            { time: 0, value: 1 },
            { time: 2000, value: 1.2, easing: 'ease-in-out' },
            { time: 4000, value: 1, easing: 'ease-in-out' },
          ],
        },
      ],
    },
    domHtml: `
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 200px; height: 120px;">
        <div data-tinyfly="shape1" style="position: absolute; top: 20px; left: 20px; width: 40px; height: 40px; background: linear-gradient(135deg, #4a9eff, #8b5cf6); border-radius: 8px;"></div>
        <div data-tinyfly="shape2" style="position: absolute; top: 60px; left: 80px; width: 30px; height: 30px; background: linear-gradient(135deg, #22c55e, #10b981); border-radius: 50%;"></div>
        <div data-tinyfly="shape3" style="position: absolute; top: 30px; right: 20px; width: 35px; height: 35px; background: linear-gradient(135deg, #f59e0b, #ef4444); clip-path: polygon(50% 0%, 100% 100%, 0% 100%);"></div>
      </div>
    `,
    canvasTargets: [
      { name: 'shape1', type: 'rect', x: 60, y: 50, width: 40, height: 40, fillStyle: '#4a9eff', borderRadius: 8, rotate: 0 },
      { name: 'shape2', type: 'circle', x: 120, y: 80, radius: 15, fillStyle: '#22c55e', rotate: 0 },
      { name: 'shape3', type: 'rect', x: 180, y: 60, width: 35, height: 35, fillStyle: '#f59e0b', scale: 1 },
    ],
  },

  {
    id: 'breathing-circle',
    name: 'Breathing Circle',
    description: 'A calming breathing animation for meditation or loading states.',
    category: 'Creative',
    tags: ['breathing', 'meditation', 'calm', 'zen'],
    timeline: {
      id: 'breathing-circle',
      name: 'Breathing Circle',
      config: { duration: 4000, loop: -1 },
      tracks: [
        {
          id: 'circle-scale',
          target: 'breath-circle',
          property: 'scale',
          keyframes: [
            { time: 0, value: 1 },
            { time: 2000, value: 1.5, easing: 'ease-in-out' },
            { time: 4000, value: 1, easing: 'ease-in-out' },
          ],
        },
        {
          id: 'circle-opacity',
          target: 'breath-circle',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0.6 },
            { time: 2000, value: 1, easing: 'ease-in-out' },
            { time: 4000, value: 0.6, easing: 'ease-in-out' },
          ],
        },
      ],
    },
    domHtml: `
      <div data-tinyfly="breath-circle" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80px; height: 80px; background: radial-gradient(circle, #4a9eff 0%, #8b5cf6 100%); border-radius: 50%; opacity: 0.6;"></div>
    `,
    canvasTargets: [
      { name: 'breath-circle', type: 'circle', x: 140, y: 90, radius: 40, fillStyle: '#4a9eff', opacity: 0.6 },
    ],
  },
]
