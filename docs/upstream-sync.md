# Upstream synchronization

English | [中文](upstream-sync.zh.md)

This reference defines how Leio Harness tracks and absorbs DeepSeek Harness changes while keeping Leio-specific runtime and release behavior.

## Remote roles

The Git remotes have separate ownership:

| Remote | Repository | Role |
| --- | --- | --- |
| `origin` | `https://github.com/leizi-dev/leio-harness.git` | Leio source and release history |
| `gitee` | `https://gitee.com/chengsirs/leio-harness.git` | Existing mirror and update-file distribution |
| `upstream` | `https://github.com/deepseek-ai/deepseek-harness.git` | DeepSeek source reference |

The authoritative upstream branch is `master`. The exact source commit used by the current Leio tree is recorded in [`upstream.lock.json`](../upstream.lock.json).

## Synchronization workflow

1. Read the locked upstream commit and fetch the current `upstream/master` reference.
2. Create a `codex/upstream-sync-YYYYMMDD` branch from the current Leio `main`.
3. Compare package manifests, source paths, generated files, and the desktop-only tree before editing.
4. Import upstream changes in focused groups and preserve Leio package names, desktop packaging, update behavior, and branding.
5. Update [`leio-vs-upstream.md`](leio-vs-upstream.md), the lock file, and the implemented process note in the same change.
6. Run focused tests, build checks, and the installed Windows smoke test before merging the sync branch into `main`.

When upstream history cannot be fetched as a complete Git graph, use an official source snapshot to compare content and record the full upstream commit SHA. Do not create an unrelated-history merge that obscures which source was imported.

## Conflict policy

Upstream owns generic harness capabilities, tests, documentation structure, and package implementation improvements. Leio owns the `@leio-ai/leio-*` namespace, Leio product copy, the Electron application, the circular brand asset, the fast installer, and the differential update channel.

Vendor changes follow [`vendor/README.md`](../vendor/README.md) and [`rescope.md`](rescope.md). Reapply the vendor rescope after a vendor snapshot changes, then regenerate the lockfile, third-party notices, and translation records required by the repository gates.

A source change that alters model-visible behavior requires the corresponding session event, snapshot, or assembled application verification required by [`docs/testing.md`](testing.md). A packaging change must also satisfy [`leio-desktop-release`](../.agents/skills/leio-desktop-release/SKILL.md).

## Version and release rules

Leio product versions are independent SemVer values. The upstream commit is release metadata, not a replacement for the Leio version. Release notes separate imported upstream behavior from Leio-specific behavior.

The first-install NSIS package and a differential hot-update asset remain separate artifacts. A text-only change must not publish the full installer as a hot update, and installer compression remains `store` because first-install time is the primary requirement.

## Verification

The minimum sync evidence is:

- the upstream SHA in `upstream.lock.json` matches the inspected source;
- the package namespace and desktop release invariants remain intact;
- focused tests and the required build pass;
- a fresh Windows installation starts successfully and exposes a non-empty web boot manifest;
- a previous-version installation accepts only the intended differential update when update files changed.
