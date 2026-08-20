# Leio Harness

[English](README.md) | 中文

Leio Harness 是基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 改造的 Windows 桌面 AI 工作台。本仓库包含 Leio 产品名称、`@leio-ai/leio-*` 包名、Electron 桌面壳、Web UI、更新器，以及在源项目之上长期维护的项目差异。

## 下载 Windows 应用

当前经过测试的版本是 [Leio Harness 1.0.2](https://github.com/leizi-dev/leio-harness/releases/tag/v1.0.2)。

下载 [Windows x64 安装包](https://github.com/leizi-dev/leio-harness/releases/download/v1.0.2/Leio-Harness-Setup-1.0.2-x64.exe)，运行安装程序，然后从桌面或开始菜单启动 **Leio Harness**。安装包使用优先缩短安装时间的 `store` 压缩模式；安装包体积会大于高压缩版本，但安装时不需要承担对应的固实解压成本。

应用程序不包含 API key。请在应用设置或支持的环境变量中配置所需的大模型提供方。不要把 key 提交到仓库，也不要放入发行包。

## 运行

### 从源码运行

环境要求：Node.js `^22.19.0 || >=24.0.0` 和 pnpm `11.7.0`。

在仓库根目录运行：

```sh
pnpm install
pnpm run desktop:start
```

构建 Windows 安装包：

```sh
pnpm run desktop:dist
```

安装包会写入 `apps/desktop/dist/`。桌面构建使用圆形透明的磊图标，应用程序、安装包、快捷方式和应用界面使用同一套图标资源。

## 更新

桌面应用从 GitHub 读取带签名的更新清单，并提供自动更新和手动更新入口。发行文件发布在 [GitHub Releases 页面](https://github.com/leizi-dev/leio-harness/releases)。

`v1.0.2` 发行版是经过测试、用于手动安装的完整安装包。现有安装的签名更新清单仍保持引导版本，直到单独生成、签名并完成冒烟测试的小型更新包可用；完整安装包不会被伪装成差分热更新包。

## 项目文档

- [开发指南](docs/development.md)
- [架构说明](docs/architecture.md)
- [Leio 与 DeepSeek Harness 的差异](docs/leio-vs-upstream.md)
- [桌面发布与更新流程](updates/README.md)

## 许可证

[MIT](LICENSE)

第三方依赖及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
