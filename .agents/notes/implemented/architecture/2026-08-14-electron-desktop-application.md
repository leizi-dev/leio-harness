# Agent Note: Electron desktop application

Status: implemented

English | [中文](2026-08-14-electron-desktop-application.zh.md)

## Problem

The browser application requires a separately started local Harness process and does not provide a Windows executable or installer.

## Decision

`apps/desktop` is an Electron shell over the shipped Web profile. The Electron main process calls the CLI package's exported `runProfile` API with a loopback host and port `0`, reads the bound port from `webServer`, and loads that origin in a sandboxed BrowserWindow. The desktop process requests the existing bounded Harness shutdown before Electron exits.

The Windows artifact is an x64 NSIS installer built by electron-builder. The packaged application leaves ASAR disabled because profile patches, package manifests, native modules, and worker entry files are resolved by filesystem path at runtime. The installer is the single distribution file; the installed application retains its runtime files.

## Alternatives considered

- **Load the Web frontend directly from `file:`** — the frontend requires the host API, generated boot manifest, static routes, and session services supplied by the Web profile.
- **Spawn the CLI as a child process** — Windows cannot deliver a POSIX `SIGTERM` to a child Node process, so ordinary window closure would bypass the Harness's bounded disposal path.
- **Bundle all runtime files into ASAR** — path-loaded workers, native modules, profile patches, and package manifests require ordinary filesystem paths and would need a growing unpack exception list.
- **Require a fixed local port** — a second service could already own it; an operating-system-assigned port avoids this startup failure without exposing the server beyond loopback.

## Consequences

- The desktop application shares the same Harness home, settings, credentials, sessions, profiles, and workspaces as the CLI.
- Renderer code has no Node integration, runs with context isolation and sandboxing, and sends non-local HTTP links to the system browser.
- Only one desktop instance runs at a time.
- The installer is larger than the Web frontend because it includes Electron and the complete production dependency closure.
- Windows code signing remains a release concern; unsigned local installers can trigger SmartScreen warnings.
