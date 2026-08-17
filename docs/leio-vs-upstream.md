# Leio and DeepSeek Harness differences

English | [中文](leio-vs-upstream.zh.md)

This reference lists the maintained product differences between Leio Harness and the DeepSeek Harness source. The upstream commit and the Leio commit associated with the current tree are in [`upstream.lock.json`](../upstream.lock.json).

| Area | DeepSeek Harness | Leio Harness |
| --- | --- | --- |
| Product identity | DeepSeek Harness and `dsh` | Leio Harness |
| Package namespace | `@deepseek-ai/dsh-*` | `@leio-ai/leio-*` |
| Upstream branch | `master` | `main` |
| Desktop application | No Electron `apps/desktop` tree | Self-contained Windows Electron application |
| Installer | Upstream release process | NSIS installer with `compression: store` for fast first install |
| Update channel | Upstream default | GitHub manifest and file-level differential updates |
| Branding | DeepSeek assets and copy | Circular Leio asset in the executable, installer, shortcut, and UI |
| Product copy | Upstream English and Chinese copy | Leio product name and customized startup text |
| LLM package | `@deepseek-ai/dsh-llm` | `@leio-ai/leio-llm` |
| Release version | Upstream prerelease line | Independent Leio SemVer tags such as `v1.0.0` and `v1.0.1` |
| Acceptance target | Source build and upstream checks | Fresh installed executable, HTTP boot, plugin activation, update flow, and graceful close |

The namespace, desktop, branding, installer, update, and release differences are intentional and must survive an upstream sync. Generic capability changes remain candidates for import after focused verification.
