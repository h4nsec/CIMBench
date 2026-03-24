import type { StructureDefinition, FhirVersion, BindingStrength } from './fhir'

export type { BindingStrength }

export type LoadStatus = 'idle' | 'fetching' | 'extracting' | 'parsing' | 'ready' | 'error'

export type CardinalityMax = number | typeof Infinity

export interface LoadedIG {
  packageId: string
  version: string
  displayName: string        // "packageId#version"
  canonical?: string
  fhirVersion: FhirVersion
  title?: string
  description?: string

  status: LoadStatus
  errorMessage?: string
  loadedAt: number

  profiles: ParsedProfile[]
  // url → SD, used during snapshot synthesis
  allStructureDefinitions: Record<string, StructureDefinition>
}

export interface ParsedProfile {
  igDisplayName: string      // "hl7.fhir.us.core#6.1.0"
  igPackageId: string
  igVersion: string
  fhirVersion: FhirVersion
  sd: StructureDefinition
  elementMap: Record<string, NormalizedElement>   // normalizedPath → element
}

export interface NormalizedElement {
  path: string
  normalizedPath: string     // slice-names stripped
  sliceName?: string
  isSliceRoot: boolean
  isExtension: boolean

  // Cardinality
  min: number
  max: CardinalityMax        // Infinity represents '*'
  cardinalityString: string  // e.g. "0..1"

  // Types
  types: string[]            // sorted list of type codes
  typeProfiles: string[]     // constraining profile URIs

  // Binding
  binding?: {
    strength: BindingStrength
    valueSet?: string
  }

  // Flags
  mustSupport: boolean
  isModifier: boolean
  isSummary: boolean

  // Metadata
  short?: string
  definition?: string
  hasConstraints: boolean
}

export interface LoadProgress {
  stage: LoadStatus
  bytesLoaded?: number
  bytesTotal?: number
  message?: string
}
