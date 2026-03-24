import { useState, useEffect, useRef } from 'react'
import { Search, X, Globe, GitBranch, Star, Loader2, ExternalLink, Link } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePackageLoader } from '@/hooks/usePackageLoader'
import { searchPackages, type PackageSearchResult } from '@/services/packageRegistry'

// ── Curated popular IGs grouped by realm ────────────────────────────────────
const POPULAR: Record<string, { id: string; version: string; label: string; desc: string }[]> = {
  '🌍 International': [
    { id: 'hl7.fhir.uv.ips', version: '1.1.0', label: 'IPS', desc: 'International Patient Summary' },
    { id: 'hl7.fhir.uv.smart-app-launch', version: '2.1.0', label: 'SMART App Launch', desc: 'OAuth2 SMART on FHIR' },
    { id: 'hl7.fhir.uv.sdc', version: '3.0.0', label: 'SDC', desc: 'Structured Data Capture' },
    { id: 'hl7.fhir.uv.bulkdata', version: '2.0.0', label: 'Bulk Data', desc: 'Bulk Data Access' },
    { id: 'ihe.iti.mhd', version: '4.2.2', label: 'MHD', desc: 'Mobile access to Health Documents' },
    { id: 'ihe.iti.pdqm', version: '3.0.0', label: 'PDQm', desc: 'Patient Demographics Query for Mobile' },
  ],
  '🇺🇸 United States': [
    { id: 'hl7.fhir.us.core', version: '7.0.0', label: 'US Core 7', desc: 'US Core Implementation Guide' },
    { id: 'hl7.fhir.us.core', version: '6.1.0', label: 'US Core 6.1', desc: 'US Core (2023 release)' },
    { id: 'hl7.fhir.us.davinci-pdex', version: '2.0.0', label: 'PDex', desc: 'Da Vinci Payer Data Exchange' },
    { id: 'hl7.fhir.us.davinci-hrex', version: '1.0.0', label: 'HRex', desc: 'Da Vinci Health Record Exchange' },
    { id: 'hl7.fhir.us.carin-bb', version: '2.0.0', label: 'CARIN BB', desc: 'CARIN Blue Button' },
    { id: 'hl7.fhir.us.mcode', version: '3.0.0', label: 'mCODE', desc: 'Minimal Common Oncology Data Elements' },
  ],
  '🇦🇺 Australia': [
    { id: 'hl7.fhir.au.base', version: '6.0.0', label: 'AU Base 6', desc: 'Australian Base IG (latest)' },
    { id: 'hl7.fhir.au.core', version: '1.0.0', label: 'AU Core', desc: 'Australian Core IG' },
    { id: 'hl7.fhir.au.erequesting', version: '0.3.0', label: 'AU eRequesting', desc: 'AU Electronic Requesting' },
  ],
  '🇳🇱 Netherlands': [
    { id: 'nictiz.fhir.nl.r4.nl-core', version: '0.10.0', label: 'NL Core', desc: 'Dutch national core profiles' },
    { id: 'nictiz.fhir.nl.r4.zib2020', version: '0.10.0', label: 'NL Zib2020', desc: 'Dutch Zorginformatiebouwstenen 2020' },
  ],
  '🇨🇦 Canada': [
    { id: 'hl7.fhir.ca.baseline', version: '1.2.0', label: 'CA Baseline', desc: 'Canadian Baseline IG' },
  ],
  '🇩🇪 Germany': [
    { id: 'de.basisprofil.r4', version: '1.4.0', label: 'DE Basis', desc: 'German Basis Profiles' },
    { id: 'de.gematik.isik-basis', version: '4.0.1', label: 'ISiK Basis', desc: 'Informationstechnische Systeme im Krankenhaus' },
  ],
}

// ── CI Build entry from build.fhir.org/ig/qas.json ──────────────────────────
interface CIBuild {
  name: string
  'package-id': string
  version?: string
  ig?: string
  'build-id'?: string
  repo?: string
  date?: string
}

export function IGBrowserPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'popular' | 'search' | 'ci'>('popular')
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PackageSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [ciBuilds, setCiBuilds] = useState<CIBuild[]>([])
  const [ciFilter, setCiFilter] = useState('')
  const [ciLoading, setCiLoading] = useState(false)
  const [ciError, setCiError] = useState('')
  const [directUrl, setDirectUrl] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { loadPackage, loadFromUrl } = usePackageLoader()

  // ── Registry search with debounce ─────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'search') return
    if (!query.trim()) { setSearchResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchPackages(query.trim())
        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, tab])

  // ── Load CI builds from build.fhir.org ────────────────────────────────────
  useEffect(() => {
    if (tab !== 'ci' || ciBuilds.length > 0) return
    setCiLoading(true)
    setCiError('')
    fetch('https://build.fhir.org/ig/qas.json')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data: CIBuild[]) => {
        // Deduplicate by package-id, keep first occurrence
        const seen = new Set<string>()
        const unique = data.filter(b => {
          if (!b['package-id'] || seen.has(b['package-id'])) return false
          seen.add(b['package-id'])
          return true
        })
        setCiBuilds(unique)
      })
      .catch(e => setCiError(String(e)))
      .finally(() => setCiLoading(false))
  }, [tab, ciBuilds.length])

  const handleLoad = (id: string, version: string) => {
    loadPackage(id, version || 'current')
    onClose()
  }

  const filteredCI = ciBuilds.filter(b => {
    if (!ciFilter.trim()) return true
    const f = ciFilter.toLowerCase()
    return b['package-id']?.toLowerCase().includes(f) || b.name?.toLowerCase().includes(f)
  })

  const tabs: { key: typeof tab; label: string; icon: React.ReactNode }[] = [
    { key: 'popular', label: 'Popular', icon: <Star size={12} /> },
    { key: 'search', label: 'Registry Search', icon: <Search size={12} /> },
    { key: 'ci', label: 'CI Builds', icon: <GitBranch size={12} /> },
  ]

  return (
    // Full-screen overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border rounded-lg shadow-2xl w-[680px] max-h-[80vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-primary" />
            <span className="font-semibold text-sm">Browse FHIR IGs</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-4 gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── POPULAR ── */}
          {tab === 'popular' && (
            <div className="p-3 space-y-4">
              {Object.entries(POPULAR).map(([realm, igs]) => (
                <div key={realm}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5 px-1">{realm}</p>
                  <div className="space-y-1">
                    {igs.map(ig => (
                      <IGRow
                        key={`${ig.id}#${ig.version}`}
                        id={ig.id}
                        version={ig.version}
                        label={ig.label}
                        desc={ig.desc}
                        onLoad={handleLoad}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── REGISTRY SEARCH ── */}
          {tab === 'search' && (
            <div className="p-3 space-y-3">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search packages.fhir.org…"
                  className="pl-8 h-8 text-xs"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {searching && (
                  <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
                )}
              </div>

              {!query.trim() && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Type to search the FHIR package registry
                </p>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-1">
                  {searchResults.map(r => (
                    <IGRow
                      key={`${r.name}#${r.version}`}
                      id={r.name}
                      version={r.version}
                      label={r.name}
                      desc={r.description || ''}
                      fhirVersion={r.fhirVersion}
                      onLoad={handleLoad}
                    />
                  ))}
                </div>
              )}

              {query.trim() && !searching && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No results found</p>
              )}
            </div>
          )}

          {/* ── CI BUILDS ── */}
          {tab === 'ci' && (
            <div className="p-3 space-y-3">

              {/* Direct URL loader */}
              <div className="rounded-md border bg-muted/30 p-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                  <Link size={10} />
                  Load directly from any build.fhir.org URL
                </div>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="https://build.fhir.org/ig/HL7/fhir-us-ndh/"
                    className="h-7 text-xs flex-1 font-mono"
                    value={directUrl}
                    onChange={e => setDirectUrl(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && directUrl.trim()) {
                        loadFromUrl(directUrl.trim())
                        setDirectUrl('')
                        onClose()
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-7 px-2 text-xs shrink-0"
                    disabled={!directUrl.trim()}
                    onClick={() => {
                      loadFromUrl(directUrl.trim())
                      setDirectUrl('')
                      onClose()
                    }}
                  >
                    Load
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Paste any CI build page URL — the app will fetch <code className="bg-muted px-0.5 rounded">package.tgz</code> automatically
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Filter CI builds from qas.json…"
                    className="pl-8 h-8 text-xs"
                    value={ciFilter}
                    onChange={e => setCiFilter(e.target.value)}
                  />
                </div>
                <a
                  href="https://build.fhir.org/ig"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  build.fhir.org <ExternalLink size={11} />
                </a>
              </div>

              {ciLoading && (
                <div className="flex items-center justify-center py-12 gap-2 text-xs text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  Loading CI builds from build.fhir.org…
                </div>
              )}

              {ciError && (
                <div className="text-xs text-destructive text-center py-8">
                  Failed to load CI builds: {ciError}
                  <br />
                  <button className="underline mt-1" onClick={() => { setCiBuilds([]); setCiError('') }}>
                    Retry
                  </button>
                </div>
              )}

              {!ciLoading && !ciError && filteredCI.length > 0 && (
                <div className="space-y-1">
                  {filteredCI.slice(0, 200).map(b => (
                    <IGRow
                      key={b['package-id']}
                      id={b['package-id']}
                      version={b.version || 'current'}
                      label={b.name || b['package-id']}
                      desc={b.repo || ''}
                      badge="CI"
                      onLoad={handleLoad}
                    />
                  ))}
                  {filteredCI.length > 200 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Showing 200 of {filteredCI.length} — filter to narrow results
                    </p>
                  )}
                </div>
              )}

              {!ciLoading && !ciError && ciBuilds.length > 0 && filteredCI.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No builds match filter</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Reusable row component ───────────────────────────────────────────────────
function IGRow({
  id, version, label, desc, fhirVersion, badge, onLoad,
}: {
  id: string
  version: string
  label: string
  desc: string
  fhirVersion?: string
  badge?: string
  onLoad: (id: string, version: string) => void
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent group transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium truncate">{label}</span>
          {label !== id && (
            <span className="text-[10px] text-muted-foreground font-mono truncate">{id}</span>
          )}
          {badge && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{badge}</Badge>
          )}
          {fhirVersion && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">{fhirVersion}</Badge>
          )}
        </div>
        {desc && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{desc}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-muted-foreground font-mono">{version}</span>
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onLoad(id, version)}
        >
          Load
        </Button>
      </div>
    </div>
  )
}
