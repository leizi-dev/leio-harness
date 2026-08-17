---
name: leio-upstream-sync
description: Synchronize Leio Harness with DeepSeek Harness while preserving Leio package names, Electron release behavior, fast installation, branding, and differential updates.
---

# Leio upstream synchronization

Use this skill for an upstream pull, source comparison, dependency upgrade from DeepSeek Harness, or a release that claims to include upstream changes.

## Required invariants

- Keep `@leio-ai/leio-*` package names and the Leio product identity.
- Keep the Electron desktop tree, circular brand image, `compression: store`, and self-contained Windows installer.
- Keep differential hot updates file-scoped; a full installer is never a hot-update asset.
- Keep Leio SemVer independent from the upstream prerelease version.
- Never put model keys or GitHub credentials in source, metadata, logs, artifacts, or release assets.

## Workflow

1. Read [`upstream.lock.json`](../../../upstream.lock.json), [`docs/upstream-sync.md`](../../../docs/upstream-sync.md), and [`docs/leio-vs-upstream.md`](../../../docs/leio-vs-upstream.md).
2. Fetch `upstream/master` or download the official source snapshot when the Git history transport is unavailable.
3. Create `codex/upstream-sync-YYYYMMDD` from Leio `main`; do not rewrite released history.
4. Compare package manifests and source paths before importing code. Treat the `apps/desktop` tree as Leio-owned.
5. Import generic changes in focused commits, reapply vendor rescoping, and update the lock file and implemented process note.
6. Run focused tests, build checks, a fresh `E:\soft` installation smoke test, and the relevant differential-update test.
7. Merge into `main` only when the installed executable passes HTTP boot, plugin activation, title, and graceful-close checks.

## Conflict rules

Upstream owns generic harness capabilities and their tests. Leio owns namespace, brand, desktop packaging, installation speed, update channel, and Leio copy. When a conflict affects both, preserve the Leio release invariant and import the upstream behavior only after a focused regression check.

## Handoff evidence

Record the complete upstream SHA, Leio commit, files or features imported, deferred conflicts, commands run, and installed-release result. If no model key is configured, report that model calls were not tested; do not add a key to make the check pass.
