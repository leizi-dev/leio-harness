# Agent Note: Resolve Electron ASAR profile links through unpacked dependencies

Status: implemented

English | [中文](2026-08-15-electron-asar-profile-links.zh.md)

## Problem

The packaged Windows application could show its Electron window while the web profile had no active client services. Profile fallback Junctions pointed into the virtual `app.asar` path, and some transitive dependencies were not available at the corresponding unpacked path.

## Decision

Keep the self-contained ASAR-based NSIS installer, unpack all dependency layers with both direct and nested `node_modules` patterns, and make profile fallback resolution map an existing `.asar` package directory to its matching `.asar.unpacked` directory. The mapping applies to the app link and dependency links. A profile test stages both paths and verifies that links target the physical unpacked copies.

## Alternatives considered

- **Keep links to `app.asar`** — Electron can read the archive internally, but Windows Junctions and profile-relative ESM resolution cannot use the virtual path reliably.
- **Unpack only the first failing dependency** — this would turn each transitive import failure into another release defect and would not establish a stable packaging rule.
- **Disable ASAR** — this avoids the virtual path, but gives up the current archive layout without removing the need to install and validate the complete dependency tree.

## Consequences

- The installer remains one self-contained NSIS executable, with `app.asar` and `app.asar.unpacked` both delivered by the installer.
- The installed application has a larger physical runtime tree and can take longer to install than an archive-only package, but the package is resolvable from a clean Windows installation.
- Release validation must install the exact NSIS artifact into a fresh directory under `E:\soft`; `win-unpacked` and source launches are insufficient evidence.
- The web smoke test must check HTTP 200, a non-empty boot manifest containing `@leio-ai/leio-client-modules` and `@leio-ai/leio-client-ui-layout`, absence of `Failed to load plugins`, the `Leio Harness` window title, and graceful close.
