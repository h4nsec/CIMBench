import { create } from 'zustand'
import type { DiffTable } from '@/types/diff'

interface DiffState {
  table: DiffTable | null
  visibleColumns: string[]           // subset of igDisplayNames
  showMustSupportOnly: boolean
  showExtensions: boolean
  pathFilter: string

  setTable: (table: DiffTable) => void
  toggleColumn: (igDisplayName: string) => void
  setAllColumns: (names: string[]) => void
  setMustSupportOnly: (v: boolean) => void
  setShowExtensions: (v: boolean) => void
  setPathFilter: (v: string) => void
  clearTable: () => void

  getFilteredRows: () => DiffTable['rows']
}

export const useDiffStore = create<DiffState>((set, get) => ({
  table: null,
  visibleColumns: [],
  showMustSupportOnly: false,
  showExtensions: true,
  pathFilter: '',

  setTable: (table) =>
    set({
      table,
      visibleColumns: table.columns.map(c => c.igDisplayName),
    }),

  toggleColumn: (name) =>
    set(state => {
      const next = state.visibleColumns.includes(name)
        ? state.visibleColumns.filter(c => c !== name)
        : [...state.visibleColumns, name]
      return { visibleColumns: next }
    }),

  setAllColumns: (names) => set({ visibleColumns: names }),

  setMustSupportOnly: (v) => set({ showMustSupportOnly: v }),
  setShowExtensions: (v) => set({ showExtensions: v }),
  setPathFilter: (v) => set({ pathFilter: v }),

  clearTable: () => set({ table: null, visibleColumns: [], pathFilter: '' }),

  getFilteredRows: () => {
    const { table, showMustSupportOnly, showExtensions, pathFilter, visibleColumns } = get()
    if (!table) return []

    const colIndices = table.columns
      .map((c, i) => ({ name: c.igDisplayName, i }))
      .filter(c => visibleColumns.includes(c.name))
      .map(c => c.i)

    return table.rows
      .filter(row => {
        // Path filter
        if (pathFilter && !row.normalizedPath.toLowerCase().includes(pathFilter.toLowerCase())) {
          return false
        }

        // Extension filter
        if (!showExtensions) {
          const lastPart = row.normalizedPath.split('.').pop() ?? ''
          if (lastPart === 'extension' || lastPart === 'modifierExtension') return false
          if (row.normalizedPath.includes('.extension.') || row.normalizedPath.includes('.modifierExtension.')) {
            return false
          }
        }

        // Must Support filter
        if (showMustSupportOnly) {
          const visibleCells = colIndices.map(i => row.cells[i]).filter(Boolean)
          if (!visibleCells.some(c => c?.mustSupport)) return false
        }

        return true
      })
  },
}))
