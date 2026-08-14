# Leio Harness Desktop

[English](README.md) | 中文

本应用在 Electron 窗口中封装本地 Leio Harness Web profile，并生成 Windows NSIS 安装包。应用在 Electron 主进程中使用操作系统分配的 loopback 端口启动 Harness，并在 Electron 退出前释放完整 Cordis tree。

## 构建安装包

在仓库根目录运行：

```sh
pnpm run desktop:dist
```

该命令先构建工作区和 Web frontend，再将安装包写入 `apps/desktop/dist/`。安装包面向 Windows x64、按当前用户安装，并创建开始菜单和桌面快捷方式。

## 从源码运行

在仓库根目录运行：

```sh
pnpm run desktop:start
```

桌面 shell 与 `pnpm dsh web` 使用相同的 Harness home、profile、设置、凭据、会话和工作区数据。模型请求仍需要通过现有设置或环境变量配置 provider 凭据；应用包不会嵌入凭据。

## 安全与生命周期

BrowserWindow 禁用 Node integration，启用 context isolation 和 renderer sandbox，并使用系统浏览器打开非本地 HTTP 链接。同一时间只运行一个桌面实例。关闭应用时会先请求 Harness 现有的有界关闭流程，再退出 Electron。
