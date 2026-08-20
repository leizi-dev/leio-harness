# 桌面更新通道

[English](README.md) | 中文

打包后的桌面应用从 [leizi-dev/leio-harness](https://github.com/leizi-dev/leio-harness) 的 `main` 分支读取 `stable.json` 和 `stable.json.sig`。应用在接受更新前验证 Ed25519 独立签名，下载后再校验更新文件的大小和 SHA-256 摘要。

## 当前发行版

[Leio Harness 1.0.2](https://github.com/leizi-dev/leio-harness/releases/tag/v1.0.2) 是经过测试的 Windows x64 完整安装包，用于手动安装，不作为差分热更新包使用。

在生成并签名小型更新包之前，引导清单仍保持 `1.0.0`。这样可以避免把完整安装包当作热更新下载，保留安装时间和更新体积要求。

## 后续热更新要求

1. 生成只包含已安装目录中变更文件的更新包，且体积必须明显小于完整安装包。
2. 将更新包应用到上一版本的全新安装目录，验证程序启动、插件加载和本次修改的功能。
3. 将更新包文件名、字节数、小写 SHA-256 摘要和 GitHub 发行版 HTTPS 直链写入 `stable.json`。
4. 使用仓库外保存的私钥为精确的 `stable.json` 文件签名：

   ```sh
   node scripts/sign-desktop-update.mjs --manifest updates/stable.json --key E:/soft/leio-harness-update-signing/private-key.pem
   ```

5. 把带签名的更新包上传到对应 GitHub 发行版，提交 `stable.json` 和 `stable.json.sig`，并通过公开 raw 地址验证两个文件。

不要提交或上传私钥，不要把首次安装的完整安装包放入 Git，也不要把完整安装包写入热更新清单。正式桌面发行目标是 NSIS 安装包，Portable 不属于更新通道。
