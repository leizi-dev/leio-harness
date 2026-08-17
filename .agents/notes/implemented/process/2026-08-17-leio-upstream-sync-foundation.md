# Agent Note: Leio upstream synchronization foundation

Status: implemented

English | [中文](2026-08-17-leio-upstream-sync-foundation.zh.md)

## Problem

Leio Harness carries a package namespace, Electron desktop application, fast installer, branding, and differential update channel that are not part of the DeepSeek Harness source repository. An upstream update must be traceable without replacing those product decisions.

## Decision

Leio tracks `https://github.com/deepseek-ai/deepseek-harness.git` as the `upstream` remote on branch `master`, uses GitHub `leizi-dev/leio-harness` as `origin`, and retains Gitee as `gitee`. The exact upstream commit and Leio commit are recorded in [`upstream.lock.json`](../../../../upstream.lock.json).

The synchronization workflow uses a dedicated `codex/upstream-sync-YYYYMMDD` branch, imports generic changes in focused commits, and preserves the namespace, desktop release, installation-speed, branding, and update invariants defined in [`docs/upstream-sync.md`](../../../../docs/upstream-sync.md).

The current upstream source commit `47f943859bef60e4160492346772ded9b24f765a` changes package prerelease metadata to `0.1.0-rc.5` and public publishing. Those package values are already present in the Leio tree; the independent Leio root version remains `1.0.0`.

## Alternatives considered

**Direct GitHub fork synchronization:** Rejected as the primary workflow because the Leio history and package namespace are independently maintained, and GitHub fork synchronization cannot express the desktop and release conflict policy.

**Unrelated-history merge of the complete upstream tree:** Rejected because it would mix source, namespace, and desktop conflicts into one opaque merge and could overwrite release-critical files.

**A separate source copy without an upstream lock:** Rejected because maintainers could not identify the exact source commit or distinguish an imported upstream change from a Leio change.

## Consequences

Maintainers must review an upstream change on a sync branch and update the lock file and difference reference with it. A snapshot comparison is an accepted fallback when Git history transport is unavailable, but it must record the full upstream SHA. The workflow adds documentation and verification work while making package, desktop, installer, branding, and update regressions visible before a release.
