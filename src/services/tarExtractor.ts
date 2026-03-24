import { decompressSync } from 'fflate'

export interface TarEntry {
  path: string
  data: Uint8Array
}

const TEXT_DECODER = new TextDecoder('utf-8')

function readOctal(bytes: Uint8Array, offset: number, length: number): number {
  const str = TEXT_DECODER.decode(bytes.slice(offset, offset + length)).replace(/\0/g, '').trim()
  return str ? parseInt(str, 8) : 0
}

function readString(bytes: Uint8Array, offset: number, length: number): string {
  const slice = bytes.slice(offset, offset + length)
  const nullIdx = slice.indexOf(0)
  return TEXT_DECODER.decode(nullIdx >= 0 ? slice.slice(0, nullIdx) : slice)
}

/**
 * Extract a .tgz (gzipped TAR) in the browser using fflate.
 * Yields TarEntry objects for files matching the filter.
 */
export function* extractTar(
  gzipBytes: Uint8Array,
  filter?: (path: string) => boolean
): Generator<TarEntry> {
  // Decompress gzip → raw TAR bytes
  const tarBytes = decompressSync(gzipBytes)

  let offset = 0
  let pendingLongName: string | null = null

  while (offset + 512 <= tarBytes.length) {
    const header = tarBytes.slice(offset, offset + 512)

    // Check for end-of-archive (two consecutive zero blocks)
    if (header.every(b => b === 0)) {
      break
    }

    // Read header fields
    let name = readString(header, 0, 100)
    const prefix = readString(header, 345, 155)  // UStar prefix
    if (prefix) name = `${prefix}/${name}`

    const typeFlag = String.fromCharCode(header[156])
    const size = readOctal(header, 124, 12)

    offset += 512  // advance past header

    // GNU long filename extension
    if (typeFlag === 'L') {
      const nameBytes = tarBytes.slice(offset, offset + size)
      pendingLongName = TEXT_DECODER.decode(nameBytes).replace(/\0/g, '')
      offset += Math.ceil(size / 512) * 512
      continue
    }

    if (pendingLongName !== null) {
      name = pendingLongName
      pendingLongName = null
    }

    const dataBlocks = Math.ceil(size / 512) * 512

    // Only yield regular files ('0' or '\0') that pass the filter
    if ((typeFlag === '0' || typeFlag === '\0') && size > 0) {
      if (!filter || filter(name)) {
        const data = tarBytes.slice(offset, offset + size)
        yield { path: name, data }
      }
    }

    offset += dataBlocks
  }
}

/** Filter function: only package/*.json files (not examples/) */
export function packageJsonFilter(path: string): boolean {
  // Include package/package.json, package/.index.json, and package/*.json (StructureDefinitions etc.)
  // Exclude examples/ and other subdirectories
  return (
    path.startsWith('package/') &&
    path.endsWith('.json') &&
    !path.startsWith('package/example') &&
    path.split('/').length <= 2  // only top-level files in package/
  )
}
