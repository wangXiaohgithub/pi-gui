import type { AppLanguage } from "./locale";

export const nativeCopyEn = {
  agentFinished: "Agent finished responding",
  attachFiles: "Attach files",
  checkForUpdates: "Check for Updates…",
  download: "Download",
  file: "File",
  later: "Later",
  newWindow: "New Window",
  needsInput: "Needs your input",
  ok: "OK",
  openFolder: "Open Folder…",
  openWorkspaceFolder: "Open workspace folder",
  updateAvailable: "Version {{latestVersion}} is available.",
  updateCurrent: "You have {{currentVersion}}.",
  updateFailed: "Could not check for updates right now.",
  updateNotificationBody:
    "Version {{latestVersion}} is available (you have {{currentVersion}}). Click to view the release.",
  updateNotificationTitle: "pi-gui Release Available",
  updateUpToDate: "You're up to date on version {{currentVersion}}.",
} as const;

export const nativeCopyZhCN: Record<keyof typeof nativeCopyEn, string> = {
  agentFinished: "智能体已完成回复",
  attachFiles: "附加文件",
  checkForUpdates: "检查更新…",
  download: "下载",
  file: "文件",
  later: "稍后",
  newWindow: "新建窗口",
  needsInput: "需要你的输入",
  ok: "确定",
  openFolder: "打开文件夹…",
  openWorkspaceFolder: "打开工作区文件夹",
  updateAvailable: "新版本 {{latestVersion}} 已发布。",
  updateCurrent: "当前版本为 {{currentVersion}}。",
  updateFailed: "暂时无法检查更新。",
  updateNotificationBody:
    "新版本 {{latestVersion}} 已发布（当前版本为 {{currentVersion}}）。点击查看发布说明。",
  updateNotificationTitle: "pi-gui 有可用更新",
  updateUpToDate: "当前已是最新版本 {{currentVersion}}。",
};

export type NativeCopyKey = keyof typeof nativeCopyEn;

export function nativeText(
  language: AppLanguage,
  key: NativeCopyKey,
  values: Readonly<Record<string, string>> = {},
): string {
  const source = language === "zh-CN" ? nativeCopyZhCN[key] : nativeCopyEn[key];
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{{${name}}}`, value),
    source,
  );
}
