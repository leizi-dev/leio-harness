# Agent Note: Sync the rc.7 package metadata release

Status: implemented

English | [中文](2026-08-18-leio-upstream-sync-rc7.zh.md)

## Problem

Leio Harness needed the upstream rc.7 package metadata without losing its independent product version, package scope, desktop packaging, or update behavior.

## Decision

Leio Harness synchronizes upstream commit `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` from `deepseek-ai/deepseek-harness` using the official source snapshot. The commit is the `dsh@0.1.0-rc.7` release and changes the 222 upstream package manifests from `0.1.0-rc.6` to `0.1.0-rc.7`; it does not contain runtime source or asset changes. The Leio baseline for this sync is `8abdca7`.

Leio applies the same internal package metadata update from its existing `0.1.0-rc.5` baseline to `0.1.0-rc.7`, while keeping the root and Electron product version at the independent Leio release `1.0.2`. The `apps/desktop` tree, `compression: "store"`, circular brand asset, self-contained installer, and file-level update channel remain Leio-owned.

## Naming and release invariants

- Keep `@leio-ai/leio-*` package names and the `Leio Harness` product identity.
- Keep intentional upstream URLs, vendor attributions, protocol-stable identifiers, and historical Agent Notes unchanged; they are references, not current product branding.
- Do not treat the full NSIS installer as a differential update asset.
- Do not put model keys or GitHub credentials in source, metadata, logs, or release assets.

## Alternatives considered

**Keep the rc.5 package metadata.** Rejected because Leio would drift from the upstream package set even though the upstream release contains no runtime changes.

**Adopt the upstream product identity and version.** Rejected because the Leio package scope, desktop product version, branding, installer, and update channel are independently released.

## Consequences

- Source: official GitHub `master` snapshot at `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`.
- Imported changes: 222 workspace package manifest versions; no runtime source or asset files changed by the upstream release commit.
- Required validation: package install/lockfile validation, repository build, desktop distribution build, fresh `E:\soft` installation smoke test, and release artifact hash.
