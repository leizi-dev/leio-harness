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

The installer is written to `apps/desktop/dist/`. It uses `store` compression to prioritize installation time, creates desktop and Start menu shortcuts, and keeps application resources in an ASAR archive with required native/runtime dependencies unpacked.

The executable, installer, shortcuts, and application UI use the circular transparent Leio icon from `apps/desktop/build/icon.png`.

## Updates

The packaged application reads the signed GitHub update manifest after startup. The General settings page provides a manual check, download, and restart-install flow. The `v1.0.1` GitHub release currently provides the tested full installer for manual installation. A small update artifact must be generated, signed, applied to a fresh previous-version installation, and smoke-tested before it is added to the automatic update manifest.

## Configuration

Model provider credentials are configured through the application settings or supported environment variables. Credentials are not embedded in the application package.
