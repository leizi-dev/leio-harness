# Agent Note：Windows Portable 目标基准测试

状态：已实现

English | [中文](2026-08-15-portable-target-benchmark.md)

## 问题

本次发布需要同时提供普通安装程序和免安装 EXE 供用户比较。由于 Windows Profile 链接必须指向真实的包目录，当前应用会解包较大的依赖树。

## 决策

增加名称独立的 NSIS 和 Portable 打包目标。NSIS 安装包继续作为候选发布版本，Portable 只有在全新的启动流程通过同一套验收后才能发布。必须直接测试生成物，因为 Portable 会把解包耗时转移到首次启动。

## 证据

实测 NSIS 安装包安装耗时 749.4 秒，之后通过 HTTP 200、38 个 Boot entries、必要客户端条目、窗口标题和正常关闭检查。实测 Portable 在超过十分钟的首次自解包后仍未发布 Web 端口，因此当前依赖树下不作为发布候选。

## 备选方案

- **只发布 Portable**：否决，因为全新的首次启动超过十分钟仍未完成。
- **立即用 Portable 替换 NSIS**：否决，因为它只是把同样的依赖解包耗时转移到首次启动，并且失去普通安装和快捷方式行为。
- **只把 Portable 超时当成测试失败**：否决，因为超时正是本次比较要测量的用户可感知启动成本。

## 结果

两个生成物使用独立名称：`Leio-Harness-Setup-1.0.0-x64.exe` 和 `Leio-Harness-Portable-1.0.0-x64.exe`。后续要让 Portable 具备实际优势，必须先减少物理文件数量或把运行时代码打成 bundle。
