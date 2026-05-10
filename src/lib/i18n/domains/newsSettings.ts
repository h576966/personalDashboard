import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getNewsSettingsCopy(language: AppLanguage) {
  return appCopy[language].newsSettings;
}

