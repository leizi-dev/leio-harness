import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { spawn } from 'node:child_process'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { pathToFileURL } from 'node:url'

const RUNTIME_MARKER = 'runtime.json'
const SOURCE_RESPONSE_TIMEOUT_MS = 15_000

/** Return an error message suitable for the startup screen. */
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

/** Request one runtime source without limiting the subsequent ZIP stream. */
async function requestRuntimeSource(source, fetchImpl) {
  const controller = new AbortController()
  const timer = setTimeout(() => { controller.abort() }, SOURCE_RESPONSE_TIMEOUT_MS)
  try {
    return await fetchImpl(source.url, { signal: controller.signal, headers: source.headers })
  } finally {
    clearTimeout(timer)
  }
}

/** Resolve after a child process exits successfully. */
function waitForExit(child, command) {
  return new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', code => {
      if (code === 0) resolve()
      else reject(new Error(`${command} exited with code ${String(code)} while extracting the Leio runtime.`))
    })
  })
}

/** Extract a ZIP with the Windows tar utility shipped with supported Windows versions. */
async function extractZip(archive, destination) {
  const child = spawn('tar.exe', ['-xf', archive, '-C', destination], { windowsHide: true })
  await waitForExit(child, 'tar.exe')
}

/** Ensure a runtime directory has the package that the desktop shell starts from. */
async function assertRuntimeTree(directory, expected) {
  const manifestPath = join(directory, 'node_modules', '@leio-ai', 'leio', 'package.json')
  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    if (manifest.name !== '@leio-ai/leio') throw new Error('runtime package name mismatch')
  } catch (error) {
    throw new Error(`Leio runtime is incomplete: ${errorMessage(error)}`)
  }
  const markerPath = join(directory, RUNTIME_MARKER)
  try {
    const marker = JSON.parse(await readFile(markerPath, 'utf8'))
    if (marker.version !== expected.version || marker.sha256 !== expected.asset.sha256) throw new Error('runtime marker mismatch')
  } catch (error) {
    throw new Error(`Leio runtime verification failed: ${errorMessage(error)}`)
  }
}

/** Write the immutable runtime marker only after extraction completed. */
async function writeRuntimeMarker(directory, expected) {
  await writeFile(join(directory, RUNTIME_MARKER), `${JSON.stringify({ version: expected.version, sha256: expected.asset.sha256 })}\n`)
  await writeFile(join(directory, 'runtime-anchor.cjs'), '')
}

/** Download one immutable asset from the configured ordered sources. */
async function downloadAsset(asset, target, publish, fetchImpl) {
  const failures = []
  for (const [index, source] of asset.sources.entries()) {
    try {
      publish({
        phase: 'downloading',
        progress: 0.1,
        detail: index === 0 ? `正在从 ${source.name} 下载运行依赖…` : `${source.name}：正在下载运行依赖…`,
      })
      const response = await requestRuntimeSource(source, fetchImpl)
      if (!response.ok || response.body === null) throw new Error(`HTTP ${response.status}`)
      const hash = createHash('sha256')
      let received = 0
      const counter = new Transform({
        transform(chunk, _encoding, callback) {
          hash.update(chunk)
          received += chunk.length
          publish({ phase: 'downloading', progress: 0.1 + 0.8 * Math.min(1, received / asset.size), detail: `${source.name}：${Math.round((received / asset.size) * 100)}%` })
          callback(null, chunk)
        },
      })
      await pipeline(Readable.fromWeb(response.body), counter, createWriteStream(target))
      if (received !== asset.size) throw new Error(`size mismatch: expected ${asset.size}, received ${received}`)
      if (hash.digest('hex') !== asset.sha256) throw new Error('SHA-256 mismatch')
      return
    } catch (error) {
      failures.push(`${source.name}: ${errorMessage(error)}`)
      await rm(target, { force: true })
    }
  }
  throw new Error(`运行依赖下载失败。${failures.join('；')}`)
}

/**
 * Ensure the desktop runtime package exists locally before resolving any Leio
 * package. The Electron executable supplies Node; this archive contains only
 * Leio's Node dependency closure and is cached outside the installation.
 */
export class RuntimeBootstrapper {
  #userDataPath
  #runtime
  #fetch
  #extract

  /** @param {{ userDataPath: string, runtime: { version: string, asset: { fileName: string, sources: Array<{ name: string, url: string }>, size: number, sha256: string } }, fetchImpl?: typeof fetch, extract?: (archive: string, destination: string) => Promise<void> }} options - Runtime source and local cache dependencies. */
  constructor({ userDataPath, runtime, fetchImpl = fetch, extract = extractZip }) {
    this.#userDataPath = userDataPath
    this.#runtime = runtime
    this.#fetch = fetchImpl
    this.#extract = extract
  }

  /** Return the directory that contains the cached node_modules tree. */
  get directory() {
    return join(this.#userDataPath, 'runtime', this.#runtime.version)
  }

  /** Resolve an ESM package from the verified cached node_modules tree. */
  async importPackage(packageName) {
    const anchor = join(this.directory, 'runtime-anchor.cjs')
    const resolved = createRequire(anchor).resolve(packageName)
    return import(pathToFileURL(resolved).href)
  }

  /**
   * Verify the cache or download, verify, and extract the immutable runtime.
   * @param {(state: { phase: 'checking' | 'downloading' | 'extracting' | 'ready', progress: number, detail: string }) => void} publish - Startup UI state sink.
   * @returns {Promise<{ downloaded: boolean, directory: string }>} Cache outcome.
   */
  async ensure(publish) {
    publish({ phase: 'checking', progress: 0.02, detail: '正在检查本地运行依赖…' })
    try {
      await assertRuntimeTree(this.directory, this.#runtime)
      await writeFile(join(this.directory, 'runtime-anchor.cjs'), '')
      publish({ phase: 'ready', progress: 1, detail: '运行依赖已就绪。' })
      return { downloaded: false, directory: this.directory }
    } catch {
      // A missing or stale cache is reconstructed below from one immutable,
      // hash-verified archive. No partially valid tree is ever used.
    }

    const runtimeRoot = dirname(this.directory)
    const staging = `${this.directory}.staging`
    const archive = join(runtimeRoot, `${this.#runtime.version}-${this.#runtime.asset.fileName}.part`)
    await mkdir(runtimeRoot, { recursive: true })
    await rm(staging, { recursive: true, force: true })
    await rm(archive, { force: true })
    try {
      publish({ phase: 'downloading', progress: 0.1, detail: '首次启动：正在下载运行依赖…' })
      await downloadAsset(this.#runtime.asset, archive, publish, this.#fetch)
      publish({ phase: 'extracting', progress: 0.93, detail: '正在校验并解压运行依赖…' })
      await mkdir(staging, { recursive: true })
      await this.#extract(archive, staging)
      await writeRuntimeMarker(staging, this.#runtime)
      await assertRuntimeTree(staging, this.#runtime)
      await rm(this.directory, { recursive: true, force: true })
      await rename(staging, this.directory)
      publish({ phase: 'ready', progress: 1, detail: '运行依赖已安装，正在启动 Leio Harness…' })
      return { downloaded: true, directory: this.directory }
    } finally {
      await rm(archive, { force: true })
      await rm(staging, { recursive: true, force: true })
    }
  }
}

/** Verify that the runtime sources begin with GitHub and use HTTPS fallbacks. */
export function assertRuntimeAsset(runtime) {
  const { asset } = runtime
  if (!Array.isArray(asset.sources) || asset.sources.length === 0) throw new Error('Desktop runtime asset sources are missing.')
  const primary = new URL(asset.sources[0].url)
  if (primary.protocol !== 'https:' || primary.hostname !== 'github.com' || !primary.pathname.includes('/releases/download/')) {
    throw new Error('Desktop runtime primary source must be an HTTPS GitHub Release download URL.')
  }
  for (const source of asset.sources) {
    const url = new URL(source.url)
    if (typeof source.name !== 'string' || source.name === '' || url.protocol !== 'https:') {
      throw new Error('Desktop runtime fallback source is invalid.')
    }
  }
  if (!Number.isSafeInteger(asset.size) || asset.size <= 0) throw new Error('Desktop runtime asset size is invalid.')
  if (!/^[a-f0-9]{64}$/i.test(asset.sha256)) throw new Error('Desktop runtime asset SHA-256 is invalid.')
}
