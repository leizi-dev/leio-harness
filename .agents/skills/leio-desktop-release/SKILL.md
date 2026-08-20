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
- The recipient must not need Node.js, pnpm, a checkout, Visual Studio, or a separately installed runtime. Electron provides Node. When the approved first-launch runtime cache is used, the matching immutable dependency ZIP is a required GitHub Release attachment and the first launch needs network access.

## Required workflow

1. Inspect before editing. Check `git status`, the current version/tag, `apps/desktop/package.json`, `apps/desktop/src/main.mjs`, the icon asset, and the remote. Use CodeGraph for structural questions; if the project index is missing, run `codegraph init -i` when the user has authorized it.
2. Define the acceptance evidence before changing code:
   - focused regression test for the failure;
   - `pnpm run build` or the narrow build that covers the changed package;
   - `pnpm run desktop:dist` for a release installer;
   - a fresh install into a new directory under `E:\soft`;
   - the installed exe starts, serves HTTP 200, publishes a non-empty web boot manifest, and closes normally.
3. Make the smallest fix. Do not solve a packaging failure by silently adding a key, changing the user profile, disabling startup errors, or weakening the loader.
4. Run the focused test before packaging, then build the installer. Keep the first-install NSIS package at `compression: "store"`: installation time is the primary requirement for this project. Do not trade that requirement for a smaller installer unless the user explicitly changes the priority.
5. Install the exact generated installer into a new test directory. Never use an old installation as the only test because stale profile links and caches can hide packaging errors.
6. Start the exe from that installation with an isolated `DSH_HOME` and an empty isolated Electron user-data directory under `E:\soft`. For the runtime-cache design, prove the first launch downloads, validates, and extracts the matching Release ZIP; then start it again and prove the second launch reuses the cache without another download. Check the process tree and the listening port. Fetch `/` and parse `window.__DSH_BOOT__`.
7. Require the installed response to have HTTP 200, at least one client entry, and the essential `@leio-ai/leio-client-modules` and `@leio-ai/leio-client-ui-layout` entries. Assert it does not contain `Failed to load plugins`.
8. Verify the main window title is `Leio Harness`; request a normal close and wait for the main process to exit. Force-kill only leftover child processes from the smoke test after the graceful-close assertion.
9. Record installer path, size, SHA-256, commit, tag, test commands, and the exact installation-test result. Do not publish a package with an untested install path.

## Differential hot updates

- A first-install NSIS package and a hot-update asset are different release artifacts. The first-install package may be about 140–150 MB because it is self-contained; it must not be used as the hot-update asset.
- Hot updates are file-level delta patches. Generate the patch with `node scripts/build-desktop-delta.mjs`, passing the previous and new versions and only the changed packaged files. The current helper also updates the same-length desktop version field in `resources/app.asar` so the updater does not offer the same release repeatedly.
- A text-only change must produce a small patch, normally KB-scale. A hot-update asset over 100 MB, or close to the full installer size, is a release blocker and means the full installer was selected accidentally.
- Test the actual flow from a fresh installation of the previous version: download the signed delta, apply it to that installation, start the patched executable, fetch HTTP 200 and the plugin endpoint containing the new behavior, confirm the old behavior is absent, and check for no `Failed to load plugins` output. Testing only the new source build or a new 1.0.1 installation does not prove a hot update.
- Put only the signed delta patch in `stable.json.asset` for the hot-update channel. Keep the speed-first full NSIS installer as a separate first-install download. The GitHub release attachment is the binary source; never commit either binary to Git.
- Do not call a full installer or a full application ZIP a differential update. The previous failed release attempt uploaded the full installer, exceeded the release attachment limit, and did not satisfy the user's hot-update requirement; preserve this distinction in future release work.

## Electron and ASAR module resolution

### First-launch runtime cache

The Electron ASAR must contain only the desktop shell, bootstrap UI, and immutable runtime manifest; Electron itself supplies Node. The manifest names ordered HTTPS sources for one ZIP with exact filename, byte count, and SHA-256: GitHub Release is always first and the domestic OSS redirect is used only after that request fails or does not respond within the bounded first-response timeout. The timer must end when response headers arrive, never during a healthy ZIP stream. Before importing any Leio package, the shell must show progress, download the ZIP into application user data, verify length and SHA-256, extract into a staging directory, verify `@leio-ai/leio`, write a version/hash marker, then atomically rename the staging directory into the cache. A valid marker makes later launches offline and download-free.

- Build the runtime ZIP from the full production dependency closure, not `app.asar.unpacked` and not a hand-picked package list. A screenshot containing a missing transitive package such as `js-yaml` is a release blocker.
- pnpm deploy output uses Windows links. The released ZIP must dereference every link into real files before extraction; otherwise `tar.exe` can restore links that fail on another computer. Verify after extracting the ZIP to a fresh directory that `@leio-ai/leio-app-boot`, `@leio-ai/leio/profile-boot`, and a transitive package resolve successfully through a fresh `runtime-anchor.cjs`.
- Keep the NSIS installer at `compression: "store"`. Runtime compression or download behavior must not make installation slower; its cost belongs only to the first networked application start.
- Never publish the installer before its referenced runtime asset. The installer manifest URL, runtime asset filename, size, and SHA-256 must match the uploaded ZIP exactly.

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

## Download endpoint continuity

Treat every installer URL that has already been published as a permanent public entry point. Never replace, remove, or repurpose it when adding a runtime mirror or changing versions. The published installer endpoint must redirect to the configured latest installer, including when its path contains an older version number. A fixed runtime ZIP endpoint is a separate internal client path; it must not displace the public installer URL. Verify both endpoints after deployment and document the stable installer URL in the release notes.

When handing off, state:

- the tested installer path and SHA-256;
- whether the installed exe passed HTTP, boot-manifest, window-title, and graceful-close checks;
- the keyless/model status (do not imply model calls were tested without a key);
- the commit and tag updated;
- any cleanup that was intentionally left because it belonged to the user's existing files.

If electron-builder cannot reach GitHub to download a build tool, do not publish an existing file under a new name. First check the local Electron and electron-builder caches. If an offline build is still blocked by Windows signing-tool discovery and no signing certificate is configured, use `signExecutable: false`; if resource editing itself remains blocked, build the prepackaged directory with `signAndEditExecutable: false`, write the approved ICO into the packaged EXE with the local resource editor, and build the NSIS artifact with `--prepackaged`. Restore the source configuration before committing and verify the embedded icon and the final installer timestamp/hash.

## Failure patterns from prior releases

- `Failed to load plugins ... waiting for services: slots, sessions, layout`: packaged web boot manifest was empty; check profile bundle composition and physical module links.
- `ERR_MODULE_NOT_FOUND` for an internal `@leio-ai/...` package: package inclusion or module fallback is broken; inspect the installed `resources` tree and package exports.
- `ENOENT` for `app.asar.unpacked\node_modules\zod`, `readdirp`, or another transitive dependency: unpack matching did not cover the dependency layer; do not add a one-off copy of a single package.
- A source launch passes but an installed copy fails: treat it as a release blocker and reproduce from a fresh `E:\soft` install directory with isolated user data.
- A model/provider error before the web window opens: first classify whether it is a missing key/configuration or a packaging failure. Ask the user for configuration only after the package boot path is proven healthy.
