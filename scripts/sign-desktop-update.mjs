import { readFile, writeFile } from 'node:fs/promises'
import { createPrivateKey, sign } from 'node:crypto'

import { canonicalManifest } from '../apps/desktop/src/updater/manifest.mjs'

function argument(name) {
  const index = process.argv.indexOf(name)
  if (index < 0 || process.argv[index + 1] === undefined) throw new Error(`Missing ${name}.`)
  return process.argv[index + 1]
}

const manifestPath = argument('--manifest')
const keyPath = argument('--key')
const outputPath = process.argv.includes('--out') ? argument('--out') : `${manifestPath}.sig`
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const key = createPrivateKey(await readFile(keyPath))
const signature = sign(null, Buffer.from(canonicalManifest(manifest)), key).toString('base64')
await writeFile(outputPath, `${signature}\n`, 'utf8')
console.log(`Wrote ${outputPath}`)
