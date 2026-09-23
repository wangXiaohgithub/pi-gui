import type { ThemeMode, ThemePresetId } from "../../../contracts/desktop-state";
import { SettingsGroup, SettingsRow } from "./settings-utils";
import { themePresets } from "./theme-presets";
import { useTranslation } from "react-i18next";

interface SettingsAppearanceSectionProps {
  readonly themeMode: ThemeMode;
  readonly themePresetId: ThemePresetId;
  readonly onSetThemeMode: (mode: ThemeMode) => void;
  readonly onSetThemePresetId: (presetId: ThemePresetId) => void;
  readonly enableTransparency: boolean;
  readonly onSetEnableTransparency: (enabled: boolean) => void;
}

export function SettingsAppearanceSection({
  themeMode,
  themePresetId,
  onSetThemeMode,
  onSetThemePresetId,
  enableTransparency,
  onSetEnableTransparency,
}: SettingsAppearanceSectionProps) {
  const { t } = useTranslation();
  const themeOptions: { mode: ThemeMode; label: string; description: string }[] = [
    {
      mode: "system",
      label: t("settings.appearance.system"),
      description: t("settings.appearance.systemDescription"),
    },
    {
      mode: "light",
      label: t("settings.appearance.light"),
      description: t("settings.appearance.lightDescription"),
    },
    {
      mode: "dark",
      label: t("settings.appearance.dark"),
      description: t("settings.appearance.darkDescription"),
    },
  ];
  return (
    <>
      <SettingsGroup title={t("settings.appearance.themePreset")}>
        <div className="theme-preset-grid">
          {themePresets.map((preset) => (
            <label
              className={`theme-preset-card${themePresetId === preset.id ? " theme-preset-card--active" : ""}`}
              key={preset.id}
            >
              <input
                checked={themePresetId === preset.id}
                name="theme-preset"
                type="radio"
                onChange={() => onSetThemePresetId(preset.id)}
              />
              <span className="theme-preset-card__preview" aria-hidden="true">
                {preset.swatches.map((swatch) => (
                  <span
                    className="theme-preset-card__swatch"
                    key={swatch}
                    style={{ background: swatch }}
                  />
                ))}
              </span>
              <span className="theme-preset-card__body">
                <span className="theme-preset-card__title">{preset.name}</span>
                <span className="theme-preset-card__description">{preset.description}</span>
              </span>
            </label>
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup title={t("settings.appearance.theme")}>
        {themeOptions.map((option) => (
          <SettingsRow key={option.mode} title={option.label} description={option.description}>
            <input
              checked={themeMode === option.mode}
              name="theme"
              type="radio"
              onChange={() => onSetThemeMode(option.mode)}
            />
          </SettingsRow>
        ))}
      </SettingsGroup>

      <SettingsGroup title={t("settings.appearance.visuals")}>
        <SettingsRow
          title={t("settings.appearance.transparency")}
          description={t("settings.appearance.transparencyDescription")}
        >
          <input
            aria-label={t("settings.appearance.transparency")}
            type="checkbox"
            checked={enableTransparency}
            onChange={(event) => onSetEnableTransparency(event.currentTarget.checked)}
          />
        </SettingsRow>
      </SettingsGroup>
    </>
  );
}
