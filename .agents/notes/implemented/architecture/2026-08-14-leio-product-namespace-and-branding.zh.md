# Agent Note: Leio 产品命名空间与应用品牌

Status: implemented

English | 中文

## Problem

已作为 Leio Harness 开发的 checkout 仍暴露旧产品命名空间和应用字标。

## Decision

工作区包使用 `@leio-ai/leio-*` 作用域，根项目名称为 `leio-harness`。Web 和桌面应用显示 `Leio Harness`，所有应用图标都使用最新的 Leio 圆形透明图片：Web 图标、浏览器 favicon、PWA manifest、Electron 窗口、Windows 可执行文件、安装程序和快捷方式统一使用同一张完整圆形透明图。DeepSeek provider 名称、模型标识符、API endpoint 以及 `DEEPSEEK_*` 凭据设置仍属于 provider，不因本次产品品牌修改而重命名。

## Alternatives considered

- **保留旧包作用域并增加 Leio 别名**：这会保留两套公共词汇，并在首个 tagged release 前没有外部消费者的情况下引入不必要的兼容行为。
- **只替换可见字符串**：这会使包元数据和工作区 import 与产品名称不一致。
- **只把新图片用作 favicon**：这会让应用主要界面和安装后的应用图标不一致。

## Consequences

- 所有非 vendored、非 archived 的工作区引用都使用 Leio 包作用域，因此消费者必须使用新名称。
- Web 应用加载 `apps/web/public/leio-icon.png`，桌面 builder 加载 `apps/desktop/build/icon.png`；两者使用同一圆形 alpha 蒙版，SVG favicon wrapper 也嵌入同一张 PNG 图片。
- DeepSeek 仍是明确的 provider 身份，因此现有 key 和 endpoint 配置继续准确描述其连接的服务。
- Vendored 源码和 archived 历史记录保留原名称，作为上游或历史材料。
