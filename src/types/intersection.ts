import type { CardinalityMax } from './ig'
import type { BindingStrength } from './fhir'

export interface IntersectionConfig {
  threshold: number          // 0.0–1.0, e.g. 0.75 means ≥75% of IGs must have the element
  includeSlices: boolean
  mustSupportThreshold: number  // 0.0–1.0, what fraction must flag MS for consensus MS=true
}

export const DEFAULT_INTERSECTION_CONFIG: IntersectionConfig = {
  threshold: 0.75,
  includeSlices: false,
  mustSupportThreshold: 0.5,
}

export type CardinalityResolution = 'most-restrictive' | 'conflict'
export type BindingResolution = 'strongest' | 'weakest' | 'conflict'

export interface IntersectionElement {
  normalizedPath: string

  // Coverage
  presentInCount: number
  presentInIGs: string[]
  coverageRatio: number

  // Consensus cardinality
  consensusMin: number
  consensusMax: CardinalityMax
  cardinalityString: string
  cardinalityResolution: CardinalityResolution
  cardinalityVariants: Record<string, string>   // igDisplayName → cardinalityString

  // Consensus types
  consensusTypes: string[]
  typeConflict: boolean
  typeVariants: Record<string, string[]>

  // Consensus binding
  consensusBinding?: {
    strength: BindingStrength
    valueSet?: string
    resolution: BindingResolution
    valueSetConflict: boolean
    valueSetVariants: Record<string, string>
  }

  // Must Support
  consensusMustSupport: boolean
  mustSupportCount: number

  // Metadata
  shortDescription?: string
  isExtension: boolean
}

export interface IntersectionResult {
  config: IntersectionConfig
  totalProfiles: number
  profileNames: string[]
  baseType: string
  elements: IntersectionElement[]
  conflicts: IntersectionElement[]   // elements present but with unresolvable conflicts
  generatedAt: number
}
