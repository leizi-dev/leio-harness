# Agent Note: 将完整桌面运行时缓存到 ASAR 之外

Status: implemented

[English](2026-08-19-desktop-runtime-cache.md) | 中文

## 问题

桌面安装包可能遗漏打包依赖树中的间接包。全新安装在 Cordis 启动阶段会解析 `js-yaml` 或旧的内部包名失败。开发环境和已有本机安装会通过工作区依赖和缓存的 profile 链接掩盖这类遗漏。

## 决策

`apps/desktop/src/main.mjs` 会在导入任何 Leio 包之前启动依赖准备窗口。`RuntimeBootstrapper` 按 `apps/desktop/src/runtime/manifest.mjs` 指定的顺序尝试不可变运行时来源：先请求 GitHub Release，只有 GitHub 请求失败或 15 秒内未获得初始响应后才使用国内 OSS 跳转入口。国内来源使用固定 URL，并发送 `X-Leio-Harness-Runtime-Version`，使服务端选择与安装包清单匹配的 ZIP，而无需修改接口地址。响应超时会在 ZIP 流开始前清除，因此正常但较慢的下载不会被取消。它校验下载 ZIP 的字节数和 SHA-256，在 Electron 用户数据目录解压到临时目录，校验 `@leio-ai/leio`，写入版本和哈希标记，然后原子地提升为缓存。`@leio-ai/leio-app-boot` 和 `@leio-ai/leio/profile-boot` 只从该已验证缓存导入。

Electron 仍然提供内置 Node 运行时。NSIS 安装包使用 `store` 压缩，仅包含轻量桌面壳而不复制依赖闭包，因此安装时间不受运行时下载和解压影响。之后每次启动会校验标记并复用缓存，不再发起网络请求。

运行时发行 ZIP 由使用扁平 node linker 的生产 `pnpm deploy` 生成。其 `node_modules` 树是实体目录而不是 pnpm 链接，因为 Windows `tar.exe` 解压 ZIP 后必须能在无法重建原始链接的电脑上使用。该运行时 ZIP 是不可变的配套文件，不是差分热更新补丁。

## 备选方案

**继续把全部依赖留在 `app.asar` 或 `app.asar.unpacked`。** 不予采用：此前的包包含规则和 ASAR 映射已经使安装后的依赖图不同于开发环境，每次遗漏都需要重新完整打包。

**归档普通 pnpm 虚拟存储树。** 不予采用：其链接在目标机器上会被解压为不可用的 Windows 链接。包即使存在于归档中，Node 仍然可能无法解析它。

**启动时用 npm 逐个下载包。** 不予采用：这要求每台用户设备都有注册表访问、包管理器行为和依赖解析。一份带版本、带哈希校验的完整闭包能提供确定的启动内容。

## 影响

首次启动需要访问匹配的 GitHub Release 运行时文件或其国内回退来源，耗时可能长于之后的启动。完整发行版现在有两个必需二进制附件：快速安装的 NSIS 安装包及其精确对应的运行时 ZIP。已公布的安装包 URL 是指向配置中最新安装包的永久别名；运行时接口独立存在，不是面向用户的下载 URL。发布验证必须证明全新的首次运行时安装和离线缓存复用，然后以隔离用户数据目录运行已安装桌面程序的冒烟测试。

## 测试

`apps/desktop/tests/runtime-bootstrap.spec.ts` 覆盖下载、校验和验证、解压、标记创建以及不发生第二次请求的缓存命中。发行 ZIP 会单独解压到全新目录，并导入 `@leio-ai/leio-app-boot`、`@leio-ai/leio/profile-boot` 和 `js-yaml`。已安装的 v1.0.3 冒烟测试从 `E:\soft` 下全新安装目录和隔离用户数据启动，返回 HTTP 200，发布所需客户端启动条目，窗口标题为 `Leio Harness`，并在正常关闭后退出。
