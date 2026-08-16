# Desktop update channel

English | [中文](README.zh.md)

The packaged desktop app reads `stable.json` from the repository's `main` branch and verifies the detached `stable.json.sig` Ed25519 signature before it accepts an update download. The downloaded asset is then checked against the declared size and SHA-256 digest.

## Publish a release

1. Build and smoke-test the speed-first Windows NSIS installer with `pnpm run desktop:dist`.
2. Build a delta patch from the previous installed version. For example:
   `node scripts/build-desktop-delta.mjs --from 1.0.0 --to 1.0.1 --source apps/desktop/dist/win-unpacked --output apps/desktop/dist/Leio-Harness-Delta-1.0.1-x64.exe --file resources/app.asar.unpacked/node_modules/@leio-ai/leio-client-ui-conversation/lib/client.js`
3. Apply the delta to a fresh installation of the previous version and smoke-test that installed copy. A text-only change should produce a small patch; a result near the full installer size means the wrong artifact was selected.
4. Record the delta file name, byte size, and lowercase SHA-256 digest in `stable.json`.
3. Sign the exact JSON file with the private key kept outside the repository:

   ```sh
   node scripts/sign-desktop-update.mjs --manifest updates/stable.json --key E:/soft/leio-harness-update-signing/private-key.pem
   ```

5. Create or replace the Gitee `v<version>` release, upload the delta patch as a release attachment, and copy its direct HTTPS Gitee URL into the manifest's `asset.url`. Keep the full NSIS installer available separately for first installation; never use it as the hot-update asset.
6. Commit `stable.json` and `stable.json.sig` to the repository after the exact release URL, size, and digest are final.

The public key is embedded in the desktop source. Never commit or upload the private key. Do not commit the roughly 150 MB first-install package in Git. The Gitee release attachment is the binary source, but only the small delta patch belongs in the hot-update manifest. The bootstrap `1.0.0` manifest has no asset because existing `1.0.0` installations predate this updater; the first updater-enabled release must be distributed once manually and use a higher version.

The formal desktop target is the NSIS installer. Portable output is not part of the release channel because it cannot safely replace a running installed application.
