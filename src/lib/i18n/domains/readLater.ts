import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getReadLaterCopy(language: AppLanguage) {
  return appCopy[language].readLater;
}

