# 中文版上游同步与 Windows 构建

## 分支与 remote

```text
upstream/main
    ↓ fast-forward
main
    ↓ merge
zh-i18n
```

- `upstream`：官方 `https://github.com/minghinmatthewlam/pi-gui.git`。
- `origin`：用户自己的 Fork（如果存在）；脚本不会创建 Fork 或修改 `origin`。
- `main`：官方同步分支，只接受从 `upstream/main` fast-forward。
- `zh-i18n`：简体中文版长期维护和发行分支。

## 日常更新

```powershell
git switch zh-i18n
.\scripts\update-upstream.ps1
```

也可以执行 `pnpm sync:upstream`。默认流程依次检查工作区、获取 upstream、fast-forward
本地 main、合并 main 到 zh-i18n、执行 `pnpm install`、`pnpm check`、
`pnpm package:win:dir` 和 `pnpm package:win`。成品位于现有 Electron Builder 配置指定的
`apps/desktop/release`。

参数：

- `-SkipPackage`：同步、安装并检查，但跳过 Windows 打包。
- `-DirectoryOnly`：同步、安装并检查，只生成 `win-unpacked`，不生成安装器和 portable exe。
- `-Continue`：冲突已人工解决并提交后，跳过 fetch/merge，从安装、检查和打包继续。

脚本不执行 reset、stash、commit 或 push。工作区不干净、upstream 地址异常、main 无法
fast-forward、检查失败时会退出非零；检查失败后不会继续打包。

## 手动同步

```powershell
git switch main
git fetch upstream
git merge --ff-only upstream/main
git switch zh-i18n
git merge main
pnpm install
pnpm check
pnpm package:win:dir
pnpm package:win
```

## 发生冲突

脚本会保留 Git 冲突状态并列出冲突文件，不会自动选择 ours/theirs。先查看并解决：

```powershell
git status
# 编辑所有 both modified 文件
git add <files>
git commit
.\scripts\update-upstream.ps1 -Continue
```

`-Continue` 要求当前仍在 `zh-i18n`、不存在未解决冲突且工作区干净，随后会自动完成剩余
安装、检查和打包步骤。
