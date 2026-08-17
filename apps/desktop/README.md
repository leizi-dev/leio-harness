# Leio Harness Desktop

English | [中文](README.zh.md)

This application packages the local Leio Harness Web profile in an Electron window and produces a Windows NSIS installer. It starts the Harness in the Electron main process on an operating-system-assigned loopback port, then disposes the complete Cordis tree before Electron exits.

## Build the installer

From the repository root, run:

```sh
pnpm run desktop:dist
```

The command builds the workspace and Web frontend before writing the installer to `apps/desktop/dist/`. The installer targets Windows x64, installs for the current user, creates Start menu and desktop shortcuts, and stores application resources in an ASAR archive. Product and vendor runtime packages plus native runtime packages are unpacked; the rest of the dependency tree stays in ASAR instead of being copied as individual installer files.

The NSIS compression level is `store`: the installer is larger, but installation avoids the maximum solid-compression decompression cost and is the speed-first choice for this application.

The Windows application icon, installer icon, shortcuts, and Web application icon all use the same full circular transparent artwork, so the executable and installed application do not retain square image corners.

## Desktop updates

Packaged builds check the signed GitHub update manifest ten seconds after startup. The General settings page also provides a manual check, download, and restart-install flow. The first-install NSIS package remains speed-first with `store` compression; update releases use a small signed NSIS delta patch containing only changed installed files. The main process verifies the manifest signature, patch size, and SHA-256 digest before starting the replacement patch. The update channel and signing procedure live in [`updates/README.md`](../../updates/README.md).

## Run from source

From the repository root, run:

```sh
pnpm run desktop:start
```

The desktop shell uses the same Harness home, profiles, settings, credentials, sessions, and workspace data as `pnpm dsh web`. Model requests still require a provider credential configured through the existing settings or environment variables; credentials are never embedded in the application package.

## Security and lifecycle

The BrowserWindow disables Node integration, enables context isolation and renderer sandboxing, and opens non-local HTTP links in the system browser. Only one desktop instance runs at a time. Closing the application requests the existing bounded Harness shutdown before Electron exits.
