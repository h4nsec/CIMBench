import type { CardinalityMax } from '@/types/ig'

export function parseMax(raw: string | undefined): CardinalityMax {
  if (!raw || raw === '*') return Infinity
  const n = parseInt(raw, 10)
  return isNaN(n) ? Infinity : n
}

export function maxToString(max: CardinalityMax): string {
  return max === Infinity ? '*' : String(max)
}

export function cardinalityString(min: number, max: CardinalityMax): string {
  return `${min}..${maxToString(max)}`
}

/** Most-restrictive min: highest wins */
export function mergeMin(values: number[]): number {
  return Math.max(...values)
}

/** Most-restrictive max: lowest wins (Infinity = least restrictive) */
export function mergeMax(values: CardinalityMax[]): CardinalityMax {
  return values.reduce((a, b) => (a < b ? a : b), Infinity)
}

export function isCardinalityConflict(min: number, max: CardinalityMax): boolean {
  return max !== Infinity && min > max
}

export function cardinalityEquals(
  min1: number, max1: CardinalityMax,
  min2: number, max2: CardinalityMax
): boolean {
  return min1 === min2 && max1 === max2
}
