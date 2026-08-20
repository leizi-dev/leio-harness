# Leio 与 DeepSeek Harness 的差异

[English](leio-vs-upstream.md) | 中文

本文档列出 Leio Harness 与 DeepSeek Harness 源项目之间需要长期维护的产品差异。当前树对应的上游提交和 Leio 提交记录在 [`upstream.lock.json`](../upstream.lock.json) 中。

| Area | DeepSeek Harness | Leio Harness |
| --- | --- | --- |
| Product identity | DeepSeek Harness 和 `dsh` | Leio Harness |
| Package namespace | `@deepseek-ai/dsh-*` | `@leio-ai/leio-*` |
| Upstream branch | `master` | `main` |
| Desktop application | 没有 Electron `apps/desktop` 目录 | 自包含的 Windows Electron 应用 |
| Installer | 上游发布流程 | 首次安装使用 `compression: store` 的快速 NSIS 安装包 |
| Update channel | 上游默认方式 | GitHub 清单和文件级差分更新 |
| Branding | DeepSeek 图片和文案 | 可执行文件、安装包、快捷方式和界面统一使用圆形 Leio 图片 |
| Product copy | 上游中英文文案 | Leio 产品名称和定制启动文案 |
| LLM package | `@deepseek-ai/dsh-llm` | `@leio-ai/leio-llm` |
| Release version | 上游预发布版本线 | 独立的 Leio SemVer 标签，例如 `v1.0.0` 和 `v1.0.2` |
| Acceptance target | 源码构建和上游检查 | 全新安装后的程序、HTTP 启动、插件激活、更新流程和正常关闭 |

命名空间、桌面端、品牌、安装包、更新和发布版本差异都是有意保留的，上游同步必须保持这些差异。通用能力变化在通过针对性验证后可以纳入。
