import { describe, it, expect } from 'vitest'
import { characterJoints, humanPose } from '../../characters'
import type { CharacterElement } from '../stores/scene-store'
import { CHARACTER_BUILDS, buildName, buildValue, characterOf } from './character-element'

const element = (changes: Partial<CharacterElement> = {}): CharacterElement => ({
  id: 'c1', name: 'Hero', type: 'character', x: 0, y: 0, width: 100, height: 200, rotation: 0, opacity: 1, visible: true, locked: false,
  figure: 'fluid', look: 'clean', ink: '#000', skin: '#fff', outfit: 'none', shirt: '#f00', trousers: '#00f', pose: {},
  ...changes,
}) as CharacterElement

describe('character builds', () => {
  it('shape the character the element draws (previews and exports alike)', () => {
    const joints = (build?: CharacterElement['build']) => characterJoints(characterOf(element({ build })), humanPose())
    const standard = joints()
    const kid = joints(CHARACTER_BUILDS.kid.build)
    const broad = joints(CHARACTER_BUILDS.broad.build)
    expect(kid.head.ry).toBeGreaterThan(standard.head.ry * 1.3)
    const shoulders = (j: typeof standard) => Math.abs(j.points['shoulder.left'].x - j.points['shoulder.right'].x)
    expect(shoulders(broad)).toBeGreaterThan(shoulders(standard) * 1.5)
    // Every build stands the same height on the ground.
    for (const { build } of Object.values(CHARACTER_BUILDS)) {
      const j = joints(build)
      expect(j.groundY).toBe(0)
      expect(j.head.center.y - j.head.ry).toBeCloseTo(-200, -1)
    }
  })

  it('reads each field with the standard default, and names the build it matches', () => {
    expect(buildValue(undefined, 'headSize')).toBe(0.3)
    expect(buildValue({ proportions: 'thin' }, 'headSize')).toBe(0.24)
    expect(buildValue({ shoulderWidth: 0.1 }, 'shoulderWidth')).toBe(0.1)
    expect(buildValue({}, 'hipWidth')).toBe(0.022)
    expect(buildName(undefined)).toBe('standard')
    expect(buildName({ headSize: 0.3 })).toBe('standard')
    expect(buildName({ headSize: 0.42 })).toBe('kid')
    expect(buildName({ proportions: 'thin' })).toBe('slim')
    expect(buildName({ headSize: 0.33 })).toBeUndefined()
  })
})
