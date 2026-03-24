import type { NormalizedElement } from './ig'
import type { BindingStrength } from './fhir'

export type { BindingStrength }

export interface DiffColumn {
  igDisplayName: string
  profileUrl: string
  profileName: string
  profileTitle?: string
  fhirVersion: string
}

export interface DiffCell {
  cardinalityString: string
  types: string[]
  bindingStrength?: BindingStrength
  bindingValueSet?: string
  mustSupport: boolean
  isModifier: boolean
  element: NormalizedElement
}

export interface DiffRow {
  normalizedPath: string
  cells: (DiffCell | null)[]   // indexed by column order
  presentCount: number
  isConsensus: boolean         // set after intersection runs
}

export interface DiffTable {
  columns: DiffColumn[]
  rows: DiffRow[]
  coverageMap: Record<string, string[]>  // normalizedPath → igDisplayName[]
  baseType: string                        // e.g. "Endpoint"
}
