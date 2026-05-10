import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getCountsCopy(language: AppLanguage) {
  return appCopy[language].counts;
}

