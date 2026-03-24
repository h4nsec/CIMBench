import type { DiffTable } from '@/types/diff'
import type { ParsedProfile } from '@/types/ig'
import type {
  IntersectionConfig,
  IntersectionResult,
  IntersectionElement,
} from '@/types/intersection'
import { mergeMin, mergeMax, isCardinalityConflict, cardinalityString, maxToString } from '@/lib/cardinalityUtils'
import { strongestStrength } from '@/lib/bindingUtils'
import type { BindingStrength } from '@/types/fhir'

export function computeIntersection(
  table: DiffTable,
  profiles: ParsedProfile[],
  config: IntersectionConfig
): IntersectionResult {
  const N = profiles.length
  const elements: IntersectionElement[] = []
  const conflicts: IntersectionElement[] = []

  for (const row of table.rows) {
    const ratio = row.presentCount / N
    if (ratio < config.threshold) continue

    // Skip slice entries if includeSlices is off
    if (!config.includeSlices) {
      const lastSegment = row.normalizedPath.split('.').pop() ?? ''
      if (lastSegment.includes(':')) continue
    }

    const presentIGs = table.coverageMap[row.normalizedPath] ?? []
    const nonNullCells = row.cells.filter(c => c !== null) as NonNullable<(typeof row.cells)[number]>[]

    // ── Cardinality ──
    const mins = nonNullCells.map(c => c.element.min)
    const maxes = nonNullCells.map(c => c.element.max)

    const consensusMin = mergeMin(mins)
    const consensusMax = mergeMax(maxes)
    const hasCardConflict = isCardinalityConflict(consensusMin, consensusMax)

    const cardVariants: Record<string, string> = {}
    row.cells.forEach((cell, i) => {
      if (cell) cardVariants[table.columns[i].igDisplayName] = cell.cardinalityString
    })

    // ── Types ──
    const typeSets = nonNullCells.map(c => new Set(c.types))
    let consensusTypes: string[]
    let typeConflict = false

    if (typeSets.length === 0) {
      consensusTypes = []
    } else {
      // Intersection of all type sets
      const intersection = typeSets.reduce((acc, set) => {
        return new Set([...acc].filter(t => set.has(t)))
      })
      consensusTypes = [...intersection].sort()
      typeConflict = consensusTypes.length === 0 && typeSets.some(s => s.size > 0)
    }

    const typeVariants: Record<string, string[]> = {}
    row.cells.forEach((cell, i) => {
      if (cell) typeVariants[table.columns[i].igDisplayName] = cell.types
    })

    // ── Binding ──
    const cellsWithBinding = nonNullCells.filter(c => c.bindingStrength)
    let consensusBinding: IntersectionElement['consensusBinding']

    if (cellsWithBinding.length > 0) {
      const bindingRatio = cellsWithBinding.length / nonNullCells.length
      if (bindingRatio >= config.threshold) {
        const strengths = cellsWithBinding.map(c => c.bindingStrength!)
        const consensusStrength = strongestStrength(strengths)

        // Collect valueSets at the consensus strength level
        const vsMap: Record<string, string> = {}
        row.cells.forEach((cell, i) => {
          if (cell?.bindingStrength === consensusStrength && cell.bindingValueSet) {
            vsMap[table.columns[i].igDisplayName] = cell.bindingValueSet
          }
        })

        const uniqueVS = [...new Set(Object.values(vsMap))]
        const valueSetConflict = uniqueVS.length > 1

        consensusBinding = {
          strength: consensusStrength as BindingStrength,
          valueSet: valueSetConflict ? uniqueVS[0] : uniqueVS[0],
          resolution: 'strongest',
          valueSetConflict,
          valueSetVariants: vsMap,
        }
      }
    }

    // ── Must Support ──
    const msCount = nonNullCells.filter(c => c.mustSupport).length
    const consensusMustSupport = msCount / nonNullCells.length >= config.mustSupportThreshold

    // ── Short description ──
    const shorts = nonNullCells.map(c => c.element.short).filter(Boolean) as string[]
    const shortMode = mode(shorts)

    // ── Extension check ──
    const isExtension = nonNullCells.some(c => c.element.isExtension)

    const el: IntersectionElement = {
      normalizedPath: row.normalizedPath,
      presentInCount: row.presentCount,
      presentInIGs: presentIGs,
      coverageRatio: ratio,
      consensusMin,
      consensusMax,
      cardinalityString: cardinalityString(consensusMin, consensusMax),
      cardinalityResolution: hasCardConflict ? 'conflict' : 'most-restrictive',
      cardinalityVariants: cardVariants,
      consensusTypes,
      typeConflict,
      typeVariants,
      consensusBinding,
      consensusMustSupport,
      mustSupportCount: msCount,
      shortDescription: shortMode,
      isExtension,
    }

    if (hasCardConflict || typeConflict) {
      conflicts.push(el)
    } else {
      elements.push(el)
    }
  }

  // Also add conflicts to the main elements list (they should still appear)
  const allElements = [...elements, ...conflicts].sort((a, b) =>
    a.normalizedPath < b.normalizedPath ? -1 : a.normalizedPath > b.normalizedPath ? 1 : 0
  )

  return {
    config,
    totalProfiles: N,
    profileNames: profiles.map(p => p.igDisplayName),
    baseType: table.baseType,
    elements: allElements,
    conflicts,
    generatedAt: Date.now(),
  }
}

function mode(arr: string[]): string | undefined {
  if (arr.length === 0) return undefined
  const counts = new Map<string, number>()
  for (const s of arr) counts.set(s, (counts.get(s) ?? 0) + 1)
  let best = arr[0]
  let bestCount = 0
  for (const [val, count] of counts) {
    if (count > bestCount) { best = val; bestCount = count }
  }
  return best
}

// Re-export maxToString for use in generator
export { maxToString }
