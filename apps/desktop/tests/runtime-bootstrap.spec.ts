import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { RuntimeBootstrapper } from '../src/runtime/bootstrap.mjs'

const payload = Buffer.from('leio-runtime-test')
const runtime = {
  version: 'test',
  asset: {
    fileName: 'runtime.zip',
    sources: [{ name: 'GitHub Release', url: 'https://github.com/leizi-dev/leio-harness/releases/download/vtest/runtime.zip' }],
    size: payload.length,
    sha256: createHash('sha256').update(payload).digest('hex'),
  },
}

describe('RuntimeBootstrapper', () => {
  it('downloads, verifies, extracts, and reuses the complete runtime cache', async () => {
    const home = await mkdtemp(join(tmpdir(), 'leio-runtime-'))
    const fetchImpl = vi.fn(async () => new Response(payload))
    const extract = vi.fn(async (_archive: string, destination: string) => {
      const packageDir = join(destination, 'node_modules', '@leio-ai', 'leio')
      await mkdir(packageDir, { recursive: true })
      await writeFile(join(packageDir, 'package.json'), JSON.stringify({ name: '@leio-ai/leio' }))
    })
    const states: string[] = []
    const bootstrapper = new RuntimeBootstrapper({ userDataPath: home, runtime, fetchImpl, extract })

    await expect(bootstrapper.ensure(state => states.push(state.phase))).resolves.toMatchObject({ downloaded: true })
    await expect(readFile(join(bootstrapper.directory, 'runtime.json'), 'utf8')).resolves.toContain(runtime.asset.sha256)
    expect(states).toContain('downloading')
    expect(states).toContain('extracting')

    await expect(bootstrapper.ensure(() => {})).resolves.toMatchObject({ downloaded: false })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(extract).toHaveBeenCalledTimes(1)
  })

  it('falls back to the domestic mirror after the GitHub source fails', async () => {
    const home = await mkdtemp(join(tmpdir(), 'leio-runtime-'))
    const fetchImpl = vi.fn(async (url: string) => url.includes('github.com') ? new Response(null, { status: 503 }) : new Response(payload))
    const fallbackRuntime = {
      ...runtime,
      asset: {
        ...runtime.asset,
        sources: [...runtime.asset.sources, { name: '国内镜像', url: 'https://www.chengdalei.xyz/api/v1/downloads/leio-harness/runtime', headers: { 'X-Leio-Harness-Runtime-Version': 'test' } }],
      },
    }
    const extract = vi.fn(async (_archive: string, destination: string) => {
      const packageDir = join(destination, 'node_modules', '@leio-ai', 'leio')
      await mkdir(packageDir, { recursive: true })
      await writeFile(join(packageDir, 'package.json'), JSON.stringify({ name: '@leio-ai/leio' }))
    })
    const bootstrapper = new RuntimeBootstrapper({ userDataPath: home, runtime: fallbackRuntime, fetchImpl, extract })

    await expect(bootstrapper.ensure(() => {})).resolves.toMatchObject({ downloaded: true })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(fetchImpl.mock.calls[0][0]).toContain('github.com')
    expect(fetchImpl.mock.calls[1][0]).toContain('chengdalei.xyz')
    expect(fetchImpl.mock.calls[1][1]?.headers).toEqual({ 'X-Leio-Harness-Runtime-Version': 'test' })
  })
})
