# Leio Harness

English | [中文](README.zh.md)

Leio Harness is a Windows desktop AI workbench based on [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). This repository contains the Leio product name, `@leio-ai/leio-*` package scope, Electron desktop shell, Web UI, updater, and the project-specific changes maintained on top of the source project.

## Download the Windows application

The current tested release is [Leio Harness 1.0.1](https://github.com/leizi-dev/leio-harness/releases/tag/v1.0.1).

Download the [Windows x64 installer](https://github.com/leizi-dev/leio-harness/releases/download/v1.0.1/Leio-Harness-Setup-1.0.1-x64.exe), run it, and launch **Leio Harness** from the desktop or Start menu. The installer uses the speed-first `store` compression mode; the package is larger than a highly compressed installer, but installation avoids the corresponding solid-decompression cost.

The application does not contain an API key. Configure the required model provider in the application settings or through the supported environment variables. Never commit a key to this repository or place one in a release package.

## Run

### Run from source

Requirements: Node.js `^22.19.0 || >=24.0.0` and pnpm `11.7.0`.

From the repository root:

```sh
pnpm install
pnpm run desktop:start
```

To build the Windows installer:

```sh
pnpm run desktop:dist
```

The installer is written to `apps/desktop/dist/`. The desktop build includes the circular transparent Leio icon used by the executable, installer, shortcuts, and application UI.

## Updates

The desktop application reads the signed update manifest from GitHub and provides automatic and manual update entry points. Release files are published on the [GitHub Releases page](https://github.com/leizi-dev/leio-harness/releases).

The `v1.0.1` release is the tested full installer for manual installation. The signed manifest remains the bootstrap channel for existing installations until a separately generated, signed, and smoke-tested small update artifact is available; the full installer is not advertised as a differential update.

## Project documentation

- [Development guide](docs/development.md)
- [Architecture](docs/architecture.md)
- [Leio and DeepSeek Harness differences](docs/leio-vs-upstream.md)
- [Desktop release and update procedure](updates/README.md)

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
