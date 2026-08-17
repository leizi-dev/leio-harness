# Agent Note: Signed NSIS updates for the desktop app

Status: implemented

English | [中文](2026-08-15-desktop-nsis-updater.zh.md)

## Problem

The desktop release needs a signed restart-time update channel that is hosted with the public Leio repository while preserving the speed-first first-install package.

## Decision

The desktop distribution has one formal target: a Windows x64 NSIS installer. The packaged Electron main process checks a GitHub-hosted stable manifest after startup and exposes check, download, and install actions through a narrow preload bridge. The Web settings bundle contributes the user-facing row only when that bridge exists, so browser deployments keep the same surface without desktop process access.

The manifest is canonicalized and verified with an embedded Ed25519 public key. Downloads are written to a per-version user-data directory, then checked for the declared size and SHA-256 digest before the detached installer is launched after the current app quits.

## Alternatives considered

`electron-updater` was not selected because this repository already owns a GitHub release layout rather than a provider-backed update service, and the updater must accept only the repository's signed manifest. An in-place ASAR or Portable replacement was rejected because a running Electron process cannot safely replace its own resources and the prior Portable build was not a reliable release target.

## Consequences

Existing `1.0.0` installations must receive the updater-enabled build once through the normal installer. Later releases must use a higher SemVer and publish the installer, manifest, and detached signature together. The Ed25519 key protects the update channel; Windows Authenticode signing remains a separate trust and SmartScreen concern.

The installer uses ASAR with `store` compression for speed. Only product, vendor, shared `zod`, and native runtime packages are unpacked; unpacking the full dependency tree produced a 27,341-file install and was rejected after an installed smoke test. The optimized build unpacked 7,141 files and installed in 187.5 seconds on the test machine.

## Verification

The release procedure is recorded in [`updates/README.md`](../../../../updates/README.md). The desktop release skill requires a fresh NSIS installation, HTTP 200 from the installed app, nonempty boot entries, essential client modules and layout, no plugin-load failure, title verification, and graceful close before an artifact is handed off.
