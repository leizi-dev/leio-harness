# Desktop update channel

English | [中文](README.zh.md)

The packaged desktop application reads `stable.json` and `stable.json.sig` from the `main` branch of [leizi-dev/leio-harness](https://github.com/leizi-dev/leio-harness). It verifies the detached Ed25519 signature before accepting an update, then checks the downloaded asset's file size and SHA-256 digest.

## Current release

[Leio Harness 1.0.1](https://github.com/leizi-dev/leio-harness/releases/tag/v1.0.1) is the tested Windows x64 full installer. It is a manual-installation asset and is not used as a differential update.

The bootstrap manifest remains at `1.0.0` until a small update artifact is generated and signed. This prevents the full installer from being downloaded as a hot update and preserves the installation-time and update-size requirements.

## Requirements for a future hot update

1. Produce an update artifact containing only the changed installed files. The artifact must be materially smaller than the full installer.
2. Apply it to a fresh installation of the previous version and verify application startup, plugin loading, and the changed behavior.
3. Record the artifact file name, byte size, lowercase SHA-256 digest, and direct HTTPS GitHub release URL in `stable.json`.
4. Sign the exact `stable.json` file with the private key stored outside the repository:

   ```sh
   node scripts/sign-desktop-update.mjs --manifest updates/stable.json --key E:/soft/leio-harness-update-signing/private-key.pem
   ```

5. Upload the signed update artifact to the matching GitHub release, commit `stable.json` and `stable.json.sig`, and verify both files through their public raw URLs.

Never commit or upload the private key. Do not place the full first-install package in Git. Do not put the full installer in the hot-update manifest. The formal desktop release target is the NSIS installer; portable output is not part of the update channel.
