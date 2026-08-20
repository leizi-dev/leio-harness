# Leio Harness Desktop

[English](README.md) | 中文

桌面应用在 Electron 窗口中运行本地 Leio Harness Web profile，并生成 Windows x64 NSIS 安装包。Electron 主进程会使用操作系统分配的 loopback 端口启动本地 Harness，并在应用关闭时释放它。

## 构建

在仓库根目录运行：

```sh
pnpm run desktop:start
```

该命令先构建库和 Web 前端，再启动桌面壳。构建 Windows 安装包：

```sh
pnpm run desktop:dist
```

安装包会写入 `apps/desktop/dist/`。安装包使用 `store` 压缩以优先缩短安装时间，并创建桌面和开始菜单快捷方式。Electron 自带 Node 运行时，使用者无需另行安装 Node.js。

首次启动时，桌面壳会显示进度窗口，优先从对应的 GitHub Release 下载带版本的 Leio 依赖运行时，校验 SHA-256 后保存到应用用户数据目录。GitHub 不可用时，会通过国内 OSS 跳转入口重试同一份不可变 ZIP。之后每次启动都会校验并复用本地运行时，不会重复下载。因此首次启动需要网络连接；安装过程本身仍保持快速且可离线完成。

可执行文件、安装包、快捷方式和应用界面使用 `apps/desktop/build/icon.png` 中的圆形透明磊图标。

## 更新

打包后的应用会在启动后读取带签名的 GitHub 更新清单。通用设置页提供手动检查、下载和重启安装入口。每个完整安装包发行版都必须附带匹配的不可变运行时 ZIP 文件。小型更新包必须先生成、签名、应用到上一版本的全新安装目录并完成冒烟测试，才能加入自动更新清单。

## 配置

请通过应用设置或支持的环境变量配置大模型提供方凭据。应用包不会嵌入凭据。
