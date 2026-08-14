import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { expect, it } from 'vitest'

const DIST_ROOT = fileURLToPath(new URL('../dist', import.meta.url))

it('ships install metadata with the built web application', async () => {
  const index = await readFile(join(DIST_ROOT, 'index.html'), 'utf8')
  expect(index).toContain('<link rel="manifest" href="/manifest.webmanifest" />')

  const manifest: unknown = JSON.parse(await readFile(join(DIST_ROOT, 'manifest.webmanifest'), 'utf8'))
  expect(manifest).toEqual({
    id: '/',
    name: 'Leio Harness',
    short_name: 'Leio',
    start_url: '/',
    scope: '/',
    display: 'fullscreen',
    icons: [{
      src: '/leio-icon.png',
      sizes: 'any',
      type: 'image/png',
      purpose: 'any',
    }],
  })
})

it('ships the Leio icon referenced by the web shell and manifest', async () => {
  const icon = await readFile(join(DIST_ROOT, 'leio-icon.png'))
  expect(icon.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
})
