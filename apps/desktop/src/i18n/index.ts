import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resolveAppLanguage } from "./locale";
import { en } from "./locales/en";
import { zhCN } from "./locales/zh-CN";

const initialLanguage = resolveAppLanguage(globalThis.navigator?.language ?? "en");

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      "zh-CN": { translation: zhCN },
    },
    lng: initialLanguage,
    fallbackLng: "en",
    supportedLngs: ["en", "zh-CN"],
    load: "currentOnly",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    returnNull: false,
  })
  .catch((error: unknown) => {
    console.error("[i18n] initialization failed", error);
  });

export { i18n };
export { en, zhCN };
