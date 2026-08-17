import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, rename, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import {
  UPDATE_MANIFEST_URL,
  compareVersions,
  parseManifest,
  verifyManifestSignature,
} from './manifest.mjs'

const FETCH_TIMEOUT_MS = 10_000

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

async function fetchText(url, signal) {
  const response = await fetch(url, { signal, headers: { accept: 'application/json, text/plain' } })
  if (!response.ok) throw new Error(`Update server returned HTTP ${response.status}.`)
  return response.text()
}

/**
 * Own the desktop update lifecycle without exposing filesystem or process APIs to the renderer.
 */
export class DesktopUpdater {
  #state
  #listeners = new Set()
  #manifest
  #downloadedPath
  #userDataPath
  #currentVersion
  #canUpdate
  #launchInstaller

  /**
   * @param {{ currentVersion: string, userDataPath: string, canUpdate: boolean, launchInstaller: (path: string) => void }} options - Runtime dependencies.
   */
  constructor({ currentVersion, userDataPath, canUpdate, launchInstaller }) {
    this.#currentVersion = currentVersion
    this.#userDataPath = userDataPath
    this.#canUpdate = canUpdate
    this.#launchInstaller = launchInstaller
    this.#state = {
      status: canUpdate ? 'idle' : 'unsupported',
      currentVersion,
      availableVersion: null,
      notes: '',
      mandatory: false,
      progress: 0,
      lastError: null,
    }
  }

  /** @returns {object} A renderer-safe snapshot. */
  getState() {
    return { ...this.#state }
  }

  /**
   * Subscribe to state changes.
   * @param {(state: object) => void} listener - State listener.
   * @returns {() => void} Disposer.
   */
  subscribe(listener) {
    this.#listeners.add(listener)
    return () => { this.#listeners.delete(listener) }
  }

  #publish(patch) {
    this.#state = { ...this.#state, ...patch }
    for (const listener of this.#listeners) listener(this.getState())
  }

  #setError(error) {
    this.#publish({ status: 'idle', lastError: errorMessage(error), progress: 0 })
  }

  /**
   * Check the signed GitHub manifest.
   * @param {boolean} _force - Reserved for the manual-check contract.
   * @returns {Promise<object>} New updater state.
   */
  async check(_force = false) {
    if (!this.#canUpdate || this.#state.status === 'checking' || this.#state.status === 'downloading' || this.#state.status === 'installing') return this.getState()
    this.#publish({ status: 'checking', lastError: null, progress: 0 })
    const controller = new AbortController()
    const timeout = setTimeout(() => { controller.abort() }, FETCH_TIMEOUT_MS)
    try {
      const raw = await fetchText(UPDATE_MANIFEST_URL, controller.signal)
      const manifest = parseManifest(raw)
      const signature = await fetchText(`${UPDATE_MANIFEST_URL}.sig`, controller.signal)
      if (!verifyManifestSignature(manifest, signature)) throw new Error('Update manifest signature is invalid.')
      if (compareVersions(manifest.version, this.#currentVersion) <= 0) {
        this.#manifest = undefined
        this.#publish({ status: 'idle', availableVersion: null, notes: '', mandatory: false, progress: 0 })
      } else if (manifest.asset === undefined) {
        throw new Error('Update manifest has no installer asset.')
      } else {
        this.#manifest = manifest
        this.#publish({ status: 'available', availableVersion: manifest.version, notes: manifest.notes, mandatory: manifest.mandatory, progress: 0 })
      }
    } catch (error) {
      this.#setError(error)
    } finally {
      clearTimeout(timeout)
    }
    return this.getState()
  }

  /**
   * Download and verify the available NSIS installer.
   * @returns {Promise<object>} New updater state.
   */
  async download() {
    if (this.#manifest === undefined || this.#state.status !== 'available') return this.getState()
    const { asset, version } = this.#manifest
    const directory = join(this.#userDataPath, 'updates', version)
    const target = join(directory, asset.fileName)
    const temporary = `${target}.part`
    this.#publish({ status: 'downloading', progress: 0, lastError: null })
    try {
      await mkdir(directory, { recursive: true })
      await rm(temporary, { force: true })
      const controller = new AbortController()
      const timeout = setTimeout(() => { controller.abort() }, 30 * 60 * 1000)
      try {
        const response = await fetch(asset.url, { signal: controller.signal })
        if (!response.ok || response.body === null) throw new Error(`Update download returned HTTP ${response.status}.`)
        const hash = createHash('sha256')
        let received = 0
        const counter = new Transform({
          transform: (chunk, _encoding, callback) => {
            hash.update(chunk)
            received += chunk.length
            this.#publish({ progress: Math.min(1, received / asset.size) })
            callback(null, chunk)
          },
        })
        await pipeline(Readable.fromWeb(response.body), counter, createWriteStream(temporary))
        if (received !== asset.size) throw new Error(`Update size mismatch: expected ${asset.size}, received ${received}.`)
        if (hash.digest('hex') !== asset.sha256) throw new Error('Update SHA-256 verification failed.')
      } finally {
        clearTimeout(timeout)
      }
      await rename(temporary, target)
      this.#downloadedPath = target
      this.#publish({ status: 'downloaded', progress: 1 })
    } catch (error) {
      await rm(temporary, { force: true })
      this.#setError(error)
    }
    return this.getState()
  }

  /**
   * Launch the verified installer and let the main process close normally.
   * @returns {Promise<object>} New updater state.
   */
  async install() {
    if (this.#downloadedPath === undefined || this.#state.status !== 'downloaded') return this.getState()
    try {
      const file = await stat(this.#downloadedPath)
      if (!file.isFile()) throw new Error('Downloaded update installer is missing.')
      this.#publish({ status: 'installing' })
      this.#launchInstaller(this.#downloadedPath)
    } catch (error) {
      this.#setError(error)
    }
    return this.getState()
  }
}

/**
 * Start the installer after the current process has released its files.
 * @param {string} installerPath - Verified installer path.
 * @param {string} targetDirectory - Current installation directory.
 * @param {() => void} quit - Application quit callback.
 * @returns {void}
 */
export function launchNsisInstaller(installerPath, targetDirectory, quit) {
  const child = spawn(installerPath, ['/S', `/D=${targetDirectory}`], { detached: true, stdio: 'ignore', windowsHide: true })
  child.unref()
  quit()
}
