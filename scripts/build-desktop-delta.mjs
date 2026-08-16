import { access, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { spawn } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')

function readOption(args, name) {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}

function requireOption(args, name) {
  const value = readOption(args, name)
  if (value === undefined || value.length === 0) throw new Error(`Missing ${name}.`)
  return value
}

function escapeNsis(value) {
  return value.replaceAll('"', '""')
}

function escapePowerShell(value) {
  return value.replaceAll('"', '""')
}

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', windowsHide: true })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolvePromise() : reject(new Error(`${command} exited with code ${code}.`)))
  })
}

async function findMakensis() {
  const candidates = [
    process.env.MAKENSIS,
    join(process.env.LOCALAPPDATA ?? '', 'electron-builder', 'Cache', 'nsis-3.0.4.1', 'nsis-3.0.4.1-1mx3n', 'makensis.exe'),
  ].filter(value => value !== undefined && value.length > 0)
  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    } catch {
      // Try the next known electron-builder location.
    }
  }
  throw new Error('makensis.exe was not found. Set MAKENSIS to the NSIS compiler path.')
}

function versionPatchScript() {
  return String.raw`
param(
  [Parameter(Mandatory = $true)][string]$AsarPath,
  [Parameter(Mandatory = $true)][string]$FromVersion,
  [Parameter(Mandatory = $true)][string]$ToVersion
)

function Find-Bytes([byte[]]$Haystack, [byte[]]$Needle, [int]$StartAt) {
  for ($index = $StartAt; $index -le $Haystack.Length - $Needle.Length; $index++) {
    $matched = $true
    for ($offset = 0; $offset -lt $Needle.Length; $offset++) {
      if ($Haystack[$index + $offset] -ne $Needle[$offset]) {
        $matched = $false
        break
      }
    }
    if ($matched) { return $index }
  }
  return -1
}

for ($attempt = 0; $attempt -lt 80; $attempt++) {
  $running = Get-Process -Name 'Leio Harness' -ErrorAction SilentlyContinue
  if ($null -eq $running) { break }
  Start-Sleep -Milliseconds 250
}

$bytes = [IO.File]::ReadAllBytes($AsarPath)
$desktopName = [Text.Encoding]::ASCII.GetBytes('"name": "@leio-ai/leio-desktop"')
$oldVersion = [Text.Encoding]::ASCII.GetBytes(('"version": "' + $FromVersion + '"'))
$newVersion = [Text.Encoding]::ASCII.GetBytes(('"version": "' + $ToVersion + '"'))
$nameIndex = Find-Bytes $bytes $desktopName 0
if ($nameIndex -lt 0) { throw 'The packaged desktop package.json was not found in app.asar.' }
$versionIndex = Find-Bytes $bytes $oldVersion ($nameIndex + $desktopName.Length)
if ($versionIndex -lt 0) { throw ('The expected desktop version ' + $FromVersion + ' was not found in app.asar.') }
if ($oldVersion.Length -ne $newVersion.Length) { throw 'Delta version replacement must keep the same byte length.' }
[Array]::Copy($newVersion, 0, $bytes, $versionIndex, $newVersion.Length)
[IO.File]::WriteAllBytes($AsarPath, $bytes)
`
}

async function main() {
  const args = process.argv.slice(2)
  const fromVersion = requireOption(args, '--from')
  const toVersion = requireOption(args, '--to')
  const sourceRoot = resolve(root, readOption(args, '--source') ?? 'apps/desktop/dist/win-unpacked')
  const output = resolve(root, requireOption(args, '--output'))
  const fileArgs = args.flatMap((value, index) => value === '--file' ? [args[index + 1]] : []).filter(Boolean)
  if (fileArgs.length === 0) throw new Error('At least one --file is required.')

  const makensis = await findMakensis()
  const work = join(dirname(output), `.delta-work-${toVersion}`)
  const stage = join(work, 'payload')
  await rm(work, { recursive: true, force: true })
  await mkdir(stage, { recursive: true })
  await mkdir(dirname(output), { recursive: true })

  const mappings = []
  for (const relativeFile of fileArgs) {
    const normalized = relativeFile.replaceAll('/', sep)
    const source = join(sourceRoot, normalized)
    const sourceStat = await stat(source)
    if (!sourceStat.isFile()) throw new Error(`Delta source is not a file: ${relativeFile}`)
    const staged = join(stage, normalized)
    await mkdir(dirname(staged), { recursive: true })
    await writeFile(staged, await readFile(source))
    mappings.push({ relativeFile: relativeFile.replaceAll('\\', '/'), staged })
  }

  const patchScript = join(work, 'patch-version.ps1')
  await writeFile(patchScript, versionPatchScript(), 'utf8')

  const lines = [
    'Unicode true',
    'RequestExecutionLevel user',
    'SilentInstall silent',
    'AutoCloseWindow true',
    'ShowInstDetails nevershow',
    `OutFile "${escapeNsis(output)}"`,
    'InstallDir "$EXEDIR"',
    'Section',
    `  SetOutPath "$TEMP\\LeioHarnessDelta-${escapeNsis(toVersion)}"`,
    `  File /oname=patch-version.ps1 "${escapeNsis(patchScript)}"`,
    `  ExecWait '\"$SYSDIR\\WindowsPowerShell\\v1.0\\powershell.exe\" -NoProfile -ExecutionPolicy Bypass -File \"$OUTDIR\\patch-version.ps1\" -AsarPath \"$INSTDIR\\resources\\app.asar\" -FromVersion \"${escapePowerShell(fromVersion)}\" -ToVersion \"${escapePowerShell(toVersion)}\"'`,
  ]
  for (const mapping of mappings) {
    const destination = dirname(mapping.relativeFile).replaceAll('/', '\\')
    lines.push(`  SetOutPath "$INSTDIR\\${escapeNsis(destination)}"`)
    lines.push(`  File /oname=${escapeNsis(mapping.relativeFile.split('/').at(-1))} "${escapeNsis(mapping.staged)}"`)
  }
  lines.push(
    '  Delete "$OUTDIR\\patch-version.ps1"',
    '  RMDir "$OUTDIR"',
    'SectionEnd',
  )
  const script = join(work, 'delta.nsi')
  await writeFile(script, `${lines.join('\n')}\n`, 'utf8')
  await run(makensis, ['/V2', script])
  await rm(work, { recursive: true, force: true })
  const result = await stat(output)
  console.log(`Built ${relative(root, output)} (${result.size} bytes).`)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
