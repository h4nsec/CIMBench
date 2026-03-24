import { create } from 'zustand'
import type { ParsedProfile } from '@/types/ig'

interface SearchState {
  query: string
  matchedProfiles: ParsedProfile[]
  selectedProfileUrls: Set<string>

  setQuery: (q: string) => void
  setMatches: (profiles: ParsedProfile[]) => void
  toggleProfile: (url: string) => void
  selectAll: () => void
  clearAll: () => void
  getSelectedProfiles: () => ParsedProfile[]
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  matchedProfiles: [],
  selectedProfileUrls: new Set(),

  setQuery: (q) => set({ query: q }),

  setMatches: (profiles) =>
    set({
      matchedProfiles: profiles,
      // Auto-select all newly matched profiles
      selectedProfileUrls: new Set(profiles.map(p => p.sd.url)),
    }),

  toggleProfile: (url) =>
    set(state => {
      const next = new Set(state.selectedProfileUrls)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return { selectedProfileUrls: next }
    }),

  selectAll: () =>
    set(state => ({
      selectedProfileUrls: new Set(state.matchedProfiles.map(p => p.sd.url)),
    })),

  clearAll: () => set({ selectedProfileUrls: new Set() }),

  getSelectedProfiles: () => {
    const { matchedProfiles, selectedProfileUrls } = get()
    return matchedProfiles.filter(p => selectedProfileUrls.has(p.sd.url))
  },
}))
