import type { StructureDefinition, ElementDefinition } from '@/types/fhir'

const MAX_DEPTH = 10

/**
 * Ensure a StructureDefinition has a snapshot.
 * If it already has one, returns it unchanged.
 * Otherwise, merges the differential onto the parent's snapshot.
 */
export function ensureSnapshot(
  sd: StructureDefinition,
  registry: Record<string, StructureDefinition>,
  depth = 0
): StructureDefinition {
  if (sd.snapshot?.element && sd.snapshot.element.length > 0) {
    return sd
  }

  if (!sd.differential?.element || sd.differential.element.length === 0) {
    return sd
  }

  if (depth >= MAX_DEPTH) {
    console.warn(`Snapshot synthesis depth limit reached for ${sd.url}`)
    // Fall back to just using differential as if it were the snapshot
    return {
      ...sd,
      snapshot: { element: sd.differential.element },
    }
  }

  if (!sd.baseDefinition) {
    // No parent — treat differential as snapshot
    return {
      ...sd,
      snapshot: { element: sd.differential.element },
    }
  }

  // Resolve parent
  const parent = registry[sd.baseDefinition]
  if (!parent) {
    // Parent not available — use differential as snapshot with a warning
    console.warn(`Parent not found for ${sd.url}: ${sd.baseDefinition}`)
    return {
      ...sd,
      snapshot: { element: sd.differential.element },
    }
  }

  const resolvedParent = ensureSnapshot(parent, registry, depth + 1)
  const parentElements = resolvedParent.snapshot?.element ?? []

  const mergedElements = mergeElements(parentElements, sd.differential.element)

  return {
    ...sd,
    snapshot: { element: mergedElements },
  }
}

function mergeElements(
  parentElements: ElementDefinition[],
  diffElements: ElementDefinition[]
): ElementDefinition[] {
  // Build a working copy of parent elements indexed by id
  const result: ElementDefinition[] = parentElements.map(e => ({ ...e }))
  const idIndex = new Map<string, number>()
  result.forEach((e, i) => idIndex.set(e.id, i))

  for (const diff of diffElements) {
    const existingIdx = idIndex.get(diff.id)
    if (existingIdx !== undefined) {
      // Merge: overlay differential fields onto existing element
      result[existingIdx] = mergeElement(result[existingIdx], diff)
    } else {
      // New element (slice or extension) — insert after parent
      const parentId = getParentId(diff.id)
      const parentIdx = parentId ? idIndex.get(parentId) : undefined

      if (parentIdx !== undefined) {
        // Find insertion point: after all existing children of this parent
        let insertAt = parentIdx + 1
        while (
          insertAt < result.length &&
          result[insertAt].id.startsWith(parentId + '.')
        ) {
          insertAt++
        }
        result.splice(insertAt, 0, { ...diff })
        // Rebuild index after splice
        result.forEach((e, i) => idIndex.set(e.id, i))
      } else {
        result.push({ ...diff })
        idIndex.set(diff.id, result.length - 1)
      }
    }
  }

  return result
}

function mergeElement(base: ElementDefinition, diff: ElementDefinition): ElementDefinition {
  const merged: ElementDefinition = { ...base }

  if (diff.min !== undefined) merged.min = diff.min
  if (diff.max !== undefined) merged.max = diff.max
  if (diff.type && diff.type.length > 0) merged.type = diff.type
  if (diff.binding) merged.binding = diff.binding
  if (diff.mustSupport !== undefined) merged.mustSupport = diff.mustSupport
  if (diff.isModifier !== undefined) merged.isModifier = diff.isModifier
  if (diff.isSummary !== undefined) merged.isSummary = diff.isSummary
  if (diff.short) merged.short = diff.short
  if (diff.definition) merged.definition = diff.definition
  if (diff.constraint && diff.constraint.length > 0) {
    merged.constraint = [...(base.constraint ?? []), ...diff.constraint]
  }
  if (diff.slicing) merged.slicing = diff.slicing
  if (diff.sliceName) merged.sliceName = diff.sliceName
  if (diff.fixed !== undefined) merged.fixed = diff.fixed
  if (diff.fixedString !== undefined) merged.fixedString = diff.fixedString
  if (diff.fixedCode !== undefined) merged.fixedCode = diff.fixedCode
  if (diff.pattern !== undefined) merged.pattern = diff.pattern

  return merged
}

function getParentId(id: string): string | undefined {
  // "Patient.name.given" → "Patient.name"
  // "Patient.extension:race" → "Patient"  (slice name stripped)
  const withoutSlice = id.replace(/:.*$/, '')
  const parts = withoutSlice.split('.')
  if (parts.length <= 1) return undefined
  return parts.slice(0, -1).join('.')
}
