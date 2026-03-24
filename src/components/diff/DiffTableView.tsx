import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useState } from 'react'
import { useDiffStore } from '@/stores/diffStore'
import { useIntersectionStore } from '@/stores/intersectionStore'
import { DiffTableToolbar } from './DiffTableToolbar'
import { DiffHelpPanel } from './DiffHelpPanel'
import { DiffCell } from './DiffCell'
import { cn } from '@/lib/cn'

export function DiffTableView() {
  const { table, visibleColumns, getFilteredRows } = useDiffStore()
  const { result } = useIntersectionStore()
  const parentRef = useRef<HTMLDivElement>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  if (!table) return null

  const filteredRows = getFilteredRows()
  const visibleColDefs = table.columns.filter(c => visibleColumns.includes(c.igDisplayName))
  const consensusPaths = new Set(result?.elements.map(e => e.normalizedPath) ?? [])

  const PATH_COL_WIDTH = 200 // px
  const DATA_COL_WIDTH = 180 // px
  const totalWidth = PATH_COL_WIDTH + visibleColDefs.length * DATA_COL_WIDTH

  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  })

  return (
    // Outer flex column — toolbar + scroll area stack vertically, each gets its own space
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* ── Toolbar — never scrolls ─────────────────────────────────────────── */}
      <DiffTableToolbar onHelpToggle={() => setHelpOpen(o => !o)} helpOpen={helpOpen} />

      {/* ── Help panel — overlays from the right ────────────────────────────── */}
      {helpOpen && <DiffHelpPanel onClose={() => setHelpOpen(false)} />}

      {/* ── Scroll container fills remaining height ─────────────────────────── */}
      {filteredRows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No elements match the current filters
        </div>
      ) : (
        <div ref={parentRef} className="flex-1 overflow-auto">
          {/* Width wrapper — makes both header and rows share the same scroll width */}
          <div style={{ minWidth: totalWidth }}>

            {/* ── Sticky header — stays at top of scroll container ────────── */}
            <div className="sticky top-0 z-10 flex bg-background border-b shadow-sm">
              <div
                className="shrink-0 flex items-end px-3 py-2 font-semibold text-xs text-muted-foreground border-r bg-muted/40"
                style={{ width: PATH_COL_WIDTH, minWidth: PATH_COL_WIDTH }}
              >
                Element Path
                <span className="ml-1 font-normal">({filteredRows.length})</span>
              </div>
              {visibleColDefs.map(col => (
                <div
                  key={col.igDisplayName}
                  className="shrink-0 px-3 py-2 font-semibold text-xs border-r"
                  style={{ width: DATA_COL_WIDTH, minWidth: DATA_COL_WIDTH }}
                >
                  <div className="truncate" title={col.igDisplayName}>
                    {col.igDisplayName.split('#')[0]}
                  </div>
                  <div className="font-normal text-muted-foreground text-[10px] truncate">
                    #{col.igDisplayName.split('#')[1]} · {col.profileName}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Virtual rows — positioned inside this relative container ── */}
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map(vRow => {
                const row = filteredRows[vRow.index]
                const isConsensus = consensusPaths.has(row.normalizedPath)
                const depth = row.normalizedPath.split('.').length - 1

                return (
                  <div
                    key={row.normalizedPath}
                    style={{
                      position: 'absolute',
                      top: `${vRow.start}px`,
                      width: '100%',
                      height: `${vRow.size}px`,
                    }}
                    className={cn(
                      'flex border-b hover:bg-accent/30 transition-colors',
                      isConsensus && 'bg-green-50/50 dark:bg-green-950/20',
                      row.presentCount === 1 && 'opacity-60'
                    )}
                  >
                    {/* Path cell */}
                    <div
                      className="shrink-0 flex items-center font-mono text-[11px] text-muted-foreground border-r overflow-hidden"
                      style={{
                        width: PATH_COL_WIDTH,
                        minWidth: PATH_COL_WIDTH,
                        paddingLeft: `${8 + depth * 8}px`,
                        paddingRight: 8,
                      }}
                    >
                      <span className="truncate" title={row.normalizedPath}>
                        {row.normalizedPath.split('.').pop()}
                      </span>
                      {isConsensus && (
                        <span className="ml-1 shrink-0 text-green-600" title="In intersection">●</span>
                      )}
                    </div>

                    {/* Data cells */}
                    {visibleColDefs.map(col => {
                      const colIdx = table.columns.findIndex(c => c.igDisplayName === col.igDisplayName)
                      const cell = row.cells[colIdx]
                      return (
                        <div
                          key={col.igDisplayName}
                          className="shrink-0 border-r overflow-hidden"
                          style={{ width: DATA_COL_WIDTH, minWidth: DATA_COL_WIDTH }}
                        >
                          {cell ? (
                            <DiffCell cell={cell} />
                          ) : (
                            <div className="h-full px-3 flex items-center">
                              <span className="text-muted-foreground/30 text-[10px]">—</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
