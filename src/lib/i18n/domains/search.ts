import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getSearchCopy(language: AppLanguage) {
  return appCopy[language].search;
}

