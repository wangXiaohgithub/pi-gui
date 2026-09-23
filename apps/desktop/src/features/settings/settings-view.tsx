import type {
  RuntimeSettingsSnapshot,
  RuntimeSnapshot,
} from "@pi-gui/session-driver/runtime-types";
import type {
  ModelSettingsScopeMode,
  NotificationPreferences,
  ThemePresetId,
  WorkspaceRecord,
} from "../../../contracts/desktop-state";
import type {
  CustomProviderConfig,
  DesktopNotificationPermissionStatus,
} from "../../../contracts/ipc";
import { SettingsAppearanceSection } from "./settings-appearance-section";
import { SettingsGeneralSection } from "./settings-general-section";
import { SettingsModelsSection } from "./settings-models-section";
import { SettingsNotificationsSection } from "./settings-notifications-section";
import { SettingsProvidersSection } from "./settings-providers-section";
import { type SettingsSection, sectionTitle, sectionDescription } from "./settings-utils";
import type { AppLanguage } from "../../i18n/locale";
import { useTranslation } from "react-i18next";

export type { SettingsSection } from "./settings-utils";

interface SettingsViewProps {
  readonly workspace?: WorkspaceRecord;
  readonly runtime?: RuntimeSnapshot;
  readonly section: SettingsSection;
  readonly notificationPreferences: NotificationPreferences;
  readonly notificationPermissionStatus: DesktopNotificationPermissionStatus;
  readonly notificationPermissionPending: boolean;
  readonly modelSettingsScopeMode: ModelSettingsScopeMode;
  readonly integratedTerminalShell: string;
  readonly themeMode: "system" | "light" | "dark";
  readonly themePresetId: ThemePresetId;
  readonly language: AppLanguage;
  readonly enableTransparency: boolean;
  readonly onSetModelSettingsScopeMode: (mode: ModelSettingsScopeMode) => void;
  readonly onSetDefaultModel: (provider: string, modelId: string) => void;
  readonly onSetThinkingLevel: (
    thinkingLevel: RuntimeSettingsSnapshot["defaultThinkingLevel"],
  ) => void;
  readonly onToggleSkillCommands: (enabled: boolean) => void;
  readonly onSetScopedModelPatterns: (patterns: readonly string[]) => void;
  readonly onLoginProvider: (providerId: string) => void;
  readonly onLogoutProvider: (providerId: string) => void;
  readonly onSetProviderApiKey: (providerId: string, apiKey: string) => Promise<string | undefined>;
  readonly onRemoveProviderApiKey: (providerId: string) => Promise<string | undefined>;
  readonly onSaveCustomProvider: (config: CustomProviderConfig) => Promise<string | undefined>;
  readonly onDeleteCustomProvider: (providerId: string) => Promise<string | undefined>;
  readonly onSetNotificationPreferences: (preferences: Partial<NotificationPreferences>) => void;
  readonly onSetIntegratedTerminalShell: (shellPath: string) => void;
  readonly onRequestNotificationPermission: () => void;
  readonly onOpenSystemNotificationSettings: () => void;
  readonly onSetThemeMode: (mode: "system" | "light" | "dark") => void;
  readonly onSetThemePresetId: (presetId: ThemePresetId) => void;
  readonly onSetLanguage: (language: AppLanguage) => void;
  readonly onSetEnableTransparency: (enabled: boolean) => void;
}

export function SettingsView({
  workspace,
  runtime,
  section,
  notificationPreferences,
  notificationPermissionStatus,
  notificationPermissionPending,
  modelSettingsScopeMode,
  integratedTerminalShell,
  themeMode,
  themePresetId,
  language,
  enableTransparency,
  onSetModelSettingsScopeMode,
  onSetDefaultModel,
  onSetThinkingLevel,
  onToggleSkillCommands,
  onSetScopedModelPatterns,
  onLoginProvider,
  onLogoutProvider,
  onSetProviderApiKey,
  onRemoveProviderApiKey,
  onSaveCustomProvider,
  onDeleteCustomProvider,
  onSetNotificationPreferences,
  onSetIntegratedTerminalShell,
  onRequestNotificationPermission,
  onOpenSystemNotificationSettings,
  onSetThemeMode,
  onSetThemePresetId,
  onSetLanguage,
  onSetEnableTransparency,
}: SettingsViewProps) {
  const { t } = useTranslation();
  if (
    !workspace &&
    section !== "general" &&
    section !== "notifications" &&
    section !== "appearance"
  ) {
    return (
      <section className="canvas canvas--empty">
        <div className="empty-panel">
          <div className="session-header__eyebrow">{t("navigation.settings")}</div>
          <h1>{t("settings.selectWorkspace.title")}</h1>
          <p>{t("settings.selectWorkspace.body")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="canvas">
      <div className="conversation settings-view">
        <header className="view-header">
          <div>
            <h1 className="view-header__title">{sectionTitle(section, t)}</h1>
            <p className="view-header__body">
              {sectionDescription(section, workspace?.name ?? t("navigation.workspace"), t)}
            </p>
          </div>
        </header>

        <div className="settings-grid">
          {section === "appearance" ? (
            <SettingsAppearanceSection
              themeMode={themeMode}
              themePresetId={themePresetId}
              onSetThemeMode={onSetThemeMode}
              onSetThemePresetId={onSetThemePresetId}
              enableTransparency={enableTransparency}
              onSetEnableTransparency={onSetEnableTransparency}
            />
          ) : null}

          {section === "general" ? (
            <SettingsGeneralSection
              runtime={runtime}
              modelSettingsScopeMode={modelSettingsScopeMode}
              integratedTerminalShell={integratedTerminalShell}
              onSetModelSettingsScopeMode={onSetModelSettingsScopeMode}
              onSetIntegratedTerminalShell={onSetIntegratedTerminalShell}
              onToggleSkillCommands={onToggleSkillCommands}
              language={language}
              onSetLanguage={onSetLanguage}
            />
          ) : null}

          {section === "providers" ? (
            <SettingsProvidersSection
              runtime={runtime}
              onLoginProvider={onLoginProvider}
              onLogoutProvider={onLogoutProvider}
              onSetProviderApiKey={onSetProviderApiKey}
              onRemoveProviderApiKey={onRemoveProviderApiKey}
              onSaveCustomProvider={onSaveCustomProvider}
              onDeleteCustomProvider={onDeleteCustomProvider}
            />
          ) : null}

          {section === "models" ? (
            <SettingsModelsSection
              runtime={runtime}
              onSetDefaultModel={onSetDefaultModel}
              onSetScopedModelPatterns={onSetScopedModelPatterns}
              onSetThinkingLevel={onSetThinkingLevel}
            />
          ) : null}

          {section === "notifications" ? (
            <SettingsNotificationsSection
              notificationPreferences={notificationPreferences}
              notificationPermissionStatus={notificationPermissionStatus}
              notificationPermissionPending={notificationPermissionPending}
              onSetNotificationPreferences={onSetNotificationPreferences}
              onRequestNotificationPermission={onRequestNotificationPermission}
              onOpenSystemNotificationSettings={onOpenSystemNotificationSettings}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
