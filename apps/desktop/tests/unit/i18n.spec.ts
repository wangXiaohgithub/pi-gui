import { expect, test } from "@playwright/test";
import { resolveAppLanguage } from "../../contracts/locale";
import { i18n } from "../../src/i18n";
import { missingTranslationKeys } from "../../src/i18n/key-parity";
import { en } from "../../src/i18n/locales/en";
import { zhCN } from "../../src/i18n/locales/zh-CN";

for (const [locale, expected] of [
  ["zh-CN", "zh-CN"],
  ["zh-SG", "zh-CN"],
  ["zh-Hans", "zh-CN"],
  ["en-US", "en"],
  ["ja-JP", "en"],
  ["zh-TW", "en"],
  ["zh-HK", "en"],
  ["zh-Hant", "en"],
] as const) {
  test(`maps ${locale} to ${expected}`, () => {
    expect(resolveAppLanguage(locale)).toBe(expected);
  });
}

test("English and Simplified Chinese resources contain the same keys", () => {
  expect(missingTranslationKeys(en, zhCN)).toEqual([]);
  expect(missingTranslationKeys(zhCN, en)).toEqual([]);
});

test("language switching is immediate and missing Chinese values fall back to English", async () => {
  await i18n.changeLanguage("zh-CN");
  expect(i18n.t("navigation.settings")).toBe("设置");
  i18n.addResource("en", "translation", "test.fallbackOnly", "English fallback");
  expect(i18n.t("test.fallbackOnly")).toBe("English fallback");
  await i18n.changeLanguage("en");
  expect(i18n.t("navigation.settings")).toBe("Settings");
});
