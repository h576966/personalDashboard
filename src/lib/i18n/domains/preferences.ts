import { appCopy, type AppLanguage } from "@/lib/i18nData";

export function getPreferencesCopy(language: AppLanguage) {
  return appCopy[language].preferences;
}

