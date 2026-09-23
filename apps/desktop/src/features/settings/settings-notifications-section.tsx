import type { DesktopNotificationPermissionStatus } from "../../../contracts/ipc";
import type { NotificationPreferences } from "../../../contracts/desktop-state";
import { SettingsGroup, SettingsRow } from "./settings-utils";
import { useTranslation, type UseTranslationResponse } from "react-i18next";

interface SettingsNotificationsSectionProps {
  readonly notificationPreferences: NotificationPreferences;
  readonly notificationPermissionStatus: DesktopNotificationPermissionStatus;
  readonly notificationPermissionPending: boolean;
  readonly onSetNotificationPreferences: (preferences: Partial<NotificationPreferences>) => void;
  readonly onRequestNotificationPermission: () => void;
  readonly onOpenSystemNotificationSettings: () => void;
}

export function SettingsNotificationsSection({
  notificationPreferences,
  notificationPermissionStatus,
  notificationPermissionPending,
  onSetNotificationPreferences,
  onRequestNotificationPermission,
  onOpenSystemNotificationSettings,
}: SettingsNotificationsSectionProps) {
  const { t } = useTranslation();
  const statusLabel = labelForPermissionStatus(notificationPermissionStatus, t);
  const statusDescription = descriptionForPermissionStatus(notificationPermissionStatus, t);
  const showAskMacOs = notificationPermissionStatus === "default";
  const showOpenSystemSettings = notificationPermissionStatus === "denied";
  const showRecoveryActions = showAskMacOs || showOpenSystemSettings;

  return (
    <>
      <SettingsGroup
        title={t("settings.notifications.system")}
        description="macOS decides whether pi-gui can show desktop notifications at all."
      >
        <SettingsRow title={t("settings.notifications.access")} description={statusDescription}>
          <span className="settings-row__value">{statusLabel}</span>
        </SettingsRow>
        {showRecoveryActions ? (
          <SettingsRow
            title={t("settings.notifications.turnOn")}
            description={
              showAskMacOs
                ? "pi-gui asks macOS when active work first moves into the background. You can also ask now."
                : "macOS notifications are already turned off for pi-gui. Open System Settings to enable them again."
            }
          >
            <div className="settings-row__actions">
              {showAskMacOs ? (
                <button
                  className="button button--secondary"
                  disabled={notificationPermissionPending}
                  type="button"
                  onClick={onRequestNotificationPermission}
                >
                  {t("settings.notifications.askSystem")}
                </button>
              ) : null}
              {showOpenSystemSettings ? (
                <button
                  className="button button--secondary"
                  disabled={notificationPermissionPending}
                  type="button"
                  onClick={onOpenSystemNotificationSettings}
                >
                  {t("settings.notifications.openSystemSettings")}
                </button>
              ) : null}
            </div>
          </SettingsRow>
        ) : null}
      </SettingsGroup>

      <SettingsGroup
        title={t("settings.notifications.inApp")}
        description={t("settings.notifications.inAppDescription")}
      >
        <SettingsRow
          title={t("settings.notifications.backgroundCompletion")}
          description={t("settings.notifications.backgroundCompletionDescription")}
        >
          <input
            aria-label={t("settings.notifications.backgroundCompletion")}
            checked={notificationPreferences.backgroundCompletion}
            type="checkbox"
            onChange={(event) =>
              onSetNotificationPreferences({ backgroundCompletion: event.target.checked })
            }
          />
        </SettingsRow>
        <SettingsRow
          title={t("settings.notifications.backgroundFailure")}
          description={t("settings.notifications.backgroundFailureDescription")}
        >
          <input
            aria-label={t("settings.notifications.backgroundFailure")}
            checked={notificationPreferences.backgroundFailure}
            type="checkbox"
            onChange={(event) =>
              onSetNotificationPreferences({ backgroundFailure: event.target.checked })
            }
          />
        </SettingsRow>
        <SettingsRow
          title={t("settings.notifications.attention")}
          description={t("settings.notifications.attentionDescription")}
        >
          <input
            aria-label={t("settings.notifications.attention")}
            checked={notificationPreferences.attentionNeeded}
            type="checkbox"
            onChange={(event) =>
              onSetNotificationPreferences({ attentionNeeded: event.target.checked })
            }
          />
        </SettingsRow>
      </SettingsGroup>
    </>
  );
}

type Translate = UseTranslationResponse<"translation", undefined>["t"];

function labelForPermissionStatus(
  status: DesktopNotificationPermissionStatus,
  t: Translate,
): string {
  switch (status) {
    case "granted":
      return t("common.enabled");
    case "denied":
      return t("settings.notifications.turnedOff");
    case "default":
      return t("settings.notifications.notEnabled");
    case "unsupported":
      return t("common.unavailable");
    default:
      return t("settings.notifications.checking");
  }
}

function descriptionForPermissionStatus(
  status: DesktopNotificationPermissionStatus,
  t: Translate,
): string {
  switch (status) {
    case "granted":
      return "macOS will allow pi-gui to show desktop notifications for background thread updates.";
    case "denied":
      return "macOS notifications are turned off for pi-gui. Enable them in System Settings to receive background completion alerts.";
    case "default":
      return "pi-gui has not asked macOS for desktop notification access yet.";
    case "unsupported":
      return t("settings.notifications.unavailable");
    default:
      return "Checking whether macOS notifications are available for pi-gui.";
  }
}
