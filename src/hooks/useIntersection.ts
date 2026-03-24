import { useCallback } from 'react'
import { useDiffStore } from '@/stores/diffStore'
import { useIntersectionStore } from '@/stores/intersectionStore'
import { useSearchStore } from '@/stores/searchStore'
import { buildDiffTable } from '@/services/profileAnalyzer'
import { computeIntersection } from '@/services/intersectionEngine'
import { generateArtifacts } from '@/services/fshGenerator'

export function useIntersection() {
  const { setTable, table } = useDiffStore()
  const { config, setResult, result, generatorConfig, setArtifacts } = useIntersectionStore()
  const getSelectedProfiles = useSearchStore(s => s.getSelectedProfiles)

  const runDiff = useCallback(() => {
    const profiles = getSelectedProfiles()
    if (profiles.length === 0) return
    const t = buildDiffTable(profiles)
    setTable(t)
  }, [getSelectedProfiles, setTable])

  const runIntersection = useCallback(() => {
    if (!table) return
    const profiles = getSelectedProfiles()
    const r = computeIntersection(table, profiles, config)
    setResult(r)
  }, [table, getSelectedProfiles, config, setResult])

  const generateOutput = useCallback(() => {
    if (!result) return
    const artifacts = generateArtifacts(result, generatorConfig)
    setArtifacts(artifacts)
  }, [result, generatorConfig, setArtifacts])

  return { runDiff, runIntersection, generateOutput }
}
