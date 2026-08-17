# Agent Note: Leio upstream synchronization foundation

Status: implemented

[English](2026-08-17-leio-upstream-sync-foundation.md) | 中文

## Problem

Leio Harness 拥有包命名空间、Electron 桌面应用、快速安装包、品牌和差分更新通道，这些内容不属于 DeepSeek Harness 源项目。同步上游时必须保持这些产品决策，并且能够追踪同步来源。

## Decision

Leio 将 `https://github.com/deepseek-ai/deepseek-harness.git` 的 `master` 分支作为 `upstream` 远程，将 GitHub `leizi-dev/leio-harness` 作为 `origin`，并保留 Gitee 远程 `gitee`。准确的上游提交和 Leio 提交记录在 [`upstream.lock.json`](../../../../upstream.lock.json) 中。

同步流程从 Leio `main` 创建 `codex/upstream-sync-YYYYMMDD` 分支，按功能组导入通用变化，并保留 [`docs/upstream-sync.md`](../../../../docs/upstream-sync.md) 定义的命名空间、桌面发布、安装速度、品牌和更新约束。

当前上游提交 `47f943859bef60e4160492346772ded9b24f765a` 将包预发布元数据更新为 `0.1.0-rc.5` 并改为公开发布。这些包值已经存在于 Leio 树中；独立的 Leio 根版本继续保持 `1.0.0`。

## Alternatives considered

**直接使用 GitHub Fork 同步：** 不作为主要流程，因为 Leio 历史和包命名空间独立维护，GitHub Fork 同步无法表达桌面端和发布冲突规则。

**使用无关历史强行合并完整上游目录：** 不采用，因为这会把源码、命名空间和桌面端冲突混成一个不可审计的合并，并可能覆盖发布关键文件。

**只保留独立源码副本而不锁定上游：** 不采用，因为维护者无法确定准确的上游提交，也无法区分上游变化和 Leio 变化。

## Consequences

维护者必须在同步分支上审查上游变化，并同步更新锁定文件和差异说明。Git 历史传输不可用时允许使用源码快照，但必须记录完整上游 SHA。该流程增加了文档和验证工作，同时让包、桌面端、安装包、品牌和更新回归在发布前可见。
