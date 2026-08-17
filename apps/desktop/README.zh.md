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

安装包会写入 `apps/desktop/dist/`。安装包使用 `store` 压缩以优先缩短安装时间，创建桌面和开始菜单快捷方式，并将应用资源放入 ASAR，必要的原生和运行时依赖保持解包。

可执行文件、安装包、快捷方式和应用界面使用 `apps/desktop/build/icon.png` 中的圆形透明磊图标。

## 更新

打包后的应用会在启动后读取带签名的 GitHub 更新清单。通用设置页提供手动检查、下载和重启安装入口。GitHub 的 `v1.0.1` 发行版当前提供经过测试的完整安装包，用于手动安装。小型更新包必须先生成、签名、应用到上一版本的全新安装目录并完成冒烟测试，才能加入自动更新清单。

## 配置

请通过应用设置或支持的环境变量配置大模型提供方凭据。应用包不会嵌入凭据。
