# 中文版发布

## 版本规则

官方 package 版本保持原值，例如 `0.1.0-beta.39`。中文版使用
`<官方版本>-cn.<补丁号>`，例如 `0.1.0-beta.39-cn.1`；对应 tag 为
`v0.1.0-beta.39-cn.1`。同一官方版本下每次中文版修订递增补丁号。

Windows 下载文件分别是 `pi-gui-0.1.0-beta.39-cn.1-x64-setup.exe` 和
`pi-gui-0.1.0-beta.39-cn.1-x64-portable.exe`。发布时通过打包元数据设置
中文版版本，不修改官方 package version。

## 分支与 Remote

`upstream` 指向官方仓库，`main` 只跟踪 `upstream/main`；`zh-i18n` 维护
国际化、简体中文、Windows 构建与同步脚本。`origin` 应指向中文版 Fork。
Fork 建立前，如果 `origin` 仍指向官方仓库，先不要推送。

## 发布流程

1. 在 `zh-i18n` 分支运行 `./scripts/update-upstream.ps1`，获取官方更新、
   快进 `main` 并合并到中文版。解决任何合并冲突后继续脚本。
2. 提交同步带来的变更，确认工作区干净。
3. 运行 `./scripts/release.ps1 0.1.0-beta.39-cn.1`。脚本检查分支和版本，
   执行 `pnpm check`、Windows 打包、产物校验，然后只在本地创建 tag。
4. 检查 `git status` 和 `apps/desktop/release` 中的安装包。确认 `origin`
   指向自己的 Fork，再推送 `zh-i18n` 与 tag：

   ```powershell
   git push origin zh-i18n
   git push origin v0.1.0-beta.39-cn.1
   ```

5. `build-windows.yml` 在 Fork 上收到 `v*-cn.*` tag 后，安装依赖、检查、
   构建 Windows 包并上传到 GitHub Release。官方多平台 `release.yml` 不处理
   中文版 tag。

## 用户下载方式

- `*-setup.exe`：Windows 安装程序，适合常规安装。
- `*-portable.exe`：免安装版本，适合直接运行；它不会自动变成安装版。

只下载一个符合自己用途的 exe 即可。`win-unpacked` 是构建目录，不作为
Release 下载文件上传。
