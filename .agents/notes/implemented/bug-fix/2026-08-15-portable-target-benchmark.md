# Agent Note: Benchmark the optional Windows Portable target

Status: implemented

English | [中文](2026-08-15-portable-target-benchmark.zh.md)

## Problem

The release needed two EXE formats so the user could compare a normal installer with a no-install executable. The application currently unpacks a large dependency tree because Windows profile links must target physical package directories.

## Decision

Add separately named NSIS and Portable targets. Keep the NSIS installer as the release candidate and treat Portable as experimental until a clean launch passes the same acceptance checks. Benchmarking the generated artifacts is required because Portable moves extraction cost to first launch.

## Evidence

The tested NSIS artifact installed successfully in 749.4 seconds and then passed HTTP 200, 38 boot entries, required client entries, window title, and graceful close checks. The tested Portable artifact ran its self-extraction for more than ten minutes without publishing a web port, so it is not a release candidate for the current dependency tree.

## Alternatives considered

- **Publish only Portable** — rejected because the clean first launch did not complete within more than ten minutes.
- **Replace NSIS with Portable immediately** — rejected because it moves the same dependency extraction cost to first launch and removes normal installation and shortcut behavior.
- **Treat the Portable timeout as a test failure only** — rejected because the timeout is the user-visible startup cost that the comparison is meant to measure.

## Consequences

The two artifacts have distinct names: `Leio-Harness-Setup-1.0.0-x64.exe` and `Leio-Harness-Portable-1.0.0-x64.exe`. Future Portable work must reduce the physical file count or bundle the runtime before it can improve time-to-use.
