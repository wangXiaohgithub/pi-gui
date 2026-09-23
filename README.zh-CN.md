# Pi-GUI 中文版

基于[官方 pi-gui 项目](https://github.com/minghinmatthewlam/pi-gui)的非官方简体中文发行版。中文版在 `zh-i18n` 分支维护，官方项目与作者仍以原仓库为准。

## 新增功能

- 简体中文界面
- Windows 桌面支持
- i18n 国际化架构
- 通过 `upstream` 同步官方版本
- 中文版 Windows Release

## 安装

1. 打开[中文版 Releases](https://github.com/wangXiaohgithub/pi-gui/releases)。
2. 下载适用于 Windows x64 的 `pi-gui-*-setup.exe`。
3. 运行安装程序，完成安装后启动 pi-gui 中文版。

如需免安装使用，可下载同版本的 `pi-gui-*-portable.exe` 并直接运行。`win-unpacked` 是构建目录，不是下载文件。

## 更新机制

本项目通过 `upstream` 同步官方 pi-gui：官方更新进入 `main`，合并到 `zh-i18n` 后，重新构建中文版 Release。中文版版本使用 `<官方版本>-cn.<修订号>` 格式；发布流程见[中文版发布文档](./docs/release.md)。

## 说明

本发行版不是官方版本。使用中如需查看官方项目文档，请访问[官方 README](https://github.com/minghinmatthewlam/pi-gui#readme)。
