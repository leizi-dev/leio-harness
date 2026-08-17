# Leio Harness Desktop

[English](README.md) | 中文

本应用在 Electron 窗口中封装本地 Leio Harness Web profile，并生成 Windows NSIS 安装包。应用在 Electron 主进程中使用操作系统分配的 loopback 端口启动 Harness，并在 Electron 退出前释放完整 Cordis tree。

## 构建安装包

在仓库根目录运行：

```sh
pnpm run desktop:dist
```

该命令先构建工作区和 Web frontend，再将安装包写入 `apps/desktop/dist/`。安装包面向 Windows x64、按当前用户安装，并创建开始菜单和桌面快捷方式；应用资源使用 ASAR 归档，解包产品、供应商运行时依赖和原生运行时依赖，其余依赖保留在 ASAR 中，避免作为大量独立文件复制。

NSIS 压缩级别使用 `store`：安装包会更大，但安装时不需要承担最高级别固实压缩的解压成本，是本项目优先缩短安装时间的方案。

Windows 应用图标、安装程序图标、快捷方式图标和 Web 应用图标统一使用同一张完整圆形透明图片，因此可执行文件和安装后的程序不会保留方形图片边角。

## 桌面更新

打包版本在启动十秒后检查带签名的 GitHub 更新清单，通用设置页也提供手动检查、下载和重启安装流程。更新只接受 NSIS 安装包；主进程会在启动替换安装程序前校验清单签名、安装包大小和 SHA-256 摘要。更新通道和签名流程见 [`updates/README.md`](../../updates/README.md)。

## 从源码运行

在仓库根目录运行：

```sh
pnpm run desktop:start
```

桌面 shell 与 `pnpm dsh web` 使用相同的 Harness home、profile、设置、凭据、会话和工作区数据。模型请求仍需要通过现有设置或环境变量配置 provider 凭据；应用包不会嵌入凭据。

## 安全与生命周期

BrowserWindow 禁用 Node integration，启用 context isolation 和 renderer sandbox，并使用系统浏览器打开非本地 HTTP 链接。同一时间只运行一个桌面实例。关闭应用时会先请求 Harness 现有的有界关闭流程，再退出 Electron。
