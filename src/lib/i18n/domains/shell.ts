import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getShellCopy(language: AppLanguage) {
  return appCopy[language].shell;
}

