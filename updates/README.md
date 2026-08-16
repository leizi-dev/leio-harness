# Desktop update channel

English | [中文](README.zh.md)

The packaged desktop app reads `stable.json` from the repository's `main` branch and verifies the detached `stable.json.sig` Ed25519 signature before it accepts an installer download. The installer is then checked against the declared size and SHA-256 digest.

## Publish a release

1. Build and smoke-test the Windows NSIS installer with `pnpm run desktop:dist`.
2. Record the installer file name, byte size, and lowercase SHA-256 digest in `stable.json`.
3. Sign the exact JSON file with the private key kept outside the repository:

   ```sh
   node scripts/sign-desktop-update.mjs --manifest updates/stable.json --key E:/soft/leio-harness-update-signing/private-key.pem
   ```

4. Create or replace the Gitee `v<version>` release, upload the NSIS installer as a release attachment, and copy its direct HTTPS Gitee URL into the manifest's `asset.url`.
5. Commit `stable.json` and `stable.json.sig` to the repository after the exact release URL, size, and digest are final.

The public key is embedded in the desktop source. Never commit or upload the private key. Do not store the roughly 150 MB installer in Git; the Gitee release attachment is the binary source. The bootstrap `1.0.0` manifest has no asset because existing `1.0.0` installations predate this updater; the first updater-enabled release must be distributed once manually and use a higher version.

The formal desktop target is the NSIS installer. Portable output is not part of the release channel because it cannot safely replace a running installed application.
