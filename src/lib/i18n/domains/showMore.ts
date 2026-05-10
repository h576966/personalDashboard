import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getShowMoreCopy(language: AppLanguage) {
  return appCopy[language].showMore;
}

