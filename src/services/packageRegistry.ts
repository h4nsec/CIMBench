const PRIMARY = 'https://packages.fhir.org'
const FALLBACK = 'https://packages2.fhir.org'

export interface FetchProgress {
  stage: 'fetching' | 'done'
  bytesLoaded: number
  bytesTotal?: number
}

// In-memory cache keyed by "packageId#version"
const cache = new Map<string, Uint8Array>()

export async function fetchPackage(
  packageId: string,
  version: string,
  onProgress?: (p: FetchProgress) => void
): Promise<Uint8Array> {
  const key = `${packageId}#${version}`
  if (cache.has(key)) return cache.get(key)!

  const url = `${PRIMARY}/${packageId}/${version}`
  const fallbackUrl = `${FALLBACK}/${packageId}/${version}`

  let bytes: Uint8Array

  try {
    bytes = await fetchWithProgress(url, onProgress)
  } catch {
    // Try fallback registry
    bytes = await fetchWithProgress(fallbackUrl, onProgress)
  }

  cache.set(key, bytes)
  return bytes
}

async function fetchWithProgress(
  url: string,
  onProgress?: (p: FetchProgress) => void
): Promise<Uint8Array> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`)
  }

  const contentLength = response.headers.get('content-length')
  const total = contentLength ? parseInt(contentLength, 10) : undefined

  const reader = response.body?.getReader()
  if (!reader) {
    // Fallback: read all at once
    const buffer = await response.arrayBuffer()
    onProgress?.({ stage: 'done', bytesLoaded: buffer.byteLength, bytesTotal: buffer.byteLength })
    return new Uint8Array(buffer)
  }

  const chunks: Uint8Array[] = []
  let loaded = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.length
    onProgress?.({ stage: 'fetching', bytesLoaded: loaded, bytesTotal: total })
  }

  onProgress?.({ stage: 'done', bytesLoaded: loaded, bytesTotal: loaded })

  // Concatenate chunks
  const result = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

/** Search the registry for packages matching a query string */
export async function searchPackages(query: string): Promise<PackageSearchResult[]> {
  try {
    const url = `${PRIMARY}/-/v1/search?text=${encodeURIComponent(query)}&size=20`
    const resp = await fetch(url)
    if (!resp.ok) return []
    const data = await resp.json()
    // packages.fhir.org returns { objects: [{ package: { name, version, description } }] }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.objects ?? []).map((o: any) => ({
      name: o.package?.name ?? '',
      version: o.package?.version ?? '',
      description: o.package?.description ?? '',
      fhirVersion: o.package?.fhirVersions?.[0] ?? '',
    }))
  } catch {
    return []
  }
}

export interface PackageSearchResult {
  name: string
  version: string
  description: string
  fhirVersion: string
}

/** Get available versions for a package */
export async function getPackageVersions(packageId: string): Promise<string[]> {
  try {
    const url = `${PRIMARY}/${packageId}`
    const resp = await fetch(url)
    if (!resp.ok) return []
    const data = await resp.json()
    // Returns { versions: { "6.1.0": {...}, ... } }
    return Object.keys(data.versions ?? {}).reverse()
  } catch {
    return []
  }
}

/**
 * Fetch a package .tgz from any arbitrary URL (e.g. build.fhir.org CI builds).
 * Normalises build.fhir.org IG page URLs to the package.tgz path automatically.
 */
export async function fetchPackageFromUrl(
  url: string,
  onProgress?: (p: FetchProgress) => void
): Promise<Uint8Array> {
  const tgzUrl = resolveTgzUrl(url)
  if (cache.has(tgzUrl)) return cache.get(tgzUrl)!
  const bytes = await fetchWithProgress(tgzUrl, onProgress)
  cache.set(tgzUrl, bytes)
  return bytes
}

/**
 * Given a build.fhir.org IG URL like:
 *   https://build.fhir.org/ig/HL7/fhir-us-ndh/
 *   https://build.fhir.org/ig/HL7/fhir-us-ndh
 *   https://build.fhir.org/ig/HL7/fhir-us-ndh/package.tgz
 * returns the canonical package.tgz URL.
 * Non-build URLs are returned as-is (assumed to already point to a .tgz).
 */
export function resolveTgzUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '')
  if (trimmed.endsWith('.tgz') || trimmed.endsWith('.tar.gz')) return trimmed
  // build.fhir.org IG page → append /package.tgz
  if (trimmed.includes('build.fhir.org/ig/')) return `${trimmed}/package.tgz`
  // Fallback: assume direct tgz URL
  return trimmed
}

export function clearCache() {
  cache.clear()
}
