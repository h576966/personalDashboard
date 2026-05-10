import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getListsCopy(language: AppLanguage) {
  return appCopy[language].lists;
}

