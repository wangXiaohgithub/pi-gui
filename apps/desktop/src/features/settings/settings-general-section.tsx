import { useEffect, useState } from "react";
import type { RuntimeSnapshot } from "@pi-gui/session-driver/runtime-types";
import type { ModelSettingsScopeMode } from "../../../contracts/desktop-state";
import { SettingsGroup, SettingsInfoRow, SettingsRow } from "./settings-utils";
import type { AppLanguage } from "../../i18n/locale";
import { useTranslation } from "react-i18next";

interface SettingsGeneralSectionProps {
  readonly runtime?: RuntimeSnapshot;
  readonly modelSettingsScopeMode: ModelSettingsScopeMode;
  readonly integratedTerminalShell: string;
  readonly onSetModelSettingsScopeMode: (mode: ModelSettingsScopeMode) => void;
  readonly onSetIntegratedTerminalShell: (shellPath: string) => void;
  readonly onToggleSkillCommands: (enabled: boolean) => void;
  readonly language: AppLanguage;
  readonly onSetLanguage: (language: AppLanguage) => void;
}

export function SettingsGeneralSection({
  runtime,
  modelSettingsScopeMode,
  integratedTerminalShell,
  onSetModelSettingsScopeMode,
  onSetIntegratedTerminalShell,
  onToggleSkillCommands,
  language,
  onSetLanguage,
}: SettingsGeneralSectionProps) {
  const { t } = useTranslation();
  const connectedCount = runtime?.providers.filter((p) => p.hasAuth).length ?? 0;
  const [terminalShellDraft, setTerminalShellDraft] = useState(integratedTerminalShell);

  useEffect(() => {
    setTerminalShellDraft(integratedTerminalShell);
  }, [integratedTerminalShell]);

  const commitTerminalShellDraft = () => {
    if (terminalShellDraft !== integratedTerminalShell) {
      onSetIntegratedTerminalShell(terminalShellDraft);
    }
  };

  return (
    <>
      <SettingsGroup title={t("settings.general.title")}>
        <SettingsInfoRow
          label={t("settings.general.connectedProviders")}
          value={connectedCount > 0 ? String(connectedCount) : t("common.none")}
        />
        <SettingsInfoRow
          label={t("settings.general.discoveredSkills")}
          value={String(runtime?.skills.length ?? 0)}
        />
        <SettingsRow
          title={t("settings.language.title")}
          description={t("settings.language.description")}
        >
          <select
            aria-label={t("settings.language.title")}
            className="settings-select"
            value={language}
            onChange={(event) => onSetLanguage(event.target.value as AppLanguage)}
          >
            <option value="en">{t("settings.language.english")}</option>
            <option value="zh-CN">{t("settings.language.simplifiedChinese")}</option>
          </select>
        </SettingsRow>
        <SettingsRow
          title={t("settings.general.modelScope")}
          description={t("settings.general.modelScopeDescription")}
        >
          <div className="settings-pill-row">
            <button
              className={`settings-pill${modelSettingsScopeMode === "app-global" ? " settings-pill--active" : ""}`}
              type="button"
              aria-pressed={modelSettingsScopeMode === "app-global"}
              onClick={() => onSetModelSettingsScopeMode("app-global")}
            >
              {t("settings.general.modelScopeApp")}
            </button>
            <button
              className={`settings-pill${modelSettingsScopeMode === "per-repo" ? " settings-pill--active" : ""}`}
              type="button"
              aria-pressed={modelSettingsScopeMode === "per-repo"}
              onClick={() => onSetModelSettingsScopeMode("per-repo")}
            >
              {t("settings.general.modelScopeRepo")}
            </button>
          </div>
        </SettingsRow>
        <SettingsRow
          title={t("settings.general.enableSkillCommands")}
          description={t("settings.general.enableSkillCommandsDescription")}
        >
          <input
            aria-label={t("settings.general.enableSkillCommands")}
            checked={runtime?.settings.enableSkillCommands ?? true}
            type="checkbox"
            onChange={(event) => onToggleSkillCommands(event.target.checked)}
          />
        </SettingsRow>
        <SettingsRow
          title={t("settings.general.shell")}
          description={t("settings.general.shellDescription")}
        >
          <input
            aria-label={t("settings.general.shell")}
            className="settings-text-input"
            placeholder="/bin/zsh"
            spellCheck={false}
            type="text"
            value={terminalShellDraft}
            onBlur={commitTerminalShellDraft}
            onChange={(event) => setTerminalShellDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title={t("settings.shortcuts.title")}>
        <SettingsInfoRow label={t("settings.shortcuts.newThread")} value="Cmd+Shift+O" />
        <SettingsInfoRow label={t("settings.shortcuts.recentThreads")} value="Cmd+1…9" />
        <SettingsInfoRow label={t("settings.shortcuts.openSettings")} value="Cmd+," />
        <SettingsInfoRow label={t("settings.shortcuts.toggleTerminal")} value="Cmd+J" />
        <SettingsInfoRow label={t("settings.shortcuts.newTerminal")} value="Cmd+T" />
        <SettingsInfoRow label={t("settings.shortcuts.sendMessage")} value="Enter" />
        <SettingsInfoRow label={t("settings.shortcuts.newLine")} value="Shift+Enter" />
      </SettingsGroup>
    </>
  );
}
