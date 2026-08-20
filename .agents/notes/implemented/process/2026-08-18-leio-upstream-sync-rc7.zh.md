# Agent Note: 同步 rc.7 包元数据发布

Status: implemented

[English](2026-08-18-leio-upstream-sync-rc7.md) | 中文

## 问题

Leio Harness 需要同步上游 rc.7 包元数据，同时保留独立的产品版本、包作用域、桌面打包和更新行为。

## 决策

Leio Harness 使用 `deepseek-ai/deepseek-harness` 的官方源码快照同步上游提交 `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`。该提交是 `dsh@0.1.0-rc.7` 发布提交，将上游 222 个包清单从 `0.1.0-rc.6` 更新到 `0.1.0-rc.7`，不包含运行时代码或资源变更。此次同步以 Leio 基线提交 `8abdca7` 为准。

Leio 将现有 `0.1.0-rc.5` 内部包元数据同步到 `0.1.0-rc.7`，同时保持独立的 Leio 产品版本 `1.0.2`。`apps/desktop`、`compression: "store"`、圆形品牌图标、自包含安装包和文件级更新通道仍由 Leio 自己维护。

## 命名与发布不变量

- 保留 `@leio-ai/leio-*` 包名和 `Leio Harness` 产品身份。
- 保留有意存在的上游链接、第三方归属、协议稳定标识和历史 Agent Note；它们是引用，不是当前产品品牌。
- 不把完整 NSIS 安装包当成差分更新包。
- 不把大模型 key 或 GitHub 凭据写入源码、元数据、日志或发布附件。

## 备选方案

**保留 rc.5 包元数据。** 不予采用：即使上游发布不含运行时变更，Leio 也会因此与上游包集合产生偏离。

**采用上游产品身份和版本。** 不予采用：Leio 包作用域、桌面产品版本、品牌、安装包和更新通道均独立发布。

## 影响

- 源码：官方 GitHub `master` 快照，提交为 `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`。
- 导入内容：222 个工作区包清单版本；上游发布提交没有运行时代码或资源文件变更。
- 必须验证：包安装与 lockfile、仓库构建、桌面分发构建、全新的 `E:\soft` 安装冒烟测试和发布产物哈希。
