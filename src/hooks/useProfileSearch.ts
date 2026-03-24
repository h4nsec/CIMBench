import { useEffect, useRef } from 'react'
import { useIGStore } from '@/stores/igStore'
import { useSearchStore } from '@/stores/searchStore'
import { searchProfiles } from '@/services/profileAnalyzer'

export function useProfileSearch() {
  const getReadyIGs = useIGStore(s => s.getReadyIGs)
  const { query, setMatches } = useSearchStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      if (!query.trim()) {
        setMatches([])
        return
      }
      const igs = getReadyIGs()
      const results = searchProfiles(igs, query)
      setMatches(results)
    }, 200)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, getReadyIGs, setMatches])
}
