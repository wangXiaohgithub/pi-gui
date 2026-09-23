import { missingTranslationKeys } from "../src/i18n/key-parity";
import { en } from "../src/i18n/locales/en";
import { zhCN } from "../src/i18n/locales/zh-CN";

const missingChineseKeys = missingTranslationKeys(en, zhCN);
const extraChineseKeys = missingTranslationKeys(zhCN, en);

if (missingChineseKeys.length > 0 || extraChineseKeys.length > 0) {
  if (missingChineseKeys.length > 0) {
    console.error("Missing zh-CN keys:");
    for (const key of missingChineseKeys) console.error(key);
  }
  if (extraChineseKeys.length > 0) {
    console.error("Keys only present in zh-CN:");
    for (const key of extraChineseKeys) console.error(key);
  }
  process.exitCode = 1;
} else {
  console.log("i18n key parity: PASS");
}
