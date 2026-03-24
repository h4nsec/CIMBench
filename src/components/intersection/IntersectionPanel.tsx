import { useIntersectionStore } from '@/stores/intersectionStore'
import { useDiffStore } from '@/stores/diffStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { strengthColor } from '@/lib/bindingUtils'
import { cn } from '@/lib/cn'
import { AlertTriangle, CheckCircle, Download } from 'lucide-react'
import { useIntersection } from '@/hooks/useIntersection'
import type { IntersectionElement } from '@/types/intersection'

export function IntersectionPanel() {
  const { result, config } = useIntersectionStore()
  const { table } = useDiffStore()
  const { generateOutput } = useIntersection()

  if (!table) return null

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Run intersection to see common elements
      </div>
    )
  }

  const coverageGroups = {
    all: result.elements.filter(e => e.coverageRatio === 1),
    majority: result.elements.filter(e => e.coverageRatio >= config.threshold && e.coverageRatio < 1),
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header stats */}
      <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/20 text-xs flex-wrap">
        <div className="flex items-center gap-1.5">
          <CheckCircle size={13} className="text-green-600" />
          <span className="font-semibold">{result.elements.length} common elements</span>
        </div>
        <div className="text-muted-foreground">
          across {result.totalProfiles} profiles
        </div>
        <div>
          <Badge variant="info" className="text-[10px]">{coverageGroups.all.length} in all IGs</Badge>
        </div>
        <div>
          <Badge variant="warning" className="text-[10px]">{coverageGroups.majority.length} in majority</Badge>
        </div>
        {result.conflicts.length > 0 && (
          <div>
            <Badge variant="destructive" className="text-[10px]">
              {result.conflicts.length} conflicts
            </Badge>
          </div>
        )}
        <div className="ml-auto">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={generateOutput}>
            <Download size={12} />
            Generate Profile
          </Button>
        </div>
      </div>

      {/* Element list */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-background border-b">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground w-56">Element</th>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground w-20">Card.</th>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground w-32">Types</th>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground w-28">Binding</th>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground w-16">MS</th>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {result.elements.map(el => (
              <IntersectionRow key={el.normalizedPath} element={el} total={result.totalProfiles} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IntersectionRow({ element: el, total }: { element: IntersectionElement; total: number }) {
  const hasConflict = el.cardinalityResolution === 'conflict' || el.typeConflict
  const depth = el.normalizedPath.split('.').length - 1

  return (
    <tr className={cn(
      'border-b hover:bg-accent/30 transition-colors',
      hasConflict && 'bg-red-50/50',
    )}>
      {/* Path */}
      <td className="px-3 py-1.5" style={{ paddingLeft: `${12 + depth * 8}px` }}>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[11px]">
            {el.normalizedPath.split('.').pop()}
          </span>
          {hasConflict && (
            <span title="Conflict — review required"><AlertTriangle size={11} className="text-orange-500 shrink-0" /></span>
          )}
        </div>
        {el.shortDescription && (
          <div className="text-[10px] text-muted-foreground truncate max-w-48" title={el.shortDescription}>
            {el.shortDescription}
          </div>
        )}
      </td>

      {/* Cardinality */}
      <td className="px-3 py-1.5">
        <span className={cn('font-mono text-[11px]', el.cardinalityResolution === 'conflict' && 'text-red-600 line-through')}>
          {el.cardinalityString}
        </span>
      </td>

      {/* Types */}
      <td className="px-3 py-1.5">
        {el.typeConflict ? (
          <span className="text-[10px] text-red-600">conflict</span>
        ) : (
          <span className="text-[10px] text-muted-foreground">
            {el.consensusTypes.join(' | ') || '—'}
          </span>
        )}
      </td>

      {/* Binding */}
      <td className="px-3 py-1.5">
        {el.consensusBinding ? (
          <div>
            <span className={cn('text-[9px] px-1 rounded', strengthColor(el.consensusBinding.strength))}>
              {el.consensusBinding.strength}
            </span>
            {el.consensusBinding.valueSetConflict && (
              <span title="Multiple value sets"><AlertTriangle size={10} className="inline ml-1 text-orange-500" /></span>
            )}
          </div>
        ) : '—'}
      </td>

      {/* Must Support */}
      <td className="px-3 py-1.5">
        <div className="flex flex-col items-center gap-0.5">
          {el.consensusMustSupport && (
            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1 rounded">MS</span>
          )}
          <span className="text-[10px] text-muted-foreground">{el.mustSupportCount}/{el.presentInCount}</span>
        </div>
      </td>

      {/* Coverage bar */}
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 bg-muted rounded-full h-1.5 max-w-20">
            <div
              className={cn('h-1.5 rounded-full', el.coverageRatio === 1 ? 'bg-green-500' : 'bg-blue-400')}
              style={{ width: `${el.coverageRatio * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-10">
            {el.presentInCount}/{total}
          </span>
        </div>
      </td>
    </tr>
  )
}
