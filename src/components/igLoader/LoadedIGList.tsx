import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useIGStore } from '@/stores/igStore'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

export function LoadedIGList() {
  const { igs, loadingProgress, removeIG } = useIGStore()
  const entries = Object.values(igs)

  if (entries.length === 0) return null

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Loaded ({entries.length})
      </p>
      {entries.map(ig => {
        const progress = loadingProgress[ig.displayName]
        const isLoading = ig.status === 'fetching' || ig.status === 'extracting' || ig.status === 'parsing'

        return (
          <div
            key={ig.displayName}
            className={cn(
              'flex items-start gap-2 rounded-md px-2 py-1.5 text-xs group',
              ig.status === 'ready' && 'bg-green-50 border border-green-100',
              ig.status === 'error' && 'bg-red-50 border border-red-100',
              isLoading && 'bg-blue-50 border border-blue-100',
            )}
          >
            <div className="mt-0.5 shrink-0">
              {isLoading && <Loader2 size={12} className="animate-spin text-blue-500" />}
              {ig.status === 'ready' && <CheckCircle size={12} className="text-green-600" />}
              {ig.status === 'error' && <AlertCircle size={12} className="text-red-500" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-foreground">{ig.packageId}</div>
              <div className="text-muted-foreground">{ig.version}</div>

              {ig.status === 'ready' && (
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  <Badge variant="info" className="text-[10px] px-1 py-0">
                    {ig.profiles.length} profiles
                  </Badge>
                  {ig.fhirVersion && ig.fhirVersion !== 'unknown' && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      FHIR {ig.fhirVersion}
                    </Badge>
                  )}
                </div>
              )}

              {isLoading && progress?.message && (
                <div className="text-[10px] text-blue-600 mt-0.5 truncate">{progress.message}</div>
              )}

              {ig.status === 'error' && (
                <div className="text-[10px] text-red-600 mt-0.5 line-clamp-2">{ig.errorMessage}</div>
              )}
            </div>

            <button
              onClick={() => removeIG(ig.displayName)}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
              title="Remove"
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
