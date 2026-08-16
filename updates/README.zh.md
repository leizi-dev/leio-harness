# 桌面更新通道

[English](README.md) | 中文

打包后的桌面应用从仓库 `main` 分支读取 `stable.json`，并在接受更新下载前验证对应的 Ed25519 独立签名 `stable.json.sig`。下载完成后还会校验清单声明的文件大小和 SHA-256 摘要。

## 发布版本

1. 使用 `pnpm run desktop:dist` 构建以安装速度优先的 Windows NSIS 安装包并完成冒烟测试。
2. 从上一版本的已安装目录生成差分补丁，只把发生变化的已安装文件放入补丁。文字修改应生成 KB 级补丁，接近完整安装包大小说明选错了发布物。
3. 把差分补丁应用到上一版本的全新安装目录并完成启动冒烟测试。
4. 把差分补丁文件名、字节数和小写 SHA-256 摘要写入 `stable.json`。
3. 使用仓库外保存的私钥为精确的 JSON 文件签名：

   ```sh
   node scripts/sign-desktop-update.mjs --manifest updates/stable.json --key E:/soft/leio-harness-update-signing/private-key.pem
   ```

5. 创建或替换 Gitee 的 `v<version>` 发行版，把差分补丁作为热更新附件上传，并把附件的 HTTPS Gitee 直链写入清单的 `asset.url`。完整 NSIS 安装包只用于首次安装，不能作为热更新附件。
6. 确认发行版直链、文件大小和摘要都不再变化后，再把 `stable.json` 和 `stable.json.sig` 提交到仓库。

公钥已经嵌入桌面端源码。不要提交或上传私钥。不要把约 150MB 的安装包放进 Git；二进制来源使用 Gitee 发行版附件。初始的 `1.0.0` 清单没有安装包资源，因为已有的 `1.0.0` 安装是更新器之前构建的；第一个带更新器的版本需要先人工分发一次，并且使用更高版本号。

正式桌面首次安装目标是保持 `store` 压缩的 NSIS 安装包，以最短安装时间为优先；热更新目标是只含变更文件的签名 NSIS 差分补丁。Portable 不进入发布通道，因为它不能安全地替换正在运行的已安装程序。
