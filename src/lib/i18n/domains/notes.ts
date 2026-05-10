import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getNotesCopy(language: AppLanguage) {
  return appCopy[language].notes;
}

