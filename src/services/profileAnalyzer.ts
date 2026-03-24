import type { LoadedIG, ParsedProfile } from '@/types/ig'
import type { DiffTable, DiffColumn, DiffRow, DiffCell } from '@/types/diff'
import { sortPaths } from '@/lib/pathUtils'

/**
 * Search for profiles matching a query across all loaded IGs.
 * Matches on: type, name, title (case-insensitive).
 */
export function searchProfiles(igs: LoadedIG[], query: string): ParsedProfile[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const results: Array<{ profile: ParsedProfile; score: number }> = []

  for (const ig of igs) {
    if (ig.status !== 'ready') continue

    for (const profile of ig.profiles) {
      const sd = profile.sd
      const type = (sd.type ?? '').toLowerCase()
      const name = (sd.name ?? '').toLowerCase()
      const title = (sd.title ?? '').toLowerCase()

      let score = 0
      if (type === q) score = 100
      else if (name === q) score = 90
      else if (title === q) score = 80
      else if (type.includes(q)) score = 60
      else if (name.includes(q)) score = 50
      else if (title.includes(q)) score = 40

      if (score > 0) results.push({ profile, score })
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .map(r => r.profile)
}

/**
 * Build a diff table from a set of profiles (all should be the same resource type).
 */
export function buildDiffTable(profiles: ParsedProfile[]): DiffTable {
  if (profiles.length === 0) {
    return { columns: [], rows: [], coverageMap: {}, baseType: '' }
  }

  const baseType = profiles[0].sd.type ?? profiles[0].sd.name

  // Build columns
  const columns: DiffColumn[] = profiles.map(p => ({
    igDisplayName: p.igDisplayName,
    profileUrl: p.sd.url,
    profileName: p.sd.name,
    profileTitle: p.sd.title,
    fhirVersion: p.fhirVersion,
  }))

  // Collect all normalized paths across all profiles
  const allPathsSet = new Set<string>()
  for (const p of profiles) {
    for (const path of Object.keys(p.elementMap)) {
      allPathsSet.add(path)
    }
  }

  const allPaths = sortPaths(Array.from(allPathsSet))

  // Build coverage map
  const coverageMap: Record<string, string[]> = {}
  for (const path of allPaths) {
    coverageMap[path] = profiles
      .filter(p => !!p.elementMap[path])
      .map(p => p.igDisplayName)
  }

  // Build rows
  const rows: DiffRow[] = allPaths.map(path => {
    const cells: (DiffCell | null)[] = profiles.map(p => {
      const el = p.elementMap[path]
      if (!el) return null
      return {
        cardinalityString: el.cardinalityString,
        types: el.types,
        bindingStrength: el.binding?.strength,
        bindingValueSet: el.binding?.valueSet,
        mustSupport: el.mustSupport,
        isModifier: el.isModifier,
        element: el,
      }
    })

    const presentCount = cells.filter(c => c !== null).length

    return {
      normalizedPath: path,
      cells,
      presentCount,
      isConsensus: false,
    }
  })

  return { columns, rows, coverageMap, baseType }
}
