import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getNewsCopy(language: AppLanguage) {
  return appCopy[language].news;
}

