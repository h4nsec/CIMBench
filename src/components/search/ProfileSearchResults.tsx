import { CheckSquare, Square, GitCompare } from 'lucide-react'
import { useSearchStore } from '@/stores/searchStore'
import { useDiffStore } from '@/stores/diffStore'
import { useIntersectionStore } from '@/stores/intersectionStore'
import { useIntersection } from '@/hooks/useIntersection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export function ProfileSearchResults() {
  const { matchedProfiles, selectedProfileUrls, toggleProfile, selectAll, clearAll, query } =
    useSearchStore()
  const { clearTable } = useDiffStore()
  const { clear: clearIntersection } = useIntersectionStore()
  const { runDiff } = useIntersection()

  if (!query.trim()) return null

  if (matchedProfiles.length === 0) {
    return (
      <div className="text-xs text-muted-foreground px-1 py-2">
        No profiles found for "{query}"
      </div>
    )
  }

  const handleRunDiff = () => {
    clearTable()
    clearIntersection()
    runDiff()
  }

  const selectedCount = selectedProfileUrls.size

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {matchedProfiles.length} match{matchedProfiles.length !== 1 ? 'es' : ''}
        </span>
        <div className="flex gap-1">
          <button onClick={selectAll} className="text-[10px] text-primary hover:underline">
            All
          </button>
          <span className="text-[10px] text-muted-foreground">/</span>
          <button onClick={clearAll} className="text-[10px] text-primary hover:underline">
            None
          </button>
        </div>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {matchedProfiles.map(p => {
          const isSelected = selectedProfileUrls.has(p.sd.url)
          return (
            <button
              key={p.sd.url}
              onClick={() => toggleProfile(p.sd.url)}
              className={cn(
                'w-full flex items-start gap-2 rounded px-2 py-1.5 text-xs text-left transition-colors',
                isSelected ? 'bg-primary/10' : 'hover:bg-accent'
              )}
            >
              <span className="mt-0.5 shrink-0 text-primary">
                {isSelected ? <CheckSquare size={12} /> : <Square size={12} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.sd.title ?? p.sd.name}</div>
                <div className="text-muted-foreground truncate">{p.igDisplayName}</div>
                <Badge variant="outline" className="text-[10px] px-1 py-0 mt-0.5">
                  {p.sd.type}
                </Badge>
              </div>
            </button>
          )
        })}
      </div>

      <Button
        size="sm"
        className="w-full h-8 text-xs"
        disabled={selectedCount < 2}
        onClick={handleRunDiff}
      >
        <GitCompare size={13} />
        Compare {selectedCount > 0 ? `(${selectedCount})` : ''}
      </Button>
      {selectedCount < 2 && (
        <p className="text-[10px] text-muted-foreground text-center">
          Select at least 2 profiles to compare
        </p>
      )}
    </div>
  )
}
