import { useState } from 'react'
import { useIntersectionStore } from '@/stores/intersectionStore'
import { useIntersection } from '@/hooks/useIntersection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Download, Copy, RefreshCw } from 'lucide-react'
import { downloadText } from '@/lib/downloadUtils'
import toast from 'react-hot-toast'

export function GeneratorPanel() {
  const { result, generatorConfig, setGeneratorConfig, artifacts } = useIntersectionStore()
  const { generateOutput } = useIntersection()
  const [activeTab, setActiveTab] = useState<'fsh' | 'json'>('fsh')

  if (!result) return null

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Config form */}
      <div className="grid grid-cols-2 gap-3 px-4 py-3 border-b bg-muted/20">
        <div>
          <Label className="text-xs text-muted-foreground">Profile Name</Label>
          <Input
            value={generatorConfig.profileName}
            onChange={e => setGeneratorConfig({ profileName: e.target.value })}
            className="mt-1 h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Profile ID</Label>
          <Input
            value={generatorConfig.profileId}
            onChange={e => setGeneratorConfig({ profileId: e.target.value })}
            className="mt-1 h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Canonical URL Base</Label>
          <Input
            value={generatorConfig.canonical}
            onChange={e => setGeneratorConfig({ canonical: e.target.value })}
            className="mt-1 h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">FHIR Version</Label>
          <Input
            value={generatorConfig.fhirVersion}
            onChange={e => setGeneratorConfig({ fhirVersion: e.target.value })}
            className="mt-1 h-8 text-xs"
          />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={generatorConfig.includeComments}
              onChange={e => setGeneratorConfig({ includeComments: e.target.checked })}
            />
            Include comments
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={generatorConfig.includeConflictNotes}
              onChange={e => setGeneratorConfig({ includeConflictNotes: e.target.checked })}
            />
            Include conflict notes
          </label>
          <Button size="sm" className="h-8 text-xs ml-auto gap-1" onClick={generateOutput}>
            <RefreshCw size={12} />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Output tabs */}
      {artifacts ? (
        <div className="flex-1 flex flex-col overflow-hidden px-4 py-3">
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'fsh' | 'json')}>
            <div className="flex items-center justify-between mb-2">
              <TabsList>
                <TabsTrigger value="fsh">FSH</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => handleCopy(activeTab === 'fsh' ? artifacts.fshSource : artifacts.structureDefinitionJson)}
                >
                  <Copy size={11} />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => {
                    if (activeTab === 'fsh') {
                      downloadText(artifacts.fshSource, `${artifacts.profileId}.fsh`)
                    } else {
                      downloadText(artifacts.structureDefinitionJson, `StructureDefinition-${artifacts.profileId}.json`, 'application/json')
                    }
                  }}
                >
                  <Download size={11} />
                  Download
                </Button>
              </div>
            </div>

            <TabsContent value="fsh" className="flex-1 overflow-auto">
              <pre className="bg-muted/40 rounded p-3 text-[11px] font-mono leading-relaxed overflow-auto max-h-96 whitespace-pre-wrap">
                {artifacts.fshSource}
              </pre>
            </TabsContent>
            <TabsContent value="json" className="flex-1 overflow-auto">
              <pre className="bg-muted/40 rounded p-3 text-[11px] font-mono leading-relaxed overflow-auto max-h-96 whitespace-pre-wrap">
                {artifacts.structureDefinitionJson}
              </pre>
            </TabsContent>
          </Tabs>

          <div className="mt-2 text-xs text-muted-foreground">
            {artifacts.elementCount} elements · Generated from {artifacts.sourceIGs.length} IGs ·{' '}
            {new Date(artifacts.generatedAt).toLocaleTimeString()}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          Configure options above and click Regenerate
        </div>
      )}
    </div>
  )
}
