import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getAuthCopy(language: AppLanguage) {
  return appCopy[language].auth;
}

