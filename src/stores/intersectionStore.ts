import { create } from 'zustand'
import type { IntersectionConfig, IntersectionResult } from '@/types/intersection'
import type { GeneratedArtifacts, GeneratorConfig } from '@/types/generator'
import { DEFAULT_INTERSECTION_CONFIG } from '@/types/intersection'

interface IntersectionState {
  config: IntersectionConfig
  result: IntersectionResult | null
  generatorConfig: GeneratorConfig
  artifacts: GeneratedArtifacts | null

  setConfig: (partial: Partial<IntersectionConfig>) => void
  setResult: (result: IntersectionResult) => void
  setGeneratorConfig: (partial: Partial<GeneratorConfig>) => void
  setArtifacts: (artifacts: GeneratedArtifacts) => void
  clear: () => void
}

const DEFAULT_GENERATOR_CONFIG: GeneratorConfig = {
  profileName: 'CommonProfile',
  profileId: 'common-profile',
  canonical: 'http://example.org/fhir',
  fhirVersion: '4.0.1',
  includeComments: true,
  includeConflictNotes: true,
}

export const useIntersectionStore = create<IntersectionState>((set) => ({
  config: DEFAULT_INTERSECTION_CONFIG,
  result: null,
  generatorConfig: DEFAULT_GENERATOR_CONFIG,
  artifacts: null,

  setConfig: (partial) =>
    set(state => ({ config: { ...state.config, ...partial } })),

  setResult: (result) =>
    set(state => ({
      result,
      // Auto-update generator config with detected base type and FHIR version
      generatorConfig: {
        ...state.generatorConfig,
        profileName: `${result.baseType}CommonProfile`,
        profileId: `${result.baseType.toLowerCase()}-common-profile`,
        fhirVersion: state.generatorConfig.fhirVersion,
      },
    })),

  setGeneratorConfig: (partial) =>
    set(state => ({ generatorConfig: { ...state.generatorConfig, ...partial } })),

  setArtifacts: (artifacts) => set({ artifacts }),

  clear: () =>
    set({
      result: null,
      artifacts: null,
    }),
}))
