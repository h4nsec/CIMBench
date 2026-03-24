export interface GeneratorConfig {
  profileName: string
  profileId: string
  canonical: string
  fhirVersion: string
  includeComments: boolean
  includeConflictNotes: boolean
}

export interface GeneratedArtifacts {
  profileName: string
  profileId: string
  baseType: string
  fhirVersion: string
  fshSource: string
  structureDefinitionJson: string
  generatedAt: number
  sourceIGs: string[]
  elementCount: number
}
