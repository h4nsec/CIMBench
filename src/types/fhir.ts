// Raw FHIR resource shapes — mirrors actual JSON structure

export type FhirVersion = '4.0.1' | '4.3.0' | '5.0.0' | string

export type BindingStrength = 'required' | 'extensible' | 'preferred' | 'example'

export interface ElementDefinitionType {
  code: string
  profile?: string[]
  targetProfile?: string[]
}

export interface ElementDefinitionBinding {
  strength: BindingStrength
  valueSet?: string
  description?: string
}

export interface ElementDefinitionConstraint {
  key: string
  severity: 'error' | 'warning'
  human: string
  expression?: string
  xpath?: string
}

export interface ElementDefinitionSlicing {
  discriminator: Array<{ type: string; path: string }>
  rules: 'closed' | 'open' | 'openAtEnd'
  ordered?: boolean
  description?: string
}

export interface ElementDefinition {
  id: string
  path: string
  sliceName?: string
  sliceIsConstraining?: boolean
  min?: number
  max?: string
  type?: ElementDefinitionType[]
  binding?: ElementDefinitionBinding
  mustSupport?: boolean
  isModifier?: boolean
  isSummary?: boolean
  constraint?: ElementDefinitionConstraint[]
  short?: string
  definition?: string
  comment?: string
  slicing?: ElementDefinitionSlicing
  fixed?: unknown
  fixedString?: string
  fixedCode?: string
  fixedUri?: string
  pattern?: unknown
  patternCodeableConcept?: unknown
  base?: { path: string; min: number; max: string }
}

export interface StructureDefinitionDifferential {
  element: ElementDefinition[]
}

export interface StructureDefinitionSnapshot {
  element: ElementDefinition[]
}

export interface StructureDefinition {
  resourceType: 'StructureDefinition'
  id: string
  url: string
  name: string
  title?: string
  status: string
  kind: 'resource' | 'complex-type' | 'primitive-type' | 'logical'
  abstract: boolean
  type: string
  baseDefinition?: string
  derivation?: 'constraint' | 'specialization'
  fhirVersion?: FhirVersion
  differential?: StructureDefinitionDifferential
  snapshot?: StructureDefinitionSnapshot
  description?: string
  purpose?: string
  publisher?: string
  version?: string
  experimental?: boolean
}

export interface FhirPackageManifest {
  name: string
  version: string
  canonical?: string
  fhirVersions?: FhirVersion[]
  fhirVersion?: FhirVersion | FhirVersion[]
  dependencies?: Record<string, string>
  type?: string
  description?: string
  title?: string
  author?: string
  license?: string
}

export interface PackageIndexFile {
  filename: string
  resourceType: string
  id: string
  url?: string
  version?: string
  kind?: string
  type?: string
  name?: string
  title?: string
}

export interface PackageIndex {
  'index-version': number
  files: PackageIndexFile[]
}
