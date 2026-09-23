export const appLanguages = ["en", "zh-CN"] as const;

export type AppLanguage = (typeof appLanguages)[number];

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === "string" && appLanguages.includes(value as AppLanguage);
}

export function resolveAppLanguage(locale: string): AppLanguage {
  const normalized = locale.trim().replaceAll("_", "-").toLowerCase();
  if (!normalized.startsWith("zh")) {
    return "en";
  }

  const subtags = normalized.split("-").slice(1);
  if (subtags.includes("hant") || subtags.includes("tw") || subtags.includes("hk")) {
    return "en";
  }
  if (
    subtags.length === 0 ||
    subtags.includes("hans") ||
    subtags.includes("cn") ||
    subtags.includes("sg") ||
    subtags.includes("my")
  ) {
    return "zh-CN";
  }
  return "en";
}
