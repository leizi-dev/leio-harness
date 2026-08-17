# 上游同步

[English](upstream-sync.md) | 中文

本文档定义 Leio Harness 如何跟踪和吸收 DeepSeek Harness 的变化，同时保留 Leio 专属运行时和发布行为。

## 远程仓库职责

Git 远程仓库按职责分离：

| Remote | Repository | Role |
| --- | --- | --- |
| `origin` | `https://github.com/leizi-dev/leio-harness.git` | Leio 源码和发布历史 |
| `gitee` | `https://gitee.com/chengsirs/leio-harness.git` | 现有镜像和更新文件分发 |
| `upstream` | `https://github.com/deepseek-ai/deepseek-harness.git` | DeepSeek 源码参考 |

权威上游分支是 `master`。当前 Leio 树使用的准确上游提交记录在 [`upstream.lock.json`](../upstream.lock.json) 中。

## 同步流程

1. 读取锁定的上游提交，并获取当前 `upstream/master` 引用。
2. 从当前 Leio `main` 创建 `codex/upstream-sync-YYYYMMDD` 分支。
3. 修改前比较包清单、源码路径、生成文件和仅桌面端目录。
4. 按功能组导入上游变化，并保留 Leio 包名、桌面打包、更新行为和品牌。
5. 同步修改 [`leio-vs-upstream.md`](leio-vs-upstream.md)、锁定文件和已实现流程记录。
6. 合并同步分支前运行针对性测试、构建检查和 Windows 安装后冒烟测试。

当无法获取完整 Git 历史时，使用官方源码快照比较内容，并记录完整上游提交 SHA。不要创建掩盖实际导入来源的无关历史合并。

## 冲突处理原则

上游负责通用 Harness 能力、测试、文档结构和包实现改进。Leio 负责 `@leio-ai/leio-*` 命名空间、Leio 产品文案、Electron 应用、圆形品牌图片、快速安装包和差分更新通道。

Vendor 变化遵循 [`vendor/README.md`](../vendor/README.md) 和 [`rescope.md`](rescope.md)。Vendor 快照变化后重新应用作用域映射，并按仓库检查要求重新生成锁文件、第三方声明和翻译记录。

会影响模型可见行为的源码变化必须补充 [`docs/testing.md`](testing.md) 要求的会话事件、快照或组装应用验证。打包变化还必须满足 [`leio-desktop-release`](../.agents/skills/leio-desktop-release/SKILL.md)。

## 版本和发布规则

Leio 产品版本独立遵循 SemVer。上游提交是发布元数据，不替代 Leio 版本号。发行说明分别记录吸收的上游行为和 Leio 专属行为。

首次安装 NSIS 安装包和差分热更新文件始终是不同的发布物。只修改文字时不能把完整安装包作为热更新发布；首次安装时间是最高优先级，因此安装包压缩方式保持 `store`。

## 验证要求

上游同步至少需要以下证据：

- `upstream.lock.json` 中的上游 SHA 与检查过的源码一致；
- 包命名空间和桌面发布约束保持不变；
- 针对性测试和必要构建通过；
- 全新 Windows 安装可以启动，并产生非空 Web 启动清单；
- 更新文件发生变化时，旧版本安装只能接受目标差分更新。
