/**
 * Strips slice names from a FHIR element path.
 * "Observation.component:systolicBP.code" → "Observation.component.code"
 */
export function normalizeSlicePath(rawPath: string): string {
  return rawPath
    .split('.')
    .map(segment => segment.split(':')[0])
    .join('.')
}

/**
 * Returns the slice name if present in the last segment, else undefined.
 * "Observation.component:systolic" → "systolic"
 */
export function extractSliceName(id: string): string | undefined {
  const lastSegment = id.split('.').pop() ?? ''
  const colonIdx = lastSegment.indexOf(':')
  return colonIdx >= 0 ? lastSegment.slice(colonIdx + 1) : undefined
}

/**
 * True if the element id contains a slice name in any segment.
 */
export function hasSliceName(id: string): boolean {
  return id.includes(':')
}

/**
 * True if the element path looks like a value[x] variant.
 * e.g. "Observation.valueQuantity" → true
 */
export function isValueXVariant(path: string): boolean {
  return /\.(value|onset|effective|occurrence|performed|died|multipleBirth|deceased)[A-Z]/.test(path)
}

/**
 * Normalize value[x] variants back to value[x].
 * "Observation.valueQuantity" → "Observation.value[x]"
 */
export function normalizeValueX(path: string): string {
  return path.replace(
    /\.(value|onset|effective|occurrence|performed|died|multipleBirth|deceased)[A-Z][a-zA-Z]*/g,
    '.$1[x]'
  )
}

/**
 * Sort element paths so parents come before children,
 * and slice entries come after their slice root.
 */
export function sortPaths(paths: string[]): string[] {
  return [...paths].sort((a, b) => {
    const aNorm = normalizeSlicePath(a)
    const bNorm = normalizeSlicePath(b)
    if (aNorm < bNorm) return -1
    if (aNorm > bNorm) return 1
    // Same normalized path — slice entries after root
    const aHasSlice = hasSliceName(a)
    const bHasSlice = hasSliceName(b)
    if (!aHasSlice && bHasSlice) return -1
    if (aHasSlice && !bHasSlice) return 1
    return a < b ? -1 : a > b ? 1 : 0
  })
}

/**
 * Returns parent path, e.g. "Observation.component.code" → "Observation.component"
 */
export function parentPath(path: string): string {
  const parts = path.split('.')
  return parts.slice(0, -1).join('.')
}

/**
 * True if path is for an extension element.
 */
export function isExtensionPath(path: string): boolean {
  return path.includes('.extension') || path.includes('.modifierExtension')
}
