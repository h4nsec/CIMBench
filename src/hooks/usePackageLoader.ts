import { useCallback } from 'react'
import { useIGStore } from '@/stores/igStore'
import { fetchPackage, fetchPackageFromUrl, resolveTgzUrl } from '@/services/packageRegistry'
import { parsePackage } from '@/services/igParser'
import toast from 'react-hot-toast'

export function usePackageLoader() {
  const { addIG, updateIGStatus, setProgress, getIG } = useIGStore()

  const loadPackage = useCallback(async (packageId: string, version: string) => {
    const key = `${packageId}#${version}`

    // Don't reload if already loaded
    const existing = getIG(key)
    if (existing?.status === 'ready') {
      toast(`${key} is already loaded`)
      return
    }

    // Create a placeholder entry
    addIG({
      packageId,
      version,
      displayName: key,
      fhirVersion: 'unknown',
      status: 'fetching',
      loadedAt: Date.now(),
      profiles: [],
      allStructureDefinitions: {},
    })

    try {
      // Fetch
      setProgress(key, { stage: 'fetching', message: 'Downloading package...' })
      const bytes = await fetchPackage(packageId, version, (p) => {
        setProgress(key, {
          stage: 'fetching',
          bytesLoaded: p.bytesLoaded,
          bytesTotal: p.bytesTotal,
          message: `Downloading... ${formatBytes(p.bytesLoaded)}${p.bytesTotal ? ` / ${formatBytes(p.bytesTotal)}` : ''}`,
        })
      })

      // Parse
      updateIGStatus(key, { status: 'parsing' })
      setProgress(key, { stage: 'extracting', message: 'Parsing FHIR resources...' })

      const ig = await parsePackage(bytes, (msg) => {
        setProgress(key, { stage: 'extracting', message: msg })
      })

      addIG(ig)
      setProgress(key, { stage: 'ready' as const, message: 'Ready' })
      toast.success(`Loaded ${key} — ${ig.profiles.length} profiles`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      updateIGStatus(key, { status: 'error', errorMessage: message })
      setProgress(key, { stage: 'error' as const, message })
      toast.error(`Failed to load ${key}: ${message}`)
    }
  }, [addIG, updateIGStatus, setProgress, getIG])

  /** Load a package directly from a URL (e.g. build.fhir.org CI build page or raw .tgz URL) */
  const loadFromUrl = useCallback(async (rawUrl: string) => {
    const tgzUrl = resolveTgzUrl(rawUrl)
    // Use a temporary key based on the URL until we know the real package ID
    const tempKey = `url:${tgzUrl}`

    const existing = getIG(tempKey)
    if (existing?.status === 'ready') {
      toast(`Already loaded from ${tgzUrl}`)
      return
    }

    addIG({
      packageId: tempKey,
      version: 'url',
      displayName: tgzUrl.replace('https://', '').replace('/package.tgz', ''),
      fhirVersion: 'unknown',
      status: 'fetching',
      loadedAt: Date.now(),
      profiles: [],
      allStructureDefinitions: {},
    })

    try {
      setProgress(tempKey, { stage: 'fetching', message: 'Downloading from URL...' })
      const bytes = await fetchPackageFromUrl(rawUrl, (p) => {
        setProgress(tempKey, {
          stage: 'fetching',
          bytesLoaded: p.bytesLoaded,
          bytesTotal: p.bytesTotal,
          message: `Downloading... ${formatBytes(p.bytesLoaded)}${p.bytesTotal ? ` / ${formatBytes(p.bytesTotal)}` : ''}`,
        })
      })

      updateIGStatus(tempKey, { status: 'parsing' })
      setProgress(tempKey, { stage: 'extracting', message: 'Parsing FHIR resources...' })

      const ig = await parsePackage(bytes, (msg) => {
        setProgress(tempKey, { stage: 'extracting', message: msg })
      })

      // Replace temp entry with real parsed IG
      addIG(ig)
      setProgress(tempKey, { stage: 'ready' as const, message: 'Ready' })
      toast.success(`Loaded ${ig.packageId}#${ig.version} — ${ig.profiles.length} profiles`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      updateIGStatus(tempKey, { status: 'error', errorMessage: message })
      setProgress(tempKey, { stage: 'error' as const, message })
      toast.error(`Failed to load from URL: ${message}`)
    }
  }, [addIG, updateIGStatus, setProgress, getIG])

  return { loadPackage, loadFromUrl }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
