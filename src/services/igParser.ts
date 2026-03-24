import type { StructureDefinition, FhirPackageManifest, PackageIndex } from '@/types/fhir'
import type { LoadedIG, ParsedProfile, NormalizedElement } from '@/types/ig'
import { extractTar, packageJsonFilter } from './tarExtractor'
import { ensureSnapshot } from './snapshotSynthesizer'
import {
  normalizeSlicePath,
  extractSliceName,
  hasSliceName,
  isExtensionPath,
  normalizeValueX,
} from '@/lib/pathUtils'
import { parseMax, cardinalityString } from '@/lib/cardinalityUtils'

const TEXT_DECODER = new TextDecoder('utf-8')

export async function parsePackage(
  gzipBytes: Uint8Array,
  onProgress?: (msg: string) => void
): Promise<LoadedIG> {
  onProgress?.('Extracting package...')

  const allSDs: Record<string, StructureDefinition> = {}
  let manifest: FhirPackageManifest | null = null
  let index: PackageIndex | null = null

  // First pass: collect everything
  for (const entry of extractTar(gzipBytes, packageJsonFilter)) {
    const filename = entry.path.split('/').pop() ?? ''
    const jsonStr = TEXT_DECODER.decode(entry.data)

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      continue
    }

    if (filename === 'package.json') {
      manifest = parsed as FhirPackageManifest
      continue
    }

    if (filename === '.index.json') {
      index = parsed as PackageIndex
      continue
    }

    const obj = parsed as Record<string, unknown>
    if (obj.resourceType === 'StructureDefinition') {
      const sd = obj as unknown as StructureDefinition
      if (sd.url) {
        allSDs[sd.url] = sd
      }
      // Also index by id for fallback lookups
      if (sd.id) {
        const baseUrl = `http://hl7.org/fhir/StructureDefinition/${sd.id}`
        if (!allSDs[baseUrl]) allSDs[baseUrl] = sd
      }
    }
  }

  if (!manifest) {
    throw new Error('Package manifest (package.json) not found')
  }

  onProgress?.('Synthesizing snapshots...')

  // Resolve FHIR version
  const fhirVersion = resolveFhirVersion(manifest)

  // Second pass: ensure all profile SDs have snapshots
  const profileSDs = Object.values(allSDs).filter(
    sd => sd.derivation === 'constraint' && sd.kind !== 'logical'
  )

  const profiles: ParsedProfile[] = []
  const displayName = `${manifest.name}#${manifest.version}`

  for (const sd of profileSDs) {
    onProgress?.(`Processing ${sd.name ?? sd.id}...`)
    try {
      const withSnapshot = ensureSnapshot(sd, allSDs)
      const profile = buildParsedProfile(withSnapshot, displayName, manifest.name, manifest.version, fhirVersion)
      profiles.push(profile)
    } catch (err) {
      console.warn(`Failed to process profile ${sd.url}:`, err)
    }
  }

  // Deduplicate profiles by URL (take latest version if dupes)
  const profileMap = new Map<string, ParsedProfile>()
  for (const p of profiles) {
    const existing = profileMap.get(p.sd.url)
    if (!existing || (p.sd.version ?? '') > (existing.sd.version ?? '')) {
      profileMap.set(p.sd.url, p)
    }
  }

  void index // acknowledge we have it but don't need it now

  return {
    packageId: manifest.name,
    version: manifest.version,
    displayName,
    canonical: manifest.canonical,
    fhirVersion,
    title: manifest.title,
    description: manifest.description,
    status: 'ready',
    loadedAt: Date.now(),
    profiles: Array.from(profileMap.values()),
    allStructureDefinitions: allSDs,
  }
}

function resolveFhirVersion(manifest: FhirPackageManifest): string {
  if (manifest.fhirVersions && manifest.fhirVersions.length > 0) {
    return manifest.fhirVersions[0]
  }
  if (manifest.fhirVersion) {
    return Array.isArray(manifest.fhirVersion)
      ? manifest.fhirVersion[0]
      : manifest.fhirVersion
  }
  return 'unknown'
}

function buildParsedProfile(
  sd: StructureDefinition,
  igDisplayName: string,
  igPackageId: string,
  igVersion: string,
  fhirVersion: string
): ParsedProfile {
  const elements = sd.snapshot?.element ?? sd.differential?.element ?? []
  const elementMap: Record<string, NormalizedElement> = {}

  for (const el of elements) {
    if (!el.path) continue

    // Skip the root element (e.g. "Endpoint")
    if (!el.path.includes('.')) continue

    const rawPath = el.id ?? el.path
    const normalizedPath = normalizeValueX(normalizeSlicePath(rawPath))
    const sliceName = extractSliceName(rawPath)
    const isSliceRoot = hasSliceName(rawPath) && !rawPath.includes('.', rawPath.lastIndexOf(':'))

    const min = el.min ?? 0
    const max = parseMax(el.max)

    const types = [...new Set((el.type ?? []).map(t => t.code))].sort()
    const typeProfiles = (el.type ?? []).flatMap(t => t.profile ?? [])

    const normalized: NormalizedElement = {
      path: rawPath,
      normalizedPath,
      sliceName,
      isSliceRoot: isSliceRoot && !!sliceName,
      isExtension: isExtensionPath(rawPath),
      min,
      max,
      cardinalityString: cardinalityString(min, max),
      types,
      typeProfiles,
      binding: el.binding
        ? { strength: el.binding.strength, valueSet: el.binding.valueSet }
        : undefined,
      mustSupport: el.mustSupport ?? false,
      isModifier: el.isModifier ?? false,
      isSummary: el.isSummary ?? false,
      short: el.short,
      definition: el.definition,
      hasConstraints: (el.constraint?.length ?? 0) > 0,
    }

    // For the elementMap, only keep the first occurrence of a normalized path
    // (slice roots win over their named slices in the map — the diff table
    //  handles slices separately if includeSlices is on)
    if (!elementMap[normalizedPath] || isSliceRoot) {
      elementMap[normalizedPath] = normalized
    }
  }

  return {
    igDisplayName,
    igPackageId,
    igVersion,
    fhirVersion,
    sd,
    elementMap,
  }
}
