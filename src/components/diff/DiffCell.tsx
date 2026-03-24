import type { DiffCell as DiffCellType } from '@/types/diff'
import { strengthColor } from '@/lib/bindingUtils'
import { cn } from '@/lib/cn'

interface Props {
  cell: DiffCellType
}

export function DiffCell({ cell }: Props) {
  return (
    <div className="px-3 py-1 h-full flex flex-col justify-center gap-0.5">
      {/* Cardinality + Must Support */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[11px] font-medium text-foreground">
          {cell.cardinalityString}
        </span>
        {cell.mustSupport && (
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1 rounded">
            MS
          </span>
        )}
        {cell.isModifier && (
          <span className="text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1 rounded">
            MOD
          </span>
        )}
      </div>

      {/* Types */}
      {cell.types.length > 0 && (
        <div className="text-[10px] text-muted-foreground truncate">
          {cell.types.join(' | ')}
        </div>
      )}

      {/* Binding */}
      {cell.bindingStrength && (
        <div className={cn('text-[9px] px-1 rounded inline-block w-fit', strengthColor(cell.bindingStrength))}>
          {cell.bindingStrength}
          {cell.bindingValueSet && (
            <span
              className="ml-1 opacity-70"
              title={cell.bindingValueSet}
            >
              VS
            </span>
          )}
        </div>
      )}
    </div>
  )
}
