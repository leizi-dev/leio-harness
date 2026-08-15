---
name: leio-desktop-release
description: Build, test, package, install-test, and release the Leio Harness Windows Electron application. Use for desktop packaging changes, installer failures, Electron startup errors, icon or branding updates, ASAR/module-resolution issues, or creating a tested Windows release.
---

# Leio Desktop Release

Use this skill whenever a change must reach another Windows user as a working `Leio Harness.exe` or NSIS installer. Treat the installed application as the acceptance target; a successful TypeScript build or an unpacked development launch is not delivery evidence.

## Project invariants

- Read the root `AGENTS.md`, `docs/architecture.md`, and relevant package `AGENTS.md` before changing `packages/` or the boot path.
- Keep the product identity as `Leio Harness`; npm packages use `@leio-ai/leio-*`. Do not reintroduce the old internal `dsh` package names.
- Preserve the requested application version. If the user explicitly asks to replace the existing `v1.0.0` release, update the same tag only after the new commit and installer have passed the full smoke test.
- Never put model API keys in source, package metadata, installer files, logs, or the release asset. If a real model request is required and no key is available, stop and ask the user.
- Use the approved circular transparent brand image consistently for the executable icon, installer icon, desktop shortcut, and any UI image derived from the brand asset. Verify the final `.exe` icon rather than trusting source filenames.
- Keep the Windows installer self-contained. The recipient must not need Node.js, pnpm, a checkout, Visual Studio, or a separately installed runtime.

## Required workflow

1. Inspect before editing. Check `git status`, the current version/tag, `apps/desktop/package.json`, `apps/desktop/src/main.mjs`, the icon asset, and the remote. Use CodeGraph for structural questions; if the project index is missing, run `codegraph init -i` when the user has authorized it.
2. Define the acceptance evidence before changing code:
   - focused regression test for the failure;
   - `pnpm run build` or the narrow build that covers the changed package;
   - `pnpm run desktop:dist` for a release installer;
   - a fresh install into a new directory under `E:\soft`;
   - the installed exe starts, serves HTTP 200, publishes a non-empty web boot manifest, and closes normally.
3. Make the smallest fix. Do not solve a packaging failure by silently adding a key, changing the user profile, disabling startup errors, or weakening the loader.
4. Run the focused test before packaging, then build the installer. Keep ASAR/installer compression enabled unless a verified Windows runtime limitation requires a documented fallback.
5. Install the exact generated installer into a new test directory. Never use an old installation as the only test because stale profile links and caches can hide packaging errors.
6. Start the exe from that installation with an isolated `DSH_HOME` under `E:\soft`. Check the process tree and the listening port. Fetch `/` and parse `window.__DSH_BOOT__`.
7. Require the installed response to have HTTP 200, at least one client entry, and the essential `@leio-ai/leio-client-modules` and `@leio-ai/leio-client-ui-layout` entries. Assert it does not contain `Failed to load plugins`.
8. Verify the main window title is `Leio Harness`; request a normal close and wait for the main process to exit. Force-kill only leftover child processes from the smoke test after the graceful-close assertion.
9. Record installer path, size, SHA-256, commit, tag, test commands, and the exact installation-test result. Do not publish a package with an untested install path.

## Electron and ASAR module resolution

The profile boot maintains `$DSH_HOME/profiles/node_modules` with Windows links to the installation dependency closure. A Junction cannot point to a virtual `resources\app.asar\...` path. When ASAR is used:

- configure Electron-builder to unpack every dependency layer, including both `node_modules/**` and `**/node_modules/**`, so packages exist under `resources\app.asar.unpacked`;
- in `packages/boot/app-boot/src/profile.ts`, map package candidates inside `.asar` to the matching `.asar.unpacked` directory before creating profile links;
- keep a regression test that stages `app.asar` and `app.asar.unpacked` and asserts both the app and dependency links target the physical unpacked directory;
- test a real installed exe, because `win-unpacked` may work while the NSIS-installed copy still has missing files.

If the installed log contains `ENOENT` paths under `app.asar.unpacked\node_modules`, inspect whether the named package is physically present in the installed directory. If it is absent, fix the builder unpack glob or package inclusion before changing runtime code. If the web boot manifest has zero entries, inspect profile resolution and the module fallback links before investigating model configuration.

## Packaging commands

Run only the checks relevant to the change, and report what actually ran:

```powershell
pnpm exec vitest run packages/boot/app-boot/tests/profile.spec.ts
pnpm run build
pnpm run desktop:dist
pnpm --filter @leio-ai/leio-desktop dist:win:all
```

The release artifact is normally `apps/desktop/dist/Leio-Harness-Setup-1.0.0-x64.exe`. Do not rename it by hand in a way that disagrees with `apps/desktop/package.json`. Keep `asar: true` and the unpack rules intentional; an installer containing an ASAR plus `app.asar.unpacked` is still a single self-contained NSIS installer.

The optional `Leio-Harness-Portable-1.0.0-x64.exe` target is a comparison artifact, not automatic release evidence. Electron-builder Portable self-extracts the full application before the Electron process can start. With the current dependency tree, a clean Portable launch exceeded ten minutes without publishing a web port, while the NSIS-installed copy completed its boot checks. Do not retain or publish Portable until a clean launch completes the same HTTP, boot-manifest, title, and close checks.

## Release and handoff

Before publishing, inspect the diff and ensure no credentials, temporary smoke data, stale build logs, or unrelated files are staged. Commit the source and packaging fix first. Create or replace the requested release tag only after the installed smoke test passes. Upload the exact tested installer and include a short Chinese release title and description when the user asks for Gitee/Git release text.

When handing off, state:

- the tested installer path and SHA-256;
- whether the installed exe passed HTTP, boot-manifest, window-title, and graceful-close checks;
- the keyless/model status (do not imply model calls were tested without a key);
- the commit and tag updated;
- any cleanup that was intentionally left because it belonged to the user's existing files.

## Failure patterns from prior releases

- `Failed to load plugins ... waiting for services: slots, sessions, layout`: packaged web boot manifest was empty; check profile bundle composition and physical module links.
- `ERR_MODULE_NOT_FOUND` for an internal `@leio-ai/...` package: package inclusion or module fallback is broken; inspect the installed `resources` tree and package exports.
- `ENOENT` for `app.asar.unpacked\node_modules\zod`, `readdirp`, or another transitive dependency: unpack matching did not cover the dependency layer; do not add a one-off copy of a single package.
- A source launch passes but an installed copy fails: treat it as a release blocker and reproduce from a fresh `E:\soft` install directory with isolated user data.
- A model/provider error before the web window opens: first classify whether it is a missing key/configuration or a packaging failure. Ask the user for configuration only after the package boot path is proven healthy.
