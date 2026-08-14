# Agent Note: Electron 桌面应用

Status: implemented

[English](2026-08-14-electron-desktop-application.md) | 中文

## 问题

浏览器应用需要单独启动本地 Harness 进程，并且不提供 Windows 可执行文件或安装包。

## 决策

`apps/desktop` 是基于已发布 Web profile 的 Electron shell。Electron 主进程使用 loopback host 和端口 `0` 调用 CLI package 导出的 `runProfile` API，从 `webServer` 读取实际绑定端口，再使用启用 sandbox 的 BrowserWindow 加载该 origin。桌面进程在 Electron 退出前请求 Harness 现有的有界关闭流程。

Windows artifact 是由 electron-builder 构建的 x64 NSIS 安装包。打包后的应用禁用 ASAR，因为 profile patch、package manifest、native module 和 worker 入口文件会在运行时按文件系统路径解析。安装包是单一分发文件；安装后的应用保留其运行时文件。

## 曾考虑的替代方案

- **直接通过 `file:` 加载 Web frontend**：frontend 需要 Web profile 提供 host API、生成的 boot manifest、静态路由和会话服务。
- **以子进程启动 CLI**：Windows 无法向 Node 子进程传递 POSIX `SIGTERM`，因此普通窗口关闭会绕过 Harness 的有界释放流程。
- **将所有运行时文件放入 ASAR**：按路径加载的 worker、native module、profile patch 和 package manifest 需要普通文件系统路径，否则需要持续扩充 unpack 例外列表。
- **要求固定本地端口**：其他服务可能已经占用该端口；由操作系统分配端口可避免此启动失败，同时确保服务只监听 loopback。

## 后果

- 桌面应用与 CLI 共享相同的 Harness home、设置、凭据、会话、profile 和工作区。
- Renderer 不能使用 Node integration，并启用 context isolation 和 sandbox；非本地 HTTP 链接交给系统浏览器打开。
- 同一时间只运行一个桌面实例。
- 安装包包含 Electron 和完整 production dependency closure，因此大于 Web frontend。
- Windows 代码签名仍属于 release 工作；未签名的本地安装包可能触发 SmartScreen 警告。
