import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import {
  desktopShortcut,
  getDesktopState,
  launchDesktop,
  makeUserDataDir,
  makeWorkspace,
  waitForWorkspaceByPath,
} from "../helpers/electron-app";

test("switches the interface language immediately and restores it after restart", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("i18n-language-persistence");
  let harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);
    await expect.poll(async () => (await getDesktopState(window)).language).toBe("en");

    await window.keyboard.press(desktopShortcut(","));
    await expect(window.getByTestId("settings-surface")).toBeVisible();
    await window.getByRole("button", { name: "General", exact: true }).click();
    await window.getByLabel("Language").selectOption("zh-CN");

    await expect(window.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(window.getByRole("button", { name: "常规", exact: true })).toBeVisible();
    await expect(window.getByLabel("语言")).toHaveValue("zh-CN");
    await expect.poll(async () => (await getDesktopState(window)).language).toBe("zh-CN");
    await expect
      .poll(async () => {
        const persisted = JSON.parse(
          await readFile(join(userDataDir, "ui-state.json"), "utf8"),
        ) as { readonly language?: unknown };
        return persisted.language;
      })
      .toBe("zh-CN");
  } finally {
    await harness.close();
  }

  harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);
    await expect(window.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(window.getByLabel("语言")).toHaveValue("zh-CN");
    await expect.poll(async () => (await getDesktopState(window)).language).toBe("zh-CN");
  } finally {
    await harness.close();
  }
});
