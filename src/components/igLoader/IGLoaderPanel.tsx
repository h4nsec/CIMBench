import { useState } from 'react'
import { Plus, Package, Globe, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePackageLoader } from '@/hooks/usePackageLoader'
import { IGBrowserPanel } from './IGBrowserPanel'

// Well-known IGs for quick-load
const PRESETS = [
  { id: 'hl7.fhir.us.core', version: '7.0.0', label: 'US Core 7.0.0' },
  { id: 'hl7.fhir.us.core', version: '6.1.0', label: 'US Core 6.1.0' },
  { id: 'hl7.fhir.au.base', version: '6.0.0', label: 'AU Base 6.0.0' },
  { id: 'hl7.fhir.au.core', version: '1.0.0', label: 'AU Core 1.0.0' },
  { id: 'hl7.fhir.uv.ips', version: '1.1.0', label: 'IPS 1.1.0' },
  { id: 'hl7.fhir.ca.baseline', version: '1.2.0', label: 'CA Baseline 1.2.0' },
  { id: 'nictiz.fhir.nl.r4.nl-core', version: '0.10.0', label: 'NL Core 0.10.0' },
]

export function IGLoaderPanel() {
  const [packageId, setPackageId] = useState('')
  const [version, setVersion] = useState('latest')
  const [showBrowser, setShowBrowser] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const { loadPackage, loadFromUrl } = usePackageLoader()

  const handleLoad = () => {
    if (!packageId.trim()) return
    loadPackage(packageId.trim(), version.trim() || 'latest')
    setPackageId('')
    setVersion('latest')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLoad()
  }

  return (
    <>
    {showBrowser && <IGBrowserPanel onClose={() => setShowBrowser(false)} />}
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Package size={15} />
          Load FHIR Package
        </div>
        <button
          onClick={() => setShowBrowser(true)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          title="Browse FHIR IG registry"
        >
          <Globe size={11} />
          Browse
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <Label className="text-xs text-muted-foreground">Package ID</Label>
          <Input
            placeholder="e.g. hl7.fhir.us.core"
            value={packageId}
            onChange={e => setPackageId(e.target.value)}
            onKeyDown={handleKeyDown}
            className="mt-1 text-xs h-8"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Version</Label>
          <Input
            placeholder="e.g. 6.1.0"
            value={version}
            onChange={e => setVersion(e.target.value)}
            onKeyDown={handleKeyDown}
            className="mt-1 text-xs h-8"
          />
        </div>
        <Button size="sm" className="w-full h-8 text-xs" onClick={handleLoad} disabled={!packageId.trim()}>
          <Plus size={13} />
          Load Package
        </Button>
      </div>

      {/* Direct URL load */}
      <div>
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          <Link size={10} /> Load from URL
        </Label>
        <div className="flex gap-1 mt-1">
          <Input
            placeholder="https://build.fhir.org/ig/HL7/…"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && urlInput.trim()) {
                loadFromUrl(urlInput.trim())
                setUrlInput('')
              }
            }}
            className="text-xs h-8 font-mono flex-1 min-w-0"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2 text-xs shrink-0"
            disabled={!urlInput.trim()}
            onClick={() => { loadFromUrl(urlInput.trim()); setUrlInput('') }}
          >
            Load
          </Button>
        </div>
      </div>

      {/* Quick-load presets */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">Quick Load</p>
        <div className="space-y-1">
          {PRESETS.map(p => (
            <button
              key={`${p.id}#${p.version}`}
              onClick={() => loadPackage(p.id, p.version)}
              className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
    </>
  )
}
