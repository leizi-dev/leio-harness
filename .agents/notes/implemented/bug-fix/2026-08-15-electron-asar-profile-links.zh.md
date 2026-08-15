# Agent Note: 通过解包依赖解析 Electron ASAR profile 链接

Status: implemented

[English](2026-08-15-electron-asar-profile-links.md) | 中文

## 问题

Windows 打包应用可以显示 Electron 窗口，但 web profile 没有激活客户端服务。profile 回退目录中的 Junction 指向虚拟的 `app.asar` 路径，同时部分传递依赖没有出现在对应的解包路径中。

## 决策

保留自包含的 ASAR NSIS 安装包，使用直接和嵌套两种 `node_modules` 匹配规则解包全部依赖层，并让 profile 回退解析在发现 `.asar` 包目录时改用对应的 `.asar.unpacked` 实体目录。该映射同时作用于应用链接和依赖链接。profile 测试会同时构造这两类目录，并验证链接指向实体解包副本。

## 曾考虑的替代方案

- **继续将链接指向 `app.asar`**：Electron 内部可以读取归档，但 Windows Junction 和相对于 profile 的 ESM 解析不能可靠使用虚拟路径。
- **只解包第一个失败的依赖**：这会把每次新的传递依赖导入失败都变成新的发行缺陷，也无法形成稳定的打包规则。
- **关闭 ASAR**：可以避开虚拟路径，但会放弃当前归档布局，同时仍需要安装并验证完整依赖树。

## 后果

- 安装包仍是一个自包含的 NSIS 执行文件，由安装器同时交付 `app.asar` 和 `app.asar.unpacked`。
- 安装后的程序包含更大的实体运行时目录，安装时间可能比仅归档方案长，但在全新的 Windows 安装目录中可以正确解析依赖。
- 发行验证必须将准确的 NSIS 安装包安装到 `E:\soft` 下的新目录；源码启动和 `win-unpacked` 启动都不足以作为交付证据。
- Web 冒烟测试必须检查 HTTP 200、非空启动清单、清单中包含 `@leio-ai/leio-client-modules` 与 `@leio-ai/leio-client-ui-layout`、不包含 `Failed to load plugins`、窗口标题为 `Leio Harness`，并且能正常关闭。
