import { Filter, Layers, Eye, HelpCircle } from 'lucide-react'
import { useDiffStore } from '@/stores/diffStore'
import { useIntersection } from '@/hooks/useIntersection'
import { useIntersectionStore } from '@/stores/intersectionStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export function DiffTableToolbar({ onHelpToggle, helpOpen }: { onHelpToggle: () => void; helpOpen: boolean }) {
  const {
    table, visibleColumns, toggleColumn,
    showMustSupportOnly, setMustSupportOnly,
    showExtensions, setShowExtensions,
    pathFilter, setPathFilter,
    getFilteredRows,
  } = useDiffStore()
  const { runIntersection } = useIntersection()
  const { config, setConfig, result } = useIntersectionStore()

  if (!table) return null

  const filteredCount = getFilteredRows().length

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b bg-muted/20 text-xs">
      {/* Path filter */}
      <div className="relative flex-1 min-w-40 max-w-64">
        <Filter size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter paths…"
          value={pathFilter}
          onChange={e => setPathFilter(e.target.value)}
          className="pl-6 h-7 text-xs"
        />
      </div>

      {/* Toggle buttons */}
      <button
        onClick={() => setMustSupportOnly(!showMustSupportOnly)}
        className={cn(
          'px-2 py-1 rounded border text-xs transition-colors',
          showMustSupportOnly
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background border-input hover:bg-accent'
        )}
      >
        MS Only
      </button>

      <button
        onClick={() => setShowExtensions(!showExtensions)}
        className={cn(
          'px-2 py-1 rounded border text-xs transition-colors',
          !showExtensions
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background border-input hover:bg-accent'
        )}
      >
        <Eye size={11} className="inline mr-1" />
        {showExtensions ? 'Hide Ext.' : 'Show Ext.'}
      </button>

      {/* Column toggles */}
      <div className="flex items-center gap-1 border-l pl-2">
        <Layers size={11} className="text-muted-foreground" />
        {table.columns.map(col => (
          <button
            key={col.igDisplayName}
            onClick={() => toggleColumn(col.igDisplayName)}
            title={col.igDisplayName}
            className={cn(
              'px-1.5 py-1 rounded text-[10px] border transition-colors max-w-24 truncate',
              visibleColumns.includes(col.igDisplayName)
                ? 'bg-secondary border-secondary-foreground/20 text-secondary-foreground'
                : 'bg-background border-input text-muted-foreground line-through'
            )}
          >
            {col.igDisplayName.split('#')[0].split('.').pop()}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-muted-foreground">{filteredCount} rows</span>

        {/* Threshold slider inline */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Threshold:</span>
          <input
            type="range"
            min={1}
            max={100}
            value={Math.round(config.threshold * 100)}
            onChange={e => setConfig({ threshold: parseInt(e.target.value) / 100 })}
            className="w-20 accent-primary"
          />
          <span className="w-8 text-right font-mono">{Math.round(config.threshold * 100)}%</span>
        </div>

        <Button size="sm" className="h-7 text-xs" onClick={runIntersection}>
          Run Intersection
        </Button>

        {result && (
          <span className="text-green-600 font-medium">
            ✓ {result.elements.length} common
          </span>
        )}

        <button
          onClick={onHelpToggle}
          title="How to use this table"
          className={cn(
            'p-1 rounded transition-colors',
            helpOpen
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
        >
          <HelpCircle size={15} />
        </button>
      </div>
    </div>
  )
}
