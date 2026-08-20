# Leio Harness Desktop

English | [中文](README.zh.md)

The desktop application runs the local Leio Harness Web profile in an Electron window and produces a Windows x64 NSIS installer. The Electron main process starts the local Harness on an operating-system-assigned loopback port and releases it during application shutdown.

## Build

From the repository root:

```sh
pnpm run desktop:start
```

This builds the libraries and Web frontend before starting the desktop shell. To create the Windows installer, run:

```sh
pnpm run desktop:dist
```

The installer is written to `apps/desktop/dist/`. It uses `store` compression to prioritize installation time and creates desktop and Start menu shortcuts. Electron supplies the embedded Node runtime, so recipients do not need a separate Node.js installation.

On its first launch, the desktop shell shows a progress window while it downloads the versioned Leio dependency runtime from the matching GitHub Release, verifies its SHA-256 checksum, and stores it under the application user-data directory. If GitHub is unavailable, it retries the same immutable ZIP through the domestic OSS redirect. Later launches verify and reuse that local runtime without downloading it again. A first launch therefore requires network access; installation itself remains fast and offline.

The executable, installer, shortcuts, and application UI use the circular transparent Leio icon from `apps/desktop/build/icon.png`.

## Updates

The packaged application reads the signed GitHub update manifest after startup. The General settings page provides a manual check, download, and restart-install flow. Each full installer release must include its matching immutable runtime ZIP asset. A small update artifact must be generated, signed, applied to a fresh previous-version installation, and smoke-tested before it is added to the automatic update manifest.

## Configuration

Model provider credentials are configured through the application settings or supported environment variables. Credentials are not embedded in the application package.
