import { describe, expect, it, vi } from 'vitest'
import { DesktopUpdater } from '../src/updater/updater.mjs'
import { compareVersions, parseManifest } from '../src/updater/manifest.mjs'

describe('desktop update manifest', () => {
  it('compares release and prerelease versions', () => {
    expect(compareVersions('1.2.0', '1.1.9')).toBeGreaterThan(0)
    expect(compareVersions('1.2.0-beta.1', '1.2.0')).toBeLessThan(0)
    expect(compareVersions('1.2.0', '1.2.0')).toBe(0)
  })

  it('accepts a signed-channel manifest without an asset for the bootstrap release', () => {
    const manifest = parseManifest(JSON.stringify({
      schemaVersion: 1,
      channel: 'stable',
      version: '1.0.0',
      mandatory: false,
      notes: 'bootstrap',
    }))
    expect(manifest.version).toBe('1.0.0')
    expect(manifest.asset).toBeUndefined()
  })

  it('rejects non-GitHub installer URLs before download', () => {
    expect(() => parseManifest(JSON.stringify({
      schemaVersion: 1,
      channel: 'stable',
      version: '1.1.0',
      mandatory: false,
      notes: 'release',
      asset: {
        fileName: 'Leio-Harness-Setup-1.1.0-x64.exe',
        url: 'https://example.com/installer.exe',
        size: 1,
        sha256: '0'.repeat(64),
      },
    }))).toThrow('HTTPS GitHub URL')
  })
})

describe('desktop updater', () => {
  it('does not access the network from an unpackaged desktop shell', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    const updater = new DesktopUpdater({
      currentVersion: '1.0.0',
      userDataPath: 'E:/soft/leio-harness-test-updates',
      canUpdate: false,
      launchInstaller: vi.fn(),
    })
    await expect(updater.check()).resolves.toMatchObject({ status: 'unsupported' })
    expect(fetch).not.toHaveBeenCalled()
  })
})
