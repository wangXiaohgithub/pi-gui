export function flattenTranslationKeys(
  value: Readonly<Record<string, unknown>>,
  prefix = "",
): string[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      return flattenTranslationKeys(entry as Readonly<Record<string, unknown>>, path);
    }
    return [path];
  });
}

export function missingTranslationKeys(
  source: Readonly<Record<string, unknown>>,
  target: Readonly<Record<string, unknown>>,
): string[] {
  const targetKeys = new Set(flattenTranslationKeys(target));
  return flattenTranslationKeys(source).filter((key) => !targetKeys.has(key));
}
