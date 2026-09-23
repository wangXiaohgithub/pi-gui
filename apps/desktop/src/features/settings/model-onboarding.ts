import type { RuntimeSnapshot } from "@pi-gui/session-driver/runtime-types";
import type { TFunction } from "i18next";
import { buildModelOptions } from "../conversation/composer-commands";

export type ModelOnboardingSettingsSection = "models" | "providers";

export interface ModelOnboardingNotice {
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly actionSection: ModelOnboardingSettingsSection;
}

export interface ModelOnboardingState {
  readonly hasSelectableModels: boolean;
  readonly requiresModelSelection: boolean;
  readonly unselectedModelLabel: string;
  readonly emptyModelTitle: string;
  readonly emptyModelDescription: string;
  readonly notice?: ModelOnboardingNotice;
}

interface ModelSelectionInput {
  readonly provider: string | undefined;
  readonly modelId: string | undefined;
}

export function deriveModelOnboardingState(
  runtime: RuntimeSnapshot | undefined,
  currentSelection: ModelSelectionInput,
  t: TFunction,
): ModelOnboardingState {
  const selectableModels = buildModelOptions(runtime);
  const selectableSet = new Set(
    selectableModels.map((model) => `${model.providerId}:${model.modelId}`),
  );
  const hasSelectableModels = selectableModels.length > 0;
  const connectedProviderCount =
    runtime?.providers.filter((provider) => provider.hasAuth).length ?? 0;
  const settingsDefault = {
    provider: runtime?.settings.defaultProvider,
    modelId: runtime?.settings.defaultModelId,
  };
  const hasDefaultModel = Boolean(settingsDefault.provider && settingsDefault.modelId);
  const defaultModelUsable = isUsableSelection(settingsDefault, selectableSet);
  const hasCurrentSelection = Boolean(currentSelection.provider && currentSelection.modelId);
  const currentSelectionUsable = isUsableSelection(currentSelection, selectableSet);

  if (!hasSelectableModels) {
    return {
      hasSelectableModels: false,
      requiresModelSelection: true,
      unselectedModelLabel: t("settings.modelOnboarding.noModels"),
      emptyModelTitle: t("settings.modelOnboarding.noModels"),
      emptyModelDescription:
        connectedProviderCount > 0
          ? t("settings.modelOnboarding.enableModels")
          : t("settings.modelOnboarding.providerRequiredShort"),
      notice:
        connectedProviderCount > 0
          ? {
              title: t("settings.modelOnboarding.noModels"),
              description: t("settings.modelOnboarding.modelsDisabled"),
              actionLabel: t("settings.modelOnboarding.openModels"),
              actionSection: "models",
            }
          : {
              title: t("settings.modelOnboarding.noModels"),
              description: t("settings.modelOnboarding.providerRequired"),
              actionLabel: t("settings.modelOnboarding.openProviders"),
              actionSection: "providers",
            },
    };
  }

  if (hasCurrentSelection && !currentSelectionUsable) {
    return {
      hasSelectableModels: true,
      requiresModelSelection: true,
      unselectedModelLabel: t("settings.modelOnboarding.pickModel"),
      emptyModelTitle: t("settings.modelOnboarding.noModels"),
      emptyModelDescription: t("settings.modelOnboarding.pickModel"),
      notice: {
        title: t("settings.modelOnboarding.selectedUnavailable"),
        description: hasDefaultModel
          ? t("settings.modelOnboarding.selectedUnavailableWithDefault")
          : t("settings.modelOnboarding.selectedUnavailableDescription"),
        actionLabel: t("settings.modelOnboarding.openModels"),
        actionSection: "models",
      },
    };
  }

  if (!hasDefaultModel) {
    return {
      hasSelectableModels: true,
      requiresModelSelection: !currentSelectionUsable,
      unselectedModelLabel: t("settings.modelOnboarding.pickModel"),
      emptyModelTitle: t("settings.modelOnboarding.noDefault"),
      emptyModelDescription: t("settings.modelOnboarding.pickModel"),
      notice: currentSelectionUsable
        ? undefined
        : {
            title: t("settings.modelOnboarding.noDefault"),
            description: t("settings.modelOnboarding.setDefault"),
            actionLabel: t("settings.modelOnboarding.openModels"),
            actionSection: "models",
          },
    };
  }

  if (!defaultModelUsable) {
    const defaultLabel = `${settingsDefault.provider}:${settingsDefault.modelId}`;
    return {
      hasSelectableModels: true,
      requiresModelSelection: !currentSelectionUsable,
      unselectedModelLabel: t("settings.modelOnboarding.pickModel"),
      emptyModelTitle: t("settings.modelOnboarding.defaultUnavailable"),
      emptyModelDescription: t("settings.modelOnboarding.pickModel"),
      notice: {
        title: t("settings.modelOnboarding.defaultUnavailable"),
        description: currentSelectionUsable
          ? t("settings.modelOnboarding.defaultUnavailableDescription", { model: defaultLabel })
          : t("settings.modelOnboarding.defaultUnavailableSelectDescription", {
              model: defaultLabel,
            }),
        actionLabel: t("settings.modelOnboarding.openModels"),
        actionSection: "models",
      },
    };
  }

  return {
    hasSelectableModels: true,
    requiresModelSelection: false,
    unselectedModelLabel: t("settings.modelOnboarding.pickModel"),
    emptyModelTitle: t("settings.modelOnboarding.noModels"),
    emptyModelDescription: t("settings.modelOnboarding.pickModel"),
  };
}

function isUsableSelection(
  selection: ModelSelectionInput,
  selectableSet: ReadonlySet<string>,
): boolean {
  return Boolean(
    selection.provider &&
    selection.modelId &&
    selectableSet.has(`${selection.provider}:${selection.modelId}`),
  );
}
