import { describe, it, expect } from 'vitest'
import { apply, determinant, eigen, inverse, lerp, multiply, rotation, IDENTITY, type Mat2 } from './mat2'
import { add, cross, dot, length, normalize, sub } from './vec2'

describe('vec2', () => {
  it('adds, subtracts, dots and crosses', () => {
    expect(add([1, 2], [3, 4])).toEqual([4, 6])
    expect(sub([1, 2], [3, 4])).toEqual([-2, -2])
    expect(dot([1, 2], [3, 4])).toBe(11)
    expect(cross([1, 0], [0, 1])).toBe(1)
    expect(length([3, 4])).toBe(5)
    expect(normalize([0, 0])).toEqual([0, 0])
  })
})

describe('mat2', () => {
  const shear: Mat2 = [1, 1, 0, 1]

  it('sends î to the first column and ĵ to the second', () => {
    expect(apply([2, -1, 1, 3], [1, 0])).toEqual([2, 1])
    expect(apply([2, -1, 1, 3], [0, 1])).toEqual([-1, 3])
  })

  it('composes right to left, and inverts', () => {
    const quarter = rotation(Math.PI / 2)
    const both = multiply(quarter, shear) // shear first, then rotate
    const p = apply(both, [1, 1])
    const q = apply(quarter, apply(shear, [1, 1]))
    expect(p[0]).toBeCloseTo(q[0])
    expect(p[1]).toBeCloseTo(q[1])
    expect(multiply(shear, inverse(shear)!)).toEqual(IDENTITY)
    expect(inverse([1, 2, 2, 4])).toBeUndefined()
  })

  it('measures signed area change', () => {
    expect(determinant(shear)).toBe(1)
    expect(determinant([0, 1, 1, 0])).toBe(-1) // a flip
    expect(determinant([2, 0, 0, 3])).toBe(6)
  })

  it('blends element by element', () => {
    expect(lerp(IDENTITY, [3, 1, 0, 2], 0.5)).toEqual([2, 0.5, 0, 1.5])
  })

  it('finds real eigenpairs, largest first, as unit vectors that stay on their line', () => {
    const m: Mat2 = [3, 1, 0, 2]
    const pairs = eigen(m)
    expect(pairs.map((p) => p.value)).toEqual([3, 2])
    for (const { value, vector } of pairs) {
      expect(length(vector)).toBeCloseTo(1)
      const moved = apply(m, vector)
      expect(moved[0]).toBeCloseTo(value * vector[0])
      expect(moved[1]).toBeCloseTo(value * vector[1])
    }
  })

  it('has no real eigenvectors for a rotation, one line for a shear, every line for a scale', () => {
    expect(eigen(rotation(0.7))).toEqual([])
    expect(eigen(shear)).toEqual([{ value: 1, vector: [1, 0] }])
    expect(eigen([2, 0, 0, 2]).map((p) => p.vector)).toEqual([[1, 0], [0, 1]])
  })
})
