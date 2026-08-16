import { createPublicKey, verify } from 'node:crypto'

/** The public manifest location used by packaged desktop builds. */
export const UPDATE_MANIFEST_URL = process.env.LEIO_UPDATE_MANIFEST_URL
  ?? 'https://gitee.com/chengsirs/leio-harness/raw/main/updates/stable.json'

/** Ed25519 SPKI public key for the Leio Harness update manifest. */
const UPDATE_PUBLIC_KEY_DER_BASE64 = 'MCowBQYDK2VwAyEAwBjI3yPM3QnxPnm/ViNe1knyu9PK1NRWyKgAGn/q2Zs='

const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/

function sortedValue(value) {
  if (Array.isArray(value)) return value.map(sortedValue)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, sortedValue(entry)]))
  }
  return value
}

/**
 * Serialize a manifest deterministically for signature verification.
 * @param {unknown} manifest - Parsed manifest object.
 * @returns {string} Canonical JSON text.
 */
export function canonicalManifest(manifest) {
  return JSON.stringify(sortedValue(manifest))
}

/**
 * Compare two SemVer 2.0.0 versions used by the update channel.
 * @param {string} left - First version.
 * @param {string} right - Second version.
 * @returns {number} Negative, zero, or positive comparison result.
 */
export function compareVersions(left, right) {
  const a = VERSION_PATTERN.exec(left)
  const b = VERSION_PATTERN.exec(right)
  if (a === null || b === null) throw new Error('Update versions must use SemVer 2.0.0.')
  for (let index = 1; index <= 3; index += 1) {
    const difference = Number(a[index]) - Number(b[index])
    if (difference !== 0) return difference
  }
  if (a[4] === b[4]) return 0
  if (a[4] === undefined) return 1
  if (b[4] === undefined) return -1
  return a[4].localeCompare(b[4])
}

function assertHttpsGiteeUrl(value, field) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || (url.hostname !== 'gitee.com' && !url.hostname.endsWith('.gitee.com'))) {
    throw new Error(`Update ${field} must use an HTTPS Gitee URL.`)
  }
  return url.toString()
}

/**
 * Parse and validate the public update manifest before any download starts.
 * @param {string} raw - JSON response body.
 * @returns {{ schemaVersion: 1, channel: 'stable', version: string, minimumVersion?: string, mandatory: boolean, notes: string, asset?: { fileName: string, url: string, size: number, sha256: string } }} Validated manifest.
 */
export function parseManifest(raw) {
  const value = JSON.parse(raw)
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Update manifest must be an object.')
  if (value.schemaVersion !== 1 || value.channel !== 'stable') throw new Error('Unsupported update manifest.')
  if (typeof value.version !== 'string' || VERSION_PATTERN.exec(value.version) === null) throw new Error('Update manifest has an invalid version.')
  if (value.minimumVersion !== undefined && (typeof value.minimumVersion !== 'string' || VERSION_PATTERN.exec(value.minimumVersion) === null)) throw new Error('Update manifest has an invalid minimumVersion.')
  if (typeof value.mandatory !== 'boolean') throw new Error('Update manifest has an invalid mandatory flag.')
  if (typeof value.notes !== 'string') throw new Error('Update manifest has invalid release notes.')
  if (value.asset === undefined) return { schemaVersion: 1, channel: 'stable', version: value.version, ...(value.minimumVersion === undefined ? {} : { minimumVersion: value.minimumVersion }), mandatory: value.mandatory, notes: value.notes }
  if (value.asset === null || typeof value.asset !== 'object') throw new Error('Update manifest has an invalid asset.')
  if (typeof value.asset.fileName !== 'string' || value.asset.fileName.length === 0 || value.asset.fileName.includes('\\') || value.asset.fileName.includes('/')) throw new Error('Update asset has an invalid file name.')
  if (!Number.isSafeInteger(value.asset.size) || value.asset.size <= 0) throw new Error('Update asset has an invalid size.')
  if (typeof value.asset.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(value.asset.sha256)) throw new Error('Update asset has an invalid SHA-256.')
  return {
    schemaVersion: 1,
    channel: 'stable',
    version: value.version,
    ...(value.minimumVersion === undefined ? {} : { minimumVersion: value.minimumVersion }),
    mandatory: value.mandatory,
    notes: value.notes,
    asset: {
      fileName: value.asset.fileName,
      url: assertHttpsGiteeUrl(value.asset.url, 'asset URL'),
      size: value.asset.size,
      sha256: value.asset.sha256.toLowerCase(),
    },
  }
}

/**
 * Verify a detached Ed25519 signature over the canonical manifest.
 * @param {object} manifest - Validated manifest.
 * @param {string} signature - Base64 detached signature.
 * @returns {boolean} Whether the signature is valid.
 */
export function verifyManifestSignature(manifest, signature) {
  if (!/^[A-Za-z0-9+/]+=*$/.test(signature.trim())) return false
  const publicKey = createPublicKey({ key: Buffer.from(UPDATE_PUBLIC_KEY_DER_BASE64, 'base64'), format: 'der', type: 'spki' })
  return verify(null, Buffer.from(canonicalManifest(manifest)), publicKey, Buffer.from(signature.trim(), 'base64'))
}
