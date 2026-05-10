import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getNoticesCopy(language: AppLanguage) {
  return appCopy[language].notices;
}

