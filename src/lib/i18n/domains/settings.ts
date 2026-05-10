import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getSettingsCopy(language: AppLanguage) {
  return appCopy[language].settings;
}

