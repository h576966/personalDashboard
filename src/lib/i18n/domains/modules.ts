import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getModulesCopy(language: AppLanguage) {
  return appCopy[language].modules;
}

