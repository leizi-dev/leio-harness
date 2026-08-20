# Agent Note: Cache the complete desktop runtime outside ASAR

Status: implemented

English | [中文](2026-08-19-desktop-runtime-cache.zh.md)

## Problem

The desktop installer could omit transitive packages from the packaged dependency tree. A clean installation then reached Cordis startup but failed while resolving a package such as `js-yaml` or an obsolete internal package name. Development and an existing local installation could hide the omission through their workspace dependencies and cached profile links.

## Decision

`apps/desktop/src/main.mjs` starts a dependency bootstrap window before it imports a Leio package. `RuntimeBootstrapper` tries the immutable runtime sources named by `apps/desktop/src/runtime/manifest.mjs` in order: GitHub Release first, then the domestic OSS redirect only after a GitHub failure or a 15-second absence of an initial response. The domestic source has a fixed URL and sends `X-Leio-Harness-Runtime-Version`, allowing the server to select the ZIP that matches the installer's manifest without changing the endpoint. That response timeout is cleared before the ZIP stream begins, so a healthy slower download is not cancelled. It verifies the downloaded ZIP's byte count and SHA-256, extracts it into a staging directory in Electron user data, verifies `@leio-ai/leio`, writes a version/hash marker, and atomically promotes the cache. It imports `@leio-ai/leio-app-boot` and `@leio-ai/leio/profile-boot` only from that verified cache.

Electron remains the bundled Node runtime. The NSIS installer uses `store` compression and contains the lightweight shell rather than a copied dependency closure, so installation time stays independent of runtime download and extraction. Later launches validate the marker and reuse the cache without a network request.

The runtime release ZIP is built from a production `pnpm deploy` with the hoisted node linker. Its `node_modules` tree contains real directories instead of pnpm links, because a ZIP extracted by Windows `tar.exe` must be portable to computers that cannot recreate the original links. The release ZIP is an immutable companion asset, not a differential hot-update patch.

## Alternatives considered

**Keep every dependency inside `app.asar` or `app.asar.unpacked`.** Rejected because previous package inclusion and ASAR mapping already produced an installed dependency graph that differed from the development graph, and every omission required another full installer cycle.

**Archive the ordinary pnpm virtual-store tree.** Rejected because its links extracted as unusable Windows links on the target machine. A package can be present in the archive while Node still cannot resolve it.

**Download packages individually with npm at startup.** Rejected because it would need a registry, package-manager behavior, and dependency resolution on each user device. One versioned, hash-verified closure gives deterministic startup contents.

## Consequences

First launch needs access to either the matching GitHub Release runtime asset or its domestic fallback and can take longer than later launches. A full release now has two required binary attachments: the fast-install NSIS installer and its exact runtime ZIP. Published installer URLs remain permanent aliases for the configured latest installer; the runtime endpoint is separate and is not a user download URL. Release validation must prove both a clean first runtime installation and an offline cache reuse, then run the installed desktop smoke test with an isolated user-data directory.

## Testing

`apps/desktop/tests/runtime-bootstrap.spec.ts` covers download, checksum verification, extraction, marker creation, and a cache hit without a second fetch. The release ZIP is separately extracted into a fresh directory and imports `@leio-ai/leio-app-boot`, `@leio-ai/leio/profile-boot`, and `js-yaml`. The installed v1.0.3 smoke starts from a fresh `E:\soft` installation with isolated user data, returns HTTP 200, publishes the required client boot entries, has the `Leio Harness` window title, and exits after a normal close.
