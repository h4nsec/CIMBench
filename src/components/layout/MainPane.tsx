import { useDiffStore } from '@/stores/diffStore'
import { useIntersectionStore } from '@/stores/intersectionStore'
import { DiffTableView } from '@/components/diff/DiffTableView'
import { IntersectionPanel } from '@/components/intersection/IntersectionPanel'
import { GeneratorPanel } from '@/components/generator/GeneratorPanel'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GitCompare, Layers, Code } from 'lucide-react'

export function MainPane() {
  const { table } = useDiffStore()
  const { result, artifacts } = useIntersectionStore()

  if (!table) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="text-4xl opacity-20">⚕</div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">CIMBench</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Load FHIR packages from the sidebar, search for a profile type (e.g. <code className="bg-muted px-1 rounded">Endpoint</code>), then compare and intersect.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-xs text-muted-foreground max-w-md">
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-muted/20">
            <span className="text-2xl">📦</span>
            <span className="font-medium">1. Load IGs</span>
            <span>Add FHIR packages from packages.fhir.org</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-muted/20">
            <span className="text-2xl">🔍</span>
            <span className="font-medium">2. Search</span>
            <span>Find profiles by type or name across all IGs</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-muted/20">
            <span className="text-2xl">⚗️</span>
            <span className="font-medium">3. Intersect</span>
            <span>Find common elements and generate a base profile</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Tabs defaultValue="diff" className="flex flex-col h-full">
        <div className="flex items-center px-4 py-2 border-b gap-4">
          <TabsList className="h-8">
            <TabsTrigger value="diff" className="text-xs h-7 gap-1">
              <GitCompare size={12} />
              Diff Table
              {table && <span className="ml-1 text-muted-foreground">({table.rows.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="intersection" className="text-xs h-7 gap-1">
              <Layers size={12} />
              Intersection
              {result && <span className="ml-1 text-green-600">({result.elements.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="generator" className="text-xs h-7 gap-1" disabled={!result}>
              <Code size={12} />
              Generator
              {artifacts && <span className="ml-1 text-muted-foreground">✓</span>}
            </TabsTrigger>
          </TabsList>
          <div className="text-xs text-muted-foreground">
            Base type: <code className="bg-muted px-1 rounded">{table.baseType}</code>
            {' · '}{table.columns.length} IGs
          </div>
        </div>

        <TabsContent value="diff" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
          <DiffTableView />
        </TabsContent>

        <TabsContent value="intersection" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
          <IntersectionPanel />
        </TabsContent>

        <TabsContent value="generator" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
          <GeneratorPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
